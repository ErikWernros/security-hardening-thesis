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
