/* ================= Modo Protoboard: o mesmo circuito montado de verdade =================
   O esquema continua sendo a fonte da verdade da simulação. A protoboard é outra vista dele:
   - cada componente elétrico tem uma posição na bancada (pbx, pby, pbr);
   - os fios do esquema aparecem como jumpers ligando os terminais;
   - terminais encaixados na mesma tira da protoboard (ou ligados por jumpers da protoboard)
     viram fios no esquema automaticamente (marcados com pb:1);
   - quando a ligação já existe pela protoboard, o fio do esquema não é desenhado de novo. */
const PBP=10;
const PBK={full:{n:63,rails:1,nm:'Protoboard'},half:{n:30,rails:1,nm:'Meia protoboard'},mini:{n:17,rails:0,nm:'Mini protoboard'}};
const PBW={verde:['Verde','#2f9e44'],vermelho:['Vermelho','#d32f2f'],preto:['Preto','#2a2a2a'],azul:['Azul','#1e63c9'],amarelo:['Amarelo','#e9c21b'],laranja:['Laranja','#f07c1a'],
 branco:['Branco','#eeeeee'],roxo:['Roxo','#7b3fbf'],cinza:['Cinza','#8d939b'],marrom:['Marrom','#7a4a24'],rosa:['Rosa','#e85d9a'],ciano:['Ciano','#1fb3c8']};
const PBWC={pt:'preto',mr:'marrom',ci:'cinza',az:'azul',vd:'verde',vm:'vermelho',ae:'azul',la:'laranja',am:'amarelo',vi:'roxo',br:'branco'};
let pbV={x:60,y:60,s:1.6},pbTool=null,pbDrag=null,pbHover=null,pbSelW=null,pbSelB=null,pbHeld=null,pbPtr={x:0,y:0},pbCol=(()=>{try{const v=localStorage.getItem('faisca-pbcol');return v&&PBW[v]?v:'verde'}catch(e){return'verde'}})();
const pbOn=()=>!!(S.pb&&S.pb.on&&!S.nopb);
const PBNOT=new Set(['note','blkicon']);
const pbVis=c=>!!c&&!PBNOT.has(c.type)&&(['e','*'].includes(domOf(c))||c.type==='irremote');

/* ---------- utilidades de desenho ---------- */
const bR=(x,y,w,h,f,ex='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${ex}/>`;
const bC=(x,y,r,f,ex='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${ex}/>`;
const bP=(d,f,ex='')=>`<path d="${d}" fill="${f}"${ex}/>`;
const bT=(x,y,s,sz,f,ex='')=>`<text x="${x}" y="${y}" font-size="${sz}" fill="${f}"${ex}>${esc(s)}</text>`;
const bTc=(x,y,s,sz,f,ex='')=>bT(x,y,s,sz,f,` text-anchor="middle"${ex}`);
const bLeg=(x1,y1,x2,y2,w=1.7,col='#a8afb7')=>`<path d="M${x1},${y1}L${x2},${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
const bWire=(d,col,w=2)=>`<path d="${d}" stroke="${col[0]==='#'?pbShadeCol(col,-.35):'rgba(0,0,0,.35)'}" stroke-width="${w+.9}" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const bShade=()=>'';
const bStk=(c,w=.8)=>` stroke="${c}" stroke-width="${w}"`;
const pbOnS=()=>SIM()&&!!rt.A;
function pbShadeCol(hex,k){const n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255,f=v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k)));return`rgb(${f(r)},${f(g)},${f(b)})`}

/* faixas de cor do resistor */
const RBC=['#151515','#7a4a1f','#d11f1f','#f28c1e','#f2d10f','#2f9e44','#2056c7','#8a3fc7','#8a8a8a','#f6f6f6'];
function rBands(R){R=Math.abs(+R)||0;if(R<.1)return[0,0,0];let e=Math.floor(Math.log10(R))-1,d=Math.round(R/Math.pow(10,e));if(d>=100){d=Math.round(d/10);e++}return[Math.floor(d/10)%10,d%10,Math.max(-2,Math.min(9,e))]}
const multCol=e=>e===-1?'#c9a227':e===-2?'#c0c0c0':RBC[e];

/* dígito de 7 segmentos (bits: a=1,b=2,...,g=64, dp=128) */
function pbSeg(x,y,w,h,bits,col,off){const t=Math.max(1.4,w*.16),s=(on,d)=>`<path d="${d}" stroke="${on?col:off}" stroke-width="${t}" stroke-linecap="round" fill="none"${on?` style="filter:drop-shadow(0 0 1.5px ${col})"`:''}/>`,m=h/2,k=w*.12;
 return`<g transform="translate(${x} ${y})">`+s(bits&1,`M${t+k},0H${w-t}`)+s(bits&2,`M${w},${t}V${m-t}`)+s(bits&4,`M${w-k},${m+t}V${h-t}`)+s(bits&8,`M${t-k},${h}H${w-t-k}`)+s(bits&16,`M${-k},${m+t}V${h-t}`)+s(bits&32,`M0,${t}V${m-t}`)+s(bits&64,`M${t-k/2},${m}H${w-t-k/2}`)+(bits&128?bC(w+t,h,t*.7,col):bC(w+t,h,t*.7,off))+'</g>'}

/* ---------- pacotes físicos: terminais (em passos de 0,1") e desenho ---------- */
const pbRow=(n,y=0,x0=0)=>rng(n).map(i=>[x0+i,y]);
function dipPins(n){const h=n/2;return rng(n).map(i=>{const p=i+1;return p<=h?[p-1,3]:[n-p,0]})}
function burnFx(b){const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,r=Math.max(8,Math.min(30,(b[2]-b[0])/3));return`<g pointer-events="none">${bC(cx,cy,r,'rgba(25,20,15,.75)',' filter="url(#pbBl)"')}${bP(`M${cx-r*.5},${cy-r*.2}l${r*.3},${r*.25}l${r*.15},-${r*.4}l${r*.3},${r*.3}`,'none',' stroke="#000" stroke-width="1.4" opacity=".7"')}${[0,1,2].map(k=>bC(cx+(k-1)*r*.35,cy-r*.6,r*(.45+k*.08),'rgba(140,140,140,.6)',` class="pbsmoke${k?' s'+(k+1):''}" filter="url(#pbBl)"`)).join('')}</g>`}
function pbLedCol(c){return({vermelha:'#ff2b2b',verde:'#25d25f',amarela:'#ffd21f',azul:'#3d8bff',branca:'#f2f7ff'})[c.col]||'#ff2b2b'}
function domeLED(cx,col,b,w=12,dark){const x=cx-w/2,top=-28,base=-8;const body=`M${x},${base}V${top+w/2}A${w/2},${w/2} 0 0 1 ${x+w},${top+w/2}V${base}Z`;
 return(b>0?bC(cx,top+10,10+12*b,col,` opacity="${(.25+.4*b).toFixed(2)}" filter="url(#pbBl)"`):'')+bP(body,dark||col,` opacity="${b>0?1:.82}"`)+(b>0?'':bP(body,'rgba(0,0,0,.28)'))+
  bP(`M${x+2},${base-2}V${top+w/2}A${w/2-2},${w/2-2} 0 0 1 ${x+w/2},${top+2}`,'none',' stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"')+bR(x-1.5,base,w+3,3,dark||col,' rx="1"')+bR(x-1.5,base,w+3,3,'rgba(0,0,0,.25)',' rx="1"')}
function to92(lbl){return bP('M-5,-6V-20Q-5,-31 10,-31Q25,-31 25,-20V-6Z','#262626')+bP('M-3,-7V-19Q-3,-28 6,-29','none',' stroke="rgba(255,255,255,.25)" stroke-width="1.5"')+bTc(10,-14,lbl,4.6,'#ddd')+bLeg(0,-6,0,0)+bLeg(10,-6,10,0)+bLeg(20,-6,20,0)}
function to220(lbl){return bR(-6,-56,32,20,'#c4cad0',' rx="1.5"')+bC(10,-46,3.6,'#55595e')+bR(-6,-38,32,28,'#232323',' rx="1"')+bShade(-6,-38,32,28,1)+bTc(10,-21,lbl,5,'#ddd')+bLeg(0,-10,0,0,2.4)+bLeg(10,-10,10,0,2.4)+bLeg(20,-10,20,0,2.4)}
function hdrStrip(x,y,n,vert){let s=bR(x-4.5,y-4.5,vert?9:n*10-1,vert?n*10-1:9,'#1d1d1d',' rx="1"');for(let i=0;i<n;i++){const X=vert?x:x+i*10,Y=vert?y+i*10:y;s+=bR(X-2,Y-2,4,4,'#555')+bR(X-1.2,Y-1.2,2.4,2.4,'#0c0c0c')}return s}
function femaleHdr(pins){return pins.map(([x,y])=>bR(x*10-4.6,y*10-4.6,9.2,9.2,'#1b1b1b')+bR(x*10-2,y*10-2,4,4,'#000')).join('')}
function pbScrew(x,y){return bC(x,y,4.2,'#c9a227',bStk('#7d6414',.8))+bP(`M${x-2.6},${y+1.4}L${x+2.6},${y-1.4}`,'none',' stroke="#6d5510" stroke-width="1.2"')}
function lcdScreen(x,y,w,h,lines,bl,rows=2,cols=16){let s=bR(x-4,y-4,w+8,h+8,'#1b1b1b',' rx="2"')+bR(x,y,w,h,bl?'#a3d86b':'#59732f');const cw=w/cols,ch=h/rows;
 for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){s+=bR(x+k*cw+1,y+r*ch+2,cw-2,ch-4,bl?'rgba(0,40,0,.06)':'rgba(0,0,0,.1)');const t=(lines[r]||'')[k];if(t&&t!==' ')s+=`<text x="${x+k*cw+cw/2}" y="${y+r*ch+ch*.74}" font-size="${ch*.72}" font-family="'IBM Plex Mono',ui-monospace,monospace" text-anchor="middle" fill="#14300d">${esc(t)}</text>`}
 return s}
function npxDot(x,y,v,on,sz=6){const rr=(v>>16)&255,g=(v>>8)&255,b=v&255,lit=on&&v;return bR(x-sz,y-sz,sz*2,sz*2,'#f4f4f0',' rx="1"')+bC(x,y,sz*.62,lit?`rgb(${rr},${g},${b})`:'#e2e2dc',lit?` style="filter:drop-shadow(0 0 ${sz*.9}px rgb(${rr},${g},${b}))"`:bStk('#c8c8c0',.5))}

/* pacote genérico para o que não tem desenho próprio (comando industrial, lógica, bornes) */
function genPkg(c){const T=termsOf(c),n=T.length;if(!n)return{pins:[],sock:1,box:[-30,-30,30,30],art:c=>bR(-30,-30,60,60,'#c9ced4',' rx="6"')+bTc(0,4,c.tag||lab(c),8,'#333')};
 const cy=T.reduce((a,t)=>a+t[1],0)/n,top=[],bot=[];T.forEach((t,i)=>(t[1]<cy-1?top:bot).push(i));const sx=a=>a.sort((i,j)=>T[i][0]-T[j][0]);sx(top);sx(bot);
 const m=Math.max(top.length,bot.length,2),W=m*2+2,H=top.length?7:0,pins=new Array(n);
 top.forEach((i,k)=>pins[i]=[2+k*2+(m-top.length),0]);bot.forEach((i,k)=>pins[i]=[2+k*2+(m-bot.length),top.length?H:0]);
 const y0=top.length?-1:-62,y1=top.length?H*10+1:8,fam=pbFam(c),ty=top.length?24:-49,iy=top.length?48:-26;
 return{pins,sock:1,box:[2,y0-2,W*10+2,y1+2],art:c=>{let s=bR(4,y0,W*10-4,y1-y0,fam.bg,` rx="5"${bStk(fam.bd,1)}`)+bShade(4,y0,W*10-4,y1-y0,5);
  s+=fam.icon?fam.icon(c,W*5+2,iy+10):'';s+=bTc(W*5+2,fam.icon?ty:(y0+y1)/2+2,(c.tag?c.tag+' ':'')+pbShort(c),6.2,fam.fg);
  const on=pbActive(c);s+=bC(12,y0+8,2.6,on?'#38e05a':'#3a4a3a',on?' style="filter:drop-shadow(0 0 2px #38e05a)"':'');
  pins.forEach(([x,y],i)=>{const X=x*10,Y=y*10;s+=pbScrew(X,Y)+bTc(X,Y+(y===0&&top.length?11:-7),tn(c,i).slice(0,5),4.2,fam.fg)});return s}}}
function pbShort(c){const n=(c.nm||D(c).n||'').replace(/\s*\(.*\)/,'');return n.length>18?n.slice(0,17)+'…':n}
function pbActive(c){if(!SIM())return false;if(rt.burnt&&rt.burnt[c.id])return false;const m=rt.res&&rt.res.mot&&rt.res.mot[c.id];return!!(actOf(c)||EN(c.id)||DS(c.id)||(m&&m.st==='run'))}
function pbFam(c){const t=c.type,ink='#232a33';
 if(['coil','relay','sol','tcoil','cyc','imp','fmon','kno','knc','kco','ktno','ktnc'].includes(t))return{bg:'#dfe3e8',bd:'#a9b1ba',fg:ink,icon:(c,x,y)=>bR(x-12,y-14,24,12,pbActive(c)?'#3ccf6b':'#7d8a96',' rx="2"')};
 if(['motor','mot6','dahl','mot1'].includes(t))return{bg:'#7e8a96',bd:'#56606b',fg:'#f2f4f6',icon:(c,x,y)=>`<g transform="translate(${x} ${y-8})">${bC(0,0,11,'#5c6772')}<g class="${pbActive(c)?'pbspin':''}">${bP('M0,-9L3,0L0,9L-3,0Z','#c9d0d6')}${bP('M-9,0L0,3L9,0L0,-3Z','#c9d0d6')}</g></g>`};
 if(t==='lamp'||t==='btnl')return{bg:'#2c3138',bd:'#16191d',fg:'#e8ecf0',icon:(c,x,y)=>{const k=LCOL[c.col]||'#f2b705',on=EN(c.id);return(on?bC(x,y-8,16,k,' opacity=".45" filter="url(#pbBl)"'):'')+bC(x,y-8,10,on?k:pbShadeCol(k,-.45),bStk('#888',1.5))+bC(x-3,y-11,3,'rgba(255,255,255,.5)')}};
 if(['btn','btn2','btnco','sel3','lim','sens'].includes(t))return{bg:'#33383f',bd:'#1c1f23',fg:'#e8ecf0',icon:(c,x,y)=>{const em=c.kind==='emerg',k=em?'#d32f2f':c.nc?'#d32f2f':'#2e9e44',a=pbActive(c);return(em?bC(x,y-8,13,'#f2c40f'):'')+bC(x,y-8,a?8:10,k,bStk(pbShadeCol(k,-.4),1.4))+bC(x-2.5,y-11,2.6,'rgba(255,255,255,.45)')}};
 if(['mp','ftpow','ftnc','ftno'].includes(t))return{bg:'#f1f2f3',bd:'#b8bec5',fg:ink,icon:(c,x,y)=>bR(x-5,y-18,10,16,'#2b2f34',' rx="2"')+bR(x-4,(SIM()&&rt.trip&&rt.trip[c.id])?y-10:y-17,8,7,'#4a5058',' rx="1"')};
 if(['src','supply','psu','rect','xfmr','xfmr3','sock'].includes(t))return{bg:'#3b4048',bd:'#22262b',fg:'#f2d25a',icon:(c,x,y)=>bP(`M${x-4},${y-20}L${x+3},${y-11}H${x-1}L${x+4},${y-2}L${x-5},${y-12}H${x-1}Z`,'#f2c40f')};
 if(['soft','inv','vfdc'].includes(t))return{bg:'#2d333b',bd:'#15181c',fg:'#d7dee6',icon:(c,x,y)=>bR(x-16,y-18,32,13,'#0b1a12',' rx="1.5"')+bTc(x,y-8.5,pbActive(c)?'RUN':'STOP',6.5,pbActive(c)?'#6cf09a':'#4b6b57')};
 if(t==='plc')return{bg:'#c9ced4',bd:'#8a939c',fg:ink,icon:(c,x,y)=>bR(x-24,y-16,48,10,'#1e8a8a',' rx="1.5"')+bTc(x,y-8.6,'CPU',6,'#fff')};
 if(['gate','sr','dff','clk','lin','lout'].includes(t))return{bg:'#263449',bd:'#152033',fg:'#dce6f5',icon:null};
 if(['borne','tstrip','cab1','cab3','bus'].includes(t))return{bg:'#9aa3ad',bd:'#6d757e',fg:'#1b2129',icon:null};
 return{bg:'#d5dae0',bd:'#9aa3ad',fg:ink,icon:null}}

