# User ID Migration Guide

## The Problem

Your application has a **mismatch between frontend and backend user IDs**:

- **Frontend (Local Database)**: Uses simple string IDs like `user-1`, `user-2`, `admin-0`
- **Supabase (Backend)**: Uses UUIDs like `550e8400-e29b-41d4-a716-446655440000`

When you try to assign a lead with `user-1`, Supabase rejects it because:
1. `user-1` is not a valid UUID format
2. Even if it were, no user with that UUID exists in Supabase

## The Solution

We've implemented a **two-step solution**:

### Step 1: Sync Users to Supabase

The frontend now automatically syncs local users to Supabase on first load. This:
- Creates users in Supabase with proper UUIDs
- Maps local IDs (`user-1`) to Supabase UUIDs
- Updates the frontend to use Supabase UUIDs

### Step 2: Use Supabase UUIDs

After syncing, the frontend uses Supabase UUIDs for all assignments, ensuring compatibility.

## How It Works

1. **On App Load**:
   - Frontend tries to fetch users from Supabase
   - If no users exist, it syncs local users to Supabase
   - Frontend then uses Supabase UUIDs

2. **When Assigning Leads**:
   - Frontend sends Supabase UUID (not `user-1`)
   - Backend validates the UUID exists
   - Assignment succeeds ✅

## Database Migration (Optional but Recommended)

To improve performance and reliability, add a `local_id` column to your `users` table in Supabase:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE users ADD COLUMN IF NOT EXISTS local_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_users_local_id ON users(local_id);
```

This allows the backend to quickly map local IDs to Supabase UUIDs.

## Manual Sync (If Needed)

If users aren't syncing automatically, you can manually sync them:

```javascript
// In browser console or API client
const users = [
  { id: 'admin-0', name: 'Admin', role: 'Admin', avatarUrl: '...' },
  { id: 'user-1', name: 'Amit Naithani', role: 'Salesperson', avatarUrl: '...' },
  // ... other users
];

fetch('http://localhost:5000/api/v1/users/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ users })
});
```

## Verification

After syncing, check that:
1. Users exist in Supabase `users` table
2. Frontend shows users with UUID IDs (not `user-1`)
3. Lead assignments work without errors

## Troubleshooting

**Error: "User not found"**
- Users haven't been synced to Supabase yet
- Solution: Let the app sync automatically, or manually sync users

**Error: "User not synced"**
- The `local_id` column doesn't exist and name-based lookup failed
- Solution: Run the SQL migration above, then sync users again

**Users still showing `user-1` IDs**
- Frontend hasn't reloaded users from Supabase
- Solution: Refresh the page or restart the app

