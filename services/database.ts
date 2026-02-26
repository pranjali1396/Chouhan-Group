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
        this.data = getEmptySchema();
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
        console.log('✅ Updated all user ID references in memory');
    }

    private save() {
        // We do NOT save to localStorage anymore
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
    }

    async getLeads() {
        return [...this.data.leads];
    }

    async addLead(lead: Lead) {
        this.data.leads.unshift(lead);
        return lead;
    }

    async updateLead(updatedLead: Lead) {
        const index = this.data.leads.findIndex(l => l.id === updatedLead.id);
        if (index !== -1) {
            this.data.leads[index] = updatedLead;
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
    }

    async deleteLead(leadId: string) {
        this.data.leads = this.data.leads.filter(l => l.id !== leadId);
        this.data.activities = this.data.activities.filter(a => a.leadId !== leadId);
    }

    async addActivity(activity: Activity) {
        this.data.activities.unshift(activity);
        const leadIdx = this.data.leads.findIndex(l => l.id === activity.leadId);
        if (leadIdx !== -1) {
            this.data.leads[leadIdx].lastActivityDate = activity.date;
            this.data.leads[leadIdx].lastRemark = activity.remarks;
        }
        return activity;
    }

    async deleteActivity(activityId: string) {
        this.data.activities = this.data.activities.filter(a => a.id !== activityId);
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
        return [...this.data.inventory];
    }

    async addTask(task: Task) {
        this.data.tasks.unshift(task);
    }

    async toggleTask(taskId: string) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.isCompleted = !task.isCompleted;
        }
    }

    async updateTask(updatedTask: Task) {
        const index = this.data.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            this.data.tasks[index] = updatedTask;
        }
        return updatedTask;
    }

    async deleteTask(taskId: string) {
        this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
    }

    async markTaskReminded(taskId: string) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.hasReminded = true;
        }
        return [...this.data.tasks];
    }

    async addUser(user: User) {
        this.data.users.push(user);
    }

    async deleteUser(userId: string, reassignToId: string) {
        this.data.users = this.data.users.filter(u => u.id !== userId);
        this.data.leads = this.data.leads.map(l =>
            l.assignedSalespersonId === userId ? { ...l, assignedSalespersonId: reassignToId } : l
        );
    }

    async resetDatabase() {
        this.data = getEmptySchema();
        return this.getAllData();
    }
}

export const db = new DatabaseService();
