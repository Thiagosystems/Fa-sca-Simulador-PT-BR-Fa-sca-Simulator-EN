/* ================= valores de datasheet (como no Tinkercad) =================
   LED 5 mm: tensão direta típica a 20 mA (vermelho/laranja 2,0 V, amarelo 2,1 V, verde 2,2 V, azul/branco 3,2 V),
   resistência interna ~15 Ω, 20 mA contínuos, pico de 100 mA, reverso máx. 5 V.
   Resistor de filme 1/4 W (padrão 1 kΩ, como no Tinkercad). Potenciômetro padrão 250 kΩ (Tinkercad).
   LDR GL5528 (1 MΩ no escuro, ~300 Ω com muita luz). Diodo 1N4007 (0,95 V a 1 A, 1 A, 1000 V).
   IRFZ44N (Vth 2–4 V, 17,5 mΩ, 49 A, 94 W). 78xx: entrada máx. 35 V, queda 2 V, 5 mA quiescente; AMS1117: 15 V, 1,1 V.
   Relé SRD-05VDC: bobina 70 Ω, atraca com 75% da tensão. Saída de microcontrolador AVR: ~40 Ω (4,2 V com 20 mA). */
{const LEDVF={vermelha:2.0,laranja:2.0,amarela:2.1,verde:2.2,azul:3.2,branca:3.2},RS_LED=15;
 const d=DEFS.led;d.def.Vf=2.0;d.def.Imax=.02;
 d.an=(c,x)=>x.dio(c,0,1,Math.max(.3,(+c.Vf||2)-RS_LED*(+c.Imax||.02)),RS_LED);
 d.hot=(c,o)=>o.i>3.5*(+c.Imax||.02)?`${fmtE(o.i,'A')} num LED de ${fmtE(+c.Imax,'A')}: esquentando (use um resistor em série)`:null;
 d.burn=(c,o)=>o.i>5*(+c.Imax||.02)?`corrente de ${fmtE(o.i,'A')} (pico máximo ${fmtE(5*(+c.Imax||.02),'A')}). Faltou resistor em série?`:o.vdc<-5.5?`tensão reversa de ${fmtE(-o.vdc,'V')} (máximo 5 V)`:null;
 /* trocar a cor no painel ajusta a tensão direta (como no Tinkercad) */
 d.onSet=(c,k)=>{if(k==='col'&&LEDVF[c.col])c.Vf=LEDVF[c.col]};
 for(const[,items]of PAL)for(const it of items)if(it[1]==='led'&&it[2]&&LEDVF[it[2].col])it[2].Vf=LEDVF[it[2].col];
 /* LED RGB: vermelho 2,0 V; verde e azul 3,2 V (InGaN) */
 const g=DEFS.ledrgb;g.an=(c,x)=>{[[0,1.7],[2,2.9],[3,2.9]].forEach(([i,vf])=>c.ca?x.dio(c,1,i,vf,RS_LED,c.id+':'+i):x.dio(c,i,1,vf,RS_LED,c.id+':'+i))};
 g.hot=(c,o)=>o.i>.07?`${fmtE(o.i,'A')} num LED RGB (máximo 20 mA por cor)`:null;g.burn=(c,o)=>o.i>.1*3?`corrente de ${fmtE(o.i,'A')} no LED RGB. Faltou resistor em série?`:null}
/* resistor 1/4 W, padrão 1 kΩ */
DEFS.res.def.R=1000;DEFS.res.def.Pw=.25;
/* potenciômetro padrão 250 kΩ (Tinkercad) */
DEFS.pot.def.R=250000;
/* LDR GL5528 */
DEFS.ldr.an=(c,x)=>x.r(c,0,1,Math.pow(10,6-3.5*Math.max(0,Math.min(100,+c.lux||0))/100));
/* diodo 1N4007 */
{const d=DEFS.diode;d.def.Vf=.95;d.def.Imax=1;d.an=(c,x)=>x.dio(c,0,1,Math.max(.3,(+c.Vf||.95)-.3),.3);
 d.burn=(c,o)=>o.i>30*(+c.Imax||1)?`corrente de ${fmtE(o.i,'A')} (pico máximo ${fmtE(30*(+c.Imax||1),'A')})`:o.vdc<-1000?`tensão reversa de ${fmtE(-o.vdc,'V')} (máximo 1000 V)`:null;
 d.hot=(c,o)=>o.i>(+c.Imax||1)?`${fmtE(o.i,'A')} num diodo de ${fmtE(+c.Imax,'A')}`:null}
