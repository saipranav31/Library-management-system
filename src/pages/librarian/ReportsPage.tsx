import React, { useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  TrendingUp,
  BarChart3,
  BookOpen,
  Users,
  Printer,
  FileText,
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
  Legend,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { books, borrowings, fines, users } = useLibrary();

  // Dynamic KPI calculations from actual records
  const totalLoans = borrowings.length;
  const returnedLoans = borrowings.filter(b => b.status === 'returned').length;
  const activeLoans = borrowings.filter(b => b.status !== 'returned').length;
  const onTimeReturns = borrowings.filter(b => b.status === 'returned' && (!b.fineAmount || b.fineAmount === 0)).length;
  const onTimeReturnRate = returnedLoans > 0 ? `${((onTimeReturns / returnedLoans) * 100).toFixed(1)}%` : '0%';

  const totalPhysicalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const totalIssuedCopies = books.reduce((sum, b) => sum + (b.issuedCopies || 0), 0);
  const catalogCirculationRate = totalPhysicalCopies > 0 ? `${((totalIssuedCopies / totalPhysicalCopies) * 100).toFixed(1)}%` : '0%';

  // Average loan span calculation
  const averageLoanDays = useMemo(() => {
    const returnedItems = borrowings.filter(b => b.status === 'returned' && b.returnDate);
    if (returnedItems.length === 0) return '0 Days';
    const totalDays = returnedItems.reduce((acc, curr) => {
      const start = new Date(curr.issueDate).getTime();
      const end = new Date(curr.returnDate!).getTime();
      const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      return acc + days;
    }, 0);
    return `${(totalDays / returnedItems.length).toFixed(1)} Days`;
  }, [borrowings]);

  // Registered students active loan utilization
  const studentUsers = users.filter(u => u.role === 'student');
  const activeBorrowerStudentIds = new Set(borrowings.filter(b => b.status !== 'returned').map(b => b.studentId));
  const activeStudentUtilization = studentUsers.length > 0
    ? `${((activeBorrowerStudentIds.size / studentUsers.length) * 100).toFixed(1)}%`
    : '0%';

  // Department distribution dynamically aggregated from real records
  const deptData = useMemo(() => {
    const depts = ['CSE', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'];
    const colors = ['#1E3A8A', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#64748B', '#EC4899'];
    return depts.map((name, i) => {
      const count = borrowings.filter(b => b.studentDept === name).length;
      return { name, value: count, color: colors[i % colors.length] };
    }).filter(d => d.value > 0);
  }, [borrowings]);

  // Most popular titles dynamically aggregated from real borrowings
  const popularBooks = useMemo(() => {
    const counts: Record<string, number> = {};
    borrowings.forEach(b => {
      counts[b.bookTitle] = (counts[b.bookTitle] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [borrowings]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-900" />
            Library Analytics & Circulation Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dynamic circulation velocity, inventory rotation, and student engagement statistics.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Summary KPI Row - Real database records */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">On-Time Return Rate</span>
          <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">{onTimeReturnRate}</span>
          <span className="text-xs text-slate-500">{returnedLoans} total return(s) recorded</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Average Loan Span</span>
          <span className="text-3xl font-extrabold text-blue-900 mt-1 block">{averageLoanDays}</span>
          <span className="text-xs text-slate-500">Allowed ceiling: 15 days</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Student Utilization</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{activeStudentUtilization}</span>
          <span className="text-xs text-slate-500">{activeBorrowerStudentIds.size} student(s) currently with active loans</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Catalog Circulation Rate</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{catalogCirculationRate}</span>
          <span className="text-xs text-slate-500">{totalIssuedCopies} / {totalPhysicalCopies} copies in active rotation</span>
        </div>
      </div>

      {/* When no borrowings exist yet */}
      {borrowings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-xl mx-auto space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-slate-900">No circulation records recorded yet.</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Circulation charts, department distribution, and popular book rankings will be generated dynamically as books are borrowed and returned.
          </p>
        </div>
      ) : (
        /* Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-base text-slate-900">Circulation by Academic Department</h3>
            <p className="text-xs text-slate-500 mb-4">Real distribution of borrowed books across branches</p>

            {deptData.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No departmental borrowing logged yet.</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Most Borrowed Titles */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-base text-slate-900">Most Borrowed Book Titles</h3>
            <p className="text-xs text-slate-500 mb-4">Ranked by total circulation count</p>

            {popularBooks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No borrowing transactions recorded.</div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularBooks} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#1E3A8A" radius={[0, 6, 6, 0]} name="Loans Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
