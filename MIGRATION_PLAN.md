# CRM Migration Plan: Database + Google Sheets + Multi-Website Integration

## 🎯 Objectives
1. Replace localStorage with a real database
2. Sync data from Google Sheets (bidirectional)
3. Accept lead data from multiple websites
4. Maintain existing frontend functionality
5. Enable real-time updates across all connected systems

---

## 📋 Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Multiple       │────▶│   Backend API    │────▶│   Database   │
│  Websites       │     │   (Node.js/      │     │  (PostgreSQL │
│  (Lead Forms)   │     │    Express)     │     │   /Supabase) │
└─────────────────┘     └──────────────────┘     └──────────────┘
                               │                         │
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌──────────────┐
                        │ Google Sheets│         │  React CRM   │
                        │   Sync       │         │  Frontend    │
                        │   Service    │         │              │
                        └──────────────┘         └──────────────┘
```

---

## 🗄️ Phase 1: Database Setup

### Option A: Supabase (Recommended for Quick Start)
**Pros:**
- PostgreSQL database (production-ready)
- Built-in REST API
- Real-time subscriptions
- Row-level security
- Free tier available
- Easy authentication

**Cons:**
- Vendor lock-in (can migrate later)

### Option B: Self-Hosted PostgreSQL + Node.js
**Pros:**
- Full control
- No vendor lock-in
- Customizable

**Cons:**
- More setup required
- Need to manage hosting
- Need to build API from scratch

### Recommendation: **Supabase** (for MVP) → Migrate to self-hosted later if needed

---

## 🔧 Phase 2: Backend API Development

### Tech Stack
- **Runtime:** Node.js with Express.js or Fastify
- **Database:** PostgreSQL (via Supabase or self-hosted)
- **ORM:** Prisma or TypeORM
- **Authentication:** JWT tokens
- **API Documentation:** Swagger/OpenAPI

### API Endpoints Structure

```
/api/v1/
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   └── POST /refresh-token
│
├── /leads
│   ├── GET    /leads              # List all leads (with filters)
│   ├── GET    /leads/:id           # Get single lead
│   ├── POST   /leads               # Create new lead (from website)
│   ├── PUT    /leads/:id           # Update lead
│   ├── DELETE /leads/:id           # Delete lead
│   └── POST   /leads/bulk-update   # Bulk operations
│
├── /activities
│   ├── GET    /activities          # List activities
│   ├── POST   /activities          # Create activity
│   └── GET    /activities/lead/:leadId
│
├── /inventory
│   ├── GET    /projects            # List all projects
│   ├── GET    /projects/:id/units # Get units for project
│   ├── PUT    /units/:id           # Update unit status
│   └── POST   /units               # Add new unit
│
├── /users
│   ├── GET    /users               # List users
│   ├── POST   /users               # Create user
│   └── DELETE /users/:id           # Delete user
│
├── /tasks
│   ├── GET    /tasks               # List tasks
│   ├── POST   /tasks               # Create task
│   ├── PUT    /tasks/:id/toggle    # Toggle completion
│   └── DELETE /tasks/:id           # Delete task
│
├── /webhooks
│   └── POST   /webhooks/lead       # Receive leads from websites
│
└── /sync
    ├── POST   /sync/google-sheets   # Trigger manual sync
    └── GET    /sync/status          # Check sync status
