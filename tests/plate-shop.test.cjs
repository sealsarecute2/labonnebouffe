/* Shop lifecycle tests: the purchase must survive every animation exit. */
const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');
const fs=require('node:fs');const path=require('node:path');const P=require('../plates.js');
function shop({reduced=false,preparation=null}={}){
  const listeners={},timers=new Map(),frames=new Map(),host={innerHTML:''};let now=0,serial=0,saves=0,closes=0;
  const counts={open:0,tick:0,reveal:0};
  const audio={muted:false,setMuted(v){this.muted=v;},prepare(){return preparation||true;},unlock(){},stop(){},status(){return {counts};}};
  for(const kind of Object.keys(counts))audio[kind]=()=>{if(!audio.muted)counts[kind]++;};
  const elements=new Map(),get=q=>{if(q==='dialog[open]')return null;
    if(!elements.has(q))elements.set(q,{textContent:'',style:{},outerHTML:'',clientWidth:800,classList:{add(){}},addEventListener(){},focus(){},getBoundingClientRect(){return {width:q==='.reel-item'?156:800};}});return elements.get(q);};
  const document={hidden:false,querySelector:get,addEventListener:(k,f)=>(listeners[k]??=[]).push(f)};
  const sandbox=vm.createContext({document,BOUFFE_PLATES:P,BOUFFE_CASE_AUDIO:{create:()=>audio,timeline:require('../case-audio.js').timeline},matchMedia:()=>({matches:reduced}),
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
  s.frame();assert.equal(s.counts.open,1);s.advance(1999);assert.doesNotMatch(s.host.innerHTML,/reel-track/);
  s.advance(1);assert.match(s.host.innerHTML,/reel-track/);s.advance(100);s.frame();s.advance(6099);assert.doesNotMatch(s.host.innerHTML,/class="shop-result"/);s.advance(1);
  assert.match(s.host.innerHTML,/shop-result/);assert.equal(s.counts.reveal,1);assert.equal(s.state.inventory.length,1);assert.equal(s.state.balance,88);
});
test('skip, close, section change and hidden tab cancel pending sounds without losing the drop',()=>{
  for(const exit of ['skip','close','tab','hidden']){
    const s=shop();s.click({shopAction:'open'});
    if(exit==='skip')s.click({shopAction:'reveal'});if(exit==='close')s.click({shopAction:'close'});if(exit==='tab')s.click({shopTab:'inventory'});
    if(exit==='hidden'){s.document.hidden=true;s.emit('visibilitychange');}
    const html=s.host.innerHTML;s.advance(10000);s.frame();s.frame();assert.equal(s.host.innerHTML,html);
    assert.equal(s.state.balance,88);assert.equal(s.state.inventory.length,1);assert.equal(s.counts.reveal,exit==='skip'?1:0);assert.equal(s.timers.size,0);
  }
});
test('mute does not restart the animation and reduced motion goes straight to the saved result',()=>{
  const s=shop();s.click({shopAction:'sound'});s.click({shopAction:'open'});
  const html=s.host.innerHTML;s.click({shopAction:'sound'});assert.equal(s.host.innerHTML,html);s.click({shopAction:'sound'});s.frame();s.advance(2100);s.frame();s.advance(6100);
  assert.equal(s.counts.open,0);assert.equal(s.counts.reveal,0);
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

test('leaving during audio preparation cannot restart the opening or charge twice',async()=>{
  let ready;const preparation=new Promise(resolve=>ready=resolve),s=shop({preparation});
  s.click({shopAction:'open'});s.click({shopAction:'open'});s.click({shopAction:'close'});
  const html=s.host.innerHTML;ready(true);await preparation;await Promise.resolve();s.frame();s.advance(10000);
  assert.equal(s.host.innerHTML,html);assert.equal(s.counts.open,0);assert.equal(s.state.balance,88);
  assert.equal(s.state.inventory.length,1);assert.equal(s.saves(),1);assert.equal(s.timers.size,0);
});
test('the Cases code form credits the wallet, reports repeats and stays out of inventory',()=>{
  const s=shop();assert.match(s.host.innerHTML,/<section class="shop-code">/);assert.doesNotMatch(s.host.innerHTML,/bonus|frenchistuff|yummyfood|iloveseals/);
  const submit=value=>{s.get('#shop-code-input').value=value;s.emit('submit',{target:{id:'shop-code-form'},preventDefault(){}});};
  submit('not-a-code');assert.equal(s.state.balance,100);assert.equal(s.saves(),0);assert.match(s.host.innerHTML,/wasn’t recognized/);
  submit(' BONUS ');assert.equal(s.state.balance,350);assert.equal(s.saves(),1);assert.match(s.host.innerHTML,/\+250 tips added/);
  submit('bonus');assert.equal(s.state.balance,350);assert.equal(s.saves(),1);assert.match(s.host.innerHTML,/already used/);
  s.click({shopTab:'inventory'});assert.doesNotMatch(s.host.innerHTML,/shop-code-form/);submit('iloveseals');assert.equal(s.state.balance,350);
});
