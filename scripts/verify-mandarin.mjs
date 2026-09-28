import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {makeHarness as makeSharedHarness} from './harness.mjs';
const require=createRequire(import.meta.url),core=require('../dist/core.js');
const base=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,base),'utf8');
const ctx={window:{}};vm.runInNewContext(read('dist/mandarin/course.js'),ctx);vm.runInNewContext(read('dist/mandarin/learning.js'),ctx);
const course=JSON.parse(JSON.stringify(ctx.window.COURSE));
const source=JSON.parse(read('dist/mandarin/sources.json'));
const flat=blocks=>blocks.map(b=>b.type==='p'?b.text:b.rows.flat().join('\n')).join('\n');
const simplify=s=>s.toLocaleLowerCase('ru').replace(/\s+/g,' ').trim();
const allText=simplify(Object.values(source.documents).map(d=>flat(d.blocks)).join('\n'));
const N=course.stages.length;
assert.equal(N,7,'The canon course has seven stages');
assert.deepEqual(course.stages.map(s=>s.name),['Введение','Просмотр фильма','Чувство','Мысль','Осознание','Воображение','Воодушевление']);
assert.equal(course.projectStage,5,'The common-deed passport belongs to the Imagination stage');
assert.equal(course.meta.storageKey,'kinouroki.mandarin.v2');
assert.notEqual(course.meta.storageKey,'kinouroki.justice.v1','Courses must not share browser progress');
assert(allText.includes(simplify(course.definition)),'Definition must be an exact passport excerpt');
for(const s of course.stages){
  assert(allText.includes(simplify(s.goal)),`Goal differs from passport: ${s.name}`);
  assert(allText.includes(simplify(s.quote)),`Quotation differs from passport: ${s.name}`);
  assert.equal(s.paragraphs.length,4);assert.equal(s.reviewCriteria.length,3);
  for(const r of s.refs)for(const p of r.pages)assert(source.pages[String(p)]?.length,`Missing workbook page ${p} (${s.name})`);
  assert(source.pages[String(s.case.page)]?.length,`Missing case page ${s.case.page}`);
  assert(course.scenes.some(x=>x.id===s.case.scene),`Unknown case scene ${s.case.scene}`);
  for(const q of s.quizzes){
    assert(core.grade(q,q.answer),q.id+' answer must pass');
    assert.equal(core.grade(q,undefined),false);
    if(q.type==='single'){assert.equal(q.options.length,3);assert.equal(core.grade(q,String(q.answer)),false);}
    else {assert.equal(core.grade(q,q.answer.slice(1)),false);assert.equal(core.grade(q,[...q.answer].reverse()),false);}
    if(q.type==='order')assert.notDeepEqual(q.initial,q.answer,'Order quiz must not start solved: '+q.id);
    if(q.sourceSection)assert(source.sections[q.sourceDoc][q.sourceSection]?.length,'Missing section '+q.sourceSection);
    else for(const p of q.sourcePages)assert(source.pages[String(p)]?.length,`Missing quiz page ${p} (${q.id})`);
  }
}
for(const [id,doc] of Object.entries(source.documents)){
  const bytes=fs.readFileSync(new URL('dist/mandarin/'+doc.file.replace('./',''),base));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),doc.sha256,`Document changed without re-extraction: ${id}`);
}
for(const item of course.stages[3].quizzes[0].items)assert(allText.includes(simplify(item)),`Sail definition differs: ${item}`);
assert.deepEqual(course.stages[4].quizzes[0].items,['Друг','Семья','Класс','Школа','Малая родина','Страна','Мир']);
assert.equal(source.glossary.length,29);
assert.equal(course.scenes.length,7,'Seven film scenes per the episode map');
for(let i=1;i<course.scenes.length;i++)assert(course.scenes[i-1].end<=course.scenes[i].start,'Scene ranges must not overlap');
assert.equal(course.scenes[0].start,12);assert.equal(course.scenes[6].end,878);
assert.equal(course.filmEmbedURL,'https://vkvideo.ru/video_ext.php?oid=-69614724&id=456240051&hd=2&autoplay=0');
for(let i=1;i<=7;i++)assert(source.sections.passport['5.'+i+'.']?.length,'Passport section 5.'+i);
for(let i=2;i<=8;i++)assert(source.sections.rationale['2.2.'+i+'.']?.length,'Rationale section 2.2.'+i);
assert.equal(Object.keys(source.pages).length,70);
const html=read('dist/mandarin/index.html');
for(const asset of ['../styles.css','./course.js','./learning.js','../core.js','../app.js'])assert(html.includes(asset),'Shared engine asset: '+asset);
for(const file of ['passport.docx','rationale.docx','workbook.docx','standard-manual.pdf','standard-manual.docx','guide.pdf','original-workbook.pdf','slides.pdf','story.pdf'])assert(fs.existsSync(new URL('dist/mandarin/materials/'+file,base)),'Missing material '+file);
for(const match of course.meta.supplements.matchAll(/href="(\.\/[^"#?]+)"/g))assert(fs.existsSync(new URL('dist/mandarin/'+match[1].slice(2),base)),match[1]);
assert(!JSON.stringify(course).includes('drive.google.com'));
console.log('PASS: Mandarin canon course — seven stages, passport quotations, workbook pages, quiz model, scenes, materials');

const files=[['course.js',new URL('dist/mandarin/course.js',base)],['learning.js',new URL('dist/mandarin/learning.js',base)],['core.js',new URL('dist/core.js',base)],['app.js',new URL('dist/app.js',base)]];
const makeHarness=(initial={},failStorage=false)=>makeSharedHarness(files,initial,failStorage,source);
const h=makeHarness();
assert(h.get('app').innerHTML.includes('Семь этапов'));
assert(h.get('app').innerHTML.includes('Радость за другого'));
assert(h.get('app').innerHTML.includes('Предложение · 28.09.2026'),'Public course must disclose its proposal status');
assert(h.get('app').innerHTML.includes('0 из 7'));
for(const key of ['film','sources'])await h.emit('change',{match:'[data-preparation]',dataset:{preparation:key},checked:true});
for(let i=0;i<N;i++){
  h.navigate('#stage/'+i+'/read');
  assert(h.get('app').innerHTML.includes('ЭТАП '+String(i+1).padStart(2,'0')+' / 07'));
  await h.emit('change',{match:'[data-read]',dataset:{read:String(i)},checked:true});
  h.navigate('#stage/'+i+'/practice');
  for(const q of course.stages[i].quizzes){
    if(q.type==='single')await h.emit('change',{match:'[data-answer]',dataset:{answer:q.id},value:String(q.answer),tagName:'INPUT'});
    if(q.type==='match')for(let j=0;j<q.answer.length;j++)await h.emit('change',{match:'[data-answer]',dataset:{answer:q.id,index:String(j)},value:String(q.answer[j]),tagName:'SELECT'});
    if(q.type==='order'){
      // Bubble the visible order into the source order with single-step moves.
      const current=[...q.initial];
      for(let target=0;target<current.length;target++){
        let pos=current.indexOf(q.answer[target]);
        while(pos>target){await h.emit('click',{dataset:{move:q.id,from:String(pos),delta:'-1'}});[current[pos-1],current[pos]]=[current[pos],current[pos-1]];pos--;}
      }
    }
    await h.emit('click',{dataset:{check:q.id}});
    assert(h.get('app').innerHTML.includes('Верно. Сверим смысл'),`Feedback absent: ${q.id}`);
  }
  h.navigate('#stage/'+i+'/plan');
  for(const f of course.stages[i].fields)await h.emit('input',{match:'[data-note]',dataset:{note:f.id,group:'notes'},value:'<b>Учебная</b> заготовка по источнику'});
  if(i===course.projectStage)for(const f of course.projectFields)await h.emit('input',{match:'[data-note]',dataset:{note:f.id,group:'project'},value:'Плановое значение'});
  await h.emit('click',{dataset:{caseReview:String(i)}});
  await h.emit('change',{match:'[data-review]',dataset:{review:String(i)},checked:true});
  await h.emit('click',{dataset:{complete:String(i)}});
  assert(JSON.parse(h.local.get('kinouroki.mandarin.v2')).completed.includes(i),'Stage must complete: '+i);
}
const finalState=JSON.parse(h.local.get('kinouroki.mandarin.v2'));
assert.equal(finalState.completed.length,7);
assert(!h.local.has('kinouroki.justice.v1'),'Mandarin progress must not touch the Justice key');
h.navigate('#notebook');assert(h.get('app').innerHTML.includes('Учебный маршрут из семи этапов завершён'));
await h.emit('click',{exportFlag:true,dataset:{}});assert.equal(h.downloads.length,1);assert.equal(h.downloads[0],'Kinouroki_Mandarin_Moya_tetrad.html');
const exported=await h.blobs[0].text();assert(exported.includes('Паспорт общего дела'));assert(exported.includes('&lt;b&gt;'));assert(!exported.includes('<b>Учебная'));
const reloaded=makeHarness(Object.fromEntries(h.local));reloaded.navigate('#notebook');assert(reloaded.get('app').innerHTML.includes('Учебный маршрут из семи этапов завершён'));
reloaded.navigate('#stage/6/practice');await reloaded.emit('change',{match:'[data-answer]',dataset:{answer:'inspire-when'},value:'0',tagName:'INPUT'});
assert.equal(JSON.parse(reloaded.local.get('kinouroki.mandarin.v2')).completed.includes(6),false,'Changing an answer revokes completion');
const nav=makeHarness();nav.navigate('#stage/1/read');assert(nav.get('app').innerHTML.includes('Просмотр фильма'));
nav.navigate('#film');const filmMarkup=nav.get('app').innerHTML;assert(filmMarkup.includes('Семь сцен фильма'));assert(filmMarkup.includes('<iframe src="'+course.filmEmbedURL.replace(/&/g,'&amp;')+'"'));
nav.navigate('#film/teacher');assert.equal(nav.get('app').innerHTML,filmMarkup,'Scene change must preserve the mounted player');assert(nav.get('film-scene-info').innerHTML.includes('Разговор с учительницей'));
nav.navigate('#stage/7/read');assert(!nav.get('app').innerHTML.includes('ЭТАП 08'),'Stage 8 does not exist');
nav.navigate('#materials');assert(nav.get('app').innerHTML.includes('standard-manual.pdf'));assert(nav.get('app').innerHTML.includes('Паспорт методического пособия'));
await nav.emit('click',{dataset:{source:'workbook',pages:'48'}});assert(nav.get('source-dialog').open);assert(nav.get('source-content').innerHTML.includes('ПАСПОРТ ОБЩЕГО ДЕЛА'));
await nav.emit('click',{dataset:{source:'passport',section:'5.7.'}});assert(nav.get('source-content').innerHTML.includes('ВООДУШЕВЛЕНИЕ'));
nav.navigate('#glossary');assert(nav.get('app').innerHTML.includes('Радость за другого'));
const roundtrip=core.importProgress(core.exportProgress(finalState,course),course);assert.equal(roundtrip.completed.length,7);
const forged=core.normalize({version:1,read:[0,7,99],completed:[0,7],notes:{},answers:{},checked:{},lastRoute:'stage/6/plan',lessonReturn:'stage/6/read'},course);
assert.deepEqual(forged.read,[0]);assert.deepEqual(forged.completed,[]);assert.equal(forged.lastRoute,'stage/6/plan');assert.equal(forged.lessonReturn,'stage/6/read');
const justice=JSON.parse(JSON.stringify((()=>{const c={window:{}};vm.runInNewContext(read('dist/course.js'),c);vm.runInNewContext(read('dist/learning.js'),c);return c.window.COURSE;})()));
assert.equal(core.normalize({version:1,read:[],completed:[],notes:{},answers:{},checked:{},lastRoute:'stage/6/plan'},justice).lastRoute,'start','Six-stage course rejects a seventh stage route');
console.log('PASS: Mandarin seven-stage event flow on the shared engine, separate storage, export, reload, film scenes, source reader, route bounds');
