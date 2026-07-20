import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, appDisplayName, colorTokens } = body;

    if (!appId || !colorTokens) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const app = await prisma.app.findUnique({ where: { id: appId } });
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Get next version number
    const lastManifest = await prisma.brandManifest.findFirst({
      where: { appId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (lastManifest?.version || 0) + 1;

    const manifest = await prisma.brandManifest.create({
      data: {
        appId,
        version: nextVersion,
        appDisplayName: appDisplayName || app.appName,
        colorTokens: colorTokens as any,
      },
    });

    // Set as current
    await prisma.app.update({
      where: { id: appId },
      data: { currentBrandManifestId: manifest.id },
    });

    return NextResponse.json(manifest, { status: 201 });
  } catch (error) {
    console.error('[POST /api/brand-manifest]', error);
    return NextResponse.json(
      { error: 'Failed to save branding' },
      { status: 500 }
    );
  }
}
