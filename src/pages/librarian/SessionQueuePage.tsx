import React, { useState, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Filter,
  Search,
  BookOpen,
  UserCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { formatISTTime12, getISTDetails } from '../../utils/sessionUtils';

export const SessionQueuePage: React.FC = () => {
  const {
    requests,
    systemDate,
    sessionInfo,
    markRequestAsTaken,
    addToast,
  } = useLibrary();

  const navigate = useNavigate();
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<'Active' | 'Morning' | 'Afternoon' | 'All'>('Active');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const ist = getISTDetails(systemDate);
  const todayIST = ist.dateStr;

  // Filter requests for the session queue
  const queueRequests = useMemo(() => {
    return requests
      .filter(r => {
        // Date check: default to today unless 'All'
        const reqDate = r.sessionDate || (r.requestDate ? getISTDetails(new Date(r.requestDate)).dateStr : todayIST);
        const isToday = reqDate === todayIST;

        // Session check
        let matchSession = true;
        if (selectedSessionFilter === 'Active') {
          if (sessionInfo.session === 'Closed') {
            matchSession = true; // show all for today if closed
          } else {
            matchSession = r.session === sessionInfo.session && isToday;
          }
        } else if (selectedSessionFilter === 'Morning') {
          matchSession = r.session === 'Morning' && isToday;
        } else if (selectedSessionFilter === 'Afternoon') {
          matchSession = r.session === 'Afternoon' && isToday;
        }

        // Status check
        const matchStatus = statusFilter === 'All' || r.status === statusFilter;

        // Search check
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          r.bookTitle.toLowerCase().includes(q) ||
          r.studentName.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q) ||
          r.requestId.toLowerCase().includes(q);

        return matchSession && matchStatus && matchSearch;
      })
      .sort((a, b) => {
        // Strict FIFO sort by request time
        const timeA = new Date(a.requestCreatedAt || a.requestDate).getTime();
        const timeB = new Date(b.requestCreatedAt || b.requestDate).getTime();
        return timeA - timeB;
      });
  }, [requests, todayIST, selectedSessionFilter, sessionInfo.session, statusFilter, searchQuery]);

  const grantedCount = queueRequests.filter(r => r.status === 'Granted' || r.status === 'Approved').length;
  const takenCount = queueRequests.filter(r => r.status === 'Taken' || r.status === 'Issued').length;
  const waitlistedCount = queueRequests.filter(r => r.status === 'Waitlisted').length;
  const expiredCount = queueRequests.filter(r => r.status === 'Expired').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Granted':
      case 'Approved':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> GRANTED
          </span>
        );
      case 'Waitlisted':
        return (
          <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> WAITLISTED
          </span>
        );
      case 'Taken':
      case 'Issued':
        return (
          <span className="bg-blue-100 text-blue-900 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> TAKEN
          </span>
        );
      case 'Expired':
        return (
          <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> EXPIRED
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-blue-900" />
            Session Request Queue (FIFO Allocation)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time session queue sorted strictly by request timestamp (First-In, First-Out).
          </p>
        </div>

        <Link
          to="/librarian/verify"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          Verify Student Counter
        </Link>
      </div>

      {/* Current Session Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-blue-200 border border-white/20">
                Current Time: {ist.time12} IST
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                sessionInfo.session === 'Morning'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : sessionInfo.session === 'Afternoon'
                  ? 'bg-indigo-400/20 text-indigo-300 border border-indigo-400/40'
                  : 'bg-rose-400/20 text-rose-300 border border-rose-400/40'
              }`}>
                {sessionInfo.statusText}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {sessionInfo.session === 'Closed' ? 'Session Closed' : `${sessionInfo.session} Session Queue`}
            </h2>
            <p className="text-xs text-blue-200/90 max-w-xl">
              Morning: 9:30 AM – 12:30 PM • Lunch Closed: 12:30 PM – 1:30 PM • Afternoon: 1:30 PM – 4:30 PM.
              All requests are evaluated automatically via FIFO and expire at session conclusion.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-20">
              <span className="text-[10px] text-blue-200 font-bold uppercase block">Granted</span>
              <strong className="text-xl font-extrabold text-white">{grantedCount}</strong>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-20">
              <span className="text-[10px] text-blue-200 font-bold uppercase block">Taken</span>
              <strong className="text-xl font-extrabold text-white">{takenCount}</strong>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-20">
              <span className="text-[10px] text-blue-200 font-bold uppercase block">Waitlisted</span>
              <strong className="text-xl font-extrabold text-white">{waitlistedCount}</strong>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-20">
              <span className="text-[10px] text-blue-200 font-bold uppercase block">Expired</span>
              <strong className="text-xl font-extrabold text-white">{expiredCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Session filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['Active', 'Morning', 'Afternoon', 'All'] as const).map(sess => (
            <button
              key={sess}
              onClick={() => setSelectedSessionFilter(sess)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedSessionFilter === sess
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sess === 'Active' ? `Active Session (${sessionInfo.session})` : `${sess} Session`}
            </button>
          ))}
        </div>

        {/* Status filter & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-hidden cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Granted">Granted Only</option>
            <option value="Waitlisted">Waitlisted</option>
            <option value="Taken">Taken / Issued</option>
            <option value="Expired">Expired</option>
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search title, roll no..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* FIFO Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {queueRequests.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No requests in current queue selection</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Students will appear in this FIFO queue as soon as they submit a book request during an active session.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5 text-center">FIFO Pos</th>
                  <th className="p-3.5">Book Title</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Roll Number</th>
                  <th className="p-3.5">Request Time</th>
                  <th className="p-3.5">Session</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queueRequests.map((req, idx) => {
                  const reqTime = req.requestCreatedAt ? formatISTTime12(req.requestCreatedAt) : formatISTTime12(req.requestDate);
                  const isGranted = req.status === 'Granted' || req.status === 'Approved';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
                          #{req.fifoPosition || idx + 1}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">{req.bookTitle}</div>
                        <span className="text-[11px] font-mono text-slate-400">{req.bookId}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{req.studentName}</div>
                        <span className="text-[10px] text-slate-400">{req.department || 'CSE'}</span>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-800">
                        {req.studentId}
                      </td>

                      <td className="p-3.5 text-slate-600 font-mono">
                        {reqTime}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.session === 'Morning' ? 'bg-amber-50 text-amber-800' : 'bg-indigo-50 text-indigo-800'
                        }`}>
                          {req.session || 'Morning'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {getStatusBadge(req.status)}
                      </td>

                      <td className="p-3.5 text-right">
                        {isGranted ? (
                          <button
                            type="button"
                            onClick={() => {
                              markRequestAsTaken(req.id);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            MARK TAKEN
                          </button>
                        ) : (
                          <Link
                            to={`/librarian/verify?roll=${encodeURIComponent(req.studentRollNo || req.studentId)}`}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                          >
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
