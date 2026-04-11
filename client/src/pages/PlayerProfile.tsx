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

  // Edit form
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
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!player) {
    return <div className="p-8 text-gray-500">Player not found.</div>;
  }

  const eventPlayers = player.event_players ?? [];

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <Link to="/roster" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Roster
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        {editing ? (
          <>
            <h2 className="font-semibold text-gray-900 mb-4">Edit Player</h2>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
                {formError}
              </div>
            )}
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-2 gap-4 mb-4">
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
                  <label className="label">Instagram Handle</label>
                  <input className="input" value={formInstagram} onChange={(e) => setFormInstagram(e.target.value)} placeholder="@handle" />
                </div>
              </div>
              <div className="mb-4">
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-700 font-bold text-xl">
                  {player.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{player.name}</h1>
                <div className="space-y-1 mt-1">
                  {player.email && <p className="text-sm text-gray-600">{player.email}</p>}
                  {player.phone && <p className="text-sm text-gray-600">{player.phone}</p>}
                  {player.instagram_handle && (
                    <p className="text-sm text-indigo-500">{player.instagram_handle}</p>
                  )}
                  {player.notes && (
                    <p className="text-sm text-gray-400 italic mt-2">{player.notes}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5">
                Edit
              </button>
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Are you sure?</span>
                  <button onClick={handleDelete} className="btn-danger text-xs px-3 py-1.5">
                    Delete
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} className="btn-secondary text-xs px-3 py-1.5">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirm(true)} className="btn-secondary text-xs px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50">
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Event History */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Event History ({eventPlayers.length})
      </h2>

      {eventPlayers.length === 0 ? (
        <div className="card p-8 text-center text-gray-500 text-sm">
          This player hasn't been added to any events yet.
        </div>
      ) : (
        <div className="space-y-3">
          {eventPlayers.map((ep) => {
            const payments = ep.payments ?? [];
            const outstanding = Math.max(0, ep.amount_owed - ep.amount_paid);
            return (
              <div key={ep.id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Link
                      to={`/events/${ep.event_id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {ep.event?.name}
                    </Link>
                    <p className="text-sm text-gray-500">{ep.event?.organization}</p>
                  </div>
                  <PaymentStatusBadge status={ep.payment_status} />
                </div>

                <div className="flex gap-4 text-sm text-gray-600 mb-3">
                  <span>Owed: <strong>${ep.amount_owed.toFixed(2)}</strong></span>
                  <span>Paid: <strong className="text-green-600">${ep.amount_paid.toFixed(2)}</strong></span>
                  {outstanding > 0 && (
                    <span className="text-red-500">Outstanding: <strong>${outstanding.toFixed(2)}</strong></span>
                  )}
                </div>

                {payments.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Payment history</p>
                    <div className="space-y-1.5">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-xs text-gray-600">
                          <span>{new Date(p.date).toLocaleDateString()} · {p.method.replace('_', ' ')}</span>
                          <span className="font-medium text-green-600">+${p.amount.toFixed(2)}</span>
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
