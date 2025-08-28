import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, Search, Filter, Download, Upload, Plus, Pencil, Check, X, Eye, Database, RefreshCw, ArrowUpDown, Merge, Split, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { OUTREACH_STATUS_OPTIONS, LEAD_STAGE_OPTIONS, CHANNEL_FROM_OPTIONS, updateContactStatus, type OutreachStatus, type ChannelType, type LeadStage, getStatusColor, getLeadStageColor, getLeadStageLabel, getStatusOptionsForChannel } from "@/lib/status-config";

interface MasterRecord {
  id: string;
  dedupe_key: string;
  linkedin_url: string | null;
  email: string | null;
  channel: string | null;
  channel_from: ChannelType | null;
  company: string | null;
  name: string;
  phone: string | null;
  website: string | null;
  industry: string | null;
  emp_count: string | null;
  title: string | null;
  location: string | null;
  msg: string | null;
  last_action: string | null;
  next_action: string | null;
  next_action_status: string | null;
  priority: 'high' | 'medium' | 'low';
  custom_followup_days: number | null;
  outreach_status: OutreachStatus;
  lead_stage: LeadStage;
  created_at: string;
  updated_at: string;
}

interface SortConfig {
  key: keyof MasterRecord;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  key: keyof MasterRecord;
  value: string;
}

