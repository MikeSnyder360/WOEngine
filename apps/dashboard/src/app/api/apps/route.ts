import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, appName, iosBundleId, androidPackageName } = body;

    if (!tenantId || !appName || !iosBundleId || !androidPackageName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const app = await prisma.app.create({
      data: {
        tenantId,
        appName,
        iosBundleId,
        androidPackageName,
      },
    });

    return NextResponse.json(app, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/apps]', error);

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: `${error.meta.target[0]} already in use` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create app' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    const where = tenantId ? { tenantId } : {};

    const apps = await prisma.app.findMany({
      where,
      include: {
        currentBrandManifest: true,
        currentProgramVersion: true,
      },
    });

    return NextResponse.json(apps);
  } catch (error) {
    console.error('[GET /api/apps]', error);
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}
