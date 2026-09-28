'use strict';
(() => {
  const criteria=[
    ['Я могу воспроизвести определение, антипод и формулу качества по пособию, с. 1.','В моём плане пять моментов и чувств, а также семь уровней пирамиды соответствуют пособию и слайду 10.','Мои вопросы оставляют место разным впечатлениям; предположение о герое опирается на наблюдаемую деталь.'],
    ['Я различаю доброжелательность, чуткость и великодушие по определениям пособия и подбираю примеры действий.','В задании «Остров» сначала предусмотрены выбор и доводы детей, затем разбор ответа из пособия.','Я отделяю личный цвет в термометре чувств от легенды цветка и не оцениваю личность ребёнка по его ответу.'],
    ['Дело выбрано с участием детей; выяснены получатель и его действительная потребность.','В плане есть посильные роли, ресурсы, срок и наблюдаемый признак пользы.','Я назначил(а) обсуждение после выполнения дела; подготовленный план не выдаётся за выполненную практику.'],
    ['Обсуждение опирается на действительно выполненное дело и конкретные примеры поддержки.','Легенда цветка соответствует пособию, с. 15–16; разные чувства участников принимаются.','В моём плане есть вопросы о трудности, нужной помощи и следующем посильном шаге.']
  ];
  const names=['Впечатление','Осмысление','Применение','Рефлексия'];
  for(let i=0;i<4;i++){
    const section=document.createElement('section');section.className='review-panel';
    section.innerHTML=`<h2>Самопроверка плана</h2><p>Проверьте свои записи по трём критериям. Это предложение для подготовки педагога, а не методическая приёмка курса.</p><ul>${criteria[i].map(t=>'<li>'+t+'</li>').join('')}</ul><label class="read-check"><input type="checkbox" data-self-check="${i+1}"> Я проверил(а) свой план по этим критериям.</label>`;
    document.querySelector('#lesson'+(i+1)+' .step-navigation').before(section);
  }
  const overview=document.getElementById('review');
  overview.innerHTML=`<span class="eyebrow">Для методиста</span><h1>Рецензирование курса «Мандарин»</h1><p>Откройте занятия, сверьте источники и разборы. В этом режиме учебные ответы и прогресс доступны только для чтения.</p><div class="materials-grid">${names.map((n,i)=>`<article><h2>${i+1}. ${n}</h2><ul>${criteria[i].map(t=>'<li>'+t+'</li>').join('')}</ul><a class="button ghost" href="#lesson${i+1}">Материалы и разборы</a></article>`).join('')}</div><p><a href="#materials">Открыть исходные документы и комплект →</a></p>`;
  for(const [id,q] of Object.entries(window.MandarinPractice)){
    const solution=document.createElement('div');solution.className='review-solution';solution.dataset.reviewSolution='';solution.hidden=true;
    const h=document.createElement('h4');h.textContent='Ответ и разбор для рецензирования';solution.append(h);
    const list=document.createElement('ol');
    q.keys.forEach((key,i)=>{
      const field=document.querySelector(`[data-field="${key}"]`),item=document.createElement('li');
      item.textContent=[...field.options].find(o=>o.value===q.answer[i]).textContent;list.append(item);
    });
    const explanation=document.createElement('p');explanation.textContent=q.success;solution.append(list,explanation);
    document.querySelector(`[data-exercise="${id}"]`).append(solution);
  }
})();
