import { NextRequest, NextResponse } from 'next/server';

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id || !ID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: 'Invalid or missing pobb.in ID' },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`https://pobb.in/${id}/raw`, {
      headers: {
        'User-Agent': 'PoE-SpeedRun-Planner/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `pobb.in returned ${response.status}` },
        { status: response.status },
      );
    }

    const code = await response.text();
    return NextResponse.json({ code });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch from pobb.in' },
      { status: 502 },
    );
  }
}
