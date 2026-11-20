/* ================= terminais na grade (fios retos) ================= */
/* desloca toda a peça (terminais, caixa e desenho) para os terminais caírem na grade de 20 */
function shiftDef(t,ox,oy){const d=DEFS[t];if(!d)return;const T0=d.T,B0=d.B,D0=d.draw;
 d.T=c=>fv(T0,c).map(([x,y])=>[x+ox,y+oy]);d.B=c=>{const b=fv(B0,c);return[b[0]+ox,b[1]+oy,b[2],b[3]]};d.draw=c=>`<g transform="translate(${ox} ${oy})">${D0(c)}</g>`}
shiftDef('plc',10,0);shiftDef('scope',0,10);shiftDef('lctud',10,10);
/* contadores CTU/CTD: entradas em y 0 e 20 (antes ±10) */
for(const t of ['lctu','lctd']){const d=DEFS[t];if(!d)continue;const up=t==='lctu',a=up?'CU':'CD',b=up?'R':'LD';
 d.T=[[-40,0],[-40,20],[40,0]];d.B=[-40,-38,80,74];
 d.draw=c=>{const n=SIM()?rt.cnt[c.id]||0:0;return L(-40,0,-24,0)+L(-40,20,-24,20)+L(24,0,40,0)+R(-24,-14,48,44,GET(c.tag)?'en':'box')+T(4,4,up?'CTU':'CTD',c.r,'lv')+T(4,20,`${n}/${c.pv}`,c.r,'tn6')+T(-16,-3,a,c.r,'tn6')+T(-16,17,b,c.r,'tn6')+T(0,-24,c.tag,c.r,'lv')}}
/* inversor e conversor CC: bornes de comando em y −40, −20, 20, 40 */
{const d=DEFS.inv;d.T=[[-40,-60],[0,-60],[40,-60],[-40,60],[0,60],[40,60],[100,-40],[100,-20],[100,20],[100,40]];
 d.draw=c=>{const s=DS(c.id);return P('M-40,-60V-46M0,-60V-46M40,-60V-46M-40,60V46M0,60V46M40,60V46M100,-40H74M100,-20H74M100,20H74M100,40H74')+R(-54,-46,128,92,s?'en':'box',' rx="4"')+T(10,-14,'~ / ~',c.r,'ms')+T(10,4,`${c.hz} Hz`,c.r,'ms')+T(10,20,s===1?'AVANTE':s===2?'REVERSO':'PARADO',c.r,'tn6')+T(80,-43,'+24',c.r,'tn6')+T(80,-23,'DI1',c.r,'tn6')+T(80,17,'DI2',c.r,'tn6')+T(80,37,'0V',c.r,'tn6')}}
{const d=DEFS.vfdc;d.T=[[-20,-60],[20,-60],[-20,60],[20,60],[80,-40],[80,-20],[80,20],[80,40]];
 d.draw=c=>{const s=DS(c.id);return P('M-20,-60V-46M20,-60V-46M-20,60V46M20,60V46M80,-40H54M80,-20H54M80,20H54M80,40H54')+R(-34,-46,88,92,s?'en':'box',' rx="4"')+T(10,-10,'~ / =',c.r,'ms')+T(10,14,s===1?'AVANTE':s===2?'REVERSO':'PARADO',c.r,'tn6')+T(62,-43,'+24',c.r,'tn6')+T(62,-23,'DI1',c.r,'tn6')+T(62,17,'DI2',c.r,'tn6')+T(62,37,'0V',c.r,'tn6')}}

