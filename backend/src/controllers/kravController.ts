// src/controllers/kravController.ts
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
  const { styckeId, omradeId, avsnittId, search } = req.query;

  try {
    const whereClause: Prisma.KravWhereInput = {};
    const parsedStyckeId =
      typeof styckeId === 'string' && styckeId.trim() !== ''
        ? Number.parseInt(styckeId, 10)
        : undefined;
    const parsedOmradeId =
      typeof omradeId === 'string' && omradeId.trim() !== ''
        ? Number.parseInt(omradeId, 10)
        : undefined;
    const parsedAvsnittId =
      typeof avsnittId === 'string' && avsnittId.trim() !== ''
        ? Number.parseInt(avsnittId, 10)
        : undefined;

    // Enforce single-scope
    const scopes = [parsedStyckeId, parsedOmradeId, parsedAvsnittId].filter(
      (v) => typeof v === 'number'
    );
    if (scopes.length > 1) {
      return res
        .status(400)
        .json({ error: 'Provide exactly one of styckeId, omradeId, or avsnittId' });
    }

    if (typeof parsedStyckeId === 'number') whereClause.styckeId = parsedStyckeId;
    if (typeof parsedOmradeId === 'number') whereClause.omradeId = parsedOmradeId;
    if (typeof parsedAvsnittId === 'number') whereClause.avsnittId = parsedAvsnittId;

    if (typeof search === 'string' && search.trim() !== '') {
      whereClause.OR = [
        { kod: { contains: search, mode: 'insensitive' } },
        { kravText: { contains: search, mode: 'insensitive' } },
        { anvisning: { contains: search, mode: 'insensitive' } },
      ];
    }

    const krav = await prisma.krav.findMany({
      where: whereClause,
      include: { stycke: true, omrade: true, avsnitt: true },
      orderBy: { kod: 'asc' },
    });

    res.json(krav);
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ✍️ CREATE CONTROLLER: Create krav (ahora soporta 3 scopes)
// ============================================================
export const createKrav = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kod, kravText, anvisning, styckeId, avsnittId, omradeId } =
      req.validatedBody as CreateKravInput;

    // Determinar scope (ya validado por Zod: exactamente uno)
    type ScopeKey = 'styckeId' | 'avsnittId' | 'omradeId';
    let scopeKey: ScopeKey;
    let scopeValue: number;

    if (typeof styckeId === 'number') {
      scopeKey = 'styckeId';
      scopeValue = styckeId;
    } else if (typeof avsnittId === 'number') {
      scopeKey = 'avsnittId';
      scopeValue = avsnittId;
    } else if (typeof omradeId === 'number') {
      scopeKey = 'omradeId';
      scopeValue = omradeId;
    } else {
      return res.status(400).json({
        error: 'Provide exactly one of styckeId, avsnittId, or omradeId',
      });
    }

    // Unicidad escoped (scopeKey, kod)
    const existing = await prisma.krav.findFirst({
      where: { kod, [scopeKey]: scopeValue } as Prisma.KravWhereInput,
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({
        code: 'KRAV_KOD_DUPLICATE',
        field: 'kod',
        message: 'Koden är redan registrerad i denna kontext. Ange en unik kod.',
      });
    }

    // Relación según scope
    const relationData =
      scopeKey === 'styckeId'
        ? { stycke: { connect: { id: scopeValue } } }
        : scopeKey === 'avsnittId'
          ? { avsnitt: { connect: { id: scopeValue } } }
          : { omrade: { connect: { id: scopeValue } } };

    const krav = await prisma.krav.create({
      data: {
        kod,
        kravText,
        anvisning,
        ...relationData,
      },
      include: { stycke: true, avsnitt: true, omrade: true },
    });

    return res.status(201).json(krav);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        code: 'KRAV_KOD_DUPLICATE',
        field: 'kod',
        message: 'Koden är redan registrerad i denna kontext. Ange en unik kod.',
      });
    }
    return next(error);
  }
};

// ============================================================
// ✏️ UPDATE CONTROLLER: Update krav
// ============================================================
export const updateKrav = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        code: 'KRAV_KOD_DUPLICATE',
        field: 'kod',
        message: 'Koden är redan registrerad i detta stycke. Ange en unik kod.',
      });
    }
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
