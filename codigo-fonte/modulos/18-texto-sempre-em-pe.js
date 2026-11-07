/* ================= textos sempre legíveis em componentes girados =================
   - texto que ficaria de cabeça para baixo gira 180° em volta do próprio centro;
   - texto desenhado "em pé" (gira ao contrário do componente) fica centralizado no próprio lugar;
   - em 90°/270°, se os textos em pé se sobrepõem ou cobrem um terminal, eles giram junto com o componente
     (lidos de lado, como num esquema impresso). Vale no esquema e na protoboard. */
function rotSum(tf){let a=0;const re=/rotate\(\s*(-?[\d.]+)/g;let m;while((m=re.exec(tf||'')))a+=+m[1];return a}
const n360=a=>((a%360)+360)%360,isUp=n=>n<.5||n>359.5,isFlip=n=>n>90.5&&n<269.5;
function txtBoxIn(g,t){const b=t.getBBox();const m=g.getCTM().inverse().multiply(t.getCTM());const P=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));const xs=P.map(p=>p.x),ys=P.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}}
const boxHit=(a,b,m)=>a.x+m<b.x+b.w&&b.x+m<a.x+a.w&&a.y+m<b.y+b.h&&b.y+m<a.y+a.h;
/* transformações dos textos no desenho sem giro (para saber quais foram feitos para ficar em pé) */
function tf0Of(c){try{const s=D(c).draw({...c,r:0});const doc=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg"><g>${s}</g></svg>`,'image/svg+xml');return[...doc.querySelectorAll('text')].filter(t=>t.textContent.trim()).map(t=>t.getAttribute('transform')||'')}catch(e){return null}}
function fixFlip(root,sel){if(!root)return;for(const g of root.querySelectorAll(sel)){const r=n360(rotSum(g.getAttribute('transform')))
/* chip na protoboard: o nome gira junto (como na peça real, que tem lado certo) */
if(g.classList.contains('pbpart')){const pc=byId(g.dataset.id);if(pc&&pc.type==='ic')continue};if(!r)continue;
 const c=g.classList.contains('comp')&&g.dataset.id?byId(g.dataset.id):null,T0=c?tf0Of(c):null;
 const list=[];let k=0;for(const t of g.querySelectorAll('text')){if(!t.textContent.trim())continue;let anc=0;for(let e=t.parentNode;e&&e!==g;e=e.parentNode)anc+=rotSum(e.getAttribute&&e.getAttribute('transform'));
  const tf=t.getAttribute('transform')||'',own=rotSum(tf),tf0=T0&&T0.length?T0[k]:null;k++;let b;try{b=t.getBBox()}catch(_){continue}if(!b||!(b.width||b.height))continue;
  const own0=tf0!=null?rotSum(tf0):own,cnt=tf0!=null&&own0===0&&isUp(n360(own-own0+r))&&own!==0;
  list.push({t,tf,tf0,own,own0,cnt,anc,n:n360(r+anc+own),cx:b.x+b.width/2,cy:b.y+b.height/2})}
 const ctr=x=>`${x.cx.toFixed(2)} ${x.cy.toFixed(2)}`;
 for(const x of list){if(x.cnt)x.t.setAttribute('transform',`rotate(${x.own} ${ctr(x)})`);else if(isFlip(x.n))x.t.setAttribute('transform',`${x.tf} rotate(180 ${ctr(x)})`.trim())}
 if((r===90||r===270)&&list.some(x=>x.cnt)){const bx=list.map(x=>txtBoxIn(g,x.t)),terms=[...g.querySelectorAll('circle.term,circle.pbpin')].map(q=>txtBoxIn(g,q)).concat([...g.querySelectorAll('rect:not(.hit)')].map(q=>txtBoxIn(g,q)).filter(b=>b.w*b.h<120));let bad=false;
  for(let i=0;i<bx.length&&!bad;i++){for(let j=i+1;j<bx.length;j++)if(boxHit(bx[i],bx[j],.8)){bad=true;break}if(!bad&&list[i].cnt)for(const q of terms)if(boxHit(bx[i],q,.5)){bad=true;break}}
  if(bad)for(const x of list){if(!x.cnt)continue;const n=n360(r+x.anc+x.own0);x.t.setAttribute('transform',isFlip(n)?`${x.tf0} rotate(180 ${ctr(x)})`.trim():x.tf0)}}
  if(r===90||r===270)try{fitCnt(g,list,r)}catch(e){console.error(e)}
  if(r===90||r===270)try{uprightInner(g,list,r)}catch(e){console.error(e)}}}
/* textos de dentro do corpo (retângulo/círculo) que ficariam de lado: o bloco gira inteiro para ficar em pé,
   se ainda couber no corpo sem cobrir terminais nem o desenho de dentro */
function uprightInner(g,list,r){const lb=e=>{try{const b=e.getBBox();return{x:b.x,y:b.y,w:b.width,h:b.height}}catch(_){return null}};
 const shapes=[...g.querySelectorAll('rect:not(.hit),circle:not(.term):not(.pbpin),ellipse,polygon,path')].filter(e=>(e.tagName!=='path'||/^[^Mm]*[Mm][^Mm]*[Zz]\s*$/.test(e.getAttribute('d')||''))&&!e.getAttribute('transform')&&e.parentNode===g).map(e=>({e,b:lb(e)})).filter(o=>o.b&&o.b.w>=24&&o.b.h>=24);
 const terms=[...g.querySelectorAll('circle.term,circle.pbpin')].map(lb).filter(Boolean);
 const prims=[...g.querySelectorAll('line,path,polyline,polygon')].filter(e=>!e.getAttribute('transform')&&e.parentNode===g).map(lb).filter(b=>b&&(b.w+b.h)>0);
 const groups=new Map();
 for(const x of list){if(x.anc||x.t.parentNode!==g)continue;const cur=x.t.getAttribute('transform')||'';if(rotSum(cur)!==0)continue;
  {const b=lb(x.t);if(!b)continue;x.cx=b.x+b.w/2;x.cy=b.y+b.h/2}
  if(terms.some(q=>Math.hypot(q.x+q.w/2-x.cx,q.y+q.h/2-x.cy)<24))continue;
  const inn=shapes.filter(o=>x.cx>o.b.x&&x.cx<o.b.x+o.b.w&&x.cy>o.b.y&&x.cy<o.b.y+o.b.h).sort((a,b)=>a.b.w*a.b.h-b.b.w*b.b.h)[0];if(!inn)continue;
  if(!groups.has(inn))groups.set(inn,[]);groups.get(inn).push(x)}
 for(const[o,xs]of groups){const bs=xs.map(x=>lb(x.t));let x0=Math.min(...bs.map(b=>b.x)),y0=Math.min(...bs.map(b=>b.y)),x1=Math.max(...bs.map(b=>b.x+b.w)),y1=Math.max(...bs.map(b=>b.y+b.h));
  const cx=(x0+x1)/2,cy=(y0+y1)/2,w=x1-x0,h=y1-y0;
  /* depois do giro de -r em volta do centro, o bloco troca largura por altura */
  const nb={x:cx-h/2,y:cy-w/2,w:h,h:w},B=o.b,m=1.5;
  if(nb.x<B.x+m||nb.y<B.y+m||nb.x+nb.w>B.x+B.w-m||nb.y+nb.h>B.y+B.h-m)continue;
  if(o.e.tagName!=='rect'&&o.e.isPointInFill){const P=[[nb.x,nb.y],[nb.x+nb.w,nb.y],[nb.x,nb.y+nb.h],[nb.x+nb.w,nb.y+nb.h]];if(P.some(([px,py])=>!o.e.isPointInFill(new DOMPoint(px,py))))continue}
  if(terms.some(q=>boxHit(nb,q,.5)))continue;
  const inside=prims.filter(p=>p.x>=B.x-.5&&p.y>=B.y-.5&&p.x+p.w<=B.x+B.w+.5&&p.y+p.h<=B.y+B.h+.5&&!(p.w>=B.w-1&&p.h>=B.h-1));
  if(inside.some(p=>!bs.some(b=>boxHit(b,p,.5))&&boxHit(nb,p,.5)))continue;
  if(shapes.some(q=>q!==o&&q.b.w*q.b.h<B.w*B.h&&boxHit(nb,q.b,.3)))continue;
  {const mine=new Set(xs.map(x=>x.t));if([...g.querySelectorAll('text')].some(t=>!mine.has(t)&&t.textContent.trim()&&boxHit(nb,txtBoxIn(g,t),.3)))continue}
  if([...g.querySelectorAll('rect:not(.hit),circle:not(.term):not(.pbpin)')].some(e=>{if(e===o.e||e.parentNode!==g)return false;const b=lb(e);return b&&b.w*b.h<B.w*B.h&&b.x>=B.x-.5&&b.y>=B.y-.5&&b.x+b.w<=B.x+B.w+.5&&b.y+b.h<=B.y+B.h+.5&&boxHit(nb,b,.3)}))continue;
  const a=r===90?-90:90;for(const x of xs)x.t.setAttribute('transform',`rotate(${a} ${cx.toFixed(2)} ${cy.toFixed(2)})`)}}
/* componente girado: o nome e o valor vão para a direita do desenho já girado (sem ficar em cima dele) */
function fixTags(L){const inv=L.getCTM&&L.getCTM()?L.getCTM().inverse():null;if(!inv)return;
 for(const g of L.querySelectorAll('g.comp')){const c=byId(g.dataset.id);if(!c||!c.r||c.lo)continue;const tg=[...L.querySelectorAll(`text[data-c="${c.id}"]`)],xr=[...document.querySelectorAll(`text[data-xc="${c.id}"]`)];if(!tg.length&&!xr.length)continue;
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const e of g.querySelectorAll('line,path,rect:not(.hit),circle,polygon,polyline,text,ellipse')){let b;try{b=e.getBBox()}catch(_){continue}if(!(b.width+b.height))continue;const m=inv.multiply(e.getCTM());
   for(const[x,y]of[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]]){const p=new DOMPoint(x,y).matrixTransform(m);x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)}}
  if(!isFinite(x1))continue;const hh=tg.length*13+xr.length*10.5,cy=(y0+y1)/2;let y=cy-hh/2+9;tg.forEach(t=>{t.setAttribute('x',(x1+4).toFixed(1));t.setAttribute('y',y.toFixed(1));y+=13});xr.forEach(t=>{t.setAttribute('x',(x1+4).toFixed(1));t.setAttribute('y',(y-2).toFixed(1));y+=10.5})}}
