
import React from 'react';

export const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    colorClass: string;
    trend?: string;
    onClick?: () => void;
}> = ({ title, value, icon, colorClass, trend, onClick }) => (
    <div
        onClick={onClick}
        className={`relative overflow-hidden p-2.5 md:p-5 rounded-xl md:rounded-[2rem] border transition-all duration-300 group cursor-pointer active:scale-95 shadow-md md:shadow-lg ${colorClass} text-white`}
    >
        {/* Glassmorphism Shine */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 -skew-y-12 transform -translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>

        <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex justify-between items-start mb-1 md:mb-4">
                <div className="p-1.5 md:p-3 bg-white/20 backdrop-blur-md rounded-lg md:rounded-2xl shadow-sm border border-white/20 group-hover:scale-110 transition-transform">
                    {React.cloneElement(icon as React.ReactElement, { className: 'w-3.5 h-3.5 md:w-6 md:h-6 text-white' })}
                </div>
                {trend && (
                    <div className="px-1 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[6px] md:text-[8px] font-black uppercase tracking-tighter border border-white/10">
                        {trend}
                    </div>
                )}
            </div>

            <div className="space-y-0 md:space-y-1">
                <p className="text-[7px] md:text-[10px] font-black text-white/70 uppercase tracking-tighter md:tracking-[0.2em]">{title}</p>
                <p className="text-lg md:text-3xl font-black tracking-tighter drop-shadow-sm">{value}</p>
            </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -bottom-10 -right-10 w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
    </div>
);

export const MetricGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
        {children}
    </div>
);
