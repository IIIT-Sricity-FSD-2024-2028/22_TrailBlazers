import React, { useState } from 'react';
import { X, CheckCircle2, CreditCard, QrCode, Building2, ShieldCheck, Ticket, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function PaymentModal({ event, isOpen, onClose, user, onPaymentComplete, onViewMyTickets, onExploreMore }) {
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  if (!isOpen || !event) return null;

  const isFree = Number(event.ticketPrice) === 0;
  const unitPrice = Number(event.ticketPrice);
  const subtotal = unitPrice * quantity;
  const platformFee = isFree ? 0 : Math.round(subtotal * 0.05 + 25);
  const totalAmount = subtotal + platformFee;

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= event.availableTickets) {
      setQuantity(newQty);
      setError('');
    }
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    setError('');
    setInviteError('');

    try {
      if (event.type === 'CLOSED' && !inviteCodeInput.trim()) {
        setInviteError('Please enter your unique invitation code or token to access this private event.');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('ffsd_token');
      const res = await fetch('/api/tickets/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event.id,
          quantity,
          paymentMethod,
          inviteCode: inviteCodeInput.trim(),
          invitationToken: inviteCodeInput.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (event.type === 'CLOSED' && (res.status === 403 || data.error?.toLowerCase().includes('invitation'))) {
          setInviteError(data.error || 'Invalid or unauthorized invitation code.');
        } else {
          setError(data.error || 'Failed to process registration.');
        }
        setLoading(false);
        return;
      }

      setPaymentSuccess(data);
      if (onPaymentComplete) onPaymentComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-[#26334A]">
      <div className="relative w-full max-w-lg glass-modal-light rounded-3xl shadow-2xl border border-white overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5]" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-[#26334A] hover:bg-white/80 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">

          {!paymentSuccess ? (
            <div className="space-y-6">
              
              {/* Title Section */}
              <div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Attend Event Checkout</span>
                <h2 className="text-xl font-extrabold text-[#26334A] line-clamp-1 leading-snug">{event.name}</h2>
                <p className="text-xs text-[#64748B] font-medium">Organized by {event.organizationName}</p>
              </div>

              {/* Closed Event Invite Code Section */}
              {event.type === 'CLOSED' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Personalized Invitation Code or Token Required</span>
                  </div>
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => { setInviteCodeInput(e.target.value); setInviteError(''); setError(''); }}
                    placeholder="Enter Code / Token (e.g. EXEC2026 or inv_tok_...)"
                    className="w-full px-3.5 py-2 glass-input-light rounded-xl text-sm font-mono focus:border-indigo-400 shadow-inner"
                  />
                  <p className="text-[11px] text-amber-800/80 font-medium">
                    Private event invitations are tied to your verified email ({user?.email || 'your account'}).
                  </p>
                  {inviteError && (
                    <div className="p-2.5 rounded-xl bg-rose-100/90 border border-rose-200 text-rose-800 text-xs font-semibold">
                      {inviteError}
                    </div>
                  )}
                </div>
              )}

              {/* Ticket Quantity Counter */}
              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-xs font-bold text-[#26334A]">Ticket Quantity</div>
                  <div className="text-xs text-[#64748B]">Standard Ticket • {isFree ? 'FREE' : `₹${unitPrice} each`}</div>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-[#26334A] hover:bg-slate-200 font-bold disabled:opacity-40 transition"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm w-6 text-center text-[#26334A]">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= event.availableTickets}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-[#26334A] hover:bg-slate-200 font-bold disabled:opacity-40 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dynamic Price Calculation Breakdown */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#DAF0FB]/40 border border-[#B5E1F7] text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Subtotal ({quantity} {quantity === 1 ? 'ticket' : 'tickets'})</span>
                  <span className="font-semibold text-[#26334A]">{isFree ? '₹0' : `₹${subtotal.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Platform & Processing Fee</span>
                  <span className="font-semibold text-[#26334A]">{isFree ? '₹0' : `₹${platformFee}`}</span>
                </div>
                <div className="pt-2 border-t border-[#B5E1F7] flex justify-between items-center text-sm font-extrabold text-[#26334A]">
                  <span>Total Amount</span>
                  <span className="text-base text-indigo-700">{isFree ? 'FREE' : `₹${totalAmount.toLocaleString()}`}</span>
                </div>
              </div>

              {/* Payment Method Selector (if paid) */}
              {!isFree && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#26334A] uppercase tracking-wider">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        paymentMethod === 'UPI'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-[#64748B] hover:border-slate-300'
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs">UPI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        paymentMethod === 'CARD'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-[#64748B] hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs">Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('NET_BANKING')}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                        paymentMethod === 'NET_BANKING'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-[#64748B] hover:border-slate-300'
                      }`}
                    >
                      <Building2 className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs">Net Banking</span>
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleProcessPayment}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#26334A] text-white font-extrabold text-sm hover:bg-slate-800 transition shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>{isFree ? 'Confirm Free Registration' : `Pay ₹${totalAmount.toLocaleString()}`}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          ) : (
            
            /* Payment Success Screen with Soft Mint Background Glow */
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-sm animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase">Registration Confirmed</span>
                <h3 className="text-2xl font-extrabold text-[#26334A]">Payment Successful</h3>
                <p className="text-xs text-[#64748B] mt-1">Your ticket for <strong>{event.name}</strong> is ready.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#E8F9F5]/70 border border-[#C7F3EA] text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#64748B]">Ticket ID</span>
                  <span className="font-mono font-bold text-[#26334A] bg-white px-2 py-0.5 rounded border border-slate-200">
                    {paymentSuccess.ticket.ticketNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#64748B]">Transaction ID</span>
                  <span className="font-mono text-slate-700">{paymentSuccess.payment.transactionId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#64748B]">Tickets Reserved</span>
                  <span className="font-bold text-[#26334A]">{paymentSuccess.ticket.quantity}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-[#C7F3EA]">
                  <span className="text-[#64748B] font-bold">Total Paid</span>
                  <span className="font-extrabold text-indigo-700">₹{paymentSuccess.payment.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => { onClose(); onViewMyTickets(); }}
                  className="w-full py-3 px-4 rounded-xl bg-[#26334A] text-white font-bold text-sm hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4 text-white" />
                  View My Tickets
                </button>

                <button
                  onClick={() => { onClose(); onExploreMore(); }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-[#26334A] border border-slate-200 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Explore More Events
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
