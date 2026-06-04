import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Upload, LogOut, Loader2, AlertCircle, TrendingUp, 
  CreditCard, Activity, ChevronRight, Trash2, Check, Edit2, X, Plus,
  LayoutDashboard, Wallet, BarChart3, Settings, Sparkles, Filter, Menu, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinmateLogo } from './Logo';

const API_BASE = import.meta.env.PUBLIC_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

const CATEGORIES = [
  "Food & Dining", "Transportation", "Shopping", "Entertainment", 
  "Utilities", "Health", "Investment", "Transfers", "Other"
];

const MONTH_ORDER: { [key: string]: number } = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualTx, setManualTx] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense',
    category: 'Other'
  });

  const trendData = useMemo(() => {
    if (!data?.monthly_trend) return [];
    return [...data.monthly_trend].sort((a: any, b: any) => {
      const partsA = a.month.split(' ');
      const partsB = b.month.split(' ');
      if (partsA[1] !== partsB[1]) return parseInt(partsA[1]) - parseInt(partsB[1]);
      return MONTH_ORDER[partsA[0]] - MONTH_ORDER[partsB[0]];
    });
  }, [data?.monthly_trend]);

  const highestCategory = useMemo(() => {
    if (!data?.category_breakdown) return 'N/A';
    const entries = Object.entries(data.category_breakdown);
    if (entries.length === 0) return 'N/A';
    return entries.sort((a: any, b: any) => b[1] - a[1])[0][0];
  }, [data]);

  const anomalies = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter((t: any) => t.is_anomaly);
  }, [data?.transactions]);

  const categoryBreakdown = useMemo(() => {
    if (!data?.category_breakdown) return [];
    return Object.entries(data.category_breakdown).map(([name, value]) => ({ name, value }));
  }, [data?.category_breakdown]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/'; return; }
      setUser(user);
      await fetchDashboardData();
    };
    init();

    // Auto-close sidebar on small screens
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
    
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/analytics/dashboard`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (!response.ok) throw new Error('Failed to synchronize data');
      const json = await response.json();
      if (json.transactions) {
        json.transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE}/transactions/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
        body: formData
      });
      await fetchDashboardData();
    } catch (err: any) { setError(err.message); } finally { setUploading(false); }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Purge system data? This action is immutable.")) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE}/transactions/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      await fetchDashboardData();
    } catch (err: any) { setError(err.message); } finally { setDeleting(false); }
  };

  const handleCategoryUpdate = async (id: string, newCategory: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE}/transactions/${id}/category`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category: newCategory })
      });
      setEditingId(null);
      await fetchDashboardData();
    } catch (err: any) { setError(err.message); }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE}/transactions/manual`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...manualTx, amount: parseFloat(manualTx.amount) })
      });
      setShowManual(false);
      await fetchDashboardData();
    } catch (err: any) { setError(err.message); } finally { setUploading(false); }
  };

  if (loading && !data) {
    return (
      <div className="loading-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Activity size={48} color="var(--accent-primary)" />
        </motion.div>
        <p className="loading-text">INITIALIZING NEURAL ENGINE...</p>
      </div>
    );
  }

  return (
    <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="mesh-bg" style={{ opacity: 0.3 }}></div>
      
      {/* Sidebar with Toggle */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 80 }}
        className="dashboard-sidebar"
      >
        <div className="sidebar-header">
          <FinmateLogo className="w-8 h-8" />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="sidebar-toggle-btn"
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${window.location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => window.location.href = '/dashboard'}
          >
            <LayoutDashboard size={20} /> 
            {isSidebarOpen && <span>Command Center</span>}
          </div>
          <div 
            className={`nav-item ${window.location.pathname === '/intelligence' ? 'active' : ''}`}
            onClick={() => window.location.href = '/intelligence'}
          >
            <BarChart3 size={20} /> 
            {isSidebarOpen && <span>Intelligence</span>}
          </div>
          <div className="nav-item">
            <Settings size={20} /> 
            {isSidebarOpen && <span>System Config</span>}
          </div>
        </nav>

        {isSidebarOpen && (
          <div className="sidebar-footer">
            <div className="user-info">
              <span className="user-label">VAULT OPERATOR</span>
              <span className="user-email">{user?.email}</span>
            </div>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')} className="btn-signout">
              <LogOut size={16} /> TERMINATE SESSION
            </button>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="header-title animate-reveal">System <span className="serif">Overview</span></h1>
            <p className="header-subtitle animate-reveal delay-1">Real-time status of your financial ecosystem.</p>
          </div>
          <div className="header-actions animate-reveal delay-1">
            <button onClick={() => setShowManual(true)} className="btn-outline btn-mobile-icon" title="Manual Entry">
              <Plus size={16} /> <span className="btn-text">MANUAL ENTRY</span>
            </button>
            <label className="btn-premium btn-mobile-icon" style={{ cursor: 'pointer' }} title="Sync Ledger">
              <Upload size={16} /> <span className="btn-text">{uploading ? 'PROCESSING...' : 'SYNC LEDGER'}</span>
              <input type="file" hidden onChange={handleFileUpload} accept=".csv,.xlsx,.xls" />
            </label>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="dashboard-grid">
          {/* Main Chart */}
          <div className="glass-card chart-card animate-reveal grid-full-width">
            <div className="card-header">
              <div>
                <h3 className="card-title">Wealth Trajectory</h3>
                <p className="card-subtitle">Chronological expenditure synthesis</p>
              </div>
              <div className="card-metric">
                <span className="metric-label">TOTAL PERIOD SPEND</span>
                <span className="metric-value">₹{data?.summary?.total_expenses?.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAccent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--mono-40)" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--mono-40)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--mono-5)', border: '1px solid var(--glass-stroke)', borderRadius: '12px', fontSize: '0.8rem' }}
                    itemStyle={{ color: 'var(--mono-100)' }}
                  />
                  <Area type="monotone" dataKey="spent" stroke="var(--accent-primary)" strokeWidth={3} fill="url(#colorAccent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="stats-row">
            <div className="glass-card stat-card animate-reveal delay-1">
              <Activity color="var(--accent-emerald)" size={24} />
              <span className="stat-label">LEDGER ENTRIES</span>
              <span className="stat-value">{data?.transactions?.length}</span>
              <span className="stat-delta">ACTIVE PROTOCOLS</span>
            </div>

            <div className="glass-card stat-card animate-reveal delay-2">
              <TrendingUp color="var(--accent-amber)" size={24} />
              <span className="stat-label">PEAK SECTOR</span>
              <span className="stat-value text-amber">{highestCategory}</span>
              <span className="stat-delta">CONCENTRATED FLOW</span>
            </div>

            <div className={`glass-card anomaly-card animate-reveal delay-3 ${anomalies.length > 0 ? 'active' : ''}`}>
               <AlertCircle color={anomalies.length > 0 ? "var(--accent-rose)" : "var(--mono-40)"} size={24} />
               <span className="stat-label">SYSTEM ANOMALIES</span>
               <span className="stat-value text-rose">{anomalies.length}</span>
               <span className="stat-delta">{anomalies.length > 0 ? "ACTION REQUIRED" : "INTEGRITY SECURE"}</span>
            </div>
          </div>

          {/* Asset Breakdown - Now dynamic height */}
          <div className="glass-card breakdown-card animate-reveal delay-3">
            <h3 className="card-title">Sector Allocation</h3>
            <div className="breakdown-list">
              {categoryBreakdown.map(({name, value}: any, i: number) => (
                <div key={name} className="breakdown-item">
                  <div className="item-info">
                    <span className="item-name">{name}</span>
                    <span className="item-value">₹{value.toLocaleString()}</span>
                  </div>
                  <div className="progress-bg">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(value / (data.summary.total_expenses || 1)) * 100}%` }}
                      transition={{ duration: 1.5, delay: 0.8 + (i * 0.1), ease: "circOut" }}
                      className="progress-fill"
                      style={{ background: `linear-gradient(to right, var(--accent-primary), ${i % 2 === 0 ? 'var(--accent-secondary)' : 'var(--accent-emerald)'})` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Ledger - Full Width to avoid horizontal scroll */}
          <div className="glass-card ledger-card animate-reveal delay-3 grid-span-4">
            <div className="card-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="card-title">Recent Transactions</h3>
                <p className="card-subtitle">Real-time ledger of financial nodes</p>
              </div>
              <button onClick={handleDeleteAll} className="btn-purge">
                <Trash2 size={14} style={{ marginRight: '6px' }} /> PURGE SYSTEM DATA
              </button>
            </div>
            <div className="table-wrapper">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>TIMESTAMP</th>
                    <th>DESCRIPTION</th>
                    <th>SECTOR</th>
                    <th style={{ textAlign: 'right' }}>VOLUME</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.transactions?.slice(0, 15).map((tx: any, i: number) => (
                    <motion.tr 
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + (i * 0.05) }}
                      className={tx.is_anomaly ? 'anomaly-row' : ''}
                    >
                      <td className="cell-date">
                        {tx.is_anomaly && <AlertCircle size={14} className="anomaly-icon" />}
                        {tx.date}
                      </td>
                      <td className="cell-desc">
                        {tx.description}
                        {tx.is_anomaly && <div className="anomaly-reason">{tx.anomaly_reason}</div>}
                      </td>
                      <td className="cell-cat">
                        {editingId === tx.id ? (
                          <select 
                            autoFocus
                            className="cat-select"
                            value={tx.category}
                            onChange={(e) => handleCategoryUpdate(tx.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <span className="cat-badge" onClick={() => setEditingId(tx.id)}>
                            {tx.category} <Edit2 size={10} style={{ marginLeft: '4px', opacity: 0.5 }} />
                          </span>
                        )}
                      </td>
                      <td className={`cell-amount ${tx.type}`}>
                        {tx.type === 'expense' ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>


      </main>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {showManual && (
          <div className="modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass-card modal-content">
              <div className="modal-header">
                <h2 className="modal-title">New Entry <span className="serif">Protocol</span></h2>
                <button onClick={() => setShowManual(false)} className="btn-close"><X /></button>
              </div>
              <form onSubmit={handleManualSubmit} className="modal-form">
                <div className="form-group"><label>TIMESTAMP</label><input type="date" required value={manualTx.date} onChange={e => setManualTx({...manualTx, date: e.target.value})} className="input-field" /></div>
                <div className="form-group"><label>DESCRIPTION</label><input type="text" placeholder="Transaction narrative..." required value={manualTx.description} onChange={e => setManualTx({...manualTx, description: e.target.value})} className="input-field" /></div>
                <div className="form-group"><label>VOLUME (INR)</label><input type="number" step="0.01" placeholder="0.00" required value={manualTx.amount} onChange={e => setManualTx({...manualTx, amount: e.target.value})} className="input-field" /></div>
                <div className="form-row">
                  <div className="form-group"><label>TYPE</label><select value={manualTx.type} onChange={e => setManualTx({...manualTx, type: e.target.value})} className="input-field"><option value="expense">Expense</option><option value="income">Income</option></select></div>
                  <div className="form-group"><label>SECTOR</label><select value={manualTx.category} onChange={e => setManualTx({...manualTx, category: e.target.value})} className="input-field">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <button type="submit" className="btn-premium" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>COMMIT TO LEDGER</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .dashboard-layout { display: flex; min-height: 100vh; background: var(--mono-0); position: relative; color: var(--mono-90); }
        .dashboard-sidebar { border-right: 1px solid var(--border-subtle); padding: 3rem 1.5rem; display: flex; flex-direction: column; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px); z-index: 20; position: relative; flex-shrink: 0; }
        .sidebar-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 4rem; position: relative; }
        .sidebar-toggle-btn { position: absolute; right: -30px; top: 50%; transform: translateY(-50%); background: var(--mono-10); border: 1px solid var(--border-subtle); color: var(--mono-100); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justifyContent: center; cursor: pointer; z-index: 30; transition: var(--transition-smooth); }
        .sidebar-toggle-btn:hover { background: var(--accent-primary); border-color: var(--accent-primary); }
        .sidebar-nav { display: flex; flex-direction: column; gap: 0.75rem; }
        .nav-item { display: flex; align-items: center; gap: 1.25rem; padding: 14px 18px; border-radius: var(--radius-md); color: var(--mono-40); font-weight: 700; font-size: 0.9rem; transition: var(--transition-smooth); cursor: pointer; white-space: nowrap; }
        .nav-item:hover { color: var(--mono-100); background: rgba(255, 255, 255, 0.03); }
        .nav-item.active { color: var(--accent-primary); background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.1); }
        .sidebar-footer { marginTop: auto; padding: 1.5rem; background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); }
        .user-info { display: flex; flex-direction: column; gap: 4px; margin-bottom: 1.5rem; }
        .user-label { font-size: 0.6rem; font-weight: 900; letter-spacing: 0.15em; color: var(--mono-40); }
        .user-email { font-size: 0.8rem; font-weight: 700; color: var(--mono-100); word-break: break-all; }
        .btn-signout { width: 100%; padding: 10px; background: transparent; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); color: var(--mono-40); font-size: 0.7rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: var(--transition-smooth); }
        .btn-signout:hover { color: var(--accent-rose); border-color: var(--accent-rose); background: rgba(244, 63, 94, 0.05); }
        
        /* Responsive Grid System */
        .dashboard-main { flex: 1; padding: 4rem 5rem; overflow-y: auto; max-height: 100vh; position: relative; z-index: 10; transition: padding 0.4s var(--ease-out); min-width: 0; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 2rem; }
        .grid-full-width { grid-column: 1 / -1; }
        .stats-row { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5rem; flex-wrap: wrap; gap: 2rem; }
        .header-title { font-size: 3rem; margin-bottom: 0.5rem; }
        .header-subtitle { color: var(--mono-40); font-size: 1.1rem; }
        .header-actions { display: flex; gap: 1rem; }
        .chart-card { padding: 3rem; min-height: 450px; }
        .card-header { display: flex; justify-content: space-between; margin-bottom: 3rem; gap: 1rem; }
        .card-title { font-size: 1.25rem; margin-bottom: 0.5rem; }
        .card-subtitle { color: var(--mono-40); font-size: 0.85rem; }
        .card-metric { text-align: right; }
        .metric-label { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; color: var(--mono-40); display: block; margin-bottom: 4px; }
        .metric-value { font-size: 1.75rem; font-weight: 900; color: var(--mono-100); }
        .chart-wrapper { height: 350px; margin: 0 -1rem; }
        .stat-card, .anomaly-card { padding: 2.5rem; display: flex; flex-direction: column; gap: 0.75rem; transition: var(--transition-smooth); min-width: 0; }
        .anomaly-card.active { border-color: rgba(244, 63, 94, 0.3); background: rgba(244, 63, 94, 0.03); }
        .stat-label { font-size: 0.65rem; font-weight: 900; letter-spacing: 0.1em; color: var(--mono-40); }
        .stat-value { font-size: 2.25rem; font-weight: 900; color: var(--mono-100); overflow: hidden; text-overflow: ellipsis; }
        .text-amber { color: var(--accent-amber) !important; }
        .text-rose { color: var(--accent-rose) !important; }
        .stat-delta { font-size: 0.65rem; font-weight: 700; color: var(--mono-60); }
        .breakdown-card { padding: 2.5rem; min-width: 0; grid-column: span 1; }
        .ledger-card { padding: 3rem; min-width: 0; grid-column: span 2; }
        .breakdown-list { display: flex; flex-direction: column; gap: 1.75rem; margin-top: 2.5rem; }
        .breakdown-item { display: flex; flex-direction: column; gap: 0.75rem; }
        .item-info { display: flex; justify-content: space-between; font-size: 0.85rem; gap: 10px; }
        .item-name { color: var(--mono-40); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-value { color: var(--mono-100); font-weight: 800; }
        .progress-bg { height: 4px; background: rgba(255, 255, 255, 0.03); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 2px; }
        .btn-purge { background: transparent; border: none; color: var(--accent-rose); font-size: 0.7rem; font-weight: 900; letter-spacing: 0.1em; cursor: pointer; padding: 10px 16px; border: 1px solid rgba(244, 63, 94, 0.2); border-radius: var(--radius-sm); transition: var(--transition-smooth); display: flex; align-items: center; white-space: nowrap; }
        .btn-purge:hover { background: rgba(244, 63, 94, 0.1); border-color: var(--accent-rose); transform: scale(1.05); }
        .table-wrapper { margin: 0 -3rem; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .ledger-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .ledger-table th { padding: 1.5rem 3rem; text-align: left; font-size: 0.65rem; font-weight: 900; letter-spacing: 0.15em; color: var(--mono-40); border-bottom: 1px solid var(--border-subtle); }
        .ledger-table td { padding: 1.5rem 3rem; font-size: 0.85rem; border-bottom: 1px solid rgba(255, 255, 255, 0.02); }
        .anomaly-row { background: rgba(244, 63, 94, 0.02); }
        .anomaly-icon { color: var(--accent-rose); margin-right: 8px; vertical-align: middle; }
        .anomaly-reason { font-size: 0.7rem; color: var(--accent-rose); font-weight: 500; margin-top: 4px; }
        .cell-date { color: var(--mono-40); font-family: monospace; white-space: nowrap; }
        .cell-desc { font-weight: 700; color: var(--mono-100); }
        .cell-cat { cursor: pointer; }
        .cat-badge { padding: 4px 10px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: 8px; font-size: 0.7rem; font-weight: 700; color: var(--accent-primary); display: flex; align-items: center; width: fit-content; transition: var(--transition-smooth); }
        .cat-badge:hover { background: rgba(255, 255, 255, 0.08); border-color: var(--accent-primary); }
        .cat-select { background: var(--mono-10); border: 1px solid var(--accent-primary); border-radius: 8px; color: var(--mono-100); font-size: 0.7rem; padding: 4px 8px; outline: none; font-family: inherit; }
        .cell-amount { text-align: right; font-weight: 900; }
        .cell-amount.expense { color: var(--accent-rose); }
        .cell-amount.income { color: var(--accent-emerald); }
        .loading-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--mono-0); gap: 2rem; }
        .loading-text { font-size: 0.7rem; font-weight: 900; letter-spacing: 0.3em; color: var(--mono-40); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.9); backdrop-filter: blur(15px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .modal-content { width: 100%; max-width: 500px; padding: 4rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
        .modal-title { font-size: 1.75rem; }
        .btn-close { background: none; border: none; color: var(--mono-40); cursor: pointer; }
        .modal-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.6rem; font-weight: 900; color: var(--mono-40); letter-spacing: 0.1em; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        @media (max-width: 1400px) {
          .dashboard-main { padding: 3rem 2rem; }
          .header-title { font-size: 2.25rem; }
          .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
          .breakdown-card, .ledger-card { grid-column: span 2; }
        }

        @media (max-width: 1200px) {
          .dashboard-sidebar { 
            position: fixed; 
            height: 100vh; 
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            box-shadow: 20px 0 50px rgba(0,0,0,0.5);
            transition: transform 0.4s var(--ease-out), width 0.4s var(--ease-out);
          }
          .sidebar-closed .dashboard-sidebar { 
            transform: translateX(-100%); 
            width: 80px !important; /* Keep width for the toggle button area if needed */
          }
          .sidebar-closed .sidebar-toggle-btn {
            right: -40px;
            background: var(--mono-100);
            color: var(--mono-0);
          }
          .sidebar-toggle-btn { 
            right: -12px;
            background: var(--mono-100);
            color: var(--mono-0);
            width: 32px;
            height: 32px;
          }
        }

        @media (max-width: 768px) {
          .header-title { font-size: 1.75rem; }
          .dashboard-main { padding: 2rem 1.5rem; }
          .header-actions { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); z-index: 100; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); padding: 1rem; border-radius: 50px; border: 1px solid var(--border-strong); width: fit-content; }
          .btn-text { display: none; }
          .btn-mobile-icon { border-radius: 50% !important; width: 50px; height: 50px; padding: 0 !important; justify-content: center; }
          .dashboard-grid, .stats-row { grid-template-columns: 1fr; }
          .breakdown-card, .ledger-card { grid-column: span 1; }
          .chart-wrapper { height: 250px; }
          .stat-card, .anomaly-card { padding: 1.5rem; }
          .ledger-table th, .ledger-table td { padding: 1rem 1.5rem; }
          .cell-desc { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .btn-purge { font-size: 0.6rem; padding: 8px 12px; }
          .chart-card { padding: 1.5rem; }
          .metric-value { font-size: 1.25rem; }
        }
      `}</style>

    </div>
  );
}
