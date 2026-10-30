/* ================= entradas e saídas analógicas nos CLPs, módulos e Arduino ================= */
/* Siemens: 0–10 V ↔ 0–27648 (IW64, IW66… / QW64, QW66…). Arduino: 0–5 V ↔ 0–1023 (A0…A5). */
PM.ai={n:'AI 4×U',ni:0,no:0,mod:1};PM.ao={n:'AQ 2×U',ni:0,no:0,mod:1};
const AIO={cpu:[2,2,64],s71200:[2,2,64],s71500:[4,2,64],et200:[4,2,96],ai:[4,0,112],ao:[0,2,112],ard:[6,0,0],di:[0,0,0],do:[0,0,0]};
const LEGACY_PLC=new Set(['cpu','s71200','s71500','et200','di','do','ard']);
function anaIO(c){const m=PM[c.m]||PM.cpu,a=AIO[c.m]||[0,0,64];if(m.ard)return{ai:rng(a[0]).map(i=>'A'+i),ao:[]};
 const b=c.ab!==''&&c.ab!=null&&Number.isFinite(+c.ab)?Math.round(+c.ab):a[2];return{ai:rng(a[0]).map(i=>'IW'+(b+2*i)),ao:rng(a[1]).map(i=>'QW'+(b+2*i))}}
