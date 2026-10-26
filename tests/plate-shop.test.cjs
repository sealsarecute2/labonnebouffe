/* Shop lifecycle tests: the purchase must survive every animation exit. */
const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');
const fs=require('node:fs');const path=require('node:path');const P=require('../plates.js');
function shop({reduced=false}={}){
  const listeners={},timers=new Map(),frames=new Map(),host={innerHTML:''};let now=0,serial=0,saves=0,closes=0;
  const counts={open:0,crack:0,tick:0,reveal:0};
  const audio={muted:false,setMuted(v){this.muted=v;},unlock(){},stop(){},status(){return {counts};}};
  for(const kind of Object.keys(counts))audio[kind]=()=>{if(!audio.muted)counts[kind]++;};
  const elements=new Map(),get=q=>{if(q==='dialog[open]')return null;
    if(!elements.has(q))elements.set(q,{textContent:'',style:{},outerHTML:'',clientWidth:800,focus(){},getBoundingClientRect(){return {width:q==='.reel-item'?156:800};}});return elements.get(q);};
  const document={hidden:false,querySelector:get,addEventListener:(k,f)=>(listeners[k]??=[]).push(f)};
  const sandbox=vm.createContext({document,BOUFFE_PLATES:P,BOUFFE_CASE_AUDIO:{create:()=>audio},matchMedia:()=>({matches:reduced}),
    setTimeout:(fn,delay)=>{const id=++serial;timers.set(id,{fn,time:now+delay});return id;},clearTimeout:id=>timers.delete(id),
    requestAnimationFrame:fn=>{const id=++serial;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),getComputedStyle:()=>({transform:'none'}),console});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','plate-shop.js'),'utf8'),sandbox);
  const state=P.fresh(100);sandbox.BOUFFE_PLATE_SHOP.open({host,state,onChange:()=>saves++,onClose:()=>closes++});
  const emit=(type,event={})=>(listeners[type]||[]).forEach(f=>f(event));
  const click=dataset=>emit('click',{target:{closest:()=>({dataset,disabled:false})}});
  const advance=ms=>{const end=now+ms;while(true){const next=[...timers].sort((a,b)=>a[1].time-b[1].time)[0];if(!next||next[1].time>end)break;now=next[1].time;timers.delete(next[0]);next[1].fn();}now=end;};
  const frame=()=>{const batch=[...frames];frames.clear();batch.forEach(([,f])=>f(now));};
  return {host,state,counts,click,advance,frame,document,emit,get,saves:()=>saves,closes:()=>closes,timers};
}
test('case cracks with sound before the reel, then reveals the single saved purchase',()=>{
  const s=shop();s.click({shopAction:'open'});s.click({shopAction:'open'});
  assert.equal(s.state.balance,88);assert.equal(s.state.inventory.length,1);assert.equal(s.saves(),1);
  assert.match(s.host.innerHTML,/case-crack-scene/);assert.doesNotMatch(s.host.innerHTML,/reel-track/);
  assert.equal(s.counts.open,1);s.advance(390);assert.equal(s.counts.crack,1);
  s.advance(1060);assert.match(s.host.innerHTML,/reel-track/);s.frame();s.frame();s.advance(4300);
  assert.match(s.host.innerHTML,/shop-result/);assert.equal(s.counts.reveal,1);assert.equal(s.state.inventory.length,1);assert.equal(s.state.balance,88);
});
test('skip, close, section change and hidden tab cancel pending sounds without losing the drop',()=>{
  for(const exit of ['skip','close','tab','hidden']){
    const s=shop();s.click({shopAction:'open'});
    if(exit==='skip')s.click({shopAction:'reveal'});if(exit==='close')s.click({shopAction:'close'});if(exit==='tab')s.click({shopTab:'inventory'});
    if(exit==='hidden'){s.document.hidden=true;s.emit('visibilitychange');}
    const html=s.host.innerHTML;s.advance(10000);s.frame();s.frame();assert.equal(s.host.innerHTML,html);assert.equal(s.counts.crack,0);
    assert.equal(s.state.balance,88);assert.equal(s.state.inventory.length,1);assert.equal(s.counts.reveal,exit==='skip'?1:0);assert.equal(s.timers.size,0);
  }
});
test('mute does not restart the animation and reduced motion goes straight to the saved result',()=>{
  const s=shop();s.click({shopAction:'sound'});s.click({shopAction:'open'});
  const html=s.host.innerHTML;s.click({shopAction:'sound'});assert.equal(s.host.innerHTML,html);s.click({shopAction:'sound'});s.advance(1450);s.frame();s.frame();s.advance(4300);
  assert.equal(s.counts.open,0);assert.equal(s.counts.crack,0);assert.equal(s.counts.reveal,0);
  const r=shop({reduced:true});r.click({shopAction:'open'});assert.match(r.host.innerHTML,/shop-result/);assert.doesNotMatch(r.host.innerHTML,/case-crack-scene|reel-track/);
  assert.equal(r.state.inventory.length,1);assert.equal(r.state.balance,88);assert.equal(r.timers.size,0);
});
test('case contents, inventory and reveal never show pattern numbers or blue coverage',()=>{
  const s=shop(),gem={uid:'secret-gem',skin:'blue-gem',float:.02,seed:661,acquired:1,case:'reserve'};
  const hidden=/BLUE COVERAGE|Pattern #|Seed #|% blue|shop-gem-tag|shop-pattern-detail/;
  assert.doesNotMatch(s.host.innerHTML,hidden);assert.match(s.host.innerHTML,/Heat Treated/);assert.match(s.host.innerHTML,/Case Hardened/);
  s.state.inventory.push(gem);s.click({shopTab:'inventory'});s.click({shopInspect:gem.uid});assert.doesNotMatch(s.host.innerHTML,hidden);assert.match(s.host.innerHTML,/0\.020000/);
  s.click({shopTab:'cases'});s.click({shopAction:'open'});s.click({shopAction:'reveal'});assert.doesNotMatch(s.host.innerHTML,hidden);
});
