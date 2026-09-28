import fs from 'node:fs';
import vm from 'node:vm';
// A lightweight event harness exercises real application handlers without a browser.
// It does not validate layout or browser APIs.
export const makeHarness=(files,initial={},failStorage=false,source={documents:{},pages:{},glossary:[],sections:{}})=>{
  const elements=new Map(),windowEvents={},local=new Map(Object.entries(initial)),downloads=[],blobs=[];
  class Element{
    constructor(id){this.id=id;this.innerHTML='';this.textContent='';this.events={};this.dataset={};this.open=false;this.hidden=false;this.tagName='BUTTON';}
    addEventListener(name,fn){this.events[name]=fn;}
    querySelector(selector){if(this.id==='app'&&selector==='.course-nav')return get('course-nav');if(this.id==='course-nav'&&selector==='summary')return get('nav-summary');return null;}
    querySelectorAll(){return [];}
    focus(){this.focused=true;}
    scrollIntoView(){this.scrolled=true;}
    showModal(){this.open=true;}
    close(){this.open=false;}
    appendChild(){}
    remove(){}
    click(){downloads.push(this.download);}
    closest(selector){return selector==='button'&&this.tagName==='BUTTON'||selector==='a[data-case-link]'&&this.dataset.caseLink!==undefined||selector==='a[data-route-home]'&&this.dataset.routeHome!==undefined?this:null;}
    hasAttribute(name){return name==='data-export'?this.exportFlag:name==='data-reset'?this.resetFlag:name.startsWith('data-')&&name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()) in this.dataset;}
    matches(selector){return this.match===selector;}
  }
  const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
  let hash='';
  const location={get hash(){return hash;},set hash(value){hash=value?(value.startsWith('#')?value:'#'+value):'';}};
  const sandbox={console,innerWidth:1280,location,history:{replaceState(_,__,hash){location.hash=hash;}},document:{getElementById:get,querySelector(){return null;},querySelectorAll(){return [];},createElement(){return new Element('new');},body:new Element('body')},localStorage:{getItem(k){if(failStorage)throw new Error('denied');return local.get(k)||null;},setItem(k,v){if(failStorage)throw new Error('quota');local.set(k,v);}},fetch:async()=>({ok:true,json:async()=>source}),URL:{createObjectURL(blob){blobs.push(blob);return'blob:test';},revokeObjectURL(){}},Blob,AbortController,setTimeout(){return 1;},clearTimeout(){}};
  sandbox.window=sandbox;sandbox.addEventListener=(n,f)=>windowEvents[n]=f;sandbox.scrollTo=(v)=>{sandbox.lastScroll=v;};sandbox.scrollY=0;
  vm.createContext(sandbox);for(const [name,path] of files)vm.runInContext(fs.readFileSync(path,'utf8'),sandbox,{filename:name});
  const emit=async(type,attrs)=>{const el=new Element('target');Object.assign(el,attrs);await get('app').events[type]({target:el,preventDefault(){}});};
  const navigate=(hash)=>{location.hash=hash;windowEvents.hashchange();};
  return {get,local,downloads,blobs,emit,navigate,windowEvents,sandbox};
};
