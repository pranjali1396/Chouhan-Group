
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
    <div className="flex justify-center items-center h-full min-h-[50vh] bg-base-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
);

const NotificationToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    const isNewLead = message.includes('New Lead');
    const isAssignment = message.includes('Lead Assigned');
    
    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white border-l-4 border-primary shadow-2xl rounded-lg pointer-events-auto animate-in slide-in-from-top-2 duration-300">
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {isNewLead ? (
                            <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        ) : isAssignment ? (
                            <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        )}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-bold text-gray-900">
                            {isNewLead ? 'New Lead' : isAssignment ? 'Lead Assigned' : 'Notification'}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">{message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={onClose} className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
                            <span className="sr-only">Close</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
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
      // Try to fetch from backend API first
      try {
        const backendLeads = await api.getLeads();
        
        // Always use backend leads if API is available (even if empty array)
        // This ensures we're showing the latest data from Supabase
        if (backendLeads !== null && backendLeads !== undefined) {
          // Get local database leads for merging
          const localData = await db.getAllData();
          const localLeadIds = new Set(localData.leads.map(l => l.id));
          const localLeadMobiles = new Set(localData.leads.map(l => l.mobile));
          
          // Save new leads from backend to local database (for offline support)
          for (const backendLead of backendLeads) {
            // Check if lead doesn't exist in local database (by ID or mobile)
            const isNewLead = !localLeadIds.has(backendLead.id) && !localLeadMobiles.has(backendLead.mobile);
            if (isNewLead) {
              // Ensure all required fields are present
              const leadToSave: Lead = {
                ...backendLead,
                assignedSalespersonId: backendLead.assignedSalespersonId || '',
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
              await db.addLead(leadToSave);
            }
          }
          
          // Use backend leads as primary source (they're the source of truth)
          // Merge with local leads only for leads that don't exist in backend
          const backendLeadIds = new Set(backendLeads.map(l => l.id));
          const backendLeadMobiles = new Set(backendLeads.map(l => l.mobile));
          
          // Add local leads that aren't in backend (for offline/legacy data)
          const localOnlyLeads = localData.leads.filter(
            lead => !backendLeadIds.has(lead.id) && !backendLeadMobiles.has(lead.mobile)
          );
          
          // Combine: backend leads first (source of truth), then local-only leads
          const allLeads = [...backendLeads, ...localOnlyLeads];
          setLeads(allLeads);
        } else {
          // Fallback to local database if backend returns null/undefined
          console.warn('⚠️ Backend returned null/undefined, using local database');
          const data = await db.getAllData();
          setLeads(data.leads);
        }
      } catch (apiError) {
        console.warn('⚠️ Backend API not available, using local database:', apiError);
        // Fallback to local database
        const data = await db.getAllData();
        setLeads(data.leads);
      }
      
      // Load other data from local database
      const data = await db.getAllData();
      setUsers(data.users);
      setActivities(data.activities);
      setSalesTargets(data.salesTargets);
      setTasks(data.tasks);
      setInventory(data.inventory);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
          
          // Save new leads to local DB
          for (const backendLead of backendLeads) {
            const localLeadIds = new Set(localData.leads.map(l => l.id));
            const localLeadMobiles = new Set(localData.leads.map(l => l.mobile));
            const isNewLead = !localLeadIds.has(backendLead.id) && !localLeadMobiles.has(backendLead.mobile);
            if (isNewLead) {
              const leadToSave: Lead = {
                ...backendLead,
                assignedSalespersonId: backendLead.assignedSalespersonId || '',
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
            notificationMessage = `📋 Lead Assigned: ${firstNotif.leadData?.customerName || 'Unknown'}`;
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
      await api.updateLead(updatedLead.id, updatedLead);
    } catch (e) {
      console.error('Failed to update lead in Supabase, local DB still updated:', e);
    }

    // 1. Handle Reassignment
    const originalLead = leads.find(l => l.id === updatedLead.id);
    if (originalLead && originalLead.assignedSalespersonId !== updatedLead.assignedSalespersonId) {
      const newAssignee = users.find(u => u.id === updatedLead.assignedSalespersonId);
      const activity: Activity = {
        id: `act-assign-${Date.now()}`,
        leadId: updatedLead.id,
        salespersonId: currentUser.id,
        type: ActivityType.Note,
        date: new Date().toISOString(),
        remarks: `Lead assigned to ${newAssignee?.name || 'N/A'}.`,
        customerName: updatedLead.customerName
      };
      await db.addActivity(activity);
      setActivities(prev => [activity, ...prev]);
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
    
    // Re-fetch in background from local DB to keep UI consistent with local source
    const refreshedLeads = await db.getLeads();
    setLeads(refreshedLeads);

  }, [currentUser, users, leads]);

  const handleDeleteLead = useCallback(async (leadId: string) => {
    if (!currentUser || currentUser.role !== 'Admin') {
      throw new Error('Only admins can delete leads');
    }

    try {
      // Delete from backend API
      await api.deleteLead(leadId, currentUser.role);
      
      // Remove from local state
      setLeads(prevLeads => prevLeads.filter(l => l.id !== leadId));
      
      // Also remove from local database
      const localData = await db.getAllData();
      const leadToDelete = localData.leads.find(l => l.id === leadId);
      if (leadToDelete) {
        // Note: db.deleteLead might not exist, so we'll just update the state
        // The backend is the source of truth, so this is fine
        const refreshedLeads = await db.getLeads();
        setLeads(refreshedLeads.filter(l => l.id !== leadId));
      }
      
      // Remove associated activities
      setActivities(prevActivities => prevActivities.filter(a => a.leadId !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
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
        const newLead: Lead = {
            id: `lead-${Date.now()}`,
            ...newLeadData,
            status: LeadStatus.New,
            leadDate: new Date().toISOString(),
            month: new Date().toLocaleString('default', { month: 'long', year: 'numeric'}),
            lastActivityDate: new Date().toISOString(),
            modeOfEnquiry: (newLeadData.platform as ModeOfEnquiry) || ModeOfEnquiry.Reference,
            visitStatus: 'No',
            lastRemark: newLeadData.remarks || 'New lead created.',
            isRead: false,
            missedVisitsCount: 0,
            budget: newLeadData.budget,
            purpose: newLeadData.purpose,
        };

        await db.addLead(newLead);
        setLeads(prev => [newLead, ...prev]);

        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            leadId: newLead.id,
            salespersonId: 'admin-0',
            type: ActivityType.Note,
            date: new Date().toISOString(),
            remarks: `Lead created and assigned to ${users.find(u => u.id === newLead.assignedSalespersonId)?.name}.`,
            customerName: newLead.customerName
        };
        await db.addActivity(newActivity);
        setActivities(prev => [newActivity, ...prev]);
    }, [users]);

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
      
      for (const data of newLeadsData) {
           const salespersonId = salespersonNameToId.get(data.assignedSalespersonId) || 'admin-0';
           const lead: Lead = {
              ...data,
              id: `imported-${Date.now()}-${Math.random()}`,
              isRead: false,
              missedVisitsCount: 0,
              lastActivityDate: data.leadDate,
              month: new Date(data.leadDate).toLocaleString('default', { month: 'long', year: 'numeric' }),
              assignedSalespersonId: salespersonId,
          };
          await db.addLead(lead);
      }
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
    
    const handleLogout = useCallback(() => {
        setCurrentUser(null);
        setActiveView('Dashboard');
    }, []);
    
    const handleSearchResultClick = useCallback((lead: Lead) => {
        setTargetLeadId(lead.id);
        setActiveView('Leads');
        setSearchTerm('');
    }, []);

    const visibleLeads = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'Admin') return leads;
        return leads.filter(lead => lead.assignedSalespersonId === currentUser.id);
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
                Content = <Dashboard leads={visibleLeads} activities={activities} projects={inventory} {...commonProps} />;
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
                Content = <AttendancePage />;
                break;
            case 'Reports':
                Content = <ReportsPage 
                    leads={leads} 
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
                Content = <Dashboard leads={visibleLeads} activities={activities} projects={inventory} {...commonProps} />;
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
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto p-4 md:p-6 pb-24 md:pb-6">
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