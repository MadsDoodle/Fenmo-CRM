import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, Target, RefreshCw, Activity } from "lucide-react";
import { LEAD_STAGE_OPTIONS, getLeadStageColor, getLeadStageLabel, type LeadStage } from "@/lib/status-config";
import { cn } from "@/lib/utils";

interface LeadStageAnalytics {
  stage: LeadStage;
  count: number;
  percentage: number;
}

interface AnalyticsStats {
  totalContacts: number;
  totalMessages: number;
  activeLeads: number;
  conversionRate: number;
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<LeadStageAnalytics[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalContacts: 0,
    totalMessages: 0,
    activeLeads: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get all master table data for comprehensive analytics
      const { data: masterData, error: masterError } = await supabase
        .from('master')
        .select('lead_stage, msg, outreach_status');

      if (masterError) throw masterError;

      // Get messages count
      const { count: messagesCount, error: messagesError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      if (messagesError) console.warn('Messages count error:', messagesError);

      // Count occurrences of each stage
      const stageCounts: Record<LeadStage, number> = {
        'replied': 0,
        'first_call': 0,
        'lead_qualified': 0,
        'move_opportunity_to_crm': 0,
        'not_interested': 0,
        'cold': 0,
        'not_relevant': 0
      };

      let totalWithMessages = 0;
      let activeLeadsCount = 0;

      masterData?.forEach(record => {
        // Count lead stages (handle both old and new enum values)
        let mappedStage: LeadStage | null = null;
        
        if (record.lead_stage) {
          // Map old enum values to new ones for display
          switch (record.lead_stage) {
            case 'new':
              mappedStage = 'cold';
              break;
            case 'qualified':
              mappedStage = 'lead_qualified';
              break;
            case 'proposal':
            case 'negotiation':
            case 'closed_won':
              mappedStage = 'move_opportunity_to_crm';
              break;
            case 'closed_lost':
              mappedStage = 'not_interested';
              break;
            default:
              if (stageCounts.hasOwnProperty(record.lead_stage)) {
                mappedStage = record.lead_stage as LeadStage;
              } else {
                mappedStage = 'cold'; // fallback
              }
          }
        } else {
          mappedStage = 'cold'; // default for null values
        }

        if (mappedStage) {
          stageCounts[mappedStage]++;
        }

        // Count contacts with messages
        if (record.msg) {
          totalWithMessages++;
        }

        // Count active leads (replied, first_call, lead_qualified, move_opportunity_to_crm)
        if (['replied', 'first_call', 'lead_qualified', 'move_opportunity_to_crm'].includes(mappedStage || '')) {
          activeLeadsCount++;
        }
      });

      const totalContacts = masterData?.length || 0;
      const conversionRate = totalContacts > 0 ? (activeLeadsCount / totalContacts) * 100 : 0;

      // Update stats
      setStats({
        totalContacts,
        totalMessages: messagesCount || 0,
        activeLeads: activeLeadsCount,
        conversionRate: Math.round(conversionRate * 10) / 10 // Round to 1 decimal
      });

      // Convert to analytics format with percentages
      const analyticsData: LeadStageAnalytics[] = LEAD_STAGE_OPTIONS.map(option => ({
        stage: option.value,
        count: stageCounts[option.value],
        percentage: totalContacts > 0 ? (stageCounts[option.value] / totalContacts) * 100 : 0
      }));

      setAnalytics(analyticsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    // Set up real-time subscription for master table changes
    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'master'
        }, 
        (payload) => {
          console.log('Master table changed, updating analytics...', payload);
          loadAnalytics(); // Reload analytics when master table changes
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Messages table changed, updating analytics...', payload);
          loadAnalytics(); // Reload when messages change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const maxCount = Math.max(...analytics.map(item => item.count));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Lead Stage Analytics</h1>
            <p className="text-sm text-gray-600">Real-time insights into your lead pipeline</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Users className="w-4 h-4 mr-1" />
          {stats.totalContacts} Total Contacts
        </Badge>
      </div>

      {/* Real-time Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {stats.totalContacts.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              From master table
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Active Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {stats.activeLeads}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {stats.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Messages Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {stats.totalMessages.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Total outreach messages
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Qualified Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {analytics.find(a => a.stage === 'lead_qualified')?.count || 0}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {analytics.find(a => a.stage === 'lead_qualified')?.percentage.toFixed(1) || 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Professional Bar Chart with Axes */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <BarChart3 className="w-5 h-5 text-primary" />
            Lead Stage Distribution
          </CardTitle>
          <p className="text-sm text-muted-foreground">Real-time histogram of contacts by lead stage</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading analytics...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Chart Container with Proper Axes */}
              <div className="relative bg-card border border-border rounded-lg p-8">
                {/* Y-axis */}
                <div className="absolute left-4 top-8 bottom-16 w-px bg-border"></div>
                
                {/* X-axis */}
                <div className="absolute left-4 bottom-16 right-8 h-px bg-border"></div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-8 bottom-16 flex flex-col justify-between text-xs text-muted-foreground">
                  <span>{maxCount}</span>
                  <span>{Math.ceil(maxCount * 0.75)}</span>
                  <span>{Math.ceil(maxCount * 0.5)}</span>
                  <span>{Math.ceil(maxCount * 0.25)}</span>
                  <span>0</span>
                </div>
                
                {/* Chart Area */}
                <div className="ml-8 mr-4 mt-4 mb-20">
                  <div className="flex items-end justify-center gap-6 h-64 relative">
                    {analytics.map((item, index) => (
                      <div key={item.stage} className="flex flex-col items-center group cursor-pointer">
                        {/* Bar */}
                        <div className="relative flex flex-col justify-end h-60 w-12">
                          <div
                            className={cn(
                              "w-full transition-all duration-700 ease-out group-hover:opacity-80",
                              item.stage === 'replied' && "bg-primary",
                              item.stage === 'first_call' && "bg-blue-500",
                              item.stage === 'lead_qualified' && "bg-purple-500", 
                              item.stage === 'move_opportunity_to_crm' && "bg-success",
                              item.stage === 'not_interested' && "bg-destructive",
                              item.stage === 'cold' && "bg-muted-foreground",
                              item.stage === 'not_relevant' && "bg-warning"
                            )}
                            style={{
                              height: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : '2px',
                              minHeight: '2px'
                            }}
                          />
                          
                          {/* Value label on top of bar */}
                          {item.count > 0 && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-card-foreground">
                              {item.count}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-4 left-8 right-4 flex justify-center gap-6">
                  {analytics.map((item) => (
                    <div key={item.stage} className="flex flex-col items-center w-12">
                      <div className="text-xs font-medium text-card-foreground text-center leading-tight">
                        {getLeadStageLabel(item.stage).split(' ').map((word, i) => (
                          <div key={i} className="whitespace-nowrap">{word}</div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Grid lines */}
                <div className="absolute left-4 right-8 top-8 bottom-16 pointer-events-none">
                  {[0.25, 0.5, 0.75].map((ratio) => (
                    <div
                      key={ratio}
                      className="absolute left-0 right-0 h-px bg-border/30"
                      style={{ bottom: `${ratio * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analytics.filter(item => item.count > 0).map((item) => (
                  <div key={item.stage} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div 
                      className={cn(
                        "w-3 h-3 rounded-sm",
                        item.stage === 'replied' && "bg-primary",
                        item.stage === 'first_call' && "bg-blue-500",
                        item.stage === 'lead_qualified' && "bg-purple-500",
                        item.stage === 'move_opportunity_to_crm' && "bg-success",
                        item.stage === 'not_interested' && "bg-destructive",
                        item.stage === 'cold' && "bg-muted-foreground",
                        item.stage === 'not_relevant' && "bg-warning"
                      )}
                    />
                    <div>
                      <div className="text-xs font-medium text-card-foreground">
                        {getLeadStageLabel(item.stage)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.count} contacts ({item.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Real-time updates enabled</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <RefreshCw className="w-3 h-3" />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
