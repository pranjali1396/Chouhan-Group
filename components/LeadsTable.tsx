
import React, { memo } from 'react';
import type { Lead, User } from '../types';
import { LeadStatus } from '../types';
import { PhoneIcon, MapPinIcon, UserCircleIcon } from './Icons';

interface LeadsTableProps {
    leads: Lead[];
    users: User[];
    onOpenModal: (lead: Lead) => void;
    selectedLeadIds: Set<string>;
    onSelectLead: (leadId: string) => void;
    onSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
    allVisibleLeadsSelected: boolean;
    onDeleteLead?: (leadId: string) => void;
}

export const StatusBadge: React.FC<{
    type: 'status' | 'temp' | 'visit';
    value?: string | null;
}> = memo(({ type, value }) => {
    if (!value) return null;

    let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
    let text = value;

    if (type === 'visit') {
        switch (value.toLowerCase()) {
            case 'yes': colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100'; text = 'Visit Done'; break;
            case 'no': colorClass = 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100'; text = 'No Visit'; break;
            case 'will come': colorClass = 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-100'; text = 'Will Come'; break;
            case 'planned': colorClass = 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm shadow-sky-100'; text = 'Planned'; break;
        }
    } else if (type === 'temp') {
        switch (value.toLowerCase()) {
            case 'hot': colorClass = 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-100 animate-pulse-subtle'; break;
            case 'warm': colorClass = 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm shadow-orange-100'; break;
            case 'cold': colorClass = 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-100'; break;
        }
    } else if (type === 'status') {
        switch (value) {
            case LeadStatus.New: colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm shadow-indigo-100 font-black'; text = 'NEW LEAD'; break;
            case LeadStatus.Qualified: colorClass = 'bg-violet-50 text-violet-700 border-violet-200 shadow-sm shadow-violet-100'; break;
            case LeadStatus.Contacted: colorClass = 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-100'; break;
            case LeadStatus.SiteVisitScheduled: colorClass = 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm shadow-sky-100'; text = 'VISIT PLANNED'; break;
            case LeadStatus.SiteVisitDone: colorClass = 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm shadow-teal-100'; text = 'VISIT DONE'; break;
            case LeadStatus.Negotiation: colorClass = 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 shadow-sm shadow-fuchsia-100'; break;
            case LeadStatus.Booking: colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100'; text = 'BOOKING'; break;
            case LeadStatus.Cancelled: colorClass = 'bg-slate-100 text-slate-500 border-slate-200'; break;
            case LeadStatus.Lost: colorClass = 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100'; break;
        }
    }

    return (
        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold border transition-all duration-300 uppercase tracking-tight ${colorClass}`}>
            {text}
        </span>
    );
});

interface LeadRowProps {
    lead: Lead;
    salespersonName: string;
    isSelected: boolean;
    index: number;
    onSelect: (id: string) => void;
    onOpenModal: (lead: Lead) => void;
    onDeleteLead?: (leadId: string) => void;
}

const MobileLeadCard: React.FC<LeadRowProps> = memo(({ lead, salespersonName, isSelected, onSelect, onOpenModal, onDeleteLead }) => (
    <div
        onClick={() => onOpenModal(lead)}
        className={`p-3 rounded-2xl border-2 transition-all duration-300 shadow-sm relative overflow-hidden active:scale-[0.98] ${isSelected ? 'bg-indigo-50/50 border-primary/30 ring-4 ring-primary/5' : 'bg-white border-slate-100'}`}
    >
        {/* Selection Checkbox - Made larger for touch */}
        <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
            <input
                type="checkbox"
                className="h-5 w-5 rounded-lg border-slate-300 text-primary focus:ring-primary cursor-pointer transition-transform hover:scale-110 active:scale-125 shadow-sm"
                checked={isSelected}
                onChange={() => onSelect(lead.id)}
            />
        </div>

        <div className="flex flex-col gap-2.5">
            {/* Header: Name & Status */}
            <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${!lead.isRead ? 'bg-primary animate-pulse shadow-sm shadow-primary/50' : 'bg-transparent'}`}></span>
                    <h3 className="font-black text-slate-900 text-[13px] leading-tight truncate pr-8">{lead.customerName}</h3>
                </div>
                <div className="flex flex-wrap gap-1 items-center">
                    <StatusBadge type="status" value={lead.status} />
                    <StatusBadge type="temp" value={lead.temperature} />
                </div>
            </div>

            {/* Content: Mobile, Salesperson, Project */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                    <p className="text-[11px] font-black text-slate-700 tabular-nums">{lead.mobile}</p>
                </div>
                <div className="space-y-0.5 border-l border-slate-200 pl-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Assignee</p>
                    <div className="flex items-center gap-1 min-w-0">
                        <div className="w-4 h-4 rounded-full grad-primary flex items-center justify-center text-[7px] font-black text-white shrink-0">
                            {salespersonName.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-[10px] font-black text-slate-600 truncate">{salespersonName}</p>
                    </div>
                </div>
            </div>

            {/* Footer: Date & Details */}
            <div className="flex items-center justify-between pt-1">
                <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Enquiry Date</p>
                    <p className="text-[10px] font-black text-slate-600 uppercase">
                        {new Date(lead.leadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>

                {lead.interestedProject ? (
                    <div className="text-right max-w-[50%]">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Project</p>
                        <p className="text-[10px] font-black text-primary truncate uppercase">{lead.interestedProject}</p>
                    </div>
                ) : (
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Source</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase">{lead.source || 'Direct'}</p>
                    </div>
                )}
            </div>

            {/* Detailed View CTA */}
            <button
                onClick={() => onOpenModal(lead)}
                className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md transition-all active:scale-[0.97] flex items-center justify-center gap-1.5"
            >
                View Full Log
            </button>
        </div>
    </div>
));

const DesktopLeadRow: React.FC<LeadRowProps> = memo(({ lead, salespersonName, isSelected, index, onSelect, onOpenModal, onDeleteLead }) => (
    <tr
        onClick={() => onOpenModal(lead)}
        className={`group transition-all duration-200 border-b border-slate-100 last:border-none cursor-pointer ${isSelected ? 'bg-primary/5 shadow-sm' : 'hover:bg-slate-50'}`}
    >
        <td className="px-3 py-4 pl-4" onClick={(e) => e.stopPropagation()}>
            <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-transform hover:scale-110"
                checked={isSelected}
                onChange={() => onSelect(lead.id)}
            />
        </td>
        <td className="px-3 py-4">
            <div className="flex items-center min-w-0">
                <span className={`h-2.5 w-2.5 rounded-full mr-2.5 flex-shrink-0 ${!lead.isRead ? 'bg-primary animate-pulse shadow-sm shadow-primary/50' : 'bg-transparent'}`} title={lead.isRead ? 'Read' : 'Unread'}></span>
                <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-[13px] truncate group-hover:text-primary transition-colors" title={lead.customerName}>{lead.customerName}</div>
                    <div className="text-slate-400 text-[10px] font-bold mt-0.5 tracking-tight tabular-nums">{lead.mobile}</div>
                </div>
            </div>
        </td>
        <td className="px-3 py-4">
            <div className="text-slate-700 text-[11px] font-bold tracking-tight uppercase">{new Date(lead.leadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            {(() => {
                const displayMode = lead.modeOfEnquiry === 'Digital' ? 'Website' : lead.modeOfEnquiry;
                return <div className="text-slate-400 text-[10px] font-medium mt-0.5 tracking-wide uppercase">{displayMode}</div>;
            })()}
        </td>
        <td className="px-3 py-4">
            <div className="flex items-center min-w-0 bg-slate-50/50 p-1 rounded-lg border border-transparent group-hover:border-slate-100 group-hover:bg-white transition-all">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-black text-slate-600 mr-2 flex-shrink-0 border border-white shadow-sm">
                    {salespersonName.charAt(0).toUpperCase()}
                </div>
                <span className="text-[11px] font-bold text-slate-600 truncate uppercase tracking-tighter" title={salespersonName}>{salespersonName}</span>
            </div>
        </td>
        <td className="px-3 py-4">
            <StatusBadge type="status" value={lead.status} />
        </td>
        <td className="px-3 py-4 text-center">
            <StatusBadge type="visit" value={lead.visitStatus} />
        </td>
        <td className="px-3 py-4">
            <span className="text-[11px] font-bold text-slate-700 leading-tight block truncate max-w-[120px]" title={lead.interestedProject || undefined}>{lead.interestedProject || '-'}</span>
            {lead.source && lead.source !== lead.modeOfEnquiry && (
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block truncate">{lead.source}</span>
            )}
        </td>
        <td className="px-3 py-4">
            <StatusBadge type="temp" value={lead.temperature} />
        </td>
        <td className="px-3 py-4">
            <span className="text-[11px] text-slate-500 font-medium italic leading-relaxed line-clamp-2 max-w-[150px]" title={lead.lastRemark || undefined}>
                {lead.lastRemark || <span className="text-slate-300 not-italic">No remarks...</span>}
            </span>
        </td>
        <td className="px-3 py-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center gap-1">
                <button
                    onClick={() => onOpenModal(lead)}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-black text-[10px] px-2.5 py-1.5 rounded-lg transition-all duration-200 shadow-sm uppercase tracking-tighter active:scale-95"
                >
                    Edit
                </button>
                {onDeleteLead && (
                    <button
                        onClick={() => {
                            if (window.confirm('Delete this lead?')) {
                                onDeleteLead(lead.id);
                            }
                        }}
                        className="bg-white border border-red-200 text-red-600 hover:bg-red-50 font-black text-[10px] px-2.5 py-1.5 rounded-lg transition-all duration-200 shadow-sm uppercase tracking-tighter active:scale-95 ml-1"
                    >
                        Delete
                    </button>
                )}
            </div>
        </td>
    </tr>
));

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, users, onOpenModal, selectedLeadIds, onSelectLead, onSelectAll, allVisibleLeadsSelected, onDeleteLead }) => {
    const userMap = new Map<string, string>(users.map(user => [user.id, user.name]));

    // Helper function to get salesperson name with better error handling
    const getSalespersonName = (assignedId: string | null | undefined, leadId?: string): string => {
        if (!assignedId || assignedId === '' || assignedId === 'admin-0') {
            return 'Unassigned';
        }

        // Try exact match first
        const name = userMap.get(assignedId);
        if (name) {
            return name;
        }

        // Debug: log when user ID is not found
        console.warn('⚠️ User ID not found in userMap:', {
            assignedId,
            assignedIdType: typeof assignedId,
            assignedIdLength: assignedId?.length,
            availableUserIds: Array.from(userMap.keys()),
            availableUserNames: Array.from(userMap.values()),
            allUsers: users.map(u => ({ id: u.id, name: u.name, idType: typeof u.id })),
            leadId: leadId || leads.find(l => l.assignedSalespersonId === assignedId)?.id,
            leadCustomerName: leads.find(l => l.assignedSalespersonId === assignedId)?.customerName
        });

        // Try to find by name as fallback (in case ID format is different)
        const user = users.find(u => {
            // Try exact ID match
            if (u.id === assignedId) return true;
            // Try string comparison (case-insensitive)
            if (String(u.id).toLowerCase() === String(assignedId).toLowerCase()) return true;
            // Try name match (in case someone assigned by name instead of ID)
            if (u.name === assignedId) return true;
            return false;
        });

        if (user) {
            console.log('✅ Found user by fallback method:', user.name);
            return user.name;
        }

        // Don't show "Unknown", show "Unassigned" instead
        return 'Unassigned';
    };

    if (leads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="bg-slate-50 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">No leads found</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your filters or add a new lead to get started.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Mobile View */}
            <div className="md:hidden space-y-3 p-1">
                <div className="flex items-center px-2 pb-2">
                    <input
                        type="checkbox"
                        id="select-all-mobile"
                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        onChange={onSelectAll}
                        checked={allVisibleLeadsSelected}
                    />
                    <label htmlFor="select-all-mobile" className="ml-3 text-sm font-bold text-slate-700">
                        Select All
                    </label>
                </div>
                {leads.map((lead, index) => (
                    <MobileLeadCard
                        key={lead.id}
                        lead={lead}
                        index={index}
                        salespersonName={getSalespersonName(lead.assignedSalespersonId, lead.id)}
                        isSelected={selectedLeadIds.has(lead.id)}
                        onSelect={onSelectLead}
                        onOpenModal={onOpenModal}
                    />
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                <table className="min-w-full divide-y divide-slate-100 table-fixed">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 backdrop-blur-sm border-b-2 border-slate-200">
                        <tr>
                            <th scope="col" className="px-3 py-3.5 pl-4 text-left w-12">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    onChange={onSelectAll}
                                    checked={allVisibleLeadsSelected}
                                />
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-32">Customer</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-32">Date & Source</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-28">Assignee</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-28">Status</th>
                            <th scope="col" className="px-3 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-24">Visit</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-32">Project</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-24">Temp</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-40">Remark</th>
                            <th scope="col" className="relative px-3 py-3.5 pr-4 text-center w-20">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {leads.map((lead, index) => (
                            <DesktopLeadRow
                                key={lead.id}
                                lead={lead}
                                index={index}
                                salespersonName={getSalespersonName(lead.assignedSalespersonId, lead.id)}
                                isSelected={selectedLeadIds.has(lead.id)}
                                onSelect={onSelectLead}
                                onOpenModal={onOpenModal}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadsTable;
