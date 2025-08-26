import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function TestFollowup() {
  const [loading, setLoading] = useState(false);

  const testFollowupRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('followup_rules')
        .select('*')
        .order('default_days', { ascending: false });

      if (error) throw error;

      console.log('Followup Rules:', data);
      toast.success(`Loaded ${data?.length || 0} follow-up rules`);
    } catch (error) {
      console.error('Error testing followup rules:', error);
      toast.error('Failed to load follow-up rules');
    } finally {
      setLoading(false);
    }
  };

  const testMasterTableFields = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('master')
        .select('id, name, outreach_status, last_action, next_action, priority, custom_followup_days')
        .limit(5);

      if (error) throw error;

      console.log('Master Table Fields:', data);
      toast.success(`Loaded ${data?.length || 0} master records with new fields`);
    } catch (error) {
      console.error('Error testing master table fields:', error);
      toast.error('Failed to load master table fields');
    } finally {
      setLoading(false);
    }
  };

  const testNotificationSystem = async () => {
    setLoading(true);
    try {
      // Test the manual reminder function
      const { data, error } = await supabase.rpc('trigger_manual_reminders');
      
      if (error) throw error;

      console.log('Manual Reminders Result:', data);
      toast.success('Manual reminders triggered successfully');
    } catch (error) {
      console.error('Error testing notification system:', error);
      toast.error('Failed to test notification system');
    } finally {
      setLoading(false);
    }
  };

  const testCalculateNextAction = async () => {
    setLoading(true);
    try {
      // Get a contact to test with
      const { data: contacts, error: contactsError } = await supabase
        .from('master')
        .select('id, name, outreach_status, last_action, next_action')
        .limit(1);

      if (contactsError) throw contactsError;
      if (!contacts || contacts.length === 0) {
        toast.error('No contacts found to test with');
        return;
      }

      const contact = contacts[0];
      console.log('Testing with contact:', contact);

      // Test the calculate_next_action function
      const { data, error } = await supabase.rpc('calculate_next_action', {
        p_contact_id: contact.id,
        p_custom_days: null
      });

      if (error) throw error;

      console.log('Calculated Next Action:', data);
      toast.success(`Next action calculated: ${data ? new Date(data).toLocaleDateString() : 'No follow-up needed'}`);
    } catch (error) {
      console.error('Error testing calculate next action:', error);
      toast.error('Failed to test calculate next action');
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async () => {
    setLoading(true);
    try {
      // Get a contact to test with
      const { data: contacts, error: contactsError } = await supabase
        .from('master')
        .select('id, name, outreach_status, last_action, next_action')
        .limit(1);

      if (contactsError) throw contactsError;
      if (!contacts || contacts.length === 0) {
        toast.error('No contacts found to test with');
        return;
      }

      const contact = contacts[0];
      const newStatus = contact.outreach_status === 'not_contacted' ? 'contacted' : 'not_contacted';

      // Update the contact status
      const { error } = await supabase
        .from('master')
        .update({ 
          outreach_status: newStatus,
          last_action: new Date().toISOString()
        })
        .eq('id', contact.id);

      if (error) throw error;

      console.log('Updated contact status:', { id: contact.id, oldStatus: contact.outreach_status, newStatus });
      toast.success(`Updated contact status from ${contact.outreach_status} to ${newStatus}`);
    } catch (error) {
      console.error('Error updating contact status:', error);
      toast.error('Failed to update contact status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Follow-up System Test</h1>
        <p className="text-muted-foreground">
          Test the various components of the follow-up system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Rules</CardTitle>
            <CardDescription>
              Test loading the follow-up rules table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testFollowupRules} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Follow-up Rules'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Master Table Fields</CardTitle>
            <CardDescription>
              Test the new fields in the master table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testMasterTableFields} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Master Table Fields'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification System</CardTitle>
            <CardDescription>
              Test the notification system and manual reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testNotificationSystem} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Notification System'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calculate Next Action</CardTitle>
            <CardDescription>
              Test the next action calculation function
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testCalculateNextAction} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Calculate Next Action'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Contact Status</CardTitle>
            <CardDescription>
              Test updating a contact status to trigger next_action calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={updateContactStatus} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Update Contact Status'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">To complete the setup:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Run the database migrations in Supabase</li>
              <li>Set up a cron job in Supabase to run daily reminders</li>
              <li>Test the notification system</li>
              <li>Verify the Scheduling page works correctly</li>
              <li>Check that Tasks page syncs with the new system</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Cron Job Setup:</h4>
            <p className="text-sm text-muted-foreground">
              In your Supabase dashboard, go to Database → Functions → Cron Jobs and add:
            </p>
            <code className="block bg-gray-100 p-2 rounded text-sm mt-2">
              Schedule: 0 9 * * * (every day at 9 AM)<br/>
              Function: SELECT public.generate_daily_reminders();
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
