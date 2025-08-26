-- Update the processing function to be more robust with channel mapping
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
      -- Map channel values to valid enum values
      CASE 
        WHEN LOWER(channel) IN ('email', 'e-mail', 'mail') THEN 'email'::channel_enum
        WHEN LOWER(channel) IN ('linkedin', 'li') THEN 'linkedin'::channel_enum
        WHEN LOWER(channel) IN ('phone', 'call', 'tel') THEN 'phone'::channel_enum
        WHEN LOWER(channel) IN ('clay') THEN 'clay'::channel_enum
        WHEN LOWER(channel) IN ('in_person', 'in-person', 'inperson', 'meeting') THEN 'in_person'::channel_enum
        ELSE 'other'::channel_enum
      END AS channel,
      company,
      name,
      phone,
      website,
      -- Map industry values to valid enum values
      CASE 
        WHEN LOWER(industry) IN ('technology', 'tech', 'software', 'it') THEN 'technology'::industry_enum
        WHEN LOWER(industry) IN ('finance', 'financial', 'banking', 'fintech') THEN 'finance'::industry_enum
        WHEN LOWER(industry) IN ('healthcare', 'health', 'medical', 'pharma') THEN 'healthcare'::industry_enum
        WHEN LOWER(industry) IN ('education', 'edu', 'school', 'university') THEN 'education'::industry_enum
        WHEN LOWER(industry) IN ('retail', 'ecommerce', 'e-commerce') THEN 'retail'::industry_enum
        WHEN LOWER(industry) IN ('manufacturing', 'factory', 'production') THEN 'manufacturing'::industry_enum
        WHEN LOWER(industry) IN ('consulting', 'advisory', 'services') THEN 'consulting'::industry_enum
        WHEN LOWER(industry) IN ('real_estate', 'real estate', 'property') THEN 'real_estate'::industry_enum
        WHEN LOWER(industry) IN ('media', 'marketing', 'advertising') THEN 'media'::industry_enum
        ELSE 'other'::industry_enum
      END AS industry,
      -- Map emp_count values to valid enum values
      CASE 
        WHEN emp_count ~ '^[0-9]+$' THEN
          CASE 
            WHEN emp_count::INTEGER BETWEEN 1 AND 10 THEN '1-10'::emp_count_enum
            WHEN emp_count::INTEGER BETWEEN 11 AND 50 THEN '11-50'::emp_count_enum
            WHEN emp_count::INTEGER BETWEEN 51 AND 200 THEN '51-200'::emp_count_enum
            WHEN emp_count::INTEGER BETWEEN 201 AND 500 THEN '201-500'::emp_count_enum
            WHEN emp_count::INTEGER BETWEEN 501 AND 1000 THEN '501-1000'::emp_count_enum
            WHEN emp_count::INTEGER > 1000 THEN '1000+'::emp_count_enum
            ELSE 'unknown'::emp_count_enum
          END
        WHEN LOWER(emp_count) IN ('1-10', '1 to 10') THEN '1-10'::emp_count_enum
        WHEN LOWER(emp_count) IN ('11-50', '11 to 50') THEN '11-50'::emp_count_enum
        WHEN LOWER(emp_count) IN ('51-200', '51 to 200') THEN '51-200'::emp_count_enum
        WHEN LOWER(emp_count) IN ('201-500', '201 to 500') THEN '201-500'::emp_count_enum
        WHEN LOWER(emp_count) IN ('501-1000', '501 to 1000') THEN '501-1000'::emp_count_enum
        WHEN LOWER(emp_count) IN ('1000+', '1000 plus', 'over 1000') THEN '1000+'::emp_count_enum
        ELSE 'unknown'::emp_count_enum
      END AS emp_count,
      title,
      location,
      NULL::text AS msg,
      NULL::date AS last_action_date,
      NULL::date AS next_action_date,
      'not_contacted'::outreach_status_enum AS outreach_status,
      'new'::lead_stage_enum AS lead_stage,
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