-- Add missing channels to the channel_enum
ALTER TYPE channel_enum ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE channel_enum ADD VALUE IF NOT EXISTS 'sms';

-- Insert comprehensive templates for all channels and stages
-- Each stage will have 2 templates per channel

-- EMAIL TEMPLATES
INSERT INTO message_templates (name, channel, status, subject, content, is_active) VALUES
-- Email - Not Yet (Cold outreach)
('Email Cold Outreach - Introduction', 'email', 'not_yet', 'Quick introduction from {{company}}', 'Hi {{name}},

I hope this email finds you well. I''m reaching out because I noticed your work at {{company}} and thought there might be an opportunity for us to connect.

We help companies like yours streamline their processes and increase efficiency. I''d love to share how we''ve helped similar organizations achieve their goals.

Would you be open to a brief 15-minute call next week?

Best regards,
[Your name]', true),

('Email Cold Outreach - Value Proposition', 'email', 'not_yet', 'Helping {{company}} achieve better results', 'Hello {{name}},

I''ve been following {{company}}''s growth and I''m impressed by your recent achievements. 

We''ve helped companies in your industry increase their ROI by 35% on average through our proven methodology. I believe there''s significant potential for {{company}} as well.

I''d appreciate the opportunity to share some quick insights that could benefit your team.

Are you available for a brief conversation this week?

Kind regards,
[Your name]', true),

-- Email - Contacted (Follow up after initial contact)
('Email Follow Up - Meeting Request', 'email', 'contacted', 'Following up on our conversation', 'Hi {{name}},

Thank you for taking the time to speak with me earlier. I enjoyed learning more about {{company}}''s current initiatives and challenges.

As promised, I''m attaching some resources that I think you''ll find valuable. I''d love to schedule a follow-up meeting to dive deeper into how we can support your goals.

Would next Tuesday or Wednesday work better for you?

Looking forward to continuing our conversation.

Best,
[Your name]', true),

('Email Follow Up - Additional Information', 'email', 'contacted', 'Additional insights for {{company}}', 'Hello {{name}},

I wanted to follow up on our recent conversation and provide you with the additional information you requested.

Based on what you shared about {{company}}''s objectives, I''ve prepared a customized overview of how our solution could address your specific needs.

I''m confident this could make a significant impact on your operations. When would be a good time to discuss this further?

Best regards,
[Your name]', true),

-- Email - Replied (They showed interest)
('Email Replied - Proposal Discussion', 'email', 'replied', 'Next steps for {{company}}', 'Hi {{name}},

Thank you for your positive response! I''m excited about the potential opportunity to work with {{company}}.

Based on your feedback, I''d like to schedule a more detailed discussion about your requirements and how we can tailor our approach to meet your specific needs.

I have availability this Thursday or Friday afternoon. Which works better for your schedule?

Looking forward to our next conversation.

Best,
[Your name]', true),

('Email Replied - Detailed Proposal', 'email', 'replied', 'Customized proposal for {{company}}', 'Hello {{name}},

Thank you for expressing interest in our services. I''ve prepared a detailed proposal specifically tailored to {{company}}''s requirements.

The proposal includes:
- Customized solution overview
- Implementation timeline
- Pricing structure
- Expected outcomes and ROI

I''d love to walk you through this proposal and answer any questions you might have. When would be convenient for a presentation?

Best regards,
[Your name]', true),

-- LINKEDIN TEMPLATES
-- LinkedIn - Not Yet (Cold outreach)
('LinkedIn Cold Outreach - Connection', 'linkedin', 'not_yet', NULL, 'Hi {{name}},

I came across your profile and was impressed by your experience at {{company}}. I''d love to connect and learn more about your work in the industry.

Looking forward to connecting!

Best,
[Your name]', true),

('LinkedIn Cold Outreach - Industry Insights', 'linkedin', 'not_yet', NULL, 'Hello {{name}},

I''ve been following the great work you''re doing at {{company}}. I share similar interests in our industry and thought it would be valuable to connect.

I often share insights about industry trends and best practices. Would you be interested in exchanging ideas?

Best regards,
[Your name]', true),

-- LinkedIn - Contacted (Follow up)
('LinkedIn Follow Up - Meeting Request', 'linkedin', 'contacted', NULL, 'Hi {{name}},

Thanks for connecting! I noticed we have some mutual connections and similar professional interests.

I''d love to learn more about the innovative work you''re doing at {{company}}. Would you be open to a brief call to share insights about our respective experiences?

Let me know if you''d be interested!

Best,
[Your name]', true),

('LinkedIn Follow Up - Value Add', 'linkedin', 'contacted', NULL, 'Hello {{name}},

I appreciate you accepting my connection request. I''ve been working with companies similar to {{company}} and have seen some interesting trends in our industry.

I''d be happy to share some insights that might be relevant to your current projects. Would you be interested in a quick conversation?

Looking forward to hearing from you.

Best regards,
[Your name]', true),

-- LinkedIn - Replied (Interest shown)
('LinkedIn Replied - Detailed Discussion', 'linkedin', 'replied', NULL, 'Hi {{name}},

Thank you for your interest! I''m excited about the possibility of collaborating with {{company}}.

I''d love to schedule a more detailed conversation to understand your specific needs and explore how we might work together.

Are you available for a call this week?

Best,
[Your name]', true),

('LinkedIn Replied - Next Steps', 'linkedin', 'replied', NULL, 'Hello {{name}},

Great to hear from you! I''m pleased that you''re interested in learning more about our collaboration possibilities.

I''d like to set up a proper meeting to discuss your requirements in detail and present some ideas tailored specifically for {{company}}.

When would be a good time for you?

Best regards,
[Your name]', true),

-- WHATSAPP TEMPLATES
-- WhatsApp - Not Yet (Cold outreach)
('WhatsApp Cold Outreach - Introduction', 'whatsapp', 'not_yet', NULL, 'Hi {{name}}! 👋

I hope you''re doing well. I came across {{company}} and was really impressed by what you''re doing.

I work with companies like yours to help them achieve better results. Would you be open to a quick chat about how we might be able to help {{company}}?

Thanks!
[Your name]', true),

('WhatsApp Cold Outreach - Quick Value', 'whatsapp', 'not_yet', NULL, 'Hello {{name}}! 

I''ve been following {{company}}''s success and thought you might be interested in how we''ve helped similar businesses increase their efficiency by 40%.

Would you be open to a brief 10-minute call to learn more?

Best regards,
[Your name] 📱', true),

-- WhatsApp - Contacted (Follow up)
('WhatsApp Follow Up - Meeting', 'whatsapp', 'contacted', NULL, 'Hi {{name}}! 

Thanks for our chat earlier. As promised, I''m sending over the information we discussed.

When would be a good time for our follow-up meeting? I''m flexible with timing this week.

Talk soon!
[Your name] ⏰', true),

('WhatsApp Follow Up - Resources', 'whatsapp', 'contacted', NULL, 'Hello {{name}}!

Following up on our conversation - I''ve prepared some resources specifically for {{company}} that I think you''ll find valuable.

Would you like to schedule a quick call to go through them together?

Best,
[Your name] 📊', true),

-- WhatsApp - Replied (Interest shown)
('WhatsApp Replied - Next Steps', 'whatsapp', 'replied', NULL, 'Hi {{name}}! 🎉

Fantastic to hear you''re interested! I''m excited about the potential to work with {{company}}.

Let''s schedule a proper meeting to discuss everything in detail. Are you free this Thursday or Friday?

Looking forward to it!
[Your name]', true),

('WhatsApp Replied - Proposal Discussion', 'whatsapp', 'replied', NULL, 'Hello {{name}}!

Thank you for your positive response! I''m thrilled about the opportunity to support {{company}}''s goals.

I''d love to present a customized proposal for your review. When would be convenient for you?

Best,
[Your name] 🚀', true),

-- SMS TEMPLATES
-- SMS - Not Yet (Cold outreach)
('SMS Cold Outreach - Brief Introduction', 'sms', 'not_yet', NULL, 'Hi {{name}}, this is [Your name]. I work with companies like {{company}} to improve their results. Would you be open to a brief call about potential opportunities? Thanks!', true),

('SMS Cold Outreach - Value Mention', 'sms', 'not_yet', NULL, 'Hello {{name}}, I''ve helped companies similar to {{company}} increase efficiency by 35%. Would you be interested in a quick 10-min conversation about how this might apply to your business?', true),

-- SMS - Contacted (Follow up)
('SMS Follow Up - Meeting Request', 'sms', 'contacted', NULL, 'Hi {{name}}, thanks for our conversation earlier. I''d like to schedule our follow-up meeting as discussed. Are you available Tuesday or Wednesday this week?', true),

('SMS Follow Up - Information Shared', 'sms', 'contacted', NULL, 'Hello {{name}}, as promised, I''ve sent the information we discussed via email. Would you like to schedule a call to go through it together? Let me know what works for you.', true),

-- SMS - Replied (Interest shown)
('SMS Replied - Meeting Setup', 'sms', 'replied', NULL, 'Hi {{name}}, great to hear you''re interested! I''d love to set up a meeting to discuss how we can help {{company}}. Are you free this Thursday or Friday afternoon?', true),

('SMS Replied - Proposal Discussion', 'sms', 'replied', NULL, 'Hello {{name}}, thank you for your interest! I''m excited to present a customized proposal for {{company}}. When would be a good time for a detailed discussion?', true),

-- PHONE TEMPLATES
-- Phone - Not Yet (Cold call scripts)
('Phone Cold Call - Opening Script', 'phone', 'not_yet', NULL, 'Hi {{name}}, this is [Your name] from [Company]. I hope I''m not catching you at a bad time. I''ve been working with companies like {{company}} to help them achieve better results. Do you have 2 minutes for me to share how we might be able to help?', true),

('Phone Cold Call - Value Proposition', 'phone', 'not_yet', NULL, 'Hello {{name}}, my name is [Your name]. I''m calling because we''ve helped companies in your industry increase their ROI by an average of 35%. I''d love to share some quick insights that could benefit {{company}}. Is now a good time for a brief conversation?', true),

-- Phone - Contacted (Follow up calls)
('Phone Follow Up - Meeting Confirmation', 'phone', 'contacted', NULL, 'Hi {{name}}, this is [Your name]. I''m calling to follow up on our previous conversation and confirm our meeting for this week. I have some additional insights I''d like to share with you about {{company}}. Is our scheduled time still convenient?', true),

('Phone Follow Up - Additional Information', 'phone', 'contacted', NULL, 'Hello {{name}}, it''s [Your name] calling. I promised to follow up with additional information after our last conversation. I''ve prepared some materials specifically for {{company}}''s needs. When would be a good time to discuss these with you?', true),

-- Phone - Replied (Interest shown)
('Phone Replied - Proposal Presentation', 'phone', 'replied', NULL, 'Hi {{name}}, this is [Your name]. Thank you for expressing interest in our services! I''ve prepared a comprehensive proposal tailored specifically for {{company}}. I''d love to schedule a presentation call to walk you through it. When would be most convenient for you?', true),

('Phone Replied - Next Steps Discussion', 'phone', 'replied', NULL, 'Hello {{name}}, it''s [Your name]. I''m excited about the opportunity to work with {{company}}! I''d like to schedule a detailed discussion about your specific requirements and how we can move forward. Are you available for a call this week?', true);

-- Add templates for other stages (interested, not_interested, closed, follow_up)
-- INTERESTED STAGE TEMPLATES (all channels)
INSERT INTO message_templates (name, channel, status, subject, content, is_active) VALUES
-- Email - Interested
('Email Interested - Contract Discussion', 'email', 'interested', 'Contract and next steps for {{company}}', 'Hi {{name}},

I''m thrilled that {{company}} is interested in moving forward with our proposal! 

I''ve prepared the contract documents and implementation timeline for your review. The next steps would be:
1. Contract review and signing
2. Kickoff meeting scheduling
3. Implementation planning

When would be a good time to discuss the contract details and answer any final questions?

Excited to get started!

Best regards,
[Your name]', true),

('Email Interested - Implementation Planning', 'email', 'interested', 'Implementation roadmap for {{company}}', 'Hello {{name}},

Thank you for confirming your interest! I''m excited to begin this partnership with {{company}}.

I''ve outlined a detailed implementation roadmap that includes milestones, deliverables, and timeline. I''d like to review this with your team to ensure we''re aligned on expectations.

Would you prefer a video call or in-person meeting to discuss the implementation plan?

Looking forward to our partnership!

Best,
[Your name]', true),

-- LinkedIn - Interested
('LinkedIn Interested - Partnership Excitement', 'linkedin', 'interested', NULL, 'Hi {{name}},

I''m excited that {{company}} wants to move forward! This is going to be a great partnership.

I''ve prepared all the necessary documentation and next steps. Would you prefer to continue our discussion via email or schedule a call to finalize everything?

Looking forward to working together!

Best,
[Your name]', true),

('LinkedIn Interested - Timeline Discussion', 'linkedin', 'interested', NULL, 'Hello {{name}},

Fantastic news that {{company}} is ready to proceed! I''m looking forward to delivering excellent results for your team.

Let''s discuss the project timeline and implementation schedule. When would be convenient for a detailed planning session?

Best regards,
[Your name]', true),

-- WhatsApp - Interested
('WhatsApp Interested - Contract Ready', 'whatsapp', 'interested', NULL, 'Hi {{name}}! 🎉

Amazing news that {{company}} wants to move forward! I''m so excited to work with your team.

I have the contract and all documents ready for review. Should I send them via email or would you prefer another method?

Can''t wait to get started! 
[Your name] 🚀', true),

('WhatsApp Interested - Next Steps', 'whatsapp', 'interested', NULL, 'Hello {{name}}!

Thrilled that {{company}} is interested! This is going to be an incredible partnership.

Let''s schedule a call to go over the final details and implementation timeline. Are you free this week?

Best,
[Your name] ⭐', true),

-- SMS - Interested
('SMS Interested - Contract Discussion', 'sms', 'interested', NULL, 'Hi {{name}}, excited that {{company}} wants to proceed! I have the contract ready for review. When would be a good time to discuss the final details and next steps?', true),

('SMS Interested - Implementation Planning', 'sms', 'interested', NULL, 'Hello {{name}}, thrilled about moving forward with {{company}}! I''d like to schedule a planning session to discuss implementation timeline. Are you available this week?', true),

-- Phone - Interested
('Phone Interested - Contract Review', 'phone', 'interested', NULL, 'Hi {{name}}, this is [Your name]. I''m calling because I''m absolutely thrilled that {{company}} has decided to move forward! I have the contract and implementation plan ready for your review. When would be convenient for us to go through the details together?', true),

('Phone Interested - Partnership Kickoff', 'phone', 'interested', NULL, 'Hello {{name}}, it''s [Your name]. I''m so excited about this partnership with {{company}}! I''d like to schedule our official kickoff meeting and discuss the project timeline in detail. When would work best for your team?', true);

-- Continue with other status templates...