import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import mysqlPool from './mysqlClient.js';
import axios from 'axios'; // Add axios for self-pinging

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Root endpoint - API information
app.get('/', (req, res) => {
    res.json({
        name: 'Chouhan Group CRM Backend API (MySQL)',
        version: '1.0.0',
        status: 'running',
        database: 'MySQL',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            getLeads: 'GET /api/v1/leads',
            updateLead: 'PUT /api/v1/leads/:id',
            webhookLead: 'POST /api/v1/webhooks/lead',
            viewReceivedLeads: 'GET /api/v1/webhooks/leads'
        },
        documentation: 'See README.md for API documentation'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'CRM Backend is running with MySQL!',
        database: 'MySQL',
        timestamp: new Date().toISOString()
    });
});

// In-memory storage for fallback (temporary)
let receivedLeads = [];
let backendNotifications = []; // Renamed to avoid confusion with local notifications

// In-memory presence tracking (UserID -> { lastSeen: timestamp, state: 'online'|'away' })
const UserPresence = new Map();

// Get all received leads (for testing and frontend)
app.get('/api/v1/webhooks/leads', (req, res) => {
    res.json({
        success: true,
        count: receivedLeads.length,
        leads: receivedLeads
    });
});

// Webhook endpoint to receive leads from websites
app.post('/api/v1/webhooks/lead', async (req, res) => {
    try {
        const leadData = req.body || {};

        const activeUsersCount = Array.from(UserPresence.values()).filter(p =>
            p.state === 'online' && (Date.now() - p.lastSeen < 180000)
        ).length;

        console.log('\n📥 ===== WEBHOOK LEAD RECEIVED =====');
        console.log(`👤 Active Users: ${activeUsersCount}`);
        console.log('📦 Payload:', JSON.stringify(leadData, null, 2));

        // Basic validation
        if (!leadData.customerName && !leadData.mobile) {
            console.warn('⚠️ Webhook received with missing required fields: customerName or mobile');
            return res.status(400).json({
                success: false,
                error: 'customerName or mobile is required'
            });
        }

        const now = new Date();
        const leadId = randomUUID();
        const source = leadData.source || 'website';
        const project = leadData.interestedProject || 'Chouhan Group';

        // Prepare MySQL lead object
        const newLead = {
            id: leadId,
            customer_name: leadData.customerName || 'Website Lead',
            mobile: leadData.mobile || null,
            email: leadData.email || null,
            status: 'New Lead',
            assigned_salesperson_id: null,
            lead_date: toMySQLDate(now),
            last_activity_date: toMySQLDate(now),
            month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
            mode_of_enquiry: 'Website',
            occupation: leadData.occupation || null,
            interested_project: project,
            interested_unit: leadData.interestedUnit || null,
            temperature: null,
            visit_status: 'No',
            visit_date: null,
            next_follow_up_date: null,
            last_remark: leadData.remarks || `Inquiry from ${source}`,
            booking_status: null,
            is_read: false,
            missed_visits_count: 0,
            labels: JSON.stringify([]),
            budget: leadData.budget || null,
            purpose: leadData.purpose || null,
            city: leadData.city || null,
            platform: leadData.platform || null,
            source_website: source,
            is_broker: leadData.isBroker || 'No'
        };

        console.log('💾 Saving webhook lead to MySQL...');

        // Save to MySQL
        await mysqlPool.query(
            `INSERT INTO leads (
                id, customer_name, mobile, email, status, assigned_salesperson_id,
                lead_date, last_activity_date, month, mode_of_enquiry, occupation,
                interested_project, interested_unit, temperature, visit_status,
                visit_date, next_follow_up_date, last_remark, booking_status,
                is_read, missed_visits_count, labels, budget, purpose, city,
                platform, source_website, is_broker
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newLead.id, newLead.customer_name, newLead.mobile, newLead.email,
                newLead.status, newLead.assigned_salesperson_id, newLead.lead_date,
                newLead.last_activity_date, newLead.month, newLead.mode_of_enquiry,
                newLead.occupation, newLead.interested_project, newLead.interested_unit,
                newLead.temperature, newLead.visit_status, newLead.visit_date,
                newLead.next_follow_up_date, newLead.last_remark, newLead.booking_status,
                newLead.is_read, newLead.missed_visits_count, newLead.labels,
                newLead.budget, newLead.purpose, newLead.city, newLead.platform,
                newLead.source_website, newLead.is_broker
            ]
        );

        console.log('✅ Webhook lead saved successfully:', leadId);

        // Also add to in-memory list for instant reactivity if frontend is polling
        receivedLeads.unshift({
            ...leadData,
            id: leadId,
            receivedAt: now.toISOString(),
            status: 'New Lead'
        });

        // Create notification for Admin users
        try {
            const notificationId = randomUUID();
            await mysqlPool.query(
                `INSERT INTO notifications (id, type, message, lead_id, lead_data, target_role, target_user_id, created_at, is_read)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    notificationId,
                    'new_lead',
                    `New lead from ${newLead.customer_name}`,
                    leadId,
                    JSON.stringify({
                        customerName: newLead.customer_name,
                        mobile: newLead.mobile || '',
                        email: newLead.email || '',
                        interestedProject: newLead.interested_project,
                        status: 'New Lead',
                        source: source
                    }),
                    'Admin',
                    null,
                    toMySQLDate(now),
                    false
                ]
            );
            console.log('🔔 Admin notification created for new lead');
        } catch (notifError) {
            console.error('❌ Failed to create notification for webhook lead:', notifError);
        }

        return res.status(201).json({
            success: true,
            message: 'Lead captured successfully',
            leadId: leadId
        });

    } catch (error) {
        console.error('❌ CRITICAL ERROR in POST /api/v1/webhooks/lead:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Helper to format MySQL lead row to Frontend camelCase object
const formatLeadResponse = (row) => {
    if (!row) return null;
    const rawStatus = row.status || 'New Lead';
    const normalizedStatus = rawStatus === 'New' ? 'New Lead' : rawStatus;

    return {
        id: row.id,
        customerName: row.customer_name || '',
        mobile: row.mobile || '',
        email: row.email || '',
        status: normalizedStatus,
        assignedSalespersonId: row.assigned_salesperson_id || null,
        leadDate: row.lead_date || new Date().toISOString(),
        lastActivityDate: row.last_activity_date || row.lead_date || new Date().toISOString(),
        month: row.month || new Date(row.lead_date || Date.now()).toLocaleString('default', { month: 'long', year: 'numeric' }),
        modeOfEnquiry: row.mode_of_enquiry || 'Digital',
        occupation: row.occupation || '',
        interestedProject: row.interested_project || '',
        interestedUnit: row.interested_unit || '',
        temperature: row.temperature || null,
        visitStatus: row.visit_status || 'No',
        visitDate: row.visit_date || '',
        nextFollowUpDate: row.next_follow_up_date || null,
        lastRemark: row.last_remark || '',
        bookingStatus: row.booking_status || '',
        isRead: row.is_read ?? false,
        missedVisitsCount: row.missed_visits_count || 0,
        labels: typeof row.labels === 'string' ? JSON.parse(row.labels || '[]') : (row.labels || []),
        budget: row.budget || '',
        purpose: row.purpose || null,
        city: row.city || '',
        platform: row.platform || '',
        source: row.source_website || 'website',
        isBroker: row.is_broker || 'No'
    };
};
// Helper to format JS Date/ISO string for MySQL DATETIME
const toMySQLDate = (dateVal) => {
    if (!dateVal) return null;
    try {
        const date = new Date(dateVal);
        if (isNaN(date.getTime())) return null;
        // Format: YYYY-MM-DD HH:MM:SS
        return date.toISOString().slice(0, 19).replace('T', ' ');
    } catch (e) {
        return null;
    }
};

// --- ATTENDANCE ENDPOINTS ---

// PRESENCE: Heartbeat (Automates Clock-In/Out based on Login/Presence)
app.post('/api/v1/attendance/presence', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.json({ success: true });

    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const timestamp = toMySQLDate(now);

    // 1. Store presence for the provided ID
    UserPresence.set(userId, { lastSeen: now, state: 'online' });

    try {
        // Find user MySQL ID if local ID is provided
        let dbUserId = userId;
        const [users] = await mysqlPool.query('SELECT id FROM users WHERE local_id = ? OR id = ?', [userId, userId]);
        if (users.length > 0) {
            dbUserId = users[0].id;
            UserPresence.set(dbUserId, { lastSeen: now, state: 'online' });
        }

        // Check if record exists for today
        const [records] = await mysqlPool.query(
            'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
            [dbUserId, today]
        );

        if (records.length === 0) {
            // First presence of the day -> AUTO CLOCK IN
            const attendanceId = randomUUID();
            await mysqlPool.query(
                `INSERT INTO attendance (id, user_id, date, clock_in, status, location_in)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [attendanceId, dbUserId, today, timestamp, 'Present', 'Automatic (Login)']
            );
            console.log(`✨ Auto Clock-In for ${userId}`);
        }
    } catch (err) {
        console.error('❌ Auto-Attendance error:', err);
    }

    res.json({ success: true });
});

// PRESENCE: Away (Tab Close or Inactivity)
app.post('/api/v1/attendance/away', (req, res) => {
    const { userId } = req.body;
    if (userId) {
        UserPresence.set(userId, { lastSeen: Date.now(), state: 'away' });
        console.log(`🌙 User ${userId} marked as Away`);
    }
    res.json({ success: true });
});

// PRESENCE: Logout
app.post('/api/v1/attendance/logout', async (req, res) => {
    const { userId, clockOut } = req.body;
    console.log(`👤 Logout presence for ${userId} (clockOut: ${!!clockOut})`);

    if (userId) {
        UserPresence.delete(userId);

        if (clockOut) {
            try {
                const today = new Date().toISOString().split('T')[0];
                const timestamp = toMySQLDate(new Date());

                // Find DB user ID
                let dbUserId = userId;
                const [users] = await mysqlPool.query('SELECT id FROM users WHERE local_id = ? OR id = ?', [userId, userId]);
                if (users.length > 0) dbUserId = users[0].id;

                // Update existing record for today if not clocked out
                await mysqlPool.query(
                    'UPDATE attendance SET clock_out = ? WHERE user_id = ? AND date = ? AND clock_out IS NULL',
                    [timestamp, dbUserId, today]
                );
                console.log(`✅ Auto-clocked out ${userId} on logout`);
            } catch (err) {
                console.error('❌ Auto-clock-out failed during logout:', err);
            }
        }
    }
    res.json({ success: true });
});

// GET ATTENDANCE STATUS (for individual user)
app.get('/api/v1/attendance/:userId', async (req, res) => {
    const { userId } = req.params;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    try {
        // Resolve user ID
        let dbUserId = userId;
        const [users] = await mysqlPool.query('SELECT id FROM users WHERE local_id = ? OR id = ?', [userId, userId]);
        if (users.length > 0) dbUserId = users[0].id;

        // Fetch today's record
        const [todayRecords] = await mysqlPool.query(
            'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
            [dbUserId, today]
        );

        // Fetch monthly count
        const [monthlyRecords] = await mysqlPool.query(
            'SELECT COUNT(DISTINCT date) as count FROM attendance WHERE user_id = ? AND date >= ? AND date <= ?',
            [dbUserId, startOfMonth, today]
        );

        // Fetch last 7 days history
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const [history] = await mysqlPool.query(
            'SELECT * FROM attendance WHERE user_id = ? AND date >= ? ORDER BY date DESC',
            [dbUserId, sevenDaysAgo.toISOString().split('T')[0]]
        );

        let status = 'NotClockedIn';
        let clockInTime = null;
        let clockOutTime = null;
        let location = null;
        let hoursToday = 0;

        if (todayRecords.length > 0) {
            const record = todayRecords[0];
            status = record.clock_out ? 'ClockedOut' : 'ClockedIn';
            clockInTime = record.clock_in;
            clockOutTime = record.clock_out;
            location = record.location_in;

            const start = new Date(record.clock_in).getTime();
            const end = record.clock_out ? new Date(record.clock_out).getTime() : new Date().getTime();
            hoursToday = end - start;
        }

        // Presence Status
        const presenceData = UserPresence.get(userId) || UserPresence.get(dbUserId);
        const lastSeenTime = presenceData?.lastSeen || 0;
        let pStatus = 'Offline';
        if ((Date.now() - lastSeenTime) < 180000) pStatus = 'Online';
        else if (presenceData?.state === 'away' && (Date.now() - lastSeenTime) < 600000) pStatus = 'Away';

        res.json({
            success: true,
            attendance: {
                status,
                clockInTime,
                clockOutTime,
                location,
                presenceStatus: pStatus
            },
            summary: {
                hoursToday,
                daysThisMonth: monthlyRecords[0]?.count || 0
            },
            history: history || []
        });
    } catch (error) {
        console.error('❌ Error fetching attendance status:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch attendance status' });
    }
});

// CLOCK IN
app.post('/api/v1/attendance/clock-in', async (req, res) => {
    const { userId, location, timestamp } = req.body;
    const today = new Date().toISOString().split('T')[0];

    try {
        let dbUserId = userId;
        const [users] = await mysqlPool.query('SELECT id FROM users WHERE local_id = ? OR id = ?', [userId, userId]);
        if (users.length > 0) dbUserId = users[0].id;

        const mysqlTimestamp = toMySQLDate(timestamp || new Date());
        const attendanceId = randomUUID();

        // Use INSERT ON DUPLICATE KEY UPDATE or check existence
        const [existing] = await mysqlPool.query('SELECT id FROM attendance WHERE user_id = ? AND date = ?', [dbUserId, today]);

        if (existing.length > 0) {
            await mysqlPool.query(
                'UPDATE attendance SET clock_in = ?, location_in = ?, status = ? WHERE id = ?',
                [mysqlTimestamp, location, 'Present', existing[0].id]
            );
        } else {
            await mysqlPool.query(
                `INSERT INTO attendance (id, user_id, date, clock_in, location_in, status)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [attendanceId, dbUserId, today, mysqlTimestamp, location, 'Present']
            );
        }

        res.json({ success: true, message: 'Clocked in successfully' });
    } catch (error) {
        console.error('❌ Clock-in error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// CLOCK OUT
app.post('/api/v1/attendance/clock-out', async (req, res) => {
    const { userId, timestamp } = req.body;
    const today = new Date().toISOString().split('T')[0];

    try {
        let dbUserId = userId;
        const [users] = await mysqlPool.query('SELECT id FROM users WHERE local_id = ? OR id = ?', [userId, userId]);
        if (users.length > 0) dbUserId = users[0].id;

        const mysqlTimestamp = toMySQLDate(timestamp || new Date());

        await mysqlPool.query(
            'UPDATE attendance SET clock_out = ? WHERE user_id = ? AND date = ? AND clock_out IS NULL',
            [mysqlTimestamp, dbUserId, today]
        );

        res.json({ success: true, message: 'Clocked out successfully' });
    } catch (error) {
        console.error('❌ Clock-out error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ATTENDANCE DASHBOARD
app.get('/api/v1/attendance/dashboard', async (req, res) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Week range
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(new Date().setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);
    const startOfWeek = monday.toISOString().split('T')[0];

    try {
        const [users] = await mysqlPool.query('SELECT id, name, role, local_id FROM users');
        const [attendance] = await mysqlPool.query(
            'SELECT * FROM attendance WHERE date >= ? AND date <= ?',
            [startOfWeek, today]
        );

        const dashboardData = users.map(user => {
            const todayRecord = attendance.find(a => a.user_id === user.id && a.date === today);
            const weeklyRecords = attendance.filter(a => a.user_id === user.id);

            let totalWeeklyMs = 0;
            const weeklyBreakdown = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

            weeklyRecords.forEach(r => {
                const start = new Date(r.clock_in).getTime();
                const end = r.clock_out ? new Date(r.clock_out).getTime() : (r.date === today ? new Date().getTime() : start);
                const diff = end - start;
                totalWeeklyMs += diff;
                const dateObj = new Date(r.date);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                if (weeklyBreakdown[dayName] !== undefined) {
                    weeklyBreakdown[dayName] += Math.round(diff / 3600000 * 10) / 10;
                }
            });

            const weeklyHrs = Math.floor(totalWeeklyMs / 3600000);
            const weeklyMins = Math.floor((totalWeeklyMs % 3600000) / 60000);

            // Presence
            const presenceData = UserPresence.get(user.id) || UserPresence.get(user.local_id);
            const lastSeenTime = presenceData?.lastSeen || 0;
            const isPresenceActive = (Date.now() - lastSeenTime) < 180000;

            let status = 'Offline';
            let duration = '0h 0m';
            if (todayRecord) {
                if (todayRecord.clock_out) {
                    status = 'Offline';
                } else if (isPresenceActive) {
                    status = 'Online';
                } else {
                    status = 'Away';
                }
                const start = new Date(todayRecord.clock_in).getTime();
                const end = todayRecord.clock_out ? new Date(todayRecord.clock_out).getTime() : new Date().getTime();
                const diffMs = end - start;
                duration = `${Math.floor(diffMs / 3600000)}h ${Math.floor((diffMs % 3600000) / 60000)}m`;
            } else if (isPresenceActive) {
                status = 'Browsing';
            }

            return {
                id: user.id,
                name: user.name,
                role: user.role,
                status,
                clockIn: todayRecord?.clock_in || null,
                location: todayRecord?.location_in || null,
                duration,
                weeklyHours: `${weeklyHrs}h ${weeklyMins}m`,
                weeklyBreakdown
            };
        });

        res.json({ success: true, data: dashboardData });
    } catch (error) {
        console.error('❌ Dashboard error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// EXPORT ATTENDANCE
app.get('/api/v1/attendance/export', async (req, res) => {
    const { month } = req.query; // YYYY-MM
    try {
        const start = `${month}-01`;
        const end = `${month}-31`;

        const [users] = await mysqlPool.query('SELECT id, name, role FROM users');
        const userMap = {};
        users.forEach(u => userMap[u.id] = u);

        const [records] = await mysqlPool.query(
            'SELECT * FROM attendance WHERE date >= ? AND date <= ? ORDER BY date DESC',
            [start, end]
        );

        const header = ['Date', 'Name', 'Role', 'Status', 'Clock In', 'Clock Out', 'Location', 'Duration (Mins)'];
        const csvRows = [header.join(',')];

        records.forEach(row => {
            const user = userMap[row.user_id] || { name: 'Unknown', role: '-' };
            const inTime = row.clock_in ? new Date(row.clock_in).toLocaleTimeString() : '-';
            const outTime = row.clock_out ? new Date(row.clock_out).toLocaleTimeString() : '-';
            const loc = row.location_in ? `"${row.location_in.replace(/"/g, '""')}"` : '-';

            let dur = 0;
            if (row.clock_in) {
                const start = new Date(row.clock_in).getTime();
                const end = row.clock_out ? new Date(row.clock_out).getTime() : (row.date === new Date().toISOString().split('T')[0] ? new Date().getTime() : start);
                dur = Math.round((end - start) / 60000);
            }

            csvRows.push([row.date, user.name, user.role, row.status || 'Present', inTime, outTime, loc, dur].join(','));
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`attendance-${month}.csv`);
        res.send(csvRows.join('\n'));
    } catch (error) {
        console.error('❌ Export failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
app.get('/api/v1/leads', async (req, res) => {
    try {
        const [rows] = await mysqlPool.query(
            'SELECT * FROM leads ORDER BY lead_date DESC'
        );

        const formattedLeads = rows.map(formatLeadResponse);

        return res.json({
            success: true,
            leads: formattedLeads
        });
    } catch (error) {
        console.error('Error fetching leads from MySQL:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leads from database',
            message: error.message
        });
    }
});

// Create new lead (from CRM direct add)
app.post('/api/v1/leads', async (req, res) => {
    console.log('\n📥 ===== POST /api/v1/leads CALLED =====');
    console.log('Request headers:', req.headers);

    try {
        const leadData = req.body || {};
        console.log('📦 Step 1 - Received payload:', JSON.stringify(leadData, null, 2));

        const now = new Date();
        console.log('📆 Step 2 - Timestamp:', now.toISOString());

        const resolvedAssigneeId = leadData.assignedSalespersonId || null;
        console.log('👤 Step 3 - Assigned user ID:', resolvedAssigneeId);

        console.log('🔨 Step 4 - Building lead object...');

        const leadId = randomUUID();
        const newLead = {
            id: leadId,
            customer_name: leadData.customerName || '',
            mobile: leadData.mobile || null,
            email: leadData.email || null,
            status: leadData.status || 'New Lead',
            assigned_salesperson_id: resolvedAssigneeId,
            lead_date: toMySQLDate(leadData.leadDate || now),
            last_activity_date: toMySQLDate(now),
            month: leadData.month || now.toLocaleString('default', { month: 'long', year: 'numeric' }),
            mode_of_enquiry: leadData.modeOfEnquiry || 'Direct',
            occupation: leadData.occupation || null,
            interested_project: leadData.interestedProject || '',
            interested_unit: leadData.interestedUnit || null,
            temperature: leadData.temperature || null,
            visit_status: leadData.visitStatus || 'No',
            visit_date: toMySQLDate(leadData.visitDate) || null,
            next_follow_up_date: toMySQLDate(leadData.nextFollowUpDate) || null,
            last_remark: leadData.lastRemark || leadData.remarks || 'New lead created.',
            booking_status: leadData.bookingStatus || null,
            is_read: leadData.isRead ?? false,
            missed_visits_count: leadData.missedVisitsCount || 0,
            labels: JSON.stringify(leadData.labels || []),
            budget: leadData.budget || null,
            purpose: leadData.purpose || null,
            city: leadData.city || null,
            platform: leadData.platform || null,
            source_website: leadData.source || 'CRM',
            is_broker: leadData.isBroker || 'No'
        };

        console.log('✅ Step 4 - Lead object built');

        console.log('💾 Step 5 - Attempting to save to MySQL...');

        await mysqlPool.query(
            `INSERT INTO leads (
        id, customer_name, mobile, email, status, assigned_salesperson_id,
        lead_date, last_activity_date, month, mode_of_enquiry, occupation,
        interested_project, interested_unit, temperature, visit_status,
        visit_date, next_follow_up_date, last_remark, booking_status,
        is_read, missed_visits_count, labels, budget, purpose, city,
        platform, source_website, is_broker
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newLead.id, newLead.customer_name, newLead.mobile, newLead.email,
                newLead.status, newLead.assigned_salesperson_id, newLead.lead_date,
                newLead.last_activity_date, newLead.month, newLead.mode_of_enquiry,
                newLead.occupation, newLead.interested_project, newLead.interested_unit,
                newLead.temperature, newLead.visit_status, newLead.visit_date,
                newLead.next_follow_up_date, newLead.last_remark, newLead.booking_status,
                newLead.is_read, newLead.missed_visits_count, newLead.labels,
                newLead.budget, newLead.purpose, newLead.city, newLead.platform,
                newLead.source_website, newLead.is_broker
            ]
        );

        console.log('✅ Lead saved to MySQL:', leadId);

        // Fetch the inserted lead
        const [insertedRows] = await mysqlPool.query(
            'SELECT * FROM leads WHERE id = ?',
            [leadId]
        );

        const formattedLead = formatLeadResponse(insertedRows[0]);

        return res.status(201).json({
            success: true,
            lead: formattedLead
        });
    } catch (error) {
        console.error('\n❌ ===== CRASH IN POST /api/v1/leads =====');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('========================================\n');

        return res.status(500).json({
            success: false,
            error: 'Server crash',
            message: error.message || 'Unknown error occurred',
            type: error.constructor.name
        });
    }
});

// Update lead (e.g. status, next follow-up, temperature)
app.put('/api/v1/leads/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const payload = req.body || {};

        const updateData = {
            status: payload.status,
            next_follow_up_date: toMySQLDate(payload.nextFollowUpDate),
            temperature: payload.temperature || null,
            visit_status: payload.visitStatus || null,
            visit_date: toMySQLDate(payload.visitDate),
            last_remark: payload.lastRemark || payload.remarks || null,
            assigned_salesperson_id: payload.assignedSalespersonId && payload.assignedSalespersonId !== ''
                ? payload.assignedSalespersonId
                : null,
            booking_status: payload.bookingStatus || null,
            is_read: payload.isRead ?? false,
            last_activity_date: toMySQLDate(new Date())
        };

        // Debug: Log assignment updates
        if (payload.assignedSalespersonId !== undefined) {
            console.log(`📝 Updating lead ${id} assignment:`, {
                newValue: payload.assignedSalespersonId,
                willSetTo: updateData.assigned_salesperson_id
            });
        }

        // Remove undefined keys (but keep null values - they're intentional)
        Object.keys(updateData).forEach(
            key => updateData[key] === undefined && delete updateData[key]
        );

        let updatedLead = null;
        let previousAssigneeId = null;
        let newAssigneeId = updateData.assigned_salesperson_id || null;
        let newAssigneeName = null;

        // Validate and resolve user ID if trying to assign
        if (updateData.assigned_salesperson_id && updateData.assigned_salesperson_id !== null) {
            let resolvedUserId = updateData.assigned_salesperson_id;

            // Check if it's a local ID (like user-1, admin-0) or a UUID
            const isLocalId = /^(user-|admin-)\d+$/.test(updateData.assigned_salesperson_id);

            if (isLocalId) {
                // Try to find user by local_id column
                const [userRows] = await mysqlPool.query(
                    'SELECT id, name, local_id FROM users WHERE local_id = ?',
                    [updateData.assigned_salesperson_id]
                );

                if (userRows.length > 0) {
                    resolvedUserId = userRows[0].id;
                    newAssigneeName = userRows[0].name;
                    console.log(`✅ Mapped local ID ${updateData.assigned_salesperson_id} to MySQL UUID ${resolvedUserId} (${newAssigneeName})`);
                } else {
                    return res.status(400).json({
                        success: false,
                        error: 'User not found',
                        message: `The user ID "${updateData.assigned_salesperson_id}" is a local ID that hasn't been synced to MySQL.`,
                        solution: 'Please sync your users to MySQL first.'
                    });
                }
            } else {
                // It's a UUID, verify it exists
                const [userRows] = await mysqlPool.query(
                    'SELECT id, name FROM users WHERE id = ?',
                    [updateData.assigned_salesperson_id]
                );

                if (userRows.length === 0) {
                    console.error(`❌ User ${updateData.assigned_salesperson_id} not found in users table`);
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid user assignment',
                        message: `The selected salesperson (ID: ${updateData.assigned_salesperson_id}) does not exist in the system. Please select a valid user.`
                    });
                }
                resolvedUserId = userRows[0].id;
                newAssigneeName = userRows[0].name;
                console.log(`✅ Verified user exists: ${newAssigneeName} (${resolvedUserId})`);
            }

            // Update the assignment with the resolved UUID
            updateData.assigned_salesperson_id = resolvedUserId;
            newAssigneeId = resolvedUserId;
        }

        // Get current lead to check previous assignment
        const [currentLeadRows] = await mysqlPool.query(
            'SELECT assigned_salesperson_id, customer_name FROM leads WHERE id = ?',
            [id]
        );

        if (currentLeadRows.length === 0) {
            console.error(`❌ Lead ${id} not found in MySQL`);
            return res.status(404).json({
                success: false,
                error: 'Lead not found',
                message: `Lead with id ${id} could not be found in the database.`
            });
        }

        const currentLead = currentLeadRows[0];
        previousAssigneeId = currentLead.assigned_salesperson_id || null;

        if (updateData.assigned_salesperson_id) {
            console.log(`🔄 [ASSIGNMENT] Lead ${id} (${currentLead.customer_name || 'Unknown'}):`, {
                previousAssignee: previousAssigneeId,
                newAssignee: updateData.assigned_salesperson_id,
                willChange: previousAssigneeId !== updateData.assigned_salesperson_id
            });
        }

        // Build UPDATE query dynamically
        const updateFields = [];
        const updateValues = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                updateValues.push(updateData[key]);
            }
        });

        if (updateFields.length > 0) {
            updateValues.push(id); // For WHERE clause

            await mysqlPool.query(
                `UPDATE leads SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            console.log(`✅ Lead ${id} updated in MySQL`);
        }

        // Fetch updated lead
        const [updatedRows] = await mysqlPool.query(
            'SELECT * FROM leads WHERE id = ?',
            [id]
        );

        updatedLead = updatedRows[0];

        // Create notification if lead was assigned
        const assignmentVerified = updatedLead &&
            newAssigneeId &&
            newAssigneeId !== previousAssigneeId &&
            updatedLead.assigned_salesperson_id === newAssigneeId;

        if (assignmentVerified) {
            const customerName = updatedLead.customer_name || 'Unknown';
            const notificationId = randomUUID();
            const assignMessage = newAssigneeName
                ? `Lead assigned to ${newAssigneeName}: ${customerName}`
                : `Lead assigned: ${customerName}`;

            try {
                await mysqlPool.query(
                    `INSERT INTO notifications (id, type, message, lead_id, lead_data, target_role, target_user_id, created_at, is_read)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        notificationId,
                        'lead_assigned',
                        assignMessage,
                        id,
                        JSON.stringify({
                            customerName: customerName,
                            mobile: updatedLead.mobile || '',
                            email: updatedLead.email || '',
                            interestedProject: updatedLead.interested_project || '',
                            status: updatedLead.status || 'New Lead'
                        }),
                        null,
                        newAssigneeId,
                        toMySQLDate(now),
                        false
                    ]
                );

                console.log(`🔔 Notification saved to MySQL for lead assignment to user ${newAssigneeId}`);
                console.log(`   Lead ID: ${id}, Customer: ${customerName}`);
            } catch (error) {
                console.error('❌ Error saving assignment notification:', error);
            }
        }

        // Notification for status change
        if (payload.status && updatedLead && updatedLead.status !== 'New Lead') {
            try {
                const statusMsg = `Lead status updated to "${updatedLead.status}" for ${updatedLead.customer_name || 'Customer'}${payload.updatedByName ? ` by ${payload.updatedByName}` : ''}`;
                const notificationId = randomUUID();

                await mysqlPool.query(
                    `INSERT INTO notifications (id, type, message, lead_id, lead_data, target_role, target_user_id, created_at, is_read)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        notificationId,
                        'lead_progress',
                        statusMsg,
                        id,
                        JSON.stringify({
                            customerName: updatedLead.customer_name,
                            status: updatedLead.status,
                            previousStatus: 'Unknown'
                        }),
                        'Admin',
                        null,
                        toMySQLDate(now),
                        false
                    ]
                );

                console.log(`🔔 Admin notification created for lead progress: ${statusMsg}`);
            } catch (e) {
                console.error('Error creating progress notification:', e);
            }
        }

        const formattedLead = formatLeadResponse(updatedLead);

        res.json({
            success: true,
            lead: formattedLead
        });
    } catch (error) {
        console.error('Error in PUT /api/v1/leads/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});




// Get notifications endpoint
app.get('/api/v1/notifications', async (req, res) => {
    try {
        const { userId, role, lastChecked } = req.query;
        console.log('📬 GET /api/v1/notifications - userId:', userId, 'role:', role, 'lastChecked:', lastChecked);

        let query = 'SELECT * FROM notifications WHERE 1=1';
        const params = [];

        // Filter by role
        if (role === 'Admin') {
            query += ' AND (target_role = ? OR target_role IS NULL)';
            params.push('Admin');
        } else if (userId) {
            query += ' AND target_user_id = ?';
            params.push(userId);
        }

        // Filter by lastChecked if provided
        if (lastChecked) {
            query += ' AND created_at > ?';
            params.push(lastChecked);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await mysqlPool.query(query, params);

        const allNotifications = rows.map(row => ({
            id: row.id,
            type: row.type,
            message: row.message,
            leadId: row.lead_id,
            leadData: typeof row.lead_data === 'string' ? JSON.parse(row.lead_data || '{}') : (row.lead_data || {}),
            targetRole: row.target_role,
            targetUserId: row.target_user_id,
            createdAt: row.created_at,
            isRead: row.is_read
        }));

        console.log('✅ Returning', allNotifications.length, 'notifications');

        res.json({
            success: true,
            notifications: allNotifications,
            count: allNotifications.length
        });
    } catch (error) {
        console.error('❌ Error getting notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications',
            message: error.message
        });
    }
});

// Mark notification as read
app.post('/api/v1/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        await mysqlPool.query(
            'UPDATE notifications SET is_read = ? WHERE id = ?',
            [true, id]
        );

        const [rows] = await mysqlPool.query(
            'SELECT * FROM notifications WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        const notification = {
            id: rows[0].id,
            type: rows[0].type,
            message: rows[0].message,
            leadId: rows[0].lead_id,
            leadData: typeof rows[0].lead_data === 'string' ? JSON.parse(rows[0].lead_data || '{}') : (rows[0].lead_data || {}),
            targetRole: rows[0].target_role,
            targetUserId: rows[0].target_user_id,
            createdAt: rows[0].created_at,
            isRead: rows[0].is_read
        };

        res.json({ success: true, notification });
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read',
            message: error.message
        });
    }
});

// Delete notification
app.delete('/api/v1/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await mysqlPool.query(
            'DELETE FROM notifications WHERE id = ?',
            [id]
        );

        console.log(`🗑️ Notification ${id} deleted from MySQL`);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('❌ Error deleting notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete notification',
            message: error.message
        });
    }
});

// Delete lead (Admin only)
app.delete('/api/v1/leads/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.query;

        // Check if user is admin
        if (role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Only admins can delete leads'
            });
        }

        await mysqlPool.query('DELETE FROM leads WHERE id = ?', [id]);
        console.log(`🗑️ Lead ${id} deleted from MySQL by admin`);

        // Also delete associated notifications
        await mysqlPool.query('DELETE FROM notifications WHERE lead_id = ?', [id]);

        res.json({ success: true, message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting lead:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete lead',
            message: error.message
        });
    }
});

// Get users endpoint
app.get('/api/v1/users', async (req, res) => {
    try {
        const [rows] = await mysqlPool.query(
            'SELECT * FROM users ORDER BY name ASC'
        );

        res.json({
            success: true,
            users: rows.map(user => ({
                id: user.id,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatar_url || ''
            }))
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
            message: error.message
        });
    }
});

// Create user endpoint
app.post('/api/v1/users', async (req, res) => {
    try {
        const { name, role, avatarUrl, id: localId } = req.body;

        if (!name || !role) {
            return res.status(400).json({ success: false, error: 'Name and role are required' });
        }

        const id = randomUUID();
        await mysqlPool.query(
            'INSERT INTO users (id, name, role, avatar_url, local_id) VALUES (?, ?, ?, ?, ?)',
            [id, name, role, avatarUrl || null, localId || null]
        );

        const newUser = { id, name, role, avatarUrl: avatarUrl || '' };
        console.log(`👤 New user created: ${name} (${role})`);

        res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, error: 'Failed to create user', message: error.message });
    }
});

// Delete user endpoint
app.delete('/api/v1/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.query;

        if (!adminId) {
            return res.status(400).json({ success: false, error: 'Admin ID required for reassignment' });
        }

        // 1. Reassign leads to admin
        await mysqlPool.query(
            'UPDATE leads SET assigned_salesperson_id = ? WHERE assigned_salesperson_id = ?',
            [adminId, id]
        );

        // 2. Reassign notifications to admin (if they were targeted at this user)
        await mysqlPool.query(
            'UPDATE notifications SET target_user_id = ? WHERE target_user_id = ?',
            [adminId, id]
        );

        // 3. Delete user
        await mysqlPool.query('DELETE FROM users WHERE id = ?', [id]);

        console.log(`🗑️ User ${id} deleted and leads reassigned to ${adminId}`);
        res.json({ success: true, message: 'User deleted and leads reassigned' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: 'Failed to delete user', message: error.message });
    }
});

// Sync users endpoint - creates/updates users in MySQL
app.post('/api/v1/users/sync', async (req, res) => {
    try {
        const { users } = req.body;

        if (!users || !Array.isArray(users)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'users array is required'
            });
        }

        const syncedUsers = [];
        const errors = [];

        for (const user of users) {
            try {
                // Check if user exists by name and role
                const [existingRows] = await mysqlPool.query(
                    'SELECT id, name, role FROM users WHERE name = ? AND role = ?',
                    [user.name, user.role]
                );

                if (existingRows.length > 0) {
                    // Update existing user
                    const existingUser = existingRows[0];

                    await mysqlPool.query(
                        'UPDATE users SET name = ?, role = ?, avatar_url = ?, local_id = ? WHERE id = ?',
                        [user.name, user.role, user.avatarUrl || null, user.id, existingUser.id]
                    );

                    syncedUsers.push({ localId: user.id, mysqlId: existingUser.id, user: existingUser });
                } else {
                    // Create new user with UUID
                    const newUserId = randomUUID();

                    await mysqlPool.query(
                        'INSERT INTO users (id, name, role, avatar_url, local_id) VALUES (?, ?, ?, ?, ?)',
                        [newUserId, user.name, user.role, user.avatarUrl || null, user.id]
                    );

                    syncedUsers.push({ localId: user.id, mysqlId: newUserId, user: { id: newUserId, name: user.name, role: user.role } });
                }
            } catch (error) {
                console.error(`Error syncing user ${user.name}:`, error);
                errors.push({ user: user.name, error: error.message });
            }
        }

        res.json({
            success: true,
            synced: syncedUsers.length,
            errors: errors.length,
            users: syncedUsers,
            errorDetails: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error syncing users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync users',
            message: error.message
        });
    }
});

// Test endpoint for notifications debug
app.get('/api/v1/notifications/debug', async (req, res) => {
    try {
        const [rows] = await mysqlPool.query('SELECT * FROM notifications ORDER BY created_at DESC');

        res.json({
            success: true,
            totalNotifications: rows.length,
            notifications: rows,
            message: 'This is a debug endpoint showing all notifications in MySQL'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log(`🚀 CRM Backend Server Running (MySQL)!`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🚀 Database: MySQL`);
    console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
    console.log(`🚀 Webhook Endpoint: http://localhost:${PORT}/api/v1/webhooks/lead`);
    console.log(`🚀 View Received Leads: http://localhost:${PORT}/api/v1/webhooks/leads`);
    console.log('🚀 ========================================\n');

    // Self-ping mechanism to prevent Render sleep (Ping every 10 mins)
    const selfUrl = process.env.SELF_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
        try {
            if (selfUrl.includes('localhost') && process.env.NODE_ENV === 'production') return;
            console.log(`📡 Self-pinging to keep alive: ${selfUrl}/health`);
            await axios.get(`${selfUrl}/health`);
        } catch (e) {
            console.warn('📡 Self-ping failed (expected if local):', e.message);
        }
    }, 600000); // 10 minutes

    console.log('📝 Waiting for leads from websites...\n');
});
