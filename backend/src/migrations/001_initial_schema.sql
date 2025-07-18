-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE trip_status AS ENUM ('announced', 'in_progress', 'at_destination', 'returning', 'completed', 'cancelled');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'purchased', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE location_category AS ENUM ('grocery', 'pharmacy', 'restaurant', 'retail', 'other');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_image TEXT,
    address JSONB,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_deliveries INTEGER DEFAULT 0,
    verification_status verification_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address JSONB NOT NULL,
    coordinates POINT NOT NULL,
    category location_category NOT NULL,
    verified BOOLEAN DEFAULT false,
    current_user_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location presence table
CREATE TABLE location_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_out_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_id UUID NOT NULL REFERENCES locations(id),
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_return_time TIMESTAMP WITH TIME ZONE,
    capacity INTEGER NOT NULL DEFAULT 1,
    available_capacity INTEGER NOT NULL DEFAULT 1,
    status trip_status DEFAULT 'announced',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery requests table
CREATE TABLE delivery_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    delivery_address JSONB NOT NULL,
    max_item_budget DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    status request_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User ratings table
CREATE TABLE user_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rater_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivery_request_id UUID REFERENCES delivery_requests(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rated_user_id, rater_user_id, delivery_request_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_status ON users(verification_status);
CREATE INDEX idx_locations_coordinates ON locations USING GIST(coordinates);
CREATE INDEX idx_locations_category ON locations(category);
CREATE INDEX idx_location_presence_user_id ON location_presence(user_id);
CREATE INDEX idx_location_presence_location_id ON location_presence(location_id);
CREATE INDEX idx_location_presence_active ON location_presence(is_active);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_destination_id ON trips(destination_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_departure_time ON trips(departure_time);
CREATE INDEX idx_delivery_requests_trip_id ON delivery_requests(trip_id);
CREATE INDEX idx_delivery_requests_requester_id ON delivery_requests(requester_id);
CREATE INDEX idx_delivery_requests_status ON delivery_requests(status);
CREATE INDEX idx_user_ratings_rated_user_id ON user_ratings(rated_user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_location_presence_updated_at BEFORE UPDATE ON location_presence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_requests_updated_at BEFORE UPDATE ON delivery_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update location user count
CREATE OR REPLACE FUNCTION update_location_user_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
        UPDATE locations 
        SET current_user_count = current_user_count + 1 
        WHERE id = NEW.location_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = true AND NEW.is_active = false THEN
            UPDATE locations 
            SET current_user_count = current_user_count - 1 
            WHERE id = NEW.location_id;
        ELSIF OLD.is_active = false AND NEW.is_active = true THEN
            UPDATE locations 
            SET current_user_count = current_user_count + 1 
            WHERE id = NEW.location_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
        UPDATE locations 
        SET current_user_count = current_user_count - 1 
        WHERE id = OLD.location_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_location_user_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON location_presence
    FOR EACH ROW EXECUTE FUNCTION update_location_user_count();

-- Function to update trip available capacity
CREATE OR REPLACE FUNCTION update_trip_capacity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
        UPDATE trips 
        SET available_capacity = available_capacity - 1 
        WHERE id = NEW.trip_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
            UPDATE trips 
            SET available_capacity = available_capacity - 1 
            WHERE id = NEW.trip_id;
        ELSIF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
            UPDATE trips 
            SET available_capacity = available_capacity + 1 
            WHERE id = NEW.trip_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
        UPDATE trips 
        SET available_capacity = available_capacity + 1 
        WHERE id = OLD.trip_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trip_capacity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON delivery_requests
    FOR EACH ROW EXECUTE FUNCTION update_trip_capacity();

-- Function to update user ratings
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM user_ratings 
        WHERE rated_user_id = NEW.rated_user_id
    )
    WHERE id = NEW.rated_user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_rating_trigger
    AFTER INSERT OR UPDATE ON user_ratings
    FOR EACH ROW EXECUTE FUNCTION update_user_rating();