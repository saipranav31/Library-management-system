import React, { useState } from 'react';
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
import { Modal } from '../../components/common/Modal';

export const LibrarianDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    books,
    requests,
    borrowings,
    fines,
    systemDate,
    approveRequest,
    rejectRequest,
  } = useLibrary();
  const navigate = useNavigate();

  const [rejectModalReqId, setRejectModalReqId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Multiple copies currently reserved for semester syllabus');

  // Key KPI calculations
  const totalCatalogTitles = books.length;
  const totalPhysicalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const totalAvailableCopies = books.reduce((acc, b) => acc + b.availableCopies, 0);
  const totalIssuedCopies = books.reduce((acc, b) => acc + b.issuedCopies, 0);

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const approvedRequests = requests.filter(r => r.status === 'Approved');

  const activeBorrowings = borrowings.filter(b => b.status !== 'returned');
  const overdueBorrowings = borrowings.filter(b => b.status === 'overdue');

  const pendingFines = fines.filter(f => f.status === 'pending');
  const paidFines = fines.filter(f => f.status === 'paid');
  const totalPendingFineAmount = pendingFines.reduce((acc, f) => acc + f.amount, 0);
  const totalCollectedFineAmount = paidFines.reduce((acc, f) => acc + f.amount, 0);

  // Departmental Borrowing Distribution for Recharts (derived strictly from real records)
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

  const handleConfirmReject = () => {
    if (!rejectModalReqId) return;
    rejectRequest(rejectModalReqId, rejectReason);
    setRejectModalReqId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-300 font-semibold text-xs tracking-wider uppercase">
              Circulation Management Hub
            </span>
            <span className="bg-blue-800 text-blue-200 text-[10px] px-2 py-0.5 rounded-full font-mono">
              Admin: {currentUser?.name || 'Chief Librarian'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Library Administration Console
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Monitor real-time circulation, review student requests by Roll Number, and issue books at the desk.
          </p>
        </div>

        {/* Quick Action Station Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/librarian/requests"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <ClipboardList className="w-4 h-4" />
            Student Requests
          </Link>

          <Link
            to="/librarian/returns"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Quick Return
          </Link>

          <Link
            to="/librarian/books"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Book
          </Link>
        </div>
      </div>

      {/* When library is empty (Section 14) */}
      {totalCatalogTitles === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Your BVC Library catalog is empty.</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No books have been added to the library database yet. Add the first real textbook to begin building the catalog and enabling student circulation.
          </p>
          <div>
            <Link
              to="/librarian/books"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add First Book
            </Link>
          </div>
        </div>
      )}

      {/* Primary KPI Cards Grid (Section 5 & 14 Dynamic Database Values) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Books */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Books
          </span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{totalCatalogTitles}</div>
          <span className="text-[10px] text-slate-400 font-medium">titles in system</span>
        </div>

        {/* Available Copies */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Available Copies
          </span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">{totalAvailableCopies}</div>
          <span className="text-[10px] text-slate-400 font-medium">on shelf</span>
        </div>

        {/* Issued Books */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Issued Books
          </span>
          <div className="mt-2 text-2xl font-extrabold text-blue-900">{totalIssuedCopies}</div>
          <span className="text-[10px] text-slate-400 font-medium">in circulation</span>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Pending Requests
          </span>
          <div className="mt-2 text-2xl font-extrabold text-amber-600">{pendingRequests.length}</div>
          <span className="text-[10px] text-slate-400 font-medium">awaiting review</span>
        </div>

        {/* Overdue Books */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Overdue Books
          </span>
          <div className={`mt-2 text-2xl font-extrabold ${overdueBorrowings.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {overdueBorrowings.length}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">beyond due date</span>
        </div>

        {/* Outstanding Fines */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Outstanding Fines
          </span>
          <div className={`mt-2 text-2xl font-extrabold ${totalPendingFineAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            ₹{totalPendingFineAmount}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">@ ₹2/day policy</span>
        </div>
      </div>

      {/* Middle Section: Pending Requests Approval Station */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Incoming Student Requests ({pendingRequests.length} Pending)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and approve student requests. Books can be issued directly using the student's Roll Number.
            </p>
          </div>

          <Link
            to="/librarian/requests"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 self-start sm:self-auto"
          >
            View Full Request Queue &rarr;
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-sm text-slate-800">No pending student requests!</p>
            <p className="text-xs text-slate-500 mt-0.5">All student circulation requests have been reviewed or issued.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-2">
            {pendingRequests.slice(0, 4).map(req => (
              <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <img
                    src={req.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
                    alt={req.bookTitle}
                    className="w-14 h-20 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">
                        {req.requestId}
                      </span>
                      <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Needs Approval
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {req.bookTitle}
                    </h3>
                    <p className="text-xs text-slate-500">Author: {req.bookAuthor}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span>Student: <strong className="text-slate-900">{req.studentName}</strong> ({req.studentId})</span>
                      <span>Department: <strong>{req.studentDept}</strong></span>
                      <span>Requested: {new Date(req.requestDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>

                {/* Approve / Reject Controls */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => approveRequest(req.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Request
                  </button>

                  <button
                    onClick={() => setRejectModalReqId(req.id)}
                    className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Circulation Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Circulation by Academic Department
              </h3>
              <p className="text-xs text-slate-500">Volume of books actively borrowed across engineering disciplines</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px', border: 'none' }}
                />
                <Bar dataKey="count" fill="#1E3A8A" radius={[6, 6, 0, 0]} name="Loans Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Physical Stock Distribution Pie */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              Physical Stock Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Shelved vs circulated copies</p>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px', border: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Available on Shelf:</span>
              </span>
              <strong className="text-slate-900">{totalAvailableCopies} copies</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-900" />
                <span className="text-slate-600">Currently Issued:</span>
              </span>
              <strong className="text-slate-900">{totalIssuedCopies} copies</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Rejection Reason Modal */}
      {rejectModalReqId && (
        <Modal
          isOpen={!!rejectModalReqId}
          onClose={() => setRejectModalReqId(null)}
          title="Reject Book Request"
          subtitle="Provide a transparent reason to notify the student"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Select or type rejection reason
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRejectReason('Reserved for semester examinations')}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-slate-700"
              >
                Exam Reserve
              </button>
              <button
                type="button"
                onClick={() => setRejectReason('Physical copy sent for rebinding / damage repair')}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-slate-700"
              >
                Damage / Repair
              </button>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRejectModalReqId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs"
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
