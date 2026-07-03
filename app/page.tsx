'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  Hash, 
  Clock, 
  FileCode, 
  Folder, 
  FolderOpen, 
  LogOut, 
  Logs, 
  Play, 
  Square, 
  RotateCcw, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  AlertTriangle, 
  Copy, 
  Terminal, 
  Monitor, 
  RefreshCw, 
  Thermometer, 
  ChevronRight, 
  CheckCircle2, 
  Info,
  Sliders,
  Server
} from 'lucide-react';

// Interfaces mapping database models
interface Computer {
  id: string;
  name: string;
  ip: string;
  token: string;
  status: 'online' | 'offline';
  hashrate: number;
  cpuUsage: number;
  worker: string;
  miningTime: number;
  temperature: number;
  xmrigVersion: string;
  os: string;
  ramUsage: number;
  cpuLimit: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  computerId?: string;
  computerName?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

interface Settings {
  defaultPool: string;
  defaultWallet: string;
  algo: string;
  apiPort: number;
}

interface CodeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: CodeNode[];
}

export default function MinerHubWebConsole() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Core Data State
  const [computers, setComputers] = useState<Computer[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalHashrate: 0,
    onlineCount: 0,
    offlineCount: 0,
    averageCpu: 0,
    systemTime: '',
  });

  // UI Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'logs' | 'code'>('dashboard');
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [editingComputer, setEditingComputer] = useState<Computer | null>(null);
  const [isAddingComputer, setIsAddingComputer] = useState<boolean>(false);

  // Code Explorer State
  const [codeTree, setCodeTree] = useState<CodeNode[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('README.md');
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [isCodeLoading, setIsCodeLoading] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '': true,
  });

  // New Computer Form State
  const [newCompName, setNewCompName] = useState('');
  const [newCompIp, setNewCompIp] = useState('');
  const [newCompToken, setNewCompToken] = useState('');
  const [newCompWorker, setNewCompWorker] = useState('');
  const [newCompOs, setNewCompOs] = useState('Windows 11 Pro');
  const [newCompXmrig, setNewCompXmrig] = useState('v6.21.0');

  // Edit Global Settings Form State
  const [poolForm, setPoolForm] = useState('');
  const [walletForm, setWalletForm] = useState('');
  const [algoForm, setAlgoForm] = useState('rx/0');
  const [portForm, setPortForm] = useState(3333);

  // Chart state (Dynamic history for real-time hashrate graphs)
  const [hashrateHistory, setHashrateHistory] = useState<number[]>(Array(12).fill(6570));
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Simulation timer ref for background polling
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    // Simulated API response matching standard credentials
    setTimeout(() => {
      if (usernameInput.toLowerCase() === 'admin' && passwordInput === 'admin123') {
        setIsAuthenticated(true);
        // Toast / System log
        fetchData();
      } else {
        setLoginError('Credenciais inválidas. Use admin / admin123.');
      }
      setIsLoggingIn(false);
    }, 800);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  // Fetch all dashboard & computers data
  const fetchData = async () => {
    try {
      // 1. Dashboard Aggregate metrics
      const dashRes = await fetch('/api/dashboard');
      const dashData = await dashRes.json();
      setDashboardStats({
        totalHashrate: dashData.totalHashrate,
        onlineCount: dashData.onlineCount,
        offlineCount: dashData.offlineCount,
        averageCpu: dashData.averageCpu,
        systemTime: dashData.systemTime,
      });

      if (dashData.settings) {
        setSettings(dashData.settings);
        if (!poolForm) {
          setPoolForm(dashData.settings.defaultPool);
          setWalletForm(dashData.settings.defaultWallet);
          setAlgoForm(dashData.settings.algo);
          setPortForm(dashData.settings.apiPort);
        }
      }

      // 2. Computers list
      const compRes = await fetch('/api/computers');
      const compData = await compRes.json();
      setComputers(compData);

      // Add to our history chart data points
      setHashrateHistory(prev => {
        const next = [...prev.slice(1), dashData.totalHashrate];
        return next;
      });

      // 3. System Logs
      const logsRes = await fetch('/api/logs');
      const logsData = await logsRes.json();
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to sync telemetry from MinerHub API', error);
    }
  };

  // Fetch C# Code structure on tab selection
  const fetchCodeStructure = async () => {
    try {
      const res = await fetch('/api/code');
      const data = await res.json();
      if (data.tree) {
        setCodeTree(data.tree);
        // Load initial selected file content
        loadFileContent(selectedFilePath);
      }
    } catch (err) {
      console.error('Error fetching C# projects tree', err);
    }
  };

  const loadFileContent = async (filePath: string) => {
    setIsCodeLoading(true);
    try {
      const res = await fetch(`/api/code?file=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.content) {
        setSelectedFileContent(data.content);
        setSelectedFilePath(filePath);
      } else {
        setSelectedFileContent('Erro ao carregar o conteúdo do arquivo.');
      }
    } catch (err) {
      setSelectedFileContent('Falha ao conectar com o visualizador de código.');
    } finally {
      setIsCodeLoading(false);
    }
  };

  // Trigger telemetry updates every 3 seconds
  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        fetchData();
      }, 0);
      pollIntervalRef.current = setInterval(fetchData, 3000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isAuthenticated]);

  // Fetch Code structure when tab changes to code
  useEffect(() => {
    if (activeTab === 'code' && isAuthenticated) {
      setTimeout(() => {
        fetchCodeStructure();
      }, 0);
    }
  }, [activeTab, isAuthenticated]);

  // Command handlers connecting client to NextJS backend API
  const handleCommand = async (id: string, command: 'start' | 'stop' | 'restart') => {
    try {
      const res = await fetch(`/api/computers/${id}/${command}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchData();
        // Update local status quickly for seamless feel
        setComputers(prev => prev.map(c => {
          if (c.id === id) {
            return {
              ...c,
              status: command === 'stop' ? 'offline' : 'online',
              hashrate: command === 'stop' ? 0 : c.hashrate,
              cpuUsage: command === 'stop' ? 0 : c.cpuUsage,
            };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error(`Failed to send ${command} command`, err);
    }
  };

  const handleCpuLimit = async (id: string, limit: number) => {
    try {
      const res = await fetch(`/api/computers/${id}/cpu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpuLimit: limit }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to change CPU limit', err);
    }
  };

  // Create new computer via API
  const handleAddComputer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName || !newCompIp || !newCompToken) return;

    try {
      const res = await fetch('/api/computers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompName,
          ip: newCompIp,
          token: newCompToken,
          worker: newCompWorker || 'worker_win',
          os: newCompOs,
          xmrigVersion: newCompXmrig,
        }),
      });

      if (res.ok) {
        setIsAddingComputer(false);
        setNewCompName('');
        setNewCompIp('');
        setNewCompToken('');
        setNewCompWorker('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create computer entry', err);
    }
  };

  // Save Computer edits
  const handleSaveComputerEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComputer) return;

    try {
      const res = await fetch(`/api/computers/${editingComputer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingComputer),
      });

      if (res.ok) {
        setEditingComputer(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to save computer changes', err);
    }
  };

  // Delete computer
  const handleDeleteComputer = async (id: string) => {
    if (!confirm('Deseja realmente remover este computador do painel? O Agent local perderá conexão.')) return;

    try {
      const res = await fetch(`/api/computers/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete computer', err);
    }
  };

  // Save global settings
  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultPool: poolForm,
          defaultWallet: walletForm,
          algo: algoForm,
          apiPort: portForm,
        }),
      });
      if (res.ok) {
        alert('Configurações globais salvas e transmitidas aos Agents!');
        fetchData();
      }
    } catch (err) {
      console.error('Error saving global configurations', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatHashrate = (rate: number) => {
    if (rate >= 1000) {
      return `${(rate / 1000).toFixed(2)} KH/s`;
    }
    return `${rate} H/s`;
  };

  const formatMiningTime = (seconds: number) => {
    if (seconds <= 0) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };

  // Helper to render folders recursively in C# Code Explorer
  const renderTreeItem = (node: CodeNode, depth = 0) => {
    const isFolder = node.type === 'directory';
    const isExpanded = expandedFolders[node.path];

    const toggleFolder = () => {
      setExpandedFolders(prev => ({
        ...prev,
        [node.path]: !prev[node.path],
      }));
    };

    return (
      <div key={node.path} className="select-none">
        <div 
          onClick={isFolder ? toggleFolder : () => loadFileContent(node.path)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={`flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer text-sm transition-colors ${
            selectedFilePath === node.path 
              ? 'bg-orange-500/10 text-orange-500 border-l-2 border-orange-500' 
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          {isFolder ? (
            <>
              {isExpanded ? <FolderOpen className="w-4 h-4 text-orange-500" /> : <Folder className="w-4 h-4 text-orange-500" />}
              <span className="font-semibold">{node.name}</span>
            </>
          ) : (
            <>
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>{node.name}</span>
            </>
          )}
        </div>
        {isFolder && isExpanded && node.children && (
          <div className="mt-0.5">
            {node.children.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // VIEW 1: LOGIN CARD SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0E14] px-4 relative overflow-hidden" id="login_screen">
        {/* Subtle geometric neon background decoration */}
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-orange-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/5 blur-[120px]" />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#1B212C] border border-slate-700/50 rounded-2xl p-8 shadow-2xl ring-1 ring-white/5 relative z-10"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-3 border border-orange-400/20">
              <i className="fa-solid fa-server text-black text-2xl font-bold"></i>
            </div>
            <h1 className="text-2xl font-black tracking-wider uppercase text-white">MINER<span className="text-orange-500">HUB</span></h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">XMRIG CENTRAL MANAGEMENT CONSOLE</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Usuário do Sistema
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <i className="fa-solid fa-user text-sm"></i>
                </span>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#151921] border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm font-mono"
                  placeholder="Ex: admin"
                  id="login_username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Senha Administrativa
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <i className="fa-solid fa-lock text-sm"></i>
                </span>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#151921] border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm font-mono"
                  placeholder="••••••••"
                  id="login_password"
                />
              </div>
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700 text-black font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-orange-500/20 flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
              id="login_submit"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AUTENTICANDO...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  <span>ENTRAR NO SISTEMA</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-800 pt-4 text-center">
            <span className="text-[10px] text-slate-500 font-mono">
              MinerHub Web Console v1.0.0 • C# Backend Ready
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: FULL FULL-STACK WEB CONSOLE INTERFACE
  // -------------------------------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0E14] text-slate-200" id="minerhub_main_app">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-50 bg-[#151921] border-b border-slate-800 px-4 py-3 shadow-md" id="header_section">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Server Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white uppercase">MINER<span className="text-orange-500">HUB</span></span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                  ● ONLINE
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                Server IP: <span className="text-orange-500 font-bold">192.168.1.107</span> • SQLite Connection: Ready
              </p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <nav className="flex items-center gap-1.5 bg-[#11141B] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-orange-500 text-black font-bold shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1B212C]/50'
              }`}
              id="tab_dashboard"
            >
              <i className="fa-solid fa-chart-line text-sm"></i>
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'config' 
                  ? 'bg-orange-500 text-black font-bold shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1B212C]/50'
              }`}
              id="tab_config"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Configurações</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'logs' 
                  ? 'bg-orange-500 text-black font-bold shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1B212C]/50'
              }`}
              id="tab_logs"
            >
              <Logs className="w-4 h-4" />
              <span>Logs do Sistema</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'code' 
                  ? 'bg-orange-500 text-black font-bold shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1B212C]/50'
              }`}
              id="tab_code"
            >
              <FileCode className="w-4 h-4" />
              <span>Código Fonte Node.js</span>
            </button>
          </nav>

          {/* Logout & Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-300 block">Administrador</span>
              <span className="text-[10px] font-mono text-emerald-400">JWT Token Active</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-[#1B212C] hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-all border border-slate-800 cursor-pointer"
              title="Sair do Sistema"
              id="button_logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>
      </header>

      {/* AGGREGATED METRICS SUMMARY BAR (Always visible to keep eye on nodes) */}
      <section className="bg-[#0B0E14] border-b border-slate-800 py-4 px-4" id="metrics_bar">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Metric 1 */}
          <div className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-4 shadow-xl ring-1 ring-white/5 flex items-center gap-3.5 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <i className="fa-solid fa-bolt text-lg"></i>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Hashrate Total</span>
              <span className="text-lg font-black text-orange-500">{formatHashrate(dashboardStats.totalHashrate)}</span>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-5 group-hover:scale-125 transition-all">
              <i className="fa-solid fa-bolt text-5xl"></i>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-4 shadow-xl ring-1 ring-white/5 flex items-center gap-3.5 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <i className="fa-solid fa-circle-check text-lg"></i>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Maquinas Ativas</span>
              <span className="text-lg font-black text-emerald-400">{dashboardStats.onlineCount} / {computers.length}</span>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-5 group-hover:scale-125 transition-all">
              <i className="fa-solid fa-server text-5xl"></i>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-4 shadow-xl ring-1 ring-white/5 flex items-center gap-3.5 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <i className="fa-solid fa-circle-xmark text-lg"></i>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Maquinas Inativas</span>
              <span className="text-lg font-black text-rose-400">{dashboardStats.offlineCount}</span>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-5 group-hover:scale-125 transition-all">
              <i className="fa-solid fa-power-off text-5xl"></i>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-4 shadow-xl ring-1 ring-white/5 flex items-center gap-3.5 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Cpu className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Consumo Médio CPU</span>
              <span className="text-lg font-black text-cyan-400">{dashboardStats.averageCpu}%</span>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-5 group-hover:scale-125 transition-all">
              <Cpu className="w-12 h-12" />
            </div>
          </div>

          {/* Metric 5 */}
          <div className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-4 shadow-xl ring-1 ring-white/5 flex items-center gap-3.5 col-span-2 md:col-span-1 relative overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Data/Hora Servidor</span>
              <span className="text-sm font-mono font-bold text-indigo-300 block truncate">
                {dashboardStats.systemTime ? new Date(dashboardStats.systemTime).toLocaleTimeString('pt-BR') : '00:00:00'} (UTC)
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6" id="main_content_area">
        <AnimatePresence mode="wait">
          
          {/* =========================================================
              TAB 1: SYSTEM DASHBOARD (MINE GRID & CHART)
              ========================================================= */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Graphic analytics panel - inspired by NiceHash / HiveOS */}
              <div className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-5 shadow-xl ring-1 ring-white/5 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div>
                    <h2 className="text-sm font-black text-orange-500 tracking-wider uppercase font-mono">Histórico de Telemetria Total</h2>
                    <p className="text-xs text-slate-400">Taxa de Hashrate combinada do parque de servidores (H/s)</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      Hashrate Acumulado
                    </span>
                    <button 
                      onClick={fetchData}
                      className="text-orange-500 hover:text-orange-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
                      <span>Sincronizar</span>
                    </button>
                  </div>
                </div>

                {/* Elegant dynamic custom SVG Chart */}
                <div className="h-28 w-full mt-2 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#1d2733" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#1d2733" strokeWidth="0.5" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#1d2733" strokeWidth="0.5" />

                    {/* Chart path generation */}
                    {(() => {
                      const maxVal = Math.max(...hashrateHistory, 8000);
                      const minVal = 0;
                      const range = maxVal - minVal || 1;
                      
                      const points = hashrateHistory.map((val, idx) => {
                        const x = (idx / (hashrateHistory.length - 1)) * 100;
                        const y = 90 - ((val - minVal) / range) * 80; // Scale with buffer
                        return { x, y };
                      });

                      const pathD = points.reduce((acc, p, i) => {
                        return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                      }, '');

                      const fillD = pathD + ` L 100 100 L 0 100 Z`;

                      return (
                        <>
                          <path d={fillD} fill="url(#chartGradient)" />
                          <path d={pathD} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                          
                          {/* Pulsing pointer on latest coordinate */}
                          {points.length > 0 && (
                            <circle 
                              cx={points[points.length - 1].x} 
                              cy={points[points.length - 1].y} 
                              r="1.8" 
                              fill="#f97316" 
                              className="animate-ping"
                              style={{ transformOrigin: `${points[points.length - 1].x}% ${points[points.length - 1].y}%` }}
                            />
                          )}
                        </>
                      );
                    })()}
                  </svg>
                  
                  {/* Min / Max Labels */}
                  <div className="absolute top-0 right-1 bg-slate-900/60 font-mono text-[9px] text-slate-500 border border-slate-800 rounded px-1">
                    Max: {formatHashrate(Math.max(...hashrateHistory, 8000))}
                  </div>
                  <div className="absolute bottom-0 right-1 bg-slate-900/60 font-mono text-[9px] text-slate-500 border border-slate-800 rounded px-1">
                    Min: 0 H/s
                  </div>
                </div>
              </div>

              {/* GRID HEADER AND QUICK ADD COMPUTER BUTTON */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-200">Máquinas Mineradoras na Rede</h3>
                  <p className="text-xs text-slate-400 font-mono">Agents ativos relatando telemetria local</p>
                </div>
                <button
                  onClick={() => setActiveTab('config')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Computador</span>
                </button>
              </div>

              {/* CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="miner_cards_grid">
                {computers.map((comp) => {
                  const isOnline = comp.status === 'online';
                  
                  return (
                    <div 
                      key={comp.id}
                      className={`bg-[#1B212C] border rounded-2xl p-5 shadow-xl ring-1 ring-white/5 relative flex flex-col justify-between transition-all duration-300 hover:border-slate-600 ${
                        isOnline ? 'border-slate-700/50' : 'border-red-900/50 opacity-75 shadow-red-500/10'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between border-b border-slate-800 pb-3.5 mb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-200 text-sm tracking-wide" id={`comp_name_${comp.id}`}>{comp.name}</h4>
                              {isOnline ? (
                                <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[9px] font-black uppercase rounded border border-green-500/20 tracking-widest">ONLINE</span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-black uppercase rounded border border-red-500/20 tracking-widest">OFFLINE</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">{comp.ip}</p>
                          </div>
                        </div>

                        {/* OS Icon Badge */}
                        <div className="bg-[#151921] border border-slate-700/60 text-slate-300 text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
                          <i className="fa-brands fa-windows text-blue-400"></i>
                          <span>Agent {comp.xmrigVersion}</span>
                        </div>
                      </div>

                      {/* Card Body Core Telemetries */}
                      <div className="space-y-3 flex-1 mb-5">
                        
                        {/* 1. Hashrate Display */}
                        <div className="bg-[#151921] border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium">Velocidade (Hashrate)</span>
                          <span className={`font-black text-base font-mono ${isOnline ? 'text-orange-500' : 'text-slate-500'}`}>
                            {isOnline ? formatHashrate(comp.hashrate) : '0 H/s'}
                          </span>
                        </div>

                        {/* 2. Micro progress metrics */}
                        <div className="grid grid-cols-2 gap-3.5">
                          {/* CPU usage */}
                          <div className="bg-[#151921]/50 border border-slate-800/80 rounded-xl p-2.5 relative">
                            <div className="flex justify-between items-center text-[10px] mb-1 text-slate-400 font-mono">
                              <span>PROCESSADOR</span>
                              <span className="font-bold text-cyan-400">{isOnline ? `${comp.cpuUsage}%` : '0%'}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div 
                                className="bg-cyan-400 h-full transition-all duration-1000" 
                                style={{ width: isOnline ? `${comp.cpuUsage}%` : '0%' }}
                              />
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono mt-1 block">Teto Limit: {comp.cpuLimit}%</span>
                          </div>

                          {/* CPU Temp */}
                          <div className="bg-[#151921]/50 border border-slate-800/80 rounded-xl p-2.5 relative">
                            <div className="flex justify-between items-center text-[10px] mb-1 text-slate-400 font-mono">
                              <span>TEMPERATURA</span>
                              <span className={`font-bold ${isOnline && comp.temperature > 72 ? 'text-orange-500' : 'text-orange-500'}`}>
                                {isOnline ? `${comp.temperature}°C` : '0°C'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${comp.temperature > 72 ? 'bg-orange-500' : 'bg-orange-500'}`}
                                style={{ width: isOnline ? `${(comp.temperature / 100) * 100}%` : '0%' }}
                              />
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                              RAM: {isOnline ? `${comp.ramUsage}%` : '0%'}
                            </span>
                          </div>
                        </div>

                        {/* Extra status rows */}
                        <div className="space-y-1.5 pt-1.5 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Worker ID:</span>
                            <span className="text-slate-200 font-semibold">{comp.worker}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tempo Ativo:</span>
                            <span className="text-slate-200 font-semibold">{isOnline ? formatMiningTime(comp.miningTime) : 'Offline'}</span>
                          </div>
                        </div>

                      </div>

                      {/* Card Footer Control Buttons */}
                      <div className="border-t border-slate-850 pt-4 space-y-3">
                        <div className="grid grid-cols-3 gap-1.5">
                          {/* Iniciar */}
                          <button
                            onClick={() => handleCommand(comp.id, 'start')}
                            disabled={isOnline}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                              isOnline 
                                ? 'bg-[#151921] border-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-orange-500 border-orange-500 text-black hover:bg-orange-600 hover:border-orange-600 font-black'
                            }`}
                            title="Iniciar Mineração XMRig"
                          >
                            <Play className="w-3 h-3" />
                            <span>INICIAR</span>
                          </button>

                          {/* Parar */}
                          <button
                            onClick={() => handleCommand(comp.id, 'stop')}
                            disabled={!isOnline}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                              !isOnline 
                                ? 'bg-[#151921] border-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                            }`}
                            title="Parar Processo Minerador"
                          >
                            <Square className="w-3 h-3" />
                            <span>PARAR</span>
                          </button>

                          {/* Reiniciar */}
                          <button
                            onClick={() => handleCommand(comp.id, 'restart')}
                            disabled={!isOnline}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                              !isOnline 
                                ? 'bg-[#151921] border-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/30'
                            }`}
                            title="Reiniciar Conexão e XMRig"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>REINICIAR</span>
                          </button>
                        </div>

                        {/* Slider to alter CPU Limit dynamically */}
                        <div className="bg-[#151921] border border-slate-800/80 rounded-xl p-2.5">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1.5">
                            <span className="flex items-center gap-1">
                              <Sliders className="w-3 h-3 text-orange-500" /> Limitador CPU
                            </span>
                            <span className="font-bold text-orange-500">{comp.cpuLimit}%</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            step="10"
                            value={comp.cpuLimit}
                            onChange={(e) => handleCpuLimit(comp.id, parseInt(e.target.value))}
                            className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Details popup activation */}
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <span className="text-slate-500 font-mono">ID: {comp.id}</span>
                          <button
                            onClick={() => setSelectedComputer(comp)}
                            className="text-orange-500 hover:text-orange-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <span>Advanced Hardware Details</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

            </motion.div>
          )}

          {/* =========================================================
              TAB 2: CONFIGURATION & FORMS
              ========================================================= */}
          {activeTab === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* LEFT HALF: MANAGE / ADD COMPUTERS */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Register Miner Panel */}
                <div className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-5 shadow-xl ring-1 ring-white/5">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm tracking-wide text-orange-500 uppercase font-mono">Cadastrar Nova Máquina Mineradora</h3>
                      <p className="text-xs text-slate-400">Adicione computadores locais que rodam o MinerHub.Agent</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddComputer} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Nome da Máquina</label>
                      <input
                        type="text"
                        required
                        value={newCompName}
                        onChange={(e) => setNewCompName(e.target.value)}
                        placeholder="Ex: PC-04-Ryzen9"
                        className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Endereço IP Local</label>
                      <input
                        type="text"
                        required
                        value={newCompIp}
                        onChange={(e) => setNewCompIp(e.target.value)}
                        placeholder="Ex: 192.168.1.112"
                        className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Token de Comunicação (Segurança)</label>
                      <input
                        type="text"
                        required
                        value={newCompToken}
                        onChange={(e) => setNewCompToken(e.target.value)}
                        placeholder="Ex: tok_ryzen_4492"
                        className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Nome do Worker XMRig</label>
                      <input
                        type="text"
                        value={newCompWorker}
                        onChange={(e) => setNewCompWorker(e.target.value)}
                        placeholder="Ex: worker_office"
                        className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>CADASTRAR E ADICIONAR AO SQLITE</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. Registered Computers Administration List */}
                <div className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-5 shadow-xl ring-1 ring-white/5">
                  <h3 className="font-black text-sm tracking-wide text-slate-200 uppercase font-mono border-b border-slate-800 pb-3 mb-4">
                    Gerenciar Máquinas Cadastradas ({computers.length})
                  </h3>

                  <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto pr-1">
                    {computers.map(comp => (
                      <div key={comp.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            comp.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            <i className="fa-solid fa-desktop text-sm"></i>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-100 block">{comp.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{comp.ip} • Token: <span className="text-orange-500">{comp.token}</span></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingComputer(comp)}
                            className="p-1.5 bg-[#151921] border border-slate-700 hover:bg-[#253242] text-slate-300 hover:text-orange-500 rounded-lg transition-all cursor-pointer"
                            title="Editar Dados"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteComputer(comp.id)}
                            className="p-1.5 bg-[#151921] border border-slate-700 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                            title="Excluir Computador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {computers.length === 0 && (
                      <div className="py-6 text-center text-slate-500 text-xs font-mono">
                        Nenhum computador cadastrado no banco SQLite.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT HALF: GLOBAL MINING PARAMETERS */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-5 shadow-xl ring-1 ring-white/5">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm tracking-wide text-orange-500 uppercase font-mono">Parâmetros de Mineração Globais</h3>
                      <p className="text-xs text-slate-400">Valores padrão aplicados aos Agents</p>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider w-full mb-0.5 font-mono">⚡ Predefinições Rápidas (Pressione para auto-preencher):</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPoolForm('rx.unmineable.com:3333');
                        setWalletForm('USDT:0xSeuEnderecoUSDTaqui');
                        setAlgoForm('rx/0');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>⚡ Unmineable (USDT / BTC / DOGE)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPoolForm('pool.monero.hashvault.pro:80');
                        setWalletForm('44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjRPJlQBMwbp7GfG');
                        setAlgoForm('rx/0');
                      }}
                      className="px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>⚡ Monero Padrão (SupportXMR / Hashvault)</span>
                    </button>
                  </div>

                  <form onSubmit={handleSaveGlobalSettings} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Pool de Mineração Padrão</label>
                      <input
                        type="text"
                        required
                        value={poolForm}
                        onChange={(e) => setPoolForm(e.target.value)}
                        className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Carteira / Endereço (Monero ou Unmineable MOEDA:ENDEREÇO)</label>
                      <input
                        type="text"
                        required
                        value={walletForm}
                        onChange={(e) => setWalletForm(e.target.value)}
                        className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Algoritmo (Algo)</label>
                        <select
                          value={algoForm}
                          onChange={(e) => setAlgoForm(e.target.value)}
                          className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-xs cursor-pointer"
                        >
                          <option value="rx/0">rx/0 (Monero RandomX)</option>
                          <option value="rx/wow">rx/wow (Wownero)</option>
                          <option value="ghostrider">ghostrider (Raptoreum)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Porta de Comunicação API</label>
                        <input
                          type="number"
                          required
                          value={portForm}
                          onChange={(e) => setPortForm(parseInt(e.target.value))}
                          className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-[#151921] border border-slate-700 hover:bg-[#253242] text-orange-500 hover:text-orange-400 font-black uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>GRAVAR E TRANSMITIR CONFIGS</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Nice informational box outlining Unmineable support */}
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 flex gap-3 text-xs text-emerald-300">
                  <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 font-mono">
                    <p className="font-bold text-emerald-200">Suporte Total à Unmineable (USDT, BTC, DOGE...)</p>
                    <p>O nosso Agente Node.js detecta automaticamente quando você usa a Unmineable ou formato <code>MOEDA:ENDEREÇO</code> (ex: <code>USDT:0x71C...</code>). Ele injeta o nome de cada Worker automaticamente (ex: <code>USDT:0x71C....PC-01</code>) no comando do XMRig para que todos os seus computadores apareçam separadamente nas estatísticas de pagamento da pool!</p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/25 rounded-2xl p-4 flex gap-3 text-xs text-blue-300">
                  <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 font-mono">
                    <p className="font-bold text-blue-200">Sincronismo em Tempo Real</p>
                    <p>Ao gravar, as novas configurações são enviadas instantaneamente no próximo ping de cada agente (a cada 5 segundos), atualizando o XMRig real sem precisar reiniciar os scripts nas máquinas físicas!</p>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* =========================================================
              TAB 3: SYSTEM HISTORIC LOGS
              ========================================================= */}
          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-6 shadow-xl ring-1 ring-white/5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-wide text-orange-500 uppercase font-mono">Histórico de Auditoria do Servidor</h3>
                    <p className="text-xs text-slate-400 font-mono">Logs de telemetria, conexões TCP de Agents e comandos de mineração</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchData}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#151921] border border-slate-700 hover:bg-[#263140] text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Atualizar</span>
                  </button>
                </div>
              </div>

              {/* Logs visual panel */}
              <div className="bg-[#11141B] border border-slate-800 rounded-2xl p-4 font-mono text-[11px] leading-relaxed max-h-[500px] overflow-y-auto space-y-2.5">
                {logs.map((log) => {
                  let badgeColor = 'text-blue-400 bg-blue-500/5 border-blue-500/10';
                  let icon = <Info className="w-3.5 h-3.5" />;
                  
                  if (log.type === 'success') {
                    badgeColor = 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10';
                    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
                  } else if (log.type === 'warning') {
                    badgeColor = 'text-orange-500 bg-orange-500/5 border-orange-500/10';
                    icon = <AlertTriangle className="w-3.5 h-3.5" />;
                  } else if (log.type === 'error') {
                    badgeColor = 'text-rose-400 bg-rose-500/5 border-rose-500/10';
                    icon = <X className="w-3.5 h-3.5" />;
                  }
                  
                  return (
                    <div 
                      key={log.id} 
                      className={`flex items-start gap-3 p-2 rounded-lg border transition-colors ${
                        log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'hover:bg-slate-900/40 border-slate-900/40'
                      }`}
                    >
                      <span className="text-slate-500 shrink-0 pt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded border font-bold text-[9px] shrink-0 flex items-center gap-1 ${badgeColor}`}>
                        {icon}
                        {log.type.toUpperCase()}
                      </span>
 
                      <div className="flex-1 text-slate-300">
                        {log.computerName && (
                          <span className="text-orange-500 font-bold mr-1.5">[{log.computerName}]</span>
                        )}
                        <span>{log.message}</span>
                      </div>
                    </div>
                  );
                })}
 
                {logs.length === 0 && (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Nenhum registro de log recebido no SQLite ainda.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* =========================================================
              TAB 4: C# ENTERPRISE SOURCE CODE BROWSER
              ========================================================= */}
          {activeTab === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Informative Header outlining solution tree */}
              <div className="bg-[#1B212C] border border-slate-700/50 rounded-2xl p-5 shadow-xl ring-1 ring-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-orange-500 font-mono tracking-wide uppercase">Navegador do Agente Node.js Completo</h3>
                  <p className="text-xs text-slate-300">Estrutura de código leve, simples e sem dependências para rodar em qualquer máquina.</p>
                </div>
                
                {/* Download Info Guide */}
                <div className="flex items-center gap-3">
                  <div className="bg-[#151921] border border-slate-700 rounded-xl px-4 py-2 text-[10px] font-mono text-slate-400">
                    📂 Raiz: <span className="text-orange-500 font-bold">/node-agent/*</span>
                  </div>
                </div>
              </div>

              {/* TWO PANEL WORKSPACE: TREE vs CODE VIEWER */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[600px]">
                
                {/* LEFT COLUMN: SOURCE REPOSITORY TREE (3/12 cols) */}
                <div className="md:col-span-4 bg-[#1B212C] border border-slate-700/50 rounded-2xl p-4 overflow-y-auto max-h-[650px] shadow-xl ring-1 ring-white/5 space-y-3">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block border-b border-slate-800 pb-2 mb-2">
                    Estrutura node-agent/
                  </span>
                  
                  <div className="space-y-0.5">
                    {codeTree.map(node => renderTreeItem(node))}
                  </div>
                </div>

                {/* RIGHT COLUMN: RICH CODE CODE VIEWER PANEL (8/12 cols) */}
                <div className="md:col-span-8 flex flex-col bg-[#1B212C] border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl ring-1 ring-white/5 min-h-[500px] max-h-[650px]">
                  
                  {/* Tool bar header */}
                  <div className="bg-[#151921] px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4.5 h-4.5 text-orange-500" />
                      <span className="text-xs font-mono font-bold text-slate-200 block truncate max-w-xs md:max-w-md">
                        {selectedFilePath}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(selectedFileContent)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#151921] border border-slate-700 hover:bg-[#253242] hover:text-orange-500 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Code Box */}
                  <div className="flex-1 overflow-auto bg-[#11141B] p-4 relative font-mono text-[11px] text-slate-300 leading-relaxed scrollbar-thin">
                    {isCodeLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#11141B]/80">
                        <div className="text-center space-y-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                          <span className="text-[10px] text-slate-400">Lendo arquivo do workspace...</span>
                        </div>
                      </div>
                    ) : (
                      <pre className="whitespace-pre">
                        <code>{selectedFileContent}</code>
                      </pre>
                    )}
                  </div>

                  {/* Code footer */}
                  <div className="bg-[#151921] px-4 py-2 border-t border-slate-800 text-center shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Visualizando em ambiente seguro Sandbox • C# Código Fonte Original
                    </span>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER METADATA STATUS */}
      <footer className="bg-[#0B0E14] border-t border-slate-800 py-4 text-center mt-auto" id="footer_section">
        <span className="text-[10px] text-slate-500 font-mono block">
          MinerHub v1.0.0 • Desenvolvido com ASP.NET Core 8, EF Core, SQLite, SignalR e Next.js/Tailwind.
        </span>
        <span className="text-[9px] text-slate-600 font-mono block mt-1">
          Todos os direitos reservados. Preparado para escalabilidade até 100 mineradores com unMineable e MoneroOcean.
        </span>
      </footer>

      {/* ==============================================================
          ADVANCED HARDWARE DETAILS MODAL
          ============================================================== */}
      {selectedComputer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" id="details_modal">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl bg-[#1B212C] border border-slate-700/50 rounded-2xl p-6 shadow-2xl ring-1 ring-white/5 space-y-4 relative"
          >
            {/* Close */}
            <button 
              onClick={() => setSelectedComputer(null)}
              className="absolute top-4 right-4 p-1 bg-[#151921] hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-inner">
                <i className="fa-solid fa-server text-lg"></i>
              </div>
              <div>
                <h3 className="font-black text-slate-100 text-sm tracking-wide">{selectedComputer.name}</h3>
                <p className="text-[10px] font-mono text-slate-400">Telemetria de Hardware WMI Completa</p>
              </div>
            </div>

            {/* Advanced stats grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-[#151921] border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Sistema Operacional</span>
                <span className="text-slate-100 font-bold block">{selectedComputer.os}</span>
              </div>
              <div className="bg-[#151921] border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Versão do XMRig</span>
                <span className="text-orange-500 font-bold block">{selectedComputer.xmrigVersion}</span>
              </div>
              <div className="bg-[#151921] border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Endereço IP Local</span>
                <span className="text-slate-100 font-bold block">{selectedComputer.ip}</span>
              </div>
              <div className="bg-[#151921] border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Token de Segurança (WMI)</span>
                <span className="text-indigo-400 font-bold block">{selectedComputer.token}</span>
              </div>
              <div className="bg-[#151921] border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Memória RAM Usada</span>
                <span className="text-slate-100 font-bold block">
                  {selectedComputer.status === 'online' ? `${selectedComputer.ramUsage}%` : '0%'}
                </span>
              </div>
              <div className="bg-[#151921] border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase block mb-1">Última Transmissão Ping</span>
                <span className="text-emerald-400 font-bold block">
                  {selectedComputer.status === 'online' ? 'Há 2 segs' : 'Sem resposta'}
                </span>
              </div>
            </div>

            {/* Interactive sliders or guidelines */}
            <div className="bg-[#151921] border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Arquitetura de Transmissão</span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                O Agent instalado no Windows executa uma rotina WMI em C# a cada 15 segundos para atualizar estas informações e enviá-las de forma compactada via JSON HTTP ao Servidor Central (192.168.1.107).
              </p>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedComputer(null)}
                className="py-2 px-5 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase text-xs rounded-xl transition-all shadow-md cursor-pointer"
              >
                FECHAR DETALHES
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ==============================================================
          EDIT COMPUTER POPUP MODAL
          ============================================================== */}
      {editingComputer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" id="edit_modal">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#1B212C] border border-slate-700/50 rounded-2xl p-6 shadow-2xl ring-1 ring-white/5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-orange-500 text-sm font-mono tracking-wide">EDITAR COMPUTADOR</h3>
              <button onClick={() => setEditingComputer(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComputerEdits} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Nome da Máquina</label>
                <input
                  type="text"
                  required
                  value={editingComputer.name}
                  onChange={(e) => setEditingComputer({ ...editingComputer, name: e.target.value })}
                  className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Endereço IP Local</label>
                <input
                  type="text"
                  required
                  value={editingComputer.ip}
                  onChange={(e) => setEditingComputer({ ...editingComputer, ip: e.target.value })}
                  className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Token de Comunicação (Segurança)</label>
                <input
                  type="text"
                  required
                  value={editingComputer.token}
                  onChange={(e) => setEditingComputer({ ...editingComputer, token: e.target.value })}
                  className="w-full py-2 px-3.5 bg-[#151921] border border-slate-700 rounded-xl text-slate-200 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingComputer(null)}
                  className="py-2 px-4 bg-[#151921] border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase text-xs rounded-xl cursor-pointer"
                >
                  SALVAR NO SQLITE
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
