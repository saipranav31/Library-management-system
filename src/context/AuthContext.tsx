import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data/initialData';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, pass: string, expectedRole?: UserRole) => { success: boolean; message?: string; role?: string };
  register: (userData: {
    name: string;
    email: string;
    role: UserRole;
    studentId?: string;
    department: string;
    year?: string;
    phone?: string;
    password?: string;
  }) => { success: boolean; message?: string; user?: User };
  logout: () => void;
  allUsers: User[];
  updateUserProfile: (data: Partial<User>) => void;
  updateAllUsers: (updater: (prev: User[]) => User[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear any legacy demo user storage on initialization
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('libtrack_auth_clean_nodemo_v3') !== 'true') {
      localStorage.removeItem('libtrack_users');
      localStorage.removeItem('libtrack_auth_user');
      localStorage.setItem('libtrack_auth_clean_nodemo_v3', 'true');
    }
  } catch {
    // ignore
  }

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('libtrack_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out any legacy mock demo students
          const realOnly = parsed.filter(u => u.role === 'librarian' || !u.id.startsWith('usr-student-'));
          if (realOnly.length > 0) return realOnly;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('libtrack_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear if legacy mock student
        if (parsed.email === 'student@demo.com' || parsed.name === 'Sai Pranav') {
          localStorage.removeItem('libtrack_auth_user');
          return null;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    try {
      localStorage.setItem('libtrack_users', JSON.stringify(allUsers));
    } catch {
      // ignore
    }
  }, [allUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('libtrack_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('libtrack_auth_user');
    }
  }, [currentUser]);

  const login = (email: string, pass: string, expectedRole?: UserRole) => {
    const trimmedEmail = email.trim().toLowerCase();

    // Find in registered users list (by email or roll number)
    const matched = allUsers.find(
      u => u.email.toLowerCase() === trimmedEmail || (u.studentId && u.studentId.toLowerCase() === trimmedEmail)
    );
    if (matched) {
      if (expectedRole && matched.role !== expectedRole) {
        return {
          success: false,
          message: `This account is registered as a ${matched.role}. Please switch to the ${matched.role === 'student' ? 'Student' : 'Librarian'} login tab.`,
        };
      }
      if (pass.length < 4) {
        return {
          success: false,
          message: 'Password must be at least 4 characters long.',
        };
      }
      setCurrentUser(matched);
      return { success: true, role: matched.role };
    }

    // Default Librarian institutional login fallback if not yet registered
    if (trimmedEmail === 'librarian@bvc.edu.in') {
      const adminUser: User = {
        id: 'usr-librarian-1',
        name: 'Chief Librarian',
        email: 'librarian@bvc.edu.in',
        role: 'librarian',
        studentId: 'LIB-EMP-001',
        department: 'BVC Library',
        phone: '+91 94401 23456',
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };
      setAllUsers(prev => prev.some(u => u.email === adminUser.email) ? prev : [adminUser, ...prev]);
      setCurrentUser(adminUser);
      return { success: true, role: 'librarian' };
    }

    return {
      success: false,
      message: 'Account not found. Please verify your college email address or register a new student account.',
    };
  };

  const register = (userData: {
    name: string;
    email: string;
    role: UserRole;
    studentId?: string;
    department: string;
    year?: string;
    phone?: string;
    password?: string;
  }) => {
    const trimmedEmail = userData.email.trim().toLowerCase();
    if (allUsers.some(u => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, message: 'An account with this email address already exists. Please sign in.' };
    }

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: userData.name.trim(),
      email: trimmedEmail,
      role: userData.role,
      studentId: userData.studentId?.trim() || `STU-${Date.now().toString().slice(-6)}`,
      department: userData.department,
      year: userData.year || '1st Year',
      phone: userData.phone?.trim() || '',
      profileImage: userData.role === 'student'
        ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`
        : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };

    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
  };

  const updateAllUsers = (updater: (prev: User[]) => User[]) => {
    setAllUsers(prev => {
      const updated = updater(prev);
      if (currentUser) {
        const found = updated.find(u => u.id === currentUser.id);
        if (found) setCurrentUser(found);
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        allUsers,
        updateUserProfile,
        updateAllUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
