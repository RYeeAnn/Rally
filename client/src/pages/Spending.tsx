import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Event } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildMonthlyData(events: Event[]) {
  const monthly: Record<number, number> = {};
  for (let i = 0; i < 12; i++) monthly[i] = 0;

  for (const e of events) {
    const month = new Date(e.start_date).getMonth();
    const cost = e.is_captain ? e.captain_share : (e.personal_amount_owed ?? 0);
    monthly[month] = (monthly[month] ?? 0) + cost;
  }

  return MONTHS.map((name, i) => ({
    month: name,
    amount: Math.round(monthly[i] * 100) / 100,
    active: monthly[i] > 0,
  }));
}

function buildOrgData(events: Event[]) {
  const byOrg: Record<string, number> = {};
  for (const e of events) {
    const cost = e.is_captain ? e.captain_share : (e.personal_amount_owed ?? 0);
    byOrg[e.organization] = (byOrg[e.organization] ?? 0) + cost;
  }
  return Object.entries(byOrg)
    .map(([org, total]) => ({ org, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-semibold text-zinc-900">{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 shadow-sm text-sm">
        <p className="font-medium text-zinc-900">{label}</p>
        <p className="text-zinc-500">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
}

export default function Spending() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    api.get<Event[]>('/events').then(({ data }) => setEvents(data)).finally(() => setLoading(false));
  }, []);

  const thisYearEvents = events.filter(
    (e) => new Date(e.start_date).getFullYear() === year
  );

  const totalSpent = thisYearEvents.reduce(
    (s, e) => s + (e.is_captain ? e.captain_share : (e.personal_amount_owed ?? 0)),
    0
  );
  const leagueCount = thisYearEvents.filter((e) => e.type === 'LEAGUE').length;
  const tournamentCount = thisYearEvents.filter((e) => e.type === 'TOURNAMENT').length;
  const avgCost = thisYearEvents.length > 0 ? totalSpent / thisYearEvents.length : 0;

  const monthlyData = buildMonthlyData(thisYearEvents);
  const orgData = buildOrgData(thisYearEvents);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Personal Spending</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Your volleyball expenses for {year}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Spent"
          value={`$${totalSpent.toFixed(2)}`}
          sub={`${year}`}
        />
        <StatCard
          label="Leagues"
          value={String(leagueCount)}
          sub={leagueCount === 1 ? 'league' : 'leagues'}
        />
        <StatCard
          label="Tournaments"
          value={String(tournamentCount)}
          sub={tournamentCount === 1 ? 'tournament' : 'tournaments'}
        />
        <StatCard
          label="Avg per Event"
          value={`$${avgCost.toFixed(2)}`}
          sub={`across ${thisYearEvents.length} events`}
        />
      </div>

      {thisYearEvents.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-zinc-500 text-sm">No events in {year} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly chart */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-5">Monthly Breakdown</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barCategoryGap="35%">
                <CartesianGrid vertical={false} stroke="#f4f4f5" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5' }} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.active ? '#18181b' : '#e4e4e7'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By organization */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-5">By Organization</h2>
            {orgData.length === 0 ? (
              <p className="text-zinc-400 text-sm">No data yet.</p>
            ) : (
              <div className="space-y-4">
                {orgData.map((item) => {
                  const pct = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
                  return (
                    <div key={item.org}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-zinc-700 font-medium truncate mr-2">{item.org}</span>
                        <span className="text-zinc-500 flex-shrink-0">${item.total.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 bg-zinc-800 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Event list */}
          <div className="lg:col-span-3 card">
            <div className="p-5 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">All Events This Year</h2>
            </div>
            <div className="divide-y divide-zinc-50">
              {thisYearEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{e.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {e.organization} ·{' '}
                      {new Date(e.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      e.type === 'LEAGUE' ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {e.type === 'LEAGUE' ? 'League' : 'Tournament'}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900">${(e.is_captain ? e.captain_share : (e.personal_amount_owed ?? 0)).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
