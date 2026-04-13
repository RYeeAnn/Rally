import { useState, FormEvent } from 'react';
import api from '../lib/axios';
import { EventPlayer, PaymentMethod } from '../types';

export default function LogPaymentModal({
  eventPlayer,
  eventId,
  onClose,
  onSaved,
}: {
  eventPlayer: EventPlayer;
  eventId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>('E_TRANSFER');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const remaining = Math.max(0, eventPlayer.amount_owed - eventPlayer.amount_paid);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post(
        `/events/${eventId}/players/${eventPlayer.player_id}/payments`,
        { amount: parseFloat(amount), date, method, notes: notes || null }
      );
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to log payment';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white border border-[#e2e0db] w-full sm:max-w-md flex flex-col max-h-[90vh] rounded-t-xl sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#e2e0db] flex-shrink-0">
          <h2 className="font-display font-semibold text-zinc-900 text-sm sm:text-base truncate pr-2">
            Log Payment — {eventPlayer.player?.name}
          </h2>
          <button onClick={onClose} className="btn-ghost -mr-2 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="bg-[#f5f3ee] border border-[#e2e0db] rounded p-3 flex justify-between text-sm">
            <span className="text-zinc-500">Outstanding balance</span>
            <span className="font-display font-semibold text-red-600">${remaining.toFixed(2)}</span>
          </div>

          <div>
            <label className="label">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
              <input
                className="input pl-7"
                type="number"
                min="0.01"
                step="0.01"
                max={remaining || undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={remaining.toFixed(2)}
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="label">Date *</label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Method *</label>
            <select
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              <option value="E_TRANSFER">E-Transfer</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="paid at the gym on Monday…"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Logging…' : 'Log Payment'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
