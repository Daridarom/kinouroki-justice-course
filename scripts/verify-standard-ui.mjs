import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {makeHarness} from './harness.mjs';
const base=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,base),'utf8');
const names=['Введение','Просмотр фильма','Чувство','Мысль','Осознание','Воображение','Социальная практика','Воодушевление'];
const version='20260929-v81';
const gitBlob=p=>{const b=fs.readFileSync(new URL(p,base));return crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');};
// Approved content at 5d79b50: changes belong to the learning adapter, not the source model.
assert.equal(gitBlob('dist/course.js'),'fe933efe5c9e3d2f7adc6d4ff065bf6a083a1cff','Justice source content stays untouched');
assert.equal(gitBlob('dist/mandarin/course.js'),'8c3277386f56b1f8013f5d76222b07b53a19f205','Keep the frozen picture, Two Banks and corrected object of envy');
for(const cfg of [
  {dir:'dist/',standard:[1,6],pages:{1:15,6:60,7:81},sections:[1,null,2,3,4,5,null,6]},
  {dir:'dist/mandarin/',standard:[],pages:{1:11,6:55,7:58},sections:[1,2,3,4,5,6,7,8]}
]){
  const {dir,standard,pages,sections}=cfg;
  const source=JSON.parse(read(dir+'sources.json'));
  const files=[['course.js',new URL(dir+'course.js',base)],['learning.js',new URL(dir+'learning.js',base)],['core.js',new URL('dist/core.js',base)],['app.js',new URL('dist/app.js',base)]];
  const h=makeHarness(files,{},false,source);
  h.navigate('#stage/0/read');
  await new Promise(resolve=>setImmediate(resolve));
  const course=JSON.parse(JSON.stringify(h.sandbox.COURSE));
  assert.deepEqual(course.stages.map(s=>s.name),names,'Execute the actual course, not a reconstructed splice');
  assert.deepEqual(course.stages.flatMap((s,i)=>s.goalSource==='project-standard'?[i]:[]),standard,'Only the agreed three goals are course formulations');
  assert.equal(course.projectStage,5,'Project planning stays on Imagination, not Awareness');
  const raw={window:{}};vm.runInNewContext(read(dir+'course.js'),raw);
  for(const original of raw.window.COURSE.stages){
    const s=course.stages.find(s=>s.name===(original.name==='Сознание'?'Осознание':original.name));
    assert.equal(s.goal,original.goal,'Never edit passport goals');
    assert.equal(s.quote,original.quote,'Never edit passport quotations');
    assert.equal(s.quoteRef,original.quoteRef,'Keep quotation attribution');
  }
  for(const [i,s] of course.stages.entries()){
    assert.equal('proposed' in s,false,'The confirmed standard is not a hidden proposal flag');
    assert.equal(s.goalSource,standard.includes(i)?'project-standard':'passport');
    assert.equal(s.sourceStage??null,sections[i],'Source section numbering is independent of route position');
    assert(s.refs.some(r=>r.pages.includes(s.case.page)),'Case page must be explicitly linked');
    assert(source.pages[String(s.case.page)]?.length,'No missing excerpt page');
    for(const r of s.refs)for(const p of r.pages)assert(source.pages[String(p)]?.length);
    if(sections[i]){
      assert(source.sections.passport['5.'+sections[i]+'.']?.length);
      assert(source.sections.rationale['2.2.'+(sections[i]+1)+'.']?.length);
    }
    for(const tab of ['read','practice','plan']){
      h.navigate('#stage/'+i+'/'+tab);
      const html=h.get('app').innerHTML;
      assert(html.includes('<h1>'+s.name+'</h1>'));
      assert(!html.includes('href="#film/"'),'No empty episode link');
      assert.equal(html.includes('class="project-form"'),tab==='plan'&&i===5);
      if(tab==='read'){
        const label='ЦЕЛЬ ЭТАПА · '+(standard.includes(i)?'СТАНДАРТ ПРОЕКТА':'ПАСПОРТ ПОСОБИЯ');
        assert(html.includes(label),'Visible goal provenance: '+s.name);
        if(standard.includes(i)){
          assert(!html.includes('ЦЕЛЬ ЭТАПА · ПАСПОРТ ПОСОБИЯ'));
          assert(!html.includes('Паспорт · этот этап'),'No invented numbered passport section');
          assert(!html.includes('0 минут'));
        }else{
          assert(html.includes('data-section="5.'+sections[i]+'."'));
          assert(html.includes('data-section="2.2.'+(sections[i]+1)+'."'));
        }
        if(pages[i]!==undefined)assert(html.includes('ОРИГИНАЛ · РАБОЧАЯ ТЕТРАДЬ · СТРАНИЦА '+pages[i]));
      }
    }
  }
  h.navigate('#stage/6/read');
  const practice=h.get('app').innerHTML;
  assert(!practice.includes('ИНСТРУКЦИЯ ПО ВЫЖИВАНИЮ'));
  if(dir.includes('mandarin')){
    assert(practice.includes('СОЦИАЛЬНАЯ ПРАКТИКА — НАШЕ ОБЩЕЕ ДЕЛО'));
    assert(!practice.includes('седьмая, последняя остановка'));
  }else{
    assert.equal(course.meta.principlesStage,3,'Principles belong to Thought');
    assert(course.stages[7].paragraphs[0].includes('после выполненной социальной практики'));
    assert(!course.stages[7].paragraphs.join(' ').includes('Завершение занятия и реализация социальной практики — разные события.'));
    assert(course.stages[7].case.explanation.includes('сначала выполненное общее дело, затем Воодушевление'));
  }
  // Rendered export must never reintroduce false passport attribution.
  h.navigate('#result');await h.emit('click',{exportFlag:true,dataset:{}});
  const exported=await h.blobs.at(-1).text();
  assert.equal((exported.match(/Цель этапа · стандарт проекта\./g)||[]).length,standard.length);
  assert.equal((exported.match(/Цель этапа из паспорта\./g)||[]).length,8-standard.length);
  // A missing/unlinked source must suppress the excerpt and the case-page button.
  for(const invalid of [null,999]){
    h.sandbox.COURSE.stages[1].case.page=invalid;
    h.navigate('#stage/1/read');assert(!h.get('app').innerHTML.includes('class="original-excerpt"'));
    h.navigate('#stage/1/practice');assert(!h.get('app').innerHTML.includes('Тетрадь · страница '+invalid));
  }
  h.sandbox.COURSE.stages[1].case.page=1;h.sandbox.COURSE.stages[1].refs=[];
  h.navigate('#stage/1/read');assert(!h.get('app').innerHTML.includes('class="original-excerpt"'),'No fallback to page one');
  const html=read(dir+'index.html');
  assert.match(html,/<meta name="description" content="[^"]*восемь этапов/);
  const assets=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)\?[^"]*)"/g)].map(m=>m[1]);
  assert.equal(assets.length,5);
  assert(assets.every(url=>url.endsWith('?v='+version)),'All asset versions match');
}
assert(!read('dist/app.js').includes('20260928-canon'));
assert(!read('dist/mandarin/learning.js').includes('20260928-canon'));
console.log('PASS: standard goal attribution in rendered UI and export, explicit relevant excerpts, empty-source guard, original section mapping, post-practice inspiration, protected source content and cache versions');
