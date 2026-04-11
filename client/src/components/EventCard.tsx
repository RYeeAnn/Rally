import { Link } from 'react-router-dom';
import { Event, PaymentStatus } from '../types';
import ProgressBar from './ProgressBar';

interface Props {
  event: Event & {
    total_collected?: number;
  };
}

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PAID: 'text-green-600 bg-green-50',
  PARTIAL: 'text-amber-500 bg-amber-50',
  UNPAID: 'text-red-500 bg-red-50',
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  UNPAID: 'Unpaid',
};

export default function EventCard({ event }: Props) {
  const players = event.event_players ?? [];

  return (
    <Link
      to={`/events/${event.id}`}
      className="card p-5 hover:border-zinc-300 transition-colors block group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1 mr-3">
          <h3 className="font-medium text-zinc-900 text-sm group-hover:text-zinc-600 transition-colors">
            {event.name}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">{event.organization}</p>
        </div>
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 flex-shrink-0">
          {event.type === 'LEAGUE' ? 'League' : 'Tournament'}
        </span>
      </div>

      {event.days_of_week && (
        <p className="text-xs text-zinc-400 mb-3">{event.days_of_week}</p>
      )}

      {event.is_captain ? (
        <CaptainView event={event} players={players} />
      ) : (
        <PlayerView event={event} />
      )}
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
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
        <span>{players.length} {players.length === 1 ? 'player' : 'players'}</span>
        <span className="font-medium text-zinc-600">${event.total_cost.toFixed(2)}</span>
      </div>

      <ProgressBar collected={collected} total={totalOwed} />

      {(unpaidCount > 0 || partialCount > 0) && (
        <div className="mt-3 flex gap-1.5">
          {unpaidCount > 0 && (
            <span className="text-[11px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
              {unpaidCount} unpaid
            </span>
          )}
          {partialCount > 0 && (
            <span className="text-[11px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
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

  return (
    <>
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
        <span>Your share</span>
        <span className="font-medium text-zinc-600">${owed.toFixed(2)}</span>
      </div>

      <ProgressBar collected={paid} total={owed} label="paid" />

      <div className="mt-3">
        <span className={`text-[11px] px-1.5 py-0.5 rounded ${PAYMENT_STATUS_STYLES[status]}`}>
          {PAYMENT_STATUS_LABEL[status]}
        </span>
      </div>
    </>
  );
}
