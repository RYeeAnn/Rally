import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [activeEvents, paymentsThisMonth, allEventsThisYear] = await Promise.all([
      prisma.event.findMany({
        where: { user_id: userId, status: 'ACTIVE' },
        include: { event_players: true },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          date: { gte: startOfMonth },
          event_player: { event: { user_id: userId } },
        },
      }),
      prisma.event.findMany({
        where: {
          user_id: userId,
          start_date: { gte: startOfYear },
          status: { not: 'ARCHIVED' },
        },
      }),
    ]);

    let total_owed = 0;
    for (const event of activeEvents) {
      if (!event.is_captain) continue;
      for (const ep of event.event_players) {
        const outstanding = ep.amount_owed - ep.amount_paid;
        if (outstanding > 0) total_owed += outstanding;
      }
    }

    let spent_this_year = 0;
    for (const e of allEventsThisYear) {
      spent_this_year += e.is_captain ? e.captain_share : (e.personal_amount_owed ?? 0);
    }

    res.json({
      total_owed: Math.round(total_owed * 100) / 100,
      active_events_count: activeEvents.length,
      collected_this_month: paymentsThisMonth._sum.amount ?? 0,
      spent_this_year: Math.round(spent_this_year * 100) / 100,
      active_events: activeEvents.map((e) => {
        if (e.is_captain) {
          const totalCollected = e.event_players.reduce((s, ep) => s + ep.amount_paid, 0);
          const totalOwed = e.event_players.reduce((s, ep) => s + ep.amount_owed, 0);
          return {
            id: e.id,
            name: e.name,
            organization: e.organization,
            days_of_week: e.days_of_week,
            total_cost: e.total_cost,
            captain_share: e.captain_share,
            is_captain: true,
            total_collected: Math.round(totalCollected * 100) / 100,
            total_outstanding: Math.round(Math.max(0, totalOwed - totalCollected) * 100) / 100,
            player_count: e.event_players.length,
          };
        } else {
          const owed = e.personal_amount_owed ?? 0;
          return {
            id: e.id,
            name: e.name,
            organization: e.organization,
            days_of_week: e.days_of_week,
            total_cost: e.total_cost,
            captain_share: e.captain_share,
            is_captain: false,
            personal_amount_owed: owed,
            personal_amount_paid: e.personal_amount_paid,
            personal_payment_status: e.personal_payment_status,
            total_collected: e.personal_amount_paid,
            total_outstanding: Math.max(0, owed - e.personal_amount_paid),
            player_count: 0,
          };
        }
      }),
      upcoming_schedule: activeEvents
        .filter((e) => {
          const started = e.start_date <= now;
          const notEnded = !e.end_date || e.end_date >= now;
          return e.days_of_week && started && notEnded;
        })
        .map((e) => ({
          id: e.id,
          name: e.name,
          days_of_week: e.days_of_week,
          organization: e.organization,
          is_captain: e.is_captain,
        })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

export default router;
