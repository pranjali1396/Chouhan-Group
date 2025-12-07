
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
    CheckCircleIcon
} from './Icons';

interface LeadsPageProps {
  viewMode?: 'leads' | 'opportunities' | 'clients';
  leads: Lead[];
  users: User[];
  currentUser: User;
  onUpdateLead: (lead: Lead) => void;
  onAddActivity: (lead: Lead, activityType: ActivityType, remarks: string, duration?: number) => void;
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
    return (
        <div 
            onClick={onClick}
            className="bg-white p-3 md:p-3 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all group relative touch-manipulation"
        >
            <div className="flex justify-between items-start mb-2.5">
                <h4 className="font-bold text-slate-800 text-sm md:text-sm truncate flex-1 pr-2" title={lead.customerName}>{lead.customerName}</h4>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {lead.temperature && (
                        <span className={`w-2.5 h-2.5 rounded-full ${lead.temperature === 'Hot' ? 'bg-red-500' : lead.temperature === 'Warm' ? 'bg-orange-400' : 'bg-blue-400'}`} title={lead.temperature}></span>
                    )}
                    {!lead.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                </div>
            </div>
            
            <div className="space-y-2 mb-3">
                <p className="text-xs md:text-xs text-slate-600 flex items-center truncate">
                    <MapPinIcon className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{lead.interestedProject || 'No Project'}</span>
                </p>
                <p className="text-xs md:text-xs text-slate-600 flex items-center">
                    <PhoneIcon className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium">{lead.mobile}</span>
                </p>
                {lead.budget && (
                    <p className="text-xs md:text-xs text-slate-700 font-semibold flex items-center">
                        <CurrencyRupeeIcon className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        {lead.budget}
                    </p>
                )}
            </div>

            <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center text-[10px] md:text-[10px] text-slate-500">
                <div className="flex items-center min-w-0">
                    <UserCircleIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    <span className="truncate max-w-[100px] md:max-w-[80px]">{user?.name || 'Admin'}</span>
                </div>
                <div className="flex items-center flex-shrink-0">
                    <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                    <span>{new Date(lead.lastActivityDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                </div>
            </div>
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
            {/* Mobile View - Vertical Stacked Accordion */}
            <div className="md:hidden space-y-3 pb-4">
                {columns.map(col => {
                    const colLeads = leads.filter(l => col.statuses.includes(l.status));
                    const isExpanded = expandedColumns.has(col.id);
                    return (
                        <div key={col.id} className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                            <button
                                onClick={() => toggleColumn(col.id)}
                                className={`w-full p-4 ${col.bg} border-l-4 ${col.color} flex justify-between items-center transition-colors`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/80">
                                        {col.icon}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800 text-sm">{col.title}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{colLeads.length} {colLeads.length === 1 ? 'deal' : 'deals'}</p>
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <MinusIcon className="w-5 h-5 text-slate-600" />
                                ) : (
                                    <PlusIcon className="w-5 h-5 text-slate-600" />
                                )}
                            </button>
                            {isExpanded && (
                                <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
                                    {colLeads.length > 0 ? (
                                        colLeads.map(lead => (
                                            <PipelineCard 
                                                key={lead.id} 
                                                lead={lead} 
                                                user={userMap.get(lead.assignedSalespersonId)}
                                                onClick={() => onOpenModal(lead)}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                            <p className="text-sm text-gray-400">No deals in this stage</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop View - Horizontal Kanban */}
            <div className="hidden md:flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] min-h-[500px] p-1">
                {columns.map(col => {
                    const colLeads = leads.filter(l => col.statuses.includes(l.status));
                    return (
                        <div key={col.id} className="flex-shrink-0 w-80 flex flex-col rounded-xl bg-gray-50/50 border border-gray-200 shadow-sm h-full">
                            <div className={`p-3 rounded-t-xl bg-slate-900 border-b border-gray-100 border-t-4 ${col.color} flex justify-between items-center sticky top-0 z-10`}>
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-md bg-white/10`}>
                                        {col.icon}
                                    </div>
                                    <h3 className="font-bold text-white text-sm">{col.title}</h3>
                                </div>
                                <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded-full">{colLeads.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {colLeads.map(lead => (
                                    <PipelineCard 
                                        key={lead.id} 
                                        lead={lead} 
                                        user={userMap.get(lead.assignedSalespersonId)}
                                        onClick={() => onOpenModal(lead)}
                                    />
                                ))}
                                {colLeads.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                                        <p className="text-xs text-gray-400">No deals in this stage</p>
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
        case 'new': return [LeadStatus.New];
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
            return [LeadStatus.New, LeadStatus.Contacted, LeadStatus.Lost, LeadStatus.Cancelled, LeadStatus.Disqualified];
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

const ImportCSV: React.FC<{onImport: Function, users: User[]}> = ({ onImport, users }) => {
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

const FilterChip: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
            isActive 
                ? 'bg-primary text-white border-primary' 
                : 'bg-base-100 text-muted-content border-border-color hover:bg-base-200'
        }`}
    >
        {label}
    </button>
);

const LeadsPage: React.FC<LeadsPageProps> = ({ viewMode = 'leads', leads, users, currentUser, onUpdateLead, onAddActivity, activities, onAssignLead, onBulkUpdate, onImportLeads, onAddTask, onDeleteLead, onLogout, onNavigate, targetLeadId, onClearTargetLead, projects = [] }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkAssignee, setBulkAssignee] = useState('');
  
  const [filters, setFilters] = useState({
    salesperson: '',
    dateRange: '',
    showUnread: false,
    showOverdue: false,
    showVisits: false,
    enquiryType: '',
    source: '',
    month: '',
  });

  const tabs = useMemo(() => getTabsForViewMode(viewMode), [viewMode]);
  
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
    // 1. Filter by View Mode (Leads vs Opps vs Clients)
    const viewModeStatuses = getStatusesForViewMode(viewMode);
    let filtered = leads.filter(l => viewModeStatuses.includes(l.status));
    
    // 2. Filter by Active Tab
    const tabStatuses = getStatusesForTab(activeTab);
    if (tabStatuses) {
        filtered = filtered.filter(l => tabStatuses.includes(l.status));
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
    if(filters.showVisits) {
        filtered = filtered.filter(l => l.status === LeadStatus.SiteVisitScheduled);
    }

    return filtered.sort((a, b) => new Date(b.leadDate).getTime() - new Date(a.leadDate).getTime());
  }, [leads, viewMode, activeTab, localSearch, filters]);

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
    <div className="p-3 md:p-4 space-y-3 md:space-y-4 h-[calc(100vh-90px)] flex flex-col overflow-hidden">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 shrink-0">
            <h1 className="text-xl md:text-2xl font-bold text-base-content capitalize">{getPageTitle()}</h1>
            <div className="flex items-center gap-2 flex-wrap">
                {/* Enabled for all users */}
                <button 
                    onClick={() => setShowAddLead(true)} 
                    className="flex items-center px-3 md:px-4 py-2 text-sm font-medium rounded-lg md:rounded-md transition-colors bg-primary text-white hover:bg-primary-focus shadow-sm active:scale-95 touch-manipulation"
                >
                    <PlusIcon className="w-4 h-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Add Lead</span>
                    <span className="sm:hidden">Add</span>
                </button>
                
                {isAdmin && (
                    <ImportCSV onImport={onImportLeads} users={users} />
                )}
                <button 
                    onClick={exportToCSV} 
                    className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 border border-border-color bg-white rounded-lg md:rounded-md hover:bg-gray-50 transition-colors active:scale-95 touch-manipulation"
                >
                    <span className="hidden sm:inline">Export</span>
                    <span className="sm:hidden">Export</span>
                </button>
            </div>
        </div>
        
        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-card border border-border-color overflow-hidden flex flex-col flex-1">
            {/* Status Tabs - Hidden for Opportunities */}
            {viewMode !== 'opportunities' && (
                <div className="border-b border-border-color overflow-x-auto scrollbar-hide shrink-0">
                    <div className="flex min-w-max px-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === tab.id 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-muted-content hover:text-base-content hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Search and Filter Toolbar */}
            <div className="p-3 md:p-4 border-b border-border-color flex flex-col lg:flex-row gap-3 md:gap-4 items-start lg:items-center justify-between bg-gray-50/50 shrink-0">
                <div className="relative w-full lg:w-96">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="w-4 h-4 md:w-4 md:h-4 text-gray-500" />
                    </span>
                    <input 
                        type="text" 
                        placeholder="Search leads..." 
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-full py-2.5 md:py-2 pl-10 md:pl-9 pr-4 text-sm bg-white border border-gray-300 md:border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder-gray-500 text-black touch-manipulation"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <FilterChip label="Unread" isActive={filters.showUnread} onClick={() => setFilters(f => ({...f, showUnread: !f.showUnread}))} />
                    <FilterChip label="Overdue" isActive={filters.showOverdue} onClick={() => setFilters(f => ({...f, showOverdue: !f.showOverdue}))} />
                    <FilterChip label="Visits" isActive={filters.showVisits} onClick={() => setFilters(f => ({...f, showVisits: !f.showVisits}))} />
                    
                    <div className="h-6 w-px bg-border-color mx-1 hidden sm:block"></div>
                    
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors touch-manipulation active:scale-95 ${
                            showFilters 
                                ? 'bg-blue-50 text-primary border-primary' 
                                : 'bg-white text-base-content border-border-color hover:bg-gray-50'
                        }`}
                    >
                        {showFilters ? <XMarkIcon className="w-4 h-4 mr-1.5" /> : <FunnelIcon className="w-4 h-4 mr-1.5" />}
                        <span className="hidden xs:inline">Filters</span>
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="p-3 md:p-4 bg-gray-50 border-b border-border-color animate-in fade-in slide-in-from-top-2 duration-200 shrink-0 max-h-[50vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {isAdmin && (
                            <div>
                                <label className="block text-xs font-semibold text-muted-content mb-1.5">Salesperson</label>
                                <select value={filters.salesperson} onChange={e => setFilters({...filters, salesperson: e.target.value})} className="filter-select w-full py-2.5 md:py-2 text-sm touch-manipulation">
                                    <option value="">All Salespersons</option>
                                    {manageableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-muted-content mb-1.5">Month</label>
                            <select value={filters.month} onChange={e => setFilters({...filters, month: e.target.value})} className="filter-select w-full py-2.5 md:py-2 text-sm touch-manipulation">
                                <option value="">All Months</option>
                                {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-content mb-1.5">Enquiry Type</label>
                            <select value={filters.enquiryType} onChange={e => setFilters({...filters, enquiryType: e.target.value})} className="filter-select w-full py-2.5 md:py-2 text-sm touch-manipulation">
                                <option value="">All Types</option>
                                {Object.values(ModeOfEnquiry).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-content mb-1.5">Source</label>
                            <select value={filters.source} onChange={e => setFilters({...filters, source: e.target.value})} className="filter-select w-full py-2.5 md:py-2 text-sm touch-manipulation">
                                <option value="">All Sources</option>
                                {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                         <div className="flex items-end sm:col-span-2 lg:col-span-1">
                            <button onClick={resetFilters} className="text-sm text-danger hover:underline py-2 px-2 touch-manipulation active:scale-95">Clear all filters</button>
                         </div>
                    </div>
                </div>
            )}

            {/* Bulk Actions Bar */}
            {selectedLeadIds.size > 0 && viewMode !== 'opportunities' && (
                <div className="bg-blue-50/80 backdrop-blur-sm p-3 border-b border-blue-100 flex flex-wrap items-center gap-3 sticky top-0 z-10 shrink-0">
                    <p className="text-sm font-semibold text-primary">{selectedLeadIds.size} selected</p>
                    <div className="h-4 w-px bg-blue-200 mx-1"></div>
                    <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="text-sm py-1.5 px-3 rounded-md border-blue-200 focus:ring-primary">
                        <option value="">Change Status...</option>
                        {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isAdmin && (
                        <select value={bulkAssignee} onChange={e => setBulkAssignee(e.target.value)} className="text-sm py-1.5 px-3 rounded-md border-blue-200 focus:ring-primary">
                            <option value="">Assign To...</option>
                            {manageableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    )}
                    <button onClick={handleApplyBulkAction} disabled={!bulkStatus && !bulkAssignee} className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-focus disabled:opacity-50">
                        Apply
                    </button>
                    <button onClick={() => setSelectedLeadIds(new Set())} className="ml-auto text-sm text-muted-content hover:text-base-content">
                        Cancel
                    </button>
                </div>
            )}

            {/* Main View Area */}
            {viewMode === 'opportunities' ? (
                <div className="flex-1 overflow-y-auto bg-slate-100/50 p-2 md:p-4">
                    <PipelineBoard leads={filteredLeads} users={users} onOpenModal={handleOpenModal} />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <LeadsTable 
                        leads={filteredLeads} 
                        users={users} 
                        onOpenModal={handleOpenModal}
                        selectedLeadIds={selectedLeadIds}
                        onSelectLead={handleSelectLead}
                        onSelectAll={handleSelectAll}
                        allVisibleLeadsSelected={allVisibleLeadsSelected}
                    />
                    <div className="p-3 md:p-3 border-t border-border-color bg-gray-50 text-xs text-center text-muted-content sticky bottom-0">
                        Showing {filteredLeads.length} {filteredLeads.length === 1 ? 'item' : 'items'} based on current filters.
                    </div>
                </div>
            )}
        </div>
      
        {/* Add Lead Modal */}
        {showAddLead && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowAddLead(false)}></div>
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                        <AssignLeadForm 
                            users={users}
                            currentUser={currentUser}
                            onAssignLead={(data) => {
                                onAssignLead(data);
                                setShowAddLead(false);
                            }}
                            onCancel={() => setShowAddLead(false)}
                        />
                    </div>
                </div>
            </div>
        )}

        {selectedLead && (
            <LeadDetailModal 
                lead={selectedLead} 
                onClose={handleCloseModal}
                users={users}
                onUpdateLead={onUpdateLead}
                onAddActivity={onAddActivity}
                currentUser={currentUser}
                activities={activities.filter(a => a.leadId === selectedLead.id)}
                onAddTask={onAddTask}
                onDeleteLead={onDeleteLead}
                projects={projects} // Pass inventory
            />
        )}
    </div>
  );
};

export default LeadsPage;