import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';

dotenv.config();

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
    name: 'Chouhan Group CRM Backend API',
    version: '1.0.0',
    status: 'running',
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
    message: 'CRM Backend is running!',
    timestamp: new Date().toISOString() 
  });
});

// In-memory storage for testing / fallback (temporary)
let receivedLeads = [];

// In-memory notifications storage
let notifications = [];

// Get all received leads (for testing and frontend)
app.get('/api/v1/webhooks/leads', (req, res) => {
  res.json({
    success: true,
    count: receivedLeads.length,
    leads: receivedLeads
  });
});

// API endpoint for frontend to get all leads
app.get('/api/v1/leads', async (req, res) => {
  try {
    // If Supabase is configured, use it as the single source of truth
    if (supabase) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('lead_date', { ascending: false });

      if (error) {
        console.error('Error fetching leads from Supabase:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch leads from database',
          message: error.message
        });
      }

      const formattedLeads = (data || []).map(row => {
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
          month:
            row.month ||
            new Date(row.lead_date || Date.now()).toLocaleString('default', {
              month: 'long',
              year: 'numeric'
            }),
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
          labels: row.labels || [],
          budget: row.budget || '',
          purpose: row.purpose || null,
          city: row.city || '',
          platform: row.platform || '',
          source: row.source_website || 'website'
        };
      });

      return res.json({
        success: true,
        leads: formattedLeads
      });
    }

    // Fallback: use in-memory leads (current testing behavior)
    const formattedLeads = receivedLeads.map(lead => ({
      id: lead.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerName: lead.customerName || lead.customer_name || '',
      mobile: lead.mobile || lead.phone || '',
      email: lead.email || '',
      status: lead.status || 'New',
      assignedSalespersonId: lead.assignedSalespersonId || lead.assigned_salesperson_id || null,
      leadDate: lead.leadDate || lead.lead_date || lead.receivedAt || new Date().toISOString(),
      lastActivityDate: lead.lastActivityDate || lead.last_activity_date || lead.receivedAt || new Date().toISOString(),
      month: lead.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      modeOfEnquiry: lead.modeOfEnquiry || lead.mode_of_enquiry || (lead.source === 'website' ? 'Website' : 'Digital'),
      occupation: lead.occupation || '',
      interestedProject: lead.interestedProject || lead.interested_project || '',
      interestedUnit: lead.interestedUnit || lead.interested_unit || '',
      temperature: lead.temperature || null,
      visitStatus: lead.visitStatus || lead.visit_status || 'No',
      visitDate: lead.visitDate || lead.visit_date || '',
      nextFollowUpDate: lead.nextFollowUpDate || lead.next_follow_up_date || null,
      lastRemark: lead.remarks || lead.lastRemark || lead.last_remark || '',
      bookingStatus: lead.bookingStatus || lead.booking_status || '',
      isRead: lead.isRead || false,
      missedVisitsCount: lead.missedVisitsCount || lead.missed_visits_count || 0,
      labels: lead.labels || [],
      budget: lead.budget || '',
      purpose: lead.purpose || null,
      city: lead.city || '',
      source: lead.source || lead.sourceWebsite || lead.source_website || 'website'
    }));

    res.json({
      success: true,
      leads: formattedLeads
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads',
      message: error.message
    });
  }
});

