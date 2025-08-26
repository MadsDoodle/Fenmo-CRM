import React, { useState } from "react";
import { 
  BookOpen, 
  MessageCircle, 
  HelpCircle, 
  Database, 
  BarChart3, 
  Users, 
  CheckSquare, 
  Calendar, 
  Upload, 
  Target,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HelpPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-soft">
            <HelpCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Help & Documentation</h1>
            <p className="text-sm text-muted-foreground">Complete guide to using OutreachCRM effectively</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          <Target className="w-4 h-4 mr-1" />
          OutreachCRM v2.0
        </Badge>
      </div>

      {/* Quick Start Guide */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <BookOpen className="w-5 h-5 text-primary" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">1</div>
                <div>
                  <h3 className="font-medium text-card-foreground">Import Contacts</h3>
                  <p className="text-xs text-muted-foreground">Upload CSV or add contacts manually</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">2</div>
                <div>
                  <h3 className="font-medium text-card-foreground">Manage Lead Stages</h3>
                  <p className="text-xs text-muted-foreground">Track prospects through your pipeline</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">3</div>
                <div>
                  <h3 className="font-medium text-card-foreground">Send Messages</h3>
                  <p className="text-xs text-muted-foreground">Create outreach campaigns</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">4</div>
                <div>
                  <h3 className="font-medium text-card-foreground">Track Analytics</h3>
                  <p className="text-xs text-muted-foreground">Monitor your pipeline performance</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Master Table Guide */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Database className="w-5 h-5 text-primary" />
              Master Table
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• <strong className="text-card-foreground">Import CSV:</strong> Upload contact lists with columns for name, email, phone, company</p>
              <p>• <strong className="text-card-foreground">Lead Stages:</strong> Set stages like Replied, First Call, Lead Qualified, etc.</p>
              <p>• <strong className="text-card-foreground">Edit Inline:</strong> Click any cell to edit contact information directly</p>
              <p>• <strong className="text-card-foreground">Bulk Actions:</strong> Select multiple contacts for batch operations</p>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Guide */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <BarChart3 className="w-5 h-5 text-primary" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• <strong className="text-card-foreground">Real-time Data:</strong> Live updates from your master table</p>
              <p>• <strong className="text-card-foreground">Lead Distribution:</strong> Visual breakdown by lead stage</p>
              <p>• <strong className="text-card-foreground">Conversion Rates:</strong> Track active leads vs total contacts</p>
              <p>• <strong className="text-card-foreground">Pipeline Health:</strong> Monitor qualified leads and opportunities</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive FAQ Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Management */}
          <div className="border border-border/50 rounded-lg">
            <button
              onClick={() => toggleSection('contacts')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium text-card-foreground">Contact Management</span>
              </div>
              {expandedSection === 'contacts' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSection === 'contacts' && (
              <div className="px-4 pb-4 space-y-3 text-sm text-muted-foreground">
                <div>
                  <strong className="text-card-foreground">Q: How do I import contacts from CSV?</strong>
                  <p>A: Go to Master Table → Upload CSV button → Select your file with columns: name, email, phone, company, lead_stage</p>
                </div>
                <div>
                  <strong className="text-card-foreground">Q: Can I edit contact information directly?</strong>
                  <p>A: Yes! Click any cell in the Master Table to edit inline. Changes save automatically.</p>
                </div>
                <div>
                  <strong className="text-card-foreground">Q: How do I delete contacts?</strong>
                  <p>A: Select contacts using checkboxes, then use the bulk actions menu to delete selected contacts.</p>
                </div>
              </div>
            )}
          </div>

          {/* Lead Stages */}
          <div className="border border-border/50 rounded-lg">
            <button
              onClick={() => toggleSection('leads')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-medium text-card-foreground">Lead Stages & Pipeline</span>
              </div>
              {expandedSection === 'leads' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSection === 'leads' && (
              <div className="px-4 pb-4 space-y-3 text-sm text-muted-foreground">
                <div>
                  <strong className="text-card-foreground">Q: What are the available lead stages?</strong>
                  <p>A: Replied, First Call, Lead Qualified, Move Opportunity to CRM, Not Interested, Cold, Not Relevant</p>
                </div>
                <div>
                  <strong className="text-card-foreground">Q: How do I change a contact's lead stage?</strong>
                  <p>A: Click the Lead Stage dropdown in the Master Table and select the new stage. Changes sync in real-time.</p>
                </div>
                <div>
                  <strong className="text-card-foreground">Q: How do I track conversion rates?</strong>
                  <p>A: Visit the Analytics page to see real-time conversion rates and lead stage distribution.</p>
                </div>
              </div>
            )}
          </div>

          {/* Messaging & Tasks */}
          <div className="border border-border/50 rounded-lg">
            <button
              onClick={() => toggleSection('messaging')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="font-medium text-card-foreground">Messaging & Tasks</span>
              </div>
              {expandedSection === 'messaging' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSection === 'messaging' && (
              <div className="px-4 pb-4 space-y-3 text-sm text-muted-foreground">
                <div>
                  <strong className="text-card-foreground">Q: How do I send messages to contacts?</strong>
                  <p>A: Use the Messaging page to create and send personalized messages to your contacts.</p>
                </div>
                <div>
                  <strong className="text-card-foreground">Q: Can I schedule follow-up tasks?</strong>
                  <p>A: Yes! Go to Tasks page to create scheduled follow-ups and reminders for your contacts.</p>
                </div>
                <div>
                  <strong className="text-card-foreground">Q: How do I track message responses?</strong>
                  <p>A: Message responses are tracked automatically and update lead stages accordingly.</p>
                </div>
              </div>
            )}
          </div>

          {/* Analytics & Reporting */}
          <div className="border border-border/50 rounded-lg">
            <button
              onClick={() => toggleSection('analytics')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="font-medium text-card-foreground">Analytics & Reporting</span>
              </div>
              {expandedSection === 'analytics' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSection === 'analytics' && (
              <div className="px-4 pb-4 space-y-3 text-sm text-muted-foreground">
                <div>
                  <strong className="text-card-foreground">Q: How often does analytics data update?</strong>
                  <p>A: Analytics update in real-time as you make changes to contacts and lead stages in the Master Table.</p>
                </div>
                <div>
                  <strong className="text-card-foreground">Q: What metrics can I track?</strong>
                  <p>A: Total contacts, active leads, conversion rates, lead stage distribution, and qualified leads.</p>
                </div>
                <div>
                  <strong className="text-card-foreground">Q: Can I export analytics data?</strong>
                  <p>A: Currently, you can view real-time analytics. Export functionality is planned for future updates.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <MessageCircle className="w-5 h-5 text-primary" />
            Need More Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium text-card-foreground">Email Support</h3>
                <p className="text-sm text-muted-foreground">madhavbaidyaiitbhu@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-medium text-card-foreground">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Available 9 AM - 6 PM EST</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
