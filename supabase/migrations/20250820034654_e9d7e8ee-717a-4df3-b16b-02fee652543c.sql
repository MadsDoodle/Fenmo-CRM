-- Clear messages that reference templates first
DELETE FROM public.messages WHERE template_id IS NOT NULL;

-- Drop the existing status column that failed to convert
ALTER TABLE public.message_templates DROP COLUMN IF EXISTS status;

-- Create enum for template status
CREATE TYPE template_status_enum AS ENUM (
  'contacted',
  'not_yet', 
  'replied',
  'interested',
  'not_interested',
  'closed',
  'follow_up'
);

-- Add status column with proper enum type
ALTER TABLE public.message_templates ADD COLUMN status template_status_enum NOT NULL DEFAULT 'contacted'::template_status_enum;

-- Clear existing templates
DELETE FROM public.message_templates WHERE 1=1;

-- Insert professional message templates
INSERT INTO public.message_templates (name, subject, content, channel, status, usage_count, is_active) VALUES
('Initial Email Outreach', 'Partnership Opportunity with {{company}}', 'Hi {{name}},

I hope this email finds you well. I came across {{company}} and was impressed by your work in {{industry}}.

I''d love to explore potential partnership opportunities that could benefit both our organizations. Would you be open to a brief 15-minute call this week to discuss?

Best regards,
[Your Name]', 'email', 'contacted', 0, true),
('LinkedIn Connection Request', null, 'Hi {{name}}, I''d love to connect and explore potential collaboration opportunities between our companies. Your work at {{company}} is impressive!', 'linkedin', 'contacted', 0, true),
('Email Follow-up After Reply', 'Thank you for your response - Next Steps', 'Hi {{name}},

Thank you for your prompt response! I''m excited about the potential to work together.

As discussed, I''ve attached our partnership proposal. I''d love to schedule a call to walk through the details and answer any questions you might have.

What does your calendar look like next week for a 30-minute discussion?

Best regards,
[Your Name]', 'email', 'replied', 0, true),
('Email - Interest Confirmed', 'Moving Forward with Our Partnership Discussion', 'Hi {{name}},

I''m thrilled to hear about your interest in partnering with us! Your enthusiasm for the project is exactly what we were hoping for.

I''ve prepared a detailed proposal that outlines the next steps. Can we schedule a call for this week to go through everything together?

Looking forward to our collaboration,
[Your Name]', 'email', 'interested', 0, true),
('Email - Strategic Follow-up', 'Following up on our Partnership Discussion', 'Hi {{name}},

I wanted to follow up on our conversation about the partnership opportunity between our companies.

I understand you''re busy, so I''ll keep this brief. The proposal I sent over addresses the key points we discussed, particularly around [specific benefit for their company].

Would it be helpful if I scheduled a brief 15-minute call to address any questions you might have?

Best regards,
[Your Name]', 'email', 'follow_up', 0, true);

-- Add tasks table if not exists
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid REFERENCES public.master(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  due_date date,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for tasks if not exists
DROP POLICY IF EXISTS "Public can manage tasks" ON public.tasks;
CREATE POLICY "Public can manage tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for tasks updated_at if not exists
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();