const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../cafe-rewards.js');
const P=require('../plates.js');
test('each lifetime milestone unlocks exactly at its threshold and points to the next reward',()=>{
  assert.equal(R.milestones.length,10);
  for(const [index,m] of R.milestones.entries()){
    assert.equal(R.progress(m.tips-1).unlocked.length,index);
    const reached=R.progress(m.tips);
    assert.equal(reached.unlocked.length,index+1);assert.ok(reached.ids.includes(m.id));
    assert.equal(reached.title,m.title);assert.equal(reached.next,R.milestones[index+1]||null);
    assert.equal(reached.percent,reached.next?0:100);
  }
  assert.equal(R.progress(50).remaining,50);assert.ok(Math.abs(R.progress(50).percent-100/3)<1e-9);
  assert.equal(R.progress(99999).remaining,0);
  for(const value of [-5,NaN,Infinity,undefined])assert.equal(R.progress(value).total,0);
});
test('spending and reselling skins changes the wallet independently of lifetime decorations',()=>{
  const lifetime=350,state=P.fresh(lifetime),before=R.progress(lifetime);
  const item=P.open(state,'reserve',()=>.2,1).item;assert.equal(state.balance,290);P.sell(state,item.uid);
  assert.deepEqual(R.progress(lifetime),before);assert.ok(before.ids.includes('utensils'));
});
test('renamed finishes preserve owned IDs, pattern, float, and equipment on reload',()=>{
  const state=P.fresh(350);
  state.inventory=[{uid:'old-heat',skin:'hardened',seed:212,float:.05,case:'service',acquired:1},{uid:'old-gem',skin:'blue-gem',seed:661,float:.02,case:'reserve',acquired:2}];state.equipped='old-gem';
  const restored=P.restore(JSON.parse(JSON.stringify(state)),350);
  assert.deepEqual(restored.inventory,state.inventory);assert.equal(P.skin(restored.inventory[0]).name,'Heat Treated');
  assert.equal(P.skin(P.equipped(restored)).name,'Case Hardened');assert.equal(P.rarity(P.equipped(restored)).name,'Covert');
});
