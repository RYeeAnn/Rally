import { PaymentStatus } from '@prisma/client';

export function computePaymentStatus(amount_paid: number, amount_owed: number): PaymentStatus {
  if (amount_paid <= 0) return 'UNPAID';
  if (amount_paid >= amount_owed) return 'PAID';
  return 'PARTIAL';
}

export function calcAutoSplit(
  totalCost: number,
  captainShare: number,
  players: { is_amount_custom: boolean; amount_owed: number }[]
): number {
  const customTotal = players
    .filter((p) => p.is_amount_custom)
    .reduce((s, p) => s + p.amount_owed, 0);
  const autoCount = players.filter((p) => !p.is_amount_custom).length;
  if (autoCount === 0) return 0;
  return (totalCost - captainShare - customTotal) / autoCount;
}
