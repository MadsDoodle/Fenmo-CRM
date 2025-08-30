import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, Search, Filter, Download, Upload, Plus, Pencil, Check, X, Eye, Database, RefreshCw, ArrowUpDown, Merge, Split, Trash2, Type, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { OUTREACH_STATUS_OPTIONS, LEAD_STAGE_OPTIONS, CHANNEL_FROM_OPTIONS, updateContactStatus, type OutreachStatus, type ChannelType, type LeadStage, getStatusColor, getLeadStageColor, getLeadStageLabel, getStatusOptionsForChannel, getLeadStageOptionsForChannelAndStatus } from "@/lib/status-config";

interface MasterRecord {
  id: string;
  dedupe_key: string;
  linkedin_url: string | null;
  email: string | null;
  channel: string | null;
  channels: string | null;
  channel_from: ChannelType | null;
  company: string | null;
  name: string;
  phone: string | null;
  website: string | null;
  industry: string | null;
  emp_count: string | null;
  emp_count_raw: string | null;
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
  message_template_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  channel: string;
  status: string;
  is_active: boolean;
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
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<ChannelType | ''>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<OutreachStatus | ''>('');
  const [selectedNextActionFilter, setSelectedNextActionFilter] = useState<
    'all' | 'overdue' | 'today' | 'tomorrow' | 'next_7' | 'next_14' | 'next_30' | 'none'
  >('all');
  const [showFilters, setShowFilters] = useState(false);
  const [mergedCells, setMergedCells] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('small');
  const [bulkStatusValue, setBulkStatusValue] = useState<OutreachStatus | ''>('');
  const [bulkChannelValue, setBulkChannelValue] = useState<ChannelType | ''>('');
  const [bulkLeadStageValue, setBulkLeadStageValue] = useState<LeadStage | ''>('');
  const [showBulkMessageDialog, setShowBulkMessageDialog] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const loadMessageTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setMessageTemplates(data || []);
    } catch (error) {
      console.error('Error loading message templates:', error);
    }
  }, []);

  const getFilteredTemplates = (channel: string | null, status: string | null) => {
    if (!channel || !status) return [];
    
    return messageTemplates.filter(template => {
      const channelMatch = template.channel.toLowerCase() === channel.toLowerCase();
      // Case-insensitive status comparison to handle both 'Requested' and 'requested'
      const statusMatch = template.status.toLowerCase() === status.toLowerCase();
      const isActive = template.is_active;
      
      return isActive && channelMatch && statusMatch;
    });
  };

  const handleTemplateSelect = async (recordId: string, templateId: string) => {
    try {
      // Handle "none" selection by setting to null
      const templateIdToUpdate = templateId === "none" ? null : templateId;
      
      const { error } = await supabase
        .from('master')
        .update({ message_template_id: templateIdToUpdate } as any)
        .eq('id', recordId);

      if (error) throw error;

      // Update local state
      setRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { ...record, message_template_id: templateIdToUpdate }
          : record
      ));

      toast({
        title: "Success",
        description: templateIdToUpdate ? "Message template updated successfully" : "Template selection cleared",
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update message template",
        variant: "destructive",
      });
    }
  };

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
          channels,
          channel_from,
          company,
          name,
          phone,
          website,
          industry,
          emp_count,
          emp_count_raw,
          title,
          location,
          msg,
          last_action_date,
          next_action_date,
          next_action_status,
          outreach_status,
          lead_stage,
          message_template_id,
          created_at,
          updated_at
        `)
        .order('id', { ascending: true });

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
    loadMessageTemplates();

    // Set up real-time subscription for message templates
    const templatesSubscription = supabase
      .channel('message_templates_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'message_templates' },
        () => {
          loadMessageTemplates();
        }
      )
      .subscribe();

    return () => {
      templatesSubscription.unsubscribe();
    };
  }, [loadMasterData, loadMessageTemplates]);



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
      // Reset lead_stage when status changes
      lead_stage: null as any,
      last_action: currentDate
    } : r));

    try {
      const { error } = await supabase
        .from('master')
        .update({ 
          outreach_status: mapStatusForDb(newStatus),
          lead_stage: null, // Reset lead_stage when status changes
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

      // Don't reload - optimistic updates already applied to maintain position

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
      // Reset status and lead_stage when channel changes
      outreach_status: newChannelFrom ? r.outreach_status : null as any,
      lead_stage: newChannelFrom ? r.lead_stage : null as any,
      last_action: currentDate
    } : r));

    try {
      // Check if channel_from column exists by trying to update it
      const updateData: any = {
        channel_from: newChannelFrom,
        last_action_date: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0] // Store as YYYY-MM-DD in IST
      };
      
      // Reset status and lead_stage when channel is cleared
      if (!newChannelFrom) {
        updateData.outreach_status = null;
        updateData.lead_stage = null;
      }
      
      const { error } = await supabase
        .from('master')
        .update(updateData)
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

      // Don't reload - optimistic update already applied to maintain position

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

  const toggleRowSelection = (recordId: string, index: number, event?: React.MouseEvent) => {
    if (event?.shiftKey && lastClickedIndex !== null) {
      // Shift + Click: Select range
      const startIndex = Math.min(lastClickedIndex, index);
      const endIndex = Math.max(lastClickedIndex, index);
      const rangeIds = filteredRecords.slice(startIndex, endIndex + 1).map(r => r.id);
      
      setSelectedRows(current => {
        const newSet = new Set(current);
        rangeIds.forEach(id => newSet.add(id));
        return newSet;
      });
    } else {
      // Normal click: Toggle single row
      setSelectedRows(current => {
        const newSet = new Set(current);
        if (newSet.has(recordId)) {
          newSet.delete(recordId);
        } else {
          newSet.add(recordId);
        }
        return newSet;
      });
    }
    setLastClickedIndex(index);
  };

  const handleMouseDown = (index: number, event: React.MouseEvent) => {
    if (event.shiftKey) return; // Don't start drag on shift+click
    setIsDragging(true);
    setDragStartIndex(index);
    event.preventDefault();
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging && dragStartIndex !== null) {
      const startIndex = Math.min(dragStartIndex, index);
      const endIndex = Math.max(dragStartIndex, index);
      const rangeIds = filteredRecords.slice(startIndex, endIndex + 1).map(r => r.id);
      
      setSelectedRows(new Set(rangeIds));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartIndex(null);
  };

  // Add global mouse up and ESC key listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStartIndex(null);
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedRows.size > 0) {
        setSelectedRows(new Set());
        setBulkStatusValue('');
        setBulkChannelValue('');
        setLastClickedIndex(null);
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedRows.size]);

  // Get unique industry values from records
  const getUniqueIndustries = () => {
    const industries = records
      .map(record => record.industry)
      .filter(industry => industry && industry.trim() !== '')
      .map(industry => industry!.trim());
    
    return Array.from(new Set(industries)).sort();
  };

  // Date utility helpers for Next Action filtering
  const startOfDay = (d: Date) => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };
  const endOfDay = (d: Date) => {
    const dt = new Date(d);
    dt.setHours(23, 59, 59, 999);
    return dt;
  };
  const addDays = (d: Date, days: number) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + days);
    return dt;
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

    // Apply Next Action date filter
    if (selectedNextActionFilter && selectedNextActionFilter !== 'all') {
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const inRange = (dateStr: string | null | undefined, start: Date, end: Date) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d >= start && d <= end;
      };
      filtered = filtered.filter(record => {
        const na = record.next_action as string | null | undefined;
        switch (selectedNextActionFilter) {
          case 'overdue':
            return !!na && new Date(na) < todayStart;
          case 'today':
            return inRange(na, todayStart, todayEnd);
          case 'tomorrow': {
            const tomorrowStart = startOfDay(addDays(today, 1));
            const tomorrowEnd = endOfDay(addDays(today, 1));
            return inRange(na, tomorrowStart, tomorrowEnd);
          }
          case 'next_7': {
            const start = addDays(todayStart, 1);
            const end = endOfDay(addDays(todayStart, 7));
            return inRange(na, start, end);
          }
          case 'next_14': {
            const start = addDays(todayStart, 1);
            const end = endOfDay(addDays(todayStart, 14));
            return inRange(na, start, end);
          }
          case 'next_30': {
            const start = addDays(todayStart, 1);
            const end = endOfDay(addDays(todayStart, 30));
            return inRange(na, start, end);
          }
          case 'none':
            return !na;
          default:
            return true;
        }
      });
    }

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

  const handleBulkStatusUpdate = async () => {
    if (selectedRows.size === 0 || !bulkStatusValue) {
      toast({
        title: "Invalid Selection",
        description: "Please select rows and choose a status.",
        variant: "destructive"
      });
      return;
    }

    try {
      const rowsToUpdate = Array.from(selectedRows);
      const mapStatusForDb = (status: OutreachStatus): any => {
        const extendedClosed: OutreachStatus[] = [
          'closed_won', 'closed_lost', 'qualified', 'proposal_sent', 'meeting_scheduled', 'demo_completed', 'negotiation'
        ];
        return (extendedClosed as string[]).includes(status as string) ? 'closed' : (status as any);
      };

      const { error } = await supabase
        .from('master')
        .update({ 
          outreach_status: mapStatusForDb(bulkStatusValue),
          last_action_date: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0]
        })
        .in('id', rowsToUpdate);

      if (error) throw error;

      // Update frontend state and recompute next actions for each updated row
      const currentDate = new Date().toISOString();
      setRecords(current => current.map(record => 
        selectedRows.has(record.id) 
          ? { ...record, outreach_status: bulkStatusValue, last_action: currentDate }
          : record
      ));

      // Recalculate next_action and next_action_status for each updated record
      try {
        const recalculated = await Promise.all(rowsToUpdate.map(async (id) => {
          const rec = records.find(r => r.id === id);
          const effectiveChannel = rec?.channel_from || rec?.channel || 'linkedin';
          const { data: result, error: calcErr } = await (supabase as any).rpc('calculate_next_action', {
            p_contact_id: id,
            p_custom_days: null,
            p_channel: effectiveChannel
          });
          if (!calcErr && result && result.length > 0) {
            return { id, next_action: result[0].next_action_date, next_action_status: result[0].next_action_status };
          }
          return { id, next_action: null, next_action_status: null };
        }));
        if (recalculated.length > 0) {
          setRecords(current => current.map(r => {
            const found = recalculated.find(x => x.id === r.id);
            return found ? { ...r, next_action: found.next_action, next_action_status: found.next_action_status } : r;
          }));
        }
      } catch (calcErr) {
        console.warn('Bulk next_action calculation failed (non-blocking):', calcErr);
      }
      
      setSelectedRows(new Set());
      setBulkStatusValue('');

      toast({
        title: "Bulk Update Successful",
        description: `Updated status for ${rowsToUpdate.length} record(s).`,
      });

    } catch (error) {
      console.error('Error updating bulk status:', error);
      toast({
        title: "Bulk Update Failed",
        description: "Failed to update selected rows.",
        variant: "destructive"
      });
    }
  };

  const handleBulkChannelUpdate = async () => {
    if (selectedRows.size === 0 || !bulkChannelValue) {
      toast({
        title: "Invalid Selection",
        description: "Please select rows and choose a channel.",
        variant: "destructive"
      });
      return;
    }

    try {
      const rowsToUpdate = Array.from(selectedRows);
      
      const { error } = await supabase
        .from('master')
        .update({ 
          channel_from: bulkChannelValue,
          outreach_status: null, // Reset status when channel changes
          lead_stage: null, // Reset lead stage when channel changes
          last_action_date: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0]
        })
        .in('id', rowsToUpdate);

      if (error) throw error;

      // Update frontend state
      const currentDate = new Date().toISOString();
      setRecords(current => current.map(record => 
        selectedRows.has(record.id) 
          ? { ...record, channel_from: bulkChannelValue, outreach_status: null as any, lead_stage: null as any, last_action: currentDate }
          : record
      ));

      // Recalculate next_action and next_action_status for each updated record based on the new channel
      try {
        const recalculated = await Promise.all(rowsToUpdate.map(async (id) => {
          const effectiveChannel = bulkChannelValue || records.find(r => r.id === id)?.channel || 'linkedin';
          const { data: result, error: calcErr } = await (supabase as any).rpc('calculate_next_action', {
            p_contact_id: id,
            p_custom_days: null,
            p_channel: effectiveChannel
          });
          if (!calcErr && result && result.length > 0) {
            return { id, next_action: result[0].next_action_date, next_action_status: result[0].next_action_status };
          }
          return { id, next_action: null, next_action_status: null };
        }));
        if (recalculated.length > 0) {
          setRecords(current => current.map(r => {
            const found = recalculated.find(x => x.id === r.id);
            return found ? { ...r, next_action: found.next_action, next_action_status: found.next_action_status } : r;
          }));
        }
      } catch (calcErr) {
        console.warn('Bulk next_action calculation after channel change failed (non-blocking):', calcErr);
      }
      
      setSelectedRows(new Set());
      setBulkChannelValue('');

      toast({
        title: "Bulk Channel Update Successful",
        description: `Updated channel for ${rowsToUpdate.length} record(s).`,
      });

    } catch (error) {
      console.error('Error updating bulk channel:', error);
      toast({
        title: "Bulk Update Failed",
        description: "Failed to update selected rows.",
        variant: "destructive"
      });
    }
  };

  const handleCopyValue = (value: string) => {
    setCopiedValue(value);
    navigator.clipboard.writeText(value);
    toast({
      title: "Value Copied",
      description: `Copied "${value}" to clipboard.`,
    });
  };

  const handlePasteValue = async (recordId: string, field: string) => {
    try {
      const { error } = await supabase
        .from('master')
        .update({ [field]: copiedValue })
        .eq('id', recordId);

      if (error) throw error;

      // Update frontend state
      setRecords(current => current.map(record => 
        record.id === recordId 
          ? { ...record, [field]: copiedValue }
          : record
      ));

      toast({
        title: "Value Pasted",
        description: `Pasted "${copiedValue}" to ${field}.`,
      });

    } catch (error) {
      console.error('Error pasting value:', error);
      toast({
        title: "Paste Failed",
        description: "Failed to paste value.",
        variant: "destructive"
      });
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

  const downloadCSV = () => {
    try {
      // Prepare CSV headers
      const csvHeaders = [
        'Name', 'Email', 'Company', 'Title', 'Phone', 'Size', 'LinkedIn', 'Sources', 'Channel From', 'Status', 'Lead Stage',
        'Last Action', 'Next Action', 'Next Action Status', 'Industry', 'Location'
      ];
      
      // Prepare CSV data
      const csvData = filteredRecords.map(record => [
        record.name || '',
        record.email || '',
        record.company || '',
        record.title || '',
        record.phone || '',
        record.emp_count_raw || '',
        record.linkedin_url || '',
        record.channels || '',
        record.channel_from ? CHANNEL_FROM_OPTIONS.find(opt => opt.value === record.channel_from)?.label || record.channel_from : '',
        record.outreach_status ? (getStatusOptionsForChannel(record.channel_from).find(opt => opt.value === record.outreach_status)?.label || OUTREACH_STATUS_OPTIONS.find(opt => opt.value === record.outreach_status)?.label) : '',
        record.lead_stage ? getLeadStageLabel(record.lead_stage) : '',
        record.last_action ? new Date(record.last_action).toLocaleDateString('en-GB') : '',
        record.next_action ? new Date(record.next_action).toLocaleDateString('en-GB') : '',
        record.next_action_status || '',
        record.industry || '',
        record.location || ''
      ]);
      
      // Create CSV content
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `master-table-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Downloaded",
        description: `Downloaded ${filteredRecords.length} records to CSV file.`,
      });
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download CSV file.",
        variant: "destructive"
      });
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedRows.size === 0 || (!bulkStatusValue && !bulkChannelValue)) {
      toast({
        title: "Invalid Selection",
        description: "Please select rows and choose at least a status or channel.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedIds = Array.from(selectedRows);
      const updateData: any = {};
      
      if (bulkStatusValue) updateData.outreach_status = bulkStatusValue;
      if (bulkChannelValue) updateData.channel_from = bulkChannelValue;
      // Set last_action_date when doing a bulk update
      updateData.last_action_date = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('master')
        .update(updateData)
        .in('id', selectedIds);
      
      if (error) throw error;
      
      // Optimistic state update including last_action (ISO)
      const currentDate = new Date().toISOString();
      setRecords(prev => prev.map(record => 
        selectedRows.has(record.id)
          ? { ...record, ...updateData, last_action: currentDate }
          : record
      ));

      // Recalculate next_action and next_action_status for each updated record
      try {
        const recalculated = await Promise.all(selectedIds.map(async (id) => {
          const rec = records.find(r => r.id === id);
          const effectiveChannel = (bulkChannelValue || rec?.channel_from || rec?.channel || 'linkedin');
          const { data: result, error: calcErr } = await (supabase as any).rpc('calculate_next_action', {
            p_contact_id: id,
            p_custom_days: null,
            p_channel: effectiveChannel
          });
          if (!calcErr && result && result.length > 0) {
            return { id, next_action: result[0].next_action_date, next_action_status: result[0].next_action_status };
          }
          return { id, next_action: null, next_action_status: null };
        }));
        if (recalculated.length > 0) {
          setRecords(current => current.map(r => {
            const found = recalculated.find(x => x.id === r.id);
            return found ? { ...r, next_action: found.next_action, next_action_status: found.next_action_status } : r;
          }));
        }
      } catch (calcErr) {
        console.warn('Bulk update next_action calculation failed (non-blocking):', calcErr);
      }
      
      toast({
        title: "Rows Updated",
        description: `Updated ${selectedRows.size} row(s) successfully.`,
      });
      
      setSelectedRows(new Set());
      setBulkStatusValue(null);
      setBulkChannelValue(null);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update selected rows.",
        variant: "destructive",
      });
    }
  };

  const handleAddNewRow = async () => {
    try {
      const dedupeKey = `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('master')
      .insert({
        dedupe_key: dedupeKey,
        name: 'New Contact',
      })
      .select('*')
      .single();

    if (error) throw error;

    const newRecord: MasterRecord = {
      id: data.id,
      dedupe_key: data.dedupe_key,
      linkedin_url: data.linkedin_url || null,
      email: data.email || null,
      channel: data.channel || null,
      channels: (data as any).channels || null,
      channel_from: (data as any).channel_from || null,
      company: data.company || null,
      name: data.name,
      phone: data.phone || null,
      website: data.website || null,
      industry: data.industry || null,
      emp_count: data.emp_count || null,
      emp_count_raw: (data as any).emp_count_raw || null,
      title: data.title || null,
      location: data.location || null,
      msg: data.msg || null,
      last_action: (data as any).last_action_date || null,
      next_action: (data as any).next_action_date || null,
      next_action_status: (data as any).next_action_status || null,
      priority: 'medium' as const,
      custom_followup_days: null,
      outreach_status: (data.outreach_status === 'closed' ? 'closed_won' : data.outreach_status || 'not_contacted') as OutreachStatus,
      lead_stage: ((data as any).lead_stage || null) as LeadStage,
      message_template_id: (data as any).message_template_id || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    setRecords(current => [...current, newRecord]);

    toast({
      title: "New Row Added",
      description: "A new contact record has been created. Click on any cell to edit.",
    });

    setTimeout(() => {
      const created = records.find(r => r.dedupe_key === dedupeKey);
      if (created) {
        handleCellEdit(created.id, 'name', 'New Contact');
      }
    }, 500);

  } catch (error: any) {
    console.error('Error adding new row:', error);
    const errorMsg = error?.message || error?.details || 'Unknown error';
    toast({
      title: "Failed to Add Row",
      description: `Could not create a new contact record: ${errorMsg}`,
      variant: "destructive",
    });
  }
};



  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-xs';
      case 'large': return 'text-base';
      default: return 'text-sm';
    }
  };

  const getRowHeightClass = () => {
    switch (fontSize) {
      case 'small': return 'py-0';
      case 'large': return 'py-0.5';
      default: return 'py-0';
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
              className={cn("h-20 border-2 border-blue-400 focus:border-blue-600 bg-white text-gray-900 placeholder-gray-500", getFontSizeClass())}
              style={{ backgroundColor: 'white', color: '#111827' }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelEdit();
                if (e.ctrlKey && e.key === 'v') {
                  e.preventDefault();
                  navigator.clipboard.readText().then(text => setEditValue(text));
                }
              }}
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={cn("border-2 border-blue-400 focus:border-blue-600 bg-white text-gray-900 placeholder-gray-500", getFontSizeClass())}
              style={{ backgroundColor: 'white', color: '#111827' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
                if (e.ctrlKey && e.key === 'v') {
                  e.preventDefault();
                  navigator.clipboard.readText().then(text => setEditValue(text));
                }
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
        onContextMenu={(e) => {
          e.preventDefault();
          if (value) handleCopyValue(value);
        }}
      >
        <span className={cn("truncate flex-1 text-gray-900", getFontSizeClass())}>{value || '-'}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-3 h-3 text-gray-500 hover:text-blue-600" />
          {value && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 hover:bg-green-200"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyValue(value);
              }}
              title="Copy value"
            >
              <Database className="w-3 h-3 text-green-600" />
            </Button>
          )}
          {copiedValue && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 hover:bg-orange-200"
              onClick={(e) => {
                e.stopPropagation();
                handlePasteValue(record.id, field);
              }}
              title="Paste value"
            >
              <Plus className="w-3 h-3 text-orange-600" />
            </Button>
          )}
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
    <Card className="sheets-table w-full">
      {/* Compact toolbar with search, filters, and add button */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-64 sheets-search-input"
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
            <Button variant="outline" size="sm" onClick={downloadCSV} className="sheets-button">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Select value={fontSize} onValueChange={(value) => setFontSize(value as 'small' | 'medium' | 'large')}>
              <SelectTrigger className="w-32">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    <span className="capitalize">{fontSize}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">
                  <div className="flex items-center gap-2">
                    <Type className="w-3 h-3" />
                    <span>Small</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    <span>Medium</span>
                  </div>
                </SelectItem>
                <SelectItem value="large">
                  <div className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    <span>Large</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleAddNewRow}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Row
            </Button>
            {selectedRows.size > 1 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkUpdate}
                  disabled={!bulkStatusValue && !bulkChannelValue}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Update ({selectedRows.size})
                </Button>
                <div className="flex items-center gap-2">
                  <Select 
                    value={bulkStatusValue} 
                    onValueChange={(value) => setBulkStatusValue(value as OutreachStatus)}
                    disabled={!bulkChannelValue}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Bulk Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {bulkChannelValue && getStatusOptionsForChannel(bulkChannelValue).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={bulkChannelValue} onValueChange={(value) => setBulkChannelValue(value as ChannelType)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Bulk Channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_FROM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowBulkMessageDialog(true)}
                  disabled={!bulkChannelValue || !bulkStatusValue}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Bulk Message ({selectedRows.size})
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteRows}
                  className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedRows.size})
                </Button>
              </>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 w-full sm:w-auto justify-center sm:justify-start">
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
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Industry</label>
              <Select onValueChange={(value) => handleFilter('industry', value === 'all' ? '' : value)}>
                <SelectTrigger className="text-xs border-gray-300 focus:border-blue-500 bg-white text-gray-500">
                  <SelectValue placeholder="All industries" className="text-gray-500" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-60 overflow-y-auto">
                  <SelectItem value="all" className="text-gray-900">All industries</SelectItem>
                  {getUniqueIndustries().map((industry) => (
                    <SelectItem key={industry} value={industry} className="text-gray-900">
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Channel</label>
              <Select onValueChange={(value) => {
                const channelValue = value === 'all' ? '' : value as ChannelType;
                setSelectedChannelFilter(channelValue);
                handleFilter('channel_from', channelValue);
                // Reset status filter when channel changes
                if (channelValue !== selectedChannelFilter) {
                  setSelectedStatusFilter('');
                  handleFilter('outreach_status', '');
                }
              }}>
                <SelectTrigger className="text-xs border-gray-300 focus:border-blue-500 bg-white text-gray-500">
                  <SelectValue placeholder="All channels" className="text-gray-500" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-gray-900">All channels</SelectItem>
                  {CHANNEL_FROM_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
              <Select 
                value={selectedStatusFilter} 
                onValueChange={(value) => {
                  const statusValue = value === 'all' ? '' : value as OutreachStatus;
                  setSelectedStatusFilter(statusValue);
                  handleFilter('outreach_status', statusValue);
                }}
                disabled={!selectedChannelFilter}
              >
                <SelectTrigger className="text-xs border-gray-300 focus:border-blue-500 bg-white text-gray-500">
                  <SelectValue placeholder={selectedChannelFilter ? "All statuses" : "Select channel first"} className="text-gray-500" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-gray-900">All statuses</SelectItem>
                  {selectedChannelFilter && getStatusOptionsForChannel(selectedChannelFilter).map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Lead Stage</label>
              <Select 
                onValueChange={(value) => handleFilter('lead_stage', value === 'all' ? '' : value)}
                disabled={!selectedChannelFilter || !selectedStatusFilter}
              >
                <SelectTrigger className="text-xs border-gray-300 focus:border-blue-500 bg-white text-gray-500">
                  <SelectValue placeholder={selectedChannelFilter && selectedStatusFilter ? "All lead stages" : "Select channel & status first"} className="text-gray-500" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-gray-900">All lead stages</SelectItem>
                  {selectedChannelFilter && selectedStatusFilter && getLeadStageOptionsForChannelAndStatus(selectedChannelFilter, selectedStatusFilter).map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Next Action</label>
              <Select 
                value={selectedNextActionFilter}
                onValueChange={(value) => setSelectedNextActionFilter(value as any)}
              >
                <SelectTrigger className="text-xs border-gray-300 focus:border-blue-500 bg-white text-gray-500">
                  <SelectValue placeholder="All next actions" className="text-gray-500" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-gray-900">All next actions</SelectItem>
                  <SelectItem value="overdue" className="text-gray-900">Overdue</SelectItem>
                  <SelectItem value="today" className="text-gray-900">Today</SelectItem>
                  <SelectItem value="tomorrow" className="text-gray-900">Tomorrow</SelectItem>
                  <SelectItem value="next_7" className="text-gray-900">Next 7 days</SelectItem>
                  <SelectItem value="next_14" className="text-gray-900">Next 14 days</SelectItem>
                  <SelectItem value="next_30" className="text-gray-900">Next 30 days</SelectItem>
                  <SelectItem value="none" className="text-gray-900">No next action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              {/* Ensure selected rows render blue across all cells */}
              <style>{`
                .selected-row > td { background-color: #DBEAFE !important; }
                .selected-row:hover > td { background-color: #BFDBFE !important; }
              `}</style>
              <table className="min-w-full divide-y divide-gray-200 bg-white table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-0.5 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      <Checkbox 
                        checked={selectedRows.size === filteredRecords.length && filteredRecords.length > 0}
                        onCheckedChange={selectAllRows}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('name', 'Name')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('email', 'Email')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('company', 'Company')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('title', 'Title')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('phone', 'Phone')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('emp_count_raw', 'Size')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('linkedin_url', 'LinkedIn')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('channels', 'Sources')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Channel
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Status
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Lead Stage
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('last_action', 'Last Action')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('next_action', 'Next Action')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('next_action_status', 'Next Action Status')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      Message Templates
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('industry', 'Industry')}
                    </th>
                    <th className="px-2 py-0.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                      {renderSortableHeader('location', 'Location')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={100} className="px-2 py-4 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <span className="text-gray-500">Loading master data...</span>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={100} className="px-2 py-4 text-center text-gray-500">
                        {records.length === 0 
                          ? "No records found. Upload CSV data to get started."
                          : `No records match current filters. Total records: ${records.length}`
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, index) => (
                      <tr 
                        key={record.id} 
                        className={cn(
                          "hover:bg-blue-50 transition-colors cursor-pointer",
                          selectedRows.has(record.id) && "bg-blue-100 selected-row",
                          !selectedRows.has(record.id) && index % 2 === 0 && "bg-gray-50",
                          !selectedRows.has(record.id) && index % 2 === 1 && "bg-white",
                          isDragging && "select-none"
                        )}
                        onClick={(e) => {
                          // Only trigger row selection if clicking outside the checkbox column
                          const target = e.target as HTMLElement;
                          if (target.closest('td:first-child')) return; // Don't trigger if clicking checkbox column
                          toggleRowSelection(record.id, index, e);
                        }}
                        onMouseDown={(e) => handleMouseDown(index, e)}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseUp={handleMouseUp}
                      >
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-center", isDragging && "select-none")}>
                          <div 
                            className="flex items-center justify-center h-full w-full cursor-pointer p-1"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(index, e);
                            }}
                            onMouseEnter={() => handleMouseEnter(index)}
                            onMouseUp={(e) => {
                              e.stopPropagation();
                              handleMouseUp();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const isCurrentlySelected = selectedRows.has(record.id);
                              if (e.shiftKey && lastClickedIndex !== null) {
                                // Shift + Click: Select range
                                const startIndex = Math.min(lastClickedIndex, index);
                                const endIndex = Math.max(lastClickedIndex, index);
                                const rangeIds = filteredRecords.slice(startIndex, endIndex + 1).map(r => r.id);
                                
                                setSelectedRows(current => {
                                  const newSet = new Set(current);
                                  rangeIds.forEach(id => newSet.add(id));
                                  return newSet;
                                });
                              } else {
                                // Normal click: Toggle single row
                                setSelectedRows(current => {
                                  const newSet = new Set(current);
                                  if (isCurrentlySelected) {
                                    newSet.delete(record.id);
                                  } else {
                                    newSet.add(record.id);
                                  }
                                  return newSet;
                                });
                              }
                              setLastClickedIndex(index);
                            }}
                          >
                            <Checkbox 
                              checked={selectedRows.has(record.id)}
                              onCheckedChange={() => {}} // Handled by parent div click
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 pointer-events-none"
                            />
                          </div>
                        </td>
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-gray-900")}>
                          {renderEditableCell(record, 'name', record.name)}
                        </td>
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-gray-900")}>
                          {renderEditableCell(record, 'email', record.email)}
                        </td>
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-gray-900")}>
                          {renderEditableCell(record, 'company', record.company)}
                        </td>
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-gray-900")}>
                          {renderEditableCell(record, 'title', record.title)}
                        </td>
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-gray-900")}>
                          {renderEditableCell(record, 'phone', record.phone)}
                        </td>
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-gray-900")}>
                          {renderEditableCell(record, 'emp_count_raw', record.emp_count_raw)}
                        </td>
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-gray-900")}>
                          {record.linkedin_url ? (
                            <a
                              href={(record.linkedin_url.startsWith('http') ? record.linkedin_url : `https://${record.linkedin_url}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn("text-blue-600 hover:underline inline-block max-w-[220px] truncate whitespace-nowrap overflow-hidden text-ellipsis align-middle", getFontSizeClass())}
                              title={record.linkedin_url}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {record.linkedin_url}
                            </a>
                          ) : (
                            <span className={cn("text-gray-400", getFontSizeClass())}>-</span>
                          )}
                        </td>
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-gray-900")}>
                          <span className={cn("text-gray-700", getFontSizeClass())}>{record.channels || '-'}</span>
                        </td>
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-gray-900")}>
                          <Select
                            value={record.channel_from || "none"}
                            onValueChange={(value) => handleChannelFromChange(record.id, value === 'none' ? null : value as ChannelType)}
                          >
                            <SelectTrigger 
                              className={cn("w-28 h-7 border-2 border-gray-300 bg-white text-gray-900 font-medium", getFontSizeClass())}
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
                        <td className="px-2 py-0.5 border-r border-gray-200 text-gray-900">
                          {record.channel_from ? (
                            <Select
                              value={record.outreach_status || ""}
                              onValueChange={(value) => handleStatusChange(record.id, value as OutreachStatus)}
                            >
                              <SelectTrigger 
                                className="w-40 h-7 text-xs sheets-status-trigger border-2 border-gray-300 whitespace-nowrap"
                                style={{
                                  backgroundColor: 'white',
                                  color: '#111827'
                                }}
                              >
                                <SelectValue placeholder="Select status...">
                                  {record.outreach_status ? (
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(record.outreach_status))} />
                                      <span className="text-xs text-gray-900 font-medium whitespace-nowrap" style={{ color: '#111827' }}>
                                        {getStatusOptionsForChannel(record.channel_from).find(opt => opt.value === record.outreach_status)?.label || 
                                         OUTREACH_STATUS_OPTIONS.find(opt => opt.value === record.outreach_status)?.label}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-500">Select status...</span>
                                  )}
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
                          ) : (
                            <span className={cn("text-gray-500 text-xs", getFontSizeClass())}>NULL</span>
                          )}
                        </td>
                        
                        <td className="px-2 py-0.5 border-r border-gray-200 text-gray-900">
                          {record.channel_from && record.outreach_status ? (
                            <Select
                              value={record.lead_stage || ""}
                              onValueChange={(value) => handleLeadStageChange(record.id, value as LeadStage)}
                            >
                              <SelectTrigger 
                                className="w-40 h-7 text-xs border-2 border-gray-300 bg-white text-gray-900 font-medium"
                                style={{ backgroundColor: 'white', color: '#111827' }}
                              >
                                <SelectValue placeholder="Select lead stage...">
                                  {record.lead_stage ? (
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-2 h-2 rounded-full", getLeadStageColor(record.lead_stage))} />
                                      <span className="text-xs text-gray-900 font-medium" style={{ color: '#111827' }}>
                                        {getLeadStageLabel(record.lead_stage)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-500">Select lead stage...</span>
                                  )}
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
                          ) : (
                            <span className={cn("text-gray-500 text-xs", getFontSizeClass())}>
                              NULL
                            </span>
                          )}
                        </td>
                        <td className={cn("px-2 py-0.5 border-r border-gray-200 text-gray-700")}>
                          {record.last_action ? new Date(record.last_action).toLocaleDateString('en-GB', { 
                            year: '2-digit', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }) : '-'}
                        </td>
                        <td className="px-2 py-0.5 border-r border-gray-200 text-gray-900">
                          <span className="text-xs text-gray-700">
                            {record.next_action ? new Date(record.next_action).toLocaleDateString('en-GB', { 
                              year: '2-digit', 
                              month: '2-digit', 
                              day: '2-digit' 
                            }) : '-'}
                          </span>
                        </td>
                        <td className="px-2 py-0.5 border-r border-gray-200 text-gray-900 min-w-[180px]">
                          <span className={cn("text-gray-700 bg-blue-50 px-1 py-0.5 rounded-md whitespace-nowrap text-xs")}>
                            {record.next_action_status || 'No action defined'}
                          </span>
                        </td>
                        <td className="px-2 py-0.5 border-r border-gray-200 text-gray-900 min-w-[200px]">
                          <Select
                            value={record.message_template_id || "none"}
                            onValueChange={(value) => handleTemplateSelect(record.id, value)}
                          >
                            <SelectTrigger className="w-full h-7 bg-white border-gray-200 hover:bg-gray-50 text-xs">
                              <SelectValue placeholder="Select template">
                                {record.message_template_id ? 
                                  messageTemplates.find(t => t.id === record.message_template_id)?.name || "Select template"
                                  : "Select template"
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200 shadow-lg">
                              <SelectItem value="none" className="bg-white hover:bg-gray-50 text-gray-900">No template</SelectItem>
                              {getFilteredTemplates(record.channel_from || record.channel, record.outreach_status).map((template) => (
                                <SelectItem key={template.id} value={template.id} className="bg-white hover:bg-blue-50 text-gray-900 hover:text-gray-900 focus:bg-blue-100 focus:text-gray-900">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">{template.name}</span>
                                    <span className="text-xs text-gray-600 hover:text-gray-700">ID: {template.id.slice(0, 8)}... | {template.subject}</span>
                                  </div>
                                </SelectItem>
              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-0.5 border-r border-gray-200 text-gray-900">
                          {renderEditableCell(record, 'industry', record.industry)}
                        </td>
                        <td className="px-2 py-0.5 border-r border-gray-200 text-gray-900">
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

      {/* Bulk Message Dialog */}
      {showBulkMessageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Message Template
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulkMessageDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Channel:</strong> {bulkChannelValue} | <strong>Status:</strong> {bulkStatusValue} | <strong>Selected Rows:</strong> {selectedRows.size}
              </p>
            </div>

            <div className="space-y-3">
              {getFilteredTemplates(bulkChannelValue, bulkStatusValue)
                .map((template) => (
                  <div 
                    key={template.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={async () => {
                      try {
                        const selectedIds = Array.from(selectedRows);
                        
                        // Update database with channel, status, and template
                        const updateData: any = {
                          message_template_id: template.id,
                          // Ensure last action is set during bulk messaging
                          last_action_date: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0]
                        };
                        
                        if (bulkChannelValue) updateData.channel_from = bulkChannelValue;
                        if (bulkStatusValue) updateData.outreach_status = bulkStatusValue;
                        
                        const { error } = await supabase
                          .from('master')
                          .update(updateData)
                          .in('id', selectedIds);

                        if (error) throw error;

                        // Update local state with last_action and template/channel/status changes
                        const currentDate = new Date().toISOString();
                        setRecords(prev => prev.map(record => 
                          selectedRows.has(record.id) 
                            ? { ...record, ...updateData, last_action: currentDate }
                            : record
                        ));

                        // Recalculate next_action and next_action_status for each selected record
                        try {
                          const recalculated = await Promise.all(selectedIds.map(async (id) => {
                            const rec = records.find(r => r.id === id);
                            const effectiveChannel = (bulkChannelValue || rec?.channel_from || rec?.channel || 'linkedin') as ChannelType;
                            const { data: result, error: calcErr } = await (supabase as any).rpc('calculate_next_action', {
                              p_contact_id: id,
                              p_custom_days: null,
                              p_channel: effectiveChannel
                            });
                            if (!calcErr && result && result.length > 0) {
                              return { id, next_action: result[0].next_action_date, next_action_status: result[0].next_action_status };
                            }
                            return { id, next_action: null, next_action_status: null };
                          }));
                          if (recalculated.length > 0) {
                            setRecords(current => current.map(r => {
                              const found = recalculated.find(x => x.id === r.id);
                              return found ? { ...r, next_action: found.next_action, next_action_status: found.next_action_status } : r;
                            }));
                          }
                        } catch (calcErr) {
                          console.warn('Bulk template next_action calculation failed (non-blocking):', calcErr);
                        }

                        toast({
                          title: "Bulk Update Complete",
                          description: `Updated ${selectedRows.size} contacts with template "${template.name}", channel: ${bulkChannelValue}, status: ${bulkStatusValue}`,
                        });
                        
                        setShowBulkMessageDialog(false);
                        setSelectedRows(new Set());
                        setBulkChannelValue(null);
                        setBulkStatusValue(null);
                      } catch (error) {
                        console.error('Error assigning template:', error);
                        toast({
                          title: "Error",
                          description: "Failed to assign template. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {template.channel}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{template.content}</p>
                  </div>
                ))}
              
              {getFilteredTemplates(bulkChannelValue, bulkStatusValue).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No message templates found for {bulkChannelValue} channel with {bulkStatusValue} status.</p>
                  <p className="text-sm mt-1">Create templates in the Configurations page.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowBulkMessageDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}