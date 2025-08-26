-- Add templates for remaining statuses: not_interested, closed, follow_up
-- Each status will have 2 templates per channel (email, linkedin, whatsapp, sms, phone)

INSERT INTO message_templates (name, channel, status, subject, content, is_active) VALUES

-- NOT_INTERESTED STAGE TEMPLATES (all channels)
-- Email - Not Interested
('Email Not Interested - Understanding Objections', 'email', 'not_interested', 'Understanding your concerns about {{company}}', 'Hi {{name}},

I completely understand that our solution might not be the right fit for {{company}} at this time. I respect your decision and appreciate your honesty.

If you don''t mind me asking, what were the main factors that led to this decision? Understanding your concerns would help me serve future clients better.

If circumstances change in the future, please don''t hesitate to reach out. I''ll keep your information on file in case our solution becomes more relevant for {{company}} later.

Thank you for your time and consideration.

Best regards,
[Your name]', true),

('Email Not Interested - Future Opportunity', 'email', 'not_interested', 'Keeping the door open for {{company}}', 'Hello {{name}},

Thank you for letting me know that {{company}} isn''t interested at this time. I completely understand and respect your decision.

I''ll keep your contact information on file and perhaps reach out in 6-12 months to see if anything has changed. In the meantime, I''ll continue to share valuable industry insights occasionally - no sales pitch, just useful information.

If you ever have questions or if your situation changes, please feel free to reach out anytime.

Wishing you and {{company}} continued success!

Best,
[Your name]', true),

-- LinkedIn - Not Interested
('LinkedIn Not Interested - Graceful Exit', 'linkedin', 'not_interested', NULL, 'Hi {{name}},

Thank you for being upfront about {{company}}''s current situation. I completely understand and respect your decision.

I appreciate the time you took to consider our conversation. I''ll keep you in my network and perhaps reconnect in the future when timing might be better.

Wishing you continued success with your projects!

Best regards,
[Your name]', true),

('LinkedIn Not Interested - Value Connection', 'linkedin', 'not_interested', NULL, 'Hello {{name}},

I understand that our solution isn''t the right fit for {{company}} right now, and I respect that decision.

I value the connection we''ve made and would love to stay in touch. I often share useful industry insights and trends that might be valuable to you and your team.

Thank you for your time and honesty!

Best,
[Your name]', true),

-- WhatsApp - Not Interested
('WhatsApp Not Interested - Quick Thanks', 'whatsapp', 'not_interested', NULL, 'Hi {{name}}! 

Thanks for being honest about {{company}}''s situation. I totally understand and respect your decision! 

I''ll keep you in mind for the future in case things change. Wishing you all the best! 🙏

Best,
[Your name]', true),

('WhatsApp Not Interested - Future Contact', 'whatsapp', 'not_interested', NULL, 'Hello {{name}},

No worries at all about {{company}} not being interested right now! I completely understand.

Maybe we can reconnect in a few months when timing might be better. Thanks for considering it! 😊

Best regards,
[Your name]', true),

-- SMS - Not Interested
('SMS Not Interested - Brief Thanks', 'sms', 'not_interested', NULL, 'Hi {{name}}, thanks for letting me know {{company}} isn''t interested. I understand completely. Maybe we can reconnect in the future if circumstances change. Best wishes!', true),

('SMS Not Interested - Respectful Closure', 'sms', 'not_interested', NULL, 'Hello {{name}}, I respect {{company}}''s decision and appreciate your honesty. I''ll keep your info on file in case our solution becomes relevant later. Thank you for your time!', true),

-- Phone - Not Interested
('Phone Not Interested - Understanding Call', 'phone', 'not_interested', NULL, 'Hi {{name}}, this is [Your name]. I wanted to follow up on our conversation where you mentioned {{company}} isn''t interested. I completely understand and respect your decision. I was wondering if you could share what factors led to this decision? It would help me better understand how to serve clients in the future.', true),

('Phone Not Interested - Future Opportunity Call', 'phone', 'not_interested', NULL, 'Hello {{name}}, it''s [Your name]. I wanted to thank you for being direct about {{company}}''s current situation. I understand our solution isn''t the right fit now. I''ll keep your information and perhaps reach out in 6-12 months to see if anything has changed. Thank you for your time and consideration.', true),

-- CLOSED STAGE TEMPLATES (all channels)
-- Email - Closed
('Email Closed - Deal Celebration', 'email', 'closed', 'Welcome to the partnership, {{company}}!', 'Hi {{name}},

Congratulations! We''re officially partners now, and I couldn''t be more excited about what we''re going to achieve together for {{company}}.

I''ve attached your welcome package which includes:
- Implementation timeline
- Your dedicated team contacts
- Initial project milestones
- Helpful resources to get started

Your success is our priority, and we''re committed to delivering exceptional results. I''ll be in touch within the next 48 hours to schedule our kickoff meeting.

Welcome aboard!

Best regards,
[Your name]', true),

('Email Closed - Implementation Start', 'email', 'closed', 'Let''s get started with {{company}}!', 'Hello {{name}},

Welcome to the team! The contract is signed, and we''re ready to begin transforming {{company}}''s operations.

Here''s what to expect in the next week:
- Kickoff meeting scheduling
- Team introductions
- Initial assessment and planning
- Resource allocation

I''m personally invested in your success and will be your main point of contact throughout this journey. Let''s make great things happen!

Looking forward to our partnership!

Best,
[Your name]', true),

-- LinkedIn - Closed
('LinkedIn Closed - Partnership Celebration', 'linkedin', 'closed', NULL, 'Hi {{name}},

🎉 Congratulations on officially becoming our partner! I''m thrilled about what we''re going to accomplish together for {{company}}.

This is just the beginning of an exciting journey. I''ll be reaching out via email with all the welcome materials and next steps.

Here''s to a successful partnership!

Best,
[Your name]', true),

('LinkedIn Closed - Success Journey', 'linkedin', 'closed', NULL, 'Hello {{name}},

Welcome to the partnership! {{company}} is now part of our success family, and I couldn''t be more excited.

The real work begins now, and I''m confident we''re going to achieve amazing results together. Looking forward to celebrating your wins!

Best regards,
[Your name]', true),

-- WhatsApp - Closed
('WhatsApp Closed - Deal Celebration', 'whatsapp', 'closed', NULL, 'Hi {{name}}! 🎉🎊

CONGRATULATIONS! Welcome to the partnership! I''m SO excited to start working with {{company}} and achieving incredible results together!

I''ll send all the welcome materials via email shortly. This is going to be amazing! 🚀

Best,
[Your name]', true),

('WhatsApp Closed - Partnership Welcome', 'whatsapp', 'closed', NULL, 'Hello {{name}}! 

Welcome to the team! {{company}} is now officially our partner and I couldn''t be happier! 

Let''s schedule our kickoff meeting this week. When works best for you? 📅

Best,
[Your name] ⭐', true),

-- SMS - Closed
('SMS Closed - Welcome Message', 'sms', 'closed', NULL, 'Hi {{name}}, congratulations! {{company}} is now officially our partner! I''m excited to get started. I''ll email you the welcome package and schedule our kickoff meeting. Welcome aboard!', true),

('SMS Closed - Success Partnership', 'sms', 'closed', NULL, 'Hello {{name}}, welcome to the partnership! {{company}} is now part of our success family. Looking forward to achieving great results together. I''ll be in touch with next steps!', true),

-- Phone - Closed
('Phone Closed - Congratulations Call', 'phone', 'closed', NULL, 'Hi {{name}}, this is [Your name]. Congratulations! I''m calling to officially welcome {{company}} to our partnership. I''m incredibly excited about what we''re going to achieve together. I wanted to personally thank you for your trust in us and confirm our kickoff meeting details.', true),

('Phone Closed - Partnership Welcome', 'phone', 'closed', NULL, 'Hello {{name}}, it''s [Your name]. Welcome to the partnership! {{company}} is now officially part of our success family. I''m calling to walk you through the next steps and ensure you have everything you need to get started. This is going to be an amazing journey together!', true),

-- FOLLOW_UP STAGE TEMPLATES (all channels)
-- Email - Follow Up
('Email Follow Up - Check In', 'email', 'follow_up', 'Checking in with {{company}}', 'Hi {{name}},

I hope this email finds you well. I wanted to check in and see how things are going at {{company}}.

It''s been a while since we last spoke, and I''ve been thinking about our previous conversations. I have some new insights and case studies that might be relevant to your current situation.

If now isn''t the right time, I completely understand. Would you be open to a brief call to catch up and see if there are any ways I can be helpful?

Looking forward to hearing from you.

Best regards,
[Your name]', true),

('Email Follow Up - New Opportunity', 'email', 'follow_up', 'New opportunities for {{company}}', 'Hello {{name}},

I hope you''re having a great week! I wanted to reach out because we''ve recently launched some new services that I think could be particularly beneficial for {{company}}.

Based on our previous conversations, I believe this could address some of the challenges you mentioned. I''d love to share a quick overview and get your thoughts.

Would you be interested in a brief 15-minute call to discuss how this might apply to your current goals?

Best,
[Your name]', true),

-- LinkedIn - Follow Up
('LinkedIn Follow Up - Periodic Check', 'linkedin', 'follow_up', NULL, 'Hi {{name}},

I hope you''re doing well! I''ve been following {{company}}''s updates and it looks like you''ve been making great progress.

I wanted to reconnect and see if there are any new developments where I might be able to help. I have some fresh insights from working with similar companies that you might find interesting.

Would you be open to a quick catch-up call?

Best,
[Your name]', true),

('LinkedIn Follow Up - Industry Update', 'linkedin', 'follow_up', NULL, 'Hello {{name}},

I came across some industry developments that reminded me of our previous conversation about {{company}}''s goals.

I thought you might find these insights valuable, especially given the direction you''re heading. Would you be interested in a brief discussion about how these trends might impact your strategy?

Best regards,
[Your name]', true),

-- WhatsApp - Follow Up
('WhatsApp Follow Up - Friendly Check', 'whatsapp', 'follow_up', NULL, 'Hi {{name}}! 👋

Hope you''re doing great! I''ve been thinking about {{company}} and our previous conversations. 

I have some new insights that might be valuable for your team. Would you be open to a quick catch-up call sometime this week?

Best,
[Your name] 😊', true),

('WhatsApp Follow Up - New Opportunity', 'whatsapp', 'follow_up', NULL, 'Hello {{name}}!

I hope everything''s going well at {{company}}! I wanted to reach out because we have some exciting new solutions that could be perfect for your needs.

Would love to share a quick overview. Are you free for a brief call this week? 📞

Best,
[Your name]', true),

-- SMS - Follow Up
('SMS Follow Up - Check In', 'sms', 'follow_up', NULL, 'Hi {{name}}, hope you''re doing well! Wanted to check in on {{company}} and see if there are any new opportunities where I might be able to help. Are you free for a quick call this week?', true),

('SMS Follow Up - New Development', 'sms', 'follow_up', NULL, 'Hello {{name}}, I have some new insights that might be valuable for {{company}} based on our previous conversations. Would you be interested in a brief catch-up call?', true),

-- Phone - Follow Up
('Phone Follow Up - Periodic Contact', 'phone', 'follow_up', NULL, 'Hi {{name}}, this is [Your name]. I hope you''re doing well! I wanted to check in and see how things are progressing at {{company}}. It''s been a while since we last spoke, and I have some new developments that might be interesting for your team. Do you have a few minutes to catch up?', true),

('Phone Follow Up - New Opportunity Call', 'phone', 'follow_up', NULL, 'Hello {{name}}, it''s [Your name] calling. I hope you''re having a great day! I''m reaching out because we''ve developed some new solutions that I think could be particularly valuable for {{company}} based on our previous discussions. Would you be open to a brief conversation about these new opportunities?', true);