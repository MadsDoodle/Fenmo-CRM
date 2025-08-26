-- Update followup_rules table structure and data
-- Migration: 20250825000001_update_followup_rules_structure.sql

-- 1. Add new columns to followup_rules table
ALTER TABLE public.followup_rules 
ADD COLUMN IF NOT EXISTS channel public.channel_enum NOT NULL DEFAULT 'linkedin',
ADD COLUMN IF NOT EXISTS channel_sequence INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS next_action TEXT;

-- 2. Drop the unique constraint on outreach_status since we now have multiple entries per status
ALTER TABLE public.followup_rules DROP CONSTRAINT IF EXISTS followup_rules_outreach_status_key;

-- 3. Add new unique constraint on channel + outreach_status + channel_sequence
ALTER TABLE public.followup_rules 
DROP CONSTRAINT IF EXISTS followup_rules_channel_status_sequence_unique;

ALTER TABLE public.followup_rules 
ADD CONSTRAINT followup_rules_channel_status_sequence_unique 
UNIQUE (channel, outreach_status, channel_sequence);

-- 4. Clear existing data to insert new channel-based data
DELETE FROM public.followup_rules;

-- 5. Insert LinkedIn sequence data
INSERT INTO public.followup_rules (channel, outreach_status, channel_sequence, default_days, next_action, description) VALUES
-- LinkedIn Sequence
('linkedin', 'requested', 1, 0, NULL, 'Connection requested - no next action'),
('linkedin', 'accepted', 2, 1, 'send intro msg', 'Connection accepted - send intro message'),
('linkedin', 'intro_msg', 3, 3, 'send follow up 1', 'Intro message sent - follow up in 3 days'),
('linkedin', 'follow_up_1', 4, 3, 'send newsletter 1', 'First follow up sent - send newsletter'),
('linkedin', 'newsletter_1', 5, 3, 'send value prop', 'Newsletter 1 sent - send value proposition'),
('linkedin', 'value_prop', 6, 4, 'hold thread msg', 'Value prop sent - send hold thread message'),
('linkedin', 'hold_thread', 7, 7, 'send newsletter 2', 'Hold thread sent - send newsletter 2'),
('linkedin', 'newsletter_2', 8, 31, 'soft nudge', 'Newsletter 2 sent - soft nudge after 31 days'),
('linkedin', 'follow_up_2', 9, 4, 'move to email sequence', 'Follow up 2 sent - move to email'),
('linkedin', 'email_sequence', 10, 20, 'move to cold', 'Moved to email sequence - mark as cold after 20 days'),

-- Email Sequence  
('email', 'email_sequence', 1, 31, 'move to linkedin sequence', 'Email sequence started - move to LinkedIn after 31 days'),
('email', 'requested', 2, 0, NULL, 'Email requested - no next action'),
('email', 'accepted', 3, 1, 'send intro msg', 'Email accepted - send intro message'),
('email', 'intro_msg', 4, 3, 'send follow up 1', 'Intro email sent - follow up in 3 days'),
('email', 'follow_up_1', 5, 3, 'send newsletter 1', 'First follow up sent - send newsletter'),
('email', 'newsletter_1', 6, 3, 'send value prop', 'Newsletter 1 sent - send value proposition'),
('email', 'value_prop', 7, 4, 'hold thread msg', 'Value prop sent - send hold thread message'),
('email', 'hold_thread', 8, 7, 'send newsletter 2', 'Hold thread sent - send newsletter 2'),
('email', 'newsletter_2', 9, 31, 'soft nudge', 'Newsletter 2 sent - soft nudge after 31 days'),
('email', 'follow_up_2', 10, 4, 'move to cold', 'Follow up 2 sent - mark as cold');

-- 6. Update the calculate_next_action function to work with channel-based rules
CREATE OR REPLACE FUNCTION public.calculate_next_action(
  p_contact_id UUID,
  p_custom_days INTEGER DEFAULT NULL,
  p_channel public.channel_enum DEFAULT 'linkedin'
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  v_outreach_status public.outreach_status_enum;
  v_last_action TIMESTAMP WITH TIME ZONE;
  v_default_days INTEGER;
  v_followup_days INTEGER;
  v_channel_sequence INTEGER;
BEGIN
  -- Get current status and last_action
  SELECT outreach_status, last_action 
  INTO v_outreach_status, v_last_action
  FROM public.master 
  WHERE id = p_contact_id;
  
  -- If no last_action, use created_at
  IF v_last_action IS NULL THEN
    SELECT created_at INTO v_last_action
    FROM public.master 
    WHERE id = p_contact_id;
  END IF;
  
  -- Get the first matching rule for this channel and status (lowest channel_sequence)
  SELECT default_days, channel_sequence INTO v_default_days, v_channel_sequence
  FROM public.followup_rules 
  WHERE outreach_status = v_outreach_status 
    AND channel = p_channel
  ORDER BY channel_sequence ASC
  LIMIT 1;
  
  -- Use custom days if provided, otherwise use default
  v_followup_days := COALESCE(p_custom_days, v_default_days);
  
  -- If followup_days is 0, return NULL (no follow-up needed)
  IF v_followup_days = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Calculate next_action date
  RETURN v_last_action + (v_followup_days || ' days')::INTERVAL;
END;
$$;

-- 7. Add channel column to master table if it doesn't exist
ALTER TABLE public.master 
ADD COLUMN IF NOT EXISTS channel public.channel_enum DEFAULT 'linkedin';

-- 8. Update the trigger function to use channel information
CREATE OR REPLACE FUNCTION public.update_next_action_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate if outreach_status changed
  IF NEW.outreach_status IS DISTINCT FROM OLD.outreach_status THEN
    -- Update last_action to current timestamp
    NEW.last_action := now();
    
    -- Calculate new next_action using the contact's channel
    NEW.next_action := public.calculate_next_action(NEW.id, NEW.custom_followup_days, NEW.channel);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to get next action text for a contact
CREATE OR REPLACE FUNCTION public.get_next_action_text(
  p_contact_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_outreach_status public.outreach_status_enum;
  v_channel public.channel_enum;
  v_next_action_text TEXT;
BEGIN
  -- Get current status and channel
  SELECT outreach_status, channel 
  INTO v_outreach_status, v_channel
  FROM public.master 
  WHERE id = p_contact_id;
  
  -- Get the next action text from followup_rules
  SELECT next_action INTO v_next_action_text
  FROM public.followup_rules 
  WHERE outreach_status = v_outreach_status 
    AND channel = v_channel
  ORDER BY channel_sequence ASC
  LIMIT 1;
  
  RETURN v_next_action_text;
END;
$$;

-- 10. Backfill next_action for existing records with default channel
UPDATE public.master 
SET next_action = public.calculate_next_action(id, custom_followup_days, channel)
WHERE next_action IS NULL;
