import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
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
} from 'lucide-react';

export const StudentDirectoryPage: React.FC = () => {
  const { allUsers } = useAuth();
  const { borrowings, fines } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const students = useMemo(() => {
    return allUsers.filter(u => u.role === 'student');
  }, [allUsers]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q);

      const matchDept = deptFilter === 'All' || s.department === deptFilter;
      return matchSearch && matchDept;
    });
  }, [students, searchQuery, deptFilter]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-900" />
            Student Library Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Directory of enrolled students, active borrowing counts, and outstanding fee clearance.
          </p>
        </div>

        <div className="text-xs bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl font-medium text-slate-600">
          Enrolled Library Members: <strong className="text-blue-900">{students.length}</strong>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-xl mx-auto space-y-3">
          <GraduationCap className="w-14 h-14 text-slate-300 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-slate-900">No students registered in library directory yet.</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Students who register their institutional account through the Student Registration portal will appear in this directory with their circulation status.
          </p>
        </div>
      ) : (
        <>
          {/* Filter and search */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by student name, roll number, or institutional email..."
                className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-600 outline-hidden transition"
              />
            </div>

            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="All">All Departments</option>
              <option value="CSE">CSE Department</option>
              <option value="AIML">AIML Department</option>
              <option value="ECE">ECE Department</option>
              <option value="EEE">EEE Department</option>
              <option value="MECH">MECH Department</option>
              <option value="CIVIL">CIVIL Department</option>
              <option value="MBA">MBA Department</option>
            </select>
          </div>

          {/* Student Cards Grid */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
              No students match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStudents.map(student => {
                const studentLoans = borrowings.filter(
                  b => b.studentId === student.studentId && b.status !== 'returned'
                );
                const studentOverdue = studentLoans.filter(b => b.status === 'overdue');
                const studentPendingFines = fines.filter(
                  f => f.studentId === student.studentId && f.status === 'pending'
                );
                const fineTotal = studentPendingFines.reduce((acc, f) => acc + f.amount, 0);

                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`}
                            alt={student.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                          />
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 leading-tight">{student.name}</h3>
                            <p className="text-xs text-blue-900 font-mono font-bold mt-0.5">
                              {student.studentId}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {student.department} • {student.year || 'Student'}
                            </span>
                          </div>
                        </div>

                        {fineTotal > 0 ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Coins className="w-3 h-3" /> ₹{fineTotal} Due
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Clear
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{student.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span><strong>{studentLoans.length}</strong> / 4 Active Loans</span>
                      </div>

                      {studentOverdue.length > 0 && (
                        <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {studentOverdue.length} Overdue
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
};
