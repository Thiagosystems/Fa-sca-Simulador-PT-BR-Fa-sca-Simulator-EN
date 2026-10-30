/* ================= circuitos integrados (DIP) e componentes eletrônicos novos ================= */
const ICDEG={s:null,n:-1,m:{}};
function pinDeg(){const W=allWires();if(ICDEG.s!==S||ICDEG.n!==W.length||ICDEG.w!==S.wires){const m={};for(const w of W)for(const e of[w.a,w.b]){const k=K(e.c,e.t);m[k]=(m[k]||0)+1}ICDEG.m=m;ICDEG.s=S;ICDEG.n=W.length;ICDEG.w=S.wires}return ICDEG.m}
const icSt=c=>{rt.ic=rt.ic||{};return rt.ic[c.id]||(rt.ic[c.id]={out:{},prev:{}})};
const FAM={hc:[2,6.5,'74HC (2 a 6 V)'],cd:[3,18,'CD4000 (3 a 18 V)'],bip:[4.5,16,'NE555 (4,5 a 16 V)'],cmp:[2,36,'LM393 (2 a 36 V)'],drv:[4.5,7,'L293D (lógica 4,5 a 7 V)']};
const SEG={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
const QUAD=['1A','1B','1Y','2A','2B','2Y','GND','3Y','3A','3B','4Y','4A','4B','VCC'],HEX=['1A','1Y','2A','2Y','3A','3Y','GND','4Y','4A','5Y','5A','6Y','6A','VCC'];
const gate4=(n,d,f,fam)=>({n,d,fam:fam||'hc',pins:QUAD,vcc:14,gnd:7,ins:[1,2,4,5,9,10,12,13],ev:I=>({3:f(I(1),I(2)),6:f(I(4),I(5)),8:f(I(9),I(10)),11:f(I(12),I(13))})});
const ICS={
 '74HC00':gate4('74HC00','4 portas NAND',(a,b)=>!(a&&b)),
 '74HC02':{n:'74HC02',d:'4 portas NOR',fam:'hc',pins:['1Y','1A','1B','2Y','2A','2B','GND','3A','3B','3Y','4A','4B','4Y','VCC'],vcc:14,gnd:7,ins:[2,3,5,6,8,9,11,12],
  ev:I=>({1:!(I(2)||I(3)),4:!(I(5)||I(6)),10:!(I(8)||I(9)),13:!(I(11)||I(12))})},
 '74HC04':{n:'74HC04',d:'6 inversores (NOT)',fam:'hc',pins:HEX,vcc:14,gnd:7,ins:[1,3,5,9,11,13],ev:I=>({2:!I(1),4:!I(3),6:!I(5),8:!I(9),10:!I(11),12:!I(13)})},
 '74HC08':gate4('74HC08','4 portas AND',(a,b)=>a&&b),
 '74HC14':{n:'74HC14',d:'6 inversores Schmitt trigger',fam:'hc',pins:HEX,vcc:14,gnd:7,ins:[1,3,5,9,11,13],
  ev:(I,st,V,vcc)=>{st.h=st.h||{};const o={};[[1,2],[3,4],[5,6],[9,8],[11,10],[13,12]].forEach(([a,y])=>{const v=V(a);if(v>.6*vcc)st.h[a]=true;else if(v<.4*vcc)st.h[a]=false;o[y]=!st.h[a]});return o}},
 '74HC32':gate4('74HC32','4 portas OR',(a,b)=>a||b),
 '74HC86':gate4('74HC86','4 portas XOR',(a,b)=>a!==b),
 '74HC74':{n:'74HC74',d:'2 flip-flops tipo D',fam:'hc',pins:['~1CLR','1D','1CLK','~1PRE','1Q','~1Q','GND','~2Q','2Q','~2PRE','2CLK','2D','~2CLR','VCC'],vcc:14,gnd:7,ins:[1,2,3,4,10,11,12,13],ctl:{1:true,4:true,10:true,13:true},
  clk:(I,st,P)=>{st.q=st.q||[false,false];[[3,2,0],[11,12,1]].forEach(([k,d,u])=>{if(I(k)&&!P[k])st.q[u]=I(d)})},
  ev:(I,st)=>{st.q=st.q||[false,false];const o={};[[1,4,5,6,0],[13,10,9,8,1]].forEach(([clr,pre,q,qn,u])=>{const C=!I(clr),Pr=!I(pre);if(C&&Pr){o[q]=true;o[qn]=true;return}if(C)st.q[u]=false;else if(Pr)st.q[u]=true;o[q]=st.q[u];o[qn]=!st.q[u]});return o}},
 '74HC138':{n:'74HC138',d:'Decodificador 3 para 8',fam:'hc',pins:['A','B','C','~G2A','~G2B','G1','~Y7','GND','~Y6','~Y5','~Y4','~Y3','~Y2','~Y1','~Y0','VCC'],vcc:16,gnd:8,ins:[1,2,3,4,5,6],ctl:{6:true},
  ev:I=>{const en=I(6)&&!I(4)&&!I(5),s=(I(1)?1:0)+(I(2)?2:0)+(I(3)?4:0),Y=[15,14,13,12,11,10,9,7],o={};Y.forEach((p,k)=>o[p]=!(en&&k===s));return o}},
 '74HC161':{n:'74HC161',d:'Contador binário síncrono 4 bits',fam:'hc',pins:['~CLR','CLK','A','B','C','D','ENP','GND','~LOAD','ENT','QD','QC','QB','QA','RCO','VCC'],vcc:16,gnd:8,ins:[1,2,3,4,5,6,7,9,10],ctl:{1:true,7:true,9:true,10:true},
  clk:(I,st,P)=>{st.n=st.n||0;if(I(2)&&!P[2]&&I(1)){if(!I(9))st.n=(I(3)?1:0)+(I(4)?2:0)+(I(5)?4:0)+(I(6)?8:0);else if(I(7)&&I(10))st.n=(st.n+1)&15}},
  ev:(I,st)=>{if(!I(1))st.n=0;const n=st.n||0;return{14:!!(n&1),13:!!(n&2),12:!!(n&4),11:!!(n&8),15:I(10)&&n===15}}},
 '74HC595':{n:'74HC595',d:'Registrador de deslocamento 8 bits (serial → paralelo)',fam:'hc',pins:['QB','QC','QD','QE','QF','QG','QH','GND',"QH'",'~SRCLR','SRCLK','RCLK','~OE','SER','QA','VCC'],vcc:16,gnd:8,ins:[10,11,12,13,14],ctl:{10:true,13:false},
  clk:(I,st,P)=>{st.sr=st.sr||0;st.lt=st.lt||0;const old=st.sr;if(!I(10))st.sr=0;else if(I(11)&&!P[11])st.sr=((st.sr<<1)|(I(14)?1:0))&255;if(I(12)&&!P[12])st.lt=I(11)&&!P[11]?old:st.sr},
  ev:(I,st)=>{if(!I(10))st.sr=0;const o={9:!!((st.sr||0)&128)},Q=[15,1,2,3,4,5,6,7],oe=!I(13);Q.forEach((p,k)=>o[p]=oe?!!(((st.lt||0)>>k)&1):null);return o}},
 'CD4017':{n:'CD4017',d:'Contador de década (10 saídas)',fam:'cd',pins:['Q5','Q1','Q0','Q2','Q6','Q7','Q3','VSS','Q8','Q4','Q9','CO','INH','CLK','RST','VDD'],vcc:16,gnd:8,ins:[13,14,15],ctl:{13:false,15:false},
  clk:(I,st,P)=>{st.n=st.n||0;if(I(14)&&!P[14]&&!I(13)&&!I(15))st.n=(st.n+1)%10},
  ev:(I,st)=>{if(I(15))st.n=0;const n=st.n||0,Q=[3,2,4,7,10,1,5,6,9,11],o={12:n<5};Q.forEach((p,k)=>o[p]=k===n);return o}},
 'CD4511':{n:'CD4511',d:'Decodificador BCD para display de 7 segmentos',fam:'cd',pins:['B','C','~LT','~BL','LE','D','A','VSS','e','d','c','b','a','g','f','VDD'],vcc:16,gnd:8,ins:[1,2,3,4,5,6,7],ctl:{3:true,4:true,5:false},
  ev:(I,st)=>{if(!I(5))st.bcd=(I(7)?1:0)+(I(1)?2:0)+(I(2)?4:0)+(I(6)?8:0);const lt=!I(3),bl=!I(4),s=lt?'abcdefg':bl?'':(SEG[st.bcd||0]||''),P={a:13,b:12,c:11,d:10,e:9,f:15,g:14},o={};for(const k in P)o[P[k]]=s.includes(k);return o}},
 'CD4011':gate4('CD4011','4 portas NAND (CMOS)',(a,b)=>!(a&&b),'cd'),
 'CD4081':gate4('CD4081','4 portas AND (CMOS)',(a,b)=>a&&b,'cd'),
 'CD4071':gate4('CD4071','4 portas OR (CMOS)',(a,b)=>a||b,'cd'),
 'CD4070':gate4('CD4070','4 portas XOR (CMOS)',(a,b)=>a!==b,'cd'),
 'CD4069':{n:'CD4069',d:'6 inversores (CMOS)',fam:'cd',pins:HEX,vcc:14,gnd:7,ins:[1,3,5,9,11,13],ev:I=>({2:!I(1),4:!I(3),6:!I(5),8:!I(9),10:!I(11),12:!I(13)})},
 'CD4013':{n:'CD4013',d:'2 flip-flops tipo D (CMOS)',fam:'cd',pins:['1Q','~1Q','1CLK','1RST','1D','1SET','VSS','2SET','2D','2RST','2CLK','~2Q','2Q','VDD'],vcc:14,gnd:7,ins:[3,4,5,6,8,9,10,11],
  clk:(I,st,P)=>{st.q=st.q||[false,false];[[3,5,0],[11,9,1]].forEach(([k,d,u])=>{if(I(k)&&!P[k])st.q[u]=I(d)})},
  ev:(I,st)=>{st.q=st.q||[false,false];const o={};[[4,6,1,2,0],[10,8,13,12,1]].forEach(([rs,se,q,qn,u])=>{const R=I(rs),St=I(se);if(R&&St){o[q]=true;o[qn]=true;return}if(R)st.q[u]=false;else if(St)st.q[u]=true;o[q]=st.q[u];o[qn]=!st.q[u]});return o}},
 '74HC151':{n:'74HC151',d:'Multiplexador 8 para 1',fam:'hc',pins:['D3','D2','D1','D0','Y','~W','~G','GND','C','B','A','D7','D6','D5','D4','VCC'],vcc:16,gnd:8,ins:[1,2,3,4,7,9,10,11,12,13,14,15],ctl:{7:false},
  ev:I=>{const D=[4,3,2,1,15,14,13,12],s=(I(11)?1:0)+(I(10)?2:0)+(I(9)?4:0),y=!I(7)&&I(D[s]);return{5:y,6:!y}}},
 'NE555':{n:'NE555',d:'Temporizador (astável / monoestável)',fam:'bip',pins:['GND','~TRIG','OUT','~RESET','CTRL','THR','DIS','VCC'],vcc:8,gnd:1,ins:[2,4,6],ctl:{4:true},vh:v=>Math.max(0,v-1.5),
  an:(c,x)=>{x.r(c,7,4,5000);x.r(c,4,0,10000)},
  ev:(I,st,V)=>{const vc=V(5);if(!I(4))st.q=false;else if(V(2)<vc/2)st.q=true;else if(V(6)>vc)st.q=false;return{3:!!st.q,7:st.q?null:'sink'}}},
 'ULN2003':{n:'ULN2003',d:'7 drivers Darlington (aciona relés, motores e lâmpadas)',fam:null,pins:['IN1','IN2','IN3','IN4','IN5','IN6','IN7','GND','COM','OUT7','OUT6','OUT5','OUT4','OUT3','OUT2','OUT1'],gnd:8,ins:[1,2,3,4,5,6,7],thr:2.5,vsat:.9,rsink:2,
  an:(c,x)=>{for(let i=0;i<7;i++)x.r(c,i,7,2700)},ev:I=>{const o={};for(let k=1;k<=7;k++)o[17-k]=I(k)?'sink':null;return o}},
 'L293D':{n:'L293D',d:'Ponte H dupla (aciona 2 motores CC)',fam:'drv',pins:['EN1,2','1A','1Y','GND','GND','2Y','2A','VCC2','EN3,4','3A','3Y','GND','GND','4Y','4A','VCC1'],vcc:16,gnd:4,ins:[1,2,7,9,10,15],ctl:{1:true,9:true},rs:1,vh:(v,V)=>Math.max(0,V(8)-1.4),
  an:(c,x)=>{x.r(c,3,4,.01);x.r(c,3,11,.01);x.r(c,3,12,.01)},
  ev:I=>{const a=I(1),b=I(9);return{3:a?I(2):null,6:a?I(7):null,11:b?I(10):null,14:b?I(15):null}}},
 'LM393':{n:'LM393',d:'Comparador duplo (saída coletor aberto)',fam:'cmp',pins:['1OUT','1IN−','1IN+','GND','2IN+','2IN−','2OUT','VCC'],vcc:8,gnd:4,ins:[],
  ev:(I,st,V)=>({1:V(3)>V(2)?null:'sink',7:V(5)>V(6)?null:'sink'})},
 'PC817':{n:'PC817',d:'Optoacoplador (isola entrada e saída)',fam:null,pins:['A','K','E','C'],ins:[],
  an:(c,x)=>{x.dio(c,0,1,1.15,15);x.r(c,3,2,icSt(c).on?60:1e8)},
  edge:(c,X)=>{const st=icSt(c),on=X.vdc(0)-X.vdc(1)>1.17;if(on!==!!st.on){st.on=on;return true}return false}},
};
const icSpec=c=>ICS[c.k]||ICS['74HC00'];
/* pinos sempre na grade de 20 (x = ±80; y múltiplo de 20), para os fios saírem retos */
function dipGeo(n){const h=n/2,y0=h%2?-((h-1)/2)*20:-(h/2-1)*20;return{h,y0,pos:p=>p<=h?[-80,y0+(p-1)*20]:[80,y0+(n-p)*20]}}
const ovName=s=>s[0]==='~'?`<tspan text-decoration="overline">${esc(s.slice(1))}</tspan>`:esc(s);
function icPins(c){const sp=icSpec(c),n=sp.pins.length;return{sp,n,g:dipGeo(n)}}
Object.assign(DEFS,{ic:{n:'Circuito integrado',own:'U',def:{k:'74HC00'},F:[['k','Circuito integrado','sel',Object.keys(ICS).map(k=>[k,`${k} — ${ICS[k].d}`])]],
 T:c=>{const{sp,n,g}=icPins(c);return sp.pins.map((_,i)=>g.pos(i+1))},N:c=>icSpec(c).pins.map((p,i)=>`${i+1} ${p.replace('~','/')}`),
 B:c=>{const{g}=icPins(c);return[-82,g.y0-22,164,(g.h-1)*20+44]},
 act:()=>false,
 draw:c=>{const{sp,n,g}=icPins(c),top=g.y0-14,bot=g.y0+(g.h-1)*20+14;let s=R(-50,top,100,bot-top,'box',' rx="3"')+P(`M-7,${top}A7,7 0 0 0 7,${top}`);
  const A=SIM()&&rt.A&&!rt.burnt[c.id]?rt.A:null,gi=(sp.gnd||1)-1,vg=A?A.vdc(K(c.id,gi)):0,vcc=A&&sp.vcc?A.vdc(K(c.id,sp.vcc-1))-vg:5;
  sp.pins.forEach((nm,i)=>{const p=i+1,[x,y]=g.pos(p),L0=x<0,hi=A&&p!==sp.vcc&&p!==sp.gnd&&vcc>1&&A.vdc(K(c.id,i))-vg>vcc/2;
   s+=L(x,y,L0?-50:50,y,hi?'on':'')+`<text x="${L0?-64:64}" y="${y-3}" class="tn6">${p}</text><text x="${L0?-46:46}" y="${y+3}" class="icn" style="text-anchor:${L0?'start':'end'}">${ovName(nm)}</text>`});
  if(c.k==='PC817')s+=`<text x="0" y="${top-6}" class="icp">PC817</text>`+P('M-22,-6H-14M-22,6H-14M-18,-6V-4l-5,-6h10z')+L(-23,-1,-13,-1)+P('M-8,-4l6,2M-8,4l6,2','dash')+L(4,-10,4,10)+P('M4,-4l10,-6M4,4l10,6M10,8l4,2l-1,-4');
  else s+=`<text x="0" y="0" class="icp" transform="rotate(-90 0 0)">${esc(sp.n)}</text>`;return s},
 an:(c,x)=>{const sp=icSpec(c),g=(sp.gnd||1)-1;if(sp.vcc)x.r(c,sp.vcc-1,g,1e5);(sp.ins||[]).forEach(p=>x.r(c,p-1,g,1e6));if(sp.an)sp.an(c,x)},
 edge:(c,X)=>{const sp=icSpec(c);if(rt.burnt[c.id])return false;if(sp.edge)return sp.edge(c,X);const st=icSt(c),g=(sp.gnd||1)-1,fam=FAM[sp.fam],deg=pinDeg();
  const V=p=>X.vdc(p-1)-X.vdc(g),vcc=sp.vcc?V(sp.vcc):5;
  if(fam&&vcc>fam[1]*1.12){rt.burnt[c.id]=`${fmtE(vcc,'V')} de alimentação num ${sp.n} (máximo ${fmtE(fam[1],'V')})`;logE(`${c.tag} (${sp.n}) queimou: alimentação de ${fmtE(vcc,'V')}`,'e');return true}
  const pw=!fam||vcc>=fam[0];if(!pw){const had=Object.keys(st.out).length;st.out={};st.pow=false;return had>0}st.pow=true;
  const thr=sp.thr!=null?sp.thr:vcc/2,I=p=>{if(!deg[K(c.id,p-1)])return sp.ctl&&p in sp.ctl?sp.ctl[p]:false;return V(p)>thr};
  if(sp.clk){sp.clk(I,st,st.prev,V,vcc);const pv={};(sp.ins||[]).forEach(p=>pv[p]=I(p));st.prev=pv}
  const o=sp.ev?sp.ev(I,st,V,vcc):{},a=JSON.stringify(o);if(a!==st.sig){st.sig=a;st.out=o;return true}return false},
 der:(c,X)=>{const sp=icSpec(c);if(rt.burnt[c.id]||sp.edge)return;const st=icSt(c);if(!st.pow&&sp.fam)return;const g=(sp.gnd||1)-1,vg=X.vdc(g),V=p=>X.vdc(p-1)-vg,vcc=sp.vcc?V(sp.vcc):5;
  for(const k in st.out){const v=st.out[k],i=+k-1;if(v===true){const h=sp.vh?sp.vh(vcc,V):vcc;X.push(i,`${c.tag}.${k}${h>.05?':+':':-'}`,vg+h,sp.rs||40)}
   else if(v===false)X.push(i,`${c.tag}.${k}:-`,vg,sp.rs||40);else if(v==='sink')X.push(i,`${c.tag}.${k}:-`,vg+(sp.vsat||.1),sp.rsink||8)}},
 say:c=>{const sp=icSpec(c),st=rt.ic&&rt.ic[c.id];if(rt.burnt[c.id])return null;if(sp.fam&&!(st&&st.pow))return['w',`${c.tag} (${sp.n}) sem alimentação`];
  if(c.k==='74HC595'&&st)return['on',`${c.tag} (74HC595): registrador ${(st.sr||0).toString(2).padStart(8,'0')}, saídas ${(st.lt||0).toString(2).padStart(8,'0')}`];
  if((c.k==='CD4017'||c.k==='74HC161')&&st)return['on',`${c.tag} (${sp.n}): contagem ${st.n||0}`];
  if(c.k==='NE555'&&st)return['on',`${c.tag} (NE555): saída ${st.q?'alta':'baixa'}`];return null}},

/* display de 7 segmentos (pinagem comum: 10 pinos) */
seg7:{n:'Display de 7 segmentos',own:'DS',def:{ca:false,col:'vermelha'},F:[['ca','Ânodo comum (desmarcado = cátodo comum)','bool'],['col','Cor','sel',['vermelha','verde','amarela','azul','branca']]],
 T:[[-40,-80],[-20,-80],[0,-80],[20,-80],[40,-80],[-40,80],[-20,80],[0,80],[20,80],[40,80]],N:['g','f','COM','a','b','e','d','COM','c','DP'],B:[-52,-80,104,160],
 an:(c,x)=>{x.r(c,2,7,.01);[0,1,3,4,5,6,8,9].forEach(i=>c.ca?x.r(c,2,i,600):x.r(c,i,2,600))},
 draw:c=>{const A=SIM()&&rt.A&&!rt.burnt[c.id]?rt.A:null,col=LCOL[c.col]||LCOL.vermelha,on=i=>A&&(c.ca?-1:1)*(A.vdc(K(c.id,i))-A.vdc(K(c.id,2)))>1.6,
  sg={a:[3,'M-14,-40H14'],b:[4,'M18,-36V-4'],c:[8,'M18,4V36'],d:[6,'M-14,40H14'],e:[5,'M-18,4V36'],f:[1,'M-18,-36V-4'],g:[0,'M-14,0H14']};
  let s=R(-52,-62,104,124,'box',' rx="4"');for(const k in sg){const[i,d]=sg[k],l=on(i);s+=`<path d="${d}" style="stroke:${l?col:'color-mix(in srgb,var(--muted) 30%,transparent)'};stroke-width:6;${l?`filter:drop-shadow(0 0 4px ${col})`:''}"/>`}
  s+=`<circle cx="27" cy="41" r="3.5" style="fill:${on(9)?col:'color-mix(in srgb,var(--muted) 30%,transparent)'};stroke:none"/>`;
  [[-40,-80],[-20,-80],[0,-80],[20,-80],[40,-80],[-40,80],[-20,80],[0,80],[20,80],[40,80]].forEach(([x,y],i)=>{s+=L(x,y,x,y<0?-62:62)+`<text x="${x}" y="${y<0?-54:58}" class="tn6">${['g','f','COM','a','b','e','d','COM','c','DP'][i]}</text>`});return s}},

/* regulador de tensão 78xx / 1117 */
vreg:{n:'Regulador de tensão',own:'U',def:{V:5},F:[['V','Tensão de saída','sel',[['5','7805 (5 V)'],['9','7809 (9 V)'],['12','7812 (12 V)'],['3.3','AMS1117 (3,3 V)']]]],
 T:[[-60,0],[0,40],[60,0]],N:['IN','GND','OUT'],B:[-60,-22,120,62],
 draw:c=>R(-30,-18,60,36,'box',' rx="3"')+L(-60,0,-30,0)+L(60,0,30,0)+L(0,18,0,40)+T(0,-2,+c.V===3.3?'1117':'78'+String(c.V).padStart(2,'0'),c.r,'lv')+T(0,12,`${String(c.V).replace('.',DEC)} V`,c.r,'tn6')+T(-40,-4,'IN',c.r,'tn6')+T(40,-4,'OUT',c.r,'tn6')+T(8,32,'GND',c.r,'tn6'),
 an:(c,x)=>x.r(c,0,1,20000),
 der:(c,X)=>{const V0=+c.V||5,vin=X.vdc(0)-X.vdc(1),vo=Math.max(0,Math.min(V0,vin-(V0===3.3?1.1:2)));X.push(2,c.tag+'.o'+(vo>.05?':+':':-'),X.vdc(1)+vo,.05)},
 val:c=>`${String(c.V).replace('.',DEC)} V`},

/* sensor de temperatura LM35 (10 mV/°C) */
lm35:{n:'Sensor de temperatura LM35',own:'U',act:1,def:{temp:25},F:[['temp','Temperatura (°C)','num',null,LV]],T:[[-20,40],[0,40],[20,40]],N:['+Vs','Vout','GND'],B:[-26,-30,52,70],
 draw:c=>P('M-18,10V-6A18,18 0 0 1 18,-6V10Z','box')+L(-20,40,-20,10)+L(0,40,0,10)+L(20,40,20,10)+T(0,0,'LM35',c.r,'tn6')+T(0,-22,`${c.temp} °C`,c.r,'lv')+T(-26,30,'+Vs',c.r,'tn6')+T(26,30,'GND',c.r,'tn6'),
 an:(c,x)=>x.r(c,0,2,1e5),der:(c,X)=>{if(X.vdc(0)-X.vdc(2)>=4)X.push(1,c.tag+'.o:+',X.vdc(2)+(+c.temp||0)/100,100)},
 click:c=>{c.temp=((+c.temp||0)+10)%160;logE(`${c.tag}: ${c.temp} °C`,'a')},val:c=>`${c.temp} °C`},

/* LDR (resistor que varia com a luz) */
ldr:{n:'LDR (sensor de luz)',own:'LDR',act:1,def:{lux:50},F:[['lux','Luz (%)','num',null,LV]],T:V2,N:['1','2'],B:[-24,-40,48,80],
 draw:c=>L(0,-40,0,-18)+L(0,18,0,40)+R(-8,-18,16,36,'box')+P('M-22,-20l8,8M-20,-8l8,8')+P('M-14,-12l2,-4l2,4M-12,0l2,-4l2,4','fillink')+T(0,-24,`${c.lux}%`,c.r,'tn6'),
 an:(c,x)=>x.r(c,0,1,Math.pow(10,6-4*Math.max(0,Math.min(100,+c.lux||0))/100)),
 click:c=>{c.lux=((+c.lux||0)+25)%125;logE(`${c.tag}: luz ${c.lux}%`,'a')},val:c=>`${c.lux}% luz`}});

/* terminais de CI sem uso não geram aviso; avisos próprios para alimentação e pinos de controle soltos */
{const _an=analyze;analyze=function(){const r=_an();if(!r||!r.issues)return r;const deg=pinDeg();
 r.issues=r.issues.filter(i=>{if(!(i.ids&&i.ids.length===1&&/terminal.*solt/.test(i.msg)))return true;const c=byId(i.ids[0])||{};if(['ic','seg7'].includes(c.type))return false;
  if(c.type==='pot'&&/terminal (1|2) solt/.test(i.msg)&&deg[K(c.id,2)])return false;return true});
 for(const c of S.comps){if(c.type!=='ic')continue;const sp=icSpec(c),any=termsOf(c).some((_,i)=>deg[K(c.id,i)]);if(!any)continue;
  if(sp.vcc&&(!deg[K(c.id,sp.vcc-1)]||!deg[K(c.id,sp.gnd-1)]))r.issues.push({lvl:'aviso',msg:`${c.tag} (${sp.n}) sem alimentação`,why:`Ligue VCC no pino ${sp.vcc} e GND no pino ${sp.gnd}. Faixa: ${FAM[sp.fam]?FAM[sp.fam][2]:'—'}.`,ids:[c.id]});
  for(const p in sp.ctl||{})if(!deg[K(c.id,p-1)])r.issues.push({lvl:'info',msg:`${c.tag} (${sp.n}): pino ${p} (${sp.pins[p-1].replace('~','/')}) solto`,why:`No circuito real esse pino não pode ficar solto. O Faísca considera nível ${sp.ctl[p]?'alto (VCC)':'baixo (GND)'}; ligue-o assim na montagem.`,ids:[c.id]})}
 const ne=r.issues.filter(i=>i.lvl==='erro').length,nw=r.issues.filter(i=>i.lvl==='aviso').length,k=(r.summary||[]).findIndex(x=>/ erro\(s\) e |Nenhum problema encontrado/.test(x[1]));
 if(k>=0)r.summary[k]=[ne?'e':nw?'w':'ok',ne||nw?`${ne} erro(s) e ${nw} aviso(s). Veja a aba Problemas.`:r.summary[k][1].startsWith('Nenhum')?r.summary[k][1]:'Nenhum problema encontrado no esquema'];
 return r}}

/* paleta */
const ICSH={'74HC00':'NAND','74HC02':'NOR','74HC04':'NOT','74HC08':'AND','74HC14':'NOT Schmitt','74HC32':'OR','74HC86':'XOR','74HC74':'flip-flop D','74HC138':'decodificador','74HC161':'contador 4 bits','74HC595':'registrador','CD4017':'contador de década','CD4511':'BCD → 7 seg.','NE555':'temporizador','ULN2003':'driver 7 canais','L293D':'ponte H','LM393':'comparador','PC817':'optoacoplador','CD4011':'NAND','CD4081':'AND','CD4071':'OR','CD4070':'XOR','CD4069':'NOT','CD4013':'flip-flop D','74HC151':'multiplexador'};
PAL.push(['19. Circuitos integrados e sensores',[...Object.keys(ICS).map(k=>[`${k} ${ICSH[k]||''}`.trim(),'ic',{k}]),['Display 7 segmentos (cátodo comum)','seg7',{ca:false}],['Display 7 segmentos (ânodo comum)','seg7',{ca:true}],
 ['Regulador 7805 (5 V)','vreg',{V:5}],['Regulador 7812 (12 V)','vreg',{V:12}],['Regulador AMS1117 (3,3 V)','vreg',{V:3.3}],['Sensor de temperatura LM35','lm35',{}],['LDR (sensor de luz)','ldr',{}]]]);
{const st=document.createElement('style');st.textContent=`#world text.icn{font:600 7px 'IBM Plex Mono',monospace;fill:var(--muted)}#world text.icp{font:700 11px 'IBM Plex Mono',monospace;text-anchor:middle;fill:var(--ink);dominant-baseline:middle}.pitem svg .icn,.pitem svg .tn6{display:none}`;document.head.appendChild(st)}

/* ================= modelos prontos com CIs ================= */
{const mk=window.mkTpl=(key,build)=>{const _lt=loadTpl;loadTpl=function(k,noHist){if(k!==key)return _lt(k,noHist);
 if(!noHist)pushHist();S={comps:[],wires:[],seq:1};const R0={};let n=1;
 const a=(kk,type,x,y,o={})=>{const c={...makeComp(type,o),id:'c'+n++,x,y,r:o.r||0};delete c.nm;S.comps.push(c);R0[kk]=c},
  w=(p,i,q,j,o,m)=>{const x={id:'w'+n++,a:{c:R0[p].id,t:i},b:{c:R0[q].id,t:j}};if(o){x.o=o;x.m=m}S.wires.push(x)},j=(kk,x,y)=>a(kk,'junction',x,y),tx=(kk,x,y,text)=>a(kk,'note',x,y,{text:LANG==='en'&&typeof tr==='function'?tr(text):text});
 const dd=build(a,w,j,tx);S.seq=n;tplSheets(k);S.doc.fr=false;if(dd)Object.assign(S.doc,dd);sel=null;tool=null;commit();requestAnimationFrame(fit)}};
 /* NE555 astável: pisca-pisca */
 mk('555',(a,w,j,tx)=>{tx('T1',140,80,'PISCA-PISCA COM NE555 (ASTÁVEL)');
  a('U','ic',400,300,{k:'NE555',tag:'U1'});
  a('PP','src',600,80,{v:'+',V:9});j('JA',600,160);w('PP',0,'JA',0);w('JA',0,'U',7,'h',520);
  a('R1','res',600,220,{R:10000,tag:'R1'});w('JA',0,'R1',0);j('JD',600,300);w('R1',1,'JD',0);w('JD',0,'U',6);
  a('R2','res',600,360,{R:47000,tag:'R2'});w('JD',0,'R2',0);j('JT',600,440);w('R2',1,'JT',0);
  a('C1','cap',600,500,{Cf:22e-6,Vmax:25,tag:'C1'});w('JT',0,'C1',0);a('M1','src',600,600,{v:'-',r:180});w('C1',1,'M1',0);
  j('JX',520,440);w('U',1,'JX',0,'h',220);w('JX',0,'JT',0);w('JX',0,'U',5,'h',520);
  a('M0','src',300,220,{v:'-'});w('U',0,'M0',0,'h',300);
  a('PR','src',270,380,{v:'+',V:9,r:180});w('U',3,'PR',0,'h',270);
  a('R3','res',160,380,{R:470,tag:'R3'});w('U',2,'R3',0,'h',160);a('H1','led',160,480,{col:'vermelha',tag:'H1'});w('R3',1,'H1',0);a('M2','src',160,580,{v:'-',r:180});w('H1',1,'M2',0);
  tx('N1',700,180,'R1 = 10 kΩ, R2 = 47 kΩ, C1 = 22 µF');tx('N2',700,210,'f ≈ 1,44 / ((R1 + 2·R2) · C1) ≈ 0,6 Hz');
  tx('N3',700,250,'C1 carrega por R1 + R2 até 2/3 de 9 V (6 V): a saída (pino 3) desliga.');tx('N4',700,280,'C1 descarrega por R2 pelo pino 7 até 1/3 (3 V): a saída liga de novo.');
  tx('N5',700,320,'Troque R2 ou C1 para mudar a velocidade do pisca.')});
 /* 74HC595: 8 LEDs controlados por 3 botões */
 mk('595',(a,w,j,tx)=>{tx('T1',100,80,'REGISTRADOR DE DESLOCAMENTO 74HC595 COM 8 LEDS');
  a('U','ic',640,300,{k:'74HC595',tag:'U1'});
  a('PV','src',740,180,{v:'+',V:5});w('U',15,'PV',0,'h',740);a('MG','src',560,440,{v:'-',r:180});w('U',7,'MG',0);
  const led=(kk,pin,x,tag)=>{a('R'+kk,'res',x,480,{R:330,tag:'R'+tag.slice(1)});w('U',pin,'R'+kk,0,'h',x);a('L'+kk,'led',x,580,{col:'vermelha',tag});w('R'+kk,1,'L'+kk,0);a('M'+kk,'src',x,680,{v:'-',r:180});w('L'+kk,1,'M'+kk,0)};
  for(let p=1;p<=7;p++)led('q'+p,p-1,500-80*(7-p),'H'+(p+1));led('qa',14,1180,'H1');
  a('PC','src',780,440,{v:'+',V:5,r:180});w('U',9,'PC',0,'h',780);
  a('S2','btn',860,480,{tag:'S2'});w('U',10,'S2',0,'h',860);a('P2','src',860,580,{v:'+',V:5,r:180});w('S2',1,'P2',0);
  a('S3','btn',940,480,{tag:'S3'});w('U',11,'S3',0,'h',940);a('P3','src',940,580,{v:'+',V:5,r:180});w('S3',1,'P3',0);
  a('MO','src',1020,440,{v:'-',r:180});w('U',12,'MO',0,'h',1020);
  a('S1','btn',1100,480,{tag:'S1',latch:true,kind:'sw'});w('U',13,'S1',0,'h',1100);a('P1','src',1100,580,{v:'+',V:5,r:180});w('S1',1,'P1',0);
  tx('N1',100,120,'1) S1 (SER) escolhe o bit: ligado = 1, desligado = 0.');tx('N2',100,145,'2) Aperte S2 (SRCLK): o bit entra e os outros andam uma casa.');
  tx('N3',100,170,'3) Aperte S3 (RCLK): o que está no registrador aparece nos LEDs H1 (QA) a H8 (QH).');
  tx('N4',700,760,'Na montagem real, ponha um resistor de 10 kΩ do pino de cada botão para o GND (pull-down).')});

 /* Onda de LEDs: NE555 (clock) + 74HC595 + BC548 (contador Johnson) */
 mk('onda',(a,w,j,tx)=>{
  tx('T1',40,-40,'ONDA DE LEDS — NE555 + 74HC595 + BC548');
  tx('N1',40,-10,'O NE555 gera o clock (CLK) de cerca de 1 Hz; RV1 ajusta a velocidade.');
  tx('N2',40,20,'Q1 inverte a saída serial (SQH) e devolve em SER: os LEDs acendem um a um e depois apagam um a um.');
  tx('N3',40,50,'SW1 zera o registrador (RST). Rótulos de rede com o mesmo nome (CLK, SER, RST, SQH, T, QA a QH) estão ligados entre si.');
  tx('N4',40,80,'Gire RV1 só até uns 70%: acima disso o clock fica rápido demais para a simulação (passos de 0,1 s).');
  const P=(kk,x,y,r)=>a(kk,'src',x,y,{v:'+',V:5,r:r||0}),G=(kk,x,y,r)=>a(kk,'src',x,y,{v:'-',r:r==null?180:r}),X=(kk,x,y,net,r)=>a(kk,'netl',x+(r===180?40:-40),y,{net,r:r||0});
  /* bloco do 555 */
  a('U1','ic',360,280,{k:'NE555',tag:'U1'});
  G('G1',270,200,0);w('U1',0,'G1',0,'h',270);
  X('LT1',230,280,'T',180);w('U1',1,'LT1',0);
  X('LC1',130,300,'CLK',180);w('U1',2,'LC1',0);
  P('P4',250,360,180);w('U1',3,'P4',0,'h',250);
  P('P8',450,200);w('U1',7,'P8',0,'h',450);
  j('A',680,280);w('U1',6,'A',0);
  P('P1',680,140);a('R1','res',680,220,{R:1000,tag:'R1'});w('P1',0,'R1',0);w('R1',1,'A',0);
  a('R2','res',680,340,{R:10000,tag:'R2'});w('A',0,'R2',0);
  a('RV1','pot',680,460,{R:100000,pos:30,tag:'RV1'});w('R2',1,'RV1',0);
  j('TB',500,360);j('T',500,460);w('U1',5,'TB',0,'h',500);w('TB',0,'T',0);X('LT2',560,360,'T');w('TB',0,'LT2',0);w('RV1',2,'T',0);
  a('C1','cap',500,540,{Cf:10e-6,Vmax:25,pol:true,tag:'C1'});w('T',0,'C1',0);G('G2',500,640);w('C1',1,'G2',0);
  a('C2','cap',460,400,{Cf:10e-9,Vmax:50,pol:false,tag:'C2'});w('U1',4,'C2',0,'h',460);G('G3',460,480);w('C2',1,'G3',0);
  P('P6',160,400);a('R6','res',160,480,{R:2200,tag:'R6'});w('P6',0,'R6',0);X('LC2',120,560,'CLK',180);w('R6',1,'LC2',0);
  /* bloco do 74HC595 */
  a('U2','ic',1080,300,{k:'74HC595',tag:'U2'});
  ['QB','QC','QD','QE','QF','QG','QH'].forEach((nt,i)=>{const y=240+20*i,lng=i%2===1;X('LQ'+nt,lng?860:950,y,nt,180);w('U2',i,'LQ'+nt,0)});
  G('G4',1000,440);w('U2',7,'G4',0);
  P('P16',1170,180);w('U2',15,'P16',0,'h',1170);
  P('P3c',1250,60);a('C3','cap',1250,120,{Cf:100e-9,Vmax:50,pol:false,tag:'C3'});G('G3c',1250,200);w('P3c',0,'C3',0);w('C3',1,'G3c',0);
  X('LQA',1210,260,'QA');w('U2',14,'LQA',0);
  X('LSER',1310,280,'SER');w('U2',13,'LSER',0);
  G('GOE',1190,300,90);w('U2',12,'GOE',0);
  X('LRC',1310,320,'CLK');w('U2',11,'LRC',0);
  X('LSC',1210,340,'CLK');w('U2',10,'LSC',0);
  X('LRST',1310,360,'RST');w('U2',9,'LRST',0);
  X('LSQ',1210,380,'SQH');w('U2',8,'LSQ',0);
  /* reset */
  P('P3',1200,420);a('R3','res',1200,500,{R:10000,tag:'R3'});w('P3',0,'R3',0);j('JR',1200,580);w('R3',1,'JR',0);
  a('SW1','btn',1200,660,{tag:'SW1'});w('JR',0,'SW1',0);G('G6',1200,760);w('SW1',1,'G6',0);X('LRST2',1120,580,'RST',180);w('LRST2',0,'JR',0);
  /* transistor */
  a('Q1','npn',1500,520,{tag:'Q1'});X('LSQ2',1300,520,'SQH',180);a('R4','res',1400,520,{R:10000,tag:'R4',r:270});w('LSQ2',0,'R4',0);w('R4',1,'Q1',1);
  G('G5',1520,620);w('Q1',2,'G5',0);j('JC',1520,440);w('Q1',0,'JC',0);P('P5',1520,300);a('R5','res',1520,380,{R:10000,tag:'R5'});w('P5',0,'R5',0);w('R5',1,'JC',0);
  X('LSER2',1460,440,'SER',180);w('LSER2',0,'JC',0);
  /* 8 LEDs */
  ['QA','QB','QC','QD','QE','QF','QG','QH'].forEach((nt,i)=>{const x=220+120*i;X('LL'+nt,x-60,720,nt,180);a('RL'+i,'res',x,800,{R:470,tag:'R'+(7+i)});w('LL'+nt,0,'RL'+i,0,'h',x);
   a('D'+i,'led',x,900,{col:'vermelha',tag:'D'+(i+1)});w('RL'+i,1,'D'+i,0);G('GL'+i,x,1000);w('D'+i,1,'GL'+i,0)});
  return{fr:true,xr:false,titulo:'Onda de LEDs (NE555 + 74HC595)'}});
 const s=document.getElementById('bTpl');if(s&&s.querySelector){const o=s.querySelector('option[value="clpa"]')||s.lastElementChild;
  [['555','Pisca-pisca com NE555'],['595','Registrador 74HC595 com 8 LEDs'],['onda','Onda de LEDs (NE555 + 74HC595)']].reverse().forEach(([v,t])=>{const op=document.createElement('option');op.value=v;op.textContent=t;o.after(op)})}}

/* ================= traduções ================= */
Object.assign(I18N_EXACT,{'Circuito integrado':'Integrated circuit','19. Circuitos integrados e sensores':'19. Integrated circuits and sensors','Display de 7 segmentos':'7-segment display',
 'Ânodo comum (desmarcado = cátodo comum)':'Common anode (unchecked = common cathode)','Regulador de tensão':'Voltage regulator','Tensão de saída':'Output voltage',
 'Sensor de temperatura LM35':'LM35 temperature sensor','Temperatura (°C)':'Temperature (°C)','LDR (sensor de luz)':'LDR (light sensor)','Luz (%)':'Light (%)',
 'Display 7 segmentos (cátodo comum)':'7-segment display (common cathode)','Display 7 segmentos (ânodo comum)':'7-segment display (common anode)',
 'Regulador 7805 (5 V)':'7805 regulator (5 V)','Regulador 7812 (12 V)':'7812 regulator (12 V)','Regulador AMS1117 (3,3 V)':'AMS1117 regulator (3.3 V)',
 'Pisca-pisca com NE555':'NE555 LED flasher','Onda de LEDs (NE555 + 74HC595)':'LED wave (NE555 + 74HC595)','ONDA DE LEDS — NE555 + 74HC595 + BC548':'LED WAVE — NE555 + 74HC595 + BC548',
 'O NE555 gera o clock (CLK) de cerca de 1 Hz; RV1 ajusta a velocidade.':'The NE555 generates a clock (CLK) of about 1 Hz; RV1 sets the speed.',
 'Q1 inverte a saída serial (SQH) e devolve em SER: os LEDs acendem um a um e depois apagam um a um.':'Q1 inverts the serial output (SQH) and feeds it back to SER: the LEDs turn on one by one, then off one by one.',
 'SW1 zera o registrador (RST). Rótulos de rede com o mesmo nome (CLK, SER, RST, SQH, T, QA a QH) estão ligados entre si.':'SW1 clears the register (RST). Labels with the same name (CLK, SER, RST, SQH, T, QA to QH) are connected together.',
 'Gire RV1 só até uns 70%: acima disso o clock fica rápido demais para a simulação (passos de 0,1 s).':'Keep RV1 below about 70%: above that the clock is too fast for the simulation (0.1 s steps).','Registrador 74HC595 com 8 LEDs':'74HC595 shift register with 8 LEDs',
 'PISCA-PISCA COM NE555 (ASTÁVEL)':'NE555 LED FLASHER (ASTABLE)','REGISTRADOR DE DESLOCAMENTO 74HC595 COM 8 LEDS':'74HC595 SHIFT REGISTER WITH 8 LEDS',
 'f ≈ 1,44 / ((R1 + 2·R2) · C1) ≈ 0,6 Hz':'f ≈ 1.44 / ((R1 + 2·R2) · C1) ≈ 0.6 Hz',
 'C1 carrega por R1 + R2 até 2/3 de 9 V (6 V): a saída (pino 3) desliga.':'C1 charges through R1 + R2 up to 2/3 of 9 V (6 V): the output (pin 3) switches off.',
 'C1 descarrega por R2 pelo pino 7 até 1/3 (3 V): a saída liga de novo.':'C1 discharges through R2 into pin 7 down to 1/3 (3 V): the output switches on again.',
 'Troque R2 ou C1 para mudar a velocidade do pisca.':'Change R2 or C1 to change the flashing speed.',
 '1) S1 (SER) escolhe o bit: ligado = 1, desligado = 0.':'1) S1 (SER) chooses the bit: on = 1, off = 0.','2) Aperte S2 (SRCLK): o bit entra e os outros andam uma casa.':'2) Press S2 (SRCLK): the bit goes in and the others move one place.',
 '3) Aperte S3 (RCLK): o que está no registrador aparece nos LEDs H1 (QA) a H8 (QH).':'3) Press S3 (RCLK): the register contents appear on LEDs H1 (QA) to H8 (QH).',
 'Na montagem real, ponha um resistor de 10 kΩ do pino de cada botão para o GND (pull-down).':'On a real board, add a 10 kΩ resistor from each button pin to GND (pull-down).'});
for(const k in ICS){I18N_EXACT[`${k} — ${ICS[k].d}`]=`${k} — ${({'4 portas NAND':'4 NAND gates','4 portas NOR':'4 NOR gates','6 inversores (NOT)':'6 inverters (NOT)','4 portas AND':'4 AND gates','6 inversores Schmitt trigger':'6 Schmitt-trigger inverters','4 portas OR':'4 OR gates','4 portas XOR':'4 XOR gates','2 flip-flops tipo D':'2 D flip-flops','Decodificador 3 para 8':'3-to-8 decoder','Contador binário síncrono 4 bits':'4-bit synchronous binary counter','Registrador de deslocamento 8 bits (serial → paralelo)':'8-bit shift register (serial → parallel)','Contador de década (10 saídas)':'Decade counter (10 outputs)','Decodificador BCD para display de 7 segmentos':'BCD to 7-segment decoder','Temporizador (astável / monoestável)':'Timer (astable / monostable)','7 drivers Darlington (aciona relés, motores e lâmpadas)':'7 Darlington drivers (relays, motors and lamps)','Ponte H dupla (aciona 2 motores CC)':'Dual H-bridge (drives 2 DC motors)','Comparador duplo (saída coletor aberto)':'Dual comparator (open-collector output)','Optoacoplador (isola entrada e saída)':'Optocoupler (isolates input and output)','4 portas NAND (CMOS)':'4 NAND gates (CMOS)','4 portas AND (CMOS)':'4 AND gates (CMOS)','4 portas OR (CMOS)':'4 OR gates (CMOS)','4 portas XOR (CMOS)':'4 XOR gates (CMOS)','6 inversores (CMOS)':'6 inverters (CMOS)','2 flip-flops tipo D (CMOS)':'2 D flip-flops (CMOS)','Multiplexador 8 para 1':'8-to-1 multiplexer'})[ICS[k].d]||ICS[k].d}`}
Object.assign(I18N_EXACT,{'NAND':'NAND','temporizador':'timer','registrador':'shift register','contador de década':'decade counter','contador 4 bits':'4-bit counter','decodificador':'decoder','driver 7 canais':'7-channel driver','ponte H':'H-bridge','comparador':'comparator','optoacoplador':'optocoupler'});
for(const k in ICS){const sh=ICSH[k];if(sh)I18N_EXACT[`${k} ${sh}`]=`${k} ${({'temporizador':'timer','registrador':'shift register','contador de década':'decade counter','contador 4 bits':'4-bit counter','decodificador':'decoder','driver 7 canais':'7-channel driver','ponte H':'H-bridge','comparador':'comparator','optoacoplador':'optocoupler','multiplexador':'multiplexer','BCD → 7 seg.':'BCD → 7-seg.'})[sh]||sh}`}
I18N_PHR.push([' sem alimentação',' without power'],[': registrador ',': register '],[', saídas ',', outputs '],[': contagem ',': count '],[': saída alta',': output high'],[': saída baixa',': output low'],
 [' de alimentação num ',' supply on a '],[' (máximo ',' (maximum '],[') queimou: alimentação de ',') burnt out: supply of '],[': luz ',': light '],
 ['Ligue VCC no pino ','Connect VCC to pin '],[' e GND no pino ',' and GND to pin '],['. Faixa: ','. Range: '],[') solto',') unconnected'],[': pino ',': pin '],
 ['No circuito real esse pino não pode ficar solto. O Faísca considera nível ','On a real board this pin must not float. Faísca treats it as '],['alto (VCC)','high (VCC)'],['baixo (GND)','low (GND)'],['; ligue-o assim na montagem.','; wire it that way when you build it.'],['(2 a 6 V)','(2 to 6 V)'],['(3 a 18 V)','(3 to 18 V)'],['(4,5 a 16 V)','(4.5 to 16 V)'],['(2 a 36 V)','(2 to 36 V)'],['(lógica 4,5 a 7 V)','(logic 4.5 to 7 V)']);
I18N_RE=null;I18N_CACHE.clear();renderPalette();renderAll();
{const lp=lblPos;lblPos=function(c){if(c.type!=='ic')return lp(c);const s=SCL(c),o=rot([-50,icPins(c).g.y0-18],c.r);return s===1?o:[o[0]*s,o[1]*s]}}
renderAll();
