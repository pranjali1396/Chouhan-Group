# Deploying to Render with MySQL

This guide shows you how to deploy your CRM backend to Render using Render's managed MySQL database.

## 📋 Prerequisites

- ✅ Render account (free tier available)
- ✅ Your backend code pushed to GitHub
- ✅ MySQL data exported locally (for import)

## 🗄️ Step 1: Create MySQL Database on Render

### 1.1 Create Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"MySQL"**
3. Configure:
   - **Name:** `chouhan-crm-db`
   - **Database:** `chouhan_crm`
   - **User:** (auto-generated or custom)
   - **Region:** Choose closest to your users (e.g., Singapore, Oregon)
   - **MySQL Version:** 8.0 (recommended)
   - **Plan:** Start with **Starter ($7/month)** or higher

4. Click **"Create Database"**

### 1.2 Wait for Database to Deploy

- Takes 2-5 minutes
- Status will change from "Creating" to "Available"

### 1.3 Get Connection Details

Once available, you'll see:

- **Internal Database URL:** `mysql://user:pass@host:3306/db` (for Render services)
- **External Database URL:** `mysql://user:pass@external-host:3306/db` (for local access)
- **Host:** `dpg-xxxxx.oregon-postgres.render.com`
- **Port:** `3306`
- **Database:** `chouhan_crm`
- **Username:** `chouhan_crm_user`
- **Password:** (auto-generated)

**Important:** Save these credentials securely!

## 📊 Step 2: Set Up Database Schema

### 2.1 Connect from MySQL Workbench

1. Open MySQL Workbench
2. Create new connection:
   - **Connection Name:** Render - Chouhan CRM
   - **Hostname:** (use External Database URL host)
   - **Port:** 3306
   - **Username:** (from Render)
   - **Password:** (from Render)
3. Test connection
4. Click "OK"

### 2.2 Create Tables

1. Connect to your Render database
2. Open `mysql-schema.sql`
3. **Remove the first two lines:**
   ```sql
   -- DELETE THESE LINES:
   CREATE DATABASE IF NOT EXISTS chouhan_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE chouhan_crm;
   ```
   (Database already exists on Render)

4. Execute the rest of the schema
5. Verify tables created:
   ```sql
   SHOW TABLES;
   ```

### 2.3 Import Your Data

**Option A: Using Import Script**

1. Update `Backend/.env` temporarily with Render credentials:
   ```env
   MYSQL_HOST=your-external-host.render.com
   MYSQL_USER=chouhan_crm_user
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=chouhan_crm
   ```

2. Run import script:
   ```bash
   node scripts/import-to-mysql.js
   ```

3. Verify data imported:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM leads;
   SELECT COUNT(*) FROM notifications;
   ```

**Option B: Using MySQL Workbench**

1. Right-click on table → "Table Data Import Wizard"
2. Select your exported CSV/JSON files
3. Map columns
4. Import

## 🚀 Step 3: Deploy Backend Web Service

### 3.1 Create Web Service

1. In Render Dashboard, click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `chouhan-crm-backend`
   - **Region:** Same as database (important!)
   - **Branch:** `main` or `master`
   - **Root Directory:** `Backend` (if backend is in subfolder)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free or Starter ($7/month for better performance)

### 3.2 Add Environment Variables

In the "Environment" section, add:

```env
MYSQL_HOST=<internal-database-host>
MYSQL_USER=<database-user>
MYSQL_PASSWORD=<database-password>
MYSQL_DATABASE=chouhan_crm
PORT=5000
NODE_ENV=production
```

**Important:** Use the **Internal Database URL** components, not external!

Example:
```env
MYSQL_HOST=dpg-xxxxx-a.oregon-postgres.render.com
MYSQL_USER=chouhan_crm_user
MYSQL_PASSWORD=abc123xyz
MYSQL_DATABASE=chouhan_crm
PORT=5000
NODE_ENV=production
```

### 3.3 Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Run `npm install`
   - Start your server with `npm start`
3. Wait for deployment (2-5 minutes)
4. Status will change to "Live"

### 3.4 Get Your Backend URL

Once deployed, you'll get a URL like:
```
https://chouhan-crm-backend.onrender.com
```

## ✅ Step 4: Test Your Deployment

### 4.1 Test Health Endpoint

Visit:
```
https://chouhan-crm-backend.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "message": "CRM Backend is running with MySQL!",
  "database": "MySQL",
  "timestamp": "2026-01-22T15:45:00.000Z"
}
```

### 4.2 Test API Endpoints

```bash
# Get leads
curl https://chouhan-crm-backend.onrender.com/api/v1/leads

