
'use server';
/**
 * @fileOverview A flow to synchronize inventory data to Google Sheets.
 *
 * - syncToSheet - Creates/updates a Google Sheet with inventory data.
 * - SyncToSheetInput - The input type for the syncToSheet function.
 * - SyncToSheetOutput - The return type for the syncToSheet function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { google } from 'googleapis';
import { getProducts } from '@/lib/firestore';

const ProductSchema = z.object({
    id: z.string(),
    image: z.string().optional(),
    name: z.string(),
    code: z.string(),
    patrimony: z.string(),
    type: z.string(),
    quantity: z.number(),
    unit: z.string(),
    category: z.string(),
});

const SyncToSheetInputSchema = z.object({
  accessToken: z.string().describe("OAuth access token for Google API."),
});
export type SyncToSheetInput = z.infer<typeof SyncToSheetInputSchema>;

const SyncToSheetOutputSchema = z.object({
  spreadsheetId: z.string(),
  spreadsheetUrl: z.string(),
});
export type SyncToSheetOutput = z.infer<typeof SyncToSheetOutputSchema>;

export async function syncToSheet(input: SyncToSheetInput): Promise<SyncToSheetOutput> {
  return syncToSheetFlow(input);
}

const syncToSheetFlow = ai.defineFlow(
  {
    name: 'syncToSheetFlow',
    inputSchema: SyncToSheetInputSchema,
    outputSchema: SyncToSheetOutputSchema,
  },
  async ({ accessToken }) => {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const products = await getProducts();

    const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
            properties: {
                title: 'AlmoxFlow Inventory',
            },
        },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) {
      throw new Error('Failed to create spreadsheet.');
    }

    const headerRow = [
      'ID', 'Name', 'Code', 'Patrimony', 'Type', 'Quantity', 'Unit', 'Category', 'Image URL'
    ];
    const rows = products.map(p => [
      p.id, p.name, p.code, p.patrimony, p.type, p.quantity, p.unit, p.category, p.image || ''
    ]);

    const values = [headerRow, ...rows];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: values,
        },
    });

    return {
        spreadsheetId: spreadsheetId,
        spreadsheetUrl: spreadsheet.data.spreadsheetUrl!,
    };
  }
);
