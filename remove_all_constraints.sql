-- Simply remove all check constraints - the enum provides sufficient validation
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_linkedin_status;
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_email_status;
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_whatsapp_status;
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS check_sms_status;
