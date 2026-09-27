import fs from 'node:fs';
import assert from 'node:assert/strict';

const great=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const mandarin=fs.readFileSync(new URL('../dist/mandarin/index.html',import.meta.url),'utf8');
const root=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');

assert.match(great,/href="\.\/mandarin\/"/,'Great must link to Mandarin');
assert.match(mandarin,/href="\.\.\/#start"/,'Mandarin must link to Great');
assert.match(great,/kinouroki\.justice\.v1/,'Keep existing Great progress key');
assert.match(mandarin,/kinouroki\.mandarin\.preview\.v1/,'Use a separate Mandarin progress key');
assert.match(mandarin,/https:\/\/kinouroki\.org\/mandarin\//,'Film must have a public official viewing route');
assert.doesNotMatch(mandarin,/drive\.google\.com\/file\/d\//,'Do not expose working folder file URLs publicly');
assert.equal((mandarin.match(/<section id="lesson[1-4]"/g)||[]).length,4);
for(const anchor of mandarin.matchAll(/href="#([a-z][a-z0-9]*)"/g))
  assert(mandarin.includes(`id="${anchor[1]}"`),`Broken Mandarin section link: ${anchor[1]}`);
assert.match(root,/app\.js\?v=20260927-mandarin/,'Release must refresh cached navigation');
console.log('PASS: two course routes, separate progress, official source, navigation anchors');
