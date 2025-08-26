import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id?: string;
  name: string;
  subject: string | null;
  content: string;
  channel: string;
  status: string;
  usage_count?: number;
  is_active?: boolean;
}

interface TemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  template?: Template | null;
  onSuccess: () => void;
}

const channelOptions = [
  { value: 'email', label: 'Email' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' }
];

const statusOptions = [
  { value: 'contacted', label: 'Contacted' },
  { value: 'not_yet', label: 'Not Yet' },
  { value: 'replied', label: 'Replied' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'closed', label: 'Closed' },
  { value: 'follow_up', label: 'Follow Up' }
];

export function TemplateForm({ isOpen, onClose, template, onSuccess }: TemplateFormProps) {
  const [formData, setFormData] = useState<Template>({
    name: '',
    subject: '',
    content: '',
    channel: 'email',
    status: 'contacted'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!template?.id;

  useEffect(() => {
    if (template) {
      setFormData({
        id: template.id,
        name: template.name || '',
        subject: template.subject || '',
        content: template.content || '',
        channel: template.channel || 'email',
        status: template.status || 'contacted'
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        content: '',
        channel: 'email',
        status: 'contacted'
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and content are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('message_templates')
          .update({
            name: formData.name.trim(),
            subject: formData.subject?.trim() || null,
            content: formData.content.trim(),
            channel: formData.channel,
            status: formData.status as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', template!.id);

        if (error) throw error;

        toast({
          title: "Template Updated",
          description: "Template has been successfully updated",
        });
      } else {
        const { error } = await supabase
          .from('message_templates')
          .insert({
            name: formData.name.trim(),
            subject: formData.subject?.trim() || null,
            content: formData.content.trim(),
            channel: formData.channel,
            status: formData.status as any,
            usage_count: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        toast({
          title: "Template Created",
          description: "New template has been successfully created",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: isEditing ? "Failed to update template" : "Failed to create template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Template, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter template name"
                required
              />
            </div>

            <div>
              <Label htmlFor="channel">Channel</Label>
              <Select value={formData.channel} onValueChange={(value) => handleInputChange('channel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Outreach Stage</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.channel === 'email' && (
              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={formData.subject || ''}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="content">Message Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter your message template... Use {{name}}, {{company}}, {{industry}} for personalization"
              rows={8}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available variables: {`{{name}}, {{company}}, {{industry}}`}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Template' : 'Create Template')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}