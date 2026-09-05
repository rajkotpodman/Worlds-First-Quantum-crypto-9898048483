import React, { useState } from 'react';
import { Terminal, Play, RefreshCw, Cpu, CheckCircle2, Shield } from 'lucide-react';
import { executePythonEngineModule, PythonModuleExecution } from '../services/nativePythonBridge';

export const PythonRuntimeConsole: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string>('onion_rotator.py');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionLog, setExecutionLog] = useState<PythonModuleExecution | null>(null);

  const availableModules = [
    { name: 'onion_rotator.py', desc: 'Tor Hidden Service v3 Ephemeral Address Rotator', defaultFunc: 'create_ephemeral_onion_v3' },
    { name: 'behavior_classifier.py', desc: 'Proof-of-Action Behavioral AI & Sybil Scorer', defaultFunc: 'evaluate_touch_telemetry' },
    { name: 'key_attestation.py', desc: 'Android StrongBox Hardware Attestation Verifier', defaultFunc: 'verify_attestation_certificate' },
    { name: 'amm_pool.py', desc: 'Shielded Constant-Product Liquidity Pool Engine', defaultFunc: 'swap_token_for_usdc' },
    { name: 'mesh_radio.py', desc: 'BLE & Wi-Fi Direct Air-Gapped Mesh Radio', defaultFunc: 'scan_nearby_radios' }
  ];

  const handleRunModule = async () => {
    setIsRunning(true);
    const mod = availableModules.find(m => m.name === selectedModule) || availableModules[0];

    try {
      const res = await executePythonEngineModule(mod.name, mod.defaultFunc);
      setExecutionLog(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Embedded Python Engine Console
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                CPython 3.12 / Chaquopy
              </span>
            </h3>
            <p className="text-xs text-slate-400">On-Device Autonomous Python Micro-Server Bridge (Port 8080)</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Bridge Status</div>
          <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            127.0.0.1:8080 Active
          </div>
        </div>
      </div>

      {/* Module Selector & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-400">Select Python Sovereign Module</label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none"
          >
            {availableModules.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} — {m.desc}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleRunModule}
            disabled={isRunning}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Dispatch & Execute
              </>
            )}
          </button>
        </div>
      </div>

      {/* Execution Terminal Output */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono text-slate-400">
          <span>Standard Output (stdout / stderr)</span>
          {executionLog && (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Exit Code 0 ({executionLog.executionTimeMs}ms)
            </span>
          )}
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto min-h-[140px] whitespace-pre-wrap">
          {executionLog ? (
            executionLog.stdout
          ) : (
            <span className="text-slate-600">
              # Click 'Dispatch & Execute' above to run the selected Python module on the device bridge.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
