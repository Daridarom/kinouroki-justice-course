'use strict';
(function(root) {
  const KEY='kinouroki.mandarin.preview.v1';
  const ids=['1','2','3','4'];
  const fieldKeys=['order1','order2','order3','order4','order5','match1','match2','match3','island','case1','case2','case3','observation','quality','feeling','color','strength','thought','action','recipient','need','result','roles','resources','date','evidence','reflectionDate','actual','support','difficulty','next'];
  function normalize(raw) {
    const state={version:1,notes:{},done:{},fields:{}};
    for(const id of ids){
      state.notes[id]=typeof raw?.notes?.[id]==='string'?raw.notes[id].slice(0,5000):'';
      state.done[id]=raw?.done?.[id]===true;
    }
    for(const key of fieldKeys)state.fields[key]=typeof raw?.fields?.[key]==='string'?raw.fields[key].slice(0,5000):'';
    return state;
  }
  const route=hash=>/^(start|film|lesson[1-4]|plan|materials)$/.test(hash)?hash:'start';
  const exportNotes=state=>JSON.stringify({format:'kinouroki.mandarin.preview',...normalize(state)},null,2);
  function importNotes(text){
    if(typeof text!=='string'||text.length>200000)throw new Error('Файл слишком большой. Выберите файл прогресса этого курса.');
    let raw;try{raw=JSON.parse(text);}catch{throw new Error('Не удалось прочитать файл. Нужен файл JSON, сохранённый этим курсом.');}
    if(!raw||raw.format!=='kinouroki.mandarin.preview'||raw.version!==1||!raw.notes||typeof raw.notes!=='object'||Array.isArray(raw.notes)||!raw.done||typeof raw.done!=='object'||Array.isArray(raw.done))throw new Error('Это не файл прогресса «Мандарина» поддерживаемой версии.');
    return normalize(raw);
  }
  const api={KEY,normalize,route,exportNotes,importNotes,fieldKeys};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MandarinCore=api;
})(typeof window!=='undefined'?window:globalThis);
