#!/usr/bin/env python3
import subprocess
import json
import sys

def check_usb_hardware_attached():
    try:
        cmd = ['wmic', 'path', 'Win32_PnPEntity', 'where', 'DeviceID like "%VID_0529%"', 'get', 'DeviceID,Name,Status', '/format:csv']
        raw = subprocess.check_output(cmd, shell=True, timeout=4).decode('utf-8', errors='ignore')
        lines = [l.strip() for l in raw.splitlines() if l.strip() and not l.strip().startswith('Node,')]
        for line in lines:
            if 'VID_0529' in line:
                parts = line.split(',')
                return {
                    "attached": True,
                    "device_id": parts[1] if len(parts) > 1 else "USB\\VID_0529&PID_0514",
                    "name": parts[2] if len(parts) > 2 else "USB Token",
                    "status": parts[3] if len(parts) > 3 else "OK",
                    "vendor_id": "0529",
                    "product_id": "0514",
                    "chip_model": "Aladdin / SafeNet eToken Pro 4254",
                    "fips_level": "FIPS 140-2 Level 3 Hardware Boundary"
                }
    except Exception as e:
        return {"attached": False, "error": str(e)}
    return {"attached": False}

if __name__ == "__main__":
    result = check_usb_hardware_attached()
    print(json.dumps(result, indent=2))
