import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const limit = parseInt(body.limit || body.cpuLimit || '100', 10);
    
    if (isNaN(limit) || limit < 10 || limit > 100) {
      return NextResponse.json({ error: 'CPU limit must be between 10 and 100' }, { status: 400 });
    }
    
    const success = db.setComputerCpuLimit(id, limit);
    if (!success) {
      return NextResponse.json({ error: 'Computer not found' }, { status: 404 });
    }
    return NextResponse.json({ message: `CPU limit changed to ${limit}%`, limit });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
