import React, { useState } from 'react';
import { MapPinIcon } from './Icons';

export type AttendanceStatus = 'NotClockedIn' | 'ClockingIn' | 'ClockedIn' | 'ClockingOut' | 'ClockedOut' | 'Error';

interface AttendanceCardProps {
    status: AttendanceStatus;
    clockInTime: Date | null;
    clockOutTime?: Date | null;
    hoursToday?: string;
    location: string | null;
    error: string | null;
    onClockIn: () => void;
    onClockOut: () => void;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({ status, clockInTime, clockOutTime, hoursToday, location, error }) => {

    const getStatusMessage = () => {
        switch (status) {
            case 'ClockedIn':
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-sm font-black text-emerald-600 uppercase tracking-wide">Currently Active</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500">
                            Logged in at: {clockInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                );
            case 'ClockedOut':
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            <span className="text-sm font-black text-slate-500 uppercase tracking-wide">Session Ended</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400">
                            Ended at: {clockOutTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                );
            case 'NotClockedIn':
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span className="text-sm font-black text-rose-600 uppercase tracking-wide">Not Logged In</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400">Wait for next active session</p>
                    </div>
                );
            case 'Error':
                return <p className="text-sm text-red-500 font-medium">{error}</p>;
            default:
                return <p className="text-sm text-slate-400 animate-pulse font-bold uppercase tracking-tighter">Syncing Presence...</p>;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">Live Presence</h3>
                {hoursToday && (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Tracked Hours</span>
                        <span className="text-base font-black text-indigo-600 leading-none">{hoursToday}</span>
                    </div>
                )}
            </div>
            <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                    {getStatusMessage()}
                    {status === 'ClockedIn' && (
                        <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
                            <MapPinIcon className="w-5 h-5" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceCard;
