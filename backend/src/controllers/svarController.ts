// src/controllers/svarController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import type { SvarInput } from '../schemas/svar.schema';

// GET /api/svar/stycke/:styckeId
export const getSvarByStycke = async (req: Request, res: Response) => {
  const styckeId = parseInt(req.params.styckeId);
  if (isNaN(styckeId)) {
    return res.status(400).json({ error: 'Invalid styckeId' });
  }

  try {
    const svarList = await prisma.svar.findMany({
      where: {
        krav: {
          styckeId: styckeId,
        },
      },
      select: {
        betyg: true,
        jaNej: true,
        verifikat: true,
        kommentar: true,
        kravId: true,
        userId: true,
      },
    });

    res.json(svarList);
  } catch (error) {
    console.error('Error fetching svar by stycke:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/svar/:kravId
export const saveSvar = async (req: Request, res: Response) => {
  const kravId = parseInt(req.params.kravId);
  const userId = req.user?.id;

  if (isNaN(kravId) || !userId) {
    return res.status(400).json({ error: 'Invalid kravId or unauthenticated user' });
  }

  const { betyg, jaNej, kommentar, verifikat } = req.validatedBody as SvarInput;

  try {
    const existing = await prisma.svar.findFirst({
      where: { kravId, userId },
    });

    const updatedSvar = existing
      ? await prisma.svar.update({
          where: { id: existing.id },
          data: { betyg, jaNej, kommentar, verifikat },
        })
      : await prisma.svar.create({
          data: { kravId, userId, betyg, jaNej, kommentar, verifikat },
        });

    res.status(200).json(updatedSvar);
  } catch (error) {
    console.error('Error saving svar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
