# MySQL Migration Checklist ✅

Use this checklist to track your migration progress.

## 📋 Pre-Migration

- [ ] Read `MYSQL_MIGRATION_COMPLETE.md`
- [ ] Read `QUICK_START_MYSQL.md`
- [ ] Backup your Supabase data (just in case)
- [ ] Note: Your original Supabase backend (`index.js`) remains unchanged

## 🛠️ Installation

- [ ] Download MySQL Server from https://dev.mysql.com/downloads/mysql/
- [ ] Install MySQL Server
- [ ] Note your MySQL root password
- [ ] Download MySQL Workbench from https://dev.mysql.com/downloads/workbench/
- [ ] Install MySQL Workbench
- [ ] Verify MySQL service is running

## 🗄️ Database Setup

- [ ] Open MySQL Workbench
- [ ] Connect to localhost (root user)
- [ ] Create database: `CREATE DATABASE chouhan_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
- [ ] Open `mysql-schema.sql` in MySQL Workbench
- [ ] Execute the entire schema file
- [ ] Verify tables created: `SHOW TABLES;`
- [ ] Verify table structure: `DESCRIBE users;`, `DESCRIBE leads;`, `DESCRIBE notifications;`

## 📤 Export Data from Supabase

- [ ] Ensure Supabase credentials are in `Backend/.env`
- [ ] Run: `node scripts/export-supabase-data.js`
- [ ] Verify `users_export.json` was created
- [ ] Verify `leads_export.json` was created
- [ ] Verify `notifications_export.json` was created
- [ ] Check file sizes (should not be 0 bytes)
- [ ] Open one file to verify JSON format is valid

## ⚙️ Configure MySQL Connection

- [ ] Open `Backend/.env` file
- [ ] Add `MYSQL_HOST=localhost`
- [ ] Add `MYSQL_USER=root`
- [ ] Add `MYSQL_PASSWORD=your_actual_password`
- [ ] Add `MYSQL_DATABASE=chouhan_crm`
- [ ] Save `.env` file
- [ ] Verify no typos in configuration

## 📥 Import Data to MySQL

- [ ] Run: `node scripts/import-to-mysql.js`
- [ ] Check console output for success messages
- [ ] Note the number of users imported
- [ ] Note the number of leads imported
- [ ] Note the number of notifications imported
- [ ] Verify in MySQL Workbench: `SELECT COUNT(*) FROM users;`
- [ ] Verify in MySQL Workbench: `SELECT COUNT(*) FROM leads;`
- [ ] Verify in MySQL Workbench: `SELECT COUNT(*) FROM notifications;`

## 🧪 Testing MySQL Backend

- [ ] Run: `npm run dev:mysql`
- [ ] Check console for "CRM Backend Server Running (MySQL)!"
- [ ] Check console for "✅ MySQL connection successful"
- [ ] Open browser: http://localhost:5000/health
- [ ] Verify response shows `"database": "MySQL"`
- [ ] Test: http://localhost:5000/api/v1/leads
- [ ] Verify leads are returned
- [ ] Test: http://localhost:5000/api/v1/users
- [ ] Verify users are returned
- [ ] Test: http://localhost:5000/api/v1/notifications/debug
- [ ] Verify notifications are shown

## 🎯 Frontend Testing

- [ ] Stop the Supabase backend (if running)
- [ ] Start MySQL backend: `npm run dev:mysql`
- [ ] Start your frontend
- [ ] Login to CRM
- [ ] View leads list
- [ ] Create a new lead
- [ ] Update a lead status
- [ ] Assign a lead to a salesperson
- [ ] View notifications
- [ ] Mark notification as read
- [ ] Delete a test lead (Admin only)
- [ ] Check all data persists after refresh

## 🔄 Webhook Testing

- [ ] Test webhook endpoint: POST http://localhost:5000/api/v1/webhooks/lead
- [ ] Send test lead data from website
- [ ] Verify lead appears in CRM
- [ ] Verify notification is created
- [ ] Check MySQL Workbench for new lead record

## 📊 Data Verification

- [ ] Compare user count: Supabase vs MySQL
- [ ] Compare lead count: Supabase vs MySQL
- [ ] Compare notification count: Supabase vs MySQL
- [ ] Spot-check 5 random leads for data accuracy
- [ ] Verify JSON fields (labels) are correct
- [ ] Verify foreign keys work (lead assignments)
- [ ] Verify timestamps are correct

## 🚀 Performance Check

- [ ] Monitor MySQL CPU usage
- [ ] Monitor MySQL memory usage
- [ ] Test with multiple concurrent requests
- [ ] Check query response times
- [ ] Verify connection pool is working
- [ ] Check for any slow queries

## 🔐 Security Review

- [ ] Verify `.env` is in `.gitignore`
- [ ] Ensure MySQL password is strong
- [ ] Check MySQL user permissions
- [ ] Verify no sensitive data in logs
- [ ] Test SQL injection protection (parameterized queries)

## 📝 Documentation

- [ ] Update team on migration
- [ ] Document any custom changes made
- [ ] Note any differences in behavior
- [ ] Create backup schedule
- [ ] Document rollback procedure

## 🎉 Go Live

- [ ] Run both backends side-by-side for 2-3 days
- [ ] Monitor for any issues
- [ ] Compare data consistency
- [ ] Get team feedback
- [ ] Make final decision to switch

## 🔄 Rollback Plan (If Needed)

- [ ] Stop MySQL backend
- [ ] Start Supabase backend: `npm run dev`
- [ ] Verify frontend connects to Supabase
- [ ] Document issues encountered
- [ ] Review and fix issues
- [ ] Try migration again

## ✅ Post-Migration

- [ ] Update production deployment
- [ ] Set up MySQL backups
- [ ] Monitor for 1 week
- [ ] Optimize slow queries if any
- [ ] Consider deactivating Supabase (after 2+ weeks)
- [ ] Celebrate! 🎉

## 📞 Troubleshooting

If you encounter issues, check:

- [ ] MySQL service is running
- [ ] Credentials in `.env` are correct
- [ ] Database name matches
- [ ] Tables exist in database
- [ ] Data was imported successfully
- [ ] No firewall blocking MySQL port 3306
- [ ] Console logs for specific errors

## 📚 Reference Documents

- `MYSQL_MIGRATION_COMPLETE.md` - Overview and benefits
- `QUICK_START_MYSQL.md` - Quick 7-step guide
- `MYSQL_MIGRATION_GUIDE.md` - Detailed migration guide
- `SUPABASE_VS_MYSQL.md` - Code comparison
- `mysql-schema.sql` - Database schema

---

**Progress**: _____ / 80 items completed

**Started**: ________________

**Completed**: ________________

**Notes**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