const anaRaw=(c,v)=>PM[c.m]&&PM[c.m].ard?Math.max(0,Math.min(1023,Math.round(v/5*1023))):Math.max(0,Math.min(32767,Math.round(v/10*27648)));
const anaVolt=raw=>Math.max(0,Math.min(11.76,(+raw||0)/27648*10));
function plcGeo(c){const io=plcIO(c),an=anaIO(c),nT=io.top.length+an.ai.length,nB=io.bot.length+an.ao.length,nAll=Math.max(nT,nB),
 n0=LEGACY_PLC.has(c.m)?Math.max(io.top.length,io.bot.length):nAll,x0=-(n0-1)*10,xmax=x0+(nAll-1)*20;return{io,an,x0,xmax}}
{const d=DEFS.plc;
 d.T=c=>{const{io,an,x0}=plcGeo(c);return[...io.top.map((_,i)=>[x0+i*20,-60]),...io.bot.map((_,i)=>[x0+i*20,60]),...an.ai.map((_,k)=>[x0+(io.top.length+k)*20,-60]),...an.ao.map((_,k)=>[x0+(io.bot.length+k)*20,60])]};
 d.N=c=>{const{io,an}=plcGeo(c);return[...io.top,...io.bot,...an.ai,...an.ao]};
 d.B=c=>{const{x0,xmax}=plcGeo(c);return[x0-20,-60,xmax-x0+40,120]};
 d.draw=c=>{const{io,an,x0,xmax}=plcGeo(c),m=PM[c.m]||PM.cpu,cx=(x0+xmax)/2;let run='';if(SIM()&&!m.mod)run=rt.res.cpu[c.id]?'RUN':'STOP';
  /* nomes na vertical, dentro da caixa, cada um alinhado com o seu terminal */
  const VL=(x,y,t)=>`<text x="${x+2.6}" y="${y}" class="tn6 plcl" transform="rotate(-90 ${x+2.6} ${y})">${esc(t)}</text>`;
  let s=R(x0-20,-48,xmax-x0+40,96,'box',' rx="5"')+T(cx,2,m.n,c.r,'ctr')+(run?T(cx,14,run,c.r,'tn6'):'');
  io.top.forEach((a,i)=>{const x=x0+i*20;s+=L(x,-60,x,-48)+VL(x,-25,a);if(a[0]==='I'||(m.ard&&i>1))s+=R(x-4,-21,8,6,GET(a)?'en':'')});
  io.bot.forEach((a,i)=>{const x=x0+i*20;s+=L(x,60,x,48)+VL(x,45,a)+R(x-4,15,8,6,GET(a)?'en':'')});
  an.ai.forEach((a,k)=>{const x=x0+(io.top.length+k)*20;s+=L(x,-60,x,-48)+VL(x,-25,a)+P(`M${x-4},-15l4,-6l4,6`)});
  an.ao.forEach((a,k)=>{const x=x0+(io.bot.length+k)*20;s+=L(x,60,x,48)+VL(x,45,a)+P(`M${x-4},15l4,6l4,-6`)});
  return s};
 const an0=d.an,vin0=d.vin,der0=d.der;
 d.an=(c,x)=>{if(an0)an0(c,x);const{io,an}=plcGeo(c),n=io.top.length+io.bot.length,ard=PM[c.m]&&PM[c.m].ard;an.ai.forEach((_,k)=>x.r(c,n+k,1,ard?1e6:1e5))};
 d.vin=(c,X,N)=>{if(vin0)vin0(c,X,N);rt.anum=rt.anum||{};const{io,an}=plcGeo(c),m=PM[c.m]||PM.cpu,n=io.top.length+io.bot.length;
  const pw=m.ard||X.vab(0,1)>=18||X.energ(0,1);an.ai.forEach((a,k)=>{delete N.vars[a];rt.anum[a]=pw?anaRaw(c,Math.max(0,X.vab(n+k,1)||0)):0})};
 d.der=(c,X,N)=>{if(der0)der0(c,X,N);const{io,an}=plcGeo(c),m=PM[c.m]||PM.cpu,n=io.top.length+io.bot.length+an.ai.length;if(!an.ao.length)return;
  const pw=X.vab(0,1)>=18||X.energ(0,1),on=pw&&(m.mod?modOn(c,N):N.cpu[c.id]),A=rt.anum||{};
  an.ao.forEach((a,k)=>{const v=on?anaVolt(A[a]):0;X.push(n+k,c.tag+'.'+a+(v>.05?':+':':-'),v,1)})};
 const fm=d.F.find(f=>f[0]==='m');if(fm)fm[3]=[['cpu','CPU genérica 8E/8S + 2EA/2SA'],['s71200','S7-1200 14E/10S + 2EA/2SA'],['s71500','S7-1500 16E/16S + 4EA/2SA'],['et200','ET 200 (E/S remota) + 4EA/2SA'],['di','Módulo de entrada 8E'],['do','Módulo de saída 8S'],['ai','Módulo de entrada analógica 4EA'],['ao','Módulo de saída analógica 2SA'],['ard','Arduino (D2–D13, A0–A5)']];
 if(!d.F.some(f=>f[0]==='ab'))d.F.push(['ab','Endereço analógico inicial (IW/QW)','num',null,{when:c=>!(PM[c.m]||{}).ard&&(AIO[c.m]||[0,0])[0]+(AIO[c.m]||[0,0])[1]>0}])}
{const cat=PAL.find(p=>p[0]==='13. CLP e entradas/saídas');if(cat){const i=cat[1].findIndex(x=>x[0]==='Módulo de saída');cat[1].splice(i+1,0,['Módulo de entrada analógica','plc',{m:'ai',b:1}],['Módulo de saída analógica','plc',{m:'ao',b:1}])}}

/* ================= valores numéricos: analógicos, contadores, temporizadores ================= */
function numOf(s){s=String(s==null?'':s).trim().replace(',','.');if(/^[-+]?\d+(\.\d+)?$/.test(s))return+s;if(!rt)return 0;
 const A=rt.anum||{};if(s in A)return+A[s]||0;const m=/^(\w+)\.(CV|ET)$/i.exec(s),tag=m?m[1]:s;
 const cc=S.comps.find(c=>c.tag===tag&&/^lct/.test(c.type));if(cc)return rt.cnt[cc.id]||0;
 const tc=S.comps.find(c=>c.tag===tag&&c.type==='lton');if(tc)return Math.round((tim(tc).el||0)*100)/100;return 0}
