import { useState, useEffect } from "react";
import { Plus, Database, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { TemplateForm } from "@/components/ui/template-form";
import { MessageTable } from "@/components/ui/message-table";
import { FollowupRulesTable } from "@/components/ui/followup-rules-table";
import { MessageTemplatesTable } from "@/components/ui/message-templates-table";

interface Template {
  id: string;
  name: string;
  subject: string | null;
  content: string;
  channel: string;
  status: string;
  usage_count: number;
}


function Messaging() {
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showMessageTable, setShowMessageTable] = useState(false);
  const [showFollowupRules, setShowFollowupRules] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
    
    // Handle URL parameters for Quick Actions navigation
    const view = searchParams.get('view');
    const action = searchParams.get('action');
    
    if (view === 'followup-rules') {
      setShowFollowupRules(true);
      setShowMessageTable(false);
    } else if (action === 'new-template') {
      setShowTemplateForm(true);
      setEditingTemplate(null);
    }
  }, [searchParams]);

  const setupRealtimeSubscriptions = () => {
    // Minimal setup for template form functionality
    const templatesSubscription = supabase
      .channel('message_templates_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_templates'
        },
        () => {
          // Templates are handled by MessageTemplatesTable component
        }
      )
      .subscribe();

    return () => {
      templatesSubscription.unsubscribe();
    };
  };

  const loadData = async () => {
    // Data loading is handled by individual table components
  };




  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your outreach configurations, templates, and follow-up rules
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(showMessageTable || showFollowupRules) && (
            <Button 
              variant="outline"
              onClick={() => {
                setShowMessageTable(false);
                setShowFollowupRules(false);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          )}
          <Button 
            className="bg-gradient-primary hover:bg-primary/90"
            onClick={() => {
              setEditingTemplate(null);
              setShowTemplateForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Button 
          className="bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md border border-white/30 hover:bg-white/30 text-gray-800 shadow-lg"
          onClick={() => {
            setShowMessageTable(!showMessageTable);
            setShowFollowupRules(false);
          }}
        >
          <Database className="w-4 h-4 mr-2" />
          Message Table
        </Button>
        <Button 
          className="bg-gradient-to-r from-blue-500/20 to-blue-500/10 backdrop-blur-md border border-blue-500/30 hover:bg-blue-500/30 text-gray-800 shadow-lg"
          onClick={() => {
            setShowFollowupRules(!showFollowupRules);
            setShowMessageTable(false);
          }}
        >
          <Database className="w-4 h-4 mr-2" />
          Follow up Rules
        </Button>
      </div>

      {showMessageTable ? (
        <MessageTable />
      ) : showFollowupRules ? (
        <FollowupRulesTable />
      ) : (
        <MessageTemplatesTable />
      )}

      <TemplateForm
        isOpen={showTemplateForm}
        onClose={() => {
          setShowTemplateForm(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSuccess={() => {
          setShowTemplateForm(false);
          setEditingTemplate(null);
          loadData();
        }}
      />
    </div>
  );
}

export default Messaging;