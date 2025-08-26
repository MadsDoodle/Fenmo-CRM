-- Ensure one pipeline task per contact and orchestrate syncing with master

-- 1) Unique constraint on tasks.contact_id for upsert safety
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tasks_contact_unique'
  ) THEN
    ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_contact_unique UNIQUE (contact_id);
  END IF;
END $$;

-- 2) Mapping function from outreach_status to task status
CREATE OR REPLACE FUNCTION public.map_outreach_to_task_status(status public.outreach_status_enum)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN status = 'not_contacted' THEN 'todo'
    WHEN status IN ('contacted','replied','interested','follow_up') THEN 'in_progress'
    WHEN status IN ('not_interested','closed') THEN 'completed'
    ELSE 'in_progress'
  END
$$;

-- 3) Backfill tasks for existing master rows without a task
INSERT INTO public.tasks (contact_id, title, description, status, priority)
SELECT m.id,
       'Outreach Task',
       'Track outreach and next steps',
       public.map_outreach_to_task_status(m.outreach_status),
       'medium'
FROM public.master m
LEFT JOIN public.tasks t ON t.contact_id = m.id
WHERE t.id IS NULL;

-- 4) Create task upon new master insert
CREATE OR REPLACE FUNCTION public.create_task_for_master()
RETURNS trigger AS $$
BEGIN
  IF NEW.id IS NOT NULL THEN
    INSERT INTO public.tasks (contact_id, title, description, status, priority)
    VALUES (
      NEW.id,
      'Outreach Task',
      'Track outreach and next steps',
      public.map_outreach_to_task_status(NEW.outreach_status),
      'medium'
    )
    ON CONFLICT (contact_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_task_on_master_insert ON public.master;
CREATE TRIGGER create_task_on_master_insert
AFTER INSERT ON public.master
FOR EACH ROW
EXECUTE FUNCTION public.create_task_for_master();

-- 5) Keep task.status in sync when outreach_status changes on master
CREATE OR REPLACE FUNCTION public.sync_task_status_from_master()
RETURNS trigger AS $$
BEGIN
  IF NEW.outreach_status IS DISTINCT FROM OLD.outreach_status THEN
    UPDATE public.tasks
    SET status = public.map_outreach_to_task_status(NEW.outreach_status),
        completed_at = CASE WHEN NEW.outreach_status IN ('not_interested','closed') THEN now() ELSE NULL END,
        updated_at = now()
    WHERE contact_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_task_on_master_update ON public.master;
CREATE TRIGGER sync_task_on_master_update
AFTER UPDATE OF outreach_status ON public.master
FOR EACH ROW
EXECUTE FUNCTION public.sync_task_status_from_master();


