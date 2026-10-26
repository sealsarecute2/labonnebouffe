"""Build the dependency-free, single-file GitHub Pages entry point."""
from pathlib import Path
import base64
import json

ROOT = Path(__file__).resolve().parent.parent
shell = (ROOT / "src/shell.html").read_text()
styles = "\n".join((ROOT / name).read_text() for name in ("styles.css", "game.css", "plate-shop.css"))
manifest = json.loads((ROOT / "assets/audio/manifest.json").read_text())
audio_assets, aliases, filenames = {}, {}, {}
for key, filename in manifest["files"].items():
    if filename in filenames:
        aliases[key] = filenames[filename]
    else:
        filenames[filename] = key
        audio_assets[key] = base64.b64encode((ROOT / "assets/audio" / filename).read_bytes()).decode()
# Keep the generated page self-contained, including the original audio samples.
scripts = "globalThis.BOUFFE_CASE_AUDIO_ASSETS=" + json.dumps(audio_assets, separators=(",", ":")) + ";\n"
for key, original in aliases.items():
    scripts += f"BOUFFE_CASE_AUDIO_ASSETS.{key}=BOUFFE_CASE_AUDIO_ASSETS.{original};\n"
scripts += "\n;\n".join((ROOT / name).read_text() for name in (
    "data.js", "engine.js", "game-engine.js", "plates.js", "cafe-rewards.js", "case-audio.js", "app.js", "plate-shop.js", "game.js"
))
result = shell.replace("<!-- BOUFFE_STYLES -->", "<style>\n" + styles + "\n</style>")
result = result.replace("<!-- BOUFFE_SCRIPTS -->", "<script>\n" + scripts + "\n</script>")
(ROOT / "index.html").write_text(result)
print("Built index.html (self-contained; no dependencies or network requests).")
