import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from 'recharts';
import { UploadCloud, Activity, DollarSign, Wallet, ShieldAlert } from 'lucide-react';
import axios from 'axios';

import DashboardCard from './components/DashboardCard';
import TransactionsTable from './components/TransactionsTable';
import AnomaliesAlert from './components/AnomaliesAlert';
import { uploadTransactions, getDashboardAnalytics } from './services/api';

function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  // Auto-fetch if DB exists in phase 1 (optional)
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await getDashboardAnalytics();
      if (res.status === 'success') {
          setAnalytics(res);
      }
    } catch(err) {
      console.log('Analytics unavailable initially.');
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    try {
      const result = await uploadTransactions(file);
      setData(result.data);
      // Re-fetch aggregate charts
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = analytics ? Object.entries(analytics.category_breakdown).map(([name, value]) => ({name, value})).sort((a,b)=>b.value-a.value).slice(0,6) : [];

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary pb-20">
      
      {/* Header Area */}
      <header className="border-b border-slate-800 bg-darkCard/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-accentBlue to-accentTeal rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="text-white" size={24} />
             </div>
             <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">FINMATE</h1>
          </div>
          
          <label className="cursor-pointer bg-accentBlue hover:bg-blue-600 transition-colors px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20">
            {loading ? <span className="animate-pulse">Analyzing ML...</span> : <><UploadCloud size={20}/> Upload CSV</>}
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={loading} />
          </label>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-10">
        
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/50 text-rose-400 rounded-lg flex items-center gap-2">
            <ShieldAlert size={20} /> {error}
          </div>
        )}

        {(!data && !analytics) ? (
           <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 mb-6 rounded-3xl bg-slate-800 flex items-center justify-center border border-slate-700/50 shadow-2xl">
                 <UploadCloud size={48} className="text-slate-500" />
              </div>
              <h2 className="text-3xl font-bold text-textPrimary mb-3">Upload your Bank Statement</h2>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                FINMATE utilizes Isolation Forests and NLP heuristics to dynamically map and detect algorithmic anomalies in your financial history.
              </p>
           </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <DashboardCard 
                title="Total Income" 
                value={`$${data ? data.summary.total_income.toFixed(2) : '...'}`}
                icon={DollarSign}
                colorClass="bg-emerald-500/20"
              />
              <DashboardCard 
                title="Total Expenses" 
                value={`$${data ? data.summary.total_expenses.toFixed(2) : '...'}`}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               
               {/* Charts Region */}
               <div className="lg:col-span-2 space-y-8">
                  {/* Monthly Trend Chart */}
                  {analytics && analytics.monthly_trend && (
                     <div className="bg-darkCard p-6 border border-slate-700/50 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold mb-6">Historical Expenditure Trend</h3>
                        <div className="h-72">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={analytics.monthly_trend}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                 <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                 <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v)=>`$${v}`} />
                                 <Tooltip 
                                    contentStyle={{backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px'}}
                                    itemStyle={{color: '#3B82F6', fontWeight: 600}}
                                 />
                                 <Line type="monotone" dataKey="spent" stroke="#3B82F6" strokeWidth={4} dot={{r:6, strokeWidth:2, fill:'#0F172A'}} activeDot={{r:8, fill:'#3B82F6'}} />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  )}

                  {/* Categories Chart */}
                  {chartData.length > 0 && (
                      <div className="bg-darkCard p-6 border border-slate-700/50 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold mb-6">Expenditure by Category</h3>
                        <div className="h-72">
                           <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                                 <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                 <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v)=>`$${v}`}/>
                                 <YAxis type="category" dataKey="name" stroke="#F8FAFC" fontSize={12} tickLine={false} axisLine={false} />
                                 <Tooltip 
                                    cursor={{fill: '#334155', opacity: 0.4}}
                                    contentStyle={{backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px'}}
                                 />
                                 <Bar dataKey="value" fill="#14B8A6" radius={[0,4,4,0]} barSize={24} />
                               </BarChart>
                           </ResponsiveContainer>
                        </div>
                      </div>
                  )}

                  {/* Table */}
                  <TransactionsTable transactions={data ? data.transactions : []} />
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
