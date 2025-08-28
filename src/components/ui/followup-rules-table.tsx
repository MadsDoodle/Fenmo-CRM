import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, Search, Filter, RefreshCw, ArrowUpDown, Pencil, Check, X, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FollowupRule {
  id: string;
  channel: string;
  outreach_status: string;
  channel_sequence: number;
  default_days: number;
  next_action: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

interface SortConfig {
  key: keyof FollowupRule;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  key: keyof FollowupRule;
  value: string;
}

export function FollowupRulesTable() {
  const [rules, setRules] = useState<FollowupRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [channelFilter, setChannelFilter] = useState("all");
  const { toast } = useToast();

  const loadFollowupRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('followup_rules')
        .select('*')
        .order('channel', { ascending: true })
        .order('channel_sequence', { ascending: true });

      if (error) throw error;
      
      setRules(data || []);
    } catch (error) {
      console.error('Error loading followup rules:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load followup rules. Please check your database connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFollowupRules();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('followup_rules_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followup_rules' }, 
        () => loadFollowupRules())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [loadFollowupRules]);

  const handleCellEdit = (ruleId: string, field: string, currentValue: any) => {
    setEditingCell({id: ruleId, field});
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    try {
      let updateValue: any = editValue;
      
      // Convert string to number for numeric fields
      if (editingCell.field === 'default_days' || editingCell.field === 'channel_sequence') {
        updateValue = parseInt(editValue) || 0;
      }

      const { error } = await (supabase as any)
        .from('followup_rules')
        .update({ [editingCell.field]: updateValue })
        .eq('id', editingCell.id);

      if (error) throw error;

      toast({
        title: "Updated Successfully",
        description: "Followup rule has been updated.",
      });

      setEditingCell(null);
      setEditValue("");
      loadFollowupRules();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update followup rule.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleSort = (key: keyof FollowupRule) => {
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

  const handleFilter = (key: keyof FollowupRule, value: string) => {
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

  const toggleRowSelection = (ruleId: string) => {
    setSelectedRows(current => {
      const newSet = new Set(current);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  };

  const getFilteredAndSortedRules = () => {
    let filtered = rules.filter(rule =>
      Object.values(rule).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Apply channel filter
    if (channelFilter !== "all") {
      filtered = filtered.filter(rule => rule.channel === channelFilter);
    }

    // Apply other filters
    filters.forEach(filter => {
      filtered = filtered.filter(rule => {
        const value = rule[filter.key];
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

  const filteredRules = getFilteredAndSortedRules();

  const selectAllRows = () => {
    if (selectedRows.size === filteredRules.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRules.map(r => r.id)));
    }
  };

  const renderEditableCell = (rule: FollowupRule, field: string, value: any) => {
    const isEditing = editingCell?.id === rule.id && editingCell.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="text-xs border-2 border-blue-400 focus:border-blue-600"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
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
        onClick={() => handleCellEdit(rule.id, field, value)}
      >
        <span className="text-xs truncate flex-1 text-gray-900">{value || '-'}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-3 h-3 text-gray-500 hover:text-blue-600" />
        </div>
      </div>
    );
  };

  const renderSortableHeader = (key: keyof FollowupRule, label: string) => (
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

  const uniqueChannels = [...new Set(rules.map(rule => rule.channel))];

  return (
    <Card className="sheets-table">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Database className="w-5 h-5 text-blue-600" />
            Follow-up Rules
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rules..."
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="sheets-button"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={loadFollowupRules} className="sheets-button">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">{filteredRules.length} rules</Badge>
          <span>Real-time updates enabled</span>
          {channelFilter !== "all" && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Filtered by {channelFilter}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <Input
                placeholder="Filter by status..."
                onChange={(e) => handleFilter('outreach_status', e.target.value)}
                className="text-xs border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Next Action</label>
              <Input
                placeholder="Filter by next action..."
                onChange={(e) => handleFilter('next_action', e.target.value)}
                className="text-xs border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <Input
                placeholder="Filter by description..."
                onChange={(e) => handleFilter('description', e.target.value)}
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
                        checked={selectedRows.size === filteredRules.length && filteredRules.length > 0}
                        onCheckedChange={selectAllRows}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('channel', 'Channel')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('outreach_status', 'Outreach Status')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('channel_sequence', 'Sequence')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('default_days', 'Default Days')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('next_action', 'Next Action')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('description', 'Description')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <span className="text-gray-500">Loading followup rules...</span>
                      </td>
                    </tr>
                  ) : filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        {rules.length === 0 
                          ? "No followup rules found."
                          : `No rules match current filters. Total rules: ${rules.length}`
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredRules.map((rule, index) => (
                      <tr key={rule.id} className={cn(
                        "hover:bg-blue-50 transition-colors",
                        selectedRows.has(rule.id) && "bg-blue-100",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      )}>
                        <td className="px-3 py-2 whitespace-nowrap text-center border-r border-gray-200">
                          <Checkbox 
                            checked={selectedRows.has(rule.id)}
                            onCheckedChange={() => toggleRowSelection(rule.id)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          <Badge variant="outline" className="capitalize">
                            {rule.channel}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          {renderEditableCell(rule, 'outreach_status', rule.outreach_status)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          {renderEditableCell(rule, 'channel_sequence', rule.channel_sequence)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          {renderEditableCell(rule, 'default_days', rule.default_days)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-200">
                          {renderEditableCell(rule, 'next_action', rule.next_action)}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200">
                          {renderEditableCell(rule, 'description', rule.description)}
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
