/* ================= símbolos no estilo do CADe_SIMU: transformador, ponte retificadora e disjuntor ================= */
/* transformador: duas barras grossas (enrolamentos) com o núcleo entre elas; terminais 1-2 (primário) e 3-4 (secundário) */
Object.assign(DEFS.xfmr,{N:['1','2','3','4'],B:[-34,-40,68,80],
 draw:c=>{const e=EN(c.id)?' en':'';return L(-20,-40,-20,-13)+L(20,-40,20,-13)+R(-30,-13,60,8,'fillink'+e)+L(-30,-1,30,-1)+L(-30,1,30,1)+R(-30,5,60,8,'fillink'+e)+L(-20,13,-20,40)+L(20,13,20,40)
  +T(-16,-28,'1',c.r,'tn')+T(24,-28,'2',c.r,'tn')+T(-16,34,'3',c.r,'tn')+T(24,34,'4',c.r,'tn')}});
/* ponte retificadora: losango tracejado com diodo; 1 e 2 (~) nas laterais, 3 (+) em cima, 4 (−) embaixo */
Object.assign(DEFS.rect,{T:[[-40,0],[40,0],[0,-40],[0,40]],N:['1','2','3','4'],B:[-40,-40,80,80],
 draw:c=>L(-40,0,-24,0)+L(24,0,40,0)+L(0,-40,0,-24)+L(0,24,0,40)+P('M0,-24L24,0L0,24L-24,0Z','dash')+P('M-8,-7L5,0L-8,7Z','fillink')+L(6,-8,6,8,'thick')
  +T(-38,-6,'1',c.r,'tn')+T(32,-6,'2',c.r,'tn')+T(5,-30,'3',c.r,'tn')+T(5,36,'4',c.r,'tn')+T(-4,-12,'+',c.r,'tn')+T(-4,20,'−',c.r,'tn')});
/* saída da ponte: sem filtro (média), com capacitor (pico) ou ideal (Vcc = Vca, como no CADe_SIMU) */
{const d=DEFS.rect;d.def={...(d.def||{}),out:''};
 const outOf=c=>c.out==='avg'||c.out==='cap'||c.out==='ideal'?c.out:(c.fil?'cap':'avg');
 d.F=[['out','Tensão de saída','sel',[['avg','Sem filtro: média ≈ 0,9 × Vca'],['cap','Com capacitor de filtro: ≈ pico (1,41 × Vca)'],['ideal','Ideal: Vcc = Vca (como no CADe_SIMU)']]]];
 const der0=d.der;d.der=(c,X,N)=>{const m=outOf(c);if(m!=='ideal'){c.fil=m==='cap';return der0(c,X,N)}
  const v=(X.vab&&X.vab(0,1))||(X.energ&&X.energ(0,1)?220:0);if(v>2){X.push(2,c.tag+':+',Math.max(0,v),.1);X.push(3,c.tag+':-',0,.01);N.ds[c.id]=1}};
 const mk=makeComp;makeComp=function(t,o){const c=mk(t,o);if(t==='rect'&&!c.out)c.out=c.fil?'cap':'avg';return c}}
/* disjuntor termomagnético: quadradinho preto no contato fixo (o "x" da IEC continua disponível como opção) */
{const d=DEFS.mp,D0=d.draw;
 d.draw=c=>{let s=D0(c);if(c.k!=='dj'||c.sym)return s;
  return s.replace(/<path d="M(-?[\d.]+),-16l8,8M(-?[\d.]+),-16l-8,8"( class="trip")?\/>/g,(m,a,b,tr)=>{const x=+a+4;return R(x-5,-19,10,7,tr?'blown':'fillink')})};
 const f=d.F.find(x=>x[0]==='sym');if(f)f[3]=[['','Padrão (quadrado, como no CADe_SIMU)'],['iec','IEC (com x)'],['det','Detalhado (térmico + magnético)']]}

/* identificação da ponte acima do terminal 2, fora dos fios */
{const lp=lblPos;lblPos=function(c){return c.type==='rect'?rot([46,-20],c.r):c.type==='mot6'&&c.pe?rot([46,52],c.r):lp(c)}}
/* ================= motor de 6 terminais com borne de terra (PE) ================= */
{const d=DEFS.mot6,T0=d.T,N0=d.N,D0=d.draw,B0=d.B;d.def={...d.def,pe:false};
 d.T=c=>c.pe?[...fv(T0,c),[60,0]]:fv(T0,c);d.N=c=>c.pe?[...fv(N0,c),'PE']:fv(N0,c);d.B=c=>{const b=fv(B0,c);return c.pe?[b[0],b[1],b[2]+30,b[3]]:b};
 d.draw=c=>D0(c)+(c.pe?L(26,0,46,0)+P('M46,-10V10M50,-6V6')+L(50,0,60,0)+T(48,-14,'PE',c.r,'tn'):'');
 d.F=[...(d.F||[]),['pe','Borne de terra (PE)','bool']]}
