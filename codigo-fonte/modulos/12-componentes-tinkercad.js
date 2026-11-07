/* ================= componentes novos (paridade com o Tinkercad) ================= */
/* estado dos dispositivos controlados por código (LCD, servo, NeoPixel…): rt.dev[id] */
const DEV=c=>{if(!rt)return{};rt.dev=rt.dev||{};return rt.dev[c.id]||(rt.dev[c.id]={})};
const VD=(c,i,j)=>SIM()&&rt.A?rt.A.vdc(K(c.id,i))-rt.A.vdc(K(c.id,j)):0;
const PWR=(c,i,j,min)=>SIM()&&rt.A&&!rt.burnt[c.id]&&VD(c,i,j)>=(min||3);
const TT=(x,y,s,c,cl)=>T(x,y,s,c.r,cl||'tn6');
/* rótulo do pino fixo no desenho (gira junto, como nos CIs) para não cobrir o terminal nem o corpo */
const PINL=(x,y,n)=>`<text x="${x+3}" y="${y}" class="tn6 pinl" style="text-anchor:start">${esc(n)}</text>`;
/* side: rótulo ao lado do fio do pino (quando o corpo fica longe ou é redondo) */
const PINS=(c,list,side)=>list.map(([x,y,n])=>L(x,y,x,y<0?y+12:y-12)+(side?PINL(x,y<0?y+11:y-6,n):T(x,y<0?y+24:y-17,n,0,'tn6 pinl'))).join('');
const bodyBox=(x,y,w,h,cl)=>R(x,y,w,h,cl||'box',' rx="4"');
const vNorton=(x,c,i,j,I,gs)=>x.bat(c,i,j,I/gs,1/gs);
{const DS2=id=>SIM()&&rt.res&&rt.res.ds&&rt.res.ds[id];void DS2}

