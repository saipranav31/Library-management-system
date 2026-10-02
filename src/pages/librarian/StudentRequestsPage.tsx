import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { BookRequest } from '../../types';

export const StudentRequestsPage: React.FC = () => {
  const { allUsers } = useAuth();
  const {
    requests,
    books,
    borrowings,
    fines,
    systemDate,
    settings,
    approveRequest,
    rejectRequest,
    confirmIssueBook,
    addToast,
  } = useLibrary();

  // Search by Roll Number State (Section 7)
  const [rollNumberQuery, setRollNumberQuery] = useState('');
  const [searchedRollNumber, setSearchedRollNumber] = useState('');

  // All Requests Filters (Section 8)
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Issued'>('All');
  const [tableRollSearch, setTableRollSearch] = useState('');
  const [tableTitleSearch, setTableTitleSearch] = useState('');

  // Modals state
  const [rejectModalReq, setRejectModalReq] = useState<BookRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('All shelf copies currently reserved for academic syllabus.');

  // Book Issue Modal State (Section 10)
  const [issueModalRequest, setIssueModalRequest] = useState<BookRequest | null>(null);
  const [issuingSubmitting, setIssuingSubmitting] = useState(false);

  // Request Details Modal
  const [detailsModalReq, setDetailsModalReq] = useState<BookRequest | null>(null);

  // Find student info for searched Roll Number
  const studentInfo = useMemo(() => {
    if (!searchedRollNumber.trim()) return null;
    const cleanRoll = searchedRollNumber.trim().toLowerCase();

    // First check registered student users
    const matchedUser = allUsers.find(
      u => u.studentId && u.studentId.toLowerCase() === cleanRoll
    );

    // Also check requests to find student details
    const studentRequests = requests.filter(
      r => r.studentId && r.studentId.toLowerCase() === cleanRoll
    );

    if (!matchedUser && studentRequests.length === 0) {
      return null;
    }

    const firstReq = studentRequests[0];
    const name = matchedUser ? matchedUser.name : (firstReq?.studentName || 'Student');
    const department = matchedUser ? matchedUser.department : (firstReq?.department || 'CSE');
    const year = matchedUser?.year || 'IV Year';
    const email = matchedUser ? matchedUser.email : (firstReq?.studentEmail || '');
    const phone = matchedUser?.phone || '+91 94401 23456';
    const rollNo = matchedUser?.studentId || firstReq?.studentId || searchedRollNumber.trim().toUpperCase();

    // Check outstanding fines
    const studentFines = fines.filter(
      f => f.studentId.toLowerCase() === cleanRoll && f.status === 'pending'
    );
    const outstandingFine = studentFines.reduce((sum, f) => sum + f.amount, 0);

    return {
      rollNo,
      name,
      department,
      year,
      email,
      phone,
      outstandingFine,
      requests: studentRequests,
    };
  }, [searchedRollNumber, allUsers, requests, fines]);

  // Handle Search Submission
  const handleRollSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumberQuery.trim()) {
      addToast('Input Required', 'Please enter a student roll number to search.', 'info');
      return;
    }
    setSearchedRollNumber(rollNumberQuery.trim());
  };

  // Rejection handler
  const handleConfirmReject = () => {
    if (!rejectModalReq) return;
    rejectRequest(rejectModalReq.id || rejectModalReq.requestId, rejectionReason);
    setRejectModalReq(null);
  };

  // Issue Book handler (Section 10)
  const handleConfirmIssue = () => {
    if (!issueModalRequest) return;
    setIssuingSubmitting(true);
    setTimeout(() => {
      const res = confirmIssueBook(issueModalRequest.requestId);
      setIssuingSubmitting(false);
      setIssueModalRequest(null);
      if (res.success) {
        addToast(
          'Book Issued Successfully',
          `Book "${issueModalRequest.bookTitle}" has been issued to student ${issueModalRequest.studentName} (${issueModalRequest.studentId}).`,
          'success'
        );
      }
    }, 400);
  };

  // Filtered requests for the complete table (Section 8)
  const allFilteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchRoll =
        !tableRollSearch.trim() ||
        (r.studentId && r.studentId.toLowerCase().includes(tableRollSearch.trim().toLowerCase())) ||
        (r.studentRollNo && r.studentRollNo.toLowerCase().includes(tableRollSearch.trim().toLowerCase()));
      const matchTitle =
        !tableTitleSearch.trim() ||
        r.bookTitle.toLowerCase().includes(tableTitleSearch.trim().toLowerCase()) ||
        r.requestId.toLowerCase().includes(tableTitleSearch.trim().toLowerCase());

      return matchStatus && matchRoll && matchTitle;
    });
  }, [requests, statusFilter, tableRollSearch, tableTitleSearch]);

  const targetBookForIssue = issueModalRequest
    ? books.find(b => b.bookId === issueModalRequest.bookId || b.id === issueModalRequest.bookId)
    : null;

  const issueDateFormatted = systemDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const loanPeriodDays = targetBookForIssue?.loanPeriod || settings.loanPeriodDays || 15;
  const calculatedDueDate = new Date(
    systemDate.getTime() + loanPeriodDays * 24 * 60 * 60 * 1000
  ).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-900" />
            Student Book Requests & Issuance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review circulation requests, search by Student Roll Number, and issue books directly.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
          <span>
            Pending Requests: <strong className="text-amber-600 font-bold">{requests.filter(r => r.status === 'Pending').length}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Approved (Ready to Issue): <strong className="text-blue-600 font-bold">{requests.filter(r => r.status === 'Approved').length}</strong>
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 7: PROMINENT SEARCH BY STUDENT ROLL NUMBER */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border-2 border-blue-900/20 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-900" />
              Search Student Requests by Roll Number
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the student's Roll Number to inspect their profile and review or issue requested books.
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] bg-blue-50 text-blue-900 font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Primary Lookup
          </span>
        </div>

        {/* Search Field */}
        <form onSubmit={handleRollSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={rollNumberQuery}
              onChange={e => setRollNumberQuery(e.target.value)}
              placeholder="Enter Student Roll Number (e.g. 246M1A0000)..."
              className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-sm font-mono font-semibold rounded-xl pl-11 pr-4 py-3 border border-slate-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-100 outline-hidden transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            SEARCH
          </button>
          {searchedRollNumber && (
            <button
              type="button"
              onClick={() => {
                setSearchedRollNumber('');
                setRollNumberQuery('');
              }}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        {/* Search Result Display (Section 7 Specification) */}
        {searchedRollNumber && (
          <div className="pt-4 border-t border-slate-200 space-y-6">
            {!studentInfo ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900">No Student Found for Roll Number: {searchedRollNumber}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  No registered student profile or requests found with roll number "{searchedRollNumber}". Please check the spelling or browse the complete table below.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Student Information Card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Student Information
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                        {studentInfo.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1.5">
                        <span>
                          Roll Number: <strong className="font-mono text-blue-900 font-bold">{studentInfo.rollNo}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Department: <strong>{studentInfo.department}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Year: <strong>{studentInfo.year}</strong>
                        </span>
                        {studentInfo.email && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{studentInfo.email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-5">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Outstanding Fine</span>
                        <span className={`text-base font-extrabold ${studentInfo.outstandingFine > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          ₹{studentInfo.outstandingFine}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Library Requests</span>
                        <span className="text-base font-extrabold text-blue-950">
                          {studentInfo.requests.length} Total
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 10: Approved Requests Quick Action (Ready to Issue) */}
                {studentInfo.requests.filter(r => r.status === 'Approved').length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          Approved Requests Ready to Issue to {studentInfo.name} ({studentInfo.rollNo})
                        </h4>
                        <p className="text-xs text-blue-800 mt-0.5">
                          Select an approved book below to verify stock and complete the circulation loan.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {studentInfo.requests
                          .filter(r => r.status === 'Approved')
                          .map((appReq, idx) => (
                            <button
                              key={appReq.id}
                              onClick={() => setIssueModalRequest(appReq)}
                              className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <span>{idx + 1}. {appReq.bookTitle}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* BOOK REQUESTS Table for this Student */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    BOOK REQUESTS ({studentInfo.requests.length})
                  </h4>

                  {studentInfo.requests.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-200">
                      No book requests submitted by this student yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="p-3">Request ID</th>
                            <th className="p-3">Book</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {studentInfo.requests.map(req => (
                            <tr key={req.id} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-mono font-bold text-slate-800">
                                {req.requestId}
                              </td>
                              <td className="p-3">
                                <p className="font-bold text-slate-900">{req.bookTitle}</p>
                                <p className="text-slate-400 text-[11px] font-mono">{req.bookId}</p>
                              </td>
                              <td className="p-3 text-slate-600">
                                {new Date(req.requestDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="p-3">
                                {req.status === 'Pending' && (
                                  <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Pending
                                  </span>
                                )}
                                {req.status === 'Approved' && (
                                  <span className="bg-blue-100 text-blue-900 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Approved
                                  </span>
                                )}
                                {req.status === 'Issued' && (
                                  <span className="bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <BookmarkCheck className="w-3 h-3" /> Issued
                                  </span>
                                )}
                                {req.status === 'Rejected' && (
                                  <span className="bg-rose-100 text-rose-900 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> Rejected
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {req.status === 'Pending' && (
                                    <>
                                      <button
                                        onClick={() => approveRequest(req.id || req.requestId)}
                                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => setRejectModalReq(req)}
                                        className="px-2 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}

                                  {req.status === 'Approved' && (
                                    <button
                                      onClick={() => setIssueModalRequest(req)}
                                      className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                      Issue Book
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setDetailsModalReq(req)}
                                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View Details
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 8: ALL REQUESTS MANAGEMENT */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              All Circulation Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter by status or look up any request across the entire institution.
            </p>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex overflow-x-auto gap-1 pb-1 sm:pb-0">
            {(['All', 'Pending', 'Approved', 'Issued', 'Rejected'] as const).map(st => {
              const count = st === 'All' ? requests.length : requests.filter(r => r.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Dual Search Fields (Section 8: Roll Number primary, Book Title secondary) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableRollSearch}
              onChange={e => setTableRollSearch(e.target.value)}
              placeholder="Search by Roll Number (e.g. 246M1A0000)..."
              className="w-full bg-slate-50 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-900 outline-hidden font-mono"
            />
          </div>

          <div className="relative">
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableTitleSearch}
              onChange={e => setTableTitleSearch(e.target.value)}
              placeholder="Search by Book Title or Request ID..."
              className="w-full bg-slate-50 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-900 outline-hidden"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Request ID</th>
                <th className="p-3.5">Roll Number</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Book Title</th>
                <th className="p-3.5">Request Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {allFilteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No requests found matching the current search and filter criteria.
                  </td>
                </tr>
              ) : (
                allFilteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      {req.requestId}
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                        {req.studentId || req.studentRollNo || '—'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{req.studentName}</p>
                      <p className="text-slate-400 text-[10px]">{req.department || req.studentDept || 'CSE'}</p>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{req.bookTitle}</p>
                      <p className="text-slate-400 text-[11px] font-mono">{req.bookId}</p>
                    </td>

                    <td className="p-3.5 text-slate-600">
                      {new Date(req.requestDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="p-3.5">
                      {req.status === 'Pending' && (
                        <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                      {req.status === 'Approved' && (
                        <span className="bg-blue-100 text-blue-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {req.status === 'Issued' && (
                        <span className="bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <BookmarkCheck className="w-3 h-3" /> Issued
                        </span>
                      )}
                      {req.status === 'Rejected' && (
                        <span className="bg-rose-100 text-rose-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => approveRequest(req.id || req.requestId)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModalReq(req)}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {req.status === 'Approved' && (
                          <button
                            onClick={() => setIssueModalRequest(req)}
                            className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Issue Book
                          </button>
                        )}

                        <button
                          onClick={() => setDetailsModalReq(req)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 10: BOOK ISSUE MODAL (EXACT SPECIFICATION) */}
      {/* ============================================================ */}
      {issueModalRequest && (
        <Modal
          isOpen={!!issueModalRequest}
          onClose={() => setIssueModalRequest(null)}
          title="BOOK ISSUE"
          subtitle="Circulation Loan Issuance Confirmation"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Student:</span>
                <strong className="text-slate-900 text-sm">{issueModalRequest.studentName}</strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Roll Number:</span>
                <strong className="font-mono text-blue-900 text-sm font-bold bg-blue-50 px-2 py-0.5 rounded">
                  {issueModalRequest.studentId || issueModalRequest.studentRollNo}
                </strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Book:</span>
                <strong className="text-slate-900 text-sm text-right">{issueModalRequest.bookTitle}</strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Book ID:</span>
                <strong className="font-mono text-slate-800">{issueModalRequest.bookId}</strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Issue Date:</span>
                <strong className="text-slate-900">{issueDateFormatted}</strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Loan Period:</span>
                <strong className="text-blue-900 font-bold">{loanPeriodDays} Days</strong>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-700 font-bold">Due Date:</span>
                <strong className="text-emerald-700 font-extrabold text-sm">{calculatedDueDate}</strong>
              </div>
            </div>

            {targetBookForIssue && (
              <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                <span>Available Copies: <strong>{targetBookForIssue.availableCopies}</strong></span>
                <span>Shelf: <strong>{targetBookForIssue.shelfNumber || 'Main Stack'}</strong></span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIssueModalRequest(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmIssue}
                disabled={issuingSubmitting || (targetBookForIssue?.availableCopies ?? 1) <= 0}
                className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
              >
                {issuingSubmitting ? 'Issuing Book...' : 'CONFIRM BOOK ISSUE'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* REQUEST DETAILS MODAL (SECTION 6) */}
      {/* ============================================================ */}
      {detailsModalReq && (
        <Modal
          isOpen={!!detailsModalReq}
          onClose={() => setDetailsModalReq(null)}
          title="Book Request Record"
          subtitle={`Request ID: ${detailsModalReq.requestId}`}
        >
          <div className="space-y-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Request ID:</span>
                <strong className="font-mono text-slate-900">{detailsModalReq.requestId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Roll Number:</span>
                <strong className="font-mono text-blue-900">{detailsModalReq.studentId || detailsModalReq.studentRollNo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <strong className="text-slate-900">{detailsModalReq.studentName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <strong className="text-slate-900">{detailsModalReq.department || detailsModalReq.studentDept || 'CSE'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Book ID:</span>
                <strong className="font-mono text-slate-900">{detailsModalReq.bookId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Book Title:</span>
                <strong className="text-slate-900">{detailsModalReq.bookTitle}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Request Date:</span>
                <strong className="text-slate-900">
                  {new Date(detailsModalReq.requestDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-blue-900">{detailsModalReq.status}</span>
              </div>
              {detailsModalReq.approvedAt && (
                <div className="flex justify-between text-emerald-700">
                  <span>Approved Date:</span>
                  <strong>
                    {new Date(detailsModalReq.approvedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
              )}
              {detailsModalReq.rejectedAt && (
                <div className="flex justify-between text-rose-700">
                  <span>Rejected Date:</span>
                  <strong>
                    {new Date(detailsModalReq.rejectedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
              )}
              {detailsModalReq.rejectionReason && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Rejection Reason:</span>
                  <p className="text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {detailsModalReq.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setDetailsModalReq(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalReq && (
        <Modal
          isOpen={!!rejectModalReq}
          onClose={() => setRejectModalReq(null)}
          title="Reject Book Request"
          subtitle={`Student: ${rejectModalReq.studentName} (${rejectModalReq.studentId})`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Please specify the reason for declining this request. The student will receive an instant notification.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-900 outline-hidden"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRejectionReason('All copies currently assigned to laboratory / reference reading')}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg text-slate-700 cursor-pointer"
              >
                Lab Reference
              </button>
              <button
                type="button"
                onClick={() => setRejectionReason('Student has exceeded allowable concurrent borrowing limit (4 books)')}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg text-slate-700 cursor-pointer"
              >
                Limit Exceeded
              </button>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
