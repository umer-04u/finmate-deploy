import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const TransactionsTable = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-darkCard rounded-xl p-8 text-center text-textSecondary border border-slate-700/50">
        No transactions uploaded yet.
      </div>
    );
  }

  return (
    <div className="bg-darkCard rounded-xl overflow-hidden border border-slate-700/50 shadow-lg">
      <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-textPrimary">Recent Transactions</h2>
        <span className="text-sm px-3 py-1 bg-slate-800 rounded-full text-slate-300 border border-slate-700">
          Showing {Math.min(transactions.length, 50)} items
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-textSecondary text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {transactions.slice(0, 50).map((tx, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-300">
                  {tx.date}
                </td>
                <td className="px-6 py-4 text-sm text-textPrimary font-medium max-w-xs truncate">
                  {tx.description}
                </td>
                <td className="px-6 py-4 text-sm text-textSecondary">
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/50">
                     {tx.category}
                  </span>
                </td>
                <td className={`px-6 py-4 text-sm font-semibold whitespace-nowrap ${
                  tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {tx.type === "income" ? "+" : "-"}₹{Math.abs(tx.amount).toFixed(2)}
                </td>

                <td className="px-6 py-4 text-sm flex justify-center">
                  {tx.is_anomaly ? (
                    <div className="flex items-center text-rose-400 bg-rose-400/10 px-2 py-1 rounded border border-rose-400/20" title={tx.anomaly_reason}>
                      <AlertTriangle size={16} className="mr-1" />
                      <span>Anomaly</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-emerald-400 opacity-60">
                      <CheckCircle size={16} className="mr-1" />
                      <span className="text-xs">Normal</span>
                    </div>
                  )}
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
