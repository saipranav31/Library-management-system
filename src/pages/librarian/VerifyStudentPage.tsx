import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  Search,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  Coins,
  BookmarkCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { formatISTTime12, getISTDetails, checkRequestExpired } from '../../utils/sessionUtils';
import confetti from 'canvas-confetti';

export const VerifyStudentPage: React.FC = () => {
  const { allUsers } = useAuth();
  const {
    requests,
    borrowings,
    fines,
    systemDate,
    sessionInfo,
    markRequestAsTaken,
    addToast,
  } = useLibrary();

  const [searchParams] = useSearchParams();
  const rollFromUrl = searchParams.get('roll') || '';

  const [rollInput, setRollInput] = useState(rollFromUrl);
  const [activeRoll, setActiveRoll] = useState(rollFromUrl);
  const [durationOverrides, setDurationOverrides] = useState<Record<string, number>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const r = searchParams.get('roll');
    if (r) {
      setRollInput(r);
      setActiveRoll(r);
    }
  }, [searchParams]);

  const cleanRoll = (activeRoll || '').trim().toLowerCase();

  // Find student profile
  const student = useMemo(() => {
    if (!cleanRoll) return null;
    return allUsers.find(
      u => u.role === 'student' &&
      (u.studentId?.toLowerCase() === cleanRoll || (u.rollNumber && u.rollNumber.toLowerCase() === cleanRoll))
    ) || null;
  }, [allUsers, cleanRoll]);

  // Find requests for this student (match either studentId or studentRollNo)
  const studentRequests = useMemo(() => {
    if (!cleanRoll) return [];
    return requests.filter(r => {
      const matchesStudent =
        r.studentId?.toLowerCase() === cleanRoll ||
        r.studentRollNo?.toLowerCase() === cleanRoll;
      return matchesStudent;
    });
  }, [requests, cleanRoll]);

  // Current session granted requests (ELIGIBLE for MARK AS TAKEN)
  const currentSessionGranted = useMemo(() => {
    if (!sessionInfo.isActive) return [];

    const todayIST = getISTDetails(systemDate).dateStr;
    const activeSession = sessionInfo.session;

    return studentRequests.filter(r => {
      const isGranted =
        r.status === 'Granted' ||
        r.status === 'Approved';

      const isSameDate =
        r.sessionDate ? r.sessionDate === todayIST : false;

      const isSameSession =
        r.session === activeSession;

      const isNotExpired =
        !checkRequestExpired(r, systemDate);

      return (
        isGranted &&
        isSameDate &&
        isSameSession &&
        isNotExpired
      );
    });
  }, [
    studentRequests,
    systemDate,
    sessionInfo.isActive,
    sessionInfo.session
  ]);

  // Expired / Other Session requests for this student
  const expiredOrInvalidRequests = useMemo(() => {
    return studentRequests.filter(r => {
      return r.status === 'Expired' || (
        (r.status === 'Granted' || r.status === 'Approved') &&
        !currentSessionGranted.some(cg => cg.id === r.id)
      );
    });
  }, [studentRequests, currentSessionGranted]);

  // Student active borrowings
  const activeBorrowings = useMemo(() => {
    if (!cleanRoll) return [];
    return borrowings.filter(
      b => b.studentId?.toLowerCase() === cleanRoll && b.status !== 'returned'
    );
  }, [borrowings, cleanRoll]);

  // Student pending fines
  const pendingFines = useMemo(() => {
    if (!cleanRoll) return [];
    return fines.filter(
      f => f.studentId?.toLowerCase() === cleanRoll && f.status === 'pending'
    );
  }, [fines, cleanRoll]);

  const totalOutstandingFine = pendingFines.reduce((sum, f) => sum + f.amount, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollInput.trim()) {
      addToast('Input Required', 'Please enter a student Roll Number.', 'info');
      return;
    }
    setActiveRoll(rollInput.trim());
  };

  const handleQuickSelect = (roll: string) => {
    setRollInput(roll);
    setActiveRoll(roll);
  };

  const handleMarkAsTaken = (reqId: string, defaultDuration = 14) => {
    setProcessingId(reqId);
    const duration = durationOverrides[reqId] || defaultDuration;

    setTimeout(() => {
      const result = markRequestAsTaken(reqId, duration);
      setProcessingId(null);
      if (result.success) {
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.6 },
        });
      }
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-blue-900" />
            Verify Student / Issue Book
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Fast circulation desk terminal: Verify student roll number, review session grants, and click <strong className="text-slate-800">Mark as Taken</strong>.
          </p>
        </div>

        {/* Current Active Session Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-700">
            {sessionInfo.session === 'Closed' ? 'Session Closed' : `${sessionInfo.session} Session (${sessionInfo.sessionTimeLabel})`}
          </span>
        </div>
      </div>

      {/* Large Roll Number Search Field */}
      <div className="bg-white rounded-3xl p-6 border-2 border-blue-900/20 shadow-md space-y-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <label className="block text-xs font-extrabold text-blue-950 uppercase tracking-wider">
            Enter Student Roll Number *
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={rollInput}
                onChange={e => setRollInput(e.target.value)}
                placeholder="e.g. 246M1A4201, 246M1A0000..."
                className="w-full pl-12 pr-4 py-3.5 text-base sm:text-lg font-mono font-bold bg-slate-50 border-2 border-slate-300 rounded-2xl focus:bg-white focus:border-blue-900 focus:ring-4 focus:ring-blue-100 text-slate-900 uppercase transition outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Search className="w-5 h-5" />
              VERIFY STUDENT
            </button>
          </div>
        </form>

      </div>

      {/* When no roll number is searched yet */}
      {!activeRoll && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Circulation Counter Terminal</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter a student roll number above and click <strong className="text-slate-700">VERIFY STUDENT</strong> to verify identity, review session grants, and issue requested books.
          </p>
        </div>
      )}

      {/* Verification Results */}
      {activeRoll && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Student Profile Card (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Verified Student Profile
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {student?.status || 'Active'}
                </span>
              </div>

              {student ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                      {student.name}
                    </h3>
                    <p className="font-mono text-sm font-bold text-blue-900 mt-0.5">
                      {student.studentId || activeRoll.toUpperCase()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                      <strong className="text-slate-900">{student.department || 'CSE'}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Year</span>
                      <strong className="text-slate-900">{student.year || '3rd Year'}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Section</span>
                      <strong className="text-slate-900">Section {student.section || 'A'}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Calendar Year</span>
                      <strong className="text-slate-900">{student.academicYear || '2026-2027'}</strong>
                    </div>
                  </div>

                  {/* Standing / Fines overview */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Outstanding Fines:</span>
                    <strong className={totalOutstandingFine > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-700 font-bold'}>
                      ₹{totalOutstandingFine}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Active Borrowed Books:</span>
                    <strong className="text-slate-900 font-bold">{activeBorrowings.length} / 4 limit</strong>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 space-y-1">
                  <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-800">Student Roll No: {activeRoll.toUpperCase()}</p>
                  <p className="text-[11px] text-slate-400">Proceeding with verified institutional ID.</p>
                </div>
              )}
            </div>
          </div>

          {/* Granted Books Queue & Actions (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* CURRENT SESSION GRANTED BOOKS */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Current Session Granted Books (Ready to Issue)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Requests automatically granted via FIFO for the current session. Click <strong className="text-slate-900">Mark as Taken</strong> to issue.
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-xl self-start sm:self-auto">
                  {currentSessionGranted.length} Granted
                </span>
              </div>

              {currentSessionGranted.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No GRANTED Books for Current Active Session</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    This student does not have any pending granted requests for {sessionInfo.session === 'Closed' ? 'the active session' : `the ${sessionInfo.session} Session`}.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentSessionGranted.map(req => {
                    const reqTime = req.requestCreatedAt ? formatISTTime12(req.requestCreatedAt) : formatISTTime12(req.requestDate);
                    const selectedDuration = durationOverrides[req.id] || 14;

                    return (
                      <div
                        key={req.id}
                        className="bg-emerald-50/40 rounded-2xl border border-emerald-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <img
                            src={req.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
                            alt={req.bookTitle}
                            className="w-14 h-20 object-cover rounded-xl border border-emerald-200 shrink-0 bg-slate-100"
                          />
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                                {req.requestId}
                              </span>
                              <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                GRANTED
                              </span>
                              {req.fifoPosition && (
                                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded">
                                  FIFO #{req.fifoPosition}
                                </span>
                              )}
                            </div>

                            <h4 className="font-extrabold text-base text-slate-900">
                              {req.bookTitle}
                            </h4>
                            <p className="text-xs text-slate-600">
                              Book ID: <span className="font-mono font-semibold">{req.bookId}</span> • Author: {req.bookAuthor}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                              <span>Requested: <strong className="text-slate-800">{reqTime}</strong></span>
                              <span>Session: <strong className="text-slate-800">{req.session || 'Morning'}</strong></span>
                              <span>Pickup Deadline: <strong className="text-rose-700 font-bold">{req.pickupDeadline || sessionInfo.closesAtText}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Action Box with Configurable Loan Duration (CHANGE 4) */}
                        <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-emerald-200/60">
                          <div className="w-full sm:w-auto flex items-center gap-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">
                              Loan Duration:
                            </label>
                            <select
                              value={selectedDuration}
                              onChange={e => setDurationOverrides({
                                ...durationOverrides,
                                [req.id]: parseInt(e.target.value, 10),
                              })}
                              className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 cursor-pointer"
                            >
                              <option value={7}>1 Week (7 Days)</option>
                              <option value={14}>2 Weeks (14 Days - Default)</option>
                              <option value={21}>3 Weeks (21 Days)</option>
                              <option value={28}>4 Weeks (28 Days)</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            disabled={processingId === req.id}
                            onClick={() => handleMarkAsTaken(req.id, selectedDuration)}
                            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {processingId === req.id ? 'Issuing Book...' : 'MARK AS TAKEN'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Expired / Invalid Session Notice (Critical business rule enforcement) */}
            {expiredOrInvalidRequests.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Expired / Ineligible Session Requests ({expiredOrInvalidRequests.length})</span>
                </div>
                <p className="text-[11px] text-rose-800">
                  Per BVC Library policy, morning session requests expire automatically at 12:30 PM. They cannot be carried forward to the afternoon session. The student must submit a new request during an active session.
                </p>

                <div className="divide-y divide-rose-100 bg-white rounded-xl border border-rose-200 p-2 text-xs">
                  {expiredOrInvalidRequests.map(er => (
                    <div key={er.id} className="py-2 px-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{er.bookTitle}</span>
                        <span className="font-mono text-slate-400 ml-2">({er.requestId})</span>
                        <p className="text-[10px] text-slate-500">
                          Session: {er.session || 'Morning'} • Status: <span className="font-bold text-rose-700 uppercase">{er.status}</span>
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        Expired / Needs New Request
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
