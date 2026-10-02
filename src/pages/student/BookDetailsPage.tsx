import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import {
  ChevronLeft,
  BookOpen,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Share2,
  Bookmark,
  Users,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const BookDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { books, requestBook, joinWaitlist, waitlists, systemDate, settings, addToast } = useLibrary();
  const navigate = useNavigate();

  const [confirmModal, setConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Find book by either Firestore ID or Book ID (e.g. BK-CSE-0001)
  const book = books.find(b => b.id === id || b.bookId === id);

  // Check if current student is on waitlist
  const myWaitlistEntry = useMemo(() => {
    if (!book || !currentUser) return null;
    return waitlists.find(w => w.bookId === book.bookId && w.studentId === currentUser.studentId && w.status === 'waiting');
  }, [book, currentUser, waitlists]);

  if (!book) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Book Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested book does not exist in the catalog or was removed.</p>
        <Link
          to="/student/browse"
          className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const isAvailable = book.availableCopies > 2;
  const isLowStock = book.availableCopies >= 1 && book.availableCopies <= 2;
  const isOutOfStock = book.availableCopies === 0;

  const expectedReturnDate = new Date(
    systemDate.getTime() + (book.loanPeriod || settings.loanPeriodDays || 15) * 24 * 60 * 60 * 1000
  ).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleConfirmRequest = () => {
    if (!currentUser) return;
    setSubmitting(true);
    setTimeout(() => {
      const res = requestBook(book.id, currentUser);
      setSubmitting(false);
      setConfirmModal(false);
      if (res.success) {
        navigate('/student/requests');
      }
    }, 400);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast('Link Copied', 'Book catalog link copied to clipboard.', 'info');
  };

  return (
    <div className="space-y-6">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/student/dashboard" className="hover:text-blue-600">Dashboard</Link>
        <span>/</span>
        <Link to="/student/browse" className="hover:text-blue-600">Browse Books</Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs">{book.title}</span>
      </nav>

      {/* Main Book Detail Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left: Large Book Cover */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col items-center">
            <div className="w-56 h-80 sm:w-64 sm:h-96 rounded-2xl overflow-hidden shadow-lg border border-slate-200 relative bg-slate-100">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded text-xs font-mono font-bold">
                {book.bookId}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 w-full max-w-xs">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
              <button
                onClick={() => addToast('Bookmark Saved', `"${book.title}" added to your saved reading list.`, 'info')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>

          {/* Right: Book Details & Availability Block */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  {book.department}
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                  {book.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Pub. Year: {book.year}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {book.title}
              </h1>

              <p className="text-sm font-medium text-slate-600">
                Authored by <strong className="text-slate-900">{book.author}</strong> • Published by <strong className="text-slate-900">{book.publisher}</strong>
              </p>

              {/* Prominent Availability Block */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                book.availableCopies > 2
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : book.availableCopies >= 1
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-slate-100 border-slate-300'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {book.availableCopies > 2 ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="font-extrabold text-emerald-900 text-base uppercase tracking-wide">
                            Available
                          </span>
                        </>
                      ) : book.availableCopies >= 1 ? (
                        <>
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <span className="font-extrabold text-amber-900 text-base uppercase tracking-wide">
                            Only {book.availableCopies} {book.availableCopies === 1 ? 'copy' : 'copies'} left
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-slate-500" />
                          <span className="font-extrabold text-slate-700 text-base uppercase tracking-wide">
                            Currently unavailable
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      <strong className="text-slate-900 font-bold">{book.availableCopies}</strong> of <strong className="text-slate-900 font-bold">{book.totalCopies}</strong> physical copies currently on shelf.
                      {book.issuedCopies > 0 && ` (${book.issuedCopies} issued to other students)`}
                    </p>
                  </div>

                  {/* Call to action button */}
                  <div>
                    {book.availableCopies > 0 ? (
                      <button
                        onClick={() => setConfirmModal(true)}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        REQUEST BOOK
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => currentUser && joinWaitlist(book.id, currentUser)}
                          disabled={!!myWaitlistEntry}
                          className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-600/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <Users className="w-4 h-4" />
                          {myWaitlistEntry ? `ON WAITLIST (#${myWaitlistEntry.position})` : 'JOIN WAITLIST'}
                        </button>
                        {myWaitlistEntry && (
                          <span className="text-[11px] text-amber-800 font-medium">
                            Position #{myWaitlistEntry.position}. You will be notified once returned.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">ISBN Number</span>
                  <span className="font-mono font-semibold text-slate-800">{book.isbn}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Loan Period</span>
                  <span className="font-semibold text-slate-800">{book.loanPeriod || 15} Days</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Stack & Shelf</span>
                  <span className="font-semibold text-slate-800">{book.shelfNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Physical Wing</span>
                  <span className="font-semibold text-slate-800 truncate block">{book.location}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  Book Synopsis & Details
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {book.description}
                </p>
              </div>

            </div>

            {/* Bottom tips */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Standard turnaround: After submitting a request, the librarian reviews it using your Student Roll Number. Visit the BVC Library circulation desk upon approval to collect your book.
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* Confirmation Modal (Section 5 Specification) */}
      {confirmModal && (
        <Modal
          isOpen={confirmModal}
          onClose={() => setConfirmModal(false)}
          title="REQUEST BOOK"
          subtitle="BVC Library Book Circulation Request"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Book:</span>
                <strong className="text-slate-900 text-sm">{book.title}</strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Student:</span>
                <strong className="text-slate-900 text-sm">{currentUser?.name}</strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Roll Number:</span>
                <strong className="font-mono text-blue-900 text-sm font-bold bg-blue-50 px-2 py-0.5 rounded">
                  {currentUser?.studentId}
                </strong>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Department:</span>
                <strong className="text-slate-900">{currentUser?.department}</strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Request Date:</span>
                <strong className="text-slate-900">
                  {systemDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-900 text-[11px] leading-relaxed">
              The system automatically attaches your authenticated Roll Number (<strong>{currentUser?.studentId}</strong>) to this request.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRequest}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'CONFIRM REQUEST'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