```

---

## 📊 Phase 3: Database Schema

### Tables Structure

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL, -- 'Admin', 'Salesperson'
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Leads Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- 'New', 'Qualified', 'SiteVisitScheduled', etc.
    assigned_salesperson_id UUID REFERENCES users(id),
    lead_date TIMESTAMP NOT NULL,
    last_activity_date TIMESTAMP,
    month VARCHAR(50),
    mode_of_enquiry VARCHAR(50), -- 'Digital', 'Walkin', 'Reference', etc.
    occupation VARCHAR(255),
    interested_project TEXT,
    interested_unit VARCHAR(100),
    temperature VARCHAR(20), -- 'Hot', 'Warm', 'Cold'
    visit_status VARCHAR(20), -- 'Yes', 'No', 'Will Come'
    visit_date VARCHAR(100),
    next_follow_up_date TIMESTAMP,
    last_remark TEXT,
    booking_status VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    missed_visits_count INTEGER DEFAULT 0,
    labels TEXT[], -- Array of labels
    budget VARCHAR(100),
    purpose VARCHAR(50), -- 'Investment', 'Self Use'
    booked_unit_id UUID,
    booked_project VARCHAR(255),
    booked_unit_number VARCHAR(100),
    source_website VARCHAR(255), -- Track which website the lead came from
    google_sheet_row_id VARCHAR(100), -- Link to Google Sheets row
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Activities Table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    salesperson_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'Call', 'Visit', 'Note', 'Email', 'SMS'
    date TIMESTAMP NOT NULL,
    remarks TEXT,
    customer_name VARCHAR(255),
    duration INTEGER, -- Duration in minutes
    created_at TIMESTAMP DEFAULT NOW()
);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    total_units INTEGER DEFAULT 0,
    available_units INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Units Table
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    unit_number VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Plot', 'Flat', 'Villa', etc.
    status VARCHAR(50) NOT NULL, -- 'Available', 'Booked', 'Hold', 'Blocked'
    size VARCHAR(100),
    price VARCHAR(100),
    facing VARCHAR(50),
    floor VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    assigned_to_id UUID REFERENCES users(id),
    created_by VARCHAR(255),
    due_date TIMESTAMP,
    reminder_date TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    has_reminded BOOLEAN DEFAULT FALSE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales Targets Table
CREATE TABLE sales_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salesperson_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    target_bookings INTEGER DEFAULT 0,
    target_visits INTEGER DEFAULT 0,
    achieved_bookings INTEGER DEFAULT 0,
    achieved_visits INTEGER DEFAULT 0,
    month VARCHAR(50),
    year INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(salesperson_id, month, year)
);

-- Sync Log Table (Track Google Sheets sync)
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50), -- 'google_sheets', 'website'
    direction VARCHAR(20), -- 'import', 'export'
    status VARCHAR(50), -- 'success', 'failed', 'in_progress'
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- API Keys Table (For website authentication)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(255) UNIQUE NOT NULL, -- Hashed API key
    website_name VARCHAR(255),
    website_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP
);
```

---

## 🔄 Phase 4: Google Sheets Integration

### Setup Requirements
1. **Google Cloud Project**
   - Create project in Google Cloud Console
   - Enable Google Sheets API
   - Create Service Account
   - Download JSON credentials

2. **Google Sheet Structure**
   - Maintain existing column structure
   - Add a hidden column for CRM ID mapping
   - Set up named ranges for easier access

### Sync Strategy

#### Option A: Polling (Recommended for MVP)
- Backend service runs every 5-15 minutes
- Checks for new/updated rows in Google Sheet
- Compares timestamps or row hashes
- Updates database accordingly

#### Option B: Webhook (Advanced)
- Use Google Apps Script to trigger webhook on sheet changes
- More real-time but requires more setup

### Implementation Steps

1. **Read from Google Sheets**
   ```javascript
   // Service: services/googleSheetsSync.js
   - Authenticate using service account
   - Read data from specified sheet range
   - Parse and transform data
   - Compare with database records
   - Insert/update leads in database
   ```

2. **Write to Google Sheets**
   ```javascript
   // When lead is updated in CRM
   - Find corresponding row in sheet (using google_sheet_row_id)
   - Update row with new data
   - Handle conflicts (last-write-wins or manual resolution)
   ```

3. **Sync Service**
   ```javascript
   // Scheduled job (cron or node-cron)
   - Run every 15 minutes
   - Sync from Google Sheets → Database
   - Optionally sync Database → Google Sheets
   - Log sync results
   ```

---

## 🌐 Phase 5: Multi-Website Integration

### Webhook Endpoint Design

**Endpoint:** `POST /api/v1/webhooks/lead`

**Authentication:**
- API Key in header: `X-API-Key: your-secret-key`
- Or JWT token for authenticated websites

**Request Format:**
```json
{
  "source": "website-name",
  "sourceUrl": "https://example.com",
  "customerName": "John Doe",
  "mobile": "9876543210",
  "email": "john@example.com",
  "city": "Raipur",
  "interestedProject": "Chouhan Park View",
  "interestedUnit": "2 BHK Flat",
  "budget": "25-30 Lac",
  "purpose": "Self Use",
  "remarks": "Customer inquiry from website",
  "metadata": {
    "utm_source": "google",
    "utm_campaign": "summer_sale",
    "page_url": "/contact"
  }
}
```

**Response:**
```json
{
  "success": true,
  "leadId": "uuid-here",
  "message": "Lead created successfully"
}
```

### Website Integration Code (JavaScript)

Provide websites with a simple script:

