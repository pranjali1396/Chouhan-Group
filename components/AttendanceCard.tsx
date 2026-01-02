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

const AttendanceCard: React.FC<AttendanceCardProps> = ({ status, clockInTime, clockOutTime, hoursToday, location, error, onClockIn, onClockOut }) => {

    const getStatusMessage = () => {
        switch (status) {
            case 'NotClockedIn':
                return <p className="text-sm text-text-secondary">You are not clocked in.</p>;
            case 'ClockingIn':
                return <p className="text-sm text-text-secondary animate-pulse">Clocking in...</p>;
            case 'ClockingOut':
                return <p className="text-sm text-text-secondary animate-pulse">Clocking out...</p>;
            case 'ClockedIn':
                return (
                    <div>
                        <p className="text-sm font-semibold text-green-600">
                            Clocked in at: {clockInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-text-secondary flex items-center mt-1 font-medium">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {location}
                        </p>
                    </div>
                );
            case 'ClockedOut':
                return (
                    <div>
                        <p className="text-sm font-semibold text-slate-600">
                            Shift Ended: {clockOutTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            In: {clockInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                );
            case 'Error':
                return <p className="text-sm text-red-500 font-medium">{error}</p>;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Clock In/Out</h3>
                {hoursToday && (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Total Hours</span>
                        <span className="text-base font-black text-indigo-600 leading-none">{hoursToday}</span>
                    </div>
                )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                    {getStatusMessage()}
                    {status === 'ClockedIn' ? (
                        <button
                            onClick={onClockOut}
                            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
                        >
                            Clock Out
                        </button>
                    ) : (
                        <button
                            onClick={onClockIn}
                            disabled={status === 'ClockingIn' || status === 'ClockingOut'}
                            className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                        >
                            {status === 'ClockingIn' ? 'Syncing...' : 'Clock In'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceCard;
