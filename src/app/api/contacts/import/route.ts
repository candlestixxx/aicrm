import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';

const CSV_HEADER_MAP: Record<string, string> = {
  'first name': 'firstName',
  'last name': 'lastName',
  'email': 'email',
  'phone': 'phone',
  'phone 2': 'phone2',
  'address': 'address',
  'city': 'city',
  'state': 'state',
  'zip': 'zip',
  'source': 'source',
  'tags': 'tags',
  'notes': 'notes',
  'status': 'status',
  'property type': 'propertyType',
  'budget min': 'budgetMin',
  'budget max': 'budgetMax',
  'timeline': 'timeline',
  'is lead': 'isLead',
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let csvText: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: 'CSV file is required' },
          { status: 400 }
        );
      }
      csvText = await file.text();
    } else {
      const body = await request.json();
      csvText = body.csv;
      if (!csvText) {
        return NextResponse.json({ error: 'CSV data is required' }, { status: 400 });
      }
    }

    // Parse CSV
    const lines = csvText.split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have a header row and at least one data row' },
        { status: 400 }
      );
    }

    const headers = parseCSVLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/^"|"$/g, '')
    );
    const mappedHeaders = headers.map(
      (h) => CSV_HEADER_MAP[h] || h
    );

    const errors: { row: number; message: string }[] = [];
    let imported = 0;
    let skipped = 0;

    // Get default pipeline for leads
    const defaultPipeline = await prisma.pipeline.findFirst({
      where: { brokerageId: session.brokerageId, isDefault: true },
      include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
    });

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};

      for (let j = 0; j < mappedHeaders.length; j++) {
        if (values[j] !== undefined) {
          row[mappedHeaders[j]] = values[j].replace(/^"|"$/g, '');
        }
      }

      const firstName = row['firstName'];
      const lastName = row['lastName'];

      if (!firstName || !lastName) {
        skipped++;
        errors.push({ row: i + 1, message: `Missing first or last name` });
        continue;
      }

      try {
        const isLead = row['isLead']?.toLowerCase() === 'true' || row['isLead'] === '1';

        await prisma.contact.create({
          data: {
            brokerageId: session.brokerageId!,
            assignedAgentId: session.agentId,
            firstName,
            lastName,
            email: row['email'] || null,
            phone: row['phone'] || null,
            phone2: row['phone2'] || null,
            address: row['address'] || null,
            city: row['city'] || null,
            state: row['state'] || null,
            zip: row['zip'] || null,
            source: row['source'] || null,
            tags: row['tags'] || '[]',
            notes: row['notes'] || null,
            isLead,
            ...(isLead && {
              lead: {
                create: {
                  status: row['status'] || 'new',
                  propertyType: row['propertyType'] || null,
                  budgetMin: row['budgetMin'] ? parseFloat(row['budgetMin']) : null,
                  budgetMax: row['budgetMax'] ? parseFloat(row['budgetMax']) : null,
                  timeline: row['timeline'] || null,
                  pipelineId: defaultPipeline?.id,
                  stageId: defaultPipeline?.stages[0]?.id,
                },
              },
            }),
          },
        });
        imported++;
      } catch (err) {
        skipped++;
        errors.push({
          row: i + 1,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: lines.length - 1,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV import' },
      { status: 500 }
    );
  }
}
