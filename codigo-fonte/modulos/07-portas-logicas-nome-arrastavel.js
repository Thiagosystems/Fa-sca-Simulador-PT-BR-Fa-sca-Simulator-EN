/* ================= portas lógicas: símbolo simples (distintivo) e número de entradas ================= */
{const G=DEFS.gate,NIN=c=>c.op==='NOT'?1:Math.max(2,Math.min(8,Math.round(+c.ni||2)));
 /* posições das entradas na grade de 20: 2 → ±20 (igual aos projetos antigos), 3 → -20/0/20, 4 → ±20 ±40 ... */
 const ys=n=>{if(n===1)return[0];const o=[];if(n%2){for(let k=0;k<n;k++)o.push((k-(n-1)/2)*20)}else{const h=n/2;for(let k=h;k>=1;k--)o.push(-k*20);for(let k=1;k<=h;k++)o.push(k*20)}return o};
 const idx=k=>k<2?k:k+1; /* saída sempre no índice 2: projetos antigos continuam ligados */
 const halfH=n=>Math.max(24,(n>1?Math.max(...ys(n).map(Math.abs)):0)+12);
 const LET='ABCDEFGH';
 G.def={op:'AND',ni:2,sym:''};
 G.F=[['op','Função','sel',Object.keys(GOP)],['ni','Número de entradas','sel',[['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8']],{when:c=>c.op!=='NOT'}],
  ['sym','Símbolo','sel',[['','Simples (formato das portas)'],['iec','Retangular (IEC)']]]];
 G.T=c=>{if(c.op==='NOT')return[[-40,0],[40,0]];const n=NIN(c),y=ys(n),t=[];for(let k=0;k<n;k++)t[idx(k)]=[-40,y[k]];t[2]=[40,0];return t};
 G.N=c=>{if(c.op==='NOT')return['A','Y'];const n=NIN(c),t=[];for(let k=0;k<n;k++)t[idx(k)]=LET[k];t[2]='Y';return t};
 G.B=c=>{const h=c.op==='NOT'?20:halfH(NIN(c));return[-40,-h-6,80,2*h+12]};
 const bodyCl=c=>DS(c.id)?'en':'box';
 G.draw=c=>{const op=c.op,n=NIN(c),y=ys(n),ng=!!GNEG[op],h=op==='NOT'?18:halfH(n);
  if(c.sym==='iec'){let s='';y.forEach(v=>s+=L(-40,v,-20,v));const hh=Math.max(24,h);s+=R(-20,-hh,40,2*hh,bodyCl(c))+T(0,4,GOP[op],c.r,'lv')+(ng?C(24,0,4)+L(28,0,40,0):L(20,0,40,0));return s}
  let s='',tip;
  if(op==='NOT'){s+=L(-40,0,-18,0)+P('M-18,-16L14,0L-18,16Z',bodyCl(c));tip=14}
  else if(op==='AND'||op==='NAND'){y.forEach(v=>s+=L(-40,v,-20,v));const w=Math.min(26,h);s+=P(`M-20,${-h}H${-2}A${w},${h} 0 0 1 ${-2},${h}H-20Z`,bodyCl(c));tip=-2+w}
  else{/* OR, NOR, XOR, XNOR: traseira curva */
   const bx=v=>{const t=(1-v/h)/2;return-24+24*t*(1-t)};
   y.forEach(v=>s+=L(-40,v,bx(v),v));
   s+=P(`M-24,${-h}Q2,${-h} 24,0Q2,${h} -24,${h}Q-12,0 -24,${-h}Z`,bodyCl(c));tip=24;
   if(op==='XOR'||op==='XNOR')s+=P(`M-31,${-h}Q-19,0 -31,${h}`)}
  s+=ng?C(tip+4,0,4)+L(tip+8,0,40,0):L(tip,0,40,0);
  return s};
 G.der=(c,X,N)=>{const n=NIN(c),a=[];if(c.op==='NOT')a.push(X.hasP(0));else for(let k=0;k<n;k++)a.push(X.hasP(idx(k)));
  const all=a.every(Boolean),any=a.some(Boolean),odd=a.filter(Boolean).length%2===1;
  const y={AND:all,OR:any,NOT:!a[0],NAND:!all,NOR:!any,XOR:odd,XNOR:!odd}[c.op];N.ds[c.id]=y?1:0;X.push(c.op==='NOT'?1:2,c.tag+(y?':+':':-'))};
 {const lp=lblPos;lblPos=function(c){if(c.type!=='gate')return lp(c);const b=G.B(c),s=SCL(c),o=rot([-14,b[1]-2],c.r);return s===1?o:[o[0]*s,o[1]*s]}}
 const cat=PAL.find(p=>p[0]==='12. Lógica');if(cat){const i=cat[1].findIndex(x=>x[0]==='OR');cat[1].splice(i+1,0,['OR de 3 entradas','gate',{op:'OR',ni:3}]);
  const j=cat[1].findIndex(x=>x[0]==='AND');cat[1].splice(j+1,0,['AND de 3 entradas','gate',{op:'AND',ni:3}])}
 Object.assign(I18N_EXACT,{'Número de entradas':'Number of inputs','Símbolo':'Symbol','Simples (formato das portas)':'Simple (distinctive shape)','Retangular (IEC)':'Rectangular (IEC)',
  'OR de 3 entradas':'3-input OR','AND de 3 entradas':'3-input AND'})}

