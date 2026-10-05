import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  MapPin,
  ArrowRight,
  Info,
  BookmarkCheck,
  UserCheck,
} from 'lucide-react';
import { Book } from '../../types';
import { Modal } from '../../components/common/Modal';
import { getISTDetails } from '../../utils/sessionUtils';

export const BrowseBooks: React.FC = () => {
  const { currentUser } = useAuth();
  const { books, requestBook, joinWaitlist, systemDate, sessionInfo, settings, addToast } = useLibrary();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search & Filter state
  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');

  // Request Confirmation Modal State
  const [requestingBook, setRequestingBook] = useState<Book | null>(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  // Dynamic filter options derived from real database records
  const departments = ['All', 'CSE', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'];

  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      if (b.category) set.add(b.category);
    });
    return ['All', ...Array.from(set)];
  }, [books]);

  const authors = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => {
      if (b.author) set.add(b.author);
    });
    return ['All', ...Array.from(set)];
  }, [books]);

  const years = useMemo(() => {
    const set = new Set<number>();
    books.forEach(b => {
      if (b.year) set.add(b.year);
    });
    return ['All', ...Array.from(set).sort((a, b) => b - a).map(String)];
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      // Text search match across Title, Author, ISBN, Book ID, Category, Description
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.bookId.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q));

      // Dept match
      const matchDept = selectedDept === 'All' || b.department === selectedDept;

      // Category match
      const matchCat = selectedCategory === 'All' || b.category === selectedCategory;

      // Author match
      const matchAuthor = selectedAuthor === 'All' || b.author === selectedAuthor;

      // Year match
      const matchYear = selectedYear === 'All' || String(b.year) === selectedYear;

      // Availability match
      let matchAvail = true;
      if (selectedAvailability === 'available') {
        matchAvail = b.availableCopies > 2;
      } else if (selectedAvailability === 'low_stock') {
        matchAvail = b.availableCopies >= 1 && b.availableCopies <= 2;
      } else if (selectedAvailability === 'out_of_stock') {
        matchAvail = b.availableCopies <= 0;
      }

      return matchSearch && matchDept && matchCat && matchAuthor && matchYear && matchAvail;
    });
  }, [books, searchQuery, selectedDept, selectedCategory, selectedAuthor, selectedYear, selectedAvailability]);

  // Handle request submission
  const handleConfirmRequest = () => {
    if (!requestingBook || !currentUser) return;
    if (requestingBook.availableCopies <= 0) {
      addToast('Cannot Request', 'This title is currently out of stock. You can join the waitlist instead.', 'warning');
      setRequestingBook(null);
      return;
    }

    setRequestSubmitting(true);
    setTimeout(() => {
      const res = requestBook(requestingBook.id, currentUser);
      setRequestSubmitting(false);
      setRequestingBook(null);

      if (res.success) {
        navigate('/student/requests');
      }
    }, 400);
  };

  const handleJoinWaitlist = (book: Book) => {
    if (!currentUser) return;
    const res = joinWaitlist(book.id, currentUser);
    if (res.success) {
      addToast('Waitlist Confirmed', res.message, 'success');
    } else {
      addToast('Waitlist', res.message, 'info');
    }
  };

  const expectedReturnDate = useMemo(() => {
    const loanDays = requestingBook?.loanPeriod || settings.loanPeriodDays || 15;
    const date = new Date(systemDate.getTime() + loanDays * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [requestingBook, systemDate, settings.loanPeriodDays]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedDept('All');
    setSelectedCategory('All');
    setSelectedAuthor('All');
    setSelectedYear('All');
    setSelectedAvailability('All');
    setSearchParams({});
  };

  const hasActiveFilters =
    searchQuery ||
    selectedDept !== 'All' ||
    selectedCategory !== 'All' ||
    selectedAuthor !== 'All' ||
    selectedYear !== 'All' ||
    selectedAvailability !== 'All';

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-900" />
            Library Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search and request verified library books added by the BVC Library administration.
          </p>
        </div>

        {books.length > 0 && (
          <div className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
            Showing <strong className="text-slate-900">{filteredBooks.length}</strong> of {books.length} titles
          </div>
        )}
      </div>

      {/* Session Status Banner */}
      <div className={`rounded-2xl p-4 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        sessionInfo.isActive
          ? 'bg-blue-50/60 border-blue-200 text-blue-950'
          : 'bg-amber-50/70 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full shrink-0 ${sessionInfo.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm">
                {sessionInfo.statusText}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800">
                {getISTDetails(systemDate).time12} IST
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Request Hours: <strong className="text-slate-900">Morning (9:30 AM – 12:30 PM)</strong> &bull; <strong className="text-slate-900">Afternoon (1:30 PM – 4:30 PM)</strong>
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 self-start sm:self-auto shadow-2xs">
          {sessionInfo.isActive ? `Closes at ${sessionInfo.closesAtText}` : sessionInfo.nextSessionText}
        </div>
      </div>

      {/* Case 1: When ZERO books have been added by the librarian */}
      {books.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-3">
          <BookOpen className="w-14 h-14 text-slate-300 mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-slate-900">
            No books available
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            The library catalog is currently empty.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Please check again after the librarian adds books.
          </p>
        </div>
      ) : (
        <>
          {/* Search & Filter Controls Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search catalog by title, author, ISBN, or Book ID..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 text-slate-900 outline-hidden transition"
              />
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {/* Department */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                  ))}
                </select>
              </div>

              {/* Author */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Author
                </label>
                <select
                  value={selectedAuthor}
                  onChange={e => setSelectedAuthor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  {authors.map(a => (
                    <option key={a} value={a}>{a === 'All' ? 'All Authors' : a}</option>
                  ))}
                </select>
              </div>

              {/* Publication Year */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>
                  ))}
                </select>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Availability
                </label>
                <select
                  value={selectedAvailability}
                  onChange={e => setSelectedAvailability(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="available">Available (&gt; 2 copies)</option>
                  <option value="low_stock">Only 1-2 copies left</option>
                  <option value="out_of_stock">Currently unavailable (0)</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Active filters applied</span>
                <button
                  onClick={resetAllFilters}
                  className="text-xs text-blue-700 hover:underline font-bold cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Book Catalog Grid */}
          {filteredBooks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No books found matching your criteria.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No catalog items matched your keyword or filter combination. Try adjusting or clearing your filters.
              </p>
              <button
                onClick={resetAllFilters}
                className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredBooks.map(book => {
                const isAvailable = book.availableCopies > 2;
                const isLowStock = book.availableCopies >= 1 && book.availableCopies <= 2;
                const isOutOfStock = book.availableCopies <= 0;

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col overflow-hidden group"
                  >
                    {/* Book Cover Image */}
                    <div
                      className="relative h-56 bg-slate-100 overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/student/books/${book.id}`)}
                    >
                      <img
                        src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Stock badge top-right */}
                      <div className="absolute top-3 right-3">
                        {isAvailable && (
                          <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Available
                          </span>
                        )}
                        {isLowStock && (
                          <span className="bg-amber-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Only {book.availableCopies} {book.availableCopies === 1 ? 'copy' : 'copies'} left
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="bg-slate-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Currently unavailable
                          </span>
                        )}
                      </div>

                      {/* Department & ID on cover bottom */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                        <span className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-mono">
                          {book.bookId}
                        </span>
                        <span className="bg-blue-600/90 backdrop-blur-xs font-semibold px-2 py-0.5 rounded text-[11px]">
                          {book.department}
                        </span>
                      </div>
                    </div>

                    {/* Book Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                          {book.category}
                        </span>
                        <h3
                          onClick={() => navigate(`/student/books/${book.id}`)}
                          className="font-bold text-sm text-slate-900 line-clamp-2 mt-0.5 group-hover:text-blue-700 transition cursor-pointer"
                          title={book.title}
                        >
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          By <span className="text-slate-700 font-medium">{book.author}</span>
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{book.shelfNumber || 'General Stack'}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-semibold text-slate-700">
                            Available: <strong className="text-slate-900">{book.availableCopies}</strong> / {book.totalCopies}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {book.year ? `Pub: ${book.year}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2">
                        {book.availableCopies > 0 ? (
                          <button
                            onClick={() => setRequestingBook(book)}
                            className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Request Book</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="space-y-1.5">
                            <button
                              disabled
                              className="w-full py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed text-center"
                            >
                              Currently unavailable
                            </button>
                            <button
                              onClick={() => handleJoinWaitlist(book)}
                              className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Clock className="w-3 h-3" />
                              Join Waitlist
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Book Request Confirmation Modal (Section 5 Specification) */}
      {requestingBook && (
        <Modal
          isOpen={!!requestingBook}
          onClose={() => setRequestingBook(null)}
          title="REQUEST BOOK"
          subtitle="BVC Library Book Circulation Request"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Book:</span>
                <strong className="text-slate-900 text-sm">{requestingBook.title}</strong>
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

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Session:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  sessionInfo.session === 'Morning' ? 'bg-blue-100 text-blue-900' : sessionInfo.session === 'Afternoon' ? 'bg-indigo-100 text-indigo-900' : 'bg-rose-100 text-rose-800'
                }`}>
                  {sessionInfo.session} Session ({sessionInfo.sessionTimeLabel})
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Request Time (IST):</span>
                <strong className="text-slate-900 font-mono">
                  {getISTDetails(systemDate).displayDate}, {getISTDetails(systemDate).time12}
                </strong>
              </div>
            </div>

            {!sessionInfo.isActive ? (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs leading-relaxed space-y-1">
                <div className="font-extrabold flex items-center gap-1 text-rose-800">
                  <Clock className="w-4 h-4 text-rose-600" />
                  Requests Currently Closed
                </div>
                <p>
                  {sessionInfo.rejectionReason || 'Library request session is currently closed.'} Requests are only accepted during:
                </p>
                <ul className="list-disc pl-4 text-[11px] text-rose-800">
                  <li><strong>Morning Session:</strong> 9:30 AM to 12:30 PM</li>
                  <li><strong>Afternoon Session:</strong> 1:30 PM to 4:30 PM</li>
                </ul>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Automatic FIFO Evaluation Active
                </div>
                <p>
                  If eligible copies are available on shelf, your request will be <strong>GRANTED automatically</strong>. You must collect your book at the circulation desk before <strong>{sessionInfo.closesAtText}</strong> today. Uncollected grants expire at session close.
                </p>
              </div>
            )}

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
              Roll number <strong className="font-mono text-slate-900">{currentUser?.studentId}</strong> is linked automatically from your authenticated session.
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRequestingBook(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={requestSubmitting || !sessionInfo.isActive}
                onClick={handleConfirmRequest}
                className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestSubmitting
                  ? 'Submitting...'
                  : !sessionInfo.isActive
                  ? 'Session Closed'
                  : 'CONFIRM REQUEST (FIFO)'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
