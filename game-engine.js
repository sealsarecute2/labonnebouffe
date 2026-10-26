/* Order Up! — deterministic game rules, shared by the browser and tests. */
(function (root) {
  'use strict';
  const E = root.BOUFFE_ENGINE || (typeof require === 'function' && require('./engine.js'));
  const D = root.BOUFFE_DATA || (typeof require === 'function' && require('./data.js'));
  const foodTopics = ['fruit', 'vegetables', 'dairy', 'protein', 'grains', 'desserts', 'drinks', 'snacks', 'pantry'];
  const menu = D.words.filter(w => w.categories.some(c => foodTopics.includes(c)) && w.en !== 'Fast food');
  const byId = new Map(D.words.map(w => [w.id, w]));
  const word = id => byId.get(id);
  function deck(category) { return category === 'all' ? menu : menu.filter(w => w.categories.includes(category)); }
  function create(options = {}, random = Math.random) {
    const s = {
      timed: options.timed !== false, direction: options.direction === 'en-fr' ? 'en-fr' : 'fr-en',
      category: foodTopics.includes(options.category) ? options.category : 'all',
      phase: 'active', paused: false, remaining: 120000, served: 0, score: 0, tips: 0,
      streak: 0, bestStreak: 0, number: 0, seen: [], review: [], recalls: [], selected: [],
      feedback: null, order: null, random
    };
    next(s);
    return s;
  }
  function next(s) {
    if (s.phase === 'finished') return;
    s.number++;
    s.phase = 'active'; s.feedback = null; s.selected = [];
    const pool = deck(s.category);
    const restock = s.number % 4 === 0;
    const size = restock ? 1 : Math.min(pool.length, s.served < 2 ? 1 : s.served < 6 ? 2 : 3);
    const due = s.review.filter(id => pool.some(w => w.id === id));
    const candidates = E.shuffle(pool.filter(w => !s.seen.slice(-8).includes(w.id)), s.random);
    const shuffled = [...candidates, ...E.shuffle(pool, s.random)];
    const ids = [];
    // A missed word returns after a different order, rather than disappearing into a queue.
    if (due.length && !s.order?.ids.includes(due[0])) ids.push(due[0]);
    for (const w of shuffled) { if (ids.length >= size) break; if (!ids.includes(w.id)) ids.push(w.id); }
    const target = s.direction === 'fr-en' ? 'en' : 'fr';
    const choices = [...ids];
    for (const w of E.shuffle(pool, s.random)) {
      if (!choices.includes(w.id) && !choices.some(id => E.matches(w[target], word(id), target))) choices.push(w.id);
      if (choices.length >= Math.min(9, pool.length)) break;
    }
    const patience = 26000 + (size - 1) * 6500;
    s.order = { ids, kind: restock ? 'restock' : 'plate', target: restock ? (target === 'en' ? 'fr' : 'en') : target,
      choices: E.shuffle(choices, s.random), errors: [], hint: false, patience, maxPatience: patience,
      table: 1 + Math.floor(s.random() * 8) };
    s.seen.push(...ids);
  }
  function toggle(s, id) {
    if (s.phase !== 'active' || s.paused || s.order.kind !== 'plate' || !s.order.choices.includes(id)) return;
    s.selected = s.selected.includes(id) ? s.selected.filter(x => x !== id) : [...s.selected, id];
  }
  function addReview(s, id) { if (!s.review.includes(id)) s.review.push(id); }
  function settle(s, correct, reason) {
    const o = s.order;
    const clean = correct && o.errors.length === 0 && !o.hint;
    if (correct) {
      s.served++;
      s.streak = clean ? s.streak + 1 : 0;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      const multiplier = Math.min(4, 1 + Math.floor(Math.max(0, s.streak - 1) / 3));
      const earned = clean ? o.ids.length * 100 * multiplier + (s.timed ? Math.ceil(o.patience / 1000) * 2 : 0) : o.ids.length * 40;
      const tip = clean ? o.ids.length * 3 * multiplier : 1;
      s.score += earned; s.tips += tip;
      s.feedback = { type: 'served', clean, earned, tip, reason };
    } else {
      s.streak = 0; s.feedback = { type: 'missed', reason, earned: 0, tip: 0 };
    }
    for (const id of o.ids) {
      const recalled = correct && !o.errors.includes(id) && !o.hint;
      s.recalls.push({ id, correct: recalled, assisted: !recalled && correct });
      if (recalled) s.review = s.review.filter(x => x !== id); else addReview(s, id);
    }
    s.phase = 'feedback';
    return s.feedback;
  }
  function serve(s, input = '', strict = false) {
    if (s.phase !== 'active' || s.paused) return null;
    const o = s.order;
    const correct = o.kind === 'restock'
      ? E.matches(input, word(o.ids[0]), o.target, strict && o.target === 'fr')
      : s.selected.length === o.ids.length && o.ids.every(id => s.selected.includes(id));
    if (correct) return settle(s, true);
    const missed = o.kind === 'restock' || s.selected.some(id => !o.ids.includes(id)) ? o.ids : o.ids.filter(id => !s.selected.includes(id));
    missed.forEach(id => { if (!o.errors.includes(id)) o.errors.push(id); addReview(s, id); });
    s.streak = 0; s.phase = 'correction';
    s.feedback = { type: 'correction', reason: 'Check the translation, then try this order again.' };
    return s.feedback;
  }
  function retry(s) {
    if (s.phase !== 'correction') return;
    s.phase = 'active'; s.feedback = null; s.selected = [];
    s.order.patience = Math.max(s.order.patience, s.order.maxPatience * .65);
  }
  function skip(s) { if (s.phase === 'active' && !s.paused) return settle(s, false, 'Passed to another chef.'); }
  function hint(s) {
    if (s.phase !== 'active' || s.paused) return;
    s.order.hint = true; s.streak = 0;
    s.order.ids.forEach(id => addReview(s, id));
  }
  function finish(s) {
    if (s.phase === 'finished') return;
    // Preserve mistakes on an unfinished ticket without treating an unseen word as a failure.
    if (['active', 'correction'].includes(s.phase)) {
      for (const id of s.order.ids) if (s.order.errors.includes(id) || s.order.hint) {
        s.recalls.push({ id, correct: false, assisted: false }); addReview(s, id);
      }
    }
    s.phase = 'finished'; s.paused = false;
  }
  function tick(s, delta) {
    if (s.phase !== 'active' || s.paused || !s.timed || !Number.isFinite(delta) || delta <= 0) return;
    s.remaining = Math.max(0, s.remaining - delta);
    s.order.patience = Math.max(0, s.order.patience - delta);
    if (s.remaining === 0) finish(s);
    else if (s.order.patience === 0) settle(s, false, 'The table had to leave.');
  }
  function summary(s) {
    return { score: s.score, served: s.served, tips: s.tips, bestStreak: s.bestStreak,
      accuracy: s.recalls.length ? Math.round(s.recalls.filter(r => r.correct).length / s.recalls.length * 100) : 0,
      review: [...s.review], recalls: [...s.recalls] };
  }
  const game = { foodTopics, menu, word, deck, create, next, toggle, serve, retry, skip, hint, finish, tick, summary };
  root.BOUFFE_GAME = game;
  if (typeof module !== 'undefined') module.exports = game;
})(globalThis);
