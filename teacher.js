'use strict';
// Общий движок педагогического контура. Данные курса — в teacher-data.js рядом со страницей курса.
// Педагогический контур курса «Великий» по отзыву команды проекта 29.09.2026:
// маршрутная карта (Подготовка → Старт → Итоги), педагог проходит задания как ученик,
// пояснения педагогу по первоисточникам, экзамен на понимание качества, печатная тетрадь ученика,
// фиксация результатов и персонаж-подсказчик. Эталонные документы не изменяются:
// пояснения выводятся из паспорта и обоснования без пересказа.
window.TeacherUI = function(ctx){
  const T=window.TEACHER, C=ctx.C, e=ctx.e, N=C.stages.length;
  const views=['map','prep','student','workbook','encyclopedia','socrat','outcomes','happiness'];
  const blank=()=>({version:1,studentDone:{},exam:{answers:{},checked:{}},prep:{intro:false,workbook:false,print:false,course:false},outcomes:{},socrat:{},guideHidden:false});
  const startHref=()=>{const s=ctx.getState(),i=C.stages.findIndex((_,n)=>!s.completed.includes(n));return '#stage/'+(i<0?0:i)+'/read';};
  const pageKeys=new Set(T.studentPages.flat().map(String));
  const outcomeKeys=new Set(['lesson','summary',...C.stages.flatMap((_,i)=>T.outcomeFields.map(f=>'s'+i+'-'+f.id))]);
  function normalize(input){
    const s=blank();if(!input||input.version!==1)return s;
    for(const k of Object.keys(input.studentDone||{}))if(pageKeys.has(k)&&input.studentDone[k]===true)s.studentDone[k]=true;
    for(const q of T.exam){
      const a=input.exam?.answers?.[q.id];
      if(q.type==='single'&&Number.isInteger(a)&&a>=0&&a<q.options.length)s.exam.answers[q.id]=a;
      if(q.type==='order'&&Array.isArray(a)&&a.length===q.items.length&&a.every(v=>Number.isInteger(v)&&v>=0&&v<q.items.length)&&new Set(a).size===a.length)s.exam.answers[q.id]=a;
      if(input.exam?.checked?.[q.id]===true&&q.id in s.exam.answers)s.exam.checked[q.id]=true;
    }
    s.prep.intro=input.prep?.intro===true;s.prep.workbook=input.prep?.workbook===true;s.prep.print=input.prep?.print===true;s.prep.course=input.prep?.course===true;
    for(const k of Object.keys(input.outcomes||{}))if(outcomeKeys.has(k)&&typeof input.outcomes[k]==='string')s.outcomes[k]=input.outcomes[k].slice(0,5000);
    const S=window.SOCRATIC;
    for(const item of S?.items||[]){
      const src=input.socrat?.[item.id];if(!src||typeof src!=='object')continue;
      const d={variant:item.variants.some(v=>v.variant===src.variant)?src.variant:item.variants[0].variant,step:Number.isInteger(src.step)&&src.step>=1&&src.step<=7?src.step:1,shown:{},notes:{},open:{},checks:{}};
      const key=/^v\d+-s[1-7](?:-\d{1,3})?$/;
      for(const [k,v] of Object.entries(src.shown||{}))if(key.test(k)&&Number.isInteger(v)&&v>=0&&v<500)d.shown[k]=v;
      for(const [k,v] of Object.entries(src.notes||{}))if(key.test(k)&&typeof v==='string')d.notes[k]=v.slice(0,5000);
      for(const [k,v] of Object.entries(src.open||{}))if(key.test(k)&&v===true)d.open[k]=true;
      for(const [k,v] of Object.entries(src.checks||{}))if(key.test(k)&&v===true)d.checks[k]=true;
      s.socrat[item.id]=d;
    }
    s.guideHidden=input.guideHidden===true;
    return s;
  }
  const openForPrint=()=>document.querySelectorAll('details.t-outcome').forEach(d=>{d.open=true;});
  window.addEventListener?.('beforeprint',openForPrint);
  let t, storageOK=true;
  try{t=normalize(JSON.parse(localStorage.getItem(T.storageKey)));}catch{t=blank();storageOK=false;}
  function save(){try{localStorage.setItem(T.storageKey,JSON.stringify(t));storageOK=true;}catch{storageOK=false;}}
  const grade=(q,v)=>window.CourseCore.grade(q,v);
  const examValue=q=>t.exam.answers[q.id]??(q.type==='order'?q.initial:undefined);
  const examPassed=()=>T.exam.every(q=>t.exam.checked[q.id]&&grade(q,t.exam.answers[q.id]));
  const examScore=()=>T.exam.filter(q=>t.exam.checked[q.id]&&grade(q,t.exam.answers[q.id])).length;
  const app=()=>ctx.getState();
  const prepSteps=()=>{
    const s=app();
    return [
      {n:'П1',title:'Полный фильм',done:s.preparation.film,href:'#prep/step-film'},
      {n:'П2',title:'Методический комплект',done:s.preparation.sources,href:'#prep/step-kit'},
      {n:'П3',title:'Введение в качество',done:t.prep.intro,href:'#prep/intro'},
      {n:'П4',title:'Экзамен на понимание качества',done:examPassed(),href:'#prep/exam'},
      {n:'П5',title:'Сводная рабочая тетрадь — пройти самому',done:t.prep.workbook,href:'#prep/workbook-step'},
      {n:'П6',title:'Рабочая тетрадь ученика — распечатать',done:t.prep.print,href:'#prep/print-step'}
    ];
  };
  // Что сделать, чтобы шаг засчитался. Показывается в карточке шага и в подсказке помощника.
  const prepHow={'П1':'посмотрите фильм и поставьте галочку «Я посмотрел(а) полный фильм»','П2':'откройте материалы и поставьте галочку «Я ознакомился(ась)…»','П3':'прочитайте введение и поставьте галочку «Я изучил(а) введение в качество»','П4':'ответьте верно на все вопросы экзамена — после каждого ответа нажмите «Проверить ответ»','П5':'пройдите задания тетради как ученик и поставьте галочку в конце карточки','П6':'распечатайте тетрадь ученика и поставьте галочку «Тетрадь ученика распечатана к уроку»'};
  const num=x=>x.n.replace('П','');
  const prepReady=()=>prepSteps().filter(x=>!x.pending).every(x=>x.done);
  const prepCount=()=>{const list=prepSteps().filter(x=>!x.pending);return list.filter(x=>x.done).length+' из '+list.length;};
  const stagePages=i=>T.studentPages[i]||[];
  const stageStudentDone=i=>stagePages(i).filter(p=>t.studentDone[String(p)]).length;
  const outcomeFilled=()=>Object.values(t.outcomes).filter(v=>v.trim()).length;
  function pageTitle(p){
    const sources=ctx.getSources(),first=sources?.pages?.[String(p)]?.[0];
    const m=first&&first.type==='p'?/СТРАНИЦ[АЫ]\s*[\d–-]+\.\s*(.+)$/.exec(first.text.split('\n')[0]):null;
    return m?m[1].trim():'Страница '+p;
  }
  const check=done=>done?'<span class="t-dot done" aria-hidden="true">✓</span>':'<span class="t-dot" aria-hidden="true"></span>';
  const pendingBadge='<span class="t-badge">Ожидает материала</span>';
  const readOnly=()=>ctx.isReview();
  // Энциклопедия (рабочая редакция): дословные разделы статьи по номеру.
  const enc=()=>window.ENCYCLOPEDIA||null;
  const encSec=(key,num)=>enc()?.articles?.[key]?.sections.find(x=>x.title.startsWith(num))?.text||[];
  const encName=()=>enc()?.articles?.[T.encKey]?.name||'';
  // Раздел 2.4 статьи: строки после подзаголовка «2.4.», без общей редакционной фразы-шаблона.
  const encDistinct=()=>{const l=encSec(T.encKey,'2.'),i=l.findIndex(x=>x.startsWith('2.4.'));return (i<0?[]:l.slice(i+1)).filter(x=>!/отделяется от внешне похожего поведения/.test(x)).map(x=>'<p>'+e(x)+'</p>').join('');};
  const encText=(key,num)=>encSec(key,num).map(t=>'<p>'+e(t)+'</p>').join('');
  const encRef=(key,num)=>`<span class="source-caption">Энциклопедия · «${e(enc()?.articles?.[key]?.name||'')}» · ${e(num.replace(/\.$/,''))} · редакция ${e(enc()?.edition||'')}</span>`;
  const encBadge=()=>enc()?`<div class="t-pending-note"><strong>${e(enc().title)} · редакция ${e(enc().edition)}</strong><span>${e(enc().status)}. Тексты приведены дословно; незаполненные места помечены в самой энциклопедии как «не сформировано».</span></div>`:'';

  // ——— Боковое меню и старт ———
  function sidebar(route){
    const on=v=>route.view===v?'active':'';
    return `<div class="t-sidebar"><div class="course-label">МАРШРУТНАЯ КАРТА</div><a class="t-side-link ${on('map')}" href="#map">Вся карта урока</a><div class="t-side-steps"><a class="${on('prep')}" href="#prep"><b>Подготовка</b><small>${prepCount()}</small></a><a class="${route.view==='stage'?'active':''}" href="${startHref()}"><b>Старт</b><small>${app().completed.length} из ${N}</small></a><a class="${on('outcomes')}" href="#outcomes"><b>Итоги</b><small>${outcomeFilled()?'записи есть':'после урока'}</small></a></div><a class="t-side-link ${on('student')}" href="#student">Рабочая тетрадь ученика</a><a class="t-side-link ${on('workbook')}" href="#workbook">Сводная тетрадь (эталон)</a><a class="t-side-link ${on('encyclopedia')}" href="#encyclopedia">Энциклопедия качеств</a><a class="t-side-link ${route.view==='happiness'||route.view==='socrat'?'active':''}" href="#happiness">Раздел «Счастье» · разбор установок</a></div>`;
  }
  function segmented(active){
    return `<nav class="t-segments" aria-label="Разделы маршрутной карты"><a href="#prep" class="${active==='prep'?'active':''}"><span>01</span>Подготовка</a><a href="${startHref()}" class="${active==='start'?'active':''}"><span>02</span>Старт</a><a href="#outcomes" class="${active==='outcomes'?'active':''}"><span>03</span>Итоги</a></nav>`;
  }
  function startPanel(){
    return `<section class="t-start"><div><span class="eyebrow">МАРШРУТНАЯ КАРТА КИНОУРОКА</span><h2>Подготовка → Старт → Итоги</h2><p>Сначала вы готовитесь сами, затем проводите урок по восьми этапам, проходя каждое задание как ученик, и в конце фиксируете результаты.</p></div>${segmented('')}<a class="text-link" href="#map">Открыть всю карту →</a></section>`;
  }

  // ——— Маршрутная карта ———
  function renderMap(){
    const s=app(),steps=prepSteps();
    const stageRow=(st,i)=>{const done=s.completed.includes(i),total=stagePages(i).length;return `<a class="t-map-stage" href="#stage/${i}/read">${check(done)}<span><strong>${String(i+1).padStart(2,'0')} · ${e(st.name)}</strong><small>${st.minutes>0?e(st.minutes)+' мин · ':''}как ученик: ${stageStudentDone(i)} из ${total}</small></span></a>`;};
    const group=(title,note,from,to)=>`<div class="t-map-group"><div class="t-map-group-head"><b>${title}</b><small>${note}</small></div>${C.stages.slice(from,to).map((st,k)=>stageRow(st,from+k)).join('')}</div>`;
    return `${header('МАРШРУТНАЯ КАРТА','Весь киноурок на одной карте','Три раздела: подготовка педагога, проведение урока по восьми этапам и фиксация результатов.',['#start','Главная страница курса'])}${segmented('')}
      <ol class="t-map">
        <li class="t-map-block"><div class="t-map-num">01</div><div class="t-map-body"><div class="t-map-title"><h2>Подготовка</h2><span>${prepCount()}</span></div><p>Педагог один, до урока. Смысл качества, экзамен, фильм, комплект и тетради.</p><a class="t-map-stage t-map-foundation" href="#prep/method">${check(t.prep.course)}<span><strong>Основа · курс обучения методике</strong><small>один раз для всех киноуроков · kinouroki.org</small></span></a>${steps.map(x=>`<a class="t-map-stage" href="${x.href}">${x.pending?'<span class="t-dot wait" aria-hidden="true">…</span>':check(x.done)}<span><strong>Шаг ${num(x)} · ${e(x.title)}</strong><small>${x.pending?'ожидает материала':x.done?'готово':'не выполнено'}</small></span></a>`).join('')}<a class="button primary" href="#prep">Открыть подготовку →</a></div></li>
        <li class="t-map-block"><div class="t-map-num">02</div><div class="t-map-body"><div class="t-map-title"><h2>Старт</h2><span>${s.completed.length} из ${N}</span></div><p>Урок с классом. На каждом этапе вы сначала выполняете задания ученика, затем читаете пояснения педагогу.</p>${group('На уроке','этапы 1–6 — в классе',0,6)}${group('Общее дело','вне урока, по срокам выбранного дела',6,7)}${group('Праздник успехов','после выполненного дела',7,8)}<a class="button primary" href="${startHref()}">${s.completed.length?'Продолжить урок →':'Старт: этап 1 →'}</a></div></li>
        <li class="t-map-block"><div class="t-map-num">03</div><div class="t-map-body"><div class="t-map-title"><h2>Итоги</h2><span>${outcomeFilled()} записей</span></div><p>После урока и общего дела: что прошло по плану, что заметили у детей, что изменить. По каждому этапу.</p><a class="button primary" href="#outcomes">Зафиксировать итоги →</a></div></li>
      </ol>`;
  }
  function header(kicker,title,subtitle,back=['#map','Маршрутная карта']){return `<nav class="context-nav"><a href="${back[0]}">← ${e(back[1])}</a></nav><div class="section-kicker">${e(kicker)}</div><h1>${e(title)}</h1><p class="subtitle page-subtitle">${e(subtitle)}</p>`;}

  // ——— Подготовка ———
  function renderExamQuestion(q,num){
    const review=readOnly(),value=review?q.answer:examValue(q),checked=review||t.exam.checked[q.id],passed=checked&&grade(q,value);
    let controls='';
    if(q.type==='single')controls=`<fieldset><legend class="sr-only">${e(q.title)}</legend>${q.options.map((o,j)=>`<label class="choice ${value===j?'selected':''}"><input type="radio" name="${q.id}" data-t-input data-t-answer="${q.id}" value="${j}" ${value===j?'checked':''}><span>${e(o)}</span></label>`).join('')}</fieldset>`;
    if(q.type==='order')controls=`<ol class="order-list">${value.map((v,j)=>`<li><span class="order-index">${j+1}</span><strong>${e(q.items[v])}</strong><span class="order-controls"><button type="button" class="icon-button" data-t-input data-t-move="${q.id}" data-from="${j}" data-delta="-1" ${j===0?'disabled':''} aria-label="Поднять ${e(q.items[v])}">↑</button><button type="button" class="icon-button" data-t-input data-t-move="${q.id}" data-from="${j}" data-delta="1" ${j===value.length-1?'disabled':''} aria-label="Опустить ${e(q.items[v])}">↓</button></span></li>`).join('')}</ol>`;
    return `<section class="quiz" id="t-quiz-${q.id}" tabindex="-1"><div class="quiz-top"><span class="eyebrow">ВОПРОС ${String(num+1).padStart(2,'0')} ИЗ ${String(T.exam.length).padStart(2,'0')}</span>${passed?'<span class="success-label">'+(review?'Разбор':'✓ Верно')+'</span>':''}</div><h2>${e(q.title)}</h2>${q.prompt?'<p>'+e(q.prompt)+'</p>':''}${controls}<div class="quiz-actions">${review?'<span class="review-key">Показан ответ и разбор</span>':`<button type="button" class="button ${passed?'ghost':'primary'}" data-t-check="${q.id}">${checked?'Проверить ещё раз':'Проверить ответ'}</button>`}<span class="source-caption">${e(q.ref)}</span></div>${checked?`<div class="feedback ${passed?'positive':'retry'}" role="status"><strong>${passed?'Верно':'Пока не совпало'}</strong><p>${e(q.explanation)}</p>${!passed?'<span>Измените ответ и проверьте снова.</span>':''}</div>`:''}</section>`;
  }
  // Основа методики: общий курс проекта. Проходится один раз, а не перед каждым фильмом, поэтому не входит в шаги подготовки.
  function foundation(box){
    return `<section class="t-foundation" id="method"><div class="eyebrow">ОСНОВА · ОДИН РАЗ ДЛЯ ВСЕХ КИНОУРОКОВ</div><h2>Курс обучения методике</h2><p>Общий курс проекта о системе этического воспитания через киноуроки. Его проходят один раз — он даёт основу для работы с любым фильмом. Подготовка ниже — уже к конкретному уроку «${e(ctx.M.film)}».</p><ul class="t-list"><li><a href="https://kinouroki.org/povishenkvalif" target="_blank" rel="noopener noreferrer">Курс повышения квалификации «Система этического воспитания» ↗</a></li><li><a href="https://kinouroki.org/metodica" target="_blank" rel="noopener noreferrer">Методические материалы проекта ↗</a></li></ul>${box('course','Я прошёл(ла) курс методики или изучаю его',t.prep.course)}<p class="source-caption">Не обязательное условие для этой подготовки: можно готовиться к уроку и параллельно проходить курс.</p></section>`;
  }
  function renderPrep(route){
    const s=app(),steps=prepSteps(),Q=T.quality;
    const ids={'П1':'step-film','П2':'step-kit','П3':'intro','П4':'exam','П5':'workbook-step','П6':'print-step'};
    const card=(x,body)=>{const k=steps.indexOf(x),nx=steps[k+1],pv=steps[k-1];
      const how=`<p class="t-how">${x.done?'<b>✓ Готово.</b> Шаг засчитан.':'<b>Что сделать:</b> '+e(prepHow[x.n]||'')+'.'}</p>`;
      const foot=`<nav class="t-step-nav" aria-label="Переход между шагами подготовки">${pv?`<a class="text-link" href="#prep/${ids[pv.n]}">← Шаг ${num(pv)}</a>`:'<span></span>'}${nx?`<a class="button ${x.done?'primary':'ghost'}" href="#prep/${ids[nx.n]}">${x.done?'Дальше':'Пропустить пока'} · Шаг ${num(nx)}: ${e(nx.title)} →</a>`:`<a class="button ${prepReady()?'primary':'ghost'}" href="${startHref()}">${prepReady()?'Подготовка готова · Старт →':'Перейти к старту →'}</a>`}</nav>`;
      return `<section class="t-prep-step ${x.done?'done':''}" id="${ids[x.n]}"><div class="t-prep-head">${check(x.done)}<span class="eyebrow">ШАГ ${num(x)}</span><h2>${e(x.title)}</h2></div>${how}${body}${foot}</section>`;};
    const box=(key,label,checked)=>`<label class="read-check"><input type="checkbox" ${key.startsWith('app:')?'data-preparation="'+key.slice(4)+'"':'data-t-input data-t-prep="'+key+'"'} ${checked?'checked':''}><span>${label}</span></label>`;
    return `${header('РАЗДЕЛ 01 · ДО УРОКА','Подготовка','Вы проходите подготовку один. Отметки сохраняются в этом браузере.')}${segmented('prep')}
      <div class="t-prep-progress"><b>${prepCount()}</b><span>шагов подготовки выполнено</span>${prepReady()?'<a class="button primary" href="#stage/0/read">Готово — перейти к старту →</a>':''}</div>
      ${foundation(box)}
      ${card(steps[0],`<p>${e(ctx.M.filmPrepText)}</p><a class="text-link" href="#film">${e(ctx.M.filmNavLabel)} · ${e(ctx.M.filmDuration)} →</a>${box('app:film','Я посмотрел(а) полный фильм',s.preparation.film)}`)}
      ${card(steps[1],'<p>Паспорт задаёт структуру; обоснование раскрывает логику; тетрадь содержит задания и формы.</p><a class="text-link" href="#materials">Открыть материалы →</a>'+box('app:sources','Я ознакомился(ась) с назначением трёх документов',s.preparation.sources))}
      ${card(steps[2],`${encBadge()}${enc()?`<div class="definition"><h3>${e(encName())} · энциклопедия</h3>${encText(T.encKey,'1.3.')}${encRef(T.encKey,'1.3.')}</div><h3>Чем отличается от сходного поведения</h3>${encDistinct()}${encRef(T.encKey,'2.4.')}<h3>Формула качества</h3>${encSec(T.encKey,'4.').slice(1,2).map(t=>'<p><strong>'+e(t)+'</strong></p>').join('')}${encRef(T.encKey,'4.')}<h3>Антипод: ${e(encSec(T.encKey,'5.4.')[0]||'')}</h3>${encText(T.encKey,'5.5.')}${encRef(T.encKey,'5.5.')}<h3>Возможные искажения качества</h3><ul class="t-list">${encSec(T.encKey,'6.').map(t=>'<li>'+e(t)+'</li>').join('')}</ul>${encRef(T.encKey,'6.')}<blockquote><div class="eyebrow">ФОРМУЛА-АФОРИЗМ</div><p>${e(encSec(T.encKey,'7.6.')[0]||'')}</p><cite>Энциклопедия · «Справедливость» · 7.6</cite></blockquote><a class="text-link" href="#encyclopedia">Открыть статью энциклопедии целиком →</a>`:''}<h3>В паспорте пособия</h3><div class="definition"><h3>Определение качества</h3><p>${e(Q.definition)}</p><span class="source-caption">Паспорт пособия · раздел 5.1</span></div><div class="definition"><h3>Определение антипода</h3><p>${e(Q.antipode)}</p><span class="source-caption">Паспорт пособия · раздел 5.1</span></div><h3>Ключевые понятия этапа «Введение»</h3><ul class="t-list">${Q.concepts.map(c=>'<li>'+e(c)+'</li>').join('')}</ul>${ctx.sourceButton('Паспорт · этап «Введение»','passport',null,'5.1.')}${ctx.sourceButton('Обоснование · задача «Введения»','rationale',null,'2.2.2.')}${box('intro','Я изучил(а) введение в качество',t.prep.intro)}`)}
      ${card(steps[3],`<p>Экзамен проверяет понимание качества перед уроком: ${T.exam.length} вопросов по энциклопедии, паспорту и обоснованию. Попытки не ограничены.</p><p class="t-score">Верных ответов: <b>${examScore()} из ${T.exam.length}</b></p>${T.exam.map(renderExamQuestion).join('')}`)}
      ${card(steps[4],`<p>Сводная рабочая тетрадь комплекта становится вашим разделом подготовки: вы проходите её задания сами, как ученик. На каждом этапе «Старта» задания этого этапа собраны в «Шаг 1». Здесь — вся тетрадь целиком.</p><p class="t-score">Пройдено как ученик: <b>${Object.keys(t.studentDone).length} из ${pageKeys.size}</b> страниц</p><a class="text-link" href="#workbook">Открыть сводную тетрадь целиком →</a>${box('workbook','Я прошёл(ла) задания тетради как ученик',t.prep.workbook)}`)}
      ${card(steps[5],`<p>Отдельная тетрадь для ребёнка: только листы, с которыми дети работают в классе, по порядку этапов. Её можно распечатать целиком или по этапам.</p><a class="text-link" href="#student">Открыть рабочую тетрадь ученика →</a>${box('print','Тетрадь ученика распечатана к уроку',t.prep.print)}`)}
      <div class="actions wrap"><a class="button primary" href="#stage/0/read">Перейти к старту →</a><a class="text-link" href="#map">Маршрутная карта</a></div>`;
  }

  // ——— Педагог как ученик и пояснения на этапе ———
  function studentList(i){
    const pages=stagePages(i),review=readOnly();
    return `<ul class="t-student-list">${pages.map(p=>`<li><label><input type="checkbox" data-t-input data-t-student="${p}" ${t.studentDone[String(p)]||review?'checked':''}><span><b>Стр. ${e(p)}</b> ${e(pageTitle(p))}</span></label>${ctx.sourceButton('Открыть','workbook',[p])}</li>`).join('')}</ul>`;
  }
  function stageBlock(i){
    const total=stagePages(i).length,done=stageStudentDone(i);
    return `<section class="t-as-student"><div class="t-block-head"><span class="eyebrow">ШАГ 1 · ПРОЙДИТЕ КАК УЧЕНИК</span><span class="t-count" data-t-count="${i}">${done} из ${total}</span></div><h2>Задания ученика на этом этапе</h2><p>Откройте каждую страницу тетради и выполните задание сами — так, как его будут выполнять дети. Отметьте выполненное.</p><div id="t-student-list">${studentList(i)}</div>${classLink(i)}</section>
      <section class="t-for-teacher"><span class="eyebrow">ШАГ 2 · ПОЯСНЕНИЯ ПЕДАГОГУ</span><h2>Как провести этот этап</h2>${i===0&&enc()?'<p class="t-class-link"><a href="#encyclopedia">Статья «'+e(encName())+'» в энциклопедии качеств →</a></p>':''}${i===4&&soc()?'<p class="t-class-link"><a href="#socrat">Потренируйтесь разрушать разрушительную установку сократовским методом →</a></p>':''}<div id="t-teacher-notes">${teacherNotes(i)}</div><p class="source-caption">Тексты в пояснениях приведены из паспорта и обоснования без пересказа. После урока запишите, как прошёл этап, в разделе <a href="#outcomes">«Итоги»</a>.</p></section>`;
  }
  function classLink(i){
    const part=T.classWorkbook.find(p=>p.stageIndex===i);
    return part?`<p class="source-caption t-class-link">В классе дети работают с листами рабочей тетради ученика: <a href="#student/${part.id}">листы этапа «${e(part.stage)}» →</a></p>`:'';
  }
  function trimBlocks(blocks){
    return (blocks||[]).slice(1).filter(b=>!(b.type==='p'&&(/^[\d\s]+$/.test(b.text.trim())||/^Педагогическая цель:|^Формула этапа:$|^Задача:$/.test(b.text.trim()))));
  }
  function teacherNotes(i){
    const s=C.stages[i],n=s.sourceStage,sources=ctx.getSources();
    if(!Number.isInteger(n))return `<details class="t-note" open><summary>Сценарная подсказка</summary><div><p>Отдельного раздела этого этапа в исходном паспорте нет. Порядок задан стандартом проекта — он изложен в пояснениях ниже.</p></div></details><details class="t-note"><summary>Ожидаемый результат</summary><div><p>${e(s.takeaway)}</p></div></details>`;
    if(!sources)return '<p class="source-caption">Загружаем пояснения из паспорта и обоснования…</p>';
    const scenario=trimBlocks(sources.sections?.passport?.['5.'+n+'.']),reason=trimBlocks(sources.sections?.rationale?.['2.2.'+(n+1)+'.']);
    const table=(sources.sections?.rationale?.[T.summarySection]||[]).find(b=>b.type==='table'),head=table?.rows[0],row=table?.rows[n];
    const effect=row&&head?`<dl class="t-effect">${head.slice(1).map((h,k)=>`<div><dt>${e(h)}</dt><dd>${e(row[k+1])}</dd></div>`).join('')}</dl><span class="source-caption">Обоснование · сводная таблица ${e(T.summarySection.replace(/\.$/,''))}</span>`:'';
    return `<details class="t-note" open><summary>Сценарная подсказка: блоки и время</summary><div>${ctx.renderBlocks(scenario)}<span class="source-caption">Паспорт пособия · раздел 5.${n}</span></div></details><details class="t-note"><summary>Задача этапа и почему она важна</summary><div>${ctx.renderBlocks(reason)}<span class="source-caption">Методическое обоснование · раздел 2.2.${n+1}</span></div></details><details class="t-note"><summary>Ожидаемый результат и эффект</summary><div>${effect}</div></details>`;
  }

  // В экранном тексте к странице 3 прикреплён раздел «Термометр чувств» из конца этапа «Чувство» (после страницы 24).
  // Для печати он возвращается на своё место в исходном порядке документа.
  const sheets=(sources,p)=>{
    const blocks=sources.pages[String(p)]||[],cut=T.appendixFix?blocks.findIndex((b,k)=>k>0&&b.type==='p'&&/^\S*\s*СТРАНИЦА 3\. ТЕРМОМЕТР ЧУВСТВ/.test(b.text)):-1;
    const extra=T.appendixFix&&String(p)==='24'?(()=>{const b3=sources.pages['3']||[],c=b3.findIndex((b,k)=>k>0&&b.type==='p'&&/^\S*\s*СТРАНИЦА 3\. ТЕРМОМЕТР ЧУВСТВ/.test(b.text));return c>0?[b3.slice(c)]:[];})():[];
    // Заголовок следующего этапа («📘 ЭТАП N…»), прилипший к последней странице, на лист не выводится.
  const main=String(p)==='3'&&cut>0?blocks.slice(0,cut):blocks,stageCut=main.findIndex((b,k)=>k>0&&b.type==='p'&&/^📘 ЭТАП \d/.test(b.text));
  return [stageCut>0?main.slice(0,stageCut):main,...extra];
  };

  // ——— Сводная тетрадь (эталон) целиком ———
  function renderWorkbook(route){
    const sources=ctx.getSources(),parts=T.workbookParts,sel=parts.find(p=>p.id===route.sub)||null,list=sel?[sel]:parts;
    const chips=`<nav class="t-chips t-noprint" aria-label="Выбрать этап тетради"><a href="#workbook" class="${sel?'':'active'}">Вся тетрадь</a>${parts.map(p=>`<a href="#workbook/${p.id}" class="${sel===p?'active':''}">${e(p.name)}</a>`).join('')}</nav>`;
    const body=!sources?'<p class="source-caption">Загружаем страницы тетради…</p>':list.map(part=>`<section class="t-part"><h2 class="t-part-title">${e(part.name)}</h2>${part.pages.flatMap(p=>sheets(sources,p)).map(b=>`<article class="t-sheet">${ctx.renderBlocks(b)}</article>`).join('')}</section>`).join('');
    return `${header('ПОДГОТОВКА · ШАГ 5','Сводная рабочая тетрадь','Эталонная тетрадь комплекта целиком. Педагог проходит её задания сам, как ученик.',['#prep/workbook-step','Подготовка · шаг 5'])}<div class="t-print-bar t-noprint"><button type="button" class="button primary" data-t-print>Печать / сохранить в PDF</button><a class="text-link" href="./materials/workbook.docx" download>Скачать оригинал DOCX ↓</a></div><p class="local-explainer t-noprint">Текст страниц совпадает с оригиналом тетради; оформление упрощено для экрана и печати.</p>${chips}<div id="t-student-pages">${body}</div>`;
  }

  // ——— Рабочая тетрадь ученика (для класса, печать) ———
  function renderStudent(route){
    const sources=ctx.getSources(),parts=T.classWorkbook,sel=parts.find(p=>p.id===route.sub)||null,list=sel?[sel]:parts;
    const chips=`<nav class="t-chips t-noprint" aria-label="Выбрать этап"><a href="#student" class="${sel?'':'active'}">Вся тетрадь</a>${parts.map(p=>`<a href="#student/${p.id}" class="${sel===p?'active':''}">${e(p.stage)}</a>`).join('')}</nav>`;
    const count=parts.reduce((n,p)=>n+p.items.reduce((m,x)=>m+x[2].length,0),0);
    const contents=`<section class="t-contents"><h2>Содержание</h2><ol>${parts.map(p=>`<li><b>${e(p.stage)}</b><span>${p.items.map(x=>e(x[0])).join(' · ')}</span></li>`).join('')}</ol></section>`;
    const sheet=(part,item,blocks)=>`<article class="t-sheet"><div class="t-sheet-meta">${e(part.stage)} · ${e(item[0])}${item[1]?' · '+e(item[1]):''}</div>${ctx.renderBlocks(blocks)}</article>`;
    const body=!sources?'<p class="source-caption">Загружаем листы тетради…</p>':list.map(part=>`<section class="t-part"><h2 class="t-part-title">${e(part.stage)}</h2>${part.items.flatMap(item=>item[2].map(p=>sheet(part,item,sheets(sources,p)[0]))).join('')}</section>`).join('');
    return `${header('ДЛЯ РЕБЁНКА · В КЛАССЕ','Рабочая тетрадь ученика','Все листы, с которыми ребёнок работает на киноуроке, по порядку этапов. Каждый лист печатается отдельно.')}<div class="t-print-bar t-noprint"><button type="button" class="button primary" data-t-print>Печать / сохранить в PDF</button><a class="text-link" href="./materials/student-workbook.pdf" target="_blank" rel="noopener">Готовый PDF для печати ↗</a></div><div class="t-pending-note t-noprint"><strong>Черновик состава · ${count} листов · на согласование</strong><span>Листы отобраны по «ключевым блокам» паспорта для каждого этапа. Тексты листов взяты из сводной тетради без изменений. Домашние задания и страницы с правилами для самостоятельного чтения не включены.</span></div>${chips}${sel?'':contents}<div id="t-student-pages">${body}</div>`;
  }

  // ——— Итоги ———
  function outcomeField(key,label,hint){
    const value=t.outcomes[key]||'';
    return `<div class="note-field"><label for="t-o-${key}">${e(label)}</label><p>${e(hint)}</p><textarea id="t-o-${key}" data-t-input data-t-outcome="${key}" maxlength="5000" rows="3" placeholder="Ваша запись…">${e(value)}</textarea><div class="t-print-value" data-t-print-value="${key}">${e(value||'—').replace(/\n/g,'<br>')}</div></div>`;
  }
  function renderOutcomes(){
    return `${header('РАЗДЕЛ 03 · ПОСЛЕ УРОКА','Итоги киноурока','Зафиксируйте результаты проведения по всем этапам. Записи хранятся в этом браузере; их можно распечатать.')}${segmented('outcomes')}<div class="t-print-bar t-noprint"><button type="button" class="button primary" data-t-print>Печать / сохранить в PDF</button><span class="save-status">${storageOK?'Записи сохраняются в этом браузере':'Сохранение недоступно — распечатайте записи'}</span></div>
      <section class="t-outcome-general">${outcomeField('lesson','Дата, класс, количество участников','Например: 12 октября, 5 «Б», 24 человека.')}</section>
      ${C.stages.map((s,i)=>`<details class="t-outcome" ${i===0?'open':''}><summary><span><b class="chapter-small">${String(i+1).padStart(2,'0')}</b>${e(s.name)}</span><span class="notebook-status">${T.outcomeFields.some(f=>(t.outcomes['s'+i+'-'+f.id]||'').trim())?'Есть записи':'Нет записей'}</span></summary><div class="notebook-body">${T.outcomeFields.map(f=>outcomeField('s'+i+'-'+f.id,f.label,f.hint)).join('')}</div></details>`).join('')}
      <section class="t-outcome-general">${outcomeField('summary','Общий итог и следующий шаг','Что получилось в целом, что сделать до следующего киноурока.')}</section><p class="local-explainer">Это педагогические наблюдения, а не оценка детей и не психологический диагноз.</p>`;
  }

  // ——— Энциклопедия: статья целиком ———
  function renderEncyclopedia(route){
    const key=[T.encKey,'schastye'].includes(route.sub)?route.sub:T.encKey,a=enc()?.articles?.[key];
    if(!a)return `${header('ЭНЦИКЛОПЕДИЯ','Энциклопедия качеств','Статья не загружена.')}`;
    const tabs=`<nav class="t-chips" aria-label="Статьи энциклопедии"><a href="#encyclopedia" class="${key===T.encKey?'active':''}">${e(enc()?.articles?.[T.encKey]?.name||'')}</a><a href="#encyclopedia/schastye" class="${key==='schastye'?'active':''}">Счастье</a></nav>`;
    const body=a.sections.map(sec=>sec.level===2?`<h2 class="t-enc-h2">${e(sec.title)}</h2>${sec.text.map(t=>'<p>'+e(t)+'</p>').join('')}`:`<section class="t-enc-sec"><h3>${e(sec.title)}</h3>${sec.text.map(t=>'<p>'+e(t)+'</p>').join('')}</section>`).join('');
    return `${header('ЭНЦИКЛОПЕДИЯ ПРИКЛАДНОЙ ЭТИКИ',a.name,'Статья целиком. Раздел 1.2 с карточками источников здесь не показан.',key==='schastye'?['#happiness','Раздел «Счастье»']:['#prep/intro','Подготовка · введение в качество'])}${encBadge()}${tabs}<article class="t-enc">${body}</article>`;
  }

  // ——— Сократовский тренажёр: разрушение деструктивной установки за семь шагов ———
  const soc=()=>window.SOCRATIC||null;
  const socItem=id=>soc()?.items.find(x=>x.id===id)||null;
  const socState=id=>{if(!t.socrat[id]){const it=socItem(id);t.socrat[id]={variant:it?.variants[0].variant||1,step:1,shown:{},notes:{},open:{},checks:{}};}return t.socrat[id];};
  const blocksHTML=list=>{let out='',ul=[];const flush=()=>{if(ul.length){out+='<ul class="t-list">'+ul.join('')+'</ul>';ul=[];}};for(const b of list){if(b.type==='li')ul.push('<li>'+e(b.text)+'</li>');else{flush();out+=b.type==='h'?'<h3>'+e(b.text)+'</h3>':'<p>'+e(b.text)+'</p>';}}flush();return out;};
  function socNote(id,key,label,hint){const st=socState(id);return `<div class="note-field"><label for="t-soc-${key}">${e(label)}</label>${hint?'<p>'+e(hint)+'</p>':''}<textarea id="t-soc-${key}" data-t-input data-t-soc-note="${id}|${key}" maxlength="5000" rows="3" placeholder="Ваша запись…">${e(st.notes[key]||'')}</textarea></div>`;}
  const item6=(id,v)=>{const o=socItem(id)?.variants.find(x=>x!==v&&!x.steps[5].missing);return o?` — он есть в варианте ${o.variant}`:'';};
  function socStep(id,v,step){
    const st=socState(id),k='v'+v.variant+'-s'+step.n,b=step.blocks,review=readOnly();
    if(step.missing)return `<p>В этом разборе шага «${e(step.title)}» нет${item6(id,v)}. Сформулируйте критерий сами: по каким вопросам вы узнаете, что установка снова взяла верх?</p>${socNote(id,k,'Мой практический критерий','')}`;
    const reveal=(label)=>st.open[k]||review?`<div class="t-soc-answer"><div class="eyebrow">РАЗБОР</div>${blocksHTML(b)}</div>`:`<button type="button" class="button primary" data-t-soc-open="${id}|${k}">${e(label)}</button>`;
    if(step.n===1)return `<p>Прочитайте установку и попробуйте сами развести понятия, которые в ней смешаны: что здесь может быть правдой, что — обобщение, что — метафора, какая есть альтернатива?</p>${socNote(id,k,'Какие понятия здесь смешаны','')}${reveal('Показать разбор понятий')}`;
    if(step.n===2||step.n===3){
      const shown=review?b.length:Math.min(Math.max(st.shown[k]||1,1),b.length);
      return `<p>${step.n===2?'Отвечайте на вопросы по одному, мысленно или письменно. Следующий вопрос откроется по кнопке.':'Проверьте, к каким выводам пришлось бы прийти, если принять установку.'}</p><div class="t-soc-chain">${blocksHTML(b.slice(0,shown))}</div>${shown<b.length?`<button type="button" class="button ghost" data-t-soc-next="${id}|${k}">Дальше · ${shown} из ${b.length}</button>`:'<p class="source-caption">Шаг пройден до конца.</p>'}${step.n===2?socNote(id,k,'Мои ответы на вопросы',''):''}`;
    }
    if(step.n===4)return `${socNote(id,k,'Сформулируйте вывод сами','Своими словами: что остаётся правдой, что оказалось ложью, что зависит от меня.')}${reveal('Сравнить с выводом из разбора')}`;
    if(step.n===5)return `${blocksHTML(b)}${socNote(id,k,'Мои ответы','')}`;
    if(step.n===6)return `<p>Инструмент самопроверки: когда мысль-установка возвращается, пройдите по вопросам.</p><ul class="t-soc-checks">${b.map((x,j)=>x.type==='li'?`<li><label><input type="checkbox" data-t-input data-t-soc-check="${id}|${k}-${j}" ${st.checks[k+'-'+j]||review?'checked':''}><span>${e(x.text)}</span></label></li>`:`<li class="t-soc-p">${e(x.text)}</li>`).join('')}</ul>`;
    return `${socNote(id,k,'Моя созидательная формула','Запишите формулу, которая заменит разрушительную установку.')}${reveal('Показать итоговую формулу')}`;
  }
  const socDone=id=>{const st=t.socrat[id];return Boolean(st&&Object.keys(st.notes).some(k=>/-s7$/.test(k)&&st.notes[k].trim())&&Object.keys(st.open).some(k=>/-s7$/.test(k)));};
  // Раздел «Счастье» — две вкладки: понятие счастья и разбор деструктивных установок.
  function happinessTabs(active){
    return `<nav class="t-segments t-happy-tabs" aria-label="Вкладки раздела «Счастье»"><a href="#happiness" class="${active==='about'?'active':''}" ${active==='about'?'aria-current="page"':''}><span>1</span>О счастье</a><a href="#socrat" class="${active==='socrat'?'active':''}" ${active==='socrat'?'aria-current="page"':''}><span>2</span>Разбор установок · ${(soc()?.items||[]).length}</a></nav>`;
  }
  // Библиотека: все разборы деструктивных установок педагога на одной странице.
  function renderSocratLibrary(){
    const S=soc(),done=S.items.filter(it=>socDone(it.id)).length;
    return `${header('РАЗДЕЛ «СЧАСТЬЕ» · СОКРАТОВСКИЙ МЕТОД','Разбор деструктивных установок','Мысли, которые отнимают у педагога силы и смысл, и их разбор вопросами — до созидательной формулы.')}${happinessTabs('socrat')}
      <section class="t-foundation"><div class="eyebrow">КАК УСТРОЕН РАЗБОР</div><p>Установку не опровергают готовым ответом. Её проходят вопросами, пока противоречие не станет видно самому человеку. Семь шагов:</p><ol class="t-list">${S.steps.map(x=>'<li>'+e(x)+'</li>').join('')}</ol><p class="source-caption">Тот же ход мысли дети проходят на уроке в «Операции Антидот»: разрушительная установка → созидательная установка → действие.</p></section>
      <div class="t-soc-libbar"><label for="t-soc-filter">Найти установку</label><input id="t-soc-filter" type="search" data-t-soc-filter placeholder="Например: ценят, будущее, система" autocomplete="off"><span>${S.items.length} установок · разобрано вами: ${done}</span></div>
      <div class="t-soc-list">${S.items.map(it=>{const st=t.socrat[it.id];return `<a class="t-map-stage" data-t-soc-row="${e(it.attitude.toLocaleLowerCase('ru'))}" href="#socrat/${it.id}">${check(socDone(it.id))}<span><strong>${e(it.number)}. ${e(it.attitude)}</strong><small>${it.variants.length} варианта разбора${st?' · вы на шаге '+st.step+' из 7':''}</small></span></a>`;}).join('')}</div>
      <p class="source-caption">${e(S.source)}. Тексты разборов приведены дословно.</p>`;
  }
  function renderSocrat(route){
    const S=soc();if(!S)return header('СОКРАТОВСКИЙ МЕТОД','Сократовский метод','Разборы не загружены.');
    if(!socItem(route.sub))return renderSocratLibrary();
    const id=route.sub,nx=S.items[S.items.findIndex(x=>x.id===route.sub)+1],item=socItem(id),st=socState(id),v=item.variants.find(x=>x.variant===st.variant)||item.variants[0],step=v.steps[st.step-1];
    const variants=item.variants.length>1?`<nav class="t-chips" aria-label="Вариант разбора">${item.variants.map(x=>`<button type="button" class="${x===v?'active':''}" data-t-soc-variant="${id}|${x.variant}">Вариант ${x.variant}${x.label?' · '+e(x.label):''}</button>`).join('')}</nav>`:'';
    const tabs=`<ol class="t-soc-steps">${v.steps.map(x=>`<li><button type="button" class="${x===step?'active':''}" data-t-soc-step="${id}|${x.n}"><b>${x.n}</b><span>${e(S.steps[x.n-1])}</span></button></li>`).join('')}</ol>`;
    return `${header('РАЗДЕЛ «СЧАСТЬЕ» · СОКРАТОВСКИЙ МЕТОД','Разрушить установку','Семь шагов: от смешанных понятий — к противоречию — к созидательной формуле.',['#socrat','Все установки'])}${happinessTabs('socrat')}
      <section class="t-soc-attitude"><div class="eyebrow">ДЕСТРУКТИВНАЯ УСТАНОВКА ${e(item.number)}</div><p>${e(item.attitude)}</p></section>${variants}${v.intro.length>1&&v.variant!==1?'<div class="t-soc-intro">'+v.intro.map(x=>'<p>'+e(x)+'</p>').join('')+'</div>':''}${tabs}
      <section class="t-prep-step t-soc-step"><div class="t-prep-head"><span class="eyebrow">ШАГ ${step.n} ИЗ 7</span><h2>${e(step.title)}</h2></div>${socStep(id,v,step)}</section>
      <nav class="step-navigation">${step.n>1?`<button type="button" class="button ghost" data-t-soc-step="${id}|${step.n-1}">← Шаг ${step.n-1}</button>`:'<a class="button ghost" href="#socrat">← Все установки</a>'}${step.n<7?`<button type="button" class="button primary" data-t-soc-step="${id}|${step.n+1}">Шаг ${step.n+1}: ${e(S.steps[step.n])} →</button>`:(nx?`<a class="button primary" href="#socrat/${nx.id}">Следующая установка ${nx.number} →</a>`:'<a class="button primary" href="#socrat">Готово · ко всем установкам →</a>')}</nav>
      <p class="source-caption">${e(S.source)}. Тексты разбора приведены дословно.</p>`;
  }

  // ——— Счастье ———
  function renderHappiness(){
    if(enc()?.articles?.schastye)return `${header('ДОПОЛНИТЕЛЬНЫЙ РАЗДЕЛ','Счастье','Понятие счастья по энциклопедии и работа с заблуждениями о нём.')}${happinessTabs('about')}${encBadge()}
      <section class="t-prep-step"><h2>Что такое счастье</h2>${encText('schastye','1.3.')}${encRef('schastye','1.3.')}<h3>Чем счастье отличается</h3>${encSec('schastye','2.').filter(x=>/^от |^Счастье/.test(x)).map(t=>'<p>'+e(t)+'</p>').join('')}${encRef('schastye','2.4.')}<h3>Формула</h3>${encSec('schastye','4.').slice(1,2).map(t=>'<p><strong>'+e(t)+'</strong></p>').join('')}${encRef('schastye','4.')}</section>
      <section class="t-prep-step"><h2>Заблуждения и созидательные установки</h2><div class="t-two"><div><h3>Разрушительные установки</h3><ul class="t-list">${encSec('schastye','5.3.').filter(x=>x.startsWith('«')).map(t=>'<li>'+e(t)+'</li>').join('')}</ul></div><div><h3>Конструктивные установки</h3><ul class="t-list">${encSec('schastye','5.9.').filter(x=>x.startsWith('«')).map(t=>'<li>'+e(t)+'</li>').join('')}</ul></div></div>${encRef('schastye','5.3.')}<h3>Антипод: ${e(encSec('schastye','5.4.')[0]||'')}</h3>${encText('schastye','5.5.')}${encRef('schastye','5.5.')}<p><a class="text-link" href="#encyclopedia/schastye">Статья «Счастье» целиком →</a></p></section>
      <section class="t-prep-step"><h2>Сократовский метод</h2><p>Заблуждение не опровергают готовым ответом: его разбирают вопросами, пока человек сам не увидит противоречие и не сформулирует созидательную установку. Разбор идёт в семь шагов:</p><ol class="t-list">${(soc()?.steps||[]).map(x=>'<li>'+e(x)+'</li>').join('')}</ol><a class="t-map-stage" href="#socrat"><span class="t-dot" aria-hidden="true">→</span><span><strong>Библиотека: ${(soc()?.items||[]).length} деструктивных установок педагога</strong><small>разбор каждой за семь шагов · вопросы, противоречие, созидательная формула</small></span></a></section><div class="actions"><a class="button ghost" href="#map">← Маршрутная карта</a></div>`;
    return `${header('ДОПОЛНИТЕЛЬНЫЙ РАЗДЕЛ','Счастье','Раздел готовится вместе с командой проекта.')}<section class="t-prep-step pending"><div class="t-prep-head"><span class="t-dot wait" aria-hidden="true">…</span><h2>Что здесь будет</h2>${pendingBadge}</div><ul class="t-list"><li>Понятие счастья по «Энциклопедии прикладной этики».</li><li>Сократовский метод: разрушение заблуждений и формирование созидательных установок — по формулировке энциклопедии.</li><li>Интерактивные задания для педагога и учеников.</li></ul><p class="source-caption">Содержание появится после получения исходного текста энциклопедии. До этого раздел не заполняется догадками.</p></section><div class="actions"><a class="button ghost" href="#map">← Маршрутная карта</a></div>`;
  }

  // ——— Персонаж-подсказчик ———
  function guideText(route){
    const s=app();
    if(route.view==='prep'||route.view==='map'||route.view==='start'){
      if(!prepReady()){const next=prepSteps().find(x=>!x.pending&&!x.done),here=route.view==='prep'&&next.href==='#prep/'+route.sub;return {text:'Шаг '+num(next)+' «'+next.title+'»: '+prepHow[next.n]+'. Когда шаг засчитается, я поведу дальше.',href:here?null:next.href,label:'Открыть шаг '+num(next)};}
      const i=C.stages.findIndex((_,n)=>!s.completed.includes(n));
      return i<0?{text:'Все этапы пройдены. Осталось зафиксировать итоги урока.',href:'#outcomes',label:'К итогам'}:{text:'Подготовка готова. Жмите «Старт» — этап '+(i+1)+' «'+C.stages[i].name+'».',href:'#stage/'+i+'/read',label:'Старт'};
    }
    if(route.view==='stage'){
      const i=route.stage,total=stagePages(i).length,done=stageStudentDone(i),name=C.stages[i].name;
      if(route.tab==='read')return done<total?{text:'Этап «'+name+'». Сначала выполните задания ученика: готово '+done+' из '+total+'. Потом прочитайте пояснения педагогу.',href:null}:{text:'Задания ученика выполнены. Прочитайте пояснения педагогу и переходите к практикуму.',href:'#stage/'+i+'/practice',label:'Практикум'};
      if(route.tab==='practice')return {text:'Проверьте себя на заданиях и решите педагогический кейс. Попытки не ограничены.',href:null};
      return {text:'Запишите свой план этапа и сверьте его с критериями. После урока вернитесь в «Итоги».',href:'#outcomes',label:'Итоги'};
    }
    if(route.view==='student')return {text:'Это тетрадь для детей. Выберите этап и нажмите «Печать» — каждый лист выйдет отдельно.',href:null};
    if(route.view==='workbook')return {text:'Проходите эти задания сами, как ученик. Отмечать выполненное удобнее на этапах «Старта».',href:'#stage/0/read',label:'К этапу 1'};
    if(route.view==='outcomes')return {text:'Запишите по каждому этапу: что прошло, что заметили у детей, что изменить.',href:null};
    if(route.view==='happiness')return {text:'Сравните заблуждения о счастье с созидательными установками. Во второй вкладке — разбор 21 установки педагога.',href:'#socrat',label:'Разбор установок'};
    if(route.view==='socrat')return socItem(route.sub)?{text:'Не торопитесь к разбору: сначала ответьте сами, потом сравните. Так метод работает и с детьми.',href:'#socrat',label:'Все установки'}:{text:'Выберите мысль, которая звучит знакомо, — с неё и начните. Остальные можно проходить в любом порядке.',href:null};
    if(route.view==='encyclopedia')return {text:'Энциклопедия — рабочая редакция. Опирайтесь на определение, антипод и установки; пустые места ещё дорабатываются.',href:'#prep/exam',label:'К экзамену'};
    if(route.view==='film')return s.preparation.film?{text:'Фильм отмечен как просмотренный. Эпизоды справа помогают на этапах «Чувство» и дальше.',href:'#prep',label:'К подготовке'}:{text:'Посмотрите фильм целиком, включая титры, и отметьте это галочкой под плеером.',href:null};
    if(route.view==='materials')return {text:'Здесь три документа комплекта: паспорт, обоснование и тетрадь. Отметьте знакомство с ними в подготовке.',href:'#prep',label:'К подготовке'};
    if(route.view==='notebook'||route.view==='result')return {text:'Здесь собраны ваши записи по этапам. Итоги проведённого урока — в отдельном разделе.',href:'#outcomes',label:'Итоги'};
    return {text:'Не теряйтесь: вся последовательность — на маршрутной карте.',href:'#map',label:'Маршрутная карта'};
  }
  // Три сопровождающих, каждый в своём моменте маршрута:
  // Хлопушка — ведёт по маршруту и фильму; Весовщик — смысл качества, экзамен, этапы с Весами; Фонарик — класс, тетради, итоги, праздник.
  const guides={
    clapper:{name:'Хлопушка',role:'ведёт по маршруту',svg:'<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="#122e46"/><g transform="rotate(-12 40 34)"><rect x="22" y="26" width="76" height="14" rx="3" fill="#fff"/><path d="M34 26l-6 14M52 26l-6 14M70 26l-6 14M88 26l-6 14" stroke="#122e46" stroke-width="5"/></g><rect x="22" y="44" width="76" height="46" rx="8" fill="#fff"/><circle cx="46" cy="64" r="5" fill="#122e46"/><circle cx="74" cy="64" r="5" fill="#122e46"/><path d="M48 76c7 6 17 6 24 0" stroke="#122e46" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="98" cy="88" r="15" fill="#efb466"/><path d="M89 86h18M98 82v12M91 86l-3 6h6zM105 86l-3 6h6z" stroke="#122e46" stroke-width="2" fill="none"/></svg>'},
    scales:{name:'Весовщик',role:'хранит смысл качества',svg:'<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="#eaf0fb"/><path d="M60 28v62" stroke="#122e46" stroke-width="5"/><path d="M24 44h72" stroke="#122e46" stroke-width="5" stroke-linecap="round"/><path d="M24 44l-10 24h20zM96 44l-10 24h20z" fill="none" stroke="#122e46" stroke-width="3"/><path d="M12 68a12 6 0 0 0 24 0zM84 68a12 6 0 0 0 24 0z" fill="#efb466"/><circle cx="60" cy="30" r="15" fill="#fff4dd" stroke="#122e46" stroke-width="3"/><circle cx="55" cy="29" r="2.5" fill="#122e46"/><circle cx="65" cy="29" r="2.5" fill="#122e46"/><path d="M55 35c3 3 7 3 10 0" stroke="#122e46" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M42 92h36" stroke="#122e46" stroke-width="6" stroke-linecap="round"/></svg>'},
    lantern:{name:'Фонарик',role:'помогает в классе',svg:'<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="#efb466"/><path d="M42 22h36l-5 12H47z" fill="#122e46"/><rect x="36" y="34" width="48" height="54" rx="16" fill="#fff4dd"/><circle cx="50" cy="58" r="5" fill="#122e46"/><circle cx="70" cy="58" r="5" fill="#122e46"/><path d="M49 71c6 6 16 6 22 0" stroke="#122e46" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M46 88h28v8H46z" fill="#122e46"/><path d="M60 10v12" stroke="#122e46" stroke-width="4"/></svg>'}
  };
  function guideFor(route){
    if(route.view==='prep')return ['intro','exam'].includes(route.sub)?guides.scales:guides.clapper;
    if(route.view==='stage'){
      if(route.tab==='plan')return guides.lantern;
      return [1].includes(route.stage)?guides.clapper:[0,2,3,4].includes(route.stage)?guides.scales:guides.lantern;
    }
    if(['encyclopedia','socrat','happiness'].includes(route.view))return guides.scales;
    if(['student','workbook','outcomes','happiness'].includes(route.view))return guides.lantern;
    return guides.clapper;
  }
  function guide(route){
    const g=guideText(route),who=guideFor(route);
    if(t.guideHidden)return `<button type="button" class="t-guide-min t-noprint" data-t-guide="show" aria-label="Показать подсказки: ${e(who.name)}">${who.svg}</button>`;
    return `<aside class="t-guide t-noprint" aria-label="Подсказка: ${e(who.name)}"><div class="t-guide-face">${who.svg}</div><div class="t-guide-body"><strong>${e(who.name)}</strong> <small>${e(who.role)}</small><p>${e(g.text)}</p><div class="t-guide-actions">${g.href?`<a href="${e(g.href)}">${e(g.label)} →</a>`:''}${route.view!=='map'&&g.href!=='#map'?'<a href="#map">Карта</a>':''}<button type="button" data-t-guide="hide">Свернуть</button></div></div></aside>`;
  }

  // ——— События (вызываются из обработчиков приложения) ———
  function click(el){
    const d=el.dataset||{};
    if(d.tGuide!==undefined){t.guideHidden=d.tGuide==='hide';save();ctx.render();return true;}
    if(d.tPrint!==undefined){openForPrint();window.print();return true;}
    const socArg=v=>{const [id,x]=String(v).split('|');return socItem(id)?[id,x]:null;};
    if(d.tSocStep!==undefined){const a=socArg(d.tSocStep);if(!a)return true;const n=Number(a[1]);if(n>=1&&n<=7){socState(a[0]).step=n;if(!readOnly())save();ctx.render();window.scrollTo?.({top:0});}return true;}
    if(d.tSocVariant!==undefined){const a=socArg(d.tSocVariant);if(!a)return true;const n=Number(a[1]);if(socItem(a[0]).variants.some(x=>x.variant===n)){socState(a[0]).variant=n;if(!readOnly())save();ctx.render();}return true;}
    if(readOnly()&&(d.tSocNext!==undefined||d.tSocOpen!==undefined))return true;
    if(d.tSocNext!==undefined){const a=socArg(d.tSocNext);if(!a||!/^v\d+-s[23]$/.test(a[1]))return true;const st=socState(a[0]);st.shown[a[1]]=Math.max(st.shown[a[1]]||1,1)+1;save();ctx.render();return true;}
    if(d.tSocOpen!==undefined){const a=socArg(d.tSocOpen);if(!a||!/^v\d+-s[147]$/.test(a[1]))return true;socState(a[0]).open[a[1]]=true;save();ctx.render();return true;}
    if(readOnly()&&(d.tCheck!==undefined||d.tMove!==undefined))return true;
    if(d.tMove!==undefined){const q=T.exam.find(x=>x.id===d.tMove);if(!q)return true;const a=[...examValue(q)],from=Number(d.from),to=from+Number(d.delta);if(to<0||to>=a.length)return true;[a[from],a[to]]=[a[to],a[from]];t.exam.answers[q.id]=a;delete t.exam.checked[q.id];save();ctx.render();document.querySelector(`[data-t-move="${q.id}"][data-from="${to}"]:not(:disabled)`)?.focus({preventScroll:true});ctx.announce(q.items[a[to]]+' — позиция '+(to+1));return true;}
    if(d.tCheck!==undefined){const q=T.exam.find(x=>x.id===d.tCheck);if(!q)return true;const v=examValue(q);if(v===undefined){ctx.announce('Сначала выберите ответ.');return true;}t.exam.answers[q.id]=v;t.exam.checked[q.id]=true;save();ctx.render();document.getElementById('t-quiz-'+q.id)?.focus({preventScroll:true});ctx.announce(grade(q,v)?'Ответ верный.':'Пока не совпало. Прочитайте разбор.');return true;}
    return false;
  }
  function change(el){
    const d=el.dataset||{};
    if(readOnly()&&d.tInput!==undefined)return true;
    if(d.tAnswer!==undefined){const q=T.exam.find(x=>x.id===d.tAnswer);if(!q)return true;t.exam.answers[q.id]=Number(el.value);delete t.exam.checked[q.id];save();ctx.render();return true;}
    if(d.tStudent!==undefined){const p=String(d.tStudent);if(!pageKeys.has(p))return true;if(el.checked)t.studentDone[p]=true;else delete t.studentDone[p];save();ctx.render();return true;}
    if(d.tSocCheck!==undefined){const [id,k]=String(d.tSocCheck).split('|');if(!socItem(id)||!/^v\d+-s6-\d{1,3}$/.test(k||''))return true;const st=socState(id);if(el.checked)st.checks[k]=true;else delete st.checks[k];save();return true;}
    if(d.tPrep!==undefined){if(!['intro','workbook','print','course'].includes(d.tPrep))return true;t.prep[d.tPrep]=el.checked===true;save();ctx.render();return true;}
    return false;
  }
  function input(el){
    const d=el.dataset||{};
    if(d.tSocFilter!==undefined){const q=String(el.value).trim().toLocaleLowerCase('ru');document.querySelectorAll?.('[data-t-soc-row]').forEach(r=>{r.hidden=Boolean(q)&&!r.dataset.tSocRow.includes(q);});return true;}
    if(d.tSocNote!==undefined){if(readOnly())return true;const [id,k]=String(d.tSocNote).split('|');if(!socItem(id)||!/^v\d+-s[1-7]$/.test(k||''))return true;socState(id).notes[k]=String(el.value).slice(0,5000);save();return true;}
    if(d.tOutcome===undefined)return false;
    if(readOnly()||!outcomeKeys.has(d.tOutcome))return true;
    t.outcomes[d.tOutcome]=String(el.value).slice(0,5000);save();
    const mirror=document.querySelector(`[data-t-print-value="${d.tOutcome}"]`);if(mirror)mirror.textContent=t.outcomes[d.tOutcome]||'—';
    return true;
  }
  function afterSources(route){
    if(route.view==='stage'&&route.tab==='read'){const notes=document.getElementById('t-teacher-notes');if(notes)notes.innerHTML=teacherNotes(route.stage);const list=document.getElementById('t-student-list');if(list)list.innerHTML=studentList(route.stage);}
    if(route.view==='student'||route.view==='workbook'){const pages=document.getElementById('t-student-pages');if(pages)ctx.render();}
  }
  function render(route){
    return route.view==='map'?renderMap():route.view==='prep'?renderPrep(route):route.view==='student'?renderStudent(route):route.view==='workbook'?renderWorkbook(route):route.view==='encyclopedia'?renderEncyclopedia(route):route.view==='socrat'?renderSocrat(route):route.view==='outcomes'?renderOutcomes():renderHappiness();
  }
  function refreshGuide(route){const el=document.querySelector?.('.t-guide,.t-guide-min');if(el)el.outerHTML=guide(route);}
  return {views,refreshGuide,render,sidebar,startPanel,stageBlock,teacherNotes,guide,click,change,input,afterSources,state:()=>t,examPassed,prepReady};
};