Object.assign(DEFS,{
/* ---------- geral ---------- */
zener:{n:'Diodo Zener',own:'D',def:{Vz:5.1,Pmax:.5},F:[['Vz','Tensão Zener (V)','eng','V',LV],['Pmax','Potência máxima (W)','eng','W',LV]],T:V2,N:['A','K'],B:[-14,-40,40,80],
 draw:c=>L(0,-40,0,-8)+P('M-10,-8H10L0,8Z','fillink')+P('M-14,4L-10,8H10L14,12')+L(0,8,0,40)+TL(c.r,'A','K'),
 an:(c,x)=>{x.dio(c,0,1,.7,1,c.id+':f');x.dio(c,1,0,+c.Vz||5.1,2,c.id+':z')},burn:(c,o)=>o.p>2*(+c.Pmax||.5)?`dissipando ${fmtE(o.p,'W')} (máximo ${fmtE(+c.Pmax,'W')})`:null,
 val:c=>`${fmtE(+c.Vz,'V')}`,rd:(c,o)=>`${fmtE(+c.Vz,'V')} · ${fmtE(o.i,'A')}`},
ledrgb:{n:'LED RGB',own:'LED',def:{ca:false},F:[['ca','Ânodo comum (desmarcado = cátodo comum)','bool']],T:[[-40,40],[-20,40],[0,40],[20,40]],N:c=>['R',c.ca?'+ (ânodo)':'− (cátodo)','G','B'],B:[-48,-34,80,74],
 an:(c,x)=>{[[0,1.9],[2,2.2],[3,3.0]].forEach(([i,vf])=>c.ca?x.dio(c,1,i,vf,10,c.id+':'+i):x.dio(c,i,1,vf,10,c.id+':'+i))},
 draw:c=>{const b=i=>{if(!SIM()||!rt.A)return 0;const v=(c.ca?-1:1)*VD(c,i,1)-[1.9,0,2.2,3][i];return Math.max(0,Math.min(1,v/10/.02))},r=b(0),g=b(2),bl=b(3),on=r+g+bl>.02,col=`rgb(${Math.round(80+175*r)},${Math.round(80+175*g)},${Math.round(80+175*bl)})`;
  return PINS(c,[[-40,40,'R'],[-20,40,c.ca?'+':'−'],[0,40,'G'],[20,40,'B']],1)+P('M-28,8V-10A18,18 0 0 1 8,-10V8Z','',on?` style="fill:${col};filter:drop-shadow(0 0 8px ${col})"`:' style="fill:color-mix(in srgb,var(--muted) 18%,transparent)"')+L(-34,8,14,8)+L(-40,28,-40,8)+L(-20,28,-20,8)+L(0,28,0,8)+L(20,28,20,8)},
 hot:(c,o)=>o.i>.05?`${fmtE(o.i,'A')} num LED (máximo 20 mA por cor)`:null},
/* ---------- entrada ---------- */
slsw:{n:'Chave deslizante (SPDT)',own:'S',act:1,T:[[-20,40],[0,40],[20,40]],N:['1','C','2'],B:[-34,-24,68,64],
 draw:c=>{const a=SIM()&&rt.btn[c.id];return PINS(c,[[-20,40,'1'],[0,40,'C'],[20,40,'2']])+bodyBox(-30,-16,60,32)+R(-22,-8,44,16,'',' rx="3" style="fill:color-mix(in srgb,var(--muted) 25%,transparent)"')+R(a?2:-20,-10,18,20,'en',' rx="2"')},
 cond:c=>rt&&rt.btn[c.id]?[[1,2]]:[[0,1]],click:c=>{rt.btn[c.id]=!rt.btn[c.id];logE(`${c.tag} na posição ${rt.btn[c.id]?'2':'1'}`,'a')}},
tact:{n:'Botão (4 pinos)',own:'S',act:1,def:{latch:false,kind:'push'},T:[[-20,-40],[20,-40],[-20,40],[20,40]],N:['1a','1b','2a','2b'],B:[-34,-40,68,80],
 draw:c=>{const a=SIM()&&actu(c);return P('M-20,-40V-22M20,-40V-22M-20,40V22M20,40V22')+bodyBox(-26,-22,52,44)+C(0,0,a?10:12,a?'en':'')+TT(-28,-30,'1',c)+TT(-28,36,'2',c)},
 cond:c=>actu(c)?[[0,1],[2,3],[0,2]]:[[0,1],[2,3]],click:c=>DEFS.btn.click(c),say:c=>actu(c)?['on',`${c.tag} pressionado`]:null},
dipsw:{n:'Interruptor DIP',own:'S',act:1,def:{n:4,sw:0},F:[['n','Chaves','sel',[['4','4'],['6','6'],['8','8']]]],
 T:c=>{const n=+c.n||4,x0=-Math.floor(n/2)*20;const t=[];for(let i=0;i<n;i++)t.push([x0+i*20,-40]);for(let i=0;i<n;i++)t.push([x0+i*20,40]);return t},
 N:c=>{const n=+c.n||4,t=[];for(let i=0;i<n;i++)t.push(String(i+1));for(let i=0;i<n;i++)t.push(String(2*n-i));return t},
 B:c=>{const n=+c.n||4,x0=-Math.floor(n/2)*20;return[x0-14,-40,(n-1)*20+28,80]},
 draw:c=>{const n=+c.n||4,x0=-Math.floor(n/2)*20,st=SIM()?(rt.dip&&rt.dip[c.id]):+c.sw||0;let s=bodyBox(x0-12,-24,(n-1)*20+24,48)+TT(x0-6,-28,'ON',c);
  for(let i=0;i<n;i++){const x=x0+i*20,on=(st>>i)&1;s+=L(x,-40,x,-24)+L(x,40,x,24)+R(x-6,-14,12,28,'',' rx="2" style="fill:var(--panel2)"')+R(x-5,on?-13:1,10,12,on?'en':'',' rx="1"')+TT(x,22,String(i+1),c)}return s},
 cond:c=>{const n=+c.n||4,st=rt&&rt.dip?rt.dip[c.id]||0:0,o=[];for(let i=0;i<n;i++)if((st>>i)&1)o.push([i,n+i]);return o},
 click:()=>{},hitClick:(c,x)=>{const n=+c.n||4,x0=-Math.floor(n/2)*20,i=Math.round((x-x0)/20);if(i<0||i>=n)return;rt.dip=rt.dip||{};rt.dip[c.id]=(rt.dip[c.id]||0)^(1<<i);logE(`${c.tag}: chave ${i+1} ${(rt.dip[c.id]>>i)&1?'ON':'OFF'}`,'a')}},
kp4:{n:'Teclado 4×4',own:'S',act:1,T:[[-80,100],[-60,100],[-40,100],[-20,100],[0,100],[20,100],[40,100],[60,100]],N:['L1','L2','L3','L4','C1','C2','C3','C4'],B:[-94,-100,168,200],
 draw:c=>{const k=SIM()&&rt.kp&&rt.kp[c.id];let s=bodyBox(-90,-96,160,180)+TT(-10,-82,'TECLADO 4×4',c);const K4='123A456B789C*0#D';
  for(let r=0;r<4;r++)for(let q=0;q<4;q++){const x=-85+q*40,y=-66+r*36,on=k&&k.r===r&&k.c===q;s+=R(x,y,30,28,on?'en':'',' rx="4" style="fill:var(--panel2)"')+T(x+15,y+19,K4[r*4+q],c.r,'lv')}
  ['L1','L2','L3','L4','C1','C2','C3','C4'].forEach((n,i)=>{const x=-80+i*20;s+=L(x,100,x,84)+TT(x,80,n,c)});return s},
 cond:c=>{const k=rt&&rt.kp&&rt.kp[c.id];return k?[[k.r,4+k.c]]:[]},click:()=>{},
 hitClick:(c,x,y)=>{const q=Math.floor((x+85)/40),r=Math.floor((y+66)/36);if(q<0||q>3||r<0||r>3)return;rt.kp=rt.kp||{};rt.kp[c.id]={r,c:q,key:'123A456B789C*0#D'[r*4+q]};logE(`${c.tag}: tecla ${rt.kp[c.id].key}`,'a');return 'hold'},
 release:c=>{if(rt.kp)delete rt.kp[c.id]}},
pdiode:{n:'Fotodiodo',own:'D',act:1,def:{lux:50},F:[['lux','Luz (%)','num',null,LV]],T:V2,N:['A','K'],B:[-20,-40,46,80],
 draw:c=>L(0,-40,0,8)+P('M-10,8H10L0,-8Z','fillink')+L(-10,-8,10,-8)+L(0,-8,0,40)+P('M-22,-20l8,6M-22,-8l8,6')+TT(16,-20,`${c.lux}%`,c),
 an:(c,x)=>{vNorton(x,c,0,1,1e-4*Math.max(0,Math.min(100,+c.lux||0))/100,1e-7);x.dio(c,0,1,.45,40,c.id+':d')},click:c=>{c.lux=((+c.lux||0)+25)%125;logE(`${c.tag}: luz ${c.lux}%`,'a')},val:c=>`${c.lux}% luz`},
ptrans:{n:'Sensor de luz ambiente (fototransistor)',own:'Q',act:1,def:{lux:50},F:[['lux','Luz (%)','num',null,LV]],T:[[20,-40],[20,40]],N:['C','E'],B:[-30,-40,56,80],
 draw:c=>L(-4,-16,-4,16,'thick')+P('M-4,-8L20,-24V-40M-4,8L20,24V40')+C(4,0,24)+P('M12,21L20,24L15,16','fillink')+P('M-30,-26l10,8M-30,-12l10,8')+TT(-16,30,`${c.lux}%`,c),
 an:(c,x)=>x.r(c,0,1,2e6*Math.pow(10,-3*Math.max(0,Math.min(100,+c.lux||0))/100)),click:c=>{c.lux=((+c.lux||0)+25)%125;logE(`${c.tag}: luz ${c.lux}%`,'a')},val:c=>`${c.lux}% luz`},
flex:{n:'Sensor flexível',own:'R',act:1,def:{bend:0},F:[['bend','Dobra (%)','num',null,LV]],T:V2,N:['1','2'],B:[-20,-40,40,80],
 draw:c=>L(0,-40,0,-26)+L(0,26,0,40)+P(`M0,-26Q${8+((+c.bend||0)/10)},0 0,26`,'thick')+TT(14,0,`${c.bend}%`,c),
 an:(c,x)=>x.r(c,0,1,25000+75000*Math.max(0,Math.min(100,+c.bend||0))/100),click:c=>{c.bend=((+c.bend||0)+25)%125;logE(`${c.tag}: dobra ${c.bend}%`,'a')},val:c=>fmtE(25000+750*(+c.bend||0),'Ω')},
fsr:{n:'Sensor de força (FSR)',own:'R',act:1,def:{f:0},F:[['f','Força (N)','num',null,LV]],T:V2,N:['1','2'],B:[-22,-40,58,80],
 draw:c=>L(0,-40,0,-18)+L(0,18,0,40)+C(0,0,16,+c.f>0?'en':'')+C(0,0,8)+TT(22,4,`${c.f} N`,c),
 an:(c,x)=>{const f=+c.f||0;x.r(c,0,1,f<=.05?1e7:3000/f)},click:c=>{const f=+c.f||0;c.f=f>=10?0:f>=5?10:f>=1?5:1;logE(`${c.tag}: força ${c.f} N`,'a')},val:c=>`${c.f} N`},
tmp36:{n:'Sensor de temperatura TMP36',own:'U',act:1,def:{temp:25},F:[['temp','Temperatura (°C)','num',null,LV]],T:[[-20,40],[0,40],[20,40]],N:['+Vs','Vout','GND'],B:[-26,-30,52,70],
 draw:c=>P('M-18,10V-6A18,18 0 0 1 18,-6V10Z','box')+L(-20,40,-20,10)+L(0,40,0,10)+L(20,40,20,10)+TT(0,0,'TMP36',c),
 an:(c,x)=>x.r(c,0,2,1e5),der:(c,X)=>{if(X.vdc(0)-X.vdc(2)>=2.7)X.push(1,c.tag+'.o:+',X.vdc(2)+.5+(+c.temp||0)/100,100,2)},
 click:c=>{c.temp=(((+c.temp||0)+50+10)%175)-50;logE(`${c.tag}: ${c.temp} °C`,'a')},val:c=>`${c.temp} °C`},
tilt:{n:'Sensor de inclinação',own:'S',act:1,T:V2,N:['1','2'],B:[-20,-40,40,80],
 draw:c=>{const t=SIM()&&rt.btn[c.id];return L(0,-40,0,-18)+L(0,18,0,40)+R(-12,-18,24,36,'box',' rx="10"')+C(0,t?-8:8,6,'fillink')+L(-6,14,6,14)},
 cond:c=>rt&&rt.btn[c.id]?[]:[[0,1]],click:c=>{rt.btn[c.id]=!rt.btn[c.id];logE(`${c.tag} ${rt.btn[c.id]?'inclinado (aberto)':'em pé (fechado)'}`,'a')}},
soil:{n:'Sensor de umidade do solo',own:'U',act:1,def:{hum:30},F:[['hum','Umidade (%)','num',null,LV]],T:[[-20,-60],[0,-60],[20,-60]],N:['VCC','GND','SIG'],B:[-30,-60,60,124],
 draw:c=>PINS(c,[[-20,-60,'VCC'],[0,-60,'GND'],[20,-60,'SIG']])+bodyBox(-32,-48,64,42)+P('M-14,-6V56l4,6l4,-6V-6M14,-6V56l-4,6l-4,-6V-6','box')+TT(0,-24,`${c.hum}%`,c),
 an:(c,x)=>x.r(c,0,1,2e4),der:(c,X)=>{const v=X.vdc(0)-X.vdc(1);if(v>=2.5)X.push(2,c.tag+'.o:+',X.vdc(1)+v*.9*Math.max(0,Math.min(100,+c.hum||0))/100,200,1)},
 click:c=>{c.hum=((+c.hum||0)+20)%120;logE(`${c.tag}: umidade ${c.hum}%`,'a')},val:c=>`${c.hum}% umidade`},
gas:{n:'Sensor de gás',own:'U',act:1,def:{gas:0},F:[['gas','Concentração de gás (%)','num',null,LV]],T:[[-20,-40],[0,-40],[20,-40],[-20,40],[0,40],[20,40]],N:['A1','H1','B1','A2','H2','B2'],B:[-34,-40,68,80],
 draw:c=>PINS(c,[[-20,-40,'A'],[0,-40,'H'],[20,-40,'B'],[-20,40,'A'],[0,40,'H'],[20,40,'B']],1)+C(0,0,26,+c.gas>0?'en':'box')+C(0,0,16)+P('M-10,-4h20M-10,4h20','dash'),
 an:(c,x)=>{x.r(c,0,3,.01);x.r(c,2,5,.01);x.r(c,1,4,33);x.r(c,0,2,1e5/(1+Math.max(0,+c.gas||0)/2))},click:c=>{c.gas=((+c.gas||0)+25)%125;logE(`${c.tag}: gás ${c.gas}%`,'a')},val:c=>`${c.gas}% gás`},
pir:{n:'Sensor PIR (presença)',own:'U',act:1,def:{hold:3},F:[['hold','Tempo ligado (s)','num',null,LV]],T:[[-20,60],[0,60],[20,60]],N:['SINAL','VCC','GND'],B:[-40,-40,80,104],
 draw:c=>{const on=SIM()&&(DEV(c).t||0)>0;return PINS(c,[[-20,60,'S'],[0,60,'+'],[20,60,'−']])+bodyBox(-36,-8,72,56)+P('M-26,-8A26,30 0 0 1 26,-8Z',on?'en':'box')+P('M-16,-18h32M-20,-28h40','dash')+TT(0,30,on?'MOVIMENTO':'PIR',c)},
 an:(c,x)=>x.r(c,1,2,5e4),der:(c,X)=>{const v=X.vdc(1)-X.vdc(2);if(v>=3&&(DEV(c).t||0)>0)X.push(0,c.tag+'.o:+',X.vdc(2)+Math.min(v,3.3),100,2);else X.push(0,c.tag+'.o:-',X.vdc(2),1000)},
 click:c=>{DEV(c).t=+c.hold||3;logE(`${c.tag}: movimento detectado`,'a')},tick:(c,dt)=>{const d=DEV(c);if((d.t||0)>0){d.t-=dt;if(d.t<=0){d.t=0;return true}}return false}},
hcsr04:{n:'Sensor de distância ultrassônico (HC-SR04)',own:'U',act:1,def:{dist:100},F:[['dist','Distância do objeto (cm)','num',null,LV]],T:[[-40,40],[-20,40],[0,40],[20,40]],N:['VCC','TRIG','ECHO','GND'],B:[-62,-40,124,80],
 draw:c=>PINS(c,[[-40,40,'VCC'],[-20,40,'TRIG'],[0,40,'ECHO'],[20,40,'GND']])+bodyBox(-60,-28,120,56)+C(-30,-4,18)+C(-30,-4,10)+C(30,-4,18)+C(30,-4,10)+TT(0,-14,`${c.dist} cm`,c),
 an:(c,x)=>{x.r(c,0,3,330);x.r(c,1,3,1e6)},click:c=>{c.dist=(+c.dist||0)>=300?10:(+c.dist||0)+30;logE(`${c.tag}: objeto a ${c.dist} cm`,'a')},val:c=>`${c.dist} cm`},
ping:{n:'Sensor de distância ultrassônico (PING)',own:'U',act:1,def:{dist:100},F:[['dist','Distância do objeto (cm)','num',null,LV]],T:[[-20,40],[0,40],[20,40]],N:['GND','5V','SIG'],B:[-52,-40,104,80],
 draw:c=>PINS(c,[[-20,40,'GND'],[0,40,'5V'],[20,40,'SIG']])+bodyBox(-50,-28,100,56)+C(-24,-4,16)+C(24,-4,16)+TT(0,-14,`${c.dist} cm`,c),
 an:(c,x)=>x.r(c,1,0,330),click:c=>DEFS.hcsr04.click(c),val:c=>`${c.dist} cm`},
irrx:{n:'Sensor infravermelho (receptor IR)',own:'U',T:[[-20,40],[0,40],[20,40]],N:['OUT','GND','VCC'],B:[-30,-34,60,74],
 draw:c=>{const on=SIM()&&rt.ir&&rt.simT-rt.ir.t<.3;return PINS(c,[[-20,40,'OUT'],[0,40,'GND'],[20,40,'VCC']],1)+bodyBox(-22,-26,44,44,on?'en':'box')+C(0,-6,10)+TT(0,14,'IR',c)},
 an:(c,x)=>x.r(c,2,1,2e4),der:(c,X)=>{const v=X.vdc(2)-X.vdc(1);if(v>=2.5)X.push(0,c.tag+'.o:+',X.vdc(1)+v,1000,1)}},
irremote:{n:'Controle remoto infravermelho',own:'RC',act:1,dom:'x',T:[],B:[-50,-100,100,200],
 draw:c=>{let s=R(-46,-96,92,192,'box',' rx="14"');const KB=IRKEYS;for(let i=0;i<KB.length;i++){const r=Math.floor(i/3),q=i%3,x=-36+q*26,y=-80+r*24,on=SIM()&&rt.ir&&rt.ir.k===i&&rt.simT-rt.ir.t<.3;s+=R(x,y,20,18,on?'en':'',' rx="5" style="fill:var(--panel2)"')+T(x+10,y+12.5,KB[i][0],c.r,'tn6')}return s},
 click:()=>{},hitClick:(c,x,y)=>{const q=Math.floor((x+36)/26),r=Math.floor((y+80)/24),i=r*3+q;if(q<0||q>2||r<0||i>=IRKEYS.length)return;rt.irn=(rt.irn||0)+1;rt.ir={k:i,cmd:IRKEYS[i][1],t:rt.simT||0,n:rt.irn};logE(`${c.tag}: tecla ${IRKEYS[i][0]}`,'a')}},
/* ---------- saída ---------- */
vibm:{n:'Motor de vibração',own:'M',def:{Vn:3},F:[['Vn','Tensão nominal (V)','eng','V',LV]],T:V2,N:['+','−'],B:[-22,-40,44,80],
 draw:c=>{const on=SIM()&&Math.abs(VD(c,0,1))>.4*(+c.Vn||3);return L(0,-40,0,-16)+L(0,16,0,40)+C(0,0,16,on?'en':'')+P('M-6,-4h12v8h-12z','fillink')+(on?P('M-22,-8l-4,4l4,4l-4,4M22,-8l4,4l-4,4l4,4','wave'):'')},
 an:(c,x)=>x.r(c,0,1,(+c.Vn||3)/.08),say:c=>Math.abs(VD(c,0,1))>.4*(+c.Vn||3)?['on',`${c.tag} vibrando`]:null},
encm:{n:'Motor CC com codificador (encoder)',own:'M',def:{Vn:6,rpm:200,cpr:12},F:[['Vn','Tensão nominal (V)','eng','V',LV],['rpm','Rotação nominal (rpm)','num',null,LV],['cpr','Pulsos por volta (encoder)','num',null,LV]],
 T:[[-40,60],[-20,60],[0,60],[20,60],[40,60],[60,60]],N:['M+','M−','GND','VCC','A','B'],B:[-56,-50,128,114],
 draw:c=>{const d=DEV(c),w=SIM()?Math.round(d.rpm||0):0;return PINS(c,[[-40,60,'M+'],[-20,60,'M−'],[0,60,'GND'],[20,60,'VCC'],[40,60,'A'],[60,60,'B']])+bodyBox(-50,-40,120,88)+C(-10,0,24,Math.abs(w)>1?'en':'')+T(-10,5,'M',c.r,'lv')+TT(40,-16,'ENC',c)+TT(40,4,`${w} rpm`,c)},
 an:(c,x)=>{x.r(c,0,1,(+c.Vn||6)/.15);x.r(c,3,2,1e4)},
 tick:(c,dt)=>{if(!rt.A)return false;const d=DEV(c),v=VD(c,0,1),tgt=v/(+c.Vn||6)*(+c.rpm||200);d.rpm=(d.rpm||0)+(tgt-(d.rpm||0))*Math.min(1,dt/.15);d.ph=(d.ph||0)+d.rpm/60*dt*(+c.cpr||12)*4;const st=((Math.floor(d.ph)%4)+4)%4,a=st===1||st===2,b=st>=2;if(a!==d.a||b!==d.b||Math.abs(d.rpm-tgt)>.5){d.a=a;d.b=b;return true}return false},
 der:(c,X)=>{const d=DEV(c),v=X.vdc(3)-X.vdc(2);if(v<2.5)return;X.push(4,c.tag+'.a'+(d.a?':+':':-'),X.vdc(2)+(d.a?v:0),200,2);X.push(5,c.tag+'.b'+(d.b?':+':':-'),X.vdc(2)+(d.b?v:0),200,2)},
 say:c=>{const d=DEV(c);return Math.abs(d.rpm||0)>1?['on',`${c.tag} girando a ${Math.round(d.rpm)} rpm`]:null}},
servo:{n:'Micro servo',own:'M',T:[[-20,60],[0,60],[20,60]],N:['GND','VCC','SINAL'],B:[-50,-56,100,120],
 draw:c=>{const a=SIM()?(DEV(c).ang!=null?DEV(c).ang:90):90,rad=(180-a)*Math.PI/180,x=Math.cos(rad)*34,y=-Math.sin(rad)*34;
  return PINS(c,[[-20,60,'−'],[0,60,'+'],[20,60,'S']])+bodyBox(-44,-14,88,58)+C(0,-14,10,'box')+L(0,-14,x,-14+y,'thick')+C(x,-14+y,4,'fillink')+TT(0,30,`${Math.round(a)}°`,c)},
 an:(c,x)=>{x.r(c,1,0,500);x.r(c,2,0,1e5)},
 tick:(c,dt)=>{if(!rt.A)return false;const d=DEV(c);if(d.lib&&rt.simT-d.lib<.5)return false;const h=VD(c,2,0)>1.5,t=rt.simT||0;if(h&&!d.h)d.t0=t;if(!h&&d.h&&d.t0!=null){const w=t-d.t0;if(w>4e-4&&w<3e-3){const a=Math.max(0,Math.min(180,(w-5e-4)/2e-3*180));if(Math.abs(a-(d.ang||0))>.5){d.ang=a;d.h=h;return true}}}d.h=h;return false},
 say:c=>{const d=DEV(c);return d.ang!=null?['on',`${c.tag} em ${Math.round(d.ang)}°`]:null}},
piezo:{n:'Piezo (buzzer)',own:'H',T:V2,N:['+','−'],B:[-24,-40,48,80],
 draw:c=>{const f=piezoF(c);return L(0,-40,0,-16)+L(0,16,0,40)+C(0,0,18,f?'en':'box')+C(0,0,6,'fillink')+(f?P('M24,-8a10,10 0 0 1 0,16M29,-13a16,16 0 0 1 0,26','wave')+TT(0,30,`${Math.round(f)} Hz`,c):'')},
 an:(c,x)=>x.r(c,0,1,1000),say:c=>{const f=piezoF(c);return f?['on',`${c.tag} tocando ${Math.round(f)} Hz`]:null}},
neopx:{n:'NeoPixel',own:'NP',def:{n:1,shape:'px'},F:[['shape','Formato','sel',[['px','LED único'],['ring','Anel'],['strip','Faixa']]],['n','Quantidade de LEDs','num',null]],
 T:c=>c.shape==='px'?[[-20,40],[0,40],[20,40],[40,40]]:[[-20,npH(c)],[0,npH(c)],[20,npH(c)],[40,npH(c)]],N:['+5V','GND','DIN','DOUT'],
 B:c=>{if(c.shape==='ring'){const r=npR(c);return[-r-10,-r-10,2*r+20,r+10+npH(c)]}if(c.shape==='strip'){const w=(+c.n||8)*20;return[-30,-24,Math.max(w+20,90),npH(c)+24]}return[-30,-24,80,64]},
 draw:c=>{const n=c.shape==='px'?1:Math.max(1,Math.min(64,+c.n||8)),col=DEV(c).px||[],pw=!SIM()||PWR(c,0,1,3.5),dot=(x,y,i,r)=>{const v=col[i]||0,rr=(v>>16)&255,g=(v>>8)&255,b=v&255,on=SIM()&&pw&&v;return C(x,y,r,'',on?` style="fill:rgb(${rr},${g},${b});stroke:rgb(${rr},${g},${b});filter:drop-shadow(0 0 5px rgb(${rr},${g},${b}))"`:' style="fill:color-mix(in srgb,var(--muted) 15%,transparent)"')};
  let s='';const h=npH(c);[[-20,'+'],[0,'−'],[20,'IN'],[40,'OUT']].forEach(([x,t])=>s+=L(x,h,x,h-10)+PINL(x,h-6,t));
  if(c.shape==='ring'){const r=npR(c);s+=C(0,0,r+8,'box')+C(0,0,r-8,'')+L(-20,h-10,-20,r+2)+L(0,h-10,0,r+6)+L(20,h-10,20,r+6)+L(40,h-10,40,r-2);for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;s+=dot(Math.cos(a)*r,Math.sin(a)*r,i,Math.min(6,Math.PI*r/n*.8))}}
  else if(c.shape==='strip'){s+=R(-26,-18,Math.max(n*20+12,86),26,'box',' rx="3"');for(let i=0;i<n;i++)s+=dot(-12+i*20,-5,i,6);s+=P(`M-20,8V${h-10}M0,8V${h-10}M20,8V${h-10}M40,8V${h-10}`)}
  else{s+=R(-26,-20,72,40,'box',' rx="6"')+dot(10,-2,0,10)+P(`M-20,20V${h-10}M0,20V${h-10}M20,20V${h-10}M40,20V${h-10}`)}return s},
 an:(c,x)=>{x.r(c,0,1,2000);x.r(c,2,1,1e6)}},
lcd:{n:'LCD 16×2',own:'LCD',T:LCDT(),N:['GND','VCC','V0','RS','RW','E','D0','D1','D2','D3','D4','D5','D6','D7','LED+','LED−'],B:[-180,-90,360,170],
 draw:c=>{let s=LCDBODY(c);LCDT().forEach(([x,y],i)=>{s+=L(x,y,x,54)+`<text x="${x+2}" y="49" class="tn6" transform="rotate(-90 ${x+2} 49)" style="text-anchor:start">${['GND','VCC','V0','RS','RW','E','D0','D1','D2','D3','D4','D5','D6','D7','A','K'][i]}</text>`});return s.replace('y="74"','y="74"')},
 an:(c,x)=>{x.r(c,1,0,5000);x.dio(c,14,15,2.8,60,c.id+':bl')},val:()=>''},
lcdi2c:{n:'LCD 16×2 (I2C)',own:'LCD',def:{addr:'0x27'},F:[['addr','Endereço I2C','text']],T:[[-200,0],[-200,20],[-200,40],[-200,60]],N:['GND','VCC','SDA','SCL'],B:[-200,-90,380,170],
 draw:c=>{let s=LCDBODY(c,true);[['GND',0],['VCC',20],['SDA',40],['SCL',60]].forEach(([n,y])=>{s+=L(-200,y,-176,y)+TT(-158,y+3,n,c)});return s},an:(c,x)=>x.r(c,1,0,5000),val:c=>c.addr},
tm1637:{n:'Display de 4 dígitos (TM1637)',own:'DS',T:[[-20,40],[0,40],[20,40],[40,40]],N:['CLK','DIO','VCC','GND'],B:[-80,-40,160,92],
 draw:c=>{const d=DEV(c),pw=!SIM()||PWR(c,2,3,3);let s=bodyBox(-76,-36,152,64)+PINS(c,[[-20,40,'CLK'],[0,40,'DIO'],[20,40,'VCC'],[40,40,'GND']]);
  for(let k=0;k<4;k++)s+=SEG7(-60+k*32,-30,(SIM()&&pw&&d.seg)?d.seg[k]||0:0,'#e23d3d')+(k===1?C(-60+k*32+28,-12,2,SIM()&&pw&&d.colon?'':'',SIM()&&pw&&d.colon?' style="fill:#e23d3d;stroke:none"':' style="fill:color-mix(in srgb,var(--muted) 25%,transparent);stroke:none"')+C(-60+k*32+28,0,2,'',SIM()&&pw&&d.colon?' style="fill:#e23d3d;stroke:none"':' style="fill:color-mix(in srgb,var(--muted) 25%,transparent);stroke:none"'):'');return s},
 an:(c,x)=>x.r(c,2,3,2000)},
/* ---------- potência ---------- */
solar:{n:'Célula solar',own:'G',act:1,def:{lux:100,Voc:5,Isc:.1},F:[['lux','Luz (%)','num',null,LV],['Voc','Tensão em aberto (V)','eng','V',LV],['Isc','Corrente de curto (A)','eng','A',LV]],T:V2,N:['+','−'],B:[-30,-40,60,80],
 draw:c=>L(0,-40,0,-20)+L(0,20,0,40)+R(-26,-20,52,40,+c.lux>0&&SIM()?'en':'box')+P('M-26,-7H26M-26,7H26M-9,-20V20M9,-20V20','dash')+TT(36,-16,'+',c),
 an:(c,x)=>{const I=(+c.Isc||.1)*Math.max(0,Math.min(100,+c.lux||0))/100;vNorton(x,c,0,1,I,1e-4);x.dio(c,0,1,+c.Voc||5,1,c.id+':d')},click:c=>{c.lux=((+c.lux||0)+25)%125;logE(`${c.tag}: luz ${c.lux}%`,'a')},val:c=>`${c.lux}% luz`},
usba:{n:'Conector USB A (5 V)',own:'X',T:[[-40,40],[-20,40],[0,40],[20,40]],N:['VBUS','D−','D+','GND'],B:[-56,-30,90,70],
 draw:c=>PINS(c,[[-40,40,'5V'],[-20,40,'D−'],[0,40,'D+'],[20,40,'GND']])+R(-52,-26,82,48,'box',' rx="3"')+R(-44,-16,66,14,'',' style="fill:var(--panel2)"')+TT(-10,14,'USB',c),
 an:(c,x)=>x.bat(c,0,3,5,.2),val:()=>'5 V'},
/* ---------- instrumentos ---------- */
mmeter:{n:'Multímetro',own:'MM',def:{m:'V'},F:[['m','Função','sel',[['V','Voltímetro (V)'],['A','Amperímetro (A)'],['R','Ohmímetro (Ω)']]]],T:[[-40,60],[0,60],[40,60]],N:['COM','VΩ','A'],B:[-56,-60,112,124],
 draw:c=>{const r=SIM()?mmRead(c):'',m=c.m||'V';return bodyBox(-52,-56,104,100,'')+R(-44,-48,88,30,'',' rx="3" style="fill:#0d1b14"')+`<text x="40" y="-27" class="lv" style="fill:#7cf2a0;text-anchor:end;font-size:13px">${esc(r||'— — —')}</text>`+
  TT(-30,-6,m==='V'?'● V':'○ V',c)+TT(0,-6,m==='R'?'● Ω':'○ Ω',c)+TT(30,-6,m==='A'?'● A':'○ A',c)+C(-40,26,6,'box')+C(0,26,6,m!=='A'?'en':'box')+C(40,26,6,m==='A'?'en':'box')+L(-40,32,-40,60)+L(0,32,0,60)+L(40,32,40,60)+TT(-40,14,'COM',c)+TT(0,14,'VΩ',c)+TT(40,14,'A',c)},
 an:(c,x)=>{const m=c.m||'V';if(m==='A'){x.r(c,2,0,.01);x.r(c,1,0,1e7)}else if(m==='R')x.bat(c,1,0,1,1000);else x.r(c,1,0,1e7)},val:c=>({V:'V',A:'A',R:'Ω'})[c.m||'V'],
 say:c=>{const r=mmRead(c);return r?['m',`${c.tag} marca ${r}`]:null}},
psub:{n:'Fonte de bancada',own:'G',def:{V:12,Ilim:1},F:[['V','Tensão (V)','eng','V',LV],['Ilim','Limite de corrente (A)','eng','A',LV]],T:[[-20,60],[20,60]],N:['+','−'],B:[-60,-50,120,114],
 draw:c=>{const o=SIM()&&rt.A&&rt.A.m[c.id],d=DEV(c),cc=d.cc;return bodyBox(-56,-46,112,90)+R(-48,-38,96,24,'',' rx="3" style="fill:#0d1b14"')+R(-48,-10,96,22,'',' rx="3" style="fill:#0d1b14"')+
  `<text x="40" y="-21" class="lv" style="fill:#7cf2a0;text-anchor:end">${o?fmtE(Math.abs(VD(c,0,1)),'V'):fmtE(+c.V,'V')}</text><text x="40" y="5" class="lv" style="fill:${cc?'#ff8a3d':'#7cf2a0'};text-anchor:end">${o?fmtE(o.i,'A'):fmtE(+c.Ilim,'A')}</text>`+
  TT(-40,32,cc?'CC':'CV',c)+L(-20,40,-20,60)+L(20,40,20,60)+C(-20,32,5,'',' style="fill:#d7263d;stroke:none"')+C(20,32,5,'fillink')},
 an:(c,x)=>{const d=rt?DEV(c):{},v=d.v!=null?d.v:+c.V||0;x.bat(c,0,1,v,.01)},
 psAdj:(c,A)=>{if(!A||!A.m[c.id])return false;const d=DEV(c),I=A.m[c.id].i,L0=+c.Ilim||1,V0=+c.V||0;let v=d.v!=null?d.v:V0,nv=v;
  if(I>L0*1.005)nv=Math.max(0,v*L0/I);else if(v<V0-1e-4&&I<L0*.995)nv=Math.min(V0,I>1e-9?v*L0/I:V0);const cc=nv<V0-1e-3;if(Math.abs(nv-v)>1e-4||cc!==!!d.cc){d.v=nv;d.cc=cc;return true}return false},
 val:c=>`${fmtE(+c.V,'V')} ${fmtE(+c.Ilim,'A')}`},
fgen:{n:'Gerador de função',own:'G',def:{w:'sq',f:1,Vpp:5,off:2.5},F:[['w','Forma de onda','sel',[['sin','Senoidal'],['sq','Quadrada'],['tri','Triangular'],['saw','Dente de serra']]],['f','Frequência (Hz)','eng','Hz',LV],['Vpp','Amplitude pico a pico (V)','eng','V',LV],['off','Nível CC (offset, V)','eng','V',LV]],
 T:[[-20,60],[20,60]],N:['+','COM'],B:[-62,-50,124,114],
 draw:c=>{const w=c.w||'sq',wave={sin:'M-36,-9q6,-12 12,0t12,0t12,0t12,0',sq:'M-36,-9v-8h12v16h12v-16h12v16h12v-8',tri:'M-36,-9l6,-8l12,16l12,-16l12,16l6,-8',saw:'M-36,-1l16,-16v16l16,-16v16l16,-16v16'}[w];
  return bodyBox(-58,-46,116,90)+R(-48,-38,96,40,'',' rx="3" style="fill:#0d1b14"')+P(wave,''," style=\"stroke:#f2b705\"")+`<text x="44" y="-28" class="tn6" style="fill:#7cf2a0;text-anchor:end">${fmtE(+c.f,'Hz')} · ${fmtE(+c.Vpp,'V')}pp</text>`+
  L(-20,40,-20,60)+L(20,40,20,60)+C(-20,30,5,'',' style="fill:#d7263d;stroke:none"')+C(20,30,5,'fillink')+TT(-31,33,'+',c)+TT(35,33,'COM',c)},
 an:(c,x)=>x.bat(c,0,1,fgenV(c),50),val:c=>`${fmtE(+c.f,'Hz')}`},
/* ---------- controle de potência ---------- */
pmos:{n:'MOSFET canal P',own:'Q',T:[[20,-40],[-40,0],[20,40]],N:['D (dreno)','G (gate)','S (fonte)'],B:[-42,-40,72,80],def:{Vth:2,Rds:.05,Idmax:10,Pmax:30},
 F:[['Vth','Tensão de disparo |Vgs| (V)','eng','V',LV],['Rds','Resistência ligado Rds(on) (Ω)','eng','Ω',LV],['Idmax','Corrente máxima (A)','eng','A',LV],['Pmax','Potência máxima (W)','eng','W',LV]],
 draw:c=>{const on=SIM()&&rt.A&&rt.A.m[c.id]&&rt.A.m[c.id].on;return L(-40,0,-8,0)+C(-10,0,3)+L(-8,-16,-8,16)+L(-2,-18,-2,-8,on?'on':'')+L(-2,-4,-2,4,on?'on':'')+L(-2,8,-2,18,on?'on':'')+P('M-2,-13H20V-40M-2,13H20V40M-2,0H20V13')+P('M8,-4L13,0L8,4','fillink')+T(24,-30,'D',c.r,'tn')+T(-36,-6,'G',c.r,'tn')+T(24,36,'S',c.r,'tn')},
 an:(c,x)=>x.fet(c,0,1,2,c.Vth,c.Rds,true),burn:(c,o)=>o.i>1.5*c.Idmax?`corrente de ${fmtE(o.i,'A')} (máximo ${fmtE(+c.Idmax,'A')})`:o.p>2*c.Pmax?`dissipando ${fmtE(o.p,'W')}`:null,
 say:c=>{const o=AM(c.id);return o&&o.on?['on',`${c.tag} ligado: ${fmtE(o.i,'A')}`]:null},rd:(c,o)=>o.on?`ligado · ${fmtE(o.i,'A')}`:'desligado',val:c=>`Vth ${fmtE(+c.Vth,'V')}`},
rly1:{n:'Relé SPDT',own:'K',def:{Vn:5,Rc:70},F:[['Vn','Tensão da bobina (V)','eng','V',LV],['Rc','Resistência da bobina (Ω)','eng','Ω',LV]],T:[[-40,-40],[-40,40],[40,40],[20,-40],[60,-40]],N:['A1','A2','COM','NF','NA'],B:[-58,-40,130,80],
 draw:c=>{const on=SIM()&&rt.res&&rt.res.en[c.id];return L(-40,-40,-40,-14)+L(-40,14,-40,40)+R(-52,-14,24,28,on?'en':'box')+L(-28,0,0,0,'dash')+L(20,-40,20,-14)+L(60,-40,60,-14)+L(40,40,40,14)+L(40,14,on?60:20,-12,'thick')+TT(20,-20,'NF',c)+TT(60,-20,'NA',c)+TT(48,28,'COM',c)},
 load:()=>[[0,1]],outF:(c,en)=>en,an:(c,x)=>x.r(c,0,1,+c.Rc||70),cond:(c,E)=>E.out[c.tag]?[[2,4]]:[[2,3]],pull:()=>.7},
rly2:{n:'Relé DPDT',own:'K',def:{Vn:5,Rc:70},F:[['Vn','Tensão da bobina (V)','eng','V',LV],['Rc','Resistência da bobina (Ω)','eng','Ω',LV]],
 T:[[-60,-40],[-60,40],[0,40],[-20,-40],[20,-40],[60,40],[40,-40],[80,-40]],N:['A1','A2','COM1','NF1','NA1','COM2','NF2','NA2'],B:[-76,-40,170,80],
 draw:c=>{const on=SIM()&&rt.res&&rt.res.en[c.id];const sw=(x,cx)=>L(x-20,-40,x-20,-14)+L(x+20,-40,x+20,-14)+L(cx,40,cx,14)+L(cx,14,on?x+20:x-20,-12,'thick');return L(-60,-40,-60,-14)+L(-60,14,-60,40)+R(-72,-14,24,28,on?'en':'box')+L(-48,0,70,0,'dash')+sw(0,0)+sw(60,60)+TT(-20,-20,'NF',c)+TT(20,-20,'NA',c)+TT(40,-20,'NF',c)+TT(80,-20,'NA',c)},
 load:()=>[[0,1]],outF:(c,en)=>en,an:(c,x)=>x.r(c,0,1,+c.Rc||70),cond:(c,E)=>E.out[c.tag]?[[2,4],[5,7]]:[[2,3],[5,6]],pull:()=>.7},
/* ---------- conectores ---------- */
hdr8:{n:'Conector de 8 pinos',own:'J',T:c=>{const t=[];for(let i=0;i<8;i++)t.push([-20,-80+i*20]);for(let i=0;i<8;i++)t.push([20,-80+i*20]);return t},N:c=>{const t=[];for(let i=1;i<=8;i++)t.push(String(i));for(let i=1;i<=8;i++)t.push(i+"'");return t},B:[-26,-90,52,180],
 draw:c=>{let s=R(-8,-90,16,180,'box',' rx="2"');for(let i=0;i<8;i++){const y=-80+i*20;s+=L(-20,y,-6,y)+L(6,y,20,y)+R(-4,y-4,8,8,'fillink')+TT(-13,y-4,String(i+1),c)}return s},
 cond:()=>{const o=[];for(let i=0;i<8;i++)o.push([i,8+i]);return o}}
});
/* a fonte de bancada limita a corrente antes de qualquer proteção ou queima ser avaliada */
{const _ap=analogPost;analogPost=function(A){let ch=false;for(const c of S.comps)if(c.type==='psub'&&DEFS.psub.psAdj(c,A))ch=true;if(ch)return true;return _ap(A)}}
/* teclas do controle remoto (rótulo, comando NEC) */
const IRKEYS=[['CH−',0x45],['CH',0x46],['CH+',0x47],['|◀◀',0x44],['▶▶|',0x40],['▶‖',0x43],['−',0x07],['+',0x15],['EQ',0x09],['0',0x16],['100+',0x19],['200+',0x0D],['1',0x0C],['2',0x18],['3',0x5E],['4',0x08],['5',0x1C],['6',0x5A],['7',0x42],['8',0x52],['9',0x4A]];
const IRVAL=cmd=>{const rv=b=>{let r=0;for(let i=0;i<8;i++)r=(r<<1)|((b>>i)&1);return r};return(0xFF<<16)|(rv(cmd)<<8)|rv(~cmd&255)};
function npH(c){return c.shape==='ring'?Math.ceil((npR(c)+30)/20)*20:40}
function npR(c){return Math.max(26,Math.round((+c.n||12)*3.2))}
function LCDT(){const t=[];for(let i=0;i<16;i++)t.push([-160+i*20,80]);return t}
function LCDBODY(c,i2c){const d=DEV(c),pw=!SIM()||PWR(c,1,0,3.5),bl=SIM()&&pw&&(i2c?d.bl!==false:(rt.ads&&rt.ads[c.id+':bl']));let s=bodyBox(-176,-86,352,140)+R(-160,-70,320,70,'',` rx="4" style="fill:${bl?'#9fd86a':'#6f8a3c'}"`);
 const lines=SIM()&&pw&&d.on!==false?(d.lines||['','']):['',''];for(let r=0;r<2;r++)for(let k=0;k<16;k++){const x=-154+k*19.5,y=-64+r*32;const ch=(lines[r]||'')[k]||' ';s+=R(x,y,17,28,'',' style="fill:rgba(0,0,0,.06);stroke:none"');if(ch!==' ')s+=`<text x="${x+8.5}" y="${y+21}" style="font:700 19px 'IBM Plex Mono',monospace;text-anchor:middle;fill:#1b2a10">${esc(ch)}</text>`;
  if(SIM()&&d.cursor&&d.cur&&d.cur[0]===k&&d.cur[1]===r)s+=R(x,y+24,17,3,'',' style="fill:#1b2a10;stroke:none"')}return s}
