-- Update message_templates table to support channel-specific status values
-- Drop existing status column and recreate with proper constraints

-- First, add a new status column temporarily
ALTER TABLE public.message_templates ADD COLUMN new_status TEXT;

-- Update existing records with default status based on channel
UPDATE public.message_templates 
SET new_status = CASE 
  WHEN channel = 'linkedin' THEN 'Requested'
  WHEN channel = 'email' THEN 'Not Contacted'
  ELSE 'Requested'
END;

-- Drop the old status column
ALTER TABLE public.message_templates DROP COLUMN IF EXISTS status;

-- Rename new_status to status
ALTER TABLE public.message_templates RENAME COLUMN new_status TO status;

-- Make status NOT NULL
ALTER TABLE public.message_templates ALTER COLUMN status SET NOT NULL;

-- Add check constraints for channel-specific status values
ALTER TABLE public.message_templates ADD CONSTRAINT check_linkedin_status 
CHECK (
  channel != 'linkedin' OR status IN (
    'Requested', 'Accepted', 'Intro Msg', 'Follow Up 1', 'Newsletter 1', 
    'Value Prop', 'Hold Thread', 'Newsletter 2', 'Follow Up 2', 'Email Sequence'
  )
);

ALTER TABLE public.message_templates ADD CONSTRAINT check_email_status 
CHECK (
  channel != 'email' OR status IN (
    'Not Contacted', 'Email Sequence', 'Requested', 'Accepted', 'Intro Msg', 
    'Follow Up 1', 'Newsletter 1', 'Value Prop', 'Hold Thread', 'Newsletter 2', 'Follow Up 2'
  )
);

-- Clear existing sample data and insert new channel-specific samples
DELETE FROM public.message_templates;

-- Insert LinkedIn templates with appropriate statuses
INSERT INTO public.message_templates (name, channel, subject, content, status, is_active) VALUES
('LinkedIn Connection Request - Tech Industry', 'linkedin', '', 'Hi {{name}},

I noticed your impressive work at {{company}} in the tech space. Your recent post about {{topic}} really resonated with me.

I''d love to connect and potentially explore synergies between our work.

Best regards,
{{sender_name}}', 'Requested', true),

('LinkedIn Follow Up - Post Connection', 'linkedin', '', 'Hi {{name}},

Thanks for connecting! I''ve been following {{company}}''s growth in {{industry}} and I''m impressed by your team''s approach.

Would you be open to a brief call to discuss potential collaboration opportunities?

Best,
{{sender_name}}', 'Accepted', true),

('LinkedIn Intro Message - Value Proposition', 'linkedin', '', 'Hi {{name}},

I hope you''re doing well! I wanted to reach out because I believe our solution could help {{company}} with {{pain_point}}.

We''ve helped similar companies in {{industry}} achieve {{benefit}}. Would you be interested in a quick 15-minute demo?

Looking forward to hearing from you,
{{sender_name}}', 'Intro Msg', true),

('LinkedIn Newsletter Share', 'linkedin', '', 'Hi {{name}},

I thought you might find our latest newsletter interesting - it covers {{topic}} which I know is relevant to {{company}}''s current initiatives.

You can check it out here: {{newsletter_link}}

Would love to hear your thoughts!

Best,
{{sender_name}}', 'Newsletter 1', true),

('LinkedIn Value Proposition Follow-up', 'linkedin', '', 'Hi {{name}},

I wanted to follow up on my previous message about how we can help {{company}} with {{solution_area}}.

Our clients typically see {{specific_benefit}} within {{timeframe}}. Would next week work for a brief call?

Best regards,
{{sender_name}}', 'Value Prop', true);

-- Insert Email templates with appropriate statuses
INSERT INTO public.message_templates (name, channel, subject, content, status, is_active) VALUES
('Cold Email - Initial Outreach', 'email', 'Quick question about {{company}}', 'Hi {{name}},

I''ve been researching companies in {{industry}} and {{company}} caught my attention due to {{specific_reason}}.

I''d love to learn more about your current challenges with {{area}} and see if there''s a way we can help.

Would you be open to a brief 15-minute call this week?

Best regards,
{{sender_name}}
{{company}}
{{phone}}', 'Not Contacted', true),

('Email Follow Up - First Touch', 'email', 'Following up on {{company}}', 'Hi {{name}},

I sent you a message last week about {{topic}} and wanted to follow up.

I understand you''re probably busy, but I believe our solution could really help {{company}} with {{specific_challenge}}.

Would you have 10 minutes for a quick call this week?

Best,
{{sender_name}}', 'Follow Up 1', true),

('Email Newsletter Introduction', 'email', 'Thought you''d find this interesting', 'Hi {{name}},

I came across some insights about {{industry_trend}} that I thought might be relevant to {{company}}.

I''ve included them in our latest newsletter: {{newsletter_link}}

If you find it valuable, I''d love to discuss how these trends might impact your business.

Best regards,
{{sender_name}}', 'Newsletter 1', true),

('Email Value Proposition', 'email', 'How {{company}} can save {{amount}} on {{area}}', 'Hi {{name}},

Companies like {{company}} typically spend {{current_cost}} on {{area}}. 

Our solution has helped similar businesses reduce this by {{percentage}}% while improving {{metric}}.

Would you be interested in a 15-minute call to see how this could work for {{company}}?

Best,
{{sender_name}}
{{title}}
{{company}}', 'Value Prop', true),

('Email Sequence - Multi-touch Campaign', 'email', 'Final follow-up regarding {{company}}', 'Hi {{name}},

This will be my final email regarding {{solution}} for {{company}}.

I understand timing isn''t always right, but I wanted to leave you with this case study showing how {{similar_company}} achieved {{result}}.

If circumstances change, feel free to reach out anytime.

Best of luck with your initiatives,
{{sender_name}}', 'Email Sequence', true);

-- Update the updated_at timestamp
UPDATE public.message_templates SET updated_at = now();
