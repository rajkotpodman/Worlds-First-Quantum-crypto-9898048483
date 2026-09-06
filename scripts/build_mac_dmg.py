#!/usr/bin/env python3
"""
AI Secure Space - Apple Disk Image (.dmg) Packager
Generates a mountable Apple Disk Image (.dmg) using ISO9660 + Joliet + Rock Ridge
with the drag-and-drop installer layout (AI Secure Space.app -> /Applications).
"""

import os
import sys
import pycdlib

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def create_dmg(app_bundle_path, output_dmg_path, vol_ident="AI_SECURE_SPACE"):
    print(f"[*] Packaging Apple Disk Image (.dmg): {output_dmg_path}...")
    os.makedirs(os.path.dirname(os.path.abspath(output_dmg_path)), exist_ok=True)
    
    app_name = os.path.basename(os.path.normpath(app_bundle_path))
    if not app_name.endswith(".app"):
        app_name += ".app"

    iso = pycdlib.PyCdlib()
    # interchange_level=3 allows files > 4GB and long directory paths
    # joliet=3 allows long UTF-16 filenames up to 64 characters (including spaces)
    # rock_ridge='1.09' preserves UNIX permissions and symlinks
    iso.new(interchange_level=3, joliet=3, rock_ridge='1.09', vol_ident=vol_ident[:32])

    # 1. Add canonical /Applications symlink for drag-and-drop installation
    iso.add_symlink(
        symlink_path='/APPLICATIONS;1',
        rr_symlink_name='/Applications',
        rr_path='/Applications',
        joliet_path='/Applications'
    )

    # 2. Walk app_bundle_path and add all directories and files recursively
    iso_dir_map = {}
    iso_file_counter = 1

    # Root app directory in ISO
    root_iso_path = '/APP'
    root_joliet_path = f'/{app_name}'
    iso.add_directory(root_iso_path, joliet_path=root_joliet_path, rr_name=app_name)
    iso_dir_map[''] = (root_iso_path, root_joliet_path)

    # Walk directory
    for root, dirs, files in os.walk(app_bundle_path):
        rel_root = os.path.relpath(root, app_bundle_path)
        if rel_root == '.':
            rel_root = ''

        # Ensure subdirectories exist
        for d in sorted(dirs):
            sub_rel = os.path.join(rel_root, d).replace('\\', '/')
            parent_rel = rel_root.replace('\\', '/')
            parent_iso_path, parent_joliet_path = iso_dir_map[parent_rel]

            # Short 8.3 identifier for standard ISO9660 table
            sub_iso_id = f"DIR{iso_file_counter}"
            iso_file_counter += 1
            cur_iso_path = f"{parent_iso_path}/{sub_iso_id}"
            cur_joliet_path = f"{parent_joliet_path}/{d}"

            iso.add_directory(cur_iso_path, joliet_path=cur_joliet_path, rr_name=d)
            iso_dir_map[sub_rel] = (cur_iso_path, cur_joliet_path)

        # Add files
        for f in sorted(files):
            file_full = os.path.join(root, f)
            parent_rel = rel_root.replace('\\', '/')
            parent_iso_path, parent_joliet_path = iso_dir_map[parent_rel]

            file_iso_id = f"F{iso_file_counter}.DAT;1"
            iso_file_counter += 1
            cur_iso_file = f"{parent_iso_path}/{file_iso_id}"
            cur_joliet_file = f"{parent_joliet_path}/{f}"

            iso.add_file(file_full, cur_iso_file, joliet_path=cur_joliet_file, rr_name=f)

    # 3. Write out mountable DMG disk image
    if os.path.exists(output_dmg_path):
        os.remove(output_dmg_path)

    iso.write(output_dmg_path)
    iso.close()

    dmg_size = os.path.getsize(output_dmg_path)
    print(f"      [+] Apple Disk Image (.dmg) created: {output_dmg_path} ({dmg_size} bytes / {dmg_size / (1024*1024):.2f} MB)")
    return dmg_size

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python build_mac_dmg.py <app_bundle_path> <output_dmg_path> [vol_ident]")
        sys.exit(1)
    app_dir = sys.argv[1]
    dmg_out = sys.argv[2]
    vol = sys.argv[3] if len(sys.argv) > 3 else "AI_SECURE_SPACE"
    create_dmg(app_dir, dmg_out, vol)
