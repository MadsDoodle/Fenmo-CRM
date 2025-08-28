import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, Search, Filter, RefreshCw, ArrowUpDown, Pencil, Check, X, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageTemplate {
  id: string;
  name: string;
  subject: string | null;
  content: string;
  channel: string;
  status: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SortConfig {
  key: keyof MessageTemplate;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  key: keyof MessageTemplate;
  value: string;
}

export function MessageTemplatesTable() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const loadMessageTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading message templates:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load message templates. Please check your database connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMessageTemplates();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('message_templates_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_templates' }, 
        () => loadMessageTemplates())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [loadMessageTemplates]);

  const handleCellEdit = (templateId: string, field: string, currentValue: any) => {
    setEditingCell({id: templateId, field});
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    try {
      let updateValue: any = editValue;
      
      // Convert string to number for numeric fields
      if (editingCell.field === 'usage_count') {
        updateValue = parseInt(editValue) || 0;
      }
      
      // Convert string to boolean for boolean fields
      if (editingCell.field === 'is_active') {
        updateValue = editValue.toLowerCase() === 'true' || editValue === '1';
      }

      const { error } = await supabase
        .from('message_templates')
        .update({ [editingCell.field]: updateValue })
        .eq('id', editingCell.id);

      if (error) throw error;

      toast({
        title: "Updated Successfully",
        description: "Message template has been updated.",
      });

      setEditingCell(null);
      setEditValue("");
      loadMessageTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update message template.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleSort = (key: keyof MessageTemplate) => {
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

  const handleFilter = (key: keyof MessageTemplate, value: string) => {
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

  const toggleRowSelection = (templateId: string) => {
    setSelectedRows(current => {
      const newSet = new Set(current);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const getFilteredAndSortedTemplates = () => {
    let filtered = templates.filter(template =>
      Object.values(template).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Apply channel filter
    if (channelFilter !== "all") {
      filtered = filtered.filter(template => template.channel === channelFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(template => template.status === statusFilter);
    }

    // Apply other filters
    filters.forEach(filter => {
      filtered = filtered.filter(template => {
        const value = template[filter.key];
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

  const filteredTemplates = getFilteredAndSortedTemplates();

  const selectAllRows = () => {
    if (selectedRows.size === filteredTemplates.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredTemplates.map(t => t.id)));
    }
  };

  const renderEditableCell = (template: MessageTemplate, field: string, value: any) => {
    const isEditing = editingCell?.id === template.id && editingCell.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          {field === 'content' ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-20 text-xs border-2 border-blue-400 focus:border-blue-600"
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-xs border-2 border-blue-400 focus:border-blue-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
          )}
          <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-6 w-6 p-0">
            <Check className="w-3 h-3 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0">
            <X className="w-3 h-3 text-red-600" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center gap-1 group sheets-cell-editable"
        onClick={() => handleCellEdit(template.id, field, value)}
      >
        <span className="text-xs truncate flex-1 text-gray-900">
          {field === 'is_active' ? (value ? 'Active' : 'Inactive') : (value || '-')}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-3 h-3 text-gray-500 hover:text-blue-600" />
        </div>
      </div>
    );
  };

  const renderSortableHeader = (key: keyof MessageTemplate, label: string) => (
    <div className="flex items-center gap-1 sheets-header-sortable" onClick={() => handleSort(key)}>
      <span className="font-medium text-gray-700">{label}</span>
      <ArrowUpDown className="w-4 h-4 text-gray-500" />
      {sortConfig?.key === key && (
        <span className="text-xs text-blue-600">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </div>
  );

  const uniqueChannels = [...new Set(templates.map(template => template.channel))];
  const uniqueStatuses = [...new Set(templates.map(template => template.status))];

  return (
    <Card className="sheets-table">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Database className="w-5 h-5 text-blue-600" />
            Message Templates
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64 sheets-search-input"
              />
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {uniqueChannels.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {channel.charAt(0).toUpperCase() + channel.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="sheets-button"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={loadMessageTemplates} className="sheets-button">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">{filteredTemplates.length} templates</Badge>
          <span>Real-time updates enabled</span>
          {(channelFilter !== "all" || statusFilter !== "all") && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Filters applied
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
        <div className="sheets-filters-panel">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <Input
                placeholder="Filter by name..."
                onChange={(e) => handleFilter('name', e.target.value)}
                className="text-xs border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
              <Input
                placeholder="Filter by subject..."
                onChange={(e) => handleFilter('subject', e.target.value)}
                className="text-xs border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
              <Input
                placeholder="Filter by content..."
                onChange={(e) => handleFilter('content', e.target.value)}
                className="text-xs border-gray-300 focus:border-blue-500"
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
                        checked={selectedRows.size === filteredTemplates.length && filteredTemplates.length > 0}
                        onCheckedChange={selectAllRows}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('name', 'Name')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('subject', 'Subject')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('content', 'Content')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('channel', 'Channel')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('status', 'Status')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('usage_count', 'Usage Count')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('is_active', 'Active')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <span className="text-gray-500">Loading message templates...</span>
                      </td>
                    </tr>
                  ) : filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                        {templates.length === 0 
                          ? "No message templates found."
                          : `No templates match current filters. Total templates: ${templates.length}`
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredTemplates.map((template, index) => (
                      <tr key={template.id} className={cn(
                        "hover:bg-blue-50 transition-colors",
                        selectedRows.has(template.id) && "bg-blue-100",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      )}>
                        <td className="px-3 py-2 whitespace-nowrap text-center border-r border-gray-200">
                          <Checkbox 
                            checked={selectedRows.has(template.id)}
                            onCheckedChange={() => toggleRowSelection(template.id)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          {renderEditableCell(template, 'name', template.name)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          {renderEditableCell(template, 'subject', template.subject)}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 max-w-xs">
                          <div className="truncate">
                            {renderEditableCell(template, 'content', template.content)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          <Badge
                            variant="outline"
                            className="capitalize bg-gray-100 text-gray-800 border-gray-300 px-2 py-0.5"
                          >
                            {template.channel}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          {renderEditableCell(template, 'status', template.status)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          <Badge variant="secondary">
                            {template.usage_count}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
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
    </Card>
  );
}
