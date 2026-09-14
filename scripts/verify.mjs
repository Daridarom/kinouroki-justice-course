import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),core=require('../dist/core.js');
const base=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,base),'utf8');
const ctx={window:{}};vm.runInNewContext(read('dist/course.js'),ctx);vm.runInNewContext(read('dist/learning.js'),ctx);
const course=JSON.parse(JSON.stringify(ctx.window.COURSE));
const source=JSON.parse(read('dist/sources.json'));
const flat=blocks=>blocks.map(b=>b.type==='p'?b.text:b.rows.flat().join('\n')).join('\n');
const simplify=s=>s.toLocaleLowerCase('ru').replace(/\s+/g,' ').trim();
const allText=simplify(Object.values(source.documents).map(d=>flat(d.blocks)).join('\n'));
assert.equal(course.stages.length,6);
assert.equal(course.stages.flatMap(s=>s.quizzes).length,17);
assert.equal(course.projectFields.length,13);
assert(allText.includes(simplify(course.definition)),'Definition must be an exact source excerpt');
for(const s of course.stages){
  assert(allText.includes(simplify(s.goal)),`Goal differs from source: ${s.name}`);
  assert(allText.includes(simplify(s.quote)),`Quotation differs from source: ${s.name}`);
  for(const r of s.refs)for(const p of r.pages)assert(source.pages[p]?.length,`Missing workbook page ${p}`);
  for(const q of s.quizzes){
    assert(core.grade(q,q.answer),q.id+' answer must pass');
    assert.equal(core.grade(q,undefined),false);
    if(q.type==='single')assert.equal(core.grade(q,String(q.answer)),false);
    else {assert.equal(core.grade(q,q.answer.slice(1)),false);assert.equal(core.grade(q,[...q.answer].reverse()),false);}
  }
}
const sourceAlgorithm=source.pages['28'].find(b=>b.type==='table').rows.slice(1).map(r=>r[1]);
assert.deepEqual(course.stages[2].quizzes[0].items,sourceAlgorithm);
for(const [id,doc] of Object.entries(source.documents)){
  const bytes=fs.readFileSync(new URL('dist/'+doc.file.replace('./',''),base));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),doc.sha256,`Original changed: ${id}`);
}
for(const quiz of [course.stages[3].quizzes[0],course.stages[5].quizzes[0]])for(const item of quiz.items)assert(allText.includes(simplify(item)),`Matching text differs: ${item}`);
assert.equal(source.glossary.length,25);
assert.deepEqual(course.stages.map(s=>s.name),['Введение','Чувство','Мысль','Сознание','Воображение','Воодушевление']);
assert(source.pages['74-80']?.length);
for(const principle of course.principles)assert(allText.includes(simplify(principle)));
for(let i=1;i<=6;i++)assert(source.sections.passport['5.'+i+'.']?.length);
for(let i=2;i<=7;i++)assert(source.sections.rationale['2.2.'+i+'.']?.length);

