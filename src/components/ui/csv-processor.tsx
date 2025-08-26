import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, EyeOff, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CSVData {
  headers: string[];
  rows: any[][];
  fileName: string;
}

interface CSVProcessorProps {
  csvData: CSVData | null;
  onRemoveFile: () => void;
  onDataProcessed: () => void;
}

export function CSVProcessor({ csvData, onRemoveFile, onDataProcessed }: CSVProcessorProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const detectColumn = (headers: string[], patterns: string[]) => {
    return headers.findIndex(header => 
      patterns.some(pattern => 
        header.toLowerCase().includes(pattern.toLowerCase())
      )
    );
  };

  const processData = useCallback(async () => {
    if (!csvData) return;

    setIsProcessing(true);
    
    try {
      // Smart column detection for mapping CSV to raw_upload table
      const linkedinIndex = detectColumn(csvData.headers, ['linkedin', 'linkedin_url', 'linkedin profile']);
      const emailIndex = detectColumn(csvData.headers, ['email', 'mail', 'e-mail']);
      const channelIndex = detectColumn(csvData.headers, ['channel', 'source', 'lead_source']);
      const companyIndex = detectColumn(csvData.headers, ['company', 'organization', 'org', 'business']);
      const nameIndex = detectColumn(csvData.headers, ['name', 'contact', 'full_name', 'person']);
      const phoneIndex = detectColumn(csvData.headers, ['phone', 'tel', 'mobile', 'number', 'telephone']);
      const websiteIndex = detectColumn(csvData.headers, ['website', 'web', 'url', 'site']);
      const industryIndex = detectColumn(csvData.headers, ['industry', 'sector', 'field']);
      const empCountIndex = detectColumn(csvData.headers, ['employees', 'emp_count', 'employee_count', 'size']);
      const titleIndex = detectColumn(csvData.headers, ['title', 'position', 'role', 'job_title']);
      const locationIndex = detectColumn(csvData.headers, ['location', 'city', 'address', 'region']);

      // Store exact CSV data in raw_upload table
      const rawUploads = csvData.rows.map(row => {
        const channelValue = channelIndex >= 0 ? row[channelIndex] : null;
        return {
          linkedin_url: linkedinIndex >= 0 ? row[linkedinIndex] || null : null,
          email: emailIndex >= 0 ? row[emailIndex] || null : null,
          channel: channelValue || 'email', // Store the actual channel value from CSV
          company: companyIndex >= 0 ? row[companyIndex] || null : null,
          name: nameIndex >= 0 ? row[nameIndex] || null : null,
          phone: phoneIndex >= 0 ? row[phoneIndex] || null : null,
          website: websiteIndex >= 0 ? row[websiteIndex] || null : null,
          industry: industryIndex >= 0 ? row[industryIndex] || null : null,
          emp_count: empCountIndex >= 0 ? row[empCountIndex] || null : null,
          title: titleIndex >= 0 ? row[titleIndex] || null : null,
          location: locationIndex >= 0 ? row[locationIndex] || null : null,
        };
      }).filter(row => row.name && (row.linkedin_url || row.email));

      if (rawUploads.length === 0) {
        toast({
          title: "No valid rows found",
          description: "Ensure your CSV has a Name and either LinkedIn URL or Email columns.",
          variant: "destructive"
        });
        return;
      }

      console.log('Processing CSV data with channels:', rawUploads.map(r => ({ name: r.name, channel: r.channel })));

      // Insert raw data into raw_upload table
      const { error: uploadError } = await supabase
        .from('raw_upload')
        .insert(rawUploads);

      if (uploadError) {
        console.error('raw_upload insert error:', uploadError);
        throw uploadError;
      }

      // Process raw data to master table using the database function
      const { error: processError } = await supabase.rpc('process_raw_upload_to_master');
      if (processError) {
        console.error('process_raw_upload_to_master error:', processError);
        throw processError;
      }

      // Backfill next_action for any records missing it
      try {
        const { data: missing } = await supabase
          .from('master')
          .select('id')
          .is('next_action', null)
          .limit(10000);

        if (missing && missing.length > 0) {
          for (const rec of missing) {
            const { data: nextTs, error: calcErr } = await (supabase as any).rpc('calculate_next_action', {
              p_contact_id: rec.id,
              p_custom_days: null,
            });
            if (!calcErr) {
              await supabase.from('master').update({ next_action: nextTs } as any).eq('id', rec.id);
            }
          }
        }
      } catch (backfillErr) {
        console.warn('next_action backfill warning:', backfillErr);
      }

      toast({
        title: "Data Uploaded Successfully",
        description: `${rawUploads.length} records uploaded and processed into Master Table with channel data.`,
      });

      onDataProcessed();
      onRemoveFile();

    } catch (error: any) {
      console.error('Error processing data:', error);
      toast({
        title: "Upload Error",
        description: error?.message || "Failed to upload CSV data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [csvData, toast, onDataProcessed, onRemoveFile]);

  if (!csvData) return null;

  return (
    <Card className="bg-gradient-card border-border/40 shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            CSV Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="border-border/40"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRemoveFile}
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>📄 {csvData.fileName}</span>
          <Badge variant="secondary">{csvData.rows.length} rows</Badge>
          <Badge variant="secondary">{csvData.headers.length} columns</Badge>
        </div>
      </CardHeader>

      {showPreview && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/40">
                  {csvData.headers.map((header, index) => (
                    <th key={index} className="text-left p-2 text-sm font-medium text-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.rows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border/20">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="p-2 text-sm text-muted-foreground">
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={processData}
              disabled={isProcessing}
              className="bg-gradient-primary hover:bg-primary/90"
            >
              <Database className="w-4 h-4 mr-2" />
              {isProcessing ? 'Uploading...' : 'Upload to Database'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}