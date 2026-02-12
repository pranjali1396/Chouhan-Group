# Quick Start: Migrate to MySQL in 5 Steps

This is a simplified guide to get you started quickly. For detailed information, see `MYSQL_MIGRATION_GUIDE.md`.

## Prerequisites

✅ MySQL Server installed  
✅ MySQL Workbench installed  
✅ MySQL root password ready

## Step 1: Create MySQL Database

Open **MySQL Workbench** and run:

```sql
CREATE DATABASE chouhan_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Step 2: Create Tables

In MySQL Workbench, open and run the file: `Backend/mysql-schema.sql`

Or copy-paste the entire content and execute it.

## Step 3: Export Data from Supabase

In your terminal (Backend folder):

```bash
node scripts/export-supabase-data.js
```

This will create 3 JSON files:
- `users_export.json`
- `leads_export.json`
- `notifications_export.json`

## Step 4: Install MySQL Driver

```bash
npm install mysql2
```

## Step 5: Configure MySQL Connection

Add to `Backend/.env`:

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password_here
MYSQL_DATABASE=chouhan_crm
```

## Step 6: Import Data to MySQL

```bash
node scripts/import-to-mysql.js
```

## Step 7: Update Backend to Use MySQL

I'll create a modified version of your backend that uses MySQL instead of Supabase.

Would you like me to:
1. Create a new `index-mysql.js` file (keeps original intact)
2. Or modify the existing `index.js` to use MySQL?

## Verification

In MySQL Workbench, run:

```sql
USE chouhan_crm;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM leads;
SELECT COUNT(*) FROM notifications;
```

## Testing

1. Start backend: `npm run dev`
2. Test in browser: `http://localhost:5000/health`
3. Check your CRM frontend

## Rollback

If something goes wrong, just change `.env` back to use Supabase:

```env
SUPABASE_URL=https://ymbjoivojiijvapvcevm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

And restart the backend.

## Need Help?

Common issues:
- **Can't connect to MySQL**: Check if MySQL service is running
- **Access denied**: Verify MySQL password in `.env`
- **Table doesn't exist**: Run `mysql-schema.sql` first
- **Foreign key error**: Import users before leads

For detailed troubleshooting, see `MYSQL_MIGRATION_GUIDE.md`.
