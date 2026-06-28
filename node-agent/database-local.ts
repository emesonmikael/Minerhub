// Copiado de /lib/db.ts para visualização direta
import fs from 'fs';
import path from 'path';

export interface Computer {
  id: string;
  name: string;
  ip: string;
  token: string;
  status: 'online' | 'offline';
  hashrate: number;
  cpuUsage: number;
  worker: string;
  miningTime: number; // em segundos
  temperature: number;
  xmrigVersion: string;
  os: string;
  ramUsage: number;
  cpuLimit: number;
  isRealAgent?: boolean;
}

// O banco de dados é um arquivo JSON simples chamado 'minerhub_db.json' na raiz do projeto!
// Super limpo, fácil de entender, ler e modificar diretamente com qualquer editor de texto.
const DB_FILE = path.join(process.cwd(), 'minerhub_db.json');

export const db = {
  getComputers: (): Computer[] => {
    // Retorna todos os computadores cadastrados do JSON...
    return [];
  },
  addComputer: (comp: any): Computer => {
    // Cadastra um novo computador no arquivo JSON...
    return {
      id: 'pc-mock',
      name: comp.name || 'PC-Mock',
      ip: comp.ip || '127.0.0.1',
      token: comp.token || '',
      status: 'offline',
      hashrate: 0,
      cpuUsage: 0,
      worker: comp.worker || 'worker_mock',
      miningTime: 0,
      temperature: 0,
      xmrigVersion: comp.xmrigVersion || 'v1.0',
      os: comp.os || 'Windows',
      ramUsage: 0,
      cpuLimit: 100
    };
  },
  updateComputer: (id: string, updates: Partial<Computer>): Computer | undefined => {
    // Atualiza as métricas ou configurações no JSON local...
    return undefined;
  },
  deleteComputer: (id: string): boolean => {
    // Remove o computador do arquivo JSON...
    return true;
  }
};
