// src/controllers/omradeController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * GET /api/omrade/:id/parents
 * Returns avsnittId and delId by traversing Omrade -> Avsnitt -> Del
 */
export const getOmradeParents = async (req: Request, res: Response) => {
  const omradeId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(omradeId)) {
    return res.status(400).json({ error: 'Invalid omradeId' });
  }

  try {
    const omrade = await prisma.omrade.findUnique({
      where: { id: omradeId },
      include: {
        avsnitt: true, // include full Avsnitt to access delId
      },
    });

    if (!omrade || !omrade.avsnitt) {
      return res.status(404).json({ error: 'Område not found' });
    }

    return res.json({
      avsnittId: omrade.avsnitt.id,
      delId: omrade.avsnitt.delId,
    });
  } catch (error) {
    // Keep logs in English for ops consistency

    console.error('Error fetching omrade parents:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/omrade?avsnittId=...
 * Lists Områden that belong to an Avsnitt
 */
export const getOmradeListByAvsnitt = async (req: Request, res: Response) => {
  const avsnittId = Number.parseInt(req.query.avsnittId as string, 10);
  if (Number.isNaN(avsnittId)) {
    return res.status(400).json({ error: 'Invalid avsnittId' });
  }

  try {
    const omraden = await prisma.omrade.findMany({
      where: { avsnittId },
      select: {
        id: true,
        kod: true,
        namn: true,
        avsnittId: true,
      },
      orderBy: [{ kod: 'asc' }],
    });

    return res.json(omraden);
  } catch (error) {
    console.error('Error fetching omrade list by avsnitt:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/omrade?delId=...
 * (Optional utility) Lists Områden by Del via the Avsnitt relation
 * This is handy when the left tree selection is at the Del level.
 */
export const getOmradeListByDel = async (req: Request, res: Response) => {
  const delId = Number.parseInt(req.query.delId as string, 10);
  if (Number.isNaN(delId)) {
    return res.status(400).json({ error: 'Invalid delId' });
  }

  try {
    const omraden = await prisma.omrade.findMany({
      where: { avsnitt: { delId } },
      select: {
        id: true,
        kod: true,
        namn: true,
        avsnittId: true,
      },
      orderBy: [{ kod: 'asc' }],
    });

    return res.json(omraden);
  } catch (error) {
    console.error('Error fetching omrade list by del:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createOmrade = async (req: Request, res: Response) => {
  try {
    const { avsnittId, kod, namn } = req.body as { avsnittId: number; kod: string; namn: string };

    const avsnitt = await prisma.avsnitt.findUnique({ where: { id: avsnittId } });
    if (!avsnitt) return res.status(404).json({ error: 'Avsnitt not found' });

    const created = await prisma.omrade.create({
      data: { avsnittId, kod, namn },
    });
    return res.status(201).json(created);
  } catch (error: unknown) {
    // Unique (kod, avsnittId)
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return res.status(409).json({ message: 'OMRADE_KOD_DUPLICATE' });
    }
    console.error('Error creating Omrade:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOmrade = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const { avsnittId, kod, namn } = req.body as Partial<{
      avsnittId: number;
      kod: string;
      namn: string;
    }>;

    const exists = await prisma.omrade.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Omrade not found' });

    if (avsnittId) {
      const avsnitt = await prisma.avsnitt.findUnique({ where: { id: avsnittId } });
      if (!avsnitt) return res.status(404).json({ error: 'Avsnitt not found' });
    }

    const updated = await prisma.omrade.update({
      where: { id },
      data: {
        ...(avsnittId !== undefined ? { avsnittId } : {}),
        ...(kod !== undefined ? { kod } : {}),
        ...(namn !== undefined ? { namn } : {}),
      },
    });
    return res.json(updated);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return res.status(409).json({ message: 'OMRADE_KOD_DUPLICATE' });
    }
    console.error('Error updating Omrade:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteOmrade = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    // Evitar borrar si tiene Stycke o Krav directos
    const [styckes, krav] = await Promise.all([
      prisma.stycke.count({ where: { omradeId: id } }),
      prisma.krav.count({ where: { omradeId: id } }),
    ]);
    if (styckes > 0 || krav > 0) {
      return res.status(409).json({ message: 'OMRADE_HAS_CHILDREN' });
    }

    const exists = await prisma.omrade.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Omrade not found' });

    await prisma.omrade.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: unknown) {
    console.error('Error deleting Omrade:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