# Get users
curl https://chouhan-crm-backend.onrender.com/api/v1/users
```

### 4.3 Update Frontend

Update your frontend `.env` to use the new backend URL:

```env
VITE_API_URL=https://chouhan-crm-backend.onrender.com/api/v1
```

## 🔐 Step 5: Security Best Practices

### 5.1 Environment Variables

- ✅ Never commit `.env` files
- ✅ Use Render's environment variables (encrypted)
- ✅ Rotate database passwords regularly

### 5.2 Database Access

- ✅ Use internal URL for Render services (faster, more secure)
- ✅ Use external URL only for admin access
- ✅ Whitelist IPs if possible (Render Pro plan)

### 5.3 CORS Configuration

Update your backend to allow only your frontend domain:

```javascript
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:5173' // for local development
  ]
}));
```

## 📊 Step 6: Set Up Backups

### 6.1 Automatic Backups (Render)

Render MySQL includes:
- Daily automatic backups (retained for 7 days on Starter plan)
- Point-in-time recovery
- Backup before major updates

### 6.2 Manual Backups

From MySQL Workbench:
```bash
# Export
mysqldump -h external-host.render.com -u user -p chouhan_crm > backup.sql

# Import (if needed)
mysql -h external-host.render.com -u user -p chouhan_crm < backup.sql
```

## 📈 Step 7: Monitoring

### 7.1 Render Dashboard

Monitor:
- Service health
- Request logs
- Database metrics
- Error rates

### 7.2 Set Up Alerts

In Render:
1. Go to your service
2. Settings → Notifications
3. Add email/Slack for alerts

## 💰 Pricing Estimate

### Free Tier (Testing)
- Web Service: Free (sleeps after 15 min inactivity)
- Database: Not available on free tier
- **Total: Need paid plan for database**

### Starter Tier (Production)
- Web Service: $7/month (always on)
- MySQL Database: $7/month (256MB, 1GB storage)
- **Total: ~$14/month**

### Professional Tier (Scale)
- Web Service: $25/month (better performance)
- MySQL Database: $25/month (1GB RAM, 10GB storage)
- **Total: ~$50/month**

## 🔄 Deployment Workflow

### For Updates

1. Push code to GitHub
2. Render auto-deploys (if auto-deploy enabled)
3. Or manually deploy from Render dashboard

### For Database Changes

1. Connect via MySQL Workbench (external URL)
2. Run migration SQL
3. Restart web service if needed

## 🆘 Troubleshooting

### "Can't connect to database"
- ✅ Check environment variables
- ✅ Use internal URL for web service
- ✅ Verify database is in same region
- ✅ Check database status (should be "Available")

### "Service won't start"
- ✅ Check build logs in Render
- ✅ Verify `package.json` scripts
- ✅ Check for missing dependencies
- ✅ Verify environment variables

### "Slow performance"
- ✅ Upgrade to paid plan (free tier sleeps)
- ✅ Use same region for DB and service
- ✅ Add database indexes
- ✅ Optimize queries

## 📚 Additional Resources

- [Render MySQL Docs](https://render.com/docs/databases)
- [Render Web Services Docs](https://render.com/docs/web-services)
- [Render Environment Variables](https://render.com/docs/environment-variables)

## ✅ Checklist

- [ ] Create MySQL database on Render
- [ ] Get connection credentials
- [ ] Connect from MySQL Workbench
- [ ] Run schema SQL (without CREATE DATABASE)
- [ ] Import data
- [ ] Create web service on Render
- [ ] Add environment variables (use internal URL)
- [ ] Deploy and test
- [ ] Update frontend URL
- [ ] Test all endpoints
- [ ] Set up monitoring
- [ ] Configure backups

---

**Your CRM is now running on Render with MySQL!** 🎉

**Backend URL:** `https://chouhan-crm-backend.onrender.com`

**Database:** Managed MySQL on Render
