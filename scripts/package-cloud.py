from pathlib import Path
import zipfile, shutil
from release_files import source_files

root = Path(__file__).resolve().parent.parent
output = root / 'artifacts'
output.mkdir(exist_ok=True)
with zipfile.ZipFile(output / 'Zarqa-People-GoDaddy.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted((output / 'godaddy').rglob('*')):
        if path.is_file(): archive.write(path, path.relative_to(output / 'godaddy'))
with zipfile.ZipFile(output / 'Zarqa-People-Cloud-Backend.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for folder in ['cloud/supabase', 'cloud/migrations']:
        for path in sorted((root / folder).rglob('*')):
            if path.is_file(): archive.write(path, path.relative_to(root))
    for name in ['cloud/bootstrap.example.sql', 'docs/CLOUD-DEPLOYMENT.md', 'SECURITY.md', 'LICENSE']:
        archive.write(root / name, name)
source = output / 'github-source'
if source.exists(): shutil.rmtree(source)
source.mkdir()
with zipfile.ZipFile(output / 'Zarqa-People-GitHub.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in source_files(root):
        rel = path.relative_to(root)
        target = source / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
        archive.write(path, 'zarqa-people/' + str(rel))
print('Created frontend, backend, and sanitized GitHub source packages in artifacts/.')
