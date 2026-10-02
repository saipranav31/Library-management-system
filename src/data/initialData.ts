import { Book, User, BookRequest, Borrowing, AppNotification, Fine, WaitlistEntry, Complaint, LostDamagedReport, AuditLog, LibrarySettings } from '../types';

export const INITIAL_SETTINGS: LibrarySettings = {
  loanPeriodDays: 15,
  finePerDay: 2, // College library fine is exactly ₹2 per day after the due date
  maxFine: 500,
  gracePeriodDays: 0,
  maxRenewals: 2,
  lowStockThreshold: 2,
  collegeName: 'BVC College of Engineering',
  libraryCode: 'LIB-BVC',
};

// Initial institutional account for BVC Library administration
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-librarian-1',
    name: 'Chief Librarian',
    email: 'librarian@bvc.edu.in',
    role: 'librarian',
    studentId: 'LIB-EMP-001',
    department: 'BVC Library',
    phone: '+91 94401 23456',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

// All initial collections start 100% EMPTY.
// The librarian and registered students will create real records.
export const INITIAL_BOOKS: Book[] = [];
export const INITIAL_REQUESTS: BookRequest[] = [];
export const INITIAL_BORROWINGS: Borrowing[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_FINES: Fine[] = [];
export const INITIAL_WAITLIST: WaitlistEntry[] = [];
export const INITIAL_COMPLAINTS: Complaint[] = [];
export const INITIAL_LOST_DAMAGED: LostDamagedReport[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
