-- Migration for status tracking system
-- Requirements: 5.1, 5.2, 5.4 - Real-time status updates and photo/receipt sharing

-- Create status_updates table
CREATE TABLE IF NOT EXISTS status_updates (
  id VARCHAR(255) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  photo_url TEXT,
  receipt_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups by entity
CREATE INDEX IF NOT EXISTS idx_status_updates_entity ON status_updates(entity_type, entity_id);

-- Create index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_status_updates_timestamp ON status_updates(timestamp);

-- Add photo_url and receipt_url columns to delivery_requests table
ALTER TABLE delivery_requests 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Add photo_url and receipt_url columns to trips table
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Create status_attachments table for multiple photos/receipts
CREATE TABLE IF NOT EXISTS status_attachments (
  id VARCHAR(255) PRIMARY KEY,
  status_update_id VARCHAR(255) NOT NULL REFERENCES status_updates(id) ON DELETE CASCADE,
  attachment_type VARCHAR(50) NOT NULL, -- 'photo' or 'receipt'
  url TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups by status update
CREATE INDEX IF NOT EXISTS idx_status_attachments_status_update ON status_attachments(status_update_id);