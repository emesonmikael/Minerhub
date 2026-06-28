// Copiado de /app/api/agent/ping/route.ts para visualização direta
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, name, ip, cpuUsage, hashrate, temperature, ramUsage, os, xmrigVersion, worker } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Busca computadores no banco de dados JSON local (minerhub_db.json)
    const computers = db.getComputers();
    let computer = computers.find((c) => c.token === token);

    const settings = db.getSettings();

    if (!computer) {
      // Auto-registro caso a máquina não esteja cadastrada
      computer = db.addComputer({
        name: name || `Agent-${token.substring(0, 5)}`,
        ip: ip || '127.0.0.1',
        token: token,
        worker: worker || 'worker_node',
        xmrigVersion: xmrigVersion || 'Node.js-Agent v1.0',
        os: os || 'Node.js Environment',
        cpuLimit: 100,
      });

      // Marca como agente real rodando Node.js
      db.updateComputer(computer.id, { isRealAgent: true, status: 'online' });
    } else {
      // Atualiza a telemetria reportada em tempo real pela máquina física
      db.updateComputer(computer.id, {
        isRealAgent: true,
        cpuUsage: cpuUsage ?? computer.cpuUsage,
        hashrate: hashrate ?? computer.hashrate,
        temperature: temperature ?? computer.temperature,
        ramUsage: ramUsage ?? computer.ramUsage,
        os: os || computer.os,
        xmrigVersion: xmrigVersion || computer.xmrigVersion,
        ip: ip || computer.ip,
        miningTime: computer.status === 'online' ? (computer.miningTime + 5) : 0,
      });
    }

    const currentComp = db.getComputer(computer.id);

    // Retorna as instruções de controle ordenadas pelo painel (Ex: status de mineração e limite de CPU)
    return NextResponse.json({
      status: currentComp?.status || 'offline',
      cpuLimit: currentComp?.cpuLimit || 100,
      pool: settings.defaultPool,
      wallet: settings.defaultWallet,
      algo: settings.algo,
    });
  } catch (error: any) {
    console.error('Error handling agent ping:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
