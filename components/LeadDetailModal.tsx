
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { StatusBadge } from './LeadsTable';
import { type Lead, type User, LeadStatus, ActivityType, type Activity, type Task } from '../types';
import { PhoneIcon, MailIcon, MapPinIcon, ChatBubbleIcon, ChatBubbleLeftRightIcon, CurrencyRupeeIcon, DocumentTextIcon, XMarkIcon, BuildingOfficeIcon } from './Icons';
import ActivityFeed from './ActivityFeed';
import { communicationService } from '../services/communicationService';
import type { Project, Unit } from '../data/inventoryData';

interface LeadDetailModalProps {
    lead: Lead;
    users: User[];
    onClose: () => void;
    onUpdateLead: (lead: Lead) => void;
    onAddActivity: (lead: Lead, activityType: ActivityType, remarks: string, duration?: number) => void;
    onDeleteActivity?: (activityId: string) => void;
    currentUser: User;
    activities: Activity[];
    onAddTask: (task: Omit<Task, 'id'>) => void;
    projects?: Project[];
    onDeleteLead?: (leadId: string) => void;
}

// --- Sub-Components ---

const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-primary text-white' : 'text-muted-content hover:bg-gray-100'}`}
    >
        {label}
    </button>
);

const DetailItem: React.FC<{ label: string, value?: string | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="bg-white p-3 rounded-lg border border-border-color">
            <p className="text-xs text-muted-content font-semibold uppercase tracking-wider">{label}</p>
            <p className="font-medium text-base-content mt-1">{value}</p>
        </div>
    );
};

const CostEstimator: React.FC = () => {
    const [size, setSize] = useState(1000);
    const [rate, setRate] = useState(2500);
    const [plc, setPlc] = useState(0);
    const [amenities, setAmenities] = useState(200000);

    const basicCost = size * rate;
    const totalCost = basicCost + plc + amenities;
    const gst = totalCost * 0.05;
    const finalAmount = totalCost + gst;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-base-content mb-4">Cost Sheet Estimator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label-style">Area (Sq.ft)</label>
                    <input type="number" value={size} onChange={e => setSize(Number(e.target.value))} className="input-style" />
                </div>
                <div>
                    <label className="label-style">Base Rate (₹/Sq.ft)</label>
                    <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} className="input-style" />
                </div>
                <div>
                    <label className="label-style">PLC / Location Charges (₹)</label>
                    <input type="number" value={plc} onChange={e => setPlc(Number(e.target.value))} className="input-style" />
                </div>
                <div>
                    <label className="label-style">Amenities & Development (₹)</label>
                    <input type="number" value={amenities} onChange={e => setAmenities(Number(e.target.value))} className="input-style" />
                </div>
            </div>
            <div className="mt-6 bg-blue-50 p-4 rounded-xl space-y-2 border border-blue-100">
                <div className="flex justify-between text-sm">
                    <span>Basic Cost</span>
                    <span>₹ {basicCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Other Charges</span>
                    <span>₹ {(plc + amenities).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>GST (5%)</span>
                    <span>₹ {gst.toLocaleString()}</span>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between font-bold text-lg text-blue-900">
                    <span>Grand Total</span>
                    <span>₹ {finalAmount.toLocaleString()}</span>
                </div>
            </div>
            <button className="button-primary mt-2">Download Quotation PDF</button>
        </div>
    );
}

// --- Modals for Communication ---

const EmailModal: React.FC<{ lead: Lead; onClose: () => void; onSend: (subject: string, body: string) => Promise<void> }> = ({ lead, onClose, onSend }) => {
    const [subject, setSubject] = useState(`Information regarding ${lead.interestedProject || 'your enquiry'}`);
    const [body, setBody] = useState(`Dear ${lead.customerName},\n\nThank you for your interest in our project. As discussed, please find the attached brochure and price list.\n\nBest regards,\nChouhan Housing`);
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        await onSend(subject, body);
        setSending(false);
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-bold">Compose Email</h3>
                <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="p-6 flex-1 space-y-4">
                <div>
                    <label className="label-style">To</label>
                    <input type="text" value={lead.email || 'No email provided'} disabled className="input-style bg-gray-100" />
                </div>
                <div>
                    <label className="label-style">Subject</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="input-style" />
                </div>
                <div className="flex-1">
                    <label className="label-style">Message</label>
                    <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} className="input-style h-64" />
                </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <button onClick={onClose} className="button-secondary !w-auto">Cancel</button>
                <button onClick={handleSend} disabled={sending || !lead.email} className="button-primary !w-auto min-w-[100px]">
                    {sending ? 'Sending...' : 'Send Email'}
                </button>
            </div>
        </div>
    );
};

