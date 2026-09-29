'use strict';
// Педагогический контур курса «Великий» по отзыву команды проекта 29.09.2026:
// маршрутная карта (Подготовка → Старт → Итоги), педагог проходит задания как ученик,
// пояснения педагогу по первоисточникам, экзамен на понимание качества, печатная тетрадь ученика,
// фиксация результатов и персонаж-подсказчик. Эталонные документы не изменяются:
// пояснения выводятся из паспорта и обоснования без пересказа.
window.TEACHER = {
  storageKey: 'kinouroki.justice.teacher.v1',
  guideName: 'Проводник',
  // Страницы исходной рабочей тетради, которые ученик выполняет на каждом этапе маршрута из восьми этапов.
  studentPages: [
    [0,1,2,3,4,5,6,7,8,9,10,12,13,14],
    [11,15],
    [16,17,18,19,20,21,22,23,24],
    [25,26,27,28,29,30,31,32,33,34,35,36,37,38,39],
    [40,41,42,43,44,45,46,47,48,49,50,51,52,53],
    [54,55,56,57,58,59,60,61,62,63,64,65,66,67,68],
    [60,62,65],
    [69,70,71,72,73,'74-80',81,82,83,84,85]
  ],
  // Разделы исходной тетради ученика для печати (нумерация страниц — по оригиналу).
  workbookParts: [
    {id:'intro', name:'Введение', pages:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]},
    {id:'feel', name:'Чувство', pages:[15,16,17,18,19,20,21,22,23,24]},
    {id:'thought', name:'Мысль', pages:[25,26,27,28,29,30,31,32,33,34,35,36,37,38,39]},
    {id:'conscious', name:'Сознание', pages:[40,41,42,43,44,45,46,47,48,49,50,51,52,53]},
    {id:'imagine', name:'Воображение', pages:[54,55,56,57,58,59,60,61,62,63,64,65,66,67,68]},
    {id:'inspire', name:'Воодушевление', pages:[69,70,71,72,73,'74-80',81,82,83,84,85]}
  ],
  // Рабочая тетрадь ученика для класса: листы эталонной тетради, отобранные по «ключевым блокам» паспорта (разделы 5.1–5.6).
  // Состав — предложение на согласование с командой проекта; тексты листов не меняются.
  classWorkbook: [
    {id:'intro',stage:'Введение',items:[['Паспорт исследователя','',[0]],['Метафора «Весы в сердце»','2 мин',[2]],['Интерактив «Четвёртый лишний»','2 мин',[3]],['Интерактив «Собери определение»','2 мин',[4]],['Интерактив «Весы Соломона»','2 мин',[5]],['Интерактив «Антипод-детектор»','1 мин',[6]],['Самодиагностика «Точка А»','1 мин',[9]],['Трекер роста «Мои Весы» — сквозная карта','',[14]]]},
    {id:'feel',stage:'Чувство',items:[['Карта отклика сердца: 7 сцен фильма','',[18]],['Термометр чувств','',[19]],['Самодиагностика','',[22]]]},
    {id:'thought',stage:'Мысль',items:[['Метафора «Мысль — гиря»','1 мин',[27]],['Алгоритм калибровки','3 мин',[28]],['Калибровка ×2/÷7','2 мин',[29]],['Групповой анализ «Дневник мыслей героя»','4 мин',[30]],['Две ключевые мысли','2 мин',[31]],['Созидательный алгоритм','1 мин',[33]],['Карта влияния','1 мин',[34]],['Самодиагностика','',[39]]]},
    {id:'conscious',stage:'Сознание',items:[['Метафора «Весы в повседневной жизни»','1 мин',[42]],['Фабрика справедливости · Блок А. Лестница роста','',[43]],['Фабрика справедливости · Блок Б. Операция «Антидот»','',[44]],['Фабрика справедливости · Блок В. Карта моего роста','',[47]],['Самодиагностика «Точка Б»','1 мин',[48]],['Договор с собой','1 мин',[49]]]},
    {id:'imagine',stage:'Воображение',items:[['Метафора «Весы будущего»','1 мин',[56]],['Выбор практики: мозговой штурм и голосование','',[58,59]],['Паспорт проекта справедливости','6 мин',[60]],['Самодиагностика','1 мин',[64]],['Трюизм и мостик','1 мин',[66]]]},
    {id:'practice',stage:'Социальная практика',items:[['Мой личный вклад','',[62]],['Договор команды','',[65]]]},
    {id:'inspire',stage:'Воодушевление',items:[['Сравнительный итог Весов','1 мин',[71]],['Эстафета этапов','1 мин',[72]],['Аллея рекордов справедливости','5 мин',['74-80',81]],['Финальный хор','2 мин',[82]]]}
  ],
  // Дословно из паспорта пособия, раздел 5.1.
  quality: {
    definition: 'Справедливость — это способность остро ощущать дисбаланс между поступками, заслугами и их оценкой, и стремление восстановить должный порядок.',
    antipode: 'Произвол (пристрастность) — решение в пользу личной выгоды, обиды или симпатии, без учёта объективности и должного порядка.',
    concepts: ['Весы в сердце (метафора)','Гири-качества (правая чаша 🌱)','Оковы-антиподы (левая чаша 🕳️)','Произвол (антипод справедливости)','Эталонные Весы (3 принципа)']
  },
  // Экзамен на понимание качества. Основание — паспорт и обоснование; после добавления раздела энциклопедии дополняется.
  exam: [
    {id:'exam-definition',type:'single',title:'Какое определение справедливости дано в паспорте?',options:['Справедливость — это способность остро ощущать дисбаланс между поступками, заслугами и их оценкой, и стремление восстановить должный порядок.','Справедливость — это когда всем достаётся поровну, без исключений.','Справедливость — это наказание для каждого, кто нарушил правило.'],answer:0,explanation:'Верно первое определение — оно дословно из паспорта. Два других варианта похожи на маски, которые дети учатся отличать в интерактиве «Четвёртый лишний»: уравниловку и месть.',ref:'Паспорт пособия · раздел 5.1'},
    {id:'exam-antipode',type:'single',title:'Как паспорт определяет антипод справедливости?',options:['Произвол — любое решение, с которым не согласен хотя бы один участник.','Произвол (пристрастность) — решение в пользу личной выгоды, обиды или симпатии, без учёта объективности и должного порядка.','Произвол — строгое соблюдение правил без исключений.'],answer:1,explanation:'Антипод — произвол (пристрастность). Его признак — решение из выгоды, обиды или симпатии. Несогласие участников и строгость правил сами по себе произволом не являются.',ref:'Паспорт пособия · раздел 5.1'},
    {id:'exam-masks',type:'single',title:'Какие маски произвола различают дети в интерактиве «Четвёртый лишний»?',options:['Страх, лень, зависть','Робость, гордость, обида','Месть, уравниловка, предвзятость'],answer:2,explanation:'В паспорте интерактив описан так: различение масок — месть, уравниловка, предвзятость. Эти маски выдают себя за справедливость.',ref:'Паспорт пособия · раздел 5.1; тетрадь · страница 3'},
    {id:'exam-scales',type:'single',title:'Что лежит на чашах «Весов в сердце»?',options:['Левая чаша — оковы-антиподы, правая чаша — гири-качества','Левая чаша — хорошие поступки, правая — плохие','Левая чаша — мысли, правая — чувства'],answer:0,explanation:'Устройство Весов по паспорту: левая чаша — оковы, правая — гири-качества, между ними стрелка. Этот образ — общий язык всего киноурока.',ref:'Паспорт пособия · раздел 5.1; тетрадь · страница 2'},
    {id:'exam-principles',type:'single',title:'Какой пункт НЕ входит в три принципа Эталонных Весов?',options:['Будущее важнее настоящего','Общественные интересы выше личных','Большинство всегда право','Личные качества ценнее материальных благ'],answer:2,explanation:'Три принципа Эталонных Весов: будущее важнее настоящего; общественные интересы выше личных; личные качества ценнее материальных благ. «Большинство всегда право» среди них нет.',ref:'Паспорт пособия · раздел 5.3'},
    {id:'exam-point-a',type:'single',title:'Что такое «Точка А» по методическому обоснованию?',options:['Оценка поведения ребёнка, которую ставит педагог','Стартовая позиция ребёнка, от которой он будет двигаться; это не оценка','Балл за выполнение вводных заданий'],answer:1,explanation:'Обоснование прямо говорит: Точка А — не оценка ребёнка, а стартовая позиция. Она снимает тревожность: начать можно с любой точки.',ref:'Методическое обоснование · раздел 2.2.2'},
    {id:'exam-path',type:'order',title:'Восстановите путь присвоения ценности',prompt:'Перемещайте шаги стрелками. Порядок должен совпасть с методическим обоснованием.',items:['ВНЕШНЕЕ (герой фильма)','ЭМОЦИОНАЛЬНОЕ (этап «Чувство»)','СМЫСЛОВОЕ (этап «Мысль»)','ЛИЧНОСТНОЕ (этап «Сознание»)','ПРОЕКТНОЕ (этап «Воображение»)','ИСТОРИЧЕСКОЕ (этап «Воодушевление»)','ВНУТРЕННЕЕ (установка-регулятор)'],initial:[2,0,4,1,6,3,5],answer:[0,1,2,3,4,5,6],explanation:'По обоснованию ценность проходит путь от внешнего (герой фильма) через эмоциональное, смысловое, личностное, проектное и историческое к внутреннему — установке-регулятору. Пропуск этапа даёт неполную установку.',ref:'Методическое обоснование · раздел 2.2.1'}
  ],
  outcomeFields: [
    {id:'plan',label:'Что прошло по плану',hint:'Какие задания и формы удалось провести.'},
    {id:'kids',label:'Что заметили у детей',hint:'Наблюдаемые действия и высказывания — без оценки личности ребёнка.'},
    {id:'next',label:'Что изменить в следующий раз',hint:'Время, вопросы, порядок заданий.'}
  ]
};

