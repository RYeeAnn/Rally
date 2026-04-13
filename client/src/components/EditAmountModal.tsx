import { useState, FormEvent } from 'react';
import api from '../lib/axios';
import { EventPlayer } from '../types';

export default function EditAmountModal({
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
  const [amount, setAmount] = useState(String(eventPlayer.amount_owed));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.patch(`/events/${eventId}/players/${eventPlayer.player_id}`, {
        amount_owed: parseFloat(amount),
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to update amount';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white border border-[#e2e0db] rounded w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e2e0db]">
          <h2 className="font-display font-semibold text-zinc-900">
            Edit Amount — {eventPlayer.player?.name}
          </h2>
          <button onClick={onClose} className="btn-ghost -mr-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2 rounded">
              {error}
            </div>
          )}
          <p className="text-xs text-zinc-400">
            Setting a custom amount will lock this player's share. Other players' auto-split amounts won't be affected.
          </p>
          <div>
            <label className="label">Amount Owed *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
              <input
                className="input pl-7"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
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
