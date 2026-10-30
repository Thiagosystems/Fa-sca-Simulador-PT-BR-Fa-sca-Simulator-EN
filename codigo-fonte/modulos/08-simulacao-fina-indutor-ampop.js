/* ================= simulação fina: indutor, corrente de partida de motor, amplificador operacional ================= */

/* ---------- indutor ---------- */
DEFS.ind={n:'Indutor (bobina)',own:'L',T:V2,N:['1','2'],B:[-16,-40,32,80],def:{L:.1,Rs:1},
 F:[['L','Indutância (H)','eng','H',LV],['Rs','Resistência do fio (Ω)','eng','Ω',LV]],
 draw:c=>P('M0,-40V-24a6,6 0 0 1 0,12a6,6 0 0 1 0,12a6,6 0 0 1 0,12a6,6 0 0 1 0,12V40'),
 an:(c,x)=>x.ind(c,0,1,c.L,c.id,c.Rs),val:c=>fmtE(+c.L,'H'),rd:(c,o)=>`${fmtE(+c.L,'H')} · ${fmtE(o.i,'A')}`};

/* ---------- corrente de partida dos motores ---------- */
{const MT=['mot1','motdc','motor','mot6','dahl'],IPF=[['ip','Corrente de partida (× nominal)','eng','',LV],['tp','Tempo de partida (s)','eng','s',LV]];
 const kOf=c=>{const ip=Math.max(1,+c.ip||1);if(ip<=1||!rt)return 1;const t0=rt.mst&&rt.mst[c.id];if(t0==null)return ip;const t=(rt.simT||0)-t0,tp=Math.max(0,+c.tp||0);return t<tp?ip:1+(ip-1)*Math.exp(-(t-tp)/.1)};
 for(const t of MT){const d=DEFS[t];if(!d||!d.an)continue;const an=d.an;d.def={...(d.def||{}),ip:6,tp:.5};d.F=[...(d.F||[]),...IPF];
  d.an=(c,x)=>{const k=kOf(c);if(k===1)return an(c,x);return an(Object.assign(Object.create(c),{P:(+c.P||1)*k}),x)};
  const sy=d.say;if(sy)d.say=(c,X)=>{const r=sy(c,X);const k=kOf(c);if(r&&k>1.05&&rt.mst&&rt.mst[c.id]!=null)return['on',`${c.tag} partindo: corrente ${k.toFixed(1).replace('.',DEC)}× a nominal`];return r}}}

/* ---------- amplificador operacional ---------- */
const OPM={ideal:{n:'Ideal',A:1e6,Ro:1,hd:0,ld:0},lm358:{n:'LM358',A:1e5,Ro:75,hd:1.5,ld:.02,max:32},lm741:{n:'LM741',A:2e5,Ro:75,hd:2,ld:2,max:36},tl072:{n:'TL072',A:2e5,Ro:75,hd:1.5,ld:1.5,max:36}};
const opSay=(c,o,k,nm)=>{const a=o&&o.opa&&o.opa[k];if(!a)return null;return a.st==='lin'?['on',`${nm}: amplificando, saída ${fmtE(a.vo,'V')}`]:['w',`${nm}: saturado no ${a.st==='hi'?'positivo':'negativo'} (saída ${fmtE(a.vo,'V')}). A entrada passou do limite da alimentação.`]};
DEFS.opamp={n:'Amplificador operacional',own:'U',def:{m:'lm358'},F:[['m','Modelo','sel',Object.keys(OPM).map(k=>[k,k==='ideal'?'Ideal (±15 V se V+ e V− ficarem soltos)':OPM[k].n])]],
 T:[[-40,-20],[-40,20],[60,0],[0,-40],[0,40]],N:['− (inversora)','+ (não inversora)','saída','V+','V−'],B:[-40,-40,100,80],
 draw:c=>{const o=SIM()&&rt.A?rt.A.m[c.id]:null,a=o&&o.opa&&o.opa[c.id+':2'],on=a&&a.st==='lin';
  return L(-40,-20,-30,-20)+L(-40,20,-30,20)+L(50,0,60,0)+L(0,-40,0,-21)+L(0,40,0,21)+P('M-30,-34L50,0L-30,34Z',on?'en':'box')+T(-22,-16,'−',c.r,'lv')+T(-22,24,'+',c.r,'lv')+T(6,-30,'V+',c.r,'tn6')+T(6,36,'V−',c.r,'tn6')},
 an:(c,x)=>{const m=OPM[c.m]||OPM.lm358,dg=pinDeg(),sup=dg[K(c.id,3)]&&dg[K(c.id,4)];if(!sup&&c.m!=='ideal')return;x.r(c,0,1,1e8);x.opa(c,2,1,0,sup?3:null,sup?4:null,m,c.id+':2')},
 say:c=>{const m=OPM[c.m]||OPM.lm358,dg=pinDeg();if(c.m!=='ideal'&&!(dg[K(c.id,3)]&&dg[K(c.id,4)]))return['w',`${c.tag} (${m.n}) sem alimentação: ligue V+ e V−`];return opSay(c,AM(c.id),c.id+':2',`${c.tag} (${m.n})`)},
 burn:(c,o)=>{const m=OPM[c.m];if(!m||!m.max||!rt.A)return null;const v=rt.A.vdc(K(c.id,3))-rt.A.vdc(K(c.id,4));return v>m.max*1.05?`alimentação de ${fmtE(v,'V')} (máximo ${fmtE(m.max,'V')})`:null},
 val:c=>(OPM[c.m]||OPM.lm358).n};