function pbPkg(c){const t=c.type,f=PKGS[t];if(c.type==='plc'&&c.m==='ard')return PKGS.ard(c);if(f){const r=f(c);if(r)return r}return genPkg(c)}
const PK2=(art,box,pins=[[0,0],[1,0]])=>({pins,box,art});
const PKGS={
 res:c=>({pins:[[0,0],[4,0]],box:[-2,-6,42,6],art:c=>{const[a,b,m]=rBands(c.R),hot=SIM()&&rt.hot&&rt.hot[c.id]>0;return bLeg(0,0,9,0)+bLeg(31,0,40,0)+(hot?bR(7,-7,26,14,'#ff7a1a',' rx="6" opacity=".55" filter="url(#pbBl)"'):'')+
  bP('M9,-3.6Q9,-5 11,-5H14Q15,-4 16,-4H24Q25,-4 26,-5H29Q31,-5 31,-3.6V3.6Q31,5 29,5H26Q25,4 24,4H16Q15,4 14,5H11Q9,5 9,3.6Z','#e3c79a',bStk('#b99d6e',.5))+
  bR(12,-5,2.4,10,RBC[a])+bR(16.4,-4,2.4,8,RBC[b])+bR(20.8,-4,2.4,8,multCol(m))+bR(26.4,-5,2.4,10,'#c9a227')+bShade(9,-5,22,10,4)}}),
 diode:c=>({pins:[[0,0],[4,0]],box:[-2,-5,42,5],art:()=>bLeg(0,0,10,0)+bLeg(30,0,40,0)+bR(10,-4,20,8,'#262626',' rx="2"')+bR(25,-4,2.6,8,'#cfd4d9')+bShade(10,-4,20,8,2)+bTc(17,1.6,'4007',3.6,'#bbb')}),
 zener:c=>({pins:[[0,0],[4,0]],box:[-2,-5,42,5],art:()=>bLeg(0,0,12,0)+bLeg(28,0,40,0)+bR(12,-3.6,16,7.2,'#e9853c',' rx="3" opacity=".9"')+bR(24,-3.6,2.4,7.2,'#222')+bShade(12,-3.6,16,7.2,3)}),
 ind:c=>({pins:[[0,0],[4,0]],box:[-2,-6,42,6],art:()=>bLeg(0,0,9,0)+bLeg(31,0,40,0)+bR(9,-5,22,10,'#3f7d4f',' rx="4.5"')+bR(13,-5,2,10,'#c9a227')+bR(17,-5,2,10,'#151515')+bR(21,-5,2,10,'#d11f1f')+bShade(9,-5,22,10,4.5)}),
 cap:c=>c.pol?{pins:[[0,0],[1,0]],box:[-5,-38,15,1],art:c=>bLeg(1,-6,0,0)+bLeg(9,-6,10,0)+bR(-4,-36,18,30,'#1f3f8f',' rx="3"')+bR(9,-36,5,30,'#a9b9df',' rx="1"')+bTc(11.5,-25,'−',6,'#1f3f8f')+bTc(11.5,-14,'−',6,'#1f3f8f')+
  bR(-4,-37,18,3,'#c2c8cf',' rx="1.5"')+bShade(-4,-36,18,30,3)+`<text x="2" y="-20" font-size="4" fill="#dfe6f5" transform="rotate(-90 2 -20)" text-anchor="middle">${esc(fmtE(+c.Cf,'F'))}</text>`}
  :{pins:[[0,0],[1,0]],box:[-6,-24,16,1],art:c=>bLeg(2,-8,0,0)+bLeg(8,-8,10,0)+bP('M5,-23C-6,-23 -6,-7 5,-7C16,-7 16,-23 5,-23Z','#e7a43b',bStk('#b87a1f',.6))+bTc(5,-13.5,capCode(+c.Cf),4.4,'#6a3f0a')},
 led:c=>({pins:[[0,0],[1,0]],box:[-6,-30,16,1],art:c=>{const b=SIM()?ledB(c):0,col=pbLedCol(c);return bLeg(2,-5,2,-3)+bLeg(2,-3,0,0)+bLeg(8,-5,10,0)+domeLED(5,col,b)}}),
 pdiode:c=>({pins:[[0,0],[1,0]],box:[-6,-30,16,1],art:()=>bLeg(2,-5,0,0)+bLeg(8,-5,10,0)+domeLED(5,'#3b2c5a',0,12,'#2a1f42')}),
 ptrans:c=>({pins:[[0,0],[1,0]],box:[-6,-30,16,1],art:()=>bLeg(2,-5,0,0)+bLeg(8,-5,10,0)+domeLED(5,'#cfe2ee',0,12,'#d8e8f2')+bR(3,-18,4,4,'#333')}),
 ledrgb:c=>({pins:pbRow(4),box:[-6,-34,36,1],art:c=>{const v=i=>{if(!pbOnS())return 0;const x=(c.ca?-1:1)*VD(c,i,1)-[1.9,0,2.2,3][i];return Math.max(0,Math.min(1,x/10/.02))},r=v(0),g=v(2),bl=v(3),on=r+g+bl>.02,col=on?`rgb(${Math.round(60+195*r)},${Math.round(60+195*g)},${Math.round(60+195*bl)})`:'#e6ecef';
  return bLeg(0,0,9,-6)+bLeg(10,0,13,-6)+bLeg(20,0,17,-6)+bLeg(30,0,21,-6)+(on?bC(15,-22,18,col,' opacity=".5" filter="url(#pbBl)"'):'')+bP('M6,-7V-24A9,9 0 0 1 24,-24V-7Z',col,' opacity=".9"')+bP('M8,-9V-24A7,7 0 0 1 15,-31','none',' stroke="rgba(255,255,255,.7)" stroke-width="1.6"')+bR(4.5,-8,21,3,on?col:'#d6dde1',' rx="1"')}}),
 ldr:c=>({pins:[[0,0],[1,0]],box:[-6,-26,16,1],art:()=>bLeg(2,-9,0,0)+bLeg(8,-9,10,0)+bC(5,-16,9,'#e8b24b',bStk('#b07d1d',.6))+bP('M0,-19h6v2h-6v2h6v2h-6v2h6','none',' stroke="#8a2416" stroke-width="1"')+bC(5,-16,9,'url(#pbHi)')}),
 tilt:c=>({pins:[[0,0],[1,0]],box:[-3,-34,13,1],art:()=>bLeg(2,-6,0,0)+bLeg(8,-6,10,0)+bR(-2,-33,14,28,'#2b2b2b',' rx="5"')+bShade(-2,-33,14,28,5)}),
 flex:c=>({pins:[[0,0],[1,0]],box:[-4,-92,18,1],art:c=>{const b=(+c.bend||0)/100*16;return bLeg(2,-8,0,0)+bLeg(8,-8,10,0)+bP(`M-1,-8Q${-1+b},-48 ${-1+b*1.4},-90H${11+b*1.4}Q${11+b},-48 11,-8Z`,'#d9c79c',bStk('#a89060',.6))+bP(`M3,-12Q${3+b},-48 ${3+b*1.4},-86`,'none',' stroke="#2b2b2b" stroke-width="1.4" stroke-dasharray="3 2"')}}),
 fsr:c=>({pins:[[0,0],[1,0]],box:[-12,-64,22,1],art:c=>bLeg(2,-6,0,0)+bLeg(8,-6,10,0)+bR(1,-36,8,30,'#c8b98a')+bC(5,-48,15,'#2b2b2b')+bC(5,-48,11,+c.f>0?'#5b6b7a':'#434a52')+bC(5,-48,11,'url(#pbHi)')}),
 piezo:c=>({pins:[[0,0],[3,0]],box:[-2,-34,32,1],art:c=>{const f=piezoF(c);return bLeg(6,-6,0,0)+bLeg(24,-6,30,0)+bC(15,-18,15,'#1f1f1f')+bC(15,-18,13,'#2b2b2b')+bC(15,-18,2.5,'#0a0a0a')+bTc(6,-24,'+',6,'#ccc')+bC(15,-18,15,'url(#pbHi)')+(f?bP('M33,-26a10,10 0 0 1 0,16M37,-30a16,16 0 0 1 0,24','none',' stroke="#3d8bff" stroke-width="1.6" stroke-linecap="round"')+bTc(15,-38,`${Math.round(f)} Hz`,6,'#3d8bff'):'')}}),
 vibm:c=>({pins:[[0,0],[1,0]],box:[-10,-50,20,1],art:c=>{const on=pbOnS()&&Math.abs(VD(c,0,1))>.4*(+c.Vn||3);return bWire('M0,0C0,-12 2,-20 3,-28','#d32f2f',1.6)+bWire('M10,0C10,-12 8,-20 7,-28','#2a2a2a',1.6)+`<g class="${on?'pbvib':''}">${bC(5,-38,12,'#c6ccd2',bStk('#8b939b',.8))}${bC(5,-38,12,'url(#pbHi)')}${bC(5,-38,4,'#9aa2aa')}</g>`}}),
 bat:c=>{const lk=c.look||(+c.V<=3.3&&+c.V>=2.5?'coin':'');
  if(lk==='coin')return{pins:[[0,0],[1,0]],box:[-22,-66,32,1],art:c=>bWire('M0,0C0,-14 -2,-22 -4,-30','#d32f2f',1.6)+bWire('M10,0C10,-14 8,-22 6,-30','#2a2a2a',1.6)+bR(-20,-64,30,34,'#222',' rx="4"')+bC(-5,-47,13,'#c9ced3',bStk('#8b939b',.8))+bC(-5,-47,13,'url(#pbHi)')+bTc(-5,-46,'CR2032',4.4,'#444')+bTc(-5,-40,`${fmtE(+c.V,'V')}`,4.4,'#444')};
  if(lk==='potato'||lk==='lemon'){const pot=lk==='potato';return{pins:[[0,0],[1,0]],box:[-40,-86,50,1],art:c=>bP(pot?'M-34,-50C-40,-74 -10,-86 8,-76C26,-66 22,-40 4,-36C-12,-32 -30,-34 -34,-50Z':'M-36,-58C-36,-76 -12,-84 4,-78C18,-73 24,-64 22,-54C20,-42 6,-36 -10,-37C-26,-38 -36,-46 -36,-58Z',pot?'#c49a5c':'#f4d23a',bStk(pot?'#8f6a35':'#c9a520',1))+
   (pot?bC(-20,-62,2,'#8f6a35')+bC(0,-52,1.6,'#8f6a35'):bC(22,-56,3,'#c9a520'))+bR(-22,-90,4,26,'#d7843a')+bR(-2,-90,4,26,'#a9b0b8')+bWire('M-20,-88C-20,-60 0,-30 0,0','#d32f2f',1.6)+bWire('M0,-88C4,-60 10,-30 10,0','#2a2a2a',1.6)}}
  return{pins:[[0,0],[1,0]],box:[-42,-82,112,1],art:c=>bR(2,-78,42,52,'#d98a4a')+bR(44,-78,66,52,'#2b2b2b',' rx="2"')+bR(2,-78,108,52,'none',bStk('#1e1e1e',.8)+' rx="2"')+
   `<text x="80" y="-52" font-size="19" fill="#fff" text-anchor="middle" transform="rotate(90 80 -52)" font-weight="600">${esc(fmtE(+c.V,'V').replace(' ',''))}</text>`+
   bR(-14,-74,16,14,'#cfcfcf',bStk('#9a9a9a',.6)+' rx="1"')+bR(-14,-44,16,14,'#cfcfcf',bStk('#9a9a9a',.6)+' rx="1"')+bC(8,-67,3.6,'none',bStk('#5a3a1a',.7))+bTc(8,-65.4,'−',5,'#5a3a1a')+bC(8,-37,3.6,'none',bStk('#5a3a1a',.7))+bTc(8,-35.2,'+',5,'#5a3a1a')+
   bR(-22,-80,8,56,'#2b2b2b',' rx="1"')+bWire('M-22,-37C-36,-37 -8,-10 0,0','#d32f2f',1.5)+bWire('M-22,-67C-42,-67 4,-14 10,0','#2a2a2a',1.5)}},
 solar:c=>({pins:[[0,0],[1,0]],box:[-32,-80,42,1],art:c=>{let s=bWire('M0,0C0,-10 -2,-18 -4,-26','#d32f2f',1.6)+bWire('M10,0C10,-10 8,-18 6,-26','#2a2a2a',1.6)+bR(-30,-78,70,50,'#c9ced3',' rx="2"')+bR(-27,-75,64,44,'#1c3c7a');for(let i=1;i<4;i++)s+=bR(-27+i*16,-75,.8,44,'#8aa4d6');for(let j=1;j<3;j++)s+=bR(-27,-75+j*14.6,64,.8,'#8aa4d6');return s+bShade(-27,-75,64,44,1)}}),
 pot:c=>({pins:[[0,0],[2,0],[1,0]],box:[-6,-34,26,1],art:c=>{const a=-135+270*Math.min(100,Math.max(0,+c.pos||0))/100;return bLeg(0,-5,0,0)+bLeg(10,-5,10,0)+bLeg(20,-5,20,0)+bR(-5,-32,30,27,'#2d64b1',' rx="2"')+bShade(-5,-32,30,27,2)+
  bC(10,-18.5,11,'#d9dee3',bStk('#9aa2aa',.8))+`<g transform="rotate(${a} 10 -18.5)">${bR(9,-28,2,9,'#444',' rx="1"')}</g>`+bC(10,-18.5,11,'url(#pbHi)')}}),
 npn:c=>+c.Icmax>=3?{pins:[[1,0],[0,0],[2,0]],box:[-7,-58,28,1],art:c=>to220(+c.beta>=500?'TIP120':'TIP31')}:{pins:[[2,0],[1,0],[0,0]],box:[-6,-32,26,1],art:()=>to92('2N2222')},
 pnp:c=>({pins:[[2,0],[1,0],[0,0]],box:[-6,-32,26,1],art:()=>to92('2N2907')}),
 nmos:c=>({pins:[[1,0],[0,0],[2,0]],box:[-7,-58,28,1],art:()=>to220('IRFZ44N')}),
 pmos:c=>({pins:[[1,0],[0,0],[2,0]],box:[-7,-58,28,1],art:()=>to220('IRF9540')}),
 vreg:c=>({pins:[[0,0],[1,0],[2,0]],box:[-7,-58,28,1],art:c=>to220(+c.V===3.3?'1117':'78'+String(c.V).padStart(2,'0'))}),
 lm35:c=>({pins:[[0,0],[1,0],[2,0]],box:[-6,-32,26,1],art:()=>to92('LM35')}),
 tmp36:c=>({pins:[[0,0],[1,0],[2,0]],box:[-6,-32,26,1],art:()=>to92('TMP36')}),
 irrx:c=>({pins:[[0,0],[1,0],[2,0]],box:[-5,-30,25,1],art:()=>bLeg(0,-6,0,0)+bLeg(10,-6,10,0)+bLeg(20,-6,20,0)+bR(-4,-28,28,22,'#1d1d1d',' rx="2"')+bC(10,-17,7.5,'#2c2c34')+bC(10,-17,7.5,'url(#pbHi)')}),
 slsw:c=>({pins:[[0,0],[1,0],[2,0]],box:[-8,-20,28,1],art:c=>{const a=SIM()&&rt.btn&&rt.btn[c.id];return bLeg(0,-5,0,0)+bLeg(10,-5,10,0)+bLeg(20,-5,20,0)+bR(-7,-19,34,14,'#2b2b2b',' rx="1.5"')+bR(-3,-15,26,6,'#151515',' rx="1"')+bR(a?11:-2,-24,10,12,'#c9ced3',' rx="1.5"')+bShade(a?11:-2,-24,10,12,1.5)}}),
 tact:c=>({pins:[[0,0],[0,3],[2,0],[2,3]],box:[-6,-3,26,33],act:1,art:c=>{const a=SIM()&&actu(c);return bR(-5,-1,30,32,'#3a3a3a',' rx="2"')+bR(-5,-1,30,32,'url(#pbSh)',' rx="2"')+bC(10,15,a?8:9.5,'#151515',bStk('#000',.6))+(a?'':bC(8,12.5,3,'rgba(255,255,255,.18)'))+[[-3,1],[23,1],[-3,29],[23,29]].map(([x,y])=>bC(x,y,1.6,'#9aa2aa')).join('')}}),
 dipsw:c=>{const n=+c.n||4,pins=[...pbRow(n,0),...pbRow(n,3)],x0=-Math.floor(n/2)*20;return{pins,box:[-6,-2,(n-1)*10+6,32],art:c=>{const st=SIM()?(rt.dip&&rt.dip[c.id])||0:+c.sw||0;let s=bR(-5,1,(n-1)*10+10,28,'#c62828',' rx="1.5"')+bShade(-5,1,(n-1)*10+10,28,1.5)+bT(-3,7.5,'ON',4.4,'#fff');
  for(let i=0;i<n;i++){const on=(st>>i)&1;s+=bR(i*10-3,8,6,15,'#f2f2f2',' rx="1"')+`<rect x="${i*10-3}" y="${on?8:15.5}" width="6" height="7.5" fill="#555" rx="1" data-hx="${x0+i*20}" data-hy="0" class="pbhit"/>`+bTc(i*10,27.5,String(i+1),4,'#fff')}return s}}},
 kp4:c=>({pins:rng(8).map(i=>[i-4,11]),box:[-92,-98,72,112],art:c=>{const k=SIM()&&rt.kp&&rt.kp[c.id],K4='123A456B789C*0#D';let s=bR(-46,84,72,26,'#1b1b1b',' rx="2"')+bR(-90,-96,160,182,'#1d1d1d',' rx="8"')+bR(-84,-90,148,170,'#2a2a2a',' rx="5"');
  for(let r=0;r<4;r++)for(let q=0;q<4;q++){const x=-70+q*40,y=-66+r*36,on=k&&k.r===r&&k.c===q,ch=K4[r*4+q],lt=/[A-D]/.test(ch);s+=`<rect x="${x}" y="${y}" width="30" height="28" rx="5" fill="${on?'#9aa2aa':lt?'#c62828':'#e9ecef'}" data-hx="${x+15}" data-hy="${y+14}" class="pbhit"/>`+bTc(x+15,y+19.5,ch,13,lt?'#fff':'#222',' pointer-events="none" font-weight="600"')}
  return s+bR(-45,86,70,4,'#c9a227')}}),
 seg7:c=>({pins:[...pbRow(5,0),...pbRow(5,6)],box:[-6,-2,46,62],art:c=>{const A=pbOnS()&&!rt.burnt[c.id]?rt.A:null,on=i=>A&&(c.ca?-1:1)*(A.vdc(K(c.id,i))-A.vdc(K(c.id,2)))>1.6,col=pbLedCol(c),bits=[3,4,8,6,5,1,0,9].reduce((b,i,k)=>b|(on(i)?1<<k:0),0);
  return bR(-5,2,50,56,'#262626',' rx="1.5"')+bShade(-5,2,50,56,1.5)+pbSeg(10,10,18,38,bits,col,'#3b3b3b')}}),
 gas:c=>({pins:[...pbRow(3,0),...pbRow(3,3)],box:[-12,-6,32,36],art:c=>bC(10,15,21,'#8a5a2b')+bC(10,15,16,'#b8bec4',bStk('#8b939b',.8))+bP('M-2,7L22,23M-2,23L22,7M10,-1V31M-6,15H26','none',' stroke="#8b939b" stroke-width=".7"')+bC(10,15,16,'url(#pbHi)')+(+c.gas>0?bC(10,15,6,'#ff7a1a',' opacity=".6" filter="url(#pbBl)"'):'')}),
 pir:c=>({pins:pbRow(3),box:[-12,-48,32,1],art:c=>{const on=SIM()&&(DEV(c).t||0)>0;return bLeg(0,-6,0,0)+bLeg(10,-6,10,0)+bLeg(20,-6,20,0)+bR(-11,-46,42,40,'#1c6e3a',' rx="2"')+bC(10,-28,16,'#f4f4f0',bStk('#c8c8c0',.8))+bP('M-6,-28H26M10,-44V-12M-1,-40L21,-16M21,-40L-1,-16','none',' stroke="#dcdcd4" stroke-width=".8"')+bC(10,-28,16,'url(#pbHi)')+bC(26,-10,2,on?'#ff3b3b':'#5a1d1d',on?' style="filter:drop-shadow(0 0 2px #ff3b3b)"':'')}}),
 hcsr04:c=>({pins:pbRow(4),box:[-28,-50,58,1],art:c=>{const cyl=x=>bC(x,-28,13,'#c4cad0',bStk('#8b939b',.8))+bC(x,-28,10,'#2d2d2d')+bP(`M${x-8},-28H${x+8}M${x},-36V-20`,'none',' stroke="#555" stroke-width=".7"')+bC(x,-28,13,'url(#pbHi)');
  return bLeg(0,-6,0,0)+bLeg(10,-6,10,0)+bLeg(20,-6,20,0)+bLeg(30,-6,30,0)+bR(-26,-48,82,42,'#1d5fa8',' rx="2"')+cyl(0)+cyl(30)+bR(11,-44,8,6,'#c4cad0',' rx="2"')+bTc(15,-10,`${c.dist} cm`,5,'#fff')}}),
 ping:c=>({pins:pbRow(3),box:[-22,-50,42,1],art:c=>{const cyl=x=>bC(x,-28,11,'#c4cad0',bStk('#8b939b',.8))+bC(x,-28,8,'#2d2d2d')+bC(x,-28,11,'url(#pbHi)');return bLeg(0,-6,0,0)+bLeg(10,-6,10,0)+bLeg(20,-6,20,0)+bR(-20,-48,60,42,'#1e7a3a',' rx="2"')+cyl(-6)+cyl(26)+bTc(10,-10,`${c.dist} cm`,5,'#fff')+bTc(10,-40,'PING)))',4.4,'#fff')}}),
 soil:c=>({pins:pbRow(3),box:[-12,-1,32,112],art:c=>bLeg(0,0,0,6)+bLeg(10,0,10,6)+bLeg(20,0,20,6)+bR(-10,4,40,26,'#1b1b1b',' rx="2"')+bTc(10,20,`${c.hum}%`,6,'#fff')+bP('M-8,30H6V100L-1,108L-8,100ZM14,30H28V100L21,108L14,100Z','#1b1b1b')+bR(-5,36,8,60,'#c9a227')+bR(17,36,8,60,'#c9a227')}),
 servo:c=>({pins:pbRow(3),box:[-38,-108,58,1],art:c=>{const a=SIM()?(DEV(c).ang!=null?DEV(c).ang:90):90;return bWire('M0,-8C0,-30 -2,-44 -4,-58','#7a4a24',1.8)+bWire('M10,-8C10,-30 6,-44 2,-58','#d32f2f',1.8)+bWire('M20,-8C20,-30 14,-44 8,-58','#f07c1a',1.8)+bR(-5,-12,30,10,'#1b1b1b',' rx="1"')+
  bR(-36,-86,70,14,'#1f63c6',' rx="2"')+bR(-22,-100,42,44,'#2a6fd6',' rx="3"')+bShade(-22,-100,42,44,3)+bC(-6,-86,7,'#dfe3e8')+`<g transform="rotate(${90-a} -6 -86)">${bP('M-9,-86L-8,-118Q-6,-121 -4,-118L-3,-86Z','#f4f4f4',bStk('#bbb',.6))}</g>`+bC(-6,-86,3,'#bbb')+bTc(-1,-61,`${Math.round(a)}°`,5.5,'#fff')}}),
 encm:c=>({pins:pbRow(6),box:[-14,-82,114,1],art:c=>{const d=DEV(c),w=SIM()?Math.round(d.rpm||0):0;return bR(-5,-10,60,10,'#1e7a3a',' rx="1"')+rng(6).map(i=>bLeg(i*10,-4,i*10,0)).join('')+bR(-12,-70,64,46,'#f2c014',' rx="3"')+bShade(-12,-70,64,46,3)+bR(52,-62,44,30,'#c4cad0',' rx="4"')+bShade(52,-62,44,30,4)+
  `<g transform="translate(20 -47)"><g class="${Math.abs(w)>1?'pbspin':''}">${bC(0,0,12,'#222')}${bR(-1.5,-12,3,24,'#f2c014')}</g></g>`+bTc(74,-43,`${w} rpm`,6,'#333')}}),
 motdc:c=>{const gear=c.look==='gear';return{pins:[[0,0],[2,0]],box:[-26,-74,72,1],art:c=>{const m=SIM()&&rt.res&&rt.res.mot&&rt.res.mot[c.id],on=!!(m&&m.st==='run'),dir=m&&m.dir==='ccw'?'pbspinr':'pbspin';return bWire('M0,0C0,-12 2,-18 4,-26','#d32f2f',1.6)+bWire('M20,0C20,-12 18,-18 16,-26','#2a2a2a',1.6)+
  (gear?bR(-24,-70,60,40,'#f2c014',' rx="3"')+bShade(-24,-70,60,40,3):bR(-22,-68,52,38,'#c4cad0',' rx="8"')+bShade(-22,-68,52,38,8)+bR(-24,-62,4,26,'#9aa2aa',' rx="1"'))+bR(30,-51,14,4,'#9aa2aa')+`<g transform="translate(48 -49)"><g class="${on?dir:''}">${bC(0,0,11,gear?'#222':'#e9ecef',bStk('#777',.8))}${bR(-1.5,-11,3,22,gear?'#f2c014':'#555')}</g></g>`}}},
 mot1:null,
 neopx:c=>{const sh=c.shape||'px',n=sh==='px'?1:Math.max(1,Math.min(64,+c.n||8)),st=c=>[DEV(c).px||[],!SIM()||PWR(c,0,1,3.5)];
  if(sh==='ring'){const R=Math.max(26,n*3.4);return{pins:pbRow(4),box:[15-R-10,-2*R-24,15+R+10,1],art:c=>{const[col,on]=st(c);let s=rng(4).map(i=>bLeg(i*10,-8,i*10,0)).join('')+bP(`M${15-R-8},${-R-14}a${R+8},${R+8} 0 1 0 ${2*R+16},0a${R+8},${R+8} 0 1 0 ${-2*R-16},0ZM${15-R+8},${-R-14}a${R-8},${R-8} 0 1 1 ${2*R-16},0a${R-8},${R-8} 0 1 1 ${-2*R+16},0Z`,'#1b1b1b',' fill-rule="evenodd"');for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;s+=npxDot(15+Math.cos(a)*R,-R-14+Math.sin(a)*R,col[i]||0,SIM()&&on,Math.min(6,Math.PI*R/n*.7))}return s}}}
  if(sh==='strip'){const W=n*16+14;return{pins:pbRow(4),box:[-8,-36,W,1],art:c=>{const[col,on]=st(c);let s=rng(4).map(i=>bLeg(i*10,-10,i*10,0)).join('')+bR(-6,-34,W,22,'#f4f4f0',' rx="2"')+bR(-6,-34,W,22,'none',bStk('#cfcfc6',.8)+' rx="2"');for(let i=0;i<n;i++)s+=npxDot(6+i*16,-23,col[i]||0,SIM()&&on,6);return s}}}
  return{pins:pbRow(4),box:[-6,-40,36,1],art:c=>{const[col,on]=st(c);return rng(4).map(i=>bLeg(i*10,-8,i*10,0)).join('')+bC(15,-24,17,'#1b1b1b')+npxDot(15,-24,col[0]||0,SIM()&&on,8)}}},
 lcd:c=>({pins:pbRow(16),box:[-32,-150,190,1],art:c=>{const d=DEV(c),pw=!SIM()||PWR(c,1,0,3.5),bl=SIM()&&pw&&rt.ads&&rt.ads[c.id+':bl'],lines=SIM()&&pw&&d.on!==false?(d.lines||['','']):['',''];
  return rng(16).map(i=>bLeg(i*10,-8,i*10,0)).join('')+bR(-30,-148,186,140,'#1f6e3a',' rx="3"')+bShade(-30,-148,186,140,3)+[[-24,-142],[150,-142],[-24,-16],[150,-16]].map(([x,y])=>bC(x,y,3.6,'#c9a227')+bC(x,y,2,'#11441f')).join('')+
   bR(-18,-128,162,90,'#2b2b2b',' rx="2"')+lcdScreen(-10,-118,146,62,lines,bl)+rng(16).map(i=>bTc(i*10,-12,['GND','VCC','V0','RS','RW','E','D0','D1','D2','D3','D4','D5','D6','D7','A','K'][i],3.4,'#dfe6ef')).join('')}}),
 lcdi2c:c=>({pins:pbRow(4),box:[-182,-150,38,1],art:c=>{const d=DEV(c),pw=!SIM()||PWR(c,1,0,3.5),bl=SIM()&&pw&&d.bl!==false,lines=SIM()&&pw&&d.on!==false?(d.lines||['','']):['',''];
  return rng(4).map(i=>bLeg(i*10,-8,i*10,0)).join('')+bR(-6,-30,42,22,'#1b1b1b',' rx="1.5"')+rng(4).map(i=>bTc(i*10,-12,['GND','VCC','SDA','SCL'][i],3.4,'#ddd')).join('')+
   bR(-180,-148,186,120,'#1f6e3a',' rx="3"')+bShade(-180,-148,186,120,3)+bR(-168,-132,162,90,'#2b2b2b',' rx="2"')+lcdScreen(-160,-122,146,62,lines,bl)}}),
 tm1637:c=>({pins:pbRow(4),box:[-26,-60,56,1],art:c=>{const d=DEV(c),pw=!SIM()||PWR(c,2,3,3),lit=SIM()&&pw&&d.seg;let s=rng(4).map(i=>bLeg(i*10,-8,i*10,0)).join('')+bR(-24,-58,78,50,'#1d5fa8',' rx="2"')+bR(-20,-54,70,34,'#1b1b1b',' rx="1"');
  for(let k=0;k<4;k++)s+=pbSeg(-14+k*16,-48,9,22,lit?d.seg[k]||0:0,'#ff3030','#3a2020');s+=bC(15.5,-42,1.3,lit&&d.colon?'#ff3030':'#3a2020')+bC(15.5,-32,1.3,lit&&d.colon?'#ff3030':'#3a2020');
  return s+rng(4).map(i=>bTc(i*10,-11,['CLK','DIO','VCC','GND'][i],3.4,'#fff')).join('')}}),
 usba:c=>({pins:pbRow(4),box:[-8,-46,38,1],art:()=>rng(4).map(i=>bLeg(i*10,-8,i*10,0)).join('')+bR(-6,-14,42,8,'#4a2d6b',' rx="1"')+bR(-4,-44,38,32,'#c4cad0',' rx="1.5"')+bR(1,-38,28,12,'#2b2b2b')+bR(3,-34,24,3,'#c9a227')+bShade(-4,-44,38,32,1.5)}),
 mmeter:c=>({pins:[[0,0],[3,0],[6,0]],sock:1,box:[-18,-156,78,9],art:c=>{const r=SIM()?mmRead(c):'',m=c.m||'V',ang={V:-40,R:0,A:40}[m]||0;return bR(-16,-154,92,162,'#f0b429',' rx="9"')+bR(-10,-148,80,150,'#33363b',' rx="6"')+bR(-4,-142,68,30,'#b9d3a8',' rx="2"')+
  `<text x="60" y="-121" font-size="13" font-family="'IBM Plex Mono',monospace" text-anchor="end" fill="#1d2a15">${esc(r||'0.000')}</text>`+bC(30,-76,20,'#1d1d1d')+`<g transform="rotate(${ang} 30 -76)">${bR(28,-96,4,16,'#e9ecef',' rx="1.5"')}</g>`+bTc(10,-100,'V',6,'#fff')+bTc(30,-104,'Ω',6,'#fff')+bTc(50,-100,'A',6,'#fff')+
  [[0,'#111','COM'],[30,'#c62828','VΩ'],[60,'#c62828','A']].map(([x,k,t])=>bC(x,0,5.5,k,bStk('#999',1.2))+bC(x,0,2,'#000')+bTc(x,-10,t,5,'#fff')).join('')}}),
 psub:c=>({pins:[[0,0],[3,0]],sock:1,box:[-32,-104,62,9],art:c=>{const o=SIM()&&rt.A&&rt.A.m[c.id],d=DEV(c);return bR(-30,-102,90,110,'#d5dae0',' rx="5"')+bShade(-30,-102,90,110,5)+bR(-24,-96,78,20,'#0d1b14',' rx="2"')+bR(-24,-72,78,20,'#0d1b14',' rx="2"')+
  `<text x="50" y="-81" font-size="11" font-family="'IBM Plex Mono',monospace" text-anchor="end" fill="#7cf2a0">${esc(o?fmtE(Math.abs(VD(c,0,1)),'V'):fmtE(+c.V,'V'))}</text><text x="50" y="-57" font-size="11" font-family="'IBM Plex Mono',monospace" text-anchor="end" fill="${d.cc?'#ff8a3d':'#7cf2a0'}">${esc(o?fmtE(o.i,'A'):fmtE(+c.Ilim,'A'))}</text>`+
  bC(-8,-32,9,'#333')+bC(32,-32,9,'#333')+bC(0,0,5.5,'#c62828',bStk('#999',1.2))+bC(30,0,5.5,'#111',bStk('#999',1.2))+bTc(0,-10,'+',7,'#333')+bTc(30,-10,'−',7,'#333')}}),
 fgen:c=>({pins:[[0,0],[3,0]],sock:1,box:[-34,-104,64,9],art:c=>{const w=c.w||'sq',wave={sin:'M-20,-82q6,-12 12,0t12,0t12,0t12,0t12,0',sq:'M-20,-82v-8h12v16h12v-16h12v16h12v-8',tri:'M-20,-82l6,-8l12,16l12,-16l12,16l6,-8',saw:'M-20,-74l12,-16v16l12,-16v16l12,-16v16l12,-16v16'}[w];
  return bR(-32,-102,94,110,'#2d333b',' rx="5"')+bR(-26,-96,82,40,'#0b1a12',' rx="2"')+bP(wave,'none',' stroke="#6cf09a" stroke-width="1.6"')+bTc(15,-61,`${fmtE(+c.f,'Hz')} · ${fmtE(+c.Vpp,'V')}pp`,6,'#6cf09a')+bC(-10,-34,8,'#555')+bC(14,-34,8,'#555')+bC(38,-34,8,'#555')+
  bC(0,0,5.5,'#c62828',bStk('#999',1.2))+bC(30,0,5.5,'#111',bStk('#999',1.2))+bTc(0,-10,'+',7,'#ddd')+bTc(30,-10,'COM',5,'#ddd')}}),
 scope:c=>({pins:[[0,0],[2,0],[5,0],[7,0]],sock:1,box:[-22,-124,94,9],art:c=>{const v1=pbOnS()?VD(c,0,1):0,v2=pbOnS()?VD(c,2,3):0;let s=bR(-20,-122,110,130,'#3b3f45',' rx="5"')+bR(-14,-116,98,70,'#0b1a12',' rx="2"');for(let i=1;i<6;i++)s+=bR(-14+i*16.3,-116,.5,70,'#1f3a2a');for(let j=1;j<4;j++)s+=bR(-14,-116+j*17.5,98,.5,'#1f3a2a');
  const hs=[0,1].map(ch=>SIM()&&rt.wv&&rt.wv[c.id+':'+ch]),t1=SIM()?rt.simT:0,t0=t1-(+S.sp||1)*(typeof simK==='function'&&simK()>1?4:20);let mx=-Infinity,mn=Infinity;hs.forEach(h=>h&&h.forEach(([t,v])=>{if(t>=t0){mx=Math.max(mx,v);mn=Math.min(mn,v)}}));
  if(!(mx>mn)){mx=(isFinite(mx)?mx:0)+1;mn=(isFinite(mn)?mn:0)-1}const pad=(mx-mn)*.1;mx+=pad;mn-=pad;const tr2=(h,col)=>{if(!h||h.length<2)return'';const q=h.filter(([t])=>t>=t0);if(q.length<2)return'';const tt=Math.max(1e-9,t1-Math.max(t0,q[0][0]));return`<polyline fill="none" stroke="${col}" stroke-width="1.3" stroke-linejoin="round" points="${q.map(([t,v])=>`${(-14+98*(t-Math.max(t0,q[0][0]))/tt).toFixed(1)},${(-48-66*(v-mn)/(mx-mn)).toFixed(1)}`).join(' ')}"/>`};
  const tw=tr2(hs[0],'#f2d13a')+tr2(hs[1],'#46c3ff');
  return s+bT(-10,-106,`CH1 ${fmtE(v1,'V')}`,6,'#f2d13a')+bT(-10,-96,`CH2 ${fmtE(v2,'V')}`,6,'#46c3ff')+(tw||bR(-14,-81-Math.max(-30,Math.min(30,v1*3)),98,1.2,'#f2d13a')+bR(-14,-81-Math.max(-30,Math.min(30,v2*3)),98,1.2,'#46c3ff'))+
   [[0,'#f2d13a','1+'],[20,'#222','1−'],[50,'#46c3ff','2+'],[70,'#222','2−']].map(([x,k,t])=>bC(x,0,5,k,bStk('#999',1.2))+bTc(x,-10,t,5,'#ddd')).join('')}}),
 vm:c=>({pins:[[0,0],[3,0]],sock:1,box:[-14,-64,44,9],art:c=>bR(-12,-62,54,70,'#33363b',' rx="5"')+bR(-7,-56,44,20,'#b9d3a8',' rx="2"')+`<text x="35" y="-41" font-size="9" font-family="'IBM Plex Mono',monospace" text-anchor="end" fill="#1d2a15">${esc(pbOnS()?fmtE(VD(c,0,1),'V'):'V')}</text>`+bC(0,0,5,'#c62828',bStk('#999',1.2))+bC(30,0,5,'#111',bStk('#999',1.2))+bTc(15,-20,'V',12,'#ddd')}),
 am:c=>({pins:[[0,0],[3,0]],sock:1,box:[-14,-64,44,9],art:c=>{const o=AM(c.id);return bR(-12,-62,54,70,'#33363b',' rx="5"')+bR(-7,-56,44,20,'#b9d3a8',' rx="2"')+`<text x="35" y="-41" font-size="9" font-family="'IBM Plex Mono',monospace" text-anchor="end" fill="#1d2a15">${esc(o?fmtE(o.i,'A'):'A')}</text>`+bC(0,0,5,'#c62828',bStk('#999',1.2))+bC(30,0,5,'#111',bStk('#999',1.2))+bTc(15,-20,'A',12,'#ddd')}}),
 rly1:c=>({pins:[[0,0],[0,3],[2,0],[4,0],[4,3]],box:[-7,-3,47,33],art:c=>{const on=pbActive(c);return bR(-6,-2,52,34,'#1e56b0',' rx="2"')+bShade(-6,-2,52,34,2)+bTc(20,13,'RELAY',6,'#fff',' font-weight="700"')+bTc(20,22,'SRD-05VDC',4,'#dfe6f5')+bC(41,4,2,on?'#ff3b3b':'#5a1d1d')}}),
 rly2:c=>({pins:[[0,0],[0,3],[1,0],[2,0],[3,0],[1,3],[2,3],[3,3]],box:[-7,-3,37,33],art:c=>{const on=pbActive(c);return bR(-6,-2,42,34,'#1e56b0',' rx="2"')+bShade(-6,-2,42,34,2)+bTc(15,13,'DPDT',6,'#fff',' font-weight="700"')+bTc(15,22,'5 V',4.4,'#dfe6f5')+bC(31,4,2,on?'#ff3b3b':'#5a1d1d')}}),
 hdr8:c=>({pins:[...pbRow(8,0),...pbRow(8,1)],box:[-6,-6,76,16],art:()=>hdrStrip(0,0,8)+hdrStrip(0,10,8)}),
 ic:c=>{const n=termsOf(c).length,h=n/2;return{pins:dipPins(n),box:[-6,-2,(h-1)*10+6,32],art:c=>pbDip(h,c.k||'IC')}},
 opamp:c=>({pins:[[1,3],[2,3],[2,0],[1,0],[3,3]],dum:[[0,3],[3,0],[0,0]],box:[-6,-2,36,32],art:()=>pbDip(4,'LM741')}),
 mbit:c=>({pins:[[2,16],[6,16],[10,16],[14,16],[18,16]],sock:1,box:[-2,-8,202,180],art:c=>{const d=DEV(c),m=SIM()?d.mx||[]:[],ba=SIM()&&d.ba,bb=SIM()&&d.bb,R='#e5173f';
  let s=bR(90,-7,20,10,'#cfcfcf',bStk('#a5a5a5',.6)+' rx="1.5"')+bR(0,0,200,178,'#1c1c1c',' rx="10"')+bP('M0,10Q0,0 10,0H40L0,38Z',R)+bP('M46,0H62L46,15Z',R)+bP('M67,0H79L67,11Z',R);
  s+=bR(84,22,32,17,'none',` rx="8.5" stroke="${R}" stroke-width="3"`)+bC(93,30.5,2.6,R)+bC(107,30.5,2.6,R);
  for(let y=0;y<5;y++)for(let x=0;x<5;x++){const on=m[y*5+x];s+=bR(64.5+x*17,52+y*17,3.6,9,on?'#ff2424':'#c4c4c4',on?' rx="1" style="filter:drop-shadow(0 0 3px #ff2424)"':' rx="1"')}
  const btn=(x,on,t,hx)=>`<g data-hx="${hx}" data-hy="-14" class="pbhit">${bR(x-12,88,24,24,'#cfcfcf',bStk('#9e9e9e',.6)+' rx="2"')}${bC(x,100,7,on?'#555':'#151515')}${[[-9,91],[9,91],[-9,109],[9,109]].map(([a,b])=>bC(x+a,b,1.3,'#8a8a8a')).join('')}</g>`+bP(`M${x-4},${t?82:122}l5,-6v6z`,R);
  s+=btn(28,ba,1,-66)+btn(172,bb,0,66)+bT(25,81,'A',5,'#fff')+bT(174,121,'B',5,'#fff');
  s+=bR(0,148,200,30,'#e8c35e',' rx="0"')+bP('M0,148H200V168Q200,178 190,178H10Q0,178 0,168Z','#e8c35e');for(let i=0;i<34;i++)s+=bR(4+i*5.7,164,1.2,14,'#c9a23c');
  [[2,'0'],[6,'1'],[10,'2'],[14,'3V'],[18,'GND']].forEach(([x,t])=>{const X=x*10;s+=bP(`M${X-11},178V160A11,11 0 0 1 ${X+11},160V178Z`,'#f2d277',bStk('#c9a23c',.6))+bC(X,160,5.5,'#ffffff',bStk('#c9a23c',.6))+bTc(X,175,t,6,'#1c1c1c',' font-weight="700"')});return s}}),
 irremote:c=>({pins:[],box:[-48,-100,48,100],art:c=>{let s=bR(-46,-98,92,196,'#1d1d1d',' rx="14"')+bC(0,-90,3,'#5a1d1d');IRKEYS.forEach((k,i)=>{const r=Math.floor(i/3),q=i%3,x=-36+q*26,y=-80+r*24,on=SIM()&&rt.ir&&rt.ir.k===i&&rt.simT-rt.ir.t<.3,red=i<3;
  s+=`<rect x="${x}" y="${y}" width="20" height="18" rx="6" fill="${on?'#9aa2aa':red?'#c62828':'#3a3a3a'}" data-hx="${x+10}" data-hy="${y+9}" class="pbhit"/>`+bTc(x+10,y+12,k[0],6,'#fff',' pointer-events="none"')});return s}}),
 src:c=>{const v=String(c.v||''),k=v==='+'?'#d32f2f':v==='0'||v==='-'||v==='−'||v==='N'?'#2a2a2a':v==='PE'?'#2f9e44':'#e8742a',t=v==='+'?`+${c.V!=null?fmtE(+c.V,'V'):'24 V'}`:v==='0'||v==='-'||v==='−'?'0 V (GND)':v==='PE'?'Terra':v||'?';return{pins:[[0,0]],sock:1,box:[-2,-18,t.length*4.6+20,3],art:()=>bLeg(0,0,6,-10,1.4,'#5d636b')+bP(`M6,-10L11,-16H${t.length*4.6+18}V-4H11Z`,k)+bT(13,-7.6,t,7,'#fff',' font-weight="700"')}},
 junction:c=>({pins:[[0,0]],sock:1,box:[-4,-4,4,4],art:()=>bC(0,0,2.6,'#8d939b',bStk('#5d636b',.8))}),
 netl:c=>({pins:[[0,0]],sock:1,box:[-2,-16,40,2],art:c=>bP('M0,0V-12H6L10,-16H36V-6H10L6,-12','none',' stroke="#5d636b" stroke-width="1"')+bP('M10,-16H36V-6H10L6,-11Z','#fff3c4',bStk('#b89a2a',.8))+bT(12,-8.6,c.net||c.tag||'rede',6,'#5a4a10')}),
 xref:c=>({pins:[[0,0]],sock:1,box:[-2,-16,40,2],art:c=>bP('M10,-16H36V-6H10L6,-11Z','#dbe9ff',bStk('#5d84c4',.8))+bLeg(0,0,6,-11,1,'#5d636b')+bT(12,-8.6,c.tag||'ligação',6,'#1f3f7a')}),
};
PKGS.mot1=c=>PKGS.motdc(c);
PKGS.ard=c=>{const D2=[25,24,23,22,21,20,18,17,16,15,14,13],pins=[[15,20],[16,20],...D2.map(x=>[x,1]),...rng(6).map(i=>[20+i,20])],dum=[[9,1],[10,1],[11,1],[12,1],[26,1],[27,1],[11,20],[12,20],[13,20],[14,20],[17,20],[18,20]];
 return{pins,dum,sock:1,box:[-20,-2,282,212],art:c=>{const run=SIM()&&!rt.burnt[c.id],d13=pbOnS()&&VD(c,13,1)>2.5,B='#2c6ea6',W='#fff';
  let s=bP('M4,0H266L272,6V98L280,106V194L272,202V206Q272,210 268,210H4Q0,210 0,206V4Q0,0 4,0Z',B,bStk('#1e5585',1));
  s+=[[62,9],[266,74],[266,194],[58,201]].map(([x,y])=>bC(x,y,5.2,'#fff',bStk('#c9c9c9',.8))).join('');
  s+=bR(-18,46,52,42,'#c9c9c9',bStk('#9e9e9e',.8)+' rx="1"')+bR(-14,52,30,30,'#dcdcdc')+bR(-14,158,50,38,'#1e1e1e',' rx="2"')+bR(-14,164,10,26,'#2e2e2e');
  s+=bR(12,4,20,20,'#d9d9d9',bStk('#a9a9a9',.6)+' rx="2"')+bC(22,14,5.6,'#b4533a');
  s+=[[82,184],[104,184]].map(([x,y])=>bC(x,y,10,'#cfcfcf',bStk('#9e9e9e',.8))+bP(`M${x-10},${y}A10,10 0 0 0 ${x+10},${y}Z`,'#e9e9e9')).join('');
  s+=bR(62,114,44,13,'#d9d9d9',bStk('#ababab',.6)+' rx="6.5"')+bTc(84,123,'16.000',5.2,'#9a9a9a')+bR(26,126,14,18,'#1e1e1e',' rx="1"')+bR(80,62,16,16,'#1e1e1e',' rx="1"')+bR(150,156,8,8,'#1e1e1e')+bR(244,138,8,6,'#1e1e1e');
  s+=hdrStrip(90,10,10)+hdrStrip(200,10,8)+hdrStrip(110,200,8)+hdrStrip(200,200,6);
  s+=bR(126,124,144,24,'#1e1e1e',' rx="1.5"')+bP('M126,131a5,5 0 0 1 0,10','#2c6ea6')+bC(136,136,2.6,'#e0e0e0')+bC(260,136,2.6,'#e0e0e0');rng(14).forEach(i=>{s+=bR(130+i*10.2,120,4,4,'#b5b5b5')+bR(130+i*10.2,148,4,4,'#b5b5b5')});
  s+=bC(160,90,13,'none',bStk(W,2.4))+bT(160,95.5,'∞',17,W,' text-anchor="middle" font-weight="700"')+bTc(160,116,'ARDUINO',9.4,W,' font-weight="700" letter-spacing=".4"')+bR(182,78,46,24,'none',bStk(W,1.6)+' rx="12"')+bTc(205,96,'UNO',15,W,' font-weight="500"');
  const led=(x,y,on,k,t)=>bR(x,y,10,4.6,on?k:'#e6e6e6',on?` style="filter:drop-shadow(0 0 3px ${k})"`:'')+bT(x-2.5,y+4.4,t,5.2,W,' text-anchor="end"');
  s+=led(56,62,d13,'#ff9f1a','L')+led(56,80,run&&pbTxRx(c),'#ffcf3a','TX')+led(56,88,false,'#ffcf3a','RX')+led(236,92,run,'#3cff5a','')+bT(249,96.4,'ON',5.6,W);
  const tl={9:'SCL',10:'SDA',11:'AREF',12:'GND',13:'13',14:'12',15:'~11',16:'~10',17:'~9',18:'8',20:'7',21:'~6',22:'~5',23:'4',24:'~3',25:'2',26:'TX▸1',27:'RX◂0'},bl={12:'IOREF',13:'RESET',14:'3.3V',15:'5V',16:'GND',17:'GND',18:'Vin',20:'A0',21:'A1',22:'A2',23:'A3',24:'A4',25:'A5'};
  for(const x in tl)s+=`<text x="${x*10+2}" y="17" font-size="5" fill="#fff" text-anchor="end" transform="rotate(-90 ${x*10+2} 17)">${tl[x]}</text>`;
  for(const x in bl)s+=`<text x="${x*10+2}" y="193" font-size="5" fill="#fff" transform="rotate(-90 ${x*10+2} 193)">${bl[x]}</text>`;
  s+=bR(196,44,80,.8,W)+bT(274,52,'DIGITAL (PWM~)',5.6,W,' text-anchor="end"')+bR(110,166,80,.8,W)+bTc(150,163,'POWER',5.6,W)+bR(196,166,62,.8,W)+bTc(227,163,'ANALOG IN',5.6,W);return s}}};
