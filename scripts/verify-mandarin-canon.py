"""Check public quotations against the unchanged source PDF, not a second paraphrase."""
from pathlib import Path
import hashlib,json,re,subprocess,zipfile
root=Path(__file__).resolve().parents[1]
materials=root/'dist/mandarin/materials'
canon=json.loads(subprocess.check_output(['node','-e',"process.stdout.write(JSON.stringify(require('./dist/mandarin/canon.js')))"],cwd=root))
def normalized(s):return ' '.join(s.split())
def page(n):
 return normalized(subprocess.check_output(['pdftotext','-f',str(n),'-l',str(n),str(materials/'guide.pdf'),'-'],text=True))
def require_quote(quote,text):
 assert normalized(quote) in text, 'Source quotation differs: '+quote
p1=page(1)
for key in ['definition','classification','base','vector','synthesis','antipode','conditions']:require_quote(canon[key],p1)
for q in canon['qualities']:require_quote(q['name']+' – '+q['definition'],p1)
p4=page(4);last=-1
for i,m in enumerate(canon['moments'],1):
 quote=f'{i} кадр – {m["scene"]}, {m["feeling"]}'
 require_quote(quote,p4);position=p4.index(quote);assert position>last;last=position
p15=page(15)
for feeling,color in canon['flower']:
 # The first label occurs inside a sentence, hence casefold, not a rewritten definition.
 require_quote((feeling+' – '+color).casefold(),p15.casefold())
for quote in ['Воля и искренность','Чуткость и великодушие']:require_quote(quote,page(16))
assert 'аптечка и спасательный круг' in page(11).lower()
# Slide 10 contains raster artwork, not PDF text. Guard the manually checked
# transcription AND its original image; a new source requires visual review.
assert canon['pyramid']==['Друг','Семья','Класс','Школа','Малая родина','Страна','МИР']
with zipfile.ZipFile(materials/'slides.pptx') as z:
 assert hashlib.sha256(z.read('ppt/media/image14.jpeg')).hexdigest()=='f5c6d60ea924fe2f0034fc0d113b6cd87d148c4b50a712de711bfecc593db733'
 assert b'../media/image14.jpeg' in z.read('ppt/slides/_rels/slide10.xml.rels')
# Guard the exact regressions reported by the methodical review, including DOCX tables.
bad=re.compile(r'\b(?:(?:по|По|из|к|пояснению|примерам|примеры|легенду) пособие\b|в исходная тетрадь|оригиналу исходная тетрадь|оригинальную тетрадь исходная тетрадь|Подготовить исходная тетрадь|встреч)',re.I)
from xml.etree import ElementTree as ET
for name in ['teacher-guide','worksheets','teacher-practice']:
 with zipfile.ZipFile(materials/(name+'.docx')) as z:
  doc=ET.fromstring(z.read('word/document.xml'))
  text=' '.join(''.join(p.itertext()) for p in doc.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'))
  assert not bad.search(text),(name,bad.search(text).group())
for name in ['index.html','lessons.js','materials/README.md']:
 text=(root/'dist/mandarin'/name).read_text();assert not bad.search(text),(name,bad.search(text).group())
# Exercise a negative case so a changed definition cannot silently pass.
try:require_quote(canon['definition'].replace('искренне','неискренне'),p1)
except AssertionError:pass
else:raise AssertionError('Literal guard failed to detect a changed definition')
print('PASS: exact PDF passport, five moments/feelings, island, flower; visually checked pyramid/image hash; corrected grammar')
