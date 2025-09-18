// app/api/polls/[id]/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: `Get poll details for ${params.id}` });
}
