/* The back room. Its entrance is the plate in the café illustration. */
(function(root){
  'use strict';
  const S=BOUFFE_PLATES;
  const $=q=>document.querySelector(q);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5-7 7 7 7M2 12h19"/></svg>';
  let context=null,active=false,tab='cases',selectedCase='service',stage='browse',prize=null,inspected=null,sort='newest',timer=null,generation=0,artSerial=0;
  const box=()=>S.cases.find(c=>c.id===selectedCase)||S.cases[0];
  const money=n=>n.toLocaleString('en-CA');
  const art=item=>S.art(item,`shop-${++artSerial}`);
  const sample=s=>({skin:s.id,float:.035,seed:137+s.rarity*71});
  function announce(text){const a=$('#announcer');if(a)a.textContent=text;}
  function save(){context.onChange();}
  function header(){return `<header class="plate-shop-header"><div><button class="shop-back" data-shop-action="close">${arrow}<span>Back to café</span></button><p class="shop-kicker">LA BONNE BOUFFE / THE BACK ROOM</p><h2>Plate collection<span>.</span></h2></div><div class="shop-wallet"><span>TIP BALANCE</span><strong><i aria-hidden="true">◈</i>${money(context.state.balance)}</strong><small>Earned in your kitchen.</small></div></header><div class="shop-toolbar"><div class="shop-tabs" role="group" aria-label="Plate collection sections"><button data-shop-tab="cases" aria-pressed="${tab==='cases'}">Cases</button><button data-shop-tab="inventory" aria-pressed="${tab==='inventory'}">Inventory <span>${context.state.inventory.length}</span></button></div><span class="shop-equipped-label">${S.equipped(context.state)?`Equipped · ${esc(S.skin(S.equipped(context.state)).name)}`:'Equipped · House porcelain'}</span></div>`;}
  function caseArt(c){return `<div class="case-model" style="--case-color:${c.color}" aria-hidden="true"><div class="case-handle"></div><div class="case-lid"></div><div class="case-front"><i></i><i></i><span class="case-emblem">${art(sample(S.skins.find(s=>s.rarity===(c.id==='reserve'?4:c.id==='after-hours'?2:0))))}</span><span class="case-serial">LBB / ${c.id==='service'?'01':c.id==='after-hours'?'02':'03'}</span><b>PLATE COLLECTION</b></div></div>`;}
  function caseCards(){return `<div class="shop-case-grid">${S.cases.map(c=>`<button class="shop-case ${c.id===selectedCase?'is-selected':''}" data-shop-case="${c.id}" aria-pressed="${c.id===selectedCase}" style="--case-color:${c.color}">${caseArt(c)}<span class="shop-case-name">${esc(c.name)}</span><span class="shop-case-sub">${esc(c.subtitle)}</span><span class="shop-case-price">${c.price} <small>tips</small><i>${c.id===selectedCase?'SELECTED':'SELECT'}</i></span></button>`).join('')}</div>`;}
  function plateCard(item,{preview=false,reel=false}={}){
    const skin=S.skin(item),r=S.rarity(item),owned=context.state.equipped===item.uid;
    const details=preview||reel?'':`<span class="shop-item-wear">${S.wear(item.float).short}<span>${item.float.toFixed(6)}</span></span>${owned?'<i class="shop-item-equipped">EQUIPPED</i>':''}`;
    const content=`<div class="shop-item-art">${art(item)}</div><span class="shop-item-kind">PLATE / ${esc(r.name.toUpperCase())}</span><strong>${esc(skin.name)}</strong>${details}`;
    return preview||reel?`<div class="shop-item ${reel?'reel-item':''}" style="--rarity:${r.color}">${content}</div>`:`<button class="shop-item ${inspected===item.uid?'is-inspected':''}" data-shop-inspect="${item.uid}" style="--rarity:${r.color}" aria-pressed="${inspected===item.uid}">${content}</button>`;
  }
  function browse(){const c=box();return `${caseCards()}<section class="shop-case-detail"><div><p class="shop-kicker">${esc(c.name.toUpperCase())} / 14 FINISHES</p><h3>Something for the pass.</h3><p>A fresh plate, its own pattern, and a float from 0 to 1. Every drop stays in your collection.</p></div><div class="shop-open-action"><button class="shop-primary" data-shop-action="open" ${context.state.balance<c.price?'disabled':''}>Open case <span>${c.price} tips</span></button><small>${context.state.balance<c.price?`${c.price-context.state.balance} more tips needed. Earn them in a shift.`:`${money(context.state.balance-c.price)} tips will remain.`}</small></div></section><div class="shop-odds"><span>DROP CHANCES</span>${S.rarities.map((r,i)=>`<span style="--rarity:${r.color}"><i></i>${esc(r.name)}<b>${c.weights[i]}%</b></span>`).join('')}</div><section class="shop-contents"><div class="shop-section-heading"><h3>Inside the case</h3><span>Rarity sets the finish. Float sets the wear.</span></div><div class="shop-drop-grid">${S.skins.map(s=>plateCard(sample(s),{preview:true})).join('')}</div></section>`;}
  function floatMeter(item){return `<div class="float-block"><div class="float-label"><span>WEAR RATING</span><strong>${item.float.toFixed(6)}</strong></div><div class="float-meter"><i></i><i></i><i></i><i></i><i></i><b style="left:${Math.min(99.5,Math.max(.5,item.float*100))}%"></b></div><div class="float-ends"><span>0.00 / PRISTINE</span><span>1.00 / WORN</span></div></div>`;}
  function inspect(item){
    if(!item)return `<div class="shop-inspector classic-inspector"><div class="shop-inspect-art"><div class="classic-plate"></div></div><div class="shop-inspect-copy"><p class="shop-kicker">THE ORIGINAL</p><h3>House porcelain.</h3><p>The plate that started it all. Always in your collection.</p><button class="shop-secondary" data-shop-equip="classic" ${context.state.equipped===null?'disabled':''}>${context.state.equipped===null?'Currently equipped':'Equip plate'}</button></div></div>`;
    const skin=S.skin(item),r=S.rarity(item),isEquipped=context.state.equipped===item.uid;
    return `<div class="shop-inspector" style="--rarity:${r.color}"><div class="shop-inspect-art">${art(item)}</div><div class="shop-inspect-copy"><p class="shop-rarity">${esc(r.name.toUpperCase())} / PLATE FINISH</p><h3>${esc(skin.name)}</h3><p class="shop-condition">${S.wear(item.float).name}<span>Pattern #${item.seed}</span></p>${floatMeter(item)}<button class="shop-primary" data-shop-equip="${item.uid}" ${isEquipped?'disabled':''}>${isEquipped?'Currently equipped':'Equip plate'}</button></div></div>`;
  }
  function inventory(){
    let items=[...context.state.inventory];
    items.sort(sort==='float'?(a,b)=>a.float-b.float:sort==='rarity'?(a,b)=>S.skin(b).rarity-S.skin(a).rarity||a.float-b.float:(a,b)=>b.acquired-a.acquired||context.state.inventory.indexOf(b)-context.state.inventory.indexOf(a));
    const selected=context.state.inventory.find(x=>x.uid===inspected);
    return `${inspect(selected)}<div class="shop-section-heading shop-inventory-heading"><h3>Your collection <span>${items.length+1}</span></h3><label>Sort<select id="shop-sort"><option value="newest" ${sort==='newest'?'selected':''}>Newest first</option><option value="rarity" ${sort==='rarity'?'selected':''}>Rarity</option><option value="float" ${sort==='float'?'selected':''}>Lowest float</option></select></label></div><div class="shop-drop-grid shop-inventory"><button class="shop-item shop-classic-card ${inspected===null?'is-inspected':''}" data-shop-inspect="classic" aria-pressed="${inspected===null}" style="--rarity:#89939b"><div class="shop-item-art"><div class="classic-plate"></div></div><span class="shop-item-kind">PLATE / ORIGINAL</span><strong>House porcelain</strong><span class="shop-item-wear">The original</span>${context.state.equipped===null?'<i class="shop-item-equipped">EQUIPPED</i>':''}</button>${items.map(item=>plateCard(item)).join('')}</div>${!items.length?'<div class="shop-empty"><p>Your first finish is still in a case.</p><button class="shop-secondary" data-shop-tab="cases">Browse cases</button></div>':''}`;
  }
  function opening(){
    const c=box(),items=Array.from({length:32},()=>S.draw(c.id));items[25]=prize;
    return `<div class="shop-opening"><p class="shop-kicker">${esc(c.name.toUpperCase())}</p><h3>Unboxing your plate.</h3><div class="case-reel"><i class="reel-pointer top"></i><div class="reel-window"><div class="reel-track">${items.map(item=>plateCard(item,{reel:true})).join('')}</div></div><i class="reel-pointer bottom"></i></div><p class="shop-opening-caption">Every finish has its own float and pattern.</p><button class="shop-secondary" data-shop-action="reveal">Skip reveal</button></div>`;
  }
  function result(){const r=S.rarity(prize),skin=S.skin(prize);return `<div class="shop-result" style="--rarity:${r.color}"><p class="shop-kicker">ADDED TO YOUR INVENTORY</p><div class="shop-result-art">${art(prize)}</div><span class="shop-rarity">${esc(r.name.toUpperCase())}</span><h3>${esc(skin.name)}</h3><p class="shop-condition">${S.wear(prize.float).name}<span>Pattern #${prize.seed}</span></p>${floatMeter(prize)}<div class="shop-result-actions"><button class="shop-primary" data-shop-action="equip-result">Equip plate</button><button class="shop-secondary" data-shop-action="keep">View in inventory</button></div><button class="shop-text" data-shop-action="cases">Back to cases</button></div>`;}
  function render(){
    if(!active)return;
    context.host.innerHTML=`<section class="plate-shop" aria-label="Plate collection">${header()}<div class="shop-body">${stage==='opening'?opening():stage==='result'?result():tab==='cases'?browse():inventory()}</div><footer class="shop-footer"><span>YOUR KITCHEN. YOUR COLLECTION.</span><span>Plates change the look. Your study progress stays the same.</span></footer></section>`;
  }
  function reveal(){
    if(!active||stage!=='opening')return;
    clearTimeout(timer);stage='result';render();
    $('[data-shop-action="equip-result"]')?.focus({preventScroll:true});
    announce(`${S.rarity(prize).name} plate: ${S.skin(prize).name}. ${S.wear(prize.float).name}. Float ${prize.float.toFixed(6)}. Added to inventory.`);
  }
  function buy(){
    if(!active||stage!=='browse'||tab!=='cases')return;
    const transaction=S.open(context.state,selectedCase);
    if(!transaction.ok){announce(transaction.error);return;}
    prize=transaction.item;save();stage='opening';const token=++generation;render();
    const reduce=root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(reduce){reveal();return;}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(!active||token!==generation||stage!=='opening')return;
      const rail=$('.reel-track'),window=$('.reel-window'),cell=$('.reel-item');
      if(!rail||!window||!cell)return;
      const step=cell.getBoundingClientRect().width+10;
      const target=25*step+cell.getBoundingClientRect().width/2-window.getBoundingClientRect().width/2;
      rail.style.transform=`translateX(${-target}px)`;
      timer=setTimeout(()=>{if(token===generation)reveal();},4300);
    }));
    announce('Opening case. Your plate has been saved to your inventory.');
  }
  function dismiss(notify=true){if(!active)return;clearTimeout(timer);generation++;active=false;if(notify)context.onClose();}
  function open(options){
    dismiss(false);context=options;active=true;tab='cases';stage='browse';prize=null;inspected=context.state.equipped;
    render();$('.shop-back')?.focus({preventScroll:true});announce('Plate collection opened.');
  }
  document.addEventListener('click',e=>{
    if(!active)return;
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.shopTab){clearTimeout(timer);generation++;tab=b.dataset.shopTab;stage='browse';render();return;}
    if(b.dataset.shopCase){selectedCase=b.dataset.shopCase;render();return;}
    if(b.dataset.shopInspect){inspected=b.dataset.shopInspect==='classic'?null:b.dataset.shopInspect;render();return;}
    if(b.dataset.shopEquip){if(S.equip(context.state,b.dataset.shopEquip==='classic'?null:b.dataset.shopEquip)){save();render();announce('Plate equipped.');}return;}
    const action=b.dataset.shopAction;
    if(action==='close')dismiss();
    if(action==='open')buy();
    if(action==='reveal')reveal();
    if(action==='cases'){tab='cases';stage='browse';render();}
    if(action==='keep'||action==='equip-result'){
      if(action==='equip-result'){S.equip(context.state,prize.uid);save();announce('Plate equipped.');}
      tab='inventory';stage='browse';inspected=prize.uid;render();
    }
  });
  document.addEventListener('change',e=>{if(active&&e.target.id==='shop-sort'){sort=e.target.value;render();}});
  document.addEventListener('keydown',e=>{if(active&&e.key==='Escape'&&!document.querySelector('dialog[open]')){e.preventDefault();dismiss();}});
  root.BOUFFE_PLATE_SHOP={open,dismiss,isOpen:()=>active};
})(globalThis);
