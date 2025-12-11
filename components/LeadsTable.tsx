
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
}

const StatusBadge: React.FC<{ type: 'visit' | 'temp' | 'status', value?: string }> = memo(({ type, value }) => {
    if (!value) return null;

    let colorClass = 'bg-slate-100 text-slate-700 ring-slate-600/10';
    let text = value;

    if (type === 'visit') {
        switch (value.toLowerCase()) {
            case 'yes': colorClass = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'; break;
            case 'no': colorClass = 'bg-rose-50 text-rose-700 ring-rose-600/20'; break;
            case 'will come': colorClass = 'bg-amber-50 text-amber-700 ring-amber-600/20'; text = 'Will Come'; break;
        }
    } else if (type === 'temp') {
        switch (value.toLowerCase()) {
            case 'hot': colorClass = 'bg-rose-50 text-rose-700 ring-rose-600/20'; break;
            case 'warm': colorClass = 'bg-amber-50 text-amber-700 ring-amber-600/20'; break;
            case 'cold': colorClass = 'bg-sky-50 text-sky-700 ring-sky-600/20'; break;
        }
    } else if (type === 'status') {
         switch (value) {
            case LeadStatus.New: colorClass = 'bg-indigo-50 text-indigo-700 ring-indigo-700/10'; break;
            case LeadStatus.Contacted: colorClass = 'bg-amber-50 text-amber-700 ring-amber-600/20'; break;
            case LeadStatus.SiteVisitScheduled: colorClass = 'bg-sky-50 text-sky-700 ring-sky-700/10'; text = 'Visit Planned'; break;
            case LeadStatus.SiteVisitDone: colorClass = 'bg-purple-50 text-purple-700 ring-purple-700/10'; text = 'Visit Done'; break;
            case LeadStatus.Negotiation: colorClass = 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-700/10'; break;
            case LeadStatus.Booked: colorClass = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'; break;
            case LeadStatus.Booking: colorClass = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'; break;
            case LeadStatus.Cancelled: colorClass = 'bg-slate-100 text-slate-600 ring-slate-500/10'; break;
            case LeadStatus.Lost: colorClass = 'bg-rose-50 text-rose-700 ring-rose-600/10'; break;
        }
    }
    
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${colorClass}`}>
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
}

const MobileLeadCard: React.FC<LeadRowProps> = memo(({ lead, salespersonName, isSelected, onSelect, onOpenModal }) => (
    <div className={`p-4 rounded-2xl border-2 transition-all shadow-sm touch-manipulation ${isSelected ? 'bg-blue-50 border-primary/40 ring-2 ring-primary/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
        <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-1">
                    {!lead.isRead && <span className="h-2.5 w-2.5 bg-primary rounded-full flex-shrink-0 animate-pulse" title="Unread"></span>}
                    <p className="font-bold text-slate-800 truncate text-base" title={lead.customerName}>{lead.customerName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <PhoneIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <p className="text-sm font-semibold text-slate-600">{lead.mobile}</p>
                </div>
            </div>
            <input 
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer touch-manipulation flex-shrink-0 mt-1"
                checked={isSelected}
                onChange={() => onSelect(lead.id)}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-slate-100">
            <StatusBadge type="status" value={lead.status} />
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                <UserCircleIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600 truncate max-w-[100px]">{salespersonName}</span>
            </div>
        </div>
        
        <div className="mb-3 space-y-2">
            {lead.interestedProject && (
                <div className="flex items-center gap-2">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-600 font-medium truncate">{lead.interestedProject}</span>
                </div>
            )}
            {lead.status === LeadStatus.Contacted && lead.contactDate && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold">Contacted:</span>
                    <span>{new Date(lead.contactDate).toLocaleDateString()}</span>
                    {lead.contactDuration && (
                        <>
                            <span className="text-slate-400">•</span>
                            <span>{lead.contactDuration} min</span>
                        </>
                    )}
                </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
                {lead.source && (
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">{lead.source}</span>
                )}
                {lead.temperature && <StatusBadge type="temp" value={lead.temperature} />}
            </div>
        </div>
        
        <button 
            onClick={() => onOpenModal(lead)} 
            className="w-full py-3 text-sm font-bold text-primary bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-xl transition-colors touch-manipulation active:scale-[0.98]"
        >
            View Details
        </button>
    </div>
));

const DesktopLeadRow: React.FC<LeadRowProps> = memo(({ lead, salespersonName, isSelected, index, onSelect, onOpenModal }) => (
    <tr className={`group transition-all duration-150 border-b border-slate-100 last:border-none ${isSelected ? 'bg-blue-50/60 shadow-sm' : 'hover:bg-slate-50/60'}`}>
        <td className="px-3 py-3.5 pl-4">
            <input 
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                checked={isSelected}
                onChange={() => onSelect(lead.id)}
            />
        </td>
        <td className="px-3 py-3.5">
            <div className="flex items-center min-w-0">
                {!lead.isRead && <span className="h-2 w-2 bg-primary rounded-full mr-2 flex-shrink-0 animate-pulse" title="Unread"></span>}
                <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-xs truncate" title={lead.customerName}>{lead.customerName}</div>
                    <div className="text-slate-500 text-[10px] font-medium mt-0.5 truncate">{lead.mobile}</div>
                </div>
            </div>
        </td>
        <td className="px-3 py-3.5">
            <div className="text-slate-700 text-xs font-semibold">{new Date(lead.leadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
            <div className="text-slate-400 text-[10px] mt-0.5">{lead.modeOfEnquiry}</div>
            {lead.status === LeadStatus.Contacted && lead.contactDate && (
                <div className="text-slate-500 text-[10px] font-medium mt-0.5">
                    <span className="text-green-600">✓ {new Date(lead.contactDate).toLocaleDateString()}</span>
                    {lead.contactDuration && <span className="text-slate-400 ml-1">({lead.contactDuration}m)</span>}
                </div>
            )}
            {lead.source && (
                <div className="mt-1">
                    <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">{lead.source}</span>
                </div>
            )}
        </td>
        <td className="px-3 py-3.5">
            <div className="flex items-center min-w-0">
                 <div className="h-5 w-5 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700 mr-2 flex-shrink-0">
                    {salespersonName.charAt(0).toUpperCase()}
                 </div>
                 <span className="text-xs font-medium text-slate-700 truncate" title={salespersonName}>{salespersonName}</span>
            </div>
        </td>
        <td className="px-3 py-3.5">
             <StatusBadge type="status" value={lead.status} />
        </td>
        <td className="px-3 py-3.5 text-center">
            <StatusBadge type="visit" value={lead.visitStatus} />
        </td>
        <td className="px-3 py-3.5">
             <span className="text-xs font-medium text-slate-700 break-words" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }} title={lead.interestedProject || undefined}>{lead.interestedProject || '-'}</span>
        </td>
        <td className="px-3 py-3.5">
             <StatusBadge type="temp" value={lead.temperature} />
        </td>
        <td className="px-3 py-3.5">
            <span className="text-xs text-slate-500 italic group-hover:text-slate-700 break-words" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }} title={lead.lastRemark || undefined}>{lead.lastRemark || '-'}</span>
        </td>
        <td className="px-3 py-3.5 text-center">
            <button onClick={() => onOpenModal(lead)} className="text-primary hover:text-primary-focus font-bold text-xs px-2.5 py-1.5 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-all duration-150 shadow-sm hover:shadow">
                View
            </button>
        </td>
    </tr>
));

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, users, onOpenModal, selectedLeadIds, onSelectLead, onSelectAll, allVisibleLeadsSelected }) => {
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
