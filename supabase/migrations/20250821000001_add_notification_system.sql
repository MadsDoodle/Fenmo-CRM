-- Add notification system for follow-up reminders
-- Migration: 20250821000001_add_notification_system.sql

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.master(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'reminder',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 2. Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for notifications
CREATE POLICY "Public can read notifications" ON public.notifications
  FOR SELECT USING (true);

CREATE POLICY "Public can manage notifications" ON public.notifications
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Create function to generate daily reminders
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

-- 5. Create function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = now()
  WHERE id = notification_id;
END;
$$;

-- 6. Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = now()
  WHERE is_read = FALSE;
END;
$$;

-- 7. Create function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM public.notifications
  WHERE is_read = FALSE;
  
  RETURN count_result;
END;
$$;

-- 8. Create trigger to update updated_at on notifications
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create a cron job to run daily reminders (this will be set up in Supabase dashboard)
-- The cron job should call: SELECT public.generate_daily_reminders();
-- Schedule: 0 9 * * * (every day at 9 AM)

-- 10. Create function to manually trigger reminders (for testing)
CREATE OR REPLACE FUNCTION public.trigger_manual_reminders()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.generate_daily_reminders();
  RETURN 'Manual reminders triggered successfully';
END;
$$;
