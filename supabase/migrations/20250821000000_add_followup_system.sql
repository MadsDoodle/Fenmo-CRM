-- Add followup_rules table and enhance master table with follow-up system
-- Migration: 20250821000000_add_followup_system.sql

-- 1. Create followup_rules table
CREATE TABLE IF NOT EXISTS public.followup_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_status public.outreach_status_enum NOT NULL UNIQUE,
  default_days INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Insert default follow-up rules
INSERT INTO public.followup_rules (outreach_status, default_days, description) VALUES
  ('not_contacted', 3, 'Initial contact after 3 days'),
  ('contacted', 7, 'Follow up after 7 days if no response'),
  ('replied', 5, 'Follow up after 5 days after reply'),
  ('interested', 3, 'Quick follow up for interested prospects'),
  ('follow_up', 2, 'Regular follow up every 2 days'),
  ('not_interested', 0, 'No follow-up needed'),
  ('closed', 0, 'No follow-up needed - deal closed')
ON CONFLICT (outreach_status) DO UPDATE SET
  default_days = EXCLUDED.default_days,
  description = EXCLUDED.description,
  updated_at = now();

-- 3. Create priority enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.priority_enum AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Add new fields to master table
ALTER TABLE public.master 
ADD COLUMN IF NOT EXISTS last_action TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS next_action TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS priority public.priority_enum DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS custom_followup_days INTEGER;

-- 5. Create function to calculate next_action based on followup_rules
CREATE OR REPLACE FUNCTION public.calculate_next_action(
  p_contact_id UUID,
  p_custom_days INTEGER DEFAULT NULL
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  v_outreach_status public.outreach_status_enum;
  v_last_action TIMESTAMP WITH TIME ZONE;
  v_default_days INTEGER;
  v_followup_days INTEGER;
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
  
  -- Get default days from followup_rules
  SELECT default_days INTO v_default_days
  FROM public.followup_rules 
  WHERE outreach_status = v_outreach_status;
  
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

-- 6. Create function to update next_action when status changes
CREATE OR REPLACE FUNCTION public.update_next_action_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate if outreach_status changed
  IF NEW.outreach_status IS DISTINCT FROM OLD.outreach_status THEN
    -- Update last_action to current timestamp
    NEW.last_action := now();
    
    -- Calculate new next_action
    NEW.next_action := public.calculate_next_action(NEW.id, NEW.custom_followup_days);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically update next_action
DROP TRIGGER IF EXISTS update_next_action_trigger ON public.master;
CREATE TRIGGER update_next_action_trigger
  BEFORE UPDATE ON public.master
  FOR EACH ROW
  EXECUTE FUNCTION public.update_next_action_on_status_change();

-- 8. Create function to update next_action when custom_followup_days changes
CREATE OR REPLACE FUNCTION public.update_next_action_on_custom_days_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate if custom_followup_days changed
  IF NEW.custom_followup_days IS DISTINCT FROM OLD.custom_followup_days THEN
    NEW.next_action := public.calculate_next_action(NEW.id, NEW.custom_followup_days);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for custom_followup_days changes
DROP TRIGGER IF EXISTS update_next_action_custom_days_trigger ON public.master;
CREATE TRIGGER update_next_action_custom_days_trigger
  BEFORE UPDATE OF custom_followup_days ON public.master
  FOR EACH ROW
  EXECUTE FUNCTION public.update_next_action_on_custom_days_change();

-- 10. Backfill next_action for existing records
UPDATE public.master 
SET next_action = public.calculate_next_action(id, custom_followup_days)
WHERE next_action IS NULL;

-- 11. Enable RLS on followup_rules
ALTER TABLE public.followup_rules ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for followup_rules
CREATE POLICY "Public can read followup rules" ON public.followup_rules
  FOR SELECT USING (true);

CREATE POLICY "Public can manage followup rules" ON public.followup_rules
  FOR ALL USING (true) WITH CHECK (true);

-- 13. Create trigger to update updated_at on followup_rules
CREATE TRIGGER update_followup_rules_updated_at
  BEFORE UPDATE ON public.followup_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
