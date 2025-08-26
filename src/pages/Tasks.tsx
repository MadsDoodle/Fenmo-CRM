import { useState, useEffect, useMemo } from "react";
import type React from "react";
import { Plus, CheckCircle, Users, MessageSquare, Linkedin, Mail, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  getStatusLabel, 
  getStatusColor,
  type OutreachStatus, 
  type ChannelType,
  updateContactStatus,
  getStatusOptionsForChannel,
  LINKEDIN_STATUS_SEQUENCE,
  EMAIL_STATUS_SEQUENCE,
  DEFAULT_STATUS_SEQUENCE
} from "@/lib/status-config";

interface TaskRecord {
  id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  master?: {
    id: string;
    name: string;
    company: string | null;
    outreach_status: OutreachStatus | null;
    channel_from: ChannelType | null;
    channel: ChannelType | null;
  } | null;
}

const CHANNEL_ICONS = {
  linkedin: Linkedin,
  email: Mail,
  phone: Phone,
  sms: MessageCircle,
  whatsapp: MessageSquare
};

const CHANNEL_LABELS = {
  linkedin: 'LinkedIn',
  email: 'Email', 
  phone: 'Phone',
  sms: 'SMS',
  whatsapp: 'WhatsApp'
};

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<ChannelType>('linkedin');
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, master:contact_id (id, name, company, outreach_status, channel_from, channel)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data as any as TaskRecord[]) || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks from backend",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const backfillTasksFromMaster = async () => {
    try {
      const [{ data: masters, error: mErr }, { data: taskRows, error: tErr }] = await Promise.all([
        supabase.from('master').select('id, outreach_status, name, company, channel_from, channel'),
        supabase.from('tasks').select('contact_id')
      ]);
      if (mErr) throw mErr;
      if (tErr) throw tErr;

      const existing = new Set((taskRows || []).map((t: any) => t.contact_id).filter(Boolean));
      const toCreate = (masters || []).filter((m: any) => !existing.has(m.id)).map((m: any) => ({
        contact_id: m.id,
        title: 'Outreach Task',
        description: 'Track outreach and next steps',
        status: 'todo',
        priority: 'medium'
      }));

      if (toCreate.length === 0) {
        toast({ title: 'Backfill', description: 'All contacts already have tasks.' });
        return;
      }

      const { error } = await supabase.from('tasks').insert(toCreate);
      if (error) throw error;

      toast({ title: 'Backfill complete', description: `Created ${toCreate.length} task(s).` });
      loadTasks();
    } catch (err) {
      console.error('Backfill failed:', err);
      toast({ title: 'Backfill failed', description: 'Could not backfill tasks from master.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadTasks();

    const channel = supabase
      .channel('tasks-board-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadTasks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master' }, () => loadTasks())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get status sequence for the active channel
  const getStatusSequenceForChannel = (channel: ChannelType): OutreachStatus[] => {
    switch (channel) {
      case 'linkedin':
        return LINKEDIN_STATUS_SEQUENCE;
      case 'email':
        return EMAIL_STATUS_SEQUENCE;
      default:
        return DEFAULT_STATUS_SEQUENCE;
    }
  };

  // Group tasks by channel and then by status
  const groupedByChannelAndStatus = useMemo(() => {
    const channelGroups: Record<ChannelType, Record<string, TaskRecord[]>> = {
      linkedin: {},
      email: {},
      phone: {},
      sms: {},
      whatsapp: {}
    };

    // Initialize status groups for each channel
    Object.keys(channelGroups).forEach(channel => {
      const statusSequence = getStatusSequenceForChannel(channel as ChannelType);
      statusSequence.forEach(status => {
        channelGroups[channel as ChannelType][status] = [];
      });
    });

    // Group tasks
    tasks.forEach(task => {
      const effectiveChannel = task.master?.channel_from || task.master?.channel || 'linkedin';
      const status = task.master?.outreach_status || 'not_contacted';
      
      if (channelGroups[effectiveChannel] && channelGroups[effectiveChannel][status]) {
        channelGroups[effectiveChannel][status].push(task);
      }
    });

    return channelGroups;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: OutreachStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.contact_id) return;

    const prevStatus = task.master?.outreach_status || 'not_contacted';
    if (prevStatus === newStatus) return;

    try {
      await updateContactStatus(task.contact_id, newStatus, { updateLastActionDate: true });
      toast({ title: 'Status Updated', description: `Moved task to ${getStatusLabel(newStatus)}` });
      loadTasks(); // Reload to get updated data
    } catch (err) {
      console.error('Failed to move task:', err);
      toast({ title: 'Update failed', description: 'Could not update task status. Please try again.', variant: 'destructive' });
    }
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const currentChannelTasks = groupedByChannelAndStatus[activeChannel];
  const statusSequence = getStatusSequenceForChannel(activeChannel);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Channel-specific Kanban boards - Drag tasks between stages</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border/40" onClick={loadTasks}>Refresh</Button>
          <Button variant="outline" className="border-border/40" onClick={backfillTasksFromMaster}>Backfill from Master</Button>
          <Button className="bg-gradient-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> New Task
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-card border-border/40">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-3xl font-bold text-foreground">{totalTasks}</p>
              <p className="text-xs text-muted-foreground mt-1">Synced with backend</p>
            </div>
            <Users className="w-12 h-12 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeChannel} onValueChange={(value) => setActiveChannel(value as ChannelType)}>
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(CHANNEL_LABELS).map(([channel, label]) => {
            const Icon = CHANNEL_ICONS[channel as ChannelType];
            return (
              <TabsTrigger key={channel} value={channel} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(CHANNEL_LABELS).map(([channel]) => (
          <TabsContent key={channel} value={channel} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {statusSequence.map((status) => (
                <StatusColumn
                  key={status}
                  status={status}
                  tasks={currentChannelTasks[status] || []}
                  onDragOver={allowDrop}
                  onDrop={(e) => handleDrop(e, status)}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function StatusColumn({
  status,
  tasks,
  onDragOver,
  onDrop,
  onDragStart
}: {
  status: OutreachStatus;
  tasks: TaskRecord[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}) {
  const niceLabel = getStatusLabel(status);
  const headerBadgeClass = getStatusColor(status);

  return (
    <Card className="bg-gradient-card border-border/40" onDragOver={onDragOver} onDrop={onDrop}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <span>{niceLabel}</span>
          <Badge variant="outline" className={headerBadgeClass}>{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 min-h-24">
          {tasks.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">No tasks</div>
          ) : (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task, onDragStart }: { task: TaskRecord; onDragStart: (e: React.DragEvent, taskId: string) => void }) {
  const contactName = task.master?.name || 'Unknown';
  const contactCompany = task.master?.company || '';
  const currentStatus = task.master?.outreach_status;
  
  return (
    <Card 
      draggable 
      onDragStart={(e) => onDragStart(e, task.id)} 
      className="border-border/40 hover:shadow-soft transition-all duration-200 cursor-move"
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground line-clamp-1">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">{contactName}{contactCompany ? ` • ${contactCompany}` : ''}</p>
              {currentStatus && (
                <Badge variant="outline" className={`text-xs ${getStatusColor(currentStatus)}`}>
                  {getStatusLabel(currentStatus)}
                </Badge>
              )}
            </div>
          </div>
          {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-400 ml-2" />}
        </div>
      </CardContent>
    </Card>
  );
}