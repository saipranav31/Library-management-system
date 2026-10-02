import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Search,
  BookOpen,
  LogOut,
  User as UserIcon,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, systemDate } = useLibrary();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const isStudent = currentUser.role === 'student';
  const targetNotifications = notifications.filter(n => {
    if (isStudent) {
      return n.userId === currentUser.studentId || n.userId === 'all';
    } else {
      return n.userId === 'librarian' || n.userId === 'all';
    }
  });

  const unreadCount = targetNotifications.filter(n => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (isStudent) {
      navigate(`/student/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/librarian/books?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Mobile Toggle & Brand Title */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link
              to={isStudent ? '/student/dashboard' : '/librarian/dashboard'}
              className="flex items-center gap-2.5 text-decoration-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-800 transition">
                <BookOpen className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-slate-900 leading-none flex items-center gap-1.5">
                  LibTrack
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    {isStudent ? 'Student' : 'Librarian'}
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium tracking-normal mt-0.5 hidden sm:inline">
                  BVC Library • BVC College of Engineering
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Global Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isStudent ? "Search by title, author, ISBN or department..." : "Search catalog or student records..."}
                className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl pl-9 pr-4 py-2 border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden transition"
              />
            </form>
          </div>

          {/* Right: Notifications & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsAsRead(isStudent ? (currentUser.studentId || '') : 'librarian')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {targetNotifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-sm">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        No notifications right now
                      </div>
                    ) : (
                      targetNotifications.slice(0, 6).map(n => {
                        const icon = n.type === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : n.type === 'WARNING' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : n.type === 'ERROR' ? (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        );

                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              if (n.link) {
                                setShowNotifications(false);
                                navigate(n.link);
                              }
                            }}
                            className={`p-3 text-xs flex items-start gap-2.5 transition hover:bg-slate-50 cursor-pointer ${
                              !n.read ? 'bg-blue-50/40 font-medium' : 'text-slate-600'
                            }`}
                          >
                            {icon}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 leading-tight">{n.title}</p>
                              <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                    <Link
                      to={isStudent ? '/student/notifications' : '/librarian/dashboard'}
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      View all in Notification Center <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <img
                  src={currentUser.profileImage}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-xs"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-sm font-semibold text-slate-900 leading-tight line-clamp-1">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-none mt-0.5">
                    {isStudent ? currentUser.studentId : 'Library Admin'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50 rounded-xl mb-1">
                    <p className="font-bold text-sm text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-500">{currentUser.email}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Department: {currentUser.department}</span>
                    </div>
                  </div>

                  {isStudent && (
                    <Link
                      to="/student/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    >
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      Student Profile
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
