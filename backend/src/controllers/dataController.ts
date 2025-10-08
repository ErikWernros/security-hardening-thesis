// src/controllers/dataController.ts
import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import ExcelJS, {
  CellValue,
  CellFormulaValue,
  CellHyperlinkValue,
  CellRichTextValue,
  Row,
  Worksheet,
} from 'exceljs';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

console.log('DataController initialized');

// -------------------------------
// Type guards
// -------------------------------
function isRichTextValue(v: CellValue): v is CellRichTextValue {
  return typeof v === 'object' && v !== null && 'richText' in v;
}
function isFormulaValue(v: CellValue): v is CellFormulaValue {
  return typeof v === 'object' && v !== null && 'formula' in v && 'result' in v;
}
function isHyperlinkValue(v: CellValue): v is CellHyperlinkValue {
  return typeof v === 'object' && v !== null && 'text' in v && 'hyperlink' in v;
}
function hasStringTextProp(v: unknown): v is { text: string } {
  return (
    typeof v === 'object' &&
    v !== null &&
    'text' in v &&
    typeof (v as { text?: unknown }).text === 'string'
  );
}

// -------------------------------
// Safe cell → string
// -------------------------------
function getCellStringValue(cellValue: CellValue): string {
  if (cellValue === null || cellValue === undefined) return '';
  if (typeof cellValue === 'string') return cellValue.trim();
  if (typeof cellValue === 'number' || typeof cellValue === 'boolean')
    return String(cellValue).trim();
  if (cellValue instanceof Date) return cellValue.toISOString();

  if (isRichTextValue(cellValue)) {
    return cellValue.richText
      .map((rt) => rt.text)
      .join('')
      .trim();
  }
  if (isFormulaValue(cellValue)) {
    const r: CellValue | undefined = cellValue.result as CellValue | undefined;
    if (r === null || r === undefined) return '';
    return getCellStringValue(r);
  }
  if (isHyperlinkValue(cellValue)) {
    const text = (cellValue.text ?? '').toString().trim();
    return text || String(cellValue.hyperlink).trim();
  }
  if (hasStringTextProp(cellValue)) return cellValue.text.trim();
  return '';
}

// -------------------------------
// Headers (Swedish)
// -------------------------------
const HDR = {
  Del: 'Del',
  Avsnitt: 'Avsnitt',
  Omrade: 'Område',
  OmradeNoAccent: 'Omrade',
  Stycke: 'Stycke',
  Nr: 'Nr',
  Krav: 'Krav (texten exakt)',
  Anvisning: 'Anvisning (exakt text)',
} as const;

function buildHeaderIndex(headerRow: Row): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 1; i <= headerRow.cellCount; i += 1) {
    const key = headerRow.getCell(i).text?.trim();
    if (key) map[key] = i;
  }
  return map;
}

function sheetLooksValid(
  headerIndex: Record<string, number>
): { ok: true } | { ok: false; missing: string[] } {
  const omradeHeader = HDR.Omrade in headerIndex || HDR.OmradeNoAccent in headerIndex;
  const missing: string[] = [];
  if (!(HDR.Del in headerIndex)) missing.push(HDR.Del);
  if (!(HDR.Avsnitt in headerIndex)) missing.push(HDR.Avsnitt);
  if (!omradeHeader) missing.push(HDR.Omrade);
  if (!(HDR.Stycke in headerIndex)) missing.push(HDR.Stycke);
  if (!(HDR.Nr in headerIndex)) missing.push(HDR.Nr);
  if (!(HDR.Krav in headerIndex)) missing.push(HDR.Krav);
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}

// -------------------------------
// Helpers
// -------------------------------
function withPrefix(prefix: string, raw: string): string {
  const v = raw.trim();
  return v ? `${prefix}${v}` : '';
}
function normalizeCodeFromCell(v: CellValue, prefix: string): string {
  const s = getCellStringValue(v);
  return withPrefix(prefix, s);
}

// -------------------------------
// Row types
// -------------------------------
interface TitleRow {
  depth: 1 | 2 | 3 | 4; // 1: Del, 2: Avsnitt, 3: Omrade, 4: Stycke
  del: string; // D1
  avsnitt?: string; // A1
  omrade?: string; // O1
  stycke?: string; // S1
  namn: string; // text from "Krav (texten exakt)"
}

interface KravRow {
  del: string;
  avsnitt: string;
  omrade?: string;
  stycke?: string;
  kravKod: string; // K..
  kravText: string;
  anvisning: string | null;
}

