-- Add function to insert new contact with proper defaults
-- Migration: 20250828000000_add_insert_new_contact_function.sql

CREATE OR REPLACE FUNCTION public.insert_new_contact(
  p_dedupe_key TEXT,
  p_name TEXT DEFAULT 'New Contact'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contact_id UUID;
BEGIN
  -- Insert new contact with sensible defaults
  INSERT INTO public.master (
    dedupe_key,
    name,
    email,
    company,
    title,
    phone,
    linkedin_url,
    channel,
    channel_from,
    website,
    industry,
    emp_count,
    location,
    msg,
    outreach_status,
    lead_stage,
    last_action_date,
    next_action_date
  ) VALUES (
    p_dedupe_key,
    p_name,
    '',
    '',
    '',
    '',
    '',
    'linkedin',
    'linkedin',
    '',
    'other',
    'unknown',
    '',
    '',
    'not_contacted',
    'new',
    NULL,
    NULL
  )
  RETURNING id INTO v_contact_id;
  
  RETURN v_contact_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.insert_new_contact(TEXT, TEXT) TO anon, authenticated;
