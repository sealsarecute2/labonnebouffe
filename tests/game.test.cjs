const {test} = require('node:test');
const assert = require('node:assert/strict');
const G = require('../game-engine.js');
const E = require('../engine.js');
function seeded(seed = 22) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function solve(s) {
  if (s.order.kind === 'plate') { for (const id of s.order.ids) G.toggle(s, id); G.serve(s); }
  else G.serve(s, G.word(s.order.ids[0])[s.order.target].split(' / ')[0]);
}
test('all menus produce playable, unambiguous tickets in both directions', () => {
  for (const category of ['all', ...G.foodTopics]) for (const direction of ['fr-en','en-fr']) {
    const s = G.create({category,direction}, seeded());
    for (let n = 0; n < 20; n++) {
      const o = s.order;
      assert.ok(o.ids.length >= 1 && o.ids.length <= 3);
      assert.equal(new Set(o.ids).size, o.ids.length);
      assert.equal(o.choices.length, Math.min(9,G.deck(category).length));
      for (const id of o.ids) {
        assert.ok(G.deck(category).some(w => w.id === id));
        assert.ok(o.choices.includes(id));
        const choices = o.choices.filter(other => E.matches(G.word(other)[o.target], G.word(id), o.target));
        assert.equal(choices.length, 1);
      }
      solve(s); assert.equal(s.phase, 'feedback'); G.next(s);
    }
  }
});
test('difficulty grows and every fourth ticket practises recall in the opposite direction', () => {
  const s = G.create({}, seeded());
  assert.equal(s.order.ids.length,1);
  solve(s); G.next(s); solve(s); G.next(s);
  assert.equal(s.order.ids.length,2);
  solve(s); G.next(s);
  assert.equal(s.order.kind,'restock'); assert.equal(s.order.target,'fr');
  for(let i=0;i<5;i++){solve(s);G.next(s);}
  assert.equal(s.order.ids.length,3);
});
test('serving twice cannot farm points, tips or recall progress', () => {
  const s=G.create({},seeded()); solve(s);
  const snapshot=G.summary(s);
  assert.equal(s.served,1); assert.ok(s.score>100); assert.equal(s.recalls.length,1);
  G.serve(s);G.skip(s);G.tick(s,3000);
  assert.deepEqual(G.summary(s),snapshot);
});
test('wrong ingredients teach the translation and corrected words remain in review', () => {
  const s=G.create({},seeded()), id=s.order.ids[0];
  G.toggle(s,s.order.choices.find(x=>x!==id)); G.serve(s);
  assert.equal(s.phase,'correction'); assert.equal(s.served,0);assert.equal(s.score,0);
  const time=s.remaining;G.tick(s,10000);assert.equal(s.remaining,time);
  G.retry(s);solve(s);
  assert.equal(s.served,1);assert.equal(s.streak,0);assert.ok(s.review.includes(id));
  assert.deepEqual(s.recalls,[{id,correct:false,assisted:true}]);
  G.next(s);solve(s);G.next(s);
  assert.ok(s.order.ids.includes(id));
  solve(s);assert.ok(!s.review.includes(id));
});
test('a hint prevents mastery and combo credit even when the order is served', () => {
  const s=G.create({},seeded()),id=s.order.ids[0];G.hint(s);solve(s);
  assert.equal(s.recalls[0].correct,false);assert.ok(s.review.includes(id));assert.equal(s.streak,0);
});
test('typing accepts listed variants and respects exact French accents', () => {
  const s=G.create({category:'drinks'},seeded());
  while(s.order.kind!=='restock'){solve(s);G.next(s);}
  s.order.ids=['drinks-coffee'];
  G.serve(s,'cafe',true);assert.equal(s.phase,'correction');
  G.retry(s);G.serve(s,'le café',true);assert.equal(s.phase,'feedback');
  assert.equal(s.recalls.at(-1).assisted,true);
});
test('patience expiry records exactly one missed recall and pauses for review', () => {
  const s=G.create({},seeded());G.tick(s,s.order.maxPatience+1);
  assert.equal(s.phase,'feedback');assert.equal(s.recalls.length,1);assert.equal(s.recalls[0].correct,false);
  const remaining=s.remaining;G.tick(s,30000);assert.equal(s.remaining,remaining);assert.equal(s.recalls.length,1);
});
test('pause, untimed practice and invalid elapsed time never consume the clock', () => {
  const s=G.create({},seeded());s.paused=true;G.tick(s,10000);assert.equal(s.remaining,120000);
  const p=s.order.patience;G.toggle(s,s.order.ids[0]);assert.equal(s.selected.length,0);
  s.paused=false;G.tick(s,-2);G.tick(s,NaN);assert.equal(s.remaining,120000);
  const untimed=G.create({timed:false},seeded());G.tick(untimed,9999999);
  assert.equal(untimed.phase,'active');assert.equal(untimed.remaining,120000);assert.equal(s.order.patience,p);
});
test('shift ending does not penalize unattempted words or deliver duplicate recalls', () => {
  const s=G.create({},seeded());G.tick(s,120000);
  assert.equal(s.phase,'finished');assert.equal(s.recalls.length,0);G.finish(s);assert.equal(s.recalls.length,0);
  const a=G.create({},seeded());G.hint(a);G.finish(a);G.finish(a);
  assert.equal(a.recalls.length,1);assert.equal(a.review.length,1);
});
test('clean streaks earn multipliers and misses break them', () => {
  const s=G.create({timed:false},seeded());
  for(let i=0;i<3;i++){solve(s);G.next(s);}
  const before=s.score;solve(s);assert.equal(s.score-before,200);assert.equal(s.streak,4);
  G.next(s);G.skip(s);assert.equal(s.streak,0);assert.equal(s.bestStreak,4);
});
