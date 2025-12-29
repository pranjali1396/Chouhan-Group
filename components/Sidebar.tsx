import React from 'react';
import { HomeIcon, UsersIcon, ChartBarIcon, CalendarIcon, CogIcon, MapPinIcon, DocumentTextIcon, BuildingOfficeIcon, TargetIcon, CheckCircleIcon } from './Icons';
import type { User } from '../types';

interface NavLinkProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    onClick: () => void;
}

const Sidebar: React.FC<{
    activeView: string;
    onNavigate: (view: string) => void;
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
    currentUser: User;
}> = ({ activeView, onNavigate, isOpen, setOpen, currentUser }) => {
    const isAdmin = currentUser.role === 'Admin';
    const navItems = [
        { name: 'Dashboard', icon: <HomeIcon className="w-5 h-5" />, adminOnly: true },
        { name: 'Leads', icon: <UsersIcon className="w-5 h-5" />, adminOnly: false },
        { name: 'Opportunities', icon: <TargetIcon className="w-5 h-5" />, adminOnly: false },
        { name: 'Clients', icon: <CheckCircleIcon className="w-5 h-5" />, adminOnly: false },
        { name: 'Inventory', icon: <BuildingOfficeIcon className="w-5 h-5" />, adminOnly: false },
        { name: 'Calendar', icon: <CalendarIcon className="w-5 h-5" />, adminOnly: false },
        { name: 'Attendance', icon: <MapPinIcon className="w-5 h-5" />, adminOnly: false },
        { name: 'Reports', icon: <ChartBarIcon className="w-5 h-5" />, adminOnly: true },
        { name: 'Tasks', icon: <DocumentTextIcon className="w-5 h-5" />, adminOnly: false },
        { name: 'Settings', icon: <CogIcon className="w-5 h-5" />, adminOnly: true },
    ];

    const NavLink: React.FC<NavLinkProps> = ({ icon, label, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`flex items-center w-full px-4 py-3 mb-1 text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-xl group ${isActive
                ? 'grad-primary text-white shadow-lg shadow-indigo-100 scale-105 z-10'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
        >
            <span className={`transition-all duration-300 flex-shrink-0 ${isActive ? 'text-white scale-110 drop-shadow-md' : 'text-slate-300 group-hover:text-primary group-hover:scale-110'}`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
            </span>
            <span className="ml-3 font-black truncate">{label}</span>
            {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse"></div>
            )}
        </button>
    );

    const visibleNavItems = navItems.filter(item => isAdmin || !item.adminOnly);

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-md transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setOpen(false)}
            />

            <aside className={`fixed top-0 left-0 h-full bg-white border-r border-slate-100 w-64 p-5 transform transition-transform duration-500 ease-in-out z-40 md:relative md:translate-x-0 md:flex-shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}>
                <div className="flex flex-col h-full">
                    {/* Premium Logo Section */}
                    <div className="flex items-center mb-10 px-1 mt-2 group cursor-default">
                        <img
                            src="/ChouhanG.png"
                            alt="Chouhan Group"
                            className="w-12 h-12 md:w-14 md:h-14 object-contain mr-2 transform group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="min-w-0">
                            <h1 className="text-xs md:text-sm font-black text-slate-900 leading-tight tracking-tighter uppercase truncate">Chouhan Housing</h1>
                            <p className="text-[8px] md:text-[9px] text-primary font-black uppercase tracking-widest mt-0.5 whitespace-nowrap">Pvt Limited</p>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
                        <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-4">Main Navigation</p>
                        {visibleNavItems.map(item => (
                            <NavLink
                                key={item.name}
                                icon={item.icon}
                                label={item.name}
                                isActive={activeView === item.name}
                                onClick={() => {
                                    onNavigate(item.name);
                                    if (isOpen) setOpen(false);
                                }}
                            />
                        ))}
                    </nav>

                    {/* Premium User Profile Section */}
                    <div className="mt-8 pt-6 border-t border-slate-50">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 group hover:bg-white hover:shadow-lg transition-all duration-300 cursor-pointer">
                            <div className="relative">
                                <img src={currentUser.avatarUrl} alt="Profile" className="w-10 h-10 rounded-xl border-2 border-white shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform" />
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="overflow-hidden min-w-0 flex-1">
                                <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">{currentUser.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currentUser.role === 'Admin' ? 'Director' : 'Sales Lead'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;