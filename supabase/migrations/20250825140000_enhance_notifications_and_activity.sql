-- Enhance notifications and activity logging with person names
-- Migration: 20250825140000_enhance_notifications_and_activity.sql

-- 1. Update the generate_daily_reminders function to include today and tomorrow alerts
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
      m.next_action_date,
      m.outreach_status,
      m.channel_from
    FROM public.master m
    WHERE m.next_action_date IS NOT NULL
      AND DATE(m.next_action_date) = today_date
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
      m.next_action_date,
      m.outreach_status,
      m.channel_from
    FROM public.master m
    WHERE m.next_action_date IS NOT NULL
      AND DATE(m.next_action_date) = tomorrow_date
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

-- 2. Create function to automatically generate notifications when next_action is updated
CREATE OR REPLACE FUNCTION public.check_and_create_notifications()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE;
  tomorrow_date DATE;
BEGIN
  -- Get today's and tomorrow's dates
  today_date := CURRENT_DATE;
  tomorrow_date := (CURRENT_DATE + INTERVAL '1 day')::DATE;
  
  -- Only create notifications if next_action_date changed and is due today or tomorrow
  IF NEW.next_action_date IS DISTINCT FROM OLD.next_action_date AND NEW.next_action_date IS NOT NULL THEN
    -- Check if due today
    IF DATE(NEW.next_action_date) = today_date AND NEW.outreach_status NOT IN ('not_interested', 'closed') THEN
      INSERT INTO public.notifications (
        contact_id,
        type,
        title,
        message
      ) VALUES (
        NEW.id,
        'reminder',
        'Due Today',
        format('Follow-up with %s is due today via %s', 
               COALESCE(NEW.name, 'this contact'),
               COALESCE(NEW.channel_from::text, 'preferred channel'))
      );
    END IF;
    
    -- Check if due tomorrow
    IF DATE(NEW.next_action_date) = tomorrow_date AND NEW.outreach_status NOT IN ('not_interested', 'closed') THEN
      INSERT INTO public.notifications (
        contact_id,
        type,
        title,
        message
      ) VALUES (
        NEW.id,
        'reminder',
        'Due Tomorrow',
        format('Follow-up with %s is due tomorrow via %s', 
               COALESCE(NEW.name, 'this contact'),
               COALESCE(NEW.channel_from::text, 'preferred channel'))
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to automatically create notifications
DROP TRIGGER IF EXISTS auto_create_notifications_trigger ON public.master;
CREATE TRIGGER auto_create_notifications_trigger
  AFTER UPDATE ON public.master
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_create_notifications();

-- 4. Manually trigger reminders for existing data
SELECT public.generate_daily_reminders();
