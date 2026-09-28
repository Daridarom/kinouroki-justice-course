from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[1];out=root/'dist/mandarin/materials'
parts=sorted((root/'assets/mandarin').glob('slides.pptx.part*'))
assert len(parts)==2,'Expected two source parts'
pptx=b''.join(p.read_bytes() for p in parts)
manifest=json.loads((out/'manifest.json').read_text())
assert hashlib.sha256(pptx).hexdigest()==manifest['slides.pptx']['sha256'],'Source presentation changed'
(out/'slides.pptx').write_bytes(pptx)
with zipfile.ZipFile(out/'mandarin-teacher-kit.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for p in sorted(out.iterdir()):
  if p.suffix!='.zip':
   info=zipfile.ZipInfo(p.name,(2026,9,28,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;archive.writestr(info,p.read_bytes())
print('Built original presentation and teacher kit')
