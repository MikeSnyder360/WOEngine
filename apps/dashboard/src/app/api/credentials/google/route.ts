import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, packageName } = body;

    if (!appId || !packageName) {
      return NextResponse.json(
        { error: 'Missing required fields: appId, packageName' },
        { status: 400 }
      );
    }

    // TODO: Validate packageName exists in Google Play Console
    // TODO: Store service account JSON in AWS Secrets Manager, save reference in DB

    const secretRef = `secret:google:${appId}:v1`;

    const credential = await prisma.googleCredential.upsert({
      where: { appId },
      update: {
        packageNameConfirmed: true,
        lastValidatedAt: new Date(),
      },
      create: {
        appId,
        serviceAccountJsonSecretRef: secretRef,
        packageNameConfirmed: true,
        lastValidatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Google credentials saved', credential },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/credentials/google]', error);
    return NextResponse.json(
      { error: 'Failed to save Google credentials' },
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

    const credential = await prisma.googleCredential.findUnique({
      where: { appId },
      select: {
        id: true,
        appId: true,
        packageNameConfirmed: true,
        lastValidatedAt: true,
        status: true,
        createdAt: true,
        // Never return the secret ref in the API response
      },
    });

    if (!credential) {
      return NextResponse.json(
        { error: 'No Google credentials found for this app' },
        { status: 404 }
      );
    }

    return NextResponse.json(credential);
  } catch (error) {
    console.error('[GET /api/credentials/google]', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}
