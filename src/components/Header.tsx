import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Smartphone, 
  Globe, 
  Activity, 
  Key, 
  FileCode2,
  Lock,
  Brain,
  FolderLock,
  Flame,
  ShieldAlert,
  Globe2,
  Cpu,
  BatteryMedium,
  Server,
  Award,
  Wallet,
  ArrowDownUp,
  KeyRound,
  Radio,
  Droplet,
  EyeOff,
  Sparkles,
  ChevronDown,
  Layers,
  Search,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail: string;
  onOpenAuth: () => void;
  pipelineRunning: boolean;
  alertCount: number;
}

interface NavCategory {
  id: string;
  label: string;
  icon: any;
  tabs: {
    id: string;
    label: string;
    desc: string;
    icon: any;
    badge?: string | null;
    highlight?: boolean;
  }[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userEmail,
  onOpenAuth,
  pipelineRunning,
  alertCount,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: NavCategory[] = [
    {
      id: 'core',
      label: 'Core & Pipeline',
      icon: Terminal,
      tabs: [
        { id: 'pipeline', label: 'CI/CD Pipeline', desc: 'Zero-Sudo automated build engine & testing tracks', icon: Terminal, badge: pipelineRunning ? 'Building' : null },
        { id: 'node_heatmap', label: '3D Global Node Heatmap', desc: 'Live 3D rotating globe with global validator & satellite downlinks', icon: Globe, highlight: true },
        { id: 'artifacts', label: 'Android APK Artifacts', desc: 'Direct /dist APK download & verification hashes', icon: Smartphone },
        { id: 'monitoring', label: 'Telemetry & Alerts', desc: 'DevSecOps real-time monitoring and event stream', icon: Activity, badge: alertCount > 0 ? `${alertCount}` : null },
        { id: 'secrets', label: 'Secrets & Workflows', desc: 'Secure repository secrets and automated actions', icon: Key },
      ]
    },
    {
      id: 'defi',
      label: 'Wallet & DeFi',
      icon: Wallet,
      tabs: [
        { id: 'wallet', label: 'Sovereign Clearing Wallet', desc: 'PQC-signed multi-currency token ledger', icon: Wallet },
        { id: 'amm_swap', label: 'Shielded AMM Swap', desc: 'Constant-product liquidity pool & instant slippage engine', icon: ArrowDownUp, highlight: true },
        { id: 'token_faucet', label: 'Argon2id PoW Faucet', desc: 'Client-side Proof-of-Work mining & token minting', icon: Droplet, highlight: true },
        { id: 'shamir_backup', label: 'Shamir 3-of-5 Backup', desc: 'Cryptographic secret sharing and polynomial key recovery', icon: KeyRound, highlight: true },
        { id: 'valuation_2030', label: '2026–2030 $1.00 USD Road', desc: 'Institutional AI Aayush tokenomics roadmap', icon: Award, highlight: true },
      ]
    },
    {
      id: 'pqc_zkp',
      label: 'Quantum & ZKP',
      icon: EyeOff,
      tabs: [
        { id: 'zkp_proofs', label: 'Groth16 Zero-Knowledge Proofs', desc: 'Client-side SNARK witness generator & Poseidon verifier', icon: EyeOff, highlight: true },
        { id: 'qkd_mesh', label: 'QKD BB84 Entanglement Router', desc: 'Photon polarization key exchange & 11% QBER eavesdropping guard', icon: Radio, highlight: true },
        { id: 'ai_keystream', label: 'Neural AI Keystream Engine', desc: 'AI-driven dynamic OTP pseudo-random keystreams', icon: Brain },
        { id: 'duress', label: 'Duress Self-Destruct Shredder', desc: 'PIN-triggered deniable panic wipe & decoy state generation', icon: Flame },
        { id: 'vault', label: 'Isolated Deniable Vault', desc: 'Hardware-isolated encrypted file & key repository', icon: FolderLock },
        { id: 'zerotouch', label: 'Zero-Touch Biometrics', desc: 'Hardware TEE & WebAuthn biometric identity verification', icon: Lock },
      ]
    },
    {
      id: 'mesh_native',
      label: 'Mesh & Native Engines',
      icon: Cpu,
      tabs: [
        { id: 'mesh_radar', label: 'Air-Gapped Mesh Radar', desc: 'BLE & Wi-Fi Direct peer discovery and packet relay', icon: Radio, highlight: true },
        { id: 'python_console', label: 'Embedded Python REPL', desc: 'On-device Chaquopy CPython 3.12 execution bridge', icon: Terminal, highlight: true },
        { id: 'fastapi_backend', label: 'FastAPI Micro-Backend', desc: 'High-throughput local async REST microservices', icon: Server, highlight: true },
        { id: 'native_bridge', label: 'C++/NDK Native Bridge', desc: 'Low-latency JNI bridge with hardware acceleration', icon: FileCode2 },
        { id: 'ipc_firewall', label: 'NDK IPC Firewall', desc: 'Kernel-level IPC socket packet filtering & isolation', icon: Cpu },
        { id: 'local_nlp', label: 'Local AI NLP Engine', desc: 'On-device offline neural NLP intent classifier', icon: Brain },
        { id: 'kivy_gui', label: 'Kivy GUI Layer', desc: 'Hardware-accelerated OpenGL/Kivy rendering subsystem', icon: Smartphone },
        { id: 'battery_daemon', label: 'Zero-Touch Battery Daemon', desc: 'Intelligent power budgeting for 24/7 background mesh nodes', icon: BatteryMedium },
        { id: 'tor', label: 'Tor v3 Daemon Manager', desc: 'Ephemeral Onion v3 hidden service routing', icon: Globe },
        { id: 'i18n', label: 'Universal i18n Engine', desc: 'Dynamic multilingual localization engine', icon: Globe2 },
        { id: 'telemetry_audit', label: 'Security Telemetry Audit', desc: 'Centralized forensic audit logs & anomaly detection', icon: ShieldAlert },
      ]
    }
  ];

  const allTabs = categories.flatMap(c => c.tabs);
  const filteredTabs = allTabs.filter(t => {
    const matchesCategory = selectedCategory === 'all' || categories.find(c => c.id === selectedCategory)?.tabs.some(tab => tab.id === t.id);
    const matchesSearch = !searchQuery || t.label.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <header id="app-header" className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl backdrop-blur-md bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Branding & Main Controls Bar */}
        <div className="flex items-center justify-between h-16 border-b border-slate-800/60">
          {/* Logo & System Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('node_heatmap')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20 group hover:scale-105 transition-transform">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  AI Secure Space & OS
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    v2.5 PRO
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Quantum Cryptographic Node • 0-Sudo CI/CD • FIPS-203 Post-Quantum
              </p>
            </div>
          </div>

          {/* Quick-Access Highlight Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* 3D Heatmap Quick Launcher */}
            <button
              id="quick-btn-heatmap"
              onClick={() => setActiveTab('node_heatmap')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-sm ${
                activeTab === 'node_heatmap'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20 ring-1 ring-cyan-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 border-cyan-800/50'
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400 animate-[spin_8s_linear_infinite]" />
              <span className="font-bold">3D Globe</span>
            </button>

            {/* CI/CD Pipeline Quick Launcher */}
            <button
              id="quick-btn-pipeline"
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20 ring-1 ring-emerald-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 border-emerald-800/50'
              }`}
            >
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span>CI/CD</span>
              {pipelineRunning && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </button>

            {/* 2030 Roadmap */}
            <button
              id="valuation-portal-quick-btn"
              onClick={() => setActiveTab('valuation_2030')}
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                activeTab === 'valuation_2030'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border-indigo-700/60'
              }`}
            >
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span>2030 $1.00 USD</span>
            </button>

            {/* Google Identity & Stake Badge */}
            <button
              id="google-auth-btn"
              onClick={onOpenAuth}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-sm">
                G
              </div>
              <span className="hidden lg:inline max-w-[130px] truncate">{userEmail}</span>
              {userEmail.toLowerCase().includes('india9898048483') ? (
                <span className="text-amber-300 text-[10px] font-bold px-1.5 py-0.5 bg-amber-950/70 rounded border border-amber-600/60">
                  51% STAKE
                </span>
              ) : (
                <span className="text-emerald-400 text-[10px] font-semibold uppercase px-1 py-0.5 bg-emerald-950/60 rounded border border-emerald-800/60">
                  Node
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Pills Filter Bar */}
        <div className="flex items-center justify-between py-2 overflow-x-auto scrollbar-none gap-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              All Modules ({allTabs.length})
            </button>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isCatActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isCatActive
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Feature Sub-Navigation Tabs */}
        <nav className="flex space-x-1.5 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/40" aria-label="Feature Tabs">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                }`}
                title={tab.desc}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="font-semibold">{tab.label}</span>
                {tab.highlight && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                )}
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    tab.badge === 'Building'
                      ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
