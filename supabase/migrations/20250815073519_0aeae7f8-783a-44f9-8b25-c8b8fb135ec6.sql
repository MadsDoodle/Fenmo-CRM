-- Create message templates table with channel-specific templates
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage message templates"
  ON message_templates
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create messages table for tracking sent messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  template_id uuid REFERENCES message_templates(id) ON DELETE SET NULL,
  channel text NOT NULL,
  subject text,
  content text NOT NULL,
  status text DEFAULT 'draft',
  sent_at timestamptz,
  opened_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage messages"
  ON messages
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS messages_contact_id_idx ON messages(contact_id);
CREATE INDEX IF NOT EXISTS messages_template_id_idx ON messages(template_id);
CREATE INDEX IF NOT EXISTS messages_status_idx ON messages(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_message_templates_updated_at();

-- Insert default templates
INSERT INTO message_templates (name, channel, subject, content) VALUES
(
  'Cold Email Outreach',
  'email',
  'Quick question about {{company}}',
  'Hi {{firstName}},

I hope this email finds you well. I noticed that {{company}} has been expanding in the {{industry}} space, and I thought you might be interested in learning about how we''ve helped similar companies achieve their goals.

Would you be open to a brief 15-minute conversation this week to discuss how we might be able to support {{company}}''s growth?

Best regards,
[Your Name]'
),
(
  'WhatsApp Follow-up',
  'whatsapp',
  NULL,
  'Hi {{firstName}}! 👋

Hope you''re doing well! Just wanted to follow up on our conversation about {{company}}. 

Got a few minutes to chat about those solutions we discussed? 

Let me know what works for you! 😊'
),
(
  'LinkedIn Connection',
  'linkedin',
  NULL,
  'Hi {{firstName}},

I came across your profile and was impressed by your work at {{company}}. I''d love to connect and potentially explore how we might collaborate in the {{industry}} space.

Looking forward to connecting!

Best,
[Your Name]'
),
(
  'SMS Follow-up',
  'sms',
  NULL,
  'Hi {{firstName}}, this is [Your Name] from our conversation about {{company}}. Quick question - would you be available for a brief call this week? Thanks!'
);