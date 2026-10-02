import React, { useState, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import { Book } from '../../types';
import { Modal } from '../../components/common/Modal';

export const BooksCatalog: React.FC = () => {
  const { books, addBook, updateBook, deleteBook, addToast } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [viewModalBook, setViewModalBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

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
    loanPeriod: number;
  }>({
    bookId: '',
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    year: new Date().getFullYear(),
    department: 'CSE',
    category: '',
    description: '',
    coverImage: '',
    totalCopies: 0,
    availableCopies: 0,
    issuedCopies: 0,
    reservedCopies: 0,
    lostCopies: 0,
    damagedCopies: 0,
    shelfNumber: '',
    location: '',
    loanPeriod: 15,
  });

  const departments = ['All', 'CSE', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA'];
  const categories = [
    'Programming',
    'Database Systems',
    'Data Structures & Algorithms',
    'Artificial Intelligence & ML',
    'Computer Networks',
    'Operating Systems',
    'Software Engineering',
    'Digital Electronics',
    'Mathematics & Statistics',
    'Management Studies',
    'General Engineering',
  ];

  // Calculated availability for the form
  const calculatedAvailable = Math.max(
    0,
    formData.totalCopies - formData.issuedCopies - formData.reservedCopies - formData.lostCopies - formData.damagedCopies
  );

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
      return matchSearch && matchDept;
    });
  }, [books, searchQuery, selectedDept]);

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
      category: '',
      description: '',
      coverImage: '',
      totalCopies: 0,
      availableCopies: 0,
      issuedCopies: 0,
      reservedCopies: 0,
      lostCopies: 0,
      damagedCopies: 0,
      shelfNumber: '',
      location: '',
      loanPeriod: 15,
    });
    setBookModalOpen(true);
  };

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
      loanPeriod: book.loanPeriod || 15,
    });
    setBookModalOpen(true);
  };

  // Image file upload handler
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

    if (editingBook) {
      updateBook(editingBook.id, {
        ...formData,
        bookId: finalBookId,
        availableCopies: finalAvailable,
      });
      addToast('Book Updated', `"${formData.title}" details updated.`, 'success');
    } else {
      addBook({
        ...formData,
        bookId: finalBookId,
        availableCopies: finalAvailable,
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-900" />
            Book Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create and maintain actual library inventory, manage physical stock, locations, and circulation terms.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Book
        </button>
      </div>

      {/* When NO books have been added yet */}
      {books.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No books have been added yet.</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              The library catalog is currently empty. As the librarian, add the real college textbooks to start building the inventory.
            </p>
          </div>
          <div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-900/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Book
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search catalog by title, author, ISBN, or Book ID..."
                className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-600 outline-hidden transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d === 'All' ? 'All Departments' : `${d} Department`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-4">Book Details</th>
                    <th className="p-4">Dept / Category</th>
                    <th className="p-4">Stack / Shelf</th>
                    <th className="p-4 text-center">Stock Breakdown</th>
                    <th className="p-4 text-center">Availability</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No books match your search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map(book => (
                      <tr key={book.id} className="hover:bg-slate-50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
                              alt={book.title}
                              className="w-10 h-14 object-cover rounded-lg border border-slate-200 shrink-0 shadow-2xs"
                            />
                            <div>
                              <p className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">{book.title}</p>
                              <p className="text-slate-500 text-xs">By {book.author}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                ID: <strong className="text-slate-600">{book.bookId}</strong> • ISBN: {book.isbn}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded mr-1">
                            {book.department}
                          </span>
                          <span className="text-slate-600 text-xs block mt-1">{book.category}</span>
                        </td>

                        <td className="p-4 text-slate-600">
                          <div className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{book.shelfNumber || 'General Stack'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">{book.location || 'BVC Library'}</span>
                        </td>

                        <td className="p-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-slate-900 text-sm">
                              {book.availableCopies} available
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (Total: {book.totalCopies} • Issued: {book.issuedCopies || 0})
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          {book.availableCopies > 2 ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Available
                            </span>
                          ) : book.availableCopies >= 1 ? (
                            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Low ({book.availableCopies})
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Out of Stock
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewModalBook(book)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="View Book Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(book)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Edit Book Details & Stock"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(book.id, book.title)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete from Catalog"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Book Modal */}
      {bookModalOpen && (
        <Modal
          isOpen={bookModalOpen}
          onClose={() => setBookModalOpen(false)}
          title={editingBook ? 'Edit Book & Stock' : 'Add New Book to Catalog'}
          subtitle="Registered in the BVC Library catalog database"
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Book ID */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Book ID (Accession Number) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bookId}
                  onChange={e => setFormData({ ...formData, bookId: e.target.value })}
                  placeholder="e.g. BK-CSE-0001"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                />
              </div>

              {/* ISBN */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  ISBN Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.isbn}
                  onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="e.g. 978-0132350884"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                />
              </div>

              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Java: The Complete Reference"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Author(s) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Herbert Schildt"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>

              {/* Publisher */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Publisher
                </label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                  placeholder="e.g. McGraw-Hill Education"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>

              {/* Publication Year & Department */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Publication Year
                </label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                >
                  {departments.filter(d => d !== 'All').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Category & Loan Period */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Category / Subject
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Programming"
                  list="category-suggestions"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
                <datalist id="category-suggestions">
                  {categories.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Loan Period (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.loanPeriod}
                  onChange={e => setFormData({ ...formData, loanPeriod: parseInt(e.target.value) || 15 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>

              {/* Shelf & Location */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Shelf / Rack Number
                </label>
                <input
                  type="text"
                  value={formData.shelfNumber}
                  onChange={e => setFormData({ ...formData, shelfNumber: e.target.value })}
                  placeholder="e.g. Stack A-2, Rack 03"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Physical Stack Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. 2nd Floor, CS Wing"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs"
                />
              </div>

              {/* Cover Image URL + Upload */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Cover Image URL or Local Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://... or upload local file"
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs font-mono"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Image
                  </button>
                </div>
              </div>

              {/* Stock Management Box */}
              <div className="sm:col-span-2 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-xs">Inventory & Stock Counts</span>
                  <span className="text-[11px] text-slate-600">
                    Physical copies in BVC Library
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Total Copies *</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.totalCopies}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          totalCopies: val,
                          availableCopies: prev.totalCopies === prev.availableCopies ? val : prev.availableCopies,
                        }));
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Available Copies *</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.availableCopies}
                      onChange={e => setFormData({ ...formData, availableCopies: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Issued Copies</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.issuedCopies}
                      onChange={e => setFormData({ ...formData, issuedCopies: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Damaged / Lost</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.damagedCopies + formData.lostCopies}
                      onChange={e => setFormData({ ...formData, damagedCopies: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Calculated Available Copies:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-extrabold text-blue-900">
                      {calculatedAvailable}
                    </span>
                    {calculatedAvailable > 2 ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Available
                      </span>
                    ) : calculatedAvailable >= 1 ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Only {calculatedAvailable} left
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Currently unavailable
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Synopsis / Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of contents, target course, or syllabus reference..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs resize-none"
                />
              </div>

            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
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
                {editingBook ? 'Save Changes' : 'Add Book to Catalog'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Book Modal */}
      {viewModalBook && (
        <Modal
          isOpen={!!viewModalBook}
          onClose={() => setViewModalBook(null)}
          title={viewModalBook.title}
          subtitle={`Book ID: ${viewModalBook.bookId} • ISBN: ${viewModalBook.isbn}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <img
                src={viewModalBook.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                alt={viewModalBook.title}
                className="w-28 h-40 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0 mx-auto sm:mx-0"
              />
              <div className="space-y-2 flex-1 text-slate-700">
                <p><strong>Author:</strong> {viewModalBook.author}</p>
                <p><strong>Publisher:</strong> {viewModalBook.publisher || 'N/A'} ({viewModalBook.year || 'N/A'})</p>
                <p><strong>Department:</strong> {viewModalBook.department} • <strong>Category:</strong> {viewModalBook.category}</p>
                <p><strong>Stack Shelf:</strong> {viewModalBook.shelfNumber || 'General Stack'}</p>
                <p><strong>Location:</strong> {viewModalBook.location || 'BVC Library'}</p>
                <p><strong>Standard Loan Period:</strong> {viewModalBook.loanPeriod || 15} Days</p>
              </div>
            </div>

            {/* Stock breakdown card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-xs block">Inventory Stock Breakdown</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[11px]">
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase">Total</span>
                  <strong className="text-slate-900 text-sm">{viewModalBook.totalCopies}</strong>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-emerald-700 block text-[9px] uppercase font-bold">Available</span>
                  <strong className="text-emerald-800 text-sm">{viewModalBook.availableCopies}</strong>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-blue-700 block text-[9px] uppercase">Issued</span>
                  <strong className="text-blue-900 text-sm">{viewModalBook.issuedCopies || 0}</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase">Reserved</span>
                  <strong className="text-slate-900 text-sm">{viewModalBook.reservedCopies || 0}</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase">Lost</span>
                  <strong className="text-slate-900 text-sm">{viewModalBook.lostCopies || 0}</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[9px] uppercase">Damaged</span>
                  <strong className="text-slate-900 text-sm">{viewModalBook.damagedCopies || 0}</strong>
                </div>
              </div>
            </div>

            {viewModalBook.description && (
              <div>
                <span className="font-bold text-slate-800 block mb-1">Description:</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {viewModalBook.description}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewModalBook(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
