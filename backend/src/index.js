import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient.js';

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

// Helper to format Supabase lead row to Frontend camelCase object
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
    labels: row.labels || [],
    budget: row.budget || '',
    purpose: row.purpose || null,
    city: row.city || '',
    platform: row.platform || '',
    source: row.source_website || 'website'
  };
};

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

      const formattedLeads = (data || []).map(formatLeadResponse);

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

// Create new lead (from CRM direct add)
app.post('/api/v1/leads', async (req, res) => {
  console.log('\n📥 ===== POST /api/v1/leads CALLED =====');
  console.log('Request headers:', req.headers);

  try {
    // Step 1: Parse body
    const leadData = req.body || {};
    console.log('📦 Step 1 - Received payload:', JSON.stringify(leadData, null, 2));

    // Step 2: Initialize
    const now = new Date();
    console.log('📆 Step 2 - Timestamp:', now.toISOString());

    // Step 3: Simple assignment (no resolution for now)
    const resolvedAssigneeId = leadData.assignedSalespersonId || null;
    console.log('👤 Step 3 - Assigned user ID:', resolvedAssigneeId);

    // Step 4: Build lead object
    console.log('🔨 Step 4 - Building lead object...');
    const newLead = {
      customer_name: leadData.customerName || '',
      mobile: leadData.mobile || null,
      email: leadData.email || null,
      status: leadData.status || 'New Lead',
      assigned_salesperson_id: resolvedAssigneeId,
      lead_date: leadData.leadDate || now.toISOString(),
      last_activity_date: now.toISOString(),
      month: leadData.month || now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      mode_of_enquiry: leadData.modeOfEnquiry || 'Direct',
      occupation: leadData.occupation || null,
      interested_project: leadData.interestedProject || '',
      interested_unit: leadData.interestedUnit || null,
      temperature: leadData.temperature || null,
      visit_status: leadData.visitStatus || 'No',
      visit_date: leadData.visitDate || null,
      next_follow_up_date: leadData.nextFollowUpDate || null,
      last_remark: leadData.lastRemark || leadData.remarks || 'New lead created.',
      booking_status: leadData.bookingStatus || null,
      is_read: leadData.isRead ?? false,
      missed_visits_count: leadData.missedVisitsCount || 0,
      labels: leadData.labels || [],
      budget: leadData.budget || null,
      purpose: leadData.purpose || null,
      city: leadData.city || null,
      platform: leadData.platform || null,
      source_website: leadData.source || 'CRM'
    };
    console.log('✅ Step 4 - Lead object built');

    // Step 5: Save to database
    console.log('💾 Step 5 - Attempting to save...');
    console.log('   Supabase available:', !!supabase);

    if (supabase) {
      console.log('   → Using Supabase');
      const { data, error } = await supabase
        .from('leads')
        .insert(newLead)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Supabase INSERT error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return res.status(500).json({
          success: false,
          error: 'Database insertion failed',
          message: error.message || 'Unknown database error',
          details: error.details,
          hint: error.hint
        });
      }

      console.log('✅ Lead saved to Supabase:', data.id);
      const formattedLead = formatLeadResponse(data);

      return res.status(201).json({
        success: true,
        lead: formattedLead
      });
    } else {
      // In-memory fallback
      console.log('   → Using in-memory storage (Supabase not configured)');
      const inMemLeadId = `lead-${Date.now()}`;
      const inMemLead = { ...leadData, id: inMemLeadId };
      receivedLeads.push(inMemLead);

      console.log('✅ Lead saved to memory:', inMemLeadId);
      return res.status(201).json({
        success: true,
        lead: { ...inMemLead, id: inMemLeadId }
      });
    }
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
      next_follow_up_date: payload.nextFollowUpDate || null,
      temperature: payload.temperature || null,
      visit_status: payload.visitStatus || null,
      visit_date: payload.visitDate || null,
      last_remark: payload.lastRemark || payload.remarks || null,
      // IMPORTANT: Preserve assigned_salesperson_id value - use null only if explicitly null/undefined
      // If it's an empty string, we should keep it as null (unassigned)
      assigned_salesperson_id: payload.assignedSalespersonId && payload.assignedSalespersonId !== ''
        ? payload.assignedSalespersonId
        : null,
      booking_status: payload.bookingStatus || null,
      // booked_project / booked_unit_* are not in current Supabase schema, so we skip them here
      is_read: payload.isRead ?? false,
      last_activity_date: new Date().toISOString()
    };

    // Debug: Log assignment updates
    if (payload.assignedSalespersonId !== undefined) {
      console.log(`📝 Updating lead ${id} assignment:`, {
        oldValue: 'checking...',
        newValue: payload.assignedSalespersonId,
        willSetTo: updateData.assigned_salesperson_id
      });
    }

    // CRITICAL: Always include assigned_salesperson_id if it's in the payload
    // Don't remove it even if it's null (null means unassign)
    if (payload.assignedSalespersonId !== undefined) {
      // Ensure it's in updateData (it should already be, but double-check)
      updateData.assigned_salesperson_id = payload.assignedSalespersonId && payload.assignedSalespersonId !== ''
        ? payload.assignedSalespersonId
        : null;
      console.log(`📝 [UPDATE LEAD] Lead ${id}:`, {
        receivedAssignedId: payload.assignedSalespersonId,
        receivedType: typeof payload.assignedSalespersonId,
        willUpdateTo: updateData.assigned_salesperson_id,
        updateDataKeys: Object.keys(updateData),
        updateDataHasAssigned: 'assigned_salesperson_id' in updateData
      });
    } else {
      console.log(`📝 [UPDATE LEAD] Lead ${id}: assignedSalespersonId NOT in payload (will not update assignment)`);
    }

    // Remove undefined keys (but keep null values - they're intentional)
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    // Final check: ensure assigned_salesperson_id is in updateData if it was in payload
    if (payload.assignedSalespersonId !== undefined && !('assigned_salesperson_id' in updateData)) {
      console.error(`❌ CRITICAL: assigned_salesperson_id was removed from updateData! Re-adding it.`);
      updateData.assigned_salesperson_id = payload.assignedSalespersonId && payload.assignedSalespersonId !== ''
        ? payload.assignedSalespersonId
        : null;
    }

    let updatedLead = null;
    let previousAssigneeId = null;
    let newAssigneeId = updateData.assigned_salesperson_id || null;
    let newAssigneeName = null;

    // 1. Try to update in Supabase
    if (supabase) {
      // Validate and resolve user ID if trying to assign
      if (updateData.assigned_salesperson_id && updateData.assigned_salesperson_id !== null) {
        let resolvedUserId = updateData.assigned_salesperson_id;

        // Check if it's a local ID (like user-1, admin-0) or a UUID
        const isLocalId = /^(user-|admin-)\d+$/.test(updateData.assigned_salesperson_id);

        if (isLocalId) {
          // Try to find user by local_id column first (if it exists)
          let userByLocalId = null;
          try {
            const { data } = await supabase
              .from('users')
              .select('id, name, local_id')
              .eq('local_id', updateData.assigned_salesperson_id)
              .maybeSingle();
            userByLocalId = data;
          } catch (err) {
            // local_id column might not exist, that's ok
            console.log('   local_id column may not exist, will try name-based lookup');
          }

          if (userByLocalId) {
            resolvedUserId = userByLocalId.id;
            newAssigneeName = userByLocalId.name;
            console.log(`✅ Mapped local ID ${updateData.assigned_salesperson_id} to Supabase UUID ${resolvedUserId} (${newAssigneeName})`);
          } else {
            // Fallback: Try to get user name from payload or look up by common patterns
            // Since we don't have user name in payload, we need to sync users first
            // For now, return a helpful error with instructions
            return res.status(400).json({
              success: false,
              error: 'User not found',
              message: `The user ID "${updateData.assigned_salesperson_id}" is a local ID that hasn't been synced to Supabase.`,
              solution: 'Please sync your users to Supabase first. You can do this by:',
              steps: [
                '1. Call POST /api/v1/users/sync with your users array',
                '2. Or add a local_id column to your users table in Supabase',
                '3. Then sync users again to populate the mapping'
              ],
              sqlMigration: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS local_id VARCHAR(50);'
            });
          }
        } else {
          // It's a UUID, verify it exists
          const { data: userExists, error: userCheckError } = await supabase
            .from('users')
            .select('id, name')
            .eq('id', updateData.assigned_salesperson_id)
            .single();

          if (userCheckError || !userExists) {
            console.error(`❌ User ${updateData.assigned_salesperson_id} not found in users table`);
            console.error('   Error:', userCheckError?.message);
            return res.status(400).json({
              success: false,
              error: 'Invalid user assignment',
              message: `The selected salesperson (ID: ${updateData.assigned_salesperson_id}) does not exist in the system. Please select a valid user.`
            });
          }
          resolvedUserId = userExists.id;
          newAssigneeName = userExists.name;
          console.log(`✅ Verified user exists: ${newAssigneeName} (${resolvedUserId})`);
        }

        // Update the assignment with the resolved UUID
        updateData.assigned_salesperson_id = resolvedUserId;
        newAssigneeId = resolvedUserId;
      }

      // Get current lead to check previous assignment and verify it exists
      const { data: currentLead, error: fetchError } = await supabase
        .from('leads')
        .select('assigned_salesperson_id, customer_name')
        .eq('id', id)
        .single();

      if (fetchError || !currentLead) {
        console.error(`❌ Lead ${id} not found in Supabase:`, fetchError?.message);
        console.error(`   Error code: ${fetchError?.code}, Error hint: ${fetchError?.hint}`);
        // Check if lead exists in in-memory storage
        const inMemoryLead = receivedLeads.find(l => l.id === id);
        if (inMemoryLead) {
          console.log(`   ⚠️ Lead found in in-memory storage, will update there`);
          previousAssigneeId = inMemoryLead.assignedSalespersonId || null;
        } else {
          console.error(`   ❌ Lead ${id} not found in Supabase OR in-memory storage`);
          return res.status(404).json({
            success: false,
            error: 'Lead not found',
            message: `Lead with id ${id} could not be found in the database.`
          });
        }
        // Will fall back to in-memory update below
      } else {
        previousAssigneeId = currentLead.assigned_salesperson_id || null;

        if (updateData.assigned_salesperson_id) {
          console.log(`🔄 [ASSIGNMENT] Lead ${id} (${currentLead.customer_name || 'Unknown'}):`, {
            previousAssignee: previousAssigneeId,
            newAssignee: updateData.assigned_salesperson_id,
            willChange: previousAssigneeId !== updateData.assigned_salesperson_id
          });
        }

        console.log(`🔄 [SUPABASE UPDATE] Attempting to update lead ${id} with:`, JSON.stringify(updateData, null, 2));
        console.log(`   Update includes assigned_salesperson_id: ${'assigned_salesperson_id' in updateData}`);
        if ('assigned_salesperson_id' in updateData) {
          console.log(`   assigned_salesperson_id value: ${updateData.assigned_salesperson_id} (type: ${typeof updateData.assigned_salesperson_id})`);
        }

        const { data, error } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .single();

        // Log the response immediately
        if (data) {
          console.log(`✅ Supabase update response received for lead ${id}`);
          console.log(`   Response assigned_salesperson_id: ${data.assigned_salesperson_id} (type: ${typeof data.assigned_salesperson_id})`);
        }

        if (error) {
          console.error('❌ Error updating lead in Supabase:', error.message);
          console.error('   Error code:', error.code);
          console.error('   Error details:', JSON.stringify(error, null, 2));
          console.error('   Update data that failed:', JSON.stringify(updateData, null, 2));

          // Check for foreign key constraint violation
          if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key constraint')) {
            return res.status(400).json({
              success: false,
              error: 'Invalid user assignment',
              message: `Failed to assign lead: The selected salesperson does not exist in the system. Please select a valid user.`,
              details: error.message
            });
          }

          // Return other Supabase errors with clear message
          return res.status(500).json({
            success: false,
            error: 'Failed to update lead',
            message: error.message || 'An error occurred while updating the lead in the database.',
            details: error.code ? `Error code: ${error.code}` : undefined
          });
        } else {
          updatedLead = data;
          // Log assignment for debugging
          if (updateData.assigned_salesperson_id) {
            console.log(`✅ Lead ${id} assigned to user ${updateData.assigned_salesperson_id} in Supabase`);
            console.log(`   Customer: ${updatedLead.customer_name || 'Unknown'}`);
            console.log(`   Assigned ID in DB after update: ${updatedLead.assigned_salesperson_id}`);

            // CRITICAL: Verify the assignment was actually saved
            const assignmentMatches = updatedLead.assigned_salesperson_id === updateData.assigned_salesperson_id;
            console.log(`   ✅ Assignment verification: ${assignmentMatches ? 'SUCCESS' : 'FAILED - MISMATCH!'}`);

            if (!assignmentMatches) {
              console.error(`   ❌ CRITICAL: Assignment mismatch! Expected: ${updateData.assigned_salesperson_id}, Got: ${updatedLead.assigned_salesperson_id}`);
              // Don't create notification if assignment didn't actually save
              updatedLead = null; // This will prevent notification creation
            } else {
              // Verify by fetching again to be absolutely sure
              const { data: verifyData, error: verifyError } = await supabase
                .from('leads')
                .select('assigned_salesperson_id, customer_name')
                .eq('id', id)
                .single();

              if (verifyError) {
                console.error(`   ❌ Verification fetch failed: ${verifyError.message}`);
                updatedLead = null; // Prevent notification if we can't verify
              } else {
                console.log(`   🔍 Verification fetch: assigned_salesperson_id = ${verifyData?.assigned_salesperson_id}`);
                if (verifyData?.assigned_salesperson_id !== updateData.assigned_salesperson_id) {
                  console.error(`   ❌ Verification failed! DB has: ${verifyData?.assigned_salesperson_id}, expected: ${updateData.assigned_salesperson_id}`);
                  updatedLead = null; // Prevent notification
                }
              }
            }
          } else if (updateData.assigned_salesperson_id === null) {
            console.log(`🔄 Lead ${id} unassigned (assigned_salesperson_id set to null)`);
            console.log(`   Current value in DB: ${updatedLead.assigned_salesperson_id}`);
          }
        }
      }
    }

    // 2. Fallback / Sync to In-Memory
    // Always update in-memory to keep local state in sync (or as primary if no Supabase)
    const leadIndex = receivedLeads.findIndex(l => l.id === id);
    if (leadIndex !== -1) {
      const currentLead = receivedLeads[leadIndex];
      if (!supabase) {
        previousAssigneeId = currentLead.assignedSalespersonId || null;
      }

      // Update in-memory lead
      const updatedMemLead = { ...currentLead };

      if (payload.status) updatedMemLead.status = payload.status;
      if (payload.nextFollowUpDate !== undefined) updatedMemLead.nextFollowUpDate = payload.nextFollowUpDate;
      if (payload.temperature !== undefined) updatedMemLead.temperature = payload.temperature;
      if (payload.visitStatus !== undefined) updatedMemLead.visitStatus = payload.visitStatus;
      if (payload.visitDate !== undefined) updatedMemLead.visitDate = payload.visitDate;
      if (payload.lastRemark || payload.remarks) updatedMemLead.lastRemark = payload.lastRemark || payload.remarks;
      if (payload.assignedSalespersonId !== undefined) updatedMemLead.assignedSalespersonId = payload.assignedSalespersonId;
      if (payload.bookingStatus !== undefined) updatedMemLead.bookingStatus = payload.bookingStatus;
      if (payload.isRead !== undefined) updatedMemLead.isRead = payload.isRead;
      updatedMemLead.lastActivityDate = new Date().toISOString();

      receivedLeads[leadIndex] = updatedMemLead;

      // If no Supabase or Supabase update failed, use this as our result
      if (!supabase || !updatedLead) {
        updatedLead = {
          id: updatedMemLead.id,
          customer_name: updatedMemLead.customerName,
          mobile: updatedMemLead.mobile,
          email: updatedMemLead.email,
          status: updatedMemLead.status,
          assigned_salesperson_id: updatedMemLead.assignedSalespersonId,
          lead_date: updatedMemLead.leadDate,
          last_activity_date: updatedMemLead.lastActivityDate,
          month: updatedMemLead.month,
          mode_of_enquiry: updatedMemLead.modeOfEnquiry,
          occupation: updatedMemLead.occupation,
          interested_project: updatedMemLead.interestedProject,
          interested_unit: updatedMemLead.interestedUnit,
          temperature: updatedMemLead.temperature,
          visit_status: updatedMemLead.visitStatus,
          visit_date: updatedMemLead.visitDate,
          next_follow_up_date: updatedMemLead.nextFollowUpDate,
          last_remark: updatedMemLead.lastRemark,
          booking_status: updatedMemLead.bookingStatus,
          is_read: updatedMemLead.isRead,
          missed_visits_count: updatedMemLead.missedVisitsCount,
          labels: updatedMemLead.labels,
          budget: updatedMemLead.budget,
          purpose: updatedMemLead.purpose,
          city: updatedMemLead.city,
          platform: updatedMemLead.platform,
          source_website: updatedMemLead.source
        };
      }
    } else if (!supabase) {
      // Not in memory and not in Supabase
      return res.status(404).json({
        success: false,
        error: 'Lead not found in local memory'
      });
    }

    // Create notification if lead was assigned AND update was successful
    // Only create notification if we have a valid updatedLead (meaning update succeeded)
    // AND the assignment actually matches what we tried to set
    const assignmentVerified = updatedLead &&
      newAssigneeId &&
      newAssigneeId !== previousAssigneeId &&
      updatedLead.assigned_salesperson_id === newAssigneeId;

    if (assignmentVerified) {
      const customerName = updatedLead.customer_name || 'Unknown';
      const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const assignMessage = newAssigneeName
        ? `Lead assigned to ${newAssigneeName}: ${customerName}`
        : `Lead assigned: ${customerName}`;

      const notification = {
        id: notificationId,
        type: 'lead_assigned',
        message: assignMessage,
        leadId: id,
        leadData: {
          customerName: customerName,
          mobile: updatedLead.mobile || '',
          email: updatedLead.email || '',
          interestedProject: updatedLead.interested_project || '',
          status: updatedLead.status || 'New Lead'
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
            console.log(`   Lead ID: ${id}, Customer: ${customerName}`);
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
    } else if (newAssigneeId && newAssigneeId !== previousAssigneeId) {
      // Assignment was attempted but something went wrong
      if (!updatedLead) {
        console.warn(`⚠️ Assignment notification NOT created - lead update failed for lead ${id}`);
        console.warn(`   Attempted to assign to: ${newAssigneeId}, but updatedLead is null`);
      } else if (updatedLead.assigned_salesperson_id !== newAssigneeId) {
        console.warn(`⚠️ Assignment notification NOT created - assignment mismatch for lead ${id}`);
        console.warn(`   Attempted to assign to: ${newAssigneeId}`);
        console.warn(`   But lead has assigned_salesperson_id: ${updatedLead.assigned_salesperson_id}`);
      }
    }

    // Ensure we have a lead to return
    if (!updatedLead) {
      // Final check: is the lead in in-memory storage?
      const inMemoryLead = receivedLeads.find(l => l.id === id);
      if (inMemoryLead) {
        console.log(`⚠️ Using in-memory lead ${id} as fallback (Supabase update failed or lead not in Supabase)`);
        // Convert in-memory lead to database format
        updatedLead = {
          id: inMemoryLead.id,
          customer_name: inMemoryLead.customerName,
          mobile: inMemoryLead.mobile,
          email: inMemoryLead.email,
          status: inMemoryLead.status,
          assigned_salesperson_id: inMemoryLead.assignedSalespersonId,
          lead_date: inMemoryLead.leadDate,
          last_activity_date: inMemoryLead.lastActivityDate,
          month: inMemoryLead.month,
          mode_of_enquiry: inMemoryLead.modeOfEnquiry,
          occupation: inMemoryLead.occupation,
          interested_project: inMemoryLead.interestedProject,
          interested_unit: inMemoryLead.interestedUnit,
          temperature: inMemoryLead.temperature,
          visit_status: inMemoryLead.visitStatus,
          visit_date: inMemoryLead.visitDate,
          next_follow_up_date: inMemoryLead.nextFollowUpDate,
          last_remark: inMemoryLead.lastRemark,
          booking_status: inMemoryLead.bookingStatus,
          is_read: inMemoryLead.isRead,
          missed_visits_count: inMemoryLead.missedVisitsCount,
          labels: inMemoryLead.labels,
          budget: inMemoryLead.budget,
          purpose: inMemoryLead.purpose,
          city: inMemoryLead.city,
          platform: inMemoryLead.platform,
          source_website: inMemoryLead.source
        };
      } else {
        console.error(`❌ Lead ${id} not found in Supabase or in-memory storage`);
        return res.status(404).json({
          success: false,
          error: 'Lead not found',
          message: `Lead with id ${id} could not be found or updated. The lead may not exist in the database.`
        });
      }
    }

    const row = updatedLead;

    // --- NOTIFICATION LOGIC FOR STATUS CHANGE / PROGRESS ---
    // Notify Admin if status changed (and it wasn't just a new assignment which is handled above)
    // We check if payload has 'status' which implies an intentional status update
    if (supabase && payload.status && row && row.status !== 'New Lead') {
      // Avoid notifying for initial status if identical (optimized frontend might send it)
      // For now, simpler: if status is being updated, notify admin.
      // Refinement: Ideally we'd compare with previous status, but we updated row already.
      // However, 'row' is the UPDATED lead.

      try {
        // Construct a message based on the update
        const statusMsg = `Lead status updated to "${row.status}" for ${row.customer_name || 'Customer'}${payload.updatedByName ? ` by ${payload.updatedByName}` : ''}`;

        const notificationId = `notif-prog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const notification = {
          id: notificationId,
          type: 'lead_progress',
          message: statusMsg,
          lead_id: id,
          lead_data: {
            customerName: row.customer_name,
            status: row.status,
            previousStatus: 'Unknown' // We didn't track previous status here easily without another query
          },
          target_role: 'Admin',
          target_user_id: null,
          created_at: new Date().toISOString(),
          is_read: false
        };

        // Don't duplicate "Assignment" notifications if the status change was part of an assignment
        // But usually assignment changes owner, this changes status.

        const { error: progNotifError } = await supabase
          .from('notifications')
          .insert(notification);

        if (!progNotifError) {
          console.log(`🔔 Admin notification created for lead progress: ${statusMsg}`);
        }
      } catch (e) {
        console.error('Error creating progress notification:', e);
      }
    }
    // -------------------------------------------------------

    const rawStatus = row.status || 'New Lead';
    const normalizedStatus = rawStatus === 'New' ? 'New Lead' : rawStatus;

    const formattedLead = formatLeadResponse(row);

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

// Get or create users endpoint
app.get('/api/v1/users', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching users from Supabase:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch users',
          message: error.message
        });
      }

      return res.json({
        success: true,
        users: (data || []).map(user => ({
          id: user.id,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatar_url || ''
        }))
      });
    }

    // Fallback: return empty array if no Supabase
    res.json({
      success: true,
      users: []
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

// Sync users endpoint - creates/updates users in Supabase
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

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
        message: 'Cannot sync users without Supabase connection'
      });
    }

    const syncedUsers = [];
    const errors = [];

    for (const user of users) {
      try {
        // Check if user exists by name and role (since local IDs won't match UUIDs)
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, name, role')
          .eq('name', user.name)
          .eq('role', user.role)
          .single();

        if (existingUser) {
          // Update existing user (try to add local_id if column exists)
          const updateData = {
            name: user.name,
            role: user.role,
            avatar_url: user.avatarUrl || null
          };

          // Try to update local_id if the column exists (won't fail if it doesn't)
          try {
            const { data: updated, error: updateError } = await supabase
              .from('users')
              .update(updateData)
              .eq('id', existingUser.id)
              .select()
              .single();

            if (updateError) throw updateError;

            // Try to set local_id directly (simpler than RPC)
            try {
              await supabase
                .from('users')
                .update({ local_id: user.id })
                .eq('id', existingUser.id);
            } catch (localIdErr) {
              // Ignore if column doesn't exist
            }

            syncedUsers.push({ localId: user.id, supabaseId: existingUser.id, user: updated || existingUser });
          } catch (err) {
            // If update fails, try without local_id
            const { data: updated, error: updateError } = await supabase
              .from('users')
              .update({
                name: user.name,
                role: user.role,
                avatar_url: user.avatarUrl || null
              })
              .eq('id', existingUser.id)
              .select()
              .single();

            if (updateError) throw updateError;
            syncedUsers.push({ localId: user.id, supabaseId: existingUser.id, user: updated });
          }
        } else {
          // Create new user with UUID
          // Try to include local_id if column exists
          const insertData = {
            name: user.name,
            role: user.role,
            avatar_url: user.avatarUrl || null
          };

          // Try to add local_id (will be ignored if column doesn't exist)
          // We'll use a raw SQL query to handle this gracefully
          try {
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert(insertData)
              .select()
              .single();

            if (createError) throw createError;

            // Try to update local_id separately using RPC or direct update
            // If local_id column exists, update it
            try {
              await supabase
                .from('users')
                .update({ local_id: user.id })
                .eq('id', newUser.id);
            } catch (localIdError) {
              // local_id column doesn't exist, that's ok
              console.log(`   Note: local_id column not found for user ${user.name}, skipping local_id mapping`);
            }

            syncedUsers.push({ localId: user.id, supabaseId: newUser.id, user: newUser });
          } catch (err) {
            throw err;
          }
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

// Helper function to get or create user in Supabase by local ID
async function getOrCreateUserInSupabase(localUserId) {
  if (!supabase) return null;

  // First, try to find by a custom mapping (if we add a local_id column)
  // For now, we'll need to map by name - but this is not ideal
  // Better approach: store local_id mapping or sync users first

  // For immediate fix: return null and let the validation error show
  // The proper fix is to sync users first
  return null;
}

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


// --- ATTENDANCE ENDPOINTS ---

// Get attendance status for a user (Today)
app.get('/api/v1/attendance/:userId', async (req, res) => {
  const { userId } = req.params;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  console.log(`📥 GET /api/v1/attendance/${userId} for date ${today}`);

  try {
    if (!supabase) {
      // In-memory fallback (mock)
      return res.json({
        success: true,
        attendance: { status: 'NotClockedIn', clockInTime: null },
        summary: { hoursToday: 0, daysThisMonth: 0 }
      });
    }

    // 1. Resolve user ID if local ID
    let dbUserId = userId;
    if (userId.startsWith('user-') || userId.startsWith('admin-')) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('local_id', userId)
        .maybeSingle();
      if (user) dbUserId = user.id;
    }

    // 2. Fetch record
    const { data: todayRecord, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', dbUserId)
      .eq('date', today)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Attendance fetch error:', error);
      throw error;
    }

    // 3. Fetch monthly count
    const { count: monthlyCount, error: countError } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', dbUserId)
      .gte('date', startOfMonth)
      .lte('date', today);

    if (countError) {
      console.error('❌ Monthly count error:', countError);
    }

    // 4. Calculate stats
    let status = 'NotClockedIn';
    let clockInTime = null;
    let clockOutTime = null;
    let location = null;
    let hoursToday = 0; // in milliseconds

    if (todayRecord) {
      status = todayRecord.clock_out ? 'ClockedOut' : 'ClockedIn';
      clockInTime = todayRecord.clock_in;
      clockOutTime = todayRecord.clock_out;
      location = todayRecord.location_in;

      // Calculate duration
      const start = new Date(todayRecord.clock_in).getTime();
      const end = todayRecord.clock_out ? new Date(todayRecord.clock_out).getTime() : now.getTime();
      hoursToday = end - start;
    }

    return res.json({
      success: true,
      attendance: {
        id: todayRecord?.id,
        status,
        clockInTime,
        clockOutTime,
        location
      },
      summary: {
        hoursToday,
        daysThisMonth: monthlyCount || 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching attendance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
});

// Clock In
app.post('/api/v1/attendance/clock-in', async (req, res) => {
  const { userId, location, timestamp } = req.body;
  const today = new Date().toISOString().split('T')[0];

  console.log(`📥 POST /api/v1/attendance/clock-in for ${userId}`);

  try {
    if (!supabase) {
      return res.json({ success: true, message: 'Clocked in (Memory)' });
    }

    // 1. Resolve ID
    let dbUserId = userId;
    if (userId.startsWith('user-') || userId.startsWith('admin-')) {
      const { data: user } = await supabase.from('users').select('id').eq('local_id', userId).maybeSingle();
      if (user) dbUserId = user.id;
    }

    // 2. Upsert clock in
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        user_id: dbUserId,
        date: today,
        clock_in: timestamp || new Date().toISOString(),
        location_in: location,
        status: 'Present'
      }, { onConflict: 'user_id, date' })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Clocked in successfully:', data);
    res.json({ success: true, data });

  } catch (error) {
    console.error('❌ Clock-in failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN: Get dashboard summary (All users status today)
app.get('/api/v1/attendance/dashboard', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  console.log(`📥 GET /api/v1/attendance/dashboard for ${today}`);

  try {
    if (!supabase) {
      console.warn('⚠️ Dashboard requested but Supabase is NOT connected.');
      return res.status(503).json({
        success: false,
        error: 'Database not connected. Please restart the backend.'
      });
    }

    // 1. Get All Users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, role, local_id');

    if (userError) throw userError;

    // 2. Get Today's Attendance for All
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);

    if (attError) throw attError;

    // 3. Merge Data
    const mappedAttendanceIds = new Set();

    const dashboardData = users.map(user => {
      // Find matching attendance record
      // Check both UUID (standard) and Local ID (legacy/fallback)
      const record = attendance.find(a => a.user_id === user.id || a.user_id === user.local_id);

      let status = 'Offline';
      let clockIn = null;
      let duration = '0h 0m';
      let location = null;

      if (record) {
        mappedAttendanceIds.add(record.id);
        if (record.clock_out) status = 'Clocked Out';
        else status = 'Online';

        clockIn = record.clock_in;
        location = record.location_in;

        // Calculate duration so far
        const start = new Date(record.clock_in).getTime();
        const end = record.clock_out ? new Date(record.clock_out).getTime() : new Date().getTime();
        const diffMs = end - start;
        const hrs = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        duration = `${hrs}h ${mins}m`;
      }

      return {
        id: user.id || user.local_id,
        name: user.name,
        role: user.role,
        status,
        clockIn,
        location,
        duration,
        userId: user.id
      };
    });

    // 4. Add Orphans (Attendance records with no matching User ID)
    const orphans = attendance.filter(a => !mappedAttendanceIds.has(a.id));
    orphans.forEach(record => {
      const start = new Date(record.clock_in).getTime();
      const end = record.clock_out ? new Date(record.clock_out).getTime() : new Date().getTime();
      const diffMs = end - start;
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);

      dashboardData.push({
        id: record.user_id,
        name: `Unknown User (${record.user_id.substring(0, 6)}...)`,
        role: 'Guest',
        status: record.clock_out ? 'Clocked Out' : 'Online',
        clockIn: record.clock_in,
        location: record.location_in,
        duration: `${hrs}h ${mins}m`,
        userId: record.user_id
      });
    });

    res.json({ success: true, data: dashboardData });

  } catch (error) {
    console.error('❌ Dashboard Error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
});

// ADMIN: Export Attendance CSV
app.get('/api/v1/attendance/export', async (req, res) => {
  const { month } = req.query; // Format: YYYY-MM
  console.log(`📥 Exporting attendance for ${month}`);

  try {
    if (!supabase) return res.status(500).json({ error: 'No DB' });

    // Fetch all attendance for that month joined with users
    const start = `${month}-01`;
    const end = `${month}-31`; // Loose end date

    const { data, error } = await supabase
      .from('attendance')
      .select(`
                *,
                users (name, role)
            `)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (error) throw error;

    // Convert to CSV
    // Header
    const header = ['Date', 'Name', 'Role', 'Status', 'Clock In', 'Clock Out', 'Location', 'Duration (Mins)'];
    const csvRows = [header.join(',')];

    data.forEach(row => {
      const date = row.date;
      const name = row.users?.name || 'Unknown';
      const role = row.users?.role || '-';
      const status = row.status || 'Present';
      const inTime = row.clock_in ? new Date(row.clock_in).toLocaleTimeString() : '-';
      const outTime = row.clock_out ? new Date(row.clock_out).toLocaleTimeString() : '-';
      const loc = row.location_in ? row.location_in.replace(',', ' ') : '-'; // escape commas

      // Duration
      let dur = 0;
      if (row.clock_in && row.clock_out) {
        dur = Math.round((new Date(row.clock_out).getTime() - new Date(row.clock_in).getTime()) / 60000);
      }

      csvRows.push([date, name, role, status, inTime, outTime, loc, dur].join(','));
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`attendance-${month}.csv`);
    return res.send(csvRows.join('\n'));

  } catch (e) {
    console.error('Export failed', e);
    res.status(500).json({ error: e.message });
  }
});

