import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Trash2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useLibrary();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!currentUser) return null;

  const userNotifications = notifications.filter(
    n => n.userId === currentUser.studentId || n.userId === 'all'
  );

  const displayedNotifications = userNotifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-900" />
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time library alerts: approval passes, 7-day/3-day due reminders, and fine updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsAsRead(currentUser.studentId || '')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'all'
              ? 'border-b-2 border-blue-900 text-blue-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All Notifications ({userNotifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            filter === 'unread'
              ? 'border-b-2 border-blue-900 text-blue-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {displayedNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You will receive instant alerts here whenever your requests are approved, books are due soon, or returns are processed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map(n => {
            const icon = n.type === 'SUCCESS' ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : n.type === 'WARNING' ? (
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : n.type === 'ERROR' ? (
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
            );

            return (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 cursor-pointer ${
                  !n.read
                    ? 'bg-white border-blue-200/90 shadow-xs ring-1 ring-blue-100'
                    : 'bg-slate-50/60 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {icon}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <span className="text-[11px] text-slate-400 font-mono block pt-1">
                      {new Date(n.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {n.link && (
                  <Link
                    to={n.link}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition shrink-0"
                    title="View related item"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
