import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/players
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const players = await prisma.player.findMany({
      where: { user_id: req.user!.userId },
      orderBy: { name: 'asc' },
    });
    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// POST /api/players
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, phone, instagram_handle, notes } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Player name is required' });
    return;
  }

  try {
    const player = await prisma.player.create({
      data: {
        user_id: req.user!.userId,
        name,
        email: email || null,
        phone: phone || null,
        instagram_handle: instagram_handle || null,
        notes: notes || null,
      },
    });
    res.status(201).json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// GET /api/players/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const player = await prisma.player.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
      include: {
        event_players: {
          include: {
            event: true,
            payments: { orderBy: { date: 'desc' } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// PUT /api/players/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, phone, instagram_handle, notes } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Player name is required' });
    return;
  }

  try {
    const existing = await prisma.player.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        instagram_handle: instagram_handle || null,
        notes: notes || null,
      },
    });

    res.json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// DELETE /api/players/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.player.findFirst({
      where: { id: req.params.id, user_id: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    await prisma.player.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

export default router;
