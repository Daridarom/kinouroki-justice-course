import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {makeHarness} from './harness.mjs';
// Teacher route for «Великий»: map, preparation, teacher-as-student, outcomes and guide.
const base=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,base),'utf8');
const source=JSON.parse(read('dist/sources.json'));
const files=['course.js','learning.js','core.js','encyclopedia.js','socratic.js','teacher.js','app.js'].map(f=>[f,new URL('dist/'+f,base)]);
const flat=blocks=>blocks.map(b=>b.type==='p'?b.text:b.rows.flat().join('\n')).join('\n');
const simplify=s=>s.toLocaleLowerCase('ru').replace(/\s+/g,' ').trim();
const allText=simplify(Object.values(source.documents).map(d=>flat(d.blocks)).join('\n'));

const ctx={window:{}};vm.runInNewContext(read('dist/encyclopedia.js'),ctx);vm.runInNewContext(read('dist/teacher.js'),ctx);
const E=JSON.parse(JSON.stringify(ctx.window.ENCYCLOPEDIA));
const encText=simplify(Object.values(E.articles).flatMap(a=>a.sections.flatMap(x=>[x.title,...x.text])).join('\n'));
assert.deepEqual(Object.keys(E.articles),['spravedlivost','schastye','soradovanie']);
assert(!Object.values(E.articles).some(a=>a.sections.some(x=>x.title.startsWith('1.2.'))),'Source cards are not published');
const T=JSON.parse(JSON.stringify(ctx.window.TEACHER));
for(const text of [T.quality.definition,T.quality.antipode,...T.quality.concepts])assert(allText.includes(simplify(text)),'Quality text must be verbatim: '+text);
for(const item of T.exam.find(q=>q.id==='exam-path').items)assert(allText.includes(simplify(item)),'Path step must be verbatim: '+item);
assert.equal(T.studentPages.length,8,'Student pages for each of eight stages');
for(const p of [...T.studentPages.flat(),...T.workbookParts.flatMap(x=>x.pages),...T.classWorkbook.flatMap(x=>x.items.flatMap(i=>i[2]))])assert(source.pages[String(p)]?.length,'Workbook page exists: '+p);
for(const id of ['exam-enc-kindness','exam-enc-indignation','exam-enc-attitude','exam-enc-formula']){
  const q=T.exam.find(x=>x.id===id);assert(encText.includes(simplify(q.options[q.answer]).replace(/^«|»$/g,'')),'Encyclopedia answer is verbatim: '+id);
}
for(const q of T.exam){
  if(q.type==='single')assert(q.answer>=0&&q.answer<q.options.length);
  else{assert.deepEqual([...q.initial].sort(),q.answer.map((_,i)=>i));assert.notDeepEqual(q.initial,q.answer);}
}

// Existing progress of the course must survive untouched.
const legacy={version:1,read:[0],completed:[],answers:{},checked:{},notes:{'intro-definition':'Старая запись'},project:{},reviews:{},preparation:{film:true,sources:true},caseReviewed:{},mode:'learn',lastRoute:'map'};
const h=makeHarness(files,{'kinouroki.justice.v1':JSON.stringify(legacy)},false,source);
await new Promise(r=>setImmediate(r));
let html=h.get('app').innerHTML;
assert(html.includes('Весь киноурок на одной карте'),'Saved teacher route restores the map');
assert(html.includes('МАРШРУТНАЯ КАРТА'),'Sidebar shows the route map block');
for(const label of ['Подготовка','Старт','Итоги'])assert(html.includes(label));
assert(html.includes('class="t-guide'),'Guide character is visible');
assert(html.includes('<strong>Хлопушка</strong>'),'Clapper leads the route map');
h.navigate('#start');html=h.get('app').innerHTML;
assert(html.includes('Подготовка → Старт → Итоги'));assert(html.includes('Восемь этапов'),'Existing start page is kept');

