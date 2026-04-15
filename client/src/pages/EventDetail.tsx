import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Event, EventPlayer, EventStatus } from '../types';
import PaymentStatusBadge from '../components/PaymentStatusBadge';
import ProgressBar from '../components/ProgressBar';
import ReminderModal from '../components/ReminderModal';
import PlayerRow from '../components/PlayerRow';
import LogPaymentModal from '../components/LogPaymentModal';
import EditAmountModal from '../components/EditAmountModal';
import AddPlayerModal from '../components/AddPlayerModal';
import PaymentHistoryModal from '../components/PaymentHistoryModal';

const statusConfig: Record<EventStatus, { label: string; classes: string }> = {
  ACTIVE: { label: 'Active', classes: 'bg-[#0e1a13] text-[#2ba572]' },
  COMPLETED: { label: 'Completed', classes: 'bg-zinc-100 text-zinc-600' },
  ARCHIVED: { label: 'Archived', classes: 'bg-zinc-50 text-zinc-400' },
};

function NonCaptainEventDetail({
  event,
  onRefresh,
  onDelete,
  onStatusChange,
  statusChanging,
  deleteConfirm,
  setDeleteConfirm,
}: {
  event: Event;
  onRefresh: () => void;
  onDelete: () => void;
  onStatusChange: (s: EventStatus) => void;
  statusChanging: boolean;
  deleteConfirm: boolean;
  setDeleteConfirm: (v: boolean) => void;
}) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payMode, setPayMode] = useState<'add' | 'correct'>('add');
  const [payAmount, setPayAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [payError, setPayError] = useState('');

  const owed = event.personal_amount_owed ?? 0;
  const paid = event.personal_amount_paid;
  const outstanding = Math.max(0, owed - paid);

  async function handleLogPayment(e: FormEvent) {
    e.preventDefault();
    setPayError('');
    setSaving(true);
    try {
      const body = payMode === 'correct'
        ? { total_paid: parseFloat(payAmount) }
        : { amount_paid: parseFloat(payAmount) };
      await api.patch(`/events/${event.id}/my-payment`, body);
      onRefresh();
      setShowPaymentForm(false);
      setPayAmount('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to update payment';
      setPayError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleMarkPaid() {
    setPayMode('add');
    setPayAmount(String(outstanding));
    setShowPaymentForm(true);
  }

  function handleCorrect() {
    setPayMode('correct');
    setPayAmount(String(paid));
    setShowPaymentForm(true);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <Link to="/events" className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1 mb-6 uppercase tracking-widest font-semibold">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Events
      </Link>

      <div className="card p-4 sm:p-6 mb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-lg sm:text-xl font-bold text-zinc-900">{event.name}</h1>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide flex-shrink-0 ${statusConfig[event.status].classes}`}>
                {statusConfig[event.status].label}
              </span>
            </div>
            <p className="text-zinc-400 text-sm truncate">{event.organization}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] uppercase tracking-widest font-semibold bg-zinc-100 text-zinc-500 px-2 py-1 rounded-sm hidden sm:inline">Player</span>
            <Link to={`/events/${event.id}/edit`} className="btn-secondary">Edit</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-sm mb-5">
          {event.location && (
            <div>
              <p className="label">Location</p>
              <p className="text-zinc-700 text-xs font-medium">{event.location}</p>
            </div>
          )}
          <div>
            <p className="label">Type</p>
            <p className="text-zinc-700 text-xs font-medium">{event.type === 'LEAGUE' ? 'League' : 'Tournament'}</p>
          </div>
          {event.days_of_week && (
            <div>
              <p className="label">Days</p>
              <p className="text-zinc-700 text-xs font-medium">{event.days_of_week}</p>
            </div>
          )}
          <div>
            <p className="label">Start</p>
            <p className="text-zinc-700 text-xs font-medium">
              {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {event.end_date && (
            <div>
              <p className="label">End</p>
              <p className="text-zinc-700 text-xs font-medium">
                {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#f5f3ee] rounded p-4 border border-[#e2e0db]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-600">Your payment</span>
            <PaymentStatusBadge status={event.personal_payment_status} />
          </div>

          <div className="flex items-baseline gap-1 mb-3">
            <span className="font-display text-2xl font-bold text-zinc-900">${paid.toFixed(2)}</span>
            <span className="text-zinc-400 text-sm">/ ${owed.toFixed(2)}</span>
          </div>

          <ProgressBar collected={paid} total={owed} showLabel={false} />

          {outstanding > 0 && (
            <p className="text-xs text-red-500 mt-2 mb-3">${outstanding.toFixed(2)} still to pay</p>
          )}

          {outstanding > 0 && !showPaymentForm && (
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={handleMarkPaid} className="btn-primary">
                Mark fully paid
              </button>
              <button
                onClick={() => { setPayMode('add'); setPayAmount(''); setShowPaymentForm(true); }}
                className="btn-secondary"
              >
                Log partial
              </button>
            </div>
          )}

          {showPaymentForm && (
            <form onSubmit={handleLogPayment} className="mt-3 space-y-3">
              {payError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">{payError}</p>
              )}
              <div>
                <label className="label">
                  {payMode === 'correct' ? 'Correct total paid' : 'Amount paid now'}
                </label>
                {payMode === 'correct' && (
                  <p className="text-xs text-zinc-400 mb-1.5">Replaces the current total paid value</p>
                )}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                  <input
                    className="input pl-7"
                    type="number"
                    min="0"
                    step="0.01"
                    max={payMode === 'add' ? outstanding : undefined}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {outstanding <= 0 && paid > 0 && !showPaymentForm && (
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-[#2ba572]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Paid in full</span>
              </div>
              <button onClick={handleCorrect} className="text-xs text-zinc-400 hover:text-zinc-600">
                Correct amount
              </button>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mr-1">Status</span>
          {(['ACTIVE', 'COMPLETED', 'ARCHIVED'] as EventStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              disabled={event.status === s || statusChanging}
              className={`text-[10px] px-2.5 py-1 rounded-sm border transition-colors uppercase tracking-wide font-semibold ${
                event.status === s
                  ? `${statusConfig[s].classes} border-transparent`
                  : 'border-[#e2e0db] text-zinc-400 hover:border-zinc-400'
              }`}
            >
              {statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-3">Danger Zone</p>
        {deleteConfirm ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-500">Permanently delete this event?</span>
            <button onClick={onDelete} className="btn-danger">Delete</button>
            <button onClick={() => setDeleteConfirm(false)} className="btn-secondary">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setDeleteConfirm(true)} className="text-xs text-red-500 hover:text-red-700 font-semibold uppercase tracking-widest">
            Delete this event
          </button>
        )}
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [logPaymentTarget, setLogPaymentTarget] = useState<EventPlayer | null>(null);
  const [editAmountTarget, setEditAmountTarget] = useState<EventPlayer | null>(null);
  const [historyTarget, setHistoryTarget] = useState<EventPlayer | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  async function fetchEvent() {
    try {
      const { data } = await api.get<Event>(`/events/${eventId}`);
      setEvent(data);
    } catch {
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  async function handleRemovePlayer(playerId: string) {
    if (!confirm('Remove this player from the event?')) return;
    try {
      await api.delete(`/events/${eventId}/players/${playerId}`);
      fetchEvent();
    } catch {
      alert('Failed to remove player');
    }
  }

  async function handleStatusChange(newStatus: EventStatus) {
    setStatusChanging(true);
    try {
      await api.patch(`/events/${eventId}/status`, { status: newStatus });
      fetchEvent();
    } catch {
      alert('Failed to update status');
    } finally {
      setStatusChanging(false);
    }
  }

  async function handleDeleteEvent() {
    try {
      await api.delete(`/events/${eventId}`);
      navigate('/events');
    } catch {
      alert('Failed to delete event');
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-5 w-5 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !event) {
    return <div className="p-6 text-sm text-red-600">{error || 'Event not found'}</div>;
  }

  if (!event.is_captain) {
    return (
      <NonCaptainEventDetail
        event={event}
        onRefresh={fetchEvent}
        onDelete={handleDeleteEvent}
        onStatusChange={handleStatusChange}
        statusChanging={statusChanging}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
      />
    );
  }

  const eventPlayers = event.event_players ?? [];
  const totalCollected = eventPlayers.reduce((s, ep) => s + ep.amount_paid, 0);
  const totalOwed = eventPlayers.reduce((s, ep) => s + ep.amount_owed, 0);
  const outstanding = Math.max(0, event.total_cost - event.captain_share - totalCollected);
  const unassigned = Math.max(0, event.total_cost - event.captain_share - totalOwed);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {logPaymentTarget && (
        <LogPaymentModal
          eventPlayer={logPaymentTarget}
          eventId={eventId!}
          onClose={() => setLogPaymentTarget(null)}
          onSaved={fetchEvent}
        />
      )}
      {editAmountTarget && (
        <EditAmountModal
          eventPlayer={editAmountTarget}
          eventId={eventId!}
          onClose={() => setEditAmountTarget(null)}
          onSaved={fetchEvent}
        />
      )}
      {historyTarget && (
        <PaymentHistoryModal
          eventPlayer={historyTarget}
          onClose={() => setHistoryTarget(null)}
          onDeleted={fetchEvent}
        />
      )}
      {showAddPlayer && (
        <AddPlayerModal
          eventId={eventId!}
          existingPlayerIds={eventPlayers.map((ep) => ep.player_id)}
          onClose={() => setShowAddPlayer(false)}
          onAdded={fetchEvent}
        />
      )}
      {showReminder && (
        <ReminderModal
          event={event}
          eventPlayers={eventPlayers}
          onClose={() => setShowReminder(false)}
        />
      )}

      <Link to="/events" className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1 mb-6 uppercase tracking-widest font-semibold">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Events
      </Link>

      {/* Event info card */}
      <div className="card p-4 sm:p-6 mb-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-zinc-900">{event.name}</h1>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide flex-shrink-0 ${statusConfig[event.status].classes}`}>
                {statusConfig[event.status].label}
              </span>
            </div>
            <p className="text-zinc-400 text-sm truncate">{event.organization}</p>
          </div>

          {/* Action buttons — stack to wrap on small screens */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0 justify-end">
            <span className="text-[10px] uppercase tracking-widest font-semibold bg-zinc-100 text-zinc-500 px-2 py-1 rounded-sm hidden sm:inline">Captain</span>
            <button onClick={() => setShowReminder(true)} className="btn-secondary">
              Reminder
            </button>
            <Link to={`/events/${eventId}/edit`} className="btn-secondary">Edit</Link>
          </div>
        </div>

        {/* Event meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
          {event.location && (
            <div>
              <p className="label">Location</p>
              <p className="text-zinc-700 text-xs font-medium">{event.location}</p>
            </div>
          )}
          <div>
            <p className="label">Type</p>
            <p className="text-zinc-700 text-xs font-medium">{event.type === 'LEAGUE' ? 'League' : 'Tournament'}</p>
          </div>
          {event.days_of_week && (
            <div>
              <p className="label">Days</p>
              <p className="text-zinc-700 text-xs font-medium">{event.days_of_week}</p>
            </div>
          )}
          <div>
            <p className="label">Start Date</p>
            <p className="text-zinc-700 text-xs font-medium">
              {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {event.end_date && (
            <div>
              <p className="label">End Date</p>
              <p className="text-zinc-700 text-xs font-medium">
                {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {/* Collection summary */}
        <div className="bg-[#f5f3ee] rounded p-4 mb-4 border border-[#e2e0db]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-zinc-600">Collection from players</span>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs">
              <span className="text-[#2ba572] font-semibold font-display">${totalCollected.toFixed(2)} collected</span>
              {outstanding > 0 && (
                <span className="text-red-500 font-semibold font-display">${outstanding.toFixed(2)} outstanding</span>
              )}
              <span className="text-zinc-400 font-display">of ${(event.total_cost - event.captain_share).toFixed(2)}</span>
            </div>
          </div>
          <ProgressBar collected={totalCollected} total={event.total_cost - event.captain_share} showLabel={false} />
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            {event.captain_share > 0 ? (
              <p className="text-[11px] text-zinc-400">
                Your share: <span className="font-medium text-zinc-600">${event.captain_share.toFixed(2)}</span>
                {' '}· Players owe: <span className="font-medium text-zinc-600">${(event.total_cost - event.captain_share).toFixed(2)}</span>
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400">No captain share. All ${event.total_cost.toFixed(2)} split among players.</p>
            )}
            {unassigned > 0.005 && (
              <p className="text-[11px] text-amber-600">${unassigned.toFixed(2)} unassigned</p>
            )}
          </div>
        </div>

        {/* Status buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mr-1">Status</span>
          {(['ACTIVE', 'COMPLETED', 'ARCHIVED'] as EventStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={event.status === s || statusChanging}
              className={`text-[10px] px-2.5 py-1 rounded-sm border transition-colors uppercase tracking-wide font-semibold ${
                event.status === s
                  ? `${statusConfig[s].classes} border-transparent`
                  : 'border-[#e2e0db] text-zinc-400 hover:border-zinc-400'
              }`}
            >
              {statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Players card */}
      <div className="card mb-6">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#e2e0db]">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            Players ({eventPlayers.length})
          </p>
          <button onClick={() => setShowAddPlayer(true)} className="btn-primary">
            Add Player
          </button>
        </div>

        {eventPlayers.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            No players added yet.{' '}
            <button
              onClick={() => setShowAddPlayer(true)}
              className="text-zinc-600 hover:text-zinc-900 font-medium"
            >
              Add from your roster.
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#e2e0db] px-1 py-1">
            {eventPlayers.map((ep) => (
              <div key={ep.id} className="group">
                <PlayerRow
                  eventPlayer={ep}
                  onLogPayment={setLogPaymentTarget}
                  onRemove={handleRemovePlayer}
                  onEditAmount={setEditAmountTarget}
                />
                {(ep.payments?.length ?? 0) > 0 && (
                  <div className="px-4 pb-2 -mt-1">
                    <button
                      onClick={() => setHistoryTarget(ep)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      View {ep.payments?.length} payment{ep.payments?.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="card p-4 sm:p-5">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-3">Danger Zone</p>
        {deleteConfirm ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-500">This will permanently delete the event and all payment history.</span>
            <button onClick={handleDeleteEvent} className="btn-danger">Delete</button>
            <button onClick={() => setDeleteConfirm(false)} className="btn-secondary">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="text-xs text-red-500 hover:text-red-700 font-semibold uppercase tracking-widest"
          >
            Delete this event
          </button>
        )}
      </div>
    </div>
  );
}