/* ================= rótulo de rede ================= */
const netW=c=>Math.max(24,String(c.net||'').length*7+12);
DEFS.netl={n:'Rótulo de rede',own:null,dom:'*',nolbl:1,def:{net:'REDE'},F:[['net','Nome da rede (rótulos com o mesmo nome ficam ligados)','text']],T:[[0,0]],N:['rede'],
 B:c=>[-2,-11,netW(c)+20,22],cond:()=>[],
 draw:c=>{const w=netW(c);return L(0,0,6,0)+P(`M6,0L14,-8H${14+w}V8H14Z`,'box netf')+T(14+w/2,((c.r||0)%360===180?-1:1)*3.5,c.net||'?',c.r,'lv')}};
{const _xw=xrefWires;xrefWires=function(){const v=_xw(),g={};for(const c of S.comps)if(c.type==='netl'&&c.net){const k=String(c.net).trim().toUpperCase();(g[k]=g[k]||[]).push(c)}
 for(const k in g){const a=g[k];for(let i=1;i<a.length;i++)v.push({id:'nl'+k+i,a:{c:a[0].id,t:0},b:{c:a[i].id,t:0},virt:1})}return v}}
{const _an=analyze;analyze=function(){const r=_an();if(!r||!r.issues)return r;const g={};S.comps.forEach(c=>{if(c.type==='netl'&&c.net){const k=String(c.net).trim().toUpperCase();(g[k]=g[k]||[]).push(c)}});
 for(const k in g)if(g[k].length<2)r.issues.push({lvl:'aviso',msg:`Rótulo de rede "${g[k][0].net}" sozinho`,why:'Um rótulo de rede liga pontos com o mesmo nome. Coloque outro rótulo com esse nome no ponto que deve ficar ligado.',ids:g[k].map(c=>c.id)});return r}}

/* ---------- destacar a rede: selecione um rótulo de rede ou um fio ---------- */
function netKeysFrom(key){const uf=makeUF();for(const w of allWires())uf.u(K(w.a.c,w.a.t),K(w.b.c,w.b.t));const r=uf.f(key),set=new Set();
 for(const c of S.comps)termsOf(c).forEach((_,i)=>{const k=K(c.id,i);if(uf.f(k)===r)set.add(k)});return set}
function hlNet(){if(mode!=='edit'||!sel)return null;if(sel.c.size===1&&!sel.w.size){const c=byId([...sel.c][0]);if(c&&c.type==='netl')return netKeysFrom(K(c.id,0))}
 if(sel.w.size===1&&!sel.c.size){const w=S.wires.find(x=>x.id===[...sel.w][0]);if(w)return netKeysFrom(K(w.a.c,w.a.t))}return null}
function applyNetHL(){const net=hlNet();document.querySelectorAll('#world .nethl').forEach(e=>e.classList.remove('nethl'));if(!net)return;
 const wl=document.getElementById('wL');if(wl)for(const w of S.wires)if(net.has(K(w.a.c,w.a.t))){const el=wl.querySelector(`path.whit[data-w="${w.id}"]`);if(el&&el.nextElementSibling)el.nextElementSibling.classList.add('nethl')}
 const cl=document.getElementById('cL');if(cl)for(const k of net){const[id,t]=k.split(':'),g=cl.querySelector(`g.comp[data-id="${id}"]`);if(!g)continue;const c=byId(id);if(c&&(c.type==='netl'||c.type==='junction'))g.classList.add('nethl');const tc=g.querySelector(`circle.term[data-t="${t}"]`);if(tc)tc.classList.add('nethl')}}
{const _rc=renderComps;renderComps=function(){_rc();applyNetHL()}}
{const _rw=renderWires;renderWires=function(){_rw();applyNetHL()}}
function netSummary(net){const by={};for(const k of net){const[id,t]=k.split(':'),c=byId(id);if(!c||['junction','netl','xref'].includes(c.type))continue;const nm=(namesOf(c)[+t]||'').toString();const lb=c.tag||lab(c);(by[lb]=by[lb]||[]).push(nm)}
 return Object.entries(by).map(([k,v])=>`${k} ${v.filter(Boolean).join(', ')}`.trim())}
{const _rp=renderProps;renderProps=function(){_rp();const net=hlNet();if(!net)return;const el=$('#props');if(!el)return;const nm=(()=>{for(const k of net){const c=byId(k.split(':')[0]);if(c&&c.type==='netl')return c.net}return''})();
 const d=document.createElement('div');d.className='netbox';const it=netSummary(net);d.innerHTML=`<b>${tr('Rede destacada')}${nm?` "${esc(nm)}"`:''}</b><p class="muted small">${it.length?esc(it.join(' · ')):tr('Nenhum componente ligado ainda.')}</p>`;el.appendChild(d)}}

