-- Run these commands ONE AT A TIME in Supabase SQL editor
-- Each command must be executed separately

-- 1. First command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'not_contacted';

-- 2. Second command (run after first completes):
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'requested';

-- 3. Third command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'accepted';

-- 4. Fourth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'intro_msg';

-- 5. Fifth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'follow_up_1';

-- 6. Sixth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'newsletter_1';

-- 7. Seventh command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'value_prop';

-- 8. Eighth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'hold_thread';

-- 9. Ninth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'newsletter_2';

-- 10. Tenth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'follow_up_2';

-- 11. Eleventh command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'email_sequence';

-- 12. Twelfth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'qualified';

-- 13. Thirteenth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'proposal_sent';

-- 14. Fourteenth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'meeting_scheduled';

-- 15. Fifteenth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'demo_completed';

-- 16. Sixteenth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'negotiation';

-- 17. Seventeenth command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'closed_won';

-- 18. Final command:
ALTER TYPE template_status_enum ADD VALUE IF NOT EXISTS 'closed_lost';

-- Verify all values were added:
SELECT unnest(enum_range(NULL::template_status_enum)) AS template_status_values ORDER BY template_status_values;
