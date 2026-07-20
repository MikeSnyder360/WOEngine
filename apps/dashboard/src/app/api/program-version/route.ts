import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, programJson } = body;

    if (!appId || !programJson) {
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
    const lastVersion = await prisma.programVersion.findFirst({
      where: { appId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (lastVersion?.version || 0) + 1;

    const version = await prisma.programVersion.create({
      data: {
        appId,
        version: nextVersion,
        programJson: programJson as any,
        isCurrent: true,
        publishedAt: new Date(),
      },
    });

    // Unset previous current version
    await prisma.programVersion.updateMany({
      where: { appId, id: { not: version.id } },
      data: { isCurrent: false },
    });

    // Set as current
    await prisma.app.update({
      where: { id: appId },
      data: { currentProgramVersionId: version.id },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('[POST /api/program-version]', error);
    return NextResponse.json(
      { error: 'Failed to save program' },
      { status: 500 }
    );
  }
}
