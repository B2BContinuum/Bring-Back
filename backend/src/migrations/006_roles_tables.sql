-- Create roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles junction table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Create permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Add default roles
INSERT INTO roles (name, description) VALUES
  ('user', 'Regular user with basic permissions'),
  ('traveler', 'User who can create trips and fulfill delivery requests'),
  ('requester', 'User who can create delivery requests'),
  ('admin', 'Administrator with full system access'),
  ('moderator', 'User who can moderate content and resolve disputes');

-- Add default permissions
INSERT INTO permissions (name, description) VALUES
  -- User permissions
  ('user:read', 'Read user profiles'),
  ('user:update', 'Update own user profile'),
  ('user:delete', 'Delete own user account'),
  
  -- Trip permissions
  ('trip:create', 'Create new trips'),
  ('trip:read', 'View trips'),
  ('trip:update', 'Update own trips'),
  ('trip:delete', 'Delete own trips'),
  ('trip:manage', 'Manage all trips'),
  
  -- Request permissions
  ('request:create', 'Create delivery requests'),
  ('request:read', 'View delivery requests'),
  ('request:update', 'Update own delivery requests'),
  ('request:delete', 'Delete own delivery requests'),
  ('request:manage', 'Manage all delivery requests'),
  
  -- Payment permissions
  ('payment:create', 'Make payments'),
  ('payment:read', 'View own payment history'),
  ('payment:manage', 'Manage all payments'),
  
  -- Rating permissions
  ('rating:create', 'Submit ratings'),
  ('rating:read', 'View ratings'),
  ('rating:manage', 'Manage all ratings'),
  
  -- Admin permissions
  ('admin:access', 'Access admin features'),
  ('system:manage', 'Manage system settings');

-- Assign permissions to roles
-- User role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'user' AND p.name IN (
  'user:read',
  'user:update',
  'user:delete',
  'trip:read',
  'request:read',
  'payment:read',
  'rating:read',
  'rating:create'
);

-- Traveler role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'traveler' AND p.name IN (
  'trip:create',
  'trip:read',
  'trip:update',
  'trip:delete',
  'request:read'
);

-- Requester role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'requester' AND p.name IN (
  'request:create',
  'request:read',
  'request:update',
  'request:delete',
  'payment:create'
);

-- Admin role permissions (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin';

-- Moderator role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'moderator' AND p.name IN (
  'user:read',
  'trip:read',
  'trip:manage',
  'request:read',
  'request:manage',
  'payment:read',
  'rating:read',
  'rating:manage'
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);