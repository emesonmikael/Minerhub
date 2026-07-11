import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, name, ip, cpuUsage, hashrate, temperature, ramUsage, os, xmrigVersion, worker } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get current computers from DB
    const computers = db.getComputers();
    let computer = computers.find((c) => c.token === token);

    const settings = db.getSettings();

    if (!computer) {
      // If the computer doesn't exist, we can register it automatically!
      computer = db.addComputer({
        name: name || `Agent-${token.substring(0, 5)}`,
        ip: ip || '127.0.0.1',
        token: token,
        worker: worker || 'worker_node',
        xmrigVersion: xmrigVersion || 'Node.js-Agent v1.0',
        os: os || 'Node.js Environment',
        cpuLimit: 100,
      });

      // Mark as real agent
      db.updateComputer(computer.id, { isRealAgent: true, status: 'online' });
      
      db.addLog({
        computerId: computer.id,
        computerName: computer.name,
        type: 'success',
        message: `Novo Agent Node.js auto-registrado via token: ${token}`,
      });
    } else {
      // If the computer exists, ensure isRealAgent is true so simulation doesn't overwrite it
      if (!computer.isRealAgent) {
        db.updateComputer(computer.id, { isRealAgent: true });
      }

      // Update telemetry data reported by the real agent
      db.updateComputer(computer.id, {
        cpuUsage: cpuUsage ?? computer.cpuUsage,
        hashrate: hashrate ?? computer.hashrate,
        temperature: temperature ?? computer.temperature,
        ramUsage: ramUsage ?? computer.ramUsage,
        os: os || computer.os,
        xmrigVersion: xmrigVersion || computer.xmrigVersion,
        ip: ip || computer.ip,
        worker: worker || computer.worker,
        miningTime: computer.status === 'online' ? (computer.miningTime + 5) : 0,
      });
    }

    // Refresh computer state after potential updates
    const currentComp = db.getComputer(computer.id);

    // Return command instructions back to the agent
    return NextResponse.json({
      status: currentComp?.status || 'offline',
      cpuLimit: currentComp?.cpuLimit || 100,
      pool: settings.defaultPool,
      wallet: settings.defaultWallet,
      algo: settings.algo,
      worker: currentComp?.worker || currentComp?.name || 'worker_node',
    });
  } catch (error: any) {
    console.error('Error handling agent ping:', error);
    return NextResponse.json({ error: 'Invalid payload or server error' }, { status: 400 });
  }
}
