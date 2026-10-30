/* ================= escala: diminuir ou aumentar uma parte do circuito (alças na seleção) ================= */
const SCL=c=>{const v=+c.sc;return v>0.05&&v<20?v:1};
tp=function(c,i){const o=rot(termsOf(c)[i],c.r),s=SCL(c);return{x:c.x+o[0]*s,y:c.y+o[1]*s}};
wbox=function(o,lb){const b=boxOf(o),s=SCL(o),p=[[b[0],b[1]],[b[0]+b[2],b[1]],[b[0],b[1]+b[3]],[b[0]+b[2],b[1]+b[3]]].map(q=>rot(q,o.r)),xs=p.map(q=>q[0]*s+o.x),ys=p.map(q=>q[1]*s+o.y);
 return[Math.min(...xs),Math.min(...ys),Math.max(...xs)+(lb&&!D(o).nolbl?34*Math.max(.6,s):0),Math.max(...ys)]};
{const lp=lblPos;lblPos=function(c){const o=lp(c),s=SCL(c);return s===1?o:[o[0]*s,o[1]*s]}}
/* aplica a escala ao desenho: o símbolo inteiro e, um pouco menos, os textos ao lado dele (para continuarem legíveis) */
function applyScaleDom(){const el=document.getElementById('cL');if(!el)return;let cur=null,s=1;
 for(const n of el.children){if(n.matches('g.comp')){cur=byId(n.dataset.id);s=cur?SCL(cur):1;if(s!==1)n.setAttribute('transform',`translate(${cur.x} ${cur.y}) rotate(${cur.r}) scale(${s})`);continue}
  if(cur&&s!==1&&n.tagName==='text'){const x=+n.getAttribute('x'),y=+n.getAttribute('y'),t=Math.max(.6,s);n.setAttribute('transform',`translate(${x} ${y}) scale(${t}) translate(${-x} ${-y})`)}}}
{const _rc=renderComps;renderComps=function(){_rc();applyScaleDom()}}

/* aplica um fator de escala a um conjunto de componentes, a partir de um ponto fixo (âncora) */
function snapScale(ids){const o={c:{},w:{}};ids.forEach(id=>{const c=byId(id);if(c)o.c[id]={x:c.x,y:c.y,sc:SCL(c)}});
 S.wires.forEach(w=>{if(!num(w.m))return;const A=!!o.c[w.a.c],B=!!o.c[w.b.c];if(A&&B)o.w[w.id]={m:w.m};else if(A||B){const pa=tp(byId(w.a.c),w.a.t),pb=tp(byId(w.b.c),w.b.t),k=w.o==='v'?'y':'x',da=Math.abs(w.m-pa[k]),db=Math.abs(w.m-pb[k]);if(A?da<=db:db<=da)o.w[w.id]={m:w.m}}});return o}
function applyScale(sn,f,ax,ay,dx=0,dy=0){const r=v=>Math.round(v*100)/100;
 for(const id in sn.c){const c=byId(id),o=sn.c[id];if(!c)continue;c.x=r(ax+(o.x-ax)*f+dx);c.y=r(ay+(o.y-ay)*f+dy);const s=r(o.sc*f*1e4)/1e4;if(Math.abs(s-1)<1e-3)delete c.sc;else c.sc=s}
 for(const w of S.wires){const o=sn.w[w.id];if(o)w.m=r(w.o==='v'?ay+(o.m-ay)*f+dy:ax+(o.m-ax)*f+dx)}}
function dropPartialRoutes(){}
function selBox(ids,lb){let b=null;ids.forEach(id=>{const c=byId(id);if(!c||!onSheet(c))return;const q=wbox(c,lb);b=b?[Math.min(b[0],q[0]),Math.min(b[1],q[1]),Math.max(b[2],q[2]),Math.max(b[3],q[3])]:q});return b}
const selIds=()=>sel&&sel.c?[...sel.c].filter(id=>{const c=byId(id);return c&&onSheet(c)}):[];