const CMPF={'==':(a,b)=>a===b,'<>':(a,b)=>a!==b,'>=':(a,b)=>a>=b,'<=':(a,b)=>a<=b,'>':(a,b)=>a>b,'<':(a,b)=>a<b};
const CMPS=[['==','== (igual)'],['<>','<> (diferente)'],['>=','>= (maior ou igual)'],['<=','<= (menor ou igual)'],['>','> (maior)'],['<','< (menor)']];

/* ================= novos blocos ladder ================= */
const lbox=(c,x0,y0,w,h,on,title,sub)=>R(x0,y0,w,h,on?'en':'box')+T(x0+w/2,y0+13,title,c.r,'lv')+(sub?T(x0+w/2,y0+25,sub,c.r,'tn6'):'');
Object.assign(DEFS,{
lcmp:{n:'Comparador ladder',dom:'l',nolbl:1,def:{op:'>=',a:'IW64',b:'13824'},
 F:[['op','Comparação','sel',CMPS],['a','Valor 1 (IN1): variável ou número','text'],['b','Valor 2 (IN2): variável ou número','text']],T:[[-40,0],[40,0]],N:['',''],B:[-40,-34,80,74],
 draw:c=>{const on=SIM()&&CMPF[c.op](numOf(c.a),numOf(c.b));return L(-40,0,-20,0,on?'on':'')+L(20,0,40,0,on?'on':'')+lbox(c,-22,-18,44,36,on,'CMP '+c.op,'Int')+T(0,-24,c.a,c.r,'lv')+T(0,32,c.b,c.r,'lv')},
 cond:c=>CMPF[c.op]&&CMPF[c.op](numOf(c.a),numOf(c.b))?[[0,1]]:[]},
lrange:{n:'Faixa ladder (IN_RANGE / OUT_RANGE)',dom:'l',nolbl:1,def:{k:'IN',v:'IW64',min:'5530',max:'22118'},
 F:[['k','Tipo','sel',[['IN','IN_RANGE (dentro da faixa)'],['OUT','OUT_RANGE (fora da faixa)']]],['v','Valor (VAL)','text'],['min','Mínimo (MIN)','text'],['max','Máximo (MAX)','text']],T:[[-40,0],[40,0]],N:['',''],B:[-40,-34,80,80],
 draw:c=>{const v=numOf(c.v),i=v>=numOf(c.min)&&v<=numOf(c.max),on=SIM()&&(c.k==='OUT'?!i:i);
  return L(-40,0,-34,0,on?'on':'')+L(34,0,40,0,on?'on':'')+lbox(c,-34,-18,68,40,on,c.k==='OUT'?'OUT_RANGE':'IN_RANGE','')+T(0,12,c.v,c.r,'tn6')+T(0,-24,`${c.min} … ${c.max}`,c.r,'lv')},
 cond:c=>{const v=numOf(c.v),i=v>=numOf(c.min)&&v<=numOf(c.max);return(c.k==='OUT'?!i:i)?[[0,1]]:[]}},
lmove:{n:'MOVE ladder (copiar valor)',dom:'l',nolbl:1,def:{in:'IW64',out:'QW64'},F:[['in','Entrada (IN): variável ou número','text'],['out','Saída (OUT1): variável','text']],
 T:[[-40,0],[40,0]],N:['EN','ENO'],B:[-40,-34,80,74],
 draw:c=>{const on=SIM()&&rt.net&&rt.net.set(K(c.id,0)).has('LAD+');return L(-40,0,-22,0,on?'on':'')+L(22,0,40,0,on?'on':'')+lbox(c,-22,-18,44,36,on,'MOVE','')+T(0,-24,`IN ${c.in}`,c.r,'lv')+T(0,32,`OUT ${c.out}`,c.r,'lv')},
 load:()=>[[0,1]],
 edge:(c,X)=>{if(!X.hasLAD(0)||!c.out)return false;rt.anum=rt.anum||{};const v=numOf(c.in);if(rt.anum[c.out]!==v){rt.anum[c.out]=v;return true}return false}},
lctd:{n:'Contador ladder (CTD)',own:'C',dom:'l',nolbl:1,def:{pv:3},F:[['pv','Valor de preset (PV)','num']],T:[[-40,-10],[-40,10],[40,0]],N:['CD','LD','Q'],B:[-40,-36,80,62],
 draw:c=>{const n=SIM()?rt.cnt[c.id]||0:0;return L(-40,-10,-24,-10)+L(-40,10,-24,10)+L(24,0,40,0)+R(-24,-20,48,40,GET(c.tag)?'en':'box')+T(0,-4,'CTD',c.r,'lv')+T(0,10,`${n}/${c.pv}`,c.r,'tn6')+T(-17,-12,'CD',c.r,'tn6')+T(-17,16,'LD',c.r,'tn6')+T(0,-26,c.tag,c.r,'lv')},
 vin:(c,X,N)=>{N.vars[c.tag]=(rt.cnt[c.id]||0)<=0},der:(c,X,N)=>{if(N.vars[c.tag])X.push(2,'LAD+')},
 edge:(c,X)=>{const d=X.hasLAD(0),ld=X.hasLAD(1),p=!!rt.prev[c.id],o=rt.cnt[c.id]||0;rt.prev[c.id]=d;let n=o;if(ld)n=+c.pv||0;else if(d&&!p)n=o-1;if(n!==o){rt.cnt[c.id]=n;logE(`${c.tag} = ${n}`,'a');return true}return false}},
lctud:{n:'Contador ladder (CTUD)',own:'C',dom:'l',nolbl:1,def:{pv:3},F:[['pv','Valor de preset (PV)','num']],
 T:[[-50,-30],[-50,-10],[-50,10],[-50,30],[50,-10],[50,10]],N:['CU','CD','R','LD','QU','QD'],B:[-50,-56,100,100],
 draw:c=>{const n=SIM()?rt.cnt[c.id]||0:0,pv=+c.pv||0,qu=SIM()&&n>=pv,qd=SIM()&&n<=0;let s=R(-30,-42,60,84,qu||qd?'en':'box')+T(0,-28,'CTUD',c.r,'lv')+T(0,-16,'Int',c.r,'tn6')+T(0,36,`CV ${n} · PV ${pv}`,c.r,'tn6')+T(0,-48,c.tag,c.r,'lv');
  [['CU',-30],['CD',-10],['R',10],['LD',30]].forEach(([t,y])=>{s+=L(-50,y,-30,y)+T(-22,y+3,t,c.r,'tn6')});
  [['QU',-10,qu],['QD',10,qd]].forEach(([t,y,on])=>{s+=L(30,y,50,y,on?'on':'')+T(21,y+3,t,c.r,'tn6')});return s},
 vin:(c,X,N)=>{const n=rt.cnt[c.id]||0,pv=+c.pv||0;N.vars[c.tag]=n>=pv;N.vars[c.tag+'.QU']=n>=pv;N.vars[c.tag+'.QD']=n<=0},
 der:(c,X,N)=>{if(N.vars[c.tag+'.QU'])X.push(4,'LAD+');if(N.vars[c.tag+'.QD'])X.push(5,'LAD+')},
 edge:(c,X)=>{const u=X.hasLAD(0),d=X.hasLAD(1),r=X.hasLAD(2),ld=X.hasLAD(3),pu=!!rt.prev[c.id+'u'],pd=!!rt.prev[c.id+'d'],o=rt.cnt[c.id]||0;rt.prev[c.id+'u']=u;rt.prev[c.id+'d']=d;
  let n=o;if(r)n=0;else if(ld)n=+c.pv||0;else{if(u&&!pu)n++;if(d&&!pd)n--}if(n!==o){rt.cnt[c.id]=n;logE(`${c.tag} = ${n}`,'a');return true}return false}},
});
{const cat=PAL.find(p=>p[0]==='14. Ladder');if(cat){const i=cat[1].findIndex(x=>x[0]==='Contador CTU');
 cat[1].splice(i+1,0,['Contador CTD','lctd',{}],['Contador CTUD','lctud',{}],...CMPS.map(([o])=>[`Comparador CMP ${o}`,'lcmp',{op:o}]),['IN_RANGE (dentro da faixa)','lrange',{k:'IN'}],['OUT_RANGE (fora da faixa)','lrange',{k:'OUT'}],['MOVE (copiar valor)','lmove',{}])}}
