-- Clear existing message templates
DELETE FROM message_templates;

-- Add test templates for specific channel and status combinations
INSERT INTO message_templates (id, name, subject, content, channel, status, is_active, usage_count, created_at, updated_at) VALUES
(gen_random_uuid(), 'LinkedIn Interested Follow-up', 'Great to connect!', 'Hi {{name}}, Thanks for connecting! I noticed you''re interested in our solution. Would love to schedule a quick 15-minute call to discuss how we can help {{company}} achieve their goals.', 'linkedin', 'interested', true, 0, NOW(), NOW()),
(gen_random_uuid(), 'Email Initial Contact', 'Partnership Opportunity for {{company}}', 'Hi {{name}}, I hope this email finds you well. I came across {{company}} and was impressed by your work in {{industry}}. I believe there''s a great opportunity for us to collaborate. Would you be open to a brief conversation?', 'email', 'contacted', true, 0, NOW(), NOW()),
(gen_random_uuid(), 'LinkedIn Reply Follow-up', 'Next Steps Discussion', 'Hi {{name}}, Thank you for your interest in our solution! Based on our conversation, it seems like there''s a great fit for {{company}}. I''d love to schedule a demo to show you exactly how we can help streamline your {{industry}} operations.', 'linkedin', 'replied', true, 0, NOW(), NOW()),
(gen_random_uuid(), 'Email Follow-up Template', 'Following up on our conversation', 'Hi {{name}}, It was great speaking with you yesterday about {{company}}''s needs. As discussed, I''m attaching the proposal and pricing information. Please let me know if you have any questions or would like to schedule a follow-up call.', 'email', 'follow_up', false, 0, NOW(), NOW());