if(typeof renderDocLayer==='function'){const _rd=renderDocLayer;renderDocLayer=function(){_rd();try{fixTags(document.getElementById('cL'))}catch(e){console.error(e)}}}
{const _rc=renderComps;renderComps=function(){_rc();const L=document.getElementById('cL');try{fixFlip(L,'g.comp')}catch(e){console.error(e)}try{fixTags(L)}catch(e){console.error(e)}}}
if(typeof pbRender==='function'){const _pr=pbRender;pbRender=function(){_pr();try{fixFlip(document.getElementById('pbC'),'g.pbpart')}catch(e){console.error(e)}}}
renderAll();

/* texto em pé que não cabe no corpo onde está (ex.: rótulo de rede em pé) volta a girar junto com o componente */
function fitCnt(g,list,r){const shapes=[...g.querySelectorAll('rect:not(.hit),circle:not(.term):not(.pbpin),ellipse,polygon,path')].filter(e=>e.tagName!=='path'||/^[^Mm]*[Mm][^Mm]*[Zz]\s*$/.test(e.getAttribute('d')||'')).map(e=>({e,b:txtBoxIn(g,e)})).filter(o=>o.b.w>=12&&o.b.h>=12);
 for(const x of list){if(!x.cnt||rotSum(x.t.getAttribute('transform')||'')===0)continue;const b=txtBoxIn(g,x.t),cx=b.x+b.w/2,cy=b.y+b.h/2;
  const o=shapes.filter(o=>cx>o.b.x&&cx<o.b.x+o.b.w&&cy>o.b.y&&cy<o.b.y+o.b.h).sort((a,q)=>a.b.w*a.b.h-q.b.w*q.b.h)[0];if(!o)continue;
  const B=o.b;if(b.x>=B.x-.5&&b.y>=B.y-.5&&b.x+b.w<=B.x+B.w+.5&&b.y+b.h<=B.y+B.h+.5)continue;
  const n=n360(r+x.anc+x.own0);x.t.setAttribute('transform',isFlip(n)?`${x.tf0} rotate(180 ${x.cx.toFixed(2)} ${x.cy.toFixed(2)})`.trim():x.tf0)}}
/* rótulos de pino (PINS) desenhados por cima do corpo do módulo */
for(const t of Object.keys(DEFS)){const d=DEFS[t];if(typeof d.draw!=='function'||d._pinl)continue;const f0=d.draw;d._pinl=1;
 d.draw=c=>{const s=f0(c);if(typeof s!=='string'||s.indexOf('pinl')<0)return s;const L=[];const r=s.replace(/<text [^>]*class="tn6 pinl"[^>]*>[^<]*<\/text>/g,m=>{L.push(m);return''});return r+L.join('')}}