const forged=core.normalize({version:1,read:[0,0,99],completed:[0,0,99],notes:{'intro-rules':'x'.repeat(6000),unexpected:'hidden'},answers:{},checked:{}},course);
assert.deepEqual(forged.read,[0]);assert.deepEqual(forged.completed,[]);assert.equal(forged.notes['intro-rules'].length,5000);assert(!('unexpected' in forged.notes));
const stored=core.blank();stored.read=[0];stored.completed=[0];for(const q of course.stages[0].quizzes){stored.answers[q.id]=q.answer;stored.checked[q.id]=true;}
assert.deepEqual(core.normalize(stored,course).completed,[], 'Quiz alone does not complete the stage');for(const f of course.stages[0].fields)stored.notes[f.id]='Заполненная заготовка';stored.reviews[0]=true;assert.deepEqual(core.normalize(stored,course).completed,[],'Preparation and case review are required');stored.preparation={film:true,sources:true};stored.caseReviewed[0]=true;assert.deepEqual(core.normalize(stored,course).completed,[0]);stored.answers['intro-antipode']=1;assert.deepEqual(core.normalize(stored,course).completed,[]);
assert.equal(core.escape('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
console.log('PASS: source quotations, references, original hashes, quiz model, restored progress, input handling');

// A lightweight event harness exercises real application handlers without a browser.
// It does not validate layout or browser APIs.
const makeHarness=(initial={},failStorage=false)=>{
  const elements=new Map(),windowEvents={},local=new Map(Object.entries(initial)),downloads=[],blobs=[];
  class Element{
    constructor(id){this.id=id;this.innerHTML='';this.textContent='';this.events={};this.dataset={};this.open=false;this.hidden=false;this.tagName='BUTTON';}
    addEventListener(name,fn){this.events[name]=fn;}
    querySelector(){return null;}
    querySelectorAll(){return [];}
    focus(){}
    showModal(){this.open=true;}
    close(){this.open=false;}
    appendChild(){}
    remove(){}
    click(){downloads.push(this.download);}
    closest(){return this;}
    hasAttribute(name){return name==='data-export'?this.exportFlag:name==='data-reset'?this.resetFlag:name.startsWith('data-')&&name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()) in this.dataset;}
    matches(selector){return this.match===selector;}
  }
  const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
  const location={hash:''};
  const sandbox={console,innerWidth:1280,location,history:{replaceState(_,__,hash){location.hash=hash;}},document:{getElementById:get,querySelector(){return null;},querySelectorAll(){return [];},createElement(){return new Element('new');},body:new Element('body')},localStorage:{getItem(k){if(failStorage)throw new Error('denied');return local.get(k)||null;},setItem(k,v){if(failStorage)throw new Error('quota');local.set(k,v);}},fetch:async()=>({ok:true,json:async()=>source}),URL:{createObjectURL(blob){blobs.push(blob);return'blob:test';},revokeObjectURL(){}},Blob,AbortController,setTimeout(){return 1;},clearTimeout(){}};
  sandbox.window=sandbox;sandbox.addEventListener=(n,f)=>windowEvents[n]=f;sandbox.scrollTo=()=>{};sandbox.scrollY=0;
  vm.createContext(sandbox);for(const file of ['course.js','learning.js','core.js','app.js'])vm.runInContext(read('dist/'+file),sandbox,{filename:file});
  const emit=async(type,attrs)=>{const el=new Element('target');Object.assign(el,attrs);await get('app').events[type]({target:el});};
  const navigate=(hash)=>{location.hash=hash;windowEvents.hashchange();};
  return {get,local,downloads,blobs,emit,navigate,windowEvents};
};
const h=makeHarness();for(const key of ['film','sources'])await h.emit('change',{match:'[data-preparation]',dataset:{preparation:key},checked:true});assert(h.get('app').innerHTML.includes('Настроить «Весы в сердце»'));
await h.emit('input',{match:'[data-note]',dataset:{note:'intro-definition',group:'notes'},value:'<script>alert("x")</script> Моя заметка'});
for(let i=0;i<6;i++){
  h.navigate('#stage/'+i+'/read');
  await h.emit('change',{match:'[data-read]',dataset:{read:String(i)},checked:true});
  h.navigate('#stage/'+i+'/practice');
  for(const q of course.stages[i].quizzes){
    if(q.type==='single')await h.emit('change',{match:'[data-answer]',dataset:{answer:q.id},value:String(q.answer),tagName:'INPUT'});
    if(q.type==='match')for(let j=0;j<q.answer.length;j++)await h.emit('change',{match:'[data-answer]',dataset:{answer:q.id,index:String(j)},value:String(q.answer[j]),tagName:'SELECT'});
    if(q.type==='order'){
      // The visible initial order is 2,0,3,1. Three moves restore the source order.
      for(const [from,delta] of [[1,-1],[3,-1],[2,-1]])await h.emit('click',{dataset:{move:q.id,from:String(from),delta:String(delta)}});
    }
    await h.emit('click',{dataset:{check:q.id}});
    assert(h.get('app').innerHTML.includes('Верно. Сверим смысл'),`Feedback absent: ${q.id}`);
  }
  h.navigate('#stage/'+i+'/plan');
  for(const f of course.stages[i].fields)await h.emit('input',{match:'[data-note]',dataset:{note:f.id,group:'notes'},value:i===0&&f.id==='intro-definition'?'<script>alert(1)</script> Моя заготовка':'Учебная заготовка по источнику'});
  if(i===4)for(const f of course.projectFields)await h.emit('input',{match:'[data-note]',dataset:{note:f.id,group:'project'},value:'Плановое значение'});
  await h.emit('click',{dataset:{caseReview:String(i)}});
  await h.emit('change',{match:'[data-review]',dataset:{review:String(i)},checked:true});
  await h.emit('click',{dataset:{complete:String(i)}});
}
const entryHarness=makeHarness();entryHarness.navigate('#review');assert(entryHarness.get('app').innerHTML.includes('review-banner'));entryHarness.navigate('#learn');assert(!entryHarness.get('app').innerHTML.includes('class="review-banner"'),'Course link must exit review mode');assert(entryHarness.get('app').innerHTML.includes('Шесть этапов'));
const emptyQuizHarness=makeHarness();emptyQuizHarness.navigate('#stage/0/practice');await emptyQuizHarness.emit('click',{dataset:{check:'intro-antipode'}});assert(emptyQuizHarness.get('app').innerHTML.includes('Сначала выберите ответ'));assert(!emptyQuizHarness.get('app').innerHTML.includes('Пока не совпало'));
const finalState=JSON.parse(h.local.get('kinouroki.justice.v1'));
assert.equal(finalState.completed.length,6);
h.navigate('#notebook');assert(h.get('app').innerHTML.includes('Учебный маршрут из шести этапов завершён'));
await h.emit('click',{exportFlag:true,dataset:{}});assert.equal(h.downloads.length,1);
const exported=await h.blobs[0].text();assert(exported.includes('&lt;script&gt;'));assert(!exported.includes('<script>'));assert(exported.includes('Паспорт проекта справедливости'));
h.navigate('#review');const beforeReview=JSON.parse(h.local.get('kinouroki.justice.v1'));h.navigate('#stage/0/practice');assert(h.get('app').innerHTML.includes('Показан ответ и методический разбор'));await h.emit('change',{match:'[data-answer]',dataset:{answer:'intro-antipode'},value:'1',tagName:'INPUT'});await h.emit('click',{dataset:{complete:'0'}});assert.deepEqual(JSON.parse(h.local.get('kinouroki.justice.v1')),beforeReview,'Review cannot alter learning state');await h.emit('click',{dataset:{mode:'learn'}});
const reloaded=makeHarness(Object.fromEntries(h.local));reloaded.navigate('#notebook');assert(reloaded.get('app').innerHTML.includes('Учебный маршрут из шести этапов завершён'));assert(reloaded.get('app').innerHTML.includes('&lt;script&gt;'));
// Changing a checked answer revokes completion and must survive a reload.
reloaded.navigate('#stage/0/practice');await reloaded.emit('change',{match:'[data-answer]',dataset:{answer:'intro-antipode'},value:'1',tagName:'INPUT'});assert.equal(JSON.parse(reloaded.local.get('kinouroki.justice.v1')).completed.includes(0),false);
await reloaded.emit('click',{dataset:{check:'intro-antipode'}});assert(reloaded.get('app').innerHTML.includes('Пока не совпало'));
await reloaded.emit('click',{resetFlag:true,dataset:{}});assert(reloaded.get('reset-dialog').open);reloaded.get('confirm-reset').events.click();assert.deepEqual(JSON.parse(reloaded.local.get('kinouroki.justice.v1')).completed,[]);
const blocked=makeHarness({},true);assert(blocked.get('app').innerHTML.includes('Браузер не сохраняет записи'));
await h.emit('click',{dataset:{source:'workbook',pages:'28'}});assert(h.get('source-dialog').open);assert(h.get('source-content').innerHTML.includes('Я заметил мысль-оковы.'));
console.log('PASS: full six-stage event flow, edit revokes completion, reload, source reader, escaped export, reset, unavailable storage');
console.log('Not performed: browser/layout verification and supported-context WebMCP validation.');
