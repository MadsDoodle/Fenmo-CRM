import { supabase } from "@/integrations/supabase/client";

// Define the possible outreach status values
export type OutreachStatus = 
  | 'not_contacted'
  | 'contacted' 
  | 'replied'
  | 'interested'
  | 'not_interested'
  | 'closed_won'
  | 'follow_up'
  | 'qualified'
  | 'proposal_sent'
  | 'meeting_scheduled'
  | 'demo_completed'
  | 'negotiation'
  | 'closed_lost'
  | 'requested'
  | 'accepted'
  | 'intro_msg'
  | 'follow_up_1'
  | 'newsletter_1'
  | 'value_prop'
  | 'hold_thread'
  | 'newsletter_2'
  | 'follow_up_2'
  | 'email_sequence';

// Define channel types
export type ChannelType = 'linkedin' | 'email' | 'phone' | 'sms' | 'whatsapp';

// Define lead stage types
export type LeadStage = 
  | 'replied'
  | 'first_call'
  | 'lead_qualified'
  | 'move_opportunity_to_crm'
  | 'not_interested'
  | 'cold'
  | 'not_relevant';

// Define lead stage options for dropdowns
export const LEAD_STAGE_OPTIONS = [
  { value: 'replied' as LeadStage, label: 'Replied' },
  { value: 'first_call' as LeadStage, label: 'First Call' },
  { value: 'lead_qualified' as LeadStage, label: 'Lead Qualified' },
  { value: 'move_opportunity_to_crm' as LeadStage, label: 'Move Opportunity to CRM' },
  { value: 'not_interested' as LeadStage, label: 'Not Interested' },
  { value: 'cold' as LeadStage, label: 'Cold' },
  { value: 'not_relevant' as LeadStage, label: 'Not Relevant' }
];

// Define the outreach status options for dropdowns
export const OUTREACH_STATUS_OPTIONS = [
  { value: 'not_contacted' as OutreachStatus, label: 'Not Contacted' },
  { value: 'contacted' as OutreachStatus, label: 'Contacted' },
  { value: 'replied' as OutreachStatus, label: 'Replied' },
  { value: 'interested' as OutreachStatus, label: 'Interested' },
  { value: 'not_interested' as OutreachStatus, label: 'Not Interested' },
  { value: 'follow_up' as OutreachStatus, label: 'Follow Up' },
  { value: 'qualified' as OutreachStatus, label: 'Qualified' },
  { value: 'proposal_sent' as OutreachStatus, label: 'Proposal Sent' },
  { value: 'meeting_scheduled' as OutreachStatus, label: 'Meeting Scheduled' },
  { value: 'demo_completed' as OutreachStatus, label: 'Demo Completed' },
  { value: 'negotiation' as OutreachStatus, label: 'Negotiation' },
  { value: 'closed_won' as OutreachStatus, label: 'Closed Won' },
  { value: 'closed_lost' as OutreachStatus, label: 'Closed Lost' },
  { value: 'requested' as OutreachStatus, label: 'Requested' },
  { value: 'accepted' as OutreachStatus, label: 'Accepted' },
  { value: 'intro_msg' as OutreachStatus, label: 'Intro Msg' },
  { value: 'follow_up_1' as OutreachStatus, label: 'Follow Up 1' },
  { value: 'newsletter_1' as OutreachStatus, label: 'Newsletter 1' },
  { value: 'value_prop' as OutreachStatus, label: 'Value Prop' },
  { value: 'hold_thread' as OutreachStatus, label: 'Hold Thread' },
  { value: 'newsletter_2' as OutreachStatus, label: 'Newsletter 2' },
  { value: 'follow_up_2' as OutreachStatus, label: 'Follow Up 2' },
  { value: 'email_sequence' as OutreachStatus, label: 'Email Sequence' }
];

// Channel-specific status sequences
export const LINKEDIN_STATUS_SEQUENCE: OutreachStatus[] = [
  'requested',
  'accepted', 
  'intro_msg',
  'follow_up_1',
  'newsletter_1',
  'value_prop',
  'hold_thread',
  'newsletter_2',
  'follow_up_2',
  'email_sequence'
];

export const EMAIL_STATUS_SEQUENCE: OutreachStatus[] = [
  'email_sequence',
  'requested',
  'accepted',
  'intro_msg',
  'follow_up_1',
  'newsletter_1',
  'value_prop',
  'hold_thread',
  'newsletter_2',
  'follow_up_2'
];

