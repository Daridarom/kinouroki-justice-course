import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('dist/app.js'),great=read('dist/index.html'),mandarin=read('dist/mandarin/index.html'),learning=read('dist/mandarin/learning.js');
assert.match(app,/href="\.\/mandarin\/\?v=20260928-canon"/,'Justice course links to the Mandarin course');
assert.match(learning,/href="\.\.\/\?v=20260928-canon#start"/,'Mandarin course links back to the Justice course');
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
