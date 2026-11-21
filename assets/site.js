/* Club site frame: sizes each section to its content, runs the menu links,
   and keeps pop-ups (board profiles, flag game) inside the visible screen. */
(function(){
  const frames=[...document.querySelectorAll('.sec iframe')];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hdrEl=document.getElementById('s-top');
  const hdr=()=>hdrEl?hdrEl.getBoundingClientRect().bottom:0;

  /* pass this page's ?query (e.g. ?rep=ecuador) to sections that ask for it */
  frames.forEach(f=>{const src=f.dataset.src;if(!src)return;f.src=src+(f.hasAttribute('data-query')?location.search:'');});

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
    if(t)t.scrollIntoView({behavior:'auto',block:'start'});
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
