import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../common/ToastContainer';
import { DemoTestingControl } from '../common/DemoTestingControl';

export const LibrarianLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Role security: Students must never see librarian/admin pages
  if (currentUser.role !== 'librarian' && currentUser.role !== 'admin') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <ToastContainer />
      <DemoTestingControl />
    </div>
  );
};
