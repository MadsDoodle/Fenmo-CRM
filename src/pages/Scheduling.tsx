import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, Users, RefreshCw, TrendingUp } from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { toast } from "sonner";
import { OUTREACH_STATUS_OPTIONS, getStatusColor, getStatusOptionsForChannel, CHANNEL_FROM_OPTIONS, type OutreachStatus, type ChannelType } from "@/lib/status-config";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  outreach_status: OutreachStatus;
  channel_from: ChannelType | null;
  last_action: string;
  next_action: string;
  next_action_status: string | null;
  priority: 'high' | 'medium' | 'low';
  custom_followup_days: number | null;
}

interface FollowupRule {
  outreach_status: string;
  default_days: number;
  description: string;
}

export default function Scheduling() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [followupRules, setFollowupRules] = useState<FollowupRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('master')
        .select(`
          id,
          name,
          company,
          email,
          outreach_status,
          channel_from,
          last_action_date,
          next_action_date,
          next_action_status,
          priority,
          custom_followup_days
        `)
        .order('next_action_date', { ascending: true });

      if (contactsError) throw contactsError;

      // Fetch followup rules (table exists via migration but not in generated types)
      const { data: rulesData, error: rulesError } = await (supabase as any)
        .from('followup_rules')
        .select('*')
        .order('default_days', { ascending: false });

      if (rulesError) throw rulesError;

      // Map database columns to interface
      const mappedContacts = (contactsData || []).map((contact: any) => ({
        ...contact,
        last_action: contact.last_action_date,
        next_action: contact.next_action_date,
        priority: contact.priority || 'medium',
        outreach_status: (contact.outreach_status === 'closed' ? 'closed_won' : contact.outreach_status) as OutreachStatus
      }));
      setContacts(mappedContacts as Contact[]);
      setFollowupRules((rulesData || []) as unknown as FollowupRule[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      setUpdating(contactId);
      
      const { error } = await supabase
        .from('master')
        .update(updates as any)
        .eq('id', contactId);

      if (error) throw error;

      // Refresh data to get updated next_action
      await fetchData();
      toast.success('Contact updated successfully');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setUpdating(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' },
      medium: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🟠' },
      low: { color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' }
    };
    
    const configItem = config[priority as keyof typeof config] || config.medium;
    
    return (
      <Badge className={`${configItem.color} border`}>
        <span className="mr-1">{configItem.icon}</span>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: OutreachStatus, channelFrom: ChannelType | null) => {
    const statusOption = getStatusOptionsForChannel(channelFrom).find(opt => opt.value === status) ||
                        OUTREACH_STATUS_OPTIONS.find(opt => opt.value === status);
    
    return (
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
        <Badge variant="outline" className="text-xs font-medium">
          {statusOption?.label || status}
        </Badge>
      </div>
    );
  };

  const getNextActionStatus = (nextAction: string | null) => {
    if (!nextAction) return { status: 'no-followup', icon: <XCircle className="w-4 h-4" />, color: 'text-gray-500' };
    
    const nextDate = new Date(nextAction);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    if (nextDate < today) {
      return { status: 'overdue', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-500' };
    } else if (nextDate.toDateString() === tomorrow.toDateString()) {
      return { status: 'tomorrow', icon: <Clock className="w-4 h-4" />, color: 'text-orange-500' };
    } else {
      return { status: 'upcoming', icon: <Calendar className="w-4 h-4" />, color: 'text-green-500' };
    }
  };

  const getDefaultDays = (status: string) => {
    const rule = followupRules.find(r => r.outreach_status === status);
    return rule?.default_days || 0;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading scheduling data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Follow-up Schedule</h1>
          <p className="text-muted-foreground">
            Manage priorities and custom follow-up schedules for each contact
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {contacts.filter(c => {
                if (!c.next_action) return false;
                const nextDate = new Date(c.next_action);
                const today = new Date();
                return nextDate.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Tomorrow</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {contacts.filter(c => {
                if (!c.next_action) return false;
                const nextDate = new Date(c.next_action);
                const tomorrow = addDays(new Date(), 1);
                return nextDate.toDateString() === tomorrow.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contacts.filter(c => c.priority === 'high').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Schedule</CardTitle>
          <CardDescription>
            Manage priorities and custom follow-up schedules for each contact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Last Action</TableHead>
                  <TableHead>Next Action</TableHead>
                  <TableHead>Next Action Status</TableHead>
                  <TableHead>Custom Days</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => {
                  const nextActionStatus = getNextActionStatus(contact.next_action);
                  const defaultDays = getDefaultDays(contact.outreach_status);
                  
                  return (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {contact.company} • {contact.email}
                          </div>
                          {contact.channel_from && (
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                {CHANNEL_FROM_OPTIONS.find(opt => opt.value === contact.channel_from)?.label}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(contact.outreach_status, contact.channel_from)}
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          value={contact.priority}
                          onValueChange={(value) => 
                            updateContact(contact.id, { priority: value as 'high' | 'medium' | 'low' })
                          }
                          disabled={updating === contact.id}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {contact.last_action 
                            ? format(new Date(contact.last_action), 'MMM dd, yyyy')
                            : 'Never'
                          }
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={nextActionStatus.color}>
                            {nextActionStatus.icon}
                          </span>
                          <div className="text-sm">
                            {contact.next_action 
                              ? format(new Date(contact.next_action), 'MMM dd, yyyy')
                              : 'No follow-up'
                            }
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {contact.next_action_status || 'No action defined'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="365"
                            value={contact.custom_followup_days || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              updateContact(contact.id, { custom_followup_days: value });
                            }}
                            placeholder={defaultDays.toString()}
                            className="w-16"
                            disabled={updating === contact.id}
                          />
                          <span className="text-xs text-muted-foreground">
                            (default: {defaultDays})
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const today = new Date();
                            await updateContact(contact.id, { last_action: today.toISOString() });
                            try {
                              const { data: result, error: calcErr } = await (supabase as any).rpc('calculate_next_action', {
                                p_contact_id: contact.id,
                                p_custom_days: contact.custom_followup_days ?? null,
                                p_channel: contact.channel_from || 'linkedin'
                              });
                              if (!calcErr) {
                                // The function now updates both next_action_date and next_action_status
                                await fetchData();
                                toast.success('Next action updated successfully');
                              }
                            } catch (e) {
                              console.warn('next_action recompute warning:', e);
                              toast.error('Failed to update next action');
                            }
                          }}
                          disabled={updating === contact.id}
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        >
                          Update Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
