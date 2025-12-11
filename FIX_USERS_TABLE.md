# Fix Users Table Issue

## Problem
The error `Could not find the table 'public.users' in the schema cache` means the `users` table doesn't exist in your Supabase database.

## Solution

### Step 1: Create the Users Table in Supabase

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the SQL script from `backend/migrations/create_users_table.sql`:

```sql
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

CREATE INDEX IF NOT EXISTS idx_users_local_id ON users(local_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

### Step 2: What Was Fixed in the Code

I've removed all hardcoded user IDs (`user-1`, `admin-0`, etc.) from:

1. ✅ `services/database.ts` - `seedData()` now generates deterministic IDs
2. ✅ `components/AssignLeadForm.tsx` - No longer uses `'admin-0'` fallback
3. ✅ `App.tsx` - All `'admin-0'` references replaced with dynamic admin user lookup
4. ✅ `components/LeadsPage.tsx` - All `'admin-0'` checks replaced with dynamic admin user lookup

### Step 3: After Creating the Table

1. **Refresh your app** - It will automatically sync users to Supabase
2. **Check the console** - You should see:
   - `✅ Synced users to Supabase: X users`
   - `✅ Reloaded users from Supabase after sync`
3. **Try assigning a lead** - It should work now with Supabase UUIDs

### Step 4: Verify

After creating the table and refreshing:

1. Users should sync automatically
2. All user IDs should be Supabase UUIDs (not `user-1`, `admin-0`)
3. Lead assignments should work without errors

## Notes

- The `local_id` column is optional but helps with mapping during migration
- All hardcoded user ID references have been removed from the codebase
- The system now dynamically finds the admin user instead of using `'admin-0'`

