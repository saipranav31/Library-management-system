import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLibrary } from '../../context/LibraryContext';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Upload,
  Calendar,
  Layers,
  Building,
  Bookmark,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { Book } from '../../types';
import { Modal } from '../../components/common/Modal';
import { BookCoverUploader } from '../../components/librarian/BookCoverUploader';

export const BooksCatalog: React.FC<{ autoOpenAddModal?: boolean }> = ({ autoOpenAddModal }) => {
  const { books, addBook, updateBook, deleteBook, updateBookLoanDuration, addToast } = useLibrary();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [viewModalBook, setViewModalBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [durationEditBook, setDurationEditBook] = useState<Book | null>(null);
  const [newDurationInput, setNewDurationInput] = useState<number>(14);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<{
    bookId: string;
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    year: number;
    department: string;
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
    loanDurationDays: number;
  }>({
    bookId: '',
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    year: new Date().getFullYear(),
    department: 'CSE',
    category: 'Programming',
    description: '',
    coverImage: '',
    totalCopies: 5,
    availableCopies: 5,
    issuedCopies: 0,
    reservedCopies: 0,
    lostCopies: 0,
    damagedCopies: 0,
    shelfNumber: '',
    location: '',
    loanDurationDays: 14,
  });

  const departments = ['All', 'CSE', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'];
  const categories = [
    'All',
    'Programming',
    'Database Systems',
    'Data Structures & Algorithms',
    'Artificial Intelligence',
    'Signal Processing',
    'Electrical Engineering',
    'Computer Networks',
    'Operating Systems',
    'Reference',
    'Management Studies',
  ];

  // Distinct authors in current catalog
  const distinctAuthors = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => { if (b.author) set.add(b.author); });
    return ['All', ...Array.from(set)];
  }, [books]);

  // Advanced Filtering (CHANGE 6)
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.bookId.toLowerCase().includes(q);

      const matchDept = selectedDept === 'All' || b.department === selectedDept;
      const matchCategory = selectedCategory === 'All' || b.category === selectedCategory;
      const matchAuthor = selectedAuthor === 'All' || b.author === selectedAuthor;

      let matchAvailability = true;
      if (selectedAvailability === 'Available') {
        matchAvailability = b.availableCopies > 0;
      } else if (selectedAvailability === 'LowStock') {
        matchAvailability = b.availableCopies <= 2 && b.availableCopies > 0;
      } else if (selectedAvailability === 'OutOfStock') {
        matchAvailability = b.availableCopies === 0;
      } else if (selectedAvailability === 'Issued') {
        matchAvailability = b.issuedCopies > 0;
      } else if (selectedAvailability === 'Reserved') {
        matchAvailability = (b.reservedCopies || 0) > 0;
      } else if (selectedAvailability === 'Lost') {
        matchAvailability = (b.lostCopies || 0) > 0;
      } else if (selectedAvailability === 'Damaged') {
        matchAvailability = (b.damagedCopies || 0) > 0;
      }

      return matchSearch && matchDept && matchCategory && matchAuthor && matchAvailability;
    });
  }, [books, searchQuery, selectedDept, selectedCategory, selectedAuthor, selectedAvailability]);

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setFormData({
      bookId: '',
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      year: new Date().getFullYear(),
      department: 'CSE',
      category: 'Programming',
      description: '',
      coverImage: '',
      totalCopies: 5,
      availableCopies: 5,
      issuedCopies: 0,
      reservedCopies: 0,
      lostCopies: 0,
      damagedCopies: 0,
      shelfNumber: '',
      location: '',
      loanDurationDays: 14,
    });
    setBookModalOpen(true);
  };

  useEffect(() => {
    if (autoOpenAddModal || searchParams.get('add') === 'true') {
      handleOpenAddModal();
    }
  }, [autoOpenAddModal, searchParams]);

  const handleOpenEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      bookId: book.bookId,
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      year: book.year || new Date().getFullYear(),
      department: book.department,
      category: book.category,
      description: book.description || '',
      coverImage: book.coverImage || '',
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      issuedCopies: book.issuedCopies || 0,
      reservedCopies: book.reservedCopies || 0,
      lostCopies: book.lostCopies || 0,
      damagedCopies: book.damagedCopies || 0,
      shelfNumber: book.shelfNumber || '',
      location: book.location || '',
      loanDurationDays: book.loanDurationDays || book.loanPeriod || 14,
    });
    setBookModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('File too large', 'Please upload an image smaller than 2MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, coverImage: reader.result as string }));
          addToast('Image Uploaded', 'Cover photo loaded successfully.', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()) {
      addToast('Validation Error', 'Title, author, and ISBN are required.', 'error');
      return;
    }

    const finalAvailable = formData.availableCopies !== undefined ? Math.max(0, formData.availableCopies) : Math.max(0, formData.totalCopies);
    const finalBookId = formData.bookId.trim() || `BK-${formData.department}-${String(books.length + 1).padStart(4, '0')}`;
    const duration = formData.loanDurationDays || 14;

    if (editingBook) {
      updateBook(editingBook.id, {
        ...formData,
        bookId: finalBookId,
        availableCopies: finalAvailable,
        loanDurationDays: duration,
        loanPeriod: duration,
      });
    } else {
      addBook({
        ...formData,
        bookId: finalBookId,
        availableCopies: finalAvailable,
        loanDurationDays: duration,
        loanPeriod: duration,
        status: finalAvailable > 2 ? 'available' : finalAvailable >= 1 ? 'low_stock' : 'out_of_stock',
      });
    }
    setBookModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from the catalog?`)) {
      const res = deleteBook(id);
      if (!res.success) {
        addToast('Cannot Delete', res.message, 'error');
      }
    }
  };

  const handleSaveLoanDuration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!durationEditBook) return;
    updateBookLoanDuration(durationEditBook.id, newDurationInput);
    setDurationEditBook(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-900" />
            Book Catalog & Loan Duration Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure book-level loan durations (1 to 4 weeks), manage shelf placements, and filter by availability.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Book to Catalog
        </button>
      </div>

      {/* Advanced Filter Bar (CHANGE 6) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search catalog by title, author, ISBN, or Book ID..."
            className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-600 outline-hidden transition"
          />
        </div>

        {/* Filter selectors grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All Departments' : `${d} Department`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
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

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Author
            </label>
            <select
              value={selectedAuthor}
              onChange={e => setSelectedAuthor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer truncate"
            >
              {distinctAuthors.map(a => (
                <option key={a} value={a}>{a === 'All' ? 'All Authors' : a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Availability Status
            </label>
            <select
              value={selectedAvailability}
              onChange={e => setSelectedAvailability(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="All">All Availability</option>
              <option value="Available">Available on Shelf</option>
              <option value="LowStock">Low Stock (&le; 2 copies)</option>
              <option value="OutOfStock">Out of Stock (0 copies)</option>
              <option value="Issued">Has Issued Copies</option>
              <option value="Reserved">Has Reserved Copies</option>
              <option value="Lost">Has Lost Copies</option>
              <option value="Damaged">Has Damaged Copies</option>
            </select>
          </div>
        </div>

        {/* Active filters bar */}
        {(selectedDept !== 'All' || selectedCategory !== 'All' || selectedAuthor !== 'All' || selectedAvailability !== 'All' || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <strong>{filteredBooks.length}</strong> of {books.length} titles
            </span>
            <button
              onClick={() => {
                setSelectedDept('All');
                setSelectedCategory('All');
                setSelectedAuthor('All');
                setSelectedAvailability('All');
                setSearchQuery('');
              }}
              className="text-blue-900 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4">Book Details</th>
                <th className="p-4">Dept / Category</th>
                <th className="p-4 text-center">Configured Loan Duration</th>
                <th className="p-4 text-center">Stock Breakdown</th>
                <th className="p-4 text-center">Availability</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mb-3">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">No books available</h3>
                      <p className="text-slate-500 text-xs mt-1 mb-4">Add your first book to get started.</p>
                      <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Book
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No books match your selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBooks.map(book => {
                  const duration = book.loanDurationDays || book.loanPeriod || 14;

                  return (
                    <tr key={book.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div>
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {book.bookId}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-0.5">{book.title}</h4>
                            <p className="text-slate-500 text-xs">Author: {book.author}</p>
                            <p className="text-slate-400 text-[10px]">ISBN: {book.isbn}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-slate-800 block">{book.department}</span>
                        <span className="text-[11px] text-slate-500">{book.category}</span>
                      </td>

                      {/* Configured Loan Duration (CHANGE 4) */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
                          <Clock className="w-3.5 h-3.5 text-blue-800" />
                          <span className="font-bold text-blue-950 font-mono text-xs">
                            {duration} Days
                          </span>
                          <button
                            type="button"
                            title="Edit default loan duration"
                            onClick={() => {
                              setDurationEditBook(book);
                              setNewDurationInput(duration);
                            }}
                            className="p-0.5 text-blue-700 hover:text-blue-900 rounded cursor-pointer ml-1"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {duration === 7 ? '1 Week' : duration === 14 ? '2 Weeks' : duration === 21 ? '3 Weeks' : duration === 28 ? '4 Weeks' : `${duration} days`}
                        </span>
                      </td>

                      {/* Stock Breakdown */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                            <strong className="text-slate-900">{book.totalCopies}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-600 block font-medium">Shelf</span>
                            <strong className="text-emerald-700">{book.availableCopies}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-blue-600 block font-medium">Issued</span>
                            <strong className="text-blue-900">{book.issuedCopies || 0}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Availability status badge */}
                      <td className="p-4 text-center">
                        {book.availableCopies > 2 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            Available ({book.availableCopies})
                          </span>
                        ) : book.availableCopies > 0 ? (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            Low Stock ({book.availableCopies})
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewModalBook(book)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(book)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit book"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(book.id, book.title)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete book"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Default Loan Duration Modal (CHANGE 4) */}
      {durationEditBook && (
        <Modal
          isOpen={!!durationEditBook}
          onClose={() => setDurationEditBook(null)}
          title="Configure Book Loan Duration"
          subtitle={`Set default return period for "${durationEditBook.title}"`}
        >
          <form onSubmit={handleSaveLoanDuration} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-950 space-y-1">
              <span className="font-bold block text-sm">{durationEditBook.title}</span>
              <p className="text-blue-800 text-[11px]">
                Configuring this duration dictates due date calculation for all new issues of this title. Existing borrowing records remain unaffected.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                Default Loan Duration *
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label: '1 Week (7 Days)', days: 7 },
                  { label: '2 Weeks (14 Days)', days: 14 },
                  { label: '3 Weeks (21 Days)', days: 21 },
                  { label: '4 Weeks (28 Days)', days: 28 },
                ].map(opt => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setNewDurationInput(opt.days)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                      newDurationInput === opt.days
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-slate-500 font-semibold text-[11px] mb-1">
                  Custom number of days:
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={newDurationInput}
                  onChange={e => setNewDurationInput(Math.max(1, parseInt(e.target.value, 10) || 14))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 outline-hidden font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDurationEditBook(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition shadow-xs cursor-pointer"
              >
                Save Loan Duration
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Book Modal with Configurable Loan Duration */}
      {bookModalOpen && (
        <Modal
          isOpen={bookModalOpen}
          onClose={() => setBookModalOpen(false)}
          title={editingBook ? 'Edit Book Details' : 'Add New Book to Catalog'}
          subtitle="Manage catalog record, physical copies, and circulation loan period"
        >
          <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Java Programming"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 outline-hidden font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Herbert Schildt"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 outline-hidden font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Book ID (Unique)
                </label>
                <input
                  type="text"
                  value={formData.bookId}
                  onChange={e => setFormData({ ...formData, bookId: e.target.value })}
                  placeholder="e.g. BK-CSE-001"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  ISBN *
                </label>
                <input
                  type="text"
                  required
                  value={formData.isbn}
                  onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="e.g. 978-0071809252"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 outline-hidden cursor-pointer"
                >
                  {departments.filter(d => d !== 'All').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Configurable Loan Duration Field (CHANGE 4) */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
              <label className="block text-blue-950 font-extrabold uppercase tracking-wider text-[10px]">
                Configured Loan Duration (Return Period) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '1 Week (7d)', days: 7 },
                  { label: '2 Weeks (14d)', days: 14 },
                  { label: '3 Weeks (21d)', days: 21 },
                  { label: '4 Weeks (28d)', days: 28 },
                ].map(opt => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setFormData({ ...formData, loanDurationDays: opt.days })}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition text-center cursor-pointer ${
                      formData.loanDurationDays === opt.days
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Book Cover Image: Camera + Gallery */}
            <BookCoverUploader
              value={formData.coverImage}
              onChange={(imgUrl) => setFormData(prev => ({ ...prev, coverImage: imgUrl }))}
            />

            {/* Copies */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Total Copies in Holding *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.totalCopies}
                  onChange={e => {
                    const total = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setFormData({
                      ...formData,
                      totalCopies: total,
                      availableCopies: total - formData.issuedCopies,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Copies Currently on Shelf
                </label>
                <input
                  type="number"
                  min={0}
                  max={formData.totalCopies}
                  value={formData.availableCopies}
                  onChange={e => setFormData({
                    ...formData,
                    availableCopies: Math.max(0, parseInt(e.target.value, 10) || 0),
                  })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 outline-hidden font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBookModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition shadow-xs cursor-pointer"
              >
                {editingBook ? 'Update Book' : 'Add to Catalog'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Book Details View Modal */}
      {viewModalBook && (
        <Modal
          isOpen={!!viewModalBook}
          onClose={() => setViewModalBook(null)}
          title={viewModalBook.title}
          subtitle={`Book ID: ${viewModalBook.bookId}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex gap-4">
              <img
                src={viewModalBook.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
                alt={viewModalBook.title}
                className="w-20 h-28 object-cover rounded-xl border border-slate-200 shrink-0"
              />
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-slate-900">{viewModalBook.title}</h4>
                <p className="text-slate-600 font-medium">By {viewModalBook.author}</p>
                <p className="text-slate-500 font-mono text-[11px]">ISBN: {viewModalBook.isbn}</p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">
                    {viewModalBook.department}
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    {viewModalBook.category}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold font-mono">
                    Loan: {viewModalBook.loanDurationDays || 14} Days
                  </span>
                </div>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {viewModalBook.description || 'No description provided for this catalog title.'}
            </p>

            <button
              onClick={() => setViewModalBook(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
