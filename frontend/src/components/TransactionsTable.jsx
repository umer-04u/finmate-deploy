import React from 'react';
import { AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
import { updateTransactionCategory } from '../services/api';

const CATEGORIES = [
  "Income",
  "Food & Dining",
  "Transportation",
  "Shopping & Groceries",
  "Utilities",
  "Health & Fitness",
  "Entertainment",
  "Housing",
  "Transfers/P2P",
  "Other/Uncategorized"
];

const TransactionsTable = ({ transactions, onCategoryChange }) => {
  const sortedTransactions = [...(transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleCategoryChange = async (txId, newCategory) => {
    try {
      const result = await updateTransactionCategory(txId, newCategory);
      if (result.status === 'success') {
        onCategoryChange(result.data);
      }
    } catch (err) {
      console.error("Failed to update category:", err);
      alert("Failed to update category. Please try again.");
    }
  };

  if (!sortedTransactions || sortedTransactions.length === 0) {
    return (
      <div className="bg-darkCard rounded-xl p-8 text-center text-textSecondary border border-slate-700/50">
        No transactions uploaded yet.
      </div>
    );
  }

  return (
    <div className="bg-darkCard rounded-xl overflow-hidden border border-slate-700/50 shadow-lg">
      <div className="p-4 md:p-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-textPrimary">Recent Transactions</h2>
        <span className="text-sm px-3 py-1 bg-slate-800 rounded-full text-slate-300 border border-slate-700">
          Showing {Math.min(sortedTransactions.length, 50)} items
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-textSecondary text-xs uppercase tracking-wider">
              <th className="px-4 md:px-6 py-4 font-medium hidden sm:table-cell">Date</th>
              <th className="px-4 md:px-6 py-4 font-medium">Description</th>
              <th className="px-4 md:px-6 py-4 font-medium hidden md:table-cell">Category</th>
              <th className="px-4 md:px-6 py-4 font-medium">Amount</th>
              <th className="px-4 md:px-6 py-4 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sortedTransactions.slice(0, 50).map((tx, idx) => (
              <tr key={tx.id || idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 md:px-6 py-4 text-sm whitespace-nowrap text-slate-300 hidden sm:table-cell">
                  {tx.date}
                </td>
                <td className="px-4 md:px-6 py-4 text-sm text-textPrimary font-medium max-w-[120px] sm:max-w-[200px] md:max-w-xs truncate" title={tx.description}>
                  {tx.description}
                </td>
                <td className="px-4 md:px-6 py-4 text-sm text-textSecondary hidden md:table-cell">
                  <div className="relative inline-block group">
                    <select
                      value={tx.category}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                      className="appearance-none bg-slate-800 border border-slate-700/50 text-slate-300 text-xs rounded-md px-2 py-1 pr-7 cursor-pointer hover:border-accentBlue/50 transition-colors focus:outline-none focus:ring-1 focus:ring-accentBlue"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                  </div>
                </td>
                <td className={`px-4 md:px-6 py-4 text-sm font-semibold whitespace-nowrap ${
                  tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                }`}>
                  <span className="sm:hidden text-[10px] mr-0.5">{tx.type === "income" ? "+" : "-"}</span>₹{Math.abs(tx.amount).toFixed(0)}
                </td>

                <td className="px-4 md:px-6 py-4 text-sm text-center">
                  <div className="flex justify-center items-center">
                    {tx.is_anomaly ? (
                      <div className="text-rose-400 p-1" title={tx.anomaly_reason}>
                        <AlertTriangle size={18} />
                      </div>
                    ) : (
                      <div className="text-emerald-400 opacity-60 p-1">
                        <CheckCircle size={18} />
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;
