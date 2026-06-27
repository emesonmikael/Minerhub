import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = db.stopComputerMining(id);
  if (!success) {
    return NextResponse.json({ error: 'Computer not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'XMRig stopped successfully', status: 'offline' });
}
