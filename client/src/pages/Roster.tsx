import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { Player } from '../types';

export default function Roster() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    try {
      const { data } = await api.get<Player[]>('/players');
      setPlayers(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const { data } = await api.post<Player>('/players', {
        name: formName,
        email: formEmail || null,
        phone: formPhone || null,
        instagram_handle: formInstagram || null,
        notes: formNotes || null,
      });
      setPlayers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setShowForm(false);
      resetForm();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to add player';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  function resetForm() {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormInstagram('');
    setFormNotes('');
    setFormError('');
  }

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.instagram_handle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Your Network</p>
          <h1 className="font-display text-3xl font-bold text-zinc-900">Roster</h1>
          <p className="text-zinc-400 text-sm mt-1">{players.length} players</p>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          className="btn-primary mt-1"
        >
          Add Player
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          className="input max-w-sm"
          placeholder="Search by name, email, or @handle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add Player form */}
      {showForm && (
        <div className="card p-6 mb-5">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-4">New Player</p>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded mb-4">
              {formError}
            </div>
          )}
          <form onSubmit={handleAdd}>
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
                <label className="label">Instagram</label>
                <input className="input" value={formInstagram} onChange={(e) => setFormInstagram(e.target.value)} placeholder="@handle" />
              </div>
            </div>
            <div className="mb-4">
              <label className="label">Notes</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. prefers e-transfer, usually pays late…"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={formLoading}>
                {formLoading ? 'Adding…' : 'Add Player'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setShowForm(false); resetForm(); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Player list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-5 w-5 border-2 border-zinc-900 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          {search ? (
            <p className="text-zinc-400 text-sm">No players match "{search}".</p>
          ) : (
            <>
              <p className="text-zinc-400 text-sm mb-4">Your roster is empty.</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Add your first player
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-[#e2e0db]">
          {filtered.map((player) => (
            <Link
              key={player.id}
              to={`/roster/${player.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-[#f5f3ee] transition-colors"
            >
              <div className="w-9 h-9 rounded bg-[#0e1a13] flex items-center justify-center flex-shrink-0">
                <span className="text-[#2ba572] font-display font-bold text-sm">
                  {player.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 text-sm">{player.name}</p>
                <div className="flex gap-3 mt-0.5">
                  {player.email && (
                    <span className="text-xs text-zinc-400 truncate">{player.email}</span>
                  )}
                  {player.instagram_handle && (
                    <span className="text-xs text-zinc-500">{player.instagram_handle}</span>
                  )}
                  {player.phone && (
                    <span className="text-xs text-zinc-400">{player.phone}</span>
                  )}
                </div>
              </div>
              <svg className="w-3.5 h-3.5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
