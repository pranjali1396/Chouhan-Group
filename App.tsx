
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import BottomNavBar from './components/BottomNavBar';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import { db } from './services/database'; // Use new DB service
import { api } from './services/api'; // API service for backend
import { Lead, User, Activity, SalesTarget, Task, LeadStatus, ActivityType, ModeOfEnquiry } from './types';
import { Project, Unit } from './data/inventoryData';

// Lazy load components for better initial load performance
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const LeadsPage = React.lazy(() => import('./components/LeadsPage'));
const CalendarPage = React.lazy(() => import('./components/CalendarPage'));
const AttendancePage = React.lazy(() => import('./components/AttendancePage'));
const ReportsPage = React.lazy(() => import('./components/ReportsPage'));
const TasksPage = React.lazy(() => import('./components/TasksPage'));
const SettingsPage = React.lazy(() => import('./components/SettingsPage'));
const InventoryPage = React.lazy(() => import('./components/InventoryPage'));

export interface NewLeadData {
  customerName: string;
  mobile: string;
  email: string;
  city: string;
  platform: string;
  interestedProject: string;
  interestedUnit: string;
  investmentTimeline: string;
  remarks: string;
  assignedSalespersonId: string;
  budget?: string;
  purpose?: 'Investment' | 'Self Use';
}

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col justify-center items-center h-full min-h-[50vh] bg-slate-50/50">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-primary shadow-xl shadow-indigo-100"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
      </div>
    </div>
    <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing CRM...</p>
  </div>
);

const NotificationToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  const isNewLead = message.includes('New Lead');
  const isAssignment = message.includes('Lead Assigned');

  return (
    <div className="fixed top-8 right-8 z-[100] max-w-sm w-full glass shadow-2xl rounded-2xl border border-white/50 animate-fade-in pointer-events-auto">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl shadow-sm ${isNewLead ? 'bg-emerald-50 text-emerald-600' : isAssignment ? 'bg-indigo-50 text-indigo-600' : 'bg-primary/10 text-primary'}`}>
            {isNewLead ? (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            ) : isAssignment ? (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
              {isNewLead ? 'New Opportunity' : isAssignment ? 'Lead Assigned' : 'Notification'}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div className="h-1 bg-slate-100 rounded-b-2xl overflow-hidden">
        <div className="h-full bg-primary/30 animate-pulse" style={{ width: '40%' }}></div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('Dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [salesTargets, setSalesTargets] = useState<SalesTarget[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inventory, setInventory] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [targetLeadId, setTargetLeadId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setSearchTerm('');

    try {
      // 0. Load from local DB IMMEDIATELY for instant UI response
      try {
        const initialLocalData = await db.getAllData();
        if (initialLocalData.users && initialLocalData.users.length > 0) {
          setUsers(initialLocalData.users);
        }
        if (initialLocalData.leads && initialLocalData.leads.length > 0) {
          setLeads(initialLocalData.leads);
        }
        if (initialLocalData.activities) setActivities(initialLocalData.activities);
        if (initialLocalData.tasks) setTasks(initialLocalData.tasks);
        if (initialLocalData.salesTargets) setSalesTargets(initialLocalData.salesTargets);
        if (initialLocalData.inventory) setInventory(initialLocalData.inventory);
      } catch (e) {
        console.warn('Initial local load failed:', e);
      }

      try {
        // 1. Load users from backend (to sync/update)
        try {
          const backendUsers = await api.getUsers();

          if (backendUsers && backendUsers.length > 0) {
            console.log('✅ Loaded users from Supabase:', backendUsers.length);
            setUsers(backendUsers);

            // Sync with local DB in background
            const syncLocalUsers = async () => {
              try {
                const localData = await db.getAllData();
                const userIdMap = new Map<string, string>();
                let changed = false;

                for (const user of backendUsers) {
                  const existingUser = localData.users.find(u => u.id === user.id || u.name === user.name);
                  if (!existingUser) {
                    localData.users.push(user);
                    changed = true;
                  } else {
                    if (existingUser.id !== user.id) {
                      userIdMap.set(existingUser.id, user.id);
                      changed = true;
                    }
                    const index = localData.users.indexOf(existingUser);
                    localData.users[index] = user;
                  }
                }
                if (userIdMap.size > 0) await db.updateUserIds(userIdMap);
                if (changed) await db.saveAllData(localData);
              } catch (e) {
                console.error('Local sync failed', e);
              }
            };
            syncLocalUsers();
          } else {
            // Backend is empty! Sync UP from local
            const localData = await db.getAllData();
            if (localData.users && localData.users.length > 0) {
              console.log('📤 Backend empty. Syncing local users up...');
              await api.syncUsers(localData.users);
              // Re-fetch to get the new IDs
              const newUsers = await api.getUsers();
              if (newUsers.length > 0) setUsers(newUsers);
              else setUsers(localData.users);
            } else {
              setUsers([]);
            }
          }
        } catch (err) {
          console.warn('Backend user load failed, using local:', err);
          const localData = await db.getAllData();
          setUsers(localData.users || []);
        }
      } catch (e) {
        console.error('Critical user load error', e);
      }

      // 2. Load leads and other data
      try {
        const backendLeads = await api.getLeads();
        console.log('📥 Fetched leads from backend:', backendLeads?.length);

        if (backendLeads !== null && backendLeads !== undefined) {
          const localData = await db.getAllData();
          const processedLeads: Lead[] = [];

          for (const backendLead of backendLeads) {
            const existingLocalLead = localData.leads.find(l =>
              l.id === backendLead.id || l.mobile === backendLead.mobile
            );

            const leadToSave: Lead = {
              ...backendLead,
              assignedSalespersonId: backendLead.assignedSalespersonId ?? null,
              status: backendLead.status || LeadStatus.New,
              leadDate: backendLead.leadDate || new Date().toISOString(),
              lastActivityDate: backendLead.lastActivityDate || new Date().toISOString(),
              month: backendLead.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
              modeOfEnquiry: backendLead.modeOfEnquiry || ModeOfEnquiry.Website,
              visitStatus: backendLead.visitStatus || 'No',
              lastRemark: backendLead.lastRemark || backendLead.remarks || '',
              isRead: backendLead.isRead || false,
              missedVisitsCount: backendLead.missedVisitsCount || 0,
              source: backendLead.source || 'website'
            };

            processedLeads.push(leadToSave);
            if (existingLocalLead) await db.updateLead(leadToSave);
            else await db.addLead(leadToSave);
          }

          const backendLeadIds = new Set(processedLeads.map(l => l.id));
          const backendLeadMobiles = new Set(processedLeads.map(l => l.mobile));
          const localOnlyLeads = localData.leads.filter(
            lead => !backendLeadIds.has(lead.id) && !backendLeadMobiles.has(lead.mobile)
          );

          setLeads([...processedLeads, ...localOnlyLeads]);
        } else {
          const data = await db.getAllData();
          setLeads(data.leads || []);
        }
      } catch (apiError) {
        console.warn('⚠️ Backend API not available for leads, using local database:', apiError);
        const data = await db.getAllData();
        setLeads(data.leads || []);
      }

      // 3. Load other data from local database
      const data = await db.getAllData();
      setActivities(data.activities || []);
      setSalesTargets(data.salesTargets || []);
      setTasks(data.tasks || []);
      setInventory(data.inventory || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh leads every 30 seconds to catch new webhook leads
  useEffect(() => {
    if (!currentUser) return;

    const refreshLeads = async () => {
      try {
        const backendLeads = await api.getLeads();
        if (backendLeads !== null && backendLeads !== undefined) {
          const localData = await db.getAllData();
          const backendLeadIds = new Set(backendLeads.map(l => l.id));
          const backendLeadMobiles = new Set(backendLeads.map(l => l.mobile));

          // Save new leads to local DB AND update existing ones
          for (const backendLead of backendLeads) {
            const localLeadIds = new Set(localData.leads.map(l => l.id));
            const localLeadMobiles = new Set(localData.leads.map(l => l.mobile));
            const existingLocalLead = localData.leads.find(l =>
              l.id === backendLead.id || l.mobile === backendLead.mobile
            );

            // IMPORTANT: Preserve null values for assignedSalespersonId (don't convert to '')
            const leadToSave: Lead = {
              ...backendLead,
              assignedSalespersonId: backendLead.assignedSalespersonId ?? null,
              status: backendLead.status || LeadStatus.New,
              leadDate: backendLead.leadDate || new Date().toISOString(),
              lastActivityDate: backendLead.lastActivityDate || new Date().toISOString(),
              month: backendLead.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
              modeOfEnquiry: backendLead.modeOfEnquiry || ModeOfEnquiry.Website,
              visitStatus: backendLead.visitStatus || 'No',
              lastRemark: backendLead.lastRemark || backendLead.remarks || '',
              isRead: backendLead.isRead || false,
              missedVisitsCount: backendLead.missedVisitsCount || 0,
              source: backendLead.source || 'website'
            };

            if (existingLocalLead) {
              await db.updateLead(leadToSave);
            } else {
              await db.addLead(leadToSave);
            }
          }

          // Update leads state
          const localOnlyLeads = localData.leads.filter(
            lead => !backendLeadIds.has(lead.id) && !backendLeadMobiles.has(lead.mobile)
          );
          const allLeads = [...backendLeads, ...localOnlyLeads];
          setLeads(allLeads);
        }
      } catch (error) {
        // Silently fail - don't spam console on refresh errors
        console.debug('Auto-refresh leads error:', error);
      }
    };

    // Refresh immediately, then every 30 seconds
    refreshLeads();
    const intervalId = setInterval(refreshLeads, 30000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  // Notification polling for new leads and assignments
  useEffect(() => {
    if (!currentUser) return;

    let lastChecked = new Date().toISOString();

    const checkNotifications = async () => {
      try {
        const newNotifications = await api.getNotifications(
          currentUser.id,
          currentUser.role,
          lastChecked
        );

        if (newNotifications.length > 0) {
          // Show first notification as popup
          const firstNotif = newNotifications[0];
          let notificationMessage = '';

          if (firstNotif.type === 'new_lead') {
            notificationMessage = `🎯 New Lead: ${firstNotif.leadData?.customerName || 'Unknown'}`;
          } else if (firstNotif.type === 'lead_assigned') {
            // Find the assignee name from our users list
            const assignee = users.find(u => u.id === firstNotif.targetUserId);
            const assigneeName = assignee ? assignee.name : 'someone';
            const customerName = firstNotif.leadData?.customerName || 'Unknown';

            // If the current user is the one assigned, use "You"
            if (currentUser && firstNotif.targetUserId === currentUser.id) {
              notificationMessage = `📋 Lead Assigned to You: ${customerName}`;
            } else {
              notificationMessage = `📋 Lead Assigned to ${assigneeName}: ${customerName}`;
            }
          } else {
            notificationMessage = firstNotif.message || 'New notification';
          }

          setNotification(notificationMessage);

          // Mark as read
          try {
            await api.markNotificationRead(firstNotif.id);
          } catch (err) {
            console.error('Error marking notification as read:', err);
          }

          // Auto-dismiss after 5 seconds
          setTimeout(() => setNotification(null), 5000);

          // Update lastChecked to current time
          lastChecked = new Date().toISOString();
        }
      } catch (error) {
        // Silently fail - backend might not be available
        console.debug('Notification check failed (this is ok if backend is not available):', error);
      }
    };

    // Check immediately, then every 5 seconds
    checkNotifications();
    const intervalId = setInterval(checkNotifications, 5000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  // Reminder Polling Logic
  useEffect(() => {
    if (!currentUser) return;

    const checkReminders = async () => {
      const now = new Date();
      // Filter tasks that have a reminder date, haven't fired yet, and the reminder date is passed
      const dueTasks = tasks.filter(t => !t.isCompleted && !t.hasReminded && t.reminderDate && new Date(t.reminderDate) <= now);

      if (dueTasks.length > 0) {
        const task = dueTasks[0];
        // Notify only if task is assigned to current user or user is admin
        if (task.assignedToId === currentUser.id || currentUser.role === 'Admin') {
          setNotification(`Task Due: ${task.title}`);
          const updatedTasks = await db.markTaskReminded(task.id);
          setTasks(updatedTasks);

          // Auto-dismiss toast after 5 seconds
          setTimeout(() => setNotification(null), 5000);
        }
      }
    };

    const intervalId = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [tasks, currentUser]);

  const handleUpdateLead = useCallback(async (updatedLead: Lead) => {
    if (!currentUser) return;

    // Log assignment changes for debugging
    const originalLead = leads.find(l => l.id === updatedLead.id);
    if (originalLead && originalLead.assignedSalespersonId !== updatedLead.assignedSalespersonId) {
      console.log('🔄 Lead assignment changed:', {
        leadId: updatedLead.id,
        customerName: updatedLead.customerName,
        from: originalLead.assignedSalespersonId,
        to: updatedLead.assignedSalespersonId,
        newAssignee: users.find(u => u.id === updatedLead.assignedSalespersonId)?.name
      });
    }

    // Store original lead for potential rollback
    const originalLeadForRollback = originalLead ? { ...originalLead } : null;

    // Optimistic UI Update
    setLeads(prevLeads =>
      prevLeads.map(l =>
        l.id === updatedLead.id
          ? { ...updatedLead, lastActivityDate: new Date().toISOString(), isRead: true }
          : l
      )
    );

    // Update local database (for existing flows)
    await db.updateLead(updatedLead);

    // Also update Supabase via API (if this lead exists there)
    try {
      // Send only the fields that need updating to backend
      const updatePayload: any = {
        status: updatedLead.status,
        nextFollowUpDate: updatedLead.nextFollowUpDate,
        temperature: updatedLead.temperature,
        visitStatus: updatedLead.visitStatus,
        visitDate: updatedLead.visitDate,
        lastRemark: updatedLead.lastRemark,
        bookingStatus: updatedLead.bookingStatus,
        isRead: updatedLead.isRead,
        updatedByName: currentUser?.name // Pass current user name for notifications
      };

      // IMPORTANT: Always include assignedSalespersonId (even if null for unassigned)
      // This ensures assignments and unassignments are properly saved
      updatePayload.assignedSalespersonId = updatedLead.assignedSalespersonId ?? null;

      console.log('📤 Sending update to backend:', {
        leadId: updatedLead.id,
        customerName: updatedLead.customerName,
        assignedSalespersonId: updatePayload.assignedSalespersonId,
        updatePayloadKeys: Object.keys(updatePayload)
      });

      const backendResponse = await api.updateLead(updatedLead.id, updatePayload);
      console.log('✅ Lead updated in backend:', updatedLead.id, 'assigned to:', updatedLead.assignedSalespersonId);

      // CRITICAL: Use the response from backend to update state (it has the actual saved data from Supabase)
      if (backendResponse && backendResponse.lead) {
        const backendLead = backendResponse.lead;
        console.log('📥 Backend response lead:', {
          id: backendLead.id,
          customerName: backendLead.customerName,
          assignedSalespersonId: backendLead.assignedSalespersonId,
          assignedIdType: typeof backendLead.assignedSalespersonId
        });

        // Update state with the backend response (source of truth)
        setLeads(prevLeads =>
          prevLeads.map(l =>
            l.id === backendLead.id
              ? { ...backendLead, lastActivityDate: new Date().toISOString() }
              : l
          )
        );

        // Update local DB with backend response
        await db.updateLead(backendLead);

        // Update the updatedLead variable for activity logging
        updatedLead = backendLead;
      } else {
        // If no response, refresh from backend
        console.log('⚠️ No response from backend, refreshing leads...');
        try {
          const backendLeads = await api.getLeads();
          if (backendLeads) {
            const updatedLeadFromBackend = backendLeads.find(l => l.id === updatedLead.id);
            if (updatedLeadFromBackend) {
              console.log('📥 Refreshed lead from backend:', {
                id: updatedLeadFromBackend.id,
                assignedSalespersonId: updatedLeadFromBackend.assignedSalespersonId
              });
              setLeads(prevLeads =>
                prevLeads.map(l =>
                  l.id === updatedLeadFromBackend.id ? updatedLeadFromBackend : l
                )
              );
              await db.updateLead(updatedLeadFromBackend);
              updatedLead = updatedLeadFromBackend;
            }
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh lead from backend:', refreshError);
        }
      }
    } catch (e: any) {
      console.error('❌ Failed to update lead in Supabase, local DB still updated:', e);
      console.error('   Error details:', {
        message: e?.message,
        status: e?.status,
        statusText: e?.statusText,
        response: e?.response
      });
      // Extract error message from API response
      const errorMessage = e?.response?.message || e?.response?.error || e?.message || 'Unknown error';

      // Check if error is due to local user ID not being synced or users table missing
      const isLocalIdError = errorMessage.includes('local ID') || errorMessage.includes('hasn\'t been synced');
      const isUsersTableMissing = errorMessage.includes('Could not find the table') || errorMessage.includes('users');

      if ((isLocalIdError || isUsersTableMissing) && updatedLead.assignedSalespersonId) {
        // Check if it's a local ID
        const isLocalId = /^(user-|admin-)\d+$/.test(updatedLead.assignedSalespersonId);

        if (isLocalId || isUsersTableMissing) {
          setNotification(`❌ Cannot assign lead: The users table doesn't exist in Supabase. Please create it first by running the SQL from backend/migrations/create_users_table.sql in your Supabase SQL Editor, then refresh the app.`);
          setTimeout(() => setNotification(null), 10000);
          return;
        }

        // Try to sync users automatically
        console.log('🔄 Attempting to sync users automatically...');
        try {
          const localData = await db.getAllData();
          if (localData.users && localData.users.length > 0) {
            const syncResult = await api.syncUsers(localData.users);
            console.log('✅ Users synced:', syncResult.synced);

            // Reload users from Supabase
            const syncedUsers = await api.getUsers();
            if (syncedUsers && syncedUsers.length > 0) {
              setUsers(syncedUsers);

              // Create mapping and update all user ID references
              const userIdMap = new Map<string, string>();
              for (const supabaseUser of syncedUsers) {
                const localUser = localData.users.find(u => u.name === supabaseUser.name);
                if (localUser && localUser.id !== supabaseUser.id) {
                  userIdMap.set(localUser.id, supabaseUser.id);
                }
              }

              if (userIdMap.size > 0) {
                await db.updateUserIds(userIdMap);
                // Reload data after ID migration
                const refreshedData = await db.getAllData();
                localData.users = refreshedData.users;
                localData.leads = refreshedData.leads;
              }

              // Find the Supabase UUID for the user we tried to assign
              const localUserId = updatedLead.assignedSalespersonId;
              const localUser = localData.users.find(u => u.id === localUserId);
              const supabaseUser = syncedUsers.find(u => u.name === localUser?.name) ||
                syncedUsers.find(u => userIdMap.get(localUserId) === u.id);

              if (supabaseUser) {
                console.log(`✅ Found Supabase UUID for ${localUser?.name || 'user'}: ${supabaseUser.id}`);
                // Retry the assignment with Supabase UUID
                const retryLead = {
                  ...updatedLead,
                  assignedSalespersonId: supabaseUser.id
                };

                try {
                  const retryPayload: any = {
                    status: retryLead.status,
                    nextFollowUpDate: retryLead.nextFollowUpDate,
                    temperature: retryLead.temperature,
                    visitStatus: retryLead.visitStatus,
                    visitDate: retryLead.visitDate,
                    lastRemark: retryLead.lastRemark,
                    bookingStatus: retryLead.bookingStatus,
                    isRead: retryLead.isRead,
                    assignedSalespersonId: supabaseUser.id
                  };

                  const retryResponse = await api.updateLead(retryLead.id, retryPayload);
                  if (retryResponse && retryResponse.lead) {
                    const backendLead = retryResponse.lead;
                    setLeads(prevLeads =>
                      prevLeads.map(l =>
                        l.id === backendLead.id
                          ? { ...backendLead, lastActivityDate: new Date().toISOString() }
                          : l
                      )
                    );
                    await db.updateLead(backendLead);
                    setNotification(`✅ Lead assigned successfully to ${supabaseUser.name}`);
                    setTimeout(() => setNotification(null), 5000);
                    return; // Success, exit early
                  }
                } catch (retryError: any) {
                  console.error('❌ Retry failed:', retryError);
                }
              }
            }
          }
        } catch (syncError: any) {
          console.error('❌ Failed to sync users:', syncError);
          if (syncError.message?.includes('Could not find the table')) {
            setNotification(`❌ Users table missing in Supabase. Please create it by running the SQL from backend/migrations/create_users_table.sql in your Supabase SQL Editor.`);
            setTimeout(() => setNotification(null), 10000);
          }
        }
      }

      // Revert optimistic update on error
      // Revert optimistic update on error - DISABLED to allow local-only mode
      /* 
      if (originalLeadForRollback) {
        setLeads(prevLeads =>
          prevLeads.map(l =>
            l.id === updatedLead.id ? originalLeadForRollback : l
          )
        );
  
        // Revert local DB update
        await db.updateLead(originalLeadForRollback);
      }
      */

      // Show error to user with more details
      // Show error to user with more details ONLY if it's a critical failure
      // For now, if we are in dev/demo mode, we might want to suppress this if local update worked
      console.error(`Backend update failed: ${errorMessage}`);

      // If we are falling back to local DB, don't show error to user as "Failed"
      // unless it's a critical data loss scenario.
      // setNotification(`❌ Failed to assign lead: ${errorMessage}`);
      // setTimeout(() => setNotification(null),      }

      // Check if error is "Lead not found" (404) - likely created locally but not synced
      const isLeadNotFound = /(Lead not found|lead with id .* could not be found|status code 404)/i.test(errorMessage) || e?.status === 404;
      if (isLeadNotFound && updatedLead.id.startsWith('lead-')) {
        console.log('🔄 Lead not found in backend (likely local-only). Attempting to sync create...');
        try {
          // Prepare lead data for creation
          const leadToCreate: any = {
            ...updatedLead,
            status: updatedLead.status, // Ensure we send the *new* status 
            assignedSalespersonId: updatedLead.assignedSalespersonId,
            source: 'CRM (Sync Reply)'
          };

          // Remove ID so backend generates a new one (or we keep local one if backend supports it - but our backend generates UUIDs for Supabase)
          delete leadToCreate.id;

          const createdLead = await api.createLead(leadToCreate);
          if (createdLead) {
            console.log(`✅ Lead synced to backend! Replacing local ID ${updatedLead.id} with ${createdLead.id}`);

            // 1. Delete old local lead
            await db.deleteLead(updatedLead.id);

            // 2. Add new synced lead
            await db.addLead(createdLead);

            // 3. CRITICAL: Force a full refresh from backend to sync everything
            try {
              const backendLeads = await api.getLeads();
              if (backendLeads && backendLeads.length > 0) {
                console.log(`🔄 Refreshed ${backendLeads.length} leads from backend after sync`);
                setLeads(backendLeads);

                // Also update local DB with all backend leads
                for (const lead of backendLeads) {
                  await db.updateLead(lead);
                }
              }
            } catch (refreshErr) {
              console.error('⚠️ Failed to refresh leads after sync:', refreshErr);
              // Fallback: just update the one lead
              setLeads(prev => prev.map(l => l.id === updatedLead.id ? createdLead : l));
            }

            setNotification(null); // Clear any previous error notification
            setNotification('✅ Lead synced successfully - page refreshed');
            setTimeout(() => setNotification(null), 3000);
            return; // Success!
          }
        } catch (createErr: any) {
          console.error('❌ Failed to sync-create lead:', createErr);
          // Show this specific error to user so we know why recovery failed
          let createErrMsg = createErr?.message || createErr?.toString() || 'Unknown error';
          if (createErrMsg.includes('API Error:')) {
            createErrMsg += ' (Server returned no details - check backend terminal)';
          }
          setNotification(`⚠️ Recovery failed: ${createErrMsg}`);
          // Don't fall through to generic error - return here to let user see this specific one
          setTimeout(() => setNotification(null), 8000);
          return;
        }
      }

      setNotification(`⚠️ Saved locally (Backend sync failed: ${errorMessage})`);
      setTimeout(() => setNotification(null), 5000);
    }

    // 1. Handle Reassignment
    if (originalLead && originalLead.assignedSalespersonId !== updatedLead.assignedSalespersonId) {
      const newAssignee = users.find(u => u.id === updatedLead.assignedSalespersonId);
      const assignmentMessage = updatedLead.assignedSalespersonId
        ? `Lead assigned to ${newAssignee?.name || 'an agent'}.`
        : `Lead unassigned.`;

      const activity: Activity = {
        id: `act-assign-${Date.now()}`,
        leadId: updatedLead.id,
        salespersonId: currentUser.id,
        type: ActivityType.Note, // Keep as Note, or use a custom 'Assignment' type if supported
        date: new Date().toISOString(),
        remarks: assignmentMessage,
        customerName: updatedLead.customerName
      };
      // Use the helper to add activity consistently
      handleAddActivity(updatedLead, activity.type, activity.remarks);
    }

    // 2. Handle Booking Logic (If bookedUnitId is present and new)
    if (updatedLead.status === LeadStatus.Booked && updatedLead.bookedUnitId) {
      if (!originalLead?.bookedUnitId || originalLead.bookedUnitId !== updatedLead.bookedUnitId) {
        await db.bookUnit(updatedLead.bookedUnitId);
        const updatedInventory = await db.getInventory();
        setInventory(updatedInventory);

        // Log booking activity
        const bookingActivity: Activity = {
          id: `act-book-${Date.now()}`,
          leadId: updatedLead.id,
          salespersonId: currentUser.id,
          type: ActivityType.Note,
          date: new Date().toISOString(),
          remarks: `Unit ${updatedLead.bookedUnitNumber} in ${updatedLead.bookedProject} has been BOOKED.`,
          customerName: updatedLead.customerName
        };
        await db.addActivity(bookingActivity);
        setActivities(prev => [bookingActivity, ...prev]);
      }
    }

  }, [currentUser, users, leads]);

  const handleDeleteActivity = useCallback(async (activityId: string) => {
    try {
      await db.deleteActivity(activityId);

      // Update React state
      setActivities(prevActivities => prevActivities.filter(a => a.id !== activityId));

      console.log('✅ Activity deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting activity:', error);
      alert('Failed to delete activity. Please try again.');
    }
  }, []);

  const handleDeleteLead = useCallback(async (leadId: string) => {
    if (!currentUser || currentUser.role !== 'Admin') {
      throw new Error('Only admins can delete leads');
    }

    try {
      // Try to delete from backend API (if available)
      try {
        await api.deleteLead(leadId, currentUser.role);
        console.log('✅ Lead deleted from backend');
      } catch (apiError) {
        // Backend might not be available - that's okay, continue with local deletion
        console.warn('⚠️ Backend API not available, deleting locally only:', apiError);
      }

      // Delete from local database (also removes associated activities)
      await db.deleteLead(leadId);

      // Update React state
      setLeads(prevLeads => prevLeads.filter(l => l.id !== leadId));
      setActivities(prevActivities => prevActivities.filter(a => a.leadId !== leadId));

      console.log('✅ Lead deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting lead:', error);
      throw error;
    }
  }, [currentUser]);

  const handleAddActivity = useCallback(async (lead: Lead, activityType: ActivityType, remarks: string, duration?: number) => {
    if (!currentUser) return;
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      leadId: lead.id,
      salespersonId: currentUser.id,
      type: activityType,
      date: new Date().toISOString(),
      remarks,
      duration,
      customerName: lead.customerName,
    };

    await db.addActivity(newActivity);

    setActivities(prev => [newActivity, ...prev]);
    setLeads(prevLeads => prevLeads.map(l => l.id === lead.id ? {
      ...l,
      lastActivityDate: newActivity.date,
      lastRemark: remarks
    } : l));
  }, [currentUser]);

  const handleAssignLead = useCallback(async (newLeadData: NewLeadData) => {
    // 1. Prepare lead data
    const tempId = `lead-${Date.now()}`;
    const leadData: any = {
      ...newLeadData,
      status: LeadStatus.New,
      leadDate: new Date().toISOString(),
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      lastActivityDate: new Date().toISOString(),
      modeOfEnquiry: (newLeadData.platform as ModeOfEnquiry) || ModeOfEnquiry.Reference,
      visitStatus: 'No',
      lastRemark: newLeadData.remarks || 'New lead created.',
      isRead: false,
      missedVisitsCount: 0,
      budget: newLeadData.budget,
      purpose: newLeadData.purpose,
      source: 'CRM',
      createdByName: currentUser?.name || 'Admin' // Pass creator name for notifications
    };

    let savedLead: Lead;

    // 2. Try to save to backend API
    try {
      console.log('📤 Creating lead in backend:', leadData.customerName);
      const backendLead = await api.createLead(leadData);
      if (backendLead) {
        console.log('✅ Lead created in backend with ID:', backendLead.id);
        savedLead = backendLead;
      } else {
        throw new Error('No lead returned from API');
      }
    } catch (error) {
      console.warn('⚠️ Failed to save lead to backend, saving locally only:', error);
      savedLead = {
        ...leadData,
        id: tempId
      };
    }

    // 3. Save to local DB and state
    await db.addLead(savedLead);
    setLeads(prev => [savedLead, ...prev]);

    // 4. Create local activity log
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      leadId: savedLead.id,
      salespersonId: currentUser?.id || '',
      type: ActivityType.Note,
      date: new Date().toISOString(),
      remarks: `Lead created and assigned to ${users.find(u => u.id === savedLead.assignedSalespersonId)?.name || 'Unassigned'}.`,
      customerName: savedLead.customerName
    };
    await db.addActivity(newActivity);
    setActivities(prev => [newActivity, ...prev]);
  }, [users, currentUser]);

  const handleBulkUpdate = useCallback(async (leadIds: string[], newStatus?: LeadStatus, newAssignedSalespersonId?: string) => {
    if (!currentUser) return;

    const updates: Partial<Lead> = {};
    if (newStatus) updates.status = newStatus;
    if (newAssignedSalespersonId) updates.assignedSalespersonId = newAssignedSalespersonId;
    updates.lastActivityDate = new Date().toISOString();

    await db.bulkUpdateLeads(leadIds, updates);

    // Refresh local state
    const updatedLeads = await db.getLeads();
    setLeads(updatedLeads);
  }, [currentUser]);

  const handleImportLeads = useCallback(async (newLeadsData: Omit<Lead, 'id' | 'isRead' | 'missedVisitsCount' | 'lastActivityDate' | 'month'>[]) => {
    const salespersonNameToId = new Map<string, string>(users.map(u => [u.name, u.id] as [string, string]));
    const adminUser = users.find(u => u.role === 'Admin');

    for (const data of newLeadsData) {
      const salespersonId = salespersonNameToId.get(data.assignedSalespersonId) || adminUser?.id || '';
      const leadData: any = {
        ...data,
        assignedSalespersonId: salespersonId,
        isRead: false,
        missedVisitsCount: 0,
        lastActivityDate: data.leadDate,
        month: new Date(data.leadDate).toLocaleString('default', { month: 'long', year: 'numeric' }),
        source: 'Import'
      };

      try {
        const backendLead = await api.createLead(leadData);
        if (backendLead) {
          await db.addLead(backendLead);
        } else {
          throw new Error('Import failed for one lead');
        }
      } catch (error) {
        console.warn('⚠️ Import to backend failed for lead, saving locally:', data.customerName);
        const localLead: Lead = {
          ...leadData,
          id: `imported-${Date.now()}-${Math.random()}`
        };
        await db.addLead(localLead);
      }
    }

    // Refresh leads from local DB to see everything
    const allLeads = await db.getLeads();
    setLeads(allLeads);
  }, [users]);

  const handleAddTask = useCallback(async (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...taskData,
    };
    await db.addTask(newTask);
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const handleToggleTask = useCallback(async (taskId: string) => {
    await db.toggleTask(taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
  }, []);

  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, ...updates };
    await db.updateTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
  }, [tasks]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await db.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const handleCreateUser = useCallback(async (userData: { name: string }) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      role: 'Salesperson',
      avatarUrl: `https://i.pravatar.cc/40?u=${userData.name}`
    };
    await db.addUser(newUser);
    setUsers(prev => [...prev, newUser]);
  }, []);

  const handleDeleteUser = useCallback(async (userId: string) => {
    const admin = users.find(u => u.role === 'Admin');
    if (!admin) return;

    await db.deleteUser(userId, admin.id);

    // Refresh all data to reflect reassignment
    const data = await db.getAllData();
    setUsers(data.users);
    setLeads(data.leads);
    setTasks(data.tasks);
  }, [users]);

  const handleBookUnit = useCallback(async (unitId: string) => {
    await db.bookUnit(unitId);
    const updatedInventory = await db.getInventory();
    setInventory(updatedInventory);
  }, []);

  const handleUpdateUnit = useCallback(async (projectId: string, unit: Unit) => {
    const updatedInventory = await db.updateUnit(projectId, unit);
    setInventory(updatedInventory);
  }, []);

  const handleAddUnit = useCallback(async (projectId: string, unit: Unit) => {
    const updatedInventory = await db.addUnit(projectId, unit);
    setInventory(updatedInventory);
  }, []);

  const handleDeleteUnit = useCallback(async (projectId: string, unitId: string) => {
    const updatedInventory = await db.deleteUnit(projectId, unitId);
    setInventory(updatedInventory);
  }, []);

  const handleResetDatabase = useCallback(async () => {
    if (window.confirm("Are you sure? This will delete all new data and restore the demo dataset.")) {
      setIsLoading(true);
      const data = await db.resetDatabase();
      setLeads(data.leads);
      setUsers(data.users);
      setActivities(data.activities);
      setSalesTargets(data.salesTargets);
      setTasks(data.tasks);
      setInventory(data.inventory);
      setIsLoading(false);
    }
  }, []);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    const isAdmin = user.role === 'Admin';
    setActiveView(isAdmin ? 'Dashboard' : 'Leads');
  }, []);

  const handleLogout = useCallback(async () => {
    if (currentUser) {
      try {
        await api.attendanceLogout(currentUser.id, true); // True means force clock-out on logout
      } catch (e) {
        console.warn('Logout presence notification failed', e);
      }
    }
    setCurrentUser(null);
    setActiveView('Dashboard');
  }, [currentUser]);

  // Presence Heartbeat & Fast Offline on Exit
  useEffect(() => {
    if (!currentUser) return;

    const sendHeartbeat = () => {
      api.attendancePresence(currentUser.id).catch(() => { });
    };

    const notifyOffline = () => {
      // Use standard fetch with 'keepalive' for reliability during tab close
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : 'https://chouhan-crm-backend-staging.onrender.com';

      fetch(`${apiBaseUrl}/api/v1/attendance/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
        keepalive: true
      });
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000); // 1 minute

    window.addEventListener('beforeunload', notifyOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', notifyOffline);
    };
  }, [currentUser]);

  const handleSearchResultClick = useCallback((lead: Lead) => {
    setTargetLeadId(lead.id);
    setActiveView('Leads');
    setSearchTerm('');
  }, []);

  const visibleLeads = useMemo(() => {
    if (!currentUser) {
      console.log('⚠️ No current user, returning empty leads');
      return [];
    }

    if (currentUser.role === 'Admin') {
      console.log(`👑 Admin user - showing all ${leads.length} leads`);
      return leads;
    }

    console.log(`🔍 [VISIBLE LEADS] Filtering for user: ${currentUser.name} (${currentUser.id})`);
    console.log(`   Total leads in system: ${leads.length}`);

    // Show all assigned leads for debugging
    const allAssignedLeads = leads.filter(l => {
      const aid = l.assignedSalespersonId;
      // Check if assigned to a real salesperson (not null, not empty, and not admin)
      const adminUser = users.find(u => u.role === 'Admin');
      return aid != null && aid !== '' && aid !== adminUser?.id;
    });
    console.log(`   Total assigned leads (any user): ${allAssignedLeads.length}`);
    if (allAssignedLeads.length > 0) {
      console.log('   All assigned leads:', allAssignedLeads.map(l => ({
        id: l.id,
        customer: l.customerName,
        assignedId: l.assignedSalespersonId,
        assignedIdType: typeof l.assignedSalespersonId
      })));
    }

    // Filter leads assigned to current user
    const filtered = leads.filter(lead => {
      const assignedId = lead.assignedSalespersonId;
      // Explicitly check: must be a non-empty string AND match current user ID
      // null, undefined, and '' are all considered "unassigned"
      const matches = assignedId != null && assignedId !== '' && assignedId === currentUser.id;

      return matches;
    });

    console.log(`👤 User ${currentUser.name} (${currentUser.id}) - Visible leads: ${filtered.length} out of ${leads.length} total`);

    // Check for specific lead IDs from notifications
    const notificationLeadIds = ['44cbebb7-b6a3-408b-91b1-ed7a799fca10', 'bffdecec-4693-45a1-b2f6-fb147f6e6ed4'];
    notificationLeadIds.forEach(notifLeadId => {
      const lead = leads.find(l => l.id === notifLeadId);
      if (lead) {
        console.log(`   🔍 Notification lead ${notifLeadId}:`, {
          found: true,
          customer: lead.customerName,
          assignedId: lead.assignedSalespersonId,
          assignedIdType: typeof lead.assignedSalespersonId,
          matchesUser: lead.assignedSalespersonId === currentUser.id,
          status: lead.status
        });
      } else {
        console.log(`   ❌ Notification lead ${notifLeadId}: NOT FOUND in leads array`);
      }
    });

    if (filtered.length > 0) {
      console.log('   ✅ Visible lead IDs:', filtered.map(l => ({ id: l.id, customer: l.customerName, assignedId: l.assignedSalespersonId })));
      // Show detailed info for visible leads
      filtered.forEach(lead => {
        console.log(`   ✅ Visible: ${lead.customerName} (ID: ${lead.id}, Assigned: ${lead.assignedSalespersonId})`);
      });
    } else {
      // Show why no leads are visible - more detailed debugging
      console.log('   ⚠️ No leads visible for this user');
      console.log('   Checking all leads for assignment issues...');

      // Check all leads and their assigned IDs
      leads.slice(0, 10).forEach((lead, idx) => {
        console.log(`   Lead ${idx + 1}:`, {
          id: lead.id,
          customer: lead.customerName,
          assignedId: lead.assignedSalespersonId,
          assignedIdType: typeof lead.assignedSalespersonId,
          matchesCurrentUser: lead.assignedSalespersonId === currentUser.id,
          currentUserId: currentUser.id,
          currentUserIdType: typeof currentUser.id
        });
      });

      const assignedLeads = leads.filter(l => l.assignedSalespersonId != null && l.assignedSalespersonId !== '');
      console.log('   Total assigned leads in system:', assignedLeads.length);
      if (assignedLeads.length > 0) {
        console.log('   All assigned lead IDs:', assignedLeads.map(l => ({ id: l.id, customer: l.customerName, assignedId: l.assignedSalespersonId })));
        // Show which ones match current user
        const myAssignedLeads = assignedLeads.filter(l => l.assignedSalespersonId === currentUser.id);
        console.log(`   Leads assigned to ${currentUser.id}:`, myAssignedLeads.length);
        if (myAssignedLeads.length > 0) {
          console.log('   My assigned leads:', myAssignedLeads.map(l => ({ id: l.id, customer: l.customerName })));
        } else {
          console.log(`   ❌ No leads match current user ID: ${currentUser.id}`);
          console.log(`   Available assigned IDs:`, [...new Set(assignedLeads.map(l => l.assignedSalespersonId))]);
        }
      } else {
        console.log('   ❌ No leads are assigned to anyone in the system');
      }
    }

    return filtered;
  }, [currentUser, leads]);

  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return tasks;
    return tasks.filter(task => task.assignedToId === currentUser.id);
  }, [currentUser, tasks]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const lowercasedTerm = searchTerm.toLowerCase();
    return visibleLeads.filter(lead =>
      lead.customerName.toLowerCase().includes(lowercasedTerm) ||
      lead.mobile.includes(lowercasedTerm) ||
      lead.interestedProject?.toLowerCase().includes(lowercasedTerm)
    );
  }, [searchTerm, visibleLeads]);

  const renderView = () => {
    const commonProps = {
      users,
      currentUser: currentUser!,
      onLogout: handleLogout,
      onNavigate: setActiveView,
    };

    let Content;

    switch (activeView) {
      case 'Dashboard':
        Content = <Dashboard leads={visibleLeads} activities={activities} tasks={visibleTasks} projects={inventory} {...commonProps} />;
        break;
      case 'Leads':
      case 'Opportunities':
      case 'Clients':
        Content = <LeadsPage
          viewMode={activeView.toLowerCase() as 'leads' | 'opportunities' | 'clients'}
          leads={visibleLeads}
          activities={activities}
          onUpdateLead={handleUpdateLead}
          onAddActivity={handleAddActivity}
          onDeleteActivity={handleDeleteActivity}
          onAssignLead={handleAssignLead}
          onBulkUpdate={handleBulkUpdate}
          onImportLeads={handleImportLeads}
          targetLeadId={targetLeadId}
          onClearTargetLead={() => setTargetLeadId(null)}
          onAddTask={handleAddTask}
          onDeleteLead={handleDeleteLead}
          projects={inventory} // Pass inventory here
          {...commonProps}
        />;
        break;
      case 'Inventory':
        Content = <InventoryPage
          projects={inventory}
          onBookUnit={handleBookUnit}
          onUpdateUnit={handleUpdateUnit}
          onAddUnit={handleAddUnit}
          onDeleteUnit={handleDeleteUnit}
          currentUser={currentUser!}
        />;
        break;
      case 'Calendar':
        Content = <CalendarPage leads={visibleLeads} tasks={visibleTasks} />;
        break;
      case 'Attendance':
        Content = <AttendancePage {...commonProps} />;
        break;
      case 'Reports':
        Content = <ReportsPage
          leads={visibleLeads}
          activities={activities}
          onUpdateLead={handleUpdateLead}
          onAddActivity={handleAddActivity}
          {...commonProps}
        />;
        break;
      case 'Tasks':
        Content = <TasksPage
          tasks={visibleTasks}
          leads={visibleLeads}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onUpdateLead={handleUpdateLead}
          {...commonProps}
        />;
        break;
      case 'Settings':
        Content = <SettingsPage
          onCreateUser={handleCreateUser}
          onDeleteUser={handleDeleteUser}
          onResetDatabase={handleResetDatabase}
          {...commonProps}
        />;
        break;
      default:
        Content = <Dashboard leads={visibleLeads} activities={activities} tasks={visibleTasks} projects={inventory} {...commonProps} />;
    }

    return (
      <Suspense fallback={<LoadingSpinner />}>
        {Content}
      </Suspense>
    );
  };

  if (!currentUser) {
    return <LoginPage users={users} onLogin={handleLogin} />;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-full w-full bg-base-200 overflow-hidden">
      {notification && <NotificationToast message={notification} onClose={() => setNotification(null)} />}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isOpen={isSidebarOpen}
        setOpen={setSidebarOpen}
        currentUser={currentUser}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchResults={searchResults}
          leads={visibleLeads}
          users={users}
          currentUser={currentUser}
          onLogout={handleLogout}
          onRefresh={loadData}
          onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          onResultClick={handleSearchResultClick}
          onNavigate={setActiveView}
        />
        <main className="flex-1 overflow-y-auto relative bg-white min-h-0">
          <div className="flex flex-col p-1.5 sm:p-2 md:p-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
            {renderView()}
          </div>
        </main>
        <BottomNavBar
          activeView={activeView}
          onNavigate={setActiveView}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
};

export default App;