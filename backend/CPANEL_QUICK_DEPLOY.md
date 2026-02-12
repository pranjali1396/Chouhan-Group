# cPanel Deployment - Quick Guide (10 Minutes)

Deploy your CRM backend to cPanel in 10 minutes!

## ⚡ Step 1: Create MySQL Database (2 min)

1. **cPanel** → **MySQL Databases**
2. **Create Database:**
   - Name: `chouhan_crm`
   - Click "Create"
   - Note full name: `username_chouhan_crm`

3. **Create User:**
   - Username: `crm_user`
   - Password: (generate strong password)
   - Click "Create"
   - **Save password!**

4. **Add User to Database:**
   - Select user and database
   - Click "Add"
   - Check "ALL PRIVILEGES"
   - Click "Make Changes"

---

## 📊 Step 2: Import Database (2 min)

1. **cPanel** → **phpMyAdmin**
2. Select your database (left sidebar)
3. Click **"SQL"** tab
4. Copy/paste your `mysql-schema.sql` content
   - **Remove first 2 lines** (CREATE DATABASE and USE)
5. Click **"Go"**
6. Verify tables: `users`, `leads`, `notifications`

**Import Data:**
- Upload `Backend` folder to server
- SSH/Terminal: `node scripts/import-to-mysql.js`
- Or manually import via phpMyAdmin

---

## 📤 Step 3: Upload Backend Code (2 min)

1. **cPanel** → **File Manager**
2. Go to `public_html`
3. Create folder: `backend`
4. Upload all files:
   - `src/` folder
   - `package.json`
   - `package-lock.json`

5. **Create `.env` file** in backend folder:
   ```env
   MYSQL_HOST=localhost
   MYSQL_USER=username_crm_user
   MYSQL_PASSWORD=your_password_here
   MYSQL_DATABASE=username_chouhan_crm
   PORT=5000
   NODE_ENV=production
   ```
   **Replace `username_` with your actual cPanel username!**

---

## 🚀 Step 4: Setup Node.js App (2 min)

1. **cPanel** → **Setup Node.js App**
2. Click **"Create Application"**
3. Fill in:
   - **Node.js version:** 18.x or higher
   - **Application mode:** Production
   - **Application root:** `backend`
   - **Application URL:** `api.yourdomain.com` (create subdomain)
   - **Application startup file:** `src/index.js`

4. Click **"Create"**

5. **Install dependencies:**
   - Copy the command shown (looks like: `source /home/...`)
   - **cPanel** → **Terminal**
   - Paste command
   - Run: `npm install --production`

6. **Start app:**
   - Go back to "Setup Node.js App"
   - Click **"Start"** or **"Restart"**

---

## 🌐 Step 5: Setup Subdomain & SSL (2 min)

1. **cPanel** → **Subdomains**
2. Create:
   - Subdomain: `api`
   - Domain: `yourdomain.com`
   - Document root: `public_html/backend/public`
3. Click "Create"

4. **Create `.htaccess`** in `public_html/backend/public/`:
   ```apache
   RewriteEngine On
   RewriteRule ^$ http://127.0.0.1:5000/ [P,L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ http://127.0.0.1:5000/$1 [P,L]
   ```

5. **Enable SSL:**
   - **cPanel** → **SSL/TLS Status**
   - Find `api.yourdomain.com`
   - Click "Run AutoSSL"
   - Wait 1-2 minutes

---

## ✅ Step 6: Test & Update Frontend (2 min)

1. **Test backend:**
   - Visit: `https://api.yourdomain.com/health`
   - Should see: `{"status": "ok", "database": "MySQL"}`

2. **Update frontend `.env`:**
   ```env
   VITE_API_URL=https://api.yourdomain.com/api/v1
   ```

3. **Test API:**
   - `https://api.yourdomain.com/api/v1/leads`
   - `https://api.yourdomain.com/api/v1/users`

---

## 🎉 Done!

**Your backend is live at:** `https://api.yourdomain.com`

**Total time:** ~10 minutes

**Cost:** FREE (using existing cPanel)

---

## 🆘 Quick Troubleshooting

**Can't connect to database?**
- Check `.env` has correct `username_` prefix
- Verify password is correct
- Use `localhost` as host

**Node.js app won't start?**
- Check logs in "Setup Node.js App"
- Verify `package.json` exists
- Make sure dependencies installed

**502 Error?**
- Restart Node.js app
- Check `.htaccess` proxy rules
- Verify app is running on port 5000

---

## 📋 Quick Checklist

- [ ] Create MySQL database
- [ ] Create database user
- [ ] Import schema (phpMyAdmin)
- [ ] Upload backend code
- [ ] Create `.env` file
- [ ] Setup Node.js app
- [ ] Install dependencies
- [ ] Start app
- [ ] Create subdomain
- [ ] Add `.htaccess` proxy
- [ ] Enable SSL
- [ ] Test endpoints
- [ ] Update frontend URL

---

**Need detailed instructions?** See `CPANEL_DEPLOYMENT.md`

**Questions?** Contact your hosting support - they can help with Node.js setup!
