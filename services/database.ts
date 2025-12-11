
import { Lead, User, Activity, SalesTarget, Task, LeadStatus, ActivityType, ModeOfEnquiry, VisitStatus } from '../types';
import { Project, Unit } from '../data/inventoryData';
import { mockProjects } from '../data/inventoryData';
import { newRawData } from '../data/mockData';

// Storage Keys
const DB_KEY = 'chouhan_crm_db_v1';

interface DatabaseSchema {
    leads: Lead[];
    users: User[];
    activities: Activity[];
    inventory: Project[];
    tasks: Task[];
    salesTargets: SalesTarget[];
}

// Helper to parse raw mock data into clean objects (Same logic as the old GoogleSheetService)
const parseDate = (dateStr: string | undefined): string | undefined => {
    if (!dateStr || typeof dateStr !== 'string' ) return undefined;
    const parts = dateStr.replace(/\./g, '/').split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        const fullYear = parseInt(year, 10) > 2000 ? year : `20${year}`;
        const date = new Date(`${fullYear}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    }
    return undefined;
};

// Generate a deterministic UUID-like ID from a string (for consistent IDs across sessions)
function generateIdFromName(name: string, role: string): string {
    // Create a simple hash from name and role for deterministic IDs
    const str = `${role}-${name}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    // Generate a UUID-like string (not a real UUID, but deterministic)
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex.substring(0, 8)}-${hex.substring(0, 4)}-${hex.substring(0, 4)}-${hex.substring(0, 4)}-${hex.substring(0, 12)}`;
}

const seedData = (): DatabaseSchema => {
    // Use deterministic IDs based on name/role instead of hardcoded user-1, admin-0, etc.
    // These will be replaced with Supabase UUIDs when users are synced
    const users: User[] = [
        { id: generateIdFromName('Admin', 'Admin'), name: 'Admin', role: 'Admin', avatarUrl: 'https://i.pravatar.cc/40?u=admin' },
        { id: generateIdFromName('Amit Naithani', 'Salesperson'), name: 'Amit Naithani', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=amit' },
        { id: generateIdFromName('Neeraj Tripathi', 'Salesperson'), name: 'Neeraj Tripathi', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=neeraj' },
        { id: generateIdFromName('Pinki Sahu', 'Salesperson'), name: 'Pinki Sahu', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=pinki' },
        { id: generateIdFromName('Sher Singh', 'Salesperson'), name: 'Sher Singh', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=sher' },
        { id: generateIdFromName('Umakant Sharma', 'Salesperson'), name: 'Umakant Sharma', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=umakant' },
        { id: generateIdFromName('Vimal Shrivastav', 'Salesperson'), name: 'Vimal Shrivastav', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=vimal' },
        { id: generateIdFromName('Parth Das', 'Salesperson'), name: 'Parth Das', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=parth' },
    ];

    const salespersonNameMap = new Map(users.map(u => [u.name.toLowerCase(), u.id]));
    const mockLabels = ['First-Time Buyer', 'Investor', 'Nri', 'Government Employee'];

    const leads: Lead[] = [];
    const activities: Activity[] = [];

    newRawData.forEach((d, index) => {
        if (!d['Customer Name']) return;

        const salesPersonName = d['Sales Person']?.toLowerCase();
        const assignedSalespersonId = salespersonNameMap.get(salesPersonName) || users[1].id;

        const temperatureStr = (d['Status H/W/C'] || '').toLowerCase();
        let temperature: 'Hot' | 'Warm' | 'Cold' | undefined;
        if (temperatureStr === 'hot') temperature = 'Hot';
        else if (temperatureStr === 'warm') temperature = 'Warm';
        else if (temperatureStr === 'cold') temperature = 'Cold';
        
        let status: LeadStatus = LeadStatus.New;
        const bookingStatus = (d['Booking Status'] || '').toLowerCase();
        
        if (bookingStatus.includes('book') || bookingStatus.includes('done')) status = LeadStatus.Booking;
        else if (bookingStatus.includes('drop') || temperatureStr === 'cancel') status = LeadStatus.Lost;
        else if (d['Visit YES/No']?.toLowerCase() === 'yes') status = LeadStatus.SiteVisitDone;
        else if (d['Visit Date'] && d['Visit Date'].match(/\d{1,2}[./]\d{1,2}[./]\d{4}/)) status = LeadStatus.SiteVisitScheduled;
        else if (d['Followup'] || d['Visit Remark']) status = LeadStatus.Qualified;
        
        const leadDate = parseDate(d['Lead Date']);
        const lastRemarkDate = parseDate(d['Remark Date']);
        
        const lead: Lead = {
            id: `lead-${index + 1}`,
            customerName: d['Customer Name'],
            status: status,
            assignedSalespersonId: assignedSalespersonId,
            lastActivityDate: lastRemarkDate || leadDate || new Date().toISOString(),
            leadDate: leadDate || new Date().toISOString(),
            month: d['Month'] || 'October 2025',
            modeOfEnquiry: d['Mode of Enquiry'] as ModeOfEnquiry || ModeOfEnquiry.Digital,
            mobile: String(d['Mobile'] || ''),
            occupation: d['Occupation'],
            interestedProject: d['Project'],
            interestedUnit: d['Unit'],
            temperature: temperature,
            visitStatus: (d['Visit YES/No']?.toLowerCase() === 'yes' ? 'Yes' : 'No') as VisitStatus,
            visitDate: d['Visit Date'],
            nextFollowUpDate: parseDate(d['Date']),
            lastRemark: d['Followup'] || d['Visit Remark'] || 'New lead created.',
            bookingStatus: d['Booking Status'],
            isRead: false,
            missedVisitsCount: 0,
            labels: temperature ? [temperature] : [],
            budget: '',
            purpose: undefined
        };

        leads.push(lead);

        activities.push({
            id: `act-${index + 1}`,
            leadId: lead.id,
            salespersonId: assignedSalespersonId,
            type: d['Visit YES/No']?.toLowerCase() === 'yes' ? ActivityType.Visit : ActivityType.Call,
            date: lastRemarkDate || leadDate || new Date().toISOString(),
            remarks: d['Followup'] || d['Visit Remark'] || `Initial enquiry via ${lead.modeOfEnquiry}`,
            customerName: lead.customerName,
        });
    });

    // Find users by name instead of hardcoded IDs
    const amitUser = users.find(u => u.name === 'Amit Naithani');
    const adminUser = users.find(u => u.role === 'Admin');
    
    const tasks: Task[] = [
        { 
            id: 'task-1', 
            title: 'Follow up with Mithlesh Tiwari', 
            assignedToId: amitUser?.id || users[1]?.id || '', 
            dueDate: new Date().toISOString(), 
            isCompleted: false, 
            createdBy: 'Admin', 
            hasReminded: true 
        },
        { 
            id: 'task-2', 
            title: 'Prepare report for October leads', 
            assignedToId: adminUser?.id || users[0]?.id || '', 
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), 
            isCompleted: false, 
            createdBy: 'Admin' 
        },
    ];

    const salesTargets: SalesTarget[] = users.filter(u => u.role === 'Salesperson').map(u => ({
        salespersonId: u.id,
        name: u.name,
        targets: { bookings: 5, visits: 15 },
        achieved: { bookings: 0, visits: 0 } // Will calculate dynamically
    }));

    return {
        leads,
        users,
        activities,
        inventory: mockProjects,
        tasks,
        salesTargets
    };
};

class DatabaseService {
    private data: DatabaseSchema;

    constructor() {
        const stored = localStorage.getItem(DB_KEY);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
            } catch (e) {
                console.error("Database corrupted, resetting", e);
                this.data = seedData();
                this.save();
            }
        } else {
            this.data = seedData();
            this.save();
        }
    }

    // Method to update user IDs from local IDs to Supabase UUIDs
    async updateUserIds(userIdMap: Map<string, string>) {
        if (userIdMap.size === 0) return;

        // Update users
        this.data.users = this.data.users.map(user => {
            const newId = userIdMap.get(user.id);
            if (newId && newId !== user.id) {
                return { ...user, id: newId };
            }
            return user;
        });

        // Update leads
        this.data.leads = this.data.leads.map(lead => {
            if (lead.assignedSalespersonId) {
                const newId = userIdMap.get(lead.assignedSalespersonId);
                if (newId) {
                    return { ...lead, assignedSalespersonId: newId };
                }
            }
            return lead;
        });

        // Update activities
        this.data.activities = this.data.activities.map(activity => {
            if (activity.salespersonId) {
                const newId = userIdMap.get(activity.salespersonId);
                if (newId) {
                    return { ...activity, salespersonId: newId };
                }
            }
            return activity;
        });

        // Update tasks
        this.data.tasks = this.data.tasks.map(task => {
            if (task.assignedToId) {
                const newId = userIdMap.get(task.assignedToId);
                if (newId) {
                    return { ...task, assignedToId: newId };
                }
            }
            return task;
        });

        // Update sales targets
        this.data.salesTargets = this.data.salesTargets.map(target => {
            const newId = userIdMap.get(target.salespersonId);
            if (newId) {
                return { ...target, salespersonId: newId };
            }
            return target;
        });

        this.save();
        console.log('✅ Updated all user ID references in local database');
    }

    private save() {
        localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    }

    // --- Public API ---

    async getAllData() {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 600));
        return { ...this.data };
    }

    async saveAllData(data: Partial<DatabaseSchema>) {
        if (data.leads) this.data.leads = data.leads;
        if (data.users) this.data.users = data.users;
        if (data.activities) this.data.activities = data.activities;
        if (data.inventory) this.data.inventory = data.inventory;
        if (data.tasks) this.data.tasks = data.tasks;
        if (data.salesTargets) this.data.salesTargets = data.salesTargets;
        this.save();
    }

    async getLeads() {
        return [...this.data.leads];
    }

    async addLead(lead: Lead) {
        this.data.leads.unshift(lead);
        this.save();
        return lead;
    }

    async updateLead(updatedLead: Lead) {
        const index = this.data.leads.findIndex(l => l.id === updatedLead.id);
        if (index !== -1) {
            this.data.leads[index] = updatedLead;
            this.save();
        }
        return updatedLead;
    }

    async bulkUpdateLeads(ids: string[], updates: Partial<Lead>) {
        this.data.leads = this.data.leads.map(l => {
            if (ids.includes(l.id)) {
                return { ...l, ...updates };
            }
            return l;
        });
        this.save();
    }

    async deleteLead(leadId: string) {
        this.data.leads = this.data.leads.filter(l => l.id !== leadId);
        // Also remove associated activities
        this.data.activities = this.data.activities.filter(a => a.leadId !== leadId);
        this.save();
    }

    async addActivity(activity: Activity) {
        this.data.activities.unshift(activity);
        // Update lead's last activity
        const leadIdx = this.data.leads.findIndex(l => l.id === activity.leadId);
        if (leadIdx !== -1) {
            this.data.leads[leadIdx].lastActivityDate = activity.date;
            this.data.leads[leadIdx].lastRemark = activity.remarks;
        }
        this.save();
        return activity;
    }

    async deleteActivity(activityId: string) {
        this.data.activities = this.data.activities.filter(a => a.id !== activityId);
        this.save();
    }

    async getInventory() {
        return [...this.data.inventory];
    }

    async bookUnit(unitId: string) {
        this.data.inventory = this.data.inventory.map(proj => ({
            ...proj,
            units: proj.units.map(unit => 
                unit.id === unitId ? { ...unit, status: 'Booked' } : unit
            )
        }));
        this.save();
    }

    async updateUnit(projectId: string, updatedUnit: Unit) {
        const projectIndex = this.data.inventory.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            const units = this.data.inventory[projectIndex].units;
            const unitIndex = units.findIndex(u => u.id === updatedUnit.id);
            if (unitIndex !== -1) {
                units[unitIndex] = updatedUnit;
                this.save();
            }
        }
        return [...this.data.inventory];
    }

    async addUnit(projectId: string, unit: Unit) {
        const projectIndex = this.data.inventory.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            this.data.inventory[projectIndex].units.push(unit);
            this.data.inventory[projectIndex].totalUnits += 1;
            if (unit.status === 'Available') {
                this.data.inventory[projectIndex].availableUnits += 1;
            }
            this.save();
        }
        return [...this.data.inventory];
    }

    async deleteUnit(projectId: string, unitId: string) {
        const projectIndex = this.data.inventory.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            const project = this.data.inventory[projectIndex];
            const unit = project.units.find(u => u.id === unitId);
            
            project.units = project.units.filter(u => u.id !== unitId);
            project.totalUnits -= 1;
            if (unit && unit.status === 'Available') {
                project.availableUnits -= 1;
            }
            this.save();
        }
        return [...this.data.inventory];
    }

    async addTask(task: Task) {
        this.data.tasks.unshift(task);
        this.save();
    }

    async toggleTask(taskId: string) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.isCompleted = !task.isCompleted;
            this.save();
        }
    }

    async updateTask(updatedTask: Task) {
        const index = this.data.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            this.data.tasks[index] = updatedTask;
            this.save();
        }
        return updatedTask;
    }

    async deleteTask(taskId: string) {
        this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
        this.save();
    }

    async markTaskReminded(taskId: string) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.hasReminded = true;
            this.save();
        }
        return [...this.data.tasks];
    }

    async addUser(user: User) {
        this.data.users.push(user);
        this.save();
    }

    async deleteUser(userId: string, reassignToId: string) {
        this.data.users = this.data.users.filter(u => u.id !== userId);
        // Reassign leads
        this.data.leads = this.data.leads.map(l => 
            l.assignedSalespersonId === userId ? { ...l, assignedSalespersonId: reassignToId } : l
        );
        this.save();
    }

    async resetDatabase() {
        this.data = seedData();
        this.save();
        return this.getAllData();
    }
}

export const db = new DatabaseService();
