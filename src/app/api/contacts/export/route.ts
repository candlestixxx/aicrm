import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/jwt';

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contacts = await prisma.contact.findMany({
      where: { brokerageId: session.brokerageId },
      include: { lead: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Phone 2',
      'Address',
      'City',
      'State',
      'ZIP',
      'Source',
      'Tags',
      'Notes',
      'Is Lead',
      'Status',
      'Property Type',
      'Budget Min',
      'Budget Max',
      'Timeline',
      'Created At',
    ];

    const rows = contacts.map((c) => [
      escapeCSV(c.firstName),
      escapeCSV(c.lastName),
      escapeCSV(c.email),
      escapeCSV(c.phone),
      escapeCSV(c.phone2),
      escapeCSV(c.address),
      escapeCSV(c.city),
      escapeCSV(c.state),
      escapeCSV(c.zip),
      escapeCSV(c.source),
      escapeCSV(c.tags),
      escapeCSV(c.notes),
      c.isLead ? 'true' : 'false',
      escapeCSV(c.lead?.status),
      escapeCSV(c.lead?.propertyType),
      c.lead?.budgetMin?.toString() || '',
      c.lead?.budgetMax?.toString() || '',
      escapeCSV(c.lead?.timeline),
      c.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="aicrm-contacts-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export contacts' },
      { status: 500 }
    );
  }
}
