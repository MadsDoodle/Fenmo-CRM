-- Drop all existing check constraints
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_linkedin_status;
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_email_status;
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_whatsapp_status;
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_sms_status;

-- Add comprehensive check constraints that include ALL template_status_enum values
ALTER TABLE public.message_templates ADD CONSTRAINT check_linkedin_status 
CHECK (
  channel != 'linkedin' OR status IN (
    'contacted', 'not_yet', 'replied', 'interested', 'not_interested', 'closed', 'follow_up',
    'not_contacted', 'requested', 'accepted', 'intro_msg', 'follow_up_1', 'newsletter_1', 
    'value_prop', 'hold_thread', 'newsletter_2', 'follow_up_2', 'email_sequence',
    'qualified', 'proposal_sent', 'meeting_scheduled', 'demo_completed', 'negotiation',
    'closed_won', 'closed_lost'
  )
);

ALTER TABLE public.message_templates ADD CONSTRAINT check_email_status 
CHECK (
  channel != 'email' OR status IN (
    'contacted', 'not_yet', 'replied', 'interested', 'not_interested', 'closed', 'follow_up',
    'not_contacted', 'requested', 'accepted', 'intro_msg', 'follow_up_1', 'newsletter_1', 
    'value_prop', 'hold_thread', 'newsletter_2', 'follow_up_2', 'email_sequence',
    'qualified', 'proposal_sent', 'meeting_scheduled', 'demo_completed', 'negotiation',
    'closed_won', 'closed_lost'
  )
);

ALTER TABLE public.message_templates ADD CONSTRAINT check_whatsapp_status 
CHECK (
  channel != 'whatsapp' OR status IN (
    'contacted', 'not_yet', 'replied', 'interested', 'not_interested', 'closed', 'follow_up',
    'not_contacted', 'requested', 'accepted', 'intro_msg', 'follow_up_1', 'newsletter_1', 
    'value_prop', 'hold_thread', 'newsletter_2', 'follow_up_2', 'email_sequence',
    'qualified', 'proposal_sent', 'meeting_scheduled', 'demo_completed', 'negotiation',
    'closed_won', 'closed_lost'
  )
);

ALTER TABLE public.message_templates ADD CONSTRAINT check_sms_status 
CHECK (
  channel != 'sms' OR status IN (
    'contacted', 'not_yet', 'replied', 'interested', 'not_interested', 'closed', 'follow_up',
    'not_contacted', 'requested', 'accepted', 'intro_msg', 'follow_up_1', 'newsletter_1', 
    'value_prop', 'hold_thread', 'newsletter_2', 'follow_up_2', 'email_sequence',
    'qualified', 'proposal_sent', 'meeting_scheduled', 'demo_completed', 'negotiation',
    'closed_won', 'closed_lost'
  )
);
