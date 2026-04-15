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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e2e0db] rounded px-3 py-2 text-sm">
        <p className="font-display font-semibold text-zinc-900">{label}</p>
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
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-5 w-5 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Stats header */}
      <div className="mb-7 sm:mb-10 pb-6 sm:pb-8 border-b border-[#e2e0db]">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">{year} Season</p>
        <p className="font-display text-4xl sm:text-5xl font-bold text-zinc-900 mb-1">
          ${totalSpent.toFixed(2)}
        </p>
        <p className="text-xs text-zinc-400">total volleyball spend</p>

        <div className="flex flex-wrap gap-6 sm:gap-10 mt-5 sm:mt-7">
          <div>
            <p className="font-display text-xl sm:text-2xl font-semibold text-zinc-900">{leagueCount}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-0.5">Leagues</p>
          </div>
          <div>
            <p className="font-display text-xl sm:text-2xl font-semibold text-zinc-900">{tournamentCount}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-0.5">Tournaments</p>
          </div>
          <div>
            <p className="font-display text-xl sm:text-2xl font-semibold text-zinc-900">${avgCost.toFixed(2)}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-0.5">Avg / Event</p>
          </div>
        </div>
      </div>

      {thisYearEvents.length === 0 ? (
        <div className="card p-10 sm:p-12 text-center">
          <p className="text-zinc-400 text-sm">No events in {year} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Monthly chart — full width on mobile, 2/3 on lg */}
          <div className="lg:col-span-2 card p-4 sm:p-6">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-4 sm:mb-5">Monthly Breakdown</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barCategoryGap="35%">
                <CartesianGrid vertical={false} stroke="#e2e0db" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#a1a1aa', fontFamily: 'DM Sans' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#a1a1aa', fontFamily: 'DM Sans' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ee' }} />
                <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.active ? '#0e1a13' : '#e2e0db'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By organization */}
          <div className="card p-4 sm:p-6">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-4 sm:mb-5">By Organization</p>
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
                        <span className="font-display font-semibold text-zinc-900 flex-shrink-0">${item.total.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-[#e2e0db] rounded-full h-1">
                        <div
                          className="h-1 bg-[#2ba572] rounded-full"
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
            <div className="p-4 sm:p-5 border-b border-[#e2e0db]">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">All Events This Year</p>
            </div>
            <div className="divide-y divide-[#e2e0db]">
              {thisYearEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-4 sm:px-5 py-3.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{e.name}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {e.organization} ·{' '}
                      {new Date(e.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wide hidden sm:inline ${
                      e.type === 'LEAGUE'
                        ? 'bg-emerald-50 text-[#2ba572]'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {e.type === 'LEAGUE' ? 'League' : 'Tournament'}
                    </span>
                    <span className="font-display text-sm font-semibold text-zinc-900">
                      ${(e.is_captain ? e.captain_share : (e.personal_amount_owed ?? 0)).toFixed(2)}
                    </span>
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
