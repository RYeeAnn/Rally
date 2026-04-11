import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { computePaymentStatus, calcAutoSplit } from '../lib/utils';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { player_id, amount_owed: customAmount } = req.body;

  if (!player_id) {
    res.status(400).json({ error: 'player_id is required' });
    return;
  }

  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
      include: { event_players: true },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const player = await prisma.player.findFirst({
      where: { id: player_id, user_id: req.user!.userId },
    });

    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const alreadyIn = event.event_players.find((ep) => ep.player_id === player_id);
    if (alreadyIn) {
      res.status(409).json({ error: 'Player is already in this event' });
      return;
    }

    const isCustom = customAmount != null;
    const newAmount = isCustom ? parseFloat(customAmount) : 0;

    const projectedPlayers = [
      ...event.event_players,
      { is_amount_custom: isCustom, amount_owed: isCustom ? newAmount : 0 },
    ];
    const autoSplit = calcAutoSplit(event.total_cost, event.captain_share, projectedPlayers);
    const newPlayerAmount = isCustom ? newAmount : autoSplit;

    await prisma.$transaction(async (tx) => {
      const nonCustomPlayers = event.event_players.filter((ep) => !ep.is_amount_custom);
      for (const ep of nonCustomPlayers) {
        await tx.eventPlayer.update({
          where: { id: ep.id },
          data: {
            amount_owed: autoSplit,
            payment_status: computePaymentStatus(ep.amount_paid, autoSplit),
          },
        });
      }

      await tx.eventPlayer.create({
        data: {
          event_id: event.id,
          player_id,
          amount_owed: newPlayerAmount,
          is_amount_custom: isCustom,
          payment_status: 'UNPAID',
        },
      });
    });

    const updatedEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: { event_players: { include: { player: true } } },
    });

    res.status(201).json(updatedEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add player to event' });
  }
});

router.delete('/:playerId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
      include: { event_players: true },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const eventPlayer = event.event_players.find(
      (ep) => ep.player_id === req.params.playerId
    );

    if (!eventPlayer) {
      res.status(404).json({ error: 'Player not in this event' });
      return;
    }

    const remaining = event.event_players.filter(
      (ep) => ep.player_id !== req.params.playerId
    );

    await prisma.$transaction(async (tx) => {
      await tx.eventPlayer.delete({ where: { id: eventPlayer.id } });

      if (remaining.length > 0) {
        const autoSplit = calcAutoSplit(event.total_cost, event.captain_share, remaining);
        const nonCustomRemaining = remaining.filter((ep) => !ep.is_amount_custom);
        for (const ep of nonCustomRemaining) {
          await tx.eventPlayer.update({
            where: { id: ep.id },
            data: {
              amount_owed: autoSplit,
              payment_status: computePaymentStatus(ep.amount_paid, autoSplit),
            },
          });
        }
      }
    });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove player from event' });
  }
});

router.patch('/:playerId', async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount_owed } = req.body;

  if (amount_owed == null || isNaN(parseFloat(amount_owed))) {
    res.status(400).json({ error: 'amount_owed is required and must be a number' });
    return;
  }

  try {
    const event = await prisma.event.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
      include: { event_players: true },
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const eventPlayer = event.event_players.find(
      (ep) => ep.player_id === req.params.playerId
    );

    if (!eventPlayer) {
      res.status(404).json({ error: 'Player not in this event' });
      return;
    }

    const newAmountOwed = parseFloat(amount_owed);

    const projectedPlayers = event.event_players.map((ep) =>
      ep.player_id === req.params.playerId
        ? { is_amount_custom: true, amount_owed: newAmountOwed }
        : { is_amount_custom: ep.is_amount_custom, amount_owed: ep.amount_owed }
    );
    const autoSplit = calcAutoSplit(event.total_cost, event.captain_share, projectedPlayers);

    await prisma.$transaction(async (tx) => {
      await tx.eventPlayer.update({
        where: { id: eventPlayer.id },
        data: {
          amount_owed: newAmountOwed,
          is_amount_custom: true,
          payment_status: computePaymentStatus(eventPlayer.amount_paid, newAmountOwed),
        },
      });

      const otherAutoPlayers = event.event_players.filter(
        (ep) => ep.player_id !== req.params.playerId && !ep.is_amount_custom
      );
      for (const ep of otherAutoPlayers) {
        await tx.eventPlayer.update({
          where: { id: ep.id },
          data: {
            amount_owed: autoSplit,
            payment_status: computePaymentStatus(ep.amount_paid, autoSplit),
          },
        });
      }
    });

    const updatedEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: { event_players: { include: { player: true } } },
    });

    res.status(200).json(updatedEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update player amount' });
  }
});

export default router;
