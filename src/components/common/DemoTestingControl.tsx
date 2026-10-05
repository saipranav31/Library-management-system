import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  Sparkles,
  AlertTriangle,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sun,
  Sunset,
  Coffee,
  Moon,
  Zap,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Modal } from './Modal';
import { getISTDetails } from '../../utils/sessionUtils';

export const DemoTestingControl: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    systemDate,
    isSimulatedTime,
    sessionInfo,
    setSimulatedTime,
    resetToRealTime,
    triggerExpiryCheckNow,
    promoteAcademicYear,
    simulateFIFORequests,
    books,
    settings,
    addToast,
  } = useLibrary();

  const [isOpen, setIsOpen] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoPreview, setPromoPreview] = useState<{
    promotedCount: number;
    graduatedCount: number;
    newAcademicYear: string;
    details: string[];
  } | null>(null);

  // Only show or make available for staff / developer testing
  const ist = getISTDetails(systemDate);

  const handleOpenPromoModal = () => {
    // Run dry run preview
    const preview = promoteAcademicYear(true);
    setPromoPreview(preview);
    setPromoModalOpen(true);
  };

  const handleConfirmPromotion = () => {
    promoteAcademicYear(false);
    setPromoModalOpen(false);
  };

  const handleFIFOTest = () => {
    const targetBook = books.find(b => b.availableCopies > 0) || books[0];
    if (targetBook) {
      simulateFIFORequests(targetBook.bookId);
    } else {
      addToast('No Books', 'Please add a book to the catalog first.', 'warning');
    }
  };

  return (
    <>
      {/* Floating Pill Toggle Button at bottom right */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
        {isOpen && (
          <div className="mb-2 w-84 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-200 p-4 text-xs space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-900 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Prototype Demo Controls</h4>
                  <p className="text-[10px] text-slate-500">BVC Library Session & Promotion Simulator</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {/* Current IST Clock & Active Session Badge */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Current IST Clock
                </span>
                {isSimulatedTime ? (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Simulating
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Real Clock
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <span className="font-mono text-base font-extrabold text-slate-900">
                  {ist.time12}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {ist.displayDate}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Active Session:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    sessionInfo.session === 'Morning'
                      ? 'bg-blue-100 text-blue-900'
                      : sessionInfo.session === 'Afternoon'
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {sessionInfo.session} ({sessionInfo.sessionTimeLabel})
                </span>
              </div>
            </div>

            {/* 1-Click Session Jump Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Session Jump Presets (Asia/Kolkata)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSimulatedTime('morning')}
                  className={`p-2 rounded-xl text-left border transition flex items-center gap-2 cursor-pointer ${
                    sessionInfo.session === 'Morning'
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-[11px] leading-tight">Morning Session</div>
                    <div className="text-[10px] text-slate-400">10:00 AM IST</div>
                  </div>
                </button>

                <button
                  onClick={() => setSimulatedTime('lunch')}
                  className={`p-2 rounded-xl text-left border transition flex items-center gap-2 cursor-pointer ${
                    sessionInfo.session === 'Closed' && ist.hours === 13
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  <Coffee className="w-4 h-4 text-orange-500 shrink-0" />
                  <div>
                    <div className="text-[11px] leading-tight">Lunch Closed</div>
                    <div className="text-[10px] text-slate-400">1:00 PM IST</div>
                  </div>
                </button>

                <button
                  onClick={() => setSimulatedTime('afternoon')}
                  className={`p-2 rounded-xl text-left border transition flex items-center gap-2 cursor-pointer ${
                    sessionInfo.session === 'Afternoon'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  <Sunset className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-[11px] leading-tight">Afternoon Session</div>
                    <div className="text-[10px] text-slate-400">2:30 PM IST</div>
                  </div>
                </button>

                <button
                  onClick={() => setSimulatedTime('evening')}
                  className={`p-2 rounded-xl text-left border transition flex items-center gap-2 cursor-pointer ${
                    sessionInfo.session === 'Closed' && ist.hours >= 17
                      ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  <Moon className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <div className="text-[11px] leading-tight">Evening Closed</div>
                    <div className="text-[10px] text-slate-400">5:00 PM IST</div>
                  </div>
                </button>
              </div>

              {isSimulatedTime && (
                <button
                  onClick={resetToRealTime}
                  className="w-full mt-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset to Real Live Clock
                </button>
              )}
            </div>

            {/* Test Action Triggers */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Verification & Test Triggers
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => triggerExpiryCheckNow()}
                  className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl text-[11px] flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    Trigger Session Expiry Check Now
                  </span>
                  <span className="text-[10px] font-normal text-rose-600">Expires past grants</span>
                </button>

                <button
                  onClick={handleFIFOTest}
                  className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold rounded-xl text-[11px] flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    Simulate 5 Rapid FIFO Requests
                  </span>
                  <span className="text-[10px] font-normal text-blue-600">Tests FIFO queue</span>
                </button>

                <button
                  onClick={handleOpenPromoModal}
                  className="w-full py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold rounded-xl text-[11px] flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                    Simulate June 1 Promotion
                  </span>
                  <span className="text-[10px] font-normal text-purple-600">June 1 cycle</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating toggle pill */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-950 text-white hover:bg-blue-900 rounded-full shadow-xl border border-blue-700/60 text-xs font-bold transition hover:scale-105 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-blue-300 animate-pulse" />
          <span>Demo Controls</span>
          <span className="bg-blue-800 text-[10px] px-1.5 py-0.5 rounded-full">
            {sessionInfo.session}
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Confirmation Modal for Academic Promotion */}
      {promoModalOpen && (
        <Modal
          isOpen={promoModalOpen}
          onClose={() => setPromoModalOpen(false)}
          title="Simulate June 1 Academic Promotion"
          subtitle="Annual Academic Year Transition (June 1 → May 31)"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Calendar className="w-4 h-4 text-purple-700" />
                <span>Academic Year Promotion Transition</span>
              </div>
              <p className="text-purple-800 text-[11px]">
                Promotes all students according to the annual college calendar rule (June 1). 4th Year students transition to GRADUATED / ALUMNI status (never 5th year). Historical borrowing and fine records are permanently preserved.
              </p>
            </div>

            {promoPreview && (
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      New Academic Year
                    </span>
                    <strong className="text-sm text-slate-900">{promoPreview.newAcademicYear}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      Promotions / Graduations
                    </span>
                    <span className="text-xs font-bold text-purple-700">
                      {promoPreview.promotedCount} Promoted • {promoPreview.graduatedCount} Graduated
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                  <h5 className="font-bold text-slate-700 text-[11px] mb-2">Student Transition Preview:</h5>
                  {promoPreview.details.map((detail, idx) => (
                    <div key={idx} className="py-1 text-slate-600 font-mono text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPromoModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPromotion}
                className="flex-1 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold transition shadow-xs cursor-pointer"
              >
                Confirm & Apply Promotion
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