function pbTxRx(c){const st=rt.mcu&&rt.mcu[c.id];return!!(st&&st.ser&&(rt.simT-(st.serT||0))<.15)}
function pbDip(h,lbl){const W=(h-1)*10+10;let s='';for(let i=0;i<h;i++){s+=bR(i*10-1.8,0,3.6,7,'#a8afb7',' rx=".8"')+bR(i*10-1.8,23,3.6,7,'#a8afb7',' rx=".8"')}
 return s+bR(-5,5,W,20,'#232323',' rx="1.5"')+bShade(-5,5,W,20,1.5)+bP('M-5,11a4,4 0 0 1 0,8','#111')+bC(-1,21,1.4,'#555')+bTc(W/2-5,17.4,lbl,Math.min(6,W/lbl.length*1.6),'#d5d9de',' font-weight="600"')}
function capCode(F){const pF=F*1e12;if(!(pF>=1))return'';let e=0,v=pF;while(v>=100){v/=10;e++}return String(Math.round(v)).padStart(2,'0')+(e?e:'')}

/* ---------- geometria: furos da protoboard e terminais na bancada ---------- */
function bdGeo(bd){const k=PBK[bd.k]||PBK.full,n=k.n;if(k.rails)return{n,w:n+4,h:20,rows:[4,5,6,7,8,11,12,13,14,15],rails:[1,2,17,18],mid:9.5};return{n,w:n+4,h:15,rows:[2,3,4,5,6,9,10,11,12,13],rails:[],mid:7.5}}
function bdHoles(bd){const g=bdGeo(bd),o=[];for(let c=0;c<g.n;c++){const hx=c+2;g.rows.forEach((hy,ri)=>o.push({hx,hy,net:`${bd.id}:${hx}:${ri<5?'t':'b'}`,col:c+1,row:'abcdefghij'[ri]}))}
 g.rails.forEach((hy,ri)=>{for(let c=1;c<g.n-1;c++){if((c-1)%6===5)continue;o.push({hx:c+2,hy,net:`${bd.id}:r${ri}`,rail:ri})}});return o}
