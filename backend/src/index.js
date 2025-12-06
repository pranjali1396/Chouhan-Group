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

