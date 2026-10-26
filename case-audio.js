/* CS2's original interface samples. The build embeds these samples for offline play. */
(function(root){
  'use strict';
  // CS2's Panorama case flow: 2s case animation, 0.1s reel lead-in, 6s reveal.
  const timeline=Object.freeze({intro:2000,reelLead:100,reel:6000,lidOpen:750});
  // LAME encoder/decoder priming, measured against the original 44.1kHz WAVs.
  const sampleOffset=1105/44100;
  function create(options={}){
    const assets=options.assets||root.BOUFFE_CASE_AUDIO_ASSETS||{};
    const decoded={},sources=new Set(),failed=[],counts={open:0,tick:0,reveal:0};
    let context=null,master=null,muted=false,loading=null;
    function ensureContext(){
      try{
        if(!context){
          const Audio=root.AudioContext||root.webkitAudioContext;
          if(!options.contextFactory&&!Audio)return false;
          context=options.contextFactory?options.contextFactory():new Audio();
          master=context.createGain();master.gain.value=muted?0:.7;master.connect(context.destination);
        }
        return context.state!=='closed';
      }catch{return false;}
    }
    function unlock(){
      if(muted||!ensureContext())return false;
      if(context.state==='suspended'&&typeof context.startRendering!=='function')context.resume()?.catch(()=>{});
      return true;
    }
    function prepare(){
      if(loading)return loading;
      if(!ensureContext())return Promise.resolve(false);
      loading=Promise.all(Object.entries(assets).map(async([key,data])=>{
        try{
          const bytes=typeof data==='string'?Uint8Array.from(root.atob(data),c=>c.charCodeAt(0)).buffer:data.slice(0);
          decoded[key]=await context.decodeAudioData(bytes);
        }catch{failed.push(key);}
      })).then(()=>!!decoded.open&&!!decoded.tick);
      return loading;
    }
    function play(key,kind,volume,delay=0){
      if(!unlock()||!decoded[key])return false;
      try{
        const source=context.createBufferSource(),gain=context.createGain();
        source.buffer=decoded[key];gain.gain.value=volume;source.connect(gain);gain.connect(master);
        sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();gain.disconnect();};
        source.start(context.currentTime+Math.max(0,delay),sampleOffset);counts[kind]++;return true;
      }catch{return false;}
    }
    const open=(delay=0)=>play('open','open',.5,delay);
    const tick=(_progress=0,delay=0)=>play('tick','tick',.2,delay);
    const reveal=(tier=0,delay=0)=>play('reveal'+Math.max(0,Math.min(4,Math.floor(tier))),'reveal',.3,delay);
    function stop(){
      for(const source of sources){try{source.stop(context?.currentTime||0);}catch{}}
      sources.clear();
    }
    function setMuted(value){
      muted=!!value;if(muted)stop();
      if(master&&context.state!=='closed')master.gain.setTargetAtTime(muted?0:.7,context.currentTime,.008);
    }
    function status(){return {source:'cs2',created:!!context,state:context?.state||'uninitialized',muted,active:sources.size,
      ready:Object.keys(decoded),failed:[...failed],durations:Object.fromEntries(Object.entries(decoded).map(([k,v])=>[k,v.duration])),counts:{...counts}};}
    return {prepare,unlock,open,tick,reveal,stop,setMuted,status};
  }
  const api={create,timeline};root.BOUFFE_CASE_AUDIO=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
