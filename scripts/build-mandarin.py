from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[1];out=root/'dist/mandarin/materials'
manifest=json.loads((out/'manifest.json').read_text())
for name,info in manifest.items():
    data=(out/name).read_bytes()
    assert len(data)==info['bytes'] and hashlib.sha256(data).hexdigest()==info['sha256'],'Manifest mismatch: '+name
with zipfile.ZipFile(out/'mandarin-teacher-kit.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for p in sorted(out.iterdir()):
  if p.is_file() and p.suffix!='.zip':
   info=zipfile.ZipInfo(p.name,(2026,9,29,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;archive.writestr(info,p.read_bytes())
print('Built Mandarin teacher kit from verified v8.1 materials')
