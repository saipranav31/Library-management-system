import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface LibraryContextType {
  // Real System Date
  systemDate: Date;

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
  requestBook: (bookId: string, student?: User | null) => { success: boolean; message: string; requestId?: string };
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
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// Clean up any legacy demo data from prior runs if present
try {
  if (typeof window !== 'undefined' && localStorage.getItem('libtrack_clean_real_v2') !== 'true') {
    ['books', 'requests', 'borrowings', 'notifications', 'fines', 'waitlists', 'complaints', 'lost_damaged', 'audit_logs', 'system_date', 'users', 'auth_user'].forEach(k => {
      localStorage.removeItem(`libtrack_${k}`);
    });
    localStorage.setItem('libtrack_clean_real_v2', 'true');
  }
} catch {
  // ignore
}

// Storage helper with fallback
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`libtrack_${key}`);
    if (item) return JSON.parse(item);
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
  // Current logged in user fallback
  let currentUser: User | null = null;
  let allAuthUsers: User[] = INITIAL_USERS;
  try {
    const auth = useAuth();
    currentUser = auth?.currentUser || null;
    allAuthUsers = auth?.allUsers || INITIAL_USERS;
  } catch {
    // Auth context optional fallback
  }

  const defaultStudent: User = useMemo(() => {
    return allAuthUsers.find(u => u.role === 'student') || {
      id: 'student-default',
      name: 'Enrolled Student',
      email: 'student@bvc.edu.in',
      role: 'student',
      department: 'CSE',
      phone: '',
      profileImage: '',
      createdAt: new Date().toISOString(),
    };
  }, [allAuthUsers]);

  const defaultLibrarian: User = useMemo(() => {
    return allAuthUsers.find(u => u.role === 'librarian') || INITIAL_USERS[0];
  }, [allAuthUsers]);

  // Current real system date
  const [systemDateString, setSystemDateString] = useState<string>(() => {
    return new Date().toISOString();
  });
  const systemDate = new Date(systemDateString);

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
    description?: string
  ) => {
    const effectiveUser = user || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const actorName = effectiveUser?.name || currentUser?.name || 'Library Staff';
    const actorId = effectiveUser?.id || currentUser?.id || 'SYS-01';
    const actorRole = effectiveUser?.role || currentUser?.role || 'staff';

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: systemDate.toISOString(),
      userId: actorId,
      userName: actorName,
      userRole: actorRole,
      actor: actorName,
      action,
      entity: entity || 'SYSTEM',
      description: description || '',
      details: description || '',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [systemDate, currentUser, defaultLibrarian]);

  // Recalculate deadline statuses and fines whenever systemDate changes
  const evaluateDeadlinesAndFines = useCallback((currentSimDate: Date) => {
    setBorrowings(prevBorrowings => {
      let finesToUpsert: Fine[] = [];
      let newNotifs: AppNotification[] = [];

      const updated = prevBorrowings.map(item => {
        if (item.status === 'returned') return item;

        const due = new Date(item.dueDate);
        const diffMs = due.getTime() - currentSimDate.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let newStatus: Borrowing['status'] = item.status;
        let fineAmount = item.fineAmount;

        if (daysRemaining < 0) {
          // Overdue fine: exactly ₹2 per day after the due date
          newStatus = 'overdue';
          const overdueDays = Math.abs(daysRemaining);
          fineAmount = overdueDays * 2;

          // Check if fine already recorded
          finesToUpsert.push({
            id: `fine-${item.id}`,
            fineId: `FINE-2026-${item.transactionId.slice(-4)}`,
            studentId: item.studentId,
            studentName: item.studentName,
            borrowingId: item.id,
            bookTitle: item.bookTitle,
            daysOverdue: overdueDays,
            overdueDays: overdueDays,
            ratePerDay: 2,
            amount: fineAmount,
            status: item.finePaid ? 'paid' : 'pending',
            createdAt: currentSimDate.toISOString(),
          });
        } else if (daysRemaining <= 7) {
          // Due soon notifications check
          if (daysRemaining === 7) {
            newNotifs.push({
              id: `notif-${Date.now()}-${item.id}-7d`,
              userId: item.studentId,
              title: 'Book Due in 7 Days',
              message: `Your book "${item.bookTitle}" is due in 7 days on ${due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
              type: 'WARNING',
              read: false,
              link: '/student/borrowed',
              createdAt: currentSimDate.toISOString(),
            });
          } else if (daysRemaining === 3) {
            newNotifs.push({
              id: `notif-${Date.now()}-${item.id}-3d`,
              userId: item.studentId,
              title: 'Book Due in 3 Days',
              message: `Reminder: "${item.bookTitle}" is due in 3 days. Return or request a renewal now.`,
              type: 'WARNING',
              read: false,
              link: '/student/borrowed',
              createdAt: currentSimDate.toISOString(),
            });
          } else if (daysRemaining === 1) {
            newNotifs.push({
              id: `notif-${Date.now()}-${item.id}-1d`,
              userId: item.studentId,
              title: 'Book Due Tomorrow!',
              message: `URGENT: "${item.bookTitle}" is due tomorrow. Return to library to avoid daily fines.`,
              type: 'WARNING',
              read: false,
              link: '/student/borrowed',
              createdAt: currentSimDate.toISOString(),
            });
          } else if (daysRemaining === 0) {
            newNotifs.push({
              id: `notif-${Date.now()}-${item.id}-today`,
              userId: item.studentId,
              title: 'Book Due Today',
              message: `"${item.bookTitle}" is due today by 5:00 PM at the circulation desk.`,
              type: 'ERROR',
              read: false,
              link: '/student/borrowed',
              createdAt: currentSimDate.toISOString(),
            });
          }
        }

        return {
          ...item,
          status: newStatus,
          fineAmount,
        };
      });

      // Upsert fines
      if (finesToUpsert.length > 0) {
        setFines(prevFines => {
          const map = new Map<string, Fine>(prevFines.map(f => [f.borrowingId || f.id, f]));
          finesToUpsert.forEach(f => {
            const key = f.borrowingId || f.id;
            const existing = map.get(key);
            if (existing && existing.status === 'paid') {
              // keep as paid
            } else {
              map.set(key, f);
            }
          });
          return Array.from(map.values());
        });
      }

      if (newNotifs.length > 0) {
        setNotifications(prev => [...newNotifs, ...prev]);
      }

      return updated;
    });
  }, [settings.finePerDay, settings.maxFine]);

  // ================= STUDENT ACTIONS ================= //

  const requestBook = (bookId: string, student?: User | null) => {
    const s = student || (currentUser?.role === 'student' ? currentUser : defaultStudent);
    const targetBook = books.find(b => b.id === bookId || b.bookId === bookId);
    if (!targetBook) {
      return { success: false, message: 'Book not found in library registry.' };
    }

    if (targetBook.availableCopies <= 0) {
      return { success: false, message: 'No available copies left. Please join the waitlist instead.' };
    }

    // Check duplicate pending request
    const existingReq = requests.find(
      r => r.studentId === s.studentId && 
           r.bookId === targetBook.bookId && 
           ['Pending', 'Approved'].includes(r.status)
    );
    if (existingReq) {
      return { success: false, message: 'You already have an active or pending request for this title.' };
    }

    const nextNumber = requests.length + 101;
    const requestId = `REQ-${String(nextNumber).padStart(5, '0')}`;
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
      requestDate: systemDate.toISOString(),
      status: 'Pending',
    };

    setRequests(prev => [newRequest, ...prev]);

    // Student notification
    const studentNotif: AppNotification = {
      id: `notif-stu-${Date.now()}`,
      userId: s.studentId || '',
      title: 'Book Request Submitted',
      message: `Your request for "${targetBook.title}" has been submitted. The librarian will review it using your Roll Number.`,
      type: 'INFO',
      read: false,
      link: '/student/requests',
      createdAt: systemDate.toISOString(),
    };

    // Notify librarian
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: 'librarian',
      title: 'New Book Request',
      message: `${s.name} (Roll No: ${s.studentId}) requested "${targetBook.title}".`,
      type: 'INFO',
      read: false,
      link: '/librarian/requests',
      createdAt: systemDate.toISOString(),
    };
    setNotifications(prev => [studentNotif, notif, ...prev]);

    addAuditLog(
      s,
      'Request Submitted',
      requestId,
      `Student ${s.name} (Roll No: ${s.studentId}) submitted request for "${targetBook.title}".`
    );

    addToast('Request Submitted Successfully', `Your request for "${targetBook.title}" is now pending librarian approval.`, 'success');
    return { success: true, message: 'Request submitted successfully!', requestId };
  };

  const cancelRequest = (requestId: string, student?: User | null) => {
    const s = student || (currentUser?.role === 'student' ? currentUser : defaultStudent);
    setRequests(prev => prev.map(r => (r.requestId === requestId || r.id === requestId) ? { ...r, status: 'Cancelled' as const } : r));
    addAuditLog(s, 'Request Cancelled', requestId, `Student cancelled request ${requestId}`);
    addToast('Request Cancelled', 'Your request has been cancelled.', 'info');
  };

  const requestRenewal = (borrowingId: string, reason = 'Study continuation') => {
    const borrowing = borrowings.find(b => b.id === borrowingId);
    if (!borrowing) return { success: false, message: 'Borrowing transaction not found.' };

    if (borrowing.renewalCount >= borrowing.maxRenewals) {
      return { success: false, message: `Maximum renewal limit (${borrowing.maxRenewals}) reached for this issue.` };
    }

    // Check if book has a waiting list
    const hasWaitlist = waitlists.some(w => w.bookId === borrowing.bookId && w.status === 'waiting');
    if (hasWaitlist) {
      return { success: false, message: 'Cannot renew: Other students are currently waiting on the reservation queue for this title.' };
    }

    setBorrowings(prev => prev.map(b => b.id === borrowingId ? { ...b, renewalStatus: 'pending' } : b));

    // Notify librarian
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
  };

  const joinWaitlist = (bookId: string, student?: User | null) => {
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
      studentId: s.studentId || '246M1A0582',
      studentName: s.name,
      studentEmail: s.email,
      dateJoined: systemDate.toISOString(),
      position: currentCount + 1,
      status: 'waiting',
    };

    setWaitlists(prev => [...prev, newEntry]);
    addAuditLog(s, 'Joined Waitlist', book.bookId, `Student joined waitlist for "${book.title}" at position #${newEntry.position}.`);
    addToast('Added to Waitlist', `You are at position #${newEntry.position}. We will notify you immediately when a copy is returned.`, 'success');
    return { success: true, message: 'Joined waitlist' };
  };

  const payFine = (fineId: string, method: string) => {
    setFines(prev => prev.map(f => {
      if (f.id === fineId || f.fineId === fineId) {
        return {
          ...f,
          status: 'paid',
          paidAt: systemDate.toISOString(),
          paymentMethod: method,
          transactionRef: `UPI-REC-${Math.floor(100000 + Math.random() * 900000)}`,
        };
      }
      return f;
    }));

    // Clear borrowing fine
    setBorrowings(prev => prev.map(b => {
      const relatedFine = fines.find(f => (f.id === fineId || f.fineId === fineId) && f.borrowingId === b.id);
      if (relatedFine) {
        return { ...b, finePaid: true, fineAmount: 0 };
      }
      return b;
    }));

    addToast('Payment Successful', `Fine payment via ${method} processed successfully. Receipt generated.`, 'success');
  };

  const submitComplaint = (
    categoryOrPayload: ComplaintCategory | { category: ComplaintCategory; subject: string; description: string; studentId?: string; studentName?: string; student?: User },
    subject?: string,
    description?: string,
    student?: User | null
  ) => {
    let cat: ComplaintCategory = 'Other';
    let subj: string = '';
    let desc: string = '';
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
      if (student) {
        s = student;
      }
    }

    const count = complaints.length + 20;
    const ticketId = `TKT-2026-${String(count).padStart(3, '0')}`;
    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}`,
      ticketId,
      studentId: s.studentId || '246M1A0582',
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
    addToast('Ticket Created', `Your support query ${ticketId} has been logged. The library staff will respond soon.`, 'success');
  };

  const reportLostOrDamaged = (
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
      studentId: s.studentId || '246M1A0582',
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

    // Notify librarian
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        userId: 'librarian',
        title: `Book ${issueType} Reported`,
        message: `${s.name} submitted ${issueType.toLowerCase()} report ${reportId} for "${newReport.bookTitle}".`,
        type: 'ERROR',
        read: false,
        link: '/librarian/lost-damaged',
        createdAt: systemDate.toISOString(),
      },
      ...prev,
    ]);

    addToast('Report Submitted', `Your report ${reportId} is under review by library administration.`, 'info');
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = (userId: string) => {
    setNotifications(prev => prev.map(n => {
      if (n.userId === userId || (userId === 'librarian' && n.userId === 'librarian')) {
        return { ...n, read: true };
      }
      return n;
    }));
  };

  // ================= LIBRARIAN ACTIONS ================= //

  const approveRequest = (requestId: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const req = requests.find(r => r.requestId === requestId || r.id === requestId);
    if (!req) return { success: false, message: 'Request not found' };

    setRequests(prev => prev.map(r => {
      if (r.requestId === req.requestId || r.id === req.id) {
        return {
          ...r,
          status: 'Approved',
          approvedAt: systemDate.toISOString(),
        };
      }
      return r;
    }));

    // Send student notification
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        userId: req.studentId,
        title: 'Book Request Approved',
        message: `Your request for "${req.bookTitle}" has been approved! Visit the BVC Library circulation desk and quote your Roll Number (${req.studentId}) to collect your book.`,
        type: 'SUCCESS',
        read: false,
        link: '/student/requests',
        createdAt: systemDate.toISOString(),
      },
      ...prev,
    ]);

    addAuditLog(
      l,
      'Request Approved',
      req.requestId,
      `Librarian ${l?.name || 'Staff'} approved request ${req.requestId} for student ${req.studentName} (Roll No: ${req.studentId}). Ready for issuance.`
    );

    addToast('Request Approved', `Request approved for ${req.studentName} (${req.studentId}). You can now issue the book.`, 'success');
    return { success: true };
  };

  const rejectRequest = (requestId: string, reason?: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const req = requests.find(r => r.requestId === requestId || r.id === requestId);
    if (!req) return;

    const rejectionReason = reason || 'Not available for issue at this time.';

    setRequests(prev => prev.map(r => {
      if (r.requestId === req.requestId || r.id === req.id) {
        return {
          ...r,
          status: 'Rejected',
          rejectedAt: systemDate.toISOString(),
          rejectionReason,
        };
      }
      return r;
    }));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        userId: req.studentId,
        title: 'Book Request Rejected',
        message: `Your request for "${req.bookTitle}" could not be approved. Reason: ${rejectionReason}`,
        type: 'ERROR',
        read: false,
        link: '/student/requests',
        createdAt: systemDate.toISOString(),
      },
      ...prev,
    ]);

    addAuditLog(
      l,
      'Request Rejected',
      req.requestId,
      `Rejected request ${req.requestId} for student ${req.studentName} (Roll No: ${req.studentId}). Reason: ${rejectionReason}`
    );

    addToast('Request Rejected', `Request ${req.requestId} marked as rejected.`, 'info');
  };

  const issueBookDirect = (bookId: string, studentRollNo: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const targetBook = books.find(b => b.bookId === bookId || b.id === bookId);
    if (!targetBook || targetBook.availableCopies <= 0) {
      return { success: false, message: 'Cannot issue: Zero available copies in stock.' };
    }

    // Decrement book stock
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

    // Create borrowing
    const loanDays = targetBook.loanPeriod || settings.loanPeriodDays || 15;
    const dueDate = new Date(systemDate.getTime() + loanDays * 24 * 60 * 60 * 1000);
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
      status: 'active',
      renewalCount: 0,
      maxRenewals: settings.maxRenewals || 2,
      fineAmount: 0,
    };

    setBorrowings(prev => [newBorrowing, ...prev]);

    // Student notification
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        userId: studentRollNo,
        title: 'Book Issued Successfully',
        message: `"${targetBook.title}" has been issued to you. Due date: ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
        type: 'SUCCESS',
        read: false,
        link: '/student/borrowed',
        createdAt: systemDate.toISOString(),
      },
      ...prev,
    ]);

    addAuditLog(
      l,
      'Book Issued',
      transactionId,
      `Issued "${targetBook.title}" (${targetBook.bookId}) to Roll No ${studentRollNo}. Due: ${dueDate.toLocaleDateString('en-GB')}.`
    );

    addToast('Book Issued Successfully', `Issued to Roll No ${studentRollNo}. Due in ${loanDays} days.`, 'success');
    return { success: true, message: 'Book issued successfully', borrowing: newBorrowing };
  };

  const confirmIssueBook = (requestId: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const req = requests.find(r => r.requestId === requestId || r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    const targetBook = books.find(b => b.bookId === req.bookId || b.id === req.bookId);
    if (!targetBook || targetBook.availableCopies <= 0) {
      return { success: false, message: 'Cannot issue: Zero available copies in stock.' };
    }

    // 1. Mark request as Issued
    setRequests(prev => prev.map(r => {
      if (r.requestId === req.requestId || r.id === req.id) {
        return {
          ...r,
          status: 'Issued',
          issuedAt: systemDate.toISOString(),
        };
      }
      return r;
    }));

    // 2. Decrement book available copies & increment issued count
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

    // 3. Create Borrowing Transaction with loan period (default 15 days)
    const loanDays = targetBook.loanPeriod || settings.loanPeriodDays || 15;
    const dueDate = new Date(systemDate.getTime() + loanDays * 24 * 60 * 60 * 1000);
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
      issueDate: systemDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'active',
      renewalCount: 0,
      maxRenewals: settings.maxRenewals || 2,
      fineAmount: 0,
    };

    setBorrowings(prev => [newBorrowing, ...prev]);

    // 4. Notify student
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        userId: req.studentId,
        title: 'Book Issued Successfully',
        message: `"${targetBook.title}" has been issued to you. Due date: ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
        type: 'SUCCESS',
        read: false,
        link: '/student/borrowed',
        createdAt: systemDate.toISOString(),
      },
      ...prev,
    ]);

    // 5. Audit Log
    addAuditLog(
      l,
      'Book Issued',
      transactionId,
      `Issued "${targetBook.title}" (${targetBook.bookId}) to ${req.studentName} (Roll No: ${req.studentId}). Due: ${dueDate.toLocaleDateString('en-GB')}.`
    );

    addToast('Book Issued Successfully', `Transaction ${transactionId} confirmed for ${req.studentName} (${req.studentId}). Due in ${loanDays} days.`, 'success');
    return { success: true, message: 'Book issued successfully', borrowing: newBorrowing };
  };

  const returnBook = (transactionId: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const borrowing = borrowings.find(b => b.transactionId === transactionId || b.id === transactionId);
    if (!borrowing) return { success: false, message: 'Transaction record not found.' };

    if (borrowing.status === 'returned') {
      return { success: false, message: 'This borrowing has already been marked as returned.' };
    }

    // Calculate fine if returned late - exactly ₹2 per day
    const due = new Date(borrowing.dueDate);
    const isLate = systemDate > due;
    let fineAmount = 0;
    let overdueDays = 0;
    if (isLate) {
      overdueDays = Math.max(0, Math.floor((systemDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
      fineAmount = overdueDays * 2;
    }

    // 1. Mark borrowing returned
    setBorrowings(prev => prev.map(b => {
      if (b.id === borrowing.id) {
        return {
          ...b,
          status: 'returned',
          returnDate: systemDate.toISOString(),
          fineAmount,
        };
      }
      return b;
    }));

    // 2. Increment book availableCopies
    setBooks(prev => prev.map(b => {
      if (b.bookId === borrowing.bookId) {
        const newAvailable = b.availableCopies + 1;
        const newIssued = Math.max(0, b.issuedCopies - 1);
        let newStatus: Book['status'] = 'available';
        if (newAvailable <= settings.lowStockThreshold) newStatus = 'low_stock';

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

    // 3. Check waitlist for this book and notify first student
    setWaitlists(prev => {
      const waiting = prev.filter(w => w.bookId === borrowing.bookId && w.status === 'waiting');
      if (waiting.length > 0) {
        const first = waiting[0];
        // Send notification to first student
        setNotifications(prevNotifs => [
          {
            id: `notif-${Date.now()}-wl`,
            userId: first.studentId,
            title: 'Waitlist Update: Book Now Available!',
            message: `"${borrowing.bookTitle}" is now back in stock. Please submit your request promptly!`,
            type: 'SUCCESS',
            read: false,
            link: '/student/browse',
            createdAt: systemDate.toISOString(),
          },
          ...prevNotifs,
        ]);

        return prev.map(w => w.id === first.id ? { ...w, status: 'notified' as const } : w);
      }
      return prev;
    });

    // 4. If fine applies and not yet in fines list
    if (fineAmount > 0 && !borrowing.finePaid) {
      const newFine: Fine = {
        id: `fine-${Date.now()}`,
        fineId: `FINE-2026-${borrowing.transactionId.slice(-4)}`,
        studentId: borrowing.studentId,
        studentName: borrowing.studentName,
        borrowingId: borrowing.id,
        bookTitle: borrowing.bookTitle,
        daysOverdue: overdueDays,
        overdueDays: overdueDays,
        ratePerDay: 2,
        amount: fineAmount,
        status: 'pending',
        createdAt: systemDate.toISOString(),
      };
      setFines(prev => [newFine, ...prev]);
    }

    // 5. Notify student
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        userId: borrowing.studentId,
        title: 'Book Return Confirmed',
        message: `Your return for "${borrowing.bookTitle}" has been verified by the librarian.${fineAmount > 0 ? ` Outstanding fine: ₹${fineAmount}.` : ' Thank you!'}`,
        type: fineAmount > 0 ? 'WARNING' : 'SUCCESS',
        read: false,
        link: fineAmount > 0 ? '/student/fines' : '/student/borrowed',
        createdAt: systemDate.toISOString(),
      },
      ...prev,
    ]);

    addAuditLog(
      l,
      'Book Returned',
      borrowing.transactionId,
      `Student ${borrowing.studentName} returned "${borrowing.bookTitle}". Available copies updated (+1).${fineAmount > 0 ? ` Fine applied: ₹${fineAmount}` : ''}`
    );

    addToast('Book Returned Successfully', `Inventory updated. Available copies incremented.${fineAmount > 0 ? ` Overdue fine ₹${fineAmount} logged.` : ''}`, 'success');
    return { success: true, message: 'Book return completed', fineCalculated: fineAmount };
  };

  const approveRenewal = (borrowingId: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const borrowing = borrowings.find(b => b.id === borrowingId);
    if (!borrowing) return;

    const currentDue = new Date(borrowing.dueDate);
    const extensionDays = settings.loanPeriodDays || 15;
    const newDueDate = new Date(currentDue.getTime() + extensionDays * 24 * 60 * 60 * 1000);

    setBorrowings(prev => prev.map(b => {
      if (b.id === borrowingId) {
        return {
          ...b,
          dueDate: newDueDate.toISOString(),
          renewalCount: b.renewalCount + 1,
          renewalStatus: 'approved',
          status: 'active',
          fineAmount: 0,
        };
      }
      return b;
    }));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        userId: borrowing.studentId,
        title: 'Renewal Approved!',
        message: `Your renewal request for "${borrowing.bookTitle}" was approved. New due date is ${newDueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
        type: 'SUCCESS',
        read: false,
        link: '/student/borrowed',
        createdAt: systemDate.toISOString(),
      },
      ...prev,
    ]);

    addAuditLog(
      l,
      'Renewal Approved',
      borrowing.transactionId,
      `Extended due date by ${extensionDays} days for "${borrowing.bookTitle}" to ${newDueDate.toLocaleDateString()}.`
    );

    addToast('Renewal Approved', `Due date extended to ${newDueDate.toLocaleDateString()}.`, 'success');
  };

  const rejectRenewal = (borrowingId: string, reason?: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const borrowing = borrowings.find(b => b.id === borrowingId);
    if (!borrowing) return;

    setBorrowings(prev => prev.map(b => b.id === borrowingId ? { ...b, renewalStatus: 'rejected' } : b));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        userId: borrowing.studentId,
        title: 'Renewal Request Declined',
        message: `Your renewal request for "${borrowing.bookTitle}" was declined. Reason: ${reason || 'High demand by other students.'}`,
        type: 'ERROR',
        read: false,
        link: '/student/borrowed',
        createdAt: systemDate.toISOString(),
      },
      ...prev,
    ]);

    addAuditLog(l, 'Renewal Rejected', borrowing.transactionId, `Declined renewal for ${borrowing.transactionId}. Reason: ${reason || 'Capacity constraints'}`);
    addToast('Renewal Declined', 'Student informed.', 'info');
  };

  const addBook = (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const deptPrefix = bookData.department || 'CSE';
    const deptCount = books.filter(b => b.department === deptPrefix).length + 1;
    const generatedBookId = `BK-${deptPrefix}-${String(deptCount).padStart(4, '0')}`;

    const totalCopies = Math.max(1, Number(bookData.totalCopies) || 1);
    const issuedCopies = Math.max(0, Number(bookData.issuedCopies) || 0);
    const reservedCopies = Math.max(0, Number(bookData.reservedCopies) || 0);
    const lostCopies = Math.max(0, Number(bookData.lostCopies) || 0);
    const damagedCopies = Math.max(0, Number(bookData.damagedCopies) || 0);
    const availableCopies = Math.max(0, totalCopies - issuedCopies - reservedCopies - lostCopies - damagedCopies);

    let status: Book['status'] = 'available';
    if (availableCopies === 0) status = 'out_of_stock';
    else if (availableCopies <= settings.lowStockThreshold) status = 'low_stock';

    const newBook: Book = {
      ...bookData,
      id: `b-${Date.now()}`,
      bookId: (bookData.bookId && bookData.bookId.trim()) ? bookData.bookId.trim() : generatedBookId,
      totalCopies,
      availableCopies,
      issuedCopies,
      reservedCopies,
      lostCopies,
      damagedCopies,
      shelfNumber: bookData.shelfNumber || 'General Stack',
      location: bookData.location || 'BVC Library',
      loanPeriod: bookData.loanPeriod || 15,
      status,
      createdAt: systemDate.toISOString(),
      updatedAt: systemDate.toISOString(),
    };

    setBooks(prev => [newBook, ...prev]);
    addAuditLog(l, 'Book Added', newBook.bookId, `Added new catalog item "${newBook.title}" with ${newBook.totalCopies} copies.`);
    addToast('Book Cataloged', `"${newBook.title}" added with ID ${newBook.bookId}.`, 'success');
    return newBook;
  };

  const updateBook = (bookId: string, bookData: Partial<Book>, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    setBooks(prev => prev.map(b => {
      if (b.id === bookId || b.bookId === bookId) {
        const totalCopies = bookData.totalCopies !== undefined ? Math.max(0, Number(bookData.totalCopies)) : b.totalCopies;
        const issuedCopies = bookData.issuedCopies !== undefined ? Math.max(0, Number(bookData.issuedCopies)) : (b.issuedCopies || 0);
        const reservedCopies = bookData.reservedCopies !== undefined ? Math.max(0, Number(bookData.reservedCopies)) : (b.reservedCopies || 0);
        const lostCopies = bookData.lostCopies !== undefined ? Math.max(0, Number(bookData.lostCopies)) : (b.lostCopies || 0);
        const damagedCopies = bookData.damagedCopies !== undefined ? Math.max(0, Number(bookData.damagedCopies)) : (b.damagedCopies || 0);
        const availableCopies = Math.max(0, totalCopies - issuedCopies - reservedCopies - lostCopies - damagedCopies);

        let status: Book['status'] = 'available';
        if (availableCopies === 0) status = 'out_of_stock';
        else if (availableCopies <= settings.lowStockThreshold) status = 'low_stock';

        const updated: Book = {
          ...b,
          ...bookData,
          totalCopies,
          issuedCopies,
          reservedCopies,
          lostCopies,
          damagedCopies,
          availableCopies,
          status,
          updatedAt: systemDate.toISOString(),
        };
        return updated;
      }
      return b;
    }));

    addAuditLog(l, 'Book Updated', bookId, `Updated details and stock for book ${bookId}.`);
    addToast('Book Updated', 'Changes saved successfully.', 'success');
  };

  const deleteBook = (bookId: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const book = books.find(b => b.id === bookId || b.bookId === bookId);
    if (!book) return { success: false, message: 'Book not found' };

    // Check active borrowings
    const hasActiveBorrowings = borrowings.some(b => b.bookId === book.bookId && b.status !== 'returned');
    if (hasActiveBorrowings || book.issuedCopies > 0) {
      return { success: false, message: 'Cannot delete book: Copies are currently issued to students.' };
    }

    setBooks(prev => prev.filter(b => b.id !== book.id));
    addAuditLog(l, 'Book Deleted', book.bookId, `Deleted "${book.title}" from catalog.`);
    addToast('Book Removed', `"${book.title}" removed from catalog.`, 'info');
    return { success: true, message: 'Book deleted successfully' };
  };

  const waiveFine = (fineId: string, reason?: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    setFines(prev => prev.map(f => {
      if (f.id === fineId || f.fineId === fineId) {
        return { ...f, status: 'waived' };
      }
      return f;
    }));

    setBorrowings(prev => prev.map(b => {
      const fine = fines.find(f => (f.id === fineId || f.fineId === fineId) && f.borrowingId === b.id);
      if (fine) {
        return { ...b, finePaid: true, fineAmount: 0 };
      }
      return b;
    }));

    addAuditLog(l, 'Fine Waived', fineId, `Waived overdue fine ${fineId}. Reason: ${reason || 'Administrative waiver'}`);
    addToast('Fine Waived', `Fine ${fineId} has been waived.`, 'info');
  };

  const resolveComplaint = (ticketId: string, response: string, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    setComplaints(prev => prev.map(c => {
      if (c.ticketId === ticketId || c.id === ticketId) {
        return {
          ...c,
          status: 'Resolved',
          response,
          respondedBy: l?.name || 'Library Staff',
          updatedAt: systemDate.toISOString(),
        };
      }
      return c;
    }));

    const ticket = complaints.find(c => c.ticketId === ticketId || c.id === ticketId);
    if (ticket) {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          userId: ticket.studentId,
          title: `Support Ticket ${ticket.ticketId} Resolved`,
          message: `Librarian response: ${response}`,
          type: 'SUCCESS',
          read: false,
          link: '/student/complaints',
          createdAt: systemDate.toISOString(),
        },
        ...prev,
      ]);
    }

    addAuditLog(l, 'Complaint Resolved', ticketId, `Resolved query ${ticketId}.`);
    addToast('Ticket Resolved', `Response sent for ticket ${ticketId}.`, 'success');
  };

  const updateLostDamagedStatus = (
    reportId: string,
    status: LostDamagedReport['status'],
    fineAmount?: number,
    notes?: string,
    librarian?: User | null
  ) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    const amt = fineAmount || 0;
    setLostDamagedReports(prev => prev.map(r => {
      if (r.reportId === reportId || r.id === reportId) {
        return {
          ...r,
          status,
          fineApplied: amt,
          resolutionNotes: notes || '',
          updatedAt: systemDate.toISOString(),
        };
      }
      return r;
    }));

    // If fine applied, generate fine entry
    const report = lostDamagedReports.find(r => r.reportId === reportId || r.id === reportId);
    if (report && amt > 0) {
      const fineEntry: Fine = {
        id: `fine-${Date.now()}`,
        fineId: `FINE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        studentId: report.studentId,
        studentName: report.studentName,
        borrowingId: report.reportId,
        bookTitle: `${report.bookTitle} (${report.issueType} Assessment)`,
        daysOverdue: 0,
        ratePerDay: 0,
        amount: amt,
        status: 'pending',
        createdAt: systemDate.toISOString(),
      };
      setFines(prev => [fineEntry, ...prev]);

      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          userId: report.studentId,
          title: `Assessment Fine Applied for ${report.issueType} Book`,
          message: `Administrative fine of ₹${amt} has been applied for ${report.reportId} ("${report.bookTitle}").`,
          type: 'ERROR',
          read: false,
          link: '/student/fines',
          createdAt: systemDate.toISOString(),
        },
        ...prev,
      ]);
    }

    addAuditLog(l, 'Report Updated', reportId, `Marked status as ${status}.${amt > 0 ? ` Fine applied: ₹${amt}` : ''}`);
    addToast('Report Updated', `Report ${reportId} updated to ${status}.`, 'success');
  };

  const updateSettings = (newSettings: Partial<LibrarySettings>, librarian?: User | null) => {
    const l = librarian || (currentUser?.role === 'librarian' ? currentUser : defaultLibrarian);
    setSettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog(l, 'Settings Updated', 'CONFIG', 'Updated institutional loan and fine policies.');
    addToast('Settings Saved', 'System configurations updated successfully.', 'success');
  };

  return (
    <LibraryContext.Provider
      value={{
        systemDate,

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

        approveRequest,
        rejectRequest,
        issueBookDirect,
        confirmIssueBook,
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
