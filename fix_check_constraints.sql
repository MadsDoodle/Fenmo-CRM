-- Drop the existing check constraints that expect title case values
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_linkedin_status;
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_email_status;

-- Add new check constraints that match the lowercase underscore format from status-config.ts
ALTER TABLE public.message_templates ADD CONSTRAINT check_linkedin_status 
CHECK (
  channel != 'linkedin' OR status IN (
    'requested', 'accepted', 'intro_msg', 'follow_up_1', 'newsletter_1', 
    'value_prop', 'hold_thread', 'newsletter_2', 'follow_up_2', 'email_sequence'
  )
);

ALTER TABLE public.message_templates ADD CONSTRAINT check_email_status 
CHECK (
  channel != 'email' OR status IN (
    'not_contacted', 'email_sequence', 'requested', 'accepted', 'intro_msg', 
    'follow_up_1', 'newsletter_1', 'value_prop', 'hold_thread', 'newsletter_2', 'follow_up_2'
  )
);

-- Add constraints for other channels
ALTER TABLE public.message_templates ADD CONSTRAINT check_whatsapp_status 
CHECK (
  channel != 'whatsapp' OR status IN (
    'not_contacted', 'contacted', 'replied', 'interested', 'not_interested', 'follow_up', 'closed'
  )
);

ALTER TABLE public.message_templates ADD CONSTRAINT check_sms_status 
CHECK (
  channel != 'sms' OR status IN (
    'not_contacted', 'contacted', 'replied', 'interested', 'not_interested', 'follow_up', 'closed'
  )
);
