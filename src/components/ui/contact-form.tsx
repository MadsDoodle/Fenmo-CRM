import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getStatusOptionsForChannel, ChannelType, LEAD_STAGE_OPTIONS } from "@/lib/status-config";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  linkedin_url: string | null;
  website: string | null;
  title: string | null;
  location: string | null;
  industry: string | null;
  emp_count: string | null;
  channel: string | null;
  lead_stage: string | null;
  outreach_status: string | null;
  last_action_date: string | null;
  next_action_date: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
  onSuccess: () => void;
}

const channelOptions = [
  { value: 'email', label: 'Email' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'phone', label: 'Phone' },
  { value: 'clay', label: 'Clay' },
  { value: 'other', label: 'Other' }
];

// Lead stage options are now imported from status-config

// Remove static outreach status options - will be dynamic based on channel

export function ContactForm({ isOpen, onClose, contact, onSuccess }: ContactFormProps) {
  const [formData, setFormData] = useState<Contact>({
    id: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    linkedin_url: '',
    website: '',
    title: '',
    location: '',
    industry: '',
    emp_count: '',
    channel: null,
    lead_stage: null,
    outreach_status: null,
    last_action_date: '',
    next_action_date: '',
    created_at: '',
    updated_at: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!contact?.id;

  useEffect(() => {
    if (contact) {
              setFormData({
          id: contact.id,
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          linkedin_url: contact.linkedin_url || '',
          website: contact.website || '',
          title: contact.title || '',
          location: contact.location || '',
          industry: contact.industry || '',
          emp_count: contact.emp_count || '',
          channel: contact.channel || null,
          lead_stage: contact.lead_stage || null,
          outreach_status: contact.outreach_status || null,
          last_action_date: contact.last_action_date || '',
          next_action_date: contact.next_action_date || '',
          created_at: contact.created_at || '',
          updated_at: contact.updated_at || ''
        });
    } else {
      // Reset form for new contact
              setFormData({
          id: '',
          name: '',
          email: '',
          phone: '',
          company: '',
          linkedin_url: '',
          website: '',
          title: '',
          location: '',
          industry: '',
          emp_count: '',
          channel: null,
          lead_stage: null,
          outreach_status: null,
          last_action_date: '',
          next_action_date: '',
          created_at: '',
          updated_at: ''
        });
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        // Update existing contact
        const { error } = await supabase
          .from('master')
          .update({
            name: formData.name.trim(),
            email: formData.email?.trim() || null,
            phone: formData.phone?.trim() || null,
            company: formData.company?.trim() || null,
            linkedin_url: formData.linkedin_url?.trim() || null,
            website: formData.website?.trim() || null,
            title: formData.title?.trim() || null,
            location: formData.location?.trim() || null,
            industry: (formData.industry?.trim() || null) as any,
            emp_count: (formData.emp_count?.trim() || null) as any,
            channel: formData.channel as any,
            lead_stage: formData.lead_stage as any,
            outreach_status: formData.outreach_status as any,
            last_action_date: formData.last_action_date?.trim() || null,
            next_action_date: formData.next_action_date?.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact!.id);

        if (error) throw error;

        toast({
          title: "Contact Updated",
          description: "Contact has been successfully updated",
        });
      } else {
        // Create new contact
        const dedupeKey = formData.linkedin_url?.trim() || formData.email?.trim() || `${formData.name.trim()}-${Date.now()}`;
        const { error } = await supabase
          .from('master')
          .insert({
            dedupe_key: dedupeKey,
            name: formData.name.trim(),
            email: formData.email?.trim() || null,
            phone: formData.phone?.trim() || null,
            company: formData.company?.trim() || null,
            linkedin_url: formData.linkedin_url?.trim() || null,
            website: formData.website?.trim() || null,
            title: formData.title?.trim() || null,
            location: formData.location?.trim() || null,
            industry: (formData.industry?.trim() || null) as any,
            emp_count: (formData.emp_count?.trim() || null) as any,
            channel: formData.channel as any,
            lead_stage: formData.lead_stage as any,
            outreach_status: formData.outreach_status as any,
            last_action_date: formData.last_action_date?.trim() || null,
            next_action_date: formData.next_action_date?.trim() || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        toast({
          title: "Contact Added",
          description: "New contact has been successfully added",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: isEditing ? "Failed to update contact" : "Failed to add contact",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Contact, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Reset dependent fields when channel changes
      if (field === 'channel') {
        newData.outreach_status = null;
        newData.lead_stage = null;
      }
      
      // Reset lead stage when outreach status changes
      if (field === 'outreach_status') {
        newData.lead_stage = null;
      }
      
      return newData;
    });
  };

  // Get available status options based on selected channel
  const getAvailableStatusOptions = () => {
    if (!formData.channel) return [];
    return getStatusOptionsForChannel(formData.channel as ChannelType);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name - Required */}
            <div className="md:col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            {/* Company */}
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company || ''}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter job title"
              />
            </div>

            {/* LinkedIn URL */}
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url || ''}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                placeholder="Enter LinkedIn profile URL"
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="Enter company website"
              />
            </div>

            {/* Industry */}
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry || ''}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="Enter industry"
              />
            </div>

            {/* Employee Count */}
            <div>
              <Label htmlFor="emp_count">Employee Count</Label>
              <Input
                id="emp_count"
                value={formData.emp_count || ''}
                onChange={(e) => handleInputChange('emp_count', e.target.value)}
                placeholder="e.g., 1-10, 11-50, 100+"
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location"
              />
            </div>

            {/* Channel */}
            <div>
              <Label htmlFor="channel">Channel</Label>
              <Select value={formData.channel || ''} onValueChange={(value) => handleInputChange('channel', value)}>
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

            {/* Outreach Status - Only show if channel is selected */}
            {formData.channel && (
              <div>
                <Label htmlFor="outreach_status">Outreach Status</Label>
                <Select value={formData.outreach_status || ''} onValueChange={(value) => handleInputChange('outreach_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outreach status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStatusOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Lead Stage - Only show if both channel and status are selected */}
            {formData.channel && formData.outreach_status && (
              <div>
                <Label htmlFor="lead_stage">Lead Stage</Label>
                <Select value={formData.lead_stage || ''} onValueChange={(value) => handleInputChange('lead_stage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}


            {/* Last Action Date */}
            <div>
              <Label htmlFor="last_action_date">Last Action Date</Label>
              <Input
                id="last_action_date"
                type="date"
                value={formData.last_action_date || ''}
                onChange={(e) => handleInputChange('last_action_date', e.target.value)}
              />
            </div>

            {/* Next Action Date */}
            <div>
              <Label htmlFor="next_action_date">Next Action Date</Label>
              <Input
                id="next_action_date"
                type="date"
                value={formData.next_action_date || ''}
                onChange={(e) => handleInputChange('next_action_date', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Contact' : 'Add Contact')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
