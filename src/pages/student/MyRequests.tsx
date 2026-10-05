import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  BookmarkCheck,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { RequestStatus } from '../../types';
import { formatISTTime12, formatISTDateTime } from '../../utils/sessionUtils';

export const MyRequests: React.FC = () => {
  const { currentUser } = useAuth();
  const { requests, cancelRequest, sessionInfo } = useLibrary();

  const [statusFilter, setStatusFilter] = useState<string>('All');

  if (!currentUser) return null;

  const myRequests = requests.filter(
    r =>
      r.studentId === currentUser.studentId ||
      r.studentRollNo === currentUser.studentId ||
      r.studentEmail === currentUser.email
  );

  const filteredRequests = myRequests.filter(r => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Granted') return r.status === 'Granted' || r.status === 'Approved';
    if (statusFilter === 'Taken') return r.status === 'Taken' || r.status === 'Issued';
    if (statusFilter === 'Declined') return r.status === 'Declined' || r.status === 'Rejected';
    return r.status === statusFilter;
  });

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'Granted':
      case 'Approved':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> GRANTED
          </span>
        );
      case 'Waitlisted':
        return (
          <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> WAITLISTED
          </span>
        );
      case 'Taken':
      case 'Issued':
        return (
          <span className="bg-blue-100 text-blue-900 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <BookmarkCheck className="w-3.5 h-3.5 text-blue-700" /> TAKEN / ISSUED
          </span>
        );
      case 'Expired':
        return (
          <span className="bg-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> EXPIRED
          </span>
        );
      case 'Declined':
      case 'Rejected':
        return (
          <span className="bg-rose-100 text-rose-900 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> DECLINED
          </span>
        );
      case 'Pending':
      case 'Requested':
        return (
          <span className="bg-blue-50 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> REQUESTED
          </span>
        );
      case 'Cancelled':
        return (
          <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
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
            My Book Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track circulation requests, librarian approvals, and collect books using your Roll Number.
          </p>
        </div>

        <Link
          to="/student/browse"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          Request Another Book
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-slate-200">
        {[
          { id: 'All', label: 'All Requests' },
          { id: 'Granted', label: 'Granted' },
          { id: 'Taken', label: 'Taken / Issued' },
          { id: 'Waitlisted', label: 'Waitlisted' },
          { id: 'Expired', label: 'Expired' },
          { id: 'Declined', label: 'Declined' },
        ].map(tab => {
          const count = tab.id === 'All'
            ? myRequests.length
            : tab.id === 'Granted'
            ? myRequests.filter(r => r.status === 'Granted' || r.status === 'Approved').length
            : tab.id === 'Taken'
            ? myRequests.filter(r => r.status === 'Taken' || r.status === 'Issued').length
            : tab.id === 'Declined'
            ? myRequests.filter(r => r.status === 'Declined' || r.status === 'Rejected').length
            : myRequests.filter(r => r.status === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No requests found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {statusFilter === 'All'
              ? "You haven't requested any books yet. Browse the catalog to place a request."
              : `You have no requests with status "${statusFilter}".`}
          </p>
          <Link
            to="/student/browse"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map(req => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <img
                  src={req.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
                  alt={req.bookTitle}
                  className="w-16 h-22 object-cover rounded-lg border border-slate-200 shrink-0"
                />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      Req ID: {req.requestId}
                    </span>
                    <span className="text-xs font-mono font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      Roll No: {currentUser.studentId}
                    </span>
                    {getStatusBadge(req.status)}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {req.bookTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Author: <span className="font-medium text-slate-700">{req.bookAuthor}</span> • Book ID: <span className="font-mono">{req.bookId}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span>
                      Session: <strong className="text-slate-800">{req.session || 'Morning'} Session</strong>
                    </span>
                    <span>
                      Requested: <strong className="text-slate-800">{formatISTDateTime(req.requestCreatedAt || req.requestDate)}</strong>
                    </span>
                    {req.pickupDeadline && (req.status === 'Granted' || req.status === 'Approved') && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Pickup Deadline: {req.pickupDeadline}
                      </span>
                    )}
                    {req.fifoPosition && (
                      <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                        FIFO Queue #{req.fifoPosition}
                      </span>
                    )}
                  </div>

                  {/* GRANTED Banner (CHANGE 3 Specification) */}
                  {(req.status === 'Granted' || req.status === 'Approved') && (
                    <div className="mt-2.5 p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-black text-emerald-900 tracking-wide">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        YOUR BOOK REQUEST HAS BEEN GRANTED.
                      </div>
                      <p className="text-emerald-800 text-[11px] leading-relaxed">
                        Your request for <strong>"{req.bookTitle}"</strong> (Book ID: <code>{req.bookId}</code>) is ready for pickup at the circulation desk for the <strong>{req.session || 'Morning'} Session</strong>.
                      </p>
                      <div className="pt-1 border-t border-emerald-200/80 flex flex-wrap items-center justify-between text-[11px] font-semibold text-emerald-900">
                        <span>Pickup Deadline: <strong className="font-bold underline">{req.pickupDeadline || (req.session === 'Afternoon' ? '4:30 PM' : '12:30 PM')}</strong></span>
                        <span>Present Roll No: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">{currentUser.studentId}</strong></span>
                      </div>
                    </div>
                  )}

                  {/* WAITLISTED Banner */}
                  {req.status === 'Waitlisted' && (
                    <div className="mt-2.5 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900">Waitlisted for {req.session || 'Active'} Session (FIFO #{req.fifoPosition || 1})</p>
                        <p className="text-amber-800 text-[11px] mt-0.5">
                          All available shelf copies were allocated to earlier requests. You will be automatically granted if a copy becomes free in this session.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAKEN Banner */}
                  {(req.status === 'Taken' || req.status === 'Issued') && (
                    <div className="mt-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2">
                      <BookmarkCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-blue-900">Book Issued & Marked as TAKEN</p>
                        <p className="text-blue-800 text-[11px] mt-0.5">
                          Issued by circulation librarian. View loan duration and return due date under{' '}
                          <Link to="/student/borrowed" className="font-bold underline hover:text-blue-950">
                            My Borrowed Books
                          </Link>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* EXPIRED Banner */}
                  {req.status === 'Expired' && (
                    <div className="mt-2.5 p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-800 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Request Expired</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          Your book request expired because it was not collected during the selected library session. Please create a new request during the next available session.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rejection / Declined notice */}
                  {(req.status === 'Declined' || req.status === 'Rejected' || req.rejectionReason) && req.status !== 'Expired' && (
                    <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Reason:</strong> {req.rejectionReason || 'Declined by library system.'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {req.status === 'Pending' && (
                  <button
                    onClick={() => cancelRequest(req.id || req.requestId)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancel Request
                  </button>
                )}

                <Link
                  to={`/student/books/${req.bookId}`}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
                >
                  View Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
