# Quick Start Guide: Implementing the Migration Plan

This guide provides step-by-step instructions to implement the migration plan.

---

## 🚀 Step 1: Choose Your Database (30 minutes)

### Option A: Supabase (Easiest - Recommended)

1. **Sign up for Supabase**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and API keys

2. **Create Database Tables**
   - Use the SQL schema from `MIGRATION_PLAN.md`
   - Go to SQL Editor in Supabase dashboard
   - Run the CREATE TABLE statements

3. **Set up Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
   ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
   -- ... (repeat for all tables)
   
   -- Create policies (example for leads)
   CREATE POLICY "Users can view their own leads" ON leads
     FOR SELECT USING (assigned_salesperson_id = auth.uid() OR 
                      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'));
   ```

### Option B: Self-Hosted PostgreSQL

1. **Install PostgreSQL**
   - Local: Download from postgresql.org
   - Cloud: Use AWS RDS, DigitalOcean, or Railway

2. **Create Database**
   ```bash
   createdb chouhan_crm
   psql chouhan_crm < schema.sql
   ```

---

## 🔧 Step 2: Set Up Backend API (2-3 hours)

### Initialize Project

```bash
mkdir crm-backend
cd crm-backend
npm init -y
npm install express prisma @prisma/client cors dotenv
npm install -D @types/node @types/express @types/cors typescript ts-node nodemon
```

### Project Structure

```
crm-backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── routes/
│   │   ├── leads.ts
│   │   ├── activities.ts
│   │   ├── webhooks.ts
│   │   └── sync.ts
│   ├── services/
│   │   ├── database.ts
│   │   ├── googleSheets.ts
│   │   └── auth.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── validation.ts
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── .env
└── package.json
```

### Basic Express Server (src/index.ts)

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import leadsRouter from './routes/leads';
import webhooksRouter from './routes/webhooks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/leads', leadsRouter);
app.use('/api/v1/webhooks', webhooksRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### Prisma Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String?  @unique
  role      String
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  leads            Lead[]
  activities       Activity[]
  tasks            Task[]
  salesTargets    SalesTarget[]
  
  @@map("users")
}

model Lead {
  id                    String    @id @default(uuid())
  customerName          String    @map("customer_name")
  mobile                String?
  email                 String?
  status                String
  assignedSalespersonId String?   @map("assigned_salesperson_id")
  leadDate              DateTime  @map("lead_date")
  lastActivityDate      DateTime? @map("last_activity_date")
  // ... (add all fields from schema)
  
  assignedSalesperson User?      @relation(fields: [assignedSalespersonId], references: [id])
  activities          Activity[]
  tasks               Task[]
  
  @@map("leads")
}

// ... (add other models)
```

### Initialize Prisma

```bash
npx prisma generate
npx prisma db push
```

---

## 📊 Step 3: Implement Google Sheets Sync (3-4 hours)

### Install Google Sheets Library

```bash
npm install googleapis
```

### Google Sheets Service (src/services/googleSheets.ts)

```typescript
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getAuthClient() {
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });
  
  await auth.authorize();
  return auth;
}

export async function readSheetData(sheetId: string, range: string) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });
  
  return response.data.values || [];
}

export async function writeSheetData(
  sheetId: string, 
  range: string, 
  values: any[][]
) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: range,
    valueInputOption: 'RAW',
    resource: { values },
  });
}

export async function syncFromGoogleSheets() {
  const sheetId = process.env.GOOGLE_SHEETS_ID!;
  const data = await readSheetData(sheetId, 'Sheet1!A2:Z1000');
  
  // Process and save to database
  // (Implementation details in next step)
}
```

### Sync Route (src/routes/sync.ts)

```typescript
import express from 'express';
import { syncFromGoogleSheets } from '../services/googleSheets';

const router = express.Router();

router.post('/google-sheets', async (req, res) => {
  try {
    await syncFromGoogleSheets();
    res.json({ success: true, message: 'Sync completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

### Schedule Sync (using node-cron)

```bash
npm install node-cron
```

```typescript
import cron from 'node-cron';
import { syncFromGoogleSheets } from './services/googleSheets';

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Starting Google Sheets sync...');
  try {
    await syncFromGoogleSheets();
    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
  }
});
```

---

## 🌐 Step 4: Implement Webhook Endpoint (2 hours)

### Webhook Route (src/routes/webhooks.ts)

```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyApiKey } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/lead', verifyApiKey, async (req, res) => {
  try {
    const {
      source,
      sourceUrl,
      customerName,
      mobile,
      email,
      interestedProject,
      interestedUnit,
      budget,
      purpose,
      remarks,
      metadata
    } = req.body;

    // Validate required fields
    if (!customerName || !mobile) {
      return res.status(400).json({
        success: false,
        error: 'customerName and mobile are required'
      });
    }

    // Check for duplicate (same mobile)
    const existing = await prisma.lead.findFirst({
      where: { mobile }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Lead with this mobile number already exists',
        leadId: existing.id
      });
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        customerName,
        mobile,
        email,
        status: 'New',
        leadDate: new Date(),
        lastActivityDate: new Date(),
        modeOfEnquiry: 'Digital',
        interestedProject,
        interestedUnit,
        budget,
        purpose,
        lastRemark: remarks || `Lead from ${source}`,
        sourceWebsite: source,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        salespersonId: null, // Will be assigned later
        type: 'Note',
        date: new Date(),
        remarks: `New lead received from ${source}`,
        customerName
      }
    });

    res.json({
      success: true,
      leadId: lead.id,
      message: 'Lead created successfully'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
```

### API Key Middleware (src/middleware/auth.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function verifyApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }

  // Hash the provided key
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Find API key in database
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { keyHash }
  });

  if (!apiKeyRecord || !apiKeyRecord.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { lastUsedAt: new Date() }
  });

  // Attach website info to request
  req.body.sourceWebsite = apiKeyRecord.websiteName;
  req.body.sourceUrl = apiKeyRecord.websiteUrl;

  next();
}
```

---

## 🎨 Step 5: Update Frontend (4-5 hours)

### Create API Service (src/services/api.ts)

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getLeads() {
    return this.request('/leads');
  }

  async createLead(lead: any) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  }

  async updateLead(id: string, updates: any) {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ... (add other methods)
}

export const api = new ApiService();
```

### Update App.tsx

Replace `db.getAllData()` with `api.getLeads()`:

```typescript
const loadData = useCallback(async () => {
  setIsLoading(true);
  try {
    const [leads, users, activities, inventory] = await Promise.all([
      api.getLeads(),
      api.getUsers(),
      api.getActivities(),
      api.getInventory(),
    ]);
    
    setLeads(leads);
    setUsers(users);
    setActivities(activities);
    setInventory(inventory);
  } catch (error) {
    console.error('Failed to load data:', error);
    // Show error message to user
  } finally {
    setIsLoading(false);
  }
}, []);
```

---

## 📋 Step 6: Testing Checklist

### Backend Testing
- [ ] API endpoints respond correctly
- [ ] Database operations work
- [ ] Google Sheets sync reads data correctly
- [ ] Google Sheets sync writes data correctly
- [ ] Webhook accepts lead data
- [ ] API key authentication works
- [ ] Error handling works

### Frontend Testing
- [ ] Data loads from API
- [ ] Create/update/delete operations work
- [ ] Error messages display correctly
- [ ] Loading states work
- [ ] All features function as before

### Integration Testing
- [ ] Website form submits to webhook
- [ ] Lead appears in CRM
- [ ] Google Sheets sync updates CRM
- [ ] CRM updates sync to Google Sheets

---

## 🚀 Step 7: Deployment

### Backend Deployment (Railway/Render)

1. **Railway:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

2. **Set Environment Variables:**
   - DATABASE_URL
   - GOOGLE_SERVICE_ACCOUNT_EMAIL
   - GOOGLE_PRIVATE_KEY
   - JWT_SECRET
   - etc.

### Frontend Deployment (Vercel)

1. **Connect Repository:**
   - Push code to GitHub
   - Import to Vercel
   - Set environment variables
   - Deploy

2. **Environment Variables:**
   - VITE_API_URL=https://your-api.railway.app

---

## 📞 Support

If you encounter issues:
1. Check logs (backend and frontend)
2. Verify environment variables
3. Test API endpoints with Postman/curl
4. Check database connection
5. Review error messages

---

**Ready to start? Begin with Step 1!**




