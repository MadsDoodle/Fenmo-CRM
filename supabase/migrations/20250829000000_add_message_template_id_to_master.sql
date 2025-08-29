-- Add message_template_id column to master table
ALTER TABLE master ADD COLUMN message_template_id UUID REFERENCES message_templates(id);

-- Add index for better performance
CREATE INDEX idx_master_message_template_id ON master(message_template_id);

-- Add comment
COMMENT ON COLUMN master.message_template_id IS 'Reference to the selected message template for this record';
