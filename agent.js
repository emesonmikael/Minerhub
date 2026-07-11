/**
 * MinerHub - Node.js Mining Agent (Real XMRig + Simulação)
 * 
 * Um agente de telemetria ultra simples, leve e sem dependências externas!
 * Ele se comunica com a nossa console Next.js em tempo real e controla o XMRig real.
 * 
 * Para rodar:
 *   node agent.js [TOKEN_DA_MAQUINA] [SERVER_URL] [CAMINHO_DO_XMRIG]
 *   Exemplo: node agent.js tok_intel_99382 http://localhost:3000 ./xmrig.exe
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configurações Padrão
const DEFAULT_TOKEN = process.argv[2] || 'tok_node_agent_' + Math.random().toString(36).substring(2, 7);
const SERVER_URL = (process.argv[3] || 'http://localhost:3000').replace(/\/$/, '');
const PING_INTERVAL_MS = 5000; // ping a cada 5 segundos

// Tenta detectar automaticamente o executável real do XMRig na pasta local
function findXMRigBinary() {
  if (process.argv[4] && fs.existsSync(process.argv[4])) {
    return path.resolve(process.argv[4]);
  }
  
  const possibleNames = os.platform() === 'win32' 
    ? ['xmrig.exe', 'bin/xmrig.exe', '../xmrig.exe'] 
    : ['xmrig', './xmrig', 'bin/xmrig', '../xmrig'];
    
  for (const name of possibleNames) {
    const fullPath = path.resolve(__dirname, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

const xmrigPath = findXMRigBinary();

console.clear();
console.log('\x1b[36m%s\x1b[0m', '=========================================================');
console.log('\x1b[36m%s\x1b[0m', '          MINERHUB - AGENTE DE MINERAÇÃO NODE.JS         ');
console.log('\x1b[36m%s\x1b[0m', '=========================================================');
console.log(`Token do Agent: \x1b[33m${DEFAULT_TOKEN}\x1b[0m`);
console.log(`Servidor Alvo : \x1b[33m${SERVER_URL}\x1b[0m`);
if (xmrigPath) {
  console.log(`XMRig Detectado: \x1b[32m${xmrigPath}\x1b[0m`);
  console.log(`Modo de Operação: \x1b[32m[★] MINERAÇÃO REAL (HARDWARE XMRIG ATIVO)\x1b[0m`);
} else {
  console.log(`XMRig Detectado: \x1b[31mNão encontrado\x1b[0m`);
  console.log(`Modo de Operação: \x1b[33m[!] SIMULAÇÃO DE TELEMETRIA\x1b[0m`);
  console.log('  -> Dica para Mineração Real: Baixe o executável em https://xmrig.com/download');
  console.log('     e coloque o arquivo xmrig (ou xmrig.exe) na mesma pasta deste agent.js!');
}
console.log('---------------------------------------------------------');

// Coleta de dados básicos do sistema operacional real
function getSystemInfo() {
  const platformName = {
    'win32': 'Windows',
    'darwin': 'macOS',
    'linux': 'Linux'
  }[os.platform()] || os.platform();
  
  const osString = `${platformName} (${os.arch()}) - ${os.release()}`;
  const hostname = os.hostname();
  
  // Encontrar o IP local (rede privada)
  let localIp = '127.0.0.1';
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
  }

  // Uso de Memória Real
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const ramUsagePercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

  return { osString, hostname, localIp, ramUsagePercent };
}

// Variáveis de estado local do minerador
let isMiningActive = false;
let currentCpuLimit = 100;
let miningTimeSeconds = 0;

// Estado do Processo Real do XMRig
let xmrigProcess = null;
let realHashrate = 0;
let realXmrigVersion = xmrigPath ? 'XMRig Real (Detectado)' : 'Node.js-Agent v1.0 (Simulador)';

// Gerenciador do processo filho do XMRig
function startRealXMRig(config) {
  if (!xmrigPath) return;
  if (xmrigProcess) stopRealXMRig();

  const timeString = new Date().toLocaleTimeString();
  console.log(`[\x1b[32m${timeString}\x1b[0m] \x1b[32mIniciando processo real do XMRig...\x1b[0m`);
  
  let walletUser = config.wallet || '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjRPJlQBMwbp7GfG';
  const localSys = getSystemInfo();
  const workerName = (config.worker && config.worker !== 'worker_node') ? config.worker : (localSys.hostname || 'worker_node');
  let password = workerName;

  // Suporte Inteligente à Unmineable (ex: USDT, BTC, DOGE via RandomX rx/0)
  // Na Unmineable o formato obrigatório do usuário (-u) é: MOEDA:ENDERECO.NOME_DO_WORKER#REFERRAL
  if ((config.pool && config.pool.toLowerCase().includes('unmineable')) || walletUser.includes(':')) {
    if (!walletUser.includes('.')) {
      if (walletUser.includes('#')) {
        const parts = walletUser.split('#');
        walletUser = `${parts[0]}.${workerName}#${parts[1]}`;
      } else {
        walletUser = `${walletUser}.${workerName}`;
      }
    }
    // Para Unmineable, a senha padrão em -p costuma ser 'x' ou o nome do worker
    password = 'x';
    console.log(`  -> [\x1b[35mModo Unmineable\x1b[0m] Formatado para: \x1b[36m${walletUser}\x1b[0m`);
  }

  const args = [
    '-o', config.pool || 'pool.supportxmr.com:3333',
    '-u', walletUser,
    '-p', password,
    '-a', config.algo || 'rx/0',
    `--cpu-max-threads-hint=${config.cpuLimit || 100}`,
    '--http-host=127.0.0.1',
    '--http-port=16000',
    '--http-no-restricted',
    '--no-color'
  ];

  try {
    xmrigProcess = spawn(xmrigPath, args);

    xmrigProcess.stdout.on('data', (data) => {
      const output = data.toString();
      // Tenta extrair a versão do XMRig no início do log
      const verMatch = output.match(/XMRig\/([0-9.]+)/i);
      if (verMatch) realXmrigVersion = `XMRig v${verMatch[1]}`;

      // Extrai o hashrate real do stdout ex: "speed 10s/60s/15m 1250.5 1240.0 1230.0 H/s"
      const speedMatch = output.match(/speed 10s\/60s\/15m\s+([0-9.]+)/i);
      if (speedMatch && !isNaN(parseFloat(speedMatch[1]))) {
        realHashrate = Math.round(parseFloat(speedMatch[1]));
      }

      // Mostra logs importantes do minerador no console
      if (output.includes('accepted') || output.includes('speed') || output.includes('error')) {
        console.log(`\x1b[35m[XMRig Log]\x1b[0m ${output.trim().split('\n')[0]}`);
      }
    });

    xmrigProcess.stderr.on('data', (data) => {
      console.log(`\x1b[31m[XMRig Erro]\x1b[0m ${data.toString().trim()}`);
    });

    xmrigProcess.on('close', (code) => {
      console.log(`[\x1b[33m${new Date().toLocaleTimeString()}\x1b[0m] Processo XMRig encerrado com código ${code}`);
      xmrigProcess = null;
      realHashrate = 0;
    });
  } catch (err) {
    console.error(`\x1b[31mErro ao iniciar o executável XMRig:\x1b[0m`, err.message);
    xmrigProcess = null;
  }
}

function stopRealXMRig() {
  if (xmrigProcess) {
    console.log(`[\x1b[33m${new Date().toLocaleTimeString()}\x1b[0m] Parando o minerador XMRig...`);
    try {
      xmrigProcess.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
    xmrigProcess = null;
    realHashrate = 0;
  }
}

// Consulta a API HTTP local do XMRig (porta 16000) para obter precisão máxima no Hashrate
async function fetchRealXMRigHttpApi() {
  if (!xmrigProcess) return;
  try {
    const res = await fetch('http://127.0.0.1:16000/1/summary', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.hashrate && data.hashrate.total && data.hashrate.total[0]) {
        realHashrate = Math.round(data.hashrate.total[0]);
      }
      if (data && data.version) {
        realXmrigVersion = `XMRig v${data.version}`;
      }
    }
  } catch (err) {
    // A API HTTP ainda pode não estar pronta, o fallback do regex no stdout cuidará disso
  }
}

// Finaliza o XMRig caso o script Node seja fechado no terminal (Ctrl+C)
process.on('SIGINT', () => {
  stopRealXMRig();
  console.log('\n\x1b[36mAgente MinerHub finalizado com sucesso.\x1b[0m');
  process.exit(0);
});

// Loop de Telemetria principal
async function sendTelemetry() {
  const sys = getSystemInfo();

  if (xmrigProcess) {
    await fetchRealXMRigHttpApi();
  }

  let cpuUsage = 0;
  let hashrate = 0;
  let temperature = 0;

  if (isMiningActive) {
    miningTimeSeconds += PING_INTERVAL_MS / 1000;
    
    // Simula uso de CPU conforme o limite do painel (ou monitora carga do sistema)
    cpuUsage = Math.round(currentCpuLimit - (Math.random() * 5));
    cpuUsage = Math.max(5, Math.min(100, cpuUsage));

    if (xmrigPath && xmrigProcess) {
      // Se estamos com XMRig real ativo, usa o hashrate verdadeiro medido da máquina!
      hashrate = realHashrate;
    } else {
      // Simulação quando o executável do XMRig não foi baixado na pasta
      const baseHashrate = 2500;
      const limitFactor = currentCpuLimit / 100;
      const variance = (Math.random() - 0.5) * 100;
      hashrate = Math.round((baseHashrate * limitFactor) + variance);
      hashrate = Math.max(0, hashrate);
    }

    // Estimativa térmica da CPU
    const baseTemp = 45;
    const limitFactor = currentCpuLimit / 100;
    temperature = Math.round(baseTemp + (30 * limitFactor) + (Math.random() * 3 - 1.5));
  } else {
    miningTimeSeconds = 0;
  }

  const payload = {
    token: DEFAULT_TOKEN,
    name: sys.hostname,
    ip: sys.localIp,
    cpuUsage: cpuUsage,
    hashrate: hashrate,
    temperature: temperature,
    ramUsage: sys.ramUsagePercent,
    os: sys.osString,
    xmrigVersion: realXmrigVersion,
    worker: sys.hostname || 'node_worker'
  };

  try {
    const response = await fetch(`${SERVER_URL}/api/agent/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const command = await response.json();

    const wasMining = isMiningActive;
    isMiningActive = (command.status === 'online');
    const newCpuLimit = command.cpuLimit || 100;

    const timeString = new Date().toLocaleTimeString();

    if (isMiningActive) {
      if (!wasMining) {
        console.log(`[\x1b[32m${timeString}\x1b[0m] \x1b[32mComando recebido: INICIAR mineração!\x1b[0m`);
        console.log(`  -> Conectando a Pool: \x1b[35m${command.pool}\x1b[0m`);
        console.log(`  -> Carteira: \x1b[36m${command.wallet.substring(0, 15)}...\x1b[0m`);
        console.log(`  -> Algoritmo: \x1b[33m${command.algo}\x1b[0m`);
        
        if (xmrigPath) {
          startRealXMRig({ ...command, cpuLimit: newCpuLimit });
        } else {
          console.log(`  \x1b[33m[!] Aviso: Executável xmrig não encontrado. Rodando no Modo Simulação.\x1b[0m`);
        }
      } else if (newCpuLimit !== currentCpuLimit && xmrigProcess) {
        // Se o limite de CPU mudou no slider do painel enquanto rodava, reinicia o XMRig com nova thread hint
        console.log(`[\x1b[33m${timeString}\x1b[0m] Novo limite de CPU recebido: ${newCpuLimit}%. Ajustando XMRig...`);
        startRealXMRig({ ...command, cpuLimit: newCpuLimit });
      }
      
      currentCpuLimit = newCpuLimit;
      
      console.log(
        `[\x1b[32m${timeString}\x1b[0m] Ping enviado. \x1b[32m${xmrigPath ? 'MINERANDO (REAL)' : 'MINERANDO (SIMULADO)'}\x1b[0m | ` +
        `Hashrate: \x1b[33m${hashrate} H/s\x1b[0m | ` +
        `CPU: \x1b[36m${cpuUsage}%\x1b[0m (Teto: ${currentCpuLimit}%) | ` +
        `Temp: \x1b[31m${temperature}°C\x1b[0m | ` +
        `RAM: ${sys.ramUsagePercent}%`
      );
    } else {
      if (wasMining) {
        console.log(`[\x1b[31m${timeString}\x1b[0m] \x1b[31mComando recebido: PARAR mineração!\x1b[0m Processo finalizado.`);
        stopRealXMRig();
      }
      currentCpuLimit = newCpuLimit;
      console.log(`[\x1b[90m${timeString}\x1b[0m] Ping enviado. \x1b[37mocioso (parado via painel)\x1b[0m | RAM: ${sys.ramUsagePercent}%`);
    }

  } catch (error) {
    console.log(`[\x1b[31m${new Date().toLocaleTimeString()}\x1b[0m] \x1b[31mErro de Conexão:\x1b[0m ${error.message}. Tentando novamente em ${PING_INTERVAL_MS / 1000}s...`);
  }
}

// Iniciar pings periódicos
sendTelemetry();
setInterval(sendTelemetry, PING_INTERVAL_MS);

