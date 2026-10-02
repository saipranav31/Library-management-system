import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  Building2,
  Calendar,
  Coins,
  ShieldCheck,
  Bell,
  Layers,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { addToast } = useLibrary();

  // Settings State initialized from local storage or defaults
  const [loanPeriod, setLoanPeriod] = useState(15);
  const [finePerDay, setFinePerDay] = useState(2);
  const [maxRenewals, setMaxRenewals] = useState(2);
  const [maxBooksPerStudent, setMaxBooksPerStudent] = useState(4);
  const [pickupExpiryDays, setPickupExpiryDays] = useState(3);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(2);

  const [collegeName, setCollegeName] = useState('BVC College of Engineering');
  const [libraryName, setLibraryName] = useState('BVC Library');
  const [contactEmail, setContactEmail] = useState('library@bvc.edu.in');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      'libtrack_system_settings',
      JSON.stringify({
        loanPeriod,
        finePerDay,
        maxRenewals,
        maxBooksPerStudent,
        pickupExpiryDays,
        reminderDaysBefore,
        collegeName,
        libraryName,
        contactEmail,
      })
    );
    addToast('Settings Saved', 'Library circulation rules and policies updated successfully.', 'success');
  };

  const handleResetDefaults = () => {
    setLoanPeriod(15);
    setFinePerDay(2);
    setMaxRenewals(2);
    setMaxBooksPerStudent(4);
    setPickupExpiryDays(3);
    setReminderDaysBefore(2);
    setCollegeName('BVC College of Engineering');
    setLibraryName('BVC Library');
    setContactEmail('library@bvc.edu.in');
    addToast('Defaults Restored', 'Standard college library parameters restored.', 'info');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-7 h-7 text-blue-900" />
            Library Policy & System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure lending durations, fine accumulation rates, quota caps, and institutional metadata.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset Defaults
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Circulation & Lending Policy Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-5 h-5 text-blue-600" />
            Circulation & Loan Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Standard Loan Period (Days)
              </label>
              <input
                type="number"
                min={3}
                max={60}
                value={loanPeriod}
                onChange={e => setLoanPeriod(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default 15 calendar days per loan</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Overdue Fine Rate (₹ / Day)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={finePerDay}
                onChange={e => setFinePerDay(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden font-bold text-rose-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">Accumulated daily after due date passes</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Max Allowed Renewals
              </label>
              <input
                type="number"
                min={0}
                max={5}
                value={maxRenewals}
                onChange={e => setMaxRenewals(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Number of times a student can extend without return</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Student Book Borrow Quota
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxBooksPerStudent}
                onChange={e => setMaxBooksPerStudent(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Concurrent active loan limit per student card</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Pickup Pass Expiry (Days)
              </label>
              <input
                type="number"
                min={1}
                max={7}
                value={pickupExpiryDays}
                onChange={e => setPickupExpiryDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Collection window for approved books at circulation counter</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Due Date Reminder Notice
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={reminderDaysBefore}
                onChange={e => setReminderDaysBefore(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Days before due date to flag "Due Soon" badge</p>
            </div>
          </div>
        </div>

        {/* Institutional Profile Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            Institutional & Library Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                College Name
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={e => setCollegeName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Library Department Header
              </label>
              <input
                type="text"
                value={libraryName}
                onChange={e => setLibraryName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Official Circulation Desk Inquiries Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Configuration Changes
          </button>
        </div>

      </form>

    </div>
  );
};
