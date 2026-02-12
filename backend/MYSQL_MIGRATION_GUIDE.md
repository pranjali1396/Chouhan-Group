# Supabase to MySQL Migration Guide

This guide will help you migrate your CRM database from Supabase (PostgreSQL) to MySQL Workbench.

## Overview

Your current database has the following tables:
1. **leads** - Main lead management table
2. **users** - User/salesperson information
3. **notifications** - System notifications

## Prerequisites

1. **MySQL Server** installed on your machine
2. **MySQL Workbench** installed
3. **Node.js MySQL driver** (`mysql2` package)

## Step 1: Install MySQL Server and Workbench

If you haven't already:

1. Download MySQL Server: https://dev.mysql.com/downloads/mysql/
2. Download MySQL Workbench: https://dev.mysql.com/downloads/workbench/
3. Install both applications
4. Note down your MySQL root password during installation

## Step 2: Create MySQL Database

1. Open **MySQL Workbench**
2. Connect to your local MySQL server (usually `localhost:3306`)
3. Click on "Create a new schema" button or run:

```sql
CREATE DATABASE chouhan_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chouhan_crm;
```

## Step 3: Create Tables in MySQL

Run the following SQL scripts in MySQL Workbench:

### 3.1 Create Users Table

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL COMMENT 'Admin or Salesperson',
    avatar_url TEXT,
    local_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_local_id (local_id),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 Create Leads Table

```sql
CREATE TABLE leads (
    id VARCHAR(36) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'New Lead',
    assigned_salesperson_id VARCHAR(36),
    lead_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    month VARCHAR(50),
    mode_of_enquiry VARCHAR(50) DEFAULT 'Digital',
    occupation VARCHAR(100),
    interested_project VARCHAR(255),
    interested_unit VARCHAR(100),
    temperature VARCHAR(20),
    visit_status VARCHAR(20) DEFAULT 'No',
    visit_date DATE,
    next_follow_up_date DATE,
    last_remark TEXT,
    booking_status VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    missed_visits_count INT DEFAULT 0,
    labels JSON,
    budget VARCHAR(100),
    purpose VARCHAR(100),
    city VARCHAR(100),
    platform VARCHAR(50),
    source_website VARCHAR(100) DEFAULT 'website',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_salesperson_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_leads_status (status),
    INDEX idx_leads_assigned (assigned_salesperson_id),
    INDEX idx_leads_lead_date (lead_date),
    INDEX idx_leads_next_followup (next_follow_up_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 Create Notifications Table

```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    lead_id VARCHAR(36),
    lead_data JSON,
    target_role VARCHAR(50),
    target_user_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    INDEX idx_notifications_target_role (target_role),
    INDEX idx_notifications_target_user_id (target_user_id),
    INDEX idx_notifications_created_at (created_at DESC),
    INDEX idx_notifications_is_read (is_read),
    CONSTRAINT chk_notification_type CHECK (type IN ('new_lead', 'lead_assigned', 'lead_progress'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Step 4: Export Data from Supabase

### Option A: Using Supabase Dashboard (Recommended for small datasets)

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. For each table (users, leads, notifications):
   - Click on the table
   - Click "Export" → "Export as CSV"
   - Save the CSV files

### Option B: Using SQL Export (Better for large datasets)

1. Go to Supabase **SQL Editor**
2. Run the following queries and export results:

```sql
-- Export users
COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER;

-- Export leads
COPY (SELECT * FROM leads) TO STDOUT WITH CSV HEADER;

-- Export notifications
COPY (SELECT * FROM notifications) TO STDOUT WITH CSV HEADER;
```

### Option C: Using Node.js Script (Automated)

Create a file `export-supabase-data.js` in your Backend folder:

```javascript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportData() {
  try {
    // Export users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) throw usersError;
    fs.writeFileSync('users_export.json', JSON.stringify(users, null, 2));
    console.log(`✅ Exported ${users.length} users`);

    // Export leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*');
    
    if (leadsError) throw leadsError;
    fs.writeFileSync('leads_export.json', JSON.stringify(leads, null, 2));
    console.log(`✅ Exported ${leads.length} leads`);

    // Export notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*');
    
    if (notificationsError) throw notificationsError;
    fs.writeFileSync('notifications_export.json', JSON.stringify(notifications, null, 2));
    console.log(`✅ Exported ${notifications.length} notifications`);

    console.log('\\n✅ All data exported successfully!');
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

exportData();
```

Run: `node export-supabase-data.js`

## Step 5: Import Data into MySQL

### Using MySQL Workbench GUI:

1. Right-click on the table → "Table Data Import Wizard"
2. Select your CSV file
3. Map columns
4. Click "Next" and "Finish"

### Using SQL INSERT (for JSON exports):

Create `import-to-mysql.js`:

```javascript
import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function importData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.MYSQL_PASSWORD,
    database: 'chouhan_crm'
  });

  try {
    // Import users
    const users = JSON.parse(fs.readFileSync('users_export.json', 'utf8'));
    for (const user of users) {
      await connection.execute(
        `INSERT INTO users (id, name, email, role, avatar_url, local_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.name, user.email, user.role, user.avatar_url, user.local_id, user.created_at, user.updated_at]
      );
    }
    console.log(`✅ Imported ${users.length} users`);

    // Import leads
    const leads = JSON.parse(fs.readFileSync('leads_export.json', 'utf8'));
    for (const lead of leads) {
      await connection.execute(
        `INSERT INTO leads (
          id, customer_name, mobile, email, status, assigned_salesperson_id,
          lead_date, last_activity_date, month, mode_of_enquiry, occupation,
          interested_project, interested_unit, temperature, visit_status,
          visit_date, next_follow_up_date, last_remark, booking_status,
          is_read, missed_visits_count, labels, budget, purpose, city,
          platform, source_website
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lead.id, lead.customer_name, lead.mobile, lead.email, lead.status,
          lead.assigned_salesperson_id, lead.lead_date, lead.last_activity_date,
          lead.month, lead.mode_of_enquiry, lead.occupation, lead.interested_project,
          lead.interested_unit, lead.temperature, lead.visit_status, lead.visit_date,
          lead.next_follow_up_date, lead.last_remark, lead.booking_status,
          lead.is_read, lead.missed_visits_count, JSON.stringify(lead.labels),
          lead.budget, lead.purpose, lead.city, lead.platform, lead.source_website
        ]
      );
    }
    console.log(`✅ Imported ${leads.length} leads`);

    // Import notifications
    const notifications = JSON.parse(fs.readFileSync('notifications_export.json', 'utf8'));
    for (const notif of notifications) {
      await connection.execute(
        `INSERT INTO notifications (id, type, message, lead_id, lead_data, target_role, target_user_id, created_at, is_read)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          notif.id, notif.type, notif.message, notif.lead_id,
          JSON.stringify(notif.lead_data), notif.target_role,
          notif.target_user_id, notif.created_at, notif.is_read
        ]
      );
    }
    console.log(`✅ Imported ${notifications.length} notifications`);

    console.log('\\n✅ All data imported successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await connection.end();
  }
}

