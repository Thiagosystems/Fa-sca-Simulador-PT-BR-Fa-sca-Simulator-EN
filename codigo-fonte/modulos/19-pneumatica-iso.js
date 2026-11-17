/* ================= pneumática: simbologia ISO 1219 (no estilo do simulador da MTi) =================
   Válvulas com quadrados por posição, setas de fluxo, bloqueios em T, escapes e números dos pórticos.
   Acionamentos à esquerda: solenoide, botão, alavanca com trava, rolete ou piloto de ar; à direita: mola,
   solenoide (biestável) ou piloto (biestável). Novos: 3/2 NA, 2/2 NF/NA, 5/3 (CF, CE, CP), OU, E,
   filtro, regulador, lubrificador, filtro regulador, FRL, manômetro, regulador de fluxo e escape rápido. */
{
const PA=s=>{const k=s.has('AR'),e=s.has('ESC');return k&&!e};
const AR=(x1,y1,x2,y2)=>{const a=Math.atan2(y2-y1,x2-x1),h=6,w=3.2,bx=x2-Math.cos(a)*h,by=y2-Math.sin(a)*h,nx=-Math.sin(a)*w,ny=Math.cos(a)*w;
 return L(x1,y1,bx,by)+P(`M${x2},${y2}L${(bx+nx).toFixed(2)},${(by+ny).toFixed(2)}L${(bx-nx).toFixed(2)},${(by-ny).toFixed(2)}Z`,'fillink')};
const TB=(x,y)=>y>0?P(`M${x},${y}V${y-8}M${x-5},${y-8}H${x+5}`):P(`M${x},${y}V${y+8}M${x-5},${y+8}H${x+5}`);   // pórtico bloqueado
const EX=x=>L(x,20,x,27)+P(`M${x-5},27H${x+5}L${x},33Z`);                                                       // escape (sem conexão)
const PN=(x,y,s,c)=>T(x,y,s,c.r,'tn6');
/* acionamento à esquerda; xe = borda esquerda do quadrado */
function actL(c,xe,k){const t=c.sy&&c.act&&c.act.startsWith('sol')?PN(xe-6,-13,c.sy,c):'';
 switch(k){case'sol':case'sol2':return R(xe-12,-8,12,16)+L(xe-12,8,xe,-8)+t;
  case'btn':return L(xe,0,xe-8,0)+P(`M${xe-12},-8A8,8 0 0 0 ${xe-12},8Z`);
  case'lev':return L(xe,0,xe-6,0)+L(xe-6,0,xe-16,-12)+C(xe-16,-12,2,'fillink')+P(`M${xe-4},4V10M${xe-8},4V10`);
  case'lim':return L(xe,0,xe-8,0)+C(xe-12,0,4);
  case'pil':case'pil2':return P(`M${xe-8},0H${xe-14}`,'dash')+P(`M${xe},-5L${xe-8},0L${xe},5Z`)}return''}
/* acionamento à direita; xe = borda direita */
function actR(c,xe,k){switch(k){case'sol2':return R(xe,-8,12,16)+L(xe,8,xe+12,-8)+(c.sy2?PN(xe+6,-13,c.sy2,c):'');
  case'pil2':return P(`M${xe+8},0H${xe+14}`,'dash')+P(`M${xe},-5L${xe+8},0L${xe},5Z`);
  default:return P(`M${xe},-12l3,24l3,-24l3,24l3,-24l3,24`)}}
const rk=c=>c.act==='sol2'?'sol2':c.act==='pil2'?'pil2':'mola';
/* pórtico do piloto (fica no fim da lista, para não mudar os fios já ligados) */
const PIL={v32:[[-80,0]],v22:[[-80,0]],v52:[[-140,0]]},PIL2={v52:[[-140,0],[80,0]]};
const pilT=c=>c.act==='pil'?(PIL[c.type]||[]):c.act==='pil2'?(PIL2[c.type]||[]):[];
const pilN=c=>c.act==='pil'?['14 (piloto)']:c.act==='pil2'?['14 (piloto)','12 (piloto)']:[];
const pilLead=c=>{const t=pilT(c);let s='';if(!t.length)return s;const xe=c.type==='v52'?-90:-40;s+=P(`M${t[0][0]},0H${xe-14}`,'dash');if(t[1])s+=P(`M${t[1][0]},0H44`,'dash');return s};

/* ---------- 3/2 (NF ou NA) ---------- */
{const d=DEFS.v32,b0=d.T;
 d.def.na=false;d.F=[['act','Acionamento','sel',[['sol','Solenoide + mola'],['btn','Botão + mola'],['lev','Alavanca com trava'],['lim','Rolete (fim de curso) + mola'],['pil','Piloto de ar + mola']]],['na','Normalmente aberta (NA)','bool'],['sy','Solenoide','text'],['by','Rolete acionado por (ex.: A1+)','text']];
 d.T=c=>b0.concat(pilT(c));d.N=c=>['2 (saída)','1 (pressão)'].concat(pilN(c));d.B=c=>c.act==='pil'?[-84,-40,146,80]:[-62,-40,124,80];
 d.act=c=>c.act==='btn'||c.act==='lev';
 d.draw=c=>{const p=SIM()&&vpos(c),na=!!c.na;
  const A=na?AR(-20,-20,-8,20)+TB(-20,20):AR(-20,20,-20,-20)+TB(-8,20),B=na?AR(20,20,20,-20)+TB(32,20):AR(20,-20,32,20)+TB(20,20);
  return actL(c,-40,c.act)+pilLead(c)+R(-40,-20,40,40,p?'pos':'')+R(0,-20,40,40,p?'':'pos')+A+B+actR(c,40,'mola')+
   L(20,-40,20,-20)+L(20,20,20,40)+EX(32)+PN(26,-26,'2',c)+PN(26,34,'1',c)+PN(38,40,'3',c)};
 const cd=d.cond,sr=d.src;
 d.cond=(c,E)=>c.na?(vposE(c,E)?[]:[[0,1]]):cd(c,E);
 d.src=(c,E)=>c.na?(vposE(c,E)?[[0,'ESC']]:[]):sr(c,E)}

/* ---------- 5/2 ---------- */
{const d=DEFS.v52,b0=d.T,der0=d.der;
 d.F=[['act','Acionamento','sel',[['sol','Solenoide + mola (monoestável)'],['sol2','Duplo solenoide (biestável)'],['btn','Botão + mola'],['lev','Alavanca com trava'],['lim','Rolete + mola'],['pil','Piloto de ar + mola'],['pil2','Duplo piloto (biestável)']]],['sy','Solenoide 14 (avança)','text'],['sy2','Solenoide 12 (recua, biestável)','text'],['by','Rolete acionado por','text']];
 d.T=c=>b0.concat(pilT(c));d.N=c=>['4 (A)','2 (B)','1 (pressão)'].concat(pilN(c));
 d.B=c=>[c.act==='pil'||c.act==='pil2'?-144:-122,-40,(c.act==='pil2'?84:52)+(c.act==='pil'||c.act==='pil2'?144:122),80];
 d.act=c=>c.act==='btn'||c.act==='lev';
 d.draw=c=>{const p=SIM()&&vpos(c);
  return actL(c,-90,c.act)+pilLead(c)+R(-90,-20,60,40,p?'pos':'')+R(-30,-20,60,40,p?'':'pos')+
   AR(-60,20,-80,-20)+AR(-40,-20,-40,20)+TB(-80,20)+                       // acionada: 1→4, 2→3
   AR(0,20,20,-20)+AR(-20,-20,-20,20)+TB(20,20)+                           // repouso: 1→2, 4→5
   actR(c,30,rk(c))+L(-20,-40,-20,-20)+L(20,-40,20,-20)+L(0,20,0,40)+EX(-20)+EX(20)+
   PN(-26,-26,'4',c)+PN(26,-26,'2',c)+PN(6,34,'1',c)+PN(-26,40,'5',c)+PN(26,40,'3',c)};
 d.der=(c,X,N)=>{if(c.act==='pil2'){if(PA(X.set(3)))N.vst[c.id]=1;else if(PA(X.set(4)))N.vst[c.id]=0;return}if(c.act==='pil'){N.vst[c.id+':p']=PA(X.set(3))?1:0;return}if(der0)der0(c,X,N)}}
{const der0=DEFS.v32.der;DEFS.v32.der=(c,X,N)=>{if(c.act==='pil'){N.vst[c.id+':p']=PA(X.set(2))?1:0;return}if(der0)der0(c,X,N)}}

/* posição da válvula com os acionamentos novos */
{const vp0=vposE;vposE=function(c,E=rt.E){const V=E&&E.vst||{};if(c.act==='lev')return!!rt.btn[c.id];if(c.act==='pil')return!!V[c.id+':p'];if(c.act==='pil2')return!!V[c.id];return vp0(c,E)}}
/* alavanca com trava: um clique aciona e fica; outro clique solta */
const vClick=c=>{if(c.act==='lev'){rt.btn[c.id]=!rt.btn[c.id];logE(`${c.tag} ${rt.btn[c.id]?'acionada (travada)':'liberada'}`,'a');return}if(c.act==='btn'){rt.pressed.add(c.id);logE(`${c.tag} pressionada`,'a')}};
DEFS.v32.click=vClick;DEFS.v52.click=vClick;

const pAct=['act','Acionamento','sel',[['sol','Solenoide + mola'],['btn','Botão + mola'],['lev','Alavanca com trava'],['lim','Rolete (fim de curso) + mola'],['pil','Piloto de ar + mola']]];
Object.assign(DEFS,{
/* ---------- 2/2 (NF ou NA) ---------- */
v22:{n:'Válvula 2/2',dom:'p',own:'V',act:c=>c.act==='btn'||c.act==='lev',def:{act:'sol',na:false,sy:'Y1',by:''},F:[pAct,['na','Normalmente aberta (NA)','bool'],['sy','Solenoide','text'],['by','Rolete acionado por (ex.: A1+)','text']],
 T:c=>[[20,-40],[20,40]].concat(pilT(c)),N:c=>['2 (saída)','1 (pressão)'].concat(pilN(c)),B:c=>c.act==='pil'?[-84,-40,146,80]:[-62,-40,124,80],
 draw:c=>{const p=SIM()&&vpos(c),op=x=>AR(x,20,x,-20),bl=x=>TB(x,20)+TB(x,-20);
  return actL(c,-40,c.act)+pilLead(c)+R(-40,-20,40,40,p?'pos':'')+R(0,-20,40,40,p?'':'pos')+(c.na?bl(-20)+op(20):op(-20)+bl(20))+actR(c,40,'mola')+L(20,-40,20,-20)+L(20,20,20,40)+PN(26,-26,'2',c)+PN(26,34,'1',c)},
 cond:(c,E)=>(vposE(c,E)!==!!c.na)?[[0,1]]:[],click:vClick,der:(c,X,N)=>{if(c.act==='pil')N.vst[c.id+':p']=PA(X.set(2))?1:0}},
/* ---------- 5/3 (centro fechado, em escape ou em pressão) ---------- */
v53:{n:'Válvula 5/3',dom:'p',own:'V',def:{cen:'cf',sy:'Y1',sy2:'Y2'},F:[['cen','Posição central','sel',[['cf','Centro fechado (CF)'],['ce','Centro em escape (CE)'],['cp','Centro em pressão (CP)']]],['sy','Solenoide 14 (avança)','text'],['sy2','Solenoide 12 (recua)','text']],
 T:[[-20,-40],[20,-40],[0,40]],N:['4 (A)','2 (B)','1 (pressão)'],B:[-122,-40,244,80],
 draw:c=>{const s=SIM()?v53pos(c):0,cen=c.cen||'cf';let m='';
  if(cen==='cf')m=TB(-20,-20)+TB(20,-20)+TB(0,20)+TB(-20,20)+TB(20,20);
  else if(cen==='ce')m=L(-20,-20,-20,20)+L(20,-20,20,20)+TB(0,20);
  else m=P('M0,20V0M-20,-20V0H20V-20')+C(0,0,1.8,'fillink')+TB(-20,20)+TB(20,20);
  return R(-122,-8,12,16)+L(-122,8,-110,-8)+P('M-90,-12l-3,24l-3,-24l-3,24l-3,-24l-3,24')+(c.sy?PN(-116,-13,c.sy,c):'')+
   R(-90,-20,60,40,s===1?'pos':'')+R(-30,-20,60,40,s===0?'pos':'')+R(30,-20,60,40,s===2?'pos':'')+
   AR(-60,20,-80,-20)+AR(-40,-20,-40,20)+TB(-80,20)+m+AR(60,20,80,-20)+AR(40,-20,40,20)+TB(80,20)+
   P('M90,-12l3,24l3,-24l3,24l3,-24l3,24')+R(110,-8,12,16)+L(110,8,122,-8)+(c.sy2?PN(116,-13,c.sy2,c):'')+
   L(-20,-40,-20,-20)+L(20,-40,20,-20)+L(0,20,0,40)+EX(-20)+EX(20)+PN(-26,-26,'4',c)+PN(26,-26,'2',c)+PN(6,34,'1',c)+PN(-26,40,'5',c)+PN(26,40,'3',c)},
 cond:(c,E)=>{const s=v53pos(c,E);return s===1?[[2,0]]:s===2?[[2,1]]:c.cen==='cp'?[[2,0],[2,1]]:[]},
 src:(c,E)=>{const s=v53pos(c,E);return s===1?[[1,'ESC']]:s===2?[[0,'ESC']]:c.cen==='ce'?[[0,'ESC'],[1,'ESC']]:[]}},
/* ---------- válvula OU (alternadora) e válvula E (duas pressões) ---------- */
vor:{n:'Válvula OU (alternadora)',dom:'p',own:'V',T:[[0,-40],[-40,0],[40,0]],N:['2 (saída)','1 (entrada X)','1 (entrada Y)'],B:[-40,-40,86,58],
 draw:c=>{const p=SIM()&&vlog(c),x=SIM()?(rt.E&&rt.E.vst[c.id+':x']||0):0;return R(-24,-12,48,24,p?'pos':'')+L(-40,0,-24,0)+L(24,0,40,0)+L(0,-40,0,-12)+P('M-24,-6L-16,0L-24,6M24,-6L16,0L24,6')+C(x*8,0,5,'fillink')+PN(-32,-6,'1',c)+PN(32,-6,'1',c)+PN(6,-26,'2',c)},
 der:(c,X,N)=>{const a=PA(X.set(1)),b=PA(X.set(2));N.vst[c.id]=a||b?1:0;N.vst[c.id+':x']=a&&!b?1:b&&!a?-1:0},src:(c,E)=>[[0,E.vst[c.id]?'AR':'ESC']]},
vand:{n:'Válvula E (duas pressões)',dom:'p',own:'V',T:[[0,-40],[-40,0],[40,0]],N:['2 (saída)','1 (entrada X)','1 (entrada Y)'],B:[-40,-40,86,58],
 draw:c=>{const p=SIM()&&vlog(c);return R(-24,-12,48,24,p?'pos':'')+L(-40,0,-24,0)+L(24,0,40,0)+L(0,-40,0,-12)+L(-14,-8,-14,8,'thick')+L(14,-8,14,8,'thick')+L(-14,0,14,0)+PN(-32,-6,'1',c)+PN(32,-6,'1',c)+PN(6,-26,'2',c)},
 der:(c,X,N)=>{N.vst[c.id]=PA(X.set(1))&&PA(X.set(2))?1:0},src:(c,E)=>[[0,E.vst[c.id]?'AR':'ESC']]},
/* ---------- preparação do ar (passam o ar direto) ---------- */
filt:{n:'Filtro de ar',dom:'p',own:'Z',T:[[-40,0],[40,0]],N:['entrada','saída'],B:[-40,-22,86,52],
 draw:()=>L(-40,0,-20,0)+L(20,0,40,0)+P('M-20,0L0,-20L20,0L0,20Z')+P('M0,-20V12','dash')+P('M-10,10L0,20L10,10')+L(0,20,0,28)+P('M-4,24L0,28L4,24')},
reg:{n:'Regulador de pressão',dom:'p',own:'Z',T:[[-40,0],[40,0]],N:['entrada','saída'],B:[-40,-46,86,72],
 draw:c=>L(-40,0,-16,0)+L(16,0,40,0)+R(-16,-14,32,28)+L(-10,0,10,0)+P('M-10,0l5,-3v6ZM10,0l-5,-3v6Z','fillink')+P('M-16,-14l-3,-4l6,-2l-6,-2l6,-2l-6,-2')+P('M10,14V22H-4','dash')+L(26,0,26,-24)+GAUGE(c,26,-34)},
lub:{n:'Lubrificador',dom:'p',own:'Z',T:[[-40,0],[40,0]],N:['entrada','saída'],B:[-40,-22,86,44],
 draw:()=>L(-40,0,-20,0)+L(20,0,40,0)+P('M-20,0L0,-20L20,0L0,20Z')+L(0,-20,0,-6)+P('M0,4c-3,4 -3,7 0,7c3,0 3,-3 0,-7Z','fillink')},
freg:{n:'Filtro regulador',dom:'p',own:'Z',T:[[-60,0],[60,0]],N:['entrada','saída'],B:[-60,-48,126,82],
 draw:c=>L(-60,0,-46,0)+P('M-46,0L-30,-16L-14,0L-30,16Z')+P('M-30,-16V10','dash')+P('M-38,8L-30,16L-22,8')+L(-14,0,4,0)+R(4,-12,26,24)+L(8,0,26,0)+P('M8,0l4,-3v6ZM26,0l-4,-3v6Z','fillink')+L(30,0,60,0)+L(44,0,44,-26)+GAUGE(c,44,-36)+R(-50,-26,90,56,'dash',' style="fill:none"')},
frl:{n:'Unidade FRL',dom:'p',own:'Z',T:[[-80,0],[80,0]],N:['entrada','saída'],B:[-80,-48,166,82],
 draw:c=>L(-80,0,-66,0)+P('M-66,0L-52,-14L-38,0L-52,14Z')+P('M-52,-14V8','dash')+P('M-58,8L-52,14L-46,8')+L(-38,0,-26,0)+R(-26,-12,26,24)+L(-22,0,-4,0)+P('M-22,0l4,-3v6ZM-4,0l-4,-3v6Z','fillink')+L(0,0,38,0)+L(14,0,14,-26)+GAUGE(c,14,-36)+P('M38,0L52,-14L66,0L52,14Z')+L(52,-14,52,-4)+L(66,0,80,0)+R(-72,-26,144,56,'dash',' style="fill:none"')},
frls:{n:'Unidade FRL (simplificada)',dom:'p',own:'Z',T:[[-60,0],[60,0]],N:['entrada','saída'],B:[-60,-24,126,52],
 draw:c=>L(-60,0,-40,0)+L(40,0,60,0)+R(-40,-20,80,40)+L(-30,-20,-30,20,'dash')+GAUGE(c,0,-2)+`<text x="24" y="16" class="tn6">FRL</text>`+P('M-30,20V26M-33,23L-30,27L-27,23')},
mano:{n:'Manômetro',dom:'p',own:'Z',T:[[0,20]],N:['tomada'],B:[-14,-26,28,46],draw:c=>L(0,20,0,4)+GAUGE(c,0,-8)},
/* ---------- acessórios ---------- */
flow:{n:'Regulador de fluxo unidirecional',dom:'p',own:'Z',T:[[-40,0],[40,0]],N:['entrada','saída'],B:[-40,-24,86,52],
 draw:()=>L(-40,0,-22,0)+L(22,0,40,0)+R(-22,-20,44,42,'dash',' style="fill:none"')+L(-22,0,-8,0)+L(8,0,22,0)+P('M-8,-5Q0,0 -8,5M8,-5Q0,0 8,5')+AR(-10,8,10,-12)+P('M-14,0V14H14V0')+C(2,14,3.5)+P('M-4,10L-4,18')},
shut:{n:'Válvula de fechamento',dom:'p',own:'Z',act:1,T:[[-40,0],[40,0]],N:['1','2'],B:[-40,-14,86,28],
 draw:c=>{const f=SIM()&&rt.btn[c.id];return L(-40,0,-14,0)+L(14,0,40,0)+P('M-14,-8L14,8V-8L-14,8Z',f?'':'pos')+(f?P('M-6,-12L6,12','thick'):'')},
 cond:c=>rt.btn[c.id]?[]:[[0,1]],click:c=>{rt.btn[c.id]=!rt.btn[c.id];logE(`${c.tag} ${rt.btn[c.id]?'fechada':'aberta'}`,'a')}},
tank:{n:'Reservatório de ar',dom:'p',own:'Z',T:[[-60,0],[60,0]],N:['entrada','saída'],B:[-60,-16,126,32],
 draw:c=>{const p=SIM()&&termsOf(c).some((_,i)=>pres(c,i));return L(-60,0,-40,0)+L(40,0,60,0)+R(-40,-14,80,28,p?'pos':'',' rx="14"')}},
dry:{n:'Secador de ar',dom:'p',own:'Z',T:[[-40,0],[40,0]],N:['entrada','saída'],B:[-40,-22,86,44],
 draw:()=>L(-40,0,-20,0)+L(20,0,40,0)+P('M-20,0L0,-20L20,0L0,20Z')+L(-20,0,20,0)+P('M-5,-12L0,-5L5,-12Z','fillink')+P('M-5,12L0,5L5,12Z','fillink')},
qex:{n:'Escape rápido',dom:'p',own:'Z',T:[[-40,0],[0,-40]],N:['1 (entrada)','2 (saída)'],B:[-40,-40,94,58],
 draw:()=>L(-40,0,-20,0)+R(-20,-12,40,24)+C(-8,0,5)+L(0,-40,0,0)+C(0,0,1.8,'fillink')+AR(0,0,20,0)+R(20,-5,10,10)+P('M30,-5V5M33,-5V5M36,-5V5')},
});
/* manômetro (mostra pressão durante a simulação) */
function GAUGE(c,x,y){const pr=SIM()&&rt.net&&termsOf(c).some((_,i)=>pres(c,i));return C(x,y,10,pr?'pos':'')+AR(x-6,y+6,x+6,y-6)}
function v53pos(c,E=rt.E){const a=!!(E&&E.out[c.sy]),b=!!(E&&E.out[c.sy2]);return a&&!b?1:b&&!a?2:0}
function vlog(c){return!!(rt.E&&rt.E.vst[c.id])}
for(const t of['filt','reg','lub','freg','frl','frls','flow','tank','dry'])DEFS[t].cond=()=>[[0,1]];
DEFS.qex.der=(c,X,N)=>{N.vst[c.id]=PA(X.set(0))?1:0};
DEFS.qex.cond=(c,E)=>E.vst[c.id]?[[0,1]]:[];DEFS.qex.src=(c,E)=>E.vst[c.id]?[]:[[1,'ESC']];

/* fonte de ar (triângulo cheio) e silenciador */
/* fonte de pressão pneumática: triângulo vazado (cheio é hidráulico); compressor: círculo com triângulo */
DEFS.air.draw=c=>{const on=SIM()&&!rt.man[c.id];if(c.look==='comp')return L(0,8,0,20,on?'air':'')+C(0,-6,14,on?'pos':'')+P('M-5,-13L0,-20L5,-13Z');return L(0,6,0,20,on?'air':'')+P('M-12,6L0,-14L12,6Z',on?'pos':'')};
DEFS.air.B=[-16,-22,32,44];
DEFS.exh.n='Silenciador (escape)';DEFS.exh.draw=()=>L(0,-20,0,-8)+R(-7,-8,14,16)+P('M-3,-8V8M1,-8V8M5,-8V8')+P('M-4,8L0,14L4,8Z');DEFS.exh.B=[-10,-20,20,36];

/* motor pneumático (triângulo vazado na saída; dois triângulos no reversível) e atuador de giro limitado */
DEFS.pmot.draw=c=>{const m=SIM()?pmotSt(c):0;return C(0,-6,18,m?'pos':'')+P('M-6,-17L0,-24L6,-17Z')+(c.rev?P('M-6,5L0,12L6,5Z'):'')+(c.rev?P('M-20,20V4M20,20V4'):L(0,20,0,12))+(m?C(0,-6,24,'spin '+(m===2?'ccw':'cw')):'')};
DEFS.rot.draw=c=>{const x=SIM()?(rt.cyl[c.id]||{x:0}).x:0,a=-Math.PI/2+x*Math.PI/2;return P('M-20,-24V12M-20,-24A40,18 0 0 1 -20,12')+P('M-20,-14L-12,-10L-20,-6M-20,2L-12,6L-20,10')+L(0,-6,Math.cos(a)*12,-6+Math.sin(a)*12,'thick')+P('M-20,20V12M20,20V4L12,4')+T(0,30,Math.round(x*90)+'°',c.r,'tn6')};
/* paleta */
{const cat=PAL.find(p=>p[0].startsWith('16.'));if(cat){const it=cat[1],at=k=>it.findIndex(x=>x[0]===k);
 it.splice(at('Escape / silenciador')+1,0,['Compressor','air',{look:'comp'}],['Reservatório de ar','tank',{}],['Secador de ar','dry',{}],['Filtro de ar','filt',{}],['Regulador de pressão','reg',{}],['Lubrificador','lub',{}],['Filtro regulador','freg',{}],['Unidade FRL','frl',{}],['Unidade FRL (simplificada)','frls',{}],['Manômetro','mano',{}]);
 it.splice(at('Válvula 3/2 rolete')+1,0,['Válvula 3/2 NA','v32',{act:'sol',na:true}],['Válvula 3/2 alavanca','v32',{act:'lev'}],['Válvula 3/2 piloto','v32',{act:'pil'}]);
 it.splice(at('Válvula 5/2 botão')+1,0,['Válvula 5/2 alavanca','v52',{act:'lev'}],['Válvula 5/2 piloto','v52',{act:'pil'}],['Válvula 5/2 duplo piloto','v52',{act:'pil2'}],
  ['Válvula 5/3 centro fechado','v53',{cen:'cf'}],['Válvula 5/3 centro em escape','v53',{cen:'ce'}],['Válvula 5/3 centro em pressão','v53',{cen:'cp'}],
  ['Válvula 2/2 NF','v22',{act:'sol'}],['Válvula 2/2 NA','v22',{act:'sol',na:true}],['Válvula OU','vor',{}],['Válvula E','vand',{}],['Regulador de fluxo unidirecional','flow',{}],['Válvula de fechamento','shut',{}],['Escape rápido','qex',{}]);
 const e=it.find(x=>x[1]==='exh');if(e)e[0]='Silenciador'}}

Object.assign(I18N_EXACT,{'Silenciador':'Silencer','Silenciador (escape)':'Silencer (exhaust)','Filtro de ar':'Air filter','Regulador de pressão':'Pressure regulator','Lubrificador':'Lubricator','Filtro regulador':'Filter regulator','Unidade FRL':'FRL unit','Unidade FRL (simplificada)':'FRL unit (simplified)','Manômetro':'Pressure gauge',
 'Válvula 3/2 NA':'3/2 NO valve','Válvula 3/2 alavanca':'3/2 lever valve','Válvula 3/2 piloto':'3/2 pilot valve','Válvula 5/2 alavanca':'5/2 lever valve','Válvula 5/2 piloto':'5/2 pilot valve','Válvula 5/2 duplo piloto':'5/2 double pilot valve',
 'Válvula 5/3 centro fechado':'5/3 valve, closed center','Válvula 5/3 centro em escape':'5/3 valve, exhaust center','Válvula 5/3 centro em pressão':'5/3 valve, pressure center','Válvula 2/2 NF':'2/2 NC valve','Válvula 2/2 NA':'2/2 NO valve','Válvula 2/2':'2/2 valve','Válvula 5/3':'5/3 valve',
 'Válvula OU':'OR valve','Válvula E':'AND valve','Válvula OU (alternadora)':'OR (shuttle) valve','Válvula E (duas pressões)':'AND (two-pressure) valve','Regulador de fluxo unidirecional':'One-way flow control valve','Válvula de fechamento':'Shut-off valve','Compressor':'Compressor','Reservatório de ar':'Air receiver','Secador de ar':'Air dryer','Escape rápido':'Quick exhaust valve',
 'Alavanca com trava':'Lever with detent','Piloto de ar + mola':'Air pilot + spring','Duplo piloto (biestável)':'Double pilot (bistable)','Normalmente aberta (NA)':'Normally open (NO)','Posição central':'Center position',
 'Centro fechado (CF)':'Closed center','Centro em escape (CE)':'Exhaust center','Centro em pressão (CP)':'Pressure center','Solenoide 14 (avança)':'Solenoid 14 (extend)','Solenoide 12 (recua)':'Solenoid 12 (retract)'});
PKC.clear&&PKC.clear();
}
renderPalette();renderAll();
