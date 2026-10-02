import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  AlertTriangle,
  BookX,
  Plus,
  CheckCircle2,
  Coins,
  Search,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const LostDamagedPage: React.FC = () => {
  const { books, updateBook, addToast } = useLibrary();

  const [incidents, setIncidents] = useState<Array<{
    id: string;
    bookTitle: string;
    studentName: string;
    studentId: string;
    type: 'Damaged' | 'Lost';
    notes: string;
    penalty: number;
    date: string;
    status: 'Paid' | 'Pending';
  }>>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(books[0]?.id || '');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [incidentType, setIncidentType] = useState<'Damaged' | 'Lost'>('Damaged');
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const handleRecordIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const book = books.find(b => b.id === selectedBookId);
    if (!book) return;

    const newInc = {
      id: `INC-${Math.floor(100 + Math.random() * 900)}`,
      bookTitle: book.title,
      studentName,
      studentId,
      type: incidentType,
      notes: notes || `${incidentType} assessment filed by library counter.`,
      penalty: Number(penaltyAmount),
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };

    setIncidents([newInc, ...incidents]);

    if (incidentType === 'Lost') {
      // Deduct 1 total copy permanently
      const updatedTotal = Math.max(0, book.totalCopies - 1);
      const updatedAvail = Math.max(0, book.availableCopies - 1);
      updateBook(book.id, {
        totalCopies: updatedTotal,
        availableCopies: updatedAvail,
      });
    }

    addToast('Incident Logged', `${incidentType} report filed. Fine of ₹${penaltyAmount} debited to ${studentName}.`, 'warning');
    setModalOpen(false);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookX className="w-7 h-7 text-rose-600" />
            Lost & Damaged Books Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record physical inventory damages, write-offs, and replacement recovery surcharges.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          File Damage / Loss Incident
        </button>
      </div>

      {/* Incident Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-4">Incident ID</th>
                <th className="p-4">Book Title</th>
                <th className="p-4">Student</th>
                <th className="p-4">Classification</th>
                <th className="p-4">Notes / Damage Log</th>
                <th className="p-4 text-center">Assessed Surcharge</th>
                <th className="p-4 text-right">Fee Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No lost or damaged book incidents recorded.
                  </td>
                </tr>
              ) : (
                incidents.map(inc => (
                <tr key={inc.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-bold text-slate-700">{inc.id}</td>

                  <td className="p-4 font-bold text-slate-900 max-w-xs">{inc.bookTitle}</td>

                  <td className="p-4">
                    <p className="font-semibold text-slate-900">{inc.studentName}</p>
                    <p className="text-slate-400 font-mono text-[11px]">{inc.studentId}</p>
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      inc.type === 'Lost' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inc.type}
                    </span>
                  </td>

                  <td className="p-4 text-slate-600 max-w-xs truncate">{inc.notes}</td>

                  <td className="p-4 text-center font-extrabold text-sm text-slate-900">
                    ₹{inc.penalty}
                  </td>

                  <td className="p-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      inc.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {inc.status}
                    </span>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Record Lost or Damaged Book"
          subtitle="Updates library inventory and assesses replacement penalty"
        >
          <form onSubmit={handleRecordIncident} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Select Book from Catalog *
              </label>
              <select
                value={selectedBookId}
                onChange={e => setSelectedBookId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
              >
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.bookId})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Student ID / Roll No *
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Incident Type
                </label>
                <select
                  value={incidentType}
                  onChange={e => setIncidentType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Damaged">Physical Damage / Tearing</option>
                  <option value="Lost">Lost / Unrecoverable</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Penalty / Surcharge (₹)
                </label>
                <input
                  type="number"
                  min={50}
                  value={penaltyAmount}
                  onChange={e => setPenaltyAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Damage Inspection Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe page tears, binding breakages, or incident circumstances..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs"
              >
                Log Incident & Surcharge
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
