
import React from 'react';
import { HomeIcon, UsersIcon, CalendarIcon, ChartBarIcon, DocumentTextIcon, CogIcon, MapPinIcon } from './Icons';
import type { User } from '../types';


interface BottomNavBarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onNavigate, currentUser }) => {
  const isAdmin = currentUser.role === 'Admin';

  const navItems = isAdmin
    ? [
      { name: 'Dashboard', icon: <HomeIcon className="w-5 h-5" /> },
      { name: 'Leads', icon: <UsersIcon className="w-5 h-5" /> },
      { name: 'Reports', icon: <ChartBarIcon className="w-5 h-5" /> },
      { name: 'Tasks', icon: <DocumentTextIcon className="w-5 h-5" /> },
    ]
    : [
      { name: 'Leads', icon: <UsersIcon className="w-5 h-5" /> },
      { name: 'Calendar', icon: <CalendarIcon className="w-5 h-5" /> },
      { name: 'Attendance', icon: <MapPinIcon className="w-5 h-5" /> },
      { name: 'Tasks', icon: <DocumentTextIcon className="w-5 h-5" /> },
    ];

  return (
    <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl px-2 py-1.5 flex items-center justify-around animate-slide-up">
      {navItems.map(item => {
        const isActive = activeView === item.name;
        return (
          <button
            key={item.name}
            onClick={() => onNavigate(item.name)}
            className={`relative flex flex-col items-center justify-center p-1.5 transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-60'}`}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400'}`}>
              {React.cloneElement(item.icon as React.ReactElement, { className: 'w-4.5 h-4.5' })}
            </div>
            {isActive && (
              <span className="text-[7px] font-black text-white/90 uppercase tracking-tighter mt-1">{item.name}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNavBar;
