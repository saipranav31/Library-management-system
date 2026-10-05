export type UserRole = 'student' | 'librarian' | 'admin';

export type StudentStatus = 'Active' | 'Graduated' | 'Blocked';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string; // Roll Number e.g. "246M1A4201"
  rollNumber?: string;
  department: string; // "CSE" | "AIML" | "ECE" | "EEE" | "MECH" | "CIVIL" | "MBA"
  section?: string; // "A" | "B" | "C" | "D"
  year?: string; // "1st Year" | "2nd Year" | "3rd Year" | "4th Year" | "Graduated"
  yearOfStudy?: number; // 1, 2, 3, 4 (or 0 for graduated)
  academicYear?: string; // e.g. "2026-2027"
  promotionDate?: string;
  expectedGraduationYear?: number;
  status?: StudentStatus;
  phone: string;
  profileImage: string;
  createdAt: string;
}

export interface Book {
  id: string;
  bookId: string; // e.g., "BK-CSE-001"
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
  loanPeriod?: number; // legacy alias
  loanDurationDays: number; // default e.g. 14 days
  minimumLoanDurationDays?: number; // e.g. 7 days
  maximumLoanDurationDays?: number; // e.g. 28 days
  status: 'available' | 'low_stock' | 'out_of_stock' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type LibrarySession = 'Morning' | 'Afternoon';

export type RequestStatus = 
  | 'Requested' 
  | 'Pending'    // legacy alias for Requested
  | 'Granted' 
  | 'Approved'   // legacy alias for Granted
  | 'Waitlisted' 
  | 'Taken' 
  | 'Issued'     // legacy alias for Taken
  | 'Expired' 
  | 'Declined' 
  | 'Rejected'   // legacy alias for Declined
  | 'Returned' 
  | 'Cancelled';

export interface BookRequest {
  id: string;
  requestId: string; // e.g., "REQ-2026-00125"
  studentId: string; // Student Roll Number (e.g. 246M1A4201)
  studentRollNo?: string;
  studentName: string;
  studentEmail: string;
  department: string;
  studentDept?: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string;
  session?: LibrarySession; // 'Morning' | 'Afternoon'
  sessionDate?: string; // YYYY-MM-DD in Asia/Kolkata
  requestCreatedAt?: string; // ISO string
  fifoPosition?: number; // 1, 2, 3...
  status: RequestStatus;
  grantedAt?: string;
  pickupDeadline?: string; // e.g. "12:30 PM" or ISO string
  takenAt?: string;
  expiredAt?: string;
  requestDate: string; // ISO string (for backward compatibility)
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  issuedAt?: string;
}

export type BorrowingStatus = 'active' | 'returned' | 'overdue' | 'issued';

export interface Borrowing {
  id: string;
  transactionId: string; // e.g., "TXN-2026-1001"
  studentId: string; // Student Roll Number
  studentName: string;
  studentEmail: string;
  studentDept?: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImage?: string;
  requestId?: string;
  issueDate: string;
  dueDate: string;
  loanDurationDays: number; // configured duration used for this specific borrowing
  returnDate?: string;
  status: BorrowingStatus;
  renewalCount: number;
  maxRenewals: number;
  renewalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  fineAmount: number;
  finePaid?: boolean;
  issuedBy?: string; // Librarian name / ID
  immediateReturnRequested?: boolean;
  immediateReturnRequestedAt?: string;
  immediateReturnMessage?: string;
}

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'URGENT';
export type NotificationPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export interface AppNotification {
  id: string;
  notificationId?: string;
  userId: string; // studentId, "all", or "librarian"
  studentId?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  read: boolean;
  status?: 'unread' | 'read';
  link?: string;
  bookId?: string;
  librarianId?: string;
  createdAt: string;
  readAt?: string;
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
  auditId?: string;
  timestamp: string;
  performedAt?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  actor?: string;
  performedBy?: string;
  action: string;
  actionType?: string;
  entity?: string;
  entityType?: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
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
  currentAcademicYear: string; // e.g. "2026-2027"
  academicYearStart: string; // "June 1"
  academicYearEnd: string; // "May 31"
  morningSessionStart: string; // "09:30"
  morningSessionEnd: string; // "12:30"
  afternoonSessionStart: string; // "13:30"
  afternoonSessionEnd: string; // "16:30"
}
