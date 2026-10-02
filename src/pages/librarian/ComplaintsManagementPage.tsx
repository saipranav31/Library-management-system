import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
} from 'lucide-react';
import { Complaint } from '../../types';
import { Modal } from '../../components/common/Modal';

export const ComplaintsManagementPage: React.FC = () => {
  const { complaints, resolveComplaint, addToast } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Open' | 'Resolved'>('All');
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const displayedTickets = complaints.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.studentName.toLowerCase().includes(q) ||
      c.studentId.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.ticketNumber.toLowerCase().includes(q);

    const matchFilter = filter === 'All' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const handleOpenResolve = (ticket: Complaint) => {
    setSelectedTicket(ticket);
    setReplyMessage(
      ticket.librarianResponse ||
        'Your query has been reviewed. Necessary physical copies have been placed on reservation.'
    );
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    resolveComplaint(selectedTicket.id, replyMessage.trim());
    setSelectedTicket(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-blue-900" />
            Student Help Desk & Queries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Resolve student procurement requests, fine inquiries, and syllabus feedback.
          </p>
        </div>

        <div className="text-xs bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-slate-600">
          Open Tickets: <strong className="text-amber-600">{complaints.filter(c => c.status === 'Open').length}</strong>
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
            placeholder="Search by student, ticket #, or subject..."
            className="w-full bg-slate-50 text-xs rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-blue-600 outline-hidden transition"
          />
        </div>

        <div className="flex gap-1">
          {['All', 'Open', 'Resolved'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filter === f
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {displayedTickets.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400">
            No support queries found matching filter.
          </div>
        ) : (
          displayedTickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 font-bold">#{ticket.ticketNumber}</span>
                  <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                    {ticket.category}
                  </span>
                  <span className="text-slate-500 font-medium">
                    By <strong>{ticket.studentName}</strong> ({ticket.studentId})
                  </span>
                </div>

                {ticket.status === 'Resolved' ? (
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Resolved
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Awaiting Response
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900">{ticket.subject}</h3>
                <p className="text-slate-600 mt-1 leading-relaxed">{ticket.description}</p>
              </div>

              {ticket.librarianResponse && (
                <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Librarian Response Given:
                  </div>
                  <p className="text-blue-950 text-xs">{ticket.librarianResponse}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px]">
                <span>Submitted: {new Date(ticket.createdAt).toLocaleDateString('en-GB')}</span>

                {ticket.status !== 'Resolved' ? (
                  <button
                    onClick={() => handleOpenResolve(ticket)}
                    className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Reply & Mark Resolved
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenResolve(ticket)}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Update Resolution
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Response Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title="Resolve Student Support Ticket"
          subtitle={`Ticket #${selectedTicket.ticketNumber} • ${selectedTicket.studentName}`}
        >
          <form onSubmit={handleConfirmResolve} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Student Query
              </span>
              <p className="font-bold text-slate-900 mt-0.5">{selectedTicket.subject}</p>
              <p className="text-slate-600 mt-1">{selectedTicket.description}</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Librarian Response & Resolution Notes *
              </label>
              <textarea
                required
                rows={4}
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Detail the steps taken (e.g., fine adjusted, copies ordered, book placed on hold)..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-600 outline-hidden resize-none"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition shadow-xs"
              >
                Send Response & Resolve
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