const SEGP={a:'M3,1h14',b:'M18,3v13',c:'M18,20v13',d:'M3,35h14',e:'M2,20v13',f:'M2,3v13',g:'M3,18h14'};
function SEG7(x,y,bits,col){let s=`<g transform="translate(${x} ${y})">`;'abcdefg'.split('').forEach((k,i)=>{const on=(bits>>i)&1;s+=`<path d="${SEGP[k]}" style="stroke:${on?col:'color-mix(in srgb,var(--muted) 25%,transparent)'};stroke-width:3.5;fill:none"/>`});return s+(((bits>>7)&1)?`<circle cx="21" cy="35" r="2" style="fill:${col};stroke:none"/>`:'')+'</g>'}
function fgenV(c){const t=rt?rt.simT||0:0,f=Math.max(1e-6,+c.f||1),ph=(t*f)%1,A=(+c.Vpp||0)/2,o=+c.off||0;const w=c.w||'sq';
 return o+A*(w==='sin'?Math.sin(2*Math.PI*ph):w==='sq'?(ph<.5?1:-1):w==='tri'?(ph<.5?4*ph-1:3-4*ph):2*ph-1)}
function piezoF(c){if(!SIM()||!rt.A)return 0;const d=DEV(c);if(d.tone&&(!d.until||rt.simT<d.until))return d.tone;return Math.abs(VD(c,0,1))>1.5?2300:0}
function mmRead(c){if(!SIM()||!rt.A)return'';const m=c.m||'V';if(m==='V')return fmtE(VD(c,1,0),'V');if(m==='A'){const o=rt.A.m[c.id];return o?fmtE(o.idc!=null?o.idc:o.i,'A'):''}
 const v=VD(c,1,0);if(v>=.999)return'OL';if(v<1e-5)return'0 Ω';return fmtE(1000*v/(1-v),'Ω')}
