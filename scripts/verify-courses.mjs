import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('dist/app.js'),great=read('dist/index.html'),mandarin=read('dist/mandarin/index.html'),learning=read('dist/mandarin/learning.js');
assert.match(app,/href="\.\/mandarin\/\?v=20260928-standard-r1"/,'Justice course links to the Mandarin course');
assert.match(learning,/href="\.\.\/\?v=20260928-standard-r1#start"/,'Mandarin course links back to the Justice course');
assert.match(mandarin,/href="\.\.\/styles\.css/,'Both courses must use the shared design');
assert.match(mandarin,/src="\.\.\/app\.js/,'Both courses must run on the shared engine');
assert.doesNotMatch(mandarin,/drive\.google\.com\/file\/d\//);
for(const html of [great,mandarin])for(const match of html.matchAll(/(?:href|src)="(\.\.?\/[^"#?]+)[^"]*"/g)){
  const dir=html===great?'dist/':'dist/mandarin/';
  assert(fs.existsSync(new URL('../'+dir+match[1],import.meta.url)),`Broken asset link: ${match[1]}`);
}
assert(!fs.existsSync(new URL('../dist/mandarin/app.js',import.meta.url)),'No second engine copy');
console.log('PASS: shared engine and style, cross-links between courses, asset links');

const greatLearning=read('dist/learning.js');
const mandarinLearning=read('dist/mandarin/learning.js');
for(const [label,source] of [['Justice',greatLearning],['Mandarin',mandarinLearning]]){
  assert.match(source,/name:'Социальная практика'/,label+' has standalone social practice stage');
  assert.match(source,/Точки роста/,label+' records growth points after practice');
  assert.match(source,/stagesHeading:'Восемь этапов'/,label+' declares eight-stage route');
}
assert.match(greatLearning,/name:'Просмотр фильма'/,'Justice has standalone film-viewing stage');
assert.match(greatLearning,/C\.stages\[3\]\.name='Осознание'/,'Justice uses unified Осознание stage name');
console.log('PASS: unified eight-stage route, social practice and growth points');

const expectedStages=['Введение','Просмотр фильма','Чувство','Мысль','Осознание','Воображение','Социальная практика','Воодушевление'];
function assertEightStageContract(label,courseSource,learningSource){
  const base=[...courseSource.matchAll(/\n\s+name:\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);
  let route=[...base];
  if(label==='Justice'){ route[3]='Осознание'; route.splice(1,0,'Просмотр фильма'); route.splice(6,0,'Социальная практика'); }
  else { route.splice(6,0,'Социальная практика'); }
  assert.deepEqual(route,expectedStages,label+' exact eight-stage order');
  assert.match(learningSource,/Рефлексия по поступку, а не по плану/,label+' practice precedes reflection');
  assert.match(learningSource,/Что реально сделали и для кого/,label+' requires evidence of completed action');
  assert.match(learningSource,/Точки роста/,label+' includes growth points');
  assert.match(learningSource,/не (?:ставит ребёнку психологический диагноз|психологический диагноз)/,label+' growth form is not psychological diagnosis');
}
assertEightStageContract('Justice',read('dist/course.js'),greatLearning);
assertEightStageContract('Mandarin',read('dist/mandarin/course.js'),mandarinLearning);
for(const legacy of ['app.js','canon.js','curriculum.js','lessons.js','review.js','styles.css'])
  assert(!fs.existsSync(new URL('../dist/mandarin/'+legacy,import.meta.url)),'No stale Mandarin file: '+legacy);
console.log('PASS: exact 8-stage order, practice gate semantics, growth-point safeguards, no stale Mandarin engine files');

await import('./verify-standard-ui.mjs');
