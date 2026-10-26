/* Cosmetic plate collection. Tips are earned in the vocabulary game. */
(function (root) {
  'use strict';
  const rarities = [
    { id: 'mil-spec', name: 'Mil-Spec', color: '#6388f5', rank: 0 },
    { id: 'restricted', name: 'Restricted', color: '#a480f5', rank: 1 },
    { id: 'classified', name: 'Classified', color: '#df76c9', rank: 2 },
    { id: 'covert', name: 'Covert', color: '#f17673', rank: 3 },
    { id: 'extraordinary', name: 'Extraordinary', color: '#e9bd64', rank: 4 }
  ];
  const skins = [
    { id:'blueprint', name:'Blueprint', rarity:0, finish:'grid', colors:['#123b62','#44799d','#9cbecb'] },
    { id:'fieldwork', name:'Fieldwork', rarity:0, finish:'speckle', colors:['#456151','#78927a','#e4dfbc'] },
    { id:'carbon', name:'Carbon Service', rarity:0, finish:'carbon', colors:['#202b35','#485864','#94a2a7'] },
    { id:'tideline', name:'Tideline', rarity:0, finish:'waves', colors:['#184d67','#4a9eac','#d5ece1'] },
    { id:'quartz', name:'Rose Quartz', rarity:1, finish:'marble', colors:['#683a66','#cf94b4','#f4d9da'] },
    { id:'circuit', name:'Night Circuit', rarity:1, finish:'circuit', colors:['#132d3e','#245568','#7af1e4'] },
    { id:'kintsugi', name:'Kintsugi', rarity:1, finish:'cracks', colors:['#171d27','#394552','#e9bc68'] },
    { id:'nebula', name:'Event Horizon', rarity:2, finish:'nebula', colors:['#171637','#744aa8','#f392cd'] },
    { id:'web', name:'Crimson Web', rarity:2, finish:'web', colors:['#491927','#af3345','#ec7080'] },
    { id:'jade', name:'Jade Serpent', rarity:2, finish:'scales', colors:['#082f2b','#1a8e68','#b2efb4'] },
    { id:'reactor', name:'Reactor Core', rarity:3, finish:'reactor', colors:['#201b26','#d63d28','#ffda83'] },
    { id:'obsidian', name:'Obsidian Bloom', rarity:3, finish:'bloom', colors:['#111822','#6a2f7d','#ffc8e1'] },
    { id:'aurora', name:'Aurora Fade', rarity:4, finish:'fade', colors:['#18375c','#c16ad7','#ffdb89'] },
    { id:'dragon', name:'Dragonfire', rarity:4, finish:'dragon', colors:['#211b21','#b83c24','#ffda7c'] }
  ];
  const cases = [
    { id:'service', name:'Service Case', subtitle:'The everyday collection.', price:12, color:'#83b5e6', weights:[65,25,8,1.8,.2] },
    { id:'after-hours', name:'After Hours', subtitle:'A different kind of night shift.', price:30, color:'#b49aed', weights:[40,35,19,5,1] },
    { id:'reserve', name:'Chef’s Reserve', subtitle:'The top shelf of the collection.', price:60, color:'#e4bc70', weights:[15,38,32,12,3] }
  ];
  const skinById = new Map(skins.map(s => [s.id,s]));
  const caseById = new Map(cases.map(c => [c.id,c]));
  const clamp = n => Math.min(1,Math.max(0,n));
  const amount = n => Number.isFinite(n) ? Math.max(0,Math.floor(n)) : 0;
  function random() {
    if (root.crypto?.getRandomValues) { const a=new Uint32Array(1);root.crypto.getRandomValues(a);return a[0]/4294967296; }
    return Math.random();
  }
  function fresh(tips=0) { return { balance:amount(tips), inventory:[], equipped:null, opened:0 }; }
  function restore(data,lifetime=0) {
    if (!data || typeof data!=='object') return fresh(lifetime);
    const state=fresh();state.balance=Math.min(amount(data.balance),amount(lifetime));
    const seen=new Set();
    if (Array.isArray(data.inventory)) for (const item of data.inventory) {
      if (!item || typeof item.uid!=='string' || !/^[a-zA-Z0-9-]{1,90}$/.test(item.uid) || seen.has(item.uid) || !skinById.has(item.skin) || !Number.isFinite(item.float) || item.float<0 || item.float>1) continue;
      seen.add(item.uid);
      state.inventory.push({uid:item.uid,skin:item.skin,float:item.float,seed:Math.max(1,Math.min(1000,amount(item.seed)||1)), acquired:amount(item.acquired),case:caseById.has(item.case)?item.case:'service'});
    }
    state.equipped=state.inventory.some(x=>x.uid===data.equipped)?data.equipped:null;
    state.opened=Math.max(amount(data.opened),state.inventory.length);
    return state;
  }
  function wear(value) {
    if(value<.07)return {name:'Factory New',short:'FN',level:0};
    if(value<.15)return {name:'Minimal Wear',short:'MW',level:1};
    if(value<.38)return {name:'Field-Tested',short:'FT',level:2};
    if(value<.45)return {name:'Well-Worn',short:'WW',level:3};
    return {name:'Battle-Scarred',short:'BS',level:4};
  }
  function draw(caseId,rng=random) {
    const box=caseById.get(caseId);if(!box)throw Error('Unknown case');
    const roll=clamp(rng())*100;
    let total=0,tier=4;
    for(let i=0;i<box.weights.length;i++){total+=box.weights[i];if(roll<total){tier=i;break;}}
    const pool=skins.filter(s=>s.rarity===tier);
    return {skin:pool[Math.min(pool.length-1,Math.floor(clamp(rng())*pool.length))].id,float:clamp(rng()),seed:1+Math.min(999,Math.floor(clamp(rng())*1000))};
  }
  function open(state,caseId,rng=random,now=Date.now()) {
    const box=caseById.get(caseId);
    if(!box)return {ok:false,error:'Unknown case.'};
    if(!Number.isFinite(state.balance)||state.balance<box.price)return {ok:false,error:`You need ${box.price} tips for this case.`};
    const item=draw(caseId,rng);
    const uid=root.crypto?.randomUUID?.() || `plate-${amount(now).toString(36)}-${(state.opened+1).toString(36)}-${Math.floor(random()*1e9).toString(36)}`;
    const prize={...item,uid,acquired:amount(now),case:box.id};
    state.balance-=box.price;state.opened++;state.inventory.push(prize);
    return {ok:true,item:prize};
  }
  function equipped(state) { return state.inventory.find(x=>x.uid===state.equipped)||null; }
  function equip(state,uid) { if(uid!==null&&!state.inventory.some(x=>x.uid===uid))return false;state.equipped=uid;return true; }
  function skin(item) { return skinById.get(item?.skin)||null; }
  function rarity(item) { const s=skin(item);return s?rarities[s.rarity]:null; }
  function seeded(seed) { let n=seed>>>0;return ()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;}; }
  function art(item,prefix='plate') {
    const s=skin(item);if(!s)return '';
    const id=String(prefix).replace(/[^a-zA-Z0-9-]/g,''), rng=seeded(item.seed||1), [a,b,c]=s.colors;
    const v=clamp(item.float||0), rotation=(item.seed||1)%360, gold=s.rarity===4;
    let pattern='';
    if(s.finish==='grid')for(let n=-100;n<330;n+=22)pattern+=`<path d="M${n} 0v220M0 ${n}h220"/>`;
    if(s.finish==='speckle')for(let n=0;n<160;n++)pattern+=`<circle cx="${rng()*220}" cy="${rng()*220}" r="${.5+rng()*2.7}" fill="${n%3?c:b}" opacity="${.15+rng()*.5}"/>`;
    if(s.finish==='carbon')for(let y=0;y<240;y+=16)for(let x=0;x<240;x+=16)pattern+=`<path d="M${x} ${y}l12 12m-12-7 12 12" stroke="${(x+y)%32?b:c}" opacity=".4" stroke-width="4"/>`;
    if(s.finish==='waves')for(let n=0;n<13;n++)pattern+=`<path d="M-30 ${n*23-25}q55-40 110 0t140 0" fill="none" stroke="${n%3?c:b}" stroke-width="${n%3?1.5:8}" opacity=".65"/>`;
    if(s.finish==='marble'||s.finish==='nebula'||s.finish==='fade') {
      pattern+=`<path d="M-20 30Q130-50 88 120T240 180L240-20Z" fill="${b}" opacity=".65"/><path d="M-20 80Q170-45 112 140T240 215" fill="none" stroke="${c}" stroke-width="${s.finish==='marble'?8:40}" opacity=".48" filter="url(#${id}-blur)"/>`;
      for(let n=0;n<9;n++)pattern+=`<path d="M-20 ${n*29}Q${30+rng()*150} ${rng()*220} 240 ${n*27-30}" stroke="${c}" stroke-width="${.5+rng()*1.4}" opacity=".3" fill="none"/>`;
      if(s.finish==='fade')pattern+=`<circle cx="84" cy="150" r="90" fill="url(#${id}-rainbow)" opacity=".8"/>`;
      if(s.finish==='nebula')for(let n=0;n<70;n++)pattern+=`<circle cx="${rng()*220}" cy="${rng()*220}" r="${.3+rng()*1.3}" fill="#fff" opacity="${.2+rng()*.7}"/>`;
    }
    if(s.finish==='circuit')for(let n=0;n<22;n++){const x=rng()*220,y=rng()*220;pattern+=`<path d="M${x} ${y}h${15+rng()*40}l15 15v${10+rng()*40}" stroke="${c}" stroke-width="${n%4?1:2.5}" fill="none" opacity=".7"/><circle cx="${x}" cy="${y}" r="2" fill="${c}"/>`;}
    if(s.finish==='cracks')for(let n=0;n<9;n++){const angle=n*40;pattern+=`<path transform="rotate(${angle} 110 110)" d="M110 110l-11-23 8-17-12-28 10-40m-6 48 20-13" stroke="${c}" stroke-width="${1+rng()*2}" fill="none"/>`;}
    if(s.finish==='web'){
      for(let n=0;n<12;n++)pattern+=`<path d="M78 88L${78+230*Math.cos(n*Math.PI/6)} ${88+230*Math.sin(n*Math.PI/6)}"/>`;
      for(let n=1;n<8;n++)pattern+=`<circle cx="78" cy="88" r="${n*20}" fill="none"/>`;
    }
    if(s.finish==='scales'||s.finish==='dragon'){
      for(let y=-15;y<250;y+=23)for(let x=-15;x<250;x+=30)pattern+=`<path d="M${x+(y%2?15:0)} ${y}q15 30 30 0" fill="none" stroke="${c}" stroke-width="1.3" opacity=".5"/>`;
      pattern+=`<path d="M60 170Q155 170 130 112T85 67Q75 36 133 46l-9-9 23 2-9 21" fill="none" stroke="${c}" stroke-width="${s.finish==='dragon'?16:11}" stroke-linecap="round"/><path d="M135 41l8 3" stroke="${a}" stroke-width="3"/>`;
    }
    if(s.finish==='reactor'){
      for(let n=0;n<18;n++)pattern+=`<path transform="rotate(${n*20} 110 110)" d="M104 35h12l-2 39h-8Z" fill="${n%2?b:c}" opacity=".85"/>`;
      pattern+=`<circle cx="110" cy="110" r="31" fill="${c}"/><circle cx="110" cy="110" r="20" fill="${b}"/><circle cx="110" cy="110" r="9" fill="#fff4be"/><circle cx="110" cy="110" r="68" stroke="${c}" stroke-width="2" fill="none"/>`;
    }
    if(s.finish==='bloom')for(let n=0;n<12;n++)pattern+=`<ellipse cx="110" cy="76" rx="18" ry="56" transform="rotate(${n*30} 110 110)" fill="${n%2?b:c}" fill-opacity=".28" stroke="${c}" stroke-opacity=".65" stroke-width=".8"/>`;
    let scratches='';
    const count=Math.floor(v*90);
    for(let n=0;n<count;n++){
      const x=rng()*220,y=rng()*220;
      scratches+=`<path d="M${x} ${y}l${2+rng()*20} ${-2-rng()*9}" stroke="${n%3?'#d2c6aa':'#15191b'}" stroke-width="${.3+rng()*1.1}" opacity="${.15+v*.45}"/>`;
    }
    return `<svg class="skin-art skin-tier-${s.rarity}" viewBox="0 0 220 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="${id}-base" cx="35%" cy="25%"><stop stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient><radialGradient id="${id}-light"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient><linearGradient id="${id}-rim" x2="1" y2="1"><stop stop-color="${gold?'#fff0b7':c}"/><stop offset=".35" stop-color="${gold?'#ad701c':a}"/><stop offset=".68" stop-color="${gold?'#fbd47e':c}"/><stop offset="1" stop-color="${gold?'#86541a':b}"/></linearGradient><linearGradient id="${id}-rainbow" x2="1" y2="1"><stop stop-color="#4cced0"/><stop offset=".35" stop-color="#7282ed"/><stop offset=".65" stop-color="#ef79bc"/><stop offset="1" stop-color="#ffdb85"/></linearGradient><clipPath id="${id}-clip"><circle cx="110" cy="110" r="90"/></clipPath><filter id="${id}-blur"><feGaussianBlur stdDeviation="12"/></filter></defs><circle cx="110" cy="112" r="104" fill="#000" opacity=".22"/><circle cx="110" cy="108" r="103" fill="url(#${id}-rim)"/><circle cx="110" cy="108" r="97" fill="url(#${id}-base)"/><g clip-path="url(#${id}-clip)" transform="rotate(${rotation} 110 110)" fill="none" stroke="${c}" stroke-width=".7" stroke-opacity=".55">${pattern}</g><circle cx="110" cy="110" r="81" fill="none" stroke="${c}" stroke-opacity=".6" stroke-width="1"/><g clip-path="url(#${id}-clip)">${scratches}</g><circle cx="110" cy="108" r="97" fill="url(#${id}-light)"/><circle cx="110" cy="108" r="100" fill="none" stroke="#fff" stroke-opacity="${.32-v*.2}" stroke-width=".8"/>${gold?'<path d="m110 8 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#fff4c8"/>':''}</svg>`;
  }
  const api={rarities,skins,cases,fresh,restore,wear,draw,open,equipped,equip,skin,rarity,art,random};
  root.BOUFFE_PLATES=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
