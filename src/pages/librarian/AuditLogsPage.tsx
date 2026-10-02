import React, { useState, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowDownLeft,
  Coins,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.details.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q);

      const matchAction = actionFilter === 'All' || log.action.includes(actionFilter);
      return matchSearch && matchAction;
    });
  }, [auditLogs, searchQuery, actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('ISSUE')) {
      return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">ISSUE</span>;
    }
    if (action.includes('RETURN')) {
      return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">RETURN</span>;
    }
    if (action.includes('APPROVE')) {
      return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">APPROVAL</span>;
    }
    if (action.includes('FINE')) {
      return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">FINE</span>;
    }
    return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">{action}</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-blue-900" />
            System Audit & Transaction Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable chronological ledger of circulation actions, staff overrides, and student requests.
          </p>
        </div>

        <div className="text-xs bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-slate-600 flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified Audit Trail ({auditLogs.length} events recorded)</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by actor, action description, or reference ID..."
            className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-600 outline-hidden transition"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
        >
          <option value="All">All Operations</option>
          <option value="ISSUE">Book Issues</option>
          <option value="RETURN">Book Returns</option>
          <option value="APPROVE">Request Approvals</option>
          <option value="FINE">Fine Transactions</option>
          <option value="BOOK">Catalog Updates</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Event Details & Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>

                  <td className="p-4">
                    {getActionBadge(log.action)}
                  </td>

                  <td className="p-4 font-bold text-slate-800 font-sans">
                    {log.actor}
                  </td>

                  <td className="p-4 text-slate-700 font-sans">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
