'use strict';
(function(root) {
  const KEY='kinouroki.mandarin.preview.v1';
  const ids=['1','2','3','4'];
  function normalize(raw) {
    const state={version:1,notes:{},done:{}};
    for(const id of ids){
      state.notes[id]=typeof raw?.notes?.[id]==='string'?raw.notes[id].slice(0,5000):'';
      state.done[id]=raw?.done?.[id]===true;
    }
    return state;
  }
  const route=hash=>/^(start|film|lesson[1-4]|plan|materials)$/.test(hash)?hash:'start';
  const exportNotes=state=>JSON.stringify({format:'kinouroki.mandarin.preview',...normalize(state)},null,2);
  const api={KEY,normalize,route,exportNotes};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MandarinCore=api;
})(typeof window!=='undefined'?window:globalThis);
