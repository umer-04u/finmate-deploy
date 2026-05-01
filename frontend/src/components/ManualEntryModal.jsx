import React, { useState } from 'react';
import { X, Plus, Calendar, Type, DollarSign } from 'lucide-react';
import { addManualTransaction } from '../services/api';

const ManualEntryModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await addManualTransaction({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      if (result.status === 'success') {
        onSuccess(result.data);
        onClose();
        setFormData({
          date: new Date().toISOString().split('T')[0],
          description: '',
          amount: '',
          type: 'expense'
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-darkCard w-full max-w-md border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus className="text-accentBlue" size={24} /> Add Transaction
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/50 text-rose-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Calendar size={14} /> Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Type size={14} /> Description
            </label>
            <input
              type="text"
              placeholder="e.g. Morning Coffee"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Type</label>
                <select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentBlue/50"
                >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Amount</label>
                <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentBlue/50 transition-all"
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accentBlue hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all mt-4"
          >
            {loading ? 'Adding...' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;
