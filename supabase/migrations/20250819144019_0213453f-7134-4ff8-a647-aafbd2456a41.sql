-- Clear all data and fix the duplicate key issue
TRUNCATE TABLE public.raw_upload CASCADE;
TRUNCATE TABLE public.master CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.message_templates CASCADE;

-- Recreate sample templates
INSERT INTO public.message_templates (name, channel, subject, content) VALUES
('Cold Email Introduction', 'email', 'Quick question about {{company}}', 'Hi {{name}},

I noticed that {{company}} is doing great work in {{industry}}. I''d love to learn more about your current challenges and see if there''s a way we can help.

Would you be open to a brief 15-minute call this week?

Best regards,
[Your Name]'),
('LinkedIn Connection Request', 'linkedin', '', 'Hi {{name}},

I came across your profile and was impressed by your work at {{company}}. I''d love to connect and potentially explore ways we can collaborate.

Best regards,
[Your Name]'),
('Clay Outreach', 'clay', 'Partnership opportunity', 'Hi {{name}},

I found your profile through Clay and was impressed by your work at {{company}}. I think there might be a great opportunity for us to collaborate.

Would you be interested in a quick chat?

Best regards,
[Your Name]');

-- Fix the processing function to handle duplicates properly
CREATE OR REPLACE FUNCTION public.process_raw_upload_to_master()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  -- First, handle the raw data by creating unique identifiers for duplicates
  WITH deduplicated_raw AS (
    SELECT DISTINCT ON (COALESCE(linkedin_url, email))
      COALESCE(linkedin_url, email) AS dedupe_key,
      linkedin_url,
      email,
      -- Map channel values to valid enum values
      CASE 
        WHEN LOWER(channel) IN ('clay') THEN 'clay'::channel_enum
        WHEN LOWER(channel) IN ('email', 'e-mail', 'mail') THEN 'email'::channel_enum
        WHEN LOWER(channel) IN ('linkedin', 'li') THEN 'linkedin'::channel_enum
        WHEN LOWER(channel) IN ('phone', 'call', 'tel') THEN 'phone'::channel_enum
        WHEN LOWER(channel) IN ('in_person', 'in-person', 'inperson', 'meeting') THEN 'in_person'::channel_enum
        ELSE 'other'::channel_enum
      END AS channel,
      company,
      name,
      phone,
      website,
      -- Map industry values to valid enum values
      CASE 
        WHEN LOWER(industry) IN ('accounting', 'finance', 'financial', 'banking', 'fintech') THEN 'finance'::industry_enum
        WHEN LOWER(industry) IN ('technology', 'tech', 'software', 'it') THEN 'technology'::industry_enum
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
      NOW() AS created_at,
      NOW() AS updated_at
    FROM public.raw_upload
    WHERE COALESCE(linkedin_url, email) IS NOT NULL
      AND processed = false
      AND name IS NOT NULL
      AND name != ''
      AND COALESCE(linkedin_url, email) != ''
    ORDER BY COALESCE(linkedin_url, email), created_at
  )
  
  INSERT INTO public.master (
    dedupe_key, linkedin_url, email, channel, company, name, phone, website,
    industry, emp_count, title, location, msg, last_action_date,
    next_action_date, outreach_status, lead_stage, created_at, updated_at
  )
  SELECT 
    dedupe_key, 
    linkedin_url, 
    email, 
    channel, 
    company, 
    name, 
    phone, 
    website,
    industry, 
    emp_count, 
    title, 
    location, 
    NULL::text AS msg,
    NULL::date AS last_action_date,
    NULL::date AS next_action_date,
    'not_contacted'::outreach_status_enum AS outreach_status,
    'new'::lead_stage_enum AS lead_stage,
    created_at, 
    updated_at
  FROM deduplicated_raw
  ON CONFLICT (dedupe_key)
  DO UPDATE
  SET
    linkedin_url = COALESCE(EXCLUDED.linkedin_url, master.linkedin_url),
    email = COALESCE(EXCLUDED.email, master.email),
    channel = EXCLUDED.channel,
    company = COALESCE(EXCLUDED.company, master.company),
    name = COALESCE(EXCLUDED.name, master.name),
    phone = COALESCE(EXCLUDED.phone, master.phone),
    website = COALESCE(EXCLUDED.website, master.website),
    industry = COALESCE(EXCLUDED.industry, master.industry),
    emp_count = COALESCE(EXCLUDED.emp_count, master.emp_count),
    title = COALESCE(EXCLUDED.title, master.title),
    location = COALESCE(EXCLUDED.location, master.location),
    updated_at = NOW();

  -- Mark all processed records (including duplicates)
  UPDATE public.raw_upload 
  SET processed = true 
  WHERE COALESCE(linkedin_url, email) IS NOT NULL
    AND processed = false
    AND name IS NOT NULL;
$function$;