export const DEFAULT_STATUS_SEQUENCE: OutreachStatus[] = [
  'not_contacted',
  'contacted',
  'replied',
  'interested',
  'not_interested',
  'follow_up',
  'qualified',
  'proposal_sent',
  'meeting_scheduled',
  'demo_completed',
  'negotiation',
  'closed_won',
  'closed_lost'
];

// Channel from options
export const CHANNEL_FROM_OPTIONS = [
  { value: 'email' as ChannelType, label: 'Email' },
  { value: 'linkedin' as ChannelType, label: 'LinkedIn' },
  { value: 'phone' as ChannelType, label: 'Phone' },
  { value: 'sms' as ChannelType, label: 'SMS' },
  { value: 'whatsapp' as ChannelType, label: 'WhatsApp' }
];

// Function to get status options based on channel_from
export const getStatusOptionsForChannel = (channelFrom: ChannelType | null): { value: OutreachStatus; label: string }[] => {
  let statusSequence: OutreachStatus[];
  
  switch (channelFrom) {
    case 'linkedin':
      statusSequence = LINKEDIN_STATUS_SEQUENCE;
      break;
    case 'email':
      statusSequence = EMAIL_STATUS_SEQUENCE;
      break;
    default:
      statusSequence = DEFAULT_STATUS_SEQUENCE;
      break;
  }
  
  return statusSequence.map(status => ({
    value: status,
    label: OUTREACH_STATUS_OPTIONS.find(opt => opt.value === status)?.label || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));
};

// Function to get the display label for a status
export const getStatusLabel = (status: OutreachStatus): string => {
  const option = OUTREACH_STATUS_OPTIONS.find(opt => opt.value === status);
  return option ? option.label : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Function to get lead stage color based on the stage value
export const getLeadStageColor = (stage: LeadStage): string => {
  const colorMap: Record<LeadStage, string> = {
    'replied': 'bg-green-500/20 text-green-400',
    'first_call': 'bg-blue-500/20 text-blue-400',
    'lead_qualified': 'bg-purple-500/20 text-purple-400',
    'move_opportunity_to_crm': 'bg-emerald-500/20 text-emerald-400',
    'not_interested': 'bg-red-500/20 text-red-400',
    'cold': 'bg-gray-500/20 text-gray-400',
    'not_relevant': 'bg-orange-500/20 text-orange-400'
  };
  
  return colorMap[stage] || 'bg-gray-500/20 text-gray-400';
};

// Function to get the display label for a lead stage
export const getLeadStageLabel = (stage: LeadStage): string => {
  const option = LEAD_STAGE_OPTIONS.find(opt => opt.value === stage);
  return option ? option.label : stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Function to get status color based on the status value
export const getStatusColor = (status: OutreachStatus): string => {
  const colorMap: Record<OutreachStatus, string> = {
    'not_contacted': 'bg-gray-500/20 text-gray-400',
    'contacted': 'bg-blue-500/20 text-blue-400',
    'replied': 'bg-green-500/20 text-green-400',
    'interested': 'bg-yellow-500/20 text-yellow-400',
    'not_interested': 'bg-red-500/20 text-red-400',
    'follow_up': 'bg-orange-500/20 text-orange-400',
    'qualified': 'bg-purple-500/20 text-purple-400',
    'proposal_sent': 'bg-indigo-500/20 text-indigo-400',
    'meeting_scheduled': 'bg-teal-500/20 text-teal-400',
    'demo_completed': 'bg-cyan-500/20 text-cyan-400',
    'negotiation': 'bg-amber-500/20 text-amber-400',
    'closed_won': 'bg-emerald-500/20 text-emerald-400',
    'closed_lost': 'bg-red-600/20 text-red-500',
    'requested': 'bg-slate-500/20 text-slate-400',
    'accepted': 'bg-sky-500/20 text-sky-400',
    'intro_msg': 'bg-violet-500/20 text-violet-400',
    'follow_up_1': 'bg-pink-500/20 text-pink-400',
    'newsletter_1': 'bg-rose-500/20 text-rose-400',
    'value_prop': 'bg-fuchsia-500/20 text-fuchsia-400',
    'hold_thread': 'bg-lime-500/20 text-lime-400',
    'newsletter_2': 'bg-emerald-600/20 text-emerald-500',
    'follow_up_2': 'bg-teal-600/20 text-teal-500',
    'email_sequence': 'bg-blue-600/20 text-blue-500'
  };
  
  return colorMap[status] || 'bg-gray-500/20 text-gray-400';
};

// Function to update contact status in the database
export const updateContactStatus = async (
  contactId: string, 
  newStatus: OutreachStatus,
  options?: {
    updateLastActionDate?: boolean;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Map extended statuses to DB enum (DB supports: not_contacted, contacted, replied, interested, not_interested, follow_up, closed)
    const mapStatusForDb = (status: OutreachStatus): 'not_contacted' | 'contacted' | 'replied' | 'interested' | 'not_interested' | 'follow_up' | 'closed' => {
      const extendedClosed: OutreachStatus[] = [
        'closed_won', 'closed_lost', 'qualified', 'proposal_sent', 'meeting_scheduled', 'demo_completed', 'negotiation'
      ];
      return (extendedClosed as string[]).includes(status as string) ? 'closed' : (status as any);
    };

    const updateData: any = {
      outreach_status: mapStatusForDb(newStatus),
    };

    // Optionally update the last action timestamp
    if (options?.updateLastActionDate !== false) {
      updateData.last_action_date = new Date().toISOString();
    }

    // Add notes if provided
    if (options?.notes) {
      updateData.notes = options.notes;
    }

    const { error } = await supabase
      .from('master')
      .update(updateData)
      .eq('id', contactId);

    if (error) {
      console.error('Error updating contact status:', error);
      return { success: false, error: error.message };
    }

    // Insert activity log with person name
    try {
      // Get contact name for the activity description
      const { data: contact } = await supabase
        .from('master')
        .select('name')
        .eq('id', contactId)
        .single();

      const contactName = contact?.name || 'Unknown Contact';
      
      await supabase.from('activities').insert({
        contact_id: contactId,
        type: 'status_change',
        description: `${contactName}'s outreach status changed to ${getStatusLabel(newStatus)}`,
        to_status: newStatus
      });
    } catch (e) {
      console.warn('Activity log insert failed (non-blocking):', e);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating contact status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Function to update multiple contacts' status
export const updateContactsStatus = async (
  contactIds: string[], 
  newStatus: OutreachStatus,
  options?: {
    updateLastActionDate?: boolean;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string; updatedCount?: number }> => {
  try {
    const updateData: any = {
      outreach_status: newStatus,
    };

    // Optionally update the last action timestamp
    if (options?.updateLastActionDate !== false) {
      updateData.last_action_date = new Date().toISOString();
    }

    // Add notes if provided
    if (options?.notes) {
      updateData.notes = options.notes;
    }

    const { error, count } = await supabase
      .from('master')
      .update(updateData)
      .in('id', contactIds);

    if (error) {
      console.error('Error updating contacts status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, updatedCount: count || 0 };
  } catch (error) {
    console.error('Error updating contacts status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Function to get the next logical status in the outreach flow
export const getNextStatus = (currentStatus: OutreachStatus): OutreachStatus | null => {
  const statusFlow: Record<OutreachStatus, OutreachStatus | null> = {
    'not_contacted': 'contacted',
    'contacted': 'replied',
    'replied': 'interested',
    'interested': 'qualified',
    'qualified': 'proposal_sent',
    'proposal_sent': 'meeting_scheduled',
    'meeting_scheduled': 'demo_completed',
    'demo_completed': 'negotiation',
    'negotiation': 'closed_won',
    'follow_up': 'contacted',
    'not_interested': null,
    'closed_won': null,
    'closed_lost': null,
    // LinkedIn-specific statuses
    'requested': 'accepted',
    'accepted': 'intro_msg',
    'intro_msg': 'follow_up_1',
    'follow_up_1': 'newsletter_1',
    'newsletter_1': 'value_prop',
    'value_prop': 'hold_thread',
    'hold_thread': 'newsletter_2',
    'newsletter_2': 'follow_up_2',
    'follow_up_2': 'email_sequence',
    'email_sequence': null
  };

  return statusFlow[currentStatus] || null;
};

// Function to check if a status represents a positive outcome
export const isPositiveStatus = (status: OutreachStatus): boolean => {
  return [
    'replied',
    'interested', 
    'qualified',
    'proposal_sent',
    'meeting_scheduled',
    'demo_completed',
    'negotiation',
    'closed_won'
  ].includes(status);
};

// Function to check if a status represents a closed state
export const isClosedStatus = (status: OutreachStatus): boolean => {
  return ['closed_won', 'closed_lost'].includes(status);
};