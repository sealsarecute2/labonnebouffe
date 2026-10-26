const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../plates.js');
const rolls=(...values)=>{let i=0;return ()=>values[i++%values.length];};
test('case odds add to 100 and every tier has a finish',()=>{
  for(const c of P.cases){assert.equal(c.weights.reduce((a,b)=>a+b,0),100);assert.ok(c.price>0);}
  for(let n=0;n<5;n++)assert.ok(P.skins.some(s=>s.rarity===n));
  assert.equal(new Set(P.skins.map(s=>s.id)).size,25);
});
test('existing tips migrate once and a spent balance never refills on reload',()=>{
  const state=P.restore(undefined,50);assert.equal(state.balance,50);
  P.open(state,'service',rolls(.1,.2,.3,.4),1);
  assert.equal(state.balance,38);
  const reloaded=P.restore(JSON.parse(JSON.stringify(state)),50);
  assert.equal(reloaded.balance,38);assert.equal(reloaded.inventory.length,1);
});
test('a purchase debits the exact price and grants one persistent item',()=>{
  const state=P.fresh(60);const r=P.open(state,'reserve',rolls(.995,.1,.036,.6),1234);
  assert.equal(r.ok,true);assert.equal(state.balance,0);assert.equal(state.opened,1);assert.equal(state.inventory.length,1);
  assert.equal(P.rarity(r.item).rank,4);assert.equal(r.item.float,.036);assert.equal(r.item.seed,601);
  assert.equal(r.item.acquired,1234);assert.equal(r.item.case,'reserve');
  assert.deepEqual(P.restore(state,60).inventory,state.inventory);
});
test('insufficient funds and unknown cases cannot charge or grant items',()=>{
  const state=P.fresh(11);const before=JSON.stringify(state);
  assert.equal(P.open(state,'service').ok,false);assert.equal(P.open(state,'made-up').ok,false);
  assert.equal(JSON.stringify(state),before);
});
test('rarity boundaries follow the displayed chances',()=>{
  for(const c of P.cases){let sum=0;
    for(let tier=0;tier<5;tier++){
      const r=P.draw(c.id,rolls((sum+c.weights[tier]/2)/100,.1,.5,.5));
      assert.equal(P.skin(r).rarity,tier);sum+=c.weights[tier];
    }
  }
});
test('wear thresholds, float endpoints and pattern seeds stay in range',()=>{
  const expected=[[0,'FN'],[.069999,'FN'],[.07,'MW'],[.15,'FT'],[.38,'WW'],[.45,'BS'],[1,'BS']];
  for(const [n,label] of expected)assert.equal(P.wear(n).short,label);
  const a=P.draw('service',rolls(0,0,0,0)),b=P.draw('service',rolls(1,1,1,1));
  assert.equal(a.float,0);assert.equal(a.seed,1);assert.equal(b.float,1);assert.equal(b.seed,1000);
});
test('equipping uses owned instances and preserves their individual float',()=>{
  const s=P.fresh(24);const a=P.open(s,'service',rolls(.1,.1,.02,.1),1).item;
  const b=P.open(s,'service',rolls(.1,.1,.9,.9),2).item;
  assert.equal(a.skin,b.skin);assert.notEqual(a.uid,b.uid);
  assert.equal(P.equip(s,b.uid),true);assert.equal(P.equipped(s).float,.9);
  assert.equal(P.equip(s,'not-owned'),false);assert.equal(s.equipped,b.uid);
  assert.equal(P.restore(s,24).equipped,b.uid);
  P.equip(s,null);assert.equal(P.equipped(s),null);
});
test('invalid stored items are ignored without accepting an unowned equipped ID',()=>{
  const s=P.restore({balance:-10,inventory:[{uid:'bad',skin:'dragon',float:NaN},{uid:'x',skin:'made-up',float:.2}],equipped:'not-owned'},90);
  assert.equal(s.balance,0);assert.deepEqual(s.inventory,[]);assert.equal(s.equipped,null);
  assert.equal(P.restore({balance:99999},12).balance,12);
});
test('every skin draws a deterministic plate and wear changes its appearance',()=>{
  for(const skin of P.skins){
    const item={skin:skin.id,seed:212,float:.01};const a=P.art(item,'test');
    assert.ok(a.startsWith('<svg'));assert.equal(a,P.art(item,'test'));
    assert.notEqual(a,P.art({...item,float:.9},'test'));
    assert.notEqual(a,P.art({...item,seed:340},'test'));
    assert.ok(!a.includes('NaN'));
  }
});
test('resale rewards a lower float using rounded rarity value times remaining condition',()=>{
  for(const s of P.skins)for(const value of [0,.001,.036,.15,.381,.729,1]){
    assert.equal(P.salePrice({skin:s.id,float:value}),Math.max(1,Math.round(P.rarities[s.rarity].value*(1-value))));
  }
});
test('selling grants tips once, removes the instance and restores the original if equipped',()=>{
  const s=P.fresh(12),item=P.open(s,'service',rolls(.9999,.1,.2,.5),1).item;
  P.equip(s,item.uid);
  const r=P.sell(s,item.uid);assert.equal(r.ok,true);assert.equal(r.price,208);
  assert.equal(s.balance,208);assert.equal(s.inventory.length,0);assert.equal(s.equipped,null);
  assert.equal(s.soldTips,208);assert.equal(s.soldCount,1);
  const reloaded=P.restore(JSON.parse(JSON.stringify(s)),12);
  assert.equal(reloaded.balance,208);assert.equal(reloaded.soldTips,208);
  const before=JSON.stringify(reloaded);assert.equal(P.sell(reloaded,item.uid).ok,false);
  assert.equal(JSON.stringify(reloaded),before);assert.equal(P.sell(reloaded,'classic').ok,false);
});
test('selling a fully worn item pays the one-tip minimum and preserves another equipped plate',()=>{
  const s=P.fresh(24),a=P.open(s,'service',rolls(.1,.1,1,.1),1).item,b=P.open(s,'service',rolls(.1,.1,.9,.9),2).item;
  P.equip(s,b.uid);const r=P.sell(s,a.uid);
  assert.equal(r.ok,true);assert.equal(r.price,1);assert.equal(s.balance,1);assert.equal(s.equipped,b.uid);assert.equal(s.inventory.length,1);
});
test('Blue Gem is Covert and seed-dependent coverage is stable independently of float',()=>{
  assert.equal(P.rarity({skin:'blue-gem'}).rank,3);
  const a={skin:'blue-gem',seed:661,float:.01},b={...a,float:.99};
  assert.equal(P.patternInfo(a).coverage,99);
  assert.deepEqual(P.patternInfo(a),P.patternInfo(b));
  assert.notEqual(P.art(a,'gem'),P.art(b,'gem'));
  const coverage=[];
  for(let seed=1;seed<=1000;seed++)coverage.push(P.patternInfo({...a,seed}).coverage);
  assert.ok(Math.min(...coverage)<20);assert.ok(Math.max(...coverage)>=99);
  assert.ok(new Set(coverage).size>65);
  assert.equal(P.patternInfo({skin:'blueprint',seed:661}),null);
  const state=P.fresh(100);state.inventory=[{...a,uid:'gem',case:'service',acquired:1}];state.equipped='gem';state.soundMuted=true;
  const restored=P.restore(state,100);
  assert.equal(restored.soundMuted,true);assert.equal(restored.inventory[0].seed,661);assert.equal(restored.equipped,'gem');
});
test('the minimum resale floor is included in the case expected returns',()=>{
  for(const box of P.cases){
    const expected=box.weights.reduce((sum,chance,i)=>{const value=P.rarities[i].value;return sum+chance/100*(value/2+1/(2*value));},0);
    assert.ok(Math.abs(P.expectedResale(box.id)-expected)<1e-10);
    assert.ok(expected<box.price);
  }
  for(const s of P.skins)for(const f of [0,.99,.99999,1])assert.ok(P.salePrice({skin:s.id,float:f})>=1);
});
test('premium high-rarity chances are reduced and every case has a net resale loss',()=>{
  const old=[[65,25,8,1.8,.2],[40,35,19,5,1],[15,38,32,12,3]];
  P.cases.forEach((box,index)=>{
    if(index){assert.ok(box.weights[3]<old[index][3]);assert.ok(box.weights[4]<old[index][4]);}
    assert.ok(P.expectedResale(box.id)<box.price);
    let seed=123456789;
    const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    let sum=0;for(let i=0;i<30000;i++)sum+=P.salePrice(P.draw(box.id,rng));
    assert.ok(sum/30000<box.price);assert.ok(Math.abs(sum/30000-P.expectedResale(box.id))<.5);
  });
});
