import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const logs = db.getLogs();
  return NextResponse.json(logs);
}