DYN.add('fgen');DYN.add('servo');DYN.add('encm');

/* ---------- clique em partes do componente (DIP, teclado, controle remoto) ---------- */
{const sv=document.getElementById('cv');let held=null;
 sv.addEventListener('pointerdown',e=>{if(mode!=='sim'||e.button!==0)return;const g=e.target.closest&&e.target.closest('.comp');if(!g)return;const c=byId(g.dataset.id),d=c&&D(c);if(!d||!d.hitClick)return;
  const p=toWorld(e),s=typeof SCL==='function'?SCL(c):1,o=rot([(p.x-c.x)/s,(p.y-c.y)/s],-(c.r||0));e.stopImmediatePropagation();e.preventDefault();const r=d.hitClick(c,o[0],o[1]);if(r==='hold')held=c;solve();refresh(true)},true);
 window.addEventListener('pointerup',()=>{if(held&&rt){const d=D(held);if(d.release)d.release(held);held=null;solve();refresh(true)}held=null})}
/* som: buzinas e piezos */
{const _s=sound;sound=function(){const pz=soundOn&&mode==='sim'&&rt&&rt.res&&S.comps.filter(c=>c.type==='piezo').map(piezoF).find(f=>f>0);if(!pz)return _s();
 try{if(!AC){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;AC=new A()}if(!OSC){OSC=AC.createOscillator();GAIN=AC.createGain();GAIN.gain.value=.03;OSC.type='square';OSC.connect(GAIN).connect(AC.destination);OSC.start()}OSC.frequency.setValueAtTime(Math.min(8000,pz),AC.currentTime)}catch(e){}}}