/* monitor de variável mostra valores numéricos (IW, QW, MW, A0…, C1.CV, T1.ET) */
{const d=DEFS.vmon,D0=d.draw;d.draw=c=>{if(!/^(?:[IQM]W\d+|A\d|\w+\.(?:CV|ET))$/i.test(c.var||''))return D0(c);const v=SIM()?numOf(c.var):0,txt=/^[IQ]W/i.test(c.var)&&SIM()?`${c.var} = ${v} (${fmtE(anaVolt(v),'V')})`:`${c.var} = ${v}`;
 return C(-4,0,10,v?'en':'')+T(12,4,txt,c.r,'lv').replace('class="lv"','class="lv" style="text-anchor:start"')}}

/* ================= modelo pronto: CLP com entrada e saída analógica ================= */
TPLSH.clpa=[700,'Ligações do CLP','Ladder'];
{const _lt=loadTpl;loadTpl=function(k,noHist){if(k!=='clpa')return _lt(k,noHist);
 if(!noHist)pushHist();S={comps:[],wires:[],seq:1};const R0={};let n=1;
 const a=(key,type,x,y,o={})=>{const c={...makeComp(type,o),id:'c'+n++,x,y,r:o.r||0};delete c.nm;S.comps.push(c);R0[key]=c},
  w=(p,i,q,j,o,m)=>{const x={id:'w'+n++,a:{c:R0[p].id,t:i},b:{c:R0[q].id,t:j}};if(o){x.o=o;x.m=m}S.wires.push(x)},j=(key,x,y)=>a(key,'junction',x,y);
 a('PP','src',100,20,{v:'+'});a('MM','src',160,20,{v:'-'});a('F','mp',100,100,{k:'fu',p:1,In:2,tag:'F1'});j('JP',100,160);j('JM',160,180);
 a('CPU','plc',360,300,{m:'cpu',tag:'CLP1'});w('PP',0,'F',0);w('F',1,'JP',0);w('JP',0,'CPU',0);w('MM',0,'JM',0);w('JM',0,'CPU',1,'v',200);
 /* divisor: +24 V → R1 14 kΩ → potenciômetro 10 kΩ → 0 V: o cursor vai de 0 a 10 V */
 a('R1','res',600,100,{R:14000,Pw:.25,tag:'R1'});a('RP','pot',600,220,{R:10000,pos:50,tag:'RP1'});a('M3','src',600,320,{v:'-',r:180});
 j('JR',600,0);w('PP',0,'JR',0,'v',0);w('JR',0,'R1',0);w('R1',1,'RP',0);w('RP',1,'M3',0);w('RP',2,'CPU',18,'v',200);
 a('H','lamp',270,460,{tag:'H1',col:'verde',Vn:24,P:2});a('M2','src',270,560,{v:'-',r:180});w('CPU',10,'H',0);w('H',1,'M2',0);
 a('VM','vm',430,460,{tag:'P1'});a('M4','src',430,560,{v:'-',r:180});w('CPU',20,'VM',0);w('VM',1,'M4',0);
 a('MO1','vmon',80,620,{var:'IW64'});a('MO2','vmon',80,660,{var:'QW64'});
 a('NT1','note',60,700,{text:'Gire o potenciômetro RP1 (clique nele) e veja IW64 mudar. Acima de 5 V, Q0.0 acende H1. QW64 repete a entrada no voltímetro P1.'});
 /* ladder */
 a('LR','lrail',740,240,{nt:5});a('RR','rrail',1200,240,{nt:5});
 a('CM','lcmp',840,240,{op:'>=',a:'IW64',b:'13824'});a('CO','lcoil',1100,240,{var:'Q0.0'});w('LR',0,'CM',0);w('CM',1,'CO',0);w('CO',1,'RR',0);
 a('MV','lmove',840,320,{in:'IW64',out:'QW64'});w('LR',2,'MV',0);w('MV',1,'RR',2);
 a('RG','lrange',840,400,{k:'IN',v:'IW64',min:'5530',max:'22118'});a('CO2','lcoil',1100,400,{var:'Q0.1'});w('LR',4,'RG',0);w('RG',1,'CO2',0);w('CO2',1,'RR',4);
 a('NT2','note',740,160,{text:'13824 = 5 V (escala Siemens: 0–10 V = 0–27648). IN_RANGE: Q0.1 liga entre 2 V e 8 V.'});
 S.seq=n;tplSheets(k);sel=null;tool=null;commit();requestAnimationFrame(fit)}}
{const s=document.getElementById('bTpl');if(s&&s.querySelector){const o=s.querySelector('option[value="clp"]');if(o){const op=document.createElement('option');op.value='clpa';op.textContent='CLP com entrada e saída analógica';o.after(op)}}}

