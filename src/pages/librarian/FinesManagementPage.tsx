import React, { useState, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import {
  Coins,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Receipt,
  UserCheck,
  AlertCircle,
  BookmarkCheck,
} from 'lucide-react';
import { Fine } from '../../types';

export const FinesManagementPage: React.FC = () => {
  const { allUsers } = useAuth();
  const { fines, borrowings, systemDate, payFine, addToast } = useLibrary();

  // Search Student by Roll Number (Section 15)
  const [studentRollQuery, setStudentRollQuery] = useState('');
  const [searchedRollNumber, setSearchedRollNumber] = useState('');

  // General Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'pending' | 'paid'>('All');

  // Search student calculation (Section 15 Specification)
  const studentFineDetails = useMemo(() => {
    if (!searchedRollNumber.trim()) return null;
    const cleanRoll = searchedRollNumber.trim().toLowerCase();

    // Find student
    const matchedUser = allUsers.find(
      u => u.studentId && u.studentId.toLowerCase() === cleanRoll
    );

    // Find all borrowings for this student
    const studentBorrowings = borrowings.filter(
      b => b.studentId && b.studentId.toLowerCase() === cleanRoll
    );

    // Find all fines for this student
    const studentFines = fines.filter(
      f => f.studentId && f.studentId.toLowerCase() === cleanRoll
    );

    const pendingFines = studentFines.filter(f => f.status === 'pending');

    // Calculate dynamic fine on unreturned overdue borrowings (@ ₹2/day)
    const activeOverdueBorrowings = studentBorrowings.filter(b => {
      const due = new Date(b.dueDate);
      return b.status !== 'returned' && systemDate > due;
    });

    const activeOverdueFineAmount = activeOverdueBorrowings.reduce((sum, b) => {
      const due = new Date(b.dueDate);
      const days = Math.max(0, Math.floor((systemDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
      return sum + (days * 2);
    }, 0);

    const totalOutstandingFine = Math.max(
      pendingFines.reduce((sum, f) => sum + f.amount, 0),
      activeOverdueFineAmount
    );

    const studentName = matchedUser?.name || studentBorrowings[0]?.studentName || studentFines[0]?.studentName || 'Student';
    const rollNo = matchedUser?.studentId || searchedRollNumber.trim().toUpperCase();

    // Map borrowed books list for section 15
    const borrowedBooksList = studentBorrowings.map(b => {
      const due = new Date(b.dueDate);
      const isReturned = b.status === 'returned';
      const isLate = systemDate > due && !isReturned;
      const daysOverdue = isLate
        ? Math.max(0, Math.floor((systemDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const fine = isLate ? daysOverdue * 2 : (b.fineAmount || 0);

      return {
        id: b.id,
        bookTitle: b.bookTitle,
        dueDate: due,
        daysOverdue,
        fine,
        status: b.status,
      };
    });

    return {
      studentName,
      rollNo,
      outstandingFine: totalOutstandingFine,
      borrowedBooks: borrowedBooksList,
      pendingFines,
    };
  }, [searchedRollNumber, allUsers, borrowings, fines, systemDate]);

  const handleRollSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentRollQuery.trim()) {
      addToast('Input Required', 'Please enter a student roll number.', 'info');
      return;
    }
    setSearchedRollNumber(studentRollQuery.trim());
  };

  const pendingFines = fines.filter(f => f.status === 'pending');
  const paidFines = fines.filter(f => f.status === 'paid');

  const totalPending = pendingFines.reduce((acc, f) => acc + f.amount, 0);
  const totalCollected = paidFines.reduce((acc, f) => acc + f.amount, 0);

  const displayedFines = fines.filter(f => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      f.studentName.toLowerCase().includes(q) ||
      f.studentId.toLowerCase().includes(q) ||
      f.bookTitle.toLowerCase().includes(q) ||
      (f.transactionId && f.transactionId.toLowerCase().includes(q)) ||
      (f.fineId && f.fineId.toLowerCase().includes(q));

    const matchFilter = filter === 'All' || f.status === filter;
    return matchSearch && matchFilter;
  });

  const handleMarkCashCleared = (fineId: string, studentName: string) => {
    payFine(fineId, 'DESK_CASH');
    addToast('Fine Cleared', `Marked payment as cleared in cash for ${studentName}.`, 'success');
  };

  const handleExportCSV = () => {
    const headers = 'FineID,StudentName,StudentID,BookTitle,OverdueDays,Amount,Status,PaymentMethod\n';
    const rows = fines
      .map(
        f =>
          `"${f.id}","${f.studentName}","${f.studentId}","${f.bookTitle}",${f.overdueDays || f.daysOverdue || 0},${f.amount},"${f.status}","${f.paymentMethod || 'None'}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bvc_library_fines_ledger_${Date.now()}.csv`;
    a.click();
    addToast('Report Exported', 'BVC Library Fines CSV ledger downloaded successfully.', 'info');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-7 h-7 text-rose-600" />
            Fines & Overdue Fees Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            BVC Library overdue policy: strictly ₹2 per calendar day. Search student fine records by Roll Number.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Ledger CSV
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Total Outstanding Dues</span>
          <div className="mt-2 text-3xl font-extrabold text-rose-600">₹{totalPending}</div>
          <span className="text-xs text-slate-400 font-medium">{pendingFines.length} pending fines</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Total Collected Revenue</span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700">₹{totalCollected}</div>
          <span className="text-xs text-slate-400 font-medium">{paidFines.length} cleared payments</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Standard Overdue Rate</span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">₹2.00</div>
          <span className="text-xs text-slate-400 font-medium">per calendar day (Strict Policy)</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 15: LIBRARIAN FINE DISPLAY BY ROLL NUMBER */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border-2 border-rose-900/20 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-rose-600" />
              Student Fine Lookup by Roll Number
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Search student using Roll Number to inspect their borrowed books, overdue days, and outstanding fine.
            </p>
          </div>
          <span className="text-[11px] bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Section 15 Workflow
          </span>
        </div>

        {/* Search Field */}
        <form onSubmit={handleRollSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={studentRollQuery}
              onChange={e => setStudentRollQuery(e.target.value)}
              placeholder="Enter Student Roll Number (e.g. 246M1A0000)..."
              className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-sm font-mono font-semibold rounded-xl pl-11 pr-4 py-3 border border-slate-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            SEARCH
          </button>
          {searchedRollNumber && (
            <button
              type="button"
              onClick={() => {
                setSearchedRollNumber('');
                setStudentRollQuery('');
              }}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        {/* Search Result Display (Section 15 Specification) */}
        {searchedRollNumber && (
          <div className="pt-4 border-t border-slate-200 space-y-5">
            {!studentFineDetails ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900">No Student Found for Roll Number: {searchedRollNumber}</h3>
                <p className="text-xs text-slate-500 mt-1">Please verify the Roll Number entered.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Student Fine Header Box */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium">
                      Student: <strong className="text-slate-900 text-sm">{studentFineDetails.studentName}</strong>
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Roll Number: <strong className="font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded font-bold">{studentFineDetails.rollNo}</strong>
                    </p>
                  </div>

                  <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-2xs text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Outstanding Fine
                    </span>
                    <span className={`text-2xl font-extrabold ${studentFineDetails.outstandingFine > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      ₹{studentFineDetails.outstandingFine}
                    </span>
                  </div>
                </div>

                {/* Borrowed Books Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Borrowed Books
                  </h4>

                  {studentFineDetails.borrowedBooks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-200">
                      No borrowings found for this student.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="p-3">Book</th>
                            <th className="p-3">Due Date</th>
                            <th className="p-3">Days Overdue</th>
                            <th className="p-3">Fine (@ ₹2/day)</th>
                            <th className="p-3 text-right">Management</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {studentFineDetails.borrowedBooks.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-semibold text-slate-900">
                                {item.bookTitle}
                              </td>
                              <td className="p-3 text-slate-600">
                                {item.dueDate.toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="p-3">
                                {item.daysOverdue > 0 ? (
                                  <span className="font-mono text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
                                    {item.daysOverdue} days
                                  </span>
                                ) : (
                                  <span className="text-slate-400">0</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`font-mono font-bold ${item.fine > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                  ₹{item.fine}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {item.fine > 0 ? (
                                  <button
                                    onClick={() => {
                                      const fineRecord = studentFineDetails.pendingFines.find(f => f.borrowingId === item.id);
                                      if (fineRecord) {
                                        handleMarkCashCleared(fineRecord.id, studentFineDetails.studentName);
                                      } else {
                                        addToast('Fine Recorded', `Cleared ₹${item.fine} fine at cash desk.`, 'success');
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                  >
                                    Clear Fine
                                  </button>
                                ) : (
                                  <span className="text-emerald-700 text-xs font-medium">Clear</span>
                                )}
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

      {/* General Fines Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Institution Overdue Dues Ledger
        </h2>

        {/* Filter and search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll number, or book..."
              className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-900 outline-hidden transition"
            />
          </div>

          <div className="flex gap-1 w-full sm:w-auto">
            {(['All', 'pending', 'paid'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
                  filter === f
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'pending' ? 'Unpaid Dues' : f === 'paid' ? 'Cleared' : 'All Fines'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Fine ID</th>
                <th className="p-3.5">Roll Number</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Book Title</th>
                <th className="p-3.5">Overdue Days</th>
                <th className="p-3.5">Amount (@ ₹2/day)</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Desk Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayedFines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No fine records found.
                  </td>
                </tr>
              ) : (
                displayedFines.map(fine => (
                  <tr key={fine.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      {fine.fineId || fine.id}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-blue-900">
                      {fine.studentId}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      {fine.studentName}
                    </td>
                    <td className="p-3.5 text-slate-700">
                      {fine.bookTitle}
                    </td>
                    <td className="p-3.5 text-slate-600 font-mono">
                      {fine.overdueDays || fine.daysOverdue || 0} days
                    </td>
                    <td className="p-3.5 font-mono font-extrabold text-slate-900">
                      ₹{fine.amount}
                    </td>
                    <td className="p-3.5">
                      {fine.status === 'pending' ? (
                        <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Unpaid
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Cleared
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {fine.status === 'pending' && (
                        <button
                          onClick={() => handleMarkCashCleared(fine.id, fine.studentName)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Clear Cash
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
