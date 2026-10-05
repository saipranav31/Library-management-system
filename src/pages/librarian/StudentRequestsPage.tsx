import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  BookOpen,
  UserCheck,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  BookmarkCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { BookRequest } from '../../types';
import { formatISTTime12, getISTDetails } from '../../utils/sessionUtils';

export const StudentRequestsPage: React.FC = () => {
  const { allUsers } = useAuth();
  const {
    requests,
    books,
    borrowings,
    fines,
    systemDate,
    sessionInfo,
    markRequestAsTaken,
    rejectRequest,
    addToast,
  } = useLibrary();

  // Advanced Request Filters (CHANGE 6)
  const [sessionFilter, setSessionFilter] = useState<'All' | 'Morning' | 'Afternoon'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [bookFilter, setBookFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Past7Days'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [rejectModalReq, setRejectModalReq] = useState<BookRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Shelf copies currently allocated or syllabus reserve in effect.');
  const [detailsModalReq, setDetailsModalReq] = useState<BookRequest | null>(null);

  const ist = getISTDetails(systemDate);
  const todayIST = ist.dateStr;

  const departments = ['All', 'CSE', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'];

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.bookTitle.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q) ||
        r.requestId.toLowerCase().includes(q);

      // Session filter: Morning, Afternoon, All
      const matchSession = sessionFilter === 'All' || (r.session || 'Morning') === sessionFilter;

      // Status filter
      let matchStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Granted') matchStatus = r.status === 'Granted' || r.status === 'Approved';
        else if (statusFilter === 'Taken') matchStatus = r.status === 'Taken' || r.status === 'Issued';
        else if (statusFilter === 'Declined') matchStatus = r.status === 'Declined' || r.status === 'Rejected';
        else matchStatus = r.status === statusFilter;
      }

      // Department filter
      const matchDept = deptFilter === 'All' || (r.department || 'CSE') === deptFilter;

      // Book filter
      const matchBook = bookFilter === 'All' || r.bookId === bookFilter;

      // Date filter
      let matchDate = true;
      const reqDate = r.sessionDate || (r.requestDate ? getISTDetails(new Date(r.requestDate)).dateStr : todayIST);
      if (dateFilter === 'Today') {
        matchDate = reqDate === todayIST;
      } else if (dateFilter === 'Past7Days') {
        const diffDays = Math.floor((systemDate.getTime() - new Date(r.requestDate).getTime()) / (1000 * 60 * 60 * 24));
        matchDate = diffDays <= 7 && diffDays >= 0;
      }

      return matchSearch && matchSession && matchStatus && matchDept && matchBook && matchDate;
    });
  }, [requests, searchQuery, sessionFilter, statusFilter, deptFilter, bookFilter, dateFilter, systemDate, todayIST]);

  const handleConfirmReject = () => {
    if (!rejectModalReq) return;
    rejectRequest(rejectModalReq.id, rejectionReason);
    setRejectModalReq(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Granted':
      case 'Approved':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
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
            <BookmarkCheck className="w-3.5 h-3.5" /> TAKEN
          </span>
        );
      case 'Expired':
        return (
          <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> EXPIRED
          </span>
        );
      case 'Declined':
      case 'Rejected':
        return (
          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-slate-400" /> DECLINED
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
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
            <ClipboardList className="w-7 h-7 text-blue-900" />
            Student Book Circulation Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Filter all student requests across library sessions, review automatic FIFO grant positions, and mark books as taken.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/librarian/verify"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-emerald-300" />
            Verify Student / Issue Book
          </Link>
          <Link
            to="/librarian/queue"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-slate-600" />
            Session Queue (FIFO)
          </Link>
        </div>
      </div>

      {/* Advanced Filter Console (CHANGE 6) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student roll number, student name, book title, or request ID..."
            className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-600 outline-hidden transition"
          />
        </div>

        {/* 5 Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Session */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Session
            </label>
            <select
              value={sessionFilter}
              onChange={e => setSessionFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="All">All Sessions</option>
              <option value="Morning">Morning Session</option>
              <option value="Afternoon">Afternoon Session</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Granted">Granted</option>
              <option value="Waitlisted">Waitlisted</option>
              <option value="Taken">Taken / Issued</option>
              <option value="Expired">Expired</option>
              <option value="Declined">Declined</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Request Date
            </label>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today Only</option>
              <option value="Past7Days">Past 7 Days</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Department
            </label>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All Depts' : `${d} Dept`}</option>
              ))}
            </select>
          </div>

          {/* Book */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Book Title
            </label>
            <select
              value={bookFilter}
              onChange={e => setBookFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer truncate"
            >
              <option value="All">All Books</option>
              {books.map(b => (
                <option key={b.bookId} value={b.bookId}>{b.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredRequests.length}</strong> of {requests.length} requests
          </span>

          {(sessionFilter !== 'All' || statusFilter !== 'All' || deptFilter !== 'All' || bookFilter !== 'All' || dateFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSessionFilter('All');
                setStatusFilter('All');
                setDeptFilter('All');
                setBookFilter('All');
                setDateFilter('All');
                setSearchQuery('');
              }}
              className="text-blue-900 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4">Request ID</th>
                <th className="p-4">Student</th>
                <th className="p-4">Roll Number</th>
                <th className="p-4">Book Title</th>
                <th className="p-4 text-center">Session</th>
                <th className="p-4 text-center">FIFO Pos</th>
                <th className="p-4">Requested</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No requests in queue</p>
                    <p className="text-xs text-slate-400 mt-0.5">Student book requests will appear here during active library sessions.</p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No requests match your filter selection.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const reqTime = req.requestCreatedAt ? formatISTTime12(req.requestCreatedAt) : formatISTTime12(req.requestDate);
                  const isGranted = req.status === 'Granted' || req.status === 'Approved';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {req.requestId}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{req.studentName}</div>
                        <span className="text-[10px] text-slate-400">{req.department || 'CSE'}</span>
                      </td>

                      <td className="p-4">
                        <span className="font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded font-bold text-xs">
                          {req.studentId}
                        </span>
                      </td>

                      <td className="p-4 font-semibold text-slate-800">
                        {req.bookTitle}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.session === 'Morning' ? 'bg-amber-50 text-amber-800' : 'bg-indigo-50 text-indigo-800'
                        }`}>
                          {req.session || 'Morning'}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{req.fifoPosition || 1}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 font-mono">
                        {reqTime}
                      </td>

                      <td className="p-4">
                        {getStatusBadge(req.status)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isGranted && (
                            <button
                              type="button"
                              onClick={() => markRequestAsTaken(req.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              MARK TAKEN
                            </button>
                          )}

                          {req.status === 'Requested' && (
                            <button
                              type="button"
                              onClick={() => setRejectModalReq(req)}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Decline
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDetailsModalReq(req)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="View request details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decline Modal */}
      {rejectModalReq && (
        <Modal
          isOpen={!!rejectModalReq}
          onClose={() => setRejectModalReq(null)}
          title="Decline Book Request"
          subtitle={`Request ID: ${rejectModalReq.requestId}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Please enter the reason for declining this request for student <strong>{rejectModalReq.studentName}</strong> (Roll No: {rejectModalReq.studentId}):
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:bg-white"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Request Details Modal */}
      {detailsModalReq && (
        <Modal
          isOpen={!!detailsModalReq}
          onClose={() => setDetailsModalReq(null)}
          title="Book Request Specification"
          subtitle={`Request ID: ${detailsModalReq.requestId}`}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Book Title:</span>
                <strong className="text-slate-900">{detailsModalReq.bookTitle}</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Student Name:</span>
                <strong className="text-slate-900">{detailsModalReq.studentName}</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Student Roll Number:</span>
                <strong className="font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded">{detailsModalReq.studentId}</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Session & FIFO:</span>
                <strong className="text-slate-900">{detailsModalReq.session || 'Morning'} Session • Position #{detailsModalReq.fifoPosition || 1}</strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Status:</span>
                <div>{getStatusBadge(detailsModalReq.status)}</div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pickup Deadline:</span>
                <strong className="text-rose-700">{detailsModalReq.pickupDeadline || 'Session End (12:30 PM / 4:30 PM)'}</strong>
              </div>
            </div>

            <button
              onClick={() => setDetailsModalReq(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
