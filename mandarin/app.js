'use strict';
(() => {
  const {KEY,normalize,route,exportNotes}=window.MandarinCore;
  const notes=[...document.querySelectorAll('[data-note]')];
  const checks=[...document.querySelectorAll('[data-done]')];
  const screens=[...document.querySelectorAll('[data-screen]')];
  const names=['Впечатление','Осмысление','Применение','Рефлексия'];
  const menu=document.querySelector('.course-nav');
  const filmPlayer=document.querySelector('[data-film-player]');
  let saved=normalize(null),storageOK=true,exportURL=null;
  try { saved=normalize(JSON.parse(localStorage.getItem(KEY))); } catch { storageOK=false; }
  menu.open=innerWidth>800;
  for(const el of notes)el.value=saved.notes[el.dataset.note];
  for(const el of checks)el.checked=saved.done[el.dataset.done];

  function getState(){
    return normalize({notes:Object.fromEntries(notes.map(el=>[el.dataset.note,el.value])),done:Object.fromEntries(checks.map(el=>[el.dataset.done,el.checked]))});
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
    document.getElementById('storage-warning').hidden=storageOK;
    return state;
  }
  function save(){
    const state=getState();
    try {localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}
    displayProgress();
  }
  for(const el of notes)el.addEventListener('input',save);
  for(const el of checks)el.addEventListener('change',save);

  function showRoute(focus=true){
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
  document.querySelector('[data-home]').addEventListener('click',event=>{event.preventDefault();if(location.hash==='#start')showRoute();else location.hash='start';});
  document.getElementById('download').addEventListener('click',()=>{
    if(exportURL)URL.revokeObjectURL(exportURL);
    exportURL=URL.createObjectURL(new Blob([exportNotes(getState())],{type:'application/json'}));
    const box=document.getElementById('export-links');box.textContent='Файл подготовлен. ';
    const a=document.createElement('a');a.href=exportURL;a.download='mandarin-course-notes.json';a.textContent='Если скачивание не началось, нажмите здесь';box.append(a);a.click();
  });
  document.getElementById('print').addEventListener('click',()=>window.print());
  displayProgress();showRoute(false);
})();
