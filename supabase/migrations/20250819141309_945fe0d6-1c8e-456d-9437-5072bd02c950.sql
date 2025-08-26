-- Create enums for structured data
CREATE TYPE public.channel_enum AS ENUM ('email', 'linkedin', 'phone', 'in_person', 'other');
CREATE TYPE public.industry_enum AS ENUM ('technology', 'finance', 'healthcare', 'education', 'retail', 'manufacturing', 'consulting', 'media', 'real_estate', 'other');
CREATE TYPE public.emp_count_enum AS ENUM ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'unknown');
CREATE TYPE public.outreach_status_enum AS ENUM ('not_contacted', 'contacted', 'replied', 'interested', 'not_interested', 'closed', 'follow_up');
CREATE TYPE public.lead_stage_enum AS ENUM ('new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');

-- Create raw_upload table to store exact CSV data
CREATE TABLE public.raw_upload (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  linkedin_url TEXT,
  email TEXT,
  channel TEXT,
  company TEXT,
  name TEXT,
  phone TEXT,
  website TEXT,
  industry TEXT,
  emp_count TEXT,
  title TEXT,
  location TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create master table for deduplicated data
CREATE TABLE public.master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  linkedin_url TEXT,
  email TEXT,
  channel public.channel_enum,
  company TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  industry public.industry_enum,
  emp_count public.emp_count_enum,
  title TEXT,
  location TEXT,
  msg TEXT,
  last_action_date DATE,
  next_action_date DATE,
  outreach_status public.outreach_status_enum DEFAULT 'not_contacted',
  lead_stage public.lead_stage_enum DEFAULT 'new',
  first_outreach_channel public.channel_enum,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.raw_upload ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for raw_upload
CREATE POLICY "Public can manage raw upload data" ON public.raw_upload
  FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for master
CREATE POLICY "Public can manage master data" ON public.master
  FOR ALL USING (true) WITH CHECK (true);

-- Create function to process raw upload to master
CREATE OR REPLACE FUNCTION public.process_raw_upload_to_master()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $function$
  WITH staged AS (
    SELECT
      COALESCE(linkedin_url, email) AS dedupe_key,
      linkedin_url,
      email,
      channel::text::public.channel_enum AS channel,
      company,
      name,
      phone,
      website,
      industry::text::public.industry_enum AS industry,
      emp_count::text::public.emp_count_enum AS emp_count,
      title,
      location,
      NULL::text AS msg,
      NULL::date AS last_action_date,
      NULL::date AS next_action_date,
      'not_contacted'::public.outreach_status_enum AS outreach_status,
      'new'::public.lead_stage_enum AS lead_stage,
      NOW() AS created_at,
      NOW() AS updated_at
    FROM public.raw_upload
    WHERE COALESCE(linkedin_url, email) IS NOT NULL
      AND processed = false
      AND name IS NOT NULL
  )

  INSERT INTO public.master (
    dedupe_key, linkedin_url, email, channel, company, name, phone, website,
    industry, emp_count, title, location, msg, last_action_date,
    next_action_date, outreach_status, lead_stage, created_at, updated_at
  )
  SELECT 
    dedupe_key, linkedin_url, email, channel, company, name, phone, website,
    industry, emp_count, title, location, msg, last_action_date,
    next_action_date, outreach_status, lead_stage, created_at, updated_at
  FROM staged
  ON CONFLICT (dedupe_key)
  DO UPDATE
  SET
    linkedin_url = EXCLUDED.linkedin_url,
    email = EXCLUDED.email,
    channel = EXCLUDED.channel,
    company = EXCLUDED.company,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    industry = EXCLUDED.industry,
    emp_count = EXCLUDED.emp_count,
    title = EXCLUDED.title,
    location = EXCLUDED.location,
    first_outreach_channel = COALESCE(master.first_outreach_channel, EXCLUDED.channel),
    msg = COALESCE(master.msg, EXCLUDED.msg),
    last_action_date = CASE
      WHEN master.outreach_status IS DISTINCT FROM EXCLUDED.outreach_status
        OR master.lead_stage IS DISTINCT FROM EXCLUDED.lead_stage
      THEN NOW()::date
      ELSE master.last_action_date
    END,
    updated_at = NOW();

  -- Mark processed records
  UPDATE public.raw_upload 
  SET processed = true 
  WHERE COALESCE(linkedin_url, email) IS NOT NULL
    AND processed = false
    AND name IS NOT NULL;
$function$;

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_raw_upload_updated_at
  BEFORE UPDATE ON public.raw_upload
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_master_updated_at
  BEFORE UPDATE ON public.master
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();