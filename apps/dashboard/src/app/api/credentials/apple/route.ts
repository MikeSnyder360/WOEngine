import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, ascKeyId, ascIssuerId, teamId } = body;

    if (!appId || !ascKeyId || !ascIssuerId || !teamId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Validate credentials against Apple API
    // TODO: Store raw .p8 key in AWS Secrets Manager, save reference in DB

    // For now, just create the credential record with a placeholder secret ref
    const secretRef = `secret:apple:${appId}:v1`;

    const credential = await prisma.appleCredential.upsert({
      where: { appId },
      update: {
        ascKeyId,
        ascIssuerId,
        teamId,
        lastValidatedAt: new Date(),
      },
      create: {
        appId,
        ascKeyId,
        ascIssuerId,
        teamId,
        ascApiKeySecretRef: secretRef,
        lastValidatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Apple credentials saved', credential },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/credentials/apple]', error);
    return NextResponse.json(
      { error: 'Failed to save Apple credentials' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const appId = request.nextUrl.searchParams.get('appId');

    if (!appId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: appId' },
        { status: 400 }
      );
    }

    const credential = await prisma.appleCredential.findUnique({
      where: { appId },
      select: {
        id: true,
        appId: true,
        teamId: true,
        lastValidatedAt: true,
        status: true,
        createdAt: true,
        // Never return the secret ref in the API response
      },
    });

    if (!credential) {
      return NextResponse.json(
        { error: 'No Apple credentials found for this app' },
        { status: 404 }
      );
    }

    return NextResponse.json(credential);
  } catch (error) {
    console.error('[GET /api/credentials/apple]', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}
