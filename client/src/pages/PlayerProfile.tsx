import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Player } from '../types';
import PaymentStatusBadge from '../components/PaymentStatusBadge';

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    api
      .get<Player>(`/players/${playerId}`)
      .then(({ data }) => {
        setPlayer(data);
        setFormName(data.name);
        setFormEmail(data.email ?? '');
        setFormPhone(data.phone ?? '');
        setFormInstagram(data.instagram_handle ?? '');
        setFormNotes(data.notes ?? '');
      })
      .finally(() => setLoading(false));
  }, [playerId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const { data } = await api.put<Player>(`/players/${playerId}`, {
        name: formName,
        email: formEmail || null,
        phone: formPhone || null,
        instagram_handle: formInstagram || null,
        notes: formNotes || null,
      });
      setPlayer((prev) => ({ ...prev!, ...data }));
      setEditing(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to update';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/players/${playerId}`);
      navigate('/roster');
    } catch {
      alert('Failed to delete player');
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-5 w-5 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!player) {
    return <div className="p-6 text-zinc-400 text-sm">Player not found.</div>;
  }

  const eventPlayers = player.event_players ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      {/* Back */}
      <Link to="/roster" className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1 mb-6 uppercase tracking-widest font-semibold">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Roster
      </Link>

      {/* Header card */}
      <div className="card p-4 sm:p-6 mb-6">
        {editing ? (
          <>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-4">Edit Player</p>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-4">
                {formError}
              </div>
            )}
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">Name *</label>
                  <input className="input" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                </div>
                <div>
                  <label className="label">Instagram</label>
                  <input className="input" value={formInstagram} onChange={(e) => setFormInstagram(e.target.value)} placeholder="@handle" />
                </div>
              </div>
              <div className="mb-4">
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-[#0e1a13] flex items-center justify-center flex-shrink-0">
                <span className="text-[#2ba572] font-display font-bold text-xl sm:text-2xl">
                  {player.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-lg sm:text-xl font-bold text-zinc-900">{player.name}</h1>
                <div className="space-y-0.5 mt-1.5">
                  {player.email && <p className="text-sm text-zinc-500 break-all">{player.email}</p>}
                  {player.phone && <p className="text-sm text-zinc-500">{player.phone}</p>}
                  {player.instagram_handle && (
                    <p className="text-sm text-zinc-600 font-medium">{player.instagram_handle}</p>
                  )}
                  {player.notes && (
                    <p className="text-sm text-zinc-400 italic mt-2">{player.notes}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
              <button onClick={() => setEditing(true)} className="btn-secondary">
                Edit
              </button>
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Sure?</span>
                  <button onClick={handleDelete} className="btn-danger">Delete</button>
                  <button onClick={() => setDeleteConfirm(false)} className="btn-secondary">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="btn-secondary text-red-500 border-red-100 hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Event History */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
          Event History
        </p>
        <span className="text-xs text-zinc-400">{eventPlayers.length} events</span>
      </div>

      {eventPlayers.length === 0 ? (
        <div className="card p-8 text-center text-zinc-400 text-sm">
          Not added to any events yet.
        </div>
      ) : (
        <div className="space-y-2">
          {eventPlayers.map((ep) => {
            const payments = ep.payments ?? [];
            const outstanding = Math.max(0, ep.amount_owed - ep.amount_paid);
            return (
              <div key={ep.id} className="card p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/events/${ep.event_id}`}
                      className="font-display font-semibold text-zinc-900 hover:text-zinc-600 transition-colors text-sm"
                    >
                      {ep.event?.name}
                    </Link>
                    <p className="text-xs text-zinc-400 mt-0.5">{ep.event?.organization}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <PaymentStatusBadge status={ep.payment_status} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 sm:gap-5 text-xs text-zinc-500 mb-3">
                  <span>Owed <strong className="text-zinc-800">${ep.amount_owed.toFixed(2)}</strong></span>
                  <span>Paid <strong className="text-[#2ba572]">${ep.amount_paid.toFixed(2)}</strong></span>
                  {outstanding > 0 && (
                    <span className="text-red-500">Left <strong>${outstanding.toFixed(2)}</strong></span>
                  )}
                </div>

                {payments.length > 0 && (
                  <div className="border-t border-[#e2e0db] pt-3">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">Payment History</p>
                    <div className="space-y-1.5">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs text-zinc-500">
                          <span>{new Date(p.date).toLocaleDateString()} · {p.method.replace('_', ' ')}</span>
                          <span className="font-semibold text-[#2ba572]">+${p.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