window.TeacherUI = function(ctx){
  const T=window.TEACHER, C=ctx.C, e=ctx.e, N=C.stages.length;
  const views=['map','prep','student','workbook','outcomes','happiness'];
  const blank=()=>({version:1,studentDone:{},exam:{answers:{},checked:{}},prep:{intro:false,workbook:false,print:false},outcomes:{},guideHidden:false});
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
    s.prep.intro=input.prep?.intro===true;s.prep.workbook=input.prep?.workbook===true;s.prep.print=input.prep?.print===true;
    for(const k of Object.keys(input.outcomes||{}))if(outcomeKeys.has(k)&&typeof input.outcomes[k]==='string')s.outcomes[k]=input.outcomes[k].slice(0,5000);
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
      {n:'П1',title:'Полный фильм',done:s.preparation.film,href:'#film'},
      {n:'П2',title:'Методический комплект',done:s.preparation.sources,href:'#materials'},
      {n:'П3',title:'Введение в качество',done:t.prep.intro,href:'#prep/intro'},
      {n:'П4',title:'Экзамен на понимание качества',done:examPassed(),href:'#prep/exam'},
      {n:'П5',title:'Сводная рабочая тетрадь — пройти самому',done:t.prep.workbook,href:'#prep/workbook-step'},
      {n:'П6',title:'Курс обучения методике',pending:true,href:'#prep/method'},
      {n:'П7',title:'Рабочая тетрадь ученика — распечатать',done:t.prep.print,href:'#student'}
    ];
  };
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

  // ——— Боковое меню и старт ———
  function sidebar(route){
    const on=v=>route.view===v?'active':'';
    return `<div class="t-sidebar"><div class="course-label">МАРШРУТНАЯ КАРТА</div><a class="t-side-link ${on('map')}" href="#map">Вся карта урока</a><div class="t-side-steps"><a class="${on('prep')}" href="#prep"><b>Подготовка</b><small>${prepCount()}</small></a><a class="${route.view==='stage'?'active':''}" href="#stage/0/read"><b>Старт</b><small>${app().completed.length} из ${N}</small></a><a class="${on('outcomes')}" href="#outcomes"><b>Итоги</b><small>${outcomeFilled()?'записи есть':'после урока'}</small></a></div><a class="t-side-link ${on('student')}" href="#student">Рабочая тетрадь ученика</a><a class="t-side-link ${on('workbook')}" href="#workbook">Сводная тетрадь (эталон)</a><a class="t-side-link ${on('happiness')}" href="#happiness">Раздел «Счастье»</a></div>`;
  }
  function segmented(active){
    return `<nav class="t-segments" aria-label="Разделы маршрутной карты"><a href="#prep" class="${active==='prep'?'active':''}"><span>01</span>Подготовка</a><a href="#stage/0/read" class="${active==='start'?'active':''}"><span>02</span>Старт</a><a href="#outcomes" class="${active==='outcomes'?'active':''}"><span>03</span>Итоги</a></nav>`;
  }
  function startPanel(){
    return `<section class="t-start"><div><span class="eyebrow">МАРШРУТНАЯ КАРТА КИНОУРОКА</span><h2>Подготовка → Старт → Итоги</h2><p>Сначала вы готовитесь сами, затем проводите урок по восьми этапам, проходя каждое задание как ученик, и в конце фиксируете результаты.</p></div>${segmented('')}<a class="text-link" href="#map">Открыть всю карту →</a></section>`;
  }

  // ——— Маршрутная карта ———
  function renderMap(){
    const s=app(),steps=prepSteps();
    const stageRow=(st,i)=>{const done=s.completed.includes(i),total=stagePages(i).length;return `<a class="t-map-stage" href="#stage/${i}/read">${check(done)}<span><strong>${String(i+1).padStart(2,'0')} · ${e(st.name)}</strong><small>${st.minutes>0?e(st.minutes)+' мин · ':''}как ученик: ${stageStudentDone(i)} из ${total}</small></span></a>`;};
    const group=(title,note,from,to)=>`<div class="t-map-group"><div class="t-map-group-head"><b>${title}</b><small>${note}</small></div>${C.stages.slice(from,to).map((st,k)=>stageRow(st,from+k)).join('')}</div>`;
    return `${header('МАРШРУТНАЯ КАРТА','Весь киноурок на одной карте','Три раздела: подготовка педагога, проведение урока по восьми этапам и фиксация результатов.')}${segmented('')}
      <ol class="t-map">
        <li class="t-map-block"><div class="t-map-num">01</div><div class="t-map-body"><div class="t-map-title"><h2>Подготовка</h2><span>${prepCount()}</span></div><p>Педагог один, до урока. Смысл качества, экзамен, фильм, комплект и тетради.</p>${steps.map(x=>`<a class="t-map-stage" href="${x.href}">${x.pending?'<span class="t-dot wait" aria-hidden="true">…</span>':check(x.done)}<span><strong>${x.n} · ${e(x.title)}</strong><small>${x.pending?'ожидает материала':x.done?'готово':'не выполнено'}</small></span></a>`).join('')}<a class="button primary" href="#prep">Открыть подготовку →</a></div></li>
        <li class="t-map-block"><div class="t-map-num">02</div><div class="t-map-body"><div class="t-map-title"><h2>Старт</h2><span>${s.completed.length} из ${N}</span></div><p>Урок с классом. На каждом этапе вы сначала выполняете задания ученика, затем читаете пояснения педагогу.</p>${group('На уроке','этапы 1–6 — в классе',0,6)}${group('Общее дело','вне урока, по срокам выбранного дела',6,7)}${group('Праздник успехов','после выполненного дела',7,8)}<a class="button primary" href="#stage/0/read">Старт: этап 1 →</a></div></li>
        <li class="t-map-block"><div class="t-map-num">03</div><div class="t-map-body"><div class="t-map-title"><h2>Итоги</h2><span>${outcomeFilled()} записей</span></div><p>После урока и общего дела: что прошло по плану, что заметили у детей, что изменить. По каждому этапу.</p><a class="button primary" href="#outcomes">Зафиксировать итоги →</a></div></li>
      </ol>`;
  }
  function header(kicker,title,subtitle){return `<nav class="context-nav"><a href="#start">← Подготовка и маршрут</a></nav><div class="section-kicker">${e(kicker)}</div><h1>${e(title)}</h1><p class="subtitle page-subtitle">${e(subtitle)}</p>`;}

  // ——— Подготовка ———
  function renderExamQuestion(q,num){
    const review=readOnly(),value=review?q.answer:examValue(q),checked=review||t.exam.checked[q.id],passed=checked&&grade(q,value);
    let controls='';
    if(q.type==='single')controls=`<fieldset><legend class="sr-only">${e(q.title)}</legend>${q.options.map((o,j)=>`<label class="choice ${value===j?'selected':''}"><input type="radio" name="${q.id}" data-t-input data-t-answer="${q.id}" value="${j}" ${value===j?'checked':''}><span>${e(o)}</span></label>`).join('')}</fieldset>`;
    if(q.type==='order')controls=`<ol class="order-list">${value.map((v,j)=>`<li><span class="order-index">${j+1}</span><strong>${e(q.items[v])}</strong><span class="order-controls"><button type="button" class="icon-button" data-t-input data-t-move="${q.id}" data-from="${j}" data-delta="-1" ${j===0?'disabled':''} aria-label="Поднять ${e(q.items[v])}">↑</button><button type="button" class="icon-button" data-t-input data-t-move="${q.id}" data-from="${j}" data-delta="1" ${j===value.length-1?'disabled':''} aria-label="Опустить ${e(q.items[v])}">↓</button></span></li>`).join('')}</ol>`;
    return `<section class="quiz" id="t-quiz-${q.id}" tabindex="-1"><div class="quiz-top"><span class="eyebrow">ВОПРОС ${String(num+1).padStart(2,'0')} ИЗ ${String(T.exam.length).padStart(2,'0')}</span>${passed?'<span class="success-label">'+(review?'Разбор':'✓ Верно')+'</span>':''}</div><h2>${e(q.title)}</h2>${q.prompt?'<p>'+e(q.prompt)+'</p>':''}${controls}<div class="quiz-actions">${review?'<span class="review-key">Показан ответ и разбор</span>':`<button type="button" class="button ${passed?'ghost':'primary'}" data-t-check="${q.id}">${checked?'Проверить ещё раз':'Проверить ответ'}</button>`}<span class="source-caption">${e(q.ref)}</span></div>${checked?`<div class="feedback ${passed?'positive':'retry'}" role="status"><strong>${passed?'Верно':'Пока не совпало'}</strong><p>${e(q.explanation)}</p>${!passed?'<span>Измените ответ и проверьте снова.</span>':''}</div>`:''}</section>`;
  }
  function renderPrep(route){
    const s=app(),steps=prepSteps(),Q=T.quality;
    const card=(x,body)=>`<section class="t-prep-step ${x.done?'done':''} ${x.pending?'pending':''}" id="${({'П3':'intro','П4':'exam','П5':'workbook-step','П6':'method','П7':'print-step'})[x.n]||'prep-'+x.n}"><div class="t-prep-head">${x.pending?'<span class="t-dot wait" aria-hidden="true">…</span>':check(x.done)}<span class="eyebrow">${x.n}</span><h2>${e(x.title)}</h2>${x.pending?pendingBadge:''}</div>${body}</section>`;
    const box=(key,label,checked)=>`<label class="read-check"><input type="checkbox" ${key.startsWith('app:')?'data-preparation="'+key.slice(4)+'"':'data-t-input data-t-prep="'+key+'"'} ${checked?'checked':''}><span>${label}</span></label>`;
    return `${header('РАЗДЕЛ 01 · ДО УРОКА','Подготовка','Вы проходите подготовку один. Отметки сохраняются в этом браузере.')}${segmented('prep')}
      <div class="t-prep-progress"><b>${prepCount()}</b><span>шагов подготовки выполнено</span>${prepReady()?'<a class="button primary" href="#stage/0/read">Готово — перейти к старту →</a>':''}</div>
      ${card(steps[0],`<p>${e(ctx.M.filmPrepText)}</p><a class="text-link" href="#film">${e(ctx.M.filmNavLabel)} · ${e(ctx.M.filmDuration)} →</a>${box('app:film','Я посмотрел(а) полный фильм',s.preparation.film)}`)}
      ${card(steps[1],'<p>Паспорт задаёт структуру; обоснование раскрывает логику; тетрадь содержит задания и формы.</p><a class="text-link" href="#materials">Открыть материалы →</a>'+box('app:sources','Я ознакомился(ась) с назначением трёх документов',s.preparation.sources))}
      ${card(steps[2],`<div class="t-pending-note"><strong>Раздел о качестве из «Энциклопедии прикладной этики» будет добавлен.</strong><span>Пока введение построено на паспорте пособия. Формулировки ниже приведены дословно.</span></div><div class="definition"><h3>Определение качества</h3><p>${e(Q.definition)}</p><span class="source-caption">Паспорт пособия · раздел 5.1</span></div><div class="definition"><h3>Определение антипода</h3><p>${e(Q.antipode)}</p><span class="source-caption">Паспорт пособия · раздел 5.1</span></div><h3>Ключевые понятия этапа «Введение»</h3><ul class="t-list">${Q.concepts.map(c=>'<li>'+e(c)+'</li>').join('')}</ul>${ctx.sourceButton('Паспорт · этап «Введение»','passport',null,'5.1.')}${ctx.sourceButton('Обоснование · задача «Введения»','rationale',null,'2.2.2.')}${box('intro','Я изучил(а) введение в качество',t.prep.intro)}`)}
      ${card(steps[3],`<p>Экзамен проверяет понимание качества перед уроком: ${T.exam.length} вопросов по паспорту и обоснованию. Попытки не ограничены. Когда будет добавлен раздел энциклопедии, вопросы дополнятся.</p><p class="t-score">Верных ответов: <b>${examScore()} из ${T.exam.length}</b></p>${T.exam.map(renderExamQuestion).join('')}`)}
      ${card(steps[4],`<p>Сводная рабочая тетрадь комплекта становится вашим разделом подготовки: вы проходите её задания сами, как ученик. На каждом этапе «Старта» задания этого этапа собраны в «Шаг 1». Здесь — вся тетрадь целиком.</p><p class="t-score">Пройдено как ученик: <b>${Object.keys(t.studentDone).length} из ${pageKeys.size}</b> страниц</p><a class="text-link" href="#workbook">Открыть сводную тетрадь целиком →</a>${box('workbook','Я прошёл(ла) задания тетради как ученик',t.prep.workbook)}`)}
      ${card(steps[5],'<p>Ссылка на курс обучения методике киноуроков будет добавлена, когда команда её передаст.</p>')}
      ${card(steps[6],`<p>Отдельная тетрадь для ребёнка: только листы, с которыми дети работают в классе, по порядку этапов. Её можно распечатать целиком или по этапам.</p><a class="text-link" href="#student">Открыть рабочую тетрадь ученика →</a>${box('print','Тетрадь ученика распечатана к уроку',t.prep.print)}`)}
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
      <section class="t-for-teacher"><span class="eyebrow">ШАГ 2 · ПОЯСНЕНИЯ ПЕДАГОГУ</span><h2>Как провести этот этап</h2><div id="t-teacher-notes">${teacherNotes(i)}</div><p class="source-caption">Тексты в пояснениях приведены из паспорта и обоснования без пересказа. После урока запишите, как прошёл этап, в разделе <a href="#outcomes">«Итоги»</a>.</p></section>`;
  }
  function classLink(i){
    const part=T.classWorkbook.find(p=>p.stage===(C.stages[i].sourceStage===4?'Сознание':C.stages[i].name));
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
    const table=(sources.sections?.rationale?.['2.2.8.']||[]).find(b=>b.type==='table'),head=table?.rows[0],row=table?.rows[n];
    const effect=row&&head?`<dl class="t-effect">${head.slice(1).map((h,k)=>`<div><dt>${e(h)}</dt><dd>${e(row[k+1])}</dd></div>`).join('')}</dl><span class="source-caption">Обоснование · сводная таблица 2.2.8</span>`:'';
    return `<details class="t-note" open><summary>Сценарная подсказка: блоки и время</summary><div>${ctx.renderBlocks(scenario)}<span class="source-caption">Паспорт пособия · раздел 5.${n}</span></div></details><details class="t-note"><summary>Задача этапа и почему она важна</summary><div>${ctx.renderBlocks(reason)}<span class="source-caption">Методическое обоснование · раздел 2.2.${n+1}</span></div></details><details class="t-note"><summary>Ожидаемый результат и эффект</summary><div>${effect}</div></details>`;
  }

  // В экранном тексте к странице 3 прикреплён раздел «Термометр чувств» из конца этапа «Чувство» (после страницы 24).
  // Для печати он возвращается на своё место в исходном порядке документа.
  const sheets=(sources,p)=>{
    const blocks=sources.pages[String(p)]||[],cut=blocks.findIndex((b,k)=>k>0&&b.type==='p'&&/^\S*\s*СТРАНИЦА 3\. ТЕРМОМЕТР ЧУВСТВ/.test(b.text));
    const extra=String(p)==='24'?(()=>{const b3=sources.pages['3']||[],c=b3.findIndex((b,k)=>k>0&&b.type==='p'&&/^\S*\s*СТРАНИЦА 3\. ТЕРМОМЕТР ЧУВСТВ/.test(b.text));return c>0?[b3.slice(c)]:[];})():[];
    // Заголовок следующего этапа («📘 ЭТАП N…»), прилипший к последней странице, на лист не выводится.
  const main=String(p)==='3'&&cut>0?blocks.slice(0,cut):blocks,stageCut=main.findIndex((b,k)=>k>0&&b.type==='p'&&/^📘 ЭТАП \d/.test(b.text));
  return [stageCut>0?main.slice(0,stageCut):main,...extra];
  };

  // ——— Сводная тетрадь (эталон) целиком ———
  function renderWorkbook(route){
    const sources=ctx.getSources(),parts=T.workbookParts,sel=parts.find(p=>p.id===route.sub)||null,list=sel?[sel]:parts;
    const chips=`<nav class="t-chips t-noprint" aria-label="Выбрать этап тетради"><a href="#workbook" class="${sel?'':'active'}">Вся тетрадь</a>${parts.map(p=>`<a href="#workbook/${p.id}" class="${sel===p?'active':''}">${e(p.name)}</a>`).join('')}</nav>`;
    const body=!sources?'<p class="source-caption">Загружаем страницы тетради…</p>':list.map(part=>`<section class="t-part"><h2 class="t-part-title">${e(part.name)}</h2>${part.pages.flatMap(p=>sheets(sources,p)).map(b=>`<article class="t-sheet">${ctx.renderBlocks(b)}</article>`).join('')}</section>`).join('');
    return `${header('ПОДГОТОВКА · П5','Сводная рабочая тетрадь','Эталонная тетрадь комплекта целиком. Педагог проходит её задания сам, как ученик.')}<div class="t-print-bar t-noprint"><button type="button" class="button primary" data-t-print>Печать / сохранить в PDF</button><a class="text-link" href="./materials/workbook.docx" download>Скачать оригинал DOCX ↓</a></div><p class="local-explainer t-noprint">Текст страниц совпадает с оригиналом тетради; оформление упрощено для экрана и печати.</p>${chips}<div id="t-student-pages">${body}</div>`;
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

  // ——— Счастье ———
  function renderHappiness(){
    return `${header('ДОПОЛНИТЕЛЬНЫЙ РАЗДЕЛ','Счастье','Раздел готовится вместе с командой проекта.')}<section class="t-prep-step pending"><div class="t-prep-head"><span class="t-dot wait" aria-hidden="true">…</span><h2>Что здесь будет</h2>${pendingBadge}</div><ul class="t-list"><li>Понятие счастья по «Энциклопедии прикладной этики».</li><li>Сократовский метод: разрушение заблуждений и формирование созидательных установок — по формулировке энциклопедии.</li><li>Интерактивные задания для педагога и учеников.</li></ul><p class="source-caption">Содержание появится после получения исходного текста энциклопедии. До этого раздел не заполняется догадками.</p></section><div class="actions"><a class="button ghost" href="#map">← Маршрутная карта</a></div>`;
  }

  // ——— Персонаж-подсказчик ———
  function guideText(route){
    const s=app();
    if(route.view==='prep'||route.view==='map'||route.view==='start'){
      if(!prepReady()){const next=prepSteps().find(x=>!x.pending&&!x.done);return {text:'Начнём с подготовки. Следующий шаг — «'+next.title+'».',href:next.href,label:'К шагу '+next.n};}
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
    if(route.view==='happiness')return {text:'Этот раздел наполнится, когда появится текст энциклопедии.',href:'#map',label:'К карте'};
    return {text:'Не теряйтесь: вся последовательность — на маршрутной карте.',href:'#map',label:'Маршрутная карта'};
  }
  const face='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#efb466"/><path d="M17 9h14l-2 5H19z" fill="#122e46"/><rect x="14" y="14" width="20" height="22" rx="7" fill="#fff4dd"/><circle cx="20" cy="24" r="2" fill="#122e46"/><circle cx="28" cy="24" r="2" fill="#122e46"/><path d="M20 29c2 2 6 2 8 0" stroke="#122e46" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M19 36h10v3H19z" fill="#122e46"/></svg>';
  function guide(route){
    const g=guideText(route);
    if(t.guideHidden)return `<button type="button" class="t-guide-min t-noprint" data-t-guide="show" aria-label="Показать подсказки: ${e(T.guideName)}">${face}</button>`;
    return `<aside class="t-guide t-noprint" aria-label="Подсказка: ${e(T.guideName)}"><div class="t-guide-face">${face}</div><div class="t-guide-body"><strong>${e(T.guideName)}</strong><p>${e(g.text)}</p><div class="t-guide-actions">${g.href?`<a href="${e(g.href)}">${e(g.label)} →</a>`:''}${route.view!=='map'?'<a href="#map">Карта</a>':''}<button type="button" data-t-guide="hide">Свернуть</button></div></div></aside>`;
  }

  // ——— События (вызываются из обработчиков приложения) ———
  function click(el){
    const d=el.dataset||{};
    if(d.tGuide!==undefined){t.guideHidden=d.tGuide==='hide';save();ctx.render();return true;}
    if(d.tPrint!==undefined){openForPrint();window.print();return true;}
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
    if(d.tPrep!==undefined){if(!['intro','workbook','print'].includes(d.tPrep))return true;t.prep[d.tPrep]=el.checked===true;save();ctx.render();return true;}
    return false;
  }
  function input(el){
    const d=el.dataset||{};
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
    return route.view==='map'?renderMap():route.view==='prep'?renderPrep(route):route.view==='student'?renderStudent(route):route.view==='workbook'?renderWorkbook(route):route.view==='outcomes'?renderOutcomes():renderHappiness();
  }
  return {views,render,sidebar,startPanel,stageBlock,teacherNotes,guide,click,change,input,afterSources,state:()=>t,examPassed,prepReady};
};
