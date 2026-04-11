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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <Link to="/events/new" className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full" />
        </div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-4">
            {activeTab === 'ACTIVE'
              ? 'No active events.'
              : `No ${activeTab.toLowerCase()} events.`}
          </p>
          {activeTab === 'ACTIVE' && (
            <Link to="/events/new" className="btn-primary inline-flex">
              Create an event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
