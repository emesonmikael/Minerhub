import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const computer = db.getComputer(id);
  if (!computer) {
    return NextResponse.json({ error: 'Computer not found' }, { status: 404 });
  }
  return NextResponse.json(computer);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = db.updateComputer(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Computer not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = db.deleteComputer(id);
  if (!success) {
    return NextResponse.json({ error: 'Computer not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Computer deleted successfully' });
}
