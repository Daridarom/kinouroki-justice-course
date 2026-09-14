from pathlib import Path
from docx import Document
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
from docx.table import Table
import json, shutil, re, hashlib, sys

root=Path(__file__).resolve().parents[1]
source_root=Path(sys.argv[1]) if len(sys.argv)>1 else root/'dist/materials'
names={'passport':'ПАСПОРТ МЕТОДИЧЕСКОГО ПОСОБИЯ 1 ОТ 29.0826','rationale':'МЕТОДИЧЕСКОЕ ОБОСНОВАНИЕ ПАСПОРТА ОТ 20.08.26','workbook':'СВОДНАЯ РАБОЧАЯ ТЕТРАДЬ 1'}
labels={'passport':'Паспорт методического пособия','rationale':'Методическое обоснование','workbook':'Сводная рабочая тетрадь'}
all_docs={};pages={};glossary=[]
(root/'dist/materials').mkdir(exist_ok=True)
for key,name in names.items():
    path=source_root/(name+'.docx')
    if not path.exists(): path=source_root/(key+'.docx')
    doc=Document(path);blocks=[];current=None
    for child in doc.element.body:
        block=None
        if child.tag==qn('w:p'):
            text=Paragraph(child,doc).text.strip()
            if text:
                block={'type':'p','text':text}
                if key=='workbook':
                    m=re.search(r'СТРАНИЦ(?:А|Ы)\s+(\d+(?:[–—-]\d+)?)\.',text)
                    if m:current=m.group(1).replace('–','-').replace('—','-');pages.setdefault(current,[])
        elif child.tag==qn('w:tbl'):
            rows=[[c.text for c in r.cells] for r in Table(child,doc).rows]
            block={'type':'table','rows':rows}
            if key=='passport' and rows[0]==['Термин','Определение']:glossary=rows[1:]
        if block:
            blocks.append(block)
            if key=='workbook' and current is not None:pages[current].append(block)
    all_docs[key]={'title':labels[key],'originalName':name+'.docx','file':'./materials/'+key+'.docx','sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'blocks':blocks}
    target=root/'dist/materials'/(key+'.docx')
    if path.resolve()!=target.resolve(): shutil.copyfile(path,target)
# The source documents stay exact. The glossary inconsistency is retained in the source reader,
# but the inconsistent entry is not used as an automatically graded learning objective.
sections={}
for key,prefixes in {'passport':['5.'+str(i)+'.' for i in range(1,7)],'rationale':['2.2.'+str(i)+'.' for i in range(1,9)]}.items():
    sections[key]={}
    bs=all_docs[key]['blocks']
    for prefix in prefixes:
        start=next((i for i,b in enumerate(bs) if b['type']=='p' and b['text'].startswith(prefix)),None)
        if start is None:continue
        end=next((i for i in range(start+1,len(bs)) if bs[i]['type']=='p' and re.match(r'^\d+\.',bs[i]['text'])),len(bs))
        sections[key][prefix]=bs[start:end]
data={'documents':all_docs,'pages':pages,'glossary':glossary,'sections':sections}
(root/'dist/sources.json').write_text(json.dumps(data,ensure_ascii=False),encoding='utf8')
print(json.dumps({'source_documents':len(all_docs),'workbook_pages':len(pages),'glossary_entries':len(glossary)}))
