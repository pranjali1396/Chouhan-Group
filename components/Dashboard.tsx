
import React, { useState, useMemo } from 'react';
import { MetricCard, MetricGrid } from './MetricSection';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Lead, User, Activity, LeadStatus, Task } from '../types';
import { InformationCircleIcon, BuildingOfficeIcon, BellIcon, AlertTriangleIcon, MapPinIcon, CalendarIcon, PhoneIcon, CheckCircleIcon, UsersIcon, ChartBarIcon } from './Icons';
import { Project } from '../data/inventoryData';
// Actually I don't have lucide-react available in Icons.tsx imports check. 
// I will create a simple RefreshIcon inline or use one if available.
// Let's check Icons.tsx again... I don't see Refresh there.
// I will create a simple SVG for Refresh in the component or add to Icons.tsx.
// For now, let's just make a simple SVG in MetricCard.

interface DashboardProps {
    leads: Lead[];
    users: User[];
    activities: Activity[];
    tasks: Task[]; // Added tasks prop
    projects: Project[];
    currentUser: User;
    onLogout: () => void;
    onNavigate: (view: string) => void;
}

const KpiCard: React.FC<{ title: string, value: string | number, className?: string }> = ({ title, value, className = '' }) => (
    <div className={`bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-card border border-slate-100 hover:shadow-card-hover transition-shadow ${className}`}>
        <p className="text-[9px] md:text-sm font-black text-slate-500 uppercase tracking-widest">{title}</p>
        <p className="text-xl md:text-3xl font-black text-slate-800 mt-1 md:mt-2 tracking-tighter">{value}</p>
    </div>
);

