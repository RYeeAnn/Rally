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
  const pct = owed > 0 ? Math.min(100, (paid / owed) * 100) : 0;

  const statusColors: Record<EventStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    COMPLETED: 'bg-blue-50 text-blue-700',
    ARCHIVED: 'bg-zinc-100 text-zinc-500',
  };

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
    <div className="p-8 max-w-2xl">
      <Link to="/events" className="text-sm text-zinc-400 hover:text-zinc-700 flex items-center gap-1 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </Link>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-zinc-900">{event.name}</h1>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusColors[event.status]}`}>
                {event.status}
              </span>
            </div>
            <p className="text-zinc-400 text-sm">{event.organization}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded font-medium">Player</span>
            <Link to={`/events/${event.id}/edit`} className="btn-secondary text-sm">
              Edit
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm mb-5">
          {event.location && (
            <div>
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-0.5">Location</p>
              <p className="text-zinc-700 font-medium text-xs">{event.location}</p>
            </div>
          )}
          <div>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-0.5">Type</p>
            <p className="text-zinc-700 font-medium text-xs">{event.type === 'LEAGUE' ? 'League' : 'Tournament'}</p>
          </div>
          {event.days_of_week && (
            <div>
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-0.5">Days</p>
              <p className="text-zinc-700 font-medium text-xs">{event.days_of_week}</p>
            </div>
          )}
          <div>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-0.5">Start</p>
            <p className="text-zinc-700 font-medium text-xs">
              {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {event.end_date && (
            <div>
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-0.5">End</p>
              <p className="text-zinc-700 font-medium text-xs">
                {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-700">Your payment</span>
            <PaymentStatusBadge status={event.personal_payment_status} />
          </div>

          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-semibold text-zinc-900">${paid.toFixed(2)}</span>
            <span className="text-zinc-400 text-sm">/ ${owed.toFixed(2)}</span>
          </div>

          <div className="w-full bg-zinc-200 rounded-full h-1.5 mb-3">
            <div
              className="h-1.5 rounded-full bg-zinc-800 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          {outstanding > 0 && (
            <p className="text-xs text-red-500 mb-3">${outstanding.toFixed(2)} still to pay</p>
          )}

          {outstanding > 0 && !showPaymentForm && (
            <div className="flex gap-2">
              <button onClick={handleMarkPaid} className="btn-primary text-sm">
                Mark as fully paid
              </button>
              <button
                onClick={() => { setPayMode('add'); setPayAmount(''); setShowPaymentForm(true); }}
                className="btn-secondary text-sm"
              >
                Log partial payment
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
                  <p className="text-xs text-zinc-400 mb-1.5">Set your actual total paid (replaces the current value)</p>
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
                <button type="submit" className="btn-primary text-sm" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="btn-secondary text-sm" onClick={() => setShowPaymentForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {outstanding <= 0 && paid > 0 && !showPaymentForm && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Paid in full</span>
              </div>
              <button
                onClick={handleCorrect}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Correct amount
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <span className="text-xs text-zinc-400 mr-1">Status:</span>
          {(['ACTIVE', 'COMPLETED', 'ARCHIVED'] as EventStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              disabled={event.status === s || statusChanging}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                event.status === s
                  ? `${statusColors[s]} border-transparent font-medium`
                  : 'border-zinc-200 text-zinc-400 hover:border-zinc-400'
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Danger Zone</h3>
        {deleteConfirm ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">Permanently delete this event?</span>
            <button onClick={onDelete} className="btn-danger text-sm">Delete</button>
            <button onClick={() => setDeleteConfirm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setDeleteConfirm(true)} className="text-sm text-red-500 hover:text-red-700 font-medium">
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
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !event) {
    return <div className="p-8 text-sm text-red-600">{error || 'Event not found'}</div>;
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

  const statusColors: Record<EventStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    COMPLETED: 'bg-blue-50 text-blue-700',
    ARCHIVED: 'bg-zinc-100 text-zinc-500',
  };

  return (
    <div className="p-8 max-w-3xl">

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

      <Link to="/events" className="text-sm text-zinc-400 hover:text-zinc-700 flex items-center gap-1 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[event.status]}`}>
                {event.status}
              </span>
            </div>
            <p className="text-gray-500">{event.organization}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded font-medium">Captain</span>
            <button
              onClick={() => setShowReminder(true)}
              className="btn-secondary text-sm"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Reminder
            </button>
            <Link to={`/events/${eventId}/edit`} className="btn-secondary text-sm">
              Edit
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          {event.location && (
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Location</p>
              <p className="font-medium text-gray-700">{event.location}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Type</p>
            <p className="font-medium text-gray-700">{event.type === 'LEAGUE' ? 'League' : 'Tournament'}</p>
          </div>
          {event.days_of_week && (
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Days</p>
              <p className="font-medium text-gray-700">{event.days_of_week}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Start Date</p>
            <p className="font-medium text-gray-700">
              {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {event.end_date && (
            <div>
              <p className="text-gray-400 text-xs mb-0.5">End Date</p>
              <p className="font-medium text-gray-700">
                {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        <div className="bg-zinc-50 rounded-lg p-4 mb-4 border border-zinc-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700">Collection from players</span>
            <div className="flex gap-4 text-sm">
              <span className="text-emerald-600 font-semibold">${totalCollected.toFixed(2)} collected</span>
              {outstanding > 0 && (
                <span className="text-red-500 font-semibold">${outstanding.toFixed(2)} outstanding</span>
              )}
              <span className="text-zinc-400">of ${(event.total_cost - event.captain_share).toFixed(2)}</span>
            </div>
          </div>
          <ProgressBar collected={totalCollected} total={event.total_cost - event.captain_share} showLabel={false} />
          <div className="flex items-center justify-between mt-2">
            {event.captain_share > 0 ? (
              <p className="text-[11px] text-zinc-400">
                Your share: <span className="font-medium text-zinc-600">${event.captain_share.toFixed(2)}</span>
                {' '}· Players owe: <span className="font-medium text-zinc-600">${(event.total_cost - event.captain_share).toFixed(2)}</span>
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400">No captain share set. All ${event.total_cost.toFixed(2)} split among players.</p>
            )}
            {unassigned > 0.005 && (
              <p className="text-[11px] text-amber-500">${unassigned.toFixed(2)} unassigned</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Status:</span>
          {(['ACTIVE', 'COMPLETED', 'ARCHIVED'] as EventStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={event.status === s || statusChanging}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                event.status === s
                  ? `${statusColors[s]} border-transparent font-medium`
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Players ({eventPlayers.length})
          </h2>
          <button
            onClick={() => setShowAddPlayer(true)}
            className="btn-primary text-sm"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Player
          </button>
        </div>

        {eventPlayers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No players added yet.{' '}
            <button
              onClick={() => setShowAddPlayer(true)}
              className="text-zinc-500 hover:text-zinc-800 font-medium"
            >
              Add players from your roster.
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 px-1 py-1">
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
                      className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
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

      <div className="card p-5 border-red-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Danger Zone</h3>
        {deleteConfirm ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">This will permanently delete the event and all payment history.</span>
            <button onClick={handleDeleteEvent} className="btn-danger text-sm">
              Delete
            </button>
            <button onClick={() => setDeleteConfirm(false)} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
          >
            Delete this event
          </button>
        )}
      </div>
    </div>
  );
}
