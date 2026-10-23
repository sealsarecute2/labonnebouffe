(function (root) {
  'use strict';
  function normalize(value,lang,strict=false){
    let s=String(value).toLowerCase().trim().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[’‘`]/g,"'").replace(/[‐‑–—-]/g,' ').replace(/&/g,' and ').replace(/\s+/g,' ');
    if(!strict) s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    s=s.replace(/[.!?,;:]+$/g,'').trim();
    if(lang==='fr') s=s.replace(/^(?:(?:de\s+)?l'\s*|de la\s+|le\s+|la\s+|les\s+|un\s+|une\s+|des\s+|du\s+)/,'');
    if(lang==='en') s=s.replace(/^(?:the|a|an)\s+/,'').replace(/^to\s+/,'');
    return s.trim();
  }
  function answers(word,lang){return [...new Set([word[lang],...(word[lang+'Alt']||[]),...word[lang].split(/\s*\/\s*/)])];}
  function matches(input,word,lang,strict=false){const n=normalize(input,lang,strict);return !!n && answers(word,lang).some(a=>normalize(a,lang,strict)===n);}
  function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function makeQuestions(words,all,direction='mixed',limit=10,random=Math.random){
    return shuffle(words,random).slice(0,limit===0?words.length:limit).map((w,index)=>{
      const target=direction==='mixed'?(index%2===0?'en':'fr'):direction==='fr-en'?'en':'fr';
      const accepted=new Set(answers(w,target).map(a=>normalize(a,target)));
      const same=shuffle(all.filter(x=>x.id!==w.id&&x.categories.some(c=>w.categories.includes(c))),random);
      const others=shuffle(all.filter(x=>x.id!==w.id),random);
      const options=[{id:w.id,label:w[target]}];
      const used=new Set(accepted);
      for(const x of [...same,...others]){
        const ns=answers(x,target).map(a=>normalize(a,target));
        if(ns.some(n=>used.has(n)))continue;
        options.push({id:x.id,label:x[target]}); ns.forEach(n=>used.add(n));
        if(options.length===4)break;
      }
      return {id:w.id,target,options:shuffle(options,random)};
    });
  }
  function updateProgress(previous,correct,assisted=false){
    const p={attempts:0,correct:0,streak:0,...previous};
    return {...p,attempts:p.attempts+1,correct:p.correct+(correct?1:0),streak:correct&&!assisted?p.streak+1:0,lastSeen:Date.now()};
  }
  const engine={normalize,answers,matches,shuffle,makeQuestions,updateProgress};
  root.BOUFFE_ENGINE=engine;if(typeof module!=='undefined')module.exports=engine;
})(globalThis);
