const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../plates.js');
const rolls=(...values)=>{let i=0;return ()=>values[i++%values.length];};
test('case odds add to 100 and every tier has a finish',()=>{
  for(const c of P.cases){assert.equal(c.weights.reduce((a,b)=>a+b,0),100);assert.ok(c.price>0);}
  for(let n=0;n<5;n++)assert.ok(P.skins.some(s=>s.rarity===n));
  assert.equal(new Set(P.skins.map(s=>s.id)).size,14);
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
