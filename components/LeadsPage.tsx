
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import LeadsTable from './LeadsTable';
import LeadDetailModal from './LeadDetailModal';
import AssignLeadForm from './AssignLeadForm';
import type { Lead, User, ActivityType, Activity, Task } from '../types';
import { LeadStatus, ModeOfEnquiry } from '../types';
import type { NewLeadData } from '../App';
import type { Project } from '../data/inventoryData';
import {
    FunnelIcon,
    XMarkIcon,
    SearchIcon,
    PlusIcon,
    MinusIcon,
    UserCircleIcon,
    CalendarIcon,
    MapPinIcon,
    PhoneIcon,
    CurrencyRupeeIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    UsersIcon,
    BellIcon
} from './Icons';
import { MetricCard, MetricGrid } from './MetricSection';

interface LeadsPageProps {
    viewMode?: 'leads' | 'opportunities' | 'clients';
    leads: Lead[];
    users: User[];
    currentUser: User;
    onUpdateLead: (lead: Lead) => void;
    onAddActivity: (lead: Lead, activityType: ActivityType, remarks: string, duration?: number) => void;
    onDeleteActivity?: (activityId: string) => void;
    activities: Activity[];
    onAssignLead: (newLeadData: NewLeadData) => void;
    onBulkUpdate: (leadIds: string[], newStatus?: LeadStatus, newAssignedSalespersonId?: string) => void;
    onImportLeads: (newLeads: Omit<Lead, 'id' | 'isRead' | 'missedVisitsCount' | 'lastActivityDate' | 'month'>[]) => void;
    onAddTask: (task: Omit<Task, 'id'>) => void;
    onDeleteLead?: (leadId: string) => void;
    onLogout: () => void;
    onNavigate: (view: string) => void;
    targetLeadId?: string | null;
    onClearTargetLead?: () => void;
    projects?: Project[]; // Added inventory projects
}

// --- Pipeline / Kanban Components ---

