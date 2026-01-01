
import React, { useState, useEffect } from 'react';
import AttendanceCard, { AttendanceStatus } from './AttendanceCard';
import { MetricCard, MetricGrid } from './MetricSection';
import { UserCircleIcon, CheckCircleIcon, MapPinIcon, BellIcon, ClockIcon, DocumentTextIcon } from './Icons';
import { User } from '../types';
import { api } from '../services/api';

interface AttendancePageProps {
  currentUser: User;
  users: User[];
}

const AttendancePage: React.FC<AttendancePageProps> = ({ currentUser, users }) => {
  const isAdmin = currentUser.role === 'Admin';

  // State
  const [status, setStatus] = useState<AttendanceStatus>('NotClockedIn');
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoursToday, setHoursToday] = useState<string>('0h 0m');
  const [daysThisMonth, setDaysThisMonth] = useState<number>(0);

  // Admin Dashboard State
  const [dashboardData, setDashboardData] = useState<any[]>([]);

  // Helper to format ms to "Xh Ym"
  const formatDuration = (ms: number) => {
    const totalMins = Math.floor(ms / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs}h ${mins}m`;
  };

  // Timer to update "Hours Today"
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const updateRealtimeHours = () => {
      if (status === 'ClockedIn' && clockInTime) {
        const now = new Date();
        const currentSessionMs = now.getTime() - clockInTime.getTime();
        setHoursToday(formatDuration(currentSessionMs));
      }
    };

    if (status === 'ClockedIn') {
      updateRealtimeHours();
      interval = setInterval(updateRealtimeHours, 60000);
    }
    return () => clearInterval(interval);
  }, [status, clockInTime]);

  // Fetch Data (Admin Dashboard or Personal Status)
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin) {
          // Admin: Fetch Dashboard Data
          const res = await api.getAttendanceDashboard();
          if (res.success) {
            setDashboardData(res.data);
          }
        }

        // Everyone: Fetch Own Status (Admin also clocks in/out personally)
        const res = await api.getAttendanceStatus(currentUser.id);
        if (res.success) {
          if (res.summary) {
            setDaysThisMonth(res.summary.daysThisMonth);
            setHoursToday(formatDuration(res.summary.hoursToday));
          }
          if (res.attendance) {
            if (res.attendance.status === 'ClockedIn') {
              setStatus('ClockedIn');
              setClockInTime(new Date(res.attendance.clockInTime!));
              setLocation(res.attendance.location || null);
            } else if (res.attendance.status === 'ClockedOut') {
              setStatus('NotClockedIn');
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch attendance data', e);
      }
    };
    fetchData();
  }, [currentUser.id, isAdmin]);

  const handleClockIn = () => {
    setStatus('ClockingIn');
    setLocation('Fetching location...');
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setStatus('Error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        try {
          await api.clockIn(currentUser.id, locString);
          setLocation(locString);
          setClockInTime(new Date());
          setStatus('ClockedIn');
          // Refresh dashboard if admin
          if (isAdmin) {
            const res = await api.getAttendanceDashboard();
            if (res.success) setDashboardData(res.data);
          }
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Failed to clock in');
          setStatus('Error');
        }
      },
      (err) => {
        console.error(err);
        setError('Could not get location. Permission denied.');
        setLocation(null);
        setStatus('Error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClockOut = async () => {
    setStatus('ClockingOut');
    setError(null);

    try {
      await api.clockOut(currentUser.id);
      setStatus('NotClockedIn');
      setClockInTime(null);
      setLocation(null);
      // Refresh dashboard if admin
      if (isAdmin) {
        const res = await api.getAttendanceDashboard();
        if (res.success) setDashboardData(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to clock out');
      setStatus('ClockedIn'); // Revert status if failed
    }
  };

  const handleExport = () => {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    window.open(api.getExportUrl(month), '_blank');
  };

  // Calculate generic team stats for metrics (Admin View)
  const presentCount = dashboardData.filter(u => u.status === 'Online' || u.status === 'Clocked Out').length;
  const onlineCount = dashboardData.filter(u => u.status === 'Online').length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg md:text-3xl font-black text-slate-900 tracking-tight">Attendance</h2>
          <p className="text-[10px] md:text-sm text-slate-500 mt-0.5 md:mt-1 font-black uppercase tracking-widest">
            {isAdmin ? 'Team Presence Tracking' : 'My Attendance'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleExport}
            className="flex items-center text-xs md:text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4 mr-1.5" />
            Export CSV
          </button>
        )}
      </div>

      <MetricGrid>
        <MetricCard
          title={isAdmin ? "Total Team" : "My Status"}
          value={isAdmin ? users.length.toString() : (status === 'ClockedIn' ? "Online" : "Offline")}
          icon={<UserCircleIcon className="w-6 h-6 text-white" />}
          colorClass="bg-indigo-600"
        />
        <MetricCard
          title={isAdmin ? "Present Today" : "Clock In Time"}
          value={isAdmin ? presentCount.toString() : (clockInTime ? clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--")}
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
          colorClass="bg-emerald-600"
          trend={status === 'ClockedIn' ? "On time" : ""}
        />
        <MetricCard
          title={isAdmin ? "Currently Online" : "Hours Today"}
          value={isAdmin ? onlineCount.toString() : hoursToday}
          icon={isAdmin ? <BellIcon className="w-6 h-6 text-white" /> : <ClockIcon className="w-6 h-6 text-white" />}
          colorClass="bg-amber-600"
          trend={isAdmin ? "Active Now" : "Live tracking"}
        />
        <MetricCard
          title={isAdmin ? "On Leave" : "This Month"}
          value={isAdmin ? (users.length - presentCount).toString() : `${daysThisMonth} Days`}
          icon={<MapPinIcon className="w-6 h-6 text-white" />}
          colorClass="bg-rose-600"
        />
      </MetricGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Clock In Card - Visible to everyone */}
        <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100">
          <AttendanceCard
            status={status}
            clockInTime={clockInTime}
            location={location}
            error={error}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
          />
        </div>

        {/* Admin Dashboard vs Personal History */}
        <div className="lg:col-span-2 bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-sm md:text-lg font-black text-slate-800 mb-3 md:mb-4 uppercase tracking-wider">
            {isAdmin ? 'Team Status (Today)' : 'My Attendance History'}
          </h3>

          {isAdmin ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Today</th>
                    <th className="px-4 py-3 font-black text-indigo-600">Weekly Data (Mon-Sun)</th>
                    <th className="px-4 py-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dashboardData.length > 0 ? (
                    dashboardData.map((user: any) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{user.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{user.role}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${user.status === 'Online' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' :
                            user.status === 'Away' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' :
                              user.status === 'Clocked Out' ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' :
                                user.status === 'Browsing' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' :
                                  'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 mr-1.5 rounded-full animate-pulse ${user.status === 'Online' ? 'bg-emerald-500' :
                              user.status === 'Away' ? 'bg-amber-500' :
                                user.status === 'Clocked Out' ? 'bg-slate-400' :
                                  user.status === 'Browsing' ? 'bg-indigo-500' :
                                    'bg-rose-500'
                              }`}></span>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{user.duration}</span>
                            <span className="text-[10px] text-slate-400">In: {user.clockIn ? new Date(user.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                              <div key={day} className="flex flex-col items-center min-w-[32px]">
                                <span className="text-[9px] text-slate-400 font-bold uppercase">{day[0]}</span>
                                <div className={`h-8 w-6 rounded-md flex items-end justify-center pb-1 ${user.weeklyBreakdown?.[day] > 0 ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                                  <div
                                    className="w-4 bg-indigo-500 rounded-sm"
                                    style={{ height: `${Math.min(100, (user.weeklyBreakdown?.[day] || 0) * 10)}%` }}
                                    title={`${day}: ${user.weeklyBreakdown?.[day] || 0}h`}
                                  ></div>
                                </div>
                              </div>
                            ))}
                            <div className="ml-2 pl-2 border-l border-slate-100 flex flex-col">
                              <span className="text-[10px] font-black text-indigo-600">{user.weeklyHours}</span>
                              <span className="text-[8px] text-slate-400 uppercase font-black">Total</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {user.location ? (
                            <div className="flex items-center text-[10px] text-slate-400 italic max-w-[120px] truncate" title={user.location}>
                              <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                              {user.location}
                            </div>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic font-medium">No team data available for today.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-[11px] md:text-sm text-slate-600 space-y-2">
              <p className="font-medium">Recent Activity</p>
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Today</span>
                  <span className="text-slate-500 text-xs">{hoursToday}</span>
                </div>
                <div className="mt-2 text-xs text-slate-500 grid grid-cols-2 gap-2">
                  <div>In: {clockInTime ? clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                  <div>Out: -</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
