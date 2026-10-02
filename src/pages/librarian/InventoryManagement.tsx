import React, { useState, useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Plus,
  Minus,
  Edit,
} from 'lucide-react';
import { Book } from '../../types';
import { Modal } from '../../components/common/Modal';

export const InventoryManagement: React.FC = () => {
  const { books, updateBook, addToast } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('All');
  const [shelfModalBook, setShelfModalBook] = useState<Book | null>(null);
  const [newShelf, setNewShelf] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const filteredInventory = useMemo(() => {
    return books.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.bookId.toLowerCase().includes(q) ||
        b.shelfNumber.toLowerCase().includes(q) ||
        b.department.toLowerCase().includes(q);

      let matchStock = true;
      if (stockFilter === 'low') {
        matchStock = b.availableCopies >= 1 && b.availableCopies <= 2;
      } else if (stockFilter === 'out') {
        matchStock = b.availableCopies === 0;
      } else if (stockFilter === 'available') {
        matchStock = b.availableCopies > 2;
      }

      return matchSearch && matchStock;
    });
  }, [books, searchQuery, stockFilter]);

  const handleAdjustCopies = (book: Book, delta: number) => {
    const newTotal = Math.max(book.issuedCopies || 0, book.totalCopies + delta);

    updateBook(book.id, {
      totalCopies: newTotal,
    });
    addToast('Inventory Updated', `Stock updated for "${book.title}". Available copies recalculated.`, 'info');
  };

  const handleSaveShelf = () => {
    if (!shelfModalBook) return;
    updateBook(shelfModalBook.id, {
      shelfNumber: newShelf.trim(),
      location: newLocation.trim(),
    });
    setShelfModalBook(null);
    addToast('Location Updated', `Shelf location saved for "${shelfModalBook.title}".`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-7 h-7 text-blue-900" />
            Inventory & Shelf Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time physical copy audit, shelf slot assignment, and threshold restock monitoring.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{books.filter(b => b.availableCopies <= 2 && b.availableCopies > 0).length} titles low stock</span>
          </div>
        </div>
      </div>

      {/* Filter and search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by book title, ID, department, or shelf rack..."
            className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-600 outline-hidden transition"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'All', label: 'All Titles' },
            { id: 'available', label: 'Well Stocked (>2)' },
            { id: 'low', label: 'Low Stock (1-2)' },
            { id: 'out', label: 'Out of Stock (0)' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStockFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                stockFilter === st.id
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4">Book Title & ID</th>
                <th className="p-4">Department</th>
                <th className="p-4">Shelf & Location</th>
                <th className="p-4 text-center">Available Stock</th>
                <th className="p-4 text-center">Issued Copies</th>
                <th className="p-4 text-center">Quick Stock Adjust</th>
                <th className="p-4 text-right">Relocate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {books.length === 0 ? 'No books have been added to inventory yet.' : 'No books match the selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map(book => (
                <tr key={book.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 max-w-xs">
                    <p className="font-bold text-slate-900 text-sm truncate">{book.title}</p>
                    <p className="text-slate-400 font-mono text-[11px]">{book.bookId} • ISBN: {book.isbn}</p>
                  </td>

                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {book.department}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{book.shelfNumber}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">{book.location}</span>
                  </td>

                  <td className="p-4 text-center">
                    <span className={`text-base font-extrabold ${
                      book.availableCopies === 0
                        ? 'text-rose-600'
                        : book.availableCopies <= 2
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}>
                      {book.availableCopies}
                    </span>
                    <span className="text-slate-400 text-xs"> / {book.totalCopies}</span>
                  </td>

                  <td className="p-4 text-center font-bold text-slate-700">
                    {book.issuedCopies}
                  </td>

                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => handleAdjustCopies(book, -1)}
                        disabled={book.availableCopies <= 0}
                        className="p-1 text-slate-700 hover:bg-white rounded-lg transition disabled:opacity-30 cursor-pointer"
                        title="Reduce 1 copy"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs px-2 text-slate-800 font-mono">{book.totalCopies}</span>
                      <button
                        onClick={() => handleAdjustCopies(book, 1)}
                        className="p-1 text-slate-700 hover:bg-white rounded-lg transition cursor-pointer"
                        title="Add 1 copy"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setShelfModalBook(book);
                        setNewShelf(book.shelfNumber);
                        setNewLocation(book.location);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer"
                    >
                      Update Shelf
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relocate Shelf Modal */}
      {shelfModalBook && (
        <Modal
          isOpen={!!shelfModalBook}
          onClose={() => setShelfModalBook(null)}
          title="Update Shelf Assignment"
          subtitle={shelfModalBook.title}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Shelf / Rack Location
              </label>
              <input
                type="text"
                value={newShelf}
                onChange={e => setNewShelf(e.target.value)}
                placeholder="e.g. Rack CSE-02, Shelf C"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Wing / Floor Designation
              </label>
              <input
                type="text"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="e.g. 2nd Floor, Engineering Wing A"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-600 outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShelfModalBook(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveShelf}
                className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition shadow-xs"
              >
                Save Location
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
