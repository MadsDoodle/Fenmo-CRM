-- Add new enum values for outreach workflow
-- Migration: 20250825000000_add_enum_values.sql

-- 1. Create channel enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.channel_enum AS ENUM ('linkedin', 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add new workflow status enum values
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'requested';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'intro_msg';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'follow_up_1';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'newsletter_1';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'value_prop';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'hold_thread';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'newsletter_2';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'follow_up_2';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'email_sequence';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'soft_nudge';
ALTER TYPE public.outreach_status_enum ADD VALUE IF NOT EXISTS 'move_to_cold';
