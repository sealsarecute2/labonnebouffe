/* Lifetime tips decorate the café, even after the spendable wallet is used. */
(function(root){
  'use strict';
  const milestones=[
    {tips:25,id:'plants',name:'Potted plant',title:'The green counter'},
    {tips:100,id:'lights',name:'Warm pendant lights',title:'Neighbourhood favourite'},
    {tips:200,id:'flowers',name:'Fresh flowers',title:'Freshly picked'},
    {tips:350,id:'utensils',name:'Silver utensils',title:'House favourite'},
    {tips:600,id:'linen',name:'Woven table linen',title:'A table for two'},
    {tips:900,id:'candle',name:'Candlelight',title:'The candlelit café'},
    {tips:1400,id:'vine',name:'Trailing vine',title:'The secret garden'},
    {tips:2000,id:'fairy-lights',name:'Fairy lights',title:'Evening service'},
    {tips:3000,id:'gold',name:'Gold utensils',title:'Golden service'},
    {tips:5000,id:'signature',name:'Signature flower arrangement',title:'The signature café'}
  ];
  function progress(value){
    const total=Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
    const unlocked=milestones.filter(m=>total>=m.tips),next=milestones[unlocked.length]||null;
    const previous=unlocked.at(-1)?.tips||0;
    return {total,unlocked,next,ids:unlocked.map(m=>m.id),title:unlocked.at(-1)?.title||'Corner café',
      remaining:next?next.tips-total:0,percent:next?(total-previous)/(next.tips-previous)*100:100};
  }
  function art(kind){
    let body='';
    if(kind==='plants')body='<path d="M49 67Q29 39 35 20M48 67Q65 37 62 10M48 68Q43 40 50 27" fill="none" stroke="#50765a" stroke-width="3"/><path d="M38 43Q10 40 17 17Q41 18 38 43M56 37Q47 11 70 5Q80 26 56 37M47 54Q23 54 25 38Q45 34 47 54M53 54Q53 33 76 33Q79 54 53 54" fill="#7c9f72"/><path d="M27 63h43l-6 30H34Z" fill="#c78361"/><path d="M26 62h45v8H26Z" fill="#dfa583"/><path d="M35 75h28" stroke="#ae6b4e" stroke-width="2"/>';
    if(kind==='flowers'||kind==='signature'){
      const blooms=kind==='signature'?[[24,22],[70,20],[45,13],[34,40],[64,42]]:[[27,28],[66,25],[47,43]];
      body='<path d="m45 78-18-48m20 48 20-52m-21 52 1-35" stroke="#648265" stroke-width="3"/><path d="M45 65Q20 50 22 40Q43 45 45 65M49 61Q72 45 77 49Q71 65 49 61" fill="#8aa077"/>';
      blooms.forEach(([x,y],i)=>{body+=`<g transform="translate(${x} ${y})" fill="${i%2?'#e2ab9d':'#eac98c'}"><ellipse rx="7" ry="12"/><ellipse rx="7" ry="12" transform="rotate(60)"/><ellipse rx="7" ry="12" transform="rotate(120)"/><circle r="4" fill="#a97543"/></g>`;});
      body+='<path d="M37 69h22l6 24H31Z" fill="#93b6ae"/><path d="M36 68h24v6H36Z" fill="#bfd3c7"/>';
    }
    if(kind==='candle')body='<ellipse cx="50" cy="91" rx="28" ry="5" fill="#b7a17b"/><path d="M31 86h38l-5 6H36Z" fill="#d5bd8e"/><rect x="38" y="43" width="24" height="43" rx="4" fill="#f0dcb7"/><path d="M50 43v-9" stroke="#77624a" stroke-width="2"/><path d="M50 35Q34 28 50 8Q65 28 50 35" fill="#efb85d"/><path d="M50 32Q43 27 50 17Q56 27 50 32" fill="#fff1c0"/>';
    if(kind==='utensils'||kind==='gold')body=`<g fill="none" stroke="${kind==='gold'?'#c4a15c':'#9baeb0'}" stroke-width="4" stroke-linecap="round"><path d="M28 12v23q10 10 20 0V12M38 12v72M28 27h20M67 84V12q15 8 10 34H67"/><path d="M28 12v15M48 12v15" stroke-width="3"/></g>`;
    if(kind==='vine')body='<path d="M20 0Q75 25 45 49T57 94" fill="none" stroke="#628361" stroke-width="3"/><g fill="#85a17b"><path d="M37 14Q35-2 58 5Q58 23 37 14M51 30Q69 14 78 32Q65 48 51 30M50 41Q25 27 24 47Q38 62 50 41M42 62Q59 44 73 59Q64 79 42 62M48 78Q24 64 26 85Q42 96 48 78"/></g>';
    return `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">${body}</svg>`;
  }
  const api={milestones,progress,art};root.BOUFFE_CAFE_REWARDS=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
