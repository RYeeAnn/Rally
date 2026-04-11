import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { Player } from '../types';

export default function AddPlayerModal({
  eventId,
  existingPlayerIds,
  onClose,
  onAdded,
}: {
  eventId: string;
  existingPlayerIds: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [roster, setRoster] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Player[]>('/players').then(({ data }) => setRoster(data)).finally(() => setLoading(false));
  }, []);

  const available = roster
    .filter((p) => !existingPlayerIds.includes(p.id))
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
    );

  async function handleAdd(playerId: string) {
    setError('');
    setAdding(playerId);
    try {
      await api.post(`/events/${eventId}/players`, { player_id: playerId });
      onAdded();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to add player';
      setError(msg);
      setAdding(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Player to Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <input
            className="input"
            placeholder="Search roster..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="max-h-72 overflow-y-auto py-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full" />
            </div>
          ) : available.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              {roster.length === 0
                ? 'No players in your roster yet.'
                : search
                ? 'No players match your search.'
                : 'All players are already in this event.'}
            </div>
          ) : (
            available.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                    <span className="text-zinc-700 text-sm font-semibold">
                      {player.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{player.name}</p>
                    {player.email && <p className="text-xs text-gray-500">{player.email}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(player.id)}
                  disabled={adding === player.id}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  {adding === player.id ? 'Adding...' : 'Add'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <Link to="/roster" className="text-sm text-zinc-500 hover:text-zinc-800">
            + Add new player to roster first
          </Link>
          <button onClick={onClose} className="btn-secondary text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
