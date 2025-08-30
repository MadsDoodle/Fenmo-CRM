-- First, update existing data to match the lowercase underscore format
UPDATE public.message_templates 
SET status = CASE 
  WHEN status = 'Requested' THEN 'requested'
  WHEN status = 'Accepted' THEN 'accepted'
  WHEN status = 'Intro Msg' THEN 'intro_msg'
  WHEN status = 'Follow Up 1' THEN 'follow_up_1'
  WHEN status = 'Newsletter 1' THEN 'newsletter_1'
  WHEN status = 'Value Prop' THEN 'value_prop'
  WHEN status = 'Hold Thread' THEN 'hold_thread'
  WHEN status = 'Newsletter 2' THEN 'newsletter_2'
  WHEN status = 'Follow Up 2' THEN 'follow_up_2'
  WHEN status = 'Email Sequence' THEN 'email_sequence'
  WHEN status = 'Not Contacted' THEN 'not_contacted'
  WHEN status = 'Contacted' THEN 'contacted'
  WHEN status = 'Replied' THEN 'replied'
  WHEN status = 'Interested' THEN 'interested'
  WHEN status = 'Not Interested' THEN 'not_interested'
  WHEN status = 'Closed' THEN 'closed'
  WHEN status = 'Follow Up' THEN 'follow_up'
  ELSE LOWER(REPLACE(status, ' ', '_'))
END;

-- Now drop the existing check constraints
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_linkedin_status;
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_email_status;

-- Add new check constraints that match the lowercase underscore format
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

-- Verify the update worked
SELECT channel, status, COUNT(*) as count 
FROM public.message_templates 
GROUP BY channel, status 
ORDER BY channel, status;
