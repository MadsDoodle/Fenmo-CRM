import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Palette, 
  Plug, 
  Zap, 
  Database, 
  Key, 
  Trash2,
  Save,
  Upload,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Globe,
  Clock,
  Mail,
  Phone,
  Shield,
  Monitor,
  Sun,
  Moon,
  Settings as SettingsIcon,
  MessageSquare,
  Users,
  FileText,
  Target,
  AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OutreachStatus } from '@/lib/status-config';

interface Template {
  id: string;
  name: string;
  subject: string | null;
  content: string;
  channel: string;
  status: OutreachStatus;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('outreach');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Load templates from database
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const { data: templatesData, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates((templatesData || []).map((t: any) => ({
        ...t,
        status: t.status as OutreachStatus
      })));
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  };
  
  // Profile & Account Settings State
  const [profile, setProfile] = useState({
    name: 'Madhav S Baidya',
    email: 'madhavbaidyaiitbhu@gmail.com',
    phone: '6900541047',
    company: 'Fenmo',
    timezone: 'America/New_York',
    language: 'en'
  });
  
  // Outreach Settings State
  const [outreachSettings, setOutreachSettings] = useState({
    followUpDelay: 3,
    maxFollowUps: 5,
    autoAssign: true,
    leadScoring: true,
    defaultTemplate: 'welcome',
    workingHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'America/New_York'
    }
  });
  
  // Integrations State
  const [integrations, setIntegrations] = useState({
    email: { connected: false, provider: 'gmail', settings: {} },
    whatsapp: { connected: false, apiKey: '' },
    linkedin: { connected: false, token: '' },
    slack: { connected: true, webhook: '' },
    zapier: { connected: false, apiKey: '' }
  });
  
  // Message Templates State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  
  // To this:
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    channel: string;
    content: string;
    subject: string;
    status: OutreachStatus;
  }>({ name: '', channel: 'email', content: '', subject: '', status: 'not_contacted' });
  const clearAllData = async () => {
    if (!confirm('⚠️ DANGER: This will permanently delete ALL data from your database including contacts, tasks, messages, and activities. This action cannot be undone. Are you absolutely sure?')) {
      return;
    }
    
    if (!confirm('This is your final warning. All data will be lost forever. Type YES in the next dialog to confirm.')) {
      return;
    }
    
    const confirmation = prompt('Type "DELETE ALL DATA" to confirm:');
    if (confirmation !== 'DELETE ALL DATA') {
      toast({
        title: "Operation Cancelled",
        description: "Data deletion was cancelled.",
      });
      return;
    }
    
    try {
      // Delete all data from master and related tables
      await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('raw_upload').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('master').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast({
        title: "Database Cleared",
        description: "All data has been permanently deleted from the database.",
        variant: "destructive"
      });
      
      // Refresh the page to reset all states
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing database:', error);
      toast({
        title: "Error",
        description: "Failed to clear database. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportData = async (format = 'json') => {
    try {
      const { data: master } = await supabase.from('master').select('*');
      const { data: messages } = await supabase.from('messages').select('*');
      const { data: templates } = await supabase.from('message_templates').select('*');
      const { data: tasks } = await supabase.from('tasks').select('*');
      
      const exportData = {
        contacts: master || [],
        messages: messages || [],
        templates: templates || [],
        tasks: tasks || [],
        exportDate: new Date().toISOString(),
        totalRecords: {
          contacts: master?.length || 0,
          messages: messages?.length || 0,
          templates: templates?.length || 0,
          tasks: tasks?.length || 0
        }
      };
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fenmo-crm-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Export contacts as CSV
        const contacts = master || [];
        if (contacts.length > 0) {
          const headers = Object.keys(contacts[0]).join(',');
          const csvContent = [headers, ...contacts.map(contact => 
            Object.values(contact).map(value => 
              `"${String(value || '').replace(/"/g, '""')}"`
            ).join(',')
          )].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `fenmo-contacts-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      
      toast({
        title: "Export Successful",
        description: `Your data has been exported successfully as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addTemplate = async () => {
    if (newTemplate.name && newTemplate.content) {
      try {
        let validStatus: string;
        if (newTemplate.status === 'not_contacted') validStatus = 'not_yet';
        else if (['closed_won', 'closed_lost', 'qualified', 'proposal_sent', 'meeting_scheduled', 'demo_completed', 'negotiation'].includes(newTemplate.status)) validStatus = 'closed';
        else validStatus = newTemplate.status;
        const { data, error } = await supabase
          .from('message_templates')
          .insert({
            name: newTemplate.name,
            subject: newTemplate.subject || null,
            content: newTemplate.content,
            channel: newTemplate.channel,
            status: validStatus as any,
            is_active: true,
            usage_count: 0
          })
          .select();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        setNewTemplate({ name: '', channel: 'email', content: '', subject: '', status: 'not_contacted' });
        loadTemplates(); // Reload templates
        toast({
          title: "Template Added",
          description: "Message template has been added successfully.",
        });
      } catch (error) {
        console.error('Error adding template:', error);
        toast({
          title: "Error",
          description: "Failed to add template. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      loadTemplates(); // Reload templates
      toast({
        title: "Template Deleted",
        description: "Message template has been deactivated.",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleTemplate = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      loadTemplates(); // Reload templates
      toast({
        title: "Template Updated",
        description: `Template has been ${!currentStatus ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveProfile = async () => {
    try {
      // Save to localStorage for now (could be enhanced to save to database)
      localStorage.setItem('userProfile', JSON.stringify(profile));
      
      toast({
        title: "Profile Saved",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Load profile from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
      } catch (error) {
        console.error('Error loading saved profile:', error);
      }
    }
  }, []);

  const tabs = [
    { id: 'outreach', label: 'Outreach Settings', icon: Target },
    { id: 'profile', label: 'Profile & Account', icon: User },
    { id: 'templates', label: 'Message Templates', icon: MessageSquare },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ];

  const renderOutreachSettings = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Outreach Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="followUpDelay">Follow-up Delay (days)</Label>
              <Input
                id="followUpDelay"
                type="number"
                value={outreachSettings.followUpDelay}
                onChange={(e) => setOutreachSettings(prev => ({ ...prev, followUpDelay: parseInt(e.target.value) }))}
                className="border-border/40 bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="maxFollowUps">Maximum Follow-ups</Label>
              <Input
                id="maxFollowUps"
                type="number"
                value={outreachSettings.maxFollowUps}
                onChange={(e) => setOutreachSettings(prev => ({ ...prev, maxFollowUps: parseInt(e.target.value) }))}
                className="border-border/40 bg-background/50"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoAssign">Auto-assign Tasks</Label>
              <p className="text-sm text-muted-foreground">Automatically assign tasks to team members</p>
            </div>
            <Switch
              id="autoAssign"
              checked={outreachSettings.autoAssign}
              onCheckedChange={(checked) => setOutreachSettings(prev => ({ ...prev, autoAssign: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="leadScoring">Lead Scoring</Label>
              <p className="text-sm text-muted-foreground">Enable automatic lead scoring based on engagement</p>
            </div>
            <Switch
              id="leadScoring"
              checked={outreachSettings.leadScoring}
              onCheckedChange={(checked) => setOutreachSettings(prev => ({ ...prev, leadScoring: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={outreachSettings.workingHours.start}
                onChange={(e) => setOutreachSettings(prev => ({
                  ...prev,
                  workingHours: { ...prev.workingHours, start: e.target.value }
                }))}
                className="border-border/40 bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={outreachSettings.workingHours.end}
                onChange={(e) => setOutreachSettings(prev => ({
                  ...prev,
                  workingHours: { ...prev.workingHours, end: e.target.value }
                }))}
                className="border-border/40 bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={outreachSettings.workingHours.timezone}
                onValueChange={(value) => setOutreachSettings(prev => ({
                  ...prev,
                  workingHours: { ...prev.workingHours, timezone: value }
                }))}
              >
                <SelectTrigger className="border-border/40 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                className="border-border/40 bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                className="border-border/40 bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="border-border/40 bg-background/50"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={profile.company}
                onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                className="border-border/40 bg-background/50"
              />
            </div>
          </div>
          
          <Button onClick={saveProfile} className="bg-gradient-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderTemplateSettings = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Message Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingTemplates ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Templates Found</h3>
              <p className="text-muted-foreground">Create your first message template below.</p>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="p-4 border border-border/40 rounded-lg bg-background/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">{template.name}</h4>
                    <Badge variant={template.channel === 'email' ? 'default' : 'secondary'}>
                      {template.channel}
                    </Badge>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.usage_count || 0} uses
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleTemplate(template.id, template.is_active)}
                      className="border-border/40"
                    >
                      {template.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {template.subject && (
                  <p className="text-sm font-medium text-foreground mb-1">Subject: {template.subject}</p>
                )}
                <p className="text-sm text-muted-foreground">{template.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Status: {template.status?.replace('_', ' ').toUpperCase() || 'CONTACTED'}
                </p>
              </div>
            ))
          )}
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Add New Template</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Email"
                  className="border-border/40 bg-background/50"
                />
              </div>
              <div>
                <Label htmlFor="templateChannel">Channel</Label>
                <Select
                  value={newTemplate.channel}
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, channel: value }))}
                >
                  <SelectTrigger className="border-border/40 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="clay">Clay</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateSubject">Subject (Optional)</Label>
                <Input
                  id="templateSubject"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject line..."
                  className="border-border/40 bg-background/50"
                />
              </div>
              <div>
                <Label htmlFor="templateStatus">Outreach Stage</Label>
                <Select
                  value={newTemplate.status}
                  onValueChange={(value) => setNewTemplate(prev => ({ 
                    ...prev, 
                    status: value === 'not_yet' ? 'not_contacted' : value as OutreachStatus
                  }))}
                >
                  <SelectTrigger className="border-border/40 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_yet">Not Yet Contacted</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                    <SelectItem value="closed">Closed Won</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="templateContent">Template Content</Label>
              <Textarea
                id="templateContent"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your message template... Use {{name}}, {{company}} for personalization"
                className="border-border/40 bg-background/50 min-h-[100px]"
              />
            </div>
            <Button 
              onClick={addTemplate} 
              disabled={!newTemplate.name || !newTemplate.content}
              className="bg-gradient-primary hover:bg-primary/90"
            >
              Add Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-5 h-5 text-primary" />
            Connected Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(integrations).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 border border-border/40 rounded-lg bg-background/30">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${value.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div>
                  <span className="font-medium capitalize text-foreground">{key}</span>
                  <p className="text-xs text-muted-foreground">
                    {value.connected ? 'Connected and active' : 'Not connected'}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={value.connected ? "destructive" : "default"}
                className={value.connected ? "" : "bg-gradient-primary hover:bg-primary/90"}
              >
                {value.connected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderDataManagement = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Data Export & Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-border/40 rounded-lg bg-background/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-foreground">Complete Backup (JSON)</h4>
                  <p className="text-sm text-muted-foreground">Full database export with all tables</p>
                </div>
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <Button 
                onClick={() => exportData('json')} 
                className="w-full bg-gradient-primary hover:bg-primary/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
            
            <div className="p-4 border border-border/40 rounded-lg bg-background/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-foreground">Contacts Export (CSV)</h4>
                  <p className="text-sm text-muted-foreground">Contacts data for spreadsheet import</p>
                </div>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <Button 
                onClick={() => exportData('csv')} 
                variant="outline"
                className="w-full border-border/40"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          
          <div className="p-4 border border-border/40 rounded-lg bg-accent/10">
            <h4 className="font-medium text-foreground mb-2">Export Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Contacts</p>
                <p className="font-medium">Auto-detected</p>
              </div>
              <div>
                <p className="text-muted-foreground">Messages</p>
                <p className="font-medium">Auto-detected</p>
              </div>
              <div>
                <p className="text-muted-foreground">Templates</p>
                <p className="font-medium">Auto-detected</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tasks</p>
                <p className="font-medium">Auto-detected</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDangerZone = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-destructive/40 rounded-lg bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-destructive">Clear All Database</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all contacts, tasks, messages, and activities. This action cannot be undone.
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={clearAllData}
                className="ml-4"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Database
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'outreach': return renderOutreachSettings();
      case 'profile': return renderProfileSettings();
      case 'templates': return renderTemplateSettings();
      case 'integrations': return renderIntegrations();
      case 'data': return renderDataManagement();
      case 'danger': return renderDangerZone();
      default: return renderOutreachSettings();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your outreach workflow and system preferences.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Card className="bg-gradient-card border-border/40">
        <CardContent className="p-0">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}