/* botões: 50 %, 75 %, 100 % e caber na folha */
function scaleBy(f,ids=selIds()){if(mode!=='edit'||!ids.length)return;const b=selBox(ids);pushHist();applyScale(snapScale(ids),f,b[0],b[1]);dropPartialRoutes(ids);commit()}
function scaleTo(pct,ids=selIds()){if(!ids.length)return;const c0=byId(ids[0]);scaleBy(pct/100/SCL(c0),ids)}
function fitToSheet(ids){if(mode!=='edit'){toast('Pare a simulação para redimensionar.',true);return}
 ids=ids&&ids.length?ids:S.comps.filter(onSheet).map(c=>c.id);if(!ids.length){toast('A folha está vazia.',true);return}
 const b=selBox(ids,true),X0=FX0+30,Y0=FY0+40,X1=FX1-30,Y1=FY1-124,f=Math.min((X1-X0)/(b[2]-b[0]),(Y1-Y0)/(b[3]-b[1]),1.5);
 pushHist();const sn=snapScale(ids);applyScale(sn,f,b[0],b[1],X0-b[0],Y0-b[1]);dropPartialRoutes(ids);
 if(!S.doc.fr)S.doc.fr=true;commit();requestAnimationFrame(fit);toast(`Redimensionado para ${Math.round(f*100)}% e posicionado dentro da folha.`)}

/* alças nos cantos da seleção */
let rsz=null;
function renderHandles(){const w=document.getElementById('world');if(!w)return;let g=document.getElementById('hL');if(!g){g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='hL';w.appendChild(g)}
 const ids=selIds();if(mode!=='edit'||!ids.length||(drag&&drag.type!=='comp'&&!rsz)){g.innerHTML='';return}
 const b=rsz?rsz.live:selBox(ids);if(!b){g.innerHTML='';return}const k=6/view.s,pad=6/view.s,[x0,y0,x1,y1]=[b[0]-pad,b[1]-pad,b[2]+pad,b[3]+pad];
 let h=`<rect class="rbox" x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" style="stroke-width:${1.2/view.s};stroke-dasharray:${5/view.s} ${4/view.s}"/>`;
 for(const[c,x,y]of[['tl',x0,y0],['tr',x1,y0],['bl',x0,y1],['br',x1,y1]])h+=`<rect class="rh" data-k="${c}" x="${x-k}" y="${y-k}" width="${2*k}" height="${2*k}" rx="${2/view.s}" style="stroke-width:${1.5/view.s}"><title>Arraste para diminuir ou aumentar a seleção</title></rect>`;
 if(rsz)h+=`<text class="rpct" x="${x1+10/view.s}" y="${y1+16/view.s}" style="font-size:${13/view.s}px">${Math.round(rsz.f*100)}%</text>`;
 g.innerHTML=h}
{const _ro=renderOverlay;renderOverlay=function(){_ro();renderHandles()}}
{const _av=applyView;applyView=function(){_av();renderHandles()}}
svg.addEventListener('pointerdown',e=>{const h=e.target.closest&&e.target.closest('.rh');if(!h||mode!=='edit'||e.button!==0)return;e.stopPropagation();e.preventDefault();
 const ids=selIds(),b=selBox(ids);if(!b)return;const k=h.dataset.k,ax=k.includes('l')?b[2]:b[0],ay=k.includes('t')?b[3]:b[1],cx=k.includes('l')?b[0]:b[2],cy=k.includes('t')?b[1]:b[3];
 rsz={ids,b,ax,ay,cx,cy,sn:snapScale(ids),f:1,live:b,moved:false,pid:e.pointerId};try{svg.setPointerCapture(e.pointerId)}catch(_){}},true);
addEventListener('pointermove',e=>{if(!rsz)return;const p=toWorld(e),{ax,ay,cx,cy}=rsz,vx=cx-ax,vy=cy-ay,L2=vx*vx+vy*vy||1;
 let f=((p.x-ax)*vx+(p.y-ay)*vy)/L2;f=Math.max(.2,Math.min(4,f));if(Math.abs(f-1)<.03)f=1;
 for(const s of[.25,.5,.75,1,1.25,1.5,2])if(Math.abs(f-s)<.015)f=s;if(f===rsz.f)return;
 if(!rsz.moved){pushHist();rsz.moved=true}rsz.f=f;applyScale(rsz.sn,f,ax,ay);rsz.live=selBox(rsz.ids);renderComps();renderWires();renderOverlay()});
