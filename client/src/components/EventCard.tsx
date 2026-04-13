import { Link } from 'react-router-dom';
import { Event } from '../types';
import ProgressBar from './ProgressBar';

interface Props {
  event: Event & {
    total_collected?: number;
  };
}

export default function EventCard({ event }: Props) {
  const players = event.event_players ?? [];

  return (
    <Link
      to={`/events/${event.id}`}
      className="block bg-white border border-[#e2e0db] rounded hover:border-zinc-400 transition-colors group"
    >
      <div className="p-5">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-display font-semibold text-zinc-900 text-sm group-hover:text-zinc-600 transition-colors leading-snug">
            {event.name}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">{event.organization}</p>
        </div>

        {event.days_of_week && (
          <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-3">{event.days_of_week}</p>
        )}

        {event.is_captain ? (
          <CaptainView event={event} players={players} />
        ) : (
          <PlayerView event={event} />
        )}
      </div>
    </Link>
  );
}

function CaptainView({
  event,
  players,
}: {
  event: Props['event'];
  players: NonNullable<Event['event_players']>;
}) {
  const collected =
    event.total_collected ?? players.reduce((sum, ep) => sum + ep.amount_paid, 0);
  const totalOwed = players.reduce((sum, ep) => sum + ep.amount_owed, 0);
  const unpaidCount = players.filter((p) => p.payment_status === 'UNPAID').length;
  const partialCount = players.filter((p) => p.payment_status === 'PARTIAL').length;

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-zinc-400">
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </span>
        <span className="font-display text-sm font-semibold text-zinc-900">
          ${event.total_cost.toFixed(2)}
        </span>
      </div>

      <ProgressBar collected={collected} total={totalOwed} />

      {(unpaidCount > 0 || partialCount > 0) && (
        <div className="mt-3 flex gap-1.5">
          {unpaidCount > 0 && (
            <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-sm">
              {unpaidCount} unpaid
            </span>
          )}
          {partialCount > 0 && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm">
              {partialCount} partial
            </span>
          )}
        </div>
      )}
    </>
  );
}

function PlayerView({ event }: { event: Props['event'] }) {
  const owed = event.personal_amount_owed ?? 0;
  const paid = event.personal_amount_paid ?? 0;
  const status = event.personal_payment_status;

  const statusStyles = {
    PAID: 'text-[#2ba572] bg-emerald-50',
    PARTIAL: 'text-amber-600 bg-amber-50',
    UNPAID: 'text-red-500 bg-red-50',
  };

  const statusLabel = {
    PAID: 'Paid',
    PARTIAL: 'Partial',
    UNPAID: 'Unpaid',
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-zinc-400">Your share</span>
        <span className="font-display text-sm font-semibold text-zinc-900">${owed.toFixed(2)}</span>
      </div>

      <ProgressBar collected={paid} total={owed} label="paid" />

      <div className="mt-3">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${statusStyles[status]}`}>
          {statusLabel[status]}
        </span>
      </div>
    </>
  );
}
