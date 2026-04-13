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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white border border-[#e2e0db] w-full sm:max-w-md sm:rounded flex flex-col max-h-[90vh] rounded-t-xl sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#e2e0db] flex-shrink-0">
          <h2 className="font-display font-semibold text-zinc-900 text-sm sm:text-base">Add Player to Event</h2>
          <button onClick={onClose} className="btn-ghost -mr-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3 sm:p-4 border-b border-[#e2e0db] flex-shrink-0">
          <input
            className="input"
            placeholder="Search roster…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <div className="mx-3 sm:mx-4 mt-3 bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2 rounded flex-shrink-0">
            {error}
          </div>
        )}

        <div className="overflow-y-auto py-2 flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-5 w-5 border-2 border-zinc-900 border-t-transparent rounded-full" />
            </div>
          ) : available.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-400 px-4">
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
                className="flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-[#f5f3ee] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-[#0e1a13] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#2ba572] font-display font-bold text-xs">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{player.name}</p>
                    {player.email && <p className="text-xs text-zinc-400 truncate">{player.email}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(player.id)}
                  disabled={adding === player.id}
                  className="btn-primary ml-3 flex-shrink-0"
                >
                  {adding === player.id ? 'Adding…' : 'Add'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-[#e2e0db] flex justify-between items-center flex-shrink-0">
          <Link to="/roster" className="text-xs text-zinc-400 hover:text-zinc-700">
            + Add new player to roster first
          </Link>
          <button onClick={onClose} className="btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
