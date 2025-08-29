-- Add emp_count_raw column to master table to store exact employee count values from CSV
ALTER TABLE public.master ADD COLUMN emp_count_raw TEXT;

-- Update the process_raw_upload_to_master function to include emp_count_raw mapping
CREATE OR REPLACE FUNCTION public.process_raw_upload_to_master()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $function$
  WITH staged AS (
    SELECT DISTINCT ON (COALESCE(linkedin_url, email))
      COALESCE(linkedin_url, email) AS dedupe_key,
      linkedin_url,
      email,
      CASE 
        WHEN channel::text IN ('email', 'linkedin', 'phone', 'in_person', 'other', 'clay', 'whatsapp', 'sms') 
        THEN channel::text::public.channel_enum 
        ELSE NULL
      END AS channel,
      channel AS channels, -- Store exact channel value from CSV
      company,
      name,
      phone,
      website,
      CASE 
        WHEN industry::text IN ('technology', 'finance', 'healthcare', 'education', 'retail', 'manufacturing', 'consulting', 'media', 'real_estate', 'other') 
        THEN industry::text::public.industry_enum 
        ELSE NULL
      END AS industry,
      CASE 
        WHEN emp_count::text IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'unknown') 
        THEN emp_count::text::public.emp_count_enum 
        ELSE NULL
      END AS emp_count,
      emp_count AS emp_count_raw, -- Store exact emp_count value from CSV
      title,
      location,
      NULL::uuid AS msg,
      NULL::date AS last_action_date,
      NULL::date AS next_action_date,
      'not_contacted'::public.outreach_status_enum AS outreach_status,
      'cold'::public.lead_stage_enum AS lead_stage,
      NOW() AS created_at,
      NOW() AS updated_at
    FROM public.raw_upload
    WHERE COALESCE(linkedin_url, email) IS NOT NULL
      AND processed = false
      AND name IS NOT NULL
  )

  INSERT INTO public.master (
    dedupe_key, linkedin_url, email, channel, channels, company, name, phone, website,
    industry, emp_count, emp_count_raw, title, location, msg, last_action_date,
    next_action_date, outreach_status, lead_stage, created_at, updated_at
  )
  SELECT 
    dedupe_key, linkedin_url, email, channel, channels, company, name, phone, website,
    industry, emp_count, emp_count_raw, title, location, msg, last_action_date,
    next_action_date, outreach_status, lead_stage, created_at, updated_at
  FROM staged
  ON CONFLICT (dedupe_key)
  DO UPDATE
  SET
    linkedin_url = EXCLUDED.linkedin_url,
    email = EXCLUDED.email,
    channel = EXCLUDED.channel,
    channels = EXCLUDED.channels,
    company = EXCLUDED.company,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    industry = EXCLUDED.industry,
    emp_count = EXCLUDED.emp_count,
    emp_count_raw = EXCLUDED.emp_count_raw,
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
