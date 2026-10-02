export type UserRole = 'student' | 'librarian' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string; // e.g., "246M1A0582"
  department: string;
  year?: string;
  phone: string;
  profileImage: string;
  createdAt: string;
}

export interface Book {
  id: string;
  bookId: string; // e.g., "BK-CSE-0001"
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  department: string; // "CSE" | "AIML" | "ECE" | "EEE" | "MECH" | "CIVIL" | "MBA"
  category: string;
  description: string;
  coverImage: string;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  reservedCopies: number;
  lostCopies: number;
  damagedCopies: number;
  shelfNumber: string;
  location: string;
  loanPeriod: number; // default 15 days
  status: 'available' | 'low_stock' | 'out_of_stock' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Rejected' 
  | 'Issued' 
  | 'Returned' 
  | 'Cancelled';

export interface BookRequest {
  id: string;
  requestId: string; // e.g., "REQ-00125"
  studentId: string; // Student Roll Number (e.g. 246M1A0000)
  studentRollNo?: string;
  studentName: string;
  studentEmail: string;
  department: string;
  studentDept?: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string;
  requestDate: string;
  status: RequestStatus;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  issuedAt?: string;
}

export type BorrowingStatus = 'active' | 'returned' | 'overdue' | 'issued';

export interface Borrowing {
  id: string;
  transactionId: string; // e.g., "TXN-2026-0892"
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentDept?: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: BorrowingStatus;
  renewalCount: number;
  maxRenewals: number;
  renewalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  fineAmount: number;
  finePaid?: boolean;
}

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

export interface AppNotification {
  id: string;
  userId: string; // studentId, "all", or "librarian"
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Fine {
  id: string;
  fineId?: string;
  studentId: string;
  studentName: string;
  borrowingId?: string;
  transactionId?: string;
  bookTitle: string;
  daysOverdue?: number;
  overdueDays?: number;
  ratePerDay?: number;
  amount: number;
  status: 'pending' | 'paid' | 'waived';
  dueDate?: string;
  createdAt: string;
  paidAt?: string;
  paidDate?: string;
  paymentMethod?: string;
  transactionRef?: string;
}

export interface WaitlistEntry {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  dateJoined: string;
  position: number;
  status: 'waiting' | 'notified' | 'fulfilled' | 'cancelled';
}

export type ComplaintCategory = 
  | 'Book availability query' 
  | 'Fine query' 
  | 'Account query' 
  | 'Technical issue' 
  | 'General library query' 
  | 'Book Availability' 
  | 'Fine Issue' 
  | 'Account Issue' 
  | 'Damage Report' 
  | 'General Query' 
  | 'Other';

export interface Complaint {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  response?: string;
  librarianResponse?: string;
  respondedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LostDamagedReport {
  id: string;
  reportId: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  issueType: 'Lost' | 'Damaged';
  description: string;
  imageUrl?: string;
  fineApplied?: number;
  status: 'Review' | 'Mark Lost' | 'Mark Damaged' | 'Fine Applied' | 'Resolved';
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  actor?: string;
  action: string;
  entity?: string;
  details?: string;
  description?: string;
}

export interface LibrarySettings {
  loanPeriodDays: number;
  finePerDay: number;
  maxFine: number;
  gracePeriodDays: number;
  maxRenewals: number;
  lowStockThreshold: number;
  collegeName: string;
  libraryCode: string;
}