// Update lead (e.g. status, next follow-up, temperature)
app.put('/api/v1/leads/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured',
        message: 'Supabase client is not initialized on the backend'
      });
    }

    const { id } = req.params;
    const payload = req.body || {};

    const updateData = {
      status: payload.status,
      next_follow_up_date: payload.nextFollowUpDate || null,
      temperature: payload.temperature || null,
      visit_status: payload.visitStatus || null,
      visit_date: payload.visitDate || null,
      last_remark: payload.lastRemark || payload.remarks || null,
      assigned_salesperson_id: payload.assignedSalespersonId || null,
      booking_status: payload.bookingStatus || null,
      // booked_project / booked_unit_* are not in current Supabase schema, so we skip them here
      is_read: payload.isRead ?? false,
      last_activity_date: new Date().toISOString()
    };

    // Remove undefined keys so we don't overwrite with null accidentally
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    // Get current lead to check previous assignment
    const { data: currentLead } = await supabase
      .from('leads')
      .select('assigned_salesperson_id')
      .eq('id', id)
      .single();
    
    const previousAssigneeId = currentLead?.assigned_salesperson_id || null;
    const newAssigneeId = updateData.assigned_salesperson_id || null;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating lead in Supabase:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update lead',
        message: error.message
      });
    }

    // Create notification if lead was assigned to someone
    if (newAssigneeId && newAssigneeId !== previousAssigneeId) {
      const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: notificationId,
        type: 'lead_assigned',
        message: `Lead assigned: ${data.customer_name || 'Unknown'}`,
        leadId: id,
        leadData: {
          customerName: data.customer_name || '',
          mobile: data.mobile || '',
          email: data.email || '',
          interestedProject: data.interested_project || '',
          status: data.status || 'New Lead'
        },
        targetUserId: newAssigneeId, // Notify assigned user
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      // Save to Supabase if available
      if (supabase) {
        try {
          const { error: supabaseError } = await supabase
            .from('notifications')
            .insert({
              id: notificationId,
              type: 'lead_assigned',
              message: notification.message,
              lead_id: id,
              lead_data: notification.leadData,
              target_role: null,
              target_user_id: newAssigneeId,
              created_at: notification.createdAt,
              is_read: false
            });
          
          if (supabaseError) {
            console.error('❌ Error saving assignment notification to Supabase:', supabaseError);
            // Fallback to in-memory
            notifications.push(notification);
          } else {
            console.log(`🔔 Notification saved to Supabase for lead assignment to user ${newAssigneeId}`);
          }
        } catch (error) {
          console.error('❌ Error saving assignment notification:', error);
          // Fallback to in-memory
          notifications.push(notification);
        }
      } else {
        // Fallback to in-memory storage
        notifications.push(notification);
        console.log(`🔔 Notification created (in-memory) for lead assignment to user ${newAssigneeId}`);
      }
    }

    const row = data;
    const rawStatus = row.status || 'New Lead';
    const normalizedStatus = rawStatus === 'New' ? 'New Lead' : rawStatus;

    const formattedLead = {
      id: row.id,
      customerName: row.customer_name || '',
      mobile: row.mobile || '',
      email: row.email || '',
      status: normalizedStatus,
      assignedSalespersonId: row.assigned_salesperson_id || null,
      leadDate: row.lead_date || new Date().toISOString(),
      lastActivityDate: row.last_activity_date || row.lead_date || new Date().toISOString(),
      month:
        row.month ||
        new Date(row.lead_date || Date.now()).toLocaleString('default', {
          month: 'long',
          year: 'numeric'
        }),
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
      labels: row.labels || [],
      budget: row.budget || '',
      purpose: row.purpose || null,
      city: row.city || '',
      platform: row.platform || '',
      source: row.source_website || 'website'
    };

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

