const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('../case-audio.js');
function fixture(){
  const sources=[],gains=[];
  const context={state:'running',currentTime:10,destination:{},
    createGain(){const node={gain:{value:0,setTargetAtTime(value){this.value=value;}},connect(){},disconnect(){}};gains.push(node);return node;},
    async decodeAudioData(data){return {duration:2,identity:new Uint8Array(data)[0]};},
    createBufferSource(){const node={connect(){},disconnect(){},start(...args){this.started=args;},stop(){this.stopped=true;}};sources.push(node);return node;}};
  const assets=Object.fromEntries(['open','tick','reveal0','reveal1','reveal2','reveal3','reveal4'].map((key,index)=>[key,new Uint8Array([index+1]).buffer]));
  return {audio:A.create({contextFactory:()=>context,assets}),sources,gains};
}
test('original samples are prepared once and start with encoder delay removed',async()=>{
  const f=fixture();assert.equal(await f.audio.prepare(),true);assert.equal(await f.audio.prepare(),true);
  assert.equal(f.audio.status().ready.length,7);
  assert.equal(f.audio.open(),true);assert.equal(f.audio.tick(.6),true);assert.equal(f.audio.reveal(4),true);
  assert.deepEqual(f.sources.map(s=>s.buffer.identity),[1,2,7]);
  for(const source of f.sources)assert.deepEqual(source.started,[10,1105/44100]);
  assert.deepEqual(f.audio.status().counts,{open:1,tick:1,reveal:1});
  assert.equal(f.audio.status().source,'cs2');
});
test('mute and stop cancel every sample without playing late or changing source selection',async()=>{
  const f=fixture();await f.audio.prepare();f.audio.open();f.audio.tick();
  f.audio.setMuted(true);assert.ok(f.sources.every(s=>s.stopped));assert.equal(f.audio.status().active,0);
  assert.equal(f.audio.open(),false);assert.equal(f.audio.reveal(3),false);assert.equal(f.sources.length,2);
  f.audio.setMuted(false);assert.equal(f.audio.reveal(2),true);assert.equal(f.sources.at(-1).buffer.identity,5);
  f.audio.stop();assert.equal(f.sources.at(-1).stopped,true);
});
