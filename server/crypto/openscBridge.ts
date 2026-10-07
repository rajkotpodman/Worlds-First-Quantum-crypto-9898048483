/**
 * OpenSC Hardware Integration Bridge
 * Path: server/crypto/openscBridge.ts
 * 
 * Direct bridge to the integrated OpenSC tools and PKCS#11 libraries
 * located in the local repository with fallback to system paths.
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class OpenSCBridge {
  private repoRoot: string;
  private pkcs11ToolPath: string;
  private openscToolPath: string;
  private cardosToolPath: string;
  private pkcs11DllPath: string;

  constructor() {
    this.repoRoot = path.resolve(__dirname, '../../');

    // 1. Check local repository vendored binaries first
    const localToolsDir = path.join(this.repoRoot, 'opensc', 'bin', 'tools');
    const localPkcs11Dir = path.join(this.repoRoot, 'opensc', 'bin', 'pkcs11');

    const sysToolsDir = 'C:\\Program Files\\OpenSC Project\\OpenSC\\tools';
    const sysPkcs11Dir = 'C:\\Program Files\\OpenSC Project\\OpenSC\\pkcs11';
    const sys32Dll = 'C:\\Windows\\System32\\eTPKCS11.dll';

    // Tool paths
    this.pkcs11ToolPath = this.resolveBinary(
      path.join(localToolsDir, 'pkcs11-tool.exe'),
      path.join(sysToolsDir, 'pkcs11-tool.exe')
    );

    this.openscToolPath = this.resolveBinary(
      path.join(localToolsDir, 'opensc-tool.exe'),
      path.join(sysToolsDir, 'opensc-tool.exe')
    );

    this.cardosToolPath = this.resolveBinary(
      path.join(localToolsDir, 'cardos-tool.exe'),
      path.join(sysToolsDir, 'cardos-tool.exe')
    );

    // Module paths (prefer eTPKCS11.dll if present, otherwise opensc-pkcs11.dll)
    if (fs.existsSync(sys32Dll)) {
      this.pkcs11DllPath = sys32Dll;
    } else {
      this.pkcs11DllPath = this.resolveBinary(
        path.join(localPkcs11Dir, 'opensc-pkcs11.dll'),
        path.join(sysPkcs11Dir, 'opensc-pkcs11.dll')
      );
    }
  }

  private resolveBinary(preferredPath: string, fallbackPath: string): string {
    if (fs.existsSync(preferredPath)) {
      return preferredPath;
    }
    return fallbackPath;
  }

  public getPaths() {
    return {
      pkcs11Tool: this.pkcs11ToolPath,
      openscTool: this.openscToolPath,
      cardosTool: this.cardosToolPath,
      pkcs11Module: this.pkcs11DllPath,
      isVendored: this.pkcs11ToolPath.includes(path.join('opensc', 'bin')),
      sourceDir: path.join(this.repoRoot, 'opensc', 'src')
    };
  }

  public runCommand(cmd: string, timeoutMs: number = 6000): { success: boolean; output: string } {
    try {
      const output = execSync(cmd, {
        encoding: 'utf-8',
        timeout: timeoutMs,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      return { success: true, output: output.trim() };
    } catch (err: any) {
      const errOut = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '') || err.message;
      return { success: false, output: errOut.trim() };
    }
  }

  public listReaders(): { success: boolean; readers: string[]; raw: string } {
    const res = this.runCommand(`"${this.openscToolPath}" -l`);
    const readers = res.output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#') && !line.includes('No smart card'));
    return { success: res.success, readers, raw: res.output };
  }

  public getCardInfo(): { success: boolean; name: string; raw: string } {
    const res = this.runCommand(`"${this.openscToolPath}" -n`);
    return { success: res.success, name: res.output, raw: res.output };
  }

  public getCardOSInfo(): { success: boolean; details: string } {
    const res = this.runCommand(`"${this.cardosToolPath}" -i`);
    return { success: res.success, details: res.output };
  }

  public listSlots(): { success: boolean; slots: string } {
    const res = this.runCommand(`"${this.pkcs11ToolPath}" --module "${this.pkcs11DllPath}" -L`);
    return { success: res.success, slots: res.output };
  }

  public changeUserPin(oldPin: string, newPin: string): { success: boolean; message: string } {
    const cmd = `"${this.pkcs11ToolPath}" --module "${this.pkcs11DllPath}" --change-pin --pin "${oldPin}" --new-pin "${newPin}"`;
    const res = this.runCommand(cmd, 10000);
    return {
      success: res.success,
      message: res.output || (res.success ? 'User PIN successfully changed!' : 'PIN change command failed')
    };
  }

  public changeSoPin(oldSoPin: string, newSoPin: string): { success: boolean; message: string } {
    const cmd = `"${this.pkcs11ToolPath}" --module "${this.pkcs11DllPath}" --change-pin --so-pin --pin "${oldSoPin}" --new-pin "${newSoPin}"`;
    const res = this.runCommand(cmd, 10000);
    return {
      success: res.success,
      message: res.output || (res.success ? 'SO PIN successfully changed!' : 'SO PIN change failed')
    };
  }

  public unlockPin(soPin: string, newPin: string): { success: boolean; message: string } {
    const cmd = `"${this.pkcs11ToolPath}" --module "${this.pkcs11DllPath}" --init-pin --login --login-type so --so-pin "${soPin}" --pin "${newPin}"`;
    const res = this.runCommand(cmd, 10000);
    return {
      success: res.success,
      message: res.output || (res.success ? 'Token User PIN reset and unlocked!' : 'Unlock command failed')
    };
  }
}

export const openscBridge = new OpenSCBridge();