for(const[,it]of PAL)for(const x of it)if(x[1]==='mot6'){x[2]={...(x[2]||{}),pe:true}}

/* ================= modelo: estrela-triângulo com comando 24 Vcc (igual ao esquema de referência) ================= */
{const _lt=loadTpl;loadTpl=function(k,noHist){if(k!=='yd24')return _lt(k,noHist);
 if(!noHist)pushHist();S={comps:[],wires:[],seq:1};const R={};let n=1;
 const a=(key,type,x,y,o={})=>{const c={...makeComp(type,o),id:'c'+n++,x,y,r:o.r||0};delete c.nm;S.comps.push(c);R[key]=c},
  w=(p,i,q,j,o,m)=>{const x={id:'w'+n++,a:{c:R[p].id,t:i},b:{c:R[q].id,t:j}};if(o){x.o=o;x.m=m}S.wires.push(x)},
  j=(key,x,y)=>a(key,'junction',x,y),tx=(key,x,y,text)=>a(key,'note',x,y,{text});
 /* ---------- circuito principal ---------- */
 tx('t1',420,60,'CIRCUITO PRINCIPAL');
 [['PE',140],['L3',180],['L2',220],['L1',260]].forEach(([v,y])=>a('s'+v,'src',120,y,{v,r:270}));
 a('F1','mp',300,360,{k:'fu',p:3,In:25,tag:'F1'});
 j('JL1',260,260);j('JL2',300,220);w('sL1',0,'JL1',0);w('JL1',0,'F1',0);w('sL2',0,'JL2',0);w('JL2',0,'F1',1);w('sL3',0,'F1',2,'h',340);
 a('K1','mp',300,600,{k:'k',p:3,tag:'K1'});a('K2','mp',520,600,{k:'k',p:3,tag:'K2'});a('K3','mp',720,600,{k:'k',p:3,tag:'K3'});
 a('RT','ftpow',300,720,{tag:'RT1',Ir:16});a('M','mot6',300,860,{tag:'M1',Vn:380,P:7500,pe:true});
 [[260,520],[300,480],[340,440]].forEach(([x,y],i)=>{j('J'+i,x,y);w('F1',3+i,'J'+i,0);w('J'+i,0,'K1',i);w('J'+i,0,'K2',i,'h',480+i*40);
  w('K1',3+i,'RT',i);w('RT',3+i,'M',i);j('A'+i,480+i*40,680+i*40);w('K2',3+i,'A'+i,0);w('A'+i,0,'K3',3+i,'h',680+i*40)});
 j('JS',720,520);w('K3',0,'JS',0,'v',520);w('JS',0,'K3',1);w('JS',0,'K3',2,'h',760);
 /* motor: W2 ← K2-2 (L1), U2 ← K2-4 (L2), V2 ← K2-6 (L3) */
 w('M',5,'A0',0,'v',1060);w('M',3,'A1',0,'v',1020);w('M',4,'A2',0,'v',980);w('sPE',0,'M',6,'h',380);
 tx('nK1',356,652,'PRINC');tx('nK2',576,652,'TRIAN');tx('nK3',776,652,'ESTRE');
 /* ---------- fonte do comando: Q1 → T1 → V1 ---------- */
 a('Q1','mp',900,360,{k:'dj',p:2,In:6,curve:'C',tag:'Q1'});w('JL1',0,'Q1',0,'h',880);w('JL2',0,'Q1',1,'h',920);
 a('T1','xfmr',900,540,{Vp:380,Vs:24,tag:'T1'});w('Q1',2,'T1',0);w('Q1',3,'T1',1);
 a('V1','rect',920,720,{out:'ideal',tag:'V1'});w('T1',2,'V1',0);w('T1',3,'V1',1,'v',620);
 j('PJ',1040,660);w('V1',2,'PJ',0,'v',660);
 /* ---------- circuito de comando ---------- */
 tx('t2',1500,60,'CIRCUITO COMANDO');
 a('RTc','ftnc',1260,180,{tag:'RT1',num:'11-12'});w('PJ',0,'RTc',0,'v',80);
 a('S0','btn',1260,300,{nc:true,tag:'S0',num:'11-12'});w('RTc',1,'S0',0);tx('nS0',1170,330,'DESL.');
 const X=[1260,1400,1540,1680,1820,1960,2100];
 for(let i=0;i<6;i++){j('B'+i,X[i],380);if(i)w('B'+(i-1),0,'B'+i,0)}w('S0',1,'B0',0);
 a('S1','btn',1260,460,{tag:'S1'});a('K3s','kno',1400,460,{tag:'K3'});a('K3a','kno',1540,460,{tag:'K3',num:'53-54'});a('K1s','kno',1680,460,{tag:'K1'});
 a('K1n','knc',1820,460,{tag:'K1',num:'61-62'});a('K3n','kno',1960,460,{tag:'K3',num:'83-84'});a('K2n','kno',2100,460,{tag:'K2',num:'53-54'});
 ['S1','K3s','K3a','K1s','K1n','K3n'].forEach((k2,i)=>w('B'+i,0,k2,0));w('B5',0,'K2n',0,'h',2100);tx('nS1',1170,490,'LIGA');
 /* ramo 1: S1 + selo K3 → K2 61-62 → KT1 15-16 → K3 e KT1 */
 j('J0',1260,540);w('S1',1,'J0',0);w('K3s',1,'J0',0,'v',540);
 a('K2i','knc',1260,620,{tag:'K2',num:'61-62'});a('KTc','ktnc',1260,740,{tag:'KT1',num:'15-16'});w('J0',0,'K2i',0);w('K2i',1,'KTc',0);
 j('Jc',1260,820);w('KTc',1,'Jc',0);a('K3c','coil',1260,900,{tag:'K3',Vn:24,P:6});a('KT','tcoil',1400,900,{tag:'KT1',m:'on',t:5,Vn:24,P:3});
 w('Jc',0,'K3c',0);w('Jc',0,'KT',0,'h',1400);
 /* ramo 2: K3 53-54 + selo K1 13-14 → K1 · K3 61-62 → K2 */
 j('J2',1540,540);j('J3',1680,540);w('K3a',1,'J2',0);w('K1s',1,'J3',0);w('J3',0,'J2',0);
 a('K1c','coil',1540,900,{tag:'K1',Vn:24,P:6});w('J2',0,'K1c',0);
 a('K3i','knc',1680,620,{tag:'K3',num:'61-62'});a('K2c','coil',1680,900,{tag:'K2',Vn:24,P:6});w('J3',0,'K3i',0);w('K3i',1,'K2c',0);
 /* sinalização */
 a('H1','lamp',1820,900,{tag:'H1',col:'verde',Vn:24,P:2});a('H2','lamp',1960,900,{tag:'H2',col:'amarela',Vn:24,P:2});a('H3','lamp',2100,900,{tag:'H3',col:'vermelha',Vn:24,P:2});
 w('K1n',1,'H1',0);w('K3n',1,'H2',0);w('K2n',1,'H3',0);
 /* retorno (−) */
 const RX=['K3c','KT','K1c','K2c','H1','H2'];RX.forEach((k2,i)=>{j('R'+i,X[i],980);w(k2,1,'R'+i,0);if(i)w('R'+(i-1),0,'R'+i,0)});
 w('V1',3,'R0',0,'v',980);w('R5',0,'H3',1,'h',2100);
 [[['ESTRELA'],1260],[['TEMPO','ESTRELA'],1400],[['PRINCIPAL'],1540],[['TRIÂNGULO'],1680],[['MOTOR','DESLIGADO'],1820],[['MOTOR','EM','ESTRELA'],1960],[['MOTOR','EM','TRIÂNGULO'],2100]]
  .forEach(([ls,x],i)=>ls.forEach((s,k2)=>tx('n'+i+'_'+k2,x-34,1010+k2*18,s)));
 S.seq=n;tplSheets(k);S.doc.fr=false;sel=null;tool=null;commit();requestAnimationFrame(fit)}}
{const s=document.getElementById('bTpl');if(s&&s.querySelector){const o=s.querySelector('option[value="yd"]');if(o){const n=document.createElement('option');n.value='yd24';n.textContent='Estrela-triângulo com comando 24 Vcc';o.after(n)}}}
Object.assign(I18N_EXACT,{'Estrela-triângulo com comando 24 Vcc':'Star-delta starter with 24 V DC control','Numeração (ex.: 53-54)':'Numbering (e.g. 53-54)','Tensão de saída':'Output voltage',
 'Sem filtro: média ≈ 0,9 × Vca':'No filter: average ≈ 0.9 × Vac','Com capacitor de filtro: ≈ pico (1,41 × Vca)':'With filter capacitor: ≈ peak (1.41 × Vac)','Ideal: Vcc = Vca (como no CADe_SIMU)':'Ideal: Vdc = Vac (like CADe_SIMU)',
 'Padrão (quadrado, como no CADe_SIMU)':'Default (square, like CADe_SIMU)','IEC (com x)':'IEC (with x)','Borne de terra (PE)':'Earth terminal (PE)'});
