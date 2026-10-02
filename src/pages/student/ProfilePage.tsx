import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  CheckCircle2,
  Coins,
  ShieldCheck,
  CreditCard,
  Building,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { borrowings, requests, fines } = useLibrary();

  if (!currentUser) return null;

  const myBorrowings = borrowings.filter(
    b => b.studentId === currentUser.studentId || b.studentEmail === currentUser.email
  );
  const activeLoans = myBorrowings.filter(b => b.status !== 'returned');
  const returnedLoans = myBorrowings.filter(b => b.status === 'returned');
  const myRequests = requests.filter(
    r => r.studentId === currentUser.studentId || r.studentRollNo === currentUser.studentId
  );
  const myPaidFines = fines.filter(
    f => (f.studentId === currentUser.studentId) && f.status === 'paid'
  );
  const totalFinesPaid = myPaidFines.reduce((acc, curr) => acc + curr.amount, 0);

  const pendingFines = fines.filter(
    f => (f.studentId === currentUser.studentId) && f.status === 'pending'
  );
  const outstandingFine = pendingFines.reduce((acc, curr) => acc + curr.amount, 0);

  const libraryStatus = outstandingFine > 0 ? 'Dues Pending' : 'Good Standing (Active)';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-7 h-7 text-blue-900" />
          Student Profile & Library ID
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Primary student identification: <strong>Roll Number</strong>. BVC College of Engineering library credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Digital Library ID Card (Zero QR codes) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-blue-800 relative overflow-hidden flex flex-col justify-between min-h-[380px]">
            {/* Ambient shimmer */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-3 border-b border-blue-800/80">
                <div>
                  <span className="text-[10px] tracking-widest text-blue-300 font-bold uppercase block">
                    BVC LIBRARY
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    BVC COLLEGE OF ENGINEERING
                  </span>
                </div>
                <CreditCard className="w-6 h-6 text-blue-300" />
              </div>

              <div className="mt-6 flex items-center gap-4">
                <img
                  src={
                    currentUser.profileImage ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`
                  }
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/80 shadow-md bg-blue-900"
                />
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-white leading-tight">
                    {currentUser.name}
                  </h3>
                  <div className="mt-1">
                    <span className="text-[10px] text-blue-300 uppercase tracking-wider block font-bold">
                      ROLL NUMBER
                    </span>
                    <span className="font-mono text-sm font-extrabold text-white bg-blue-800/80 px-2 py-0.5 rounded">
                      {currentUser.studentId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-1.5 text-xs text-blue-200 border-t border-blue-800/60 pt-4">
                <p className="flex justify-between">
                  <span className="text-blue-300 font-medium">Department:</span>
                  <strong className="text-white">{currentUser.department}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-blue-300 font-medium">Academic Year:</span>
                  <strong className="text-white">{currentUser.year || 'IV Year'}</strong>
                </p>
                <p className="flex justify-between">
                  <span className="text-blue-300 font-medium">Borrowing Limit:</span>
                  <strong className="text-white">4 Books</strong>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-blue-300 font-semibold">Library Status</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  outstandingFine > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                }`}
              >
                {libraryStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Detailed Profile Fields & Circulation History (Section 4 Specification) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Profile Attributes (Section 4) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
              Primary Student Identification Records
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                  Roll Number (Primary Identifier)
                </span>
                <span className="font-mono text-base font-bold text-blue-900 block mt-0.5">
                  {currentUser.studentId}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Quote this Roll Number at the counter for book collection and returns.
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                  Student Name
                </span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Enrolled BVC College student
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                  Department
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {currentUser.department} Department
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                  Academic Year
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {currentUser.year || 'IV Year'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                  Institutional Email
                </span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5 truncate">
                  {currentUser.email}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider">
                  Phone (Contact)
                </span>
                <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                  {currentUser.phone || 'Not provided'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-700" />
                <span>Affiliation: <strong>BVC College of Engineering</strong></span>
              </div>
              <span className="font-semibold">BVC Library Member</span>
            </div>
          </div>

          {/* Account Metrics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Lifetime Circulation Summary
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Active Loans</span>
                <span className="text-xl font-bold text-blue-900">{activeLoans.length}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Returned Books</span>
                <span className="text-xl font-bold text-slate-800">{returnedLoans.length}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Total Requests</span>
                <span className="text-xl font-bold text-slate-800">{myRequests.length}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Fines Paid</span>
                <span className="text-xl font-bold text-emerald-700">₹{totalFinesPaid}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
