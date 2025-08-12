import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import {
  type CreateKravInput,
  type UpdateKravInput,
  type UpdateKravParams,
  type DeleteKravParams,
} from '../schemas/krav.schema';

// ============================================================
// 📍 GET CONTROLLER: Get krav list (with query filter/search)
// ============================================================
export const getKravList = async (req: Request, res: Response, next: NextFunction) => {
  const { styckeId, search } = req.query;
  try {
    const whereClause: Prisma.KravWhereInput = {};
    if (styckeId && typeof styckeId === 'string') {
      whereClause.styckeId = parseInt(styckeId, 10);
    }
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { kod: { contains: search, mode: 'insensitive' } },
        { kravText: { contains: search, mode: 'insensitive' } },
        { anvisning: { contains: search, mode: 'insensitive' } },
      ];
    }
    const krav = await prisma.krav.findMany({
      where: whereClause,
      include: { stycke: true },
      orderBy: { kod: 'asc' },
    });
    res.json(krav);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✍️ CREATE CONTROLLER: Create krav
// ============================================================
export const createKrav = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use validatedBody for safer and stricter typing
    const { styckeId, ...rest } = req.validatedBody as CreateKravInput;
    const krav = await prisma.krav.create({
      data: {
        ...rest,
        stycke: { connect: { id: styckeId } },
      },
    });
    return res.status(201).json(krav);
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// ✏️ UPDATE CONTROLLER: Update krav
// ============================================================
export const updateKrav = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use validatedParams and validatedBody for typesafe access
    const { id } = req.validatedParams as UpdateKravParams;
    const { styckeId, ...rest } = req.validatedBody as UpdateKravInput;

    const krav = await prisma.krav.update({
      where: { id },
      data: {
        ...rest,
        stycke:
          typeof styckeId === 'number' && styckeId > 0 ? { connect: { id: styckeId } } : undefined,
      },
    });

    return res.json(krav);
  } catch (error) {
    return next(error);
  }
};

// ============================================================
// ❌ DELETE CONTROLLER: Delete krav
// ============================================================
export const deleteKrav = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.validatedParams as DeleteKravParams;
    await prisma.krav.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