let PBH=null,pbZoomTip=0;
const pbSh=o=>S.sheets?(o&&o.sh)||1:1,pbCurSh=()=>S.sheets?S.cur||1:1,bdOn=bd=>pbSh(bd)===pbCurSh();
function pbHoles(){const m=new Map();for(const bd of(S.pb?S.pb.bds:[]))for(const h of bdHoles(bd)){const x=bd.x+h.hx*PBP,y=bd.y+h.hy*PBP;m.set(pbSh(bd)+'|'+x+','+y,{...h,bd:bd.id,sh:pbSh(bd),x,y})}PBH=m;return m}
const pbRotP=([x,y],r)=>{r=((r%360)+360)%360;return r===90?[-y,x]:r===180?[-x,-y]:r===270?[y,-x]:[x,y]};
const PKC=new Map();
function pkgOf(c){const key=c.type+'|'+(c.m||'')+'|'+(c.k||'')+'|'+(c.pol?1:0)+'|'+(c.shape||'')+'|'+(c.n||'')+'|'+(c.look||'')+'|'+(c.Icmax||'')+'|'+(c.beta||'')+'|'+termsOf(c).length;let p=PKC.get(key);if(!p){p=pbPkg(c);PKC.set(key,p)}return p}
function pbPin(c,i){const p=pkgOf(c),q=p.pins[i];if(!q)return null;const r=pbRotP([q[0]*PBP,q[1]*PBP],c.pbr||0);return{x:(c.pbx||0)+r[0],y:(c.pby||0)+r[1]}}
function pbBox(c){const b=pkgOf(c).box,p=[[b[0],b[1]],[b[2],b[1]],[b[0],b[3]],[b[2],b[3]]].map(q=>pbRotP(q,c.pbr||0));const xs=p.map(q=>q[0]+(c.pbx||0)),ys=p.map(q=>q[1]+(c.pby||0));return[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}
function pbIns(c,i,H){const p=pkgOf(c);if(p.sock)return null;const q=pbPin(c,i);return q?(H||PBH||pbHoles()).get(pbSh(c)+'|'+q.x+','+q.y)||null:null}
function pbEndPos(e){if(e.c){const c=byId(e.c);return c?pbPin(c,e.t):null}const bd=S.pb&&S.pb.bds.find(b=>b.id===e.bd);return bd?{x:bd.x+e.hx*PBP,y:bd.y+e.hy*PBP}:null}

/* ---------- estado inicial e lugar das peças novas ---------- */
function pbInit(){if(!S.pb)S.pb={on:false,bds:[{id:'pb1',k:'full',x:0,y:0,sh:S.cur||1}],w:[],vis:[S.cur||1]};S.pb.vis=S.pb.vis||[];S.pb.bds.forEach(b=>{if(b.sh==null)b.sh=1;if(!S.pb.vis.includes(b.sh))S.pb.vis.push(b.sh)});return S.pb}
function pbSheetBoard(){const sh=S.cur||1;if(S.pb.vis.includes(sh))return false;S.pb.vis.push(sh);if(S.pb.bds.some(b=>(b.sh||1)===sh))return true;let n=1;while(S.pb.bds.some(b=>b.id==='pb'+n))n++;S.pb.bds.push({id:'pb'+n,k:'full',x:0,y:0,sh});return true}
function pbPlaceNew(){if(!S.pb)return false;let ch=false;const vis=S.comps.filter(pbVis),need=vis.filter(c=>!num(c.pbx)||!num(c.pby));if(!need.length)return false;
 const L={},lay=sh=>{if(L[sh])return L[sh];let y0=0,x1=900;for(const bd of S.pb.bds){if(pbSh(bd)!==sh)continue;const g=bdGeo(bd);y0=Math.max(y0,bd.y+g.h*PBP);x1=Math.max(x1,bd.x+g.w*PBP)}
  for(const c of vis)if(pbSh(c)===sh&&num(c.pbx)&&!need.includes(c)){const b=pbBox(c);y0=Math.max(y0,b[3])}return L[sh]={x:0,y:y0+50,rowH:0,x1}};
 let x=0,y=0,rowH=0;const js=[];
 for(const c of need.sort((a,b)=>(a.sh||1)-(b.sh||1)||a.x-b.x||a.y-b.y)){if(c.type==='junction'||c.type==='netl'||c.type==='xref'){js.push(c);continue}const l=lay(pbSh(c));c.pbr=0;c.pbx=0;c.pby=0;const b=pbBox(c),w=b[2]-b[0],h=b[3]-b[1];
  if(l.x>0&&l.x+w>l.x1){l.x=0;l.y+=l.rowH+40;l.rowH=0}x=l.x;y=l.y;rowH=l.rowH;c.pbx=Math.round((x-b[0])/PBP)*PBP;c.pby=Math.round((y-b[1])/PBP)*PBP;l.x=x+w+30;l.rowH=Math.max(rowH,h);ch=true}
 for(const j of js){const ps=[];for(const w of S.wires){const o=w.a.c===j.id?w.b:w.b.c===j.id?w.a:null;if(!o)continue;const c=byId(o.c);if(c&&pbVis(c)&&num(c.pbx)&&c.type!=='junction'){const q=pbPin(c,o.t);if(q)ps.push(q)}}
  if(ps.length){j.pbx=Math.round(ps.reduce((a,q)=>a+q.x,0)/ps.length/PBP)*PBP;j.pby=Math.round(ps.reduce((a,q)=>a+q.y,0)/ps.length/PBP)*PBP-PBP*3}else{const l=lay(pbSh(j));j.pbx=l.x;j.pby=l.y+l.rowH+40;l.x+=50}j.pbr=0;ch=true}
 return ch}

/* ---------- sincronização: ligações físicas → fios do esquema ---------- */
function pbUF(){const p=new Map(),f=k=>{let r=k;while(p.has(r))r=p.get(r);let x=k;while(p.has(x)&&p.get(x)!==r){const n=p.get(x);p.set(x,r);x=n}return r};return{f,u:(a,b)=>{a=f(a);b=f(b);if(a!==b)p.set(a,b)}}}
function pbPhys(){const H=pbHoles(),uf=pbUF(),ins=new Map();
 for(const c of S.comps){if(!pbVis(c)||!num(c.pbx))continue;termsOf(c).forEach((_,i)=>{const h=pbIns(c,i,H);if(h){ins.set(K(c.id,i),h);uf.u(K(c.id,i),'N'+h.net)}})}
 const node=e=>{if(e.c)return K(e.c,e.t);const bd=S.pb.bds.find(b=>b.id===e.bd);if(!bd)return'X';const h=H.get(pbSh(bd)+'|'+(bd.x+e.hx*PBP)+','+(bd.y+e.hy*PBP));return h?'N'+h.net:`H${e.bd}:${e.hx}:${e.hy}`};
 for(const w of S.pb.w)uf.u(node(w.a),node(w.b));return{uf,ins,H,node}}
/* ligações feitas por nome (fonte com o mesmo potencial, rótulo de rede, ligação entre folhas) */
function pbNameJoin(uf){for(const c of S.comps){const k=c.type==='src'?'src:'+c.v+':'+(c.V!=null?c.V:''):c.type==='netl'?'net:'+(c.net||''):c.type==='xref'?'xr:'+(c.tag||''):null;if(k)uf.u(K(c.id,0),'N@'+k)}}
function pbSync(){if(!S.pb)return false;
 S.pb.w=S.pb.w.filter(w=>[w.a,w.b].every(e=>e.c?(byId(e.c)&&e.t<termsOf(byId(e.c)).length):S.pb.bds.some(b=>b.id===e.bd)));
 const ph=pbPhys(),groups=new Map();
 for(const c of S.comps){if(!pbVis(c))continue;termsOf(c).forEach((_,i)=>{const k=K(c.id,i),r=ph.uf.f(k);if(r===k&&!ph.ins.has(k))return;if(!groups.has(r))groups.set(r,[]);groups.get(r).push(k)})}
 const sch=pbUF();for(const w of S.wires)if(!w.pb)sch.u(K(w.a.c,w.a.t),K(w.b.c,w.b.t));pbNameJoin(sch);
 const want=new Map(),spos=k=>{const[id,i]=k.split(':'),c=byId(id);return c?tp(c,+i):{x:0,y:0}};
 for(const g of groups.values()){if(g.length<2)continue;g.sort();const done=[g[0]];for(const k of g.slice(1)){if(sch.f(k)!==sch.f(g[0])){const P=spos(k);let best=done[0],bd=1e18;for(const d of done){const Q=spos(d),dd=(P.x-Q.x)**2+(P.y-Q.y)**2;if(dd<bd){bd=dd;best=d}}const key=[k,best].sort().join('|');want.set(key,[best,k]);sch.u(k,g[0])}done.push(k)}}
 let ch=false;const keep=[];for(const w of S.wires){if(!w.pb){keep.push(w);continue}const key=[K(w.a.c,w.a.t),K(w.b.c,w.b.t)].sort().join('|');if(want.has(key)){want.delete(key);keep.push(w)}else ch=true}
 for(const[a,b]of want.values()){const[ac,at]=a.split(':'),[bc,bt]=b.split(':'),id='w'+(S.seq++);keep.push({id,a:{c:ac,t:+at},b:{c:bc,t:+bt},pb:1});PBNEW.push(id);ch=true}
 S.wires=keep;return ch}

/* ---------- desenho ---------- */
let PBBC={};
function bdSVG(bd){const key=bd.k+bd.x+','+bd.y+'|'+bd.id;if(PBBC[bd.id]&&PBBC[bd.id][0]===key)return PBBC[bd.id][1];const g=bdGeo(bd),W=g.w*PBP,Hh=g.h*PBP;
 let s=`<g class="pbbd" data-bd="${bd.id}" transform="translate(${bd.x} ${bd.y})">`+bR(0,0,W,Hh,'#e4e4e4',` rx="3"${bStk('#c6c6c6',.8)}`);
 s+=bR(0,g.mid*PBP-3.2,W,6.4,'#d3d3d3');
 if(g.rails.length){s+=bR(0,3.2*PBP,W,.6,'#d0d0d0')+bR(0,15.8*PBP,W,.6,'#d0d0d0');const rl=(y,c)=>bR(PBP*2.6,y,(g.n-1.2)*PBP,.9,c);s+=rl(.3*PBP,'#3a3a3a')+rl(2.6*PBP,'#d32f2f')+rl(16.3*PBP,'#3a3a3a')+rl(18.6*PBP,'#d32f2f');
  [[1,'−','#3a3a3a'],[2,'+','#d32f2f'],[17,'−','#3a3a3a'],[18,'+','#d32f2f']].forEach(([y,t,k])=>{s+=bTc(PBP*1.1,y*PBP+2,t,6,k)+bTc(W-PBP*1.1,y*PBP+2,t,6,k)})}
 let d='';for(const h of bdHoles(bd)){const x=h.hx*PBP,y=h.hy*PBP;d+=`M${x-1.45},${y-1.45}h2.9v2.9h-2.9z`}s+=`<path d="${d}" fill="#555"/>`;
 g.rows.forEach((y,ri)=>{const t='abcdefghij'[ri];s+=bTc(PBP*1.1,y*PBP+1.6,t,4.4,'#8a8a8a')+bTc(W-PBP*1.1,y*PBP+1.6,t,4.4,'#8a8a8a')});
 for(let c=1;c<=g.n;c++){const x=(c+1)*PBP+1.3,y1=(g.rows[0]-1)*PBP+1,y2=(g.rows[9]+1)*PBP-1;s+=`<text x="${x}" y="${y1}" font-size="3.6" fill="#8a8a8a" text-anchor="middle" transform="rotate(-90 ${x} ${y1})">${c}</text><text x="${x}" y="${y2}" font-size="3.6" fill="#8a8a8a" text-anchor="middle" transform="rotate(-90 ${x} ${y2})">${c}</text>`}
 s+='</g>';PBBC[bd.id]=[key,s];return s}
function pbWireCol(w,e1,e2){if(w.pbc&&PBW[w.pbc])return PBW[w.pbc][1];if(w.col&&PBWC[w.col])return PBW[PBWC[w.col]][1];const nm=e=>{if(!e||!e.c)return'';const c=byId(e.c);return c?String(tn(c,e.t)).toUpperCase():''};
 const a=nm(e1),b=nm(e2),gnd=/^(GND|−|-|0V|COM|K \(−\)|M|− \(BU\)|−\s*\(CÁTODO\))/,pos=/^(5V|\+5V|VCC|VBUS|3V|3\.3V|\+|V\+|\+VS|L\+|\+ \(BN\)|\+24V)/;
 if(gnd.test(a)||gnd.test(b))return PBW.preto[1];if(pos.test(a)||pos.test(b))return PBW.vermelho[1];return PBW.verde[1]}
function pbOrtho(pts){if(pts.length<2)return pts.slice();const o=[pts[0]],n=pts.length;
 if(n===2){const[a,b]=pts;if(Math.abs(a.x-b.x)<.5||Math.abs(a.y-b.y)<.5)return[a,b];const my=Math.round((a.y+b.y)/2/5)*5;return[a,{x:a.x,y:my},{x:b.x,y:my},b]}
 for(let i=1;i<n;i++){const a=o[o.length-1],b=pts[i];if(Math.abs(a.x-b.x)>=.5&&Math.abs(a.y-b.y)>=.5)o.push(i===1?{x:a.x,y:b.y}:{x:b.x,y:a.y});o.push(b)}
 const r=[o[0]];for(let i=1;i<o.length;i++){const a=r[r.length-1],b=o[i];if(Math.abs(a.x-b.x)<.5&&Math.abs(a.y-b.y)<.5)continue;if(r.length>=2){const z=r[r.length-2],mid=(a.x-z.x)*(b.x-a.x)>=0&&(a.y-z.y)*(b.y-a.y)>=0;if(mid&&((Math.abs(z.x-a.x)<.5&&Math.abs(a.x-b.x)<.5)||(Math.abs(z.y-a.y)<.5&&Math.abs(a.y-b.y)<.5))){r[r.length-1]=b;continue}}r.push(b)}return r}
function wPath(pts){const q=pbOrtho(pts);if(q.length<3)return'M'+q.map(p=>p.x+','+p.y).join('L');let d=`M${q[0].x},${q[0].y}`;
 for(let i=1;i<q.length-1;i++){const a=q[i-1],p=q[i],b=q[i+1],l1=Math.hypot(p.x-a.x,p.y-a.y),l2=Math.hypot(b.x-p.x,b.y-p.y),r=Math.min(4,l1/2,l2/2);
  const ux=(p.x-a.x)/(l1||1),uy=(p.y-a.y)/(l1||1),vx=(b.x-p.x)/(l2||1),vy=(b.y-p.y)/(l2||1);d+=`L${(p.x-ux*r).toFixed(1)},${(p.y-uy*r).toFixed(1)}Q${p.x},${p.y} ${(p.x+vx*r).toFixed(1)},${(p.y+vy*r).toFixed(1)}`}
 const z=q[q.length-1];return d+`L${z.x},${z.y}`}
function pbJunctionsDone(ph){const done=new Set(),adj=new Map(),isJ=c=>c&&['junction','netl','xref','src'].includes(c.type);for(const w of S.wires){for(const[x,y]of[[w.a,w.b],[w.b,w.a]]){if(!adj.has(x.c))adj.set(x.c,[]);adj.get(x.c).push(y)}}
 const nk=c=>c.type==='netl'?'n:'+(c.net||''):c.type==='xref'?'x:'+(c.tag||''):c.type==='src'?'s:'+c.v+':'+(c.V!=null?c.V:''):null,byK=new Map();for(const c of S.comps){const k=nk(c);if(k){if(!byK.has(k))byK.set(k,[]);byK.get(k).push(c)}}for(const L of byK.values())for(const c of L)for(const o of L)if(o!==c){if(!adj.has(c.id))adj.set(c.id,[]);adj.get(c.id).push({c:o.id,t:0})}
 for(const c of S.comps){if(!isJ(c)||done.has(c.id))continue;const comp=new Set([c.id]),pins=[],st=[c.id];while(st.length){const id=st.pop();for(const y of adj.get(id)||[]){const o=byId(y.c);if(isJ(o)){if(!comp.has(o.id)){comp.add(o.id);st.push(o.id)}}else pins.push(K(y.c,y.t))}}
  if(pins.length>=2&&pins.every(k=>ph.uf.f(k)===ph.uf.f(pins[0])))comp.forEach(id=>done.add(id))}return done}
function pbVisibleWires(ph){const JD=pbJunctionsDone(ph);const out=[],eOn=e=>e.c?onSheet(byId(e.c)):(()=>{const bd=S.pb.bds.find(b=>b.id===e.bd);return!!bd&&bdOn(bd)})();for(const w of S.wires){if(w.pb)continue;const a=byId(w.a.c),b=byId(w.b.c);if(!pbVis(a)||!pbVis(b)||!onSheet(a)||!onSheet(b))continue;if(JD.has(w.a.c)||JD.has(w.b.c))continue;if(ph.uf.f(K(w.a.c,w.a.t))===ph.uf.f(K(w.b.c,w.b.t)))continue;const p=pbEndPos(w.a),q=pbEndPos(w.b);if(!p||!q)continue;out.push({k:'s',w,id:w.id,pts:[p,...(w.pbp||[]).map(([x,y])=>({x,y})),q],col:pbWireCol(w,w.a,w.b)})}
 for(const w of S.pb.w){if(!eOn(w.a)||!eOn(w.b))continue;const p=pbEndPos(w.a),q=pbEndPos(w.b);if(!p||!q)continue;out.push({k:'p',w,id:w.id,pts:[p,...(w.p||[]).map(([x,y])=>({x,y})),q],col:w.col&&PBW[w.col]?PBW[w.col][1]:pbWireCol({},w.a,w.b)})}return out}
function pbRender(){const sv=document.getElementById('pbv');if(!sv||!pbOn())return;pbInit();const nb=pbSheetBoard();if(pbPlaceNew()||nb){pbSync();save()}
 const ph=pbPhys(),ed=mode==='edit';let hb='',hc='',hw='';
 for(const bd of S.pb.bds.filter(bdOn))hb+=bdSVG(bd)+(pbSelB===bd.id?(()=>{const g=bdGeo(bd);return bR(bd.x-3,bd.y-3,g.w*PBP+6,g.h*PBP+6,'none',' rx="6" stroke="var(--pick)" stroke-width="1.5" stroke-dasharray="5 3" pointer-events="none"')})():'');
 const JD=pbJunctionsDone(ph);for(const c of S.comps){if(!pbVis(c)||!num(c.pbx)||!onSheet(c)||JD.has(c.id))continue;const p=pkgOf(c);let a='';try{a=p.art(c)}catch(e){a=bR(-10,-10,20,20,'#c33')}
  const sel1=SC(c.id),b=p.box,burnt=SIM()&&rt.burnt&&rt.burnt[c.id],hot=SIM()&&rt.hot&&rt.hot[c.id]>0;
  hc+=`<g class="pbpart${sel1?' sel':''}${SIM()&&(actOf(c)||D(c).hitClick)?' act':''}" data-id="${c.id}" transform="translate(${c.pbx} ${c.pby}) rotate(${c.pbr||0})"><title>${esc((c.tag?c.tag+' — ':'')+lab(c).replace(c.tag||'@@','').trim()+(valTxt(c)?' · '+valTxt(c):''))}</title>`+
   `<rect class="pbhitbox" x="${b[0]}" y="${b[1]}" width="${b[2]-b[0]}" height="${b[3]-b[1]}"/>`+a+(burnt?burnFx(b):'')+(hot&&!burnt?bR(b[0],b[1],b[2]-b[0],b[3]-b[1],'none',' rx="4" stroke="#ff7a1a" stroke-width="2" opacity=".7" pointer-events="none"'):'')+
   (sel1?bR(b[0]-3,b[1]-3,b[2]-b[0]+6,b[3]-b[1]+6,'none',' rx="4" stroke="var(--pick)" stroke-width="1.2" stroke-dasharray="4 3" pointer-events="none"'):'')+
   (p.dum||[]).map(([x,y])=>bC(x*PBP,y*PBP,1.2,'#555',' pointer-events="none"')).join('')+
   p.pins.map(([x,y],i)=>`<circle class="pbpin${ph.ins.has(K(c.id,i))?' in':''}" data-c="${c.id}" data-t="${i}" cx="${x*PBP}" cy="${y*PBP}" r="4.6"><title>${esc((c.tag||lab(c))+' · '+tn(c,i))}</title></circle>`).join('')+'</g>';
  if(c.tag&&!['junction','netl','xref'].includes(c.type)){const bb=pbBox(c);hc+=`<text class="pbtag" x="${bb[0]}" y="${bb[1]-3}">${esc(c.tag)}</text>`}}
 for(const v of pbVisibleWires(ph)){const s=pbSelW&&pbSelW.id===v.id,d=wPath(v.pts,v.k==='s'&&v.pts.length===2);hw+=`<g class="pbw${s?' sel':''}" data-w="${v.id}" data-k="${v.k}">${s?`<path d="${d}" stroke="var(--pick)" stroke-width="6" opacity=".45" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`:''}${bWire(d,v.col,2.6)}<path class="pbwhit" d="${d}"/>`+
  bC(v.pts[0].x,v.pts[0].y,2.2,'#c4cad0',bStk('#6b7178',.6))+bC(v.pts[v.pts.length-1].x,v.pts[v.pts.length-1].y,2.2,'#c4cad0',bStk('#6b7178',.6))+(s&&ed?v.pts.slice(1,-1).map((p,i)=>`<circle class="pbbend" data-i="${i}" cx="${p.x}" cy="${p.y}" r="3.6"/>`).join('')+[['a',v.pts[0]],['b',v.pts[v.pts.length-1]]].map(([k,p])=>`<circle class="pbendh" data-e="${k}" cx="${p.x}" cy="${p.y}" r="${Math.max(4.4,8/pbV.s)}"><title>${tr('Arraste para mudar a ponta do fio')}</title></circle>`).join(''):'')+'</g>'}
 hw+=pbDefects(ph);for(const c of S.comps)if((c.type==='mmeter'||c.type==='scope')&&num(c.pbx)&&onSheet(c))hw+=prSVG(c);
 document.getElementById('pbB').innerHTML=hb;document.getElementById('pbC').innerHTML=hc;document.getElementById('pbJ').innerHTML=hw;pbOverlay();pbBar();updHint()}
function pbOverlay(){const el=document.getElementById('pbO');if(!el)return;let h='';
 if(pbDrag&&pbDrag.t==='box'){const d=pbDrag;h+=bR(Math.min(d.x0,d.x1),Math.min(d.y0,d.y1),Math.abs(d.x1-d.x0),Math.abs(d.y1-d.y0),'rgba(22,104,201,.08)',` stroke="var(--pick)" stroke-width="${1/pbV.s}" stroke-dasharray="${4/pbV.s} ${3/pbV.s}"`)}
 if(pbDrag&&pbDrag.t==='end'&&pbDrag.moved){const v=pbDrag.v,o=pbDrag.which==='a'?v.pts[v.pts.length-1]:v.pts[0],q=pbHover&&pbHover.k==='e'?pbHover:pbPtr;h+=bWire(`M${o.x},${o.y}L${q.x},${q.y}`,v.col,2).replace(/<path /g,'<path opacity=".75" ')+bC(q.x,q.y,3.4,'none',' stroke="var(--pick)" stroke-width="1.4"')}
 if(mode==='edit'&&pbHover&&pbHover.net&&!pbDrag){for(const v of(PBH||pbHoles()).values())if(v.net===pbHover.net)h+=bR(v.x-2.6,v.y-2.6,5.2,5.2,'none',' stroke="#2fbf4a" stroke-width="1.4" rx="1"');h+=bR(pbHover.x-3.4,pbHover.y-3.4,6.8,6.8,'rgba(47,191,74,.35)',' stroke="#1f9e38" stroke-width="1.2" rx="1.5"')}
 if(mode==='edit'&&pbHover&&pbHover.pin){h+=bC(pbHover.x,pbHover.y,4.6,'rgba(22,104,201,.25)',' stroke="var(--pick)" stroke-width="1.4"')}
 if(pbHover&&pbHover.tip&&!pbDrag){const t=pbHover.tip,w=t.length*4.2+10;h+=`<g transform="translate(${pbHover.x+8} ${pbHover.y-16})" pointer-events="none">${bR(0,0,w,13,'rgba(20,28,40,.88)',' rx="3"')}${bT(5,9.2,t,7.2,'#fff')}</g>`}
 if(mode==='edit'&&pbTool&&pbTool.from){const p=pbEndPos(pbTool.from);if(p){const pts=[p,...pbTool.pts.map(([x,y])=>({x,y})),pbTool.snap||pbPtr];h+=bWire(wPath(pts),PBW[pbCol][1],2.6).replace(/<path /g,'<path opacity=".8" ')+bC(p.x,p.y,3.4,'none',' stroke="var(--pick)" stroke-width="1.4"')}}
 if(mode==='edit'&&tool&&tool.key&&tool.proto&&pbVis(tool.proto)){const c={...tool.proto,id:'_g',pbx:Math.round(pbPtr.x/PBP)*PBP,pby:Math.round(pbPtr.y/PBP)*PBP,pbr:tool.pbr||0};try{h+=`<g opacity=".7" pointer-events="none" transform="translate(${c.pbx} ${c.pby}) rotate(${c.pbr})">${pkgOf(c).art(c)}</g>`}catch(e){}}
 if(pbDrag&&pbDrag.t==='part'&&pbDrag.moved){const H=PBH||pbHoles();for(const id of pbDrag.ids){const c=byId(id);if(!c)continue;termsOf(c).forEach((_,i)=>{const hh=pbIns(c,i,H);if(hh)h+=bR(hh.x-2.8,hh.y-2.8,5.6,5.6,'none',' stroke="#2fbf4a" stroke-width="1.4" rx="1"')})}}
 el.innerHTML=h}
function pbApplyView(){const w=document.getElementById('pbW');if(w)w.setAttribute('transform',`translate(${pbV.x} ${pbV.y}) scale(${pbV.s})`);const g=document.getElementById('pbGp');if(g)g.setAttribute('patternTransform',`translate(${pbV.x} ${pbV.y}) scale(${pbV.s})`)}
function pbFit(){const sv=document.getElementById('pbv');if(!sv)return;const st=sv.getBoundingClientRect();if(!st.width)return;let a=1e9,b=1e9,c=-1e9,d=-1e9;
 for(const bd of S.pb.bds.filter(bdOn)){const g=bdGeo(bd);a=Math.min(a,bd.x);b=Math.min(b,bd.y);c=Math.max(c,bd.x+g.w*PBP);d=Math.max(d,bd.y+g.h*PBP)}
 for(const o of S.comps)if(pbVis(o)&&num(o.pbx)&&onSheet(o)){const q=pbBox(o);a=Math.min(a,q[0]);b=Math.min(b,q[1]-10);c=Math.max(c,q[2]);d=Math.max(d,q[3])}
 if(a>c){pbV={x:40,y:40,s:1.6};return pbApplyView()}const s=Math.min(4,Math.max(.25,Math.min((st.width-60)/(c-a),(st.height-110)/(d-b))));pbV={s,x:(st.width-(c-a)*s)/2-a*s,y:(st.height-(d-b)*s)/2-b*s+20};pbApplyView()}
function pbZoomAt(mx,my,k){const ns=Math.min(6,Math.max(.25,pbV.s*k));pbV.x=mx-(mx-pbV.x)*ns/pbV.s;pbV.y=my-(my-pbV.y)*ns/pbV.s;pbV.s=ns;pbApplyView()}

/* ---------- barra da protoboard ---------- */
function pbBar(){const el=document.getElementById('pbbar');if(!el)return;const ed=mode==='edit',hid=S.comps.filter(c=>!pbVis(c)&&!['note'].includes(c.type)).length;
 const wsel=pbSelW,cur=wsel?(wsel.k==='s'?(S.wires.find(w=>w.id===wsel.id)||{}).pbc:(S.pb.w.find(w=>w.id===wsel.id)||{}).col):pbCol;
 const h=`<div class="pbgrp"><button data-pb="add" ${ed?'':'disabled'} title="Colocar outra protoboard na bancada">＋ Protoboard ▾</button><div class="pbmenu" hidden><button data-pb="full">Protoboard completa (830 furos)</button><button data-pb="half">Meia protoboard (400 furos)</button><button data-pb="mini">Mini protoboard (170 furos)</button></div></div>`+
  `<div class="pbgrp pbcols" role="group" aria-label="Cor do fio">${Object.keys(PBW).map(k=>`<button class="pbsw${(cur||'')===k||(!cur&&k===pbCol&&!wsel)?' on':''}" data-pbc="${k}" title="Fio ${PBW[k][0].toLowerCase()}" aria-label="Fio ${PBW[k][0].toLowerCase()}" style="--c:${PBW[k][1]}" ${ed?'':'disabled'}></button>`).join('')}</div>`+
  `<div class="pbgrp"><button data-pb="auto" ${ed?'':'disabled'} title="Encaixa sozinho as peças da bancada na protoboard e liga com jumpers">⚡ Montar na protoboard</button></div>`+
  `<div class="pbgrp"><button data-pb="rot" ${ed&&sel&&sel.c.size?'':'disabled'} title="Girar a peça selecionada (R)">⟳ Girar</button><button data-pb="del" ${ed&&(sel||pbSelW||pbSelB)?'':'disabled'} title="Apagar o que está selecionado (Del)">Apagar</button></div>`+
  (hid?`<span class="pbnote" title="Diagramas ladder, Grafcet, pneumática e itens virtuais não têm peça física">${hid} item(ns) só no esquema</span>`:'');
 if(el.dataset.h!==h){el.dataset.h=h;el.innerHTML=h}}

/* ---------- pontas de prova do multímetro (medem sem mudar o circuito) ---------- */
const PRB=['a','b'],PRL=c=>c&&c.type==='scope'?['a','b','g']:PRB,PRCOL={a:'#1b1b1b',b:'#d32f2f'},PRSC={a:'#f2c014',b:'#29b6f6',g:'#1b1b1b'};
const prCol=(c,w)=>c.type==='scope'?PRSC[w]:PRCOL[w];
function prParse(s){if(typeof s!=='string')return null;const p=s.split(':');if(p[0]==='p'&&p.length===3)return{c:p[1],t:+p[2]};if(p[0]==='h'&&p.length===4)return{bd:p[1],hx:+p[2],hy:+p[3]};if(p[0]==='f'&&p.length===3)return{px:+p[1],py:+p[2]};return null}
const prStr=e=>e.c?`p:${e.c}:${e.t}`:e.bd?`h:${e.bd}:${e.hx}:${e.hy}`:`f:${Math.round(e.px)}:${Math.round(e.py)}`;
function prJack(c,w){return pbPin(c,c.type==='scope'?{a:0,b:2,g:1}[w]:w==='a'?0:1)}
function prTip(c,w){const e=prParse(c['pr'+w]);if(e){const q=e.px!=null?{x:e.px,y:e.py}:pbEndPos(e);if(q)return q}const j=prJack(c,w);const dx=c.type==='scope'?{a:-30,b:40,g:5}[w]:w==='a'?-30:30;return{x:j.x+dx,y:j.y+70}}
/* terminal (no circuito) que a ponta toca; guarda o resultado durante a simulação */
function prKey(c,w){const s=c['pr'+w],e=prParse(s);if(!e||e.px!=null)return null;const ck=rt?(rt.prkC||(rt.prkC=new Map())):null,key=c.id+'|'+w+'|'+s;if(ck&&ck.has(key))return ck.get(key);let k=null;
 if(e.c){if(byId(e.c))k=K(e.c,e.t)}else{const ph=pbPhys(),bd=S.pb.bds.find(b=>b.id===e.bd);if(bd){const root=ph.uf.f(ph.node(e));for(const o of S.comps){if(!pbVis(o)||!num(o.pbx)||o.id===c.id)continue;for(let i=0;i<termsOf(o).length;i++)if(ph.uf.f(K(o.id,i))===root){k=K(o.id,i);break}if(k)break}}}
 if(ck)ck.set(key,k);return k}
function prVolt(c,w){if(!pbOnS())return null;const k=prKey(c,w);if(!k)return null;try{return rt.A.vdc(k)}catch(_){return null}}
function prOn(c){return PRB.every(w=>{const e=prParse(c['pr'+w]);return e&&e.px==null})}
function prSVG(c){let h='';for(const w of PRL(c)){const j=prJack(c,w),t=prTip(c,w);if(!j)continue;const col=prCol(c,w),my=Math.max(j.y,t.y)+30;h+=`<path d="M${j.x},${j.y}C${j.x},${my} ${t.x},${my+10} ${t.x},${t.y+18}" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round" pointer-events="none"/>`;
  const ttl=c.type==='scope'?{a:'Ponta do CH1: arraste até um furo ou terminal',b:'Ponta do CH2: arraste até um furo ou terminal',g:'Garra do terra (GND) das pontas: arraste até o GND do circuito'}[w]:w==='a'?'Ponta preta (COM): arraste até um furo ou terminal':'Ponta vermelha (VΩ): arraste até um furo ou terminal';
  h+=w==='g'?`<g class="pbprobe" data-id="${c.id}" data-p="${w}" transform="translate(${t.x} ${t.y})"><title>${tr(ttl)}</title><path d="M-5,18L-5,6L-2,0L2,0L5,6L5,18Z" fill="${col}"/><path d="M-3,1L0,-3L3,1" fill="none" stroke="#c9ced3" stroke-width="1.6"/><circle cx="0" cy="8" r="9" fill="transparent"/></g>`
   :`<g class="pbprobe" data-id="${c.id}" data-p="${w}" transform="translate(${t.x} ${t.y})"><title>${tr(ttl)}</title><rect x="-3.2" y="4" width="6.4" height="16" rx="2" fill="${col}"/><rect x="-4" y="14" width="8" height="3" fill="#888"/><path d="M-1.2,4L0,-1L1.2,4Z" fill="#c9ced3"/><circle cx="0" cy="8" r="9" fill="transparent"/></g>`}return h}
{const mr=mmRead;mmRead=function(c){if(pbOn()&&S.pb&&prOn(c)&&(c.m||'V')==='V'){const a=prVolt(c,'a'),b=prVolt(c,'b');return a==null||b==null?'— — —':fmtE(b-a,'V')}return mr(c)}}
/* ---------- interação ---------- */
function pbWorld(e){const b=document.getElementById('pbv').getBoundingClientRect();return{x:(e.clientX-b.left-pbV.x)/pbV.s,y:(e.clientY-b.top-pbV.y)/pbV.s}}
function pbHoleAt(p,rad=Math.max(4.2,8/pbV.s)){const H=PBH||pbHoles(),x=Math.round(p.x/PBP)*PBP,y=Math.round(p.y/PBP)*PBP,h=H.get(pbCurSh()+'|'+x+','+y);if(!h||Math.hypot(p.x-x,p.y-y)>rad)return null;return h}
function pbPinOnHole(h){for(const c of S.comps){if(!pbVis(c)||!num(c.pbx)||pbSh(c)!==h.sh)continue;const p=pkgOf(c);if(p.sock)continue;for(let i=0;i<p.pins.length;i++){const q=pbPin(c,i);if(q&&q.x===h.x&&q.y===h.y)return{c:c.id,t:i}}}return null}
function pbNearPin(p,px=11){const R=Math.max(4,px/pbV.s);let best=null,bd=R*R;for(const c of S.comps){if(!pbVis(c)||!num(c.pbx)||!onSheet(c))continue;const b=pbBox(c);if(p.x<b[0]-R||p.x>b[2]+R||p.y<b[1]-R||p.y>b[3]+R)continue;const n=pkgOf(c).pins.length;for(let i=0;i<n;i++){const q=pbPin(c,i);if(!q)continue;const d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<bd){bd=d;best={c:c.id,t:i,x:q.x,y:q.y}}}}return best}
function pbOnBody(e){const t=e&&e.target;if(!t||!t.closest)return false;if(t.closest('.pbpin'))return false;const g=t.closest('.pbpart');return!!g&&!t.classList.contains('pbhitbox')}
function pbPinAt(e,p){const t=e.target&&e.target.closest&&e.target.closest('.pbpin');if(t){const c=byId(t.dataset.c),q=c&&pbPin(c,+t.dataset.t);if(q)return{c:c.id,t:+t.dataset.t,x:q.x,y:q.y}}if(!pbOnBody(e))return pbNearPin(p,11);const g=e.target.closest('.pbpart'),c=g&&byId(g.dataset.id),r=pbNearPin(p,c&&pkgOf(c).sock?9:5);return r&&(!c||r.c===c.id||!pkgOf(c).sock)?r:null}
function pbEndAt(e,p){const np=pbNearPin(p);if(np)return{c:np.c,t:np.t};const h=pbHoleAt(p,Math.max(4.2,8/pbV.s));if(!h)return null;const pin=pbPinOnHole(h);if(pin)return pin;const bd=S.pb.bds.find(b=>b.id===h.bd);return{bd:h.bd,hx:(h.x-bd.x)/PBP,hy:(h.y-bd.y)/PBP}}
const sameEnd=(a,b)=>a&&b&&(a.c?a.c===b.c&&a.t===b.t:a.bd===b.bd&&a.hx===b.hx&&a.hy===b.hy);
function pbFinishWire(end){const f=pbTool.from,pts=pbTool.pts;pbTool=null;if(sameEnd(f,end)){pbRender();return}pushHist();
 if(f.c&&end.c){if(S.wires.some(w=>!w.pb&&((w.a.c===f.c&&w.a.t===f.t&&w.b.c===end.c&&w.b.t===end.t)||(w.a.c===end.c&&w.a.t===end.t&&w.b.c===f.c&&w.b.t===f.t)))){toast('Esses dois terminais já estão ligados.');pbRender();return}
  const w={id:'w'+(S.seq++),a:{c:f.c,t:f.t},b:{c:end.c,t:end.t},pbc:pbCol};if(pts.length)w.pbp=pts;S.wires.push(w)}
 else{const w={id:'pw'+(S.seq++),a:f,b:end,col:pbCol};if(pts.length)w.p=pts;S.pb.w.push(w)}commit()}
