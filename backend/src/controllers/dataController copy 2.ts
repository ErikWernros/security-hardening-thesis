/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-28
 * Design Name: dataController.ts
 * Tools: JWT, Msal, Prisma, Postgres(In Supabase),
 * Description:
 * Main controller for importing data from Excel files.
 * Defines the `importFromExcel` function, which processes the uploaded Excel file,
 * extracts the required data, and saves it to the database using Prisma.
 * It validates and structures the data before performing upsert operations.
 * Uses ExcelJS to read the Excel file and handles errors safely.
 * Works with Express and requires authentication to allow imports.
 * Includes a helper function to convert cell values to strings,
 * ensuring consistent data processing.
 * Part of the data management system for the ISAG AB project,
 * and interacts with Prisma models like `del`, `avsnitt`, `stycke`, and `krav`.
 * Should be used together with middleware that handles Excel file uploads.
 * -----------------------------------------------------------
 */
import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import prisma from '../lib/prisma';
import ExcelJS, { CellValue } from 'exceljs';

console.log('DataController initialized');
// ===================================================================================
// HELP FUNCTION: Safely convert any Excel cell to a string.
// ===================================================================================
function getCellStringValue(cellValue: CellValue): string {
  console.log('Converting cell value to string:', cellValue);

  if (cellValue === null || cellValue === undefined) return '';

  if (
    typeof cellValue === 'string' ||
    typeof cellValue === 'number' ||
    typeof cellValue === 'boolean'
  ) {
    return cellValue.toString().trim();
  }

  if (cellValue instanceof Date) {
    return cellValue.toISOString();
  }

  if (typeof cellValue === 'object') {
    if ('richText' in cellValue && Array.isArray(cellValue.richText)) {
      return cellValue.richText
        .map((rt) => rt.text)
        .join('')
        .trim();
    }

    if ('result' in cellValue) {
      const result = cellValue.result;
      if (typeof result === 'number' || typeof result === 'string' || typeof result === 'boolean') {
        return result.toString().trim();
      }
      if (result instanceof Date) {
        return result.toISOString();
      }
      return '';
    }
  }

  return '';
}

// ===================================================================================
// INTERFACE: Defines the data structure we expect from Excel.
// ===================================================================================
interface ExcelRow {
  delKod: string;
  delNamn: string;
  avsnittKod: string;
  avsnittNamn: string;
  styckeKod: string;
  styckeNamn: string;
  kravKod: string;
  kravText: string;
  kravAnvisning: string | null;
}

