-- Add next_action_status column to master table
-- This column will store the action description from followup_rules table

-- Add the next_action_status column if it doesn't exist
ALTER TABLE master 
ADD COLUMN IF NOT EXISTS next_action_status TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_master_next_action_status ON master(next_action_status);

-- Drop ALL versions of the function to avoid overload conflicts
DROP FUNCTION IF EXISTS calculate_next_action(uuid, integer, text);
DROP FUNCTION IF EXISTS calculate_next_action(uuid, integer, channel_enum);
DROP FUNCTION IF EXISTS calculate_next_action(p_contact_id uuid, p_custom_days integer, p_channel text);
DROP FUNCTION IF EXISTS calculate_next_action(p_contact_id uuid, p_custom_days integer, p_channel channel_enum);

-- Update the calculate_next_action function to also populate next_action_status
CREATE OR REPLACE FUNCTION calculate_next_action(
  p_contact_id UUID,
  p_custom_days INTEGER DEFAULT NULL,
  p_channel TEXT DEFAULT 'linkedin'
) RETURNS TABLE(next_action_date TIMESTAMP WITH TIME ZONE, next_action_status TEXT) AS $$
DECLARE
  contact_record RECORD;
  rule_record RECORD;
  calc_next_action_date TIMESTAMP WITH TIME ZONE;
  calc_next_action_status TEXT;
BEGIN
  -- Get the contact record
  SELECT * INTO contact_record FROM master WHERE id = p_contact_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact not found with id: %', p_contact_id;
  END IF;

  -- Use channel_from if available, otherwise fall back to channel or default
  p_channel := COALESCE(contact_record.channel_from::TEXT, contact_record.channel::TEXT, p_channel);

  -- Get the appropriate followup rule based on outreach_status and channel
  SELECT * INTO rule_record 
  FROM followup_rules 
  WHERE outreach_status::TEXT = contact_record.outreach_status::TEXT 
    AND channel::TEXT = p_channel
  ORDER BY channel_sequence ASC 
  LIMIT 1;

  IF NOT FOUND THEN
    -- Fallback to linkedin channel if no specific rule found
    SELECT * INTO rule_record 
    FROM followup_rules 
    WHERE outreach_status::TEXT = contact_record.outreach_status::TEXT 
      AND channel::TEXT = 'linkedin'
    ORDER BY channel_sequence ASC 
    LIMIT 1;
  END IF;

  IF FOUND THEN
    -- Calculate next action date
    calc_next_action_date := CURRENT_DATE + INTERVAL '1 day' * COALESCE(p_custom_days, rule_record.default_days);
    calc_next_action_status := rule_record.next_action;
    
    -- Update the contact record
    UPDATE master 
    SET 
      next_action_date = calc_next_action_date,
      next_action_status = calc_next_action_status,
      updated_at = NOW()
    WHERE id = p_contact_id;
    
    RETURN QUERY SELECT calc_next_action_date, calc_next_action_status;
  ELSE
    -- No rule found, set defaults
    calc_next_action_date := CURRENT_DATE + INTERVAL '7 days';
    calc_next_action_status := 'Follow up required';
    
    UPDATE master 
    SET 
      next_action_date = calc_next_action_date,
      next_action_status = calc_next_action_status,
      updated_at = NOW()
    WHERE id = p_contact_id;
    
    RETURN QUERY SELECT calc_next_action_date, calc_next_action_status;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Remove all triggers that might be causing conflicts
-- The frontend will handle next action calculation explicitly
DROP TRIGGER IF EXISTS trigger_update_next_action_on_status_change ON master;
DROP TRIGGER IF EXISTS update_next_action_trigger ON master;
DROP TRIGGER IF EXISTS update_next_action_custom_days_trigger ON master;

-- Function to get next action text based on current status and channel
CREATE OR REPLACE FUNCTION get_next_action_text(
  p_current_status TEXT,
  p_channel TEXT DEFAULT 'linkedin'
) RETURNS TEXT AS $$
DECLARE
  rule_record RECORD;
BEGIN
  -- Get the appropriate followup rule based on outreach_status and channel
  SELECT * INTO rule_record 
  FROM followup_rules 
  WHERE outreach_status::TEXT = p_current_status 
    AND channel::TEXT = p_channel
  ORDER BY channel_sequence ASC 
  LIMIT 1;

  IF NOT FOUND THEN
    -- Fallback to linkedin channel if no specific rule found
    SELECT * INTO rule_record 
    FROM followup_rules 
    WHERE outreach_status::TEXT = p_current_status 
      AND channel::TEXT = 'linkedin'
    ORDER BY channel_sequence ASC 
    LIMIT 1;
  END IF;

  IF FOUND THEN
    RETURN rule_record.next_action;
  ELSE
    RETURN 'Follow up required';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing records with next_action_status
UPDATE master 
SET next_action_status = get_next_action_text(
  outreach_status::TEXT, 
  COALESCE(channel_from::TEXT, channel::TEXT, 'linkedin')
)
WHERE next_action_status IS NULL;

COMMENT ON COLUMN master.next_action_status IS 'Stores the action description from followup_rules table indicating what needs to be done next';
