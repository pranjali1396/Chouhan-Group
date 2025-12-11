-- Migration: Add local_id column to users table for mapping local user IDs to Supabase UUIDs
-- This allows the frontend to use IDs like "user-1", "admin-0" while Supabase uses UUIDs

-- Add the local_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS local_id VARCHAR(50);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_local_id ON users(local_id);

-- Add a comment explaining the column
COMMENT ON COLUMN users.local_id IS 'Maps local frontend user IDs (e.g., user-1, admin-0) to Supabase UUIDs';

