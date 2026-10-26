const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../engine.js');
const {words,categories}=require('../data.js');
const word=en=>words.find(w=>w.en===en);
test('all 130 unique source entries have complete translations and valid topics',()=>{
  assert.equal(words.length,130);assert.equal(new Set(words.map(w=>w.id)).size,130);
  for(const w of words){assert.ok(w.en.trim()&&w.fr.trim());assert.ok(w.categories.length);assert.ok(w.categories.every(id=>categories.some(c=>c.id===id)));}
  assert.equal(words.filter(w=>w.categories.length>1).length,2);
  assert.equal(categories.reduce((n,c)=>n+words.filter(w=>w.categories.includes(c.id)).length,0),132);
});
test('French articles, accents, apostrophes, ligatures and listed variants',()=>{
  for(const w of words) for(const a of E.answers(w,'fr')) assert.ok(E.matches(a,w,'fr'),`${w.en}: ${a}`);
  assert.ok(E.matches('pomme',word('Apple'),'fr'));
  assert.ok(E.matches(' LA POMME ',word('Apple'),'fr'));
  assert.ok(E.matches('creme glacee',word('Ice cream'),'fr'));
  assert.ok(E.matches("l'huile d'olive",word('Olive oil'),'fr'));
  assert.ok(E.matches('les oeufs',word('Eggs'),'fr',true));
  assert.ok(E.matches('délicieuse',word('Delicious'),'fr',true));
  assert.ok(E.matches('le smoothie',word('Smoothie'),'fr'));
  assert.ok(E.matches('le lardon',word('Bacon'),'fr'));
  assert.ok(E.matches('la courgette',word('Zucchini'),'fr'));
  assert.ok(E.matches('chou fleur',word('Cauliflower'),'fr'));
});
test('exact accent mode rejects missing or incorrect accents',()=>{
  assert.equal(E.matches('creme glacee',word('Ice cream'),'fr',true),false);
  assert.equal(E.matches('cafe',word('Coffee'),'fr',true),false);
  assert.ok(E.matches('café',word('Coffee'),'fr',true));
  assert.equal(E.matches('délicieusé',word('Delicious'),'fr',true),false);
});
test('English synonyms and singular/plural forms are explicit, not fuzzy matches',()=>{
  assert.ok(E.matches('raspberries',word('Raspberry'),'en'));
  assert.ok(E.matches('soda',word('Pop'),'en'));
  assert.ok(E.matches('to hate',word('To dislike'),'en'));
  assert.ok(E.matches('savory',word('Savoury'),'en'));
  assert.ok(E.matches('the apple',word('Apple'),'en'));
  assert.equal(E.matches('apply',word('Apple'),'en'),false);
  assert.equal(E.matches('pomme de terre',word('Apple'),'fr'),false);
  assert.equal(E.matches('',word('Apple'),'en'),false);
  assert.equal(E.matches(' ',word('Apple'),'fr'),false);
});
test('all modes and topics create distinct, complete questions with one valid choice',()=>{
  for(const deck of [words,...categories.map(c=>words.filter(w=>w.categories.includes(c.id)))]){
    for(const direction of ['mixed','fr-en','en-fr']){
      const questions=E.makeQuestions(deck,words,direction,0);
      assert.equal(questions.length,deck.length);assert.equal(new Set(questions.map(q=>q.id)).size,deck.length);
      for(const [i,q] of questions.entries()){
        assert.equal(q.target,direction==='mixed'?(i%2===0?'en':'fr'):direction==='fr-en'?'en':'fr');
        assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(o=>o.id)).size,4);
        const w=words.find(w=>w.id===q.id);
        assert.equal(q.options.filter(o=>E.matches(o.label,w,q.target)).length,1);
      }
    }
  }
});
test('short topics, empty collections and round sizes',()=>{
  assert.equal(E.makeQuestions(words,words,'mixed',10).length,10);
  assert.equal(E.makeQuestions(words,words,'mixed',20).length,20);
  assert.equal(E.makeQuestions(words,words,'mixed',0).length,130);
  assert.equal(E.makeQuestions(words.slice(0,3),words,'mixed',20).length,3);
  assert.deepEqual(E.makeQuestions([],words),[]);
});
test('learning requires two independent recalls; mistakes and hints reset learning',()=>{
  let p=E.updateProgress(undefined,true);assert.equal(p.streak,1);
  p=E.updateProgress(p,true);assert.equal(p.streak,2);
  p=E.updateProgress(p,false);assert.equal(p.streak,0);assert.equal(p.correct,2);assert.equal(p.attempts,3);
  p=E.updateProgress(p,true,true);assert.equal(p.streak,0);assert.equal(p.correct,3);
});