/* IRFZ44N */
{const it=PAL.flatMap(p=>p[1]).find(x=>x[1]==='nmos');if(it)Object.assign(it[2]=it[2]||{},{Rds:.0175,Idmax:49,Pmax:94,Vth:3});Object.assign(DEFS.nmos.def,{Rds:.0175,Idmax:49,Pmax:94})}
/* reguladores 78xx / AMS1117: corrente quiescente e tensão máxima de entrada */
{const d=DEFS.vreg;d.an=(c,x)=>x.r(c,0,1,1000);
 d.burn=(c,o)=>{if(!rt||!rt.A)return null;const vin=rt.A.vdc(K(c.id,0))-rt.A.vdc(K(c.id,1)),mx=+c.V===3.3?15:35;return vin>mx?`entrada de ${fmtE(vin,'V')} (máximo ${mx} V)`:vin<-.7?'ligado invertido (entrada abaixo do GND)':null}}
/* relés SRD-05VDC: atracam com 75% da tensão nominal */
for(const t of['rly1','rly2'])DEFS[t].pull=()=>.75;
/* bateria de 9 V alcalina: ~1,5 Ω de resistência interna */
for(const[,items]of PAL)for(const it of items)if(it[1]==='bat'&&it[0]==='Bateria'&&it[2]&&+it[2].V===9)it[2].ri=1.5;
/* PIR: saída baixa também referenciada ao GND do sensor */
DEFS.pir.der=(c,X)=>{const v=X.vdc(1)-X.vdc(2);if(v>=3&&(DEV(c).t||0)>0)X.push(0,c.tag+'.o:+',X.vdc(2)+Math.min(v,3.3),100,2);else X.push(0,c.tag+'.o:-',X.vdc(2),1000,2)};
/* motor CC pequeno (de hobby, 3–6 V), como o do Tinkercad */
{const C0=PAL.find(p=>p[0].startsWith('22.'));if(C0){const i=C0[1].findIndex(x=>x[1]==='motdc');C0[1].splice(i<0?C0[1].length:i,0,['Motor CC pequeno (hobby)','motdc',{Vn:6,P:1.2}])}}
Object.assign(I18N_EXACT,{'Motor CC pequeno (hobby)':'Small DC motor (hobby)'});
PKC.clear();
$('#props').addEventListener('change',e=>{if(e.target.dataset.p!=='col'||!sel||sel.c.size!==1)return;const c=byId([...sel.c][0]);if(c&&D(c).onSet){D(c).onSet(c,'col');commit()}});
HELP.push(['Valores dos componentes (datasheet)','datasheet valores padrão tensão direta led resistor potência corrente máxima tinkercad queimar','led res','Os componentes usam valores de datasheet, como no Tinkercad: resistor 1 kΩ de 1/4 W; potenciômetro 250 kΩ; LED de 5 mm com 20 mA contínuos (vermelho 2,0 V, amarelo 2,1 V, verde 2,2 V, azul e branco 3,2 V), que esquenta acima de 70 mA e queima acima de 100 mA ou com mais de 5 V reverso; diodo 1N4007 (0,95 V a 1 A); LDR GL5528 (1 MΩ no escuro a ~300 Ω com luz forte); 7805 aceita até 35 V na entrada; relé SRD-05VDC atraca com 75% da tensão; o pino do Arduino tem ~40 Ω de saída. Trocar a cor do LED ajusta a tensão direta sozinho.','LED vermelho com 220 Ω em 5 V: cerca de 14 mA. Ligado direto na bateria de 9 V: queima.']);