// -------------------------------
// MAIN CONTROLLER
// -------------------------------
export const importFromExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file: Express.Multer.File | undefined = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Ingen Excel-fil uppladdad.' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.read(Readable.from(file.buffer));

    // Lee todas las hojas que empiezan por "ISM"
    const worksheets: Worksheet[] = (workbook.worksheets ?? []).filter(
      (ws) => typeof ws.name === 'string' && ws.name.startsWith('ISM')
    );

    if (worksheets.length === 0) {
      return res.status(400).json({ message: 'Excel-filen saknar blad som börjar med "ISM".' });
    }

    const titles: TitleRow[] = [];
    const kravs: KravRow[] = [];

    for (const worksheet of worksheets) {
      const headerRow = worksheet.getRow(1);
      if (!headerRow || headerRow.cellCount === 0) continue;

      const headerIndex = buildHeaderIndex(headerRow);
      const ok = sheetLooksValid(headerIndex);
      if (!ok.ok) {
        console.warn(
          `Saltando hoja "${worksheet.name}" por columnas faltantes: ${ok.missing.join(', ')}`
        );
        continue;
      }

      const omradeIdx = headerIndex[HDR.Omrade] ?? headerIndex[HDR.OmradeNoAccent];
      const delIdx = headerIndex[HDR.Del];
      const avsnittIdx = headerIndex[HDR.Avsnitt];
      const styckeIdx = headerIndex[HDR.Stycke];
      const nrIdx = headerIndex[HDR.Nr];
      const kravIdx = headerIndex[HDR.Krav];
      const anvisningIdx = headerIndex[HDR.Anvisning];

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const row = worksheet.getRow(rowNumber);

        const del = normalizeCodeFromCell(row.getCell(delIdx).value, 'D');
        const avsnitt = normalizeCodeFromCell(row.getCell(avsnittIdx).value, 'A');
        const omrade = normalizeCodeFromCell(row.getCell(omradeIdx).value, 'O');
        const stycke = normalizeCodeFromCell(row.getCell(styckeIdx).value, 'S');
        const kravKod = normalizeCodeFromCell(row.getCell(nrIdx).value, 'K');

        const kravText = getCellStringValue(row.getCell(kravIdx).value);
        const anvisning =
          typeof anvisningIdx === 'number'
            ? (() => {
                const v = getCellStringValue(row.getCell(anvisningIdx).value);
                return v.length > 0 ? v : null;
              })()
            : null;

        if (!kravText) continue;

        // TÍTULOS (sin Nr)
        if (!kravKod) {
          if (del && !avsnitt && !omrade && !stycke) {
            titles.push({ depth: 1, del, namn: kravText }); // Del
          } else if (del && avsnitt && !omrade && !stycke) {
            titles.push({ depth: 2, del, avsnitt, namn: kravText }); // Avsnitt
          } else if (del && avsnitt && omrade && !stycke) {
            titles.push({ depth: 3, del, avsnitt, omrade, namn: kravText }); // Område
          } else if (del && avsnitt && omrade && stycke) {
            titles.push({ depth: 4, del, avsnitt, omrade, stycke, namn: kravText }); // Stycke
          }
          continue;
        }

        // KRAV (con Nr)
        if (del && avsnitt) {
          kravs.push({
            del,
            avsnitt,
            omrade: omrade || undefined,
            stycke: stycke || undefined,
            kravKod,
            kravText,
            anvisning,
          });
        }
      }
    }

    if (titles.length === 0 && kravs.length === 0) {
      return res.status(400).json({
        message:
          'Ingen giltig data hittades i bladen "ISM". Verifiera que Del, Avsnitt, Område, Stycke, Nr och Krav är ifyllda.',
      });
    }

    // -------------------------------
    // Persistencia
    // -------------------------------

    // Ordenar títulos por profundidad 1→4
    titles.sort((a, b) => a.depth - b.depth);

    // Conteos
    const delSet = new Set<string>();
    const avsnittSet = new Set<string>();
    const omradeSet = new Set<string>();
    const styckeSet = new Set<string>();
    const kravSet = new Set<string>();

    // 1) Guardar TÍTULOS
    for (const t of titles) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        if (t.depth === 1) {
          await tx.del.upsert({
            where: { kod: t.del }, // Del.kod es único global
            update: { namn: t.namn },
            create: { kod: t.del, namn: t.namn },
          });
          delSet.add(t.del);
          return;
        }

        // Asegurar Del (parent) con placeholder
        const del = await tx.del.upsert({
          where: { kod: t.del },
          update: {},
          create: { kod: t.del, namn: t.del },
          select: { id: true },
        });
        delSet.add(t.del);

        if (t.depth === 2 && t.avsnitt) {
          await tx.avsnitt.upsert({
            where: { kod_delId: { kod: t.avsnitt, delId: del.id } },
            update: { namn: t.namn },
            create: { kod: t.avsnitt, namn: t.namn, delId: del.id },
          });
          avsnittSet.add(t.avsnitt);
          return;
        }

        if (!t.avsnitt) return;

        // Asegurar Avsnitt (parent) con placeholder
        const avsnitt = await tx.avsnitt.upsert({
          where: { kod_delId: { kod: t.avsnitt, delId: del.id } },
          update: {},
          create: { kod: t.avsnitt, namn: t.avsnitt, delId: del.id },
          select: { id: true },
        });
        avsnittSet.add(t.avsnitt);

        if (t.depth === 3 && t.omrade) {
          await tx.omrade.upsert({
            where: { kod_avsnittId: { kod: t.omrade, avsnittId: avsnitt.id } },
            update: { namn: t.namn },
            create: { kod: t.omrade, namn: t.namn, avsnittId: avsnitt.id },
          });
          omradeSet.add(t.omrade);
          return;
        }

        if (t.depth === 4 && t.omrade && t.stycke) {
          // Asegurar Område (parent) con placeholder
          const omr = await tx.omrade.upsert({
            where: { kod_avsnittId: { kod: t.omrade, avsnittId: avsnitt.id } },
            update: {},
            create: { kod: t.omrade, namn: t.omrade, avsnittId: avsnitt.id },
            select: { id: true },
          });
          omradeSet.add(t.omrade);

          await tx.stycke.upsert({
            where: { kod_omradeId: { kod: t.stycke, omradeId: omr.id } },
            update: { namn: t.namn },
            create: { kod: t.stycke, namn: t.namn, omradeId: omr.id },
          });
          styckeSet.add(t.stycke);
        }
      });
    }

    // 2) Guardar KRAV (3 rutas con where compuesto)
    let processed = 0;
    for (const r of kravs) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Parents con placeholders si no existen
        const del = await tx.del.upsert({
          where: { kod: r.del },
          update: {},
          create: { kod: r.del, namn: r.del },
          select: { id: true },
        });
        delSet.add(r.del);

        const avsnitt = await tx.avsnitt.upsert({
          where: { kod_delId: { kod: r.avsnitt, delId: del.id } },
          update: {},
          create: { kod: r.avsnitt, namn: r.avsnitt, delId: del.id },
          select: { id: true },
        });
        avsnittSet.add(r.avsnitt);

        let omradeId: number | null = null;
        if (r.omrade) {
          const omr = await tx.omrade.upsert({
            where: { kod_avsnittId: { kod: r.omrade, avsnittId: avsnitt.id } },
            update: {},
            create: { kod: r.omrade, namn: r.omrade, avsnittId: avsnitt.id },
            select: { id: true },
          });
          omradeId = omr.id;
          omradeSet.add(r.omrade);
        }

        let styckeId: number | null = null;
        if (r.stycke && omradeId) {
          const sty = await tx.stycke.upsert({
            where: { kod_omradeId: { kod: r.stycke, omradeId } },
            update: {},
            create: { kod: r.stycke, namn: r.stycke, omradeId },
            select: { id: true },
          });
          styckeId = sty.id;
          styckeSet.add(r.stycke);
        }

        // KRAV por alcance (scope):
        if (styckeId) {
          // Ruta 3: Avsnitt → Område → Stycke → Krav
          await tx.krav.upsert({
            where: { styckeId_kod: { styckeId, kod: r.kravKod } },
            update: {
              kravText: r.kravText,
              anvisning: r.anvisning,
              // normalizamos las otras FK a null para no dejar dobles enlaces
              omradeId: null,
              avsnittId: null,
            },
            create: {
              kod: r.kravKod,
              kravText: r.kravText,
              anvisning: r.anvisning,
              styckeId,
            },
          });
        } else if (omradeId) {
          // Ruta 2: Avsnitt → Område → Krav
          await tx.krav.upsert({
            where: { omradeId_kod: { omradeId, kod: r.kravKod } },
            update: {
              kravText: r.kravText,
              anvisning: r.anvisning,
              styckeId: null,
              avsnittId: null,
            },
            create: {
              kod: r.kravKod,
              kravText: r.kravText,
              anvisning: r.anvisning,
              omradeId,
            },
          });
        } else {
          // Ruta 1: Avsnitt → Krav
          await tx.krav.upsert({
            where: { avsnittId_kod: { avsnittId: avsnitt.id, kod: r.kravKod } },
            update: {
              kravText: r.kravText,
              anvisning: r.anvisning,
              styckeId: null,
              omradeId: null,
            },
            create: {
              kod: r.kravKod,
              kravText: r.kravText,
              anvisning: r.anvisning,
              avsnittId: avsnitt.id,
            },
          });
        }

        kravSet.add(r.kravKod);
      });

      processed += 1;
      if (processed % 500 === 0) {
        console.log(`Processed ${processed} krav rows...`);
      }
    }

    res.status(201).json({
      message: 'Import avslutad.',
      antalTitlar: titles.length,
      antalKrav: kravSet.size,
      antalDelar: delSet.size,
      antalAvsnitt: avsnittSet.size,
      antalOmraden: omradeSet.size,
      antalStycken: styckeSet.size,
    });
  } catch (error) {
    console.error('Misslyckades med att importera data från Excel:', error);
    next(error);
  }
};
