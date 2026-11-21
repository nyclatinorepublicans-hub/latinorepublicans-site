/* Club site frame: sizes each section to its content, runs the menu links,
   and keeps pop-ups (board profiles, flag game) inside the visible screen. */
(function(){
  const frames=[...document.querySelectorAll('.sec iframe')];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hdrEl=document.getElementById('s-top');
  const hdr=()=>hdrEl?hdrEl.getBoundingClientRect().bottom:0;

  /* pass this page's ?query (e.g. ?rep=ecuador) to sections that ask for it */
  frames.forEach(f=>{const src=f.dataset.src;if(!src)return;f.src=src+(f.hasAttribute('data-query')&&location.search?(src.includes('?')?'&':'?')+location.search.slice(1):'');});

  function contentHeight(doc){
    let m=0;const kids=doc.body?doc.body.children:[];
    for(const el of kids){if(el.tagName==='SCRIPT')continue;const cs=doc.defaultView.getComputedStyle(el);
      if(cs.position==='fixed'||cs.display==='none')continue;m=Math.max(m,el.getBoundingClientRect().bottom+doc.defaultView.scrollY);}
    return Math.ceil(m);
  }
  function size(f){
    if(!f.closest('.sec').hasAttribute('data-auto'))return;
    try{const d=f.contentDocument;if(!d||!d.body)return;
      const h=contentHeight(d); if(h>0&&Math.abs(h-f.offsetHeight)>1)f.style.height=h+'px';}catch(e){}
  }
  let pending=frames.length;
  frames.forEach(f=>{
    f.addEventListener('load',()=>{
      size(f);
      try{const d=f.contentDocument;
        if(window.ResizeObserver){new ResizeObserver(()=>size(f)).observe(d.body);}
        if(d.fonts&&d.fonts.ready)d.fonts.ready.then(()=>size(f));
        [300,1200,3000].forEach(t=>setTimeout(()=>size(f),t));
      }catch(e){}
      sendView();
      if(--pending===0)setTimeout(goToHash,150);
    });
  });
  let resizeT;addEventListener('resize',()=>{clearTimeout(resizeT);resizeT=setTimeout(()=>frames.forEach(size),150);});

  /* menu links */
  function goToHash(){
    const id=decodeURIComponent(location.hash.slice(1));if(!id)return;
    const t=document.getElementById('s-'+id)||document.getElementById(id);
    if(t){t.scrollIntoView({behavior:'auto',block:'start'});return;}
    /* the target may be inside a section, e.g. /join/#sponsor */
    for(const f of frames){try{const el=f.contentDocument&&f.contentDocument.getElementById(id);
      if(el){const y=f.getBoundingClientRect().top+scrollY+el.getBoundingClientRect().top-(hdr()+12);scrollTo({top:y,behavior:'auto'});return;}}catch(e){}}
  }
  function scrollToId(id){
    if(id==='home'||id==='top'){scrollTo({top:0,behavior:reduce?'auto':'smooth'});history.replaceState(null,'',location.pathname+location.search);return true;}
    const t=document.getElementById('s-'+id);if(!t)return false;
    t.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    history.replaceState(null,'',location.pathname+location.search+'#'+id);return true;
  }
  const samePage=u=>u.origin===location.origin&&u.pathname.replace(/index\.html$/,'')===location.pathname.replace(/index\.html$/,'');
  addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(id)scrollToId(id);});
  addEventListener('message',e=>{
    const d=e.data;if(!d||!d.lrc)return;
    if(d.lrc==='go'){
      const u=new URL(d.href,location.href);
      if(samePage(u)&&u.hash&&scrollToId(decodeURIComponent(u.hash.slice(1))))return;
      location.href=u.href;
    }
    if(d.lrc==='reveal'){
      const f=frames.find(x=>x.contentWindow===e.source);if(!f||Date.now()-(window.__rv||0)<1200)return;
      const r=f.getBoundingClientRect(),h0=hdr(),want=Math.min(r.height,innerHeight-h0),vis=Math.min(r.bottom,innerHeight)-Math.max(r.top,h0);
      if(vis<want-4){window.__rv=Date.now();scrollBy({top:r.top-h0,behavior:reduce?'auto':'smooth'});}
    }
  });

  /* tell sections which part of them is on screen, so pop-ups open there */
  function sendView(){
    const h0=hdr();
    frames.forEach(f=>{if(!f.contentWindow)return;const r=f.getBoundingClientRect();
      const t=Math.max(r.top,h0),b=Math.min(r.bottom,innerHeight);
      f.contentWindow.postMessage({lrc:'view',top:Math.max(0,t-r.top),h:Math.max(200,b-t)},'*');});
  }
  let vq=0;const qView=()=>{if(!vq)vq=requestAnimationFrame(()=>{vq=0;sendView();});};
  addEventListener('scroll',qView,{passive:true});addEventListener('resize',qView);
})();