/* CIs DIP com amplificadores operacionais */
Object.assign(ICS,{
 'LM358':{n:'LM358',d:'2 amplificadores operacionais (fonte simples)',fam:null,pins:['OUT1','IN1−','IN1+','GND','IN2+','IN2−','OUT2','VCC'],vcc:8,gnd:4,ins:[],
  an:(c,x)=>{x.opa(c,0,2,1,7,3,OPM.lm358,c.id+':0');x.opa(c,6,4,5,7,3,OPM.lm358,c.id+':6')},edge:()=>false},
 'LM741':{n:'LM741',d:'Amplificador operacional (fonte simétrica)',fam:null,pins:['OFS N1','IN−','IN+','V−','OFS N2','OUT','V+','NC'],vcc:7,gnd:4,ins:[],
  an:(c,x)=>x.opa(c,5,2,1,6,3,OPM.lm741,c.id+':5'),edge:()=>false},
 'TL072':{n:'TL072',d:'2 amplificadores operacionais JFET (fonte simétrica)',fam:null,pins:['OUT1','IN1−','IN1+','V−','IN2+','IN2−','OUT2','V+'],vcc:8,gnd:4,ins:[],
  an:(c,x)=>{x.opa(c,0,2,1,7,3,OPM.tl072,c.id+':0');x.opa(c,6,4,5,7,3,OPM.tl072,c.id+':6')},edge:()=>false}});
{const sy=DEFS.ic.say;DEFS.ic.say=c=>{if(['LM358','LM741','TL072'].includes(c.k)){const o=AM(c.id),ks=Object.keys(o&&o.opa||{});const r=ks.map(k=>opSay(c,o,k,`${c.tag} (${c.k}) saída ${+k.split(':')[1]+1}`)).filter(Boolean);return r[0]||null}return sy(c)}}

/* paleta */
{const cat=PAL.find(p=>p[0]==='18. Eletrônica e medição');if(cat){cat[1].push(['Indutor (bobina)','ind',{}],['Amplificador operacional (LM358)','opamp',{m:'lm358'}],['Amplificador operacional (LM741)','opamp',{m:'lm741'}],['Amplificador operacional ideal','opamp',{m:'ideal'}])}
 const c19=PAL.find(p=>p[0].startsWith('19.'));if(c19){const i=c19[1].findIndex(x=>x[1]==='ic'&&x[2].k==='LM393');c19[1].splice(i+1,0,['LM358 amp. operacional','ic',{k:'LM358'}],['LM741 amp. operacional','ic',{k:'LM741'}],['TL072 amp. operacional','ic',{k:'TL072'}])}}

/* ---------- modelos prontos ---------- */
{const mk=window.mkTpl;
 /* amplificador não inversor com LM358 */
 mk('aop',(a,w,j,tx)=>{tx('T1',120,40,'AMPLIFICADOR NÃO INVERSOR (LM358)');tx('N1',120,70,'Ganho = 1 + Rf/Rg = 1 + 10 kΩ / 10 kΩ = 2. Gire RP1 (clique nele): a saída é o dobro da entrada.');
  tx('N2',120,95,'Acima de uns 5,2 V na entrada, a saída satura perto de 12 V − 1,5 V (limite do LM358).');
  a('U','opamp',520,320,{m:'lm358',tag:'U1'});a('PV','src',520,240,{v:'+',V:12});w('U',3,'PV',0);a('MV','src',520,400,{v:'-',r:180});w('U',4,'MV',0);
  a('PP','src',200,140,{v:'+',V:12});a('RP','pot',200,220,{R:10000,pos:30,tag:'RP1'});a('M1','src',200,300,{v:'-',r:180});w('PP',0,'RP',0);w('RP',1,'M1',0);
  j('JI',260,340);w('RP',2,'JI',0,'h',140);w('JI',0,'U',1);a('VI','vm',260,420,{tag:'P1'});w('JI',0,'VI',0);a('M4','src',260,500,{v:'-',r:180});w('VI',1,'M4',0);
  a('MG','src',300,300,{v:'-',r:270});a('RG','res',380,300,{R:10000,tag:'Rg',r:270});w('MG',0,'RG',0);j('JN',450,300);w('RG',1,'JN',0);w('JN',0,'U',0);
  a('RF','res',540,180,{R:10000,tag:'Rf',r:270});w('JN',0,'RF',0,'v',180);j('JO',640,320);w('U',2,'JO',0);w('RF',1,'JO',0,'h',640);
  a('VO','vm',640,400,{tag:'P2'});w('JO',0,'VO',0);a('M6','src',640,480,{v:'-',r:180});w('VO',1,'M6',0)});
 const s=document.getElementById('bTpl');if(s&&s.querySelector){const o=s.querySelector('option[value="onda"]')||s.lastElementChild;
  [['aop','Amplificador operacional (não inversor)']].reverse().forEach(([v,t])=>{const op=document.createElement('option');op.value=v;op.textContent=t;o.after(op)})}}

