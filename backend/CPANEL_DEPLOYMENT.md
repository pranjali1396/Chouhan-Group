# Deploying to cPanel with MySQL

This guide shows you how to deploy your CRM backend to cPanel using cPanel's built-in MySQL database.

## 📋 Prerequisites

- ✅ cPanel hosting account with Node.js support
- ✅ MySQL database access (included with most cPanel plans)
- ✅ Your backend code ready
- ✅ FTP/SSH access (optional but helpful)

## 🗄️ Step 1: Create MySQL Database

### 1.1 Access MySQL Databases

1. Log in to **cPanel**
2. Find **"MySQL Databases"** (under Databases section)
3. Click on it

### 1.2 Create Database

1. Under **"Create New Database"**:
   - **Database Name:** `chouhan_crm` (or `username_chouhan_crm`)
   - Click **"Create Database"**

2. Note the full database name (cPanel adds prefix):
   - Example: `username_chouhan_crm`

### 1.3 Create Database User

1. Scroll to **"MySQL Users"** section
2. Under **"Add New User"**:
   - **Username:** `crm_user`
   - **Password:** Generate strong password (use generator)
   - Click **"Create User"**

3. **Save these credentials securely!**

### 1.4 Add User to Database

1. Scroll to **"Add User To Database"**
2. Select:
   - **User:** `crm_user`
   - **Database:** `chouhan_crm`
3. Click **"Add"**
4. On privileges page, select **"ALL PRIVILEGES"**
5. Click **"Make Changes"**

### 1.5 Note Connection Details

You'll need:
```
Host: localhost (or your server IP)
Database: username_chouhan_crm
Username: username_crm_user
Password: (your generated password)
Port: 3306
```

## 📊 Step 2: Set Up Database Schema

### 2.1 Access phpMyAdmin

1. In cPanel, find **"phpMyAdmin"**
2. Click to open
3. Select your database from left sidebar

### 2.2 Import Schema

**Option A: Using SQL Tab**

1. Click **"SQL"** tab at top
2. Open your `mysql-schema.sql` file
3. **Remove these lines:**
   ```sql
   -- DELETE THESE:
   CREATE DATABASE IF NOT EXISTS chouhan_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE chouhan_crm;
   ```
4. Copy the rest of the SQL
5. Paste into SQL box
6. Click **"Go"**
7. Verify tables created (check left sidebar)

**Option B: Using Import**

1. Click **"Import"** tab
2. Click **"Choose File"**
3. Select your `mysql-schema.sql` (after removing CREATE DATABASE lines)
4. Click **"Go"**

### 2.3 Verify Tables

You should see:
- ✅ `users`
- ✅ `leads`
- ✅ `notifications`

Click on each to verify structure.

## 📤 Step 3: Import Your Data

### 3.1 Prepare Data Files

You have these files:
- `users_export.json`
- `leads_export.json`
- `notifications_export.json`

### 3.2 Import Using Script

**Option A: Upload and Run Import Script**

1. Upload your entire `Backend` folder to cPanel
2. SSH into your server (or use cPanel Terminal)
3. Navigate to Backend folder:
   ```bash
   cd public_html/backend
   ```
4. Create `.env` file:
   ```bash
   nano .env
   ```
5. Add:
   ```env
   MYSQL_HOST=localhost
   MYSQL_USER=username_crm_user
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=username_chouhan_crm
   PORT=5000
   ```
6. Install dependencies:
   ```bash
   npm install
   ```
7. Run import:
   ```bash
   node scripts/import-to-mysql.js
   ```

**Option B: Manual Import via phpMyAdmin**

1. In phpMyAdmin, select `users` table
2. Click **"Import"** tab
3. Upload CSV/JSON (you may need to convert JSON to CSV first)
4. Repeat for `leads` and `notifications`

## 🚀 Step 4: Deploy Backend Application

### 4.1 Check Node.js Support

1. In cPanel, find **"Setup Node.js App"** or **"Node.js Selector"**
2. If not available, contact your hosting provider

### 4.2 Upload Backend Code

**Option A: Using File Manager**

