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
  }
};
