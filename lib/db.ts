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
  miningTime: number; // in seconds
  temperature: number;
  xmrigVersion: string;
  os: string;
  ramUsage: number;
  cpuLimit: number;
  isRealAgent?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  computerId?: string;
  computerName?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export interface Settings {
  defaultPool: string;
  defaultWallet: string;
  algo: string;
  apiPort: number;
}

interface DBStructure {
  computers: Computer[];
  logs: LogEntry[];
  settings: Settings;
}

const DB_FILE = path.join(process.cwd(), 'minerhub_db.json');

const defaultSettings: Settings = {
  defaultPool: 'pool.monero.hashvault.pro:80',
  defaultWallet: '44AFFq5kSiGbU2Xm74A4Zt1S... (XMR Wallet)',
  algo: 'rx/0',
  apiPort: 3333,
};

const defaultComputers: Computer[] = [
  {
    id: 'pc-01',
    name: 'PC-01-IntelCore',
    ip: '192.168.1.108',
    token: 'tok_intel_99382',
    status: 'online',
    hashrate: 2450,
    cpuUsage: 75,
    worker: 'worker_intel',
    miningTime: 12540,
    temperature: 68,
    xmrigVersion: 'v6.21.0',
    os: 'Windows 11 Pro',
    ramUsage: 42,
    cpuLimit: 80,
  },
  {
    id: 'pc-02',
    name: 'PC-02-AMD-Ryzen',
    ip: '192.168.1.109',
    token: 'tok_ryzen_88123',
    status: 'online',
    hashrate: 4120,
    cpuUsage: 90,
    worker: 'worker_ryzen',
    miningTime: 48312,
    temperature: 74,
    xmrigVersion: 'v6.21.0',
    os: 'Windows 10 Enterprise',
    ramUsage: 56,
    cpuLimit: 100,
  },
  {
    id: 'pc-03',
    name: 'PC-03-ServerXeon',
    ip: '192.168.1.110',
    token: 'tok_xeon_11202',
    status: 'offline',
    hashrate: 0,
    cpuUsage: 0,
    worker: 'worker_server',
    miningTime: 0,
    temperature: 0,
    xmrigVersion: 'v6.20.0',
    os: 'Windows Server 2022',
    ramUsage: 12,
    cpuLimit: 50,
  },
];

const defaultLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    type: 'info',
    message: 'Sistema MinerHub inicializado com sucesso.',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString(),
    computerId: 'pc-01',
    computerName: 'PC-01-IntelCore',
    type: 'success',
    message: 'PC-01-IntelCore conectado ao Servidor Principal (192.168.1.107).',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    computerId: 'pc-02',
    computerName: 'PC-02-AMD-Ryzen',
    type: 'success',
    message: 'PC-02-AMD-Ryzen conectado ao Servidor Principal (192.168.1.107).',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    computerId: 'pc-01',
    computerName: 'PC-01-IntelCore',
    type: 'info',
    message: 'XMRig minerando em rx/0 (Worker: worker_intel, Hashrate: ~2.4 KH/s).',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    computerId: 'pc-02',
    computerName: 'PC-02-AMD-Ryzen',
    type: 'info',
    message: 'XMRig minerando em rx/0 (Worker: worker_ryzen, Hashrate: ~4.1 KH/s).',
  },
  {
    id: 'log-6',
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    computerId: 'pc-03',
    computerName: 'PC-03-ServerXeon',
    type: 'warning',
    message: 'PC-03-ServerXeon perdeu conexão (Tempo limite de ping excedido).',
  }
];

function readDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading DB, using default values', error);
  }

  // Create default db
  const initialDB: DBStructure = {
    computers: defaultComputers,
    logs: defaultLogs,
    settings: defaultSettings,
  };
  writeDB(initialDB);
  return initialDB;
}

function writeDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB', error);
  }
}

// In-Memory Fallback if FS fails or just global cache
let dbCache: DBStructure | null = null;

function getDB(): DBStructure {
  if (!dbCache) {
    dbCache = readDB();
  }
  return dbCache;
}

function saveDB(data: DBStructure) {
  dbCache = data;
  writeDB(data);
}

// Helper to simulate mining status changes in the background (real-time feel)
export function simulateActivity() {
  const db = getDB();
  let changed = false;

  db.computers = db.computers.map((comp) => {
    if (comp.status === 'online' && !comp.isRealAgent) {
      // Small random variations to mimic XMRig outputs
      const hashrateVariance = (Math.random() - 0.5) * 100; // +/- 50 H/s
      const cpuVariance = Math.round((Math.random() - 0.5) * 6); // +/- 3%
      const tempVariance = Math.round((Math.random() - 0.5) * 4); // +/- 2°C

      const originalHashrate = comp.id === 'pc-01' ? 2450 : 4120;
      const originalCpu = comp.id === 'pc-01' ? 75 : 90;
      const originalTemp = comp.id === 'pc-01' ? 68 : 74;

      const newHashrate = Math.max(100, Math.round(originalHashrate + hashrateVariance));
      const newCpu = Math.max(10, Math.min(100, Math.round(originalCpu + cpuVariance)));
      const newTemp = Math.max(40, Math.min(95, Math.round(originalTemp + tempVariance)));

      changed = true;
      return {
        ...comp,
        hashrate: Math.min(newHashrate, Math.round((comp.cpuLimit / 100) * originalHashrate * 1.1)),
        cpuUsage: Math.min(newCpu, comp.cpuLimit),
        temperature: newTemp,
        miningTime: comp.miningTime + 10, // Simulate 10s intervals
      };
    }
    return comp;
  });

  if (changed) {
    saveDB(db);
  }
}

