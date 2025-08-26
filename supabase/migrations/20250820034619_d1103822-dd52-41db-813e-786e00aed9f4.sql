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

-- Clear existing data and insert professional message templates
DELETE FROM public.message_templates WHERE 1=1;

INSERT INTO public.message_templates (name, subject, content, channel, status, usage_count, is_active) VALUES

-- CONTACTED stage templates
('Initial Email Outreach', 'Partnership Opportunity with {{company}}', 'Hi {{name}},

I hope this email finds you well. I came across {{company}} and was impressed by your work in {{industry}}.

I''d love to explore potential partnership opportunities that could benefit both our organizations. Would you be open to a brief 15-minute call this week to discuss?

Best regards,
[Your Name]', 'email', 'contacted', 0, true),

('LinkedIn Connection Request', null, 'Hi {{name}}, I''d love to connect and explore potential collaboration opportunities between our companies. Your work at {{company}} is impressive!', 'linkedin', 'contacted', 0, true),

('WhatsApp Introduction', null, 'Hi {{name}}, I hope you''re doing well! I came across {{company}} and would love to discuss some exciting partnership opportunities. Are you available for a quick call this week?', 'whatsapp', 'contacted', 0, true),

('SMS Introduction', null, 'Hi {{name}}, this is [Your Name]. I''d love to discuss potential business opportunities with {{company}}. Are you available for a brief call? Reply STOP to opt out.', 'sms', 'contacted', 0, true),

-- NOT_YET stage templates
('Pre-Outreach Email', 'Researching {{company}} for Partnership', 'Hi {{name}},

I''ve been researching companies in the {{industry}} space and {{company}} caught my attention. I''m preparing a partnership proposal that I believe could be mutually beneficial.

I''ll be reaching out soon with more details. In the meantime, feel free to check out our work at [your website].

Best regards,
[Your Name]', 'email', 'not_yet', 0, true),

('LinkedIn Preview Message', null, 'Hi {{name}}, I''ve been following {{company}}''s progress and am preparing an exciting collaboration proposal. Will reach out soon with details!', 'linkedin', 'not_yet', 0, true),

-- REPLIED stage templates  
('Email Follow-up After Reply', 'Thank you for your response - Next Steps', 'Hi {{name}},

Thank you for your prompt response! I''m excited about the potential to work together.

As discussed, I''ve attached our partnership proposal. I''d love to schedule a call to walk through the details and answer any questions you might have.

What does your calendar look like next week for a 30-minute discussion?

Best regards,
[Your Name]', 'email', 'replied', 0, true),

('LinkedIn Follow-up', null, 'Thanks for connecting, {{name}}! I''m excited to explore how we can collaborate. I''ll send over some details about our partnership proposal via email shortly.', 'linkedin', 'replied', 0, true),

('WhatsApp Follow-up', null, 'Hi {{name}}, thanks for your response! I''d love to schedule a call to discuss the partnership opportunity in more detail. When works best for you?', 'whatsapp', 'replied', 0, true),

-- INTERESTED stage templates
('Email - Interest Confirmed', 'Moving Forward with Our Partnership Discussion', 'Hi {{name}},

I''m thrilled to hear about your interest in partnering with us! Your enthusiasm for the project is exactly what we were hoping for.

I''ve prepared a detailed proposal that outlines the next steps. Can we schedule a call for this week to go through everything together?

I''m available [your availability]. What works best for you?

Looking forward to our collaboration,
[Your Name]', 'email', 'interested', 0, true),

('LinkedIn - Interest Follow-up', null, 'Fantastic news about your interest in our partnership, {{name}}! I''ll be sending a detailed proposal to your email. Looking forward to our next conversation!', 'linkedin', 'interested', 0, true),

('WhatsApp - Interest Confirmation', null, 'That''s great news, {{name}}! I''m excited about {{company}}''s interest in partnering with us. Let''s schedule a call to discuss the details. When are you free this week?', 'whatsapp', 'interested', 0, true),

-- NOT_INTERESTED stage templates
('Email - Respectful Follow-up', 'Thank you for your time - Future Opportunities', 'Hi {{name}},

Thank you for taking the time to consider our partnership proposal. I completely understand that the timing isn''t right for {{company}} at the moment.

I''ll keep you in mind for future opportunities that might be a better fit. In the meantime, I wish you and your team continued success.

Best regards,
[Your Name]

P.S. Feel free to reach out if anything changes or if there''s another way we might collaborate.', 'email', 'not_interested', 0, true),

('LinkedIn - Professional Closure', null, 'Thanks for your consideration, {{name}}. I understand the timing isn''t right for {{company}}. I''ll keep you in mind for future opportunities that might be a better fit!', 'linkedin', 'not_interested', 0, true),

-- CLOSED stage templates
('Email - Deal Closed Successfully', 'Welcome to the Partnership - Next Steps', 'Hi {{name}},

Welcome to our partnership! I''m excited to officially begin working together with {{company}}.

I''ve attached the signed agreement and our onboarding guide. Our project manager will be in touch within 24 hours to coordinate the next steps.

Thank you for choosing to partner with us. Here''s to a successful collaboration!

Best regards,
[Your Name]', 'email', 'closed', 0, true),

('LinkedIn - Partnership Announcement', null, 'Excited to officially announce our partnership with {{company}}, {{name}}! Looking forward to great things ahead. Thank you for your trust in our collaboration!', 'linkedin', 'closed', 0, true),

-- FOLLOW_UP stage templates
('Email - Strategic Follow-up', 'Following up on our Partnership Discussion', 'Hi {{name}},

I wanted to follow up on our conversation about the partnership opportunity between our companies.

I understand you''re busy, so I''ll keep this brief. The proposal I sent over addresses the key points we discussed, particularly around [specific benefit for their company].

Would it be helpful if I scheduled a brief 15-minute call to address any questions you might have?

Best regards,
[Your Name]', 'email', 'follow_up', 0, true),

('LinkedIn - Gentle Follow-up', null, 'Hi {{name}}, just following up on our partnership discussion. I know you''re busy, but wanted to see if you had any questions about the proposal. Happy to jump on a quick call!', 'linkedin', 'follow_up', 0, true),

('WhatsApp - Follow-up Check', null, 'Hi {{name}}, hope you''re doing well! Just wanted to follow up on our partnership discussion. Any questions about the proposal I can help clarify?', 'whatsapp', 'follow_up', 0, true),

('SMS - Brief Follow-up', null, 'Hi {{name}}, following up on our partnership discussion. Quick question: would a brief call help clarify anything about the proposal? Reply STOP to opt out.', 'sms', 'follow_up', 0, true);

-- Add tasks table for task management
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

-- Create policy for tasks
CREATE POLICY "Public can manage tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for tasks updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();