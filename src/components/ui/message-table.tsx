import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, RefreshCw, ArrowUpDown, Database, Mail, Linkedin, Phone, MessageCircle, Users, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageRecord {
  id: string;
  contact_id: string;
  template_id: string | null;
  channel: string;
  subject: string | null;
  content: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  created_at: string;
  contact_name: string | null;
}

interface SortConfig {
  key: keyof MessageRecord;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  key: keyof MessageRecord;
  value: string;
}

export function MessageTable() {
  const [records, setRecords] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadMessageData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          contact_id,
          template_id,
          channel,
          subject,
          content,
          status,
          sent_at,
          opened_at,
          replied_at,
          created_at,
          master!messages_contact_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Raw message data from database:', data);
      console.log('Message data length:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.warn('No message data returned from messages table query');
        setRecords([]);
        return;
      }
      
      const mappedRecords = data.map((rec: any) => ({
        ...rec,
        contact_name: rec.master?.name || 'Unknown Contact'
      }));
      
      console.log('Mapped message records for frontend:', mappedRecords);
      console.log('Setting message records state with', mappedRecords.length, 'records');
      setRecords(mappedRecords);
    } catch (error) {
      console.error('Error loading message data:', error);
      toast({
        title: "Error Loading Messages",
        description: "Failed to load message table data. Please check your database connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMessageData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('message-table-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => loadMessageData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMessageData]);

  const handleSort = (key: keyof MessageRecord) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleFilter = (key: keyof MessageRecord, value: string) => {
    setFilters(current => {
      const existing = current.find(f => f.key === key);
      if (existing) {
        if (value === '') {
          return current.filter(f => f.key !== key);
        }
        return current.map(f => f.key === key ? { ...f, value } : f);
      }
      if (value === '') return current;
      return [...current, { key, value }];
    });
  };

  const toggleRowSelection = (recordId: string) => {
    setSelectedRows(current => {
      const newSet = new Set(current);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const selectAllRows = () => {
    if (selectedRows.size === filteredRecords.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const getFilteredAndSortedRecords = () => {
    let filtered = records.filter(record =>
      Object.values(record).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Apply filters
    filters.forEach(filter => {
      filtered = filtered.filter(record => {
        const value = record[filter.key];
        return value?.toString().toLowerCase().includes(filter.value.toLowerCase());
      });
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        
        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  };

  const filteredRecords = getFilteredAndSortedRecords();

  const renderSortableHeader = (key: keyof MessageRecord, label: string) => (
    <div className="flex items-center gap-1 sheets-header-sortable cursor-pointer" onClick={() => handleSort(key)}>
      <span className="font-medium text-gray-700">{label}</span>
      <ArrowUpDown className="w-4 h-4 text-gray-500" />
      {sortConfig?.key === key && (
        <span className="text-xs text-blue-600">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </div>
  );

  const getChannelIcon = (channel: string) => {
    const iconMap: Record<string, any> = {
      email: Mail,
      linkedin: Linkedin,
      phone: Phone,
      sms: Phone,
      whatsapp: MessageCircle,
      in_person: Users,
      other: MessageSquare
    };
    const IconComponent = iconMap[channel] || MessageSquare;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      sent: 'bg-blue-500/20 text-blue-400',
      delivered: 'bg-green-500/20 text-green-400',
      opened: 'bg-yellow-500/20 text-yellow-400',
      replied: 'bg-purple-500/20 text-purple-400',
      failed: 'bg-red-500/20 text-red-400',
      draft: 'bg-gray-500/20 text-gray-400'
    };
    return colorMap[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <Card className="sheets-table bg-white border border-gray-200 shadow-xl">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Database className="w-5 h-5 text-blue-600" />
            Message Table
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64 bg-white border-gray-300 placeholder:text-gray-500"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white border-gray-300 hover:bg-black text-black hover:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadMessageData}
              className="bg-white border-gray-300 hover:bg-gray-50 text-black"
            >
              <RefreshCw 
                className={cn("w-4 h-4", loading && "animate-spin")} 
              />
            </Button>

          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-700">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">{filteredRecords.length} messages</Badge>
          <span>Real-time updates enabled</span>
          {filters.length > 0 && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {filters.length} active filters
            </Badge>
          )}
          {selectedRows.size > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {selectedRows.size} selected
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
              <Input
                placeholder="Filter by channel..."
                onChange={(e) => handleFilter('channel', e.target.value)}
                className="text-xs bg-white border-gray-300 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <Input
                placeholder="Filter by status..."
                onChange={(e) => handleFilter('status', e.target.value)}
                className="text-xs bg-white border-gray-300 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>
              <Input
                placeholder="Filter by contact..."
                onChange={(e) => handleFilter('contact_name', e.target.value)}
                className="text-xs bg-white border-gray-300 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
              <Input
                placeholder="Filter by subject..."
                onChange={(e) => handleFilter('subject', e.target.value)}
                className="text-xs bg-white border-gray-300 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      <Checkbox 
                        checked={selectedRows.size === filteredRecords.length && filteredRecords.length > 0}
                        onCheckedChange={selectAllRows}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('contact_name', 'Contact')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('channel', 'Channel')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('subject', 'Subject')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('status', 'Status')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('sent_at', 'Sent At')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('template_id', 'Template ID')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Content Preview
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <span className="text-gray-500">Loading message data...</span>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                        {records.length === 0 
                          ? "No messages found. Send some messages to see them here."
                          : `No messages match current filters. Total messages: ${records.length}`
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, index) => (
                      <tr className={cn(
                        "hover:bg-gray-50 transition-colors",
                        selectedRows.has(record.id) && "bg-blue-50",
                        !selectedRows.has(record.id) && index % 2 === 0 && "bg-white",
                        !selectedRows.has(record.id) && index % 2 === 1 && "bg-gray-50/50"
                      )}>
                        <td className="px-3 py-2 border-r border-gray-200 text-center">
                          <Checkbox 
                            checked={selectedRows.has(record.id)}
                            onCheckedChange={() => toggleRowSelection(record.id)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <span className="text-xs font-medium">{record.contact_name}</span>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <div className="flex items-center gap-2">
                            {getChannelIcon(record.channel)}
                            <span className="text-xs capitalize">{record.channel}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <span className="text-xs truncate max-w-xs block">{record.subject || '-'}</span>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <span className="text-xs">
                            {record.sent_at ? new Date(record.sent_at).toLocaleString() : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <span className="text-xs text-gray-600">{record.template_id || '-'}</span>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <span className="text-xs text-gray-600 line-clamp-2 max-w-xs">
                            {record.content.substring(0, 100)}...
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Status Bar */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Ready</span>
          {selectedRows.size > 0 && (
            <span className="text-blue-600 font-medium">
              {selectedRows.size} message{selectedRows.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Real-time message tracking</span>
        </div>
      </div>
    </Card>
  );
}
