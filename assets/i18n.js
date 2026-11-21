/* Club site: English / Spanish.
   Every section loads this file. It swaps the English text on the page for Spanish
   (from LRC_ES in i18n-es.js) and back, and keeps doing it as the page changes. */
(function(){
  var KEY='lrc_lang', D=Object.assign({},window.LRC_ES||{},window.LRC_ES_LOCAL||{}), C=window.LRC_ES_COUNTRIES||{};
  function stored(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
  var lang=stored()==='es'?'es':'en';
  var country=function(n){return C[n]||C['the '+n]||n;};
  var P=[
    [/^Flag of (.+)$/, function(m){return 'Bandera de '+country(m[1]);}],
    [/^Represent (.+): become a member of the club$/, function(m){return 'Representa a '+country(m[1])+': hazte miembro del club';}],
    [/^Represent the (.+)$/, function(m){return 'Representa a '+(country(m[1])==='República Dominicana'?'la ':'')+country(m[1]);}],
    [/^Represent (.+)$/, function(m){return 'Representa a '+country(m[1]);}],
    [/^Representing (the )?(.+)$/, function(m){return 'Representando a '+country(m[2]);}],
    [/^Flag (\d+) of (\d+)$/, function(m){return 'Bandera '+m[1]+' de '+m[2];}],
    [/^Donate (\$\d+) →$/, function(m){return 'Donar '+m[1]+' →';}],
    [/^Join for (\$\d+)$/, function(m){return 'Únete por '+m[1];}],
    [/^Join as (.+) for (\$\d+) a year$/, function(m){return 'Únete como '+(D[m[1]]||m[1])+' por '+m[2]+' al año';}],
    [/^¡Exacto! That's (.+)\.$/, function(m){return '¡Exacto! Es '+country(m[1])+'.';}],
    [/^Close! That one is (.+)\.$/, function(m){return '¡Casi! Esa es '+country(m[1])+'.';}],
    [/^Sponsor since (\d{4})$/, function(m){return 'Patrocinador desde '+m[1];}],
    [/^© (\d{4}) (.+)$/, function(m){return '© '+m[1]+' '+(D[m[2]]||m[2]);}]
  ];
  function tr(s){if(Object.prototype.hasOwnProperty.call(D,s))return D[s];
    for(var i=0;i<P.length;i++){var m=s.match(P[i][0]);if(m)return P[i][1](m);}return null;}

  var orig=new WeakMap(), wrote=new WeakMap(), ATTRS=['placeholder','aria-label','title','alt'];
  function textNode(n){
    var p=n.parentNode;if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(p.nodeName))return;
    if(!orig.has(n))orig.set(n,n.nodeValue);
    var o=orig.get(n),v=o;
    if(lang==='es'){var t=o.replace(/\s+/g,' ').trim();if(t){var r=tr(t);if(r!=null)v=o.match(/^\s*/)[0]+r+o.match(/\s*$/)[0];}}
    if(n.nodeValue!==v){wrote.set(n,v);n.nodeValue=v;}
  }
  function attrs(el){
    if(!el.getAttribute)return;
    var store=orig.get(el);if(!store){store={};orig.set(el,store);}
    ATTRS.forEach(function(a){
      if(!el.hasAttribute(a))return;
      var cur=el.getAttribute(a);
      if(!(a in store)||(store['w_'+a]!==cur&&cur!==store[a]))store[a]=cur;   /* page changed it: new original */
      var o=store[a],v=o;
      if(lang==='es'){var r=tr(o.replace(/\s+/g,' ').trim());if(r!=null)v=r;}
      if(cur!==v){store['w_'+a]=v;el.setAttribute(a,v);}else store['w_'+a]=v;
    });
    if(el.tagName==='A'&&/stripe\.com/.test(el.getAttribute('href')||''))stripe(el);
  }
  function stripe(a){ /* Stripe's checkout in the visitor's language */
    var h=a.getAttribute('href'),u;try{u=new URL(h);}catch(e){return;}
    if(lang==='es')u.searchParams.set('locale','es');else u.searchParams.delete('locale');
    var v=u.toString();if(v!==h)a.setAttribute('href',v);
  }
  function walk(root){
    if(root.nodeType===3){textNode(root);return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1)attrs(root);
    var w=document.createTreeWalker(root,5,null),n;   /* elements + text */
    while((n=w.nextNode())){if(n.nodeType===3)textNode(n);else attrs(n);}
  }
  function all(){document.documentElement.lang=lang;document.documentElement.classList.toggle('lang-es',lang==='es');if(document.body)walk(document.body);}
  var mo=new MutationObserver(function(recs){
    recs.forEach(function(r){
      if(r.type==='characterData'){var n=r.target;if(wrote.get(n)===n.nodeValue)return;orig.set(n,n.nodeValue);textNode(n);}
      else if(r.type==='childList'){r.addedNodes.forEach(walk);}
      else if(r.type==='attributes'){attrs(r.target);}
    });
  });
  function start(){all();mo.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS.concat(['href'])});}
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start);

  function set(l,from){
    l=l==='es'?'es':'en';if(l===lang&&from!=='force')return;lang=l;
    try{localStorage.setItem(KEY,l);}catch(e){}
    all();
    try{window.dispatchEvent(new CustomEvent('lrc-lang',{detail:l}));}catch(e){}
    if(from!=='parent'&&window.parent!==window){try{parent.postMessage({lrc:'lang',lang:l},'*');}catch(e){}}
  }
  window.LRC_I18N={get lang(){return lang;},set:set,t:function(s){return lang==='es'?(tr(s)!=null?tr(s):s):s;}};
  Object.defineProperty(window,'LRC_LANG',{get:function(){return lang;}});
  addEventListener('storage',function(e){if(e.key===KEY&&e.newValue)set(e.newValue,'parent');});
  addEventListener('message',function(e){var d=e.data;if(d&&d.lrc==='setlang')set(d.lang,'parent');});
})();
