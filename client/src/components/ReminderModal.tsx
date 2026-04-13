import { useState } from 'react';
import { Event, EventPlayer } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  event: Event;
  eventPlayers: EventPlayer[];
  onClose: () => void;
}

export default function ReminderModal({ event, eventPlayers, onClose }: Props) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const outstanding = eventPlayers.filter(
    (ep) => ep.payment_status === 'UNPAID' || ep.payment_status === 'PARTIAL'
  );

  const lines = outstanding
    .map((ep) => {
      const balance = ep.amount_owed - ep.amount_paid;
      const suffix = ep.payment_status === 'PARTIAL' ? ' (partial)' : '';
      return `- ${ep.player?.name}: $${balance.toFixed(2)}${suffix}`;
    })
    .join('\n');

  const message =
    outstanding.length === 0
      ? `Everyone has paid for ${event.name}. Great team!`
      : `Hey team! Quick payment reminder for ${event.name}.\n\nStill outstanding:\n${lines}\n\nPlease e-transfer to ${user?.email} at your earliest convenience. Thanks and see you on the court!`;

  function handleCopy() {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-[#e2e0db] rounded w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Payment Reminder</h2>
          <button onClick={onClose} className="btn-ghost -mr-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-xs text-zinc-400 mb-3">
            {outstanding.length === 0
              ? 'Everyone is paid up.'
              : `${outstanding.length} player${outstanding.length !== 1 ? 's' : ''} outstanding. Copy and paste into WhatsApp, Instagram, or iMessage.`}
          </p>

          <div className="bg-[#f5f3ee] rounded p-4 border border-[#e2e0db]">
            <pre className="text-sm text-zinc-800 whitespace-pre-wrap font-sans leading-relaxed">
              {message}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button onClick={handleCopy} className="btn-primary">
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