function pbDelSel(){if(mode!=='edit')return false;if(pbSelW){pushHist();if(pbSelW.k==='s')S.wires=S.wires.filter(w=>w.id!==pbSelW.id);else S.pb.w=S.pb.w.filter(w=>w.id!==pbSelW.id);pbSelW=null;commit();return true}
 if(pbSelB){if(S.pb.bds.length<=0)return true;pushHist();const id=pbSelB;S.pb.bds=S.pb.bds.filter(b=>b.id!==id);S.pb.w=S.pb.w.filter(w=>w.a.bd!==id&&w.b.bd!==id);delete PBBC[id];pbSelB=null;commit();return true}return false}
function pbRot(){if(mode!=='edit'||!sel||!sel.c.size)return;pushHist();sel.c.forEach(id=>{const c=byId(id);if(c&&pbVis(c)){c.pbr=((c.pbr||0)+90)%360}});commit()}
function pbAddBoard(k){pushHist();let y=0,x=0;for(const bd of S.pb.bds.filter(bdOn)){const g=bdGeo(bd);y=Math.max(y,bd.y+g.h*PBP+40)}
 for(const o of S.comps)if(pbVis(o)&&num(o.pbx)&&onSheet(o)){const b=pbBox(o);if(b[1]<y+220&&b[3]>y)y=Math.max(y,b[3]+40)}
 let n=1;while(S.pb.bds.some(b=>b.id==='pb'+n))n++;S.pb.bds.push({id:'pb'+n,k,x,y:Math.round(y/PBP)*PBP,sh:S.cur||1});pbSelB='pb'+n;commit()}
