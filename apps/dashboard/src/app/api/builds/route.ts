import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, platforms } = body;

    if (!appId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: appId, platforms (array)' },
        { status: 400 }
      );
    }

    // Verify app exists and get current brand/program versions
    const app = await prisma.app.findUnique({
      where: { id: appId },
      include: {
        currentBrandManifest: true,
        currentProgramVersion: true,
      },
    });

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    if (!app.currentBrandManifestId || !app.currentProgramVersionId) {
      return NextResponse.json(
        { error: 'App must have branding and program configured' },
        { status: 400 }
      );
    }

    // TODO: Charge Stripe (PaymentIntent) before creating build
    // For now, just create the build in queued status

    const build = await prisma.build.create({
      data: {
        appId,
        brandManifestId: app.currentBrandManifestId,
        programVersionId: app.currentProgramVersionId,
        platforms: platforms as any,
        status: 'queued',
      },
    });

    // TODO: Enqueue job to Redis for orchestrator

    return NextResponse.json(build, { status: 201 });
  } catch (error) {
    console.error('[POST /api/builds]', error);
    return NextResponse.json(
      { error: 'Failed to create build' },
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

    const builds = await prisma.build.findMany({
      where: { appId },
      orderBy: { createdAt: 'desc' },
      include: {
        brandManifest: true,
        programVersion: true,
      },
    });

    return NextResponse.json(builds);
  } catch (error) {
    console.error('[GET /api/builds]', error);
    return NextResponse.json(
      { error: 'Failed to fetch builds' },
      { status: 500 }
    );
  }
}
