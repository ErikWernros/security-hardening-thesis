import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// GET /api/stycke/:id/parents
export const getStyckeParents = async (req: Request, res: Response) => {
  const styckeId = parseInt(req.params.id);

  if (isNaN(styckeId)) {
    return res.status(400).json({ error: 'Invalid styckeId' });
  }

  try {
    const stycke = await prisma.stycke.findUnique({
      where: { id: styckeId },
      include: {
        avsnitt: {
          select: {
            id: true,
            delId: true,
          },
        },
      },
    });

    if (!stycke) {
      return res.status(404).json({ error: 'Stycke not found' });
    }

    return res.json({
      avsnittId: stycke.avsnitt.id,
      delId: stycke.avsnitt.delId,
    });
  } catch (error) {
    console.error('Error fetching stycke parents:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/stycke?avsnittId=...
export const getStyckeListByAvsnitt = async (req: Request, res: Response) => {
  const avsnittId = parseInt(req.query.avsnittId as string);

  if (isNaN(avsnittId)) {
    return res.status(400).json({ error: 'Invalid avsnittId' });
  }

  try {
    const stycken = await prisma.stycke.findMany({
      where: { avsnittId },
      select: { id: true, kod: true, namn: true },
    });

    res.json(stycken);
  } catch (error) {
    console.error('Error fetching stycke list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
