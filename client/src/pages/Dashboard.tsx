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

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="card p-5">
      <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? 'text-zinc-900' : 'text-zinc-900'}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
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
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-sm text-red-600">{error}</div>;
  }

  const today = todayDayName();
  const todayEvents = summary?.upcoming_schedule.filter(
    (e) => e.days_of_week && e.days_of_week.includes(today)
  ) ?? [];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/events/new" className="btn-primary">
          New Event
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Owed to you"
          value={`$${(summary?.total_owed ?? 0).toFixed(2)}`}
          sub="from your captain events"
        />
        <StatCard
          label="Active events"
          value={String(summary?.active_events_count ?? 0)}
        />
        <StatCard
          label="Collected this month"
          value={`$${(summary?.collected_this_month ?? 0).toFixed(2)}`}
          sub={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        />
        <StatCard
          label="Spent this year"
          value={`$${(summary?.spent_this_year ?? 0).toFixed(2)}`}
          sub={String(new Date().getFullYear())}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Events Feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">Active Events</h2>
            <Link to="/events" className="text-xs text-zinc-400 hover:text-zinc-700 font-medium">
              View all →
            </Link>
          </div>

          {(summary?.active_events.length ?? 0) === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-zinc-400 text-sm">No active events.</p>
              <Link to="/events/new" className="btn-primary mt-4 inline-flex">
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[...summary!.active_events]
                .sort((a, b) => firstDayRank(a.days_of_week) - firstDayRank(b.days_of_week))
                .map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="card px-5 py-4 hover:border-zinc-300 transition-colors block group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-medium text-zinc-900 group-hover:text-zinc-600 transition-colors">
                          {event.name}
                        </h3>
                        <span className="text-[10px] bg-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded font-medium">
                          {event.is_captain ? 'Captain' : 'Player'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{event.organization}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      {event.is_captain ? (
                        <>
                          <p className="text-sm font-medium text-zinc-900">
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
                          <p className="text-sm font-medium text-zinc-900">
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
                    <p className="text-[11px] text-zinc-400 mb-2">
                      {event.days_of_week}
                      {event.is_captain && ` · ${event.player_count} players`}
                    </p>
                  )}
                  <ProgressBar
                    collected={event.total_collected}
                    total={event.is_captain ? event.total_cost : (event.personal_amount_owed ?? 0)}
                    showLabel={false}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Schedule */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Today, {today}</h2>
          <div className="card p-4">
            {todayEvents.length === 0 ? (
              <p className="text-xs text-zinc-400">No events today.</p>
            ) : (
              <div className="space-y-2">
                {todayEvents.map((e) => (
                  <Link
                    key={e.id}
                    to={`/events/${e.id}`}
                    className="flex items-center gap-2.5 p-2 rounded-md hover:bg-zinc-50 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-zinc-900">{e.name}</p>
                      <p className="text-[11px] text-zinc-400">{e.organization}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {(summary?.upcoming_schedule.length ?? 0) > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-[11px] text-zinc-400 font-medium mb-2 uppercase tracking-wider">
                  This week
                </p>
                {summary!.upcoming_schedule.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] text-zinc-400 min-w-[36px]">
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