export const db = {
  getComputers: (): Computer[] => {
    simulateActivity(); // Run simulation cycle on read
    return getDB().computers;
  },

  getComputer: (id: string): Computer | undefined => {
    simulateActivity();
    return getDB().computers.find((c) => c.id === id);
  },

  addComputer: (comp: Omit<Computer, 'id' | 'status' | 'hashrate' | 'cpuUsage' | 'miningTime' | 'temperature' | 'ramUsage'>): Computer => {
    const database = getDB();
    const newId = `pc-${Math.random().toString(36).substr(2, 9)}`;
    const newComp: Computer = {
      ...comp,
      id: newId,
      status: 'offline',
      hashrate: 0,
      cpuUsage: 0,
      miningTime: 0,
      temperature: 0,
      ramUsage: 0,
    };
    database.computers.push(newComp);
    
    // Add log entry
    db.addLog({
      computerId: newId,
      computerName: newComp.name,
      type: 'info',
      message: `Novo computador adicionado: ${newComp.name} (IP: ${newComp.ip})`,
    });

    saveDB(database);
    return newComp;
  },

  updateComputer: (id: string, updates: Partial<Computer>): Computer | undefined => {
    const database = getDB();
    const index = database.computers.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    const original = database.computers[index];
    const updated = { ...original, ...updates };
    database.computers[index] = updated;

    db.addLog({
      computerId: id,
      computerName: updated.name,
      type: 'info',
      message: `Configurações do computador atualizadas: ${updated.name}`,
    });

    saveDB(database);
    return updated;
  },

  deleteComputer: (id: string): boolean => {
    const database = getDB();
    const index = database.computers.findIndex((c) => c.id === id);
    if (index === -1) return false;

    const comp = database.computers[index];
    database.computers.splice(index, 1);

    db.addLog({
      type: 'warning',
      message: `Computador removido do painel: ${comp.name} (IP: ${comp.ip})`,
    });

    saveDB(database);
    return true;
  },

  startComputerMining: (id: string): boolean => {
    const database = getDB();
    const comp = database.computers.find((c) => c.id === id);
    if (!comp) return false;

    comp.status = 'online';
    comp.hashrate = comp.id === 'pc-01' ? 2450 : comp.id === 'pc-02' ? 4120 : 1800;
    comp.cpuUsage = comp.cpuLimit;
    comp.temperature = comp.id === 'pc-01' ? 62 : comp.id === 'pc-02' ? 70 : 55;
    comp.ramUsage = comp.id === 'pc-01' ? 40 : comp.id === 'pc-02' ? 52 : 30;

    db.addLog({
      computerId: id,
      computerName: comp.name,
      type: 'success',
      message: `Comando INICIAR recebido pelo Agent. XMRig ativo com sucesso.`,
    });

    saveDB(database);
    return true;
  },

  stopComputerMining: (id: string): boolean => {
    const database = getDB();
    const comp = database.computers.find((c) => c.id === id);
    if (!comp) return false;

    comp.status = 'offline';
    comp.hashrate = 0;
    comp.cpuUsage = 0;
    comp.temperature = 0;
    comp.ramUsage = 0;

    db.addLog({
      computerId: id,
      computerName: comp.name,
      type: 'warning',
      message: `Comando PARAR recebido pelo Agent. XMRig finalizado.`,
    });

    saveDB(database);
    return true;
  },

  restartComputerMining: (id: string): boolean => {
    const database = getDB();
    const comp = database.computers.find((c) => c.id === id);
    if (!comp) return false;

    comp.status = 'online';
    comp.miningTime = 0; // Reset mining time on restart
    comp.hashrate = comp.id === 'pc-01' ? 2450 : comp.id === 'pc-02' ? 4120 : 1800;
    comp.cpuUsage = comp.cpuLimit;
    comp.temperature = comp.id === 'pc-01' ? 60 : comp.id === 'pc-02' ? 68 : 50;

    db.addLog({
      computerId: id,
      computerName: comp.name,
      type: 'info',
      message: `Comando REINICIAR executado. Reiniciando processo XMRig...`,
    });

    saveDB(database);
    return true;
  },

  setComputerCpuLimit: (id: string, limit: number): boolean => {
    const database = getDB();
    const comp = database.computers.find((c) => c.id === id);
    if (!comp) return false;

    comp.cpuLimit = limit;
    if (comp.status === 'online') {
      comp.cpuUsage = limit;
      // Adjust hashrate down proportionally
      const originalHashrate = comp.id === 'pc-01' ? 2450 : comp.id === 'pc-02' ? 4120 : 1800;
      comp.hashrate = Math.round((limit / 100) * originalHashrate);
    }

    db.addLog({
      computerId: id,
      computerName: comp.name,
      type: 'info',
      message: `Limite de CPU alterado para ${limit}% no Agent. Processador reconfigurado.`,
    });

    saveDB(database);
    return true;
  },

  getLogs: (): LogEntry[] => {
    return getDB().logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const database = getDB();
    const newLog: LogEntry = {
      ...log,
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    database.logs.push(newLog);
    // Keep logs small
    if (database.logs.length > 100) {
      database.logs.shift();
    }
    saveDB(database);
    return newLog;
  },

  getSettings: (): Settings => {
    return getDB().settings;
  },

  saveSettings: (settings: Settings): Settings => {
    const database = getDB();
    database.settings = settings;
    saveDB(database);

    db.addLog({
      type: 'success',
      message: 'Configurações globais do MinerHub atualizadas com sucesso.',
    });

    return settings;
  }
};
