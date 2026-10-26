"""Build the dependency-free, single-file GitHub Pages entry point."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
shell = (ROOT / "src/shell.html").read_text()
styles = "\n".join((ROOT / name).read_text() for name in ("styles.css", "game.css"))
scripts = "\n;\n".join((ROOT / name).read_text() for name in (
    "data.js", "engine.js", "game-engine.js", "app.js", "game.js"
))
result = shell.replace("<!-- BOUFFE_STYLES -->", "<style>\n" + styles + "\n</style>")
result = result.replace("<!-- BOUFFE_SCRIPTS -->", "<script>\n" + scripts + "\n</script>")
(ROOT / "index.html").write_text(result)
print("Built index.html (self-contained; no dependencies or network requests).")
