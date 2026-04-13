import api from '../lib/axios';
import { EventPlayer } from '../types';

export default function PaymentHistoryModal({
  eventPlayer,
  onClose,
  onDeleted,
}: {
  eventPlayer: EventPlayer;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const payments = eventPlayer.payments ?? [];

  async function handleDelete(paymentId: string) {
    try {
      await api.delete(`/payments/${paymentId}`);
      onDeleted();
      onClose();
    } catch {
      alert('Failed to delete payment');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white border border-[#e2e0db] rounded w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e2e0db]">
          <h2 className="font-display font-semibold text-zinc-900">
            Payment History — {eventPlayer.player?.name}
          </h2>
          <button onClick={onClose} className="btn-ghost -mr-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="bg-[#f5f3ee] border border-[#e2e0db] rounded p-3 mb-4 flex justify-between text-sm">
            <span className="text-zinc-500">Total Paid</span>
            <span className="font-display font-semibold text-[#2ba572]">${eventPlayer.amount_paid.toFixed(2)}</span>
          </div>

          {payments.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm py-6">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded border border-[#e2e0db] hover:bg-[#f5f3ee] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      ${p.amount.toFixed(2)}{' '}
                      <span className="text-zinc-400 font-normal">
                        via {p.method.replace('_', '-')}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(p.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                      {p.notes && ` · ${p.notes}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="btn-ghost text-zinc-300 hover:text-red-500 ml-3"
                    title="Delete payment"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-[#e2e0db]">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}