/* ================= exportar imagem PNG ================= */
async function exportPNG(){const world=document.getElementById('world');if(!world)return;const was=mode;if(mode!=='edit'&&mode!=='sim')return;
 const prevSel=sel,prevTool=tool;sel=null;tool=null;renderAll();
 try{const bb=(()=>{if(S.doc&&S.doc.fr)return[FX0-10,FY0-10,FX1-FX0+20,FY1-FY0+20];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const c of S.comps){if(!onSheet(c))continue;const b=wbox(c,true);x0=Math.min(x0,b[0]);y0=Math.min(y0,b[1]);x1=Math.max(x1,b[2]);y1=Math.max(y1,b[3])}
   for(const w of S.wires){const g=wireGeo(w);if(!g||!onSheet(byId(w.a.c)))continue;for(const q of g){x0=Math.min(x0,q.x);y0=Math.min(y0,q.y);x1=Math.max(x1,q.x);y1=Math.max(y1,q.y)}}if(x0>x1)return[0,0,400,300];return[x0-30,y0-30,x1-x0+60,y1-y0+60]})();
  const de=document.documentElement,th=de.dataset.theme;de.dataset.theme='light';
  /* copia o estilo calculado de cada elemento (cores do tema claro) para a cópia, que vira uma imagem independente */
  const PROPS=['fill','fill-opacity','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','stroke-opacity','opacity','display','visibility','font-size','font-weight','font-family','font-style','text-anchor','dominant-baseline','text-decoration','filter'];
  const cl=world.cloneNode(true),oa=[world,...world.querySelectorAll('*')],ca=[cl,...cl.querySelectorAll('*')];
  for(let i=0;i<oa.length&&i<ca.length;i++){const st=getComputedStyle(oa[i]);let t='';for(const k of PROPS){const v=st.getPropertyValue(k);if(v)t+=`${k}:${k==='font-family'?'Arial,Helvetica,sans-serif':v};`}ca[i].setAttribute('style',t)}
  if(th)de.dataset.theme=th;else delete de.dataset.theme;
  cl.querySelectorAll('.term,.hit,.whit,.wh,.badge,.selbox,.wprev,.wstart,.ghost,.snapt,.snapw,.rbox,.rh').forEach(e=>e.remove());cl.removeAttribute('transform');
  const sc=Math.max(1,Math.min(3,2400/Math.max(bb[2],bb[3])*1.2)),W=Math.round(bb[2]*sc),H=Math.round(bb[3]*sc);
  const svgTxt=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${bb.join(' ')}"><rect x="${bb[0]}" y="${bb[1]}" width="${bb[2]}" height="${bb[3]}" fill="#ffffff"/>${cl.outerHTML}</svg>`;
  const url=URL.createObjectURL(new Blob([svgTxt],{type:'image/svg+xml'}));
  const img=new Image();await new Promise((ok,ko)=>{img.onload=ok;img.onerror=ko;img.src=url});
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,W,H);g.drawImage(img,0,0,W,H);URL.revokeObjectURL(url);
  const blob=await new Promise(r=>cv.toBlob(r,'image/png'));const sh=(S.sheets||[]).find(x=>x.id===S.cur);const nome=(typeof fname==='string'?fname:'esquema')+((S.sheets||[]).length>1&&sh?' - '+sh.name:'');
  download(blob,nome+'.png');toast(tr('Imagem PNG gerada: ')+nome+'.png')}
 catch(e){toast(tr('Não consegui gerar a imagem PNG neste navegador.'),true)}
 finally{sel=prevSel;tool=prevTool;renderAll()}}
{const pdf=document.getElementById('bPdf');if(pdf&&document.createElement){const b=document.createElement('button');b.id='bPng';b.setAttribute('role','menuitem');b.title='Imagem do esquema (folha atual) para colar em trabalhos e mensagens';
 b.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg><span>Exportar imagem PNG</span>';pdf.after(b);b.addEventListener('click',()=>exportPNG())}}

/* ================= blocos reutilizáveis ("Meus blocos") ================= */
const BLK_CAT='20. Meus blocos';
function blkLoad(){try{const v=JSON.parse(localStorage.getItem('faisca-blocks')||'[]');return Array.isArray(v)?v.filter(b=>b&&typeof b.name==='string'&&b.data&&Array.isArray(b.data.comps)):[]}catch(_){return[]}}
function blkSave(l){try{localStorage.setItem('faisca-blocks',JSON.stringify(l));return true}catch(_){toast(tr('Não consegui salvar o bloco: o armazenamento do navegador está cheio ou bloqueado.'),true);return false}}
DEFS.blkicon={n:'Bloco',nolbl:1,T:[],B:[-30,-24,60,48],draw:c=>c.mg?P('M-14,-14h28v28h-28zM-6,-6h12M-6,0h12M-6,6h8')+C(16,-16,7)+P('M16,-19v6M13,-16h6'):R(-26,-18,24,16,'box')+R(2,-18,24,16,'box')+R(-12,4,24,16,'box')+L(-2,-10,2,-10)+L(0,-2,0,4)};
function blkSync(){const i=PAL.findIndex(p=>p[0]===BLK_CAT);if(i>=0)PAL.splice(i,1);const l=blkLoad();
 PAL.push([BLK_CAT,[['Gerenciar blocos…','blkicon',{mg:1}],...l.map((b,k)=>[b.name,'blkicon',{bi:k}])]])}
function blkNorm(d){const c=JSON.parse(JSON.stringify(d.comps)),w=JSON.parse(JSON.stringify(d.wires||[]));const x0=Math.min(...c.map(o=>o.x)),y0=Math.min(...c.map(o=>o.y)),ox=snap(x0),oy=snap(y0);
 c.forEach(o=>{o.x-=ox;o.y-=oy;delete o.sh});w.forEach(o=>{if(num(o.m))o.m-=o.o==='v'?oy:ox});return{comps:c,wires:w}}
function blkFromSel(){const d=extractSel();if(!d){toast(tr('Selecione os componentes do bloco primeiro.'),true);return}
 openModal(tr('Salvar como bloco'),`<label>${tr('Nome do bloco')}<input id="blkN" maxlength="40" value="${esc(tr('Meu bloco')+' '+(blkLoad().length+1))}"></label><p class="muted small">${tr('O bloco aparece na paleta, em "20. Meus blocos". Clique nele para colocar uma cópia no desenho.')}</p>`,
  `<button data-mx="1">${tr('Cancelar')}</button><button class="pri" data-ok="1">${tr('Salvar')}</button>`,e=>{if(!e.target.closest('[data-ok]'))return;const n=(document.getElementById('blkN').value||'').trim().slice(0,40)||tr('Meu bloco');
   const l=blkLoad();l.push({name:n,data:blkNorm(d)});if(blkSave(l)){closeModal();blkSync();renderPalette();toast(tr('Bloco salvo: ')+n)}})}
function blkPlace(k){const b=blkLoad()[k];if(!b)return;if(mode!=='edit'){toast(tr('Pare a simulação para colocar blocos.'),true);return}let st;try{st=cleanState({comps:b.data.comps.map(c=>({...c})),wires:b.data.wires})}catch(e){toast(tr('Este bloco está com defeito e não pode ser usado.'),true);return}
 const r=svg.getBoundingClientRect(),cx=snap((r.width/2-view.x)/view.s)-100,cy=snap((r.height/2-view.y)/view.s)-80;const res=pasteData(st,cx,cy);toast(`${tr('Bloco colocado')}: ${b.name} (${res.c} ${tr('componente(s)')}). ${tr('Arraste para posicionar.')}`)}
function blkManage(){const l=blkLoad();
 openModal(tr('Meus blocos'),`<p class="muted small" style="margin-top:0">${tr('Para criar um bloco, selecione parte do circuito e clique em "Salvar como bloco" no painel. Os blocos ficam neste navegador; exporte para levar a outro computador.')}</p>
  ${l.length?`<table class="bom"><tbody>${l.map((b,k)=>`<tr><td>${esc(b.name)}</td><td>${b.data.comps.length} ${tr('peças')}</td><td style="text-align:right"><button data-ren="${k}">${tr('Renomear')}</button> <button data-del="${k}">${tr('Excluir')}</button></td></tr>`).join('')}</tbody></table>`:`<p>${tr('Nenhum bloco salvo ainda.')}</p>`}
  <input type="file" id="blkF" accept=".faisb,.json,application/json" hidden>`,
  `<button data-imp="1">${tr('Importar blocos…')}</button><button data-exp="1" ${l.length?'':'disabled'}>${tr('Exportar blocos')}</button><button class="pri" data-mx="1">${tr('Fechar')}</button>`,e=>{
   const t=e.target.closest('button');if(!t)return;const l2=blkLoad();
   if(t.dataset.del!=null){l2.splice(+t.dataset.del,1);blkSave(l2);blkSync();renderPalette();blkManage()}
   else if(t.dataset.ren!=null){const b=l2[+t.dataset.ren];const n=prompt(tr('Novo nome do bloco'),b.name);if(n&&n.trim()){b.name=n.trim().slice(0,40);blkSave(l2);blkSync();renderPalette();blkManage()}}
   else if(t.dataset.exp){download(new Blob([JSON.stringify({formato:'faisca-blocos',v:1,blocos:l2},null,1)],{type:'application/json'}),'meus-blocos.faisb')}
   else if(t.dataset.imp){const f=document.getElementById('blkF');f.onchange=async()=>{const fl=f.files[0];if(!fl)return;try{const o=JSON.parse(await fl.text());if(!o||o.formato!=='faisca-blocos'||!Array.isArray(o.blocos))throw 0;
     let n=0;const cur=blkLoad();for(const b of o.blocos.slice(0,200)){try{if(typeof b.name!=='string')continue;const st=cleanState({comps:b.data.comps,wires:b.data.wires||[]});cur.push({name:b.name.slice(0,40),data:{comps:st.comps,wires:st.wires}});n++}catch(_){}}
     blkSave(cur);blkSync();renderPalette();blkManage();toast(`${n} ${tr('bloco(s) importado(s).')}`)}catch(_){toast(tr('Este arquivo não é uma lista de blocos do Faísca (.faisb).'),true)}};f.click()}})}
$('#palette').addEventListener('click',e=>{const b=e.target.closest('.pitem');if(!b)return;const[ci,ii]=b.dataset.p.split('.').map(Number),cat=PAL[ci];if(!cat||cat[0]!==BLK_CAT)return;e.stopImmediatePropagation();e.preventDefault();
 const it=cat[1][ii];if(it[2].mg)blkManage();else blkPlace(it[2].bi)},true);
{const _rp=renderProps;renderProps=function(){_rp();if(mode!=='edit'||!sel||!sel.c||sel.c.size<1)return;const el=$('#props');if(!el)return;const d=document.createElement('div');d.className='row';
 d.innerHTML=`<button type="button" id="bBlk" title="${tr('Guarda esta seleção na paleta para reaproveitar depois')}">${tr('Salvar como bloco')}</button>`;el.appendChild(d);d.querySelector('#bBlk').onclick=blkFromSel}}
blkSync();

/* ================= NE555 em alta frequência no osciloscópio ================= */
{const mk=window.mkTpl;
 mk('555k',(a,w,j,tx)=>{S.sp=.001;tx('T1',140,40,'NE555 A 1,5 kHz NO OSCILOSCÓPIO');
  tx('N1',140,70,'Velocidade 1/1000×: 1 segundo na tela = 1 milissegundo no circuito.');tx('N2',140,95,'CH1 = saída (pino 3) · CH2 = capacitor C1. f ≈ 1,44 / ((R1 + 2·R2) · C1) ≈ 1,46 kHz');
  a('U','ic',400,300,{k:'NE555',tag:'U1'});a('PP','src',600,80,{v:'+',V:9});j('JA',600,160);w('PP',0,'JA',0);w('JA',0,'U',7,'h',520);
  a('R1','res',600,220,{R:1000,tag:'R1'});w('JA',0,'R1',0);j('JD',600,300);w('R1',1,'JD',0);w('JD',0,'U',6);
  a('R2','res',600,360,{R:10000,tag:'R2'});w('JD',0,'R2',0);j('JT',600,440);w('R2',1,'JT',0);
  a('C1','cap',600,500,{Cf:47e-9,Vmax:50,pol:false,tag:'C1'});w('JT',0,'C1',0);j('JM',600,580);w('C1',1,'JM',0);a('M1','src',600,640,{v:'-',r:180});w('JM',0,'M1',0);
  j('JX',520,440);w('U',1,'JX',0,'h',220);w('JX',0,'JT',0);w('JX',0,'U',5,'h',520);
  a('M0','src',300,220,{v:'-'});w('U',0,'M0',0,'h',300);a('PR','src',270,380,{v:'+',V:9,r:180});w('U',3,'PR',0,'h',270);
  j('JO',160,320);w('U',2,'JO',0);a('R3','res',160,400,{R:1000,tag:'R3'});w('JO',0,'R3',0);a('M2','src',160,500,{v:'-',r:180});w('R3',1,'M2',0);
  a('NO1','netl',120,320,{net:'SAÍDA',r:180});w('JO',0,'NO1',0);a('NC1','netl',640,440,{net:'CAP'});w('JT',0,'NC1',0);a('NG1','netl',640,580,{net:'GND'});w('JM',0,'NG1',0);
  a('SC','scope',900,320,{tag:'OSC1'});a('NO2','netl',820,300,{net:'SAÍDA',r:180});w('NO2',0,'SC',0);a('NG2','netl',820,320,{net:'GND',r:180});w('NG2',0,'SC',1);
  a('NC2','netl',820,340,{net:'CAP',r:180});w('NC2',0,'SC',2);a('M3','src',840,400,{v:'-',r:180});w('SC',3,'M3',0)});
 const s=document.getElementById('bTpl');if(s&&s.querySelector){const o=s.querySelector('option[value="aop"]')||s.lastElementChild;const op=document.createElement('option');op.value='555k';op.textContent='NE555 a 1,5 kHz no osciloscópio';o.before(op)}}

/* ---------- estilos ---------- */
{const st=document.createElement('style');st.textContent=`#world .wire.nethl{stroke:var(--pick)!important;stroke-width:3.4}#world .comp.nethl .netf,#world .comp.nethl .jd{stroke:var(--pick);fill:color-mix(in srgb,var(--pick) 18%,var(--panel))}#world circle.term.nethl{fill:var(--pick);stroke:var(--pick)}
#world .netf{fill:var(--panel)}.netbox{margin-top:10px;padding:8px 10px;border:1px solid var(--pick);border-radius:8px;background:color-mix(in srgb,var(--pick) 7%,transparent)}.netbox p{margin:4px 0 0}`;document.head.appendChild(st)}

/* ---------- paleta e traduções ---------- */
{const cat=PAL.find(p=>p[0]==='17. Cabos e conexões');if(cat){const i=cat[1].findIndex(x=>x[1]==='xref');cat[1].splice(i,0,['Rótulo de rede','netl',{}])}}
Object.assign(I18N_EXACT,{'Rótulo de rede':'Net label','Nome da rede (rótulos com o mesmo nome ficam ligados)':'Net name (labels with the same name are connected)','Rede destacada':'Highlighted net','Nenhum componente ligado ainda.':'Nothing connected yet.',
 'Exportar imagem PNG':'Export PNG image','Imagem PNG gerada: ':'PNG image saved: ','Não consegui gerar a imagem PNG neste navegador.':'Could not create the PNG image in this browser.',
 '20. Meus blocos':'20. My blocks','Gerenciar blocos…':'Manage blocks…','Salvar como bloco':'Save as block','Nome do bloco':'Block name','Meu bloco':'My block','Bloco':'Block',
 'O bloco aparece na paleta, em "20. Meus blocos". Clique nele para colocar uma cópia no desenho.':'The block appears in the palette under "20. My blocks". Click it to place a copy on the drawing.',
 'Selecione os componentes do bloco primeiro.':'Select the block components first.','Bloco salvo: ':'Block saved: ','Pare a simulação para colocar blocos.':'Stop the simulation to place blocks.','Este bloco está com defeito e não pode ser usado.':'This block is damaged and cannot be used.',
 'Bloco colocado':'Block placed','componente(s)':'component(s)','Arraste para posicionar.':'Drag it into place.','Meus blocos':'My blocks',
 'Para criar um bloco, selecione parte do circuito e clique em "Salvar como bloco" no painel. Os blocos ficam neste navegador; exporte para levar a outro computador.':'To create a block, select part of the circuit and click "Save as block" in the panel. Blocks are kept in this browser; export them to use on another computer.',
 'peças':'parts','Renomear':'Rename','Excluir':'Delete','Nenhum bloco salvo ainda.':'No blocks saved yet.','Importar blocos…':'Import blocks…','Exportar blocos':'Export blocks','Fechar':'Close','Novo nome do bloco':'New block name',
 'bloco(s) importado(s).':'block(s) imported.','Este arquivo não é uma lista de blocos do Faísca (.faisb).':'This file is not a Faísca block list (.faisb).','Guarda esta seleção na paleta para reaproveitar depois':'Keeps this selection in the palette to reuse later',
 'Não consegui salvar o bloco: o armazenamento do navegador está cheio ou bloqueado.':'Could not save the block: browser storage is full or blocked.',
 'NE555 a 1,5 kHz no osciloscópio':'NE555 at 1.5 kHz on the oscilloscope','NE555 A 1,5 kHz NO OSCILOSCÓPIO':'NE555 AT 1.5 kHz ON THE OSCILLOSCOPE','Velocidade 1/1000×: 1 segundo na tela = 1 milissegundo no circuito.':'Speed 1/1000×: 1 second on screen = 1 millisecond in the circuit.',
 'CH1 = saída (pino 3) · CH2 = capacitor C1. f ≈ 1,44 / ((R1 + 2·R2) · C1) ≈ 1,46 kHz':'CH1 = output (pin 3) · CH2 = capacitor C1. f ≈ 1.44 / ((R1 + 2·R2) · C1) ≈ 1.46 kHz'});
I18N_PHR.push(['Rótulo de rede "','Net label "'],['" sozinho','" alone'],['Um rótulo de rede liga pontos com o mesmo nome. Coloque outro rótulo com esse nome no ponto que deve ficar ligado.','A net label connects points with the same name. Place another label with this name where it must connect.']);
I18N_RE=null;I18N_CACHE.clear();renderPalette();renderAll();
