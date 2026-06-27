import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const computers = db.getComputers();
  return NextResponse.json(computers);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.ip || !body.token) {
      return NextResponse.json({ error: 'Name, IP and Token are required' }, { status: 400 });
    }
    const newComp = db.addComputer({
      name: body.name,
      ip: body.ip,
      token: body.token,
      worker: body.worker || 'worker_default',
      xmrigVersion: body.xmrigVersion || 'v6.21.0',
      os: body.os || 'Windows 10',
      cpuLimit: body.cpuLimit || 100,
    });
    return NextResponse.json(newComp, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
