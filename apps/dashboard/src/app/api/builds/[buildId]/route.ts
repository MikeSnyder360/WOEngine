import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { buildId: string } }) {
  try {
    const build = await prisma.build.findUnique({
      where: { id: params.buildId },
      include: {
        brandManifest: true,
        programVersion: true,
      },
    });

    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    return NextResponse.json(build);
  } catch (error) {
    console.error('[GET /api/builds/:buildId]', error);
    return NextResponse.json({ error: 'Failed to fetch build' }, { status: 500 });
  }
}
