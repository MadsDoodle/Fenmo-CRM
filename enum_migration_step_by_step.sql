-- Step-by-step enum migration for template_status_enum
-- Copy and paste each command individually into Supabase SQL editor

-- Step 1:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'not_contacted';

-- Step 2:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'requested';

-- Step 3:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'accepted';

-- Step 4:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'intro_msg';

-- Step 5:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'follow_up_1';

-- Step 6:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'newsletter_1';

-- Step 7:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'value_prop';

-- Step 8:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'hold_thread';

-- Step 9:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'newsletter_2';

-- Step 10:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'follow_up_2';

-- Step 11:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'email_sequence';

-- Step 12:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'qualified';

-- Step 13:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'proposal_sent';

-- Step 14:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'meeting_scheduled';

-- Step 15:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'demo_completed';

-- Step 16:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'negotiation';

-- Step 17:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'closed_won';

-- Step 18:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'closed_lost';

-- Verification (run after all steps):
SELECT unnest(enum_range(NULL::template_status_enum)) AS template_status_values;
