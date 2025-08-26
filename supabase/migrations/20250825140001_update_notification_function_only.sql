-- Update notification function to include today and tomorrow alerts
-- Migration: 20250825140001_update_notification_function_only.sql

-- Only update the generate_daily_reminders function
CREATE OR REPLACE FUNCTION public.generate_daily_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  contact_record RECORD;
  today_date DATE;
  tomorrow_date DATE;
  reminder_count INTEGER := 0;
BEGIN
  -- Get today's and tomorrow's dates
  today_date := CURRENT_DATE;
  tomorrow_date := (CURRENT_DATE + INTERVAL '1 day')::DATE;
  
  -- Clear existing unread reminders to avoid duplicates
  DELETE FROM public.notifications 
  WHERE type = 'reminder' AND is_read = FALSE;
  
  -- Find all contacts that need follow-up today
  FOR contact_record IN
    SELECT 
      m.id,
      m.name,
      m.company,
      m.next_action,
      m.outreach_status,
      m.channel_from
    FROM public.master m
    WHERE m.next_action IS NOT NULL
      AND DATE(m.next_action) = today_date
      AND m.outreach_status NOT IN ('not_interested', 'closed')
  LOOP
    -- Insert today reminder notification
    INSERT INTO public.notifications (
      contact_id,
      type,
      title,
      message
    ) VALUES (
      contact_record.id,
      'reminder',
      'Due Today',
      format('Follow-up with %s is due today via %s', 
             COALESCE(contact_record.name, 'this contact'),
             COALESCE(contact_record.channel_from::text, 'preferred channel'))
    );
    
    reminder_count := reminder_count + 1;
  END LOOP;
  
  -- Find all contacts that need follow-up tomorrow
  FOR contact_record IN
    SELECT 
      m.id,
      m.name,
      m.company,
      m.next_action,
      m.outreach_status,
      m.channel_from
    FROM public.master m
    WHERE m.next_action IS NOT NULL
      AND DATE(m.next_action) = tomorrow_date
      AND m.outreach_status NOT IN ('not_interested', 'closed')
  LOOP
    -- Insert tomorrow reminder notification
    INSERT INTO public.notifications (
      contact_id,
      type,
      title,
      message
    ) VALUES (
      contact_record.id,
      'reminder',
      'Due Tomorrow',
      format('Follow-up with %s is due tomorrow via %s', 
             COALESCE(contact_record.name, 'this contact'),
             COALESCE(contact_record.channel_from::text, 'preferred channel'))
    );
    
    reminder_count := reminder_count + 1;
  END LOOP;
  
  -- Log the number of reminders created
  RAISE NOTICE 'Created % reminder notifications for today and tomorrow', reminder_count;
END;
$$;

-- Manually trigger reminders for existing data
SELECT public.generate_daily_reminders();
