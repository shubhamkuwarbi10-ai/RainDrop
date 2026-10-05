import os
import sys
import json
import urllib.request
import subprocess
from pathlib import Path

def build_frontend():
    root = Path(__file__).parent.parent
    cache_dir = root / "data"
    cache_dir.mkdir(exist_ok=True)
    babel_file = cache_dir / "babel.min.js"

    if not babel_file.exists():
        print("Downloading @babel/standalone for offline JSX transpilation...")
        url = "https://unpkg.com/@babel/standalone/babel.min.js"
        req = urllib.request.Request(url, headers={"User-Agent": "RainDrop/1.0"})
        with urllib.request.urlopen(req) as resp:
            babel_file.write_bytes(resp.read())
        print(f"Cached Babel Standalone to {babel_file}")

    src_dir = root / "client" / "src"
    jsx_file = root / "client" / "frontend.jsx"
    js_file = root / "client" / "frontend.js"

    # If modular client/src exists, bundle files in dependency order
    if src_dir.exists() and (src_dir / "App.jsx").exists():
        module_order = [
            src_dir / "icons" / "IconSvgRegistry.js",
            src_dir / "lib" / "riskScale.js",
            src_dir / "data" / "mockData.js",
            src_dir / "components" / "auth" / "OperatorAuth.jsx",
            src_dir / "components" / "common" / "CommonUI.jsx",
            src_dir / "components" / "dashboard" / "CityWardOverview.jsx",
            src_dir / "components" / "dashboard" / "TopNavbar.jsx",
            src_dir / "components" / "hero" / "HeroView.jsx",
            src_dir / "components" / "map" / "InteractiveVectorMap.jsx",
            src_dir / "components" / "modals" / "ModalsAndFooter.jsx",
            src_dir / "App.jsx",
        ]
        
        bundle_parts = []
        missing_mods = []
        for mod in module_order:
            if not mod.exists():
                missing_mods.append(str(mod.relative_to(root)))
            else:
                bundle_parts.append(f"// --- MODULE: {mod.relative_to(root).as_posix()} ---\n" + mod.read_text(encoding="utf-8"))
        
        if missing_mods:
            print(f"Error: Missing required frontend modules:\n  - " + "\n  - ".join(missing_mods))
            sys.exit(1)
        
        full_jsx = "\n\n".join(bundle_parts)
        jsx_file.write_text(full_jsx, encoding="utf-8")
        print(f"Assembled {len(module_order)} modular components from client/src/ -> client/frontend.jsx")
    elif not jsx_file.exists():
        print(f"Error: Neither {src_dir} nor {jsx_file} found.")
        sys.exit(1)

    node_script = f"""
    const fs = require('fs');
    const babel = require('{babel_file.as_posix()}');
    const jsx = fs.readFileSync('{jsx_file.as_posix()}', 'utf8');
    const js = babel.transform(jsx, {{ presets: [['react', {{ runtime: 'classic' }}]] }}).code;
    fs.writeFileSync('{js_file.as_posix()}', js, 'utf8');
    console.log('Successfully transpiled to client/frontend.js (' + js.length + ' bytes)');
    """

    scratch_file = root / "data" / "temp_transpile.js"
    scratch_file.write_text(node_script, encoding="utf-8")

    try:
        res = subprocess.run(["node", str(scratch_file)], capture_output=True, text=True, check=True)
        print(res.stdout.strip())
    except subprocess.CalledProcessError as e:
        print("Transpilation failed:")
        print(e.stderr)
        sys.exit(1)
    finally:
        if scratch_file.exists():
            scratch_file.unlink()

if __name__ == "__main__":
    build_frontend()
