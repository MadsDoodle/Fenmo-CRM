-- Add channel_from column and extend channel enum
-- Migration: 20250825050000_add_channel_from_column.sql

-- 1. Extend channel enum to include all channel_from options
DO $$ BEGIN
  -- Add new enum values if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'phone' AND enumtypid = 'public.channel_enum'::regtype) THEN
    ALTER TYPE public.channel_enum ADD VALUE 'phone';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sms' AND enumtypid = 'public.channel_enum'::regtype) THEN
    ALTER TYPE public.channel_enum ADD VALUE 'sms';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'whatsapp' AND enumtypid = 'public.channel_enum'::regtype) THEN
    ALTER TYPE public.channel_enum ADD VALUE 'whatsapp';
  END IF;
END $$;

-- 2. Add channel_from column to master table
ALTER TABLE public.master 
ADD COLUMN IF NOT EXISTS channel_from public.channel_enum;

-- 3. Update followup_rules to include sequences for phone, sms, whatsapp
INSERT INTO public.followup_rules (channel, outreach_status, channel_sequence, default_days, next_action, description) VALUES
-- Phone Sequence (using current default statuses)
('phone', 'not_contacted', 1, 0, 'make initial call', 'Not contacted - make initial call'),
('phone', 'contacted', 2, 3, 'follow up call', 'Initial contact made - follow up in 3 days'),
('phone', 'replied', 3, 7, 'schedule meeting', 'Reply received - schedule meeting'),
('phone', 'interested', 4, 1, 'send proposal', 'Interest shown - send proposal'),
('phone', 'follow_up', 5, 7, 'follow up call', 'Follow up needed - call in 7 days'),

-- SMS Sequence (using current default statuses)
('sms', 'not_contacted', 1, 0, 'send initial sms', 'Not contacted - send initial SMS'),
('sms', 'contacted', 2, 3, 'follow up sms', 'Initial SMS sent - follow up in 3 days'),
('sms', 'replied', 3, 7, 'schedule call', 'Reply received - schedule call'),
('sms', 'interested', 4, 1, 'send details', 'Interest shown - send details'),
('sms', 'follow_up', 5, 7, 'follow up sms', 'Follow up needed - SMS in 7 days'),

-- WhatsApp Sequence (using current default statuses)
('whatsapp', 'not_contacted', 1, 0, 'send initial message', 'Not contacted - send initial WhatsApp message'),
('whatsapp', 'contacted', 2, 3, 'follow up message', 'Initial message sent - follow up in 3 days'),
('whatsapp', 'replied', 3, 7, 'schedule call', 'Reply received - schedule call'),
('whatsapp', 'interested', 4, 1, 'send proposal', 'Interest shown - send proposal'),
('whatsapp', 'follow_up', 5, 7, 'follow up message', 'Follow up needed - message in 7 days')
ON CONFLICT (channel, outreach_status, channel_sequence) DO NOTHING;

-- 4. Update the calculate_next_action function to use channel_from when available
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
  v_channel_from public.channel_enum;
  v_effective_channel public.channel_enum;
BEGIN
  -- Get current status, last_action, and channel_from
  SELECT outreach_status, last_action, channel_from
  INTO v_outreach_status, v_last_action, v_channel_from
  FROM public.master 
  WHERE id = p_contact_id;
  
  -- Use channel_from if available, otherwise fall back to provided channel
  v_effective_channel := COALESCE(v_channel_from, p_channel);
  
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
    AND channel = v_effective_channel
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

-- 5. Update the trigger function to use channel_from
CREATE OR REPLACE FUNCTION public.update_next_action_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_effective_channel public.channel_enum;
BEGIN
  -- Only recalculate if outreach_status or channel_from changed
  IF NEW.outreach_status IS DISTINCT FROM OLD.outreach_status OR 
     NEW.channel_from IS DISTINCT FROM OLD.channel_from THEN
    -- Update last_action to current timestamp
    NEW.last_action := now();
    
    -- Use channel_from if available, otherwise fall back to channel
    v_effective_channel := COALESCE(NEW.channel_from, NEW.channel);
    
    -- Calculate new next_action using the effective channel
    NEW.next_action := public.calculate_next_action(NEW.id, NEW.custom_followup_days, v_effective_channel);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Update get_next_action_text function to use channel_from
CREATE OR REPLACE FUNCTION public.get_next_action_text(
  p_contact_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_outreach_status public.outreach_status_enum;
  v_channel public.channel_enum;
  v_channel_from public.channel_enum;
  v_next_action_text TEXT;
  v_effective_channel public.channel_enum;
BEGIN
  -- Get current status, channel, and channel_from
  SELECT outreach_status, channel, channel_from 
  INTO v_outreach_status, v_channel, v_channel_from
  FROM public.master 
  WHERE id = p_contact_id;
  
  -- Use channel_from if available, otherwise fall back to channel
  v_effective_channel := COALESCE(v_channel_from, v_channel);
  
  -- Get the next action text from followup_rules
  SELECT next_action INTO v_next_action_text
  FROM public.followup_rules 
  WHERE outreach_status = v_outreach_status 
    AND channel = v_effective_channel
  ORDER BY channel_sequence ASC
  LIMIT 1;
  
  RETURN v_next_action_text;
END;
$$;
