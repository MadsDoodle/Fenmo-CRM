-- SQL script to update template_status_enum to include all channel-specific status values
-- Run each ALTER TYPE command separately in your Supabase SQL editor
-- PostgreSQL requires each enum value addition to be in a separate transaction

-- IMPORTANT: Run these commands ONE AT A TIME, not all together
-- Each command must be executed separately and committed before running the next

ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'not_contacted';

-- After running the above, run this next command:
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'requested';

-- Continue with each command individually:
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'accepted';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'intro_msg';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'follow_up_1';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'newsletter_1';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'value_prop';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'hold_thread';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'newsletter_2';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'follow_up_2';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'email_sequence';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'qualified';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'proposal_sent';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'meeting_scheduled';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'demo_completed';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'negotiation';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'closed_won';
-- ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'closed_lost';

-- After all values are added, verify with:
-- SELECT unnest(enum_range(NULL::template_status_enum)) AS template_status_values;
