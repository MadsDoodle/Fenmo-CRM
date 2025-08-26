-- Update lead_stage_enum with new values
-- Migration: 20250826003000_update_lead_stage_enum.sql

-- Create new enum with all values
CREATE TYPE lead_stage_enum_new AS ENUM (
  'replied',
  'first_call', 
  'lead_qualified',
  'move_opportunity_to_crm',
  'not_interested',
  'cold',
  'not_relevant'
);

-- Add temporary column with new enum type
ALTER TABLE public.master ADD COLUMN lead_stage_new lead_stage_enum_new;

-- Migrate data to new column
UPDATE public.master 
SET lead_stage_new = CASE 
  WHEN lead_stage = 'new' THEN 'cold'::lead_stage_enum_new
  WHEN lead_stage = 'qualified' THEN 'lead_qualified'::lead_stage_enum_new
  WHEN lead_stage = 'proposal' THEN 'move_opportunity_to_crm'::lead_stage_enum_new
  WHEN lead_stage = 'negotiation' THEN 'move_opportunity_to_crm'::lead_stage_enum_new
  WHEN lead_stage = 'closed_won' THEN 'move_opportunity_to_crm'::lead_stage_enum_new
  WHEN lead_stage = 'closed_lost' THEN 'not_interested'::lead_stage_enum_new
  ELSE 'cold'::lead_stage_enum_new
END;

-- Drop old column and rename new one
ALTER TABLE public.master DROP COLUMN lead_stage;
ALTER TABLE public.master RENAME COLUMN lead_stage_new TO lead_stage;

-- Drop old enum and rename new one
DROP TYPE lead_stage_enum;
ALTER TYPE lead_stage_enum_new RENAME TO lead_stage_enum;

-- Set default value for new records
ALTER TABLE public.master 
ALTER COLUMN lead_stage SET DEFAULT 'cold'::lead_stage_enum;
