# Database Migrations

This directory contains the database migrations for the Fenmo CRM follow-up system.

## Migration Order

Run the migrations in the following order:

1. **20250821000000_add_followup_system.sql** - Creates the follow-up system foundation
   - Creates `followup_rules` table
   - Adds new fields to `master` table (`last_action`, `next_action`, `priority`, `custom_followup_days`)
   - Creates `priority_enum` type
   - Sets up automatic triggers for next_action calculation

2. **20250821000001_add_notification_system.sql** - Adds the notification system
   - Creates `notifications` table
   - Sets up daily reminder functions
   - Creates notification management functions

## How to Run Migrations

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content
4. Run them in order

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL Execution
1. Open the SQL Editor in Supabase Dashboard
2. Run the first migration: `20250821000000_add_followup_system.sql`
3. Run the second migration: `20250821000001_add_notification_system.sql`

## Post-Migration Setup

After running the migrations:

1. **Set up the cron job** for daily reminders:
   - Go to **Database → Functions → Cron Jobs**
   - Add a new cron job:
     - Schedule: `0 9 * * *` (every day at 9 AM)
     - Function: `SELECT public.generate_daily_reminders();`

2. **Test the system**:
   - Visit `/test-followup` in your app
   - Run the test functions to verify everything works

3. **Verify functionality**:
   - Check the Scheduling page (`/scheduling`)
   - Test the notification bell in the header
   - Verify Tasks page syncs correctly

## Troubleshooting

### Common Issues

1. **"type priority_enum does not exist"**
   - Make sure you're running the migrations in order
   - The enum is created in the first migration before it's used

2. **"function calculate_next_action does not exist"**
   - Ensure the first migration completed successfully
   - Check that all functions were created

3. **"table followup_rules does not exist"**
   - Run the first migration completely
   - Check for any SQL errors in the execution

### Verification Queries

Run these queries to verify the setup:

```sql
-- Check if followup_rules table exists
SELECT * FROM followup_rules LIMIT 5;

-- Check if master table has new fields
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'master' 
AND column_name IN ('last_action', 'next_action', 'priority', 'custom_followup_days');

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('calculate_next_action', 'generate_daily_reminders');
```
