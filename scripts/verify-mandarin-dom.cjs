(async()=>{
const {JSDOM}=require('jsdom');
const fs=require('fs'),assert=require('node:assert/strict');
const base=require('node:path').join(__dirname,'../dist/mandarin/');
const dom=new JSDOM(fs.readFileSync(base+'index.html','utf8'),{url:'https://example.org/mandarin/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
for(const f of ['core.js','lessons.js','canon.js','curriculum.js','review.js','app.js'])w.eval(fs.readFileSync(base+f,'utf8'));
assert.equal(d.querySelectorAll('[data-field]').length,w.MandarinCore.fieldKeys.length);
assert.equal(d.querySelectorAll('[data-check]').length,10);
for(const [id,q] of Object.entries(w.MandarinPractice)){
 d.querySelector(`[data-check="${id}"]`).click();assert.match(d.querySelector(`[data-feedback="${id}"]`).textContent,/Сначала/);
 q.keys.forEach((key,i)=>{const el=d.querySelector(`[data-field="${key}"]`);el.value=q.answer[i];el.dispatchEvent(new w.Event('change'));});
 d.querySelector(`[data-check="${id}"]`).click();assert.equal(d.querySelector(`[data-feedback="${id}"]`).textContent,q.success);
}
assert.match(d.querySelector('#practice-progress').textContent,/10 из 10/);
const note=d.querySelector('[data-note="1"]');note.value='<img src=x onerror=alert(1)>';note.dispatchEvent(new w.Event('input'));assert(!d.querySelector('#plan-notes img'));
w.localStorage.setItem('kinouroki.justice.v1','untouched');
for(const route of ['lesson1','lesson2','lesson3','lesson4','materials','plan','start']){w.location.hash=route;w.dispatchEvent(new w.Event('hashchange'));assert.equal(d.querySelectorAll('[data-screen]:not([hidden])').length,1);assert(!d.getElementById(route).hidden);}
d.querySelector('[data-read-pdf]').click();assert(!d.getElementById('document-reader').hidden);assert(d.getElementById('pdf-frame').getAttribute('src'));d.getElementById('close-reader').click();assert(!d.getElementById('pdf-frame').hasAttribute('src'));
assert.equal(w.localStorage.getItem('kinouroki.justice.v1'),'untouched');
const baseline=w.localStorage.getItem(w.MandarinCore.KEY);
for(let i=1;i<=4;i++)assert.equal(d.querySelector('#lesson'+i+' .review-panel').querySelectorAll('li').length,3);
w.location.hash='review';w.dispatchEvent(new w.Event('hashchange'));
assert(!d.getElementById('review').hidden);
assert.equal(d.querySelectorAll('[data-review-solution]:not([hidden])').length,10);
assert.equal(d.getElementById('mode-toggle').getAttribute('href'),'#start');
assert(d.querySelector('[data-field]').disabled);
const reviewLink=d.querySelector('#review a[href="#review/lesson1"]');assert(reviewLink);reviewLink.click();await new Promise(r=>setTimeout(r,20));w.dispatchEvent(new w.Event('hashchange'));
assert(!d.getElementById('lesson1').hidden);
assert(d.querySelector('[data-note]').disabled);
d.querySelector('[data-home]').click();w.dispatchEvent(new w.Event('hashchange'));assert(!d.getElementById('review').hidden);
assert.equal(w.localStorage.getItem(w.MandarinCore.KEY),baseline);
d.getElementById('mode-toggle').click();await new Promise(r=>setTimeout(r,20));w.dispatchEvent(new w.Event('hashchange'));
assert(!d.getElementById('start').hidden);assert(!d.querySelector('[data-field]').disabled);
const checked=d.querySelector('[data-self-check="1"]');checked.checked=true;checked.dispatchEvent(new w.Event('change'));
assert(JSON.parse(w.localStorage.getItem(w.MandarinCore.KEY)).reviews[1]);
note.value='Изменённый план';note.dispatchEvent(new w.Event('input'));assert(!checked.checked);
assert.equal(w.MandarinCore.route('review/lesson3'),'lesson3');
const reload=new JSDOM(fs.readFileSync(base+'index.html','utf8'),{url:'https://example.org/mandarin/#review/lesson2',runScripts:'outside-only'});
reload.window.scrollTo=()=>{};reload.window.HTMLElement.prototype.scrollIntoView=()=>{};
reload.window.localStorage.setItem(w.MandarinCore.KEY,baseline);
for(const f of ['core.js','lessons.js','canon.js','curriculum.js','review.js','app.js'])reload.window.eval(fs.readFileSync(base+f,'utf8'));
assert(!reload.window.document.getElementById('lesson2').hidden);assert(reload.window.document.querySelector('[data-note]').disabled);
assert.equal(reload.window.localStorage.getItem(w.MandarinCore.KEY),baseline);reload.window.close();
console.log('PASS DOM: review read-only, reload, ten solutions, three criteria per lesson, criteria invalidation;');
console.log('PASS DOM: four lessons, 48 fields, ten feedback flows, progress persistence, safe notes, routes, document reader, Great progress untouched');
w.close();

})().catch(e=>{console.error(e);process.exit(1)});
