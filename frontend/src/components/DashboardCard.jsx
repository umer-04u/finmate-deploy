import React from 'react';

const DashboardCard = ({ title, value, icon: Icon, trend, trendLabel, colorClass }) => {
  return (
    <div className={`bg-darkCard rounded-xl p-4 md:p-6 shadow-lg border border-slate-700/50 flex flex-col`}>
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <h3 className="text-textSecondary font-medium text-[10px] md:text-sm uppercase tracking-wider">{title}</h3>
        <div className={`p-1.5 md:p-2 rounded-lg ${colorClass}`}>
          <Icon size={16} className="md:size-5 text-white" />
        </div>
      </div>
      <div className="flex flex-col gap-0.5 md:gap-1">
        <span className="text-xl md:text-3xl font-bold text-textPrimary">{value}</span>
        {trend && (
          <span className={`text-xs md:text-sm ${trend.startsWith('+') ? 'text-accentTeal' : trend.startsWith('-') ? 'text-accentBlue' : 'text-slate-400'}`}>
            {trend} <span className="text-textSecondary ml-1 hidden sm:inline">{trendLabel}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
