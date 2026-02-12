# Code Comparison: Supabase vs MySQL

This document shows side-by-side comparisons of how the same operations are done in both versions.

## 📦 Database Client Setup

### Supabase (`supabaseClient.js`)
```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

### MySQL (`mysqlClient.js`)
```javascript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

export default pool;
```

## 🔍 Fetching All Leads

### Supabase
```javascript
const { data, error } = await supabase
  .from('leads')
  .select('*')
  .order('lead_date', { ascending: false });

if (error) {
  // Handle error
}

const leads = data.map(formatLeadResponse);
```

### MySQL
```javascript
const [rows] = await mysqlPool.query(
  'SELECT * FROM leads ORDER BY lead_date DESC'
);

const leads = rows.map(formatLeadResponse);
```

## ➕ Creating a New Lead

### Supabase
```javascript
const { data, error } = await supabase
  .from('leads')
  .insert({
    customer_name: 'John Doe',
    mobile: '1234567890',
    email: 'john@example.com',
    status: 'New Lead',
    // ... other fields
  })
  .select('*')
  .single();

const leadId = data.id; // Auto-generated UUID
```

### MySQL
```javascript
const leadId = randomUUID(); // Generate UUID in code

await mysqlPool.query(
  `INSERT INTO leads (
    id, customer_name, mobile, email, status
  ) VALUES (?, ?, ?, ?, ?)`,
  [leadId, 'John Doe', '1234567890', 'john@example.com', 'New Lead']
);

// Fetch the inserted lead
const [rows] = await mysqlPool.query(
  'SELECT * FROM leads WHERE id = ?',
  [leadId]
);
```

## 🔄 Updating a Lead

### Supabase
```javascript
const { data, error } = await supabase
  .from('leads')
  .update({
    status: 'Warm',
    temperature: 'Hot',
    last_activity_date: new Date().toISOString()
  })
  .eq('id', leadId)
  .select('*')
  .single();
```

### MySQL
```javascript
await mysqlPool.query(
  `UPDATE leads 
   SET status = ?, temperature = ?, last_activity_date = ? 
   WHERE id = ?`,
  ['Warm', 'Hot', new Date().toISOString(), leadId]
);

// Fetch updated lead
const [rows] = await mysqlPool.query(
  'SELECT * FROM leads WHERE id = ?',
  [leadId]
);
```

## 🗑️ Deleting a Lead

### Supabase
```javascript
const { error } = await supabase
  .from('leads')
  .delete()
  .eq('id', leadId);
```

### MySQL
```javascript
await mysqlPool.query(
  'DELETE FROM leads WHERE id = ?',
  [leadId]
);
```

## 🔔 Creating a Notification

### Supabase
```javascript
const { error } = await supabase
  .from('notifications')
  .insert({
    id: notificationId,
    type: 'new_lead',
    message: 'New lead received',
    lead_id: leadId,
    lead_data: { customerName: 'John' },
    target_role: 'Admin',
    created_at: new Date().toISOString(),
    is_read: false
  });
```

### MySQL
```javascript
await mysqlPool.query(
  `INSERT INTO notifications (
    id, type, message, lead_id, lead_data, 
    target_role, created_at, is_read
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    notificationId,
    'new_lead',
    'New lead received',
    leadId,
    JSON.stringify({ customerName: 'John' }),
    'Admin',
    new Date().toISOString(),
    false
  ]
);
```

## 🔍 Complex Queries

### Supabase - Filter by Role
```javascript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .or('target_role.eq.Admin,target_role.is.null')
  .order('created_at', { ascending: false });
```

### MySQL - Filter by Role
```javascript
const [rows] = await mysqlPool.query(
  `SELECT * FROM notifications 
   WHERE target_role = ? OR target_role IS NULL 
   ORDER BY created_at DESC`,
  ['Admin']
);
```

## 👥 User Lookup by Local ID

### Supabase
```javascript
const { data: user } = await supabase
  .from('users')
  .select('id, name, local_id')
  .eq('local_id', 'user-1')
  .maybeSingle();
```

### MySQL
```javascript
const [rows] = await mysqlPool.query(
  'SELECT id, name, local_id FROM users WHERE local_id = ?',
  ['user-1']
);

const user = rows.length > 0 ? rows[0] : null;
```

## 📊 JSON Field Handling

### Supabase
```javascript
// Supabase automatically handles JSON
const { data } = await supabase
  .from('leads')
  .insert({
    labels: ['important', 'urgent'] // Stored as JSONB
  });

// Retrieved as array
console.log(data.labels); // ['important', 'urgent']
```

### MySQL
```javascript
// MySQL requires stringification
await mysqlPool.query(
  'INSERT INTO leads (id, labels) VALUES (?, ?)',
  [leadId, JSON.stringify(['important', 'urgent'])]
);

// Retrieved as string, needs parsing
const [rows] = await mysqlPool.query(
  'SELECT labels FROM leads WHERE id = ?',
  [leadId]
);

const labels = JSON.parse(rows[0].labels); // ['important', 'urgent']
```

## 🔑 Key Differences Summary

| Operation | Supabase | MySQL |
|-----------|----------|-------|
| **Import** | `import { createClient }` | `import mysql from 'mysql2/promise'` |
| **Connection** | Single client | Connection pool |
| **Query Style** | Method chaining | Raw SQL with `?` placeholders |
| **UUID Generation** | Database auto-generates | Generate in code with `randomUUID()` |
| **JSON Fields** | Auto-handled | Manual stringify/parse |
| **Error Handling** | Returns `{ data, error }` | Try/catch with exceptions |
| **Results** | `data` object | `[rows, fields]` array |
| **Single Row** | `.single()` | Check `rows.length` |
| **Boolean** | Native boolean | `true`/`false` or `1`/`0` |
| **Timestamps** | ISO strings | ISO strings or MySQL TIMESTAMP |

## 🎯 Best Practices

### Supabase
- Use `.select()` to specify columns
- Use `.maybeSingle()` when row might not exist
- Check `error` object before using `data`
- Use `.eq()`, `.gt()`, `.lt()` for filters

### MySQL
- Always use parameterized queries (`?`)
- Check `rows.length` before accessing `rows[0]`
- Use try/catch for error handling
- Parse JSON fields after retrieval
- Stringify JSON fields before insertion

## 🔄 Migration Pattern

When converting from Supabase to MySQL:

1. **Replace client import**
   ```javascript
   // FROM: import { supabase } from './supabaseClient.js';
   // TO:   import mysqlPool from './mysqlClient.js';
   ```

2. **Convert queries**
   ```javascript
   // FROM: const { data, error } = await supabase.from('table').select('*');
   // TO:   const [rows] = await mysqlPool.query('SELECT * FROM table');
   ```

3. **Handle UUIDs**
   ```javascript
   // Add at top: import { randomUUID } from 'crypto';
   // Use: const id = randomUUID();
   ```

4. **Handle JSON**
   ```javascript
   // Before insert: JSON.stringify(jsonData)
   // After select: JSON.parse(row.json_field)
   ```

5. **Update error handling**
   ```javascript
   // FROM: if (error) { ... }
   // TO:   try { ... } catch (error) { ... }
   ```

---

This comparison should help you understand the differences and make any additional customizations if needed!
