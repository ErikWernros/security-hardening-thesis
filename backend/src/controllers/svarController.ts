import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import type { SvarInput } from '../schemas/svar.schema';

// GET /api/svar/stycke/:styckeId
export const getSvarByStycke = async (req: Request, res: Response) => {
  const styckeId = parseInt(req.params.styckeId, 10);
  if (Number.isNaN(styckeId)) return res.status(400).json({ error: 'Invalid styckeId' });

  try {
    const svarList = await prisma.svar.findMany({
      where: { krav: { styckeId } },
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

// GET /api/svar/omrade/:omradeId
export const getSvarByOmrade = async (req: Request, res: Response) => {
  const omradeId = parseInt(req.params.omradeId, 10);
  if (Number.isNaN(omradeId)) return res.status(400).json({ error: 'Invalid omradeId' });

  try {
    const svarList = await prisma.svar.findMany({
      where: { krav: { omradeId } },
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
    console.error('Error fetching svar by omrade:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/svar/avsnitt/:avsnittId
export const getSvarByAvsnitt = async (req: Request, res: Response) => {
  const avsnittId = parseInt(req.params.avsnittId, 10);
  if (Number.isNaN(avsnittId)) return res.status(400).json({ error: 'Invalid avsnittId' });

  try {
    const svarList = await prisma.svar.findMany({
      // Solo krav ligados directamente al Avsnitt (según tu nuevo requerimiento)
      where: { krav: { avsnittId } },
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
    console.error('Error fetching svar by avsnitt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/svar/:kravId
export const saveSvar = async (req: Request, res: Response) => {
  const kravId = parseInt(req.params.kravId, 10);
  const userId = req.user?.id;

  if (Number.isNaN(kravId) || !userId) {
    return res.status(400).json({ error: 'Invalid kravId or unauthenticated user' });
  }

  const { betyg, jaNej, kommentar, verifikat } = req.validatedBody as SvarInput;

  try {
    const existing = await prisma.svar.findFirst({ where: { kravId, userId } });

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
