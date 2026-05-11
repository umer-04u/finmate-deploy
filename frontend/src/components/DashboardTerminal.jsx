import React, { useState, useEffect } from 'react';
import { getDashboardAnalytics, uploadTransactions, clearTransactions } from '../services/api';
import { supabase } from '../services/supabase';
import { 
  TrendingUp, TrendingDown, Percent, AlertTriangle, 
  Upload, Trash2, RefreshCcw, Activity
} from 'lucide-react';

const DashboardTerminal = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardAnalytics();
      if (res.status === 'success') {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      setError('SYSTEM_ERROR: Could not connect to API');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const res = await uploadTransactions(file);
      if (res.status === 'success') {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'UPLOAD_FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('EXECUTE_COMMAND: CLEAR_ALL_DATA?')) return;
    setLoading(true);
    try {
      await clearTransactions();
      setData(null);
    } catch (err) {
      setError('COMMAND_FAILED');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] font-mono">
        <div className="text-cyan animate-pulse mb-4 text-xl tracking-tighter">INITIALIZING_SYSTEM_RESOURCES...</div>
        <div className="w-64 h-1 bg-white/10 overflow-hidden">
          <div className="h-full bg-cyan animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] font-mono text-center">
        <div className="brutal-box p-12 max-w-md">
          <AlertTriangle className="mx-auto text-orange mb-6" size={48} />
          <h2 className="font-display text-2xl mb-4">ACCESS_DENIED</h2>
          <p className="text-white/60 text-sm mb-8">Authentication token missing or expired. Please sign in to access the financial terminal.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="brutal-btn w-full"
          >
            RETURN_TO_BASE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-tight">System Overview</h1>
          <p className="font-mono text-xs text-white/50 mt-1">
            SESSION: <span className="text-lime">ACTIVE</span> // USER: {session.user.email.split('@')[0].toUpperCase()} // DATA: {data ? 'LIVE' : 'IDLE'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleClear}
            className="brutal-btn-alt py-2 text-xs border-orange/40 text-orange/80 hover:bg-orange hover:text-black"
          >
            <Trash2 size={14} className="mr-2" />
            PURGE_DATA
          </button>
          
          <label className="brutal-btn py-2 text-xs cursor-pointer">
            <Upload size={14} className="mr-2" />
            [+] INGEST_DATA
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-orange/10 border border-orange/50 p-4 font-mono text-xs text-orange flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:text-white">[X]</button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPI 
          label="TOTAL_INCOME" 
          value={data ? `₹${data.summary.total_income.toLocaleString()}` : '0.00'} 
          color="text-lime" 
          icon={<TrendingUp size={16} />}
        />
        <KPI 
          label="TOTAL_EXPENSES" 
          value={data ? `₹${data.summary.total_expenses.toLocaleString()}` : '0.00'} 
          color="text-white" 
          icon={<TrendingDown size={16} />}
        />
        <KPI 
          label="SAVINGS_RATE" 
          value={data ? `${data.summary.savings_rate}%` : '0.0%'} 
          color="text-cyan" 
          icon={<Percent size={16} />}
        />
        <KPI 
          label="ANOMALIES" 
          value={data ? data.summary.anomalies_detected : '0'} 
          color="text-orange" 
          icon={<AlertTriangle size={16} />}
          isAnomaly={data && data.summary.anomalies_detected > 0}
        />
      </div>

      {!data ? (
        <div className="brutal-box p-20 text-center border-dashed">
          <Activity className="mx-auto text-white/20 mb-6 animate-pulse" size={64} />
          <h3 className="font-display text-xl mb-2">NO_DATA_STREAM_DETECTED</h3>
          <p className="text-white/40 font-mono text-sm max-w-sm mx-auto">
            System is idling. Please upload a bank statement CSV to begin algorithmic categorization and anomaly detection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Area */}
          <div className="lg:col-span-2 brutal-box h-[450px] flex flex-col">
            <h2 className="font-mono text-sm text-cyan uppercase tracking-widest mb-8">CASHFLOW_VECTOR // 12_MONTH_WINDOW</h2>
            <div className="flex-1 w-full h-full pb-4">
              {/* Simple CSS-based bar chart for performance and aesthetic consistency */}
              <div className="flex items-end h-full gap-2 border-l border-b border-white/10 pl-2">
                {data.monthly_trend.map((month, i) => (
                  <div key={i} className="group relative flex-1">
                    <div 
                      className="bg-cyan/20 border-t border-cyan hover:bg-cyan/40 transition-all duration-300"
                      style={{ height: `${(month.spent / Math.max(...data.monthly_trend.map(m => m.spent))) * 100}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-cyan text-[10px] p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                        {month.month}: ₹{month.spent.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction Stream */}
          <div className="brutal-box h-[450px] flex flex-col">
            <h2 className="font-mono text-sm text-white/50 uppercase tracking-widest mb-6">RAW_LOG_STREAM</h2>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {data.transactions.slice(0, 50).map((tx, i) => (
                <div key={i} className={`flex justify-between items-center p-3 border-l-2 ${tx.is_anomaly ? 'border-orange bg-orange/5' : 'border-white/10 bg-white/5'} font-mono text-[10px] hover:bg-white/10 transition-colors`}>
                  <div>
                    <div className="text-white/30">{tx.date}</div>
                    <div className={tx.is_anomaly ? 'text-orange font-bold' : 'text-white'}>{tx.merchant}</div>
                  </div>
                  <div className="text-right">
                    <div className={tx.is_anomaly ? 'text-orange' : 'text-white'}>
                      {tx.amount < 0 ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString()}
                    </div>
                    <div className="px-1 border border-white/20 mt-1 uppercase text-[8px]">{tx.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KPI = ({ label, value, color, icon, isAnomaly }) => (
  <div className={`brutal-box ${isAnomaly ? 'border-orange/50 shadow-[4px_4px_0_0_rgba(255,76,0,0.2)]' : ''}`}>
    <div className="text-white/50 text-[10px] mb-2 flex items-center justify-between uppercase tracking-wider">
      {label}
      {icon}
    </div>
    <div className={`font-mono text-2xl ${color} glitch-text`} data-text={value}>
      {value}
    </div>
  </div>
);

export default DashboardTerminal;
