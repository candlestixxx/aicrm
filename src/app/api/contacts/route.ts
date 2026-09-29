import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { triggerBackgroundEnrichment } from '@/lib/agents/enrichment';

// MOCK: In a real app, tenantId is extracted securely from the user's auth token
const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const stageFilter = url.searchParams.get('stage');
        const tagFilter = url.searchParams.get('tag');

        // Smart Filter Segment Logic
        const queryOptions: import("@prisma/client").Prisma.ContactFindManyArgs = {
            where: {
                tenantId: MOCK_TENANT_ID // Strict data isolation
            },
            include: {
                tags: {
                    include: {
                        tag: true
                    }
                },
                mlsData: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        };

        if (stageFilter) {
            queryOptions.where = { ...queryOptions.where, stage: stageFilter };
        }

        if (tagFilter) {
            queryOptions.where = {
                ...queryOptions.where,
                tags: {
                    some: {
                        tag: {
                            name: tagFilter
                        }
                    }
                }
            };
        }

        const contacts = await prisma.contact.findMany(queryOptions);

        return NextResponse.json({ contacts });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { firstName, lastName, email, phone, source, initialTags } = body;

        if (!firstName) {
            return NextResponse.json({ error: 'First name is required' }, { status: 400 });
        }

        // Ensure the mock tenant exists for demo purposes
        await prisma.tenant.upsert({
            where: { id: MOCK_TENANT_ID },
            update: {},
            create: {
                id: MOCK_TENANT_ID,
                name: 'Default Demo Tenant',
                domain: 'demo.aicrm.local'
            }
        });

        // Prepare the tag connections if any exist
        let tagConnections = {};

        if (initialTags && Array.isArray(initialTags) && initialTags.length > 0) {
            tagConnections = {
                create: initialTags.map(tagName => ({
                    tag: {
                        connectOrCreate: {
                            where: {
                                tenantId_name: {
                                    tenantId: MOCK_TENANT_ID,
                                    name: tagName
                                }
                            },
                            create: {
                                tenantId: MOCK_TENANT_ID,
                                name: tagName,
                                color: '#3B82F6' // Default blue
                            }
                        }
                    }
                }))
            };
        }

        const newContact = await prisma.contact.create({
            data: {
                tenantId: MOCK_TENANT_ID, // Strict data isolation
                firstName,
                lastName,
                email,
                phone,
                source,
                tags: tagConnections
            },
            include: {
                tags: {
                    include: { tag: true }
                }
            }
        });

        // Trigger the background enrichment agent
        triggerBackgroundEnrichment(newContact.id, newContact.email);

        return NextResponse.json({ success: true, contact: newContact }, { status: 201 });

    } catch (error) {
        console.error('Error creating contact:', error);
        return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }
}
