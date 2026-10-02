import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  LogIn,
  IdCard,
  Phone,
  Building2,
  Calendar,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const { addToast } = useLibrary();
  const navigate = useNavigate();

  // Mode: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [roleTab, setRoleTab] = useState<'student' | 'librarian'>('student');

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Student Registration State
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDept, setRegDept] = useState('CSE');
  const [regYear, setRegYear] = useState('1st Year');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);

  const departments = ['CSE', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const result = login(email, password, roleTab);
      setLoading(false);

      if (result.success) {
        addToast(
          'Login Successful',
          `Welcome to LibTrack!`,
          'success'
        );
        if (result.role === 'student') {
          navigate('/student/dashboard');
        } else {
          navigate('/librarian/dashboard');
        }
      } else {
        setError(result.message || 'Authentication failed. Please verify your credentials.');
      }
    }, 300);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = register({
        name: regName.trim(),
        email: regEmail.trim(),
        role: 'student',
        studentId: regStudentId.trim() || undefined,
        department: regDept,
        year: regYear,
        phone: regPhone.trim(),
        password: regPassword,
      });
      setLoading(false);

      if (result.success) {
        addToast(
          'Registration Successful',
          `Account created for ${regName}! Welcome to LibTrack.`,
          'success'
        );
        navigate('/student/dashboard');
      } else {
        setError(result.message || 'Failed to create student account.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-lg shadow-blue-900/20">
            <BookOpen className="w-8 h-8 text-blue-300" />
          </div>
        </div>

        <h1 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          LibTrack
        </h1>
        <p className="mt-1 text-center text-sm font-medium text-slate-500">
          BVC College of Engineering • BVC Library
        </p>

        {/* Mode Switcher */}
        <div className="mt-4 flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${
              authMode === 'signin' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${
              authMode === 'register' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Student Registration
          </button>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
          
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
              <span>{error}</span>
            </div>
          )}

          {authMode === 'signin' ? (
            <>
              {/* Portal Selector Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
                <button
                  type="button"
                  onClick={() => { setRoleTab('student'); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    roleTab === 'student'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Student Portal
                </button>
                <button
                  type="button"
                  onClick={() => { setRoleTab('librarian'); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    roleTab === 'librarian'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Librarian / Staff
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleSignIn}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {roleTab === 'student' ? 'Student Roll Number or College Email' : 'Librarian Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={roleTab === 'student' ? 'text' : 'email'}
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={roleTab === 'student' ? 'e.g. 246M1A0000 or 246m1a0000@bvc.edu.in' : 'librarian@bvc.edu.in'}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-slate-900 placeholder-slate-400 outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-slate-900 placeholder-slate-400 outline-hidden transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember on this device</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setForgotModal(true)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 shadow-md shadow-blue-900/20 focus:ring-4 focus:ring-blue-200 transition cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <span>Signing In...</span>
                    ) : (
                      <>
                        <span>Sign In to {roleTab === 'student' ? 'Student Portal' : 'Librarian Console'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {roleTab === 'student' && (
                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500">
                    First time accessing the college library?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setError(null); }}
                      className="text-blue-700 font-bold hover:underline cursor-pointer"
                    >
                      Register your Student ID
                    </button>
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Student Registration Form */
            <form className="space-y-3.5" onSubmit={handleRegister}>
              <div className="text-center pb-2">
                <h3 className="font-bold text-base text-slate-900">Student Account Registration</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enrolls your library profile for textbook requests and circulation loans.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Sai Pranav"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={regStudentId}
                    onChange={e => setRegStudentId(e.target.value)}
                    placeholder="e.g. 246M1A0000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 uppercase font-mono focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <select
                    value={regDept}
                    onChange={e => setRegDept(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 focus:border-blue-600 outline-hidden cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Year
                  </label>
                  <select
                    value={regYear}
                    onChange={e => setRegYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 focus:border-blue-600 outline-hidden cursor-pointer"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+91 94401 23456"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  College Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="e.g. student@bvc.edu.in"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Create Password *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Minimum 4 characters"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 shadow-md shadow-blue-900/20 transition cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Creating Profile...' : 'Complete Registration & Sign In'}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError(null); }}
                  className="text-xs text-blue-700 font-semibold hover:underline cursor-pointer"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-400">
          BVC Library • BVC College of Engineering
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Password Assistance</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              To reset your institutional library password, please visit the BVC Library Circulation Desk with your Student College ID Card or contact library support at <strong className="text-blue-900">library@bvc.edu.in</strong>.
            </p>
            <button
              onClick={() => setForgotModal(false)}
              className="mt-5 w-full py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
