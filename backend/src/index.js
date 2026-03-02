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
let notifications = [];

// Get all received leads (for testing and frontend)
app.get('/api/v1/webhooks/leads', (req, res) => {
    res.json({
        success: true,
        count: receivedLeads.length,
        leads: receivedLeads
    });
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
    console.log('📝 Waiting for leads from websites...\n');
});
