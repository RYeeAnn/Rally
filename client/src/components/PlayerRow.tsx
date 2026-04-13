import { EventPlayer } from '../types';
import PaymentStatusBadge from './PaymentStatusBadge';

interface Props {
  eventPlayer: EventPlayer;
  onLogPayment: (eventPlayer: EventPlayer) => void;
  onRemove?: (playerId: string) => void;
  onEditAmount?: (eventPlayer: EventPlayer) => void;
}

export default function PlayerRow({ eventPlayer, onLogPayment, onRemove, onEditAmount }: Props) {
  const { player, amount_owed, amount_paid, payment_status } = eventPlayer;
  const outstanding = Math.max(0, amount_owed - amount_paid);

  return (
    <div className="flex items-center justify-between py-3 px-3 sm:px-4 hover:bg-[#f5f3ee] rounded transition-colors">
      {/* Avatar + info */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        <div className="w-7 h-7 rounded bg-[#0e1a13] flex items-center justify-center flex-shrink-0">
          <span className="text-[#2ba572] font-display font-bold text-xs">
            {player?.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">{player?.name}</p>
          <p className="text-xs text-zinc-400">
            ${amount_paid.toFixed(2)} paid
            {outstanding > 0 && (
              <span className="text-red-500 ml-1">· ${outstanding.toFixed(2)} left</span>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1 ml-2 flex-shrink-0">
        <PaymentStatusBadge status={payment_status} size="sm" />

        {payment_status !== 'PAID' && (
          <button
            onClick={() => onLogPayment(eventPlayer)}
            className="btn-ghost text-xs ml-0.5 sm:ml-1"
          >
            Log
          </button>
        )}

        {onEditAmount && (
          <button
            onClick={() => onEditAmount(eventPlayer)}
            className="btn-ghost"
            title="Edit amount owed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {onRemove && (
          <button
            onClick={() => onRemove(eventPlayer.player_id)}
            className="btn-ghost text-zinc-300 hover:text-red-500"
            title="Remove from event"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
