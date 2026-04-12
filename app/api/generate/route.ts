import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { inngest } from '@/inngest/client';

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'You must be logged in to generate parlays' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const slateDate = body.slateDate || new Date().toISOString().split('T')[0];

  await inngest.send({
    name: 'trueline/generate.parlays',
    data: {
      slateDate,
      userId,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Parlay generation started. Results will appear shortly.',
    slateDate,
  });
}