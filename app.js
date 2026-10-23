/* No network requests, accounts, or dependencies. */
(() => {
  'use strict';
  const {words,categories}=BOUFFE_DATA, E=BOUFFE_ENGINE;
  const byId=new Map(words.map(w=>[w.id,w]));
  const $=s=>document.querySelector(s);
  const html=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KEY='bonne-bouffe.v1';
  const defaults={version:1,mode:'flashcards',category:'all',direction:'mixed',length:10,strict:false,theme:'system',progress:{},bookmarks:[],session:null};
  let storageAvailable=true, toastTimer, inputTimer;
  let state={...defaults};
  try {
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved?.version===1){
      state={...defaults,...saved};
      state.mode=['flashcards','quiz','typing'].includes(saved.mode)?saved.mode:'flashcards';
      state.category=['all','review','saved',...categories.map(c=>c.id)].includes(saved.category)?saved.category:'all';
      state.direction=['mixed','fr-en','en-fr'].includes(saved.direction)?saved.direction:'mixed';
      state.length=[0,10,20].includes(saved.length)?saved.length:10;
      state.strict=!!saved.strict;
      state.theme=['system','light','dark'].includes(saved.theme)?saved.theme:'system';
      state.bookmarks=Array.isArray(saved.bookmarks)?saved.bookmarks.filter(id=>byId.has(id)):[];
      state.progress={};
      for(const [id,p] of Object.entries(saved.progress||{})){
        if(byId.has(id)&&p&&Number.isFinite(p.attempts)&&Number.isFinite(p.correct)&&Number.isFinite(p.streak)) state.progress[id]={attempts:Math.max(0,p.attempts),correct:Math.max(0,p.correct),streak:Math.max(0,p.streak),lastSeen:Number(p.lastSeen)||0};
      }
    }
  } catch {storageAvailable=false;}
  const deviceTheme=typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme: dark)'):null;
  function currentTheme(){return state.theme==='system'?(deviceTheme?.matches?'dark':'light'):state.theme;}
  function applyTheme(){
    const dark=currentTheme()==='dark';
    document.documentElement.dataset.theme=state.theme;
    const button=$('#theme-toggle');
    if(button){
      button.setAttribute('aria-pressed',String(dark));
      button.title=dark?'Switch to light mode':'Switch to dark mode';
      button.innerHTML=dark?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 13.1A8.6 8.6 0 0 1 10.9 3.5a8.6 8.6 0 1 0 9.6 9.6Z"/></svg>';
    }
    const meta=$('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',dark?'#151517':'#f5f5f7');
    const setting=$('#settings-theme');
    if(setting)setting.value=state.theme;
  }
  function setTheme(theme){state.theme=['system','light','dark'].includes(theme)?theme:'system';applyTheme();save();}
  deviceTheme?.addEventListener?.('change',()=>{if(state.theme==='system')applyTheme();});
  function save(){
    try{localStorage.setItem(KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;}
    const caption=$('#save-caption');
    if(caption)caption.innerHTML=storageAvailable?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>Progress saved on this device.':'Progress lasts for this visit. Browser storage is unavailable.';
  }
  function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200);}
  function announce(message){$('#announcer').textContent='';requestAnimationFrame(()=>{$('#announcer').textContent=message;});}
  function reviewWords(){return words.filter(w=>state.progress[w.id]?.attempts>0&&state.progress[w.id].streak===0);}
  function pool(){return state.category==='review'?reviewWords():state.category==='saved'?words.filter(w=>state.bookmarks.includes(w.id)):state.category==='all'?words:words.filter(w=>w.categories.includes(state.category));}
  function validSession(s){
    return s&&s.mode===state.mode&&Array.isArray(s.questions)&&Array.isArray(s.responses)&&Number.isInteger(s.index)&&s.index>=0&&s.index<=s.questions.length&&s.questions.every(q=>byId.has(q.id)&&['en','fr'].includes(q.target)&&Array.isArray(q.options)&&q.options.length===4&&q.options.every(o=>byId.has(o.id)))&&s.responses.every(r=>r&&byId.has(r.id)&&typeof r.correct==='boolean')&&s.responses.length>=s.index;
  }
  function startRound(ids){
    const deck=ids?ids.map(id=>byId.get(id)).filter(Boolean):pool();
    state.session={mode:state.mode,questions:E.makeQuestions(deck,words,state.direction,ids?0:state.length),index:0,responses:[],revealed:false,hinted:false,typed:''};
    save();render();
  }
  function current(){const s=state.session;return s.questions[s.index];}
  function answer(){return state.session.responses[state.session.index];}
  function displayLanguage(lang){return lang==='fr'?'French':'English';}
  function wordClass(value){return value.length>23?'word long-word':'word';}
  function starIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4Z"/></svg>';}
  function bookmark(w){const saved=state.bookmarks.includes(w.id);return `<button class="bookmark-button" data-bookmark="${w.id}" aria-pressed="${saved}" aria-label="${saved?'Unsave':'Save'} ${html(w.en)}" title="${saved?'Unsave':'Save'} word">${starIcon()}</button>`;}
  function categoryName(w){return categories.find(c=>w.categories.includes(c.id)&&(state.category==='all'||state.category==='review'||state.category==='saved'||c.id===state.category))?.en||categories.find(c=>w.categories.includes(c.id)).en;}
  function top(w){return `<div class="card-top"><span class="category-label">${html(categoryName(w))}${state.category==='review'?'<span class="round-tag">Review</span>':state.category==='saved'?'<span class="round-tag">Saved</span>':''}</span>${bookmark(w)}</div>`;}
  function note(w){return w.note?`<p class="card-note">${html(w.note)}</p>`:'';}
  function flashcard(q,w){
    const flipped=state.session.revealed,lang=flipped?q.target:q.target==='fr'?'en':'fr';
    return `${top(w)}<button class="flash-face" data-action="flip" aria-label="${html(displayLanguage(lang)+': '+w[lang]+'. '+(flipped?'Turn card back.':'Show '+displayLanguage(q.target)+' answer.'))}"><span class="language-label">${flipped?'THE '+displayLanguage(q.target)+' MEANING':displayLanguage(lang)}</span><span class="${wordClass(w[lang])}" lang="${lang}">${html(w[lang])}</span>${flipped?`<span class="front-word" lang="${lang==='fr'?'en':'fr'}">${html(w[lang==='fr'?'en':'fr'])}</span>`:'<span class="flip-cue"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6"/></svg>Tap to reveal</span>'}</button>${flipped?note(w):''}<div class="flash-footer">${flipped?'<button class="button review-button" data-action="flash-review">Still learning <span class="key-inline">1</span></button><button class="button know-button" data-action="flash-known">Got it <span class="key-inline">2</span></button>':'<button class="button primary" data-action="flip">Show answer <span class="key-inline">space</span></button>'}</div>`;
  }
  function feedback(q,w,r){
    if(!r)return '<p class="waiting-caption">'+(state.mode==='quiz'?'Choose the matching translation.':'Recall the word, then check your answer.')+'</p>';
    const title=r.skipped?'Let’s come back to this.':r.correct?r.assisted?'Correct, with a hint.':'That’s right.':'Keep this one for review.';
    return `<div class="feedback"><p class="feedback-title ${r.correct?'correct':'wrong'}">${title}</p><p class="feedback-answer" lang="${q.target}">${html(w[q.target])}</p></div><button class="button primary" data-action="next">${state.session.index===state.session.questions.length-1?'See results':'Continue'} <span aria-hidden="true">→</span></button>`;
  }
  function questionHeading(q,w){const lang=q.target==='fr'?'en':'fr';return `<p class="language-label">${displayLanguage(lang)} → ${displayLanguage(q.target)}</p><h2 class="${wordClass(w[lang])}" lang="${lang}">${html(w[lang])}</h2><p class="prompt-description">${q.target==='en'?'What does this mean in English?':'How do you say this in French?'}</p>`;}
  function quiz(q,w){
    const r=answer();
    const options=q.options.map((o,i)=>{
      const cls=r?(o.id===q.id?'is-correct':r.selected===o.id?'is-wrong':'is-muted'):'';
      return `<button class="option ${cls}" data-option="${o.id}" ${r?'disabled':''} aria-label="${i+1}. ${html(o.label)}"><span class="option-key" aria-hidden="true">${r&&o.id===q.id?'✓':r&&r.selected===o.id?'×':i+1}</span><span lang="${q.target}">${html(o.label)}</span></button>`;
    }).join('');
    return `${top(w)}<div class="question-body">${questionHeading(q,w)}<div class="options" role="group" aria-label="Answer choices">${options}</div></div>${r?note(w):''}<div class="answer-footer" aria-live="polite">${feedback(q,w,r)}</div>`;
  }
  function typing(q,w){
    const r=answer(), hint=state.session.hinted?getHint(w,q.target):'';
    return `${top(w)}<div class="question-body">${questionHeading(q,w)}<form class="typing-form" id="typing-form"><label class="sr-only" for="typed-answer">Your answer in ${displayLanguage(q.target)}</label><input id="typed-answer" class="answer-input" name="answer" value="${html(state.session.typed||'')}" placeholder="Type in ${displayLanguage(q.target)}…" lang="${q.target}" autocomplete="off" autocapitalize="none" spellcheck="false" ${r?'readonly':''} ${r?`aria-invalid="${!r.correct}" aria-describedby="typing-feedback"`:''}><div class="input-hint-row"><span>${q.target==='fr'?'Articles optional · '+(state.strict?'Exact accents on':'Accents optional'):'Common alternatives accepted'}</span>${r?'':`<button type="button" data-action="hint" ${state.session.hinted?'disabled':''}>${state.session.hinted?'Hint used':'Need a hint?'}</button>`}</div>${hint?`<p class="hint-text" aria-label="Hint: ${html(hint)}">${html(hint)}</p>`:''}${q.target==='fr'&&!r?`<div class="accent-row" aria-label="French accent characters">${['é','è','ê','ë','à','â','î','ï','ô','ù','û','ç','œ','’'].map(c=>`<button type="button" class="accent-key" data-accent="${c}" aria-label="Insert ${c}">${c}</button>`).join('')}</div><label class="strict-setting"><input id="exact-accents" type="checkbox" ${state.strict?'checked':''}>Require exact accents</label>`:''}<button type="submit" class="sr-only" tabindex="-1" ${r?'disabled':''}>Check answer</button></form></div>${r?note(w):''}<div class="answer-footer" id="typing-feedback" aria-live="polite">${r?feedback(q,w,r):'<button class="text-button" data-action="skip">Skip for now</button><button class="button primary" data-action="check">Check answer <span class="key-inline">↵</span></button>'}</div>`;
  }
  function empty(){
    const saved=state.category==='saved';
    return `<div class="empty-state"><div class="result-icon" style="margin:0 auto 18px">${saved?starIcon():'✓'}</div><h2>${saved?'Build your own word list.':'Nothing waiting for review.'}</h2><p>${saved?'Save words with the bookmark on any card or in the vocabulary list.':'Words you miss, skip, or practise with a hint will appear here.'}</p><button class="button primary" data-action="${saved?'vocabulary':'all-words'}">${saved?'Browse vocabulary':'Practise all words'}</button></div>`;
  }
  function results(){
    const s=state.session,correct=s.responses.filter(r=>r.correct).length,assisted=s.responses.filter(r=>r.assisted&&r.correct).length;
    const missed=s.responses.filter(r=>!r.correct||r.assisted).map(r=>byId.get(r.id));
    const percentage=Math.round(correct/s.questions.length*100);
    return `<div class="results"><div class="result-icon" aria-hidden="true">✓</div><p class="language-label">ROUND COMPLETE</p><h2>${missed.length?'A little more familiar.':'Nicely remembered.'}</h2><p>${state.mode==='flashcards'?`You recalled ${correct} of ${s.questions.length} words.`:`You answered ${correct} of ${s.questions.length} correctly.`}${assisted?` ${assisted} with a hint.`:''}</p><div class="result-stats"><div><strong>${percentage}%</strong><span>${state.mode==='flashcards'?'Recalled':'Accuracy'}</span></div><div><strong>${s.questions.length}</strong><span>Words practised</span></div><div><strong>${missed.length}</strong><span>To review</span></div></div><div class="result-actions">${missed.length?'<button class="button primary" data-action="retry-missed">Review these words <span aria-hidden="true">↻</span></button>':''}<button class="button ${missed.length?'secondary':'primary'}" data-action="new-round">Another round <span aria-hidden="true">→</span></button></div>${missed.length?`<div class="missed-preview"><p>TAKE ANOTHER LOOK</p>${missed.slice(0,6).map(w=>`<div class="missed-item"><span lang="fr">${html(w.fr)}</span><span lang="en">${html(w.en)}</span></div>`).join('')}${missed.length>6?`<p style="letter-spacing:0;margin-top:8px">And ${missed.length-6} more in your review round.</p>`:''}</div>`:''}</div>`;
  }
  function render(){
    applyTheme();
    syncControls();
    const s=state.session,q=current();
    $('#study').innerHTML=!s.questions.length?empty():!q?results():state.mode==='flashcards'?flashcard(q,byId.get(q.id)):state.mode==='quiz'?quiz(q,byId.get(q.id)):typing(q,byId.get(q.id));
    $('#round-position').textContent=s.questions.length?`${Math.min(s.index+1,s.questions.length)} of ${s.questions.length} words`:state.category==='saved'?'Your saved collection':'Review collection';
    $('#round-score').textContent=s.questions.length?(s.index>=s.questions.length?'Round complete':`${s.responses.length} completed`):'';
    $('#round-dots').innerHTML=s.questions.length<=20?s.questions.map((_,i)=>`<i class="${s.responses[i]?(s.responses[i].assisted?'assisted':s.responses[i].correct?'correct':'wrong'):i===s.index?'current':''}"></i>`).join(''):`<span class="mini-progress" style="min-width:90px"><span style="width:${s.responses.length/s.questions.length*100}%"></span></span>`;
    renderStats();save();
  }
  function syncControls(){
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
    $('#category').value=state.category;$('#direction').value=state.direction;$('#length').value=state.length;
  }
  function renderStats(){
    const learned=words.filter(w=>state.progress[w.id]?.streak>=2).length;
    $('#learned-count').textContent=learned;$('#overall-fill').style.width=learned/words.length*100+'%';
    $('.overall-progress').setAttribute('aria-label',`${learned} of ${words.length} words learned. View progress.`);
    const r=state.session.responses;
    $('#session-correct').textContent=r.filter(x=>x.correct).length;$('#session-review').textContent=r.filter(x=>!x.correct||x.assisted).length;
    $('#correct-label').textContent=state.mode==='flashcards'?'Got it':'Correct';
    const copy={flashcards:['A little, every day.','Recall the meaning before you turn the card. Be honest with yourself.'],quiz:['Find the right meaning.','Choose one of four translations. Take your time; there’s no clock.'],typing:['Make it stick.','Bring the word to mind and type it out. A small challenge goes a long way.']}[state.mode];
    $('#session-title').textContent=copy[0];$('#session-description').textContent=copy[1];
    $('#keyboard-help').innerHTML=(state.mode==='flashcards'?[['Turn the card','space'],['Still learning','1'],['Got it','2']]:state.mode==='quiz'?[['Choose an answer','1 – 4'],['Continue','return']]:[['Check / continue','return'],['Accent characters','tap below']]).map(([a,b])=>`<div class="shortcut-line"><span>${a}</span><kbd>${b}</kbd></div>`).join('');
    const count=reviewWords().length;$('#review-caption').textContent=count?`${count} ${count===1?'word is':'words are'} ready for review.`:'Missed words will appear here.';
  }
  function flip(){if(state.mode!=='flashcards'||!current())return;state.session.revealed=!state.session.revealed;save();render();if(state.session.revealed)announce('Answer: '+byId.get(current().id)[current().target]);}
  function record(correct,extra={}){
    const s=state.session,q=current();if(!q||answer())return;
    s.responses[s.index]={id:q.id,correct,assisted:!!s.hinted,...extra};
    state.progress[q.id]=E.updateProgress(state.progress[q.id],correct,!!s.hinted);
    save();
  }
  function next(){
    const s=state.session;if(!answer())return;
    s.index++;s.revealed=false;s.hinted=false;s.typed='';render();
    if(current()){
      if(state.mode==='typing')$('#typed-answer')?.focus({preventScroll:true});
      else $('#study').focus({preventScroll:true});
      const q=current(),w=byId.get(q.id);announce(`Word ${s.index+1} of ${s.questions.length}. ${w[q.target==='fr'?'en':'fr']}. Translate into ${displayLanguage(q.target)}.`);
    }else{$('#study').focus({preventScroll:true});announce('Round complete. Your results are ready.');}
  }
  function choose(id){if(state.mode!=='quiz'||answer()||!current()?.options.some(o=>o.id===id))return;record(id===current().id,{selected:id});render();$('#study [data-action="next"]')?.focus({preventScroll:true});}
  function check(){
    if(state.mode!=='typing'||!current()||answer())return;
    const input=$('#typed-answer'),value=input?.value||'';state.session.typed=value;
    if(!value.trim()){input.focus();toast('Type an answer, or choose “Skip for now”.');return;}
    const q=current(),correct=E.matches(value,byId.get(q.id),q.target,state.strict&&q.target==='fr');
    record(correct,{input:value});render();$('#study [data-action="next"]')?.focus({preventScroll:true});
  }
  function getHint(w,lang){const value=E.normalize(w[lang].split('/')[0],lang,true);return [...value].map((c,i)=>i===0||c===' '||c==="'"?c:'_').join(' ');}
  function hint(){if(state.mode!=='typing'||answer()||state.session.hinted)return;state.session.typed=$('#typed-answer').value;state.session.hinted=true;render();$('#typed-answer').focus({preventScroll:true});announce('Hint: '+getHint(byId.get(current().id),current().target));}
  function skip(){if(state.mode!=='typing'||!current()||answer())return;state.session.typed=$('#typed-answer').value;record(false,{skipped:true,input:state.session.typed});render();$('#study [data-action="next"]')?.focus({preventScroll:true});}
  function toggleBookmark(id){
    if(!byId.has(id))return;const index=state.bookmarks.indexOf(id);if(index>=0)state.bookmarks.splice(index,1);else state.bookmarks.push(id);save();
    document.querySelectorAll('[data-bookmark]').forEach(b=>{if(b.dataset.bookmark===id){const on=state.bookmarks.includes(id);b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',`${on?'Unsave':'Save'} ${byId.get(id).en}`);b.title=on?'Unsave word':'Save word';}});
    if($('#library-dialog').open&&$('#starred-only').checked)renderVocabulary();
    toast(index<0?'Word saved to your collection.':'Word removed from your collection.');
  }
  function openDialog(id){document.querySelectorAll('dialog[open]').forEach(d=>d.close());$(id).showModal();}
  function info(title,body){$('#info-title').textContent=title;$('#info-body').innerHTML=`<div class="help-copy">${body}</div>`;openDialog('#info-dialog');}
  function openVocabulary(){renderVocabulary();openDialog('#library-dialog');$('#word-search').focus();}
  function renderVocabulary(){
    const term=E.normalize($('#word-search').value,'',false),cat=$('#library-category').value;
    const list=words.filter(w=>(cat==='all'||w.categories.includes(cat))&&(!$('#starred-only').checked||state.bookmarks.includes(w.id))&&(!term||[w.fr,w.en,...w.frAlt,...w.enAlt].some(s=>E.normalize(s,'',false).includes(term))));
    $('#library-count').textContent=`${list.length} ${list.length===1?'term':'terms'}`;
    $('#word-list').innerHTML=list.length?list.map(w=>`<div class="vocab-row"><div class="vocab-fr" lang="fr">${html(w.fr)}${state.progress[w.id]?.streak>=2?'<span class="learned-mark" lang="en">✓ Learned</span>':''}<span class="vocab-topic" lang="en">${html(w.categories.map(id=>categories.find(c=>c.id===id).en).join(' · '))} · slide ${w.page}</span></div><div class="vocab-en" lang="en">${html(w.en)}</div>${bookmark(w)}${w.note?`<p class="vocab-note">${html(w.note)}</p>`:''}</div>`).join(''):'<div class="empty-state"><p>No matching words. Try a different search or topic.</p></div>';
  }
  function showProgress(){
    const ps=Object.values(state.progress),seen=ps.filter(p=>p.attempts>0).length,learned=ps.filter(p=>p.streak>=2).length,attempts=ps.reduce((n,p)=>n+p.attempts,0),correct=ps.reduce((n,p)=>n+p.correct,0);
    info('Your progress.',`<p>A word is learned after two correct recalls in a row, across any study method. Flashcards use your own assessment. A missed answer or a hint brings it back for review.</p><div class="progress-grid"><div class="progress-box"><strong>${learned} <span>/ 130</span></strong><span>Words learned</span></div><div class="progress-box"><strong>${seen}</strong><span>Words practised</span></div><div class="progress-box"><strong>${attempts}</strong><span>Total recalls</span></div><div class="progress-box"><strong>${attempts?Math.round(correct/attempts*100):0}%</strong><span>Correct recalls</span></div></div><h3>By topic</h3>${categories.map(c=>{const list=words.filter(w=>w.categories.includes(c.id));return `<div class="topic-progress"><span>${html(c.en)}</span><span>${list.filter(w=>state.progress[w.id]?.streak>=2).length} / ${list.length}</span></div>`;}).join('')}<p style="margin-top:18px;font-size:10px">Pepper and ice cream appear in two topics, as in the slides. They count once toward the 130-word total. Progress stays in this browser.</p>`);
  }
  function showSource(){
    info('From the classroom.',`<p>This deck comes from <strong>Vocabulaire – La Bonne Bouffe</strong>, your 21-slide PDF. It includes every listed vocabulary item: <strong>130 unique terms</strong> across 11 study topics. Adjectives and table vocabulary share slide 21.</p><p>French articles, singular/plural forms, and masculine/feminine forms are shown where useful. Typing accepts the alternatives listed in the deck, with optional articles. Accents are optional unless you turn on exact accents.</p><h3>A few useful clarifications.</h3><p>The classroom wording is kept where possible. A handful of typos are corrected and ambiguous translations are explained below and on the relevant cards.</p><div class="source-notes">${words.filter(w=>w.note).map(w=>`<div class="source-note"><strong>${html(w.en)} <span style="color:var(--secondary);font-weight:400">· slide ${w.page}</span></strong><p>${html(w.note)}</p></div>`).join('')}</div><h3>Reference checks</h3><p><a href="https://www.larousse.fr/dictionnaires/anglais-francais/pepper/601207" target="_blank" rel="noopener noreferrer">Larousse: pepper</a> · <a href="https://www.larousse.fr/dictionnaires/anglais-francais/healthy/585835" target="_blank" rel="noopener noreferrer">Larousse: healthy</a> · <a href="https://www.larousse.fr/dictionnaires/francais-anglais/d%C3%A9tester/24699" target="_blank" rel="noopener noreferrer">Larousse: détester</a></p><p>Le fromage en grains was supplied for the incomplete Cheese curd entry. Meal names and several food terms vary by region; this is a study companion to your class deck.</p>`);
  }
  function showSettings(){info('Make yourself at home.',`<p>Everything works in your browser. No sign-in, timers, or tracking. Your round, saved words, and learning progress stay on this device.</p><div class="settings-row"><div><label for="settings-strict">Exact French accents</label><small>Require é, è, ç, and other accents when typing.</small></div><input id="settings-strict" type="checkbox" ${state.strict?'checked':''}></div><div class="settings-row"><div><label for="settings-theme">Appearance</label><small>Choose a theme or follow your device.</small></div><select id="settings-theme"><option value="system" ${state.theme==='system'?'selected':''}>Use device setting</option><option value="light" ${state.theme==='light'?'selected':''}>Light</option><option value="dark" ${state.theme==='dark'?'selected':''}>Dark</option></select></div><h3>Start fresh</h3><p>Clear all progress, saved words, and the current round on this browser.</p><button class="danger-button" data-action="confirm-reset">Reset study data…</button><div id="reset-area"></div>`);}
  function showShortcuts(){info('Keep your hands on the keys.',`<table class="shortcut-table"><caption>Flashcards</caption><tr><td>Turn the card</td><td><kbd>space</kbd></td></tr><tr><td>Still learning (after reveal)</td><td><kbd>1</kbd></td></tr><tr><td>Got it (after reveal)</td><td><kbd>2</kbd></td></tr></table><table class="shortcut-table" style="margin-top:24px"><caption>Multiple choice & typing</caption><tr><td>Choose a quiz answer</td><td><kbd>1</kbd> – <kbd>4</kbd></td></tr><tr><td>Check typed answer / continue</td><td><kbd>return</kbd></td></tr><tr><td>Close a dialog</td><td><kbd>esc</kbd></td></tr></table><p style="margin-top:22px">Use Tab to move between controls. On a phone or tablet, tap the card or use the on-screen buttons.</p>`);}
  const actions={
    'toggle-theme':()=>setTheme(currentTheme()==='dark'?'light':'dark'),
    flip,next,check,hint,skip,vocabulary:openVocabulary,progress:showProgress,source:showSource,settings:showSettings,shortcuts:showShortcuts,
    'new-round':()=>{startRound();toast('A fresh round is ready.');},
    'flash-review':()=>{if(state.mode==='flashcards'&&state.session.revealed){record(false);next();}},
    'flash-known':()=>{if(state.mode==='flashcards'&&state.session.revealed){record(true);next();}},
    'all-words':()=>{state.category='all';startRound();},
    review:()=>{state.category='review';startRound();},
    'retry-missed':()=>{const ids=state.session.responses.filter(r=>!r.correct||r.assisted).map(r=>r.id);if(ids.length)startRound(ids);},
    'study-saved':()=>{state.category='saved';$('#library-dialog').close();startRound();},
    'close-dialog':()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()),
    'confirm-reset':()=>{$('#reset-area').innerHTML='<div class="reset-confirm"><p>This clears your saved words and all learning history on this browser. This cannot be undone.</p><button class="button secondary" data-action="cancel-reset">Keep my progress</button> <button class="button primary" data-action="reset">Clear study data</button></div>';},
    'cancel-reset':()=>{$('#reset-area').innerHTML='';},
    reset:()=>{state={...defaults,progress:{},bookmarks:[],session:null};$('#info-dialog').close();startRound();toast('Study data cleared. A fresh start.');}
  };
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.mode){if(b.dataset.mode!==state.mode){state.mode=b.dataset.mode;startRound();}return;}
    if(b.dataset.bookmark){toggleBookmark(b.dataset.bookmark);return;}
    if(b.dataset.option){choose(b.dataset.option);return;}
    if(b.dataset.accent){
      const input=$('#typed-answer');if(!input||input.readOnly)return;
      const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
      input.setRangeText(b.dataset.accent,start,end,'end');state.session.typed=input.value;save();input.focus({preventScroll:true});return;
    }
    if(b.dataset.action&&actions[b.dataset.action])actions[b.dataset.action]();
  });
  document.addEventListener('submit',event=>{if(event.target.id==='typing-form'){event.preventDefault();if(answer())next();else check();}});
  document.addEventListener('input',event=>{
    if(event.target.id==='typed-answer'){state.session.typed=event.target.value;clearTimeout(inputTimer);inputTimer=setTimeout(save,200);}
    if(event.target.id==='word-search')renderVocabulary();
  });
  document.addEventListener('change',event=>{
    const id=event.target.id;
    if(id==='settings-theme')setTheme(event.target.value);
    if(['category','direction','length'].includes(id)){state[id]=id==='length'?Number(event.target.value):event.target.value;startRound();}
    if(['exact-accents','settings-strict'].includes(id)){state.strict=event.target.checked;save();if(id==='exact-accents'){state.session.typed=$('#typed-answer').value;render();$('#typed-answer').focus({preventScroll:true});}else if(state.mode==='typing')render();}
    if(['library-category','starred-only'].includes(id))renderVocabulary();
  });
  document.addEventListener('keydown',event=>{
    if(document.querySelector('dialog[open]')||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
    const target=event.target,editing=['INPUT','TEXTAREA','SELECT'].includes(target.tagName);
    if(event.key==='Enter'&&state.mode==='typing'&&target.id==='typed-answer'){event.preventDefault();if(answer())next();else check();return;}
    if(editing||!current())return;
    if(event.key==='Enter'&&answer()&&target.tagName!=='BUTTON'){event.preventDefault();next();return;}
    if(state.mode==='flashcards'){
      if(event.code==='Space'&&(target.tagName!=='BUTTON'||target.classList.contains('flash-face'))){event.preventDefault();flip();}
      if(state.session.revealed&&event.key==='1'){event.preventDefault();actions['flash-review']();}
      if(state.session.revealed&&event.key==='2'){event.preventDefault();actions['flash-known']();}
    }else if(state.mode==='quiz'&&!answer()&&/^[1-4]$/.test(event.key)){event.preventDefault();choose(current().options[Number(event.key)-1].id);}
  });
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  window.addEventListener('pagehide',save);
  const options=categories.map(c=>`<option value="${c.id}">${html(c.en)}</option>`).join('');
  $('#category').innerHTML='<option value="all">All vocabulary</option>'+options+'<optgroup label="Your collections"><option value="review">Words to review</option><option value="saved">Saved words</option></optgroup>';
  $('#library-category').innerHTML='<option value="all">All topics</option>'+options;
  if(!validSession(state.session))startRound();else render();
})();

