-- Add Stripe customer and account IDs to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Create payment status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM (
            'pending',
            'authorized',
            'captured',
            'transferred',
            'refunded',
            'failed',
            'cancelled'
        );
    END IF;
END$$;

-- Create payment type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE payment_type AS ENUM (
            'delivery_payment',
            'refund',
            'payout'
        );
    END IF;
END$$;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES delivery_requests(id) ON DELETE CASCADE,
    payment_intent_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status payment_status NOT NULL DEFAULT 'pending',
    type payment_type NOT NULL DEFAULT 'delivery_payment',
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    captured_at TIMESTAMP WITH TIME ZONE,
    transferred_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method_id TEXT NOT NULL,
    type TEXT NOT NULL,
    last_four TEXT NOT NULL,
    brand TEXT NOT NULL,
    exp_month INTEGER NOT NULL,
    exp_year INTEGER NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, payment_method_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_request_id ON payments(request_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent_id ON payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_payment_method_id ON payment_methods(payment_method_id);

-- Add RLS policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY payments_select_policy ON payments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT requester_id FROM delivery_requests WHERE id = request_id
            UNION
            SELECT user_id FROM trips t JOIN delivery_requests dr ON t.id = dr.trip_id WHERE dr.id = request_id
        )
    );

-- Create policies for payment methods
CREATE POLICY payment_methods_select_policy ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY payment_methods_insert_policy ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY payment_methods_update_policy ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY payment_methods_delete_policy ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);