/* o redesenho também acompanha os dispositivos */
{const _sg=simSig;simSig=function(){return _sg()+(rt&&rt.dev?JSON.stringify(rt.dev):'')+(rt&&rt.dip?JSON.stringify(rt.dip):'')+(rt&&rt.kp?JSON.stringify(rt.kp):'')+(rt&&rt.ir?rt.ir.n:'')}}

/* ---------- CIs que faltavam ---------- */
{const T3=['1A','1B','2A','2B','2C','2Y','GND','3Y','3A','3B','3C','1Y','1C','VCC'],T4=['1A','1B','NC','1C','1D','1Y','GND','2Y','2A','2B','NC','2C','2D','VCC'];
 const g3=(n,d,f)=>({n,d,fam:'hc',pins:T3,vcc:14,gnd:7,ins:[1,2,13,3,4,5,9,10,11],ev:I=>({12:f(I(1),I(2),I(13)),6:f(I(3),I(4),I(5)),8:f(I(9),I(10),I(11))})});
 const g4=(n,d,f)=>({n,d,fam:'hc',pins:T4,vcc:14,gnd:7,ins:[1,2,4,5,9,10,12,13],ev:I=>({6:f(I(1),I(2),I(4),I(5)),8:f(I(9),I(10),I(12),I(13))})});
 const half=(I,st,V,u,trig,thr,res,ctl)=>{const vc=V(ctl);if(!I(res))st[u]=false;else if(V(trig)<vc/2)st[u]=true;else if(V(thr)>vc)st[u]=false;return!!st[u]};
 Object.assign(ICS,{
  '74HC132':{...ICS['74HC00'],n:'74HC132',d:'4 portas NAND Schmitt trigger'},
  '74HC10':g3('74HC10','3 portas NAND de 3 entradas',(a,b,c)=>!(a&&b&&c)),'74HC11':g3('74HC11','3 portas AND de 3 entradas',(a,b,c)=>a&&b&&c),'74HC27':g3('74HC27','3 portas NOR de 3 entradas',(a,b,c)=>!(a||b||c)),
  '74HC20':g4('74HC20','2 portas NAND de 4 entradas',(a,b,c,d)=>!(a&&b&&c&&d)),'74HC21':g4('74HC21','2 portas AND de 4 entradas',(a,b,c,d)=>a&&b&&c&&d),
  '74HC73':{n:'74HC73',d:'2 flip-flops JK (borda de descida)',fam:'hc',pins:['1CLK','~1CLR','1K','VCC','2CLK','~2CLR','2J','~2Q','2Q','2K','GND','1Q','~1Q','1J'],vcc:4,gnd:11,ins:[1,2,3,5,6,7,10,14],ctl:{2:true,6:true},
   clk:(I,st,P)=>{st.q=st.q||[false,false];[[1,14,3,0],[5,7,10,1]].forEach(([k,j,kk,u])=>{if(P[k]&&!I(k)){const J=I(j),Kk=I(kk);st.q[u]=J&&Kk?!st.q[u]:J?true:Kk?false:st.q[u]}})},
   ev:(I,st)=>{st.q=st.q||[false,false];if(!I(2))st.q[0]=false;if(!I(6))st.q[1]=false;return{12:st.q[0],13:!st.q[0],9:st.q[1],8:!st.q[1]}}},
  '74HC75':{n:'74HC75',d:'Trava (latch) de 4 bits',fam:'hc',pins:['~1Q','1D','2D','3C4','VCC','3D','4D','~4Q','4Q','~3Q','3Q','GND','1C2','~2Q','2Q','1Q'],vcc:5,gnd:12,ins:[2,3,4,6,7,13],
   ev:(I,st)=>{st.q=st.q||[0,0,0,0];if(I(13)){st.q[0]=I(2);st.q[1]=I(3)}if(I(4)){st.q[2]=I(6);st.q[3]=I(7)}const q=st.q;return{16:!!q[0],1:!q[0],15:!!q[1],14:!q[1],11:!!q[2],10:!q[2],9:!!q[3],8:!q[3]}}},
  '74HC93':{n:'74HC93',d:'Contador binário de 4 bits',fam:'hc',pins:['CKB','R0(1)','R0(2)','NC','VCC','NC','NC','QC','QB','GND','QD','QA','NC','CKA'],vcc:5,gnd:10,ins:[1,2,3,14],
   clk:(I,st,P)=>{st.a=st.a||0;st.b=st.b||0;if(I(2)&&I(3)){st.a=0;st.b=0;return}if(P[14]&&!I(14))st.a^=1;if(P[1]&&!I(1))st.b=(st.b+1)&7},
   ev:(I,st)=>{if(I(2)&&I(3)){st.a=0;st.b=0}const b=st.b||0;return{12:!!st.a,9:!!(b&1),8:!!(b&2),11:!!(b&4)}}},
  '74HC283':{n:'74HC283',d:'Somador completo de 4 bits',fam:'hc',pins:['S2','B2','A2','S1','A1','B1','C0','GND','C4','S4','B4','A4','S3','A3','B3','VCC'],vcc:16,gnd:8,ins:[2,3,5,6,7,11,12,14,15],
   ev:I=>{const A=(I(5)?1:0)+(I(3)?2:0)+(I(14)?4:0)+(I(12)?8:0),B=(I(6)?1:0)+(I(2)?2:0)+(I(15)?4:0)+(I(11)?8:0),s=A+B+(I(7)?1:0);return{4:!!(s&1),1:!!(s&2),13:!!(s&4),10:!!(s&8),9:!!(s&16)}}},
  'PCF8574':{n:'PCF8574',d:'Expansor I2C de 8 portas',fam:'hc',pins:['A0','A1','A2','P0','P1','P2','P3','GND','P4','P5','P6','P7','~INT','SCL','SDA','VCC'],vcc:16,gnd:8,ins:[1,2,3,4,5,6,7,9,10,11,12],
   ev:(I,st)=>{const pt=st.port==null?255:st.port,P=[4,5,6,7,9,10,11,12],o={};P.forEach((p,k)=>o[p]=((pt>>k)&1)?'weak':false);return o}},
  'NE556':{n:'NE556',d:'Temporizador duplo (2 × 555)',fam:'bip',pins:['DIS1','THR1','CTRL1','~RESET1','OUT1','~TRIG1','GND','~TRIG2','OUT2','~RESET2','CTRL2','THR2','DIS2','VCC'],vcc:14,gnd:7,ins:[2,4,6,8,10,12],ctl:{4:true,10:true},vh:v=>Math.max(0,v-1.5),
   an:(c,x)=>{x.r(c,13,2,5000);x.r(c,2,6,10000);x.r(c,13,10,5000);x.r(c,10,6,10000)},
   ev:(I,st,V)=>{const a=half(I,st,V,'q1',6,2,4,3),b=half(I,st,V,'q2',8,12,10,11);return{5:a,1:a?null:'sink',9:b,13:b?null:'sink'}}},
  'LM339':{n:'LM339',d:'Comparador quádruplo (coletor aberto)',fam:'cmp',pins:['OUT2','OUT1','VCC','IN1−','IN1+','IN2−','IN2+','IN3−','IN3+','IN4−','IN4+','GND','OUT4','OUT3'],vcc:3,gnd:12,ins:[],
   ev:(I,st,V)=>({2:V(5)>V(4)?null:'sink',1:V(7)>V(6)?null:'sink',14:V(9)>V(8)?null:'sink',13:V(11)>V(10)?null:'sink'})},
  '4N35':{n:'4N35',d:'Optoacoplador com fototransistor',fam:null,pins:['A','K','NC','E','C','B'],ins:[],
   an:(c,x)=>{x.dio(c,0,1,1.2,15);x.r(c,4,3,icSt(c).on?60:1e8)},edge:(c,X)=>{const st=icSt(c),on=X.vdc(0)-X.vdc(1)>1.22;if(on!==!!st.on){st.on=on;return true}return false}},
  'ATtiny85':{n:'ATtiny85',d:'Microcontrolador de 8 pinos (programável em C++)',fam:null,pins:['PB5','PB3','PB4','GND','PB0','PB1','PB2','VCC'],vcc:8,gnd:4,ins:[],edge:()=>false}});
 Object.assign(ICSH,{'74HC132':'NAND Schmitt','74HC10':'NAND 3 entradas','74HC11':'AND 3 entradas','74HC27':'NOR 3 entradas','74HC20':'NAND 4 entradas','74HC21':'AND 4 entradas','74HC73':'flip-flop JK','74HC75':'trava 4 bits','74HC93':'contador 4 bits','74HC283':'somador 4 bits','PCF8574':'expansor I2C','NE556':'temporizador duplo','LM339':'comparador quádruplo','4N35':'optoacoplador','ATtiny85':'microcontrolador'});
 const f=DEFS.ic.F.find(x=>x[0]==='k');if(f)f[3]=Object.keys(ICS).map(k=>[k,`${k} — ${ICS[k].d}`])}

