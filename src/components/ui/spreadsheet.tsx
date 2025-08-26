import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Save,
  Filter,
  Search,
  Edit3,
  Copy,
  X,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  updated_at: string;
}

interface SpreadsheetProps {
  className?: string;
}

export function Spreadsheet({ className }: SpreadsheetProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRow, setNewRow] = useState<Partial<Contact>>({});
  const [showNewRow, setShowNewRow] = useState(false);
  const { toast } = useToast();

  const columns = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'company', label: 'Company' },
    { key: 'title', label: 'Title' },
    { key: 'linkedin_url', label: 'LinkedIn' },
    { key: 'website', label: 'Website' },
    { key: 'location', label: 'Location' },
    { key: 'industry', label: 'Industry' },
    { key: 'channel', label: 'Channel' },
    { key: 'outreach_status', label: 'Outreach Status' },
    { key: 'lead_stage', label: 'Lead Stage' }
  ];

  const loadContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('master')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const filtered = contacts.filter(contact =>
      Object.values(contact).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredContacts(filtered);
  }, [contacts, searchTerm]);

  const updateCell = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('master')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.map(contact =>
        contact.id === id ? { ...contact, [field]: value } : contact
      ));

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive"
      });
    }
  };

  const addNewRow = async () => {
    if (!newRow.name) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('master')
        .insert({
          dedupe_key: `${newRow.name}_${Date.now()}`,
          name: newRow.name,
          email: newRow.email || null,
          phone: newRow.phone || null,
          company: newRow.company || null,
          title: newRow.title || null,
          linkedin_url: newRow.linkedin_url || null,
          website: newRow.website || null,
          location: newRow.location || null,
          industry: (newRow.industry as any) || 'unknown',
          channel: (newRow.channel as any) || 'email',
          outreach_status: (newRow.outreach_status as any) || 'not_contacted',
          lead_stage: (newRow.lead_stage as any) || 'new'
        })
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => [data, ...prev]);
      setNewRow({});
      setShowNewRow(false);

      toast({
        title: "Success",
        description: "Contact added successfully",
      });
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive"
      });
    }
  };

  const deleteRow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('master')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => contact.id !== id));

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      columns.map(col => col.label).join(','),
      ...filteredContacts.map(contact =>
        columns.map(col => {
          const value = contact[col.key as keyof Contact];
          return `"${value || ''}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Data exported to CSV",
    });
  };

  const CellEditor = ({ contact, field }: { contact: Contact; field: string }) => {
    const [value, setValue] = useState(contact[field as keyof Contact]?.toString() || '');

    const handleSave = () => {
      updateCell(contact.id, field, value);
      setEditingCell(null);
    };

    const handleCancel = () => {
      setValue(contact[field as keyof Contact]?.toString() || '');
      setEditingCell(null);
    };

    return (
      <div className="flex items-center gap-2 min-w-0">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="text-xs h-8"
          autoFocus
        />
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
          <Save className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Loading spreadsheet...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} bg-gradient-card border-border/40`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Contact Database
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewRow(!showNewRow)}
              className="border-border/40"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="border-border/40"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search across all fields..."
              className="pl-10 border-border/40 bg-background/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="secondary">
            {filteredContacts.length} rows
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/40">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="text-left p-3 text-sm font-medium text-foreground border-r border-border/20 min-w-[120px]"
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.required && <span className="text-destructive">*</span>}
                    </div>
                  </th>
                ))}
                <th className="w-12 p-3"></th>
              </tr>
            </thead>
            <tbody>
              {showNewRow && (
                <tr className="border-b border-border/20 bg-accent/20">
                  {columns.map((column) => (
                    <td key={column.key} className="p-2 border-r border-border/20">
                      <Input
                        placeholder={column.required ? `${column.label}*` : column.label}
                        value={newRow[column.key as keyof Contact]?.toString() || ''}
                        onChange={(e) => setNewRow({ ...newRow, [column.key]: e.target.value })}
                        className="text-xs h-8 border-border/40"
                      />
                    </td>
                  ))}
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={addNewRow} className="h-6 w-6 p-0">
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => { setNewRow({}); setShowNewRow(false); }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className="p-2 border-r border-border/20 cursor-pointer"
                      onClick={() => setEditingCell({ id: contact.id, field: column.key })}
                    >
                      {editingCell?.id === contact.id && editingCell?.field === column.key ? (
                        <CellEditor contact={contact} field={column.key} />
                      ) : (
                        <div className="text-sm text-foreground min-h-[24px] flex items-center">
                          {contact[column.key as keyof Contact]?.toString() || '-'}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border-border/40">
                        <DropdownMenuItem onClick={() => deleteRow(contact.id)} className="text-destructive">
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}