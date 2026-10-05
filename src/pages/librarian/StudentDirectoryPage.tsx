import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Coins,
  GraduationCap,
  Sparkles,
  UserCheck,
  Calendar,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const StudentDirectoryPage: React.FC = () => {
  const { allUsers } = useAuth();
  const { borrowings, fines, promoteAcademicYear, settings } = useLibrary();

  // Advanced Filters (CHANGE 6)
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [academicYearFilter, setAcademicYearFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fineFilter, setFineFilter] = useState('All');
  const [borrowingFilter, setBorrowingFilter] = useState('All');

  // Promotion simulation modal
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoPreview, setPromoPreview] = useState<{
    promotedCount: number;
    graduatedCount: number;
    newAcademicYear: string;
    details: string[];
  } | null>(null);

  const students = useMemo(() => {
    return allUsers.filter(u => u.role === 'student');
  }, [allUsers]);

  const distinctAcademicYears = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.academicYear) set.add(s.academicYear);
    });
    return ['All', ...Array.from(set)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const roll = (s.studentId || '').toLowerCase();
      const name = (s.name || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchSearch = !q || roll.includes(q) || name.includes(q) || email.includes(q);

      // Academic Year Filter: 1st Year, 2nd Year, 3rd Year, 4th Year, Graduated
      let matchYear = true;
      if (yearFilter !== 'All') {
        const studentYr = (s.year || '').toLowerCase();
        if (yearFilter === 'Graduated') {
          matchYear = s.status === 'Graduated' || studentYr.includes('graduat');
        } else {
          matchYear = studentYr.includes(yearFilter.toLowerCase()) && s.status !== 'Graduated';
        }
      }

      // Department Filter
      const matchDept = deptFilter === 'All' || s.department === deptFilter;

      // Section Filter: A, B, C, D
      const matchSection = sectionFilter === 'All' || (s.section || 'A') === sectionFilter;

      // Student status: Active, Graduated, Blocked
      const matchStatus = statusFilter === 'All' || (s.status || 'Active') === statusFilter;

      // Student's fines & borrowings
      const studentFines = fines.filter(f => f.studentId && f.studentId.toLowerCase() === roll);
      const studentBorrowings = borrowings.filter(b => b.studentId && b.studentId.toLowerCase() === roll && b.status !== 'returned');
      const hasOverdue = studentBorrowings.some(b => b.status === 'overdue');
      const hasPendingFine = studentFines.some(f => f.status === 'pending');
      const hasPaidFine = studentFines.some(f => f.status === 'paid');

      // Fine Status Filter: No Fine, Fine Pending, Fine Paid
      let matchFine = true;
      if (fineFilter === 'No Fine') matchFine = !hasPendingFine && studentFines.length === 0;
      else if (fineFilter === 'Fine Pending') matchFine = hasPendingFine;
      else if (fineFilter === 'Fine Paid') matchFine = hasPaidFine && !hasPendingFine;

      // Borrowing Status Filter: No Books, Currently Borrowing, Overdue
      let matchBorrowing = true;
      if (borrowingFilter === 'No Books') matchBorrowing = studentBorrowings.length === 0;
      else if (borrowingFilter === 'Currently Borrowing') matchBorrowing = studentBorrowings.length > 0;
      else if (borrowingFilter === 'Overdue') matchBorrowing = hasOverdue;

      // Academic Year Batch Filter (e.g. 2026-2027)
      const matchAcademicYear = academicYearFilter === 'All' || s.academicYear === academicYearFilter;

      return matchSearch && matchYear && matchAcademicYear && matchDept && matchSection && matchStatus && matchFine && matchBorrowing;
    });
  }, [students, searchQuery, yearFilter, academicYearFilter, deptFilter, sectionFilter, statusFilter, fineFilter, borrowingFilter, fines, borrowings]);

  const handleOpenPromoModal = () => {
    const preview = promoteAcademicYear(true);
    setPromoPreview(preview);
    setPromoModalOpen(true);
  };

  const handleConfirmPromotion = () => {
    promoteAcademicYear(false);
    setPromoModalOpen(false);
  };

  const departments = ['All', 'CSE', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-900" />
            Student Library Registry & Academic Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Filter student profiles by year, department, section, and standing. Automatic June 1 academic year promotion.
          </p>
        </div>

        {/* Promotion Simulation Button (CHANGE 7) */}
        <button
          onClick={handleOpenPromoModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <GraduationCap className="w-4 h-4" />
          Simulate June 1 Promotion
        </button>
      </div>

      {/* Advanced Filter Console (CHANGE 6) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, or institutional email..."
            className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-600 outline-hidden transition"
          />
        </div>

        {/* 7 Dropdown Filter Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Year of Study */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Year of Study
            </label>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="All">All</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>

          {/* Academic Year Batch */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Academic Year
            </label>
            <select
              value={academicYearFilter}
              onChange={e => setAcademicYearFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              {distinctAcademicYears.map(ay => (
                <option key={ay} value={ay}>{ay === 'All' ? 'All' : ay}</option>
              ))}
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
                <option key={d} value={d}>{d === 'All' ? 'All Depts' : d}</option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Section
            </label>
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* Student Status */}
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
              <option value="Active">Active</option>
              <option value="Graduated">Graduated</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

          {/* Fine Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Fine Status
            </label>
            <select
              value={fineFilter}
              onChange={e => setFineFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="All">All Fines</option>
              <option value="No Fine">No Fine</option>
              <option value="Fine Pending">Fine Pending</option>
              <option value="Fine Paid">Fine Paid</option>
            </select>
          </div>

          {/* Borrowing Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Borrowing Status
            </label>
            <select
              value={borrowingFilter}
              onChange={e => setBorrowingFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="All">All Borrowings</option>
              <option value="No Books">No Books</option>
              <option value="Currently Borrowing">Currently Borrowing</option>
              <option value="Overdue">Overdue Books</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredStudents.length}</strong> of {students.length} students
          </span>

          {(yearFilter !== 'All' || deptFilter !== 'All' || sectionFilter !== 'All' || statusFilter !== 'All' || fineFilter !== 'All' || borrowingFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setYearFilter('All');
                setDeptFilter('All');
                setSectionFilter('All');
                setStatusFilter('All');
                setFineFilter('All');
                setBorrowingFilter('All');
                setSearchQuery('');
              }}
              className="text-blue-900 font-bold hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Student Cards Grid */}
      {students.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto space-y-2">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No students enrolled yet</h3>
          <p className="text-xs text-slate-500">
            Student profiles will appear here once students register their institutional college IDs.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto space-y-2">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No students found</h3>
          <p className="text-xs text-slate-500">
            No enrolled students match your exact filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => {
            const roll = (student.studentId || '').toLowerCase();
            const studentFines = fines.filter(f => f.studentId && f.studentId.toLowerCase() === roll && f.status === 'pending');
            const totalFine = studentFines.reduce((sum, f) => sum + f.amount, 0);

            const activeBorrows = borrowings.filter(b => b.studentId && b.studentId.toLowerCase() === roll && b.status !== 'returned');
            const hasOverdue = activeBorrows.some(b => b.status === 'overdue');

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {student.studentId}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      student.status === 'Graduated'
                        ? 'bg-purple-100 text-purple-800'
                        : student.status === 'Blocked'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {student.status || 'Active'}
                    </span>
                  </div>

                  {/* Name and Department */}
                  <div className="mt-3">
                    <h3 className="font-extrabold text-base text-slate-900">{student.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {student.department} • {student.year || '3rd Year'} • Section {student.section || 'A'}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Academic Cycle: {student.academicYear || settings.currentAcademicYear || '2026-2027'}
                    </p>
                  </div>

                  {/* Standing Overview Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Loans</span>
                      <strong className={hasOverdue ? 'text-rose-600 font-bold' : 'text-slate-800 font-semibold'}>
                        {activeBorrows.length} {hasOverdue && '(Overdue!)'}
                      </strong>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Pending Dues</span>
                      <strong className={totalFine > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-700 font-bold'}>
                        ₹{totalFine}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Counter Quick Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">{student.email}</span>
                  <Link
                    to={`/librarian/verify?roll=${encodeURIComponent(student.rollNumber || student.studentId)}`}
                    className="font-bold text-blue-900 hover:text-blue-700 inline-flex items-center gap-1 group"
                  >
                    Counter Verify <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Simulate June 1 Promotion */}
      {promoModalOpen && (
        <Modal
          isOpen={promoModalOpen}
          onClose={() => setPromoModalOpen(false)}
          title="Simulate June 1 Academic Promotion"
          subtitle="Annual Academic Year Transition (June 1 → May 31)"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Calendar className="w-4 h-4 text-purple-700" />
                <span>Academic Year Promotion Transition</span>
              </div>
              <p className="text-purple-800 text-[11px]">
                Promotes all students according to the annual college calendar rule (June 1). 4th Year students transition to GRADUATED / ALUMNI status (never 5th year). Historical borrowing and fine records are permanently preserved.
              </p>
            </div>

            {promoPreview && (
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      New Academic Year
                    </span>
                    <strong className="text-sm text-slate-900">{promoPreview.newAcademicYear}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      Promotions / Graduations
                    </span>
                    <span className="text-xs font-bold text-purple-700">
                      {promoPreview.promotedCount} Promoted • {promoPreview.graduatedCount} Graduated
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                  <h5 className="font-bold text-slate-700 text-[11px] mb-2">Student Transition Preview:</h5>
                  {promoPreview.details.map((detail, idx) => (
                    <div key={idx} className="py-1 text-slate-600 font-mono text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPromoModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPromotion}
                className="flex-1 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold transition shadow-xs cursor-pointer"
              >
                Confirm & Apply Promotion
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