function pbSchemPos(){const VC=S.comps.filter(onSheet);if(!VC.length)return{x:200,y:200};let c=-1e9,b=1e9;VC.forEach(o=>{const w=wbox(o,true);c=Math.max(c,w[2]);b=Math.min(b,w[1])});return{x:snap(c+100),y:snap(Math.max(b,0)+60)}}

function pbSetup(){const stage=document.querySelector('.stage');if(!stage||document.getElementById('pbv'))return;
 const sv=document.createElementNS('http://www.w3.org/2000/svg','svg');sv.id='pbv';sv.setAttribute('aria-label','Protoboard');
 sv.innerHTML=`<defs><pattern id="pbGp" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="none"/><circle cx="5" cy="5" r=".55" fill="var(--pbgrid)"/></pattern>
  <linearGradient id="pbSh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
  <radialGradient id="pbHi" cx=".32" cy=".28" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <filter id="pbBl" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter></defs>
  <rect width="100%" height="100%" fill="var(--pbbg)"/><rect width="100%" height="100%" fill="url(#pbGp)"/><g id="pbW"><g id="pbB"></g><g id="pbC"></g><g id="pbJ"></g><g id="pbO"></g></g>`;
 const cv=document.getElementById('cv');cv.parentNode.insertBefore(sv,cv.nextSibling);
 const bar=document.createElement('div');bar.id='pbbar';stage.appendChild(bar);
 const css=document.createElement('style');css.textContent=`
:root{--pbbg:#e4e9ef;--pbgrid:#c3ccd6}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--pbbg:#1b222b;--pbgrid:#2c3744}}
[data-theme="dark"]{--pbbg:#1b222b;--pbgrid:#2c3744}
#pbv{position:absolute;inset:0;width:100%;height:100%;display:none;touch-action:none;user-select:none;-webkit-user-select:none;font-family:'IBM Plex Sans',system-ui,sans-serif}
body.pbmode #pbv{display:block}body.pbmode #cv{visibility:hidden}
#pbbar{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);width:max-content;display:none;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:calc(100% - 24px);padding:6px 8px;border-radius:12px;background:var(--panel);border:1px solid var(--line);box-shadow:0 4px 18px rgba(0,0,0,.12);z-index:5}
body.pbmode #pbbar{display:flex}
#pbbar .pbgrp{display:flex;gap:3px;align-items:center;position:relative}
#pbbar button{font:inherit;font-size:12.5px;padding:5px 9px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--ink);cursor:pointer;min-height:30px}
#pbbar button:disabled{opacity:.45;cursor:default}
#pbbar .pbsw{width:19px;height:19px;min-height:19px;padding:0;border-radius:50%;background:var(--c);border:2px solid rgba(0,0,0,.18)}
#pbbar .pbsw.on{outline:2px solid var(--pick);outline-offset:2px}
#pbbar .pbmenu{position:absolute;bottom:38px;left:0;display:flex;flex-direction:column;gap:4px;padding:6px;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.18);min-width:220px}
#pbbar .pbmenu[hidden]{display:none}
#pbbar .pbmenu button{text-align:left}
#pbbar .pbnote{font-size:12px;color:var(--muted);padding:0 4px}
#pbv .pbhitbox{fill:transparent;stroke:none}
#pbv .pbpin{fill:transparent;stroke:none;cursor:crosshair}
body:not(.sim) #pbv .pbpin:hover{fill:rgba(22,104,201,.3);stroke:var(--pick);stroke-width:1.2}
#pbv .pbpart{cursor:grab}body.sim #pbv .pbpart{cursor:default}body.sim #pbv .pbpart.act{cursor:pointer}
body.sim #pbv .pbpart.act .pbhit{cursor:pointer}
#pbv .pbtag{font-size:7px;fill:var(--muted);pointer-events:none;font-weight:600}
#pbv .pbwhit{stroke:transparent;stroke-width:9;fill:none;cursor:pointer;stroke-linecap:round}
#pbv .pbbend{fill:#fff;stroke:var(--pick);stroke-width:1.4;cursor:move}
#pbO{pointer-events:none}
#pbv .pbprobe{cursor:grab}
#pbv .pbendh{fill:rgba(22,104,201,.18);stroke:var(--pick);stroke-width:1.4;cursor:grab}
#pbv .pbbd{cursor:move}
#pbv text{user-select:none}
#pbv .pbspin{animation:pbspin .6s linear infinite}#pbv .pbspinr{animation:pbspin .6s linear infinite reverse}
@keyframes pbspin{to{transform:rotate(360deg)}}
#pbv .pbvib{animation:pbvib .08s linear infinite}
@keyframes pbvib{0%{transform:translate(0,0)}25%{transform:translate(.8px,-.6px)}50%{transform:translate(-.7px,.5px)}75%{transform:translate(.5px,.7px)}}
@media (prefers-reduced-motion:reduce){#pbv .pbspin,#pbv .pbspinr,#pbv .pbvib{animation:none}}
#bPb.on{background:var(--pick);color:#fff;border-color:var(--pick)}
@media (max-width:760px){body.pbmode #pbbar{position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));transform:none;width:auto;max-width:none;flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;gap:6px;padding:6px;z-index:40;-webkit-overflow-scrolling:touch}
 body.pbmode #pbbar .pbgrp{flex:0 0 auto}body.pbmode #pbbar .pbnote{display:none}body.pbmode #pbbar .pbmenu{position:fixed;left:8px;bottom:58px}}
.pitem svg.pbico{width:56px;height:46px}`;document.head.appendChild(css);

 /* botão no lugar do antigo Treino */
 const ref=document.getElementById('bDiag');if(ref&&!document.getElementById('bPb')){const b=document.createElement('button');b.id='bPb';b.className='toggle';b.title='Mostrar o circuito montado numa protoboard (e voltar ao esquema)';b.setAttribute('aria-label','Protoboard');b.setAttribute('aria-pressed','false');
  b.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 12h18"/><path d="M7 8.5h.01M10 8.5h.01M13 8.5h.01M16 8.5h.01M7 15.5h.01M10 15.5h.01M13 15.5h.01M16 15.5h.01"/></svg><span class="lbl2">Protoboard</span>';
  b.addEventListener('click',pbToggle);ref.parentNode.insertBefore(b,ref)}

 document.getElementById('palette').addEventListener('click',e=>{const t=e.target.closest('.pbbdi');if(!t||mode==='sim')return;e.stopImmediatePropagation();pbAddBoard(t.dataset.pbk)},true);
 bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const k=b.dataset.pb,menu=bar.querySelector('.pbmenu');
  if(b.dataset.pbc){const col=b.dataset.pbc;if(pbSelW){pushHist();const w=pbSelW.k==='s'?S.wires.find(x=>x.id===pbSelW.id):S.pb.w.find(x=>x.id===pbSelW.id);if(w){if(pbSelW.k==='s')w.pbc=col;else w.col=col}commit()}pbCol=col;try{localStorage.setItem('faisca-pbcol',col)}catch(_){}pbBar();return}
  if(k==='add'){if(menu)menu.hidden=!menu.hidden;return}if(menu)menu.hidden=true;
  if(PBK[k])pbAddBoard(k);else if(k==='auto')pbAutoMount();else if(k==='rot')pbRot();else if(k==='del'){if(!pbDelSel())delSel()}});

 sv.addEventListener('contextmenu',e=>e.preventDefault());
 sv.addEventListener('wheel',e=>{e.preventDefault();const b=sv.getBoundingClientRect();pbZoomAt(e.clientX-b.left,e.clientY-b.top,Math.exp(-e.deltaY*.0015))},{passive:false});
 const TP=new Map();let pinch=null;
 sv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){TP.set(e.pointerId,{x:e.clientX,y:e.clientY});if(TP.size===2){const[a,b]=[...TP.values()],r=sv.getBoundingClientRect();if(pbDrag&&pbDrag.t==='wire')pbTool=null;pbDrag=null;pinch={d0:Math.hypot(a.x-b.x,a.y-b.y)||1,s0:pbV.s,mx:(a.x+b.x)/2-r.left,my:(a.y+b.y)/2-r.top,vx:pbV.x,vy:pbV.y};pbOverlay();return}if(TP.size>2)return}
  const p=pbWorld(e);pbPtr=p;const menu=bar.querySelector('.pbmenu');if(menu)menu.hidden=true;
  const pan=()=>{pbDrag={t:'pan',sx:e.clientX,sy:e.clientY,vx:pbV.x,vy:pbV.y,moved:false};try{sv.setPointerCapture(e.pointerId)}catch(_){}};
  if(e.button===2){if(pbTool){pbTool=null;pbOverlay();return}if(tool){tool=null;renderAll();return}pan();return}
  if(e.button===1){e.preventDefault();pan();return}if(e.button!==0)return;
  const prEl=e.target.closest('.pbprobe');if(prEl){const c=byId(prEl.dataset.id);if(c){if(mode==='edit')pushHist();pbDrag={t:'probe',c,w:prEl.dataset.p,moved:false};try{sv.setPointerCapture(e.pointerId)}catch(_){}}return}
  const gEl=e.target.closest('.pbpart'),c=gEl&&byId(gEl.dataset.id);
  if(mode==='sim'){if(!c){pan();return}const d=D(c),hit=e.target.closest('.pbhit');
   if(hit&&d.hitClick){e.preventDefault();const r=d.hitClick(c,+hit.dataset.hx,+hit.dataset.hy);if(r==='hold')pbHeld=c;solve();refresh(true);return}
   if(e.shiftKey&&c.type==='btn'&&!c.latch){rt.btn[c.id]=!rt.btn[c.id];logE(`${c.tag} ${rt.btn[c.id]?'segurada apertada (Shift + clique de novo para soltar)':'solta'}`,'a');solve();refresh(true);return}
   if((rt.burnt&&rt.burnt[c.id])||actOf(c)){simPress(c.id);return}pan();return}
  /* edição */
  if(tool&&tool.key){const pr0=tool.proto;if(!pbVis(pr0)){toast('Esse item não tem peça física: coloque-o no esquema (desligue o modo Protoboard).',true);tool=null;renderAll();return}
   pushHist();const sp=pbSchemPos(),nc=placeComp(pr0,sp.x,sp.y,0);nc.pbx=Math.round(p.x/PBP)*PBP;nc.pby=Math.round(p.y/PBP)*PBP;nc.pbr=tool.pbr||0;nc.pbsp=1;nc.pbsx=nc.x;nc.pbsy=nc.y;S.comps.push(nc);tool=null;sel=mkSel([nc.id]);pbSelW=null;pbSelB=null;commit();return}
  const wEl=e.target.closest('.pbw'),bendEl=e.target.closest('.pbbend'),endEl=e.target.closest('.pbendh');
  if(endEl&&wEl){const v=pbFindW(wEl.dataset.w,wEl.dataset.k);if(v){pbDrag={t:'end',v,which:endEl.dataset.e,moved:false};try{sv.setPointerCapture(e.pointerId)}catch(_){}}return}
  if(bendEl&&wEl){const v=pbFindW(wEl.dataset.w,wEl.dataset.k);if(v){pbDrag={t:'bend',w:v,i:+bendEl.dataset.i,moved:false};try{sv.setPointerCapture(e.pointerId)}catch(_){}}return}
  if(pbV.s<.9&&(pbNearPin(p)||pbHoleAt(p))){const r=sv.getBoundingClientRect();pbZoomAt(e.clientX-r.left,e.clientY-r.top,1.8/pbV.s);pbOverlay();if(!pbZoomTip){pbZoomTip=1;toast('Aproximei para você acertar o terminal. Clique de novo.')}return}
  if(pbTool){const end=pbEndAt(e,p);if(end){pbFinishWire(end);return}{const last=pbTool.pts.length?{x:pbTool.pts[pbTool.pts.length-1][0],y:pbTool.pts[pbTool.pts.length-1][1]}:pbEndPos(pbTool.from)||p,x=Math.round(p.x/5)*5,y=Math.round(p.y/5)*5;pbTool.pts.push(Math.abs(x-last.x)>=Math.abs(y-last.y)?[x,last.y]:[last.x,y])}pbOverlay();return}
  const np=pbPinAt(e,p);if(np){pbTool={from:{c:np.c,t:np.t},pts:[]};pbDrag={t:'wire',sx:e.clientX,sy:e.clientY,moved:false};sel=null;pbSelW=null;pbSelB=null;renderProps();updSelBtns();pbRender();try{sv.setPointerCapture(e.pointerId)}catch(_){}return}
  if(c){const multi=e.shiftKey||e.ctrlKey||e.metaKey;pbSelW=null;pbSelB=null;if(multi){select(toggleSel('c',c.id));pbRender();return}if(!SC(c.id))select(mkSel([c.id]));
   const orig={};sel.c.forEach(id=>{const o=byId(id);if(o&&num(o.pbx))orig[id]={x:o.pbx,y:o.pby}});pbDrag={t:'part',ids:Object.keys(orig),orig,sx:p.x,sy:p.y,moved:false};try{sv.setPointerCapture(e.pointerId)}catch(_){}pbRender();return}
  if(wEl){pbSelW={id:wEl.dataset.w,k:wEl.dataset.k};pbSelB=null;if(sel)select(null);pbRender();return}
  const h=pbHoleAt(p);if(h){const end=pbEndAt(e,p);if(end){pbTool={from:end,pts:[]};pbDrag={t:'wire',sx:e.clientX,sy:e.clientY,moved:false};try{sv.setPointerCapture(e.pointerId)}catch(_){}pbSelW=null;pbSelB=null;if(sel)select(null);pbRender();return}}
  const bEl=e.target.closest('.pbbd');if(bEl){const bd=S.pb.bds.find(b=>b.id===bEl.dataset.bd);if(bd){pbSelB=bd.id;pbSelW=null;if(sel)select(null);
   const H=PBH||pbHoles(),att=S.comps.filter(o=>pbVis(o)&&num(o.pbx)&&termsOf(o).some((_,i)=>{const hh=pbIns(o,i,H);return hh&&hh.bd===bd.id}));
   const orig={bd:{x:bd.x,y:bd.y},c:{}};att.forEach(o=>orig.c[o.id]={x:o.pbx,y:o.pby});const ws=S.pb.w.filter(w=>[w.a,w.b].every(x=>x.bd===bd.id||(x.c&&orig.c[x.c])));orig.w=ws.map(w=>({w,p:(w.p||[]).map(q=>[...q])}));
   const ss=S.wires.filter(w=>w.pbp&&orig.c[w.a.c]&&orig.c[w.b.c]);orig.s=ss.map(w=>({w,p:w.pbp.map(q=>[...q])}));pbDrag={t:'board',bd,orig,sx:p.x,sy:p.y,moved:false};try{sv.setPointerCapture(e.pointerId)}catch(_){}pbRender();return}}
  if(e.pointerType==='touch'){if(sel||pbSelW||pbSelB){pbSelW=null;pbSelB=null;select(null)}pan();return}
  pbDrag={t:'box',x0:p.x,y0:p.y,x1:p.x,y1:p.y,add:e.shiftKey||e.ctrlKey||e.metaKey,base:sel};if(!pbDrag.add&&(sel||pbSelW||pbSelB)){pbSelW=null;pbSelB=null;select(null)}try{sv.setPointerCapture(e.pointerId)}catch(_){}});
 sv.addEventListener('pointermove',e=>{if(TP.has(e.pointerId))TP.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&TP.size>=2){const[a,b]=[...TP.values()],r=sv.getBoundingClientRect(),d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2-r.left,my=(a.y+b.y)/2-r.top,ns=Math.min(6,Math.max(.25,pinch.s0*d/pinch.d0));
   pbV.s=ns;pbV.x=mx-(pinch.mx-pinch.vx)*ns/pinch.s0;pbV.y=my-(pinch.my-pinch.vy)*ns/pinch.s0;pbApplyView();return}
  const p=pbWorld(e);pbPtr=p;const d=pbDrag;
  if(d&&d.t==='wire'&&Math.hypot(e.clientX-d.sx,e.clientY-d.sy)>6)d.moved=true;
  if(d&&d.t==='box'){d.x1=p.x;d.y1=p.y;pbOverlay();return}
  if(d&&d.t==='probe'){d.moved=true;d.c['pr'+d.w]=prStr({px:p.x,py:p.y-8});const np=pbNearPin(p),h=np?null:pbHoleAt(p);pbHover=np?{pin:1,x:np.x,y:np.y,k:'e'}:h?{net:h.net,x:h.x,y:h.y,k:'e'}:null;pbRender();pbOverlay();return}
  if(d&&d.t==='pan'){pbV.x=d.vx+e.clientX-d.sx;pbV.y=d.vy+e.clientY-d.sy;d.moved=true;pbApplyView();return}
  if(d&&d.t==='part'){const dx=Math.round((p.x-d.sx)/PBP)*PBP,dy=Math.round((p.y-d.sy)/PBP)*PBP;if(!d.moved&&!dx&&!dy)return;if(!d.moved){pushHist();d.moved=true}for(const id of d.ids){const o=byId(id);if(o){o.pbx=d.orig[id].x+dx;o.pby=d.orig[id].y+dy}}pbRender();return}
  if(d&&d.t==='board'){const dx=Math.round((p.x-d.sx)/PBP)*PBP,dy=Math.round((p.y-d.sy)/PBP)*PBP;if(!d.moved&&!dx&&!dy)return;if(!d.moved){pushHist();d.moved=true}d.bd.x=d.orig.bd.x+dx;d.bd.y=d.orig.bd.y+dy;
   for(const id in d.orig.c){const o=byId(id);if(o){o.pbx=d.orig.c[id].x+dx;o.pby=d.orig.c[id].y+dy}}d.orig.w.forEach(({w,p:q})=>{if(q.length)w.p=q.map(([x,y])=>[x+dx,y+dy])});d.orig.s.forEach(({w,p:q})=>{w.pbp=q.map(([x,y])=>[x+dx,y+dy])});pbRender();return}
  if(d&&d.t==='end'){d.moved=true;const np=pbNearPin(p),h=np?null:pbHoleAt(p);pbTool=null;pbHover=np?{pin:1,x:np.x,y:np.y,k:'e'}:h?{net:h.net,x:h.x,y:h.y,k:'e'}:null;pbOverlay();return}
  if(d&&d.t==='bend'){if(!d.moved){pushHist();d.moved=true}const arr=d.w.k==='s'?d.w.w.pbp:d.w.w.p;if(arr&&arr[d.i])arr[d.i]=[Math.round(p.x/5)*5,Math.round(p.y/5)*5];pbRender();return}
  /* realce do furo/terminal sob o cursor */
  let hv=null;const body=pbOnBody(e)&&!pbTool,np=mode==='edit'?(pbTool?pbNearPin(p):pbPinAt(e,p)):null;
  if(np){const c=byId(np.c);hv={pin:1,x:np.x,y:np.y,tip:`${c.tag||lab(c)} · ${tn(c,np.t)}`}}
  else if(!body){const h=pbHoleAt(p);if(h)hv={net:h.net,x:h.x,y:h.y,tip:h.rail!=null?`${tr('Barramento')} ${h.rail%2?'+':'−'}`:`${h.row}${h.col}`}}
  if(pbTool){pbTool.snap=hv?{x:hv.x,y:hv.y}:null}
  const k=hv?hv.x+','+hv.y+(hv.tip||''):'';if(k!==(pbHover?pbHover.k:'')||pbTool||(tool&&tool.key)){pbHover=hv?{...hv,k}:null;pbOverlay()}});
 const up=e=>{if(e&&TP.has(e.pointerId)){TP.delete(e.pointerId);if(pinch){if(TP.size<2)pinch=null;return}}const d=pbDrag;pbDrag=null;if(d&&d.t==='wire'){if(d.moved&&pbTool){const end=pbEndAt({target:document.body},pbPtr);if(end&&!sameEnd(end,pbTool.from))pbFinishWire(end);else{pbTool=null;pbRender()}}return}if(d&&d.t==='probe'){if(d.moved){const end=pbEndAt({target:document.body},pbPtr);d.c['pr'+d.w]=prStr(end||{px:pbPtr.x,py:pbPtr.y-8});pbHover=null;if(mode==='edit')commit();else{save();pbRender();refresh(true)}}return}if(d&&d.t==='end'){if(d.moved)pbMoveEnd(d.v,d.which,pbEndAt({target:document.body},pbPtr));else pbRender();return}if(d&&d.t==='box'){pbBoxSel(d);return}if(d&&(d.t==='part'||d.t==='board'||d.t==='bend')&&d.moved){commit()}else if(d&&d.t!=='pan')pbOverlay();
  if(pbHeld&&rt){const dd=D(pbHeld);if(dd.release)dd.release(pbHeld);pbHeld=null;solve();refresh(true)}pbHeld=null};
 addEventListener('pointerup',up);addEventListener('pointercancel',up);
 sv.addEventListener('pointerleave',()=>{if(pbHover){pbHover=null;pbOverlay()}});
 sv.addEventListener('dblclick',e=>{if(mode!=='edit')return;const wEl=e.target.closest('.pbw');if(!wEl)return;const v=pbFindW(wEl.dataset.w,wEl.dataset.k);if(!v)return;const p=pbWorld(e),pts=v.pts;let bi=0,bd=1e9;
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],L=Math.hypot(b.x-a.x,b.y-a.y)||1,t=Math.max(0,Math.min(1,((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/L/L)),dd=Math.hypot(a.x+t*(b.x-a.x)-p.x,a.y+t*(b.y-a.y)-p.y);if(dd<bd){bd=dd;bi=i}}
  pushHist();const arr=v.k==='s'?(v.w.pbp=v.w.pbp||[]):(v.w.p=v.w.p||[]);arr.splice(bi,0,[Math.round(p.x/5)*5,Math.round(p.y/5)*5]);pbSelW={id:v.id,k:v.k};commit()});

 /* teclado: Del, R e Esc atuam na protoboard quando ela está à vista */
 addEventListener('keydown',e=>{if(!pbOn()||$('#dProj').open)return;if(e.target.matches&&e.target.matches('input,select,textarea'))return;const k=e.key.toLowerCase();
  if(e.key==='Escape'&&(pbTool||pbSelW||pbSelB)){pbTool=null;pbSelW=null;pbSelB=null;pbRender();return}
  if((e.key==='Delete'||e.key==='Backspace')&&mode==='edit'&&(pbSelW||pbSelB)){e.preventDefault();e.stopImmediatePropagation();pbDelSel();return}
  if(k==='r'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&mode==='edit'){e.preventDefault();e.stopImmediatePropagation();if(tool&&tool.key){tool.pbr=((tool.pbr||0)+90)%360;pbOverlay()}else pbRot()}},true);
}
function pbBoxSel(d){const x0=Math.min(d.x0,d.x1),x1=Math.max(d.x0,d.x1),y0=Math.min(d.y0,d.y1),y1=Math.max(d.y0,d.y1);if(x1-x0<2&&y1-y0<2){pbOverlay();return}
 const ids=S.comps.filter(c=>pbVis(c)&&num(c.pbx)&&onSheet(c)).filter(c=>{const b=pbBox(c),cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;return cx>=x0&&cx<=x1&&cy>=y0&&cy<=y1}).map(c=>c.id);
 const base=d.add&&d.base?[...d.base.c]:[];select(mkSel([...new Set([...base,...ids])]));pbOverlay()}
