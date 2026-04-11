import { Router, Response } from 'express';
import { EventStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { computePaymentStatus, calcAutoSplit } from '../lib/utils';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query;

  try {
    const events = await prisma.event.findMany({
      where: {
        user_id: req.user!.userId,
        ...(status ? { status: status as EventStatus } : {}),
      },
      include: {
        event_players: {
          include: { player: true },
        },
      },
      orderBy: { start_date: 'desc' },
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    name, type, organization, location, total_cost,
    start_date, end_date, days_of_week,
    is_captain, personal_amount_owed, captain_share,
  } = req.body;

  const isCaptain = is_captain !== false && is_captain !== 'false';

  if (!name || !type || !organization || !start_date || (isCaptain && total_cost == null)) {
    res.status(400).json({ error: 'Name, type, organization, and start_date are required' });
    return;
  }

  if (!['LEAGUE', 'TOURNAMENT'].includes(type)) {
    res.status(400).json({ error: 'Type must be LEAGUE or TOURNAMENT' });
    return;
  }

  if (!isCaptain && personal_amount_owed == null) {
    res.status(400).json({ error: 'personal_amount_owed is required when you are not the captain' });
    return;
  }

  try {
    const event = await prisma.event.create({
      data: {
        user_id: req.user!.userId,
        name,
        type,
        organization,
        location: location || null,
        total_cost: total_cost != null ? parseFloat(total_cost) : 0,
        captain_share: isCaptain && captain_share != null ? parseFloat(captain_share) : 0,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        days_of_week: days_of_week || null,
        is_captain: isCaptain,
        personal_amount_owed: !isCaptain ? parseFloat(personal_amount_owed) : null,
      },
    });
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
      include: {
        event_players: {
          include: {
            player: true,
            payments: { orderBy: { date: 'desc' } },
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (event.is_captain) {
      event.event_players.sort((a, b) => {
        const order: Record<string, number> = { UNPAID: 0, PARTIAL: 1, PAID: 2 };
        return order[a.payment_status] - order[b.payment_status];
      });
    }

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    name, type, organization, location, total_cost,
    start_date, end_date, days_of_week, personal_amount_owed, captain_share,
  } = req.body;

  if (!name || !type || !organization || total_cost == null || !start_date) {
    res.status(400).json({ error: 'Name, type, organization, total_cost, and start_date are required' });
    return;
  }

  try {
    const existing = await prisma.event.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
      include: { event_players: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const newTotalCost = parseFloat(total_cost);
    const newCaptainShare = existing.is_captain && captain_share != null
      ? parseFloat(captain_share)
      : existing.captain_share;

    const costChanged = newTotalCost !== existing.total_cost || newCaptainShare !== existing.captain_share;

    const event = await prisma.$transaction(async (tx) => {
      if (costChanged && existing.event_players.length > 0) {
        const autoPlayers = existing.event_players.filter((ep) => !ep.is_amount_custom);
        if (autoPlayers.length > 0) {
          const newAutoSplit = calcAutoSplit(newTotalCost, newCaptainShare, existing.event_players);
          for (const ep of autoPlayers) {
            await tx.eventPlayer.update({
              where: { id: ep.id },
              data: {
                amount_owed: newAutoSplit,
                payment_status: computePaymentStatus(ep.amount_paid, newAutoSplit),
              },
            });
          }
        }
      }

      return tx.event.update({
        where: { id: req.params.id },
        data: {
          name,
          type,
          organization,
          location: location || null,
          total_cost: newTotalCost,
          captain_share: newCaptainShare,
          start_date: new Date(start_date),
          end_date: end_date ? new Date(end_date) : null,
          days_of_week: days_of_week || null,
          personal_amount_owed: !existing.is_captain && personal_amount_owed != null
            ? parseFloat(personal_amount_owed)
            : existing.personal_amount_owed,
        },
      });
    });

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.event.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body;

  if (!['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(status)) {
    res.status(400).json({ error: 'Status must be ACTIVE, COMPLETED, or ARCHIVED' });
    return;
  }

  try {
    const existing = await prisma.event.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

router.patch('/:id/my-payment', async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount_paid, total_paid } = req.body;

  const hasIncrement = amount_paid != null && !isNaN(parseFloat(amount_paid));
  const hasTotal = total_paid != null && !isNaN(parseFloat(total_paid));

  if (!hasIncrement && !hasTotal) {
    res.status(400).json({ error: 'amount_paid or total_paid is required' });
    return;
  }

  try {
    const existing = await prisma.event.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (existing.is_captain) {
      res.status(400).json({ error: 'Use the payments API for captain events' });
      return;
    }

    const owed = existing.personal_amount_owed ?? 0;
    const newPaid = hasTotal
      ? parseFloat(total_paid)
      : existing.personal_amount_paid + parseFloat(amount_paid);

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        personal_amount_paid: newPaid,
        personal_payment_status: computePaymentStatus(newPaid, owed),
      },
    });

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update personal payment' });
  }
});

export default router;
