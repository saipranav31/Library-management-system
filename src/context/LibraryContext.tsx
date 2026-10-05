import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  Book,
  BookRequest,
  Borrowing,
  AppNotification,
  Fine,
  WaitlistEntry,
  Complaint,
  ComplaintCategory,
  LostDamagedReport,
  AuditLog,
  LibrarySettings,
  User,
  RequestStatus,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_BOOKS,
  INITIAL_REQUESTS,
  INITIAL_BORROWINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_FINES,
  INITIAL_WAITLIST,
  INITIAL_COMPLAINTS,
  INITIAL_LOST_DAMAGED,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
} from '../data/initialData';
import {
  getLibrarySessionInfo,
  SessionInfo,
  checkRequestExpired,
  getISTDetails,
  getAcademicYear,
  calculateStudentPromotion,
} from '../utils/sessionUtils';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface LibraryContextType {
  // Real System / Simulated IST Date
  systemDate: Date;
  isSimulatedTime: boolean;
  sessionInfo: SessionInfo;
  setSimulatedTime: (timeOrPreset: Date | 'morning' | 'lunch' | 'afternoon' | 'evening' | string) => void;
  resetToRealTime: () => void;
  triggerExpiryCheckNow: () => number;

  // Data Collections
  books: Book[];
  requests: BookRequest[];
  borrowings: Borrowing[];
  notifications: AppNotification[];
  fines: Fine[];
  waitlists: WaitlistEntry[];
  complaints: Complaint[];
  lostDamagedReports: LostDamagedReport[];
  auditLogs: AuditLog[];
  settings: LibrarySettings;
  users: User[];

  // Toasts
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Student Actions
  requestBook: (bookId: string, student?: User | null) => {
    success: boolean;
    message: string;
    requestId?: string;
    status?: RequestStatus;
    fifoPosition?: number;
    pickupDeadline?: string;
  };
  cancelRequest: (requestId: string, student?: User | null) => void;
  requestRenewal: (borrowingId: string, reason?: string) => { success: boolean; message: string };
  joinWaitlist: (bookId: string, student?: User | null) => { success: boolean; message: string };
  payFine: (fineId: string, method: string) => void;
  submitComplaint: (
    categoryOrPayload: ComplaintCategory | { category: ComplaintCategory; subject: string; description: string; studentId?: string; studentName?: string; student?: User },
    subject?: string,
    description?: string,
    student?: User | null
  ) => void;
  reportLostOrDamaged: (bookId: string, issueType: 'Lost' | 'Damaged', description: string, student?: User | null, imageUrl?: string) => void;
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: (userId: string) => void;

  // Librarian Actions
  markRequestAsTaken: (requestId: string, loanDurationOverride?: number, librarian?: User | null) => {
    success: boolean;
    message: string;
    borrowing?: Borrowing;
  };
  requestImmediateReturn: (borrowingId: string, message?: string, librarian?: User | null) => {
    success: boolean;
    message: string;
  };
  updateBookLoanDuration: (bookId: string, newDurationDays: number, librarian?: User | null) => void;
  approveRequest: (requestId: string, librarian?: User | null) => { success: boolean; message?: string };
  rejectRequest: (requestId: string, reason?: string, librarian?: User | null) => void;
  confirmIssueBook: (requestId: string, librarian?: User | null) => { success: boolean; message: string; borrowing?: Borrowing };
  issueBookDirect: (bookId: string, studentRollNo: string, librarian?: User | null) => { success: boolean; message: string; borrowing?: Borrowing };
  returnBook: (transactionId: string, librarian?: User | null) => { success: boolean; message: string; fineCalculated?: number };
  approveRenewal: (borrowingId: string, librarian?: User | null) => void;
  rejectRenewal: (borrowingId: string, reason?: string, librarian?: User | null) => void;
  addBook: (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>, librarian?: User | null) => Book;
  updateBook: (bookId: string, bookData: Partial<Book>, librarian?: User | null) => void;
  deleteBook: (bookId: string, librarian?: User | null) => { success: boolean; message: string };
  waiveFine: (fineId: string, reason?: string, librarian?: User | null) => void;
  resolveComplaint: (ticketId: string, response: string, librarian?: User | null) => void;
  updateLostDamagedStatus: (reportId: string, status: LostDamagedReport['status'], fineAmount?: number, notes?: string, librarian?: User | null) => void;
  updateSettings: (newSettings: Partial<LibrarySettings>, librarian?: User | null) => void;

  // Academic Promotion & Testing
  promoteAcademicYear: (dryRun?: boolean) => {
    success: boolean;
    promotedCount: number;
    graduatedCount: number;
    newAcademicYear: string;
    details: string[];
  };
  simulateFIFORequests: (bookId: string) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// Clean up any legacy demo data from localStorage on initialization
try {
  if (typeof window !== 'undefined' && localStorage.getItem('libtrack_clean_nodemo_v3') !== 'true') {
    ['books', 'requests', 'borrowings', 'notifications', 'fines', 'waitlists', 'complaints', 'lost_damaged', 'audit_logs'].forEach(k => {
      localStorage.removeItem(`libtrack_${k}`);
    });
    localStorage.setItem('libtrack_clean_nodemo_v3', 'true');
  }
} catch {
  // ignore
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`libtrack_${key}`);
    if (item) {
      const parsed = JSON.parse(item);
      // Ensure we don't load legacy demo books if fallback is empty
      if (key === 'books' && Array.isArray(parsed) && parsed.some((b: any) => b.bookId === 'BK-CSE-001' && b.author === 'Herbert Schildt')) {
        localStorage.removeItem(`libtrack_${key}`);
        return fallback;
      }
      return parsed;
    }
  } catch {
    // fallback
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(`libtrack_${key}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const currentUser = auth?.currentUser || null;
  const allAuthUsers = auth?.allUsers || INITIAL_USERS;
  const updateAllUsers = auth?.updateAllUsers;

  const defaultStudent: User | null = useMemo(() => {
    return allAuthUsers.find(u => u.role === 'student') || null;
  }, [allAuthUsers]);

  const defaultLibrarian: User = useMemo(() => {
    return allAuthUsers.find(u => u.role === 'librarian') || INITIAL_USERS[0];
  }, [allAuthUsers]);

  // Current real / simulated system date
  const [isSimulatedTime, setIsSimulatedTime] = useState<boolean>(() => {
    return localStorage.getItem('libtrack_sim_active') === 'true';
  });

  const [systemDateString, setSystemDateString] = useState<string>(() => {
    const saved = localStorage.getItem('libtrack_system_date');
    if (saved && localStorage.getItem('libtrack_sim_active') === 'true') {
      return saved;
    }
    return new Date().toISOString();
  });

  const systemDate = useMemo(() => new Date(systemDateString), [systemDateString]);

  // Real-time clock tick if not simulated
  useEffect(() => {
    if (isSimulatedTime) return;
    const interval = setInterval(() => {
      setSystemDateString(new Date().toISOString());
    }, 15000); // sync every 15s
    return () => clearInterval(interval);
  }, [isSimulatedTime]);

  // Calculate current session dynamically
  const sessionInfo = useMemo(() => {
    return getLibrarySessionInfo(systemDate);
  }, [systemDate]);

  // Core state collections
  const [books, setBooks] = useState<Book[]>(() => loadFromStorage('books', INITIAL_BOOKS));
  const [requests, setRequests] = useState<BookRequest[]>(() => loadFromStorage('requests', INITIAL_REQUESTS));
  const [borrowings, setBorrowings] = useState<Borrowing[]>(() => loadFromStorage('borrowings', INITIAL_BORROWINGS));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadFromStorage('notifications', INITIAL_NOTIFICATIONS));
  const [fines, setFines] = useState<Fine[]>(() => loadFromStorage('fines', INITIAL_FINES));
  const [waitlists, setWaitlists] = useState<WaitlistEntry[]>(() => loadFromStorage('waitlists', INITIAL_WAITLIST));
  const [complaints, setComplaints] = useState<Complaint[]>(() => loadFromStorage('complaints', INITIAL_COMPLAINTS));
  const [lostDamagedReports, setLostDamagedReports] = useState<LostDamagedReport[]>(() => loadFromStorage('lost_damaged', INITIAL_LOST_DAMAGED));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadFromStorage('audit_logs', INITIAL_AUDIT_LOGS));
  const [settings, setSettings] = useState<LibrarySettings>(() => loadFromStorage('settings', INITIAL_SETTINGS));
  const users = allAuthUsers;

  // Toast UI state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Save collections to localStorage
  useEffect(() => { saveToStorage('system_date', systemDateString); }, [systemDateString]);
  useEffect(() => { saveToStorage('books', books); }, [books]);
  useEffect(() => { saveToStorage('requests', requests); }, [requests]);
  useEffect(() => { saveToStorage('borrowings', borrowings); }, [borrowings]);
  useEffect(() => { saveToStorage('notifications', notifications); }, [notifications]);
  useEffect(() => { saveToStorage('fines', fines); }, [fines]);
  useEffect(() => { saveToStorage('waitlists', waitlists); }, [waitlists]);
  useEffect(() => { saveToStorage('complaints', complaints); }, [complaints]);
  useEffect(() => { saveToStorage('lost_damaged', lostDamagedReports); }, [lostDamagedReports]);
  useEffect(() => { saveToStorage('audit_logs', auditLogs); }, [auditLogs]);
  useEffect(() => { saveToStorage('settings', settings); }, [settings]);

  const addAuditLog = useCallback((
    user?: Partial<User> | null,
    action: string = 'SYSTEM_ACTION',
    entity?: string,
    description?: string,
    actionType: string = 'GENERAL'
  ) => {
    const effectiveUser = user || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const actorName = effectiveUser?.name || 'SYSTEM AUTOMATION';
    const actorId = effectiveUser?.studentId || effectiveUser?.id || 'SYS-AUTO';

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      auditId: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: systemDate.toISOString(),
      performedAt: systemDate.toISOString(),
      userId: actorId,
      userName: actorName,
      userRole: effectiveUser?.role || 'system',
      actor: actorName,
      performedBy: actorName,
      action,
      actionType,
      entity: entity || 'General',
      entityId: entity,
      details: description,
      description,
    };

    setAuditLogs(prev => [newLog, ...prev.slice(0, 199)]);
  }, [currentUser, defaultLibrarian, systemDate]);

  // ================= AUTOMATIC SESSION EXPIRATION ENGINE ================= //

  const triggerExpiryCheckNow = useCallback(() => {
    let expiredCount = 0;
    const now = systemDate;

    setRequests(prevRequests => {
      const updated = prevRequests.map(r => {
        if ((r.status === 'Granted' || r.status === 'Approved') && checkRequestExpired(r, now)) {
          expiredCount++;
          const expiredReq: BookRequest = {
            ...r,
            status: 'Expired',
            expiredAt: now.toISOString(),
          };

          // Send student expiry notification
          const notif: AppNotification = {
            id: `notif-exp-${Date.now()}-${r.id}`,
            notificationId: `NOTIF-EXP-${Date.now().toString().slice(-4)}`,
            userId: r.studentId,
            studentId: r.studentId,
            title: 'Book Request Expired',
            message: `Your book request for "${r.bookTitle}" expired because it was not collected during the selected library session. Please create a new request during the next active session.`,
            type: 'WARNING',
            priority: 'NORMAL',
            read: false,
            status: 'unread',
            link: '/student/requests',
            bookId: r.bookId,
            createdAt: now.toISOString(),
          };
          setNotifications(prev => [notif, ...prev]);

          addAuditLog(
            { name: 'SYSTEM AUTOMATION', role: 'admin' },
            'Session Request Expired',
            r.requestId,
            `Request ${r.requestId} for "${r.bookTitle}" (Student Roll No: ${r.studentId}) expired automatically at end of ${r.session || 'Morning'} session.`,
            'SESSION_EXPIRY'
          );

          return expiredReq;
        }
        return r;
      });

      return updated;
    });

    if (expiredCount > 0) {
      addToast(
        'Session Expiration Processed',
        `${expiredCount} uncollected book request(s) transitioned to Expired.`,
        'info'
      );
    }

    return expiredCount;
  }, [systemDate, addAuditLog, addToast]);

  // Periodic expiration check every 30 seconds
  useEffect(() => {
    triggerExpiryCheckNow();
    const interval = setInterval(() => {
      triggerExpiryCheckNow();
    }, 30000);
    return () => clearInterval(interval);
  }, [triggerExpiryCheckNow]);

  // Automatic overdue fine updater (strictly ₹2 per day after due date)
  useEffect(() => {
    const currentSimDate = systemDate;

    setBorrowings(prevBorrowings => {
      let finesToUpsert: Fine[] = [];

      const updated = prevBorrowings.map(item => {
        if (item.status === 'returned') return item;

        const due = new Date(item.dueDate);
        const diffMs = currentSimDate.getTime() - due.getTime();
        const overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

        let newStatus = item.status;
        let fineAmount = item.fineAmount || 0;

        if (overdueDays > 0) {
          newStatus = 'overdue';
          const calculatedFine = Math.min(settings.maxFine, overdueDays * settings.finePerDay);
          fineAmount = item.finePaid ? 0 : calculatedFine;

          finesToUpsert.push({
            id: `fine-${item.id}`,
            fineId: `FINE-2026-${item.transactionId.slice(-4)}`,
            studentId: item.studentId,
            studentName: item.studentName,
            borrowingId: item.id,
            transactionId: item.transactionId,
            bookTitle: item.bookTitle,
            daysOverdue: overdueDays,
            overdueDays: overdueDays,
            ratePerDay: settings.finePerDay,
            amount: fineAmount,
            status: item.finePaid ? 'paid' : 'pending',
            dueDate: item.dueDate,
            createdAt: currentSimDate.toISOString(),
          });
        }

        return {
          ...item,
          status: newStatus,
          fineAmount,
        };
      });

      if (finesToUpsert.length > 0) {
        setFines(prevFines => {
          const map = new Map<string, Fine>(prevFines.map(f => [f.borrowingId || f.id, f]));
          finesToUpsert.forEach(f => {
            const key = f.borrowingId || f.id;
            const existing = map.get(key);
            if (!existing || existing.status !== 'paid') {
              map.set(key, f);
            }
          });
          return Array.from(map.values());
        });
      }

      return updated;
    });
  }, [systemDate, settings.finePerDay, settings.maxFine]);

  // ================= SIMULATION & TESTING CONTROLS ================= //

  const setSimulatedTime = useCallback((timeOrPreset: Date | 'morning' | 'lunch' | 'afternoon' | 'evening' | string) => {
    setIsSimulatedTime(true);
    localStorage.setItem('libtrack_sim_active', 'true');

    let targetDate = new Date();

    if (timeOrPreset === 'morning') {
      // 10:00 AM IST
      targetDate = new Date();
      targetDate.setUTCHours(4, 30, 0, 0); // 10:00 AM IST = 04:30 UTC
    } else if (timeOrPreset === 'lunch') {
      // 1:00 PM IST (Lunch Closed)
      targetDate = new Date();
      targetDate.setUTCHours(7, 30, 0, 0); // 1:00 PM IST = 07:30 UTC
    } else if (timeOrPreset === 'afternoon') {
      // 2:30 PM IST (Afternoon Session)
      targetDate = new Date();
      targetDate.setUTCHours(9, 0, 0, 0); // 2:30 PM IST = 09:00 UTC
    } else if (timeOrPreset === 'evening') {
      // 5:00 PM IST (Closed for the day)
      targetDate = new Date();
      targetDate.setUTCHours(11, 30, 0, 0); // 5:00 PM IST = 11:30 UTC
    } else if (timeOrPreset instanceof Date) {
      targetDate = timeOrPreset;
    } else {
      const parsed = new Date(timeOrPreset);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    setSystemDateString(targetDate.toISOString());
    addToast('Simulation Clock Set', `Time set to ${getISTDetails(targetDate).displayDate} ${getISTDetails(targetDate).time12} (IST).`, 'info');
  }, [addToast]);

  const resetToRealTime = useCallback(() => {
    setIsSimulatedTime(false);
    localStorage.removeItem('libtrack_sim_active');
    const realNow = new Date();
    setSystemDateString(realNow.toISOString());
    addToast('Clock Reset', 'Reset to real live wall clock (IST).', 'success');
  }, [addToast]);

  // ================= STUDENT ACTIONS ================= //

  /**
   * CHANGE 1, 2, 3:
   * Session-wise Book Request System + FIFO Allocation + Automatic Grant
   */
  const requestBook = useCallback((bookId: string, student?: User | null) => {
    const s = student || (currentUser?.role === 'student' ? currentUser : defaultStudent);
    const targetBook = books.find(b => b.id === bookId || b.bookId === bookId);
    if (!targetBook) {
      return { success: false, message: 'Book not found in library registry.' };
    }

    // STEP 1: Check whether the current time is inside an active session
    const currentSession = getLibrarySessionInfo(systemDate);
    if (!currentSession.isActive || currentSession.session === 'Closed') {
      const reason = currentSession.rejectionReason || 'Library request session is currently closed.';
      addToast('Request Not Accepted', reason, 'warning');
      return {
        success: false,
        message: reason,
      };
    }

    const activeSessionName = currentSession.session; // 'Morning' | 'Afternoon'
    const todayIST = getISTDetails(systemDate).dateStr;

    // Check duplicate request in this active session
    const existingReq = requests.find(
      r => r.studentId === s.studentId &&
           r.bookId === targetBook.bookId &&
           r.sessionDate === todayIST &&
           r.session === activeSessionName &&
           ['Requested', 'Pending', 'Granted', 'Approved'].includes(r.status)
    );
    if (existingReq) {
      return {
        success: false,
        message: `You already have an active request (${existingReq.status}) for "${targetBook.title}" in this ${activeSessionName} session.`,
      };
    }

    // STEP 2 & 3: Check FIFO position and available copies in this active session
    // Find all requests for this book in this session today
    const sessionRequestsForBook = requests.filter(
      r => r.bookId === targetBook.bookId &&
           r.sessionDate === todayIST &&
           r.session === activeSessionName &&
           ['Requested', 'Pending', 'Granted', 'Approved', 'Taken', 'Issued'].includes(r.status)
    );

    // Number of uncollected grants currently holding shelf copies in this session
    // (Once a book is Taken, targetBook.availableCopies is already decremented in the catalog)
    const currentlyAllocatedCount = sessionRequestsForBook.filter(
      r => r.status === 'Granted' || r.status === 'Approved'
    ).length;

    // Effective copies available for new grants
    const remainingGrantableCopies = targetBook.availableCopies - currentlyAllocatedCount;
    const fifoPosition = sessionRequestsForBook.length + 1;

    // STEP 4: If student is eligible and copy is available -> GRANTED! Otherwise -> WAITLISTED
    const isGranted = remainingGrantableCopies > 0;
    const status: RequestStatus = isGranted ? 'Granted' : 'Waitlisted';

    const nextNumber = requests.length + 128;
    const requestId = `REQ-2026-${String(nextNumber).padStart(5, '0')}`;
    const pickupDeadline = currentSession.closesAtText; // 12:30 PM or 4:30 PM

    const newRequest: BookRequest = {
      id: `req-${Date.now()}`,
      requestId,
      studentId: s.studentId || '',
      studentRollNo: s.studentId || '',
      studentName: s.name,
      studentEmail: s.email,
      department: s.department || 'CSE',
      studentDept: s.department || 'CSE',
      bookId: targetBook.bookId,
      bookTitle: targetBook.title,
      bookAuthor: targetBook.author,
      coverImage: targetBook.coverImage,
      session: activeSessionName,
      sessionDate: todayIST,
      requestCreatedAt: systemDate.toISOString(),
      requestDate: systemDate.toISOString(),
      fifoPosition,
      status,
      grantedAt: isGranted ? systemDate.toISOString() : undefined,
      pickupDeadline: isGranted ? pickupDeadline : undefined,
    };

    setRequests(prev => [newRequest, ...prev]);

    // Student notification
    if (isGranted) {
      const studentNotif: AppNotification = {
        id: `notif-stu-${Date.now()}`,
        notificationId: `NOTIF-${Date.now().toString().slice(-4)}`,
        userId: s.studentId || '',
        studentId: s.studentId,
        title: 'Book Request Granted!',
        message: `Your request for "${targetBook.title}" (Request ID: ${requestId}) has been GRANTED for the ${activeSessionName} Session (FIFO Position #${fifoPosition}). Please collect your book at the circulation desk before ${pickupDeadline}.`,
        type: 'SUCCESS',
        priority: 'HIGH',
        read: false,
        status: 'unread',
        link: '/student/requests',
        bookId: targetBook.bookId,
        createdAt: systemDate.toISOString(),
      };
      setNotifications(prev => [studentNotif, ...prev]);

      addAuditLog(
        { name: 'SYSTEM AUTOMATION', role: 'admin' },
        'FIFO Automatic Grant',
        requestId,
        `System automatically granted "${targetBook.title}" (${targetBook.bookId}) to ${s.name} (Roll No: ${s.studentId}) for ${activeSessionName} session. FIFO Position #${fifoPosition}. Pickup deadline: ${pickupDeadline}.`,
        'FIFO_GRANT'
      );

      addToast(
        'Request Granted Automatically!',
        `Your request for "${targetBook.title}" is GRANTED (FIFO #${fifoPosition}). Collect at library before ${pickupDeadline}.`,
        'success'
      );
    } else {
      const studentNotif: AppNotification = {
        id: `notif-stu-${Date.now()}`,
        notificationId: `NOTIF-${Date.now().toString().slice(-4)}`,
        userId: s.studentId || '',
        studentId: s.studentId,
        title: 'Book Request Waitlisted',
        message: `All available copies of "${targetBook.title}" have already been allocated in this ${activeSessionName} session. You are waitlisted at FIFO Position #${fifoPosition}.`,
        type: 'INFO',
        priority: 'NORMAL',
        read: false,
        status: 'unread',
        link: '/student/requests',
        bookId: targetBook.bookId,
        createdAt: systemDate.toISOString(),
      };
      setNotifications(prev => [studentNotif, ...prev]);

      addAuditLog(
        { name: 'SYSTEM AUTOMATION', role: 'admin' },
        'FIFO Waitlisted',
        requestId,
        `Student ${s.name} (Roll No: ${s.studentId}) placed on FIFO waitlist at position #${fifoPosition} for "${targetBook.title}".`,
        'FIFO_WAITLIST'
      );

      addToast(
        'Request Waitlisted (FIFO)',
        `Copies currently allocated. You are waitlisted at position #${fifoPosition} for this session.`,
        'info'
      );
    }

    return {
      success: true,
      message: isGranted
        ? `Your book request has been granted! Collect before ${pickupDeadline}.`
        : `Request waitlisted at FIFO position #${fifoPosition}.`,
      requestId,
      status,
      fifoPosition,
      pickupDeadline: isGranted ? pickupDeadline : undefined,
    };
  }, [books, requests, systemDate, currentUser, defaultStudent, addAuditLog, addToast]);

  const cancelRequest = useCallback((requestId: string, student?: User | null) => {
    const s = student || (currentUser?.role === 'student' ? currentUser : defaultStudent);
    setRequests(prev => prev.map(r => (r.requestId === requestId || r.id === requestId) ? { ...r, status: 'Cancelled' as const } : r));
    addAuditLog(s, 'Request Cancelled', requestId, `Student cancelled request ${requestId}`, 'REQUEST_CANCEL');
    addToast('Request Cancelled', 'Your request has been cancelled.', 'info');
  }, [currentUser, defaultStudent, addAuditLog, addToast]);

  const requestRenewal = useCallback((borrowingId: string, reason = 'Study continuation') => {
    const borrowing = borrowings.find(b => b.id === borrowingId);
    if (!borrowing) return { success: false, message: 'Borrowing transaction not found.' };

    if (borrowing.renewalCount >= borrowing.maxRenewals) {
      return { success: false, message: `Maximum renewal limit (${borrowing.maxRenewals}) reached for this issue.` };
    }

    // Check if book has a waiting list or immediate return notice
    if (borrowing.immediateReturnRequested) {
      return { success: false, message: 'Renewal unavailable: An immediate return has been requested by the librarian for this book.' };
    }

    const hasWaitlist = waitlists.some(w => w.bookId === borrowing.bookId && w.status === 'waiting');
    if (hasWaitlist) {
      return { success: false, message: 'Cannot renew: Other students are currently waiting on the reservation queue for this title.' };
    }

    setBorrowings(prev => prev.map(b => b.id === borrowingId ? { ...b, renewalStatus: 'pending' } : b));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        userId: 'librarian',
        title: 'Renewal Request Pending',
        message: `${borrowing.studentName} requested renewal for "${borrowing.bookTitle}" (Reason: ${reason}).`,
        type: 'INFO',
        read: false,
        link: '/librarian/borrowings',
        createdAt: systemDate.toISOString(),
      },
      ...prev,
    ]);

    addToast('Renewal Requested', 'Librarian will review your extension request shortly.', 'info');
    return { success: true, message: 'Renewal request submitted to librarian.' };
  }, [borrowings, waitlists, systemDate, addToast]);

  const joinWaitlist = useCallback((bookId: string, student?: User | null) => {
    const s = student || (currentUser?.role === 'student' ? currentUser : defaultStudent);
    const book = books.find(b => b.id === bookId || b.bookId === bookId);
    if (!book) return { success: false, message: 'Book not found.' };

    const existing = waitlists.find(w => w.bookId === book.bookId && w.studentId === s.studentId && w.status === 'waiting');
    if (existing) {
      return { success: false, message: `You are already on the waitlist at position #${existing.position}.` };
    }

    const currentCount = waitlists.filter(w => w.bookId === book.bookId && w.status === 'waiting').length;
    const newEntry: WaitlistEntry = {
      id: `wl-${Date.now()}`,
      bookId: book.bookId,
      bookTitle: book.title,
      studentId: s.studentId || '246M1A4201',
      studentName: s.name,
      studentEmail: s.email,
      dateJoined: systemDate.toISOString(),
      position: currentCount + 1,
      status: 'waiting',
    };

    setWaitlists(prev => [...prev, newEntry]);
    addAuditLog(s, 'Joined Waitlist', book.bookId, `Student joined waitlist for "${book.title}" at position #${newEntry.position}.`, 'WAITLIST');
    addToast('Added to Waitlist', `You are at position #${newEntry.position}. We will notify you when a copy is returned.`, 'success');
    return { success: true, message: 'Joined waitlist' };
  }, [books, waitlists, systemDate, currentUser, defaultStudent, addAuditLog, addToast]);

  const payFine = useCallback((fineId: string, method: string) => {
    setFines(prev => prev.map(f => {
      if (f.id === fineId || f.fineId === fineId) {
        return {
          ...f,
          status: 'paid',
          paidAt: systemDate.toISOString(),
          paymentMethod: method,
          transactionRef: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        };
      }
      return f;
    }));

    setBorrowings(prev => prev.map(b => {
      const relatedFine = fines.find(f => (f.id === fineId || f.fineId === fineId) && f.borrowingId === b.id);
      if (relatedFine) {
        return { ...b, finePaid: true, fineAmount: 0 };
      }
      return b;
    }));

    addToast('Payment Successful', `Fine payment processed successfully.`, 'success');
  }, [fines, systemDate, addToast]);

  const submitComplaint = useCallback((
    categoryOrPayload: ComplaintCategory | { category: ComplaintCategory; subject: string; description: string; studentId?: string; studentName?: string; student?: User },
    subject?: string,
    description?: string,
    student?: User | null
  ) => {
    let cat: ComplaintCategory = 'Other';
    let subj = '';
    let desc = '';
    let s: User = currentUser?.role === 'student' ? currentUser : defaultStudent;

    if (typeof categoryOrPayload === 'object' && categoryOrPayload !== null) {
      cat = categoryOrPayload.category;
      subj = categoryOrPayload.subject || '';
      desc = categoryOrPayload.description || '';
      if (categoryOrPayload.student) {
        s = categoryOrPayload.student;
      }
      if (categoryOrPayload.studentId && !s.studentId) {
        s = { ...s, studentId: categoryOrPayload.studentId, name: categoryOrPayload.studentName || s.name };
      }
    } else {
      cat = categoryOrPayload as ComplaintCategory;
      subj = subject || '';
      desc = description || '';
      if (student) s = student;
    }

    const count = complaints.length + 20;
    const ticketId = `TKT-2026-${String(count).padStart(3, '0')}`;
    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}`,
      ticketId,
      studentId: s.studentId || '246M1A4201',
      studentName: s.name,
      studentEmail: s.email,
      category: cat,
      subject: subj,
      description: desc,
      status: 'Open',
      createdAt: systemDate.toISOString(),
      updatedAt: systemDate.toISOString(),
    };

    setComplaints(prev => [newComplaint, ...prev]);
    addToast('Ticket Created', `Your support query ${ticketId} has been logged.`, 'success');
  }, [complaints.length, currentUser, defaultStudent, systemDate, addToast]);

  const reportLostOrDamaged = useCallback((
    bookId: string,
    issueType: 'Lost' | 'Damaged',
    description: string,
    student?: User | null,
    imageUrl?: string
  ) => {
    const s = student || (currentUser?.role === 'student' ? currentUser : defaultStudent);
    const book = books.find(b => b.id === bookId || b.bookId === bookId);
    const count = lostDamagedReports.length + 5;
    const reportId = `LDR-2026-${String(count).padStart(3, '0')}`;
    const newReport: LostDamagedReport = {
      id: `ldr-${Date.now()}`,
      reportId,
      studentId: s.studentId || '246M1A4201',
      studentName: s.name,
      bookId: book ? book.bookId : bookId,
      bookTitle: book ? book.title : 'Library Book',
      issueType,
      description,
      imageUrl,
      status: 'Review',
      createdAt: systemDate.toISOString(),
      updatedAt: systemDate.toISOString(),
    };

    setLostDamagedReports(prev => [newReport, ...prev]);
    addToast('Report Submitted', `Your report ${reportId} is under review by library administration.`, 'info');
  }, [books, lostDamagedReports.length, currentUser, defaultStudent, systemDate, addToast]);

  const markNotificationAsRead = useCallback((notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true, status: 'read' as const } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback((userId: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.userId === userId || n.studentId === userId || (userId === 'librarian' && n.userId === 'librarian')) {
        return { ...n, read: true, status: 'read' as const };
      }
      return n;
    }));
  }, []);

  // ================= LIBRARIAN ACTIONS ================= //

  /**
   * CHANGE 3: "MARK AS TAKEN"
   * The librarian enters the student's ROLL NUMBER, reviews currently GRANTED requests,
   * and clicks [ MARK AS TAKEN ].
   *
   * Verifies that the request has not expired (e.g. morning grant cannot be issued in the afternoon!).
   */
  const markRequestAsTaken = useCallback((
    requestId: string,
    loanDurationOverride?: number,
    librarian?: User | null
  ) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const req = requests.find(r => r.requestId === requestId || r.id === requestId);
    if (!req) {
      return { success: false, message: 'Request record not found in system.' };
    }

    if (req.status !== 'Granted' && req.status !== 'Approved') {
      return {
        success: false,
        message: `Cannot issue: Request is currently in status "${req.status}". Only GRANTED requests in the active session can be marked as TAKEN.`,
      };
    }

    // Critical Session Verification:
    // If request belongs to Morning session and current time is past 12:30 PM (or afternoon),
    // it MUST NOT be allowed to be marked as taken!
    if (checkRequestExpired(req, systemDate)) {
      // Mark as expired immediately
      setRequests(prev => prev.map(r => (r.id === req.id || r.requestId === req.requestId) ? { ...r, status: 'Expired', expiredAt: systemDate.toISOString() } : r));
      return {
        success: false,
        message: `This request was granted for the ${req.session || 'Morning'} session and has expired. The student must submit a new request during an active session.`,
      };
    }

    const targetBook = books.find(b => b.bookId === req.bookId || b.id === req.bookId);
    if (!targetBook) {
      return { success: false, message: 'Book record not found in catalog.' };
    }

    if (targetBook.availableCopies <= 0) {
      return { success: false, message: 'Cannot issue: Zero physical copies currently available on shelf.' };
    }

    // 1. Change request status from GRANTED -> TAKEN
    setRequests(prev => prev.map(r => {
      if (r.requestId === req.requestId || r.id === req.id) {
        return {
          ...r,
          status: 'Taken',
          takenAt: systemDate.toISOString(),
          issuedAt: systemDate.toISOString(),
        };
      }
      return r;
    }));

    // 2. Reduce available copies by 1, increase issued copies by 1
    setBooks(prev => prev.map(b => {
      if (b.bookId === targetBook.bookId) {
        const newAvailable = Math.max(0, b.availableCopies - 1);
        const newIssued = b.issuedCopies + 1;
        let newStatus: Book['status'] = b.status;
        if (newAvailable === 0) newStatus = 'out_of_stock';
        else if (newAvailable <= settings.lowStockThreshold) newStatus = 'low_stock';
        else newStatus = 'available';

        return {
          ...b,
          availableCopies: newAvailable,
          issuedCopies: newIssued,
          status: newStatus,
          updatedAt: systemDate.toISOString(),
        };
      }
      return b;
    }));

    // 3. Calculate due date using configured or overridden loan duration (CHANGE 4)
    const durationDays = loanDurationOverride || targetBook.loanDurationDays || targetBook.loanPeriod || settings.loanPeriodDays || 14;
    const dueDate = new Date(systemDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const txnNumber = Math.floor(1000 + Math.random() * 9000);
    const transactionId = `TXN-2026-${txnNumber}`;

    const newBorrowing: Borrowing = {
      id: `brw-${Date.now()}`,
      transactionId,
      studentId: req.studentId,
      studentName: req.studentName,
      studentEmail: req.studentEmail,
      studentDept: req.department || req.studentDept,
      bookId: targetBook.bookId,
      bookTitle: targetBook.title,
      bookAuthor: targetBook.author,
      coverImage: targetBook.coverImage,
      requestId: req.requestId,
      issueDate: systemDate.toISOString(),
      dueDate: dueDate.toISOString(),
      loanDurationDays: durationDays, // Stored explicitly per transaction
      status: 'active',
      renewalCount: 0,
      maxRenewals: settings.maxRenewals || 2,
      fineAmount: 0,
      issuedBy: l?.name || 'Chief Librarian',
    };

    setBorrowings(prev => [newBorrowing, ...prev]);

    // 4. Notify student
    const studentNotif: AppNotification = {
      id: `notif-taken-${Date.now()}`,
      notificationId: `NOTIF-${Date.now().toString().slice(-4)}`,
      userId: req.studentId,
      studentId: req.studentId,
      title: 'Book Issued: Marked as TAKEN',
      message: `Your book "${targetBook.title}" has been issued at the counter. Due date: ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${durationDays} days loan).`,
      type: 'SUCCESS',
      priority: 'NORMAL',
      read: false,
      status: 'unread',
      link: '/student/borrowed',
      bookId: targetBook.bookId,
      createdAt: systemDate.toISOString(),
    };
    setNotifications(prev => [studentNotif, ...prev]);

    // 5. Store audit log
    addAuditLog(
      l,
      'Mark as Taken & Issued',
      transactionId,
      `Librarian ${l?.name || 'Staff'} verified student ${req.studentName} (${req.studentId}) and marked "${targetBook.title}" as TAKEN. Loan duration: ${durationDays} days. Due: ${dueDate.toLocaleDateString('en-GB')}.`,
      'BOOK_ISSUE'
    );

    addToast(
      'Book Issued Successfully',
      `Marked as TAKEN for ${req.studentName} (${req.studentId}). Due in ${durationDays} days.`,
      'success'
    );

    return {
      success: true,
      message: `Book marked as TAKEN and issued to ${req.studentName}. Due: ${dueDate.toLocaleDateString('en-GB')}.`,
      borrowing: newBorrowing,
    };
  }, [requests, books, systemDate, settings, defaultLibrarian, currentUser, addAuditLog, addToast]);

  /**
   * CHANGE 5: REQUEST IMMEDIATE RETURN
   */
  const requestImmediateReturn = useCallback((
    borrowingId: string,
    message?: string,
    librarian?: User | null
  ) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const borrowing = borrowings.find(b => b.id === borrowingId || b.transactionId === borrowingId);
    if (!borrowing) {
      return { success: false, message: 'Borrowing record not found.' };
    }

    const defaultMsg = 'Please return this book to the library immediately because it is required by another student.';
    const finalMsg = message && message.trim() ? message.trim() : defaultMsg;

    // Update borrowing record
    setBorrowings(prev => prev.map(b => {
      if (b.id === borrowing.id) {
        return {
          ...b,
          immediateReturnRequested: true,
          immediateReturnRequestedAt: systemDate.toISOString(),
          immediateReturnMessage: finalMsg,
        };
      }
      return b;
    }));

    // Send prominent URGENT notification to student
    const urgentNotif: AppNotification = {
      id: `notif-urgent-${Date.now()}`,
      notificationId: `URG-${Date.now().toString().slice(-4)}`,
      userId: borrowing.studentId,
      studentId: borrowing.studentId,
      title: 'URGENT LIBRARY NOTICE',
      message: `The librarian has requested immediate return of "${borrowing.bookTitle}". Message: "${finalMsg}"`,
      type: 'URGENT',
      priority: 'URGENT',
      read: false,
      status: 'unread',
      link: '/student/borrowed',
      bookId: borrowing.bookId,
      librarianId: l?.id,
      createdAt: systemDate.toISOString(),
    };

    setNotifications(prev => [urgentNotif, ...prev]);

    addAuditLog(
      l,
      'Immediate Return Requested',
      borrowing.transactionId,
      `Librarian ${l?.name || 'Staff'} issued URGENT immediate return notice to ${borrowing.studentName} (${borrowing.studentId}) for "${borrowing.bookTitle}". Reason: ${finalMsg}`,
      'IMMEDIATE_RETURN'
    );

    addToast(
      'Urgent Return Notice Dispatched',
      `Immediate return notice sent to ${borrowing.studentName} (${borrowing.studentId}).`,
      'warning'
    );

    return { success: true, message: 'Immediate return notice sent successfully.' };
  }, [borrowings, systemDate, defaultLibrarian, currentUser, addAuditLog, addToast]);

  /**
   * CHANGE 4: Update Book Loan Duration (Stored at book level)
   */
  const updateBookLoanDuration = useCallback((
    bookId: string,
    newDurationDays: number,
    librarian?: User | null
  ) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const targetBook = books.find(b => b.id === bookId || b.bookId === bookId);
    if (!targetBook) return;

    const oldDuration = targetBook.loanDurationDays || 14;

    setBooks(prev => prev.map(b => {
      if (b.id === targetBook.id || b.bookId === targetBook.bookId) {
        return {
          ...b,
          loanDurationDays: newDurationDays,
          loanPeriod: newDurationDays,
          updatedAt: systemDate.toISOString(),
        };
      }
      return b;
    }));

    addAuditLog(
      l,
      'Loan Duration Updated',
      targetBook.bookId,
      `Librarian changed default loan duration of "${targetBook.title}" from ${oldDuration} days to ${newDurationDays} days. Note: Old borrowing records preserve their original due dates.`,
      'CATALOG_UPDATE'
    );

    addToast(
      'Loan Duration Updated',
      `"${targetBook.title}" loan period set to ${newDurationDays} days.`,
      'success'
    );
  }, [books, systemDate, defaultLibrarian, currentUser, addAuditLog, addToast]);

  /**
   * CHANGE 7: AUTOMATIC ACADEMIC YEAR PROMOTION (June 1 -> May 31)
   */
  const promoteAcademicYear = useCallback((dryRun = false) => {
    const currentAy = settings.currentAcademicYear || getAcademicYear(systemDate);
    const [startYearStr, endYearStr] = currentAy.split('-');
    const nextStartYear = parseInt(endYearStr || '2027', 10);
    const newAcademicYear = `${nextStartYear}-${nextStartYear + 1}`;

    const studentUsers = allAuthUsers.filter(u => u.role === 'student');
    let promotedCount = 0;
    let graduatedCount = 0;
    const details: string[] = [];

    const updatedStudents = studentUsers.map(student => {
      const promo = calculateStudentPromotion(student);
      const prevYearStr = student.year || `${student.yearOfStudy || 1}th Year`;

      if (promo.graduated && promo.promoted) {
        graduatedCount++;
        details.push(`${student.name} (${student.studentId}): ${prevYearStr} -> GRADUATED/ALUMNI (Cycle Completed)`);
      } else if (promo.promoted) {
        promotedCount++;
        details.push(`${student.name} (${student.studentId}): ${prevYearStr} -> ${promo.updatedYearString}`);
      }

      if (dryRun) return student;

      // Update student record
      const updatedUser: User = {
        ...student,
        yearOfStudy: promo.updatedYearOfStudy,
        year: promo.updatedYearString,
        academicYear: newAcademicYear,
        status: promo.updatedStatus,
        promotionDate: systemDate.toISOString(),
      };

      // Add audit log for each promoted student
      addAuditLog(
        { name: 'SYSTEM AUTOMATION', role: 'admin' },
        'Automatic Academic Promotion',
        student.studentId,
        `Student ${student.name} (${student.studentId}) promoted from ${prevYearStr} (${currentAy}) to ${promo.updatedYearString} (${newAcademicYear}). Action Type: SYSTEM AUTOMATION.`,
        'ACADEMIC_PROMOTION'
      );

      // Student notification
      const promoNotif: AppNotification = {
        id: `notif-promo-${Date.now()}-${student.id}`,
        notificationId: `PROMO-${Date.now().toString().slice(-4)}`,
        userId: student.studentId || student.id,
        studentId: student.studentId,
        title: promo.graduated ? 'Graduation Milestone' : 'Academic Year Promotion!',
        message: promo.graduated
          ? `Congratulations on completing your graduation! Your BVC library profile has transitioned to Alumni / Graduated standing. Historical borrowing records are retained.`
          : `You have been automatically promoted to ${promo.updatedYearString} for Academic Year ${newAcademicYear}.`,
        type: 'SUCCESS',
        priority: 'HIGH',
        read: false,
        status: 'unread',
        createdAt: systemDate.toISOString(),
      };
      setNotifications(prev => [promoNotif, ...prev]);

      return updatedUser;
    });

    if (!dryRun) {
      if (updateAllUsers) {
        updateAllUsers(prev => prev.map(u => {
          const match = updatedStudents.find(s => s.id === u.id);
          return match || u;
        }));
      }

      setSettings(prev => ({
        ...prev,
        currentAcademicYear: newAcademicYear,
      }));

      addToast(
        'Academic Year Advanced',
        `Promoted ${promotedCount} active students. ${graduatedCount} graduated. Current academic year: ${newAcademicYear}.`,
        'success'
      );
    }

    return {
      success: true,
      promotedCount,
      graduatedCount,
      newAcademicYear,
      details,
    };
  }, [allAuthUsers, settings.currentAcademicYear, systemDate, updateAllUsers, addAuditLog, addToast]);

  // FIFO batch testing helper
  const simulateFIFORequests = useCallback((bookId: string) => {
    const book = books.find(b => b.bookId === bookId || b.id === bookId);
    if (!book) return;

    const testStudents = [
      { name: 'Student 1', roll: '246M1A0001', dept: 'CSE' },
      { name: 'Student 2', roll: '246M1A0002', dept: 'CSE' },
      { name: 'Student 3', roll: '246M1A0003', dept: 'AIML' },
      { name: 'Student 4', roll: '246M1A0004', dept: 'ECE' },
      { name: 'Student 5', roll: '246M1A0005', dept: 'EEE' },
    ];

    const currentSession = getLibrarySessionInfo(systemDate);
    const activeSessionName = currentSession.session === 'Closed' ? 'Morning' : currentSession.session;
    const todayIST = getISTDetails(systemDate).dateStr;

    let granted = 0;
    let waitlisted = 0;

    const newReqs: BookRequest[] = [];

    testStudents.forEach((st, idx) => {
      const position = idx + 1;
      const isGrant = position <= book.availableCopies;
      if (isGrant) granted++;
      else waitlisted++;

      newReqs.push({
        id: `req-sim-${Date.now()}-${idx}`,
        requestId: `REQ-2026-SIM${String(idx + 1).padStart(3, '0')}`,
        studentId: st.roll,
        studentRollNo: st.roll,
        studentName: st.name,
        studentEmail: `${st.roll.toLowerCase()}@bvc.edu.in`,
        department: st.dept,
        studentDept: st.dept,
        bookId: book.bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        coverImage: book.coverImage,
        session: activeSessionName,
        sessionDate: todayIST,
        requestCreatedAt: new Date(systemDate.getTime() + idx * 60000).toISOString(),
        requestDate: systemDate.toISOString(),
        fifoPosition: position,
        status: isGrant ? 'Granted' : 'Waitlisted',
        grantedAt: isGrant ? systemDate.toISOString() : undefined,
        pickupDeadline: activeSessionName === 'Morning' ? '12:30 PM' : '4:30 PM',
      });
    });

    setRequests(prev => [...newReqs, ...prev]);
    addToast(
      'FIFO Simulation Generated',
      `Created 5 test requests for "${book.title}". ${granted} GRANTED, ${waitlisted} WAITLISTED.`,
      'success'
    );
  }, [books, systemDate, addToast]);

  // Backward compatibility / legacy helpers
  const approveRequest = useCallback((requestId: string, librarian?: User | null) => {
    return markRequestAsTaken(requestId, undefined, librarian);
  }, [markRequestAsTaken]);

  const rejectRequest = useCallback((requestId: string, reason?: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const req = requests.find(r => r.requestId === requestId || r.id === requestId);
    if (!req) return;

    const rejectionReason = reason || 'Not available for issue at this time.';

    setRequests(prev => prev.map(r => {
      if (r.requestId === req.requestId || r.id === req.id) {
        return {
          ...r,
          status: 'Declined' as const,
          rejectedAt: systemDate.toISOString(),
          rejectionReason,
        };
      }
      return r;
    }));

    addAuditLog(
      l,
      'Request Declined',
      req.requestId,
      `Declined request ${req.requestId} for student ${req.studentName} (${req.studentId}). Reason: ${rejectionReason}`,
      'REQUEST_DECLINE'
    );

    addToast('Request Declined', `Request ${req.requestId} marked as declined.`, 'info');
  }, [requests, systemDate, defaultLibrarian, currentUser, addAuditLog, addToast]);

  const confirmIssueBook = useCallback((requestId: string, librarian?: User | null) => {
    return markRequestAsTaken(requestId, undefined, librarian);
  }, [markRequestAsTaken]);

  const issueBookDirect = useCallback((bookId: string, studentRollNo: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const targetBook = books.find(b => b.bookId === bookId || b.id === bookId);
    if (!targetBook || targetBook.availableCopies <= 0) {
      return { success: false, message: 'Cannot issue: Zero available copies in stock.' };
    }

    setBooks(prev => prev.map(b => {
      if (b.bookId === targetBook.bookId) {
        const newAvailable = Math.max(0, b.availableCopies - 1);
        const newIssued = b.issuedCopies + 1;
        let newStatus: Book['status'] = b.status;
        if (newAvailable === 0) newStatus = 'out_of_stock';
        else if (newAvailable <= settings.lowStockThreshold) newStatus = 'low_stock';
        else newStatus = 'available';

        return {
          ...b,
          availableCopies: newAvailable,
          issuedCopies: newIssued,
          status: newStatus,
          updatedAt: systemDate.toISOString(),
        };
      }
      return b;
    }));

    const durationDays = targetBook.loanDurationDays || targetBook.loanPeriod || settings.loanPeriodDays || 14;
    const dueDate = new Date(systemDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const txnNumber = Math.floor(1000 + Math.random() * 9000);
    const transactionId = `TXN-2026-${txnNumber}`;

    const newBorrowing: Borrowing = {
      id: `brw-${Date.now()}`,
      transactionId,
      studentId: studentRollNo,
      studentName: studentRollNo,
      studentEmail: `${studentRollNo.toLowerCase()}@bvce.ac.in`,
      studentDept: targetBook.department || 'Engineering',
      bookId: targetBook.bookId,
      bookTitle: targetBook.title,
      bookAuthor: targetBook.author,
      coverImage: targetBook.coverImage,
      issueDate: systemDate.toISOString(),
      dueDate: dueDate.toISOString(),
      loanDurationDays: durationDays,
      status: 'active',
      renewalCount: 0,
      maxRenewals: settings.maxRenewals || 2,
      fineAmount: 0,
      issuedBy: l?.name || 'Chief Librarian',
    };

    setBorrowings(prev => [newBorrowing, ...prev]);

    addAuditLog(
      l,
      'Direct Book Issue',
      transactionId,
      `Issued "${targetBook.title}" (${targetBook.bookId}) directly to Roll No ${studentRollNo}. Loan duration: ${durationDays} days. Due: ${dueDate.toLocaleDateString('en-GB')}.`,
      'BOOK_ISSUE'
    );

    addToast('Book Issued Successfully', `Issued to Roll No ${studentRollNo}. Due in ${durationDays} days.`, 'success');
    return { success: true, message: 'Book issued successfully', borrowing: newBorrowing };
  }, [books, systemDate, settings, defaultLibrarian, currentUser, addAuditLog, addToast]);

  const returnBook = useCallback((transactionId: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const borrowing = borrowings.find(b => b.transactionId === transactionId || b.id === transactionId);
    if (!borrowing) return { success: false, message: 'Transaction record not found.' };

    const due = new Date(borrowing.dueDate);
    const returnDate = systemDate;
    const diffMs = returnDate.getTime() - due.getTime();
    const overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const fineCalculated = overdueDays * settings.finePerDay;

    // Update borrowing status
    setBorrowings(prev => prev.map(b => {
      if (b.id === borrowing.id) {
        return {
          ...b,
          status: 'returned' as const,
          returnDate: returnDate.toISOString(),
          fineAmount: fineCalculated,
        };
      }
      return b;
    }));

    // Increment book stock
    setBooks(prev => prev.map(b => {
      if (b.bookId === borrowing.bookId) {
        const newAvailable = b.availableCopies + 1;
        const newIssued = Math.max(0, b.issuedCopies - 1);
        return {
          ...b,
          availableCopies: newAvailable,
          issuedCopies: newIssued,
          status: newAvailable > settings.lowStockThreshold ? 'available' : 'low_stock',
          updatedAt: returnDate.toISOString(),
        };
      }
      return b;
    }));

    if (fineCalculated > 0) {
      setFines(prev => [
        {
          id: `fine-${borrowing.id}`,
          fineId: `FINE-2026-${borrowing.transactionId.slice(-4)}`,
          studentId: borrowing.studentId,
          studentName: borrowing.studentName,
          borrowingId: borrowing.id,
          transactionId: borrowing.transactionId,
          bookTitle: borrowing.bookTitle,
          daysOverdue: overdueDays,
          overdueDays,
          ratePerDay: settings.finePerDay,
          amount: fineCalculated,
          status: 'pending',
          dueDate: borrowing.dueDate,
          createdAt: returnDate.toISOString(),
        },
        ...prev,
      ]);
    }

    addAuditLog(
      l,
      'Book Returned',
      borrowing.transactionId,
      `Student ${borrowing.studentName} returned "${borrowing.bookTitle}". Overdue days: ${overdueDays}. Assessed fine: ₹${fineCalculated}.`,
      'BOOK_RETURN'
    );

    addToast(
      'Book Returned Successfully',
      `"${borrowing.bookTitle}" returned. ${fineCalculated > 0 ? `Late penalty ₹${fineCalculated} recorded.` : 'No pending overdue dues.'}`,
      'success'
    );

    return { success: true, message: 'Book returned successfully', fineCalculated };
  }, [borrowings, systemDate, settings, defaultLibrarian, currentUser, addAuditLog, addToast]);

  const approveRenewal = useCallback((borrowingId: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const borrowing = borrowings.find(b => b.id === borrowingId);
    if (!borrowing) return;

    const extensionDays = borrowing.loanDurationDays || 14;
    const currentDue = new Date(borrowing.dueDate);
    const newDueDate = new Date(currentDue.getTime() + extensionDays * 24 * 60 * 60 * 1000);

    setBorrowings(prev => prev.map(b => {
      if (b.id === borrowingId) {
        return {
          ...b,
          dueDate: newDueDate.toISOString(),
          renewalCount: b.renewalCount + 1,
          renewalStatus: 'none',
        };
      }
      return b;
    }));

    addAuditLog(
      l,
      'Renewal Approved',
      borrowing.transactionId,
      `Approved renewal extension (+${extensionDays} days) for "${borrowing.bookTitle}". New due date: ${newDueDate.toLocaleDateString('en-GB')}.`,
      'RENEWAL'
    );

    addToast('Renewal Approved', `Due date extended to ${newDueDate.toLocaleDateString('en-GB')}.`, 'success');
  }, [borrowings, defaultLibrarian, currentUser, addAuditLog, addToast]);

  const rejectRenewal = useCallback((borrowingId: string, reason?: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    setBorrowings(prev => prev.map(b => b.id === borrowingId ? { ...b, renewalStatus: 'rejected' } : b));
    addToast('Renewal Declined', 'Renewal request was declined.', 'info');
  }, [defaultLibrarian, currentUser, addToast]);

  const addBook = useCallback((bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const duration = bookData.loanDurationDays || bookData.loanPeriod || 14;
    const newBook: Book = {
      ...bookData,
      id: `book-${Date.now()}`,
      loanDurationDays: duration,
      loanPeriod: duration,
      createdAt: systemDate.toISOString(),
      updatedAt: systemDate.toISOString(),
    };

    setBooks(prev => [newBook, ...prev]);
    addAuditLog(l, 'Book Added', newBook.bookId, `Added new catalog title "${newBook.title}" with loan duration ${duration} days.`, 'CATALOG_ADD');
    addToast('Book Added', `"${newBook.title}" added to catalog.`, 'success');
    return newBook;
  }, [systemDate, defaultLibrarian, currentUser, addAuditLog, addToast]);

  const updateBook = useCallback((bookId: string, bookData: Partial<Book>, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    setBooks(prev => prev.map(b => {
      if (b.id === bookId || b.bookId === bookId) {
        return {
          ...b,
          ...bookData,
          updatedAt: systemDate.toISOString(),
        };
      }
      return b;
    }));
    addAuditLog(l, 'Book Updated', bookId, `Updated details for book ${bookId}.`, 'CATALOG_UPDATE');
    addToast('Book Updated', 'Book details saved successfully.', 'success');
  }, [systemDate, defaultLibrarian, currentUser, addAuditLog, addToast]);

  const deleteBook = useCallback((bookId: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const book = books.find(b => b.id === bookId || b.bookId === bookId);
    if (!book) return { success: false, message: 'Book not found' };

    if (book.issuedCopies > 0) {
      return { success: false, message: `Cannot delete: ${book.issuedCopies} copy(ies) are currently issued to students.` };
    }

    setBooks(prev => prev.filter(b => b.id !== book.id && b.bookId !== book.bookId));
    addAuditLog(l, 'Book Deleted', book.bookId, `Deleted "${book.title}" from catalog.`, 'CATALOG_DELETE');
    addToast('Book Deleted', `"${book.title}" removed from catalog.`, 'info');
    return { success: true, message: 'Book removed' };
  }, [books, defaultLibrarian, currentUser, addAuditLog, addToast]);

  const waiveFine = useCallback((fineId: string, reason?: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    setFines(prev => prev.map(f => {
      if (f.id === fineId || f.fineId === fineId) {
        return { ...f, status: 'waived' as const };
      }
      return f;
    }));
    addToast('Fine Waived', 'Overdue fine was waived.', 'info');
  }, [defaultLibrarian, currentUser, addToast]);

  const resolveComplaint = useCallback((ticketId: string, response: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    setComplaints(prev => prev.map(c => {
      if (c.ticketId === ticketId || c.id === ticketId) {
        return {
          ...c,
          status: 'Resolved',
          response,
          librarianResponse: response,
          respondedBy: l?.name || 'Chief Librarian',
          resolvedAt: systemDate.toISOString(),
          updatedAt: systemDate.toISOString(),
        };
      }
      return c;
    }));
    addToast('Ticket Resolved', 'Response recorded and student notified.', 'success');
  }, [systemDate, defaultLibrarian, currentUser, addToast]);

  const updateLostDamagedStatus = useCallback((
    reportId: string,
    status: LostDamagedReport['status'],
    fineAmount?: number,
    notes?: string,
    librarian?: User | null
  ) => {
    setLostDamagedReports(prev => prev.map(r => {
      if (r.id === reportId || r.reportId === reportId) {
        return {
          ...r,
          status,
          fineApplied: fineAmount !== undefined ? fineAmount : r.fineApplied,
          resolutionNotes: notes || r.resolutionNotes,
          updatedAt: systemDate.toISOString(),
        };
      }
      return r;
    }));
    addToast('Report Updated', 'Status saved.', 'info');
  }, [systemDate, addToast]);

  const updateSettings = useCallback((newSettings: Partial<LibrarySettings>, librarian?: User | null) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addToast('Settings Saved', 'Library configuration updated.', 'success');
  }, [addToast]);

  return (
    <LibraryContext.Provider
      value={{
        systemDate,
        isSimulatedTime,
        sessionInfo,
        setSimulatedTime,
        resetToRealTime,
        triggerExpiryCheckNow,
        books,
        requests,
        borrowings,
        notifications,
        fines,
        waitlists,
        complaints,
        lostDamagedReports,
        auditLogs,
        settings,
        users,
        toasts,
        addToast,
        removeToast,
        requestBook,
        cancelRequest,
        requestRenewal,
        joinWaitlist,
        payFine,
        submitComplaint,
        reportLostOrDamaged,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        markRequestAsTaken,
        requestImmediateReturn,
        updateBookLoanDuration,
        approveRequest,
        rejectRequest,
        confirmIssueBook,
        issueBookDirect,
        returnBook,
        approveRenewal,
        rejectRenewal,
        addBook,
        updateBook,
        deleteBook,
        waiveFine,
        resolveComplaint,
        updateLostDamagedStatus,
        updateSettings,
        promoteAcademicYear,
        simulateFIFORequests,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within a LibraryProvider');
  return context;
};
