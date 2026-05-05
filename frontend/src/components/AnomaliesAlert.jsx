import React from 'react';
import { AlertCircle, TrendingUp, Lightbulb } from 'lucide-react';

const AnomaliesAlert = ({ anomalies, forecastInsight }) => {
  return (
    <div className="space-y-6">
      
      {/* Forecast Insight Panel */}
      {forecastInsight && (
        <div className="bg-gradient-to-r from-[#1E293B] to-[#1e3a5f] rounded-xl p-4 md:p-6 border border-accentBlue/30 shadow-lg relative overflow-hidden">
             <div className="absolute right-0 top-0 opacity-10 hidden sm:block">
                 <TrendingUp size={120} className="text-accentBlue translate-x-8 -translate-y-8" />
             </div>
             <div className="flex items-start gap-3 md:gap-4">
                 <div className="p-2 md:p-3 bg-accentBlue/20 rounded-lg text-accentBlue">
                     <Lightbulb size={20} className="md:size-6" />
                 </div>
                 <div className="z-10 relative">
                     <h3 className="text-base md:text-lg font-semibold text-textPrimary mb-1">AI Financial Forecast Insight</h3>
                     <p className="text-slate-300 leading-relaxed text-xs md:text-sm">
                         {forecastInsight.insight}
                     </p>
                 </div>
             </div>
        </div>
      )}

      {/* Anomalies List */}
      <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-textPrimary mt-6 md:mt-8 flex items-center">
        <AlertCircle className="mr-2 text-rose-500" size={18} />
        Detected Spending Anomalies
      </h3>
      
      {!anomalies || anomalies.length === 0 ? (
        <div className="bg-darkCard rounded-xl p-4 md:p-6 border border-slate-700/50 text-slate-400 text-xs md:text-sm">
           No unusual spending patterns detected in this dataset.
        </div>
      ) : (
        <div className="flex flex-col gap-3 md:gap-4">
          {anomalies.map((anomaly, idx) => (
            <div key={idx} className="bg-darkCard rounded-xl p-4 md:p-5 border-l-4 border-rose-500 shadow-md flex flex-col gap-1 md:gap-2">
              <div className="flex justify-between items-start">
                  <span className="font-semibold text-textPrimary text-sm md:text-base truncate max-w-[150px] sm:max-w-none">{anomaly.description}</span>
                  <span className="text-rose-400 font-bold font-mono text-sm md:text-base whitespace-nowrap">-₹{Math.abs(anomaly.amount).toFixed(2)}</span>
              </div>
              <div className="flex gap-2 text-[10px] md:text-xs text-textSecondary uppercase tracking-widest mt-0.5 md:mt-1">
                  <span>{anomaly.date}</span>
                  <span>•</span>
                  <span>{anomaly.category}</span>
              </div>
              <div className="mt-2 md:mt-3 p-2 md:p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 text-slate-300 text-xs md:text-sm leading-relaxed">
                  <span className="font-semibold text-rose-400">AI Reasoning: </span>
                  {anomaly.anomaly_reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnomaliesAlert;
