-- Add authentication fields to users table
ALTER TABLE users 
  ADD COLUMN password_hash TEXT,
  ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN verification_token TEXT,
  ADD COLUMN verification_token_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN reset_password_token TEXT,
  ADD COLUMN reset_password_token_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;

-- Create verification codes table for email and phone verification
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'email' or 'phone'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT verification_codes_type_check CHECK (type IN ('email', 'phone'))
);

-- Create refresh tokens table for persistent sessions
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_phone_verified ON users(phone_verified);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_reset_password_token ON users(reset_password_token);
CREATE INDEX idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);