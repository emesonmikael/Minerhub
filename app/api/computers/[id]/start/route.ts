import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = db.startComputerMining(id);
  if (!success) {
    return NextResponse.json({ error: 'Computer not found or offline' }, { status: 404 });
  }
  return NextResponse.json({ message: 'XMRig started successfully', status: 'online' });
}
