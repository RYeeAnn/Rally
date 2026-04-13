import { PaymentStatus } from '../types';

interface Props {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

const config: Record<PaymentStatus, { label: string; classes: string }> = {
  UNPAID: { label: 'Unpaid', classes: 'bg-red-50 text-red-600 border border-red-100' },
  PARTIAL: { label: 'Partial', classes: 'bg-amber-50 text-amber-600 border border-amber-100' },
  PAID: { label: 'Paid', classes: 'bg-emerald-50 text-[#2ba572] border border-emerald-100' },
};

export default function PaymentStatusBadge({ status, size = 'md' }: Props) {
  const { label, classes } = config[status];
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';

  return (
    <span className={`inline-flex items-center font-semibold rounded-sm ${sizeClasses} ${classes}`}>
      {label}
    </span>
  );
}