// Webhook endpoint to receive leads from websites
app.post('/api/v1/webhooks/lead', async (req, res) => {
  try {
    const leadData = req.body;
    
    // Log the received data
    console.log('\n✅ ===== LEAD RECEIVED FROM WEBSITE =====');
    console.log('📋 Lead Data:', JSON.stringify(leadData, null, 2));
    console.log('⏰ Received at:', new Date().toISOString());
    console.log('🌐 Source:', leadData.source || 'Unknown');
    console.log('==========================================\n');

    // Basic validation
    if (!leadData.customerName && !leadData.mobile) {
      return res.status(400).json({
        success: false,
        error: 'customerName or mobile is required'
      });
    }

    // Normalize data for Chouhan Park View website
    if (leadData.source && leadData.source.includes('Chouhan Park View')) {
      // Ensure project is set
      if (!leadData.interestedProject) {
        leadData.interestedProject = 'Chouhan Park View';
      }
      // Map home type to unit type if needed
      if (leadData.metadata && leadData.metadata.home_type) {
        const homeType = leadData.metadata.home_type;
        if (homeType.includes('Bedroom')) {
          leadData.interestedUnit = leadData.interestedUnit || 'Flat';
        }
      }
    }

    // Set source to "website" for all website leads (webhook endpoint means it's from website)
    // This ensures all leads from website can be filtered by source="website"
    leadData.source = 'website';
    
    // Set modeOfEnquiry to "Website" for all website leads
    leadData.modeOfEnquiry = 'Website';

    const now = new Date();

    // If Supabase is configured, save the lead into the "leads" table
    let supabaseLeadId = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          customer_name: leadData.customerName || '',
          mobile: leadData.mobile || null,
          email: leadData.email || null,
          status: 'New Lead',
          assigned_salesperson_id: null,
          lead_date: now.toISOString(),
          last_activity_date: now.toISOString(),
          month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
          mode_of_enquiry: 'Website',
          occupation: leadData.occupation || null,
          interested_project: leadData.interestedProject || 'Chouhan Park View',
          interested_unit: leadData.interestedUnit || null,
          temperature: leadData.temperature || null,
          visit_status: 'No',
          visit_date: null,
          next_follow_up_date: null,
          last_remark:
            leadData.remarks ||
            `Inquiry from ${leadData.source || 'website'}${leadData.city ? ` (${leadData.city})` : ''}`,
          booking_status: null,
          is_read: false,
          missed_visits_count: 0,
          labels: [],
          budget: leadData.budget || null,
          purpose: leadData.purpose || null,
          city: leadData.city || null,
          platform: leadData.platform || null,
          sales_person: leadData.salesPerson || leadData.sales_person || null,
          source_website: 'website'
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error saving lead to Supabase:', error);
      } else {
        supabaseLeadId = data?.id || null;
        console.log('💾 Lead saved to Supabase with id:', supabaseLeadId);
      }
    }

    // Also store in memory (temporary - for current frontend testing / fallback)
    const leadId = supabaseLeadId || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const storedLead = {
      ...leadData,
      id: leadId,
      receivedAt: now.toISOString(),
      status: 'New',
      modeOfEnquiry: 'Website',
      isRead: false,
      missedVisitsCount: 0,
      visitStatus: 'No'
    };
    receivedLeads.push(storedLead);
    
    console.log(`💾 Lead stored in memory. Total in-memory leads: ${receivedLeads.length}`);

    // Create notification for admin users about new lead
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification = {
      id: notificationId,
      type: 'new_lead',
      message: `New lead from ${leadData.customerName || 'Unknown'}`,
      leadId: leadId,
      leadData: {
        customerName: leadData.customerName || '',
        mobile: leadData.mobile || '',
        email: leadData.email || '',
        interestedProject: leadData.interestedProject || '',
        status: 'New Lead',
        source: leadData.source || 'website'
      },
      targetRole: 'Admin', // Notify all admin users
      createdAt: now.toISOString(),
      isRead: false
    };
    
    // Save to Supabase if available
    if (supabase) {
      try {
        const { error: supabaseError } = await supabase
          .from('notifications')
          .insert({
            id: notificationId,
            type: 'new_lead',
            message: notification.message,
            lead_id: leadId,
            lead_data: notification.leadData,
            target_role: 'Admin',
            target_user_id: null,
            created_at: now.toISOString(),
            is_read: false
          });
        
        if (supabaseError) {
          console.error('❌ Error saving notification to Supabase:', supabaseError);
          // Fallback to in-memory
          notifications.push(notification);
        } else {
          console.log(`🔔 Notification saved to Supabase for new lead: ${leadData.customerName || 'Unknown'}`);
        }
      } catch (error) {
        console.error('❌ Error saving notification:', error);
        // Fallback to in-memory
        notifications.push(notification);
      }
    } else {
      // Fallback to in-memory storage
      notifications.push(notification);
      console.log(`🔔 Notification created (in-memory) for new lead: ${leadData.customerName || 'Unknown'}`);
    }

    res.json({
      success: true,
      message: 'Lead received successfully!',
      leadId: leadId,
      receivedData: leadData,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Test endpoint to see all notifications (for debugging)
app.get('/api/v1/notifications/debug', (req, res) => {
  res.json({
    success: true,
    totalNotifications: notifications.length,
    notifications: notifications,
    message: 'This is a debug endpoint showing all notifications in memory'
  });
});

// Get notifications endpoint
app.get('/api/v1/notifications', async (req, res) => {
  try {
    const { userId, role, lastChecked } = req.query;
    console.log('📬 GET /api/v1/notifications - userId:', userId, 'role:', role, 'lastChecked:', lastChecked);
    
    let allNotifications = [];
    
    // Try to fetch from Supabase first
    if (supabase) {
      try {
        let query = supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Filter by role
        if (role === 'Admin') {
          query = query.or('target_role.eq.Admin,target_role.is.null');
        } else {
          query = query.eq('target_user_id', userId);
        }
        
        // Filter by lastChecked if provided
        if (lastChecked) {
          query = query.gt('created_at', lastChecked);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('❌ Error fetching notifications from Supabase:', error);
          // Fallback to in-memory
          allNotifications = notifications;
        } else {
          // Format Supabase notifications
          allNotifications = (data || []).map(row => ({
            id: row.id,
            type: row.type,
            message: row.message,
            leadId: row.lead_id,
            leadData: row.lead_data || {},
            targetRole: row.target_role,
            targetUserId: row.target_user_id,
            createdAt: row.created_at,
            isRead: row.is_read
          }));
          console.log('📋 Fetched', allNotifications.length, 'notifications from Supabase');
        }
      } catch (error) {
        console.error('❌ Error querying Supabase:', error);
        // Fallback to in-memory
        allNotifications = notifications;
      }
    } else {
      // Use in-memory notifications
      allNotifications = notifications;
      console.log('📋 Using in-memory notifications:', allNotifications.length);
    }
    
    const lastCheckedDate = lastChecked ? new Date(lastChecked) : new Date(0);
    
    // Filter notifications based on user role and ID
    let filteredNotifications = allNotifications.filter(notif => {
      // Check if notification is newer than lastChecked (only if lastChecked is provided)
      if (lastChecked && new Date(notif.createdAt) <= lastCheckedDate) {
        return false;
      }
      
      // Admin users see all admin notifications
      if (role === 'Admin') {
        return notif.targetRole === 'Admin' || !notif.targetRole;
      }
      
      // Regular users see only their assigned notifications
      if (notif.targetUserId) {
        return notif.targetUserId === userId;
      }
      
      return false;
    });
    
    // Sort by newest first
    filteredNotifications.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    console.log('✅ Returning', filteredNotifications.length, 'notifications');
    
    res.json({
      success: true,
      notifications: filteredNotifications,
      count: filteredNotifications.length
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
    
    // Update in Supabase if available
    if (supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating notification in Supabase:', error);
        // Fallback to in-memory
        const notification = notifications.find(n => n.id === id);
        if (notification) {
          notification.isRead = true;
          return res.json({ success: true, notification });
        }
      } else if (data) {
        // Format and return Supabase notification
        const notification = {
          id: data.id,
          type: data.type,
          message: data.message,
          leadId: data.lead_id,
          leadData: data.lead_data || {},
          targetRole: data.target_role,
          targetUserId: data.target_user_id,
          createdAt: data.created_at,
          isRead: data.is_read
        };
        return res.json({ success: true, notification });
      }
    }
    
    // Fallback to in-memory
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      res.json({ success: true, notification });
    } else {
      res.status(404).json({ success: false, error: 'Notification not found' });
    }
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
    
    // Delete from Supabase if available
    if (supabase) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleting notification from Supabase:', error);
        // Fallback to in-memory
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
          notifications.splice(index, 1);
          return res.json({ success: true, message: 'Notification deleted' });
        }
      } else {
        console.log(`🗑️ Notification ${id} deleted from Supabase`);
        return res.json({ success: true, message: 'Notification deleted' });
      }
    }
    
    // Fallback to in-memory
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.splice(index, 1);
      res.json({ success: true, message: 'Notification deleted' });
    } else {
      res.status(404).json({ success: false, error: 'Notification not found' });
    }
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
    const { role } = req.query; // Expect role to be passed as query param for admin check
    
    // Check if user is admin
    if (role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only admins can delete leads'
      });
    }
    
    // Delete from Supabase if available
    if (supabase) {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleting lead from Supabase:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete lead',
          message: error.message
        });
      } else {
        console.log(`🗑️ Lead ${id} deleted from Supabase by admin`);
        
        // Also delete associated notifications
        await supabase
          .from('notifications')
          .delete()
          .eq('lead_id', id);
        
        return res.json({ success: true, message: 'Lead deleted successfully' });
      }
    }
    
    // Fallback: remove from in-memory leads
    const leadIndex = receivedLeads.findIndex(l => l.id === id);
    if (leadIndex !== -1) {
      receivedLeads.splice(leadIndex, 1);
    }
    
    // Also remove associated notifications
    const notificationIndices = notifications
      .map((n, idx) => n.leadId === id ? idx : -1)
      .filter(idx => idx !== -1)
      .reverse(); // Reverse to delete from end to avoid index shifting
    
    notificationIndices.forEach(idx => notifications.splice(idx, 1));
    
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

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`🚀 CRM Backend Server Running!`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
  console.log(`🚀 Webhook Endpoint: http://localhost:${PORT}/api/v1/webhooks/lead`);
  console.log(`🚀 View Received Leads: http://localhost:${PORT}/api/v1/webhooks/leads`);
  console.log('🚀 ========================================\n');
  console.log('📝 Waiting for leads from websites...\n');
});