```javascript
// Example: Lead form submission handler
async function submitLead(formData) {
  const response = await fetch('https://your-api.com/api/v1/webhooks/lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'website-api-key-here'
    },
    body: JSON.stringify({
      source: 'Website Name',
      sourceUrl: window.location.origin,
      customerName: formData.name,
      mobile: formData.phone,
      email: formData.email,
      interestedProject: formData.project,
      interestedUnit: formData.unit,
      budget: formData.budget,
      purpose: formData.purpose,
      remarks: formData.message,
      metadata: {
        utm_source: getUrlParam('utm_source'),
        utm_campaign: getUrlParam('utm_campaign'),
        page_url: window.location.pathname
      }
    })
  });
  
  return await response.json();
}
```

### Security Measures
1. **API Key Management**
   - Generate unique API key per website
   - Store hashed keys in database
   - Rate limiting per API key
   - IP whitelisting (optional)

2. **Data Validation**
   - Validate all incoming data
   - Sanitize inputs
   - Check for duplicates (same mobile/email)

3. **Error Handling**
   - Return meaningful error messages
   - Log all webhook attempts
   - Alert on suspicious activity

---

## 🚀 Phase 6: Implementation Timeline

### Week 1-2: Database & Backend Setup
- [ ] Set up Supabase/PostgreSQL database
- [ ] Create database schema
- [ ] Set up Node.js backend project
- [ ] Implement basic CRUD APIs
- [ ] Set up authentication

### Week 3: Google Sheets Integration
- [ ] Set up Google Cloud project
- [ ] Create service account
- [ ] Implement Google Sheets read service
- [ ] Implement Google Sheets write service
- [ ] Create sync scheduler
- [ ] Test bidirectional sync

### Week 4: Multi-Website Integration
- [ ] Design webhook endpoint
- [ ] Implement API key management
- [ ] Create webhook handler
- [ ] Add rate limiting
- [ ] Create website integration script
- [ ] Test with sample website

### Week 5: Frontend Migration
- [ ] Update frontend to use API instead of localStorage
- [ ] Implement API service layer
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test all features

### Week 6: Testing & Deployment
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security audit
- [ ] Deploy backend API
- [ ] Deploy frontend
- [ ] Monitor and fix issues

---

## 🛠️ Technology Recommendations

### Backend
- **Framework:** Express.js or Fastify
- **Database:** Supabase (PostgreSQL) or self-hosted PostgreSQL
- **ORM:** Prisma (type-safe, great DX)
- **Authentication:** JWT with refresh tokens
- **Validation:** Zod or Joi
- **Scheduling:** node-cron or Bull (Redis-based)

### Google Sheets
- **Library:** `googleapis` (official Google client)
- **Service Account:** For server-to-server auth

### Deployment
- **Backend:** Railway, Render, or AWS
- **Database:** Supabase (managed) or AWS RDS
- **Frontend:** Vercel, Netlify, or same as backend

### Monitoring
- **Logging:** Winston or Pino
- **Error Tracking:** Sentry
- **Analytics:** Custom dashboard or Google Analytics

---

## 📝 Environment Variables Needed

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Google Sheets
GOOGLE_SHEETS_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...

# API
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
API_BASE_URL=https://api.yourdomain.com

# Frontend
VITE_API_URL=https://api.yourdomain.com
```

---

## 🔒 Security Considerations

1. **API Security**
   - Use HTTPS everywhere
   - Implement rate limiting
   - Validate and sanitize all inputs
   - Use parameterized queries (prevent SQL injection)

2. **Authentication**
   - JWT tokens with short expiry
   - Refresh token rotation
   - API keys for website integration

3. **Data Privacy**
   - Encrypt sensitive data
   - Implement GDPR compliance
   - Regular backups

4. **Monitoring**
   - Log all API requests
   - Monitor for suspicious activity
   - Set up alerts for errors

---

## 📊 Success Metrics

- [ ] All data successfully migrated from localStorage
- [ ] Google Sheets sync working (bidirectional)
- [ ] At least 2 websites successfully integrated
- [ ] API response time < 200ms (p95)
- [ ] 99.9% uptime
- [ ] Zero data loss during migration

---

## 🎯 Next Steps

1. **Review this plan** and adjust based on your needs
2. **Choose database option** (Supabase recommended for MVP)
3. **Set up development environment**
4. **Start with Phase 1** (Database setup)
5. **Iterate through phases** one at a time

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Google Sheets API Guide](https://developers.google.com/sheets/api)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Questions or need clarification on any phase? Let me know!**