const PipelineCard: React.FC<{ lead: Lead, user?: User, onClick: () => void }> = ({ lead, user, onClick }) => {
    const tempClass = useMemo(() => {
        switch (lead.temperature) {
            case 'Hot': return 'grad-hot shadow-red-200';
            case 'Warm': return 'grad-warm shadow-orange-200';
            case 'Cold': return 'grad-cold shadow-blue-200';
            default: return 'bg-slate-100';
        }
    }, [lead.temperature]);

    return (
        <div
            onClick={onClick}
            className="glass-card p-4 rounded-xl border border-slate-200 cursor-pointer hover-lift shadow-sm group relative touch-manipulation animate-fade-in"
        >
            {/* Top row with name and indicator */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-slate-800 text-sm md:text-[15px] truncate leading-tight group-hover:text-primary transition-colors" title={lead.customerName}>
                        {lead.customerName}
                    </h4>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
                        {lead.modeOfEnquiry}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                    {!lead.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/50"></div>
                    )}
                    {lead.temperature && (
                        <div className={`w-2 h-2 rounded-full ${tempClass} shadow-sm`} title={lead.temperature}></div>
                    )}
                </div>
            </div>

            {/* Content body */}
            <div className="space-y-2.5 mb-4">
                <div className="flex items-center text-xs text-slate-600 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50">
                    <MapPinIcon className="w-3.5 h-3.5 mr-2 text-primary/60 flex-shrink-0" />
                    <span className="truncate font-medium">{lead.interestedProject || 'No Project'}</span>
                </div>
                <div className="flex items-center text-xs text-slate-600 px-1.5">
                    <PhoneIcon className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold tabular-nums">{lead.mobile}</span>
                </div>

                {lead.budget && (
                    <div className="flex items-center text-xs text-emerald-700 bg-emerald-50/50 px-2 py-1 rounded-md border border-emerald-100/50 w-fit">
                        <CurrencyRupeeIcon className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                        <span className="font-bold tracking-tight">{lead.budget}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <div className="flex items-center min-w-0 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 shadow-inner">
                    <UserCircleIcon className="w-3 h-3 mr-1.5 text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="truncate max-w-[80px] text-slate-500 uppercase tracking-tighter">{user?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center flex-shrink-0">
                    <CalendarIcon className="w-3 h-3 mr-1 text-slate-300" />
                    <span className="tabular-nums">{new Date(lead.lastActivityDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/[0.02] pointer-events-none transition-colors duration-300"></div>
        </div>
    );
};

const PipelineBoard: React.FC<{ leads: Lead[], users: User[], onOpenModal: (l: Lead) => void }> = ({ leads, users, onOpenModal }) => {
    const userMap = new Map(users.map(u => [u.id, u]));
    const [expandedColumns, setExpandedColumns] = React.useState<Set<string>>(new Set(['new', 'qualified']));

    const columns = [
        {
            id: 'new',
            title: 'New / Contacted',
            statuses: [LeadStatus.New, LeadStatus.Contacted],
            color: 'border-sky-500',
            bg: 'bg-sky-50',
            icon: <UserCircleIcon className="w-4 h-4 text-sky-600" />
        },
        {
            id: 'qualified',
            title: 'Qualified',
            statuses: [LeadStatus.Qualified, LeadStatus.SiteVisitPending],
            color: 'border-blue-500',
            bg: 'bg-blue-50',
            icon: <UserCircleIcon className="w-4 h-4 text-blue-600" />
        },
        {
            id: 'visit_scheduled',
            title: 'Visit Scheduled',
            statuses: [LeadStatus.SiteVisitScheduled],
            color: 'border-orange-500',
            bg: 'bg-orange-50',
            icon: <CalendarIcon className="w-4 h-4 text-orange-600" />
        },
        {
            id: 'visit_done',
            title: 'Visit Done',
            statuses: [LeadStatus.SiteVisitDone],
            color: 'border-purple-500',
            bg: 'bg-purple-50',
            icon: <MapPinIcon className="w-4 h-4 text-purple-600" />
        },
        {
            id: 'proposal',
            title: 'Proposal Sent',
            statuses: [LeadStatus.ProposalSent, LeadStatus.ProposalFinalized],
            color: 'border-indigo-500',
            bg: 'bg-indigo-50',
            icon: <DocumentTextIcon className="w-4 h-4 text-indigo-600" />
        },
        {
            id: 'negotiation',
            title: 'Negotiation',
            statuses: [LeadStatus.Negotiation],
            color: 'border-green-500',
            bg: 'bg-green-50',
            icon: <CurrencyRupeeIcon className="w-4 h-4 text-green-600" />
        },
        {
            id: 'booking',
            title: 'Booking',
            statuses: [LeadStatus.Booking],
            color: 'border-amber-500',
            bg: 'bg-amber-50',
            icon: <CurrencyRupeeIcon className="w-4 h-4 text-amber-600" />
        },
        {
            id: 'booked',
            title: 'Booked',
            statuses: [LeadStatus.Booked],
            color: 'border-emerald-500',
            bg: 'bg-emerald-50',
            icon: <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
        },
        {
            id: 'closed',
            title: 'Closed / Lost',
            statuses: [LeadStatus.Lost, LeadStatus.Cancelled, LeadStatus.Disqualified],
            color: 'border-rose-500',
            bg: 'bg-rose-50',
            icon: <XMarkIcon className="w-4 h-4 text-rose-600" />
        }
    ];

    const toggleColumn = (colId: string) => {
        setExpandedColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(colId)) {
                newSet.delete(colId);
            } else {
                newSet.add(colId);
            }
            return newSet;
        });
    };

    return (
        <>
            {/* Mobile View - Premium Vertical Stacked Accordion */}
            <div className="md:hidden space-y-4 pb-6 px-1">
                {columns.map(col => {
                    const colLeads = leads.filter(l => col.statuses.includes(l.status));
                    const isExpanded = expandedColumns.has(col.id);
                    return (
                        <div key={col.id} className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => toggleColumn(col.id)}
                                className={`w-full p-4 flex justify-between items-center transition-all duration-300 active:bg-slate-50 ${isExpanded ? 'bg-slate-50/50' : 'bg-white'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl border-2 shadow-sm transition-all duration-300 ${col.bg} ${col.color.replace('border-', 'border-')}`}>
                                        {col.icon}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">{col.title}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">
                                            {colLeads.length} {colLeads.length === 1 ? 'Opportunity' : 'Opportunities'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-slate-900 border-slate-900' : 'bg-slate-100 border-slate-200'} border`}>
                                    {isExpanded ? (
                                        <MinusIcon className="w-4 h-4 text-white" />
                                    ) : (
                                        <PlusIcon className="w-4 h-4 text-slate-400" />
                                    )}
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="p-4 space-y-4 bg-slate-50/30 border-t border-slate-100 max-h-[70vh] overflow-y-auto animate-fade-in custom-scrollbar">
                                    {colLeads.length > 0 ? (
                                        colLeads.map(lead => (
                                            <div key={lead.id} className="animate-fade-in">
                                                <PipelineCard
                                                    lead={lead}
                                                    user={userMap.get(lead.assignedSalespersonId)}
                                                    onClick={() => onOpenModal(lead)}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <PlusIcon className="w-5 h-5 text-slate-300" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stage is empty</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop View - Horizontal Kanban */}
            <div className="hidden md:flex gap-5 overflow-x-auto pb-6 h-[calc(100vh-220px)] min-h-[500px] p-2">
                {columns.map(col => {
                    const colLeads = leads.filter(l => col.statuses.includes(l.status));
                    const totalValue = colLeads.reduce((acc, l) => {
                        const amount = parseInt(l.budget?.replace(/[^\d]/g, '') || '0');
                        return acc + amount;
                    }, 0);

                    return (
                        <div key={col.id} className="flex-shrink-0 w-80 flex flex-col rounded-2xl bg-slate-50 border border-slate-200 shadow-sm h-full group/col">
                            {/* Column Header */}
                            <div className={`p-4 rounded-t-2xl bg-white border-b border-slate-100 flex flex-col gap-3 sticky top-0 z-10 shadow-sm transition-all group-hover/col:shadow-md`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 rounded-xl border transition-all duration-300 shadow-sm ${col.bg} ${col.color.replace('border-', 'border-').replace('text-', 'text-')}`}>
                                            {col.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">{col.title}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{colLeads.length} Deals</p>
                                        </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-transform duration-300 group-hover/col:scale-110 ${col.bg} ${col.color.replace('border-', 'border-').replace('text-', 'text-')}`}>
                                        {colLeads.length}
                                    </div>
                                </div>
                                {totalValue > 0 && (
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Potential:</span>
                                        <span className="text-[10px] font-black text-emerald-600">₹ {(totalValue / 100000).toFixed(1)}L+</span>
                                    </div>
                                )}
                                <div className={`h-1 w-full rounded-full bg-slate-100 overflow-hidden mt-1`}>
                                    <div className={`h-full ${col.color.replace('border-', 'bg-')} transition-all duration-1000`} style={{ width: `${Math.min(100, (colLeads.length / leads.length) * 100 * 3)}%` }}></div>
                                </div>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                                {colLeads.map(lead => (
                                    <PipelineCard
                                        key={lead.id}
                                        lead={lead}
                                        user={userMap.get(lead.assignedSalespersonId)}
                                        onClick={() => onOpenModal(lead)}
                                    />
                                ))}
                                {colLeads.length === 0 && (
                                    <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 m-2">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <PlusIcon className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Empty Stage</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}

// --- Helpers ---

const getTabsForViewMode = (mode: string) => {
    switch (mode) {
        case 'leads':
            return [
                { id: 'all', label: 'All Inquiries' },
                { id: 'new', label: 'New Leads' },
                { id: 'unassigned', label: 'Unassigned' },
                { id: 'assigned', label: 'Assigned' },
                { id: 'contacted', label: 'Contacted' },
                { id: 'lost', label: 'Lost / Dead' },
            ];
        case 'opportunities':
            return [
                { id: 'all', label: 'Pipeline' },
            ];
        case 'clients':
            return [
                { id: 'all', label: 'All Clients' },
                { id: 'booked', label: 'Booked' },
            ];
        default:
            return [
                { id: 'all', label: 'All' },
            ];
    }
};

const getStatusesForTab = (tabId: string): LeadStatus[] | null => {
    switch (tabId) {
        // Leads View Tabs
        // "New Leads" tab: Show leads with status "New Lead" (normalized from backend)
        case 'new': return [LeadStatus.New]; // LeadStatus.New = 'New Lead'
        case 'contacted': return [LeadStatus.Contacted];
        case 'lost': return [LeadStatus.Lost, LeadStatus.Cancelled, LeadStatus.Disqualified];

        // Clients View Tabs
        case 'booked': return [LeadStatus.Booking, LeadStatus.Booked];

        default: return null;
    }
};

const getStatusesForViewMode = (mode: string): LeadStatus[] => {
    switch (mode) {
        case 'leads':
            // Include Qualified and other common statuses that salespeople work with
            return [
                LeadStatus.New,
                LeadStatus.Contacted,
                LeadStatus.Qualified,
                LeadStatus.SiteVisitPending,
                LeadStatus.SiteVisitScheduled,
                LeadStatus.SiteVisitDone,
                LeadStatus.Lost,
                LeadStatus.Cancelled,
                LeadStatus.Disqualified
            ];
        case 'opportunities':
            // Show full funnel in pipeline: from New to Booked/Closed
            return [
                LeadStatus.New,
                LeadStatus.Contacted,
                LeadStatus.Qualified,
                LeadStatus.SiteVisitPending,
                LeadStatus.SiteVisitScheduled,
                LeadStatus.SiteVisitDone,
                LeadStatus.ProposalSent,
                LeadStatus.ProposalFinalized,
                LeadStatus.Negotiation,
                LeadStatus.Booking,
                LeadStatus.Booked,
                LeadStatus.Lost,
                LeadStatus.Cancelled,
                LeadStatus.Disqualified
            ];
        case 'clients':
            return [LeadStatus.Booking, LeadStatus.Booked];
        default:
            return Object.values(LeadStatus);
    }
};

const ImportCSV: React.FC<{ onImport: Function, users: User[] }> = ({ onImport, users }) => {
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setError('');

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                try {
                    const lines = text.split(/\r\n|\n/);
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

                    const requiredHeaders = ['Customer Name', 'Mobile', 'Status', 'Sales Person', 'Lead Date'];
                    const hasHeaders = requiredHeaders.every(h => headers.includes(h));
                    if (!hasHeaders) {
                        throw new Error(`CSV must include headers: ${requiredHeaders.join(', ')}`);
                    }

                    const leadsToImport = lines.slice(1).map(line => {
                        const data = line.split(',');
                        if (data.length < headers.length) return null;

                        const leadData: Record<string, string> = {};
                        headers.forEach((header, index) => {
                            leadData[header] = data[index]?.trim().replace(/"/g, '') ?? '';
                        });

                        if (!leadData['Customer Name'] || !leadData['Mobile']) return null;

                        const leadDateStr = leadData['Lead Date'];
                        let leadDateISO = new Date().toISOString();
                        if (leadDateStr) {
                            const parsedDate = new Date(leadDateStr as string);
                            if (!isNaN(parsedDate.getTime())) {
                                leadDateISO = parsedDate.toISOString();
                            }
                        }

                        return {
                            customerName: leadData['Customer Name'],
                            mobile: leadData['Mobile'],
                            email: leadData['Email'] || '',
                            city: leadData['City'] || '',
                            platform: leadData['Source / Platform'] || 'Imported',
                            interestedProject: leadData['Interested Project'] || '',
                            interestedUnit: leadData['Property Type'] || '',
                            investmentTimeline: '',
                            lastRemark: leadData['Last Remark'] || 'Imported lead.',
                            assignedSalespersonId: leadData['Sales Person'] || users[0].name,
                            status: (leadData['Status'] as LeadStatus) || LeadStatus.New,
                            leadDate: leadDateISO,
                            modeOfEnquiry: ModeOfEnquiry.Digital,
                            visitStatus: 'No',
                        };
                    }).filter(Boolean);

                    onImport(leadsToImport);

                } catch (err: any) {
                    setError(err.message || 'Failed to parse CSV file.');
                } finally {
                    setIsParsing(false);
                }
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
            <label htmlFor="csv-importer" className={`px-3 md:px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg md:rounded-md shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors cursor-pointer touch-manipulation active:scale-95 ${isParsing ? 'opacity-50' : ''}`}>
                {isParsing ? 'Importing...' : (
                    <>
                        <span className="hidden sm:inline">Import CSV</span>
                        <span className="sm:hidden">Import</span>
                    </>
                )}
            </label>
            <input id="csv-importer" type="file" accept=".csv" onChange={handleFileChange} className="hidden" disabled={isParsing} />
            {error && <p className="text-xs text-red-500 px-1">{error}</p>}
        </div>
    );
};

const FilterChip: React.FC<{ label: string; isActive: boolean; onClick: () => void; dataFilter?: string }> = ({ label, isActive, onClick, dataFilter }) => (
    <button
        onClick={onClick}
        data-filter={dataFilter}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${isActive
            ? 'bg-primary text-white border-primary'
            : 'bg-base-100 text-muted-content border-border-color hover:bg-base-200'
            }`}
    >
        {label}
    </button>
);

const LeadsPage: React.FC<LeadsPageProps> = ({ viewMode = 'leads', leads, users, currentUser, onUpdateLead, onAddActivity, onDeleteActivity, activities, onAssignLead, onBulkUpdate, onImportLeads, onAddTask, onDeleteLead, onLogout, onNavigate, targetLeadId, onClearTargetLead, projects = [] }) => {
    const [activeTab, setActiveTab] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showAddLead, setShowAddLead] = useState(false);
    const [localSearch, setLocalSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState('');
    const [bulkAssignee, setBulkAssignee] = useState('');

    // Wrapper for onUpdateLead that switches to assigned tab when a lead is assigned
    const handleUpdateLeadWithTabSwitch = useCallback((updatedLead: Lead) => {
        // Find the original lead to check if assignment changed
        const originalLead = leads.find(l => l.id === updatedLead.id);
        const adminUser = users.find(u => u.role === 'Admin');
        const wasUnassigned = !originalLead?.assignedSalespersonId ||
            originalLead.assignedSalespersonId === '' ||
            originalLead.assignedSalespersonId === adminUser?.id;
        const isNowAssigned = updatedLead.assignedSalespersonId &&
            updatedLead.assignedSalespersonId !== '' &&
            updatedLead.assignedSalespersonId !== adminUser?.id;

        // If lead was just assigned, switch to assigned tab
        if (wasUnassigned && isNowAssigned) {
            setActiveTab('assigned');
        }

        // Call the original onUpdateLead
        onUpdateLead(updatedLead);
    }, [leads, onUpdateLead]);

    // Wrapper for onAssignLead that switches to assigned tab when a new lead is assigned
    const handleAssignLeadWithTabSwitch = useCallback((newLeadData: NewLeadData) => {
        // If the new lead has an assigned salesperson, switch to assigned tab
        const adminUser = users.find(u => u.role === 'Admin');
        if (newLeadData.assignedSalespersonId &&
            newLeadData.assignedSalespersonId !== '' &&
            newLeadData.assignedSalespersonId !== adminUser?.id) {
            setActiveTab('assigned');
        }

        // Call the original onAssignLead
        onAssignLead(newLeadData);
    }, [onAssignLead, users]);

    const [filters, setFilters] = useState({
        salesperson: '',
        dateRange: '',
        showUnread: false,
        showOverdue: false,
        showVisitsDone: false,
        showVisitsPlanned: false,
        showCalls: false,
        enquiryType: '',
        source: '',
        month: '',
    });

    const tabs = useMemo(() => {
        const allTabs = getTabsForViewMode(viewMode);
        // Filter out "unassigned" and "assigned" tabs for non-admin users
        if (currentUser.role !== 'Admin') {
            return allTabs.filter(tab => tab.id !== 'unassigned' && tab.id !== 'assigned');
        }
        return allTabs;
    }, [viewMode, currentUser]);

    // Reset tab when view mode changes
    useEffect(() => {
        setActiveTab('all');
        setSelectedLeadIds(new Set());
    }, [viewMode]);

    const handleOpenModal = useCallback((lead: Lead) => {
        setSelectedLead(lead);
        if (!lead.isRead) {
            onUpdateLead({ ...lead, isRead: true });
        }
    }, [onUpdateLead]);

    const handleCloseModal = useCallback(() => {
        setSelectedLead(null);
    }, []);

    // Effect to handle navigation from global search
    useEffect(() => {
        if (targetLeadId) {
            const lead = leads.find(l => l.id === targetLeadId);
            if (lead) {
                handleOpenModal(lead);
            }
            if (onClearTargetLead) {
                onClearTargetLead();
            }
        }
    }, [targetLeadId, leads, handleOpenModal, onClearTargetLead]);

    const uniqueMonths = useMemo(() => {
        const months = new Set(leads.map(l => l.month).filter(Boolean));
        return Array.from(months).sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime());
    }, [leads]);

    const uniqueSources = useMemo(() => {
        const sources = new Set(leads.map(l => l.source).filter(Boolean));
        return Array.from(sources).sort();
    }, [leads]);

    const filteredLeads = useMemo(() => {
        // Debug: Log incoming leads for "New Leads" tab
        if (activeTab === 'new' && currentUser.role !== 'Admin') {
            console.log('🔍 [NEW LEADS TAB] Filtering leads:', {
                totalLeads: leads.length,
                currentUserId: currentUser.id,
                assignedLeads: leads.filter(l => l.assignedSalespersonId === currentUser.id).length,
                newLeads: leads.filter(l => l.status === LeadStatus.New).length,
                assignedAndNew: leads.filter(l => l.assignedSalespersonId === currentUser.id && l.status === LeadStatus.New).length
            });
        }

        // 1. Filter by View Mode (Leads vs Opps vs Clients)
        // BUT: For "assigned", "unassigned" tabs, and "new" tab for non-admin users, show ALL statuses
        const adminUser = users.find(u => u.role === 'Admin');
        const isAdmin = currentUser.role === 'Admin';
        const isAssignmentTab = activeTab === 'assigned' || activeTab === 'unassigned';
        const isNewTabForNonAdmin = activeTab === 'new' && !isAdmin;

        let filtered: Lead[];
        if (isAssignmentTab || isNewTabForNonAdmin) {
            // For assignment tabs and "new" tab for non-admin users, show all leads regardless of status
            filtered = [...leads];
        } else {
            // For other tabs, filter by viewMode statuses
            const viewModeStatuses = getStatusesForViewMode(viewMode);
            filtered = leads.filter(l => viewModeStatuses.includes(l.status));
        }

        // 2. Filter by Active Tab (only for admin users on regular tabs)
        const tabStatuses = getStatusesForTab(activeTab);
        if (tabStatuses && !isAssignmentTab && !isNewTabForNonAdmin) {
            // Only apply status filtering if not an assignment tab and not "new" tab for non-admin
            filtered = filtered.filter(l => tabStatuses.includes(l.status));
        }

        // Debug: Log after tab filtering
        if (activeTab === 'new' && currentUser.role !== 'Admin') {
            console.log('🔍 [NEW LEADS TAB] After tab filter:', {
                filteredCount: filtered.length,
                filteredLeads: filtered.map(l => ({ id: l.id, customer: l.customerName, status: l.status, assignedId: l.assignedSalespersonId }))
            });
        }

        // 2.5. Handle unassigned tab - show leads without assigned salesperson (Admin only)
        if (activeTab === 'unassigned' && isAdmin) {
            filtered = filtered.filter(l =>
                !l.assignedSalespersonId ||
                l.assignedSalespersonId === '' ||
                l.assignedSalespersonId === adminUser?.id
            );
        }

        // 2.6. Handle assigned tab - show leads WITH assigned salesperson (Admin only)
        // Exclude unassigned leads (null, empty string, 'Unassigned', or assigned to admin)
        if (activeTab === 'assigned' && currentUser.role === 'Admin') {
            filtered = filtered.filter(l => {
                const assignedId = l.assignedSalespersonId;
                // Must have a valid assigned salesperson ID
                if (!assignedId || assignedId === '' || assignedId === 'Unassigned' || assignedId === adminUser?.id) {
                    return false;
                }
                // Check if the assigned ID exists in users (valid user)
                const assignedUser = users.find(u => u.id === assignedId);
                return assignedUser !== undefined && assignedUser.role !== 'Admin';
            });
        }

        // 2.7. Handle "New Leads" tab for non-admin users - show ALL their assigned leads (all statuses)
        if (activeTab === 'new' && !isAdmin) {
            // For non-admin users, "New Leads" tab shows ALL their assigned leads regardless of status
            filtered = filtered.filter(l =>
                l.assignedSalespersonId === currentUser.id
            );
        }

        // 3. Local Search
        if (localSearch) {
            const term = localSearch.toLowerCase();
            filtered = filtered.filter(l =>
                l.customerName.toLowerCase().includes(term) ||
                l.mobile.includes(term) ||
                (l.interestedProject && l.interestedProject.toLowerCase().includes(term))
            );
        }

        // 4. Advanced Filters
        if (filters.salesperson) {
            filtered = filtered.filter(l => l.assignedSalespersonId === filters.salesperson);
        }
        if (filters.month) {
            filtered = filtered.filter(l => l.month === filters.month);
        }
        if (filters.enquiryType) {
            filtered = filtered.filter(l => l.modeOfEnquiry === filters.enquiryType);
        }
        if (filters.source) {
            filtered = filtered.filter(l => l.source === filters.source);
        }
        if (filters.showUnread) {
            filtered = filtered.filter(l => !l.isRead);
        }
        if (filters.showOverdue) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filtered = filtered.filter(l => l.nextFollowUpDate && new Date(l.nextFollowUpDate) < today);
        }
        if (filters.showVisitsDone) {
            filtered = filtered.filter(l =>
                l.status === LeadStatus.SiteVisitDone ||
                l.visitStatus === 'Yes'
            );
        }
        if (filters.showVisitsPlanned) {
            filtered = filtered.filter(l =>
                l.status === LeadStatus.SiteVisitScheduled ||
                l.status === LeadStatus.SiteVisitPending ||
                l.visitStatus === 'Planned' ||
                l.visitStatus === 'Will Come'
            );
        }
        if (filters.showCalls) {
            // Include leads that have call activities
            filtered = filtered.filter(l =>
                activities.some(a => a.leadId === l.id && a.type === 'Call')
            );
        }

        return filtered.sort((a, b) => new Date(b.leadDate).getTime() - new Date(a.leadDate).getTime());
    }, [leads, viewMode, activeTab, localSearch, filters, currentUser, activities]);

    const allVisibleLeadsSelected = useMemo(() => {
        if (filteredLeads.length === 0) return false;
        return filteredLeads.every(lead => selectedLeadIds.has(lead.id));
    }, [filteredLeads, selectedLeadIds]);

    const handleSelectLead = useCallback((leadId: string) => {
        setSelectedLeadIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(leadId)) {
                newSet.delete(leadId);
            } else {
                newSet.add(leadId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const visibleIds = filteredLeads.map(l => l.id);
            setSelectedLeadIds(prev => new Set([...Array.from(prev), ...visibleIds]));
        } else {
            const visibleIds = filteredLeads.map(l => l.id);
            setSelectedLeadIds(prev => {
                const newSet = new Set(prev);
                visibleIds.forEach(id => newSet.delete(id));
                return newSet;
            });
        }
    }, [filteredLeads]);

    const handleApplyBulkAction = () => {
        const leadIds = Array.from(selectedLeadIds);
        if (leadIds.length === 0 || (!bulkStatus && !bulkAssignee)) return;

        // If bulk assigning leads, switch to assigned tab
        const adminUser = users.find(u => u.role === 'Admin');
        if (bulkAssignee && bulkAssignee !== '' && bulkAssignee !== adminUser?.id) {
            // Check if any of the selected leads are currently unassigned
            const selectedLeads = leads.filter(l => leadIds.includes(l.id));
            const hasUnassigned = selectedLeads.some(l =>
                !l.assignedSalespersonId ||
                l.assignedSalespersonId === '' ||
                l.assignedSalespersonId === adminUser?.id
            );
            if (hasUnassigned) {
                setActiveTab('assigned');
            }
        }

        onBulkUpdate(
            leadIds,
            bulkStatus ? (bulkStatus as LeadStatus) : undefined,
            bulkAssignee || undefined
        );

        setSelectedLeadIds(new Set());
        setBulkStatus('');
        setBulkAssignee('');
    };

    const exportToCSV = () => {
        const headers = ['Customer Name', 'Mobile', 'Email', 'City', 'Source', 'Platform', 'Interested Project', 'Property Type', 'Status', 'Sales Person', 'Lead Date', 'Next Follow-up', 'Last Remark'];
        const userMap = new Map(users.map(u => [u.id, u.name]));
        const rows = filteredLeads.map(lead => [
            `"${lead.customerName}"`,
            lead.mobile,
            lead.email || '',
            lead.city || '',
            lead.source || '',
            lead.platform || '',
            `"${lead.interestedProject || ''}"`,
            lead.interestedUnit || '',
            lead.status,
            `"${userMap.get(lead.assignedSalespersonId) || 'N/A'}"`,
            new Date(lead.leadDate).toLocaleDateString(),
            lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : 'N/A',
            `"${(lead.lastRemark || '').replace(/"/g, '""')}"`
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${viewMode}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isAdmin = currentUser.role === 'Admin';

    const manageableUsers = useMemo(() => {
        if (currentUser.role === 'Admin') {
            return users.filter(u => u.role !== 'Admin');
        }
        return [];
    }, [currentUser, users]);

    const resetFilters = () => {
        setFilters({
            salesperson: '',
            dateRange: '',
            showUnread: false,
            showOverdue: false,
            showVisits: false,
            enquiryType: '',
            source: '',
            month: '',
        });
        setLocalSearch('');
    };

    const getPageTitle = () => {
        if (viewMode === 'opportunities') return 'Opportunity Pipeline';
        if (viewMode === 'clients') return 'Client Bookings';
        return 'Leads Management';
    }

    return (
        <div className="space-y-3 md:space-y-4 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center justify-between gap-1.5 md:gap-4 shrink-0 relative flex-nowrap">
                <div className="space-y-0 min-w-0 flex-1">
                    <h1 className="text-base md:text-3xl font-black text-slate-800 tracking-tight capitalize select-none truncate">
                        {getPageTitle()}
                    </h1>
                    <p className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                        {leads.length} LEADS <span className="hidden md:inline">• {users.length} TEAM</span>
                    </p>
                </div>

                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                    {/* Primary Action Button */}
                    <button
                        onClick={() => setShowAddLead(true)}
                        className="grad-primary flex items-center px-2 py-1.5 md:px-5 md:py-2.5 text-[8px] md:text-sm font-black rounded-lg md:rounded-xl text-white shadow-lg shadow-indigo-200 active:scale-95 touch-manipulation uppercase tracking-wider"
                    >
                        <PlusIcon className="w-3 h-3 md:w-5 md:h-5 mr-0.5 md:mr-2" />
                        <span>Add Lead</span>
                    </button>

                    <div className="flex items-center p-0.5">
                        {isAdmin && (
                            <div className="scale-[0.65] md:scale-100 origin-right">
                                <ImportCSV onImport={onImportLeads} users={users} />
                            </div>
                        )}
                        <button
                            onClick={exportToCSV}
                            className="px-2 py-1.5 text-[8px] md:text-xs font-black text-slate-500 hover:text-slate-900 transition-colors active:scale-95 uppercase tracking-tighter sm:tracking-normal"
                        >
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Modern Floating Tabs */}
                {viewMode !== 'opportunities' && (
                    <div className="px-3 md:px-4 pt-3 md:pt-4 border-b border-slate-100 bg-white sticky top-0 z-20">
                        <div className="flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide pb-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    data-tab-id={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-1.5 md:px-5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[11px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105 z-10'
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search and Filter Toolbar */}
                <div className={`p-2 md:p-4 flex flex-col lg:flex-row gap-2 md:gap-4 items-center justify-between bg-white border-b border-slate-100 sticky ${viewMode === 'opportunities' ? 'top-0' : 'top-11 md:top-14'} z-10`}>
                    <div className="relative w-full lg:w-[450px] group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <SearchIcon className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full py-2 md:py-3.5 pl-10 pr-4 text-xs md:text-sm bg-white border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2.5 w-full lg:w-auto">
                        <div className="flex flex-wrap gap-1 flex-1 md:flex-none">
                            <FilterChip label="Overdue" isActive={filters.showOverdue} onClick={() => setFilters(f => ({ ...f, showOverdue: !f.showOverdue }))} />
                            <FilterChip label="Site Done" isActive={filters.showVisitsDone} onClick={() => setFilters(f => ({ ...f, showVisitsDone: !f.showVisitsDone }))} dataFilter="visits-done" />
                            <FilterChip label="Calls" isActive={filters.showCalls} onClick={() => setFilters(f => ({ ...f, showCalls: !f.showCalls }))} dataFilter="calls" />
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2.5 text-[9px] md:text-xs font-black uppercase tracking-widest rounded-lg md:rounded-xl border transition-all duration-200 touch-manipulation active:scale-95 shadow-sm ${showFilters
                                ? 'bg-primary border-primary text-white shadow-primary/20'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            <FunnelIcon className={`w-3.5 h-3.5 ${showFilters ? 'text-white' : 'text-slate-400'}`} />
                            <span className="hidden xs:inline">Filters</span>
                            {Object.values(filters).filter(v => v !== '' && v !== false).length > 0 && (
                                <span className={`ml-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${showFilters ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                                    {Object.values(filters).filter(v => v !== '' && v !== false).length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="p-4 bg-slate-50 border-b border-slate-100 animate-fade-in shrink-0">
                        {/* ... filter content remains same ... */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {isAdmin && (
                                <div>
                                    <label className="label-style uppercase mb-1">Salesperson</label>
                                    <select value={filters.salesperson} onChange={e => setFilters({ ...filters, salesperson: e.target.value })} className="input-style !py-2 !text-xs">
                                        <option value="">All Salespersons</option>
                                        {manageableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="label-style uppercase mb-1">Month</label>
                                <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })} className="input-style !py-2 !text-xs">
                                    <option value="">All Months</option>
                                    {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-style uppercase mb-1">Enquiry Type</label>
                                <select value={filters.enquiryType} onChange={e => setFilters({ ...filters, enquiryType: e.target.value })} className="input-style !py-2 !text-xs">
                                    <option value="">All Types</option>
                                    {Object.values(ModeOfEnquiry).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-style uppercase mb-1">Source</label>
                                <select value={filters.source} onChange={e => setFilters({ ...filters, source: e.target.value })} className="input-style !py-2 !text-xs">
                                    <option value="">All Sources</option>
                                    {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Actions Bar */}
                {
                    selectedLeadIds.size > 0 && viewMode !== 'opportunities' && (
                        <div className={`bg-blue-50/80 backdrop-blur-sm p-2.5 border-b border-blue-100 flex flex-wrap items-center gap-2 sticky ${viewMode === 'opportunities' ? 'top-0' : 'top-11 md:top-14'} z-20`}>
                            <p className="text-[11px] font-black text-primary uppercase tracking-wider">{selectedLeadIds.size} SELECTED</p>
                            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="text-[10px] py-1.5 px-2 rounded-lg border-blue-200 font-bold uppercase">
                                <option value="">Status...</option>
                                {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {isAdmin && (
                                <select value={bulkAssignee} onChange={e => setBulkAssignee(e.target.value)} className="text-[10px] py-1.5 px-2 rounded-lg border-blue-200 font-bold uppercase">
                                    <option value="">Assign To...</option>
                                    {manageableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            )}
                            <button onClick={handleApplyBulkAction} disabled={!bulkStatus && !bulkAssignee} className="px-3 py-1.5 text-[10px] font-black text-white bg-primary rounded-lg uppercase tracking-widest disabled:opacity-50">
                                Apply
                            </button>
                        </div>
                    )
                }

                {/* Main View Area */}
                <div className="bg-white">
                    {viewMode === 'opportunities' ? (
                        <PipelineBoard leads={filteredLeads} users={users} onOpenModal={handleOpenModal} />
                    ) : (
                        <div>
                            <LeadsTable
                                leads={filteredLeads}
                                users={users}
                                onOpenModal={handleOpenModal}
                                selectedLeadIds={selectedLeadIds}
                                onSelectLead={handleSelectLead}
                                onSelectAll={handleSelectAll}
                                allVisibleLeadsSelected={allVisibleLeadsSelected}
                            />
                            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[10px] font-black text-center text-slate-400 tracking-widest uppercase">
                                Showing {filteredLeads.length} items based on current filters.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Lead Modal */}
            {
                showAddLead && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-start md:items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            {/* Backdrop with explicit rgba fallback to prevent black screen */}
                            <div
                                className="fixed inset-0 bg-black/50 transition-opacity"
                                aria-hidden="true"
                                onClick={() => setShowAddLead(false)}
                                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                            ></div>

                            {/* Centering trick */}
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-top md:align-middle bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full max-h-[95vh] overflow-y-auto relative z-10 w-full mx-auto">
                                <AssignLeadForm
                                    users={users}
                                    currentUser={currentUser}
                                    onAssignLead={(data) => {
                                        handleAssignLeadWithTabSwitch(data);
                                        setShowAddLead(false);
                                    }}
                                    onCancel={() => setShowAddLead(false)}
                                />
                            </div>
                        </div>
                    </div>
                )
            }

            {
                selectedLead && (
                    <LeadDetailModal
                        lead={selectedLead}
                        onClose={handleCloseModal}
                        users={users}
                        onUpdateLead={handleUpdateLeadWithTabSwitch}
                        onAddActivity={onAddActivity}
                        onDeleteActivity={onDeleteActivity}
                        currentUser={currentUser}
                        activities={activities.filter(a => a.leadId === selectedLead.id)}
                        onAddTask={onAddTask}
                        onDeleteLead={onDeleteLead}
                        projects={projects} // Pass inventory
                    />
                )
            }
        </div >
    );
};

export default LeadsPage;