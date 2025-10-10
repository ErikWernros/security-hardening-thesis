// src/controllers/styckeController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * GET /api/stycke/:id/parents
 * Devuelve omradeId, avsnittId y delId navegando Stycke → Omrade → Avsnitt → Del
 */
export const getStyckeParents = async (req: Request, res: Response) => {
  const styckeId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(styckeId)) {
    return res.status(400).json({ error: 'Invalid styckeId' });
  }

  try {
    const stycke = await prisma.stycke.findUnique({
      where: { id: styckeId },
      include: {
        omrade: {
          include: {
            avsnitt: {
              include: {
                del: true,
              },
            },
          },
        },
      },
    });

    if (!stycke?.omrade?.avsnitt) {
      return res.status(404).json({ error: 'Stycke not found' });
    }

    return res.json({
      omradeId: stycke.omrade.id,
      avsnittId: stycke.omrade.avsnitt.id,
      delId: stycke.omrade.avsnitt.del.id,
    });
  } catch (error) {
    console.error('Error fetching stycke parents:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/stycke?omradeId=...
 * Lista los Stycke que pertenecen a un Område
 */
export const getStyckeListByOmrade = async (req: Request, res: Response) => {
  const omradeId = Number.parseInt(req.query.omradeId as string, 10);
  if (Number.isNaN(omradeId)) {
    return res.status(400).json({ error: 'Invalid omradeId' });
  }

  try {
    const stycken = await prisma.stycke.findMany({
      where: { omradeId },
      select: {
        id: true,
        kod: true,
        namn: true,
        omradeId: true,
      },
      orderBy: { id: 'asc' },
    });

    return res.json(stycken);
  } catch (error) {
    console.error('Error fetching stycke list by omrade:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createStycke = async (req: Request, res: Response) => {
  try {
    const { omradeId, kod, namn } = req.body as { omradeId: number; kod: string; namn: string };

    const omrade = await prisma.omrade.findUnique({ where: { id: omradeId } });
    if (!omrade) return res.status(404).json({ error: 'Omrade not found' });

    const created = await prisma.stycke.create({
      data: { omradeId, kod, namn },
    });
    return res.status(201).json(created);
  } catch (error: unknown) {
    // Unique (kod, omradeId)
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return res.status(409).json({ message: 'STYCKE_KOD_DUPLICATE' });
    }
    console.error('Error creating Stycke:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateStycke = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const { omradeId, kod, namn } = req.body as Partial<{
      omradeId: number;
      kod: string;
      namn: string;
    }>;

    const exists = await prisma.stycke.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Stycke not found' });

    if (omradeId) {
      const omrade = await prisma.omrade.findUnique({ where: { id: omradeId } });
      if (!omrade) return res.status(404).json({ error: 'Omrade not found' });
    }

    const updated = await prisma.stycke.update({
      where: { id },
      data: {
        ...(omradeId !== undefined ? { omradeId } : {}),
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
      return res.status(409).json({ message: 'STYCKE_KOD_DUPLICATE' });
    }
    console.error('Error updating Stycke:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteStycke = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    // Evitar borrar si tiene Krav
    const krav = await prisma.krav.count({ where: { styckeId: id } });
    if (krav > 0) {
      return res.status(409).json({ message: 'STYCKE_HAS_CHILDREN' });
    }

    const exists = await prisma.stycke.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Stycke not found' });

    await prisma.stycke.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: unknown) {
    console.error('Error deleting Stycke:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
