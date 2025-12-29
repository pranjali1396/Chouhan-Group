

import React from 'react';
import AttendanceCard from './AttendanceCard';
import { MetricCard, MetricGrid } from './MetricSection';
import { UserCircleIcon, CheckCircleIcon, MapPinIcon, BellIcon } from './Icons';

const AttendancePage: React.FC = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-lg md:text-3xl font-black text-slate-900 tracking-tight">Attendance</h2>
        <p className="text-[10px] md:text-sm text-slate-500 mt-0.5 md:mt-1 font-black uppercase tracking-widest">Team Presence Tracking</p>
      </div>

      <MetricGrid>
        <MetricCard
          title="Total Team"
          value="12"
          icon={<UserCircleIcon className="w-6 h-6 text-white" />}
          colorClass="bg-indigo-600"
        />
        <MetricCard
          title="Present"
          value="8"
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
          colorClass="bg-emerald-600"
          trend="+2 today"
        />
        <MetricCard
          title="Late Arrival"
          value="2"
          icon={<BellIcon className="w-6 h-6 text-white" />}
          colorClass="bg-amber-600"
          trend="Check logs"
        />
        <MetricCard
          title="On Leave"
          value="2"
          icon={<MapPinIcon className="w-6 h-6 text-white" />}
          colorClass="bg-rose-600"
        />
      </MetricGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100">
          <AttendanceCard />
        </div>
        <div className="lg:col-span-2 bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm md:text-lg font-black text-slate-800 mb-3 md:mb-4 uppercase tracking-wider">Attendance History</h3>
          <p className="text-[11px] md:text-sm text-slate-500 font-medium">A detailed log of attendance records for the sales team will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;