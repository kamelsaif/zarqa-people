from pathlib import Path
import re, zipfile, shutil, base64
from release_files import source_files

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
GOOGLE = ROOT / 'google-workspace'
html = (DIST / 'index.html').read_text()
html = re.sub(r'<link rel="icon" href="logo.svg">', '', html)
for filename in ['fonts.css', 'style.css', 'workspace.css', 'experience.css']:
    css = (DIST / filename).read_text()
    if filename == 'fonts.css':
        def inline_font(match):
            path = DIST / match.group(1).strip('\'"')
            return 'url(data:font/woff2;base64,' + base64.b64encode(path.read_bytes()).decode() + ')'
        css = re.sub(r'url\((fonts/[^)]+)\)', inline_font, css)
    html = html.replace(f'<link rel="stylesheet" href="{filename}">', '<style>' + css + '</style>')
for filename in ['icons.js','seed.js','core.js','operations-core.js','portal.js','admin.js','documents.js','laws.js','i18n.js','workspace.js','experience.js','people.js','data-center.js','app.js']:
    source = (DIST / filename).read_text().replace('</script', '<\\/script')
    html = html.replace(f'<script src="{filename}"></script>', '<script>' + source + '</script>')
html = html.replace('href="Zarqa-People-Google-Workspace.zip" download', 'href="https://zarqa-people.kamel-saif.chatgpt.site/Zarqa-People-Google-Workspace.zip" target="_blank"')
(GOOGLE / 'Index.html').write_text(html)
(GOOGLE / 'Model.gs').write_text((DIST / 'seed.js').read_text() + '\n' + (DIST / 'core.js').read_text() + '\n' + (DIST / 'operations-core.js').read_text())
with zipfile.ZipFile(DIST / 'Zarqa-People-Google-Workspace.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(GOOGLE.iterdir()):
        if path.is_file(): archive.write(path, path.name)
    for name in ['README.md', 'LICENSE']:
        archive.write(ROOT / name, name)
    archive.write(DIST / 'THIRD-PARTY-NOTICES.md', 'THIRD-PARTY-NOTICES.md')
    archive.write(DIST / 'icons' / 'LICENSE', 'icons/LICENSE')
    for path in (DIST / 'fonts').glob('*-OFL.txt'):
        archive.write(path, 'fonts/' + path.name)
output = ROOT / 'artifacts'
output.mkdir(exist_ok=True)
with zipfile.ZipFile(output / 'Zarqa-People-Open-Source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in source_files(ROOT):
        archive.write(path, 'zarqa-people/' + str(path.relative_to(ROOT)))
shutil.copyfile(output / 'Zarqa-People-Open-Source.zip', DIST / 'Zarqa-People-Open-Source.zip')
print('Created Google Workspace edition and open-source package.')