/* ---------- English / Español ---------- */
(function(){
  const KEY='lrc_lang';
  const get=()=>{try{return localStorage.getItem(KEY);}catch(e){return null;}};
  const frames=()=>[...document.querySelectorAll('.sec iframe')];
  function apply(l){
    document.documentElement.lang=l;
    const t=document.querySelector('title');if(t&&t.dataset[l])document.title=t.dataset[l];
    const en=document.getElementById('sum-en'),es=document.getElementById('sum-es');
    if(en&&es){en.hidden=l==='es';es.hidden=l!=='es';}
    const sk=document.querySelector('.skip');if(sk)sk.textContent=l==='es'?'Saltar al contenido':'Skip to content';
  }
  function setLang(l,fromFrame){
    try{localStorage.setItem(KEY,l);}catch(e){}
    apply(l);
    frames().forEach(f=>{if(f.contentWindow&&f.contentWindow!==fromFrame)f.contentWindow.postMessage({lrc:'setlang',lang:l},'*');});
  }
  /* a shared link can choose the language: ?lang=es or ?lang=en */
  const q=new URLSearchParams(location.search).get('lang');
  if(q==='es'||q==='en'){try{localStorage.setItem(KEY,q);}catch(e){}}
  apply(get()==='es'?'es':'en');
  addEventListener('message',e=>{const d=e.data;if(d&&d.lrc==='lang')setLang(d.lang==='es'?'es':'en',e.source);});
  addEventListener('storage',e=>{if(e.key===KEY&&e.newValue)apply(e.newValue);});

  /* first visit: ask which language */
  if(get())return;
  const css=document.createElement('style');
  css.textContent=`.lp{position:fixed;inset:0;z-index:999;display:grid;place-items:center;padding:18px;background:rgba(2,16,32,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:lpf .35s ease}
  @keyframes lpf{from{opacity:0}}
  .lp-card{position:relative;width:min(440px,100%);text-align:center;color:#fff;border-radius:26px;padding:34px 26px 26px;
    background:radial-gradient(90% 70% at 50% 0%,rgba(245,208,102,.2),transparent 60%),linear-gradient(180deg,#0b3d6b,#052a4b 60%,#021a30);
    box-shadow:0 0 0 2px rgba(214,168,68,.75),0 8px 0 #7a5310,0 40px 80px -20px rgba(0,0,0,.7);animation:lpc .5s cubic-bezier(.2,1.4,.4,1)}
  @keyframes lpc{from{transform:translateY(20px) scale(.94);opacity:0}}
  .lp-card img{width:92px;height:92px;filter:drop-shadow(0 8px 14px rgba(0,0,0,.5))}
  .lp-card h2{margin:12px 0 4px;font:900 30px/1 "Archivo","Arial Narrow",sans-serif;font-stretch:78%;text-transform:uppercase;letter-spacing:.02em;
    text-shadow:0 1px 0 #e3b552,0 2px 0 #c99a3a,0 3px 0 #a87a22,0 4px 0 #7a5310,0 8px 14px rgba(0,0,0,.5)}
  .lp-card p{margin:0 0 22px;font:italic 16px/1.45 "Hepta Slab",Georgia,serif;color:#dfe8f4}
  .lp-btns{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .lp-btns button{border:0;cursor:pointer;border-radius:16px;padding:16px 10px;font:900 17px "Archivo",sans-serif;font-stretch:85%;letter-spacing:.08em;text-transform:uppercase;transition:transform .15s}
  .lp-btns button:hover,.lp-btns button:focus-visible{transform:translateY(-2px)}
  .lp-btns button:focus-visible{outline:3px solid #fff;outline-offset:3px}
  .lp-en{background:#fff;color:#052a4b;box-shadow:0 4px 0 #b9c4d2}
  .lp-es{background:linear-gradient(180deg,#f5d066,#d6a844);color:#021a30;box-shadow:0 4px 0 #8a6418}
  .lp-btns small{display:block;margin-top:4px;font:600 11px "Archivo",sans-serif;letter-spacing:.06em;text-transform:none;opacity:.75}
  .lp-note{margin:16px 0 0!important;font:600 12px "Archivo",sans-serif!important;font-style:normal!important;letter-spacing:.04em;color:#b8c7da!important}
  @media (prefers-reduced-motion:reduce){.lp,.lp-card{animation:none}}`;
  document.head.appendChild(css);
  const root=(document.querySelector('link[rel=stylesheet][href*="assets/site.css"]').getAttribute('href')||'').replace('assets/site.css','');
  const lp=document.createElement('div');lp.className='lp';lp.setAttribute('role','dialog');lp.setAttribute('aria-modal','true');lp.setAttribute('aria-labelledby','lpTitle');
  lp.innerHTML=`<div class="lp-card"><img src="${root}assets/seal-192.png" alt="">
    <h2 id="lpTitle">Welcome · Bienvenidos</h2><p>Choose your language<br>Elige tu idioma</p>
    <div class="lp-btns"><button class="lp-en" type="button" lang="en">English<small>Continue in English</small></button>
    <button class="lp-es" type="button" lang="es">Español<small>Continuar en español</small></button></div>
    <p class="lp-note">You can switch anytime from the menu · Puedes cambiar en cualquier momento desde el menú</p></div>`;
  document.body.appendChild(lp);
  const prevFocus=document.activeElement;
  function choose(l){setLang(l);lp.remove();css.remove();if(prevFocus&&prevFocus.focus)prevFocus.focus();}
  lp.querySelector('.lp-en').onclick=()=>choose('en');
  lp.querySelector('.lp-es').onclick=()=>choose('es');
  lp.addEventListener('keydown',e=>{
    if(e.key==='Escape')choose('en');
    if(e.key==='Tab'){const b=[...lp.querySelectorAll('button')],i=b.indexOf(document.activeElement);e.preventDefault();b[(i+(e.shiftKey?-1:1)+b.length)%b.length].focus();}
  });
  setTimeout(()=>lp.querySelector('.lp-en').focus(),50);
})();
