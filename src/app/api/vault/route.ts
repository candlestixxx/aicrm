import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { encrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const provider = url.searchParams.get('provider');

        if (provider) {
            const apiKey = await prisma.apiKey.findUnique({
                where: { provider }
            });

            if (apiKey) {
                // Return a masked version for security when checking existence
                return NextResponse.json({
                    provider: apiKey.provider,
                    exists: true,
                    // In a real scenario we wouldn't return the raw key, just proof it exists
                });
            } else {
                 return NextResponse.json({ exists: false }, { status: 404 });
            }
        }

        // Return a list of configured providers without the keys
        const allKeys = await prisma.apiKey.findMany({
            select: {
                provider: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        return NextResponse.json({ configuredProviders: allKeys });
    } catch (error) {
        console.error('Error fetching API keys:', error);
        return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, key } = body;

        if (!provider || !key) {
            return NextResponse.json({ error: 'Provider and key are required' }, { status: 400 });
        }

        // Encrypt the key before storing
        const encryptedKey = encrypt(key);

        const savedKey = await prisma.apiKey.upsert({
            where: { provider },
            update: {
                key: encryptedKey,
            },
            create: {
                provider,
                key: encryptedKey,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Key for ${provider} securely stored`,
            provider: savedKey.provider
        }, { status: 201 });

    } catch (error) {
        console.error('Error storing API key:', error);
        return NextResponse.json({ error: 'Failed to securely store API key' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const provider = url.searchParams.get('provider');

        if (!provider) {
             return NextResponse.json({ error: 'Provider is required for deletion' }, { status: 400 });
        }

        await prisma.apiKey.delete({
            where: { provider }
        });

        return NextResponse.json({ success: true, message: `Key for ${provider} removed` });
    } catch (error) {
        console.error('Error deleting API key:', error);
        return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
    }
}
