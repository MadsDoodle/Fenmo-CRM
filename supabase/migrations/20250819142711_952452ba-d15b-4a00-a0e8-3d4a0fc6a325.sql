-- Remove conflicting tables and create message system
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- Create message templates table
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table for logging
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES public.master(id),
  template_id UUID REFERENCES public.message_templates(id),
  channel TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can manage message templates" ON public.message_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample templates
INSERT INTO public.message_templates (name, channel, subject, content) VALUES
('Cold Email Introduction', 'email', 'Quick question about {{company}}', 'Hi {{name}},

I noticed that {{company}} is doing great work in {{industry}}. I''d love to learn more about your current challenges and see if there''s a way we can help.

Would you be open to a brief 15-minute call this week?

Best regards,
[Your Name]'),
('LinkedIn Connection Request', 'linkedin', '', 'Hi {{name}},

I came across your profile and was impressed by your work at {{company}}. I''d love to connect and potentially explore ways we can collaborate.

Best regards,
[Your Name]'),
('Follow-up Email', 'email', 'Following up on our conversation', 'Hi {{name}},

I wanted to follow up on our previous conversation about {{company}}''s needs. Have you had a chance to consider our proposal?

I''d be happy to answer any questions you might have.

Best regards,
[Your Name]');