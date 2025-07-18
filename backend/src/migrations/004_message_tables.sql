-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_request_id UUID REFERENCES delivery_requests(id) ON DELETE SET NULL,
    related_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create conversation view for easier querying
CREATE OR REPLACE VIEW conversations AS
WITH latest_messages AS (
    SELECT 
        DISTINCT ON (
            CASE WHEN sender_id < recipient_id 
                THEN sender_id || '-' || recipient_id 
                ELSE recipient_id || '-' || sender_id 
            END
        ) 
        id,
        sender_id,
        recipient_id,
        content,
        is_read,
        created_at,
        CASE WHEN sender_id < recipient_id 
            THEN sender_id || '-' || recipient_id 
            ELSE recipient_id || '-' || sender_id 
        END as conversation_id
    FROM messages
    ORDER BY conversation_id, created_at DESC
)
SELECT * FROM latest_messages;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_related_request_id ON messages(related_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_related_trip_id ON messages(related_trip_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Add updated_at trigger
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();