import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { Event, EventStatus } from '../types';
import EventCard from '../components/EventCard';

const STATUS_TABS: { label: string; value: EventStatus | 'ALL' }[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Archived', value: 'ARCHIVED' },
  { label: 'All', value: 'ALL' },
];

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EventStatus | 'ALL'>('ACTIVE');

  useEffect(() => {
    setLoading(true);
    const params = activeTab !== 'ALL' ? { status: activeTab } : {};
    api
      .get<Event[]>('/events', { params })
      .then(({ data }) => setEvents(data))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Your Season</p>
          <h1 className="font-display text-3xl font-bold text-zinc-900">Events</h1>
        </div>
        <Link to="/events/new" className="btn-primary mt-1">
          New Event
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#e2e0db] mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`pb-3 text-[11px] font-semibold uppercase tracking-widest transition-colors border-b-2 -mb-px ${
              activeTab === tab.value
                ? 'text-zinc-900 border-zinc-900'
                : 'text-zinc-400 border-transparent hover:text-zinc-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-5 w-5 border-2 border-zinc-900 border-t-transparent rounded-full" />
        </div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-zinc-400 text-sm">
            {activeTab === 'ACTIVE'
              ? 'No active events.'
              : `No ${activeTab.toLowerCase()} events.`}
          </p>
          {activeTab === 'ACTIVE' && (
            <Link to="/events/new" className="btn-primary inline-flex mt-4">
              Create an event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
