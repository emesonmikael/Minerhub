import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const computers = db.getComputers();
  
  const onlineCount = computers.filter(c => c.status === 'online').length;
  const offlineCount = computers.filter(c => c.status === 'offline').length;
  
  const totalHashrate = computers.reduce((acc, c) => acc + c.hashrate, 0);
  
  // Average CPU usage of online computers
  const onlineComputers = computers.filter(c => c.status === 'online');
  const averageCpu = onlineComputers.length > 0 
    ? Math.round(onlineComputers.reduce((acc, c) => acc + c.cpuUsage, 0) / onlineComputers.length)
    : 0;

  return NextResponse.json({
    totalHashrate,
    onlineCount,
    offlineCount,
    averageCpu,
    systemTime: new Date().toISOString(),
    settings: db.getSettings(),
  });
}
