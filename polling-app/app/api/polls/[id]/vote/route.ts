// app/api/polls/[id]/vote/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: `Cast vote for poll ${params.id}` });
}