addEventListener('pointerup',()=>{if(!rsz)return;const r=rsz;rsz=null;if(r.moved){dropPartialRoutes(r.ids);commit();toast(`Seleção em ${Math.round(r.f*100)}% do tamanho anterior.`)}else renderOverlay()});
addEventListener('keydown',e=>{if(rsz&&e.key==='Escape'){applyScale(rsz.sn,1,rsz.ax,rsz.ay);rsz=null;renderAll()}});

/* painel: tamanho da seleção */
{const _rp=renderProps;renderProps=function(){_rp();const ids=selIds();if(mode!=='edit'||!ids.length)return;const el=$('#props');if(!el||!el.insertAdjacentHTML)return;
 const s=[...new Set(ids.map(id=>Math.round(SCL(byId(id))*100)))],cur=s.length===1?`${s[0]}%`:'misto';
 el.insertAdjacentHTML('beforeend',`<div class="tsec"><h4>Tamanho ${ids.length>1?'da seleção':'do componente'} <span class="muted small">(${cur})</span></h4><div class="row">${[50,75,100].map(v=>`<button data-sc="${v}">${v}%</button>`).join('')}</div><div class="row"><button data-fitsel="1">Caber na folha</button></div><p class="muted small">Ou arraste um dos quadradinhos nos cantos da seleção. Os fios continuam ligados.</p></div>`)}}
$('#props').addEventListener('click',e=>{const b=e.target.closest('[data-sc],[data-fitsel]');if(!b)return;e.stopImmediatePropagation();if(mode!=='edit'){toast('Pare a simulação para redimensionar.',true);return}
 if(b.dataset.fitsel)fitToSheet(selIds());else scaleTo(+b.dataset.sc)},true);

/* menu Documentação: encaixar a folha inteira */
{const ref=document.getElementById('dBornes');if(ref&&document.createElement){const b=document.createElement('button');b.id='dFit';b.setAttribute('role','menuitem');
 b.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><path d="M9 9l6 6M15 9v6H9"/></svg><span>Encaixar o esquema na folha</span>';
 ref.parentNode.insertBefore(b,ref);b.addEventListener('click',()=>{const m=b.closest('.mlist');if(m)m.hidden=true;const t=$('#bDoc');if(t)t.setAttribute('aria-expanded','false');fitToSheet()})}}
{const st=document.createElement('style');st.textContent=`#hL .rbox{fill:none;stroke:var(--pick)}#hL .rh{fill:var(--panel);stroke:var(--pick);cursor:nwse-resize}#hL .rh[data-k=tr],#hL .rh[data-k=bl]{cursor:nesw-resize}#hL .rh:hover{fill:var(--pick)}#hL text.rpct{fill:var(--pick);font-family:'IBM Plex Sans',sans-serif;font-weight:700}`;document.head.appendChild(st)}
Object.assign(I18N_EXACT,{'Caber na folha':'Fit to sheet','Encaixar o esquema na folha':'Fit the schematic to the sheet','Arraste para diminuir ou aumentar a seleção':'Drag to shrink or enlarge the selection',
 'Ou arraste um dos quadradinhos nos cantos da seleção. Os fios continuam ligados.':'Or drag one of the small squares at the corners of the selection. Wires stay connected.','Pare a simulação para redimensionar.':'Stop the simulation to resize.','A folha está vazia.':'The sheet is empty.'});
Object.assign(I18N_EXACT,{'Tamanho da seleção':'Selection size','Tamanho do componente':'Component size','misto':'mixed'});
I18N_PHR.push(['Tamanho da seleção','Selection size'],['Tamanho do componente','Component size'],['Redimensionado para ','Resized to '],['% e posicionado dentro da folha.','% and placed inside the sheet.'],['Seleção em ','Selection at '],['% do tamanho anterior.','% of its previous size.']);
I18N_RE=null;I18N_CACHE.clear();renderPalette();renderAll();