1. In cPanel, open **"File Manager"**
2. Navigate to `public_html` (or your domain's root)
3. Create folder: `backend` or `api`
4. Upload all your backend files:
   - `src/` folder
   - `package.json`
   - `package-lock.json`
   - `.env` (create this manually for security)

**Option B: Using FTP**

1. Use FileZilla or similar FTP client
2. Connect to your server
3. Upload backend folder to `public_html/backend`

**Option C: Using Git (Best Practice)**

1. SSH into server
2. Navigate to public_html:
   ```bash
   cd public_html
   ```
3. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/chouhan-crm.git backend
   cd backend/Backend
   ```

### 4.3 Create .env File

In your backend folder, create `.env`:

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=username_crm_user
MYSQL_PASSWORD=your_generated_password
MYSQL_DATABASE=username_chouhan_crm

# Server Configuration
PORT=5000
NODE_ENV=production
```

**Important:** Replace `username_` prefix with your actual cPanel username!

### 4.4 Set Up Node.js Application

1. In cPanel, go to **"Setup Node.js App"**
2. Click **"Create Application"**
3. Configure:
   - **Node.js version:** 18.x or higher (latest LTS)
   - **Application mode:** Production
   - **Application root:** `backend` (or path to your backend folder)
   - **Application URL:** Choose subdomain (e.g., `api.yourdomain.com`)
   - **Application startup file:** `src/index.js`
   - **Passenger log file:** (leave default)

4. Click **"Create"**

### 4.5 Install Dependencies

1. After creating app, you'll see a command like:
   ```bash
   source /home/username/nodevenv/backend/18/bin/activate && cd /home/username/public_html/backend
   ```
2. Copy this command
3. Open **"Terminal"** in cPanel
4. Paste and run the command
5. Then run:
   ```bash
   npm install --production
   ```

### 4.6 Start Application

1. Go back to **"Setup Node.js App"**
2. Find your application
3. Click **"Start"** or **"Restart"**
4. Status should show **"Running"**

## 🌐 Step 5: Set Up Domain/Subdomain

### 5.1 Create Subdomain (Recommended)

1. In cPanel, go to **"Subdomains"**
2. Create subdomain:
   - **Subdomain:** `api`
   - **Domain:** `yourdomain.com`
   - **Document Root:** `/public_html/backend/public` (create this folder)
3. Click **"Create"**

### 5.2 Configure Reverse Proxy

Create `.htaccess` in your subdomain's document root:

```apache
# /public_html/backend/public/.htaccess

RewriteEngine On
RewriteRule ^$ http://127.0.0.1:5000/ [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:5000/$1 [P,L]
```

This forwards all requests to your Node.js app running on port 5000.

### 5.3 Enable SSL (Free)

1. In cPanel, go to **"SSL/TLS Status"**
2. Find your subdomain (`api.yourdomain.com`)
3. Click **"Run AutoSSL"**
4. Wait for certificate to be issued (1-2 minutes)

## ✅ Step 6: Test Your Deployment

### 6.1 Test Health Endpoint

Visit:
```
https://api.yourdomain.com/health
```

Should return:
```json
{
  "status": "ok",
  "message": "CRM Backend is running with MySQL!",
  "database": "MySQL"
}
```

### 6.2 Test API Endpoints

```bash
# Get leads
curl https://api.yourdomain.com/api/v1/leads

# Get users
curl https://api.yourdomain.com/api/v1/users
```

### 6.3 Update Frontend

Update your frontend `.env`:

```env
VITE_API_URL=https://api.yourdomain.com/api/v1
```

## 🔐 Step 7: Security Best Practices

### 7.1 Protect .env File

Create `.htaccess` in backend root:

```apache
# Deny access to .env
<Files .env>
    Order allow,deny
    Deny from all
</Files>
```

### 7.2 Database Security

1. Use strong passwords (16+ characters)
2. Only allow localhost connections
3. Regular backups (see below)

### 7.3 CORS Configuration

Update your backend to allow only your frontend:

```javascript
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:5173' // for local dev
  ]
}));
```

## 💾 Step 8: Set Up Backups

### 8.1 Automatic Backups (cPanel)

Most cPanel hosts include:
- Daily automatic backups
- Access via **"Backup"** in cPanel
- Download full/partial backups

### 8.2 Manual Database Backup

**Using phpMyAdmin:**
1. Select your database
2. Click **"Export"**
3. Choose **"Quick"** or **"Custom"**
4. Click **"Go"**
5. Save `.sql` file

**Using Command Line:**
```bash
mysqldump -u username_crm_user -p username_chouhan_crm > backup_$(date +%Y%m%d).sql
```

### 8.3 Schedule Automated Backups

1. In cPanel, go to **"Cron Jobs"**
2. Add new cron job:
   ```bash
   0 2 * * * mysqldump -u username_crm_user -pYOURPASSWORD username_chouhan_crm > /home/username/backups/crm_$(date +\%Y\%m\%d).sql
   ```
   (Runs daily at 2 AM)

## 📊 Step 9: Monitoring & Logs

### 9.1 Application Logs

1. Go to **"Setup Node.js App"**
2. Click on your application
3. View **"Log file"** path
4. Access logs via File Manager or Terminal

### 9.2 Error Logs

In cPanel:
1. Go to **"Errors"** (under Metrics)
2. View recent errors
3. Download logs if needed

### 9.3 Resource Usage

Monitor in cPanel:
- **CPU and Concurrent Connection Usage**
- **Bandwidth**
- **Disk Space**

## 🔄 Step 10: Updates & Maintenance

### 10.1 Update Application Code

**Using Git:**
```bash
cd /home/username/public_html/backend
git pull origin main
npm install --production
```

**Using File Manager:**
1. Upload new files
2. Replace old files

### 10.2 Restart Application

1. Go to **"Setup Node.js App"**
2. Click **"Restart"** button
3. Or use command line:
   ```bash
   touch /home/username/public_html/backend/tmp/restart.txt
   ```

### 10.3 Database Migrations

1. Connect to phpMyAdmin
2. Run migration SQL
3. Or use command line:
   ```bash
   mysql -u username_crm_user -p username_chouhan_crm < migration.sql
   ```

## 💰 Cost Comparison

### cPanel (Your Current Plan)
- **Cost:** Already paid! $0 extra
- **Includes:** MySQL, Node.js, SSL, Backups
- **Total:** FREE (using existing subscription)

### Render Alternative
- **Cost:** ~$14/month
- **Includes:** MySQL, Web Service
- **Total:** $168/year

**Savings with cPanel: $168/year!** 💰

## 🆘 Troubleshooting

### "Can't connect to database"
- ✅ Check database name includes cPanel prefix
- ✅ Verify username includes prefix
- ✅ Use `localhost` as host
- ✅ Check password is correct

### "Node.js app won't start"
- ✅ Check Node.js version (18.x+)
- ✅ Verify `package.json` exists
- ✅ Check startup file path
- ✅ View error logs
- ✅ Ensure dependencies installed

### "502 Bad Gateway"
- ✅ Check if Node.js app is running
- ✅ Verify port 5000 is correct
- ✅ Check `.htaccess` proxy rules
- ✅ Restart application

### "Permission denied"
- ✅ Check file permissions (644 for files, 755 for folders)
- ✅ Ensure `.env` is readable
- ✅ Check folder ownership

## 📚 Additional Tips

### Performance Optimization

1. **Enable Gzip Compression:**
   Add to `.htaccess`:
   ```apache
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/json
   </IfModule>
   ```

2. **Enable Caching:**
   ```apache
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType application/json "access plus 1 hour"
   </IfModule>
   ```

3. **Use PM2 (if SSH access):**
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name crm-backend
   pm2 save
   pm2 startup
   ```

### Database Optimization

1. Add indexes (already in schema)
2. Regular OPTIMIZE TABLE:
   ```sql
   OPTIMIZE TABLE users, leads, notifications;
   ```
3. Monitor slow queries in phpMyAdmin

## ✅ Deployment Checklist

- [ ] Create MySQL database in cPanel
- [ ] Create database user
- [ ] Add user to database with all privileges
- [ ] Import schema via phpMyAdmin
- [ ] Import data (users, leads, notifications)
- [ ] Upload backend code to cPanel
- [ ] Create `.env` file with credentials
- [ ] Set up Node.js app in cPanel
- [ ] Install dependencies (`npm install`)
- [ ] Start Node.js application
- [ ] Create subdomain (api.yourdomain.com)
- [ ] Configure reverse proxy (.htaccess)
- [ ] Enable SSL certificate
- [ ] Test health endpoint
- [ ] Test API endpoints
- [ ] Update frontend URL
- [ ] Set up automated backups
- [ ] Configure monitoring

---

## 🎉 Summary

**Your CRM is now running on cPanel!**

**Backend URL:** `https://api.yourdomain.com`

**Database:** MySQL on cPanel (localhost)

**Cost:** FREE (using existing cPanel subscription)

**Benefits:**
- ✅ No additional monthly fees
- ✅ Full control of your data
- ✅ Easy database management with phpMyAdmin
- ✅ Automatic backups included
- ✅ Free SSL certificates
- ✅ Familiar cPanel interface

---

**Need help?** Most cPanel hosts offer 24/7 support via chat/email!
