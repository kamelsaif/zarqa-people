"""Allowlisted source export, excluding deployment identity, local config and generated data."""
from pathlib import Path

ROOT_FILES = {'README.md', 'LICENSE', 'SECURITY.md', 'package.json', 'package-lock.json', '.gitignore'}
ROOT_DIRS = {'dist', 'google-workspace', 'scripts', 'tests', 'cloud', 'docs', '.github'}
EXCLUDED = {'config.local.js', 'bootstrap.local.sql', 'engine.mjs', 'initial-state.json'}

def source_files(root: Path):
    for path in sorted(root.rglob('*')):
        rel = path.relative_to(root)
        if not path.is_file() or path.is_symlink():
            continue
        if len(rel.parts) == 1:
            if rel.name not in ROOT_FILES:
                continue
        elif rel.parts[0] not in ROOT_DIRS:
            continue
        if any(p in {'node_modules', '__pycache__', '_shared', '.git', '.openai', '.sites-runtime'} for p in rel.parts):
            continue
        if any(p.startswith('.') and p not in {'.github', '.gitignore'} for p in rel.parts):
            continue
        if path.name in EXCLUDED or path.suffix in {'.zip', '.enc', '.key', '.pem', '.log', '.pyc'}:
            continue
        if 'backup' in path.name.lower() and path.suffix == '.json':
            continue
        yield path
