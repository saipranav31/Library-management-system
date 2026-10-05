import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Boxes,
  ClipboardList,
  BookmarkCheck,
  AlertCircle,
  Coins,
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  ChevronRight,
  ExternalLink,
  Layers,
  UserCheck,
  Sun,
  Sunset,
  Coffee,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatISTTime12, getISTDetails } from '../../utils/sessionUtils';

export const LibrarianDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    books,
    requests,
    borrowings,
    fines,
    systemDate,
    sessionInfo,
    markRequestAsTaken,
    settings,
  } = useLibrary();
  const navigate = useNavigate();

  const ist = getISTDetails(systemDate);
  const todayIST = ist.dateStr;

  // Key KPI calculations
  const totalCatalogTitles = books.length;
  const totalPhysicalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const totalAvailableCopies = books.reduce((acc, b) => acc + b.availableCopies, 0);
  const totalIssuedCopies = books.reduce((acc, b) => acc + b.issuedCopies, 0);

  // Today's requests breakdown
  const todayRequests = useMemo(() => {
    return requests.filter(r => {
      const rDate = r.sessionDate || (r.requestDate ? getISTDetails(new Date(r.requestDate)).dateStr : todayIST);
      return rDate === todayIST;
    });
  }, [requests, todayIST]);

  const grantedToday = todayRequests.filter(r => r.status === 'Granted' || r.status === 'Approved').length;
  const takenToday = todayRequests.filter(r => r.status === 'Taken' || r.status === 'Issued').length;
  const expiredToday = todayRequests.filter(r => r.status === 'Expired').length;
  const waitlistedToday = todayRequests.filter(r => r.status === 'Waitlisted').length;

  const activeBorrowings = borrowings.filter(b => b.status !== 'returned');
  const overdueBorrowings = borrowings.filter(b => b.status === 'overdue');

  const pendingFines = fines.filter(f => f.status === 'pending');
  const totalPendingFineAmount = pendingFines.reduce((acc, f) => acc + f.amount, 0);

  // Low stock books (<= threshold)
  const lowStockBooks = books.filter(b => b.availableCopies <= settings.lowStockThreshold && b.availableCopies > 0);
  const outOfStockBooks = books.filter(b => b.availableCopies === 0);

  // Immediate Return Requests count
  const immediateReturnBorrowings = borrowings.filter(b => b.status !== 'returned' && b.immediateReturnRequested);

  // Current session pending grants (FIFO)
  const activeSessionGrants = useMemo(() => {
    if (!sessionInfo.isActive) return [];
    return requests.filter(r => {
      const isGranted = r.status === 'Granted' || r.status === 'Approved';
      const isSameDate = r.sessionDate ? r.sessionDate === todayIST : false;
      const isSameSession = r.session === sessionInfo.session;
      return isGranted && isSameDate && isSameSession;
    });
  }, [requests, todayIST, sessionInfo.isActive, sessionInfo.session]);

  // Departmental Borrowing Distribution
  const deptData = [
    { name: 'CSE', count: borrowings.filter(b => b.studentDept === 'CSE').length },
    { name: 'AIML', count: borrowings.filter(b => b.studentDept === 'AIML').length },
    { name: 'ECE', count: borrowings.filter(b => b.studentDept === 'ECE').length },
    { name: 'EEE', count: borrowings.filter(b => b.studentDept === 'EEE').length },
    { name: 'MECH', count: borrowings.filter(b => b.studentDept === 'MECH').length },
    { name: 'CIVIL', count: borrowings.filter(b => b.studentDept === 'CIVIL').length },
    { name: 'MBA', count: borrowings.filter(b => b.studentDept === 'MBA').length },
  ];

  // Stock status pie data
  const stockData = [
    { name: 'Available on Shelf', value: totalAvailableCopies, color: '#10B981' },
    { name: 'Currently Issued', value: totalIssuedCopies, color: '#1E3A8A' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-blue-300 font-bold text-xs tracking-wider uppercase">
              Circulation Management Hub • {settings.collegeName}
            </span>
            <span className="bg-blue-800 text-blue-200 text-[10px] px-2 py-0.5 rounded-full font-mono">
              Academic Year: {settings.currentAcademicYear || '2026-2027'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Library Administration Console
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Session-based request evaluation, FIFO automatic allocation, counter roll-number verification, and circulation control.
          </p>
        </div>

        {/* Quick Action Station Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/librarian/verify"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            Verify Student / Issue Book
          </Link>

          <Link
            to="/librarian/queue"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <Layers className="w-4 h-4" />
            Session Queue
          </Link>

          <Link
            to="/librarian/returns"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Quick Return
          </Link>
        </div>
      </div>

      {/* REQUIRED DASHBOARD CARDS: Session, Today's Requests, Overdue, Fines, Low Stock, Immediate Returns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: Today's Active Session */}
        <div className="bg-white rounded-2xl p-5 border-2 border-blue-900/15 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-blue-950 uppercase tracking-wider">
                Today's Active Session
              </span>
              {sessionInfo.session === 'Morning' ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : sessionInfo.session === 'Afternoon' ? (
                <Sunset className="w-5 h-5 text-indigo-500" />
              ) : (
                <Coffee className="w-5 h-5 text-slate-400" />
              )}
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${
                  sessionInfo.session === 'Closed' ? 'text-slate-600' : 'text-blue-900'
                }`}>
                  {sessionInfo.session}
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold">
                  {ist.time12} IST
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                Session Time: <strong className="text-slate-900">{sessionInfo.sessionTimeLabel}</strong>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {sessionInfo.nextSessionText}
              </p>
            </div>
          </div>

          <Link
            to="/librarian/queue"
            className="mt-4 text-xs font-bold text-blue-900 hover:underline flex items-center justify-between pt-3 border-t border-slate-100"
          >
            <span>Inspect Session Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* CARD 2: Today's Requests (Granted, Taken, Expired, Waitlisted) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                Today's Requests
              </span>
              <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                {todayRequests.length} Total
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-emerald-800 font-bold block">GRANTED</span>
                <strong className="text-lg font-extrabold text-emerald-700">{grantedToday}</strong>
              </div>
              <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-[10px] text-blue-900 font-bold block">TAKEN</span>
                <strong className="text-lg font-extrabold text-blue-900">{takenToday}</strong>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-[10px] text-amber-900 font-bold block">WAITLISTED</span>
                <strong className="text-lg font-extrabold text-amber-800">{waitlistedToday}</strong>
              </div>
              <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                <span className="text-[10px] text-rose-900 font-bold block">EXPIRED</span>
                <strong className="text-lg font-extrabold text-rose-700">{expiredToday}</strong>
              </div>
            </div>
          </div>

          <Link
            to="/librarian/requests"
            className="mt-4 text-xs font-bold text-blue-900 hover:underline flex items-center justify-between pt-3 border-t border-slate-100"
          >
            <span>All Requests History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* CARD 3: Overdue Books & Pending Fines */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                Overdue & Fines
              </span>
              <Coins className="w-4 h-4 text-amber-600" />
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Overdue Books:</span>
                <span className={`text-xl font-extrabold ${overdueBorrowings.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {overdueBorrowings.length}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Pending Fines:</span>
                <span className={`text-xl font-extrabold ${totalPendingFineAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  ₹{totalPendingFineAmount}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Standard BVC College fine: ₹2 per day after due date.
              </p>
            </div>
          </div>

          <Link
            to="/librarian/fines"
            className="mt-4 text-xs font-bold text-blue-900 hover:underline flex items-center justify-between pt-3 border-t border-slate-100"
          >
            <span>Manage Fines Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* CARD 4: Low Stock & Immediate Return Requests */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                Stock & Recalls
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Low / Out of Stock:</span>
                <span className="text-xl font-extrabold text-amber-700">
                  {lowStockBooks.length + outOfStockBooks.length} titles
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Immediate Returns:</span>
                <span className={`text-xl font-extrabold ${immediateReturnBorrowings.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {immediateReturnBorrowings.length} active
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Threshold: &le; {settings.lowStockThreshold} copies triggers low stock alert.
              </p>
            </div>
          </div>

          <Link
            to="/librarian/borrowings"
            className="mt-4 text-xs font-bold text-blue-900 hover:underline flex items-center justify-between pt-3 border-t border-slate-100"
          >
            <span>View Active Loans & Recalls</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Counter Action Spotlight: Currently GRANTED Requests (Ready to Mark as Taken) */}
      <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Counter Ready: Granted Books Awaiting Pickup ({activeSessionGrants.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These books were automatically granted via FIFO for {sessionInfo.session === 'Closed' ? 'today' : `the ${sessionInfo.session} Session`}. When the student arrives, verify Roll Number and click <strong className="text-slate-900">MARK AS TAKEN</strong>.
            </p>
          </div>

          <Link
            to="/librarian/verify"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            Open Counter Terminal
          </Link>
        </div>

        {activeSessionGrants.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No uncollected granted requests at this moment.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">As students request books during the session, granted requests will queue here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSessionGrants.slice(0, 4).map(req => {
              const reqTime = req.requestCreatedAt ? formatISTTime12(req.requestCreatedAt) : formatISTTime12(req.requestDate);
              return (
                <div
                  key={req.id}
                  className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                        {req.requestId}
                      </span>
                      <span className="font-mono text-xs font-extrabold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                        {req.studentId}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{req.bookTitle}</h4>
                    <p className="text-xs text-slate-600">
                      Student: <strong className="text-slate-800">{req.studentName}</strong> • Requested: {reqTime}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      markRequestAsTaken(req.id);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer shrink-0"
                  >
                    MARK TAKEN
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Circulation Analytics & Department Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-900" />
                Active Loans by Engineering Department
              </h3>
              <p className="text-[11px] text-slate-400">Circulation distribution across BVC branches</p>
            </div>
            <span className="text-xs font-bold text-slate-600">{activeBorrowings.length} total active</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Catalog Availability Stock Pie (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                Inventory Stock Balance
              </h3>
              <span className="text-xs font-bold text-slate-600">{totalPhysicalCopies} total copies</span>
            </div>
            <p className="text-[11px] text-slate-400">Physical book copies in library holding</p>

            <div className="h-44 flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">On Shelf</span>
                <strong className="text-slate-800">{totalAvailableCopies}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-900" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Issued</span>
                <strong className="text-slate-800">{totalIssuedCopies}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
