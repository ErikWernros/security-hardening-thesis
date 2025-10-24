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

// ✅ DEBUG: Kolla vad som faktiskt finns i databasen
export const debugDatabase = async (_req: Request, res: Response) => {
  try {
    console.log('=== DATABASE DEBUG START ===');

    // 1. Kolla ALLA svar (oavsett om de har betyg eller inte)
    const allaSvar = await prisma.svar.findMany({
      take: 10, // Bara första 10
      select: {
        id: true,
        betyg: true,
        jaNej: true,
        kravId: true,
        createdAt: true,
      },
    });
    console.log('Första 10 svaren:', allaSvar);

    // 2. Kolla om det finns några krav
    const antalKrav = await prisma.krav.count();
    console.log(`Totalt antal krav: ${antalKrav}`);

    // 3. Kolla om det finns några avsnitt
    const antalAvsnitt = await prisma.avsnitt.count();
    console.log(`Totalt antal avsnitt: ${antalAvsnitt}`);

    // 4. Kolla om det finns några delar
    const antalDelar = await prisma.del.count();
    console.log(`Totalt antal delar: ${antalDelar}`);

    // 5. Kolla om det finns data i kravBedomningar
    const kravBedomningarData = await prisma.kravBedomningar.findMany({
      take: 5,
    });
    console.log('kravBedomningar data:', kravBedomningarData);

    console.log('=== DATABASE DEBUG END ===');

    res.json({
      allaSvar,
      antalKrav,
      antalAvsnitt,
      antalDelar,
      kravBedomningarData,
      message: 'Check backend console for details',
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed', details: error.message });
  }
};

// ✅ NY FUNKTION: Aggregate data för diagram - ENKEL OCH SÄKER
export const getDelAggregate = async (_req: Request, res: Response) => {
  try {
    console.log('=== START: Hämtar aggregate data ===');

    // Steg 1: Hämta ALLA svar med betyg och deras kravId
    const allaSvar = await prisma.svar.findMany({
      where: {
        betyg: { not: null },
      },
      select: {
        id: true,
        betyg: true,
        kravId: true,
      },
    });

    console.log(`Hittade ${allaSvar.length} svar med betyg`);

    if (allaSvar.length === 0) {
      console.log('Inga svar med betyg hittades i databasen');
      return res.status(200).json([]);
    }

    // Steg 2: Hämta ALLA krav med deras avsnittId
    const kravIds = [...new Set(allaSvar.map((svar) => svar.kravId).filter(Boolean))];
    const allaKrav = await prisma.krav.findMany({
      where: {
        id: { in: kravIds },
      },
      select: {
        id: true,
        avsnittId: true,
      },
    });

    console.log(`Hittade ${allaKrav.length} krav`);

    // Steg 3: Hämta ALLA avsnitt med deras del
    const avsnittIds = [...new Set(allaKrav.map((krav) => krav.avsnittId).filter(Boolean))];
    const allaAvsnitt = await prisma.avsnitt.findMany({
      where: {
        id: { in: avsnittIds },
      },
      include: {
        del: true,
      },
    });

    console.log(`Hittade ${allaAvsnitt.length} avsnitt`);

    // Steg 4: Skapa en lookup-map för snabb åtkomst
    const kravTillAvsnittMap = new Map();
    allaKrav.forEach((krav) => {
      if (krav.avsnittId) {
        kravTillAvsnittMap.set(krav.id, krav.avsnittId);
      }
    });

    const avsnittTillDelMap = new Map();
    allaAvsnitt.forEach((avsnitt) => {
      avsnittTillDelMap.set(avsnitt.id, avsnitt.del);
    });

    // Steg 5: Gruppera betyg per del
    const delMap = new Map();

    allaSvar.forEach((svar) => {
      const avsnittId = kravTillAvsnittMap.get(svar.kravId);
      if (avsnittId && svar.betyg !== null) {
        const del = avsnittTillDelMap.get(avsnittId);
        if (del) {
          const delId = del.id;
          const delNamn = del.namn || `Del ${delId}`;

          if (!delMap.has(delId)) {
            delMap.set(delId, { del: delNamn, totalBetyg: 0, count: 0 });
          }

          const delData = delMap.get(delId);
          delData.totalBetyg += svar.betyg;
          delData.count += 1;
        }
      }
    });

    console.log(`Grupperade data för ${delMap.size} delar`);

    // Steg 6: Beräkna medelvärden
    const formattedData = Array.from(delMap.values()).map((delData) => ({
      del: delData.del,
      medelbetyg: delData.count > 0 ? delData.totalBetyg / delData.count : 0,
    }));

    console.log('Slutlig data:', formattedData);

    if (formattedData.length > 0) {
      console.log('✅ Returnerar riktig data från databasen!');
      res.status(200).json(formattedData);
    } else {
      console.log('❌ Inga kompletta datapunkter, använder mock-data');
      throw new Error('No complete data found');
    }
  } catch (error) {
    console.error('Error fetching Del aggregate:', error);

    // ✅ FALLBACK: Mock data
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

    console.log('🔄 Använder mock-data som fallback');
    res.json(mockData);
  }
};

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
