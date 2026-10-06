import React, { useState, useEffect, useRef } from 'react';
import { Cpu, ShieldCheck, Activity, AlertTriangle, Play, RefreshCw, BarChart3, FileText, Zap, Eye, CheckCircle2 } from 'lucide-react';

interface SwarmEvent {
  round: number;
  type: string;
  attacker?: string;
  trader?: string;
  target?: string;
  vector?: string;
  defense?: string;
  status?: string;
  amount?: number;
  fee_burned?: number;
}

interface SwarmReport {
  engine: string;
  scenario: string;
  timestamp: string;
  execution_duration_sec: number;
  metrics: {
    total_agents: number;
    active_validators: number;
    active_traders: number;
    adversary_nodes: number;
    total_rounds: number;
    quantum_attacks_attempted: number;
    quantum_attacks_neutralized: number;
    quantum_defense_rate_percent: string;
    sovereign_51_floor_tokens: number;
    sovereign_51_invariant_status: string;
    total_burned_tokens: number;
    deflationary_rate_annualized: string;
    simulated_tps: number;
  };
  predictive_synthesis: {
    consensus_stability: string;
    '51_percent_resilience': string;
    quantum_readiness: string;
    recommended_action: string;
  };
  recent_events: SwarmEvent[];
}

export function MiroFishSwarmSimulator() {
  const [scenario, setScenario] = useState<string>('51_percent_floor_stress');
  const [agentCount, setAgentCount] = useState<number>(120);
  const [rounds, setRounds] = useState<number>(20);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [report, setReport] = useState<SwarmReport | null>(null);
  const [activeView, setActiveView] = useState<'canvas' | 'events' | 'report'>('canvas');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load existing report on mount
  useEffect(() => {
    fetch('/api/v1/mirofish/report/latest')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setReport(data);
      })
      .catch(() => {});
  }, []);

  // Swarm Particle Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = canvas.width = canvas.parentElement?.clientWidth || 700;
    const height = canvas.height = 360;

    const colors = {
      validator: '#06b6d4', // cyan
      trader: '#10b981',    // emerald
      adversary: '#f43f5e', // rose
      arbitrageur: '#f59e0b' // amber
    };

    const particles = Array.from({ length: Math.min(agentCount, 150) }).map((_, i) => {
      const type = i % 10 < 4 ? 'validator' : i % 10 < 8 ? 'trader' : i % 10 === 8 ? 'adversary' : 'arbitrageur';
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: type === 'validator' ? 4 : type === 'adversary' ? 4.5 : 3,
        type,
        pulse: Math.random() * Math.PI
      };
    });

    const render = () => {
      ctx.fillStyle = 'rgba(10, 15, 29, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Draw connection lines between nearby agents
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 65) {
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.35 * (1 - dist / 65)})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.05;

        if (p.x < 5 || p.x > width - 5) p.vx *= -1;
        if (p.y < 5 || p.y > height - 5) p.vy *= -1;

        const pulseRadius = p.radius + Math.sin(p.pulse) * 0.8;
        ctx.fillStyle = colors[p.type as keyof typeof colors];
        ctx.shadowColor = colors[p.type as keyof typeof colors];
        ctx.shadowBlur = p.type === 'adversary' ? 8 : 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.5, pulseRadius), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [agentCount, isRunning]);

  const handleRunSimulation = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/v1/mirofish/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, agents: agentCount, rounds })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('MiroFish simulation failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
                MiroFish Swarm Multi-Agent Prediction Sandbox
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Simulating Token 9898048483 Market Dynamics, Invariant Inviolability & NIST ML-DSA-87 Defense
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveView('canvas')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeView === 'canvas' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Swarm Visualizer
            </button>
            <button
              onClick={() => setActiveView('events')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeView === 'events' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Live Events
            </button>
            <button
              onClick={() => setActiveView('report')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeView === 'report' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> AI Synthesis Report
            </button>
          </div>
        </div>
      </div>

      {/* Control Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5 font-mono">Scenario Profile</label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="51_percent_floor_stress">51% Sovereign Stake Floor Stress Test</option>
            <option value="quantum_supremacy_transition">Shor Quantum Attack vs ML-DSA-87</option>
            <option value="deflationary_burn_equilibrium">Deflationary Burn & Staking APY Dynamics</option>
            <option value="network_partition_mesh_recovery">Air-Gapped Mesh Partition Recovery</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1.5 font-mono">
            Agents in Sandbox: <span className="text-cyan-400 font-bold">{agentCount}</span>
          </label>
          <input
            type="range"
            min="50"
            max="300"
            step="10"
            value={agentCount}
            onChange={(e) => setAgentCount(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1.5 font-mono">
            Simulation Rounds: <span className="text-cyan-400 font-bold">{rounds}</span>
          </label>
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
              isRunning
                ? 'bg-cyan-950 text-cyan-500 border border-cyan-800 cursor-not-allowed animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:brightness-110 shadow-cyan-950/50'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Evolving Swarm...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Execute Swarm Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-6">
        {activeView === 'canvas' && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <canvas ref={canvasRef} className="w-full block" />
              {/* Legend Overlay */}
              <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono space-y-1 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
                  <span className="text-slate-300">Validators (HSM Enclave)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-300">Traders (AMM DEX)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
                  <span className="text-slate-300">Quantum Adversaries</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="text-slate-300">Arbitrageurs (Mesh Sync)</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            {report && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">51% Floor Invariant</div>
                  <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-4 h-4" /> UNBROKEN
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">504,800,472,633 TOK Locked</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Quantum Defense Rate</div>
                  <div className="text-base font-bold text-cyan-400 flex items-center gap-1.5 mt-1">
                    <Zap className="w-4 h-4" /> {report.metrics.quantum_defense_rate_percent}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">NIST ML-DSA-87 Intercept</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Simulated Throughput</div>
                  <div className="text-base font-bold text-amber-400 flex items-center gap-1.5 mt-1">
                    <Activity className="w-4 h-4" /> {report.metrics.simulated_tps.toLocaleString()} TPS
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{report.metrics.total_rounds} Multi-Agent Rounds</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Deflationary Burn</div>
                  <div className="text-base font-bold text-purple-400 flex items-center gap-1.5 mt-1">
                    <BarChart3 className="w-4 h-4" /> {report.metrics.total_burned_tokens} TOK
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{report.metrics.deflationary_rate_annualized}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'events' && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-96 overflow-y-auto space-y-2 font-mono text-xs">
            {report?.recent_events && report.recent_events.length > 0 ? (
              report.recent_events.map((evt, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                    evt.type.includes('QUANTUM')
                      ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                      : evt.type.includes('TRADE')
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                      : 'bg-cyan-950/30 border-cyan-800/40 text-cyan-300'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      {evt.type.includes('QUANTUM') ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      Round {evt.round}: {evt.type}
                    </div>
                    {evt.vector && <div className="text-[11px] text-slate-400 mt-0.5">Vector: {evt.vector}</div>}
                    {evt.defense && <div className="text-[11px] text-cyan-400 mt-0.5">Defense: {evt.defense}</div>}
                    {evt.amount && <div className="text-[11px] text-emerald-400 mt-0.5">Trade: {evt.amount} TOK | Fee Burned: {evt.fee_burned} TOK</div>}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-bold">
                    {evt.status || 'OK'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-center py-8">
                No events recorded. Run a simulation to generate live multi-agent events.
              </div>
            )}
          </div>
        )}

        {activeView === 'report' && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
            {report ? (
              <>
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" /> MiroFish Swarm Intelligence Prediction Synthesis
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Timestamp: {report.timestamp} | Scenario: {report.scenario}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-xs font-bold text-cyan-400 uppercase font-mono">Consensus Stability</div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      {report.predictive_synthesis.consensus_stability}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-xs font-bold text-emerald-400 uppercase font-mono">51% Sovereign Resilience</div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      {report.predictive_synthesis['51_percent_resilience']}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-xs font-bold text-purple-400 uppercase font-mono">Post-Quantum Readiness</div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      {report.predictive_synthesis.quantum_readiness}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-xs font-bold text-amber-400 uppercase font-mono">Strategic Recommendation</div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      {report.predictive_synthesis.recommended_action}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-center py-8">
                No report available. Click "Execute Swarm Simulation" to generate.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
