import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, contactEmail } = body;

    if (!companyName || !contactEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, contactEmail' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.create({
      data: {
        companyName,
        contactEmail,
      },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('[POST /api/tenants]', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: true,
        apps: true,
      },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('[GET /api/tenants]', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}