importData();
```

## Step 6: Update Backend Configuration

### 6.1 Install MySQL Driver

```bash
npm install mysql2
```

### 6.2 Create MySQL Client

Create `Backend/src/mysqlClient.js`:

```javascript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'chouhan_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('[MySQL Config] Database:', process.env.MYSQL_DATABASE || 'chouhan_crm');

export default pool;
```

### 6.3 Update .env File

Add to `Backend/.env`:

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=chouhan_crm
```

### 6.4 Update Backend Code

I'll create a helper file to convert your Supabase queries to MySQL queries.

## Step 7: Testing

1. Start your backend: `npm run dev`
2. Test the API endpoints:
   - GET `/api/v1/leads`
   - POST `/api/v1/leads`
   - PUT `/api/v1/leads/:id`
3. Verify data in MySQL Workbench

## Important Differences: PostgreSQL vs MySQL

| Feature | PostgreSQL (Supabase) | MySQL |
|---------|----------------------|-------|
| UUID Generation | `gen_random_uuid()` | Use Node.js `crypto.randomUUID()` |
| JSON Type | `JSONB` | `JSON` |
| Boolean | `BOOLEAN` | `BOOLEAN` or `TINYINT(1)` |
| Timestamp | `TIMESTAMPTZ` | `TIMESTAMP` |
| Array Type | `TEXT[]` | `JSON` (store as array) |

## Rollback Plan

Keep your Supabase database active for at least 2 weeks after migration to ensure everything works correctly. You can always switch back by:

1. Changing `.env` to use Supabase credentials
2. Reverting code changes
3. Restarting the backend

## Next Steps

After successful migration:

1. ✅ Verify all data migrated correctly
2. ✅ Test all CRUD operations
3. ✅ Update any frontend code if needed
4. ✅ Set up MySQL backups
5. ✅ Monitor performance
6. ✅ Deactivate Supabase project (after confirming everything works)

## Troubleshooting

### Connection Issues
- Verify MySQL service is running
- Check firewall settings
- Confirm credentials in `.env`

### Data Type Mismatches
- Check JSON fields are properly stringified
- Verify date formats
- Ensure UUIDs are strings

### Foreign Key Errors
- Import users table first
- Then import leads table
- Finally import notifications

## Support

If you encounter issues, check:
1. MySQL error logs
2. Backend console output
3. MySQL Workbench query results