/* ================= nome (tag) arrastável ================= */
{const lp=lblPos;lblPos=function(c){const o=lp(c);return c.lo?[o[0]+c.lo[0],o[1]+c.lo[1]]:o}}
{const st=document.createElement('style');st.textContent=`body:not(.sim) #world text.tag[data-c],body:not(.sim) #world text.rd[data-c]{cursor:move}body:not(.sim) #world text.tag[data-c]:hover{fill:var(--pick)}`;document.head.appendChild(st)}
{let ld=null,raf=0;const sv=document.getElementById('cv');
 const stop=e=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
 sv.addEventListener('pointerdown',e=>{if(mode!=='edit'||tool||e.button!==0)return;const t=e.target.closest&&e.target.closest('text.tag[data-c],text.rd[data-c]');if(!t)return;
  const c=byId(t.dataset.c);if(!c)return;stop(e);ld={c,p:toWorld(e),lo:c.lo?[...c.lo]:[0,0],h:false};try{sv.setPointerCapture(e.pointerId)}catch(_){}},true);
 window.addEventListener('pointermove',e=>{if(!ld)return;stop(e);const p=toWorld(e),dx=p.x-ld.p.x,dy=p.y-ld.p.y;
  if(!ld.h){if(Math.hypot(dx,dy)<3)return;pushHist();ld.h=true}
  ld.c.lo=[Math.round(ld.lo[0]+dx),Math.round(ld.lo[1]+dy)];if(!raf)raf=requestAnimationFrame(()=>{raf=0;renderAll()})},true);
 const up=e=>{if(!ld)return;stop(e);const c=ld.c,h=ld.h;ld=null;if(h){if(c.lo&&!c.lo[0]&&!c.lo[1])delete c.lo;commit()}else select(mkSel([c.id]))};
 window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',up,true)}
{const _rp=renderProps;renderProps=function(){_rp();if(mode!=='edit'||!sel||!sel.c||sel.c.size!==1)return;const c=byId([...sel.c][0]);if(!c||!c.lo)return;const el=$('#props');if(!el)return;
 const d=document.createElement('div');d.className='row';d.innerHTML=`<button type="button" id="bLo">${typeof tr==='function'?tr('Voltar o nome para o lugar padrão'):'Voltar o nome para o lugar padrão'}</button>`;el.appendChild(d);
 d.querySelector('#bLo').onclick=()=>{pushHist();delete c.lo;commit()}}}
Object.assign(I18N_EXACT,{'Voltar o nome para o lugar padrão':'Move the name back to its default place'});
I18N_PHR.push(['Arraste o nome (tag) de um componente para mudar o lugar dele.','Drag a component name (tag) to move it.']);
I18N_RE=null;I18N_CACHE.clear();renderPalette();renderAll();
