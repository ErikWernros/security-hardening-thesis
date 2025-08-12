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
