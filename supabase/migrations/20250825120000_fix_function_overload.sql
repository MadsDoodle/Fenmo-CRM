-- Fix function overload conflict by dropping all versions and creating only one
-- This resolves the "Could not choose the best candidate function" error

-- Drop ALL possible versions of the function
DROP FUNCTION IF EXISTS calculate_next_action(uuid, integer, text);
DROP FUNCTION IF EXISTS calculate_next_action(uuid, integer, channel_enum);
DROP FUNCTION IF EXISTS calculate_next_action(p_contact_id uuid, p_custom_days integer, p_channel text);
DROP FUNCTION IF EXISTS calculate_next_action(p_contact_id uuid, p_custom_days integer, p_channel channel_enum);

-- Create the single definitive function with TEXT parameter (not enum)
CREATE OR REPLACE FUNCTION calculate_next_action(
  p_contact_id UUID,
  p_custom_days INTEGER DEFAULT NULL,
  p_channel TEXT DEFAULT 'linkedin'
) RETURNS TABLE(next_action_date TIMESTAMP WITH TIME ZONE, next_action_status TEXT) AS $$
DECLARE
  contact_record RECORD;
  rule_record RECORD;
  calculated_date TIMESTAMP WITH TIME ZONE;
  action_status TEXT;
BEGIN
  -- Get the contact record
  SELECT * INTO contact_record 
  FROM master 
  WHERE id = p_contact_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact with ID % not found', p_contact_id;
  END IF;
  
  -- Look for a followup rule matching the contact's status and channel
  -- Cast the TEXT parameter to channel_enum for comparison
  SELECT * INTO rule_record
  FROM followup_rules 
  WHERE outreach_status = contact_record.outreach_status::outreach_status_enum
    AND channel = p_channel::channel_enum
  ORDER BY channel_sequence ASC
  LIMIT 1;
  
  -- If no rule found for specific channel, try LinkedIn as fallback
  IF NOT FOUND AND p_channel != 'linkedin' THEN
    SELECT * INTO rule_record
    FROM followup_rules 
    WHERE outreach_status = contact_record.outreach_status::outreach_status_enum
      AND channel = 'linkedin'::channel_enum
    ORDER BY channel_sequence ASC
    LIMIT 1;
  END IF;
  
  -- Calculate next action date and status
  IF FOUND THEN
    -- Use custom days if provided, otherwise use rule's default_days
    IF p_custom_days IS NOT NULL THEN
      calculated_date := CURRENT_DATE + INTERVAL '1 day' * p_custom_days;
    ELSE
      calculated_date := CURRENT_DATE + INTERVAL '1 day' * rule_record.default_days;
    END IF;
    
    action_status := rule_record.next_action;
  ELSE
    -- Default fallback if no rule found
    calculated_date := CURRENT_DATE + INTERVAL '7 days';
    action_status := 'follow up';
  END IF;
  
  -- Update the master table with calculated values
  UPDATE master 
  SET 
    next_action_date = calculated_date,
    next_action_status = action_status,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_contact_id;
  
  -- Return the calculated values
  RETURN QUERY SELECT calculated_date, action_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_next_action(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_action(UUID, INTEGER, TEXT) TO anon;
