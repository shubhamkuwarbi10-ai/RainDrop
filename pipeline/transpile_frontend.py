import os
import sys
import json
import urllib.request
import subprocess
from pathlib import Path

def transpile_jsx():
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

    jsx_file = root / "client" / "frontend.jsx"
    js_file = root / "client" / "frontend.js"

    if not jsx_file.exists():
        print(f"Error: {jsx_file} not found.")
        sys.exit(1)

    node_script = f"""
    const fs = require('fs');
    const babel = require('{babel_file.as_posix()}');
    const jsx = fs.readFileSync('{jsx_file.as_posix()}', 'utf8');
    const js = babel.transform(jsx, {{ presets: [['react', {{ runtime: 'classic' }}]] }}).code;
    fs.writeFileSync('{js_file.as_posix()}', js, 'utf8');
    console.log('Successfully transpiled client/frontend.jsx -> client/frontend.js (' + js.length + ' bytes)');
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
    transpile_jsx()
