import { useState, useEffect } from "react";
import { Search, Plus, Filter, Download, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContactForm } from "@/components/ui/contact-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  channel: string;
  lead_stage: string;
  outreach_status: string;
  last_action_date: string | null;
  next_action_date: string | null;
  created_at: string;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const { toast } = useToast();

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('master')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts from master table",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLeadStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'qualified': return 'bg-green-500/20 text-green-400';
      case 'meeting_scheduled': return 'bg-purple-500/20 text-purple-400';
      case 'proposal_sent': return 'bg-orange-500/20 text-orange-400';
      case 'closed_won': return 'bg-green-600/20 text-green-600';
      case 'closed_lost': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email': return 'bg-purple-500/20 text-purple-400';
      case 'whatsapp': return 'bg-green-500/20 text-green-400';
      case 'linkedin': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getOutreachStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'not_contacted': return 'bg-gray-500/20 text-gray-400';
      case 'contacted': return 'bg-yellow-500/20 text-yellow-400';
      case 'replied': return 'bg-blue-500/20 text-blue-400';
      case 'interested': return 'bg-green-500/20 text-green-400';
      case 'not_interested': return 'bg-red-500/20 text-red-400';
      case 'closed': return 'bg-gray-600/20 text-gray-600';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setIsContactFormOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsContactFormOpen(true);
  };

  const handleContactFormClose = () => {
    setIsContactFormOpen(false);
    setEditingContact(null);
  };

  const handleContactFormSuccess = () => {
    loadContacts(); // Reload contacts after successful add/edit
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

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading contacts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your contact database and outreach pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border/40">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
                      <Button onClick={handleAddContact} className="bg-gradient-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-card border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search contacts by name, email, or company..."
                className="pl-10 border-border/40 bg-background/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="border-border/40">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <Card className="bg-gradient-card border-border/40">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              {contacts.length === 0 
                ? "No contacts found. Upload a CSV file from the dashboard to get started."
                : "No contacts match your search criteria."
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="bg-gradient-card border-border/40 hover:shadow-glow transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                      <AvatarFallback className={`text-sm font-semibold ${getInitialsColor(contact.name)}`}>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{contact.name}</h3>
                      {contact.company && (
                        <p className="text-sm text-muted-foreground">{contact.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditContact(contact)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.email && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Email: </span>
                    <span className="text-foreground">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Phone: </span>
                    <span className="text-foreground">{contact.phone}</span>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getLeadStageColor(contact.lead_stage)}>
                    {contact.lead_stage?.replace('_', ' ')}
                  </Badge>
                  <Badge className={getChannelColor(contact.channel)}>
                    {contact.channel}
                  </Badge>
                  <Badge className={getOutreachStatusColor(contact.outreach_status)}>
                    {contact.outreach_status?.replace('_', ' ')}
                  </Badge>
                  {contact.industry && (
                    <Badge variant="outline" className="border-border/40">
                      {contact.industry}
                    </Badge>
                  )}
                </div>

                {contact.next_action_date && (
                  <div className="text-xs text-muted-foreground">
                    Next action: {new Date(contact.next_action_date).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Form Modal */}
      <ContactForm
        isOpen={isContactFormOpen}
        onClose={handleContactFormClose}
        contact={editingContact}
        onSuccess={handleContactFormSuccess}
      />
    </div>
  );
}