import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { ComplaintCategory } from '../../types';

export const ComplaintsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { complaints, submitComplaint } = useLibrary();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Book Availability');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Open' | 'Resolved'>('All');

  if (!currentUser) return null;

  const myComplaints = complaints.filter(c => c.studentId === currentUser.studentId);
  const displayedComplaints = myComplaints.filter(c => {
    if (filter === 'All') return true;
    return c.status === filter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      submitComplaint({
        studentId: currentUser.studentId || '',
        studentName: currentUser.name,
        subject: subject.trim(),
        category,
        description: description.trim(),
      });
      setIsSubmitting(false);
      setSubject('');
      setDescription('');
    }, 400);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-900" />
          Help Desk & Book Queries
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Submit queries regarding book requests, fine discrepancies, account status, or procurement suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Submit New Ticket Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs h-fit">
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Submit Query / Ticket
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Query Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ComplaintCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition cursor-pointer"
              >
                <option value="Book Availability">Book Availability / Procurement</option>
                <option value="Fine Issue">Fine Calculation Dispute</option>
                <option value="Account Issue">Student ID / Account Access</option>
                <option value="Damage Report">Damaged / Missing Pages Report</option>
                <option value="General Query">General Library Service Query</option>
                <option value="Other">Other Issues</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Request for additional copies of Operating Systems"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Detailed Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Please describe your query clearly so the chief librarian can assist promptly..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </form>
        </div>

        {/* Right: Existing Tickets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">
              My Support History ({myComplaints.length})
            </h3>

            <div className="flex gap-1.5 text-xs">
              {['All', 'Open', 'Resolved'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filter === f
                      ? 'bg-blue-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {displayedComplaints.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-500">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-sm text-slate-800">No support tickets found</p>
              <p className="text-xs text-slate-400 mt-0.5">Need help with borrowing or fees? Submit a ticket using the form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedComplaints.map(ticket => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px] font-bold">
                        #{ticket.ticketNumber}
                      </span>
                      <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {ticket.category}
                      </span>
                    </div>

                    {ticket.status === 'Resolved' ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    ) : ticket.status === 'In Progress' ? (
                      <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> In Review
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Open
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{ticket.subject}</h4>
                    <p className="text-slate-600 mt-1 leading-relaxed">{ticket.description}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Submitted on {new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {ticket.librarianResponse && (
                    <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-blue-900 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                          Librarian Response
                        </span>
                        {ticket.resolvedAt && (
                          <span className="text-[10px] font-normal text-blue-600">
                            {new Date(ticket.resolvedAt).toLocaleDateString('en-GB')}
                          </span>
                        )}
                      </div>
                      <p className="text-blue-950 leading-relaxed text-xs">
                        {ticket.librarianResponse}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
