-- Add channel_from column to master table if it doesn't exist
-- Migration: 20250825153900_add_channel_from_column.sql

-- Add channel_from column to master table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'master' 
        AND column_name = 'channel_from'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.master 
        ADD COLUMN channel_from TEXT;
        
        -- Add comment for documentation
        COMMENT ON COLUMN public.master.channel_from IS 'Channel from which the contact was acquired or preferred communication channel';
    END IF;
END $$;
