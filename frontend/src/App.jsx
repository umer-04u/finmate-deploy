import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from 'recharts';
import { UploadCloud, Activity, DollarSign, Wallet, ShieldAlert, Trash2, Plus, LogOut } from 'lucide-react';
import axios from 'axios';

import DashboardCard from './components/DashboardCard';
import TransactionsTable from './components/TransactionsTable';
import AnomaliesAlert from './components/AnomaliesAlert';
import ManualEntryModal from './components/ManualEntryModal';
import Auth from './components/Auth';
import { uploadTransactions, getDashboardAnalytics, clearTransactions } from './services/api';
import { supabase } from './services/supabase';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchAnalytics();
    } else {
      setData(null);
      setAnalytics(null);
    }
  }, [session]);

  const fetchAnalytics = async () => {
    try {
      const res = await getDashboardAnalytics();
      if (res.status === 'success') {
          refreshData(res);
      }
    } catch(err) {
      console.log('Analytics unavailable initially.');
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Helper to refresh everything
  const refreshData = (newData) => {
    // Backend now returns the full state in 'data'
    if (newData && newData.transactions) {
      setData({ ...newData });
      setAnalytics({ ...newData });
    } else {
      // Fallback for direct dashboard fetch
      fetchAnalytics();
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all transactions? This cannot be undone.')) return;
    
    setLoading(true);
    try {
      await clearTransactions();
      setData(null);
      setAnalytics(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    try {
      const result = await uploadTransactions(file);
      if (result.status === 'success') {
        refreshData(result.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
      e.target.value = null; // Clear input to allow re-uploading same file if needed
    }
  };

  if (!session) {
    return <Auth />;
  }

  const chartData = analytics ? Object.entries(analytics.category_breakdown || {}).map(([name, value]) => ({name, value})).sort((a,b)=>b.value-a.value).slice(0,6) : [];

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary pb-10 md:pb-20">
      
      {/* Header Area */}
      <header className="border-b border-slate-800 bg-darkCard/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:h-20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-accentBlue to-accentTeal rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Activity className="text-white" size={20} />
             </div>
             <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">FINMATE</h1>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-4 w-full md:w-auto">
            {(data || analytics) && (
              <button 
                onClick={handleClearAll}
                className="text-rose-400 hover:bg-rose-500/10 transition-colors px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm md:text-base font-medium flex items-center gap-2 border border-rose-500/20"
              >
                <Trash2 size={16}/> <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 transition-colors px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-sm md:text-base font-medium flex items-center gap-2 border border-slate-700"
            >
              <Plus size={18}/> <span className="hidden sm:inline">Manual Entry</span>
            </button>

            <label className="cursor-pointer bg-accentBlue hover:bg-blue-600 transition-colors px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-sm md:text-base font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20">
              {loading ? <span className="animate-pulse">Analyzing...</span> : <><UploadCloud size={18}/> <span className="hidden sm:inline">Upload Statement</span><span className="sm:hidden">Upload</span></>}
              <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={loading} />
            </label>
            <button 
              onClick={handleSignOut}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
              title="Sign Out"
            >
              <LogOut size={18}/>
            </button>
          </div>
        </div>
      </header>


      <ManualEntryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={refreshData}
      />

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-10 space-y-6 md:space-y-10">
        
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/50 text-rose-400 rounded-lg flex items-center gap-2 text-sm md:text-base">
            <ShieldAlert size={18} /> {error}
          </div>
        )}

        {(!data && !analytics) ? (
           <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center px-4">
              <div className="w-20 h-20 md:w-24 md:h-24 mb-6 rounded-3xl bg-slate-800 flex items-center justify-center border border-slate-700/50 shadow-2xl">
                 <UploadCloud size={40} className="text-slate-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-textPrimary mb-3">Upload your Bank Statement</h2>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm md:text-base">
                FINMATE utilizes Isolation Forests and NLP heuristics to dynamically map and detect algorithmic anomalies in your financial history.
              </p>
           </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
              <DashboardCard 
                title="Total Income" 
                value={`₹${data ? data.summary.total_income.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '...'}`}
                icon={DollarSign}
                colorClass="bg-emerald-500/20"
              />
              <DashboardCard 
                title="Total Expenses" 
                value={`₹${data ? data.summary.total_expenses.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '...'}`}
                icon={Wallet}
                colorClass="bg-rose-500/20"
              />
              <DashboardCard 
                title="Savings Rate" 
                value={`${data ? data.summary.savings_rate : '...'}%`}
                icon={Activity}
                trend="+2%" trendLabel="from last month"
                colorClass="bg-blue-500/20"
              />
              <DashboardCard 
                 title="Total Anomalies"
                 value={data ? data.summary.anomalies_detected : '...'}
                 icon={ShieldAlert}
                 colorClass="bg-orange-500/20"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
               
               {/* Charts Region */}
               <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  {/* Monthly Trend Chart */}
                  {analytics && analytics.monthly_trend && (
                     <div className="bg-darkCard p-4 md:p-6 border border-slate-700/50 rounded-xl shadow-lg">
                        <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">Historical Expenditure Trend</h3>
                        <div className="h-60 md:h-72">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={analytics.monthly_trend}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                 <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                                 <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v)=>`₹${v}`} />
                                 <Tooltip 
                                    contentStyle={{backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px'}}
                                    itemStyle={{color: '#3B82F6', fontWeight: 600}}
                                 />
                                 <Line type="monotone" dataKey="spent" stroke="#3B82F6" strokeWidth={3} dot={{r:4, strokeWidth:2, fill:'#0F172A'}} activeDot={{r:6, fill:'#3B82F6'}} />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {/* Categories Chart */}
                  {chartData.length > 0 && (
                      <div className="bg-darkCard p-4 md:p-6 border border-slate-700/50 rounded-xl shadow-lg">
                        <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">Expenditure by Category</h3>
                        <div className="h-60 md:h-72">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                 <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v)=>`₹${v}`}/>
                                 <YAxis type="category" dataKey="name" stroke="#F8FAFC" fontSize={10} tickLine={false} axisLine={false} width={80} />
                                 <Tooltip 
                                    cursor={{fill: '#334155', opacity: 0.4}}
                                    contentStyle={{backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px'}}
                                 />
                                 <Bar dataKey="value" fill="#14B8A6" radius={[0,4,4,0]} barSize={20} />
                               </BarChart>
                           </ResponsiveContainer>
                        </div>
                      </div>
                  )}

                  {/* Table */}
                  <TransactionsTable 
                    transactions={data ? data.transactions : []} 
                    onCategoryChange={refreshData}
                  />
               </div>

               {/* Right Sidebar - Anomalies */}
               <div className="lg:col-span-1">
                  <AnomaliesAlert 
                     anomalies={data ? data.transactions.filter(t => t.is_anomaly) : []} 
                     forecastInsight={analytics ? analytics.forecast : null}
                  />
               </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
