import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe, createBuildCharge } from '@/lib/stripe';
import { enqueueBuild } from '@/lib/queue';

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

    // Verify subscription is active
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: app.tenantId },
    });

    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      );
    }

    if (!subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer set up' },
        { status: 400 }
      );
    }

    // Per-build cost (in cents, e.g. $29 = 2900)
    const costCents = 2900;

    // Charge Stripe
    const paymentIntent = await createBuildCharge(
      subscription.stripeCustomerId,
      costCents,
      `WOEngine build for ${app.appName}`
    );

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment failed' },
        { status: 402 }
      );
    }

    // Create build record
    const build = await prisma.build.create({
      data: {
        appId,
        brandManifestId: app.currentBrandManifestId,
        programVersionId: app.currentProgramVersionId,
        platforms: platforms as any,
        status: 'queued',
        stripeChargeId: paymentIntent.id,
        costCents,
      },
    });

    // Enqueue job to Redis for orchestrator
    await enqueueBuild(build.id, platforms as any);

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
