// src/controllers/avsnittController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAvsnittList = async (req: Request, res: Response) => {
  const delId = parseInt(req.query.delId as string);
  if (isNaN(delId)) {
    return res.status(400).json({ error: 'Invalid delId' });
  }

  try {
    const list = await prisma.avsnitt.findMany({
      where: { delId },
    });
    res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching Avsnitt list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createAvsnitt = async (req: Request, res: Response) => {
  try {
    const { delId, kod, namn } = req.body as { delId: number; kod: string; namn: string };

    // Verificar Del
    const del = await prisma.del.findUnique({ where: { id: delId } });
    if (!del) return res.status(404).json({ error: 'Del not found' });

    const created = await prisma.avsnitt.create({
      data: { delId, kod, namn },
    });
    return res.status(201).json(created);
  } catch (error: unknown) {
    // Unique (kod, delId)
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return res.status(409).json({ message: 'AVSNITT_KOD_DUPLICATE' });
    }
    console.error('Error creating Avsnitt:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAvsnitt = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const { delId, kod, namn } = req.body as Partial<{ delId: number; kod: string; namn: string }>;
    const exists = await prisma.avsnitt.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Avsnitt not found' });

    if (delId) {
      const del = await prisma.del.findUnique({ where: { id: delId } });
      if (!del) return res.status(404).json({ error: 'Del not found' });
    }

    const updated = await prisma.avsnitt.update({
      where: { id },
      data: {
        ...(delId !== undefined ? { delId } : {}),
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
      return res.status(409).json({ message: 'AVSNITT_KOD_DUPLICATE' });
    }
    console.error('Error updating Avsnitt:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAvsnitt = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    // Evitar borrar si tiene Områden o Krav directos
    const [omr, krav] = await Promise.all([
      prisma.omrade.count({ where: { avsnittId: id } }),
      prisma.krav.count({ where: { avsnittId: id } }),
    ]);
    if (omr > 0 || krav > 0) {
      return res.status(409).json({ message: 'AVSNITT_HAS_CHILDREN' });
    }

    const exists = await prisma.avsnitt.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Avsnitt not found' });

    await prisma.avsnitt.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: unknown) {
    console.error('Error deleting Avsnitt:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