const LeadsTrendChart: React.FC<{ leads: Lead[] }> = ({ leads }) => {
    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 8 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
        }).reverse();

        const leadsByDay = leads.reduce((acc, lead) => {
            const date = new Date(lead.leadDate).toLocaleDateString('en-CA');
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return last7Days.map(dateStr => {
            const d = new Date(dateStr);
            return {
                name: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
                leads: leadsByDay[dateStr] || 0,
            };
        });
    }, [leads]);

    return (
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-card border border-slate-100">
            <div className="mb-3 md:mb-6">
                <h3 className="text-sm md:text-lg font-black text-slate-800 uppercase tracking-tight">Lead Acquisition</h3>
                <p className="text-[10px] md:text-sm text-slate-500 font-bold uppercase tracking-widest opacity-60">Past 7 days volume</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="leads"
                        stroke="#2563eb"
                        strokeWidth={4}
                        dot={{ r: 4, fill: '#fff', stroke: '#2563eb', strokeWidth: 2 }}
                        activeDot={{ r: 8, fill: '#2563eb' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const SalesFunnelView: React.FC<{ leads: Lead[] }> = ({ leads }) => {
    const funnelStages = [
        { name: LeadStatus.New, color: 'bg-indigo-500', width: 'w-full' },
        { name: LeadStatus.Qualified, color: 'bg-blue-500', width: 'w-[90%]' },
        { name: LeadStatus.SiteVisitScheduled, color: 'bg-sky-500', width: 'w-[80%]' },
        { name: LeadStatus.ProposalSent, color: 'bg-teal-500', width: 'w-[70%]' },
        { name: LeadStatus.Negotiation, color: 'bg-emerald-500', width: 'w-[60%]' },
        { name: LeadStatus.Booking, color: 'bg-green-600', width: 'w-[50%]' },
    ];

    const leadCounts = useMemo(() => {
        return funnelStages.map(stage => {
            const count = leads.filter(l => l.status === stage.name).length;
            return { ...stage, count };
        });
    }, [leads]);

    return (
        <div className="p-3 md:p-6 space-y-2 md:space-y-3">
            {leadCounts.map((stage, index) => (
                <div key={index} className="flex items-center group">
                    <div className="w-24 md:w-32 text-[10px] md:text-sm font-black text-slate-500 truncate pr-2 md:pr-4 uppercase">{stage.name}</div>
                    <div className="flex-1 h-8 md:h-10 bg-slate-50 rounded-lg overflow-hidden relative">
                        <div
                            className={`h-full ${stage.color} rounded-lg flex items-center justify-between px-3 md:px-4 text-white text-[10px] md:text-sm font-black shadow-sm transition-all duration-500 group-hover:brightness-110`}
                            style={{ width: `${Math.max(stage.count > 0 ? 15 : 0, Math.min(100, (stage.count / leads.length) * 100))}%` }}
                        >
                            <span>{stage.count}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const LabelwiseView: React.FC<{ leads: Lead[] }> = ({ leads }) => {
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

    const labelData = useMemo(() => {
        const counts: Record<string, number> = {};
        leads.forEach(lead => {
            (lead.labels || []).forEach(label => {
                counts[label] = (counts[label] || 0) + 1;
            });
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
    }, [leads]);

    const total = labelData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="p-3 md:p-6 flex flex-col sm:row items-center">
            <div className="w-full sm:w-1/2 h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={labelData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {labelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-1 md:space-y-3 mt-2 md:mt-0 md:pl-6 w-full">
                {labelData.map((entry, index) => (
                    <div key={entry.name} className="flex justify-between items-center text-[10px] md:text-sm p-1.5 md:p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center">
                            <span className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <span className="text-slate-700 font-black uppercase tracking-tight">{entry.name}</span>
                        </div>
                        <div className="text-slate-500 font-black">
                            {entry.value} <span className="text-[8px] opacity-60">({total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0}%)</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const LeadsDashboardTab: React.FC<{ leads: Lead[] }> = ({ leads }) => {
    const [activeSubTab, setActiveSubTab] = useState('Sales funnels');

    const { total, contacted, newLeads } = useMemo(() => {
        const total = leads.length;
        const contacted = leads.filter(l => l.status !== LeadStatus.New).length;
        const newLeads = total - contacted;
        return { total, contacted, newLeads };
    }, [leads]);

    const conversionRate = total > 0 ? (leads.filter(l => l.status === LeadStatus.Booking).length / total * 100).toFixed(1) : 0;
    const contactedRate = total > 0 ? (contacted / total * 100).toFixed(0) : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Metrics removed from here, moved to header level */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <LeadsTrendChart leads={leads} />
                </div>
                <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden flex flex-col">
                    <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 m-2 rounded-xl">
                        {['Sales funnels', 'Labelwise'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveSubTab(tab)}
                                className={`flex-1 py-2 text-xs font-bold text-center rounded-lg transition-all ${activeSubTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1">
                        {activeSubTab === 'Sales funnels' && <SalesFunnelView leads={leads} />}
                        {activeSubTab === 'Labelwise' && <LabelwiseView leads={leads} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InventoryMetricsHeader: React.FC<{ projects: Project[] }> = ({ projects }) => {
    const stats = useMemo(() => {
        let total = 0;
        let available = 0;
        let booked = 0;
        let totalValue = 0;
        projects.forEach(p => {
            total += p.units.length;
            p.units.forEach(u => {
                if (u.status === 'Available') {
                    available++;
                    const priceVal = parseFloat(u.price.split(' ')[0]);
                    if (!isNaN(priceVal)) totalValue += priceVal;
                } else if (u.status === 'Booked') {
                    booked++;
                }
            });
        });
        return { total, available, booked, totalValue };
    }, [projects]);

    return (
        <MetricGrid>
            <MetricCard title="Total Inventory" value={stats.total} icon={<BuildingOfficeIcon className="w-6 h-6 text-white" />} colorClass="bg-slate-700" />
            <MetricCard title="Available Units" value={stats.available} icon={<CheckCircleIcon className="w-6 h-6 text-white" />} colorClass="bg-emerald-600" />
            <MetricCard title="Sold/Booked" value={stats.booked} icon={<BuildingOfficeIcon className="w-6 h-6 text-white" />} colorClass="bg-blue-600" />
            <MetricCard title="Available Value" value={`₹${stats.totalValue.toFixed(0)} L`} icon={<BuildingOfficeIcon className="w-6 h-6 text-white" />} colorClass="bg-purple-600" />
        </MetricGrid>
    );
};

const InventoryDashboardTab: React.FC<{ projects: Project[] }> = ({ projects }) => {
    const stats = useMemo(() => {
        let total = 0;
        let available = 0;
        let booked = 0;
        let totalValue = 0; // Estimate

        projects.forEach(p => {
            total += p.units.length; // Use actual unit count
            p.units.forEach(u => {
                if (u.status === 'Available') {
                    available++;
                    // Try parse price for estimate
                    const priceVal = parseFloat(u.price.split(' ')[0]);
                    if (!isNaN(priceVal)) totalValue += priceVal;
                } else if (u.status === 'Booked') {
                    booked++;
                }
            });
        });

        return { total, available, booked, totalValue };
    }, [projects]);

    const projectData = useMemo(() => {
        return projects.map(p => ({
            name: p.name,
            Available: p.units.filter(u => u.status === 'Available').length,
            Booked: p.units.filter(u => u.status === 'Booked').length,
        })).sort((a, b) => b.Available - a.Available);
    }, [projects]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Metrics moved to InventoryMetricsHeader */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Project Availability</h3>
                            <p className="text-sm text-slate-500">Inventory distribution by project</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            <Legend />
                            <Bar dataKey="Available" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            <Bar dataKey="Booked" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Inventory Summary</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Project Name</th>
                                    <th className="px-4 py-3 text-center">Total</th>
                                    <th className="px-4 py-3 text-center">Available</th>
                                    <th className="px-4 py-3 text-center">% Free</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((p, idx) => {
                                    const total = p.units.length;
                                    const avail = p.units.filter(u => u.status === 'Available').length;
                                    const percent = total > 0 ? Math.round((avail / total) * 100) : 0;
                                    return (
                                        <tr key={p.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[150px]" title={p.name}>{p.name}</td>
                                            <td className="px-4 py-3 text-center">{total}</td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-600">{avail}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-200">
                                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CallsMetricsHeader: React.FC<{ activities: Activity[] }> = ({ activities }) => {
    const stats = useMemo(() => {
        const calls = activities.filter(a => a.type === 'Call');
        const uniqueLeads = new Set(calls.map(c => c.leadId)).size;
        return {
            total: calls.length,
            unique: uniqueLeads,
            last24h: calls.filter(c => {
                const d = new Date(c.timestamp);
                const now = new Date();
                return (now.getTime() - d.getTime()) < 24 * 60 * 60 * 1000;
            }).length
        };
    }, [activities]);

    return (
        <MetricGrid>
            <MetricCard title="Total Calls" value={stats.total} icon={<PhoneIcon className="w-6 h-6 text-white" />} colorClass="bg-amber-600" />
            <MetricCard title="Unique Prospects" value={stats.unique} icon={<UsersIcon className="w-6 h-6 text-white" />} colorClass="bg-blue-600" />
            <MetricCard title="Last 24 Hours" value={stats.last24h} icon={<BellIcon className="w-6 h-6 text-white" />} colorClass="bg-indigo-600" />
            <MetricCard title="Follow-ups" value="12" icon={<CalendarIcon className="w-6 h-6 text-white" />} colorClass="bg-emerald-600" />
        </MetricGrid>
    );
};

const CallsDashboardTab: React.FC<{ activities: Activity[] }> = ({ activities }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Metrics moved to CallsMetricsHeader */}

            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-slate-500 font-medium italic">Call duration and outcome analytics will appear here as more data is collected.</p>
            </div>
        </div>
    );
};

const CheckinMetricsHeader: React.FC = () => {
    return (
        <MetricGrid>
            <MetricCard title="Total Team" value="12" icon={<UsersIcon className="w-6 h-6 text-white" />} colorClass="bg-indigo-600" />
            <MetricCard title="Present Today" value="8" icon={<CheckCircleIcon className="w-6 h-6 text-white" />} colorClass="bg-emerald-600" trend="+2 today" />
            <MetricCard title="Late Arrivals" value="2" icon={<BellIcon className="w-6 h-6 text-white" />} colorClass="bg-amber-600" />
            <MetricCard title="On Leave" value="2" icon={<MapPinIcon className="w-6 h-6 text-white" />} colorClass="bg-rose-600" />
        </MetricGrid>
    );
};

const CheckinDashboardTab: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Metrics moved to CheckinMetricsHeader */}

            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-slate-500 font-medium">Daily attendance heatmaps and punctuality reports are currently being generated.</p>
            </div>
        </div>
    );
};

const SalesMetricsHeader: React.FC<{ leads: Lead[] }> = ({ leads }) => {
    const stats = useMemo(() => {
        const bookings = leads.filter(l => l.status === LeadStatus.Booking);
        const revenue = bookings.reduce((acc, l) => acc + (parseFloat((l.budget || '0').replace(/[^0-9.]/g, '')) || 0), 0);
        return {
            count: bookings.length,
            revenue: revenue > 100 ? `${(revenue / 100).toFixed(1)} Cr` : `${revenue.toFixed(1)} L`,
            conversion: leads.length > 0 ? ((bookings.length / leads.length) * 100).toFixed(1) : 0
        };
    }, [leads]);

    return (
        <MetricGrid>
            <MetricCard title="Booked Revenue" value={stats.revenue} icon={<BuildingOfficeIcon className="w-6 h-6 text-white" />} colorClass="bg-emerald-600" trend="This Month" />
            <MetricCard title="Total Bookings" value={stats.count} icon={<CheckCircleIcon className="w-6 h-6 text-white" />} colorClass="bg-indigo-600" />
            <MetricCard title="Conversion Rate" value={`${stats.conversion}%`} icon={<ChartBarIcon className="w-6 h-6 text-white" />} colorClass="bg-blue-600" />
            <MetricCard title="Active Pipeline" value={leads.length} icon={<UsersIcon className="w-6 h-6 text-white" />} colorClass="bg-purple-600" />
        </MetricGrid>
    );
};

const SalesDashboardTab: React.FC<{ leads: Lead[] }> = ({ leads }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Metrics moved to SalesMetricsHeader */}

            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-slate-500 font-medium">Detailed revenue forecasts and agent performance tables are accessible via the full Sales Report page.</p>
            </div>
        </div>
    );
};

const DetailedMetricsGrid: React.FC<{ leads: Lead[], tasks: Task[], activities: Activity[], onNavigate: (view: string) => void }> = ({ leads, tasks, activities, onNavigate }) => {
    const stats = useMemo(() => {
        const now = new Date();

        // Row 1 - Lead & Task Metrics
        const newLeads = leads.filter(l => l.status === LeadStatus.New).length;
        const unassignedLeads = leads.filter(l => !l.assignedSalespersonId || l.assignedSalespersonId === '').length;
        const taskSchedule = tasks.filter(t => !t.isCompleted).length;
        const overdueTasks = tasks.filter(t => !t.isCompleted && new Date(t.dueDate) < now).length;

        // Row 2 - Opportunities & Site Visits
        const newOpportunities = leads.filter(l => l.status === LeadStatus.Qualified).length;
        // Site visits done: ONLY site visit done status
        const siteVisitsDone = leads.filter(l => l.status === LeadStatus.SiteVisitDone).length;
        // Site visits scheduled: ONLY scheduled/planned
        const siteVisitsScheduled = leads.filter(l =>
            l.status === LeadStatus.SiteVisitScheduled ||
            l.visitStatus === 'Planned'
        ).length;

        // Row 3 - Call Metrics
        const callActivities = activities.filter(a => a.type === 'Call');
        const totalCalls = callActivities.length;

        return {
            newLeads, unassignedLeads, taskSchedule, overdueTasks,
            newOpportunities, siteVisitsDone, siteVisitsScheduled, totalCalls
        };
    }, [leads, tasks, activities]);

    const iconClass = "w-6 h-6 text-white";

    return (
        <MetricGrid>
            {/* Row 1 */}
            <MetricCard
                title="New Leads"
                value={stats.newLeads}
                icon={<BellIcon className={iconClass} />}
                colorClass="bg-orange-600"
                onClick={() => {
                    onNavigate('Leads');
                    // Use a small delay to ensure the page loads before we try to click the tab
                    setTimeout(() => {
                        const newLeadsTab = document.querySelector('[data-tab-id="new"]') as HTMLElement;
                        if (newLeadsTab) newLeadsTab.click();
                    }, 100);
                }}
            />
            <MetricCard
                title="Unassigned Leads"
                value={stats.unassignedLeads}
                icon={<AlertTriangleIcon className={iconClass} />}
                colorClass="bg-red-600"
                onClick={() => {
                    onNavigate('Leads');
                    setTimeout(() => {
                        const unassignedTab = document.querySelector('[data-tab-id="unassigned"]') as HTMLElement;
                        if (unassignedTab) unassignedTab.click();
                    }, 100);
                }}
            />
            <MetricCard
                title="Task Schedule"
                value={stats.taskSchedule}
                icon={<MapPinIcon className={iconClass} />}
                colorClass="bg-emerald-600"
                onClick={() => onNavigate('Tasks')}
            />
            <MetricCard
                title="Overdue Tasks"
                value={stats.overdueTasks}
                icon={<CalendarIcon className={iconClass} />}
                colorClass="bg-amber-800"
                onClick={() => onNavigate('Tasks')}
            />

            {/* Row 2 */}
            <MetricCard
                title="New Opportunity"
                value={stats.newOpportunities}
                icon={<BellIcon className={iconClass} />}
                colorClass="bg-orange-500"
                onClick={() => onNavigate('Opportunities')}
            />
            <MetricCard
                title="Site Visit"
                value={stats.siteVisitsDone}
                icon={<MapPinIcon className={iconClass} />}
                colorClass="bg-teal-600"
                onClick={() => {
                    onNavigate('Leads');
                    setTimeout(() => {
                        // Activate the Visits Done filter chip
                        const visitsDoneFilter = document.querySelector('[data-filter="visits-done"]') as HTMLElement;
                        if (visitsDoneFilter && !visitsDoneFilter.classList.contains('bg-primary')) {
                            visitsDoneFilter.click();
                        }
                    }, 100);
                }}
            />
            <MetricCard
                title="Site Visit Planned"
                value={stats.siteVisitsScheduled}
                icon={<MapPinIcon className={iconClass} />}
                colorClass="bg-teal-500"
                onClick={() => {
                    onNavigate('Leads');
                    setTimeout(() => {
                        // Activate the Visits Planned filter chip
                        const visitsPlannedFilter = document.querySelector('[data-filter="visits-planned"]') as HTMLElement;
                        if (visitsPlannedFilter && !visitsPlannedFilter.classList.contains('bg-primary')) {
                            visitsPlannedFilter.click();
                        }
                    }, 100);
                }}
            />
            <MetricCard
                title="Total Calls"
                value={stats.totalCalls}
                icon={<MapPinIcon className={iconClass} />}
                colorClass="bg-amber-600"
                onClick={() => {
                    onNavigate('Leads');
                    setTimeout(() => {
                        // Activate the Calls filter chip
                        const callsFilter = document.querySelector('[data-filter="calls"]') as HTMLElement;
                        if (callsFilter && !callsFilter.classList.contains('bg-primary')) {
                            callsFilter.click();
                        }
                    }, 100);
                }}
            />
        </MetricGrid>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ leads, users, activities, tasks = [], projects, currentUser, onLogout, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('Leads');

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in">
            {/* Header */}
            <header className="flex justify-between items-end pb-1 md:pb-2">
                <div>
                    <h1 className="text-lg md:text-3xl font-black text-slate-900 tracking-tight">Overview</h1>
                    <p className="text-[10px] md:text-sm text-slate-500 mt-0.5 md:mt-1 font-black uppercase tracking-widest">Performance Metrics</p>
                </div>
            </header>

            {/* Premium Metrics (NOW ABOVE TABS) */}
            <div className="animate-fade-in">
                {activeTab === 'Leads' && (
                    <DetailedMetricsGrid leads={leads} tasks={tasks} activities={activities} onNavigate={onNavigate} />
                )}
                {activeTab === 'Inventory' && <InventoryMetricsHeader projects={projects} />}
                {activeTab === 'Calls' && <CallsMetricsHeader activities={activities} />}
                {activeTab === 'Checkin' && <CheckinMetricsHeader />}
                {activeTab === 'Sales' && <SalesMetricsHeader leads={leads} />}
            </div>

            {/* Main Tabs */}
            <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl inline-flex shadow-sm border border-slate-100 overflow-x-auto max-w-full sticky top-0 z-20">
                {['Leads', 'Inventory', 'Calls', 'Checkin', 'Sales'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 md:px-6 md:py-2.5 text-[10px] md:text-sm font-black rounded-lg transition-all whitespace-nowrap uppercase tracking-wider ${activeTab === tab
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
                {activeTab === 'Leads' && <LeadsDashboardTab leads={leads} />}
                {activeTab === 'Inventory' && <InventoryDashboardTab projects={projects} />}
                {activeTab === 'Calls' && <CallsDashboardTab activities={activities} />}
                {activeTab === 'Checkin' && <CheckinDashboardTab />}
                {activeTab === 'Sales' && <SalesDashboardTab leads={leads} />}
            </div>
        </div>
    );
};

export default Dashboard;
