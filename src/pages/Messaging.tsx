import { useState, useEffect } from "react";
import { Send, Users, MessageSquare, Copy, Edit, Trash2, Plus, Mail, Linkedin, Phone, MessageCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TemplateForm } from "@/components/ui/template-form";
import { MessageTable } from "@/components/ui/message-table";
import { OUTREACH_STATUS_OPTIONS, getStatusOptionsForChannel, updateContactStatus, type OutreachStatus, type ChannelType } from "@/lib/status-config";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  linkedin_url: string | null;
  channel: string;
  channel_from?: ChannelType | null;
  lead_stage: string;
  outreach_status: OutreachStatus;
}

interface Template {
  id: string;
  name: string;
  subject: string | null;
  content: string;
  channel: string;
  status: string;
  usage_count: number;
}

interface Message {
  id: string;
  contact_id: string;
  template_id: string | null;
  channel: string;
  subject: string | null;
  content: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  master?: { name: string };
}

// Move these two components outside the Messaging function
const RecipientSelector = ({
  filteredContacts,
  selectedContacts,
  handleContactSelect,
  searchTerm,
  setSearchTerm,
  channelConfig,
  getInitialsColor
}: any) => (
  <Card className="bg-gradient-card border-border/40 h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        Select Recipients ({selectedContacts.length} selected)
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-4 h-[calc(100vh-14rem)]">
      <Input
        placeholder="Search contacts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border-border/40"
      />
      <div className="flex-1 space-y-2 overflow-auto">
        {filteredContacts.map((contact: any) => (
          <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30">
            <Checkbox
              checked={selectedContacts.includes(contact.id)}
              onCheckedChange={(checked) => handleContactSelect(contact.id, checked as boolean)}
            />
            <Avatar className="w-8 h-8">
              <AvatarFallback className={`text-xs font-semibold ${getInitialsColor(contact.name)}`}>
                {contact.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{contact.name}</p>
              <p className="text-xs text-muted-foreground">{contact.company || contact.email}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className={channelConfig[contact.channel as keyof typeof channelConfig]?.color}>
                {getStatusOptionsForChannel(contact.channel_from).find(opt => opt.value === contact.outreach_status)?.label || contact.outreach_status.replace('_', ' ')}
              </Badge>
              {contact.channel_from && (
                <Badge variant="secondary" className="text-xs">
                  {contact.channel_from}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const MessageComposer = ({
  selectedChannel,
  setSelectedChannel,
  recipientInput,
  setRecipientInput,
  selectedStatus,
  setSelectedStatus,
  selectedTemplate,
  handleTemplateSelect,
  filteredTemplates,
  messageSubject,
  setMessageSubject,
  messageContent,
  setMessageContent,
  channelConfig,
  statusOptions,
  sendMessage,
  selectedContacts
}: any) => (
  <Card className="bg-gradient-card border-border/40">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Compose Message
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.entries(channelConfig).slice(0, 6).map(([key, config]) => {
          const IconComponent = (config as any).icon;
          
          return (
            <Button
              key={key}
              variant={selectedChannel === key ? "default" : "outline"}
              className={`h-14 flex flex-col gap-1 ${selectedChannel === key ? "bg-gradient-primary" : "border-border/40 hover:bg-accent/50"}`}
              onClick={() => setSelectedChannel(key)}
            >
              <div className="flex items-center gap-1">
                <IconComponent className="w-4 h-4" />
                <span className="text-xs font-medium">{(config as any).label}</span>
              </div>
              
            </Button>
          );
        })}
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">
          {selectedChannel === 'email' && 'Email Address'}
          {selectedChannel === 'linkedin' && 'LinkedIn ID'}  
          {selectedChannel === 'whatsapp' && 'WhatsApp Number'}
          {selectedChannel === 'sms' && 'Phone Number'}
          {selectedChannel === 'phone' && 'Phone Number'}
          {selectedChannel === 'in_person' && 'Meeting Location'}
          {selectedChannel === 'clay' && 'Clay Contact ID'}
          {selectedChannel === 'other' && 'Contact Information'}
        </label>
        <Input
          value={recipientInput}
          onChange={(e) => setRecipientInput(e.target.value)}
          placeholder={
            selectedChannel === 'email' ? 'Enter email address...' :
            selectedChannel === 'linkedin' ? 'Enter LinkedIn ID...' :
            selectedChannel === 'whatsapp' ? 'Enter WhatsApp number...' :
            selectedChannel === 'sms' ? 'Enter phone number...' :
            selectedChannel === 'phone' ? 'Enter phone number...' :
            selectedChannel === 'in_person' ? 'Enter meeting location...' :
            selectedChannel === 'clay' ? 'Enter Clay contact ID...' :
            'Enter contact information...'
          }
          className="border-border/40"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">Outreach Stage</label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="border-border/40">
            <SelectValue placeholder="Select outreach stage" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Template</label>
        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
          <SelectTrigger className="border-border/40">
            <SelectValue placeholder="Choose a template (optional)" />
          </SelectTrigger>
          <SelectContent>
            {filteredTemplates.map(template => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center gap-2">
                  <span>{template.name}</span>
                  <Badge variant="outline">{template.usage_count} uses</Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(selectedChannel === 'email' || selectedChannel === 'clay') && (
        <div>
          <label className="text-sm font-medium mb-2 block">Subject</label>
          <Input
            value={messageSubject}
            onChange={(e) => setMessageSubject(e.target.value)}
            placeholder="Enter subject line..."
            className="border-border/40"
          />
        </div>
      )}
      
      {(selectedChannel === 'phone' || selectedChannel === 'in_person') && (
        <div className="bg-accent/20 p-3 rounded-lg border border-border/20">
          <p className="text-sm text-muted-foreground">
            {selectedChannel === 'phone' ? '📞 This template provides a script for phone calls. Use it as a guide during your conversation.' : '🤝 This template is for in-person meetings. Use it to prepare talking points.'}
          </p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">Message</label>
        <Textarea
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Enter your message... Use {{name}}, {{company}} for personalization"
          rows={6}
          className="border-border/40"
        />
      </div>

      <Button 
        onClick={sendMessage}
        disabled={selectedContacts.length === 0 || !messageContent.trim() || !recipientInput.trim()}
        className="w-full bg-gradient-primary hover:bg-primary/90"
      >
        <Send className="w-4 h-4 mr-2" />
        Send to {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
      </Button>
    </CardContent>
  </Card>
);

function Messaging() {
  const [activeTab, setActiveTab] = useState("compose");
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [selectedStatus, setSelectedStatus] = useState("not_contacted");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showMessageTable, setShowMessageTable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
  }, []);

  const setupRealtimeSubscriptions = () => {
    const templatesSubscription = supabase
      .channel('message_templates_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_templates' }, 
        () => loadData())
      .subscribe();

    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, 
        () => loadData())
      .subscribe();

    const tasksSubscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
        () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(templatesSubscription);
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(tasksSubscription);
    };
  };

  const loadData = async () => {
    try {
      // Load contacts
      console.log('Loading contacts...');
      const { data: contactsData, error: contactsError } = await supabase
        .from('master')
        .select('id, name, email, company, linkedin_url, channel, lead_stage, outreach_status')
        .order('created_at', { ascending: false });

      if (contactsError) {
        console.error('Error loading contacts:', contactsError);
        throw contactsError;
      }
      console.log('Contacts loaded:', contactsData?.length || 0);
      // Map the data to include channel_from as null since it doesn't exist in DB yet
      const mappedContacts = (contactsData || []).map(contact => ({
        ...contact,
        channel_from: null as ChannelType | null,
        outreach_status: contact.outreach_status === 'closed' ? 'closed_won' : contact.outreach_status as OutreachStatus
      }));
      setContacts(mappedContacts);

      // Load templates
      console.log('Loading templates...');
      const { data: templatesData, error: templatesError } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (templatesError) {
        console.error('Error loading templates:', templatesError);
        console.error('Templates error details:', JSON.stringify(templatesError, null, 2));
        throw templatesError;
      }
      console.log('Templates loaded:', templatesData?.length || 0);
      setTemplates(templatesData || []);

      // Load recent messages
      console.log('Loading messages...');
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*, master!messages_contact_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        console.error('Messages error details:', JSON.stringify(messagesError, null, 2));
        throw messagesError;
      }
      console.log('Messages loaded:', messagesData?.length || 0);
      setMessages(messagesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      toast({
        title: "Error",
        description: `Failed to load data: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const channelConfig = {
    email: { icon: Mail, label: "Email", color: "bg-purple-500/20 text-purple-400" },
    linkedin: { icon: Linkedin, label: "LinkedIn", color: "bg-blue-500/20 text-blue-400" },
    whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "bg-green-500/20 text-green-400" },
    sms: { icon: Phone, label: "SMS", color: "bg-orange-500/20 text-orange-400" },
    phone: { icon: Phone, label: "Phone", color: "bg-red-500/20 text-red-400" },
    in_person: { icon: Users, label: "In Person", color: "bg-indigo-500/20 text-indigo-400" },
    clay: { icon: Mail, label: "Clay", color: "bg-teal-500/20 text-teal-400" },
    other: { icon: MessageSquare, label: "Other", color: "bg-gray-500/20 text-gray-400" }
  };

  // Generate distinct colors for contact initials
  const getInitialsColor = (name: string) => {
    const colors = [
      'bg-blue-500 text-white',
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-orange-500 text-white',
      'bg-pink-500 text-white',
      'bg-indigo-500 text-white',
      'bg-teal-500 text-white',
      'bg-red-500 text-white',
      'bg-yellow-500 text-gray-900',
      'bg-cyan-500 text-white',
      'bg-emerald-500 text-white',
      'bg-violet-500 text-white'
    ];
    
    // Use the sum of character codes to consistently assign colors
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  const handleContactSelect = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
      
      // Auto-select channel and status from the contact's Master Table data
      const contact = contacts.find(c => c.id === contactId);
      if (contact && selectedContacts.length === 0) { // Only auto-select for first contact
        if (contact.channel_from) {
          setSelectedChannel(contact.channel_from);
        }
        setSelectedStatus(contact.outreach_status);
      }
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setMessageSubject(template.subject || "");
      setMessageContent(template.content);
      setSelectedChannel(template.channel);
    }
  };

  const personalizeContent = (content: string, contact: Contact) => {
    return content
      .replace(/\{\{name\}\}/g, contact.name)
      .replace(/\{\{company\}\}/g, contact.company || "your company")
      .replace(/\{\{industry\}\}/g, "your industry");
  };

  const sendMessage = async () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one contact to send the message.",
        variant: "destructive"
      });
      return;
    }

    if (!messageContent.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message to send.",
        variant: "destructive"
      });
      return;
    }

    if (!recipientInput.trim()) {
      const fieldName = selectedChannel === 'email' ? 'email address' :
                       selectedChannel === 'linkedin' ? 'LinkedIn ID' :
                       selectedChannel === 'whatsapp' ? 'WhatsApp number' :
                       selectedChannel === 'sms' ? 'phone number' :
                       selectedChannel === 'phone' ? 'phone number' :
                       selectedChannel === 'in_person' ? 'meeting location' :
                       selectedChannel === 'clay' ? 'Clay contact ID' :
                       'contact information';
      
      toast({
        title: "No Recipient",
        description: `Please enter a ${fieldName}.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const contactsToMessage = contacts.filter(c => selectedContacts.includes(c.id));
      const messagesToSend = contactsToMessage.map(contact => ({
        contact_id: contact.id,
        template_id: selectedTemplate || null,
        channel: selectedChannel,
        subject: messageSubject,
        content: personalizeContent(messageContent, contact),
        status: 'sent',
        sent_at: new Date().toISOString()
      }));

      // Insert messages and get the inserted message IDs
      const { data: insertedMessages, error: messageError } = await supabase
        .from('messages')
        .insert(messagesToSend)
        .select('id, contact_id');

      if (messageError) throw messageError;

      // Update master table with message IDs and outreach status
      if (insertedMessages && insertedMessages.length > 0) {
        for (const message of insertedMessages) {
          try {
            // Update master table with the message ID
            const { error: masterUpdateError } = await supabase
              .from('master')
              .update({ msg: message.id })
              .eq('id', message.contact_id);

            if (masterUpdateError) {
              console.error('Error updating master table with message ID:', masterUpdateError);
            }

            // Update contact outreach status
            await updateContactStatus(message.contact_id, selectedStatus as OutreachStatus);
          } catch (error) {
            console.error('Error updating contact:', error);
            // Continue with other contacts even if one fails
          }
        }
      }

      // Create tasks for each contact
      const tasksToCreate = contactsToMessage.map(contact => ({
        contact_id: contact.id,
        title: `Message Sent - ${selectedChannel.charAt(0).toUpperCase() + selectedChannel.slice(1)}`,
        description: `Sent ${selectedChannel} message: "${messageSubject || messageContent.substring(0, 50)}..."`,
        status: 'completed',
        priority: 'medium',
        completed_at: new Date().toISOString()
      }));

      const { error: taskError } = await supabase
        .from('tasks')
        .insert(tasksToCreate);

      if (taskError) console.error('Task creation error:', taskError);

      // Update template usage count
      if (selectedTemplate) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          const { error: templateError } = await supabase
            .from('message_templates')
            .update({ usage_count: template.usage_count + 1 })
            .eq('id', selectedTemplate);

          if (templateError) console.error('Template update error:', templateError);
        }
      }

      toast({
        title: "Messages Sent",
        description: `Successfully sent ${messagesToSend.length} message(s).`,
      });

      // Reset form
      setSelectedContacts([]);
      setSelectedTemplate("");
      setMessageSubject("");
      setMessageContent("");
      setRecipientInput("");

      // Reload data
      loadData();

    } catch (error) {
      console.error('Error sending messages:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send messages. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTemplates = templates.filter(template => 
    template.channel === selectedChannel && template.status === selectedStatus
  );

  // Get status options based on selected contacts' channel_from
  const getStatusOptionsForSelectedContacts = () => {
    if (selectedContacts.length === 0) {
      return OUTREACH_STATUS_OPTIONS.map(option => ({
        value: option.value,
        label: option.label
      }));
    }
    
    // Get the channel_from of the first selected contact
    const firstContact = contacts.find(c => selectedContacts.includes(c.id));
    const channelFrom = firstContact?.channel_from;
    
    return getStatusOptionsForChannel(channelFrom).map(option => ({
      value: option.value,
      label: option.label
    }));
  };
  
  const statusOptions = getStatusOptionsForSelectedContacts();

  const ConversationsView = () => (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <Card className="bg-gradient-card border-border/40">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Messages Yet</h3>
            <p className="text-muted-foreground">
              Start sending messages to see your conversation history here.
            </p>
          </CardContent>
        </Card>
      ) : (
        messages.map(message => (
          <Card key={message.id} className="bg-gradient-card border-border/40">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={`text-xs font-semibold ${message.master?.name ? getInitialsColor(message.master.name) : 'bg-gray-500 text-white'}`}>
                      {message.master?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{message.master?.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{message.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={channelConfig[message.channel as keyof typeof channelConfig]?.color}>
                    {message.channel}
                  </Badge>
                  <Badge variant={message.status === 'sent' ? 'default' : 'secondary'}>
                    {message.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const TemplatesView = () => {
    const [templateChannelFilter, setTemplateChannelFilter] = useState("all");
    const [templateStatusFilter, setTemplateStatusFilter] = useState("all");
    
    const filteredDisplayTemplates = templates.filter(template => {
      const channelMatch = templateChannelFilter === "all" || template.channel === templateChannelFilter;
      const statusMatch = templateStatusFilter === "all" || template.status === templateStatusFilter;
      return channelMatch && statusMatch;
    });
    
    return (
      <div className="space-y-6">
        {/* Template Filters */}
        <Card className="bg-gradient-card border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Filter Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Channel</label>
                <Select value={templateChannelFilter} onValueChange={setTemplateChannelFilter}>
                  <SelectTrigger className="border-border/40">
                    <SelectValue placeholder="All channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    {Object.entries(channelConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="w-4 h-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Outreach Stage</label>
                <Select value={templateStatusFilter} onValueChange={setTemplateStatusFilter}>
                  <SelectTrigger className="border-border/40">
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Showing {filteredDisplayTemplates.length} of {templates.length} templates</span>
              {(templateChannelFilter !== "all" || templateStatusFilter !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setTemplateChannelFilter("all");
                    setTemplateStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDisplayTemplates.length === 0 ? (
            <Card className="col-span-full bg-gradient-card border-border/40">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {templates.length === 0 ? "No Templates Yet" : "No Templates Match Filters"}
                </h3>
                <p className="text-muted-foreground">
                  {templates.length === 0 
                    ? "Message templates help you send consistent, personalized outreach."
                    : "Try adjusting your filters to see more templates."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDisplayTemplates.map(template => (
              <Card key={template.id} className="bg-gradient-card border-border/40">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.subject && `Subject: ${template.subject}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={channelConfig[template.channel as keyof typeof channelConfig]?.color}>
                        {channelConfig[template.channel as keyof typeof channelConfig]?.label || template.channel}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {statusOptions.find(s => s.value === template.status)?.label || template.status}
                      </Badge>
                      <Badge variant="secondary">{template.usage_count} uses</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {template.content}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleTemplateSelect(template.id)}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowTemplateForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messaging</h1>
          <p className="text-muted-foreground mt-1">
            Send personalized outreach messages to your leads
          </p>
        </div>
        <Button 
          className="bg-gradient-primary hover:bg-primary/90"
          onClick={() => {
            setEditingTemplate(null);
            setShowTemplateForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Button 
          className="bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md border border-white/30 hover:bg-white/30 text-gray-800 shadow-lg"
          onClick={() => setShowMessageTable(!showMessageTable)}
        >
          <Database className="w-4 h-4 mr-2" />
          Message Table
        </Button>
      </div>

      {showMessageTable ? (
        <MessageTable />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecipientSelector
              filteredContacts={filteredContacts}
              selectedContacts={selectedContacts}
              handleContactSelect={handleContactSelect}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              channelConfig={channelConfig}
              getInitialsColor={getInitialsColor}
            />
            <MessageComposer
              selectedChannel={selectedChannel}
              setSelectedChannel={setSelectedChannel}
              recipientInput={recipientInput}
              setRecipientInput={setRecipientInput}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              selectedTemplate={selectedTemplate}
              handleTemplateSelect={handleTemplateSelect}
              filteredTemplates={filteredTemplates}
              messageSubject={messageSubject}
              setMessageSubject={setMessageSubject}
              messageContent={messageContent}
              setMessageContent={setMessageContent}
              channelConfig={channelConfig}
              statusOptions={statusOptions}
              sendMessage={sendMessage}
              selectedContacts={selectedContacts}
            />
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <ConversationsView />
        </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <TemplatesView />
          </TabsContent>
        </Tabs>
      )}

      <TemplateForm
        isOpen={showTemplateForm}
        onClose={() => {
          setShowTemplateForm(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSuccess={() => {
          setShowTemplateForm(false);
          setEditingTemplate(null);
          loadData();
        }}
      />
    </div>
  );
}

export default Messaging;