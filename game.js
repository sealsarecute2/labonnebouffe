/* Order Up! UI. Shares vocabulary and recall progress with the study tools. */
(() => {
  'use strict';
  const G = BOUFFE_GAME, E = BOUFFE_ENGINE, D = BOUFFE_DATA;
  const S = BOUFFE_PLATES;
  const $ = s => document.querySelector(s), host = $('#order-up');
  if (!host) return;
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KEY = 'bonne-bouffe.order-up.v1';
  const fresh = () => ({ version: 1, best: {}, totalTips: 0, shifts: 0, timed: true, direction: 'fr-en', category: 'all', cosmetics:S.fresh() });
  let saved = fresh(), storage = true, shift = null, view = 'study', delivered = 0, typed = '', committed = false;
  let previousTime = 0, announcement = '', lastSecond = -1;
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (value?.version === 1) {
      saved = { ...fresh(), timed: value.timed !== false, direction: value.direction === 'en-fr' ? 'en-fr' : 'fr-en',
        category: G.foodTopics.includes(value.category) ? value.category : 'all',
        totalTips: Math.max(0, Number(value.totalTips) || 0), shifts: Math.max(0, Number(value.shifts) || 0), best: {} };
      for (const [key, score] of Object.entries(value.best || {})) if (Number.isFinite(score) && score >= 0) saved.best[key] = score;
      saved.cosmetics=S.restore(value.cosmetics,saved.totalTips);
    }
  } catch { storage = false; }
  const money = n => '$' + n.toLocaleString('en-CA');
  const bestKey = () => `${saved.category}:${saved.direction}`;
  const level = () => saved.totalTips >= 350 ? 3 : saved.totalTips >= 100 ? 2 : 1;
  const levelName = () => ['Corner café', 'Neighbourhood favourite', 'House favourite'][level() - 1];
  const icon = {
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 7V5m-2 0h4M3 20h18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>'
  };
  const emoji = {
    Apple:'🍎', Grapefruit:'🍊', Raspberry:'🫐', Pear:'🍐', Strawberry:'🍓', Watermelon:'🍉', Mango:'🥭', Cherry:'🍒', Peach:'🍑', Pineapple:'🍍', Banana:'🍌', Orange:'🍊', Blueberry:'🫐', Grape:'🍇', Apricot:'🍑', Lemon:'🍋',
    Carrot:'🥕', Cucumber:'🥒', Celery:'🥬', Pepper:'🧂', Peas:'🫛', Eggplant:'🍆', Lettuce:'🥬', Potato:'🥔', Mushroom:'🍄', Broccoli:'🥦', Corn:'🌽', Squash:'🎃', Zucchini:'🥒', Cauliflower:'🥦', Cabbage:'🥬', Asparagus:'🌱',
    Cheese:'🧀', Milk:'🥛', Yogurt:'🥣', 'Ice cream':'🍨', Cream:'🥛', Butter:'🧈', 'Whipped cream':'🍦', 'Cream cheese':'🧀', 'Sour cream':'🥣', 'Cheese curds':'🧀',
    Fish:'🐟', Seafood:'🦐', Beef:'🥩', 'Goat meat':'🥩', Chicken:'🍗', Lamb:'🥩', Pork:'🥩', Bacon:'🥓', Eggs:'🥚', Nuts:'🥜', Tofu:'◻️', Beans:'🫘',
    Bread:'🍞', Pasta:'🍝', Rice:'🍚', Quinoa:'🥣', Wraps:'🌯', Oatmeal:'🥣', Couscous:'🥣', Crackers:'🍘', Cake:'🍰', Cupcake:'🧁', Pastries:'🥐', Pie:'🥧', Tart:'🥧', Cookies:'🍪', Chocolate:'🍫', Pudding:'🍮',
    Water:'💧', Juice:'🧃', Pop:'🥤', Tea:'🍵', 'Iced tea':'🧊', Coffee:'☕', 'Hot chocolate':'☕', Lemonade:'🍋', Smoothie:'🥤', Candy:'🍬', Pizza:'🍕', 'French fries':'🍟', Donut:'🍩', Hamburger:'🍔', 'Hot dog':'🌭', 'Potato chips':'🥔', Popcorn:'🍿', 'Macaroni and cheese':'🍝',
    Salt:'🧂', Sugar:'🥄', Cinnamon:'🫙', Vanilla:'🫙', Flour:'🌾', Vinegar:'🫙', 'Baking soda':'🥄', 'Baking powder':'🥄', 'Olive oil':'🫒'
  };
  const food = id => emoji[G.word(id).en] || '🥣';
  const short = (id, lang) => G.word(id)[lang].split(' / ')[0];
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); storage = true; } catch { storage = false; }
  }
  function say(message) {
    if (message === announcement) return;
    announcement = message;
    $('#announcer').textContent = message;
  }
  function deliver() {
    if (!shift) return;
    const records = shift.recalls.slice(delivered);
    delivered = shift.recalls.length;
    if (records.length) document.dispatchEvent(new CustomEvent('bouffe:game-recall', { detail: records }));
  }
  function bestScore() { return saved.best[bestKey()] || 0; }
  function changeView(next, focus = false) {
    rootShopDismiss();
    view = next;
    document.documentElement.dataset.view = next;
    host.hidden = next !== 'game';
    $('.workspace').hidden = next === 'game';
    $('.new-round').hidden = next === 'game';
    if (next === 'game') {
      document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', 'false'));
      $('#game-tab').setAttribute('aria-pressed', 'true');
      if (shift && shift.phase !== 'finished' && !shift.paused) shift.paused = true;
      render();
      if (focus) host.focus({ preventScroll: true });
    } else {
      $('#game-tab').setAttribute('aria-pressed', 'false');
      if (shift && shift.phase !== 'finished') shift.paused = true;
      document.dispatchEvent(new CustomEvent('bouffe:study-view'));
    }
  }
  function scene() {
    const finish=S.equipped(saved.cosmetics);
    return `<div class="cafe-scene cafe-level-${level()}"><div class="scene-decoration" aria-hidden="true">
      <div class="cafe-sign"><span>LA BONNE BOUFFE</span><strong>Order Up!</strong><span>OUVERT · OPEN</span></div>
      <div class="cafe-awning"></div><div class="cafe-window"><span></span><span></span><span></span></div>
      <div class="cafe-lamp lamp-one"></div><div class="cafe-lamp lamp-two"></div>
      <div class="cafe-plant"><i></i><i></i><i></i><b></b></div>
      <div class="scene-ticket"><span>TABLE 04</span><strong>La commande</strong><p>le poulet<br>le riz<br>le jus</p><div class="ticket-barcode"></div><small>MERCI BEAUCOUP</small></div>
      <div class="scene-counter"></div></div><button type="button" id="cafe-secret-plate" class="scene-plate ${finish?'has-skin':''}" data-game-action="shop" aria-label="Open plate collection">${finish?S.art(finish,'cafe-equipped'):''}<span aria-hidden="true">🍗</span><span aria-hidden="true">🍚</span></button><div class="scene-drink" aria-hidden="true">🧃</div>
      <span class="scene-stamp" aria-hidden="true">FRENCH<br>ON THE MENU</span><div class="scene-caption" aria-hidden="true"><i></i>${escape(levelName())}</div></div>`;
  }
  function lobby() {
    const nextLevel = level() === 1 ? 100 : 350;
    return `<div class="game-lobby"><div class="game-welcome"><span class="game-eyebrow">THE RESTAURANT GAME</span><h2>Order Up<span>!</span></h2><p class="game-lede">Read the order.<br>Build the plate. Keep it moving.</p><p class="game-description">Serve the right food to earn up to $5 per order. Faster clean orders pay more; missed words come back for practice.</p>
      <div class="game-setup"><fieldset><legend>Your shift</legend><div class="game-segment"><button data-game-setting="timed" data-value="true" aria-pressed="${saved.timed}">2-minute rush</button><button data-game-setting="timed" data-value="false" aria-pressed="${!saved.timed}">No pressure</button></div></fieldset>
      <div class="game-setup-row"><label>Orders in<select id="game-direction"><option value="fr-en" ${saved.direction === 'fr-en' ? 'selected' : ''}>French → English</option><option value="en-fr" ${saved.direction === 'en-fr' ? 'selected' : ''}>English → French</option></select></label><label>On the menu<select id="game-category"><option value="all">All food & drink</option>${D.categories.filter(c => G.foodTopics.includes(c.id)).map(c => `<option value="${c.id}" ${saved.category === c.id ? 'selected' : ''}>${escape(c.en)}</option>`).join('')}</select></label></div></div>
      <button class="game-primary game-start" data-game-action="start">${icon.bell}Open the kitchen${icon.arrow}</button><p class="game-start-note">${saved.timed ? 'Two minutes of service. Pauses whenever you need.' : 'No clock or patience meter. Finish whenever you like.'}</p></div>
      <div class="game-lobby-art">${scene()}<div class="cafe-profile"><div><span class="game-eyebrow">YOUR CAFÉ</span><strong>${escape(levelName())}</strong></div><div class="cafe-tips"><strong>${money(saved.totalTips)}</strong><span>lifetime tips</span></div></div><div class="cafe-upgrade"><span>${level() === 3 ? 'Your café is fully decorated.' : `${money(Math.max(0, nextLevel - saved.totalTips))} in tips until ${level() === 1 ? 'fresh plants & warm lights' : 'your house-favourite sign'}.`}</span><div><i style="width:${level() === 3 ? 100 : Math.min(100, saved.totalTips / nextLevel * 100)}%"></i></div></div></div></div>
      <div class="game-how"><div><span>01</span><p><strong>Read the ticket.</strong> Orders use your classroom vocabulary.</p></div><div><span>02</span><p><strong>Pick, then serve.</strong> Tap ingredients and ring the bell.</p></div><div><span>03</span><p><strong>Keep the kitchen stocked.</strong> Every fourth ticket is a typing challenge.</p></div></div>
      <div class="game-lobby-foot"><span>${storage ? 'Personal bests and café upgrades save on this device.' : 'Storage is unavailable. You can still play this visit.'}</span><span>${saved.timed ? `Personal best · ${bestScore().toLocaleString()} pts` : 'Untimed practice · no score to beat'}</span></div>`;
  }
  function clock() { const n = Math.ceil(shift.remaining / 1000); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; }
  function metrics() {
    const multiplier = Math.min(4, 1 + Math.floor(Math.max(0, shift.streak - 1) / 3));
    return `<div class="game-metrics"><div class="game-metric game-clock ${shift.timed && shift.remaining <= 20000 ? 'clock-low' : ''}"><span>${shift.timed ? 'SHIFT LEFT' : 'YOUR PACE'}</span><strong id="game-clock">${shift.timed ? clock() : '∞'}</strong></div><div class="game-metric"><span>SCORE</span><strong id="game-score">${shift.score.toLocaleString()}</strong></div><div class="game-metric"><span>SERVED</span><strong>${shift.served}</strong></div><div class="game-metric"><span>TIPS</span><strong>${money(shift.tips)}</strong></div><div class="game-combo ${shift.streak >= 3 ? 'combo-hot' : ''}"><strong>×${multiplier}</strong><span>${shift.streak ? `${shift.streak} clean ${shift.streak === 1 ? 'order' : 'orders'}` : 'Build your streak'}</span><div>${[0,1,2].map(i => `<i class="${shift.streak > i ? 'lit' : ''}"></i>`).join('')}</div></div><button class="game-pause icon-button" data-game-action="pause" aria-label="Pause shift" title="Pause shift (Esc)">${icon.pause}</button></div>`;
  }
  function translations(ids) { return ids.map(id => `<div><span lang="fr">${escape(short(id, 'fr'))}</span><span lang="en">${escape(short(id, 'en'))}</span></div>`).join(''); }
  function ticket() {
    const o = shift.order, source = o.target === 'en' ? 'fr' : 'en', restock = o.kind === 'restock';
    return `<aside class="order-ticket"><div class="ticket-meta"><span>${restock ? 'FROM THE CHEF' : `TABLE ${String(o.table).padStart(2, '0')}`}</span><span>#${String(shift.number).padStart(3, '0')}</span></div><h3>${restock ? 'Restock.' : 'La commande'}</h3><p class="ticket-instruction">${restock ? `Write the ${o.target === 'fr' ? 'French' : 'English'} label.` : `Find the ${o.target === 'en' ? 'English' : 'French'} ingredients.`}</p><div class="ticket-items" lang="${source}">${o.ids.map((id, i) => `<div><span>${String(i + 1).padStart(2, '0')}</span><strong>${escape(short(id, source))}</strong></div>`).join('')}</div>
      <div class="ticket-total"><span>${restock ? 'STOCK REQUEST' : 'ITEMS TO PLATE'}</span><strong>${o.ids.length}</strong></div>${shift.timed ? `<div class="patience-label"><span>Table patience</span><span id="patience-text">${Math.ceil(o.patience / 1000)}s</span></div><div class="patience-track"><i id="patience-fill" style="width:${o.patience / o.maxPatience * 100}%"></i></div>` : '<p class="ticket-patient">Take your time. The table can wait.</p>'}<div class="ticket-barcode"></div><small class="ticket-thanks">BON APPÉTIT · THANK YOU</small></aside>`;
  }
  function plate() {
    const o = shift.order, selected = shift.selected;
    const finish=S.equipped(saved.cosmetics);
    return `<div class="plating-area"><div class="plating-heading"><span class="game-eyebrow">THE PASS</span><span>${selected.length} / ${o.ids.length} ${o.ids.length === 1 ? 'item' : 'items'}</span></div><div class="game-plate ${selected.length ? 'has-food' : ''} ${finish?'has-skin':''}">${finish?S.art(finish,'game-equipped'):''}${selected.length ? selected.map(id => `<button class="plated-food" data-game-pick="${id}" aria-label="Remove ${escape(short(id, o.target))}"><span aria-hidden="true">${food(id)}</span><small lang="${o.target}">${escape(short(id, o.target))}</small></button>`).join('') : `<div class="empty-plate">${icon.bell}<span>Your plate is waiting.</span><small>Choose ingredients below.</small></div>`}</div><div class="game-service-actions"><button class="game-text-button" data-game-action="hint">${o.hint ? 'Translations shown below' : 'Need a translation?'}</button><button class="game-primary" data-game-action="serve" ${selected.length ? '' : 'disabled'}>${icon.bell}Serve order<span class="game-key">↵</span></button></div>${o.hint ? `<div class="game-hint">${translations(o.ids)}<p>This order stays in your review collection.</p></div>` : ''}</div>
      <div class="ingredient-heading"><h3>Your ingredients</h3><span>Select to plate · Select again to remove</span></div><div class="ingredient-grid">${o.choices.map((id, i) => `<button class="ingredient ${selected.includes(id) ? 'is-plated' : ''}" data-game-pick="${id}" aria-pressed="${selected.includes(id)}"><span class="ingredient-number" aria-hidden="true">${i + 1}</span><span class="ingredient-art" aria-hidden="true">${food(id)}</span><span class="ingredient-name" lang="${o.target}">${escape(short(id, o.target))}</span><span class="ingredient-check" aria-hidden="true">${selected.includes(id) ? '✓' : '+'}</span></button>`).join('')}</div>`;
  }
  function restock() {
    const o = shift.order, w = G.word(o.ids[0]);
    return `<div class="restock-area"><div class="restock-crate" aria-hidden="true"><span>${food(w.id)}</span><i>LA BONNE BOUFFE</i></div><span class="game-eyebrow">KITCHEN RESTOCK</span><h3>A fresh delivery.</h3><p>Translate the label to put this ingredient back on the shelf.</p><form id="restock-form"><label for="restock-answer">${o.target === 'fr' ? 'French' : 'English'} translation</label><input id="restock-answer" class="answer-input" value="${escape(typed)}" lang="${o.target}" placeholder="Type the ${o.target === 'fr' ? 'French' : 'English'} word…" autocomplete="off" autocapitalize="none" spellcheck="false"><div class="restock-input-note"><span>${o.target === 'fr' ? 'Articles optional · ' + (strict() ? 'Exact accents on' : 'Accents optional') : 'Listed alternatives accepted'}</span><button type="button" class="game-text-button" data-game-action="hint">Show translation</button></div>${o.target === 'fr' ? `<div class="accent-row">${['é','è','ê','à','ç','œ'].map(c => `<button type="button" class="accent-key" data-game-accent="${c}" aria-label="Insert ${c}">${c}</button>`).join('')}</div>` : ''}${o.hint ? `<div class="game-hint">${translations(o.ids)}<p>This word stays in your review collection.</p></div>` : ''}<button class="game-primary" type="submit">Stock the shelf${icon.arrow}</button></form></div>`;
  }
  function strict() { return document.documentElement.dataset.exactAccents === 'true'; }
  function feedback() {
    const f = shift.feedback, correction = shift.phase === 'correction', success = f.type === 'served';
    return `<div class="game-feedback ${success ? 'game-feedback-good' : ''}"><div class="feedback-seal">${success ? icon.check : icon.bell}</div><span class="game-eyebrow">${correction ? 'A MOMENT TO LEARN' : success ? 'SERVICE, PLEASE' : 'KEEP THIS ONE FOR REVIEW'}</span><h3>${correction ? 'Check the ticket.' : success ? (f.clean ? 'Beautifully served.' : 'Back on the menu.') : 'On to the next table.'}</h3><p>${correction ? f.reason : success ? `${f.clean ? `Served in ${(shift.order.elapsed/1000).toFixed(1)}s.` : 'A little practice makes it stick.'} +${f.earned} points · ${money(f.tip)} in tips.` : f.reason}</p><div class="game-translation-list">${translations(shift.order.ids)}</div>${!correction && !f.clean ? '<p class="feedback-review-note">These words will come back for another go.</p>' : ''}<button class="game-primary" data-game-action="${correction ? 'retry' : 'next'}">${correction ? 'Try this order again' : 'Next ticket'}${icon.arrow}</button><small>Clock paused while you read.</small></div>`;
  }
  function pauseScreen() {
    return `<div class="game-paused" role="dialog" aria-modal="true" aria-labelledby="pause-title"><div>${icon.pause}<span class="game-eyebrow">TAKE A BREATHER</span><h3 id="pause-title">Kitchen on pause.</h3><p>Your ticket and your time are right where you left them.</p><button class="game-primary" data-game-action="resume">${icon.play}Back to the kitchen</button><button class="game-text-button" data-game-action="finish">Finish this shift</button></div></div>`;
  }
  function kitchen() {
    return `<div class="kitchen-shell"><div class="kitchen-content" ${shift.paused ? 'inert' : ''}>${metrics()}<div class="kitchen-status"><span><i></i>${shift.order.kind === 'restock' ? 'Restock the kitchen' : 'Service is open'}</span><span>${saved.direction === 'fr-en' ? 'French orders · English ingredients' : 'English orders · French ingredients'}</span></div><div class="kitchen-body">${ticket()}<div class="kitchen-work">${shift.phase === 'correction' || shift.phase === 'feedback' ? feedback() : shift.order.kind === 'restock' ? restock() : plate()}</div></div><div class="kitchen-footer"><button class="game-text-button" data-game-action="skip" ${shift.phase !== 'active' ? 'disabled' : ''}>Pass this ticket</button><span>1–9 select · Enter serve · Esc pause</span><button class="game-text-button" data-game-action="finish">Finish shift</button></div></div>${shift.paused ? pauseScreen() : ''}</div>`;
  }
  function endScreen() {
    const r = G.summary(shift), best = shift.newBest;
    const grade = r.accuracy >= 90 && r.served >= 3 ? 'An excellent service.' : r.served ? 'That’s a wrap.' : 'Every chef starts somewhere.';
    return `<div class="game-end"><span class="game-end-stamp">SERVICE<br>COMPLETED</span><span class="game-eyebrow">KITCHEN CLOSED · NICELY DONE</span><h2>${grade}</h2><p>${shift.timed ? 'Your two-minute shift' : 'Your practice shift'} is complete. ${r.review.length ? 'A few words are ready for another look.' : r.served ? 'Everything you served is a little more familiar.' : 'Open the kitchen again whenever you’re ready.'}</p><div class="game-final-score"><strong>${r.score.toLocaleString()}</strong><span>POINTS ${best ? '· NEW PERSONAL BEST' : !shift.timed ? '· UNTIMED PRACTICE' : ''}</span></div><div class="game-end-stats"><div><strong>${r.served}</strong><span>orders served</span></div><div><strong>${r.accuracy}%</strong><span>clean recalls</span></div><div><strong>${r.bestStreak}</strong><span>best streak</span></div><div><strong>${money(r.tips)}</strong><span>tips earned</span></div></div><div class="game-end-actions"><button class="game-primary" data-game-action="start">${icon.bell}Another shift</button><button class="game-secondary" data-game-action="lobby">Back to your café</button>${r.review.length ? `<button class="game-text-button" data-game-action="review">Practise ${r.review.length} missed ${r.review.length === 1 ? 'word' : 'words'} →</button>` : ''}</div>${r.review.length ? `<div class="game-end-review"><span class="game-eyebrow">BACK ON THE MENU NEXT TIME</span><div class="game-translation-list">${translations(r.review)}</div></div>` : ''}<p class="game-end-save">${storage ? 'Your café, personal best, and word review are saved on this device.' : 'Storage is unavailable. Your results last for this visit.'}</p></div>`;
  }
  function render(focus = false) {
    host.innerHTML = !shift ? lobby() : shift.phase === 'finished' ? endScreen() : kitchen();
    lastSecond = -1;
    if (focus && shift?.phase === 'active' && !shift.paused) {
      if (shift.order.kind === 'restock') $('#restock-answer')?.focus({ preventScroll: true });
      else host.focus({ preventScroll: true });
    }
  }
  function start() {
    shift = G.create(saved); delivered = 0; typed = ''; committed = false; previousTime = 0;
    render(true); say('Kitchen open. Read the ticket and choose the matching ingredients.');
  }
  function conclude() {
    if (!shift || committed) return;
    G.finish(shift); deliver();
    const r = G.summary(shift);
    saved.totalTips += r.tips; saved.shifts++;
    saved.cosmetics.balance+=r.tips;
    shift.newBest = shift.timed && r.score > bestScore();
    if (shift.timed) saved.best[bestKey()] = Math.max(bestScore(), r.score);
    persist(); committed = true; render(); host.focus({ preventScroll: true });
    say(`Shift finished. ${r.served} orders served. ${r.score} points. ${r.review.length} words to review.`);
  }
  function serve() {
    if (!shift || shift.paused || shift.phase !== 'active') return;
    if (shift.order.kind === 'restock') {
      typed = $('#restock-answer')?.value || '';
      if (!typed.trim()) { $('#restock-answer')?.focus(); say('Type a translation, or pass this ticket.'); return; }
    } else if (!shift.selected.length) { say('Choose at least one ingredient before serving.'); return; }
    G.serve(shift, typed, strict()); deliver(); render();
    $('[data-game-action="retry"], [data-game-action="next"]')?.focus({ preventScroll: true });
    say(shift.phase === 'correction' ? 'Check the translations, then try this order again. The clock is paused.' : 'Order served. The clock is paused until your next ticket.');
  }
  const actions = {
    shop:()=>{if(shift)return;BOUFFE_PLATE_SHOP.open({host,state:saved.cosmetics,onChange:persist,onClose:()=>{render();$('#cafe-secret-plate')?.focus({preventScroll:true});}});},
    start, serve,
    next: () => { if (shift?.phase !== 'feedback') return; G.next(shift); typed = ''; render(true); say(`Ticket ${shift.number}. ${shift.order.kind === 'restock' ? 'Restock: type the translation.' : 'Select the ingredients on the ticket.'}`); },
    retry: () => { if (shift?.phase !== 'correction') return; G.retry(shift); typed = ''; render(true); say('Try the ticket again.'); },
    hint: () => { if (shift?.phase !== 'active' || shift.paused) return; typed = $('#restock-answer')?.value || typed; G.hint(shift); render(); say('Translation shown. This order stays in review.'); },
    skip: () => { if (!shift || shift.paused) return; G.skip(shift); deliver(); render(); $('[data-game-action="next"]')?.focus(); say('Ticket passed. Review the translations before continuing.'); },
    pause: () => { if (!shift || shift.phase === 'finished') return; typed = $('#restock-answer')?.value || typed; shift.paused = true; render(); $('[data-game-action="resume"]')?.focus(); say('Shift paused.'); },
    resume: () => { if (!shift) return; shift.paused = false; previousTime = performance.now(); render(true); say('Back in the kitchen.'); },
    finish: conclude,
    lobby: () => { if (shift && shift.phase !== 'finished') return; shift = null; render(); },
    review: () => {
      const ids = shift ? [...shift.review] : [];
      if (!ids.length) return;
      changeView('study');
      document.dispatchEvent(new CustomEvent('bouffe:game-review', { detail: ids }));
    }
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.view === 'game') { changeView('game', true); return; }
    if (b.dataset.mode) { changeView('study'); return; }
    if (view !== 'game') return;
    if (b.dataset.gameSetting) { saved.timed = b.dataset.value === 'true'; persist(); render(); return; }
    if (b.dataset.gamePick) { G.toggle(shift, b.dataset.gamePick); render(); $(`[data-game-pick="${b.dataset.gamePick}"]`)?.focus({ preventScroll: true }); return; }
    if (b.dataset.gameAccent) {
      const input = $('#restock-answer'); if (!input) return;
      const start = input.selectionStart ?? input.value.length;
      input.setRangeText(b.dataset.gameAccent, start, input.selectionEnd ?? start, 'end'); typed = input.value; input.focus(); return;
    }
    if (b.dataset.gameAction && actions[b.dataset.gameAction]) actions[b.dataset.gameAction]();
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'game-direction') { saved.direction = e.target.value; persist(); render(); }
    if (e.target.id === 'game-category') { saved.category = e.target.value; persist(); render(); }
  });
  document.addEventListener('input', e => { if (e.target.id === 'restock-answer') typed = e.target.value; });
  document.addEventListener('submit', e => { if (e.target.id === 'restock-form') { e.preventDefault(); serve(); } });
  document.addEventListener('keydown', e => {
    if (view !== 'game' || !shift || shift.phase === 'finished' || e.ctrlKey || e.metaKey || e.altKey || e.isComposing || document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape') { e.preventDefault(); if (shift.paused) actions.resume(); else actions.pause(); return; }
    if (shift.paused && e.key === 'Tab') {
      const buttons = [...document.querySelectorAll('.game-paused button')];
      const index = buttons.indexOf(document.activeElement);
      e.preventDefault();buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();return;
    }
    if (shift.paused || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); if (shift.phase === 'correction') actions.retry(); else if (shift.phase === 'feedback') actions.next(); else serve(); }
    if (shift.phase === 'active' && shift.order.kind === 'plate' && /^[1-9]$/.test(e.key)) { e.preventDefault(); const id = shift.order.choices[Number(e.key) - 1]; if (id) { G.toggle(shift, id); render(); host.focus({ preventScroll: true }); } }
  });
  function suspend() { if (shift && shift.phase !== 'finished' && !shift.paused) { shift.paused = true; render(); } }
  document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); previousTime = performance.now(); });
  window.addEventListener('blur', suspend);
  window.addEventListener('hashchange', () => { if (location.hash === '#order-up') changeView('game'); });
  document.addEventListener('bouffe:reset', () => { rootShopDismiss();saved = fresh(); persist(); shift = null; render(); });
  function rootShopDismiss(){if(globalThis.BOUFFE_PLATE_SHOP?.isOpen())BOUFFE_PLATE_SHOP.dismiss(false);}
  function frame(now) {
    const delta = previousTime ? now - previousTime : 0; previousTime = now;
    if (view === 'game' && shift?.phase === 'active' && !shift.paused && !document.querySelector('dialog[open]')) {
      G.tick(shift, delta);
      if (shift.phase === 'finished') conclude();
      else if (shift.phase === 'feedback') { deliver(); render(); say('Table patience ran out. Review the translations. The clock is paused.'); }
      else {
        const second = Math.ceil(shift.remaining / 1000);
        if (second !== lastSecond) { const c = $('#game-clock'); if (c && shift.timed) c.textContent = clock(); lastSecond = second; if (shift.timed && second === 20) say('Twenty seconds left in your shift.'); }
        const meter = $('#patience-fill'); if (meter) meter.style.width = `${shift.order.patience / shift.order.maxPatience * 100}%`;
        const text = $('#patience-text'); if (text) text.textContent = `${Math.ceil(shift.order.patience / 1000)}s`;
        $('.game-clock')?.classList.toggle('clock-low', shift.timed && shift.remaining <= 20000);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (location.hash === '#order-up') changeView('game');
})();