export function MasterTable() {
  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [mergedCells, setMergedCells] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadMasterData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('master')
        .select(`
          id,
          dedupe_key,
          linkedin_url,
          email,
          channel,
          channel_from,
          company,
          name,
          phone,
          website,
          industry,
          emp_count,
          title,
          location,
          msg,
          last_action_date,
          next_action_date,
          next_action_status,
          outreach_status,
          lead_stage,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Raw data from database:', data);
      console.log('Data length:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.warn('No data returned from master table query');
        setRecords([]);
        return;
      }
      
      const mappedRecords = data.map((rec: any) => ({
        ...rec,
        // Map database column names to frontend expectations
        last_action: rec.last_action_date,
        next_action: rec.next_action_date,
        next_action_status: rec.next_action_status,
        priority: 'medium' as const, // Default priority since it may not exist in DB
        custom_followup_days: null,
        channel_from: rec.channel_from, // Use actual value from database
        outreach_status: (rec.outreach_status === 'closed' ? 'closed_won' : rec.outreach_status) as OutreachStatus
      }));
      
      console.log('Mapped records for frontend:', mappedRecords);
      console.log('Setting records state with', mappedRecords.length, 'records');
      setRecords(mappedRecords);
    } catch (error) {
      console.error('Error loading master data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load master table data. Please check your database connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMasterData();
    // Removed real-time subscription to prevent unwanted reloads
  }, [loadMasterData]);



  const handleCellEdit = (recordId: string, field: string, currentValue: any) => {
    setEditingCell({id: recordId, field});
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    try {
      const { error } = await supabase
        .from('master')
        .update({ [editingCell.field]: editValue })
        .eq('id', editingCell.id);

      if (error) throw error;

      // Update the frontend state immediately
      setRecords(current => current.map(record => 
        record.id === editingCell.id 
          ? { ...record, [editingCell.field]: editValue }
          : record
      ));

      toast({
        title: "Updated Successfully",
        description: "Record has been updated.",
      });

      setEditingCell(null);
      setEditValue("");
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update record.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleStatusChange = async (recordId: string, newStatus: OutreachStatus) => {
    // Map extended statuses to DB enum
    const mapStatusForDb = (status: OutreachStatus): any => {
      const extendedClosed: OutreachStatus[] = [
        'closed_won', 'closed_lost', 'qualified', 'proposal_sent', 'meeting_scheduled', 'demo_completed', 'negotiation'
      ];
      return (extendedClosed as string[]).includes(status as string) ? 'closed' : (status as any);
    };

    const previous = records.find(r => r.id === recordId)?.outreach_status;

    // Optimistic UI update with last_action_date
    const currentDate = new Date().toISOString();
    setRecords(current => current.map(r => r.id === recordId ? { 
      ...r, 
      outreach_status: newStatus,
      last_action: currentDate
    } : r));

    try {
      const { error } = await supabase
        .from('master')
        .update({ 
          outreach_status: mapStatusForDb(newStatus),
          last_action_date: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0] // Store as YYYY-MM-DD in IST
        })
        .eq('id', recordId);

      if (error) throw error;

      // AFTER status update is successful, recalculate next_action
      try {
        const record = records.find(r => r.id === recordId);
        const effectiveChannel = record?.channel_from || record?.channel || 'linkedin';
        console.log('Calculating next action AFTER status update:', { recordId, newStatus, effectiveChannel });
        
        const { data: result, error: calcErr } = await (supabase as any).rpc('calculate_next_action', {
          p_contact_id: recordId,
          p_custom_days: null,
          p_channel: effectiveChannel
        });
        
        if (!calcErr && result && result.length > 0) {
          const calculatedData = result[0];
          // Update optimistic state with calculated next action
          setRecords(current => current.map(r => 
            r.id === recordId 
              ? { 
                  ...r, 
                  next_action: calculatedData.next_action_date,
                  next_action_status: calculatedData.next_action_status 
                } 
              : r
          ));
        }
      } catch (calcErr) {
        console.warn('Next action calculation failed (non-blocking):', calcErr);
      }

      // Log activity (non-blocking)
      try {
        await supabase.from('activities').insert({
          contact_id: recordId,
          type: 'status_change',
          description: `Outreach status changed to ${newStatus}`,
          to_status: mapStatusForDb(newStatus)
        });
      } catch (e) {
        console.warn('Activity log insert failed (non-blocking):', e);
      }

      // Don't reload - optimistic updates already applied

      toast({
        title: "Status Updated",
        description: "Outreach status has been updated.",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      // Revert optimistic update on failure
      if (previous) {
        setRecords(current => current.map(r => r.id === recordId ? { 
          ...r, 
          outreach_status: previous,
          last_action: r.last_action // Keep original last_action on revert
        } : r));
      }
      
      const errorMessage = error?.message || 'Unknown error occurred';
      toast({
        title: "Update Failed",
        description: `Failed to update status: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const handleChannelFromChange = async (recordId: string, newChannelFrom: ChannelType | null) => {
    const previous = records.find(r => r.id === recordId)?.channel_from;

    // Optimistic UI update with last_action_date
    const currentDate = new Date().toISOString();
    setRecords(current => current.map(r => r.id === recordId ? { 
      ...r, 
      channel_from: newChannelFrom,
      last_action: currentDate
    } : r));

    try {
      // Check if channel_from column exists by trying to update it
      const { error } = await supabase
        .from('master')
        .update({ 
          channel_from: newChannelFrom,
          last_action_date: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0] // Store as YYYY-MM-DD in IST
        } as any)
        .eq('id', recordId);

      if (error) {
        // If column doesn't exist, show helpful message
        if (error.message.includes('column "channel_from" does not exist')) {
          toast({
            title: "Database Migration Required",
            description: "Please apply database migrations to enable channel_from functionality.",
            variant: "destructive"
          });
          // Revert optimistic update
          setRecords(current => current.map(r => r.id === recordId ? { ...r, channel_from: previous } : r));
          return;
        }
        throw error;
      }

      // Trigger next action calculation after channel update
      try {
        const record = records.find(r => r.id === recordId);
        const effectiveChannel = newChannelFrom || record?.channel || 'linkedin';
        console.log('Calculating next action after channel change:', { recordId, newChannelFrom, effectiveChannel });
        
        const { data: result, error: calcErr } = await (supabase as any).rpc('calculate_next_action', {
          p_contact_id: recordId,
          p_custom_days: null,
          p_channel: effectiveChannel
        });
        
        if (calcErr) {
          console.error('calculate_next_action error after channel change:', calcErr);
        } else {
          console.log('Next action calculation result after channel change:', result);
          // Update the record with calculated next action values
          if (result && result.length > 0) {
            const calculatedData = result[0];
            setRecords(current => current.map(r => 
              r.id === recordId 
                ? { 
                    ...r, 
                    next_action: calculatedData.next_action_date,
                    next_action_status: calculatedData.next_action_status 
                  } 
                : r
            ));
          }
        }
      } catch (calcErr) {
        console.error('next_action recompute error after channel change:', calcErr);
      }

      // Don't reload - optimistic update already applied

      toast({
        title: "Channel Updated",
        description: "Channel from has been updated.",
      });
    } catch (error) {
      console.error('Error updating channel_from:', error);
        // Revert optimistic update on failure
        if (previous !== undefined) {
          setRecords(current => current.map(r => r.id === recordId ? { 
            ...r, 
            channel_from: previous,
            last_action: r.last_action // Revert last_action too
          } : r));
        }
      toast({
        title: "Update Failed",
        description: "Failed to update channel from.",
        variant: "destructive"
      });
    }
  };

  const handlePriorityChange = async (recordId: string, newPriority: 'high' | 'medium' | 'low') => {
    const previous = records.find(r => r.id === recordId)?.priority;

    // Optimistic UI update with last_action_date
    const currentDate = new Date().toISOString();
    setRecords(current => current.map(r => r.id === recordId ? { 
      ...r, 
      priority: newPriority,
      last_action: currentDate
    } : r));

    try {
      const { error } = await supabase
        .from('master')
        .update({ 
          priority: newPriority,
          last_action_date: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0] // Store as YYYY-MM-DD in IST
        } as any)
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Priority Updated",
        description: "Contact priority has been updated.",
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      // Revert optimistic update on failure
      if (previous) {
        setRecords(current => current.map(r => r.id === recordId ? { 
          ...r, 
          priority: previous,
          last_action: r.last_action // Keep original last_action on revert
        } : r));
      }
      toast({
        title: "Update Failed",
        description: "Failed to update priority.",
        variant: "destructive"
      });
    }
  };

  const handleLeadStageChange = async (recordId: string, newLeadStage: LeadStage) => {
    const previous = records.find(r => r.id === recordId)?.lead_stage;

    // Optimistic UI update with last_action_date
    const currentDate = new Date().toISOString();
    setRecords(current => current.map(r => r.id === recordId ? { 
      ...r, 
      lead_stage: newLeadStage,
      last_action: currentDate
    } : r));

    try {
      const { error } = await supabase
        .from('master')
        .update({ 
          lead_stage: newLeadStage as any,
          last_action_date: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0] // Store as YYYY-MM-DD in IST
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Lead Stage Updated",
        description: "Lead stage has been updated.",
      });
    } catch (error) {
      console.error('Error updating lead_stage:', error);
      // Revert optimistic update on failure
      if (previous) {
        setRecords(current => current.map(r => r.id === recordId ? { 
          ...r, 
          lead_stage: previous,
          last_action: r.last_action // Keep original last_action on revert
        } : r));
      }
      toast({
        title: "Update Failed",
        description: "Failed to update lead stage.",
        variant: "destructive"
      });
    }
  };

  const handleSort = (key: keyof MasterRecord) => {
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

  const handleFilter = (key: keyof MasterRecord, value: string) => {
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

  const toggleMergeCell = (cellKey: string) => {
    setMergedCells(current => {
      const newSet = new Set(current);
      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
      } else {
        newSet.add(cellKey);
      }
      return newSet;
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
  
  // Debug logging for rendering issues
  console.log('Master Table Render Debug:');
  console.log('- records.length:', records.length);
  console.log('- filteredRecords.length:', filteredRecords.length);
  console.log('- loading:', loading);
  console.log('- searchTerm:', searchTerm);
  console.log('- filters:', filters);
  console.log('- First 3 records:', records.slice(0, 3));

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && !editingCell) {
        // Find first editable cell and start editing
        const firstRecord = filteredRecords[0];
        if (firstRecord) {
          handleCellEdit(firstRecord.id, 'name', firstRecord.name);
        }
      } else if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        selectAllRows();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredRecords, editingCell]);

  const selectAllRows = () => {
    if (selectedRows.size === filteredRecords.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const handleDeleteRows = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "No Rows Selected",
        description: "Please select rows to delete.",
        variant: "destructive"
      });
      return;
    }

    try {
      const rowsToDelete = Array.from(selectedRows);
      
      const { error } = await supabase
        .from('master')
        .delete()
        .in('id', rowsToDelete);

      if (error) throw error;

      // Update frontend state
      setRecords(current => current.filter(record => !selectedRows.has(record.id)));
      setSelectedRows(new Set());

      toast({
        title: "Rows Deleted",
        description: `Successfully deleted ${rowsToDelete.length} row(s).`,
      });

    } catch (error) {
      console.error('Error deleting rows:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete selected rows.",
        variant: "destructive"
      });
    }
  };

  const handleAddNewRow = async () => {
    try {
      // Generate a unique dedupe_key
      const dedupeKey = `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Direct insert with only required fields to avoid type issues
      const { data, error } = await supabase
        .from('master')
        .insert({
          dedupe_key: dedupeKey,
          name: 'New Contact'
        })
        .select('*')
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
        
      // Reload the entire table to get the new record with proper mapping
      await loadMasterData();
      
      toast({
        title: "New Row Added",
        description: "A new contact record has been created. Click on any cell to edit.",
      });
      
      // Find and start editing the new record
      setTimeout(() => {
        const newRecord = records.find(r => r.dedupe_key === dedupeKey);
        if (newRecord) {
          handleCellEdit(newRecord.id, 'name', 'New Contact');
        }
      }, 500);

    } catch (error) {
      console.error('Error adding new row:', error);
      const errorMsg = error?.message || error?.details || 'Unknown error';
      toast({
        title: "Failed to Add Row",
        description: `Could not create a new contact record: ${errorMsg}`,
        variant: "destructive"
      });
    }
  };



  const renderEditableCell = (record: MasterRecord, field: string, value: any) => {
    const isEditing = editingCell?.id === record.id && editingCell.field === field;
    const cellKey = `${record.id}-${field}`;
    const isMerged = mergedCells.has(cellKey);
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          {field === 'msg' ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-20 text-xs border-2 border-blue-400 focus:border-blue-600 bg-white text-gray-900 placeholder-gray-500"
              style={{ backgroundColor: 'white', color: '#111827' }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-xs border-2 border-blue-400 focus:border-blue-600 bg-white text-gray-900 placeholder-gray-500"
              style={{ backgroundColor: 'white', color: '#111827' }}
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
        className={cn(
          "flex items-center gap-1 group sheets-cell-editable",
          isMerged && "sheets-cell-merged"
        )}
        onClick={() => handleCellEdit(record.id, field, value)}
      >
        <span className="text-xs truncate flex-1 text-gray-900">{value || '-'}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-3 h-3 text-gray-500 hover:text-blue-600" />
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 hover:bg-blue-200"
            onClick={(e) => {
              e.stopPropagation();
              toggleMergeCell(cellKey);
            }}
          >
            {isMerged ? <Split className="w-3 h-3 text-blue-600" /> : <Merge className="w-3 h-3 text-gray-500" />}
          </Button>
        </div>
      </div>
    );
  };

  const renderSortableHeader = (key: keyof MasterRecord, label: string) => (
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

  return (
    <Card className="sheets-table">
      {/* Compact toolbar with search, filters, and add button */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64 sheets-search-input"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="sheets-button"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={loadMasterData} className="sheets-button">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleAddNewRow}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Row
            </Button>
            {selectedRows.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteRows}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedRows.size})
              </Button>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">{filteredRecords.length} records</Badge>
              {filters.length > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {filters.length} filters
                </Badge>
              )}
              {selectedRows.size > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {selectedRows.size} selected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="sheets-filters-panel">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
              <Input
                placeholder="Filter by company..."
                onChange={(e) => handleFilter('company', e.target.value)}
                className="text-xs border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
              <Input
                placeholder="Filter by industry..."
                onChange={(e) => handleFilter('industry', e.target.value)}
                className="text-xs border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <Select onValueChange={(value) => handleFilter('outreach_status', value === 'all' ? '' : value)}>
                <SelectTrigger className="text-xs border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {OUTREACH_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <Input
                placeholder="Filter by location..."
                onChange={(e) => handleFilter('location', e.target.value)}
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
                        checked={selectedRows.size === filteredRecords.length && filteredRecords.length > 0}
                        onCheckedChange={selectAllRows}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('name', 'Name')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('email', 'Email')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('company', 'Company')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('title', 'Title')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('phone', 'Phone')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('linkedin_url', 'LinkedIn')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('channel', 'Channel')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Channel From
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Priority
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Lead Stage
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('msg', 'Message')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('last_action', 'Last Action')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('next_action', 'Next Action Date')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('next_action_status', 'Next Action Status')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('industry', 'Industry')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('location', 'Location')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={16} className="px-3 py-8 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <span className="text-gray-500">Loading master data...</span>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="px-3 py-8 text-center text-gray-500">
                        {records.length === 0 
                          ? "No records found. Upload CSV data to get started."
                          : `No records match current filters. Total records: ${records.length}`
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, index) => (
                      <tr key={record.id} className={cn(
                        "hover:bg-blue-50 transition-colors",
                        selectedRows.has(record.id) && "bg-blue-100",
                        !selectedRows.has(record.id) && index % 2 === 0 && "bg-gray-50",
                        !selectedRows.has(record.id) && index % 2 === 1 && "bg-white"
                      )}>
                        <td className="px-3 py-2 border-r border-gray-200 text-center">
                          <Checkbox 
                            checked={selectedRows.has(record.id)}
                            onCheckedChange={() => toggleRowSelection(record.id)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          {renderEditableCell(record, 'name', record.name)}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          {renderEditableCell(record, 'email', record.email)}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          {renderEditableCell(record, 'company', record.company)}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          {renderEditableCell(record, 'title', record.title)}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          {renderEditableCell(record, 'phone', record.phone)}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          {renderEditableCell(record, 'linkedin_url', record.linkedin_url)}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <span className="text-xs text-gray-700">{record.channel || '-'}</span>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <Select
                            value={record.channel_from || "none"}
                            onValueChange={(value) => handleChannelFromChange(record.id, value === 'none' ? null : value as ChannelType)}
                          >
                            <SelectTrigger 
                              className="w-32 h-9 text-xs border-2 border-gray-300 bg-white text-gray-900 font-medium"
                              style={{ backgroundColor: 'white', color: '#111827' }}
                            >
                              <SelectValue placeholder="Select...">
                                <span className="text-xs font-medium capitalize" style={{ color: '#111827' }}>
                                  {record.channel_from ? CHANNEL_FROM_OPTIONS.find(opt => opt.value === record.channel_from)?.label : 'None'}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent 
                              className="bg-white border border-gray-200 shadow-lg"
                              style={{ backgroundColor: 'white', color: '#111827' }}
                            >
                              <SelectItem value="none" className="bg-white text-gray-900 hover:bg-gray-100 focus:bg-gray-100" style={{ backgroundColor: 'white', color: '#111827' }}>
                                <span>None</span>
                              </SelectItem>
                              {CHANNEL_FROM_OPTIONS.map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value} 
                                  className="bg-white text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                                  style={{ backgroundColor: 'white', color: '#111827' }}
                                >
                                  <span>{option.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <Select
                            value={record.outreach_status}
                            onValueChange={(value) => handleStatusChange(record.id, value as OutreachStatus)}
                          >
                            <SelectTrigger 
                              className="w-44 h-9 text-xs sheets-status-trigger border-2 border-gray-300 whitespace-nowrap"
                              style={{
                                backgroundColor: 'white',
                                color: '#111827'
                              }}
                            >
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", getStatusColor(record.outreach_status))} />
                                  <span className="text-xs text-gray-900 font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                    {getStatusOptionsForChannel(record.channel_from).find(opt => opt.value === record.outreach_status)?.label || 
                                     OUTREACH_STATUS_OPTIONS.find(opt => opt.value === record.outreach_status)?.label}
                                  </span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent 
                              className="sheets-status-dropdown bg-white border border-gray-200 shadow-lg"
                              style={{
                                backgroundColor: 'white',
                                color: '#111827'
                              }}
                            >
                              {getStatusOptionsForChannel(record.channel_from).map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value} 
                                  className="sheets-status-item bg-white text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                                  style={{
                                    backgroundColor: 'white',
                                    color: '#111827'
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", getStatusColor(option.value as OutreachStatus))} />
                                    <span className="text-gray-900 font-medium" style={{ color: '#111827' }}>{option.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <Select
                            value={record.priority}
                            onValueChange={(value) => handlePriorityChange(record.id, value as 'high' | 'medium' | 'low')}
                          >
                            <SelectTrigger 
                              className="w-20 h-9 text-xs border-2 border-gray-300 bg-white text-gray-900 font-medium"
                              style={{ backgroundColor: 'white', color: '#111827' }}
                            >
                              <SelectValue>
                                <div className="flex items-center gap-1">
                                  <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    record.priority === 'high' ? 'bg-red-500' : 
                                    record.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                                  )} />
                                  <span className="text-xs font-medium capitalize" style={{ color: '#111827' }}>
                                    {record.priority}
                                  </span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent 
                              className="bg-white border border-gray-200 shadow-lg"
                              style={{ backgroundColor: 'white', color: '#111827' }}
                            >
                              <SelectItem value="high" className="bg-white text-gray-900 hover:bg-gray-100 focus:bg-gray-100" style={{ backgroundColor: 'white', color: '#111827' }}>
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                                  <span>High</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="medium" className="bg-white text-gray-900 hover:bg-gray-100 focus:bg-gray-100" style={{ backgroundColor: 'white', color: '#111827' }}>
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                                  <span>Medium</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="low" className="bg-white text-gray-900 hover:bg-gray-100 focus:bg-gray-100" style={{ backgroundColor: 'white', color: '#111827' }}>
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                                  <span>Low</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <Select
                            value={record.lead_stage}
                            onValueChange={(value) => handleLeadStageChange(record.id, value as LeadStage)}
                          >
                            <SelectTrigger 
                              className="w-44 h-9 text-xs border-2 border-gray-300 bg-white text-gray-900 font-medium"
                              style={{ backgroundColor: 'white', color: '#111827' }}
                            >
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", getLeadStageColor(record.lead_stage))} />
                                  <span className="text-xs text-gray-900 font-medium" style={{ color: '#111827' }}>
                                    {getLeadStageLabel(record.lead_stage)}
                                  </span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent 
                              className="bg-white border border-gray-200 shadow-lg"
                              style={{ backgroundColor: 'white', color: '#111827' }}
                            >
                              {LEAD_STAGE_OPTIONS.map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value} 
                                  className="bg-white text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                                  style={{ backgroundColor: 'white', color: '#111827' }}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", getLeadStageColor(option.value))} />
                                    <span className="text-gray-900 font-medium" style={{ color: '#111827' }}>{option.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          {record.msg ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-full border border-blue-200">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-blue-700">
                                  MSG-{record.msg.slice(-8).toUpperCase()}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-blue-100 rounded-full transition-colors"
                                onClick={() => {
                                  // Navigate to messages or show message details
                                  console.log('View message:', record.msg);
                                }}
                              >
                                <Eye className="h-3 w-3 text-blue-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              <span className="text-xs">No message</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-xs text-gray-700">
                          {record.last_action ? new Date(record.last_action).toLocaleDateString('en-GB', { 
                            year: '2-digit', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }) : '-'}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <span className="text-xs text-gray-700">
                            {record.next_action ? new Date(record.next_action).toLocaleDateString('en-GB', { 
                              year: '2-digit', 
                              month: '2-digit', 
                              day: '2-digit' 
                            }) : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          <span className="text-xs text-gray-700 bg-blue-50 px-2 py-1 rounded-md">
                            {record.next_action_status || 'No action defined'}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          {renderEditableCell(record, 'industry', record.industry)}
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200 text-gray-900">
                          {renderEditableCell(record, 'location', record.location)}
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
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Ready</span>
          {selectedRows.size > 0 && (
            <span className="text-blue-600 font-medium">
              {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Press F2 to edit cell</span>
          <span>Ctrl+A to select all</span>
        </div>
      </div>
    </Card>
  );
}