Object.assign(I18N_EXACT,{'Indutor (bobina)':'Inductor (coil)','Indutância (H)':'Inductance (H)','Resistência do fio (Ω)':'Wire resistance (Ω)','Corrente de partida (× nominal)':'Starting current (× rated)','Tempo de partida (s)':'Starting time (s)',
 'Amplificador operacional':'Operational amplifier','Amplificador operacional (LM358)':'Op-amp (LM358)','Amplificador operacional (LM741)':'Op-amp (LM741)','Amplificador operacional ideal':'Ideal op-amp','Ideal (±15 V se V+ e V− ficarem soltos)':'Ideal (±15 V if V+ and V− are unconnected)',
 '− (inversora)':'− (inverting)','+ (não inversora)':'+ (non-inverting)','saída':'output','LM358 amp. operacional':'LM358 op-amp','LM741 amp. operacional':'LM741 op-amp','TL072 amp. operacional':'TL072 op-amp',
 '2 amplificadores operacionais (fonte simples)':'2 op-amps (single supply)','Amplificador operacional (fonte simétrica)':'Op-amp (dual supply)','2 amplificadores operacionais JFET (fonte simétrica)':'2 JFET op-amps (dual supply)',
 'NE555 a 1,5 kHz no osciloscópio':'NE555 at 1.5 kHz on the oscilloscope','Amplificador operacional (não inversor)':'Op-amp (non-inverting amplifier)','Velocidade':'Speed','1× (tempo real)':'1× (real time)','1/10× (câmera lenta)':'1/10× (slow motion)',
 'NE555 A 1,5 kHz NO OSCILOSCÓPIO':'NE555 AT 1.5 kHz ON THE OSCILLOSCOPE','Velocidade 1/1000×: 1 segundo na tela = 1 milissegundo no circuito.':'Speed 1/1000×: 1 second on screen = 1 millisecond in the circuit.',
 'CH1 = saída (pino 3) · CH2 = capacitor C1. f ≈ 1,44 / ((R1 + 2·R2)·C1) ≈ 1,46 kHz':'CH1 = output (pin 3) · CH2 = capacitor C1. f ≈ 1.44 / ((R1 + 2·R2)·C1) ≈ 1.46 kHz',
 'AMPLIFICADOR NÃO INVERSOR (LM358)':'NON-INVERTING AMPLIFIER (LM358)','Ganho = 1 + Rf/Rg = 1 + 10 kΩ / 10 kΩ = 2. Gire RP1 (clique nele): a saída é o dobro da entrada.':'Gain = 1 + Rf/Rg = 1 + 10 kΩ / 10 kΩ = 2. Turn RP1 (click it): the output is twice the input.',
 'Acima de uns 5,2 V na entrada, a saída satura perto de 12 V − 1,5 V (limite do LM358).':'Above about 5.2 V at the input, the output saturates near 12 V − 1.5 V (LM358 limit).'});
I18N_PHR.push([': amplificando, saída ',': amplifying, output '],[': saturado no positivo',': saturated high'],[': saturado no negativo',': saturated low'],[' (saída ',' (output '],['. A entrada passou do limite da alimentação.','. The input went beyond what the supply allows.'],
 [' sem alimentação: ligue V+ e V−',' without power: connect V+ and V−'],[' partindo: corrente ',' starting: current '],['× a nominal','× rated'],[' agora · mín. ',' now · min '],[' · máx. ',' · max '],[' · tempo simulado ',' · simulated time ']);
I18N_RE=null;I18N_CACHE.clear();renderPalette();renderAll();
