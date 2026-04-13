import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { DashboardSummary } from '../types';
import ProgressBar from '../components/ProgressBar';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_ORDER: Record<string, number> = {
  Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6,
};

function todayDayName() {
  return DAYS[new Date().getDay()];
}

function firstDayRank(daysOfWeek: string | null): number {
  if (!daysOfWeek) return 99;
  return Math.min(...daysOfWeek.split(',').map((d) => DAY_ORDER[d.trim()] ?? 99));
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<DashboardSummary>('/dashboard/summary')
      .then(({ data }) => setSummary(data))
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="animate-spin h-5 w-5 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  const today = todayDayName();
  const todayEvents = summary?.upcoming_schedule.filter(
    (e) => e.days_of_week && e.days_of_week.includes(today)
  ) ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-7 sm:mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900">Dashboard</h1>
        </div>
        <Link to="/events/new" className="btn-primary mt-1 flex-shrink-0">
          New Event
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-7 sm:mb-10 pb-6 sm:pb-8 border-b border-[#e2e0db]">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Outstanding</p>
        <p className="font-display text-4xl sm:text-5xl font-bold text-zinc-900 mb-1">
          ${(summary?.total_owed ?? 0).toFixed(2)}
        </p>
        <p className="text-xs text-zinc-400">owed to you from active events</p>

        <div className="flex flex-wrap gap-6 sm:gap-10 mt-5 sm:mt-7">
          <div>
            <p className="font-display text-xl sm:text-2xl font-semibold text-zinc-900">
              {summary?.active_events_count ?? 0}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-0.5">Active Events</p>
          </div>
          <div>
            <p className="font-display text-xl sm:text-2xl font-semibold text-zinc-900">
              ${(summary?.collected_this_month ?? 0).toFixed(2)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-0.5">
              Collected · {new Date().toLocaleDateString('en-US', { month: 'short' })}
            </p>
          </div>
          <div>
            <p className="font-display text-xl sm:text-2xl font-semibold text-zinc-900">
              ${(summary?.spent_this_year ?? 0).toFixed(2)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-0.5">
              Spent · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
        {/* Active Events Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Active Events</p>
            <Link to="/events" className="text-[11px] text-zinc-400 hover:text-zinc-700 font-medium tracking-wide">
              View all →
            </Link>
          </div>

          {(summary?.active_events.length ?? 0) === 0 ? (
            <div className="card p-8 sm:p-10 text-center">
              <p className="text-zinc-400 text-sm">No active events.</p>
              <Link to="/events/new" className="btn-primary mt-4 inline-flex">
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {[...summary!.active_events]
                .sort((a, b) => firstDayRank(a.days_of_week) - firstDayRank(b.days_of_week))
                .map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block bg-white border border-[#e2e0db] rounded hover:border-zinc-400 transition-colors group"
                >
                  <div className="px-4 sm:px-5 py-4">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors truncate">
                          {event.name}
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{event.organization}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {event.is_captain ? (
                          <>
                            <p className="font-display text-sm font-semibold text-zinc-900">
                              ${event.total_collected.toFixed(2)}
                              <span className="text-zinc-400 font-normal"> / ${event.total_cost.toFixed(2)}</span>
                            </p>
                            {event.total_outstanding > 0 && (
                              <p className="text-[11px] text-red-500 mt-0.5">
                                ${event.total_outstanding.toFixed(2)} left
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-display text-sm font-semibold text-zinc-900">
                              ${(event.personal_amount_paid ?? 0).toFixed(2)}
                              <span className="text-zinc-400 font-normal"> / ${(event.personal_amount_owed ?? 0).toFixed(2)}</span>
                            </p>
                            {event.total_outstanding > 0 && (
                              <p className="text-[11px] text-amber-500 mt-0.5">
                                ${event.total_outstanding.toFixed(2)} you owe
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {event.days_of_week && (
                      <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-2">
                        {event.days_of_week}
                        {event.is_captain && ` · ${event.player_count} players`}
                      </p>
                    )}
                    <ProgressBar
                      collected={event.total_collected}
                      total={event.is_captain ? event.total_cost : (event.personal_amount_owed ?? 0)}
                      showLabel={false}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Today / Schedule */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-4">
            Today, {today}
          </p>
          <div className="card p-4">
            {todayEvents.length === 0 ? (
              <p className="text-xs text-zinc-400">No events today.</p>
            ) : (
              <div className="space-y-2">
                {todayEvents.map((e) => (
                  <Link
                    key={e.id}
                    to={`/events/${e.id}`}
                    className="flex items-center gap-2.5 p-2 rounded hover:bg-[#f5f3ee] transition-colors"
                  >
                    <div className="w-1 h-6 rounded-full bg-[#2ba572] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{e.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{e.organization}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {(summary?.upcoming_schedule.length ?? 0) > 0 && (
              <div className="mt-4 pt-4 border-t border-[#e2e0db]">
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-3">
                  This week
                </p>
                {summary!.upcoming_schedule.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400 min-w-[28px]">
                      {e.days_of_week?.split(',')[0]?.trim().slice(0, 3) ?? '?'}
                    </span>
                    <span className="text-[11px] text-zinc-600 truncate">{e.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
