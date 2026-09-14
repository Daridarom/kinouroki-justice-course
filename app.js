'use strict';
(() => {
  const C=window.COURSE, {escape:e,grade,normalize,blank,planReady,canComplete}=window.CourseCore;
  const KEY='kinouroki.justice.v1', app=document.getElementById('app');
  let state, storageOK=true, sources=null, sourceFailure=false, glossaryQuery='', emptyAnswer=null;
  try { state=normalize(JSON.parse(localStorage.getItem(KEY)),C); } catch {state=blank();storageOK=false;}
  if(location.hash==='#learn')state.mode='learn';if(location.hash==='#review')state.mode='review';
  let route=parseRoute();
  let exportURL=null, reviewReturn='review', focusTarget=null, renderedKey=null;
  const pagePositions=new Map();
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  const routeKey=()=>state.mode+':'+(route.view==='stage'?'stage/'+route.stage+'/'+route.tab:route.view==='film'?'film/'+(route.scene||''):route.view);
  function parseRoute(){
    const hash=location.hash.slice(1)||state.lastRoute||'start',parts=hash.split('/');
    if(parts[0]==='learn')return {view:'start'};
    if(['start','review','notebook','materials','glossary','result'].includes(parts[0]))return {view:parts[0]};
    if(parts[0]==='film')return {view:'film',scene:C.scenes.find(x=>x.id===parts[1])?.id||null};
    const n=Number(parts[1]);
    if(parts[0]==='stage'&&Number.isInteger(n)&&n>=0&&n<6)return {view:'stage',stage:n,tab:['read','practice','plan'].includes(parts[2])?parts[2]:'read'};
    return {view:isReview()?'review':'start'};
  }
  function isReview(){return state.mode==='review';}
  function nextRoute(){
    if(!state.preparation.film||!state.preparation.sources)return '#start';
    const i=C.stages.findIndex((_,n)=>!state.completed.includes(n));
    if(i<0)return '#notebook';
    return stageURL(i,!state.read.includes(i)?'read':!stagePassed(i)||!state.caseReviewed[i]?'practice':'plan');
  }
  function announce(message){document.getElementById('announcer').textContent=message;}
  function save(){
    state.updated=new Date().toISOString();
    try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}
    document.querySelectorAll('[data-save-status]').forEach(el=>{el.textContent=storageOK?'Сохранено в этом браузере':'Сохранить в браузере не удалось. Скачайте тетрадь.';});
    const warning=document.getElementById('storage-warning');if(warning)warning.hidden=storageOK;
  }
  function go(hash){ if(location.hash==='#'+hash){route=parseRoute();render(true);}else location.hash=hash; }
  window.addEventListener('hashchange',()=>{
    const wasFilm=route.view==='film', previousMode=renderedKey?.split(':')[0]||state.mode;
    if(renderedKey)pagePositions.set(renderedKey,window.scrollY);
    if(route.view==='stage'){
      const origin='stage/'+route.stage+'/'+route.tab;
      if(previousMode==='review')reviewReturn=origin;else state.lessonReturn=origin;
    }else if(route.view==='start'&&previousMode==='learn')state.lessonReturn='start';
    if(location.hash==='#learn')state.mode='learn';
    if(location.hash==='#review'){state.mode='review';reviewReturn='review';}
    route=parseRoute();
    if(!isReview()){state.lastRoute=location.hash.slice(1)||'start';save();}
    else if(previousMode!==state.mode)save();
    for(const id of ['source-dialog','reset-dialog']){const dialog=document.getElementById(id);if(dialog.open)dialog.close();}
    if(wasFilm&&route.view==='film'&&previousMode===state.mode){updateFilmScene();renderedKey=routeKey();return;}
    render(true);
  });
  const stageURL=(i,tab='read')=>'#stage/'+i+'/'+tab;
  const tick='<span aria-hidden="true">✓</span>';
  const icon=(kind)=>({book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v15M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Z"/></svg>',file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 3H5v18h14V8ZM14 3v5h5M8 12h8M8 16h8"/></svg>',terms:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m3 20 6-16 6 16M5 15h8M17 7h4M19 7v13"/></svg>'}[kind]);
  function shell(){
    const count=state.completed.length;
    return `<aside class="sidebar"><a class="brand" href="#start"><span class="brand-mark" aria-hidden="true">▶</span><span>Киноуроки<small>Обучение педагогов</small></span></a>
      <details class="course-nav" ${innerWidth>800?'open':''}><summary><span>Маршрут обучения</span><span>${count} / 6 <b aria-hidden="true">⌄</b></span></summary><div class="nav-inner">
      <div class="course-label">УЧЕБНЫЙ МОДУЛЬ</div><div class="sidebar-title">Справедливость</div><div class="sidebar-film">На материале фильма «Великий»</div>
      <div class="progress-label"><span>Пройдено этапов</span><b data-completed-count>${count} из 6</b></div><progress max="6" value="${count}" aria-label="Пройдено этапов">${count} из 6</progress>
      <a class="preparation-nav ${route.view==='start'?'active':''}" href="#start">${state.preparation.film&&state.preparation.sources?'✓':'○'} Подготовка и маршрут</a><nav aria-label="Этапы обучения" class="stages">${C.stages.map((s,i)=>`<a href="${stageURL(i)}" class="stage-link ${route.view==='stage'&&route.stage===i?'active':''}" ${route.view==='stage'&&route.stage===i?'aria-current="step"':''}><span class="stage-number ${state.completed.includes(i)?'done':''}">${state.completed.includes(i)?tick:String(i+1).padStart(2,'0')}</span><span>${e(s.name)}<small>${state.completed.includes(i)?'Этап пройден':i===0?'Начало маршрута':'Учебный раздел'}</small></span></a>`).join('')}</nav>
      <nav class="extra-nav" aria-label="Учебные инструменты">${[['film','file','Фильм и семь сцен'],['notebook','book','Моя рабочая тетрадь'],['materials','file','Материалы курса'],['glossary','terms','Авторские термины']].map(([view,ic,label])=>`<a href="#${view}" class="${route.view===view?'active':''}" ${route.view===view?'aria-current="page"':''}>${icon(ic)}${label}</a>`).join('')}</nav>
      <div class="local-note">Прогресс и записи хранятся в этом браузере.</div></div></details><div class="sidebar-bottom">Учебный прототип · один модуль</div></aside>
      <div class="workspace"><header class="topbar"><span>Мастерская педагога <span class="divider">/</span> <strong>Справедливость</strong></span><button class="mode-switch" data-mode="${isReview()?'learn':'review'}">${isReview()?'Перейти к обучению':'Режим рецензирования'}</button></header>
      <div id="storage-warning" role="status" class="storage-warning" ${storageOK?'hidden':''}>Браузер не сохраняет записи. Перед закрытием скачайте рабочую тетрадь.</div>
      <main id="main" tabindex="-1">${pageNavigation()}${isReview()?'<div class="review-banner"><strong>Режим рецензирования</strong><span>Все материалы и разборы доступны. Учебные ответы и прогресс не меняются.</span><a href="#review">Обзор этапов</a></div>':''}${route.view==='start'?renderStart():route.view==='film'?renderFilm():route.view==='review'?renderReview():route.view==='result'?renderResult():route.view==='stage'?renderStage():route.view==='notebook'?renderNotebook():route.view==='materials'?renderMaterials():renderGlossary()}</main>
      <footer class="page-footer"><span>Курс для педагогов · «Великий»</span><span>Авторская методика · фильм · практика педагога</span></footer><nav class="mobile-tools" aria-label="Быстрая навигация"><button data-open-nav>Разделы</button><a href="${isReview()?'#review':'#start'}">Маршрут</a><button data-top>Наверх ↑</button></nav></div>`;
  }
  function render(focus=false){
    const key=routeKey(), samePage=renderedKey===key, y=window.scrollY;
    const expanded=samePage?Array.from(app.querySelectorAll('details'),el=>el.open):null;
    app.innerHTML=shell();
    if(expanded)app.querySelectorAll('details').forEach((el,i)=>{if(i<expanded.length)el.open=expanded[i];});
    if(isReview())app.querySelectorAll('[data-note],[data-answer],[data-read],[data-review],[data-preparation],[data-move],[data-complete],[data-reset]').forEach(el=>{el.disabled=true;});
    renderedKey=key;
    if(focus){document.getElementById('main').focus({preventScroll:true});window.scrollTo({top:pagePositions.get(key)||0,behavior:'instant'});}
    else if(samePage)window.scrollTo(0,y);
    if(focusTarget){const target=document.getElementById(focusTarget);target?.focus({preventScroll:true});target?.scrollIntoView({block:'start'});focusTarget=null;}
  }
  function returnLink(){
    const target=isReview()?reviewReturn:state.lessonReturn;
    const parts=(target||'start').split('/'), stage=C.stages[Number(parts[1])];
    const label=parts[0]==='stage'&&stage?stage.name+' · '+({read:'Изучить',practice:'Практикум',plan:'Мой план'}[parts[2]]):isReview()?'Обзор рецензирования':'Подготовка и маршрут';
    return `<a class="context-return" href="#${e(target||'start')}">← ${e(label)}</a>`;
  }
  function pageNavigation(){
    if(['film','materials','glossary','notebook','result'].includes(route.view))return `<nav class="context-nav" aria-label="Возврат к занятию">${returnLink()}</nav>`;
    if(route.view==='stage')return `<nav class="context-nav" aria-label="Возврат к маршруту"><a href="${isReview()?'#review':'#start'}">← ${isReview()?'Обзор рецензирования':'Все этапы курса'}</a></nav>`;
    return '';
  }
  function stagePager(){
    const i=route.stage,tab=route.tab;
    const prev=tab==='plan'?stageURL(i,'practice'):tab==='practice'?stageURL(i):i?stageURL(i-1,'plan'):isReview()?'#review':'#start';
    const label=tab==='plan'?'Назад к практикуму':tab==='practice'?'Назад к изучению':i?'Предыдущий этап: '+C.stages[i-1].name:isReview()?'К обзору':'К подготовке';
    return `<nav class="step-navigation" aria-label="Переходы по курсу"><a class="button ghost" href="${prev}">← ${e(label)}</a><a class="text-link" href="${isReview()?'#review':'#start'}">${isReview()?'Обзор рецензирования':'Все этапы'}</a></nav>`;
  }
  function renderStage(){
    const i=route.stage,s=C.stages[i];
    return `<div class="section-kicker">МЕТОДИКА КИНОУРОКА <span>ЭТАП ${String(i+1).padStart(2,'0')} / 06</span></div>
      <div class="title-row"><div><h1>${e(s.name)}</h1><p class="subtitle">${e(s.subtitle)}</p></div><div class="stage-stamp ${state.completed.includes(i)?'complete':''}">${state.completed.includes(i)?'✓ Пройден':'Этап '+(i+1)}</div></div>
      <nav class="tabs" aria-label="Разделы этапа">${[['read','Изучить'],['practice','Практикум'],['plan','Мой план']].map(([tab,label])=>`<a href="${stageURL(i,tab)}" ${route.tab===tab?'aria-current="page"':''}>${label}${tab==='read'&&state.read.includes(i)?'<span class="tab-check" aria-hidden="true">✓</span>':''}${tab==='practice'&&stagePassed(i)?'<span class="tab-check" aria-hidden="true">✓</span>':''}</a>`).join('')}</nav>
      ${!isReview()&&(!state.preparation.film||!state.preparation.sources)?'<div class="preparation-reminder">Перед завершением этапа посмотрите полный фильм и ознакомьтесь с комплектом. <a href="#start">К подготовке</a></div>':''}${route.tab==='read'?readStage(s,i):route.tab==='practice'?practiceStage(s,i):planStage(s,i)}${stagePager()}`;
  }
  function sourceButton(label,doc='workbook',pages=null,section=null){return `<button type="button" class="source-link" data-source="${e(doc)}" ${section?'data-section="'+e(section)+'"':''} ${pages?'data-pages="'+pages.join(',')+'"':''}>${icon('file')}<span>${e(label)}</span><span aria-hidden="true">↗</span></button>`;}
  function materialAside(s){return `<aside class="reading-aside"><div class="aside-label">К ЭТОМУ ЭТАПУ</div><h3>Откройте первоисточник</h3><p>Сопоставьте пояснения с авторским комплектом.</p>${s.refs.map(r=>sourceButton(r.label,'workbook',r.pages)).join('')}${sourceButton('Паспорт · этот этап','passport',null,'5.'+(C.stages.indexOf(s)+1)+'.')}${sourceButton('Обоснование · задача этапа','rationale',null,'2.2.'+(C.stages.indexOf(s)+2)+'.')}<div class="duration"><b>${s.minutes} минут</b><span>Ориентир этапа в паспорте киноурока. Время обучения педагога индивидуально.</span></div></aside>`;}
  function readStage(s,i){return `${i===0?`<section class="course-orientation"><strong>${e(C.audience)}</strong><p>Изучите материалы → выполните практикум → подготовьте план и проверьте его по критериям. После этого отметьте этап пройденным.</p><a href="#film">Открыть полный фильм «Великий»</a></section>`:''}<div class="reading-grid"><article class="lesson"><section class="author-goal"><div class="eyebrow">ЦЕЛЬ ЭТАПА · АВТОРСКИЙ ПАСПОРТ</div><p>${e(s.goal)}</p></section>
    ${i===0?`<div class="definition"><h2>Что означает качество</h2><p>${e(C.definition)}</p><span class="source-caption">Определение из паспорта пособия</span></div>`:''}
    ${originalExcerpt(s,i)}${i===2?`<blockquote><div class="eyebrow">ТРИ ПРИНЦИПА ЭТАЛОННЫХ ВЕСОВ · ПАСПОРТ</div><ol>${C.principles.map(t=>'<li>'+e(t)+'</li>').join('')}</ol></blockquote>`:''}<h2>${e(s.focus)}</h2>${s.paragraphs.map(p=>'<p>'+e(p)+'</p>').join('')}
    <blockquote><div class="eyebrow">${e(s.quoteTerm)}</div><p>${e(s.quote)}</p><cite>${e(s.quoteRef)}</cite></blockquote>
    <div class="takeaway"><span aria-hidden="true">↳</span><div><h3>Результат подготовки</h3><p>${e(s.takeaway)}</p></div></div>
    <p class="editorial-note">Пояснения и практикумы — учебная адаптация для педагога. Цель этапа, определения и текст первоисточников сохранены по авторскому комплекту.</p>
    <label class="read-check"><input type="checkbox" data-read="${i}" ${state.read.includes(i)?'checked':''}><span>Я изучил(а) пояснения и сверился(ась) с исходными материалами</span></label><div class="actions"><a class="button primary" href="${stageURL(i,'practice')}">Перейти к практикуму <span aria-hidden="true">→</span></a></div></article>${materialAside(s)}</div>`;}
  function stagePassed(i){return C.stages[i].quizzes.every(q=>state.checked[q.id]&&grade(q,state.answers[q.id]));}
  function quizValue(q){return state.answers[q.id]??(q.type==='order'?q.initial:q.type==='match'?q.labels.map(()=>-1):undefined);}
  function renderQuiz(q,num){
    const value=isReview()?q.answer:quizValue(q),checked=isReview()||state.checked[q.id],passed=checked&&grade(q,value);
    let controls='';
    if(q.type==='single')controls=`<fieldset><legend class="sr-only">${e(q.title)}</legend>${q.options.map((o,j)=>`<label class="choice ${value===j?'selected':''}"><input type="radio" name="${q.id}" data-answer="${q.id}" value="${j}" ${value===j?'checked':''}><span>${e(o)}</span></label>`).join('')}</fieldset>`;
    if(q.type==='order')controls=`<ol class="order-list">${value.map((v,j)=>`<li><span class="order-index">${j+1}</span><strong>${e(q.items[v])}</strong><span class="order-controls"><button class="icon-button" data-move="${q.id}" data-from="${j}" data-delta="-1" ${j===0?'disabled':''} aria-label="Поднять ${e(q.items[v])}">↑</button><button class="icon-button" data-move="${q.id}" data-from="${j}" data-delta="1" ${j===value.length-1?'disabled':''} aria-label="Опустить ${e(q.items[v])}">↓</button></span></li>`).join('')}</ol>`;
    if(q.type==='match')controls=`<div class="matching"><div class="match-key">${q.items.map((item,j)=>`<p><b>${String.fromCharCode(1040+j)}</b><span>${e(item)}</span></p>`).join('')}</div><div class="match-selects">${q.labels.map((label,j)=>`<label><span>${e(label)}</span><select data-answer="${q.id}" data-index="${j}" aria-label="${e(label)}"><option value="-1">Выберите фрагмент</option>${q.items.map((_,k)=>`<option value="${k}" ${value[j]===k?'selected':''}>Фрагмент ${String.fromCharCode(1040+k)}</option>`).join('')}</select></label>`).join('')}</div></div>`;
    return `<section class="quiz" id="quiz-${q.id}" tabindex="-1"><div class="quiz-top"><span class="eyebrow">ЗАДАНИЕ ${String(num+1).padStart(2,'0')}</span>${passed?'<span class="success-label">'+(isReview()?'Разбор':'✓ Выполнено')+'</span>':''}</div><h2>${e(q.title)}</h2><p>${e(q.prompt)}</p><div class="quiz-source">${sourceButton('Открыть материал к заданию',q.sourceDoc||'workbook',q.sourceSection?null:q.sourcePages,q.sourceSection)}</div>${controls}${emptyAnswer===q.id?'<p class="answer-required" role="status">Сначала выберите ответ во всех полях задания.</p>':''}<div class="quiz-actions">${isReview()?'<span class="review-key">Показан ответ и методический разбор</span>':`<button class="button ${passed?'ghost':'primary'}" data-check="${q.id}">${checked?'Проверить ещё раз':'Проверить ответ'}</button>`}<span class="source-caption">${e(q.ref)}</span></div>
    ${checked?`<div class="feedback ${passed?'positive':'retry'}" role="status"><strong>${passed?'Верно. Сверим смысл':'Пока не совпало. Разберёмся'}</strong><p>${e(q.explanation)}</p>${!passed?'<span>Можно изменить ответ и повторить проверку.</span>':''}</div>`:''}</section>`;
  }
  function practiceStage(s,i){
    const ready=stagePassed(i)&&state.read.includes(i)&&state.caseReviewed[i];
    return `<div class="practice-intro"><p>Проверьте, как вы понимаете действия педагога. После ответа откроется разбор по исходному материалу.</p><span class="small-note">Попытки не ограничены</span></div><div class="practice-layout"><div>${s.quizzes.map(renderQuiz).join('')}${renderCase(s,i)}<section class="stage-finish"><h2>${ready?'Практикум выполнен':'Что нужно для завершения'}</h2><p>Далее подготовьте свой план и проверьте его по критериям. Проверка тестов и самопроверка плана — отдельные части обучения.</p><ul class="completion-list"><li>${state.read.includes(i)?'✓':'○'} Ознакомление с материалами${!state.read.includes(i)?` · <a href="${stageURL(i,'read')}">к разделу «Изучить»</a>`:''}</li><li>${stagePassed(i)&&state.caseReviewed[i]?'✓':'○'} Задания и разбор педагогического кейса</li><li>${planReady(C,state,i)&&state.reviews[i]?'✓':'○'} План подготовлен и проверен вами</li></ul><div class="actions"><a class="button primary" href="${stageURL(i,'plan')}">Подготовить и проверить мой план →</a></div></section></div>${materialAside(s)}</div>`;
  }
  function noteField(f,group='notes'){return `${f.group?'<h3 class="field-group">'+e(f.group)+'</h3>':''}<div class="note-field"><label for="${group}-${f.id}">${e(f.label)}</label><p id="hint-${group}-${f.id}">${e(f.hint)}</p><textarea id="${group}-${f.id}" data-note="${f.id}" data-group="${group}" maxlength="5000" rows="4" aria-describedby="hint-${group}-${f.id}" placeholder="Ваша запись…">${e(state[group][f.id]||'')}</textarea></div>`;}
  function projectForm(){return `<section class="project-form"><div class="eyebrow">ПО ФОРМЕ РАБОЧЕЙ ТЕТРАДИ · СТРАНИЦА 60</div><h2>Паспорт проекта справедливости</h2><p>Учебная заготовка педагога. При проведении киноурока паспорт заполняется по делу, выбранному классом.</p>${C.projectFields.map(f=>noteField(f,'project')).join('')}</section>`;}
  function reviewPanel(s,i){return `<section class="review-panel"><h2>Самопроверка плана</h2><p>Проверьте содержание своих записей. Заполненное поле подтверждает наличие заготовки; её методическую точность оцениваете вы по первоисточнику.</p><ul>${s.reviewCriteria.map(t=>'<li>'+e(t)+'</li>').join('')}</ul><label class="read-check"><input type="checkbox" data-review="${i}" ${state.reviews[i]?'checked':''}><span>Я проверил(а) свой план по этим критериям</span></label><p class="plan-status" data-plan-status="${i}">${planStatus(i)}</p><button class="button primary" data-complete="${i}" ${!isReview()&&canComplete(C,state,i)?'':'disabled'}>${state.completed.includes(i)?'Этап пройден — продолжить':'Завершить этап'}</button></section>`;}
  function planStatus(i){if(isReview())return 'Предпросмотр критериев завершения. Ответы слушателя не изменяются.';if(!state.preparation.film||!state.preparation.sources)return 'Сначала отметьте подготовку: полный фильм и авторские материалы.';if(!state.caseReviewed[i])return 'В практикуме запишите решение педагогического кейса и откройте разбор.';if(!planReady(C,state,i))return 'Для завершения заполните все поля плана'+(i===4?' и паспорта проекта.':'.');if(!state.read.includes(i)||!stagePassed(i))return 'План заполнен. Осталось изучить материалы и выполнить практикум.';return state.reviews[i]?'Можно завершить этап. Это ваша самопроверка; экспертное заключение не выдаётся.':'Осталось отметить самопроверку по критериям.';}
  function planStage(s,i){return `<div class="plan-layout"><article><div class="plan-intro"><h2>Подготовьте свой киноурок</h2><p>Запишите, как проведёте этот этап. Свободные ответы проверяются вами по критериям ниже и по первоисточникам.</p><span class="save-status" data-save-status>${storageOK?'Записи сохраняются в этом браузере':'Сохранение недоступно — скачайте тетрадь'}</span></div>${s.fields.filter(f=>!f.case).map(f=>noteField(f)).join('')}<div class="case-summary"><h2>Решение педагогического кейса</h2><p>${e(state.notes[s.case.id]||'Решение пока не записано.')}</p><a href="${stageURL(i,'practice')}" data-case-link="${i}">Вернуться к кейсу в практикуме →</a></div>${i===4?projectForm():''}${reviewPanel(s,i)}<div class="actions wrap"><a class="button ghost" href="${i<5?stageURL(i+1):'#notebook'}">${i<5?'Открыть следующий этап':'Открыть мою рабочую тетрадь'} →</a><a class="text-link" href="#notebook">Все мои записи</a></div></article>${materialAside(s)}</div>`;}
  function pageHeader(kicker,title,subtitle){return `<div class="section-kicker">${e(kicker)}</div><h1>${e(title)}</h1><p class="subtitle page-subtitle">${e(subtitle)}</p>`;}
  function renderNotebook(){
    const filled=Object.values(state.notes).filter(v=>v.trim()).length+Object.values(state.project).filter(v=>v.trim()).length;
    return `${pageHeader('ЛИЧНАЯ ПОДГОТОВКА','Моя рабочая тетрадь','Все записи к киноуроку — в одном месте. Их можно дополнять и скачать отдельным файлом.')}<div class="notebook-bar"><div><b>${state.completed.length} из 6</b><span>этапов пройдено</span></div><div><b data-filled-count>${filled}</b><span>полей заполнено</span></div><a class="button primary" href="#result">Открыть итоговую тетрадь →</a></div>
      <p class="local-explainer">Это ваши записи для подготовки. Они доступны в текущем браузере. Скачанный файл позволяет сохранить их отдельно; автоматической проверки методистом здесь нет.</p>
      ${state.completed.length===6?'<div class="course-finished"><strong>Учебный маршрут из шести этапов завершён</strong><p>Вы выполнили практикумы, подготовили записи и отметили самопроверку. Сохраните тетрадь. Практическое проведение киноурока и социального дела остаётся следующим шагом.</p></div>':''}
      <div class="notebook-sections">${C.stages.map((s,i)=>`<details ${i===0?'open':''}><summary><span><b class="chapter-small">${String(i+1).padStart(2,'0')}</b>${e(s.name)}</span><span class="notebook-status">${state.completed.includes(i)?'✓ Пройден':'Записи к этапу'}</span></summary><div class="notebook-body"><p>${e(s.takeaway)}</p>${s.fields.map(f=>noteField(f)).join('')}${i===4?projectForm():''}${reviewPanel(s,i)}<a href="${stageURL(i)}" class="text-link">Вернуться к учебному разделу →</a></div></details>`).join('')}</div><div class="notebook-footer"><span data-save-status>${storageOK?'Сохранено в этом браузере':'Сохранение недоступно'}</span><button class="text-button" data-reset>Начать заново</button></div>`;
  }
  function renderMaterials(){return `${pageHeader('АВТОРСКИЙ КОМПЛЕКТ','Материалы курса','Основной комплект новой методики и дополнительные материалы к фильму.')}<div class="material-list">${[['passport','01','Паспорт методического пособия','Цели, этапы, структура, определения и условия проведения.'],['rationale','02','Методическое обоснование','Логика построения этапов и пояснение методических решений.'],['workbook','03','Сводная рабочая тетрадь','Авторские задания, формы и последовательность работы на киноуроке.']].map(([id,n,title,desc])=>`<article class="material-row"><div class="document-number">${n}</div><div><h2>${title}</h2><p>${desc}</p><div class="actions wrap"><button class="button ghost" data-source="${id}">Читать внутри курса</button><a class="text-link" href="./materials/${id}.docx" download>Скачать DOCX ↓</a></div></div></article>`).join('')}</div>
    <section class="film-panel"><div><span class="eyebrow">ПОЛНЫЙ ФИЛЬМ · 23:40</span><h2>«Великий»</h2><p>Смотрите целиком, затем возвращайтесь к семи эпизодам в практикумах.</p></div><a class="button primary" href="#film">Фильм и сцены →</a></section>
    <h2>Дополнительные материалы</h2><div class="supplement-grid"><article><h3>Оригинальный рассказ</h3><p>Литературная версия, 7 страниц. Отдельные детали и финал отличаются от фильма.</p><a class="button ghost" href="./materials/story.pdf" target="_blank" rel="noopener">Открыть PDF</a></article><article><h3>Рекомендации 2023 года</h3><p>17 страниц. Дополнительный материал для 5–9 классов; основной маршрут курса строится по новому паспорту.</p><a class="button ghost" href="./materials/recommendations-2023.pdf" target="_blank" rel="noopener">Открыть PDF</a></article></div>
    <section class="about-module"><h2>Как устроен электронный модуль</h2><p>Раздел «Изучить» соединяет авторские цели и термины с пояснениями для подготовки педагога. «Практикум» помогает проверить понимание. «Мой план» собирает ваши решения для проведения киноурока.</p><p>Исходные DOCX доступны без редактирования. Во встроенном читателе текст и таблицы представлены в экранном формате; исходное оформление сохранено в файлах. Это первый модуль по одному качеству. Другие качества требуют своих авторских комплектов.</p><a class="text-link" href="https://lk.kinouroki.org/films/18" target="_blank" rel="noopener noreferrer">Карточка киноурока в личном кабинете ↗</a></section>`;}
  function glossaryRows(){
    if(!sources)return `<div class="empty-state"><p>${sourceFailure?'Не удалось загрузить словарь. Попробуйте снова или откройте исходный паспорт.':'Загружаем авторский словарь…'}</p>${sourceFailure?'<button class="button ghost" data-retry-sources>Повторить загрузку</button>':''}</div>`;
    const list=sources.glossary.filter(([t,d])=>(t+' '+d).toLocaleLowerCase('ru').includes(glossaryQuery.toLocaleLowerCase('ru')));
    return list.length?`<dl class="glossary">${list.map(([term,def])=>`<div><dt>${e(term)}</dt><dd>${e(def)}${term==='7 уровней'?'<small class="source-caption">В исходном названии указано «7», а в определении перечислены восемь позиций. Текст сохранён по паспорту.</small>':''}</dd></div>`).join('')}</dl>`:'<div class="empty-state">Термин не найден. Попробуйте другое слово.</div>';
  }
  function renderGlossary(){return `${pageHeader('СМЫСЛЫ И ОПРЕДЕЛЕНИЯ','Авторские термины','Словарь из паспорта методического пособия. Формулировки воспроизведены по исходному документу.')}<div class="search-field"><label for="glossary-search">Найти термин</label><input id="glossary-search" type="search" placeholder="Например, калибровка или буфер" value="${e(glossaryQuery)}" autocomplete="off"></div><div id="glossary-results" aria-live="polite">${glossaryRows()}</div><div class="actions">${sourceButton('Открыть паспорт полностью','passport')}</div>`;}
  function invalidate(q){emptyAnswer=null;delete state.checked[q.id];const i=C.stages.findIndex(s=>s.quizzes.some(x=>x.id===q.id));state.completed=state.completed.filter(x=>x!==i);}
  const getQuiz=id=>C.stages.flatMap(s=>s.quizzes).find(q=>q.id===id);
  app.addEventListener('change',event=>{
    const el=event.target;
    if(isReview())return;
    if(el.matches('[data-preparation]')){state.preparation[el.dataset.preparation]=el.checked;if(!el.checked)state.completed=[];save();if(route.view==='film'){refreshPlanControls();}else render();return;}
    if(el.matches('[data-review]')){const i=Number(el.dataset.review);state.reviews[i]=el.checked;if(!el.checked)state.completed=state.completed.filter(n=>n!==i);save();render();app.querySelector('[data-review=\"'+i+'\"]')?.focus({preventScroll:true});}
    if(el.matches('[data-read]')){const n=Number(el.dataset.read);state.read=state.read.filter(x=>x!==n);if(el.checked)state.read.push(n);else state.completed=state.completed.filter(x=>x!==n);save();render();const checkbox=app.querySelector('[data-read]');checkbox?.focus({preventScroll:true});}
    if(el.matches('[data-answer]')){const q=getQuiz(el.dataset.answer);if(!q)return;const n=Number(el.value);if(q.type==='single')state.answers[q.id]=n;else{const a=[...quizValue(q)];a[Number(el.dataset.index)]=n;state.answers[q.id]=a;}invalidate(q);save();const selector=el.tagName==='SELECT'?`select[data-answer="${q.id}"][data-index="${el.dataset.index}"]`:`input[data-answer="${q.id}"][value="${el.value}"]`;const scroll=window.scrollY;render();app.querySelector(selector)?.focus({preventScroll:true});window.scrollTo(0,scroll);}
  });
  function refreshPlanControls(){
    app.querySelectorAll('[data-review]').forEach(el=>{el.checked=Boolean(state.reviews[Number(el.dataset.review)]);});
    app.querySelectorAll('[data-complete]').forEach(el=>{el.disabled=!canComplete(C,state,Number(el.dataset.complete));});
    app.querySelectorAll('[data-plan-status]').forEach(el=>{el.textContent=planStatus(Number(el.dataset.planStatus));});
    app.querySelectorAll('[data-case-review]').forEach(el=>{el.disabled=isReview()||!state.notes[C.stages[Number(el.dataset.caseReview)].case.id]?.trim();});
    app.querySelectorAll('[data-completed-count]').forEach(el=>{el.textContent=state.completed.length+' из 6';});
    app.querySelectorAll('progress').forEach(el=>{el.value=state.completed.length;});
    app.querySelectorAll('.stage-link').forEach((el,i)=>{const num=el.querySelector('.stage-number'),small=el.querySelector('small');if(num){num.classList.toggle('done',state.completed.includes(i));num.textContent=state.completed.includes(i)?'✓':String(i+1).padStart(2,'0');}if(small)small.textContent=state.completed.includes(i)?'Этап пройден':'Учебный раздел';});
    app.querySelectorAll('[data-filled-count]').forEach(el=>{el.textContent=Object.values(state.notes).filter(v=>v.trim()).length+Object.values(state.project).filter(v=>v.trim()).length;});
  }
  app.addEventListener('input',event=>{
    const el=event.target;
    if(el.matches('[data-note]')){if(isReview())return;const group=el.dataset.group,id=el.dataset.note;if(!['notes','project'].includes(group))return;state[group][id]=el.value.slice(0,5000);const i=group==='project'?4:C.stages.findIndex(s=>s.fields.some(f=>f.id===id));delete state.reviews[i];if(C.stages[i]?.case?.id===id){delete state.caseReviewed[i];const feedback=document.getElementById('case-feedback-'+i);if(feedback)feedback.hidden=true;}state.completed=state.completed.filter(n=>n!==i);save();refreshPlanControls();}
    if(el.id==='glossary-search'){glossaryQuery=el.value;document.getElementById('glossary-results').innerHTML=glossaryRows();}
  });
  app.addEventListener('click',async event=>{
    const caseLink=event.target.closest('a[data-case-link]');if(caseLink){event.preventDefault();focusTarget='teaching-case';go('stage/'+caseLink.dataset.caseLink+'/practice');return;}
    const el=event.target.closest('button');if(!el)return;
    if(el.hasAttribute('data-open-nav')){const menu=app.querySelector('.course-nav');menu.open=true;menu.scrollIntoView({block:'start'});menu.querySelector('summary')?.focus({preventScroll:true});return;}
    if(el.hasAttribute('data-top')){document.getElementById('main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});return;}
    if(el.hasAttribute('data-mode')){state.mode=el.dataset.mode==='review'?'review':'learn';save();go(isReview()?'review':state.lastRoute||'start');return;}
    if(el.hasAttribute('data-case-review')){if(isReview())return;const i=Number(el.dataset.caseReview);if(!state.notes[C.stages[i].case.id]?.trim()){announce('Сначала запишите своё решение кейса.');return;}state.caseReviewed[i]=true;save();const y=window.scrollY;render();document.getElementById('case-feedback-'+i)?.focus({preventScroll:true});window.scrollTo(0,y);return;}
    if(el.hasAttribute('data-print')){window.print();return;}
    if(isReview()&&(el.hasAttribute('data-check')||el.hasAttribute('data-move')||el.hasAttribute('data-complete')||el.hasAttribute('data-reset')))return;

    if(el.hasAttribute('data-source')){await openSource(el.dataset.source,el.dataset.pages?.split(','),el.dataset.section);}
    if(el.hasAttribute('data-retry-sources'))loadSources();
    if(el.hasAttribute('data-move')){const q=getQuiz(el.dataset.move);if(!q||q.type!=='order')return;const a=[...quizValue(q)],from=Number(el.dataset.from),to=from+Number(el.dataset.delta);if(to<0||to>=a.length)return;[a[from],a[to]]=[a[to],a[from]];state.answers[q.id]=a;invalidate(q);save();render();document.querySelector(`[data-move="${q.id}"][data-from="${to}"]:not(:disabled)`)?.focus({preventScroll:true});announce(q.items[a[to]]+' — позиция '+(to+1));}
    if(el.hasAttribute('data-check')){const q=getQuiz(el.dataset.check);if(!q)return;const answer=quizValue(q);if(answer===undefined||(q.type==='match'&&answer.some(v=>v<0))){emptyAnswer=q.id;render();document.getElementById('quiz-'+q.id)?.focus({preventScroll:true});announce('Сначала выберите ответ во всех полях задания.');return;}emptyAnswer=null;state.answers[q.id]=answer;state.checked[q.id]=true;save();render();document.getElementById('quiz-'+q.id)?.focus({preventScroll:true});announce(grade(q,state.answers[q.id])?'Ответ верный.':'Пока не совпало. Прочитайте разбор и попробуйте снова.');}
    if(el.hasAttribute('data-complete')){const i=Number(el.dataset.complete);if(!Number.isInteger(i)||!canComplete(C,state,i))return;if(!state.completed.includes(i))state.completed.push(i);save();go(i<5?'stage/'+(i+1)+'/read':'notebook');announce('Этап '+C.stages[i].name+' пройден.');}
    if(el.hasAttribute('data-export'))exportNotebook();
    if(el.hasAttribute('data-reset'))document.getElementById('reset-dialog').showModal();
  });
  function renderBlocks(blocks){return blocks.map(b=>b.type==='p'?`<p>${e(b.text).replace(/\n/g,'<br>')}</p>`:`<div class="table-scroll"><table>${b.rows.map((row,i)=>'<tr>'+row.map(cell=>`<${i===0?'th':'td'}>${e(cell).replace(/\n/g,'<br>')}</${i===0?'th':'td'}>`).join('')+'</tr>').join('')}</table></div>`).join('');}
  async function openSource(id,pages,section){
    if(!['passport','rationale','workbook'].includes(id))return;
    const dialog=document.getElementById('source-dialog'),body=document.getElementById('source-content');
    document.getElementById('source-title').textContent='Авторский материал';body.innerHTML='<p>Открываем текст…</p>';if(!dialog.open)dialog.showModal();
    if(!sources)await loadSources(false);
    if(!sources){body.innerHTML=`<p>Не удалось открыть экранный текст. Исходный документ можно скачать.</p><a class="button primary" href="./materials/${id}.docx" download>Скачать DOCX</a>`;return;}
    const doc=sources.documents[id];document.getElementById('source-title').textContent=doc.title+(pages?' · страницы '+pages.join(', '):section?' · раздел '+section.slice(0,-1):'');
    const blocks=section?(sources.sections?.[id]?.[section]||[]):pages?pages.flatMap(p=>sources.pages[String(p)]||[]):doc.blocks;
    body.innerHTML=`<div class="source-toolbar"><span>Авторский текст · без пересказа</span><a href="${e(doc.file)}" download>Скачать оригинал DOCX ↓</a></div><div class="source-document">${blocks.length?renderBlocks(blocks):'<p>Этот фрагмент не найден в экранном тексте. Откройте исходный DOCX.</p>'}</div>`;body.scrollTop=0;
  }
  document.getElementById('close-source').addEventListener('click',()=>document.getElementById('source-dialog').close());
  document.getElementById('cancel-reset').addEventListener('click',()=>document.getElementById('reset-dialog').close());
  document.getElementById('confirm-reset').addEventListener('click',()=>{state=blank();save();document.getElementById('reset-dialog').close();go('start');announce('Записи и прогресс удалены из этого браузера.');});
  function exportNotebook(){
    const asText=value=>e(value||'Не заполнено').replace(/\n/g,'<br>');
    const fieldsHTML=(fields,group)=>fields.map(f=>`${f.group?'<h3>'+e(f.group)+'</h3>':''}<h4>${e(f.label)}</h4><p>${asText(state[group][f.id])}</p>`).join('');
    const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Рабочая тетрадь педагога — Справедливость</title><style>body{max-width:800px;margin:40px auto;padding:0 24px;font:17px/1.65 Georgia,serif;color:#173149}h1{font-size:32px}h2{border-top:1px solid #b9c5d2;padding-top:24px;margin-top:40px}h4{margin:24px 0 6px}p{overflow-wrap:anywhere}small{font:14px/1.5 Arial,sans-serif;color:#526174}.goal{background:#eef2f6;padding:16px}@media print{body{margin:0;max-width:none}h2,h3,h4{break-after:avoid}h2{page-break-before:auto}}</style></head><body><small>КИНОУРОКИ · ПОДГОТОВКА ПЕДАГОГА</small><h1>Справедливость</h1><p>Рабочая тетрадь к фильму «Великий»</p><p>Сохранено: ${e(new Date().toLocaleDateString('ru-RU'))}. Пройдено этапов электронного модуля: ${state.completed.length} из 6.</p><small>Личные записи педагога. Свободные ответы не проходили автоматическую или экспертную оценку.</small>${C.stages.map((s,i)=>`<section><h2>${i+1}. ${e(s.name)}</h2><p class="goal"><strong>Авторская цель этапа.</strong> ${e(s.goal)}</p>${fieldsHTML(s.fields,'notes')}${i===4?'<h3>Паспорт проекта справедливости</h3>'+fieldsHTML(C.projectFields,'project'):''}</section>`).join('')}<h2>Основание подготовки</h2><p>Паспорт методического пособия; Методическое обоснование паспорта; Сводная рабочая тетрадь — исходный комплект по качеству «Справедливость». Учебные пояснения электронного модуля являются адаптацией для педагога.</p></body></html>`;
    if(exportURL)URL.revokeObjectURL(exportURL);
    const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Kinouroki_Spravedlivost_Moya_tetrad.html';document.body.appendChild(a);exportURL=url;a.click();a.remove();const fallback=document.getElementById('export-links');if(fallback)fallback.innerHTML='<p>Если скачивание не началось, <a href="'+e(url)+'" download="Kinouroki_Spravedlivost_Moya_tetrad.html">сохраните подготовленный HTML-файл</a>. Его можно открыть в браузере и распечатать.</p>';announce('Тетрадь подготовлена к скачиванию. Файл открывается в браузере и подходит для печати.');
  }
  async function loadSources(update=true){
    try{const response=await fetch('./sources.json');if(!response.ok)throw new Error('load');const data=await response.json();if(!data.documents||!data.pages||!Array.isArray(data.glossary))throw new Error('format');sources=data;sourceFailure=false;}catch{sourceFailure=true;}
    if(update&&route.view==='stage'&&route.tab==='read'){const el=document.getElementById('author-fragment');if(el)el.innerHTML=excerptBody(C.stages[route.stage]);}
    if(update&&route.view==='glossary'){const el=document.getElementById('glossary-results');if(el)el.innerHTML=glossaryRows();}
  }
  function excerptBody(s){
    if(!sources)return `<p>${sourceFailure?'Экранный текст не загрузился. Откройте оригинал по кнопке ниже.':'Загружаем авторский фрагмент…'}</p>`;
    const blocks=sources.pages[String(s.case.page)]||[];
    return renderBlocks(blocks.slice(0,4));
  }
  function originalExcerpt(s,i){return `<section class="original-excerpt"><div class="eyebrow">ОРИГИНАЛ · РАБОЧАЯ ТЕТРАДЬ · СТРАНИЦА ${s.case.page}</div><div id="author-fragment">${excerptBody(s)}</div>${sourceButton('Открыть страницу целиком','workbook',[s.case.page])}<a class="text-link" href="#film/${s.case.scene}">Эпизод фильма к практике →</a></section>`;}
  function renderStart(){
    const prepared=state.preparation.film&&state.preparation.sources;
    return `${pageHeader('ОБУЧЕНИЕ ПЕДАГОГОВ','Справедливость','На материале фильма «Великий». '+C.audience)}
      <section class="route-next"><div><span class="eyebrow">${state.completed.length===6?'МАРШРУТ ЗАВЕРШЁН':'ВАШ СЛЕДУЮЩИЙ ШАГ'}</span><h2>${!prepared?'Подготовиться к работе':state.completed.length===6?'Сохранить тетрадь':'Продолжить обучение'}</h2><p>Изучить источник → решить педагогическую задачу → подготовить собственный план.</p></div><a class="button primary" href="${!prepared?'#film':nextRoute()}">${!prepared?'Открыть полный фильм':'Продолжить'} →</a></section>
      <div class="preparation-grid"><section class="prep-card"><span class="eyebrow">01 · КОНТЕКСТ</span><h2>Полный фильм</h2><p>Посмотрите «Великий» целиком, включая титры. Затем можно возвращаться к отдельным сценам.</p><a class="text-link" href="#film">Фильм и семь сцен · 23:40 →</a><label class="read-check"><input type="checkbox" data-preparation="film" ${state.preparation.film?'checked':''}><span>Я посмотрел(а) полный фильм</span></label></section>
      <section class="prep-card"><span class="eyebrow">02 · АВТОРСКАЯ ОСНОВА</span><h2>Методический комплект</h2><p>Паспорт задаёт структуру; обоснование раскрывает логику; тетрадь содержит задания и формы.</p><a class="text-link" href="#materials">Открыть материалы →</a><label class="read-check"><input type="checkbox" data-preparation="sources" ${state.preparation.sources?'checked':''}><span>Я ознакомился(ась) с назначением трёх документов</span></label></section></div>
      <div class="section-heading"><h2>Шесть этапов</h2><span data-completed-count>${state.completed.length} из 6</span></div><div class="route-list">${C.stages.map((s,i)=>`<a href="${stageURL(i)}" class="route-item"><span class="route-number ${state.completed.includes(i)?'done':''}">${state.completed.includes(i)?'✓':String(i+1).padStart(2,'0')}</span><span><strong>${e(s.name)}</strong><small>${e(s.subtitle)}</small></span><span class="route-status">${state.completed.includes(i)?'Пройден':'Открыть'} →</span></a>`).join('')}</div><div class="course-note"><p>Результат обучения — ваш план проведения киноурока и сопровождения социальной практики. Свободные ответы вы сверяете с авторским материалом и критериями.</p><p>План просмотра и сроки общего дела определяются отдельно. Указанное в паспорте время этапов не является продолжительностью онлайн-обучения педагога.</p></div>`;
  }
  function filmSceneInfo(){
    const scene=C.scenes.find(x=>x.id===route.scene);
    return `<p id="video-status" class="video-status" role="status">${scene?e(scene.name)+' · '+e(scene.time):'Посмотрите фильм целиком. При повторном просмотре используйте ориентиры сцен ниже.'}</p>${scene?`<div class="scene-focus"><strong>${e(scene.name)}</strong><p>${e(scene.focus)}</p><p>Найдите начало сцены на шкале плеера: ${e(scene.time.split('–')[0])}. Отметки ориентировочные; выбор сцены показывает задание и не перематывает фильм.</p></div>`:''}`;
  }
  function updateFilmScene(){
    const info=document.getElementById('film-scene-info');if(info)info.innerHTML=filmSceneInfo();
    app.querySelectorAll('.scene-link').forEach(el=>{const active=el.getAttribute('href')==='#film/'+route.scene;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');});
    announce('Ориентир сцены обновлён. Плеер продолжает работать.');
  }
  function renderFilm(){
    return `${pageHeader('ФИЛЬМ И ПРАКТИКА','«Великий»','Полная версия · 23 минуты 40 секунд · режиссёр Елена Дубровская')}<div class="film-layout"><section><div class="video-shell" id="film-player"><iframe src="${e(C.filmEmbedURL)}" title="Фильм Великий — плеер VK" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><div id="film-scene-info">${filmSceneInfo()}</div><label class="read-check"><input type="checkbox" data-preparation="film" ${state.preparation.film?'checked':''}><span>Я посмотрел(а) полный фильм, включая титры</span></label><div class="actions wrap">${returnLink()}</div></section><aside class="scene-list"><h2>Семь опорных сцен</h2>${C.scenes.map((x,i)=>`<a href="#film/${x.id}" class="scene-link ${x.id===route.scene?'active':''}" ${x.id===route.scene?'aria-current="true"':''}><span>${i+1}</span><span><strong>${e(x.name)}</strong><small>${e(x.time)}</small></span></a>`).join('')}<p>В финале фильма Калина читает стихотворение. Рассказ — отдельная литературная версия.</p><a href="./materials/story.pdf" target="_blank" rel="noopener" class="text-link">Читать оригинальный рассказ ↗</a></aside></div>`;
  }
  function renderCase(s,i){
    const q=s.case,field=s.fields.find(f=>f.id===q.id),show=isReview()||state.caseReviewed[i];
    return `<section class="teaching-case" id="teaching-case" tabindex="-1"><span class="eyebrow">ПЕДАГОГИЧЕСКИЙ КЕЙС · ПРИМЕНИТЬ МЕТОДИКУ</span><h2>${e(q.title)}</h2><div class="case-materials"><a class="button ghost" href="#film/${q.scene}">Открыть эпизод фильма</a>${sourceButton('Тетрадь · страница '+q.page,'workbook',[q.page])}</div>${noteField(field)}${!isReview()?`<button class="button primary" data-case-review="${i}" ${state.notes[q.id]?.trim()?'':'disabled'}>Сверить решение с разбором</button>`:''}${show?`<div class="case-feedback" id="case-feedback-${i}" tabindex="-1"><h3>Критерии самопроверки</h3><ul>${q.criteria.map(t=>'<li>'+e(t)+'</li>').join('')}</ul><h3>Пример рассуждения</h3><p>${e(q.example)}</p><p class="source-caption">Учебный разбор для педагога. Это не автоматическая оценка вашего ответа. Сравните основания решения и при необходимости доработайте запись.</p></div>`:'<p class="source-caption">Сначала запишите своё решение. Затем откроются критерии и пример рассуждения.</p>'}</section>`;
  }
  function renderReview(){return `${pageHeader('МЕТОДИЧЕСКОЕ РЕЦЕНЗИРОВАНИЕ','Обзор курса','Проверьте источники, педагогические задачи, разборы и итоговые формы каждого этапа.')}<div class="review-overview"><a class="button primary" href="#film">Полный фильм и сцены</a><a class="button ghost" href="#materials">Оригинальные материалы</a></div><div class="review-stages">${C.stages.map((s,i)=>`<article><div class="section-kicker">ЭТАП ${i+1}</div><h2>${e(s.name)}</h2><p>${e(s.goal)}</p><strong class="review-case-title">Кейс: ${e(s.case.title)}</strong><div class="actions wrap"><a href="${stageURL(i)}">Изучение и источник</a><a href="${stageURL(i,'practice')}">Задания и разборы</a><a href="${stageURL(i,'plan')}">План и критерии</a></div></article>`).join('')}</div>`;}
  function renderResult(){
    const values=(fields,group)=>fields.map(f=>`<section class="result-field"><h3>${e(f.label)}</h3><p>${e(state[group][f.id]||'Не заполнено').replace(/\n/g,'<br>')}</p></section>`).join('');
    return `${pageHeader('МОЯ ПОДГОТОВКА','Итоговая тетрадь','План киноурока по качеству «Справедливость» и фильму «Великий».')}<div class="result-toolbar"><button class="button primary" data-print>Печать / сохранить в PDF</button><button class="button ghost" data-export>Скачать HTML</button><a class="text-link" href="#notebook">Редактировать записи</a></div><div id="export-links" class="export-links" aria-live="polite"></div><p class="local-explainer">Пройдено ${state.completed.length} из 6 этапов. Статусы этапов показывают, где отмечена ваша самопроверка. Экспертное заключение не выдаётся. PDF сохраняется через меню печати вашего устройства.</p>${C.stages.map((s,i)=>`<article class="result-stage"><span class="eyebrow">ЭТАП ${i+1} · ${state.completed.includes(i)?'ПРОЙДЕН':'В РАБОТЕ'}</span><h2>${e(s.name)}</h2><p class="result-goal">${e(s.goal)}</p>${values(s.fields,'notes')}${i===4?'<h2>Паспорт проекта справедливости</h2>'+values(C.projectFields,'project'):''}</article>`).join('')}`;
  }
  function setupWebMCP(){
    const context=document.modelContext;if(!context?.registerTool)return;
    const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
    const objectInput=(input,keys)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k)))throw new Error('Недопустимые параметры');};
    const definitions=[
      {name:'get_course_progress',title:'Прочитать прогресс курса',description:'Возвращает этапы, пройденные в этом браузере. Не возвращает личные записи и не меняет прогресс.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){objectInput(input,[]);return{course:'Справедливость',completedStages:[...state.completed].sort().map(i=>({number:i+1,title:C.stages[i].name})),total:6,storage:'this_browser'};}},
      {name:'open_course_section',title:'Открыть раздел курса',description:'Открывает указанный этап и вкладку в видимом интерфейсе. Не выполняет задания и не отмечает обучение пройденным.',inputSchema:{type:'object',properties:{stage:{type:'integer',minimum:1,maximum:6},tab:{type:'string',enum:['read','practice','plan']}},required:['stage','tab'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){objectInput(input,['stage','tab']);if(!Number.isInteger(input.stage)||input.stage<1||input.stage>6||!['read','practice','plan'].includes(input.tab))throw new Error('Укажите этап от 1 до 6 и вкладку read, practice или plan');go('stage/'+(input.stage-1)+'/'+input.tab);return{stage:input.stage,title:C.stages[input.stage-1].name,tab:input.tab};}}
    ];
    for(const tool of definitions){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* The visible course remains usable if the optional API is unavailable. */}}
  }
  document.querySelector('.skip')?.addEventListener('click',event=>{event.preventDefault();document.getElementById('main').focus();});
  if(!isReview())state.lastRoute=location.hash.slice(1)||state.lastRoute||'start';
  save();render();loadSources();setupWebMCP();
})();
