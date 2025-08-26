-- Fix last_action_date system to properly track when actions are performed
-- Migration: 20250826002000_fix_last_action_date_system.sql

-- Create function to update last_action_date when activities are logged
CREATE OR REPLACE FUNCTION public.update_last_action_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the master table's last_action_date when an activity is inserted
  UPDATE public.master 
  SET last_action_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE,
      updated_at = NOW()
  WHERE id = NEW.contact_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last_action_date when activities are logged
DROP TRIGGER IF EXISTS trigger_update_last_action_date ON public.activities;
CREATE TRIGGER trigger_update_last_action_date
  AFTER INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_action_date();

-- Create function to update last_action_date when messages are sent
CREATE OR REPLACE FUNCTION public.update_last_action_date_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the master table's last_action_date when a message is sent
  UPDATE public.master 
  SET last_action_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE,
      updated_at = NOW()
  WHERE id = NEW.contact_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last_action_date when messages are sent
DROP TRIGGER IF EXISTS trigger_update_last_action_date_on_message ON public.messages;
CREATE TRIGGER trigger_update_last_action_date_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_action_date_on_message();

-- Update existing records that have activities but no last_action_date
UPDATE public.master 
SET last_action_date = (
  SELECT MAX(DATE(created_at))
  FROM public.activities 
  WHERE activities.contact_id = master.id
),
updated_at = NOW()
WHERE last_action_date IS NULL 
  AND id IN (
    SELECT DISTINCT contact_id 
    FROM public.activities
  );

-- Update existing records that have messages but no last_action_date
UPDATE public.master 
SET last_action_date = (
  SELECT MAX(DATE(created_at))
  FROM public.messages 
  WHERE messages.contact_id = master.id
),
updated_at = NOW()
WHERE last_action_date IS NULL 
  AND id IN (
    SELECT DISTINCT contact_id 
    FROM public.messages
  );
