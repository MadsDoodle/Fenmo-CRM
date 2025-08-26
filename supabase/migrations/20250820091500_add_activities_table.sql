-- Create activities table to log status changes and other events
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.master(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'status_change',
  description TEXT,
  from_status TEXT,
  to_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS and open policies (adjust as needed later)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public can manage activities"
  ON public.activities FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


