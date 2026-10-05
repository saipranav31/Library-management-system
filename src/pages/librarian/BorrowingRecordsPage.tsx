import React, { useState, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Link } from 'react-router-dom';
import {
  BookmarkCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  Calendar,
  Coins,
  AlertTriangle,
  Send,
  BellRing,
  Info,
} from 'lucide-react';
import { Borrowing } from '../../types';
import { Modal } from '../../components/common/Modal';

export const BorrowingRecordsPage: React.FC = () => {
  const { borrowings, systemDate, requestImmediateReturn } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBorrowingForRecall, setSelectedBorrowingForRecall] = useState<Borrowing | null>(null);
  const [recallMessage, setRecallMessage] = useState('Please return this book to the library immediately because it is required by another student.');

  const filteredBorrowings = useMemo(() => {
    return borrowings.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.studentName.toLowerCase().includes(q) ||
        b.studentId.toLowerCase().includes(q) ||
        b.bookTitle.toLowerCase().includes(q) ||
        b.transactionId.toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === 'active' || statusFilter === 'issued') {
        matchStatus = b.status === 'active' || b.status === 'issued';
      } else if (statusFilter === 'overdue') {
        matchStatus = b.status === 'overdue';
      } else if (statusFilter === 'returned') {
        matchStatus = b.status === 'returned';
      } else if (statusFilter === 'immediate_return') {
        matchStatus = b.immediateReturnRequested && b.status !== 'returned';
      }

      return matchSearch && matchStatus;
    });
  }, [borrowings, searchQuery, statusFilter]);

  const handleOpenRecallModal = (b: Borrowing) => {
    setSelectedBorrowingForRecall(b);
    setRecallMessage(b.immediateReturnMessage || 'Please return this book to the library immediately because it is required by another student.');
  };

  const handleConfirmRecall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrowingForRecall) return;
    requestImmediateReturn(selectedBorrowingForRecall.id, recallMessage);
    setSelectedBorrowingForRecall(null);
  };

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
            Master ledger of physical books issued to students. Issue urgent immediate return notices when books are required.
          </p>
        </div>

        <Link
          to="/librarian/returns"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto cursor-pointer"
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
          {[
            { id: 'All', label: 'All Records' },
            { id: 'active', label: 'Active Loans' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'immediate_return', label: 'Immediate Recalls' },
            { id: 'returned', label: 'Returned' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
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
                <th className="p-4 text-center">Loan Duration</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {borrowings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <BookmarkCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No borrowing records available</p>
                    <p className="text-xs text-slate-400 mt-0.5">Circulation loans will appear here once books are verified and marked as taken at the counter.</p>
                  </td>
                </tr>
              ) : filteredBorrowings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No borrowing records found for this filter.
                  </td>
                </tr>
              ) : (
                filteredBorrowings.map(b => {
                  const due = new Date(b.dueDate);
                  const isReturned = b.status === 'returned';
                  const isLate = systemDate > due && !isReturned;
                  const duration = b.loanDurationDays || 14;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {b.transactionId}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{b.studentName}</div>
                        <span className="font-mono text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {b.studentId}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-900">{b.bookTitle}</div>
                        <span className="text-slate-400 font-mono text-[10px]">{b.bookId}</span>
                      </td>

                      <td className="p-4 text-slate-600">
                        {new Date(b.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Configured Loan Duration (CHANGE 4) */}
                      <td className="p-4 text-center font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {duration} Days
                        </span>
                      </td>

                      <td className="p-4 font-semibold">
                        <span className={isLate ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          {isReturned ? (
                            <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-slate-500" /> Returned
                            </span>
                          ) : isLate ? (
                            <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Overdue (₹{b.fineAmount || 0})
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Active Loan
                            </span>
                          )}

                          {b.immediateReturnRequested && !isReturned && (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-700" /> Urgent Return Sent
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions: Request Immediate Return (CHANGE 5) */}
                      <td className="p-4 text-right">
                        {!isReturned ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenRecallModal(b)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Request Immediate Return"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                              <span className="hidden sm:inline">Recall</span>
                            </button>

                            <Link
                              to={`/librarian/returns?search=${b.transactionId}`}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                            >
                              Return
                            </Link>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
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

      {/* Confirmation Modal for Request Immediate Return (CHANGE 5) */}
      {selectedBorrowingForRecall && (
        <Modal
          isOpen={!!selectedBorrowingForRecall}
          onClose={() => setSelectedBorrowingForRecall(null)}
          title="REQUEST IMMEDIATE RETURN"
          subtitle="Send urgent recall notification to student"
        >
          <form onSubmit={handleConfirmRecall} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Send immediate return request to this student?</span>
              </div>
              <p className="text-amber-900 text-[11px]">
                This will dispatch a high-priority URGENT notification to the student's dashboard, notification center, and active loans list requesting immediate physical return to the library desk.
              </p>

              <div className="pt-2 border-t border-amber-200/80 space-y-1 text-[11px]">
                <p>Student: <strong>{selectedBorrowingForRecall.studentName}</strong> (Roll No: <span className="font-mono font-bold">{selectedBorrowingForRecall.studentId}</span>)</p>
                <p>Book: <strong>{selectedBorrowingForRecall.bookTitle}</strong> ({selectedBorrowingForRecall.bookId})</p>
                <p>Due Date: <strong>{new Date(selectedBorrowingForRecall.dueDate).toLocaleDateString('en-GB')}</strong></p>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                Librarian Urgent Message *
              </label>
              <textarea
                rows={3}
                required
                value={recallMessage}
                onChange={e => setRecallMessage(e.target.value)}
                placeholder="Enter urgent recall reason..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white text-slate-900 outline-hidden font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                This message will be shown prominently to the student under URGENT NOTICES.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBorrowingForRecall(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                CONFIRM & DISPATCH
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
