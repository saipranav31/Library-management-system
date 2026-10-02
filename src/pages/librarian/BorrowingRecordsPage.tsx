import React, { useState, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Link } from 'react-router-dom';
import {
  BookmarkCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  Calendar,
  Coins,
} from 'lucide-react';

export const BorrowingRecordsPage: React.FC = () => {
  const { borrowings, systemDate } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredBorrowings = useMemo(() => {
    return borrowings.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.studentName.toLowerCase().includes(q) ||
        b.studentId.toLowerCase().includes(q) ||
        b.bookTitle.toLowerCase().includes(q) ||
        b.transactionId.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [borrowings, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookmarkCheck className="w-7 h-7 text-blue-900" />
            Active Loans & Circulation Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Master ledger of all physical books issued to enrolled students.
          </p>
        </div>

        <Link
          to="/librarian/returns"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <ArrowDownLeft className="w-4 h-4" />
          Process Book Return
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, transaction ID, or title..."
            className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-600 outline-hidden transition"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'issued', 'overdue', 'returned'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'issued' ? 'Active Loans' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Borrowings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4">Txn Ref</th>
                <th className="p-4">Student</th>
                <th className="p-4">Book Title</th>
                <th className="p-4">Issue Date</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status & Fines</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBorrowings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No borrowing records found.
                  </td>
                </tr>
              ) : (
                filteredBorrowings.map(b => {
                  const due = new Date(b.dueDate);
                  const isOverdue = b.status === 'overdue' || (b.status !== 'returned' && systemDate > due);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {b.transactionId}
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-900">{b.studentName}</p>
                        <p className="text-slate-400 font-mono text-[11px]">
                          {b.studentId} • {b.studentDept}
                        </p>
                      </td>

                      <td className="p-4 font-semibold text-slate-900 max-w-xs truncate">
                        {b.bookTitle}
                      </td>

                      <td className="p-4 text-slate-600">
                        {new Date(b.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>

                      <td className="p-4 font-medium">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                          {due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      <td className="p-4">
                        {b.status === 'returned' ? (
                          <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-slate-500" /> Returned
                          </span>
                        ) : isOverdue ? (
                          <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" /> Overdue (₹{b.fineAmount} fine)
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Active Loan
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {b.status !== 'returned' ? (
                          <Link
                            to={`/librarian/returns?search=${encodeURIComponent(b.transactionId)}`}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            Return
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-xs">Cleared</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