function pbMoveEnd(v,which,end){if(!end){pbRender();return}const other=which==='a'?v.w.b:v.w.a;if(sameEnd(end,other)){pbRender();return}pushHist();
 if(v.k==='p'){v.w[which]=end;commit();return}
 if(end.c){if(S.wires.some(w=>w!==v.w&&!w.pb&&[[w.a,w.b],[w.b,w.a]].some(([x,y])=>sameEnd(x,end)&&sameEnd(y,other)))){toast('Esses dois terminais já estão ligados.');pbRender();return}v.w[which]={c:end.c,t:end.t};commit();return}
 S.wires=S.wires.filter(w=>w!==v.w);const nw={id:'pw'+(S.seq++),a:which==='a'?end:{c:other.c,t:other.t},b:which==='a'?{c:other.c,t:other.t}:end,col:v.w.pbc||PBWC[v.w.col]||pbCol};if(v.w.pbp)nw.p=v.w.pbp;S.pb.w.push(nw);pbSelW={id:nw.id,k:'p'};commit()}
/* cópia colada ou duplicada cai fora da placa (não liga em paralelo com a original) */
function pbFixDup(){const seen=new Set(),dup=[];for(const c of S.comps){if(!pbVis(c)||!num(c.pbx))continue;const k=pbSh(c)+'|'+c.pbx+','+c.pby+','+(c.pbr||0)+','+c.type;if(seen.has(k))dup.push(c);else seen.add(k)}if(!dup.length)return false;
 const bySh={};dup.forEach(c=>(bySh[pbSh(c)]=bySh[pbSh(c)]||[]).push(c));
 for(const sh in bySh){const g=bySh[sh],ids=new Set(g.map(c=>c.id));let y=-1e9,minY=1e9,minX=1e9;for(const c of S.comps)if(pbVis(c)&&num(c.pbx)&&pbSh(c)===+sh){const b=pbBox(c);if(ids.has(c.id)){minY=Math.min(minY,b[1]);minX=Math.min(minX,b[0])}else y=Math.max(y,b[3])}
  for(const bd of S.pb.bds)if(pbSh(bd)===+sh)y=Math.max(y,bd.y+bdGeo(bd).h*PBP);const dy=Math.ceil((y+40-minY)/PBP)*PBP;g.forEach(c=>c.pby+=dy);S.wires.forEach(w=>{if(w.pbp&&ids.has(w.a.c)&&ids.has(w.b.c))w.pbp=w.pbp.map(([x,yy])=>[x,yy+dy])})}return true}
/* exportar a protoboard (PNG e PDF) */
function pbExportSVG(){const keep=[sel,pbSelW,pbSelB,pbTool,pbHover];sel=null;pbSelW=null;pbSelB=null;pbTool=null;pbHover=null;pbRender();
 let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const bd of S.pb.bds.filter(bdOn)){const g=bdGeo(bd);a=Math.min(a,bd.x);b=Math.min(b,bd.y);c=Math.max(c,bd.x+g.w*PBP);d=Math.max(d,bd.y+g.h*PBP)}
 for(const o of S.comps)if(pbVis(o)&&num(o.pbx)&&onSheet(o)){const q=pbBox(o);a=Math.min(a,q[0]);b=Math.min(b,q[1]-12);c=Math.max(c,q[2]);d=Math.max(d,q[3])}
 for(const v of pbVisibleWires(pbPhys()))for(const q of v.pts){a=Math.min(a,q.x);b=Math.min(b,q.y);c=Math.max(c,q.x);d=Math.max(d,q.y+40)}
 const body=['pbB','pbC','pbJ'].map(id=>document.getElementById(id).innerHTML).join('').replace(/var\(--pick\)/g,'#1668c9').replace(/var\(--pbbg\)/g,'#eef1f5').replace(/var\(--muted\)/g,'#5d6b80');
 [sel,pbSelW,pbSelB,pbTool,pbHover]=keep;pbRender();if(a>c)return null;a-=20;b-=20;c+=20;d+=20;const W=c-a,H=d-b;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${a} ${b} ${W} ${H}" width="${W}" height="${H}" font-family="IBM Plex Sans,Arial,sans-serif">${document.querySelector('#pbv defs').outerHTML}<style>.pbtag{font-size:7px;fill:#5d6b80;font-weight:600}.pbhitbox,.pbpin,.pbwhit{fill:none;stroke:none}</style><rect x="${a}" y="${b}" width="${W}" height="${H}" fill="#f4f6f9"/>${body}</svg>`;return{svg,W,H}}
function pbCanvas(cb){const x=pbExportSVG();if(!x){toast('A protoboard está vazia.',true);return}const k=Math.min(4,8000/Math.max(x.W,x.H)),img=new Image(),url=URL.createObjectURL(new Blob([x.svg],{type:'image/svg+xml'}));
 img.onload=()=>{const cv=document.createElement('canvas');cv.width=Math.round(x.W*k);cv.height=Math.round(x.H*k);const g=cv.getContext('2d');g.fillStyle='#f4f6f9';g.fillRect(0,0,cv.width,cv.height);g.drawImage(img,0,0,cv.width,cv.height);URL.revokeObjectURL(url);cb(cv)};
 img.onerror=()=>{URL.revokeObjectURL(url);toast('Não consegui gerar a imagem da protoboard.',true)};img.src=url}
function pbPng(){pbCanvas(cv=>cv.toBlob(b=>{const n=safeName(fname)+'-protoboard';download(b,n+'.png');toast((LANG==='en'?'PNG image created: ':'Imagem PNG gerada: ')+n+'.png')},'image/png'))}
function pbPdf(){pbCanvas(cv=>{const jpg=atob(cv.toDataURL('image/jpeg',.92).split(',')[1]),J=new Uint8Array(jpg.length);for(let i=0;i<jpg.length;i++)J[i]=jpg.charCodeAt(i);
 const PW=842,PH=595,m=28,top=24,sc=Math.min((PW-2*m)/cv.width,(PH-2*m-top)/cv.height),dw=cv.width*sc,dh=cv.height*sc,dx=(PW-dw)/2,dy=m+((PH-2*m-top)-dh)/2;
 const title=(safeName(fname).replace(/-/g,' ')+' - protoboard').replace(/[()\\]/g,''),enc=new TextEncoder(),parts=[],off=[];let len=0;const put=x=>{const b=typeof x==='string'?enc.encode(x):x;parts.push(b);len+=b.length};
 const obj=(n,str,bin)=>{off[n]=len;put(`${n} 0 obj\n`+str);if(bin){put(bin);put('\nendstream')}put('\nendobj\n')};
 const cs=`q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${dx.toFixed(2)} ${dy.toFixed(2)} cm /Im0 Do Q BT /F1 11 Tf ${m} ${PH-m-6} Td (${title}) Tj ET BT /F1 7 Tf ${PW-m-150} ${m-14} Td (Faisca - Thiagosystems) Tj ET`;
 put('%PDF-1.4\n');obj(1,'<</Type/Catalog/Pages 2 0 R>>');obj(2,'<</Type/Pages/Kids[3 0 R]/Count 1>>');obj(3,`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PW} ${PH}]/Resources<</XObject<</Im0 4 0 R>>/Font<</F1 6 0 R>>>>/Contents 5 0 R>>`);
 obj(4,`<</Type/XObject/Subtype/Image/Width ${cv.width}/Height ${cv.height}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${J.length}>>\nstream\n`,J);obj(5,`<</Length ${cs.length}>>\nstream\n`,enc.encode(cs));obj(6,'<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>');
 const x0=len;let xr=`xref\n0 7\n0000000000 65535 f \n`;for(let i=1;i<=6;i++)xr+=String(off[i]).padStart(10,'0')+' 00000 n \n';put(xr+`trailer\n<</Size 7/Root 1 0 R>>\nstartxref\n${x0}\n%%EOF`);
 const n=safeName(fname)+'-protoboard';download(new Blob(parts,{type:'application/pdf'}),n+'.pdf');toast((LANG==='en'?'PDF created: ':'PDF gerado: ')+n+'.pdf')})}
function pbAutoMount(silent){if(mode!=='edit')return;pbInit();pbSheetBoard();
 const H=pbHoles(),onB=c=>termsOf(c).some((_,i)=>pbIns(c,i,H)),parts=S.comps.filter(c=>pbVis(c)&&num(c.pbx)&&onSheet(c)&&!pkgOf(c).sock&&!onB(c)&&pkgOf(c).pins.length);
 const srcs=S.comps.filter(c=>c.type==='src'&&onSheet(c)&&num(c.pbx));
 if(!parts.length&&!srcs.length){if(!silent)toast('Todas as peças já estão na protoboard.');return}if(!silent)pushHist();
 const boards=S.pb.bds.filter(b=>bdOn(b)&&PBK[b.k].rails).sort((a,b)=>a.y-b.y);const newBoard=()=>{let n=1;while(S.pb.bds.some(b=>b.id==='pb'+n))n++;let y=0;for(const b of S.pb.bds.filter(bdOn))y=Math.max(y,b.y+bdGeo(b).h*PBP+40);const b={id:'pb'+n,k:'full',x:0,y,sh:S.cur||1};S.pb.bds.push(b);boards.push(b);return b};
 if(!boards.length)newBoard();
 const occ=new Map(),U=b=>{if(!occ.has(b.id)){const g=bdGeo(b),o={t:new Array(g.n+6).fill(false),b:new Array(g.n+6).fill(false)};for(const c of S.comps){if(!onSheet(c)||!num(c.pbx))continue;termsOf(c).forEach((_,i)=>{const h=pbIns(c,i,H);if(h&&h.bd===b.id&&h.rail==null)(h.hy<g.mid?o.t:o.b)[h.hx]=true})}occ.set(b.id,o)}return occ.get(b.id)};
 const fit=(c,b)=>{const g=bdGeo(b),u=U(b),top=g.rows.slice(0,5),bot=g.rows.slice(5),pk=pkgOf(c),ys=[...new Set(pk.pins.map(q=>q[1]))].sort((a,z)=>a-z),xs=pk.pins.map(q=>q[0]),x0=Math.min(...xs),x1=Math.max(...xs),dy=ys[ys.length-1]-ys[0];
  const sy=[...top].reverse().find(y=>bot.includes(y+dy)),opts=ys.length===1?[[top[2]-ys[0],'t'],[bot[2]-ys[0],'b']]:dy===1?[[top[1]-ys[0],'t'],[bot[1]-ys[0],'b']]:ys.length===2&&sy!=null?[[sy-ys[0],'s']]:null;if(!opts)return null;
  const bx0=Math.min(x0,Math.floor(pk.box[0]/PBP)+1),bx1=Math.max(x1,Math.ceil(pk.box[2]/PBP)-1);
  for(const[y0,half]of opts)for(let col=3;col+x1-x0<=g.n+1;col++){const cols=[];for(let x=bx0;x<=bx1;x++)if(col+x-x0>=1)cols.push(col+x-x0);const fr=cols.concat([cols[cols.length-1]+1]).every(cc=>cc<=g.n+1&&(half==='t'?!u.t[cc]:half==='b'?!u.b[cc]:!u.t[cc]&&!u.b[cc]));if(!fr)continue;
   cols.concat([cols[cols.length-1]+1]).forEach(cc=>{if(half!=='b')u.t[cc]=true;if(half!=='t')u.b[cc]=true});return{x:b.x+(col-x0)*PBP,y:b.y+y0*PBP}}return null};
 let placed=0;const out=[];parts.sort((a,b)=>pkgOf(b).pins.length-pkgOf(a).pins.length||(a.x-b.x));
 for(const c of parts){let pos=null;for(const b of boards){pos=fit(c,b);if(pos)break}if(!pos&&boards.length<4){pos=fit(c,newBoard())}if(!pos){out.push(c);continue}c.pbr=0;c.pbx=pos.x;c.pby=pos.y;placed++}
 /* fontes (+ / 0 V) viram etiquetas ao lado do barramento */
 const b0=boards[0];
 /* jumpers da protoboard para cada ligação do esquema */
 const H2=pbHoles(),uf=pbUF();for(const w of S.wires)uf.u(K(w.a.c,w.a.t),K(w.b.c,w.b.t));pbNameJoin(uf);const nets=new Map();
 for(const c of S.comps){if(!onSheet(c)||!pbVis(c)||!num(c.pbx)||['junction','netl','xref'].includes(c.type))continue;termsOf(c).forEach((_,i)=>{const k=K(c.id,i),r=uf.f(k);if(!nets.has(r))nets.set(r,[]);nets.get(r).push({c,i})})}
 const usedH=new Set();for(const c of S.comps){if(!num(c.pbx))continue;pkgOf(c).pins.forEach((_,i)=>{const q=pbPin(c,i);if(q)usedH.add(q.x+','+q.y)})}for(const w of S.pb.w)for(const e of[w.a,w.b])if(e.bd){const b=S.pb.bds.find(x=>x.id===e.bd);if(b)usedH.add((b.x+e.hx*PBP)+','+(b.y+e.hy*PBP))}
 const freeIn=(net,pref)=>{const L=[...H2.values()].filter(v=>v.net===net&&!usedH.has(v.x+','+v.y));if(!L.length)return null;L.sort(pref);const h=L[0];usedH.add(h.x+','+h.y);const b=S.pb.bds.find(x=>x.id===h.bd);return{e:{bd:b.id,hx:(h.x-b.x)/PBP,hy:(h.y-b.y)/PBP},x:h.x}};
 const ph=pbPhys();let nj=0,ci=0;const COLS=['verde','azul','amarelo','laranja','roxo','branco','ciano','rosa','marrom','cinza'];
 for(const L of nets.values()){const sv=L.find(({c})=>c.type==='src');const kind=sv?(String(sv.c.v)==='+'?'+':'-'):null;if(L.length<2&&!kind)continue;const ends=[],seen=new Set();
  for(const{c,i}of L){if(c.type==='src')continue;const h=pbIns(c,i,H2);if(h){const key='N'+h.net;if(seen.has(key))continue;seen.add(key);const g=bdGeo(S.pb.bds.find(x=>x.id===h.bd)),e=freeIn(h.net,(a,z)=>Math.abs(z.hy-g.mid)-Math.abs(a.hy-g.mid));if(e)ends.push({...e,root:ph.uf.f(K(c.id,i))})}
   else if(pkgOf(c).sock){const q=pbPin(c,i);ends.push({e:{c:c.id,t:i},x:q?q.x:0,root:ph.uf.f(K(c.id,i))})}}
  const names=L.map(({c,i})=>String(tn(c,i)).toUpperCase()).join(' '),col=kind==='-'||/\b(GND|0V)\b|−/.test(names)?'preto':kind==='+'||/(5V|VCC|3V)/.test(names)?'vermelho':COLS[ci++%COLS.length];
  if(kind){/* rede da fonte: cada ponta vai ao barramento da sua placa; a etiqueta da fonte liga no barramento da primeira */
   const railOf=b=>{const g=bdGeo(b);return kind==='+'?`${b.id}:r1`:`${b.id}:r0`};const bs=new Set();
   for(const en of ends){const bd=en.e.bd?S.pb.bds.find(x=>x.id===en.e.bd):b0;const r=freeIn(railOf(bd),(a,z)=>Math.abs(a.x-en.x)-Math.abs(z.x-en.x));if(r){S.pb.w.push({id:'pw'+(S.seq++),a:en.e,b:r.e,col});nj++;bs.add(bd.id)}}
   for(const id of bs)if(id!==b0.id){const b=S.pb.bds.find(x=>x.id===id),r1=freeIn(railOf(b0),(a,z)=>a.x-z.x),r2=freeIn(railOf(b),(a,z)=>a.x-z.x);if(r1&&r2){S.pb.w.push({id:'pw'+(S.seq++),a:r1.e,b:r2.e,col});nj++}}continue}
  if(ends.length<2)continue;ends.sort((a,b)=>a.x-b.x);
  for(let k=1;k<ends.length;k++){S.pb.w.push({id:'pw'+(S.seq++),a:ends[k-1].e,b:ends[k].e,col});nj++}}
 commit();if(silent){requestAnimationFrame(pbFit);return}const ns=out.map(c=>c.tag||lab(c)).slice(0,4).join(', ');toast(LANG==='en'?`Auto assembly: ${placed} part(s) placed and ${nj} jumper(s).`+(out.length?` ${out.length} did not fit (${ns}).`:''):`Montagem automática: ${placed} peça(s) encaixada(s) e ${nj} jumper(s).`+(out.length?` ${out.length} não couberam (${ns}).`:''))}
