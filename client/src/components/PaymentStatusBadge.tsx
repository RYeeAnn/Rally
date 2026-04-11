import { PaymentStatus } from '../types';

interface Props {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

// Intentionally muted, no bright blobs
const config: Record<PaymentStatus, { label: string; classes: string }> = {
  UNPAID: { label: 'Unpaid', classes: 'bg-red-50 text-red-600 border border-red-100' },
  PARTIAL: { label: 'Partial', classes: 'bg-amber-50 text-amber-600 border border-amber-100' },
  PAID: { label: 'Paid', classes: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
};

export default function PaymentStatusBadge({ status, size = 'md' }: Props) {
  const { label, classes } = config[status];
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded ${sizeClasses} ${classes}`}>
      {label}
    </span>
  );
}
