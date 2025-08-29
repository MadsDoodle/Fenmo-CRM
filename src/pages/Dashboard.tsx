import { useState, useEffect } from "react";
import { Users, MessageSquare, Clock, Target, Plus, Upload, FileText, Send, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { KPICard } from "@/components/ui/kpi-card";
import { CSVDropZone } from "@/components/ui/csv-drop-zone";
import { CSVProcessor } from "@/components/ui/csv-processor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CSVData {
  headers: string[];
  rows: any[][];
  fileName: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [kpiData, setKpiData] = useState([
    { title: "Total Contacts", value: "0", change: "No data yet", changeType: "neutral" as const, icon: Users },
    { title: "Pending Follow-ups", value: "0", change: "No data yet", changeType: "neutral" as const, icon: Clock },
    { title: "Messages Sent Today", value: "0", change: "No data yet", changeType: "neutral" as const, icon: MessageSquare },
    { title: "Active Tasks", value: "0", change: "No data yet", changeType: "neutral" as const, icon: Target },
  ]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingFollowups, setUpcomingFollowups] = useState<any[]>([]);

  const loadDashboardData = async () => {
    try {
      // Load total contacts from master table
      const { count: contactCount } = await supabase
        .from('master')
        .select('*', { count: 'exact', head: true });

      // Load not contacted leads
      const { count: notContactedCount } = await supabase
        .from('master')
        .select('*', { count: 'exact', head: true })
        .eq('outreach_status', 'not_contacted');

      // Load recent messages
      const { data: recentMessages, count: todayMessages } = await supabase
        .from('messages')
        .select('*, master(name)', { count: 'exact' })
        .gte('created_at', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(4);

      // Load leads needing follow-up (next_action_date is today or past)
      const { data: followups } = await supabase
        .from('master')
        .select('*')
        .not('next_action_date', 'is', null)
        .lte('next_action_date', new Date().toISOString().split('T')[0])
        .neq('outreach_status', 'closed')
        .order('next_action_date', { ascending: true })
        .limit(3);

      // Update KPIs
      setKpiData([
        { title: "Total Contacts", value: contactCount?.toString() || "0", change: "From master table", changeType: "neutral" as const, icon: Users },
        { title: "Not Contacted", value: notContactedCount?.toString() || "0", change: "Leads to approach", changeType: "neutral" as const, icon: Clock },
        { title: "Messages Sent Today", value: todayMessages?.toString() || "0", change: "Today's outreach", changeType: "neutral" as const, icon: MessageSquare },
        { title: "Need Follow-up", value: followups?.length.toString() || "0", change: "Due today or overdue", changeType: "neutral" as const, icon: Target },
      ]);

      // Format recent message activities
      if (recentMessages) {
        setRecentActivities(recentMessages.map(message => ({
          id: message.id,
          type: 'message',
          description: `Message sent to ${message.master?.name || 'Unknown'} via ${message.channel}`,
          timestamp: new Date(message.created_at).toLocaleString(),
          status: message.status
        })));
      }

      // Load recent activities (status changes)
      const { data: activitiesData } = await supabase
        .from('activities')
        .select('*, master(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (activitiesData && activitiesData.length > 0) {
        const formatted = activitiesData.map((a: any) => ({
          id: a.id,
          type: a.type,
          description: a.master?.name ? 
            `${a.master.name}'s ${a.description || `status changed to ${a.to_status}`}` : 
            a.description || `Status changed to ${a.to_status}`,
          timestamp: new Date(a.created_at).toLocaleString(),
          status: 'completed'
        }));
        // Merge with message activities and sort by time
        setRecentActivities(prev => {
          const merged = [...formatted, ...prev];
          return merged.sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime()).slice(0, 5);
        });
      }

      // Format follow-ups
      if (followups) {
        setUpcomingFollowups(followups.map(lead => ({
          id: lead.id,
          contact: lead.name || 'Unknown',
          action: `Follow up via ${lead.channel}`,
          time: lead.next_action_date ? new Date(lead.next_action_date).toLocaleDateString() : 'No date',
          priority: lead.outreach_status === 'contacted' ? 'high' : 'medium'
        })));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Realtime updates for activities
    const activitiesChannel = supabase
      .channel('dashboard-activities')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload: any) => {
        const a: any = payload.new;
        if (!a) return;
        const activity = {
          id: a.id,
          type: a.type,
          description: a.description || `Status changed to ${a.to_status}`,
          timestamp: new Date(a.created_at).toLocaleString(),
          status: 'completed'
        };
        setRecentActivities(prev => [activity, ...prev].slice(0, 5));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(activitiesChannel);
    };
  }, []);

  const handleCSVParsed = (data: CSVData) => {
    setCsvData(data);
  };

  const handleDataProcessed = () => {
    loadDashboardData(); // Refresh dashboard data
  };

  const handleRemoveFile = () => {
    setCsvData(null);
  };
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your outreach.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Last updated</p>
          <p className="text-sm font-medium">
            {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={kpi.title} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <KPICard {...kpi} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Upload Section */}
        <div className="lg:col-span-2">
          {!csvData ? (
            <CSVDropZone 
              onCSVParsed={handleCSVParsed}
              className="mb-6"
            />
          ) : (
            <CSVProcessor
              csvData={csvData}
              onRemoveFile={handleRemoveFile}
              onDataProcessed={handleDataProcessed}
            />
          )}
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-card border-border/40 shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start bg-gradient-primary hover:bg-primary/90 shadow-soft hover:shadow-glow transition-all duration-300"
              onClick={() => navigate('/master-table')}
            >
              <Database className="w-4 h-4 mr-2" />
              Open Master Table
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-border/40 hover:bg-accent/50 hover:border-primary/40 transition-all duration-300"
              onClick={() => navigate('/messaging?view=followup-rules')}
            >
              <Target className="w-4 h-4 mr-2" />
              Follow up Rules Table
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-border/40 hover:bg-accent/50 hover:border-primary/40 transition-all duration-300"
              onClick={() => navigate('/messaging?action=new-template')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Message Template
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gradient-card border-border/40 shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-success" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent hover:scrollbar-thumb-border/60 transition-all duration-300 pr-2">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivities.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-all duration-200"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      activity.status === 'completed' ? 'bg-success animate-pulse' : 'bg-warning animate-pulse'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Upcoming Follow-ups - Full Width */}
      <Card className="bg-gradient-card border-border/40 shadow-elegant hover:shadow-glow transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-warning" />
            </div>
            Upcoming Follow-ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingFollowups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming follow-ups</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
              {upcomingFollowups.map((followup, index) => (
                <Card 
                  key={followup.id} 
                  className="min-w-[280px] flex-shrink-0 bg-gradient-to-br from-card to-card/80 border-border/40 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 border-2 border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                          {followup.contact.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {followup.contact}
                          </h4>
                          <Badge 
                            variant={followup.priority === 'high' ? 'destructive' : 
                                     followup.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs ml-2 flex-shrink-0"
                          >
                            {followup.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {followup.action}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
                          <p className="text-xs font-medium text-warning">
                            Due: {followup.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}