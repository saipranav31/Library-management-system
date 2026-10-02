import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  AlertTriangle,
  Coins,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  BookmarkCheck,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    books,
    requests,
    borrowings,
    fines,
    systemDate,
    requestRenewal,
  } = useLibrary();

  if (!currentUser) return null;

  // Student specific data
  const myBorrowings = borrowings.filter(
    b => (b.studentId === currentUser.studentId || b.studentEmail === currentUser.email) && b.status !== 'returned'
  );
  const myRequests = requests.filter(
    r => r.studentId === currentUser.studentId || r.studentRollNo === currentUser.studentId || r.studentEmail === currentUser.email
  );
  const myPendingRequests = myRequests.filter(r => ['Pending', 'Approved'].includes(r.status));

  // Overdue calculation (strictly ₹2 per day)
  const myOverdue = myBorrowings.filter(b => {
    const due = new Date(b.dueDate);
    return systemDate > due;
  });

  const totalOverdueFine = myOverdue.reduce((sum, b) => {
    const due = new Date(b.dueDate);
    const overdueDays = Math.max(0, Math.floor((systemDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
    return sum + (overdueDays * 2);
  }, 0);

  // Due soon calculation (<= 7 days remaining and >= 0)
  const myDueSoon = myBorrowings.filter(b => {
    const due = new Date(b.dueDate);
    const diffMs = due.getTime() - systemDate.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days <= 7 && days >= 0;
  });

  // Recent activity list
  const recentActivities = [
    ...myRequests.map(r => ({
      id: r.id,
      date: r.requestDate,
      title: `Book Request: ${r.status}`,
      desc: `"${r.bookTitle}" (Req: ${r.requestId})`,
      type: r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'error' : 'info',
      link: '/student/requests',
    })),
    ...myBorrowings.map(b => {
      const due = new Date(b.dueDate);
      const isLate = systemDate > due;
      return {
        id: b.id,
        date: b.issueDate,
        title: isLate ? 'Book Overdue' : 'Book Borrowed',
        desc: `"${b.bookTitle}" (Txn: ${b.transactionId})`,
        type: isLate ? 'error' : 'info',
        link: '/student/borrowed',
      };
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-300 font-semibold text-xs tracking-wider uppercase">
                BVC Library Portal
              </span>
              <span className="bg-blue-800/80 text-blue-200 text-[10px] px-2 py-0.5 rounded-full font-mono">
                {currentUser.department} • {currentUser.year || 'IV Year'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {currentUser.name}!
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-xl">
              Roll Number: <span className="font-mono text-white font-bold bg-blue-800/70 px-2 py-0.5 rounded">{currentUser.studentId}</span> • BVC College of Engineering
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/student/browse"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition"
            >
              <BookOpen className="w-4 h-4" />
              Browse Catalog
            </Link>
            <Link
              to="/student/requests"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-white/20 transition"
            >
              <ClipboardList className="w-4 h-4" />
              My Requests
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* ============================================================ */}
      {/* SECTION 14: STUDENT OVERDUE & FINE DISPLAY */}
      {/* ============================================================ */}
      {myOverdue.length > 0 && (
        <div className="space-y-3">
          {myOverdue.map(b => {
            const due = new Date(b.dueDate);
            const overdueDays = Math.max(0, Math.floor((systemDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
            const fine = overdueDays * 2;
            return (
              <div
                key={b.id}
                className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-950 shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-600 text-white text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md tracking-wider">
                      OVERDUE
                    </span>
                    <h3 className="font-extrabold text-base text-rose-950">
                      Book: {b.bookTitle}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-rose-900 pt-1">
                    <span>
                      Due Date: <strong>{due.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Days Overdue: <strong className="font-mono text-rose-950 font-bold">{overdueDays}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Current Fine: <strong className="font-mono font-extrabold text-rose-700 text-sm">₹{fine}</strong> (@ ₹2/day)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <Link
                    to="/student/fines"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Pay Fine
                  </Link>
                  <Link
                    to="/student/borrowed"
                    className="px-3.5 py-2 bg-white text-rose-800 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-xl transition"
                  >
                    View Loan
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Books Currently Borrowed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Currently Borrowed
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{myBorrowings.length}</span>
            <span className="text-xs text-slate-500 font-medium">/ 4 max limit</span>
          </div>
          <Link
            to="/student/borrowed"
            className="mt-3 text-xs font-semibold text-blue-900 hover:underline inline-flex items-center gap-1 group"
          >
            Manage active loans <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Requests
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{myPendingRequests.length}</span>
            <span className="text-xs text-amber-700 font-medium">
              {myRequests.filter(r => r.status === 'Approved').length > 0
                ? `${myRequests.filter(r => r.status === 'Approved').length} approved`
                : 'in review'}
            </span>
          </div>
          <Link
            to="/student/requests"
            className="mt-3 text-xs font-semibold text-blue-900 hover:underline inline-flex items-center gap-1 group"
          >
            Track request status <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {/* Books Due Soon */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Books Due Soon
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{myDueSoon.length}</span>
            <span className="text-xs text-orange-600 font-medium">due in &le; 7 days</span>
          </div>
          <Link
            to="/student/borrowed"
            className="mt-3 text-xs font-semibold text-blue-900 hover:underline inline-flex items-center gap-1 group"
          >
            Review return dates <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {/* Section 14: Outstanding Fine */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Outstanding Fine
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${totalOverdueFine > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              ₹{totalOverdueFine}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {totalOverdueFine > 0 ? `${myOverdue.length} book(s) overdue` : '₹0 dues pending'}
            </span>
          </div>
          <Link
            to="/student/fines"
            className="mt-3 text-xs font-semibold text-blue-900 hover:underline inline-flex items-center gap-1 group"
          >
            Fine statement <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>

      {/* Active Borrowings & Deadlines */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5 text-blue-900" />
              Active Borrowings & Deadlines
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard BVC Library loan is 15 days. Overdue penalty is ₹2 per calendar day.
            </p>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Date: {systemDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {myBorrowings.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-sm text-slate-800">No books currently borrowed</p>
            <p className="text-xs text-slate-500 mt-1">Explore our catalog and submit a request using your Roll Number.</p>
            <Link
              to="/student/browse"
              className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myBorrowings.map(item => {
              const due = new Date(item.dueDate);
              const diffMs = due.getTime() - systemDate.getTime();
              const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              const isOverdue = daysRemaining < 0;
              const overdueDays = isOverdue ? Math.abs(daysRemaining) : 0;
              const fine = isOverdue ? overdueDays * 2 : 0;

              return (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
                      alt={item.bookTitle}
                      className="w-12 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                          {item.bookId}
                        </span>
                        {isOverdue ? (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                            OVERDUE ({overdueDays}d)
                          </span>
                        ) : daysRemaining <= 3 ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                            Due in {daysRemaining}d
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            On Track ({daysRemaining}d)
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{item.bookTitle}</h4>
                      <p className="text-xs text-slate-500">By {item.bookAuthor}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right text-xs">
                      <span className="text-slate-400 block text-[10px]">Due Date</span>
                      <strong className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                        {due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </strong>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-slate-400 block text-[10px]">Fine (₹2/day)</span>
                      <strong className={fine > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                        ₹{fine}
                      </strong>
                    </div>

                    <Link
                      to="/student/borrowed"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Recent Library Timeline
        </h2>
        {recentActivities.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No recent transactions recorded on this account.</p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map(act => (
              <div key={act.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">{act.title}</p>
                  <p className="text-slate-500 text-[11px]">{act.desc}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(act.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
