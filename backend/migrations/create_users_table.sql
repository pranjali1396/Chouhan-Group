-- Create users table in Supabase
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL, -- 'Admin', 'Salesperson'
    avatar_url TEXT,
    local_id VARCHAR(50), -- Maps local frontend user IDs (e.g., user-1, admin-0) to Supabase UUIDs
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_local_id ON users(local_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add a comment explaining the local_id column
COMMENT ON COLUMN users.local_id IS 'Maps local frontend user IDs (e.g., user-1, admin-0) to Supabase UUIDs';

