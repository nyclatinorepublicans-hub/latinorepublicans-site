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

/* Keep the installed app (and open tabs) on the newest version of the site.
   iPhones keep the app paused in the background; when it comes back, check for a newer build.
   Away 2+ minutes: refresh automatically. Shorter: show a small "tap to update" bar so nothing being typed is lost. */
(function(){
  var cur=(function(){var el=document.querySelector('script[src*="?v="],link[href*="?v="],iframe[src*="?v="],iframe[data-src*="?v="]');var a=el&&(el.getAttribute('src')||el.getAttribute('href')||el.getAttribute('data-src'))||'';var m=a.match(/\?v=([0-9a-f]+)/);return m?m[1]:null;})();
  if(!cur)return;
  var hiddenAt=0,lastCheck=Date.now(),bar=null;
  function showBar(){if(bar)return;bar=document.createElement('button');bar.type='button';
    bar.textContent=(document.documentElement.lang||'').indexOf('es')===0?'Hay una nueva versión · Toca para actualizar':'New version available · Tap to update';
    bar.setAttribute('style','position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:9999;border:0;border-radius:999px;padding:12px 20px;background:#f5d066;color:#052a4b;font:800 13px Arial,sans-serif;letter-spacing:.04em;box-shadow:0 8px 24px rgba(0,0,0,.35);cursor:pointer');
    bar.onclick=function(){location.reload();};document.body.appendChild(bar);}
  function check(away){if(Date.now()-lastCheck<20000)return;lastCheck=Date.now();
    fetch(location.pathname+'?check='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.text():'';}).then(function(t){
      var m=t.match(/\?v=([0-9a-f]+)/);if(!m||m[1]===cur)return;
      if(away>=120000)location.reload();else showBar();}).catch(function(){});}
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){hiddenAt=Date.now();return;}
    check(hiddenAt?Date.now()-hiddenAt:0);});
  addEventListener('pageshow',function(e){if(e.persisted)check(120000);});
  setInterval(function(){if(!document.hidden)check(0);},15*60*1000);
})();

/* ===== Phone comfort + quick actions (Nov 2026 UX pass) =====
   1) Phones: the menu slides away while scrolling down or typing in a form, and comes back on scroll up,
      so it never covers what you are filling in.
   2) Home page on phones: a bottom bar with the two main actions once the hero is out of view.
   3) Join page on phones: a bottom bar with the selected plan and one checkout button. */
(function(){
  const mq=matchMedia('(max-width:1000px)'),B=document.body,top=document.getElementById('s-top');
  const signedIn=()=>{try{return !!localStorage.getItem('lrc_session');}catch(e){return false;}};
  let last=scrollY,typing=false;
  addEventListener('scroll',()=>{const y=scrollY;if(!mq.matches||typing){last=y;return;}
    if(y>last+8&&y>220)B.classList.add('hdr-hide');else if(y<last-8||y<120)B.classList.remove('hdr-hide');last=y;},{passive:true});
  function hook(f){try{const d=f.contentDocument;if(!d||d.__lrcHook)return;d.__lrcHook=1;
    d.addEventListener('focusin',e=>{const t=e.target;if(!mq.matches||!t||!/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)||/^(checkbox|radio|button|submit)$/.test(t.type||''))return;
      typing=true;B.classList.add('hdr-hide');
      setTimeout(()=>{try{const r=t.getBoundingClientRect(),fr=f.getBoundingClientRect(),y=fr.top+r.top;if(y<16||y>innerHeight*.55)scrollBy({top:y-90,behavior:'smooth'});}catch(x){}},320);});
    d.addEventListener('focusout',()=>{typing=false;});}catch(e){}}
  document.querySelectorAll('.sec iframe').forEach(f=>{f.addEventListener('load',()=>hook(f));hook(f);});

  function bar(html){const b=document.createElement('div');b.className='qbar';b.setAttribute('role','region');b.setAttribute('aria-label','Quick actions');b.innerHTML=html;B.appendChild(b);return b;}
  const es=()=>(document.documentElement.lang||'').startsWith('es')||(()=>{try{return localStorage.getItem('lrc_lang')==='es';}catch(e){return false;}})();

  /* home page */
  const home=document.getElementById('s-home');
  if(home){const b=bar('');const paint=()=>{const s=es(),inn=signedIn();
      b.innerHTML=inn?`<a class="q2" href="account/">${s?'Mi perfil':'My profile'}</a><a class="q1" href="#s-events">${s?'Ver eventos':'See events'}</a>`
        :`<a class="q2" href="account/?signup=1">${s?'Cuenta gratis':'Free account'}</a><a class="q1" href="join/">${s?'Únete al club':'Join the club'}</a>`;};
    paint();addEventListener('lrc-lang',paint);addEventListener('storage',paint);
    const foot=document.getElementById('s-contact');
    const vis=()=>{const hb=home.getBoundingClientRect().bottom,ft=foot?foot.getBoundingClientRect().top:1e9;b.classList.toggle('on',mq.matches&&hb<60&&ft>innerHeight-40);};
    addEventListener('scroll',vis,{passive:true});addEventListener('resize',vis);vis();}

  /* join page */
  const join=document.querySelector('#s-join iframe');
  if(join){const b=bar('<div class="qsum"><b id="qName"></b><span id="qPrice"></span></div><button type="button" class="q1" id="qPay"></button>');
    const doc=()=>{try{return join.contentDocument;}catch(e){return null;}};
    const sync=()=>{const d=doc();if(!d)return null;const r=d.querySelector('input[name=tier]:checked');const card=r&&r.closest('.tier');if(!card)return null;
      const nm=card.querySelector('h3'),pr=card.querySelector('.price'),pay=card.querySelector('.pay');
      b.querySelector('#qName').textContent=nm?nm.textContent:'';b.querySelector('#qPrice').textContent=pr?pr.textContent.replace(/\s+/g,' ').trim():'';
      b.querySelector('#qPay').textContent=pay?pay.textContent.replace(/\s+/g,' ').trim():(es()?'Continuar':'Continue');return {card,pay};};
    b.querySelector('#qPay').addEventListener('click',()=>{const s=sync();if(s&&s.pay)s.pay.click();});
    const vis=()=>{const s=sync(),d=doc();let show=false;
      if(s&&d){const t=d.getElementById('tiers'),fr=join.getBoundingClientRect();if(t){const tr=t.getBoundingClientRect(),tt=fr.top+tr.top,tb=fr.top+tr.bottom;
        const payR=s.pay.getBoundingClientRect(),py=fr.top+payR.top;show=mq.matches&&tt<innerHeight*.7&&tb>innerHeight*.55&&!(py>0&&py<innerHeight-70);}}
      b.classList.toggle('on',show);};
    addEventListener('scroll',vis,{passive:true});addEventListener('resize',vis);
    join.addEventListener('load',()=>{try{doc().addEventListener('change',vis);doc().addEventListener('click',()=>setTimeout(vis,50));}catch(e){}});
    setInterval(vis,1500);}
})();
