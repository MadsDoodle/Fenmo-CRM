import { useState, useCallback } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CSVData {
  headers: string[];
  rows: any[][];
  fileName: string;
}

interface CSVDropZoneProps {
  onCSVParsed: (data: CSVData) => void;
  className?: string;
}

export function CSVDropZone({ onCSVParsed, className }: CSVDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [fileName, setFileName] = useState<string>("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateCSV = (file: File): boolean => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', '.csv'];
    const isValidType = validTypes.some(type => 
      file.type === type || file.name.toLowerCase().endsWith('.csv')
    );
    return isValidType && file.size <= 10 * 1024 * 1024; // 10MB limit
  };

  const parseCSV = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          setUploadStatus("error");
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );

        // Simulate progress
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              setUploadStatus("success");
              
              onCSVParsed({
                headers,
                rows,
                fileName: file.name
              });
              
              setTimeout(() => {
                setUploadStatus("idle");
                setUploadProgress(0);
                setFileName("");
              }, 2000);
              return 100;
            }
            return prev + Math.random() * 20;
          });
        }, 100);
        
      } catch (error) {
        console.error('CSV parsing error:', error);
        setUploadStatus("error");
        setIsUploading(false);
      }
    };
    
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => validateCSV(file));
    
    if (csvFile) {
      parseCSV(csvFile);
    } else {
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 3000);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateCSV(file)) {
      parseCSV(file);
    } else {
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 3000);
    }
    e.target.value = "";
  }, []);

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "success":
        return <CheckCircle className="w-8 h-8 text-success" />;
      case "error":
        return <AlertCircle className="w-8 h-8 text-destructive" />;
      default:
        return <Upload className="w-8 h-8 text-primary" />;
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case "success":
        return "File uploaded successfully!";
      case "error":
        return "Please upload a valid CSV file (max 10MB)";
      default:
        return "Drop your CSV file here or click to browse";
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      isDragOver && "border-primary/60 bg-primary/5 shadow-glow",
      uploadStatus === "success" && "border-success/60 bg-success/5",
      uploadStatus === "error" && "border-destructive/60 bg-destructive/5",
      "bg-gradient-card border-border/40 hover:border-primary/40",
      className
    )}>
      <CardContent 
        className="p-8"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          {/* Status Icon */}
          <div className={cn(
            "transition-all duration-300",
            isDragOver && "scale-110 animate-pulse",
            uploadStatus === "success" && "animate-pulse-glow"
          )}>
            {getStatusIcon()}
          </div>

          {/* Upload Text */}
          <div className="space-y-2">
            <h3 className={cn(
              "text-lg font-semibold transition-colors",
              uploadStatus === "success" && "text-success",
              uploadStatus === "error" && "text-destructive"
            )}>
              {isUploading ? "Uploading..." : "Upload CSV File"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {getStatusMessage()}
            </p>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="w-full max-w-md space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fileName}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
            </div>
          )}

          {/* Browse Button */}
          {!isUploading && uploadStatus !== "success" && (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="relative border-primary/40 hover:bg-primary/10 hover:border-primary/60"
                onClick={() => document.getElementById('csv-upload')?.click()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {/* Success Actions */}
          {uploadStatus === "success" && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setUploadStatus("idle");
                  setFileName("");
                }}
              >
                Upload Another
              </Button>
            </div>
          )}
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={cn(
            "absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-xl transition-all duration-1000",
            isDragOver && "scale-150 bg-primary/10"
          )} />
          <div className={cn(
            "absolute bottom-1/4 right-1/4 w-24 h-24 bg-primary/3 rounded-full blur-xl transition-all duration-1000 delay-200",
            isDragOver && "scale-150 bg-primary/8"
          )} />
        </div>
      </CardContent>
    </Card>
  );
}