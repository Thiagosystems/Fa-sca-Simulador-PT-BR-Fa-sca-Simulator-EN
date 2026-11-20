/* ================= curvas de fio invisíveis (como no CADe_SIMU) ================= */
/* ponto com 2 fios = curva: não aparece; 3 ou mais fios = junção: bolinha preta; ponta solta: bolinha azul só na edição */
function junctionDegrees(){const d={};for(const w of allWires())for(const e of[w.a,w.b])d[e.c]=(d[e.c]||0)+1;return d}
function markJunctions(){const el=document.getElementById('cL');if(!el)return;const deg=junctionDegrees();
 for(const g of el.querySelectorAll('g.comp')){const c=byId(g.dataset.id);if(!c||c.type!=='junction')continue;const n=deg[c.id]||0;
  g.classList.remove('jb','jt','jo');g.classList.add(n>=3?'jt':n===2?'jb':'jo')}}
{const _rc=renderComps;renderComps=function(){_rc();markJunctions()}}
{const _rw=renderWires;renderWires=function(){_rw();markJunctions()}}

/* ================= fio desenhado por cima de uma curva: liga automaticamente ================= */
function autoJoin(newIds){if(!newIds.size)return 0;let n=0;
 for(let k=0;k<6;k++){const lc=looseConnIssues().filter(x=>x.c.type==='junction'&&(newIds.has(x.w.id)||S.wires.some(w=>newIds.has(w.id)&&(w.a.c===x.c.id||w.b.c===x.c.id))));if(!lc.length)break;
  const x=lc[0];if(!S.wires.includes(x.w))break;const q=tp(x.c,x.i),e=splitWire(x.w.id,q);if(!e)break;
  S.wires.forEach(w=>{if(w.a.c===e.c||w.b.c===e.c)newIds.add(w.id)});
  if(!(e.c===x.c.id&&e.t===x.i)){const w=newWire(e,{c:x.c.id,t:x.i});S.wires.push(w);newIds.add(w.id)}
  /* o ponto criado pela divisão coincide com a curva: junta os dois num só */
  const jx=byId(e.c);if(jx&&jx.type==='junction'&&jx.id!==x.c.id&&Math.hypot(jx.x-x.c.x,jx.y-x.c.y)<1){S.wires.forEach(w=>{if(w.a.c===jx.id)w.a={c:x.c.id,t:0};if(w.b.c===jx.id)w.b={c:x.c.id,t:0}});
   S.wires=S.wires.filter(w=>!(w.a.c===w.b.c&&w.a.t===w.b.t));S.comps=S.comps.filter(c=>c!==jx)}
  n++}
 /* trechos repetidos entre os mesmos dois pontos (fio por cima de fio) viram um só */
 if(n){const seen=new Set();S.wires=S.wires.filter(w=>{const k=[w.a.c+':'+w.a.t,w.b.c+':'+w.b.t].sort().join('|');if(seen.has(k))return false;seen.add(k);return true})}
 return n}
{const svgEl=document.getElementById('cv');let before=null;
 svgEl.addEventListener('pointerdown',e=>{before=mode==='edit'&&e.button===0?new Set(S.wires.map(w=>w.id)):null},true);
 svgEl.addEventListener('pointerdown',()=>{if(!before)return;const nw=new Set(S.wires.filter(w=>!before.has(w.id)).map(w=>w.id));before=null;
  if(nw.size&&autoJoin(nw)){commit()}})}

/* ================= cancelar um fio (botão direito ou Esc) apaga o trecho que ficou solto ================= */
{const _cancelTrail=()=>{if(!tool||!tool.from)return false;let cur=tool.from,n=0;const deg=()=>junctionDegrees();
  while(cur){const c=byId(cur.c);if(!c||c.type!=='junction'||!(tool.made||[]).includes(c.id))break;const d=deg()[c.id]||0;if(d>1)break;
   const w=S.wires.find(w=>w.a.c===c.id||w.b.c===c.id);if(!n)pushHist();S.comps=S.comps.filter(x=>x!==c);n++;
   if(!w){cur=null;break}S.wires=S.wires.filter(x=>x!==w);cur=w.a.c===c.id?w.b:w.a}
  return n>0};
 const svgEl=document.getElementById('cv');
 svgEl.addEventListener('pointerdown',e=>{if(e.button===2&&mode==='edit'&&tool&&tool.from){if(_cancelTrail()){tool=null;hoverConn=null;commit();e.stopImmediatePropagation();e.preventDefault()}}},true);
 addEventListener('keydown',e=>{if(e.key==='Escape'&&mode==='edit'&&tool&&tool.from){if(_cancelTrail()){tool=null;hoverConn=null;commit()}}},true)}
/* lembra quais curvas foram criadas neste fio, para o cancelamento saber o que apagar */
{const svgEl=document.getElementById('cv');let pend=null;
 svgEl.addEventListener('pointerdown',e=>{pend=mode==='edit'&&e.button===0&&tool&&tool.from?{made:tool.made||[],n:S.comps.length}:mode==='edit'&&e.button===0?{made:[],n:S.comps.length}:null},true);
 svgEl.addEventListener('pointerdown',()=>{if(!pend)return;const p=pend;pend=null;if(tool&&tool.from){const nc=S.comps.slice(p.n).filter(c=>c.type==='junction').map(c=>c.id);tool.made=[...p.made,...nc]}})}

{const st=document.createElement('style');st.textContent=`
#world .comp.jb .dot,#world .comp.jo .dot{display:none}
#world .comp.jb .term,#world .comp.jt .term{opacity:0}
#world .comp.jb:hover .term,#world .comp.jt:hover .term{opacity:.6}
#world .comp.jt .dot{display:inline}`;document.head.appendChild(st)}
renderAll();