// ===================================================================================
// MAIN CONTROLLER: Logic to import the file.
// ===================================================================================
export const importFromExcel = async (req: Request, res: Response, next: NextFunction) => {
  console.log('Archivo recibido:', req.file);
  if (!req.file) {
    return res.status(400).json({ message: 'Ingen Excel-fil uppladdad.' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.read(Readable.from(req.file.buffer));
    //await workbook.xlsx.load(req.file.buffer);

    // Guard: no worksheets at all
    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      return res.status(400).json({ message: 'Excel-filen är tom eller skadad.' });
    }

    // Validate required headers per sheet
    const requiredHeaders = [
      'Del-kod',
      'Del-namn',
      'Avsnitt-kod',
      'Avsnitt-namn',
      'Stycke-kod',
      'Stycke-namn',
      'Krav-kod',
      'Krav-text',
    ];

    const data: ExcelRow[] = [];

    // ---------------------------------------------------------------------------
    // Process ALL worksheets and aggregate valid rows
    // ---------------------------------------------------------------------------
    for (const worksheet of workbook.worksheets) {
      if (!worksheet) continue;

      const headerRow = worksheet.getRow(1);
      const headers = (headerRow.values as string[]).reduce(
        (acc, val, idx) => {
          if (val) acc[val.trim()] = idx;
          return acc;
        },
        {} as Record<string, number>
      );

      const missing = requiredHeaders.filter((h) => !headers[h]);
      if (missing.length > 0) {
        console.warn(
          `Saltando hoja "${worksheet.name}" por faltar columnas: ${missing.join(', ')}`
        );
        continue;
      }

      // Optional column index (may not exist on some sheets)
      const kravAnvisningIndex = headers['Krav-anvisning'];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header

        const rowData: ExcelRow = {
          delKod: getCellStringValue(row.getCell(headers['Del-kod']).value),
          delNamn: getCellStringValue(row.getCell(headers['Del-namn']).value),
          avsnittKod: getCellStringValue(row.getCell(headers['Avsnitt-kod']).value),
          avsnittNamn: getCellStringValue(row.getCell(headers['Avsnitt-namn']).value),
          styckeKod: getCellStringValue(row.getCell(headers['Stycke-kod']).value),
          styckeNamn: getCellStringValue(row.getCell(headers['Stycke-namn']).value),
          kravKod: getCellStringValue(row.getCell(headers['Krav-kod']).value),
          kravText: getCellStringValue(row.getCell(headers['Krav-text']).value),
          kravAnvisning: kravAnvisningIndex
            ? getCellStringValue(row.getCell(kravAnvisningIndex).value) || null
            : null,
        };

        const requiredValues = [
          rowData.delKod,
          rowData.avsnittKod,
          rowData.styckeKod,
          rowData.kravKod,
        ];

        if (requiredValues.every((val) => val)) {
          data.push(rowData);
        }
      });
    }

    if (data.length === 0) {
      return res.status(400).json({
        message:
          'Excel-filen saknar nödvändiga kolumner eller inte finns data válida i de tillgängliga bladen.',
      });
    }

    // ---------------------------------------------------------------------------
    // Write to DB using SHORT-LIVED transactions per row (prevents Prisma P2028)
    // ---------------------------------------------------------------------------
    // NOTE: We keep your upsert logic and names; only the transaction boundary changes.
    let processed = 0;

    for (const row of data) {
      await prisma.$transaction(
        async (tx) => {
          const del = await tx.del.upsert({
            where: { kod: row.delKod },
            update: { namn: row.delNamn },
            create: { kod: row.delKod, namn: row.delNamn },
          });

          const avsnitt = await tx.avsnitt.upsert({
            where: { kod_delId: { kod: row.avsnittKod, delId: del.id } },
            update: { namn: row.avsnittNamn },
            create: {
              kod: row.avsnittKod,
              namn: row.avsnittNamn,
              delId: del.id,
            },
          });

          const stycke = await tx.stycke.upsert({
            where: { kod_avsnittId: { kod: row.styckeKod, avsnittId: avsnitt.id } },
            update: { namn: row.styckeNamn },
            create: {
              kod: row.styckeKod,
              namn: row.styckeNamn,
              avsnittId: avsnitt.id,
            },
          });

          await tx.krav.upsert({
            where: { kod: row.kravKod },
            update: {
              kravText: row.kravText,
              anvisning: row.kravAnvisning,
            },
            create: {
              kod: row.kravKod,
              kravText: row.kravText,
              anvisning: row.kravAnvisning,
              styckeId: stycke.id,
            },
          });
        },
        { timeout: 60000 } // optional: extend a bit for heavy rows
      );

      processed += 1;
      if (processed % 500 === 0) {
        console.log(`Processed ${processed} rows...`);
      }
    }

    res.status(201).json({
      message: 'Import avslutad.',
      antalRader: data.length,
      antalDelar: new Set(data.map((d) => d.delKod)).size,
      antalAvsnitt: new Set(data.map((d) => d.avsnittKod)).size,
      antalStycken: new Set(data.map((d) => d.styckeKod)).size,
      antalKrav: new Set(data.map((d) => d.kravKod)).size,
    });
  } catch (error) {
    console.error('Misslyckades med att importera data från Excel:', error);
    next(error);
  }
};
