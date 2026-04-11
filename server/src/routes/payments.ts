import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { computePaymentStatus } from '../lib/utils';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const eventPlayer = await prisma.eventPlayer.findFirst({
      where: { event_id: req.params.id, player_id: req.params.playerId },
      include: {
        player: true,
        payments: { orderBy: { date: 'desc' } },
      },
    });

    if (!eventPlayer) {
      res.status(404).json({ error: 'Player not in this event' });
      return;
    }

    res.json(eventPlayer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount, date, method, notes } = req.body;

  if (!amount || !date || !method) {
    res.status(400).json({ error: 'Amount, date, and method are required' });
    return;
  }

  if (!['CASH', 'E_TRANSFER', 'OTHER'].includes(method)) {
    res.status(400).json({ error: 'Method must be CASH, E_TRANSFER, or OTHER' });
    return;
  }

  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const eventPlayer = await prisma.eventPlayer.findFirst({
      where: { event_id: req.params.id, player_id: req.params.playerId },
    });

    if (!eventPlayer) {
      res.status(404).json({ error: 'Player not in this event' });
      return;
    }

    const paymentAmount = parseFloat(amount);

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          event_player_id: eventPlayer.id,
          amount: paymentAmount,
          date: new Date(date),
          method,
          notes: notes || null,
        },
      });

      const newAmountPaid = eventPlayer.amount_paid + paymentAmount;
      await tx.eventPlayer.update({
        where: { id: eventPlayer.id },
        data: {
          amount_paid: newAmountPaid,
          payment_status: computePaymentStatus(newAmountPaid, eventPlayer.amount_owed),
        },
      });
    });

    const updated = await prisma.eventPlayer.findUnique({
      where: { id: eventPlayer.id },
      include: {
        player: true,
        payments: { orderBy: { date: 'desc' } },
      },
    });

    res.status(201).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log payment' });
  }
});

export const deletePaymentRouter = Router();
deletePaymentRouter.use(authenticate);

deletePaymentRouter.delete('/:paymentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: { event_player: { include: { event: true } } },
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    if (payment.event_player.event.user_id !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const eventPlayer = payment.event_player;

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id: req.params.paymentId } });

      const newAmountPaid = Math.max(0, eventPlayer.amount_paid - payment.amount);
      await tx.eventPlayer.update({
        where: { id: eventPlayer.id },
        data: {
          amount_paid: newAmountPaid,
          payment_status: computePaymentStatus(newAmountPaid, eventPlayer.amount_owed),
        },
      });
    });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

export default router;
