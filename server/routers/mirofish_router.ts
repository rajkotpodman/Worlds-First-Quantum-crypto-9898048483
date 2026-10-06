import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const REPORT_FILE = path.join(ROOT_DIR, 'server', 'data', 'mirofish_latest_report.json');
const SCRIPT_PATH = path.join(ROOT_DIR, 'server', 'services', 'mirofish_quantum_swarm.py');

// Status & Available Scenarios
router.get('/status', (req: Request, res: Response) => {
  const hasLatestReport = fs.existsSync(REPORT_FILE);
  let latestReportData = null;
  if (hasLatestReport) {
    try {
      latestReportData = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8'));
    } catch {
      latestReportData = null;
    }
  }

  res.json({
    engine: 'MiroFish Swarm Multi-Agent Prediction Engine',
    version: '1.2-QUANTUM',
    status: 'ONLINE',
    supportedScenarios: [
      {
        id: '51_percent_floor_stress',
        name: '51% Sovereign Stake Invariant Stress Test',
        description: 'Simulates high-frequency adversary attacks attempting to breach the 504,800,472,633 TOK hardware floor.'
      },
      {
        id: 'quantum_supremacy_transition',
        name: 'Shor Quantum Attack vs NIST ML-DSA-87 Shield',
        description: 'Simulates quantum adversaries factoring classical keys vs NIST Category 5 post-quantum lattice verification.'
      },
      {
        id: 'deflationary_burn_equilibrium',
        name: 'Deflationary Burn & Staking APY Dynamics',
        description: 'Simulates 10,000 synthetic trader swaps and projects long-term token velocity and burn rates.'
      },
      {
        id: 'network_partition_mesh_recovery',
        name: 'Air-Gapped Mesh Partition & Reconciliation',
        description: 'Simulates offline mobile mesh nodes trading in air-gapped zones and syncing asynchronously.'
      }
    ],
    lastReportTimestamp: latestReportData?.timestamp || null,
    activeAgentsPool: latestReportData?.metrics?.total_agents || 120
  });
});

// Run Simulation On-Demand
router.post('/simulate', (req: Request, res: Response) => {
  const { scenario = '51_percent_floor_stress', agents = 120, rounds = 25 } = req.body;

  const pythonProcess = spawn('python', [SCRIPT_PATH, String(scenario), String(agents), String(rounds)]);

  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('[MiroFish Error]:', stderr);
      return res.status(500).json({
        success: false,
        error: stderr || 'Simulation failed',
        code
      });
    }

    try {
      // Find JSON block in stdout
      const jsonStart = stdout.indexOf('{');
      if (jsonStart !== -1) {
        const parsed = JSON.parse(stdout.slice(jsonStart));
        return res.json({
          success: true,
          report: parsed
        });
      }
      return res.json({ success: true, raw: stdout });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to parse simulation output',
        details: err?.message
      });
    }
  });
});

// Retrieve Latest Intelligence Report
router.get('/report/latest', (req: Request, res: Response) => {
  if (!fs.existsSync(REPORT_FILE)) {
    return res.status(404).json({ error: 'No intelligence report generated yet.' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8'));
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read report', details: err?.message });
  }
});

export default router;
