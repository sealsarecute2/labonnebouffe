/* Cosmetic plate collection. Tips are earned in the vocabulary game. */
(function (root) {
  'use strict';
  const rarities = [
    { id: 'mil-spec', name: 'Mil-Spec', color: '#6388f5', rank: 0, value:6 },
    { id: 'restricted', name: 'Restricted', color: '#a480f5', rank: 1, value:16 },
    { id: 'classified', name: 'Classified', color: '#df76c9', rank: 2, value:40 },
    { id: 'covert', name: 'Covert', color: '#f17673', rank: 3, value:100 },
    { id: 'extraordinary', name: 'Extraordinary', color: '#e9bd64', rank: 4, value:260 }
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
    { id:'dragon', name:'Dragonfire', rarity:4, finish:'dragon', colors:['#211b21','#b83c24','#ffda7c'] },
    { id:'urban', name:'Urban Camo', rarity:0, finish:'camo', colors:['#293839','#5a7069','#a3b0a0'] },
    { id:'polar', name:'Polar Mesh', rarity:0, finish:'mesh', colors:['#263e5b','#82a0b6','#ebf2ee'] },
    { id:'inkstream', name:'Inkstream', rarity:1, finish:'stream', colors:['#d3d5dc','#f9f9f3','#202937'] },
    { id:'fuel-line', name:'Fuel Line', rarity:1, finish:'hazard', colors:['#282a28','#e8be2d','#f6e3a6'] },
    { id:'hardened', name:'Heat Treated', rarity:2, finish:'tempered', colors:['#1e466d','#b683c5','#e6be63'] },
    { id:'neo-noir', name:'Neo Noir', rarity:2, finish:'noir', colors:['#182335','#b8498f','#75e0e1'] },
    { id:'orbital', name:'Orbital', rarity:3, finish:'orbital', colors:['#252e37','#f0f0e6','#f58231'] },
    { id:'neon-beast', name:'Neon Beast', rarity:3, finish:'beast', colors:['#16354e','#7e4ab9','#f687be'] },
    { id:'doppler', name:'Doppler', rarity:4, finish:'doppler', colors:['#15162d','#5238b2','#e761a3'] },
    { id:'tiger-fang', name:'Tiger Fang', rarity:4, finish:'tiger', colors:['#201c1c','#efa52e','#ffdb71'] },
    { id:'blue-gem', name:'Case Hardened', rarity:3, finish:'blue-gem', colors:['#704825','#b89b59','#58c6f4'] },
    { id:'sandstone', name:'Sandstone', rarity:0, finish:'sandstone', colors:['#87765b','#b9a582','#d6c7a8'] },
    { id:'olive-drab', name:'Olive Drab', rarity:0, finish:'matte', colors:['#394238','#68735b','#89917b'] },
    { id:'brushed-steel', name:'Brushed Steel', rarity:0, finish:'brushed', colors:['#46515a','#8d999f','#c5cdd0'] },
    { id:'navy-stripe', name:'Navy Stripe', rarity:0, finish:'stripe', colors:['#1c354c','#42617a','#b6c5ca'] },
    { id:'workshop-check', name:'Workshop Check', rarity:0, finish:'checker', colors:['#3e4444','#687171','#9aa09a'] }
  ];
  const cases = [
    { id:'service', name:'Service Case', subtitle:'The everyday collection.', price:12, color:'#83b5e6', weights:[65,25,8,1.8,.2] },
    { id:'after-hours', name:'After Hours', subtitle:'A different kind of night shift.', price:30, color:'#b49aed', weights:[44,35,16,4.2,.8] },
    { id:'reserve', name:'Chef’s Reserve', subtitle:'The top shelf of the collection.', price:60, color:'#e4bc70', weights:[21,38,28,10.5,2.5] }
  ];
  const skinById = new Map(skins.map(s => [s.id,s]));
  const caseById = new Map(cases.map(c => [c.id,c]));
  const tipCodes = new Map([['bonus',250],['frenchistuff',100],['yummyfood',200],['iloveseals',1000]]);
  const clamp = n => Math.min(1,Math.max(0,n));
  const amount = n => Number.isFinite(n) ? Math.max(0,Math.floor(n)) : 0;
  function random() {
    if (root.crypto?.getRandomValues) { const a=new Uint32Array(1);root.crypto.getRandomValues(a);return a[0]/4294967296; }
    return Math.random();
  }
  function fresh(tips=0) { return { balance:amount(tips), inventory:[], equipped:null, opened:0, soldTips:0, soldCount:0, soundMuted:false, redeemedCodes:[] }; }
  function restore(data,lifetime=0) {
    if (!data || typeof data!=='object') return fresh(lifetime);
    const state=fresh();state.soldTips=amount(data.soldTips);state.soldCount=amount(data.soldCount);
    state.soundMuted=data.soundMuted===true;
    state.redeemedCodes=[...new Set(Array.isArray(data.redeemedCodes)?data.redeemedCodes.filter(code=>typeof code==='string'&&tipCodes.has(code)):[])];
    const codeTips=state.redeemedCodes.reduce((sum,code)=>sum+tipCodes.get(code),0);
    state.balance=Math.min(amount(data.balance),amount(lifetime)+state.soldTips+codeTips);
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
  function redeem(state,value){
    const code=typeof value==='string'?value.trim().toLowerCase():'';
    if(!code)return {ok:false,error:'Enter a code first.'};
    if(!tipCodes.has(code))return {ok:false,error:'That code wasn’t recognized.'};
    if(state.redeemedCodes.includes(code))return {ok:false,error:'You’ve already used that code.'};
    const tips=tipCodes.get(code);
    state.redeemedCodes.push(code);state.balance+=tips;
    return {ok:true,tips};
  }
  function equip(state,uid) { if(uid!==null&&!state.inventory.some(x=>x.uid===uid))return false;state.equipped=uid;return true; }
  function skin(item) { return skinById.get(item?.skin)||null; }
  function rarity(item) { const s=skin(item);return s?rarities[s.rarity]:null; }
  function salePrice(item){const r=rarity(item);return r&&Number.isFinite(item.float)?Math.max(1,Math.round(r.value*(1-clamp(item.float)))):0;}
  function sell(state,uid){
    const index=state.inventory.findIndex(item=>item.uid===uid);
    if(index<0)return {ok:false,error:'That plate is no longer in your inventory.'};
    const item=state.inventory[index],price=salePrice(item);
    state.inventory.splice(index,1);if(state.equipped===uid)state.equipped=null;
    state.balance+=price;state.soldTips=amount(state.soldTips)+price;state.soldCount=amount(state.soldCount)+1;
    return {ok:true,item,price};
  }
  // The $1 floor adds the probability mass that previously rounded to zero: 0.5/value.
  function expectedResale(caseId){const box=caseById.get(caseId);return box?box.weights.reduce((n,p,i)=>{const value=rarities[i].value;return n+p/100*(value/2+.5/value);},0):0;}
  function seeded(seed) { let n=seed>>>0;return ()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;}; }
  const gemCache=new Map();
  function blueGem(seed){
    seed=Math.max(1,Math.min(1000,amount(seed)||1));
    if(gemCache.has(seed))return gemCache.get(seed);
    const rng=seeded(seed*7919+17),quality=rng(),phase=rng()*Math.PI*2;
    const amplitude=4+rng()*10,frequency=1.7+rng()*1.6,secondary=2+rng()*4;
    const special={661:.99,387:.975,555:.96};
    const target=special[seed]??(quality>.97?.94+(quality-.97)/.03*.05:.12+quality*.78);
    const wave=y=>amplitude*Math.sin(y/90*frequency*Math.PI+phase)+secondary*Math.cos(y/90*5+phase);
    const coverage=offset=>{
      let blue=0,total=0;
      for(let row=0;row<120;row++){const y=-90+(row+.5)*180/120,span=Math.sqrt(8100-y*y);total+=span*2;blue+=Math.max(0,Math.min(span*2,offset+wave(y)+span));}
      return blue/total;
    };
    let low=-125,high=125;
    for(let n=0;n<24;n++){const mid=(low+high)/2;if(coverage(mid)<target)low=mid;else high=mid;}
    const offset=(low+high)/2,points=[];
    for(let y=-110;y<=110;y+=4)points.push(`${(110+offset+wave(y)).toFixed(2)} ${(110+y).toFixed(2)}`);
    const boundary=`M${points.join('L')}`,path=`M-20 0L${points.join('L')}L-20 220Z`;
    const result={seed,coverage:Math.round(coverage(offset)*100),path,boundary};
    gemCache.set(seed,result);return result;
  }
  function patternInfo(item){
    if(skin(item)?.finish!=='blue-gem')return null;
    const gem=blueGem(item.seed);
    return {seed:gem.seed,coverage:gem.coverage,label:gem.coverage>=95?'Gem pattern':gem.coverage>=80?'Blue dominant':gem.coverage>=50?'Mixed pattern':'Bronze dominant'};
  }
  function art(item,prefix='plate') {
    const s=skin(item);if(!s)return '';
    const id=String(prefix).replace(/[^a-zA-Z0-9-]/g,''), rng=seeded(item.seed||1), [a,b,c]=s.colors;
    const v=clamp(item.float||0), rotation=(item.seed||1)%360, gold=s.rarity===4;
    let pattern='';
    if(s.finish==='sandstone')for(let n=0;n<240;n++)pattern+=`<circle cx="${rng()*220}" cy="${rng()*220}" r="${.25+rng()*1.5}" fill="${n%3?c:a}" opacity="${.12+rng()*.35}"/>`;
    if(s.finish==='matte'){
      pattern+=`<circle cx="110" cy="110" r="73" fill="${b}" opacity=".3"/><circle cx="110" cy="110" r="62" fill="none" stroke="${c}" stroke-width="1" opacity=".2"/>`;
      for(let n=0;n<70;n++)pattern+=`<circle cx="${rng()*220}" cy="${rng()*220}" r="${.4+rng()*.8}" fill="${c}" opacity=".12"/>`;
    }
    if(s.finish==='brushed')for(let n=0;n<125;n++){
      const y=rng()*220;pattern+=`<path d="M-10 ${y}h240" stroke="${n%3?c:a}" stroke-width="${.2+rng()*.6}" opacity="${.1+rng()*.3}"/>`;
    }
    if(s.finish==='stripe'){
      pattern+=`<path d="M-10 63h240v13H-10Zm0 27h240v38H-10Zm0 54h240v13H-10Z" fill="${c}" opacity=".65"/>`;
      pattern+=`<path d="M-10 108h240" stroke="${a}" stroke-width="2"/>`;
    }
    if(s.finish==='checker')for(let y=-10;y<240;y+=22)for(let x=-10;x<240;x+=22)if(((x+10)/22+(y+10)/22)%2===0)pattern+=`<rect x="${x}" y="${y}" width="22" height="22" fill="${c}" opacity=".28"/>`;
    if(s.finish==='blue-gem'){
      const gem=blueGem(item.seed);
      pattern+=`<defs><linearGradient id="${id}-blue-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#123776"/><stop offset=".25" stop-color="#136cbb"/><stop offset=".5" stop-color="#70d2f6"/><stop offset=".68" stop-color="#258fc9"/><stop offset="1" stop-color="#283f90"/></linearGradient></defs><path d="${gem.path}" fill="url(#${id}-blue-metal)" stroke="none"/><path d="${gem.boundary}" fill="none" stroke="#8766bb" stroke-width="3" stroke-opacity=".6"/>`;
      for(let n=0;n<18;n++){const y=5+rng()*210;pattern+=`<path d="M-10 ${y}q100 ${rng()*20-10} 240-18" fill="none" stroke="${n%3?'#b8eaff':'#fbdb97'}" stroke-width="${.3+rng()*.8}" stroke-opacity=".2"/>`;}
    }
    if(s.finish==='camo')for(let n=0;n<38;n++){const x=rng()*220,y=rng()*220;pattern+=`<path d="M${x} ${y}h${10+rng()*35}v16h-10v17h-23v-14h-14v-11Z" fill="${n%3?b:c}" opacity="${.3+rng()*.45}"/>`;}
    if(s.finish==='mesh')for(let n=-110;n<330;n+=16)pattern+=`<path d="M${n} 0l220 220M${n} 0l-220 220" stroke="${c}" stroke-width="1.3" opacity=".7"/>`;
    if(s.finish==='stream'){
      pattern+=`<path d="M0 35h220v150H0Z" fill="${b}"/><path d="M20 45h70v17H20m125 90h65v18h-65" fill="${c}"/>`;
      for(let n=0;n<45;n++){const x=Math.floor(rng()*26)*9,y=Math.floor(rng()*26)*9;pattern+=`<rect x="${x}" y="${y}" width="${3+Math.floor(rng()*3)*4}" height="4" fill="${n%5?'#263244':'#df9be1'}" opacity=".65"/>`;}
      pattern+=`<path d="m110 65 32 45-32 45-32-45Z" fill="none" stroke="${c}" stroke-width="5"/><path d="M105 95h10v30h-10Z" fill="${c}"/>`;
    }
    if(s.finish==='hazard'){
      pattern+=`<path d="M0 30h220v160H0Z" fill="${b}"/>`;
      for(let n=-110;n<330;n+=38)pattern+=`<path d="M${n} 0l90 220h17L${n+17} 0Z" fill="${a}"/>`;
      pattern+=`<circle cx="110" cy="110" r="47" fill="${a}" stroke="${c}" stroke-width="3"/><path d="M90 137V86h29v51m-29-32h29m0-19 15 16v27q0 8 8 8" fill="none" stroke="${b}" stroke-width="6" stroke-linejoin="round"/>`;
    }
    if(s.finish==='tempered')for(let n=0;n<32;n++){const x=rng()*240,y=rng()*240;pattern+=`<ellipse cx="${x}" cy="${y}" rx="${20+rng()*45}" ry="${10+rng()*34}" fill="${['#248ec2','#9d6bbb','#d6b46b','#dae6dc'][n%4]}" opacity=".65" filter="url(#${id}-blur)"/>`;}
    if(s.finish==='noir'){
      for(let n=0;n<12;n++)pattern+=`<path d="M${n*30-40} 0l-65 220" stroke="${n%2?b:c}" stroke-width="${n%3?1:14}" opacity=".3"/>`;
      pattern+=`<path d="M75 193q40-12 38-38l-11-13 3-20-10-4 14-25 4-34q46 1 51 44l-20 61 15 28" fill="${b}" stroke="${c}" stroke-width="2"/><path d="M113 59q-48 13-50 66l-21 38 37-16 8-23m21-31 23 3-10 8m-10 21 15 5-14 6" fill="none" stroke="${c}" stroke-width="3"/>`;
    }
    if(s.finish==='orbital'){
      pattern+=`<circle cx="110" cy="110" r="84" fill="${b}"/><path d="M-5 35h140l-40 49H-5m230 90H86l40-49h99" fill="${a}"/><path d="M-5 65h105v14H-5m230 80h-104v-14h104" fill="${c}"/><circle cx="110" cy="110" r="36" fill="${a}" stroke="${c}" stroke-width="4"/><path d="m110 83 23 40H87Z" fill="none" stroke="${b}" stroke-width="4"/><path d="M21 116h32m114-14h32" stroke="${a}" stroke-width="4"/>`;
    }
    if(s.finish==='beast'){
      for(let n=0;n<20;n++)pattern+=`<path d="M${rng()*220} 230q${-60+rng()*120}-130 ${rng()*100-50}-240" fill="none" stroke="${n%2?b:c}" stroke-width="${4+rng()*7}" opacity=".55"/>`;
      pattern+=`<path d="M46 95 70 49l34 18 42-22 34 51-16 61-53 32-51-28Z" fill="${a}" stroke="${c}" stroke-width="4"/><path d="m67 93 32 7-23 13m47-13 30-12-10 26" fill="${c}"/><path d="M72 134q38 31 73-4l-12 35-22 12-25-14Z" fill="${b}"/><path d="m75 138 12 18 5-10 13 22 10-20 9 14 17-26" fill="#f9ebcd"/>`;
    }
    if(s.finish==='doppler')for(let n=0;n<12;n++)pattern+=`<path d="M-40 ${n*25}Q${240-rng()*70} ${-70+rng()*120} ${80+rng()*120} 260L260 260V-30Z" fill="${n%3===0?c:n%3===1?b:a}" opacity=".5"/>`;
    if(s.finish==='tiger'){
      pattern+=`<circle cx="110" cy="110" r="94" fill="${b}"/>`;
      for(let n=-1;n<9;n++)pattern+=`<path d="M-10 ${n*34}q90-24 125-6l-45 18 60 9-140 1Zm240 ${n*34+14}q-90-24-125-6l45 18-60 9 140 1Z" fill="${a}"/>`;
    }
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
  const api={rarities,skins,cases,fresh,restore,wear,draw,open,equipped,equip,skin,rarity,salePrice,sell,redeem,expectedResale,patternInfo,art,random};
  root.BOUFFE_PLATES=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
