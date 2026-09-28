import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),core=require('../dist/mandarin/core.js');
const dir=new URL('../dist/mandarin/',import.meta.url);
const old={format:'kinouroki.mandarin.preview',version:1,notes:{1:'Старые записи'},done:{1:true}};
assert.equal(core.importNotes(JSON.stringify(old)).notes[1],'Старые записи');
const state=core.normalize({fields:{recipient:'Младшая группа',strength:'0',unknown:'NO'},notes:{1:'<img src=x>'},done:{4:true}});
assert.deepEqual(core.importNotes(core.exportNotes(state)),state);
assert(!('unknown' in state.fields));
for(const raw of ['{}','not json',JSON.stringify({...old,format:'justice'}),JSON.stringify({...old,version:2}),JSON.stringify({...old,notes:[]})])assert.throws(()=>core.importNotes(raw));
assert.throws(()=>core.importNotes('x'.repeat(200001)));
const manifest=JSON.parse(fs.readFileSync(new URL('materials/manifest.json',dir)));
for(const [name,info] of Object.entries(manifest)){
 const bytes=fs.readFileSync(new URL('materials/'+name,dir));assert.equal(bytes.length,info.bytes,name);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),info.sha256,name);
}
assert.equal(manifest['guide.pdf'].sha256,'68e957f2a3c1f77315eed1cc6995db89f07bab8b3f0ec4791063f8d18740acdb');
const html=fs.readFileSync(new URL('index.html',dir),'utf8');
for(const match of html.matchAll(/(?:href|src|data-read-pdf)="(\.\/[^"#?]+)[^\"]*"/g))assert(fs.existsSync(new URL(match[1],dir)),match[1]);
assert.equal((html.match(/curriculum\.js/g)||[]).length,1);
assert(!html.includes('drive.google.com'));
console.log('PASS: Mandarin old/new progress import, rejection of invalid files, source hash, material hashes and links');
