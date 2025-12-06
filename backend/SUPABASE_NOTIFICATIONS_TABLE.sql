-- Create notifications table in Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('new_lead', 'lead_assigned')),
  message TEXT NOT NULL,
  lead_id TEXT,
  lead_data JSONB,
  target_role TEXT,
  target_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user_id ON notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to do everything (backend uses service role)
CREATE POLICY "Service role can do everything" ON notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

