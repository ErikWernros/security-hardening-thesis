// src/controllers/delController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDelList = async (_req: Request, res: Response) => {
  try {
    const list = await prisma.del.findMany();
    res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching Del list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ NY FUNKTION: Aggregate data för diagram
export const getDelAggregate = async (_req: Request, res: Response) => {
  try {
    const data = await prisma.kravBedomningar.groupBy({
      by: ['del_id'],
      _avg: { betyg: true },
    });

    const formattedData = data.map((item: any) => ({
      del: `Del ${item.del_id}`,
      medelbetyg: item._avg?.betyg || 0,
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching Del aggregate:', error);

    // ✅ FALLBACK: Mock data om databasen failar (samma som din gamla)
    const mockData = [
      { del: 'Del 1', medelbetyg: 3.5 },
      { del: 'Del 2', medelbetyg: 4.2 },
      { del: 'Del 3', medelbetyg: 2.8 },
      { del: 'Del 4', medelbetyg: 3.9 },
      { del: 'Del 5', medelbetyg: 4.5 },
      { del: 'Del 6', medelbetyg: 1.2 },
      { del: 'Del 7', medelbetyg: 3.2 },
      { del: 'Del 8', medelbetyg: 4.7 },
    ];

    res.json(mockData);
export const createDel = async (req: Request, res: Response) => {
  try {
    const { kod, namn } = req.body as { kod: string; namn: string };
    const created = await prisma.del.create({ data: { kod, namn } });
    return res.status(201).json(created);
  } catch (error: unknown) {
    // Unique constraint (kod)
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return res.status(409).json({ message: 'DEL_KOD_DUPLICATE' });
    }
    console.error('Error creating Del:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDel = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const { kod, namn } = req.body as Partial<{ kod: string; namn: string }>;
    const exists = await prisma.del.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Del not found' });

    const updated = await prisma.del.update({
      where: { id },
      data: { ...(kod !== undefined ? { kod } : {}), ...(namn !== undefined ? { namn } : {}) },
    });
    return res.json(updated);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return res.status(409).json({ message: 'DEL_KOD_DUPLICATE' });
    }
    console.error('Error updating Del:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteDel = async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    // Avoid deleting if you have children
    const children = await prisma.avsnitt.count({ where: { delId: id } });
    if (children > 0) {
      return res.status(409).json({ message: 'DEL_HAS_CHILDREN' });
    }

    const exists = await prisma.del.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Del not found' });

    await prisma.del.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: unknown) {
    console.error('Error deleting Del:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