Object.assign(I18N_EXACT,{'Módulo de entrada analógica':'Analog input module','Módulo de saída analógica':'Analog output module','Entradas analógicas':'Analog inputs','Saídas analógicas':'Analog outputs',
 'CPU genérica 8E/8S + 2EA/2SA':'Generic CPU 8I/8O + 2AI/2AO','S7-1200 14E/10S + 2EA/2SA':'S7-1200 14I/10O + 2AI/2AO','S7-1500 16E/16S + 4EA/2SA':'S7-1500 16I/16O + 4AI/2AO','ET 200 (E/S remota) + 4EA/2SA':'ET 200 (remote I/O) + 4AI/2AO',
 'Módulo de entrada analógica 4EA':'Analog input module 4AI','Módulo de saída analógica 2SA':'Analog output module 2AO','Arduino (D2–D13, A0–A5)':'Arduino (D2–D13, A0–A5)','Endereço analógico inicial (IW/QW)':'Analog start address (IW/QW)',
 'Comparador ladder':'Ladder comparator','Comparação':'Comparison','Valor 1 (IN1): variável ou número':'Value 1 (IN1): variable or number','Valor 2 (IN2): variável ou número':'Value 2 (IN2): variable or number',
 '== (igual)':'== (equal)','<> (diferente)':'<> (not equal)','>= (maior ou igual)':'>= (greater or equal)','<= (menor ou igual)':'<= (less or equal)','> (maior)':'> (greater)','< (menor)':'< (less)',
 'Faixa ladder (IN_RANGE / OUT_RANGE)':'Ladder range (IN_RANGE / OUT_RANGE)','IN_RANGE (dentro da faixa)':'IN_RANGE (inside range)','OUT_RANGE (fora da faixa)':'OUT_RANGE (outside range)','Valor (VAL)':'Value (VAL)','Mínimo (MIN)':'Minimum (MIN)','Máximo (MAX)':'Maximum (MAX)',
 'MOVE ladder (copiar valor)':'Ladder MOVE (copy value)','MOVE (copiar valor)':'MOVE (copy value)','Entrada (IN): variável ou número':'Input (IN): variable or number','Saída (OUT1): variável':'Output (OUT1): variable',
 'Contador ladder (CTD)':'Ladder counter (CTD)','Contador ladder (CTUD)':'Ladder counter (CTUD)','Contador CTD':'CTD counter','Contador CTUD':'CTUD counter','Valor de preset (PV)':'Preset value (PV)',
 'CLP com entrada e saída analógica':'PLC with analog input and output'});
for(const[o]of CMPS)I18N_EXACT[`Comparador CMP ${o}`]=`CMP ${o} comparator`;
I18N_RE=null;I18N_CACHE.clear();renderPalette();renderAll();

{const st=document.createElement('style');st.textContent='#world text.plcl{font-size:7px;fill:var(--muted);text-anchor:start}';document.head.appendChild(st)}
