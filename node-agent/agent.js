/**
 * MinerHub - Node.js Mining Agent
 * 
 * Um agente de telemetria ultra simples, leve e sem dependências externas!
 * Ele se comunica com a nossa console Next.js em tempo real.
 * 
 * Para rodar:
 *   node agent.js [TOKEN_DA_MAQUINA] [SERVER_URL]
 *   Exemplo: node agent.js tok_intel_99382 http://localhost:3000
 */

const os = require('os');

// Configurações Padrão
const DEFAULT_TOKEN = process.argv[2] || 'tok_node_agent_' + Math.random().toString(36).substring(2, 7);
const SERVER_URL = (process.argv[3] || 'http://localhost:3000').replace(/\/$/, '');
const PING_INTERVAL_MS = 5000; // ping a cada 5 segundos

console.clear();
console.log('\x1b[36m%s\x1b[0m', '=========================================================');
console.log('\x1b[36m%s\x1b[0m', '          MINERHUB - AGENTE DE MINERAÇÃO NODE.JS         ');
console.log('\x1b[36m%s\x1b[0m', '=========================================================');
console.log(`Token do Agent: \x1b[33m${DEFAULT_TOKEN}\x1b[0m`);
console.log(`Servidor Alvo : \x1b[33m${SERVER_URL}\x1b[0m`);
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

// Loop de Telemetria principal
async function sendTelemetry() {
  const sys = getSystemInfo();

  // Se a mineração estiver ativa, simular métricas com base no limite de CPU definido
  let cpuUsage = 0;
  let hashrate = 0;
  let temperature = 0;

  if (isMiningActive) {
    miningTimeSeconds += PING_INTERVAL_MS / 1000;
    
    // Simula uso de CPU conforme o limite do painel
    cpuUsage = Math.round(currentCpuLimit - (Math.random() * 5));
    cpuUsage = Math.max(5, Math.min(100, cpuUsage));

    // Hashrate proporcional ao limite de CPU (base ~2500 H/s para 100% de CPU)
    const baseHashrate = 2500;
    const limitFactor = currentCpuLimit / 100;
    const variance = (Math.random() - 0.5) * 100; // +/- 50 H/s
    hashrate = Math.round((baseHashrate * limitFactor) + variance);
    hashrate = Math.max(0, hashrate);

    // Temperatura proporcional ao esforço
    const baseTemp = 45;
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
    xmrigVersion: 'Node.js-Agent v1.0',
    worker: 'node_worker'
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

    // Atualiza o estado local de acordo com o comando do painel
    const wasMining = isMiningActive;
    isMiningActive = (command.status === 'online');
    currentCpuLimit = command.cpuLimit || 100;

    const timeString = new Date().toLocaleTimeString();

    if (isMiningActive) {
      if (!wasMining) {
        console.log(`[\x1b[32m${timeString}\x1b[0m] \x1b[32mComando recebido: INICIAR mineração!\x1b[0m`);
        console.log(`  -> Conectando a Pool: \x1b[35m${command.pool}\x1b[0m`);
        console.log(`  -> Carteira: \x1b[36m${command.wallet.substring(0, 15)}...\x1b[0m`);
        console.log(`  -> Algoritmo: \x1b[33m${command.algo}\x1b[0m`);
      }
      
      console.log(
        `[\x1b[32m${timeString}\x1b[0m] Ping enviado. \x1b[32mMINERANDO\x1b[0m | ` +
        `Hashrate: \x1b[33m${hashrate} H/s\x1b[0m | ` +
        `CPU: \x1b[36m${cpuUsage}%\x1b[0m (Teto: ${currentCpuLimit}%) | ` +
        `Temp: \x1b[31m${temperature}°C\x1b[0m | ` +
        `RAM: ${sys.ramUsagePercent}%`
      );
    } else {
      if (wasMining) {
        console.log(`[\x1b[31m${timeString}\x1b[0m] \x1b[31mComando recebido: PARAR mineração!\x1b[0m Processo XMRig finalizado.`);
      }
      console.log(`[\x1b[90m${timeString}\x1b[0m] Ping enviado. \x1b[37mocioso (parado via painel)\x1b[0m | RAM: ${sys.ramUsagePercent}%`);
    }

  } catch (error) {
    console.log(`[\x1b[31m${new Date().toLocaleTimeString()}\x1b[0m] \x1b[31mErro de Conexão:\x1b[0m ${error.message}. Tentando novamente em ${PING_INTERVAL_MS / 1000}s...`);
  }
}

// Iniciar pings periódicos
sendTelemetry();
setInterval(sendTelemetry, PING_INTERVAL_MS);