/* ---------- micro:bit ---------- */
DEFS.mbit={n:'micro:bit',own:'U',act:1,T:[[-80,80],[-40,80],[0,80],[40,80],[80,80]],N:['P0','P1','P2','3V','GND'],B:[-100,-80,200,170],
 draw:c=>{const d=DEV(c),m=SIM()?d.mx||[]:[];let s=R(-96,-76,192,140,'box',' rx="10"');for(let y=0;y<5;y++)for(let x=0;x<5;x++){const on=m[y*5+x];s+=R(-26+x*12,-50+y*12,6,8,'',on?' style="fill:#ff3030;filter:drop-shadow(0 0 4px #ff3030);stroke:none"':' style="fill:color-mix(in srgb,var(--muted) 25%,transparent);stroke:none"')}
  const ba=SIM()&&d.ba,bb=SIM()&&d.bb;s+=C(-66,-14,12,ba?'en':'box')+T(-66,-34,'A',c.r,'lv')+C(66,-14,12,bb?'en':'box')+T(66,-34,'B',c.r,'lv');
  [['0',-80],['1',-40],['2',0],['3V',40],['GND',80]].forEach(([n,x])=>{s+=R(x-14,40,28,24,'',' rx="3" style="fill:#d4b45a;stroke:var(--ink)"')+L(x,64,x,80)+TT(x,56,n,c)});return s},
 click:()=>{},hitClick:(c,x,y)=>{const d=DEV(c);if(Math.hypot(x+66,y+14)<16){d.ba=true;logE(`${c.tag}: botão A`,'a');return 'hold'}if(Math.hypot(x-66,y+14)<16){d.bb=true;logE(`${c.tag}: botão B`,'a');return 'hold'}},
 release:c=>{const d=DEV(c);d.ba=false;d.bb=false},
 an:(c,x)=>{},src:c=>[[3,c.tag+':+',3.3,.5],[4,c.tag+':-',0,.01]]};
{const old=ANA.src;void old}

