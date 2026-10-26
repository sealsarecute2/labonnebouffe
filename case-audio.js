/* Original mechanical case sounds, synthesized with Web Audio. No audio downloads. */
(function(root){
  'use strict';
  function create(options={}){
    let context=null,master=null,muted=false,noiseBuffer=null;
    const sources=new Set(),counts={open:0,tick:0,reveal:0};
    function unlock(){
      if(muted)return false;
      try{
        if(!context){
          const Audio=root.AudioContext||root.webkitAudioContext;
          if(!options.contextFactory&&!Audio)return false;
          context=options.contextFactory?options.contextFactory():new Audio();
          master=context.createGain();master.gain.value=.22;master.connect(context.destination);
        }
        if(context.state==='suspended'&&typeof context.startRendering!=='function')context.resume()?.catch(()=>{});
        return context.state!=='closed';
      }catch{return false;}
    }
    function connect(source,nodes){
      let previous=source;
      for(const node of nodes){previous.connect(node);previous=node;}
      previous.connect(master);sources.add(source);
      source.onended=()=>{sources.delete(source);source.disconnect();for(const node of nodes)node.disconnect();};
    }
    function tone(frequency,when,duration,volume,type='sine',endFrequency=frequency){
      const osc=context.createOscillator(),gain=context.createGain();
      osc.type=type;osc.frequency.setValueAtTime(frequency,when);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),when+duration);
      gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(volume,when+.003);
      gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
      connect(osc,[gain]);osc.start(when);osc.stop(when+duration+.015);
    }
    function noise(when,duration,volume,frequency=1800,type='bandpass'){
      if(!noiseBuffer){
        noiseBuffer=context.createBuffer(1,Math.ceil(context.sampleRate*.35),context.sampleRate);
        const data=noiseBuffer.getChannelData(0);let seed=814211;
        for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=seed/2147483648-1;}
      }
      const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
      source.buffer=noiseBuffer;filter.type=type;filter.frequency.value=frequency;filter.Q.value=1.2;
      gain.gain.setValueAtTime(volume,when);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
      connect(source,[filter,gain]);source.start(when);source.stop(when+duration+.005);
    }
    function perform(kind,action){
      if(!unlock())return false;
      try{action(context.currentTime);counts[kind]++;return true;}catch{return false;}
    }
    function open(delay=0){return perform('open',now=>{
      const t=now+delay;
      tone(92,t,.17,.25,'sine',38);noise(t,.14,.32,750);
      tone(230,t+.04,.11,.1,'triangle',125);noise(t+.12,.12,.16,2400,'highpass');
      tone(980,t+.13,.13,.055,'sine',720);
    });}
    function tick(progress=0,delay=0){return perform('tick',now=>{
      const t=now+delay,p=Math.min(1,Math.max(0,progress));
      noise(t,.016,.17-p*.035,2200-p*600,'highpass');
      tone(1750-p*600,t,.026,.075,'triangle',1100-p*300);
    });}
    function reveal(tier=0,delay=0){return perform('reveal',now=>{
      const t=now+delay,r=Math.max(0,Math.min(4,Math.floor(tier))),base=[220,246.94,293.66,329.63,392][r];
      tone(78,t,.17,.2,'sine',45);noise(t,.055,.12,950);
      [1,1.5,2].forEach((ratio,index)=>tone(base*ratio,t+.03+index*.045,.3+r*.085,.11-index*.015,'sine'));
      if(r>=3)tone(base*3,t+.15,.5,.035,'sine');
      if(r===4)tone(base*4,t+.24,.65,.025,'sine');
    });}
    function stop(){
      for(const source of sources){try{source.stop(context?.currentTime||0);}catch{} }
      sources.clear();
    }
    function setMuted(value){
      muted=!!value;
      if(muted)stop();
      if(master&&context.state!=='closed')master.gain.setTargetAtTime(muted?0:.22,context.currentTime,.008);
    }
    function status(){return {created:!!context,state:context?.state||'uninitialized',muted,active:sources.size,counts:{...counts}};}
    return {unlock,open,tick,reveal,stop,setMuted,status};
  }
  root.BOUFFE_CASE_AUDIO={create};
  if(typeof module!=='undefined')module.exports={create};
})(globalThis);
