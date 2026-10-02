import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import {
  Coins,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Smartphone,
  FileText,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Fine } from '../../types';

export const FinesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { fines, payFine, systemDate } = useLibrary();

  const [payingFine, setPayingFine] = useState<Fine | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'counter'>('upi');
  const [upiId, setUpiId] = useState('student@oksbi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptModal, setReceiptModal] = useState<Fine | null>(null);

  if (!currentUser) return null;

  const myFines = fines.filter(f => f.studentId === currentUser.studentId);
  const pendingFines = myFines.filter(f => f.status === 'pending');
  const paidFines = myFines.filter(f => f.status === 'paid');

  const totalOutstanding = pendingFines.reduce((acc, curr) => acc + curr.amount, 0);

  const handleProcessPayment = () => {
    if (!payingFine) return;
    setIsProcessing(true);

    setTimeout(() => {
      payFine(payingFine.id, paymentMethod.toUpperCase());
      setIsProcessing(false);
      const updatedFine = {
        ...payingFine,
        status: 'paid' as const,
        paidDate: systemDate.toISOString(),
        paymentMethod: paymentMethod.toUpperCase(),
      };
      setPayingFine(null);
      setReceiptModal(updatedFine);
    }, 600);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-7 h-7 text-rose-600" />
            Library Fines & Dues
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparent fee tracking governed by standard college policy (₹2 per day beyond return deadline).
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 self-start sm:self-auto">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding</span>
            <span className={`text-2xl font-extrabold ${totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              ₹{totalOutstanding}
            </span>
          </div>
          {totalOutstanding > 0 && (
            <button
              onClick={() => {
                if (pendingFines.length > 0) setPayingFine(pendingFines[0]);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Pay Now
            </button>
          )}
        </div>
      </div>

      {/* Policy Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-sm">Official BVC Library Overdue Policy</p>
            <p className="text-slate-300 mt-0.5 leading-relaxed">
              Standard loan duration is 15 days. If unreturned, an automated system fine of <strong>₹2 per calendar day</strong> accumulates. Fines can be cleared online via UPI or at the library circulation cash counter.
            </p>
          </div>
        </div>
      </div>

      {/* Pending Fines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">
            Pending Overdue Fines ({pendingFines.length})
          </h3>
          {pendingFines.length === 0 && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Account Clear of Dues
            </span>
          )}
        </div>

        {pendingFines.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-sm text-slate-800">No overdue fines pending!</p>
            <p className="text-xs text-slate-500 mt-0.5">All your books have been returned or are within their standard loan period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-4">Book Details</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Days Overdue</th>
                  <th className="p-4">Daily Rate</th>
                  <th className="p-4">Calculated Fine</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingFines.map(fine => (
                  <tr key={fine.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">{fine.bookTitle}</p>
                      <p className="text-slate-400 font-mono text-[11px]">Txn: {fine.transactionId} • Book ID: {fine.bookId}</p>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {new Date(fine.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[11px]">
                        {fine.overdueDays} Days
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      ₹{fine.dailyRate}/day
                    </td>
                    <td className="p-4 font-extrabold text-rose-600 text-sm">
                      ₹{fine.amount}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setPayingFine(fine)}
                        className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Pay ₹{fine.amount}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History Table */}
      {paidFines.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">
              Payment Clearance Receipts ({paidFines.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-4">Receipt Ref</th>
                  <th className="p-4">Book Title</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Cleared Date</th>
                  <th className="p-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paidFines.map(fine => (
                  <tr key={fine.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-slate-700">
                      RCPT-{fine.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {fine.bookTitle}
                    </td>
                    <td className="p-4 font-extrabold text-emerald-700">
                      ₹{fine.amount}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                        {fine.paymentMethod || 'UPI'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {fine.paidDate ? new Date(fine.paidDate).toLocaleDateString('en-GB') : 'Recorded'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setReceiptModal(fine)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {payingFine && (
        <Modal
          isOpen={!!payingFine}
          onClose={() => setPayingFine(null)}
          title="Clear Library Fine"
          subtitle={`Payment for "${payingFine.bookTitle}" (₹${payingFine.amount})`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-700">Overdue Days: {payingFine.overdueDays || payingFine.daysOverdue || 0} days @ ₹2/day</p>
                <p className="text-slate-400 font-mono mt-0.5">Transaction: {payingFine.transactionId}</p>
              </div>
              <span className="text-2xl font-extrabold text-slate-900">
                ₹{payingFine.amount}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>UPI Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Smart Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('counter')}
                  className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === 'counter'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Desk Cash</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'upi' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-xs">Direct UPI Transfer (GPay / PhonePe / Paytm)</p>
                    <p className="text-[11px] text-slate-500 font-mono">BVC Library UPI: <strong className="text-blue-700">bvclibrary@sbi</strong></p>
                  </div>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600">
                  Verify reference with student Roll Number <strong>{currentUser?.studentId || currentUser?.rollNumber}</strong> during payment.
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-semibold text-slate-800">College RFID Smart Card</p>
                <input
                  type="text"
                  readOnly
                  value={`Card: ${currentUser.studentId} • Balance: ₹450.00`}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono"
                />
              </div>
            )}

            {paymentMethod === 'counter' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 leading-relaxed">
                Generates a provisional digital receipt. Present payment at the cash desk to stamp your book return.
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPayingFine(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Verifying Transaction...' : `PAY ₹${payingFine.amount} NOW`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <Modal
          isOpen={!!receiptModal}
          onClose={() => setReceiptModal(null)}
          title="Official Library Payment Receipt"
          subtitle="BVC Library Automated Fee Clearance"
        >
          <div className="space-y-4 text-xs">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 space-y-3 font-sans">
              <div className="text-center border-b border-slate-200 pb-3">
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  BVC COLLEGE OF ENGINEERING
                </span>
                <h4 className="font-extrabold text-base text-slate-900 mt-1">BVC LIBRARY CLEARANCE RECEIPT</h4>
                <p className="font-mono text-slate-500 text-[11px]">
                  Receipt No: RCPT-{receiptModal.id.slice(-8).toUpperCase()}
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <strong>{receiptModal.studentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Roll Number:</span>
                  <strong className="font-mono">{receiptModal.studentId}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Book Title:</span>
                  <strong className="text-right max-w-xs">{receiptModal.bookTitle}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Overdue Days:</span>
                  <strong>{receiptModal.overdueDays || receiptModal.daysOverdue || 0} Days (@ ₹2/day)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <strong>{receiptModal.paymentMethod || 'UPI'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cleared On:</span>
                  <strong>{new Date(receiptModal.paidDate || systemDate).toLocaleString('en-GB')}</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-800">Total Amount Cleared:</span>
                <span className="font-extrabold text-emerald-700 text-lg">₹{receiptModal.amount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-center"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setReceiptModal(null)}
                className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition cursor-pointer text-center"
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
