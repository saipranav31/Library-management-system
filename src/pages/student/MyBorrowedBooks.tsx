import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { Link } from 'react-router-dom';
import {
  BookmarkCheck,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Coins,
  History,
  BookOpen,
} from 'lucide-react';
import { Borrowing } from '../../types';

export const MyBorrowedBooks: React.FC = () => {
  const { currentUser } = useAuth();
  const { borrowings, requestRenewal, systemDate } = useLibrary();

  const [tab, setTab] = useState<'active' | 'history'>('active');

  if (!currentUser) return null;

  const myBorrowings = borrowings.filter(
    b => b.studentId === currentUser.studentId || b.studentEmail === currentUser.email
  );
  const activeLoans = myBorrowings.filter(b => b.status !== 'returned');
  const returnedHistory = myBorrowings.filter(b => b.status === 'returned');

  const displayedLoans = tab === 'active' ? activeLoans : returnedHistory;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookmarkCheck className="w-7 h-7 text-blue-900" />
            My Borrowed Books
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor active loans, issue dates, due dates, loan periods, and fine status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-700 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 font-semibold shadow-2xs">
            Active Loans: <strong className="text-blue-900">{activeLoans.length}</strong> / 4 books
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setTab('active')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            tab === 'active'
              ? 'border-b-2 border-blue-900 text-blue-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          Active Borrowings ({activeLoans.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            tab === 'history'
              ? 'border-b-2 border-blue-900 text-blue-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Returned History ({returnedHistory.length})
        </button>
      </div>

      {/* List / Table */}
      {displayedLoans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            {tab === 'active' ? 'No books currently borrowed' : 'No past borrowing history'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {tab === 'active'
              ? 'Visit the BVC Library catalog to request books for study and coursework.'
              : 'Books returned to the circulation desk will appear in your history.'}
          </p>
          {tab === 'active' && (
            <Link
              to="/student/browse"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Browse Catalog
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedLoans.map(loan => {
            const due = new Date(loan.dueDate);
            const diffMs = due.getTime() - systemDate.getTime();
            const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const isReturned = loan.status === 'returned';
            const isOverdue = daysRemaining < 0 && !isReturned;
            const overdueDays = isOverdue ? Math.abs(daysRemaining) : 0;
            // Fine rule: exactly ₹2 per day after due date
            const fineAmount = isOverdue ? overdueDays * 2 : (loan.fineAmount || 0);

            const isDueToday = daysRemaining === 0 && !isReturned;
            const isDueSoon = daysRemaining <= 7 && daysRemaining > 0 && !isReturned;

            const canRenew =
              !isReturned &&
              loan.renewalCount < loan.maxRenewals &&
              loan.renewalStatus !== 'pending' &&
              !isOverdue;

            return (
              <div
                key={loan.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={loan.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
                    alt={loan.bookTitle}
                    className="w-16 h-22 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-bold">
                        Book ID: {loan.bookId}
                      </span>
                      {isReturned ? (
                        <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> Returned on {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString('en-GB') : '—'}
                        </span>
                      ) : isOverdue ? (
                        <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> OVERDUE ({overdueDays} days)
                        </span>
                      ) : isDueToday ? (
                        <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Due Today
                        </span>
                      ) : isDueSoon ? (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Due Soon ({daysRemaining} days left)
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> On Track ({daysRemaining} days left)
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {loan.bookTitle}
                    </h3>
                    <p className="text-xs text-slate-500">Author: {loan.bookAuthor}</p>

                    {/* Section 11 Specification Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100 mt-2">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Issue Date</span>
                        <strong className="text-slate-800 font-semibold">
                          {new Date(loan.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Due Date</span>
                        <strong className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800 font-semibold'}>
                          {due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Days Remaining</span>
                        <strong className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-900 font-semibold'}>
                          {isReturned ? 'Completed' : isOverdue ? `${overdueDays} days late` : `${daysRemaining} days`}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Fine (₹2/day)</span>
                        <strong className={fineAmount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                          ₹{fineAmount}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!isReturned && (
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => requestRenewal(loan.id)}
                      disabled={!canRenew}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {loan.renewalStatus === 'pending'
                        ? 'Renewal Submitted'
                        : loan.renewalCount >= loan.maxRenewals
                        ? 'Max Renewals Reached'
                        : isOverdue
                        ? 'Pay Fine to Renew'
                        : 'Renew Book (+15 Days)'}
                    </button>

                    {isOverdue && (
                      <Link
                        to="/student/fines"
                        className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <Coins className="w-3.5 h-3.5" /> Pay Fine of ₹{fineAmount}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
