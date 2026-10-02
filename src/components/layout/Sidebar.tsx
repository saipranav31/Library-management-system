import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BookmarkCheck,
  Bell,
  Coins,
  MessageSquare,
  User,
  Boxes,
  ArrowDownLeft,
  Users,
  FileSpreadsheet,
  AlertOctagon,
  ScrollText,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { requests, borrowings, fines, complaints } = useLibrary();

  if (!currentUser) return null;

  const isStudent = currentUser.role === 'student';

  // Badges calculation
  const pendingRequestsCount = requests.filter(r => r.status === 'Pending').length;
  const approvedRequestsCount = requests.filter(
    r => r.status === 'Approved' && (!isStudent || r.studentId === currentUser.studentId)
  ).length;
  const overdueCount = borrowings.filter(
    b => b.status === 'overdue' && (!isStudent || b.studentId === currentUser.studentId)
  ).length;
  const openComplaintsCount = complaints.filter(c => c.status === 'Open').length;

  interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    badgeColor?: string;
    highlight?: boolean;
  }

  const studentLinks: NavItem[] = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Browse Books', path: '/student/browse', icon: BookOpen },
    {
      label: 'My Requests',
      path: '/student/requests',
      icon: ClipboardList,
      badge:
        requests.filter(r => r.studentId === currentUser.studentId && ['Pending', 'Approved'].includes(r.status)).length || null,
      badgeColor: approvedRequestsCount > 0 ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900',
    },
    {
      label: 'My Borrowed Books',
      path: '/student/borrowed',
      icon: BookmarkCheck,
      badge: overdueCount > 0 ? `${overdueCount} due` : null,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    { label: 'Notifications', path: '/student/notifications', icon: Bell },
    {
      label: 'Fines',
      path: '/student/fines',
      icon: Coins,
      badge: fines.filter(f => f.studentId === currentUser.studentId && f.status === 'pending').length > 0 ? 'Dues' : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { label: 'Complaints / Queries', path: '/student/complaints', icon: MessageSquare },
    { label: 'Profile', path: '/student/profile', icon: User },
  ];

  const librarianLinks: NavItem[] = [
    { label: 'Dashboard', path: '/librarian/dashboard', icon: LayoutDashboard },
    { label: 'Books Catalog', path: '/librarian/books', icon: BookOpen },
    { label: 'Inventory Management', path: '/librarian/inventory', icon: Boxes },
    {
      label: 'Student Requests',
      path: '/librarian/requests',
      icon: ClipboardList,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
      badgeColor: 'bg-blue-100 text-blue-800',
      highlight: pendingRequestsCount > 0,
    },
    { label: 'Borrowing Records', path: '/librarian/borrowings', icon: BookmarkCheck },
    { label: 'Return Book', path: '/librarian/returns', icon: ArrowDownLeft },
    { label: 'Student Directory', path: '/librarian/students', icon: Users },
    { label: 'Fines & Dues', path: '/librarian/fines', icon: Coins },
    {
      label: 'Complaints / Queries',
      path: '/librarian/complaints',
      icon: MessageSquare,
      badge: openComplaintsCount > 0 ? openComplaintsCount : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { label: 'Lost / Damaged', path: '/librarian/lost-damaged', icon: AlertOctagon },
    { label: 'Analytics Reports', path: '/librarian/reports', icon: FileSpreadsheet },
    { label: 'Audit Logs', path: '/librarian/audit-logs', icon: ScrollText },
    { label: 'System Settings', path: '/librarian/settings', icon: Settings },
  ];

  const navItems = isStudent ? studentLinks : librarianLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header inside sidebar (mobile close) */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">BVC Library Menu</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal info badge */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold tracking-wider uppercase mb-1">
            <span>{isStudent ? 'Student Portal' : 'Librarian Console'}</span>
            <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
              BVC
            </span>
          </div>
          <div className="text-xs font-medium text-slate-700 truncate">
            {isStudent ? (
              <>
                <span className="font-mono font-bold text-blue-950">{currentUser.studentId}</span> • {currentUser.department}
              </>
            ) : (
              `${currentUser.department} • Administration`
            )}
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${item.highlight ? 'ring-1 ring-blue-400/40 bg-blue-50/30' : ''}`
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition ${
                      item.highlight ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      item.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          <p className="font-semibold text-slate-700">BVC Library</p>
          <p className="text-slate-500">BVC College of Engineering</p>
        </div>
      </aside>
    </>
  );
};