function pbFindW(id,k){const ph=pbPhys();return pbVisibleWires(ph).find(v=>v.id===id&&v.k===k)||null}
function pbToggle(){pbInit();S.pb.on=!S.pb.on;pbTool=null;pbSelW=null;pbSelB=null;if(S.pb.on){pbPlaceNew();pbSync()}save();renderAll();if(S.pb.on)requestAnimationFrame(()=>{if(S.pb.vs){pbV={x:S.pb.vx,y:S.pb.vy,s:S.pb.vs};pbApplyView()}else pbFit()})}
let pbPalOn=null;
function pbSyncUI(){const on=pbOn();{const b=document.getElementById('bPb');if(b)b.hidden=!!S.nopb}if(pbPalOn!==on){pbPalOn=on;try{renderPalette()}catch(e){console.error(e)}}document.body.classList.toggle('pbmode',on);const b=document.getElementById('bPb');if(b){b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)}}

/* ---------- ligação com o resto do programa ---------- */
/* ---------- paleta no modo Protoboard: só peças de bancada, com o desenho da protoboard ---------- */
const PBCAT=[['Componentes básicos',['res','pot','cap','led','ledrgb','diode','zener','ind','tact','slsw','dipsw','ldr','piezo']],['Energia',['bat','solar','usba']],['Transistores, reguladores e relés',['npn','pnp','nmos','pmos','vreg','rly1','rly2','opamp']],
 ['Sensores e entradas',['pdiode','ptrans','flex','fsr','tmp36','lm35','tilt','soil','gas','pir','hcsr04','ping','irrx','irremote','kp4']],['Saídas, motores e telas',['seg7','lcd','lcdi2c','tm1637','neopx','vibm','motdc','encm','servo']],
 ['Microcontroladores e conectores',['plc','mbit','hdr8']],['Circuitos integrados',['ic']],['Instrumentos',['mmeter','psub','fgen','scope','vm','am']]];
const PBPAL_NO=new Set(['src','junction','netl','xref','mot1']);
function pbPalOK(it){if(!DEFS[it[1]]||PBPAL_NO.has(it[1]))return false;if(it[1]==='plc')return(it[2]||{}).m==='ard';if(!PKGS[it[1]])return false;const c=makeComp(it[1],it[2]||{},it[0]);return pbVis(c)}
function pbIcon(c){const q={...c,id:'_p',pbx:0,pby:0,pbr:0},p=pkgOf(q),b=p.box,w=b[2]-b[0],h=b[3]-b[1],m=Math.max(w,h)*.08+3;let a='';try{a=p.art(q)}catch(e){}return`<svg viewBox="${b[0]-m} ${b[1]-m} ${w+2*m} ${h+2*m}" aria-hidden="true" class="pbico">${a}</svg>`}
function bdIcon(k){const g=bdGeo({k}),W=g.w*PBP,H=g.h*PBP;return`<svg viewBox="-6 -6 ${W+12} ${H+12}" aria-hidden="true" class="pbico">${bdSVG({id:'_ico'+k,k,x:0,y:0}).replace('class="pbbd"','')}</svg>`}
{const _rp=renderPalette;renderPalette=function(){if(!pbOn())return _rp();const q=($('#psearch').value||'').trim().toLowerCase(),has=t=>!q||t.toLowerCase().includes(q)||(typeof tr==='function'&&tr(t).toLowerCase().includes(q));
  let h='';const bds=Object.keys(PBK).filter(k=>has(PBK[k].nm)||has('protoboard'));if(bds.length)h+=`<details open><summary>Protoboards<small>${bds.length}</small></summary><div class="pgrid">${bds.map(k=>`<button class="pitem pbbdi" data-p="-1.-1" data-pbk="${k}" title="${esc(PBK[k].nm)}">${bdIcon(k)}<span>${esc(PBK[k].nm)}</span></button>`).join('')}</div></details>`;
  const grp=PBCAT.map(([n])=>[n,[]]),seen=new Set();PAL.forEach(([cat,items],ci)=>items.forEach((it,ii)=>{if(!pbPalOK(it))return;const k=it[1]+JSON.stringify(it[2]||{});if(seen.has(k))return;seen.add(k);const g=it[1]==='ic'&&(it[2]||{}).k==='ATtiny85'?5:PBCAT.findIndex(([,ts])=>ts.includes(it[1]));if(g<0||!(has(it[0])||has(PBCAT[g][0])))return;grp[g][1].push([it,ci,ii])}));
  grp.forEach(([n,f],gi)=>{if(!f.length)return;h+=`<details${q||gi===0?' open':''}><summary>${n}<small>${f.length}</small></summary><div class="pgrid">${f.map(([it,ci,ii])=>`<button class="pitem" data-p="${ci}.${ii}" title="${esc(it[0])}">${pbIcon(makeComp(it[1],it[2]||{},it[0]))}<span>${esc(it[0])}</span></button>`).join('')}</div></details>`});
  $('#palette').innerHTML=h||'<p class="muted small">Nada encontrado.</p>';markPal()}}/* ---------- ligação com o resto do programa ---------- */
/* opção por projeto: usar ou não a protoboard */
function pbSetUse(use){if(use===!S.nopb)return;pushHist();if(use){delete S.nopb;toast('Protoboard ativada neste projeto.')}else{S.nopb=true;if(S.pb)S.pb.on=false;S.wires.forEach(w=>{delete w.pb});pbAutoS=null;toast('Protoboard desligada neste projeto. As ligações viraram fios normais do esquema.')}commit()}
{const _sd=settingsDialog;settingsDialog=function(...a){const r=_sd(...a);try{const m=document.getElementById('modal'),ref=m&&[...m.querySelectorAll('h3.cfgh')].pop();if(ref&&!m.querySelector('#cfgPb')){const h=document.createElement('div');
  h.innerHTML=`<h3 class="cfgh">Protoboard</h3><div class="cfgl"><label class="chk"><input type="checkbox" id="cfgPb" ${S.nopb?'':'checked'}> Usar a protoboard neste projeto (botão Protoboard e montagem sincronizada)</label></div>`;
  const list=ref.nextElementSibling;(list||ref).after(...h.childNodes);m.querySelector('#cfgPb').addEventListener('change',e=>pbSetUse(e.target.checked))}}catch(e){console.error(e)}return r}}
pbSetup();
['bPng','bPdf'].forEach(id=>{const b=document.getElementById(id);if(b)b.addEventListener('click',e=>{if(!pbOn())return;e.stopImmediatePropagation();e.preventDefault();document.querySelectorAll('.mlist').forEach(m=>m.hidden=true);(id==='bPng'?pbPng:pbPdf)()},true)});
/* fio criado pela protoboard e apagado no esquema: desfaz a ligação física também */
function pbConn(a,b){const ph=pbPhys();return ph.uf.f(a)===ph.uf.f(b)}
function pbBreak(a,b){const out=[];for(let n=0;n<12&&pbConn(a,b);n++){
  let done=false;for(let i=0;i<S.pb.w.length;i++){const w=S.pb.w.splice(i,1)[0];if(!pbConn(a,b)){done=true;out.push('jumper');break}S.pb.w.splice(i,0,w)}if(done)break;
  const H=pbHoles(),cand=[a,b].map(k=>{const[id,t]=k.split(':'),c=byId(id);return c&&num(c.pbx)&&pbIns(c,+t,H)?c:null}).filter(Boolean).sort((x,y)=>termsOf(x).length-termsOf(y).length);
  if(cand.length){const c=cand[0];delete c.pbx;delete c.pby;pbPlaceNew();out.push(c.tag||lab(c));continue}
  const before=S.pb.w.length;S.pb.w=S.pb.w.filter(w=>![w.a,w.b].some(e=>e.c&&(K(e.c,e.t)===a||K(e.c,e.t)===b)));if(S.pb.w.length===before)break;out.push('jumper')}
 return out}
function pbHonor(gone){const msg=new Set();for(const[a,b]of gone){if(!byId(a.split(':')[0])||!byId(b.split(':')[0]))continue;const sch=pbUF();for(const w of S.wires)sch.u(K(w.a.c,w.a.t),K(w.b.c,w.b.t));if(sch.f(a)===sch.f(b))continue;if(!pbConn(a,b))continue;pbBreak(a,b).forEach(x=>msg.add(x))}
 if(msg.size){const ps=[...msg].filter(x=>x!=='jumper'),j=msg.has('jumper');setTimeout(()=>toast(`Ligação desfeita também na protoboard: ${[ps.length?ps.join(', ')+(ps.length>1?' saíram':' saiu')+' da placa':'',j?'jumper retirado':''].filter(Boolean).join(' e ')}.`),0)}}
let pbAutoS=null,pbAuto=new Map(),PBNEW=[];
/* no esquema: peça colocada pela protoboard vai para perto da peça ligada a ela */
function pbFreeAt(c,x,y){const o={...c,x,y},b=wbox(o,true);for(const q of S.comps){if(q.id===c.id||!onSheet(q)||(q.sh||1)!==(c.sh||1))continue;const r=wbox(q,true);if(b[0]<r[2]+16&&b[2]>r[0]-16&&b[1]<r[3]+16&&b[3]>r[1]-16)return false}return true}
function pbSchemNear(){let mv=false;for(const c of S.comps){if(!c.pbsp)continue;if(c.x!==c.pbsx||c.y!==c.pbsy){delete c.pbsp;delete c.pbsx;delete c.pbsy;continue}
  const w=S.wires.find(w=>(w.a.c===c.id||w.b.c===c.id)&&w.a.c!==w.b.c&&(()=>{const o=byId(w.a.c===c.id?w.b.c:w.a.c),nn=x=>parseInt(String(x.id).replace(/\D/g,''))||0;return o&&o.type!=='junction'&&(!o.pbsp||nn(o)<nn(c))})());if(!w)continue;
  const n=byId(w.a.c===c.id?w.b.c:w.a.c);let done=false;for(let r=1;r<=12&&!done;r++)for(const[dx,dy]of[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=snap(n.x+dx*r*60),y=snap(n.y+dy*r*60);if(pbFreeAt(c,x,y)){c.x=x;c.y=y;done=true;mv=true;break}}
  delete c.pbsp;delete c.pbsx;delete c.pbsy}return mv}
/* no esquema: fio criado pela protoboard desvia dos componentes (em ângulo reto) */
function pbRoute(ids){for(const id of ids){const w=S.wires.find(x=>x.id===id);if(!w)continue;const a=byId(w.a.c),b=byId(w.b.c);if(!a||!b||!onSheetAll(a,b))continue;try{const P=tp(a,w.a.t),Q=tp(b,w.b.t),obs=obstaclesFor(a,b);if(!routeHits(wpts(P,Q,w),obs))continue;
  const r0=wmode(P,Q,null),st=!!r0.straight,modes=st?[P.x===Q.x?'h':'v']:[r0.o,r0.o==='v'?'h':'v'],ctr=o=>st?(o==='h'?P.x:P.y):(o==='v'?snap((P.y+Q.y)/2):snap((P.x+Q.x)/2));
  let best=null;for(let k=0;k<=30&&!best;k++)for(const o of modes)for(const sg of k?[1,-1]:[1]){const m=ctr(o)+sg*k*G;if(!routeHits(wpts(P,Q,{o,m}),obs)){best={o,m};break}}
  if(best){w.o=best.o;w.m=best.m}}catch(e){}}}
const onSheetAll=(a,b)=>(a.sh||1)===(b.sh||1);
{const _c=commit;commit=function(){if(S.pb&&!S.nopb){try{pbFixDup()}catch(e){console.error(e)}try{if(pbAutoS===S){const gone=[];for(const[id,ab]of pbAuto)if(!S.wires.some(w=>w.id===id))gone.push(ab);if(gone.length)pbHonor(gone)}PBNEW=[];pbSync();if(pbSchemNear()){PBNEW=S.wires.filter(w=>w.pb).map(w=>w.id)}if(PBNEW.length)pbRoute(PBNEW);PBNEW=[];pbAutoS=S;pbAuto=new Map(S.wires.filter(w=>w.pb).map(w=>[w.id,[K(w.a.c,w.a.t),K(w.b.c,w.b.t)]]))}catch(e){console.error(e)}if(pbOn()){S.pb.vx=pbV.x;S.pb.vy=pbV.y;S.pb.vs=pbV.s}}_c()}}
{const _r=renderAll;let lastP=null;renderAll=function(){_r();pbSyncUI();if(pbOn()){if(lastP!==IDX.cur){lastP=IDX.cur;PBBC={};if(S.pb.vs){pbV={x:S.pb.vx,y:S.pb.vy,s:S.pb.vs};pbApplyView()}else requestAnimationFrame(pbFit)}pbRender()}}}
{const _f=refresh;refresh=function(force){_f(force);if(pbOn())pbRender()}}
{const _s=select;select=function(x){_s(x);if(pbOn())pbRender()}}
{const _u=updHint;updHint=function(){_u();if(!pbOn())return;const h=document.getElementById('hint');if(h)h.textContent=tr(mode==='sim'?'Clique nos botões, chaves e sensores para operar. Shift + clique segura uma botoeira apertada.':tool&&tool.key?(LANG==='en'?`Click on the bench to place: ${tr(tool.proto.nm||D(tool.proto).n)}. R rotates, Esc cancels.`:`Clique na bancada para colocar: ${tool.proto.nm||D(tool.proto).n}. R gira, Esc cancela.`):pbTool?'Clique noutro terminal ou furo para terminar o fio. Clique no vazio para fazer uma curva. Esc ou botão direito cancela.':'Arraste as peças para os furos. Clique num terminal ou furo para puxar um fio. Fio selecionado: arraste a ponta para trocar de terminal; duplo clique cria curva. Arraste o vazio para selecionar; botão direito ou do meio move a vista.')}}
{const _d=delSel;delSel=function(){if(pbOn()&&pbDelSel())return;_d()}}
{const _ro=rotSel;rotSel=function(){if(pbOn())return pbRot();_ro()}}
{const zo=$('#bZo').onclick,fi=$('#bFit').onclick;$('#bZo').onclick=()=>{if(!pbOn())return zo();const b=document.getElementById('pbv').getBoundingClientRect();pbZoomAt(b.width/2,b.height/2,1/1.2)};$('#bFit').onclick=()=>pbOn()?pbFit():fi();
 const zi=$('#bZi');if(zi){const o=zi.onclick;zi.onclick=()=>{if(!pbOn())return o&&o();const b=document.getElementById('pbv').getBoundingClientRect();pbZoomAt(b.width/2,b.height/2,1.2)}}}
pbApplyView();

Object.assign(I18N_EXACT,{'Protoboard':'Breadboard','＋ Protoboard ▾':'＋ Breadboard ▾','Protoboard completa (830 furos)':'Full breadboard (830 holes)','Meia protoboard (400 furos)':'Half breadboard (400 holes)','Mini protoboard (170 furos)':'Mini breadboard (170 holes)',
 '⟳ Girar':'⟳ Rotate','Apagar':'Delete','Colocar outra protoboard na bancada':'Add another breadboard to the bench','Girar a peça selecionada (R)':'Rotate the selected part (R)','Apagar o que está selecionado (Del)':'Delete the selection (Del)',
 'Mostrar o circuito montado numa protoboard (e voltar ao esquema)':'Show the circuit built on a breadboard (and back to the schematic)','Cor do fio':'Wire color','Esses dois terminais já estão ligados.':'These two terminals are already connected.',
 'Esse item não tem peça física: coloque-o no esquema (desligue o modo Protoboard).':'This item has no physical part: place it in the schematic (turn Breadboard mode off).','Modo Protoboard':'Breadboard mode',
 'Diagramas ladder, Grafcet, pneumática e itens virtuais não têm peça física':'Ladder, Grafcet, pneumatic and virtual items have no physical part','Protoboards':'Breadboards','Protoboard':'Breadboard','Meia protoboard':'Half breadboard','Mini protoboard':'Mini breadboard','Componentes básicos':'Basic components','Energia':'Power','Transistores, reguladores e relés':'Transistors, regulators and relays','Sensores e entradas':'Sensors and inputs','Saídas, motores e telas':'Outputs, motors and displays','Microcontroladores e conectores':'Microcontrollers and connectors','Circuitos integrados':'Integrated circuits','Instrumentos':'Instruments','⚡ Montar na protoboard':'⚡ Build on breadboard','Encaixa sozinho as peças da bancada na protoboard e liga com jumpers':'Places the bench parts on the breadboard and wires them with jumpers','Todas as peças já estão na protoboard.':'All parts are already on the breadboard.',
 'Clique nos botões, chaves e sensores para operar. Shift + clique segura uma botoeira apertada.':'Click buttons, switches and sensors to operate them. Shift + click holds a push button down.',
 'Clique noutro terminal ou furo para terminar o fio. Clique no vazio para fazer uma curva. Esc ou botão direito cancela.':'Click another terminal or hole to finish the wire. Click an empty spot to make a bend. Esc or right click cancels.',
 'Arraste as peças para os furos. Clique num terminal ou furo para puxar um fio. Fio selecionado: arraste a ponta para trocar de terminal; duplo clique cria curva. Arraste o vazio para selecionar; botão direito ou do meio move a vista.':'Drag parts into the holes. Click a terminal or hole to pull a wire. Selected wire: drag its end to another terminal; double click adds a bend. Drag on empty space to select; right or middle button moves the view.',
 'Aproximei para você acertar o terminal. Clique de novo.':'Zoomed in so you can hit the right terminal. Click again.','A protoboard está vazia.':'The breadboard is empty.','Não consegui gerar a imagem da protoboard.':'Could not create the breadboard image.',
 'Barramento':'Rail','Arraste para mudar a ponta do fio':'Drag to move the wire end','Não consegui baixar o arquivo.':'Could not download the file.','Usar a protoboard neste projeto (botão Protoboard e montagem sincronizada)':'Use the breadboard in this project (Breadboard button and synced assembly)','Protoboard ativada neste projeto.':'Breadboard turned on for this project.','Protoboard desligada neste projeto. As ligações viraram fios normais do esquema.':'Breadboard turned off for this project. Its connections became normal schematic wires.'});
I18N_PHR.push(['Ligação desfeita também na protoboard','Connection also undone on the breadboard'],['saíram da placa','left the board'],['saiu da placa','left the board'],['jumper retirado','jumper removed']);
Object.keys(PBW).forEach(k=>{I18N_EXACT['Fio '+PBW[k][0].toLowerCase()]=({verde:'Green',vermelho:'Red',preto:'Black',azul:'Blue',amarelo:'Yellow',laranja:'Orange',branco:'White',roxo:'Purple',cinza:'Gray',marrom:'Brown',rosa:'Pink',ciano:'Cyan'})[k]+' wire'});
I18N_PHR.push(['item(ns) só no esquema','item(s) only in the schematic'],['fio(s)','wire(s)'],['Não consegui baixar o arquivo','Could not download the file']);
renderAll();