/* ---------- paleta ---------- */
{const ADD=(cat,items,after)=>{const C=PAL.find(p=>p[0]===cat);if(!C)return;let i=after?C[1].findIndex(x=>x[0]===after):-1;if(i<0)i=C[1].length-1;C[1].splice(i+1,0,...items)};
 ADD('18. Eletrônica e medição',[['Diodo Zener','zener',{}],['LED RGB','ledrgb',{}]],'Diodo');
 ADD('18. Eletrônica e medição',[['Transistor NPN Darlington (TIP120)','npn',{beta:1000,Icmax:5,Pmax:65}],['MOSFET canal P','pmos',{}],['Relé SPDT','rly1',{}],['Relé DPDT','rly2',{}]],'MOSFET canal N (IRFZ44N)');
 ADD('18. Eletrônica e medição',[['Multímetro','mmeter',{}],['Fonte de bancada','psub',{}],['Gerador de função','fgen',{}]],'Osciloscópio');
 ADD('18. Eletrônica e medição',[['Bateria 3 V (moeda)','bat',{V:3,ri:15,look:'coin'}],['Célula solar','solar',{}],['Bateria de batata','bat',{V:.5,ri:5000,look:'potato'}],['Bateria de limão','bat',{V:.9,ri:2500,look:'lemon'}]],'Bateria 12 V');
 PAL.push(['21. Entradas e sensores',[['Botão (4 pinos)','tact',{}],['Chave deslizante','slsw',{}],['Interruptor DIP × 4','dipsw',{n:4}],['Interruptor DIP × 6','dipsw',{n:6}],['Interruptor DIP × 8','dipsw',{n:8}],['Teclado 4×4','kp4',{}],
  ['Fotodiodo','pdiode',{}],['Sensor de luz ambiente','ptrans',{}],['Sensor flexível','flex',{}],['Sensor de força','fsr',{}],['Sensor de temperatura TMP36','tmp36',{}],['Sensor de inclinação','tilt',{}],['Sensor de umidade do solo','soil',{}],['Sensor de gás','gas',{}],['Sensor PIR','pir',{}],
  ['Ultrassônico HC-SR04','hcsr04',{}],['Ultrassônico PING','ping',{}],['Receptor infravermelho','irrx',{}],['Controle remoto IR','irremote',{}]]]);
 PAL.push(['22. Saídas, motores e telas',[['NeoPixel','neopx',{shape:'px',n:1}],['Anel NeoPixel 12','neopx',{shape:'ring',n:12}],['Anel NeoPixel 16','neopx',{shape:'ring',n:16}],['Anel NeoPixel 24','neopx',{shape:'ring',n:24}],
  ['Faixa NeoPixel 4','neopx',{shape:'strip',n:4}],['Faixa NeoPixel 8','neopx',{shape:'strip',n:8}],['Faixa NeoPixel 12','neopx',{shape:'strip',n:12}],['Faixa NeoPixel 16','neopx',{shape:'strip',n:16}],['Faixa NeoPixel 20','neopx',{shape:'strip',n:20}],
  ['Motor de vibração','vibm',{}],['Motorredutor (engrenagem)','motdc',{Vn:6,P:1.2,look:'gear'}],['Motor CC com codificador','encm',{}],['Micro servo','servo',{}],['Piezo','piezo',{}],['LCD 16×2','lcd',{}],['LCD 16×2 (I2C)','lcdi2c',{}],['Display de 4 dígitos (TM1637)','tm1637',{}]]]);
 PAL.push(['23. Microcontroladores e conectores',[['Arduino Uno','plc',{m:'ard'}],['micro:bit','mbit',{}],['ATtiny85','ic',{k:'ATtiny85'}],['Conector de 8 pinos','hdr8',{}],['Conector USB A (5 V)','usba',{}]]]);
 const c19=PAL.find(p=>p[0].startsWith('19.'));if(c19){for(const k of ['74HC132','74HC10','74HC11','74HC27','74HC20','74HC21','74HC73','74HC75','74HC93','74HC283','PCF8574','NE556','LM339','4N35'])c19[1].splice(c19[1].findIndex(x=>x[1]==='seg7'),0,[`${k} ${ICSH[k]}`,'ic',{k}])}}

