import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';

// Layouts
import { StudentLayout } from './components/layout/StudentLayout';
import { LibrarianLayout } from './components/layout/LibrarianLayout';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { BrowseBooks } from './pages/student/BrowseBooks';
import { BookDetailsPage } from './pages/student/BookDetailsPage';
import { MyRequests } from './pages/student/MyRequests';
import { MyBorrowedBooks } from './pages/student/MyBorrowedBooks';
import { NotificationsPage } from './pages/student/NotificationsPage';
import { FinesPage } from './pages/student/FinesPage';
import { ComplaintsPage } from './pages/student/ComplaintsPage';
import { ProfilePage } from './pages/student/ProfilePage';

// Librarian Pages
import { LibrarianDashboard } from './pages/librarian/LibrarianDashboard';
import { BooksCatalog } from './pages/librarian/BooksCatalog';
import { InventoryManagement } from './pages/librarian/InventoryManagement';
import { StudentRequestsPage } from './pages/librarian/StudentRequestsPage';
import { BorrowingRecordsPage } from './pages/librarian/BorrowingRecordsPage';
import { ReturnBookPage } from './pages/librarian/ReturnBookPage';
import { StudentDirectoryPage } from './pages/librarian/StudentDirectoryPage';
import { FinesManagementPage } from './pages/librarian/FinesManagementPage';
import { ComplaintsManagementPage } from './pages/librarian/ComplaintsManagementPage';
import { LostDamagedPage } from './pages/librarian/LostDamagedPage';
import { ReportsPage } from './pages/librarian/ReportsPage';
import { AuditLogsPage } from './pages/librarian/AuditLogsPage';
import { SettingsPage } from './pages/librarian/SettingsPage';
import { VerifyStudentPage } from './pages/librarian/VerifyStudentPage';
import { SessionQueuePage } from './pages/librarian/SessionQueuePage';

// Root Redirect Helper
const RootRedirect: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }
  return <Navigate to="/librarian/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LibraryProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Student Portal Routes */}
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="browse" element={<BrowseBooks />} />
              <Route path="books" element={<BrowseBooks />} />
              <Route path="books/:id" element={<BookDetailsPage />} />
              <Route path="requests" element={<MyRequests />} />
              <Route path="borrowed" element={<MyBorrowedBooks />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="fines" element={<FinesPage />} />
              <Route path="complaints" element={<ComplaintsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              {/* Fallback for legacy QR route */}
              <Route path="qr-passes" element={<Navigate to="/student/requests" replace />} />
            </Route>

            {/* Librarian / Admin Portal Routes */}
            <Route path="/librarian" element={<LibrarianLayout />}>
              <Route index element={<Navigate to="/librarian/dashboard" replace />} />
              <Route path="dashboard" element={<LibrarianDashboard />} />
              <Route path="verify" element={<VerifyStudentPage />} />
              <Route path="queue" element={<SessionQueuePage />} />
              <Route path="books" element={<BooksCatalog />} />
              <Route path="add-book" element={<BooksCatalog autoOpenAddModal={true} />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="requests" element={<StudentRequestsPage />} />
              <Route path="borrowings" element={<BorrowingRecordsPage />} />
              <Route path="returns" element={<ReturnBookPage />} />
              <Route path="students" element={<StudentDirectoryPage />} />
              <Route path="fines" element={<FinesManagementPage />} />
              <Route path="complaints" element={<ComplaintsManagementPage />} />
              <Route path="lost-damaged" element={<LostDamagedPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              {/* Route Aliases & Fallbacks */}
              <Route path="verify-student" element={<Navigate to="/librarian/verify" replace />} />
              <Route path="session-queue" element={<Navigate to="/librarian/queue" replace />} />
              <Route path="catalog" element={<Navigate to="/librarian/books" replace />} />
              <Route path="directory" element={<Navigate to="/librarian/students" replace />} />
              <Route path="qr-scanner" element={<Navigate to="/librarian/requests" replace />} />
            </Route>

            {/* Root & Catch-all Fallbacks */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </LibraryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
