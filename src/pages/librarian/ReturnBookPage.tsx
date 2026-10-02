import React, { useState, useEffect, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { useSearchParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowDownLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Borrowing } from '../../types';

export const ReturnBookPage: React.FC = () => {
  const { borrowings, returnBook, systemDate } = useLibrary();
  const [searchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedBorrowing, setSelectedBorrowing] = useState<Borrowing | null>(null);
  const [bookCondition, setBookCondition] = useState<'Good' | 'Minor Wear' | 'Damaged'>('Good');
  const [returnSuccess, setReturnSuccess] = useState<any | null>(null);

  // Active unreturned borrowings
  const activeBorrowings = borrowings.filter(b => b.status !== 'returned');

  // Search results
  const matchingBorrowings = useMemo(() => {
    if (!searchTerm.trim()) return activeBorrowings.slice(0, 5);
    const q = searchTerm.toLowerCase().trim();
    return activeBorrowings.filter(
      b =>
        b.studentName.toLowerCase().includes(q) ||
        b.studentId.toLowerCase().includes(q) ||
        b.bookTitle.toLowerCase().includes(q) ||
        b.transactionId.toLowerCase().includes(q)
    );
  }, [activeBorrowings, searchTerm]);

  // If query param passed in URL, auto-select
  useEffect(() => {
    if (initialSearch) {
      const match = activeBorrowings.find(b => b.transactionId === initialSearch);
      if (match) setSelectedBorrowing(match);
    }
  }, [initialSearch, activeBorrowings]);

  // Overdue calculation for currently selected borrowing (strictly ₹2 per day)
  const overdueStats = useMemo(() => {
    if (!selectedBorrowing) return null;
    const due = new Date(selectedBorrowing.dueDate);
    const diffMs = systemDate.getTime() - due.getTime();
    const overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const calculatedFine = overdueDays * 2;
    return {
      dueDate: due,
      isOverdue: overdueDays > 0,
      overdueDays,
      calculatedFine,
    };
  }, [selectedBorrowing, systemDate]);

  const handleProcessReturn = () => {
    if (!selectedBorrowing) return;

    const res = returnBook(selectedBorrowing.id);
    if (res.success) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      setReturnSuccess({
        bookTitle: selectedBorrowing.bookTitle,
        studentName: selectedBorrowing.studentName,
        studentId: selectedBorrowing.studentId,
        fineGenerated: res.fine,
        returnedDate: systemDate,
      });
      setSelectedBorrowing(null);
      setSearchTerm('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ArrowDownLeft className="w-7 h-7 text-emerald-700" />
          Book Return & Fine Processing Desk
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Process physical book returns, verify due date timeliness, and assess automated overdue charges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Search Active Loans (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="font-bold text-base text-slate-900">
              Lookup Active Borrowing Record
            </h2>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by Student Roll Number (e.g. 246M1A0000), Transaction ID, or Title..."
                className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-600 outline-hidden transition"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {matchingBorrowings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching active borrowings found.
                </div>
              ) : (
                matchingBorrowings.map(b => {
                  const due = new Date(b.dueDate);
                  const isLate = systemDate > due;

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBorrowing(b)}
                      className={`p-3 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                        selectedBorrowing?.id === b.id
                          ? 'bg-blue-50/80 border border-blue-200 ring-1 ring-blue-100'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700 text-xs">
                            {b.transactionId}
                          </span>
                          {isLate && (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-900 text-xs">{b.bookTitle}</p>
                        <p className="text-slate-500 text-[11px]">
                          Borrower: <strong className="text-slate-700">{b.studentName}</strong> ({b.studentId})
                        </p>
                      </div>

                      <div className="text-right text-xs shrink-0">
                        <span className="text-slate-400 block text-[10px]">Due Date</span>
                        <span className={isLate ? 'text-rose-600 font-bold' : 'text-slate-800 font-medium'}>
                          {due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Return Success Confirmation Card */}
          {returnSuccess && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-md space-y-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-base text-emerald-950">Book Return Recorded Successfully!</h3>
                  <p className="text-xs text-emerald-800">
                    Physical copy restocked into available inventory.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-1">
                <p><strong>Title:</strong> {returnSuccess.bookTitle}</p>
                <p><strong>Student:</strong> {returnSuccess.studentName} ({returnSuccess.studentId})</p>
                {returnSuccess.fineGenerated ? (
                  <p className="text-rose-600 font-bold">
                    Overdue penalty assessed: ₹{returnSuccess.fineGenerated.amount} ({returnSuccess.fineGenerated.overdueDays} days @ ₹2/day)
                  </p>
                ) : (
                  <p className="text-emerald-700 font-semibold">Returned on time. Zero fines assessed.</p>
                )}
              </div>

              <button
                onClick={() => setReturnSuccess(null)}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition"
              >
                Clear for Next Return
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Return Verification & Action (5 cols) */}
        <div className="lg:col-span-5">
          {selectedBorrowing && overdueStats ? (
            <div className="bg-white rounded-2xl border-2 border-emerald-600/40 p-6 shadow-lg space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono text-xs font-bold text-slate-700">
                  {selectedBorrowing.transactionId}
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  Active Loan
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                  {selectedBorrowing.bookTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Author: {selectedBorrowing.bookAuthor}</p>
                <p className="text-[11px] font-mono text-slate-400">ID: {selectedBorrowing.bookId}</p>
              </div>

              {/* Student info */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <strong className="text-slate-900">{selectedBorrowing.studentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID / Dept:</span>
                  <strong className="font-mono text-slate-900">{selectedBorrowing.studentId} ({selectedBorrowing.studentDept})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Issued On:</span>
                  <span>{new Date(selectedBorrowing.issueDate).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Due Date:</span>
                  <span className="font-bold text-slate-900">{overdueStats.dueDate.toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Overdue Calculation Assessment Box */}
              <div className={`p-4 rounded-xl border ${
                overdueStats.isOverdue ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                {overdueStats.isOverdue ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 font-bold text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      OVERDUE DEADLINE EXCEEDED
                    </div>
                    <p className="text-xs">
                      Exceeded return deadline by <strong>{overdueStats.overdueDays} calendar days</strong>.
                    </p>
                    <div className="pt-2 flex justify-between items-center text-sm font-extrabold text-rose-700 border-t border-rose-200/80">
                      <span>Automated Fine (₹2/day):</span>
                      <span>₹{overdueStats.calculatedFine}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Returned on schedule! Zero overdue penalty assessed.</span>
                  </div>
                )}
              </div>

              {/* Physical Condition Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Book Physical Condition
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Good', 'Minor Wear', 'Damaged'] as const).map(cond => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setBookCondition(cond)}
                      className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        bookCondition === cond
                          ? 'border-blue-900 bg-blue-50 text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Return */}
              <button
                onClick={handleProcessReturn}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                CONFIRM BOOK RETURN
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-3">
              <ArrowDownLeft className="w-12 h-12 mx-auto text-slate-300 opacity-60" />
              <h3 className="font-bold text-slate-700 text-sm">Select a borrowing record</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Search active borrowings on the left or select an item to inspect return due date and fine calculation.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
