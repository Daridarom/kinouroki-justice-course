'use strict';
(function(root) {
  const blank = () => ({version:1, read:[], completed:[], answers:{}, checked:{}, notes:{}, project:{}, reviews:{}, preparation:{}, caseReviewed:{}, mode:"learn", lastRoute:"start", filmReturn:null, updated:null});
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function grade(q, value) {
    if(q.type === 'single') return Number.isInteger(value) && value === q.answer;
    return Array.isArray(value) && value.length === q.answer.length && value.every((v,i)=>Number.isInteger(v)&&v === q.answer[i]);
  }
  function planReady(course,s,i){
    return course.stages[i].fields.every(f=>typeof s.notes[f.id]==='string'&&s.notes[f.id].trim()) && (i!==4||course.projectFields.every(f=>typeof s.project[f.id]==='string'&&s.project[f.id].trim()));
  }
  function canComplete(course,s,i){
    return Boolean(course.stages[i]&&(!course.stages[i].case||(s.preparation?.film&&s.preparation?.sources&&s.caseReviewed?.[i]))&&s.read.includes(i)&&course.stages[i].quizzes.every(q=>s.checked[q.id]&&grade(q,s.answers[q.id]))&&planReady(course,s,i)&&s.reviews?.[i]);
  }
  function normalize(input, course) {
    const s=blank(); if(!input || input.version!==1) return s;
    const validStage = v => Number.isInteger(v)&&v>=0&&v<course.stages.length;
    s.read=Array.isArray(input.read) ? [...new Set(input.read.filter(validStage))] : [];
    const safeMap=(from,keys)=>Object.fromEntries(keys.filter(k=>typeof from?.[k]==='string').map(k=>[k,from[k].slice(0,5000)]));
    s.notes=safeMap(input.notes,course.stages.flatMap(x=>x.fields.map(f=>f.id)));
    s.project=safeMap(input.project,course.projectFields.map(f=>f.id));
    for(const q of course.stages.flatMap(x=>x.quizzes)) {
      const a=input.answers?.[q.id];
      if(q.type==='single'&&Number.isInteger(a)&&a>=0&&a<q.options.length) s.answers[q.id]=a;
      if(q.type==='match'&&Array.isArray(a)&&a.length===q.answer.length&&a.every(v=>Number.isInteger(v)&&v>=-1&&v<q.items.length)) s.answers[q.id]=a;
      if(q.type==='order'&&Array.isArray(a)&&a.length===q.answer.length&&a.every(v=>Number.isInteger(v)&&v>=0&&v<q.items.length)&&new Set(a).size===a.length) s.answers[q.id]=a;
      if(input.checked?.[q.id]===true) s.checked[q.id]=true;
    }
    for(let i=0;i<course.stages.length;i++)if(input.reviews?.[i]===true)s.reviews[i]=true;
    s.completed=Array.isArray(input.completed) ? [...new Set(input.completed.filter(v=>validStage(v)&&canComplete(course,s,v)))] : [];
    s.preparation={film:input.preparation?.film===true,sources:input.preparation?.sources===true};
    s.caseReviewed=Object.fromEntries(course.stages.map((_,i)=>i).filter(i=>input.caseReviewed?.[i]===true).map(i=>[i,true]));
    s.mode=input.mode==='review'?'review':'learn';
    s.lastRoute=typeof input.lastRoute==='string'&&/^(start|learn|film(?:\/[a-z]+)?|stage\/[0-5]\/(read|practice|plan)|notebook|materials|glossary|result)$/.test(input.lastRoute)?input.lastRoute:'start';
    s.completed=Array.isArray(input.completed)?[...new Set(input.completed.filter(v=>validStage(v)&&canComplete(course,s,v)))]:[];
    s.filmReturn=typeof input.filmReturn==='string'&&/^stage\/[0-5]\/(read|practice|plan)$/.test(input.filmReturn)?input.filmReturn:null;
    s.updated=typeof input.updated==='string'?input.updated.slice(0,50):null;
    return s;
  }
  const api={blank,escape,grade,normalize,planReady,canComplete};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.CourseCore=api;
})(typeof window!=='undefined'?window:globalThis);
