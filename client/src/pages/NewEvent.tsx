import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { Event, EventType } from '../types';

const DAYS_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function NewEvent() {
  const navigate = useNavigate();

  const [isCaptain, setIsCaptain] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState<EventType>('LEAGUE');
  const [organization, setOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [captainShare, setCaptainShare] = useState('');
  const [personalAmountOwed, setPersonalAmountOwed] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const days_of_week =
      type === 'LEAGUE' && selectedDays.length > 0
        ? selectedDays.join(', ')
        : null;

    try {
      const { data } = await api.post<Event>('/events', {
        name,
        type,
        organization,
        location: location || null,
        total_cost: totalCost !== '' ? parseFloat(totalCost) : 0,
        captain_share: captainShare !== '' ? parseFloat(captainShare) : 0,
        start_date: startDate,
        end_date: endDate || null,
        days_of_week,
        is_captain: isCaptain,
        personal_amount_owed: !isCaptain ? parseFloat(personalAmountOwed) : undefined,
      });
      navigate(`/events/${data.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create event';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link to="/events" className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1 mb-6 uppercase tracking-widest font-semibold">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Events
      </Link>

      <h1 className="font-display text-2xl font-bold text-zinc-900 mb-6">Create New Event</h1>

      <div className="card p-6">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2.5 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="label">Your role</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCaptain(true)}
                className={`flex-1 py-3 px-4 text-sm rounded-md border transition-colors text-left ${
                  isCaptain
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-[#e2e0db] hover:border-zinc-400'
                }`}
              >
                <p className="font-medium">I'm the captain</p>
                <p className={`text-xs mt-0.5 ${isCaptain ? 'text-zinc-400' : 'text-zinc-400'}`}>
                  I paid the full cost and collect from teammates
                </p>
              </button>
              <button
                type="button"
                onClick={() => setIsCaptain(false)}
                className={`flex-1 py-3 px-4 text-sm rounded-md border transition-colors text-left ${
                  !isCaptain
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-[#e2e0db] hover:border-zinc-400'
                }`}
              >
                <p className="font-medium">I'm a player</p>
                <p className={`text-xs mt-0.5 ${!isCaptain ? 'text-zinc-400' : 'text-zinc-400'}`}>
                  I just pay my share to someone else's captain
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="label">Event Type</label>
            <div className="flex gap-3">
              {(['LEAGUE', 'TOURNAMENT'] as EventType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md border transition-colors ${
                    type === t
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-[#e2e0db] hover:border-zinc-400'
                  }`}
                >
                  {t === 'LEAGUE' ? 'League' : 'Tournament'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Event Name *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'LEAGUE' ? 'Monday Night Coed 6s' : 'Beach Classic 2024'}
              required
            />
          </div>

          <div>
            <label className="label">Organization *</label>
            <input
              className="input"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Vancouver Volleyball Club"
              required
            />
          </div>

          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Trout Lake Community Centre"
            />
          </div>

          {isCaptain ? (
            <div className="space-y-4">
              <div>
                <label className="label">Total Team Cost *</label>
                <p className="text-xs text-zinc-400 mb-1.5">The full amount you paid upfront for the whole team</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                  <input
                    className="input pl-7"
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    placeholder="1050.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Your own share</label>
                <p className="text-xs text-zinc-400 mb-1.5">
                  How much of the total is your personal slot (e.g. $175). Leave blank if you're not taking a spot or will set it later.
                  This is subtracted before splitting the rest among your players.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                  <input
                    className="input pl-7"
                    type="number"
                    min="0"
                    step="0.01"
                    value={captainShare}
                    onChange={(e) => setCaptainShare(e.target.value)}
                    placeholder="175.00"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Team Cost</label>
                <p className="text-xs text-zinc-400 mb-1.5">What the captain paid total (optional)</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                  <input
                    className="input pl-7"
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    placeholder="1050.00"
                  />
                </div>
              </div>
              <div>
                <label className="label">Your Share *</label>
                <p className="text-xs text-zinc-400 mb-1.5">What you personally owe</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                  <input
                    className="input pl-7"
                    type="number"
                    min="0"
                    step="0.01"
                    value={personalAmountOwed}
                    onChange={(e) => setPersonalAmountOwed(e.target.value)}
                    placeholder="175.00"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                className="input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                className="input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {type === 'LEAGUE' && (
            <div>
              <label className="label">Days of the Week</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OPTIONS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      selectedDays.includes(day)
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-[#e2e0db] hover:border-zinc-400'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </button>
            <Link to="/events" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