const SMSModal: React.FC<{ lead: Lead; onClose: () => void; onSend: (message: string) => Promise<void> }> = ({ lead, onClose, onSend }) => {
    const [message, setMessage] = useState(`Hello ${lead.customerName}, this is regarding your enquiry for ${lead.interestedProject || 'property'}. When is a good time to talk?`);
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        await onSend(message);
        setSending(false);
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-bold">Send SMS</h3>
                <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="p-6 flex-1 space-y-4">
                <div>
                    <label className="label-style">To</label>
                    <input type="text" value={lead.mobile} disabled className="input-style bg-gray-100" />
                </div>
                <div>
                    <label className="label-style">Message</label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={6}
                        className="input-style"
                        maxLength={160}
                    />
                    <p className="text-xs text-right text-gray-500 mt-1">{message.length}/160 characters</p>
                </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <button onClick={onClose} className="button-secondary !w-auto">Cancel</button>
                <button onClick={handleSend} disabled={sending || !lead.mobile} className="button-primary !w-auto min-w-[100px]">
                    {sending ? 'Sending...' : 'Send SMS'}
                </button>
            </div>
        </div>
    );
};

// --- Main Modal Component ---

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, users, onClose, onUpdateLead, onAddActivity, currentUser, activities, onAddTask, projects, onDeleteLead, onDeleteActivity }) => {
    const [activeTab, setActiveTab] = useState('Details');

    const [newStatus, setNewStatus] = useState<LeadStatus>(lead.status);
    const [temperature, setTemperature] = useState<Lead['temperature']>(lead.temperature);
    const [nextFollowUp, setNextFollowUp] = useState(
        lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toISOString().split('T')[0] :
            (lead.contactDate ? new Date(lead.contactDate).toISOString().split('T')[0] : '')
    );
    const [createReminder, setCreateReminder] = useState(true);
    // Initialize with empty string for select (null becomes '')
    const [assignedSalespersonId, setAssignedSalespersonId] = useState(
        lead.assignedSalespersonId && lead.assignedSalespersonId !== '' ? lead.assignedSalespersonId : ''
    );

    // Booking Details State
    const [selectedBookProject, setSelectedBookProject] = useState(lead.bookedProject || lead.interestedProject || '');
    const [selectedBookUnit, setSelectedBookUnit] = useState(lead.bookedUnitId || '');

    // Activity Logging State
    const [activityType, setActivityType] = useState<ActivityType>(ActivityType.Call);
    const [remarks, setRemarks] = useState('');
    const [statusRemarks, setStatusRemarks] = useState(lead.lastRemark || ''); // Remarks for current/selected status
    const [duration, setDuration] = useState<string>(lead.contactDuration?.toString() || '');

    // Communication Modal State
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showSMSModal, setShowSMSModal] = useState(false);

    const salesperson = users.find(u => u.id === lead.assignedSalespersonId);
    const isAdmin = currentUser.role === 'Admin';
    const isBookingStage = newStatus === LeadStatus.Booking || newStatus === LeadStatus.Booked;

    // Derive available units based on selected project
    const availableUnits = useMemo(() => {
        if (!projects || !selectedBookProject) return [];
        const project = projects.find(p => p.name === selectedBookProject);
        if (!project) return [];

        // If editing an existing booking, include the currently booked unit so it doesn't disappear
        return project.units.filter(u => u.status === 'Available' || u.id === lead.bookedUnitId);
    }, [projects, selectedBookProject, lead.bookedUnitId]);

    // Auto-set next follow-up date for certain statuses if not set
    useEffect(() => {
        if (!nextFollowUp && (newStatus === LeadStatus.SiteVisitScheduled || newStatus === LeadStatus.SiteVisitDone || newStatus === LeadStatus.Negotiation)) {
            const tmrw = new Date();
            tmrw.setDate(tmrw.getDate() + 1);
            setNextFollowUp(tmrw.toISOString().split('T')[0]);
        }
    }, [newStatus]);

    // Update status remarks when status changes in dropdown
    useEffect(() => {
        // When status changes, keep the current remarks if it's the same as lead status, otherwise clear
        if (newStatus === lead.status) {
            setStatusRemarks(lead.lastRemark || '');
        }
        // If changing to a different status, keep the remarks field as is (user can add new remarks)
    }, [newStatus, lead.status, lead.lastRemark]);

    const handleUpdate = () => {
        // Validate user ID if assigning
        if (assignedSalespersonId && assignedSalespersonId !== '') {
            // Check if user exists in the users array
            const assignedUser = users.find(u => u.id === assignedSalespersonId);
            if (!assignedUser) {
                console.warn(`⚠️ Assigned salesperson ID ${assignedSalespersonId} not found in users list`);
                // Note: We don't block this, as it might be a user not currently loaded but valid in backend
            }

            // Allow local IDs for development/testing
            // const isLocalId = /^(user-|admin-)\d+$/.test(assignedSalespersonId);
            // if (isLocalId) { ... }
        }

        // If booking, validate selections
        let bookingUpdate = {};
        if (isBookingStage && isAdmin && selectedBookUnit) {
            const project = projects?.find(p => p.name === selectedBookProject);
            const unit = project?.units.find(u => u.id === selectedBookUnit);
            if (unit) {
                bookingUpdate = {
                    bookedProject: selectedBookProject,
                    bookedUnitId: unit.id,
                    bookedUnitNumber: unit.unitNumber
                };
            }
        }

        const updatedLead: Lead = {
            ...lead,
            status: newStatus,
            nextFollowUpDate: nextFollowUp ? new Date(nextFollowUp).toISOString() : undefined,
            temperature: temperature,
            // Update last remark with status remarks
            lastRemark: statusRemarks && statusRemarks.trim() ? statusRemarks : lead.lastRemark,
            // Save contact details when status is Contacted
            contactDate: newStatus === LeadStatus.Contacted && nextFollowUp
                ? new Date(nextFollowUp).toISOString()
                : (newStatus === LeadStatus.Contacted ? lead.contactDate : undefined),
            contactDuration: newStatus === LeadStatus.Contacted && duration
                ? parseInt(duration, 10)
                : (newStatus === LeadStatus.Contacted ? lead.contactDuration : undefined),
            // Send null for unassigned (empty string), or the user ID for assigned
            // Backend expects null for unassigned, not empty string
            assignedSalespersonId: assignedSalespersonId && assignedSalespersonId !== '' ? assignedSalespersonId : null,
            ...bookingUpdate
        };

        // Debug: Log assignment change
        if (lead.assignedSalespersonId !== assignedSalespersonId) {
            const assignedUser = users.find(u => u.id === assignedSalespersonId);
            console.log('📝 Lead assignment in modal:', {
                leadId: lead.id,
                customerName: lead.customerName,
                oldAssigneeId: lead.assignedSalespersonId,
                newAssigneeId: assignedSalespersonId,
                assignedUserName: assignedUser?.name || 'NOT FOUND',
                allUserIds: users.map(u => ({ id: u.id, name: u.name }))
            });
        }

        // Auto-update visit date if status implies a visit
        if (newStatus === LeadStatus.SiteVisitScheduled && updatedLead.nextFollowUpDate) {
            updatedLead.visitDate = updatedLead.nextFollowUpDate;
        }

        // Auto-set visitStatus to "Yes" when status is "Site Visit Done"
        if (newStatus === LeadStatus.SiteVisitDone) {
            updatedLead.visitStatus = 'Yes';
            console.log('✅ Auto-set visitStatus to "Yes" for Site Visit Done');
        }

        // Create activity log entry if status changed
        if (newStatus !== lead.status) {
            const statusRemark = statusRemarks && statusRemarks.trim()
                ? statusRemarks
                : `Status changed from "${lead.status}" to "${newStatus}"`;

            console.log('📝 Creating status change activity:', {
                from: lead.status,
                to: newStatus,
                remark: statusRemark
            });

            // Add activity for status change
            onAddActivity(
                lead,
                ActivityType.Note,
                `[Status Change] ${statusRemark}`,
                undefined
            );
        } else if (statusRemarks && statusRemarks.trim() && statusRemarks !== lead.lastRemark) {
            // If status didn't change but remarks were updated, also log it
            onAddActivity(
                lead,
                ActivityType.Note,
                `[Status Remark Updated] ${statusRemarks}`,
                undefined
            );
        }

        onUpdateLead(updatedLead);

        // Create a task if reminder requested and date is present
        if (createReminder && nextFollowUp) {
            const isoDate = new Date(nextFollowUp).toISOString();
            const taskDate = new Date(nextFollowUp);
            taskDate.setHours(10, 0, 0, 0); // Default 10 AM

            onAddTask({
                title: `FLUP: ${lead.customerName} (${newStatus})`,
                assignedToId: lead.assignedSalespersonId || currentUser.id,
                dueDate: taskDate.toISOString(),
                isCompleted: false,
                createdBy: currentUser.name,
                reminderDate: taskDate.toISOString(),
                hasReminded: false
            });
        }

        onClose();
    };

    const handleAddActivity = (e: React.FormEvent) => {
        e.preventDefault();
        if (!remarks.trim()) {
            alert('Please enter remarks before logging activity.');
            return;
        }

        const callDuration = activityType === ActivityType.Call && duration ? parseInt(duration, 10) : undefined;

        console.log('📝 Logging activity:', {
            leadId: lead.id,
            customerName: lead.customerName,
            type: activityType,
            remarks: remarks,
            duration: callDuration,
            currentUser: currentUser.name
        });

        // Auto-update status based on activity type for non-admin users
        let updatedStatus = lead.status;
        if (!isAdmin) {
            // If user adds a call or visit activity, automatically move to "Contacted"
            if (activityType === ActivityType.Call || activityType === ActivityType.Visit) {
                if (lead.status === LeadStatus.New) {
                    updatedStatus = LeadStatus.Contacted;
                }
            }
        }

        // Update lead status if it changed
        if (updatedStatus !== lead.status) {
            const updatedLead: Lead = {
                ...lead,
                status: updatedStatus,
                lastRemark: remarks,
                lastActivityDate: new Date().toISOString(),
                // Save contact details when auto-updating to Contacted
                contactDate: updatedStatus === LeadStatus.Contacted ? new Date().toISOString() : lead.contactDate,
                contactDuration: updatedStatus === LeadStatus.Contacted && callDuration ? callDuration : lead.contactDuration
            };
            onUpdateLead(updatedLead);
        }

        // Add the activity
        onAddActivity(lead, activityType, remarks, callDuration);

        // Clear form
        setRemarks('');
        setDuration('');

        console.log('✅ Activity logged successfully');
    };

    // --- Communication Handlers ---

    const handleSendEmail = async (subject: string, body: string) => {
        try {
            await communicationService.sendEmail(lead.email || '', subject, body);
            onAddActivity(lead, ActivityType.Email, `[Email Sent] Subject: ${subject}`, undefined);
            alert("Email sent successfully!");
        } catch (error) {
            alert("Failed to send email. Please check internet connection.");
        }
    };

    const handleSendSMS = async (message: string) => {
        try {
            await communicationService.sendSMS(lead.mobile, message);
            onAddActivity(lead, ActivityType.WhatsApp, `[SMS Sent] ${message}`, undefined); // Mapping SMS to WA/Msg for now
            alert("SMS queued for delivery.");
        } catch (error) {
            alert("Failed to send SMS.");
        }
    };

    const handleInitiateCall = async () => {
        // 1. Log the attempt immediately
        onAddActivity(lead, ActivityType.Call, "Outgoing call initiated", undefined);

        // 2. Simulate API bridge
        try {
            await communicationService.initiateCall(lead.mobile, currentUser.name); // Using name as ID for demo

            // 3. Open system dialer as fallback/confirmation
            window.location.href = `tel:${lead.mobile}`;
        } catch (e) {
            console.error(e);
        }
    };

    const getTemperatureBadge = (temp?: 'Hot' | 'Warm' | 'Cold') => {
        if (!temp) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Unqualified</span>;
        const colors = {
            'Hot': 'bg-red-100 text-red-800',
            'Warm': 'bg-orange-100 text-orange-800',
            'Cold': 'bg-blue-100 text-blue-800'
        };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[temp]}`}>{temp}</span>;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-end md:items-center" onClick={onClose}>
            <div className="bg-white w-full max-w-5xl h-[95vh] md:h-[90vh] md:rounded-3xl flex flex-col overflow-hidden relative shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>

                {/* Communication Modals Layer */}
                <Suspense fallback={null}>
                    {showEmailModal && <EmailModal lead={lead} onClose={() => setShowEmailModal(false)} onSend={async (s, b) => {
                        await communicationService.sendEmail(lead.email || '', s, b);
                        onAddActivity(lead, ActivityType.Email, `[Email Sent] Subject: ${s}`, undefined);
                    }} />}
                    {showSMSModal && <SMSModal lead={lead} onClose={() => setShowSMSModal(false)} onSend={async (m) => {
                        await communicationService.sendSMS(lead.mobile, m);
                        onAddActivity(lead, ActivityType.WhatsApp, `[SMS Sent] ${m}`, undefined);
                    }} />}
                </Suspense>

                {/* Header: Premium Drawer Header */}
                <div className="px-6 py-6 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lead.customerName}</h2>
                                <StatusBadge type="temp" value={lead.temperature} />
                            </div>
                            <div className="flex flex-wrap gap-3 items-center">
                                <span className="flex items-center text-xs font-black text-slate-400 uppercase tracking-widest"><PhoneIcon className="w-3.5 h-3.5 mr-1.5" /> {lead.mobile}</span>
                                <span className="flex items-center text-xs font-black text-slate-400 uppercase tracking-widest"><BuildingOfficeIcon className="w-3.5 h-3.5 mr-1.5" /> {lead.interestedProject || 'General Enquiry'}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-90">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Quick Access Mobile Actions */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button onClick={handleInitiateCall} className="flex-1 min-w-[120px] py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <PhoneIcon className="w-4 h-4" /> Call Now
                        </button>
                        <button onClick={() => setShowSMSModal(true)} className="flex-1 min-w-[120px] py-3 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <ChatBubbleLeftRightIcon className="w-4 h-4" /> WhatsApp
                        </button>
                        {lead.email && (
                            <button onClick={() => setShowEmailModal(true)} className="flex-1 min-w-[120px] py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
                                <MailIcon className="w-4 h-4" /> Email
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-50 px-6 shrink-0 bg-white">
                    {['Overview', 'Activity Log', 'Cost Sheet'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab === 'Overview' ? 'Details' : tab === 'Activity Log' ? 'Activity' : 'Cost')}
                            className={`px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${(activeTab === 'Details' && tab === 'Overview') || (activeTab === 'Activity' && tab === 'Activity Log') || (activeTab === 'Cost' && tab === 'Cost Sheet')
                                ? 'text-primary'
                                : 'text-slate-400'
                                }`}
                        >
                            {tab}
                            {((activeTab === 'Details' && tab === 'Overview') || (activeTab === 'Activity' && tab === 'Activity Log') || (activeTab === 'Cost' && tab === 'Cost Sheet')) && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 grad-primary rounded-t-full"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50">

                    {activeTab === 'Details' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Update Section */}
                                <div className="card p-5">
                                    <h3 className="text-lg font-bold mb-4">Update Status</h3>
                                    {newStatus !== lead.status && (
                                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-800 font-medium">
                                                ⚠️ Status will change from <span className="font-bold">{lead.status}</span> to <span className="font-bold">{newStatus}</span>
                                            </p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="label-style">Stage</label>
                                            <select
                                                value={newStatus}
                                                onChange={(e) => {
                                                    const newStatusValue = e.target.value as LeadStatus;
                                                    setNewStatus(newStatusValue);
                                                    // Keep existing remarks when switching between statuses
                                                    // Only clear if it's a new status change
                                                    if (newStatusValue === lead.status) {
                                                        setStatusRemarks(lead.lastRemark || '');
                                                    }
                                                }}
                                                className="input-style"
                                            >
                                                {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label-style">Interest Level</label>
                                            <select value={temperature || ''} onChange={(e) => setTemperature(e.target.value as Lead['temperature'])} className="input-style">
                                                <option value="">Select</option>
                                                <option value="Hot">Hot</option>
                                                <option value="Warm">Warm</option>
                                                <option value="Cold">Cold</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label-style">Next Action Date</label>
                                            <input type="date" value={nextFollowUp} onChange={e => setNextFollowUp(e.target.value)} className="input-style" />
                                        </div>
                                    </div>

                                    {/* Status Remark - Always visible for current/selected status */}
                                    <div className="mt-4 bg-gray-50 p-5 rounded-lg border-2 border-gray-300">
                                        <label className="label-style flex items-center gap-2 font-bold text-lg text-gray-900 mb-3">
                                            <DocumentTextIcon className="w-6 h-6 text-gray-700" />
                                            {newStatus !== lead.status ? (
                                                <>Status Change Remark for <span className="text-primary">{newStatus}</span></>
                                            ) : (
                                                <>Remark for <span className="text-primary">{newStatus}</span></>
                                            )}
                                        </label>
                                        <textarea
                                            value={statusRemarks}
                                            onChange={(e) => setStatusRemarks(e.target.value)}
                                            rows={6}
                                            className="input-style mt-2 text-base p-4 min-h-[150px] resize-y"
                                            placeholder={`Add detailed remarks for ${newStatus}...`}
                                        />
                                        <p className="text-sm text-gray-700 mt-3 font-medium">
                                            {newStatus !== lead.status ? (
                                                <>💡 This remark will be added to the activity log when you update the lead status.</>
                                            ) : (
                                                <>💡 Update remarks for the current status.</>
                                            )}
                                        </p>
                                    </div>

                                    {/* Assign Salesperson - Admin Only */}
                                    {isAdmin && (
                                        <div className="mt-4">
                                            <label className="label-style">Assigned Salesperson</label>
                                            <select
                                                value={assignedSalespersonId}
                                                onChange={(e) => setAssignedSalespersonId(e.target.value)}
                                                className="input-style"
                                            >
                                                <option value="">Unassigned</option>
                                                {users.filter(u => u.role === 'Salesperson').map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Admin Only: Inventory Assignment for Booking */}
                                    {isBookingStage && isAdmin && projects && (
                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                            <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center">
                                                <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                                                Finalize Inventory Assignment
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg border border-green-100">
                                                <div>
                                                    <label className="label-style">Project</label>
                                                    <select
                                                        value={selectedBookProject}
                                                        onChange={(e) => {
                                                            setSelectedBookProject(e.target.value);
                                                            setSelectedBookUnit('');
                                                        }}
                                                        className="input-style"
                                                    >
                                                        <option value="">Select Project</option>
                                                        {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="label-style">Unit Number</label>
                                                    <select
                                                        value={selectedBookUnit}
                                                        onChange={(e) => setSelectedBookUnit(e.target.value)}
                                                        className="input-style"
                                                        disabled={!selectedBookProject}
                                                    >
                                                        <option value="">Select Unit</option>
                                                        {availableUnits.map(u => (
                                                            <option key={u.id} value={u.id}>
                                                                {u.unitNumber} - {u.type} ({u.price})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Contacted Status Fields - Show when status is Contacted */}
                                    {newStatus === LeadStatus.Contacted && (
                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                            <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center">
                                                <PhoneIcon className="w-4 h-4 mr-2" />
                                                Contact Details
                                            </h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="label-style">Contact Remarks</label>
                                                    <textarea
                                                        value={remarks}
                                                        onChange={(e) => setRemarks(e.target.value)}
                                                        rows={3}
                                                        className="input-style"
                                                        placeholder="Enter conversation details, customer response, interest level, etc..."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label-style">Contact Date</label>
                                                        <input
                                                            type="date"
                                                            value={nextFollowUp || new Date().toISOString().split('T')[0]}
                                                            onChange={(e) => setNextFollowUp(e.target.value)}
                                                            className="input-style"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="label-style">Contact Duration (minutes)</label>
                                                        <input
                                                            type="number"
                                                            value={duration}
                                                            onChange={(e) => setDuration(e.target.value)}
                                                            className="input-style"
                                                            placeholder="e.g., 15"
                                                            min="1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lost Lead Fields - Show when status is Lost */}
                                    {newStatus === LeadStatus.Lost && (
                                        <div className="mt-6 pt-6 border-t border-red-100 bg-red-50/50 rounded-lg p-4">
                                            <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center">
                                                <XMarkIcon className="w-4 h-4 mr-2" />
                                                Lost Lead Details
                                            </h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="label-style">Reason for Loss</label>
                                                    <textarea
                                                        value={remarks}
                                                        onChange={(e) => setRemarks(e.target.value)}
                                                        rows={3}
                                                        className="input-style"
                                                        placeholder="Enter reason why this lead was lost (e.g., budget mismatch, location preference, competitor, etc.)"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reminder Option */}
                                    {nextFollowUp && (
                                        <div className="mt-4 flex items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            <input
                                                type="checkbox"
                                                id="createReminder"
                                                checked={createReminder}
                                                onChange={e => setCreateReminder(e.target.checked)}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                            <label htmlFor="createReminder" className="ml-2 block text-sm font-medium text-gray-900">
                                                Create an automated reminder task for this follow-up
                                            </label>
                                        </div>
                                    )}

                                    <div className="mt-4 flex justify-end">
                                        <button onClick={handleUpdate} className="button-primary !w-auto">Update Lead</button>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="card p-5">
                                    <h3 className="text-lg font-bold mb-4">Lead Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <DetailItem label="Assigned Agent" value={salesperson?.name} />
                                        <DetailItem label="Source" value={lead.modeOfEnquiry} />
                                        <DetailItem label="Budget" value={lead.budget} />
                                        <DetailItem label="Purpose" value={lead.purpose} />
                                        <DetailItem label="Property Type" value={lead.interestedUnit} />
                                        <DetailItem label="Created On" value={new Date(lead.leadDate).toLocaleDateString()} />
                                        {lead.bookedUnitNumber && <DetailItem label="Booked Unit" value={`${lead.bookedUnitNumber} (${lead.bookedProject})`} />}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Actions */}
                            <div className="space-y-4">
                                <div className="card p-4">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Communication</h3>
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleInitiateCall}
                                            className="flex items-center justify-center w-full p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors border border-green-200"
                                        >
                                            <PhoneIcon className="w-5 h-5 mr-3" /> Call Customer
                                        </button>

                                        <button
                                            onClick={() => setShowSMSModal(true)}
                                            className="flex items-center justify-center w-full p-3 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium transition-colors border border-teal-200"
                                        >
                                            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3" /> Send SMS / WhatsApp
                                        </button>

                                        {lead.email ? (
                                            <button
                                                onClick={() => setShowEmailModal(true)}
                                                className="flex items-center justify-center w-full p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors border border-blue-200"
                                            >
                                                <MailIcon className="w-5 h-5 mr-3" /> Send Email
                                            </button>
                                        ) : (
                                            <button disabled className="flex items-center justify-center w-full p-3 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                                                <MailIcon className="w-5 h-5 mr-3" /> No Email Available
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Activity' && (
                        <div className="flex flex-col gap-6 h-full">
                            <div className="card p-5 shrink-0">
                                <h3 className="text-lg font-bold mb-4">Add Note / Activity</h3>
                                <form onSubmit={handleAddActivity} className="space-y-4">
                                    <div className="flex gap-4 items-start">
                                        <select value={activityType} onChange={e => setActivityType(e.target.value as ActivityType)} className="input-style w-48 text-base py-3">
                                            {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        {activityType === ActivityType.Call && (
                                            <input
                                                type="number"
                                                value={duration}
                                                onChange={e => setDuration(e.target.value)}
                                                placeholder="Duration (min)"
                                                className="input-style w-32 text-base py-3"
                                                min="1"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="label-style font-semibold text-base mb-2">Remarks</label>
                                        <textarea
                                            value={remarks}
                                            onChange={e => setRemarks(e.target.value)}
                                            placeholder="Enter detailed remarks..."
                                            className="input-style w-full text-base p-4 min-h-[120px] resize-y"
                                            rows={5}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="submit" className="button-success !w-auto px-6 py-3 text-base font-semibold">Log Activity</button>
                                    </div>
                                </form>
                            </div>
                            <div className="card p-5 flex-1 overflow-y-auto">
                                {activities && activities.length > 0 ? (
                                    <ActivityFeed
                                        activities={activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
                                        users={users}
                                        title="Activity History"
                                        onDeleteActivity={onDeleteActivity}
                                        currentUserId={currentUser.id}
                                    />
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No activities found for this lead.</p>
                                        <p className="text-sm text-gray-400 mt-2">Add an activity using the form above.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Cost' && (
                        <div className="card p-6 max-w-2xl mx-auto">
                            <CostEstimator />
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default LeadDetailModal;