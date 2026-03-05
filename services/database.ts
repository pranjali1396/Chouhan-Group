import { Lead, User, Activity, SalesTarget, Task, LeadStatus, ActivityType, ModeOfEnquiry, VisitStatus } from '../types';
import { Project, Unit } from '../data/inventoryData';
import { mockProjects } from '../data/inventoryData'; // Inventory seems to still refer to 'mockProjects' initially depending on if it has a real database. We can leave it as a constant for now or empty.

interface DatabaseSchema {
    leads: Lead[];
    users: User[];
    activities: Activity[];
    inventory: Project[];
    tasks: Task[];
    salesTargets: SalesTarget[];
}

const getEmptySchema = (): DatabaseSchema => {
    return {
        leads: [],
        users: [],
        activities: [],
        inventory: mockProjects || [], // keeping inventory catalog static for right now but no modifications saved locally
        tasks: [],
        salesTargets: []
    };
};

class DatabaseService {
    private data: DatabaseSchema;

    constructor() {
        this.data = this.loadFromStorage();
    }

    private loadFromStorage(): DatabaseSchema {
        const schema = getEmptySchema();
        if (typeof window === 'undefined') return schema;

        try {
            // Load Users
            const cachedUsers = localStorage.getItem('crm_cached_users');
            if (cachedUsers) {
                schema.users = JSON.parse(cachedUsers);
                console.log('📦 Loaded users from localStorage cache');
            }

            // Load Leads
            const cachedLeads = localStorage.getItem('crm_cached_leads');
            if (cachedLeads) {
                schema.leads = JSON.parse(cachedLeads);
                console.log('📦 Loaded leads from localStorage cache');
            }

            // Load Activities
            const cachedActivities = localStorage.getItem('crm_cached_activities');
            if (cachedActivities) {
                schema.activities = JSON.parse(cachedActivities);
            }

            // Load Tasks
            const cachedTasks = localStorage.getItem('crm_cached_tasks');
            if (cachedTasks) {
                schema.tasks = JSON.parse(cachedTasks);
            }

            // Load Inventory (if any saved)
            const cachedInventory = localStorage.getItem('crm_cached_inventory');
            if (cachedInventory) {
                schema.inventory = JSON.parse(cachedInventory);
            }
        } catch (e) {
            console.warn('Failed to load from storage', e);
        }
        return schema;
    }

    private saveUsers() {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('crm_cached_users', JSON.stringify(this.data.users));
        } catch (e) {
            console.warn('Failed to save users to storage', e);
        }
    }

    async updateUserIds(userIdMap: Map<string, string>) {
        if (userIdMap.size === 0) return;
        // In-memory update
        this.data.users = this.data.users.map(user => {
            const newId = userIdMap.get(user.id);
            if (newId && newId !== user.id) return { ...user, id: newId };
            return user;
        });

        this.data.leads = this.data.leads.map(lead => {
            if (lead.assignedSalespersonId) {
                const newId = userIdMap.get(lead.assignedSalespersonId);
                if (newId) return { ...lead, assignedSalespersonId: newId };
            }
            return lead;
        });

        this.data.activities = this.data.activities.map(activity => {
            if (activity.salespersonId) {
                const newId = userIdMap.get(activity.salespersonId);
                if (newId) return { ...activity, salespersonId: newId };
            }
            return activity;
        });

        this.data.tasks = this.data.tasks.map(task => {
            if (task.assignedToId) {
                const newId = userIdMap.get(task.assignedToId);
                if (newId) return { ...task, assignedToId: newId };
            }
            return task;
        });

        this.data.salesTargets = this.data.salesTargets.map(target => {
            const newId = userIdMap.get(target.salespersonId);
            if (newId) return { ...target, salespersonId: newId };
            return target;
        });

        this.save();
        console.log('✅ Updated all user ID references in memory and storage');
    }

    private save() {
        if (typeof window === 'undefined') return;
        try {
            // Use separate keys to avoid total block failures and hit limits individually if needed
            localStorage.setItem('crm_cached_leads', JSON.stringify(this.data.leads));
            localStorage.setItem('crm_cached_activities', JSON.stringify(this.data.activities));
            localStorage.setItem('crm_cached_tasks', JSON.stringify(this.data.tasks));
            localStorage.setItem('crm_cached_inventory', JSON.stringify(this.data.inventory));
            localStorage.setItem('crm_cached_users', JSON.stringify(this.data.users));
            console.debug('💾 Data persisted to localStorage');
        } catch (e) {
            console.warn('Failed to save data to localStorage', e);
        }
    }

    // --- Public API ---

    async getAllData() {
        return { ...this.data };
    }

    async saveAllData(data: Partial<DatabaseSchema>) {
        if (data.leads) this.data.leads = data.leads;
        if (data.users) this.data.users = data.users;
        if (data.activities) this.data.activities = data.activities;
        if (data.inventory) this.data.inventory = data.inventory;
        if (data.tasks) this.data.tasks = data.tasks;
        if (data.salesTargets) this.data.salesTargets = data.salesTargets;

        this.save(); // Persist everything
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
        this.data.activities = this.data.activities.filter(a => a.leadId !== leadId);
        this.save();
    }

    async addActivity(activity: Activity) {
        this.data.activities.unshift(activity);
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
            }
        }
        this.save();
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
        }
        this.save();
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
        }
        this.save();
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
        this.data.leads = this.data.leads.map(l =>
            l.assignedSalespersonId === userId ? { ...l, assignedSalespersonId: reassignToId } : l
        );
        this.save();
    }

    async resetDatabase() {
        this.data = getEmptySchema();
        this.save();
        return this.getAllData();
    }
}

export const db = new DatabaseService();