h.navigate('#prep');html=h.get('app').innerHTML;
assert(html.includes('Энциклопедия прикладной этики')&&html.includes('Рабочая редакция')&&html.includes('Ожидает материала'),'Pending sources are shown honestly');
assert(html.includes('2 из 6'),'Film and kit checkboxes are shared with the course');
for(const q of T.exam){
  if(q.type==='single')await h.emit('change',{dataset:{tInput:'',tAnswer:q.id},value:String(q.answer)});
  else{
    let order=[...q.initial];
    for(let target=0;target<order.length;target++){let from=order.indexOf(target);while(from>target){await h.emit('click',{dataset:{tInput:'',tMove:q.id,from:String(from),delta:'-1'}});[order[from-1],order[from]]=[order[from],order[from-1]];from--;}}
  }
  await h.emit('click',{dataset:{tCheck:q.id}});
}
await h.emit('change',{dataset:{tInput:'',tPrep:'intro'},checked:true});
await h.emit('change',{dataset:{tInput:'',tPrep:'print'},checked:true});
html=h.get('app').innerHTML;
assert(html.includes('Верных ответов: <b>'+T.exam.length+' из '+T.exam.length+'</b>'),'Exam passes with source answers');
assert(html.includes('5 из 6'),'Workbook step still open');
await h.emit('change',{dataset:{tInput:'',tPrep:'workbook'},checked:true});assert(h.get('app').innerHTML.includes('6 из 6'),'All available preparation steps done');
const teacherState=JSON.parse(h.local.get('kinouroki.justice.teacher.v1'));
assert.equal(Object.keys(teacherState.exam.checked).length,T.exam.length);

h.navigate('#prep/intro');html=h.get('app').innerHTML;
assert(html.includes('Произвол (или пристрастность)')&&html.includes('закон не противоречит совести'),'Preparation shows encyclopedia excerpts');
h.navigate('#encyclopedia');html=h.get('app').innerHTML;assert(html.includes('5.9. Конструктивные установки')&&html.includes('<strong>Весовщик</strong>'));
h.navigate('#encyclopedia/schastye');assert(h.get('app').innerHTML.includes('Любовь [ядро], Идея [ядро]'));
h.navigate('#happiness');html=h.get('app').innerHTML;assert(html.includes('«Богатство и статус сделают меня счастливым».')&&html.includes('Сократовский метод')&&html.includes('#socrat/u10'));
h.navigate('#socrat/u10');html=h.get('app').innerHTML;
assert(html.includes('«Система прогнила целиком, я в ней — просто винтик»')&&html.includes('ШАГ 1 ИЗ 7'),'Socratic trainer opens');
assert(!html.includes('Бюрократия, несправедливая оплата'),'Step 1 analysis is hidden until the teacher answers');
await h.emit('input',{dataset:{tInput:'',tSocNote:'u10|v1-s1'},value:'Моё различение'});
await h.emit('click',{dataset:{tSocOpen:'u10|v1-s1'}});assert(h.get('app').innerHTML.includes('Бюрократия, несправедливая оплата'));
await h.emit('click',{dataset:{tSocStep:'u10|2'}});html=h.get('app').innerHTML;assert(html.includes('Дальше · 1 из'));
await h.emit('click',{dataset:{tSocNext:'u10|v1-s2'}});assert(h.get('app').innerHTML.includes('Дальше · 2 из'));
await h.emit('click',{dataset:{tSocVariant:'u10|2'}});assert(h.get('app').innerHTML.includes('Эффект бабочки'));
await h.emit('click',{dataset:{tSocStep:'u10|7'}});await h.emit('click',{dataset:{tSocOpen:'u10|v2-s7'}});assert(h.get('app').innerHTML.includes('Через каждого ребёнка я лично участвую'));
await h.emit('click',{dataset:{tSocOpen:'u10|v2-s2'}});await h.emit('click',{dataset:{tSocStep:'u10|99'}});
const soc=JSON.parse(h.local.get('kinouroki.justice.teacher.v1')).socrat.u10;
assert.equal(soc.notes['v1-s1'],'Моё различение');assert.equal(soc.variant,2);assert.equal(soc.step,7);assert(!soc.open['v2-s2'],'Only answer steps can be revealed');
h.navigate('#happiness');assert(h.get('app').innerHTML.includes('Разборы из библиотеки проекта'));
h.navigate('#stage/2/read');html=h.get('app').innerHTML;
assert(html.includes('<strong>Весовщик</strong>'),'Scales keeper accompanies meaning stages');
assert(html.includes('ПРОЙДИТЕ КАК УЧЕНИК')&&html.includes('ПОЯСНЕНИЯ ПЕДАГОГУ'));
assert(html.includes('ЗАПРЕЩЁН логический анализ мыслей'),'Scenario hint comes from passport 5.2');
assert(html.includes('Ценность прожита'),'Expected effect comes from rationale 2.2.8');
await h.emit('change',{dataset:{tInput:'',tStudent:'16'},checked:true});
assert(h.get('app').innerHTML.includes('1 из 9'));
h.navigate('#stage/1/read');assert(h.get('app').innerHTML.includes('Отдельного раздела этого этапа в исходном паспорте нет'));

