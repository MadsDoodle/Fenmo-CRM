-- Add outreach_status column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN outreach_status TEXT DEFAULT 'not_started';

-- Create index for better performance
CREATE INDEX idx_contacts_outreach_status ON public.contacts(outreach_status);

-- Add priority column to tasks table if it doesn't exist (it should already exist)
-- This is just to ensure the column exists with proper constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tasks' AND column_name='priority') THEN
        ALTER TABLE public.tasks ADD COLUMN priority TEXT DEFAULT 'medium';
    END IF;
END $$;

-- Create function to update contact outreach status based on task completion
CREATE OR REPLACE FUNCTION public.update_contact_outreach_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update contact outreach status when a task is completed or updated
    IF NEW.contact_id IS NOT NULL THEN
        -- Determine the outreach status based on task status
        IF NEW.status = 'completed' THEN
            UPDATE public.contacts 
            SET outreach_status = 'reached_out'
            WHERE id = NEW.contact_id;
        ELSIF NEW.status = 'in_progress' THEN
            UPDATE public.contacts 
            SET outreach_status = 'in_progress'
            WHERE id = NEW.contact_id;
        ELSIF NEW.status = 'todo' THEN
            -- Check if there are any other completed tasks for this contact
            IF NOT EXISTS (
                SELECT 1 FROM public.tasks 
                WHERE contact_id = NEW.contact_id 
                AND status = 'completed' 
                AND id != NEW.id
            ) THEN
                UPDATE public.contacts 
                SET outreach_status = 'not_started'
                WHERE id = NEW.contact_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update outreach status
CREATE TRIGGER update_contact_outreach_status_trigger
    AFTER INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_contact_outreach_status();