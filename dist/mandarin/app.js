'use strict';
(() => {
  const {KEY,normalize,route,exportNotes,importNotes,MAX_IMPORT_BYTES}=window.MandarinCore;
  const notes=[...document.querySelectorAll('[data-note]')];
  const checks=[...document.querySelectorAll('[data-done]')];
  const selfChecks=[...document.querySelectorAll('[data-self-check]')];
  const isReview=()=>location.hash==='#review'||location.hash.startsWith('#review/');
  const screens=[...document.querySelectorAll('[data-screen]')];
  const names=['Впечатление','Осмысление','Применение','Рефлексия'];
  const menu=document.querySelector('.course-nav');
  const filmPlayer=document.querySelector('[data-film-player]');
  const fields=[...document.querySelectorAll('[data-field]')];
  let saved=normalize(null),storageOK=true,exportURL=null;
  try { saved=normalize(JSON.parse(localStorage.getItem(KEY))); } catch { storageOK=false; }
  menu.open=innerWidth>800;
  for(const el of notes)el.value=saved.notes[el.dataset.note];
  for(const el of checks)el.checked=saved.done[el.dataset.done];
  for(const el of selfChecks)el.checked=saved.reviews[el.dataset.selfCheck];
  for(const el of fields)el.value=saved.fields[el.dataset.field]||'';

  function getState(){
    return normalize({reviews:Object.fromEntries(selfChecks.map(el=>[el.dataset.selfCheck,el.checked])),notes:Object.fromEntries(notes.map(el=>[el.dataset.note,el.value])),done:Object.fromEntries(checks.map(el=>[el.dataset.done,el.checked])),fields:Object.fromEntries(fields.map(el=>[el.dataset.field,el.value]))});
  }
  function displayProgress(){
    const state=getState(),count=Object.values(state.done).filter(Boolean).length;
    document.querySelectorAll('[data-completed-count]').forEach(el=>el.textContent=`${count} из 4`);
    const progress=document.querySelector('progress');progress.value=count;progress.textContent=`${count} из 4`;
    document.getElementById('summary').textContent=`Отмечено занятий: ${count} из 4. Записей: ${Object.values(state.notes).filter(x=>x.trim()).length} из 4.`;
    for(let i=1;i<=4;i++){
      for(const el of document.querySelectorAll(`[data-stage-number="${i}"],[data-route-number="${i}"]`)){
        el.classList.toggle('done',state.done[i]);el.textContent=state.done[i]?'✓':String(i).padStart(2,'0');
      }
    }
    const target=document.getElementById('plan-notes');target.replaceChildren();
    for(let i=1;i<=4;i++){
      const article=document.createElement('article');article.className='result-stage';
      const title=document.createElement('h2');title.textContent=`${i}. ${names[i-1]}`;
      const label=document.createElement('p');label.className='source-caption';label.textContent=document.querySelector(`label[for="note${i}"]`).textContent;
      const p=document.createElement('p');p.className='plan-answer';p.textContent=state.notes[i].trim()||'Запись пока не заполнена.';
      const a=document.createElement('a');a.href=`#lesson${i}`;a.className='text-link';a.textContent='Дополнить запись →';
      article.append(title,label,p,a);target.append(article);
    }
    const practical=document.createElement('section');practical.className='result-stage';
    const h=document.createElement('h2');h.textContent='Практика и план общего дела';practical.append(h);
    for(const el of fields){
      if(!state.fields[el.dataset.field])continue;
      const label=document.createElement('h3');label.textContent=document.querySelector(`label[for="${el.id}"]`).textContent;
      const p=document.createElement('p');p.className='plan-answer';p.textContent=el.tagName==='SELECT'?el.selectedOptions[0]?.textContent:state.fields[el.dataset.field];
      practical.append(label,p);
    }
    target.append(practical);
    const solved=Object.values(window.MandarinPractice).filter(q=>q.keys.every((key,i)=>state.fields[key]===q.answer[i])).length;
    document.getElementById('practice-progress').textContent=`Самопроверка: ${solved} из ${Object.keys(window.MandarinPractice).length} упражнений выполнено верно. Личные ответы не оцениваются.`;
    document.getElementById('storage-warning').hidden=storageOK;
    return state;
  }
  function save(){
    if(isReview())return;
    document.getElementById('export-links').replaceChildren();
    const state=getState();
    try {localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}
    displayProgress();
  }
  for(const el of notes)el.addEventListener('input',()=>{invalidateReview(el);save();});
  for(const el of selfChecks)el.addEventListener('change',save);
  for(const el of checks)el.addEventListener('change',save);
  for(const el of fields)el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>{
    invalidateReview(el);
    const exercise=el.closest('[data-exercise]');if(exercise)exercise.querySelector('[data-feedback]').textContent='';
    document.getElementById('export-links').replaceChildren();save();
  });
  for(const button of document.querySelectorAll('[data-check]'))button.addEventListener('click',()=>{
    if(isReview())return;
    const q=window.MandarinPractice[button.dataset.check],state=getState();
    const complete=q.keys.every(key=>state.fields[key]!=='');
    const okay=complete&&q.keys.every((key,i)=>state.fields[key]===q.answer[i]);
    document.querySelector(`[data-feedback="${button.dataset.check}"]`).textContent=!complete?'Сначала заполните все ответы этого упражнения.':okay?q.success:q.hint;
  });
  let pendingImport=null;
  const importStatus=document.getElementById('import-status'),applyImport=document.getElementById('apply-import');
  document.getElementById('import-file').addEventListener('change',async event=>{
    if(isReview())return;
    pendingImport=null;applyImport.hidden=true;
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>MAX_IMPORT_BYTES)throw new Error('Файл слишком большой. Выберите файл прогресса «Мандарина».');
      pendingImport=importNotes(await file.text());
      importStatus.textContent=`Файл прочитан. Записей: ${Object.values(pendingImport.notes).filter(Boolean).length}, ответов практики: ${Object.values(pendingImport.fields).filter(Boolean).length}. При загрузке они заменят текущие записи этого курса. Сначала можно сохранить текущие записи в файл.`;applyImport.hidden=false;
    }catch(error){importStatus.textContent=error.message;}
    event.target.value='';
  });
  applyImport.addEventListener('click',()=>{
    if(isReview()||!pendingImport)return;
    for(const el of notes)el.value=pendingImport.notes[el.dataset.note];
    for(const el of checks)el.checked=pendingImport.done[el.dataset.done];
    for(const el of selfChecks)el.checked=pendingImport.reviews[el.dataset.selfCheck];
    for(const el of fields)el.value=pendingImport.fields[el.dataset.field];
    document.querySelectorAll('[data-feedback]').forEach(el=>el.textContent='');
    document.getElementById('export-links').replaceChildren();save();
    pendingImport=null;applyImport.hidden=true;importStatus.textContent='Записи загружены. Проверьте свой план ниже.';
  });
  for(const button of document.querySelectorAll('[data-read-pdf]'))button.addEventListener('click',()=>{
    const reader=document.getElementById('document-reader');reader.hidden=false;
    document.getElementById('reader-title').textContent=button.dataset.title;
    document.getElementById('pdf-frame').src=button.dataset.readPdf;
    document.getElementById('reader-open').href=button.dataset.readPdf;
    reader.scrollIntoView({block:'start',behavior:'smooth'});
  });
  document.getElementById('close-reader').addEventListener('click',()=>{document.getElementById('document-reader').hidden=true;document.getElementById('pdf-frame').removeAttribute('src');});

  function invalidateReview(el){
    if(isReview())return;
    const id=el.closest('[data-screen]')?.dataset.screen.replace('lesson','');
    const check=selfChecks.find(x=>x.dataset.selfCheck===id);if(check)check.checked=false;
  }
  // Review mode is encoded in the URL, so refresh preserves it without changing progress.
  function showRoute(focus=true){
    const reviewing=isReview();
    document.getElementById('review-banner').hidden=!reviewing;
    const toggle=document.getElementById('mode-toggle');
    toggle.href=reviewing?'#start':'#review';toggle.textContent=reviewing?'Перейти к обучению':'Режим рецензирования';
    for(const el of [...notes,...checks,...fields,...selfChecks,document.getElementById('import-file'),applyImport])el.disabled=reviewing;
    document.querySelectorAll('[data-check]').forEach(el=>el.hidden=reviewing);
    document.querySelectorAll('[data-feedback]').forEach(el=>el.hidden=reviewing);
    document.querySelectorAll('[data-review-solution]').forEach(el=>el.hidden=!reviewing);
    document.querySelectorAll('a[href^="#"]').forEach(el=>{
      if(el.id==='mode-toggle'||el.hasAttribute('data-review-overview')||el.classList.contains('skip'))return;
      if(!el.dataset.learnHref)el.dataset.learnHref=el.getAttribute('href');
      const base=el.dataset.learnHref;
      el.href=reviewing?(base==='#start'?'#review':'#review/'+base.slice(1)):base;
    });
    const selected=route(location.hash.slice(1));
    screens.forEach(el=>el.hidden=el.dataset.screen!==selected);
    // Load VK only in the film view; leaving it stops playback in the hidden frame.
    if(selected==='film'){
      if(!filmPlayer.hasAttribute('src'))filmPlayer.src=filmPlayer.dataset.src;
    }else filmPlayer.removeAttribute('src');
    document.querySelectorAll('[data-route]').forEach(el=>{
      const active=el.dataset.route===selected;el.classList.toggle('active',active);
      if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
    });
    document.querySelector('.context-nav').hidden=selected==='start';
    if(innerWidth<=800)menu.open=false;
    if(focus){document.getElementById('main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
  }
  window.addEventListener('hashchange',()=>showRoute());
  document.querySelector('[data-open-nav]').addEventListener('click',()=>{menu.open=true;menu.scrollIntoView({block:'start'});menu.querySelector('summary').focus({preventScroll:true});});
  document.querySelector('[data-top]').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  document.querySelector('[data-home]').addEventListener('click',event=>{event.preventDefault();const home=isReview()?'review':'start';if(location.hash==='#'+home)showRoute();else location.hash=home;});
  document.getElementById('download').addEventListener('click',()=>{
    if(exportURL)URL.revokeObjectURL(exportURL);
    exportURL=URL.createObjectURL(new Blob([exportNotes(getState())],{type:'application/json'}));
    const box=document.getElementById('export-links');box.textContent='Файл подготовлен. ';
    const a=document.createElement('a');a.href=exportURL;a.download='mandarin-course-notes.json';a.textContent='Если скачивание не началось, нажмите здесь';box.append(a);a.click();
  });
  document.getElementById('print').addEventListener('click',()=>window.print());
  displayProgress();showRoute(false);
})();