h.navigate('#workbook/feel');html=h.get('app').innerHTML;
assert(html.includes('СТРАНИЦА 24.')&&html.includes('СТРАНИЦА 3. ТЕРМОМЕТР ЧУВСТВ'),'Feeling appendix printed with its stage');
h.navigate('#workbook/intro');html=h.get('app').innerHTML;
assert(html.includes('СТРАНИЦА 3. ЧЕТВЁРТЫЙ ЛИШНИЙ')&&!html.includes('СТРАНИЦА 3. ТЕРМОМЕТР ЧУВСТВ'),'Introduction print excludes the appendix');

h.navigate('#student');html=h.get('app').innerHTML;
assert(html.includes('Рабочая тетрадь ученика')&&html.includes('Черновик состава')&&html.includes('Содержание'));
assert(!html.includes('СТРАНИЦА 12. ДОМАШНЕЕ ЗАДАНИЕ'),'Homework is not part of the class workbook');
assert(html.includes('СТРАНИЦА 5. ВЕСЫ СОЛОМОНА')&&html.includes('СТРАНИЦА 60. ПАСПОРТ ПРОЕКТА'));
h.navigate('#student/intro');html=h.get('app').innerHTML;assert(!html.includes('СТРАНИЦА 3. ТЕРМОМЕТР ЧУВСТВ'));
h.navigate('#outcomes');
assert(h.get('app').innerHTML.includes('<strong>Фонарик</strong>'),'Lantern accompanies outcomes');
await h.emit('input',{dataset:{tInput:'',tOutcome:'s0-kids'},value:'<img src=x onerror=1> Дети спорили о весах'});
await h.emit('input',{dataset:{tInput:'',tOutcome:'forged'},value:'x'});
h.navigate('#outcomes');html=h.get('app').innerHTML;
assert(html.includes('&lt;img src=x onerror=1&gt;')&&!html.includes('<img src=x'),'Outcome notes are escaped');
const stored=JSON.parse(h.local.get('kinouroki.justice.teacher.v1'));
assert(!('forged' in stored.outcomes));

// Review mode: nothing in the teacher store changes.
h.navigate('#review');const before=h.local.get('kinouroki.justice.teacher.v1');
h.navigate('#prep');await h.emit('change',{dataset:{tInput:'',tPrep:'intro'},checked:false});
await h.emit('click',{dataset:{tCheck:'exam-definition'}});
assert.equal(h.local.get('kinouroki.justice.teacher.v1'),before,'Review mode does not write teacher progress');

const course=JSON.parse(h.local.get('kinouroki.justice.v1'));
assert.equal(course.notes['intro-definition'],'Старая запись','Existing course notes preserved');
assert.deepEqual(course.read,[0]);

// Mandarin keeps its engine without the teacher route.
const m=makeHarness(['course.js','learning.js'].map(f=>[f,new URL('dist/mandarin/'+f,base)]).concat([['core.js',new URL('dist/core.js',base)],['app.js',new URL('dist/app.js',base)]]),{},false,JSON.parse(read('dist/mandarin/sources.json')));
m.navigate('#map');assert(!m.get('app').innerHTML.includes('t-guide')&&!m.get('app').innerHTML.includes('МАРШРУТНАЯ КАРТА'));
console.log('PASS: teacher route — map, preparation with exam, teacher-as-student, notes from sources, printable workbook order, outcomes, review guard, legacy progress, Mandarin unaffected');
