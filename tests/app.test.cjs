/* Application flow checks in a minimal DOM harness. These do not replace browser layout QA. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {words}=require('../data.js');
const KEY='bonne-bouffe.v1';
function app(initial,blocked=false,deviceDark=false){
  const listeners={},windowListeners={},elements=new Map(),memory=new Map(initial?[[KEY,JSON.stringify(initial)]]:[]);
  let active;
  class Element{
    constructor(id=''){this.id=id;this.value='';this.innerHTML='';this.textContent='';this.style={};this.dataset={};this.attributes={};this.checked=false;this.open=false;this.tagName='DIV';this.disabled=false;this.classList={add(){},remove(){},contains(){return false;}};}
    setAttribute(k,v){this.attributes[k]=v;}
    focus(){active=this;}
    showModal(){this.open=true;}
    close(){this.open=false;}
    addEventListener(){}
  }
  const get=s=>{if(!elements.has(s))elements.set(s,new Element(s.replace(/^#/,'')));return elements.get(s);};
  const modes=['flashcards','quiz','typing'].map(mode=>Object.assign(new Element(),{dataset:{mode},tagName:'BUTTON'}));
  const dialogs=['#library-dialog','#info-dialog'].map(get);
  const media={matches:deviceDark,addEventListener:(type,fn)=>{windowListeners['theme-'+type]=fn;}};
  const document={documentElement:new Element('html'),querySelector:s=>s==='dialog[open]'?dialogs.find(d=>d.open)||null:get(s),querySelectorAll:s=>s==='[data-mode]'?modes:s==='dialog'?dialogs:s==='dialog[open]'?dialogs.filter(d=>d.open):[],addEventListener:(type,fn)=>{(listeners[type]??=[]).push(fn);}};
  const context=vm.createContext({document,window:{matchMedia:()=>media,addEventListener:(type,fn)=>{windowListeners[type]=fn;}},localStorage:{getItem:k=>{if(blocked)throw Error('Blocked');return memory.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('Blocked');memory.set(k,v);}},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:f=>f(),console});
  for(const file of ['data.js','engine.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
  const emit=(type,target,extra={})=>{for(const fn of listeners[type]||[])fn({target,preventDefault(){},...extra});};
  return {get,root:document.documentElement,deviceTheme:dark=>{media.matches=dark;windowListeners['theme-change']?.();},state:()=>JSON.parse(memory.get(KEY)||'null'),click:dataset=>emit('click',{closest:()=>({dataset,disabled:false})}),change:(id,value)=>{const e=get('#'+id);e.value=String(value);emit('change',e);},type:value=>{get('#typed-answer').value=value;emit('input',get('#typed-answer'));},keypress:(key,target=get('#study'),code=key)=>emit('keydown',Object.assign(target,{tagName:target.id==='typed-answer'?'INPUT':'DIV'}),{key,code}),memory,active:()=>active};
}
test('flashcard round records assessment and reaches a result screen',()=>{
  const a=app();assert.equal(a.state().session.questions.length,10);
  for(let i=0;i<10;i++){a.click({action:'flip'});assert.equal(a.state().session.revealed,true);a.click({action:i===0?'flash-review':'flash-known'});}
  const s=a.state();assert.equal(s.session.index,10);assert.equal(s.session.responses.filter(r=>r.correct).length,9);
  assert.match(a.get('#study').innerHTML,/ROUND COMPLETE/);
  a.click({action:'retry-missed'});assert.equal(a.state().session.questions.length,1);
});
test('multiple choice records once, ignores repeated clicks, and reviews only misses',()=>{
  const a=app();a.click({mode:'quiz'});let q=a.state().session.questions[0];const missedId=q.id;
  a.click({option:q.options.find(o=>o.id!==q.id).id});
  a.click({option:q.id});assert.equal(a.state().session.responses.length,1);assert.equal(a.state().session.responses[0].correct,false);
  a.click({action:'next'});q=a.state().session.questions[1];a.click({option:q.id});
  assert.equal(a.state().session.responses[1].correct,true);
  a.click({action:'review'});assert.equal(a.state().session.questions.length,1);assert.equal(a.state().session.questions[0].id,missedId);
});
test('typing checks correct answers, blank answers, hints, skipping and Enter',()=>{
  const a=app();a.click({mode:'typing'});a.change('direction','en-fr');
  a.type('');a.click({action:'check'});assert.equal(a.state().session.responses.length,0);
  let q=a.state().session.questions[0],w=words.find(w=>w.id===q.id);
  a.type(w.fr.split('/')[0]);a.keypress('Enter',a.get('#typed-answer'));
  assert.equal(a.state().session.responses[0].correct,true);
  a.click({action:'next'});a.click({action:'hint'});q=a.state().session.questions[1];w=words.find(w=>w.id===q.id);
  a.type(w.fr.split('/')[0]);a.click({action:'check'});
  assert.equal(a.state().session.responses[1].assisted,true);assert.equal(a.state().progress[q.id].streak,0);
  a.click({action:'next'});a.click({action:'skip'});assert.equal(a.state().session.responses[2].skipped,true);
});
test('bookmarks, empty collection, category filters and both translation directions',()=>{
  const a=app();a.click({action:'study-saved'});assert.equal(a.state().session.questions.length,0);assert.match(a.get('#study').innerHTML,/Build your own word list/);
  const id=words[0].id;a.click({bookmark:id});a.click({action:'new-round'});assert.equal(a.state().session.questions[0].id,id);
  a.change('category','grains');a.change('direction','fr-en');assert.equal(a.state().session.questions.length,8);assert.ok(a.state().session.questions.every(q=>q.target==='en'));
  a.change('direction','en-fr');assert.ok(a.state().session.questions.every(q=>q.target==='fr'));
});
test('reload resumes the exact round and feedback without double counting',()=>{
  const a=app();a.click({mode:'quiz'});const q=a.state().session.questions[0];a.click({option:q.id});
  const saved=a.state(),b=app(saved);assert.deepEqual(b.state().session,saved.session);assert.deepEqual(b.state().progress,saved.progress);
  b.click({option:q.id});assert.equal(b.state().progress[q.id].attempts,1);
  b.click({action:'next'});assert.equal(b.state().session.index,1);
});
test('unavailable storage does not prevent study',()=>{
  const a=app(null,true);assert.match(a.get('#study').innerHTML,/Show answer/);assert.match(a.get('#save-caption').innerHTML,/storage is unavailable/);
  a.click({action:'flip'});assert.match(a.get('#study').innerHTML,/Still learning/);
});

test('theme toggle overrides the device, preserves the round, and survives reload',()=>{
  const a=app();const round=a.state().session;
  assert.equal(a.get('#theme-toggle').attributes['aria-pressed'],'false');
  a.click({action:'toggle-theme'});
  assert.equal(a.root.dataset.theme,'dark');
  assert.equal(a.state().theme,'dark');
  assert.equal(a.get('#theme-toggle').attributes['aria-pressed'],'true');
  assert.equal(a.get('#theme-toggle').title,'Switch to light mode');
  assert.deepEqual(a.state().session,round);
  const b=app(a.state(),false,false);
  assert.equal(b.get('#theme-toggle').attributes['aria-pressed'],'true');
  b.click({action:'toggle-theme'});
  assert.equal(b.state().theme,'light');
  assert.equal(b.get('#theme-toggle').attributes['aria-pressed'],'false');
});
test('system theme follows device changes until an explicit preference is selected',()=>{
  const a=app(undefined,false,true);
  assert.equal(a.state().theme,'system');
  assert.equal(a.get('#theme-toggle').attributes['aria-pressed'],'true');
  a.deviceTheme(false);
  assert.equal(a.get('#theme-toggle').attributes['aria-pressed'],'false');
  a.change('settings-theme','light');a.deviceTheme(true);
  assert.equal(a.root.dataset.theme,'light');
  assert.equal(a.get('#theme-toggle').attributes['aria-pressed'],'false');
  a.change('settings-theme','system');
  assert.equal(a.get('#theme-toggle').attributes['aria-pressed'],'true');
  assert.equal(a.root.dataset.theme,'system');
});
