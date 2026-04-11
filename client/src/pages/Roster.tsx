import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { Player } from '../types';

export default function Roster() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form state
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roster</h1>
          <p className="text-gray-500 text-sm mt-0.5">{players.length} players in your network</p>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Player
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          className="input max-w-sm"
          placeholder="Search by name, email, or @handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add Player form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Player</h3>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
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
                <label className="label">Instagram Handle</label>
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
                placeholder="e.g. prefers e-transfer, usually pays late..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={formLoading}>
                {formLoading ? 'Adding...' : 'Add Player'}
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
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          {search ? (
            <p className="text-gray-500">No players match "{search}".</p>
          ) : (
            <>
              <p className="text-gray-500 mb-4">Your roster is empty.</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Add your first player
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {filtered.map((player) => (
            <Link
              key={player.id}
              to={`/roster/${player.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-700 font-semibold">
                  {player.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{player.name}</p>
                <div className="flex gap-3 mt-0.5">
                  {player.email && (
                    <span className="text-xs text-gray-500 truncate">{player.email}</span>
                  )}
                  {player.instagram_handle && (
                    <span className="text-xs text-indigo-500">{player.instagram_handle}</span>
                  )}
                  {player.phone && (
                    <span className="text-xs text-gray-500">{player.phone}</span>
                  )}
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