Object.assign(I18N_EXACT,{'Diodo Zener':'Zener diode','Tensão Zener (V)':'Zener voltage (V)','LED RGB':'RGB LED','Chave deslizante (SPDT)':'Slide switch (SPDT)','Chave deslizante':'Slide switch','Botão (4 pinos)':'Pushbutton (4 pins)','Interruptor DIP':'DIP switch','Chaves':'Switches',
 'Interruptor DIP × 4':'DIP switch × 4','Interruptor DIP × 6':'DIP switch × 6','Interruptor DIP × 8':'DIP switch × 8','Teclado 4×4':'4×4 keypad','Fotodiodo':'Photodiode','Sensor de luz ambiente (fototransistor)':'Ambient light sensor (phototransistor)','Sensor de luz ambiente':'Ambient light sensor',
 'Sensor flexível':'Flex sensor','Dobra (%)':'Bend (%)','Sensor de força (FSR)':'Force sensor (FSR)','Sensor de força':'Force sensor','Força (N)':'Force (N)','Sensor de temperatura TMP36':'TMP36 temperature sensor','Sensor de inclinação':'Tilt sensor',
 'Sensor de umidade do solo':'Soil moisture sensor','Umidade (%)':'Moisture (%)','Sensor de gás':'Gas sensor','Concentração de gás (%)':'Gas concentration (%)','Sensor PIR (presença)':'PIR motion sensor','Sensor PIR':'PIR sensor','Tempo ligado (s)':'On time (s)',
 'Sensor de distância ultrassônico (HC-SR04)':'Ultrasonic distance sensor (HC-SR04)','Sensor de distância ultrassônico (PING)':'Ultrasonic distance sensor (PING)','Ultrassônico HC-SR04':'HC-SR04 ultrasonic','Ultrassônico PING':'PING ultrasonic','Distância do objeto (cm)':'Object distance (cm)',
 'Sensor infravermelho (receptor IR)':'Infrared sensor (IR receiver)','Receptor infravermelho':'Infrared receiver','Controle remoto infravermelho':'Infrared remote','Controle remoto IR':'IR remote','Motor de vibração':'Vibration motor','Motor CC com codificador (encoder)':'DC motor with encoder','Motor CC com codificador':'DC motor with encoder',
 'Rotação nominal (rpm)':'Rated speed (rpm)','Pulsos por volta (encoder)':'Pulses per revolution (encoder)','Micro servo':'Micro servo','Piezo (buzzer)':'Piezo (buzzer)','Piezo':'Piezo','NeoPixel':'NeoPixel','Formato':'Shape','LED único':'Single LED','Anel':'Ring','Faixa':'Strip','Quantidade de LEDs':'Number of LEDs',
 'Anel NeoPixel 12':'NeoPixel ring 12','Anel NeoPixel 16':'NeoPixel ring 16','Anel NeoPixel 24':'NeoPixel ring 24','Faixa NeoPixel 4':'NeoPixel strip 4','Faixa NeoPixel 8':'NeoPixel strip 8','Faixa NeoPixel 12':'NeoPixel strip 12','Faixa NeoPixel 16':'NeoPixel strip 16','Faixa NeoPixel 20':'NeoPixel strip 20',
 'LCD 16×2':'16×2 LCD','LCD 16×2 (I2C)':'16×2 LCD (I2C)','Endereço I2C':'I2C address','Display de 4 dígitos (TM1637)':'4-digit display (TM1637)','Célula solar':'Solar cell','Tensão em aberto (V)':'Open-circuit voltage (V)','Corrente de curto (A)':'Short-circuit current (A)',
 'Conector USB A (5 V)':'USB A connector (5 V)','Multímetro':'Multimeter','Função':'Function','Voltímetro (V)':'Voltmeter (V)','Amperímetro (A)':'Ammeter (A)','Ohmímetro (Ω)':'Ohmmeter (Ω)','Fonte de bancada':'Bench power supply','Tensão (V)':'Voltage (V)','Limite de corrente (A)':'Current limit (A)',
 'Gerador de função':'Function generator','Forma de onda':'Waveform','Senoidal':'Sine','Quadrada':'Square','Triangular':'Triangle','Dente de serra':'Sawtooth','Frequência (Hz)':'Frequency (Hz)','Amplitude pico a pico (V)':'Peak-to-peak amplitude (V)','Nível CC (offset, V)':'DC level (offset, V)',
 'MOSFET canal P':'P-channel MOSFET','Tensão de disparo |Vgs| (V)':'Gate threshold |Vgs| (V)','Relé SPDT':'SPDT relay','Relé DPDT':'DPDT relay','Tensão da bobina (V)':'Coil voltage (V)','Resistência da bobina (Ω)':'Coil resistance (Ω)','Conector de 8 pinos':'8-pin connector',
 'Transistor NPN Darlington (TIP120)':'NPN Darlington transistor (TIP120)','Bateria 3 V (moeda)':'3 V coin cell','Bateria de batata':'Potato battery','Bateria de limão':'Lemon battery','Motorredutor (engrenagem)':'Gear motor','micro:bit':'micro:bit','Arduino Uno':'Arduino Uno',
 '21. Entradas e sensores':'21. Inputs and sensors','22. Saídas, motores e telas':'22. Outputs, motors and displays','23. Microcontroladores e conectores':'23. Microcontrollers and connectors'});
I18N_PHR.push([' vibrando',' vibrating'],[' girando a ',' turning at '],[' tocando ',' playing '],[' marca ',' reads '],[': movimento detectado',': motion detected'],[': objeto a ',': object at '],[': tecla ',': key '],[': chave ',': switch '],[' na posição ',' in position ']);
I18N_RE=null;I18N_CACHE.clear();renderPalette();renderAll();
