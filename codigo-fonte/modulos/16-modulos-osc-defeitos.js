/* ================= módulos novos (OLED, relé, L298N, motor de passo, encoder), Wi-Fi e OLED no C++,
   Serial Plotter, osciloscópio com pontas e trigger, defeitos visíveis na protoboard ================= */

/* ---------- utilidades ---------- */
const anyPinNet=(M,net)=>net!=null&&Object.keys(M.pins).some(p=>pinKey(M,+p)===net);
const wired=(c,i)=>allWires().some(w=>(w.a.c===c.id&&w.a.t===i)||(w.b.c===c.id&&w.b.t===i))||(typeof pbOn==='function'&&pbOn()&&S.pb&&S.pb.w.some(w=>(w.a.c===c.id&&w.a.t===i)||(w.b.c===c.id&&w.b.t===i)));

/* ---------- display OLED 128×64 (SSD1306) ---------- */
function oledSVG(d,x,y,W,H,on){const pw=128,ph=64,sx=W/pw,sy=H/ph,inv=!!d.inv,bg=inv?'#7fe3ff':'#05080c',fg=inv?'#05080c':'#7fe3ff';let s=`<rect x="${x}" y="${y}" width="${W}" height="${H}" fill="${on?bg:'#0b0f14'}"/>`;if(!on)return s;
 const b=d.buf;if(b){if(d.svgV!==d.ver){let p='';for(let r=0;r<ph;r++){let c0=-1;for(let q=0;q<=pw;q++){const v=q<pw&&b[r*pw+q];if(v&&c0<0)c0=q;else if(!v&&c0>=0){p+=`M${(c0*sx).toFixed(2)},${(r*sy).toFixed(2)}h${((q-c0)*sx).toFixed(2)}v${sy.toFixed(2)}h${(-(q-c0)*sx).toFixed(2)}z`;c0=-1}}}d.svgP=p;d.svgV=d.ver}
  if(d.svgP)s+=`<path transform="translate(${x} ${y})" d="${d.svgP}" fill="${fg}"/>`}
 for(const t of d.txt||[]){const sz=t.sz||1,cw=t.mp?8:6;s+=`<text x="${x+t.x*sx}" y="${y+(t.y+7*sz)*sy}" font-family="'IBM Plex Mono',monospace" font-size="${(8*sz*sy*1.05).toFixed(2)}" textLength="${(t.s.length*cw*sz*sx).toFixed(2)}" lengthAdjust="spacingAndGlyphs" fill="${t.col===0?bg:fg}">${esc(t.s)}</text>`}
 return s}
DEFS.oled={n:'Display OLED 128×64 (I2C)',own:'DS',def:{addr:'0x3C'},F:[['addr','Endereço I2C','text']],T:[[-40,60],[-20,60],[0,60],[20,60]],N:['GND','VCC','SCL','SDA'],B:[-74,-60,148,124],
 draw:c=>{const d=DEV(c),on=SIM()&&PWR(c,1,0,3)&&d.on!==false&&(d.buf||d.txt);return PINS(c,[[-40,60,'GND'],[-20,60,'VCC'],[0,60,'SCL'],[20,60,'SDA']])+bodyBox(-70,-56,140,92)+`<g>${oledSVG(d,-64,-50,128,64,on)}</g>`+TT(0,26,'OLED '+(c.addr||'0x3C'),c)},
 an:(c,x)=>{x.r(c,1,0,2000);x.r(c,2,0,1e6);x.r(c,3,0,1e6)},val:c=>c.addr,say:c=>{const d=DEV(c);return SIM()&&d.ver?['on',`${c.tag} mostrando imagem`]:null}};
/* biblioteca Adafruit_SSD1306 (também usada pelo MicroPython) */
MCULIB.Adafruit_SSD1306=(api,w=128,h=64)=>{const W=+w||128,H=+h||64,buf=new Uint8Array(128*64);let txt=[];const o={cx:0,cy:0,sz:1,col:1,bg:null,wrap:true,inv:false,on:true,addr:0x3C};
 const find=()=>S.comps.filter(x=>x.type==='oled'&&(anyPinNet(api.M,netOf(K(x.id,3)))||api.M.kind==='mbit'));
 const px=(x,y,v)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H||x>=128||y>=64)return;const i=y*128+x;buf[i]=v===2?buf[i]^1:v?1:0};
 const clrTxt=(x,y,w2,h2)=>{txt=txt.filter(t=>{const tx=t.x+t.s.length*(t.mp?8:6)*t.sz/2,ty=t.y+4*t.sz;return!(tx>=x&&tx<x+w2&&ty>=y&&ty<y+h2)})};
 const line=(x0,y0,x1,y1,v)=>{x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy,n=0;for(;;){px(x0,y0,v);if((x0===x1&&y0===y1)||++n>2000)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}};
 const rect=(x,y,w2,h2,v,fill)=>{if(fill){for(let j=0;j<h2;j++)for(let i=0;i<w2;i++)px(x+i,y+j,v);clrTxt(x,y,w2,h2)}else{line(x,y,x+w2-1,y,v);line(x,y+h2-1,x+w2-1,y+h2-1,v);line(x,y,x,y+h2-1,v);line(x+w2-1,y,x+w2-1,y+h2-1,v)}};
 const circ=(x0,y0,r,v,fill)=>{for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){const d2=x*x+y*y;if(fill?d2<=r*r+r:(d2<=r*r+r&&d2>=r*r-r))px(x0+x,y0+y,v)}};
 const put=(s,mp)=>{const cw=(mp?8:6)*o.sz,chH=8*o.sz;let run='',rx=o.cx,ry=o.cy;const flush=()=>{if(run){clrTxt(rx,ry,run.length*cw,chH);txt.push({x:rx,y:ry,s:run,sz:o.sz,col:o.col,mp});run=''}};
  for(const ch of String(s)){if(ch==='\n'){flush();o.cx=0;o.cy+=chH;rx=o.cx;ry=o.cy;continue}if(ch==='\r')continue;if(o.wrap&&!mp&&o.cx+cw>W){flush();o.cx=0;o.cy+=chH;rx=0;ry=o.cy}run+=ch;o.cx+=cw}flush()};
 Object.assign(o,{begin:(vcc,addr)=>{if(addr!=null)o.addr=addr;return 1},display:()=>{for(const d of find()){const z=DEV(d);z.buf=buf.slice();z.txt=txt.map(t=>({...t}));z.inv=o.inv;z.on=o.on;z.ver=(z.ver||0)+1}api.S0.dirty=1},
  clearDisplay:()=>{buf.fill(0);txt=[]},fillScreen:v=>{buf.fill(v?1:0);txt=[]},drawPixel:(x,y,v=1)=>px(x,y,v),getPixel:(x,y)=>buf[y*128+x]||0,
  drawFastHLine:(x,y,w2,v=1)=>line(x,y,x+w2-1,y,v),drawFastVLine:(x,y,h2,v=1)=>line(x,y,x,y+h2-1,v),drawLine:(a,b,c2,d,v=1)=>line(a,b,c2,d,v),
  drawRect:(x,y,w2,h2,v=1)=>rect(x,y,w2,h2,v,false),fillRect:(x,y,w2,h2,v=1)=>rect(x,y,w2,h2,v,true),drawRoundRect:(x,y,w2,h2,r,v=1)=>rect(x,y,w2,h2,v,false),fillRoundRect:(x,y,w2,h2,r,v=1)=>rect(x,y,w2,h2,v,true),
  drawCircle:(x,y,r,v=1)=>circ(x,y,r,v,false),fillCircle:(x,y,r,v=1)=>circ(x,y,r,v,true),drawTriangle:(a,b,c2,d,e,f,v=1)=>{line(a,b,c2,d,v);line(c2,d,e,f,v);line(e,f,a,b,v)},
  fillTriangle:(a,b,c2,d,e,f,v=1)=>{const minY=Math.min(b,d,f),maxY=Math.max(b,d,f);for(let y=minY;y<=maxY;y++){const xs=[];[[a,b,c2,d],[c2,d,e,f],[e,f,a,b]].forEach(([x1,y1,x2,y2])=>{if((y>=Math.min(y1,y2))&&(y<=Math.max(y1,y2))&&y1!==y2)xs.push(x1+(y-y1)*(x2-x1)/(y2-y1))});if(xs.length>=2)line(Math.min(...xs),y,Math.max(...xs),y,v)}},
  drawBitmap:(x,y,bmp,w2,h2,v=1)=>{if(!Array.isArray(bmp))return;const bw=Math.ceil(w2/8);for(let j=0;j<h2;j++)for(let i=0;i<w2;i++)if((bmp[j*bw+(i>>3)]>>(7-(i&7)))&1)px(x+i,y+j,v)},
  setCursor:(x,y)=>{o.cx=x;o.cy=y},setTextSize:s=>{o.sz=Math.max(1,Math.round(s)||1)},setTextColor:(c2,b)=>{o.col=c2;o.bg=b},setTextWrap:w2=>{o.wrap=!!w2},cp437:()=>{},setRotation:()=>{},
  print:(x,f,mp)=>{const s=api.fmtV(x,f);put(s,mp);return s.length},println:(x,f)=>{const s=x===undefined?'':api.fmtV(x,f);put(s+'\n');return s.length},write:x=>{put(typeof x==='number'?String.fromCharCode(x):String(x))},
  invertDisplay:v=>{o.inv=!!v;o.display()},dim:()=>{},on:v=>{o.on=!!v;o.display()},width:()=>W,height:()=>H,startscrollright:()=>{},startscrollleft:()=>{},stopscroll:()=>{},
  scroll:(dx,dy)=>{const b2=buf.slice();buf.fill(0);for(let y=0;y<64;y++)for(let x=0;x<128;x++){const nx=x+dx,ny=y+dy;if(b2[y*128+x]&&nx>=0&&nx<128&&ny>=0&&ny<64)buf[ny*128+nx]=1}txt=txt.map(t=>({...t,x:t.x+dx,y:t.y+dy}))},
  getCursorX:()=>o.cx,getCursorY:()=>o.cy});return o};
/* Wi-Fi simulado no C++ (ESP32: WiFi.h) */
Object.assign(MCUX,{
 __init:api=>{api.FN.F=x=>x;return 0},
 WiFi:api=>{const w=api.wifi||(api.wifi=mcuWifi(api));const ip=()=>({__str:w.connected()?w.ip:'0.0.0.0'});return{begin:(s,k)=>{w.connect(s,k);return w.connected()?3:6},status:()=>w.connected()?3:w.connecting()?6:w.active?6:0,isConnected:()=>w.connected()?1:0,
  localIP:ip,gatewayIP:()=>({__str:'192.168.0.1'}),subnetMask:()=>({__str:'255.255.255.0'}),dnsIP:()=>({__str:'8.8.8.8'}),macAddress:()=>'24:0A:C4:12:34:56',RSSI:i=>i!=null?(w.nets()[i]||[0,0])[1]:w.rssi(),SSID:i=>i!=null?(w.nets()[i]||[''])[0]:w.connected()?w.ssid:'',
  mode:()=>1,disconnect:()=>{w.disconnect();return 1},reconnect:()=>{w.connect(w.ssid,'');return 1},setAutoReconnect:()=>{},setHostname:()=>1,getHostname:()=>'faisca',scanNetworks:()=>w.nets().length,encryptionType:()=>3,channel:i=>(w.nets()[i||0]||[0,0,6])[2],
  softAP:s=>{w.active=true;w.apName=s;return 1},softAPIP:()=>({__str:'192.168.4.1'}),softAPgetStationNum:()=>0}},
 WL_CONNECTED:()=>3,WL_IDLE_STATUS:()=>0,WL_DISCONNECTED:()=>6,WL_NO_SSID_AVAIL:()=>1,WL_CONNECT_FAILED:()=>4,WIFI_STA:()=>1,WIFI_AP:()=>2,WIFI_AP_STA:()=>3,
 SSD1306_SWITCHCAPVCC:()=>2,SSD1306_EXTERNALVCC:()=>1,SSD1306_WHITE:()=>1,SSD1306_BLACK:()=>0,SSD1306_INVERSE:()=>2,WHITE:()=>1,BLACK:()=>0,INVERSE:()=>2});
for(const t of['Adafruit_SSD1306','Stepper','IPAddress']){CTY.add(t);LIBC.add(t)}
MCULIB.IPAddress=(api,a=0,b=0,c2=0,d=0)=>({__str:`${a}.${b}.${c2}.${d}`});

/* ---------- módulo relé 5 V ---------- */
DEFS.rlymod={n:'Módulo relé 5 V',own:'K',def:{lvl:'H'},F:[['lvl','Aciona com','sel',[['H','Sinal ALTO (HIGH)'],['L','Sinal BAIXO (LOW)']]]],T:[[-40,60],[-20,60],[0,60],[-20,-60],[0,-60],[20,-60]],N:['VCC','GND','IN','NA','COM','NF'],B:[-56,-60,112,120],
 draw:c=>{const on=SIM()&&DEV(c).on;return PINS(c,[[-40,60,'VCC'],[-20,60,'GND'],[0,60,'IN']])+PINS(c,[[-20,-60,'NA'],[0,-60,'COM'],[20,-60,'NF']])+bodyBox(-50,-46,100,92)+R(-40,-6,26,26,on?'en':'box')+L(-27,-6,-27,-14,'dash')+L(-27,-14,0,-14,'dash')+
  L(0,-48,0,-30)+L(-20,-48,-20,-36)+L(20,-48,20,-36)+L(0,-30,on?-18:18,-38,'thick')+C(34,-2,5,on?'en':'')+TT(34,12,'LED',c)+TT(0,31,c.lvl==='L'?'aciona em LOW':'aciona em HIGH',c)},
 an:(c,x)=>{x.r(c,0,1,DEV(c).on?70:2500);x.r(c,2,c.lvl==='L'?0:1,1e4)},
 tick:c=>{if(!rt.A)return false;const d=DEV(c),pw=VD(c,0,1)>=3.5,v=VD(c,2,1),on=pw&&(c.lvl==='L'?v<1.5:v>=2);if(on!==!!d.on){d.on=on;logE(`${c.tag} ${on?'acionou (COM–NA fechado)':'desligou (COM–NF fechado)'}`,'a');return true}return false},
 cond:c=>rt&&DEV(c).on?[[4,3]]:[[4,5]],say:c=>DEV(c).on?['on',`${c.tag} acionado: COM ligado ao NA`]:null};

/* ---------- ponte H L298N ---------- */
DEFS.l298n={n:'Ponte H L298N',own:'U',def:{en:'auto'},F:[['en','Jumpers ENA/ENB','sel',[['auto','Automático (com jumper se o pino EN estiver livre)'],['jmp','Com jumper (sempre ligado)'],['pin','Sem jumper (EN pelo pino)']]]],
 T:[[-80,-60],[-60,-60],[-20,-60],[0,-60],[20,-60],[60,-60],[80,-60],[-60,60],[-40,60],[-20,60],[0,60],[20,60],[40,60]],N:['OUT1','OUT2','12V','GND','5V','OUT3','OUT4','ENA','IN1','IN2','IN3','IN4','ENB'],B:[-96,-60,192,120],
 draw:c=>{const d=DEV(c);return PINS(c,[[-80,-60,'OUT1'],[-60,-60,'OUT2'],[-20,-60,'12V'],[0,-60,'GND'],[20,-60,'5V'],[60,-60,'OUT3'],[80,-60,'OUT4']])+PINS(c,[[-60,60,'ENA'],[-40,60,'IN1'],[-20,60,'IN2'],[0,60,'IN3'],[20,60,'IN4'],[40,60,'ENB']])+
  bodyBox(-90,-48,180,96)+R(-24,-20,48,30,'box',' rx="3"')+TT(0,0,'L298N',c)+TT(-60,0,SIM()?l2Txt(d.a):'A',c)+TT(60,0,SIM()?l2Txt(d.b):'B',c)},
 an:(c,x)=>{x.r(c,2,3,3000);for(const i of[7,8,9,10,11,12])x.r(c,i,3,1e5)},
 der:(c,X)=>{const vg=X.vdc(3),vs=X.vdc(2)-vg,d=DEV(c);d.a=d.b=null;if(vs<4)return;const hi=i=>X.vdc(i)-vg>=2,enF=i=>{const m=c.en||'auto';if(m==='jmp'||(m==='auto'&&!wired(c,i)))return 1;const v=X.vdc(i)-vg;return v>=3?1:Math.max(0,Math.min(1,v/5))};
  const vh=Math.max(0,vs-1.4);for(const[ch,en,i1,i2,o1,o2]of[['a',7,8,9,0,1],['b',12,10,11,5,6]]){const e=enF(en);if(e<.02)continue;const h1=hi(i1),h2=hi(i2);d[ch]=h1===h2?'brk':h1?'fwd':'rev';
   X.push(o1,`${c.tag}.o${o1}${h1?':+':':-'}`,vg+(h1?vh*e:0),.4,3);X.push(o2,`${c.tag}.o${o2}${h2?':+':':-'}`,vg+(h2?vh*e:0),.4,3)}
  if(vs>=7&&(c.en||'auto')!=='x')X.push(4,`${c.tag}.5v:+`,vg+5,2,3)},
 say:c=>{const d=DEV(c);return d.a||d.b?['on',`${c.tag}: motor A ${l2Txt(d.a)} · motor B ${l2Txt(d.b)}`]:null}};
const l2Txt=s=>({fwd:'frente',rev:'ré',brk:'freio'}[s]||'parado');

/* ---------- motor de passo 28BYJ-48 com driver ULN2003 ---------- */
const STP_IDX={'1000':0,'1100':1,'0100':2,'0110':3,'0010':4,'0011':5,'0001':6,'1001':7};
function stpUpd(s,bits){const d=DEV(s),idx=STP_IDX[bits];d.bits=bits;if(idx==null)return false;if(d.idx==null){d.idx=idx;return true}let dl=((idx-d.idx)%8+8)%8;if(dl>4)dl-=8;if(dl===4)dl=0;d.idx=idx;if(!dl)return false;d.pos=(d.pos||0)+dl;return true}
DEFS.step28={n:'Motor de passo 28BYJ-48 (driver ULN2003)',own:'M',T:[[-40,60],[-20,60],[0,60],[20,60],[40,60],[60,60]],N:['IN1','IN2','IN3','IN4','+','−'],B:[-60,-76,140,136],
 draw:c=>{const d=DEV(c),a=stpAng(c),r=a*Math.PI/180,bits=SIM()?d.bits||'0000':'0000';return PINS(c,[[-40,60,'IN1'],[-20,60,'IN2'],[0,60,'IN3'],[20,60,'IN4'],[40,60,'+'],[60,60,'−']])+bodyBox(-54,0,128,48)+
  [0,1,2,3].map(i=>C(-30+i*18,18,5,bits[i]==='1'?'en':'')).join('')+TT(48,22,'ULN2003',c)+C(10,-38,30,SIM()&&d.mv?'en':'box')+L(10,-38,10+Math.sin(r)*24,-38-Math.cos(r)*24,'thick')+C(10,-38,4,'fillink')+TT(60,-38,`${Math.round(a)}°`,c)},
 an:(c,x)=>{x.r(c,4,5,(DEV(c).bits||'0000').includes('1')?50:5000);for(const i of[0,1,2,3])x.r(c,i,5,1e5)},
 tick:c=>{if(!rt.A)return false;const d=DEV(c);if(d.hk&&rt.simT-d.hk<.5){const m=d.mv;d.mv=d.lastPos!==d.pos;d.lastPos=d.pos;return m!==d.mv||d.mv}if(VD(c,4,5)<4){if(d.bits!=='0000'){d.bits='0000';return true}return false}
  const bits=[0,1,2,3].map(i=>VD(c,i,5)>=2?1:0).join('');const ch=bits!==d.bits;const mv=stpUpd(c,bits);d.mv=mv;return ch||mv},
 say:c=>{const d=DEV(c);return d.pos?['on',`${c.tag} em ${Math.round(stpAng(c))}° (${d.pos} meios-passos)`]:null}};
const stpAng=c=>{const p=SIM()?DEV(c).pos||0:0;return((p*360/4096)%360+360)%360};
/* a saída do microcontrolador muda: avança o motor na hora (passos rápidos não se perdem entre um quadro e outro) */
MCUH.push((api,n)=>{const net=pinKey(api.M,n);if(net==null)return;for(const s of S.comps){if(s.type!=='step28')continue;const ins=[0,1,2,3].map(i=>netOf(K(s.id,i)));if(!ins.includes(net))continue;
 const bits=ins.map(k=>{const p=Object.keys(api.M.pins).find(q=>pinKey(api.M,+q)===k);return p!=null&&api.S0.mode[p]===1&&api.S0.out[p]>0?1:0}).join('');const d=DEV(s);d.hk=rt.simT;stpUpd(s,bits);d.mv=true}});
/* biblioteca Stepper do Arduino */
MCULIB.Stepper=(api,steps,p1,p2,p3,p4)=>{const o={n:+steps||2048,pins:[p1,p2,p3,p4].filter(x=>x!=null),sn:0,rpm:10};
 const out=k=>{const P=o.pins;const seq4=[[1,0,1,0],[0,1,1,0],[0,1,0,1],[1,0,0,1]],seq2=[[0,1],[1,1],[1,0],[0,0]];const q=P.length===4?seq4[k]:seq2[k];P.forEach((p,i)=>{api.S0.mode[p]=1;api.setOut(p,q[i])})};
 Object.assign(o,{setSpeed:r=>{o.rpm=Math.max(.01,+r||1)},step:function*(n){const dir=n>0?1:-1,dt=60/o.n/o.rpm;for(let i=0;i<Math.abs(n);i++){o.sn=(o.sn+dir+o.n)%o.n;out(o.sn%4);yield api.sp(dt)}},version:()=>5});return o};

/* ---------- encoder rotativo KY-040 ---------- */
DEFS.renc={n:'Encoder rotativo KY-040',own:'S',act:1,T:[[-40,60],[-20,60],[0,60],[20,60],[40,60]],N:['CLK','DT','SW','+','GND'],B:[-56,-50,112,110],
 draw:c=>{const d=DEV(c),a=(SIM()?d.pos||0:0)*18*Math.PI/180;return PINS(c,[[-40,60,'CLK'],[-20,60,'DT'],[0,60,'SW'],[20,60,'+'],[40,60,'GND']])+bodyBox(-50,-44,100,92)+C(0,-4,26,'box')+C(0,-4,18,SIM()&&d.sw?'en':'')+L(0,-4,Math.sin(a)*16,-4-Math.cos(a)*16,'thick')+
  P('M-40,-30l-6,6l6,6','')+P('M40,-30l6,6l-6,6','')+TT(-38,-36,'↺',c)+TT(38,-36,'↻',c)+(SIM()?TT(0,31,`${d.pos||0}`,c):'')},
 an:(c,x)=>x.r(c,3,4,1e4),
 hitClick:(c,x)=>{const d=DEV(c);d.q=d.q||[];if(x<-12||x>12){const cw=x>12;d.q.push(...(cw?[[0,1],[0,0],[1,0],[1,1]]:[[1,0],[0,0],[0,1],[1,1]]));d.pos=(d.pos||0)+(cw?1:-1);logE(`${c.tag}: girou ${cw?'no sentido horário':'no sentido anti-horário'} (posição ${d.pos})`,'a');return}d.sw=true;logE(`${c.tag}: botão apertado`,'a');return'hold'},
 release:c=>{DEV(c).sw=false},
 tick:c=>{const d=DEV(c);if(d.a==null){d.a=1;d.b=1}if(d.q&&d.q.length){const[a,b]=d.q.shift();d.a=a;d.b=b;return true}return false},
 der:(c,X)=>{const d=DEV(c),vg=X.vdc(4),v=X.vdc(3)-vg;if(v<2.5)return;const A=d.a==null?1:d.a,Bb=d.b==null?1:d.b;X.push(0,`${c.tag}.clk${A?':+':':-'}`,vg+(A?v:0),A?1e4:100,4);X.push(1,`${c.tag}.dt${Bb?':+':':-'}`,vg+(Bb?v:0),Bb?1e4:100,4)},
 cond:c=>rt&&DEV(c).sw?[[2,4]]:[],click:()=>{},say:c=>{const d=DEV(c);return d.pos?['on',`${c.tag} na posição ${d.pos}`]:null}};

/* ---------- paleta ---------- */
{const add=(cat,items,after)=>{const C0=PAL.find(p=>p[0].startsWith(cat));if(!C0)return;let i=after?C0[1].findIndex(x=>x[1]===after):-1;if(i<0)i=C0[1].length-1;C0[1].splice(i+1,0,...items)};
 add('22.',[['Display OLED 128×64 (I2C)','oled',{}],['Ponte H L298N','l298n',{}],['Motor de passo 28BYJ-48 + ULN2003','step28',{}]],'tm1637');
 add('21.',[['Encoder rotativo KY-040','renc',{}]],'kp4');add('18.',[['Módulo relé 5 V','rlymod',{}]],'rly2')}

/* ---------- desenho na protoboard ---------- */
Object.assign(PKGS,{
 oled:c=>({pins:pbRow(4),box:[-38,-114,68,1],art:c=>{const d=DEV(c),on=pbOnS()&&PWR(c,1,0,3)&&d.on!==false&&(d.buf||d.txt);return rng(4).map(i=>bLeg(i*10,-8,i*10,0)).join('')+bR(-36,-112,102,104,'#1c3f8c',' rx="3"')+[[-30,-106],[60,-106],[-30,-14],[60,-14]].map(([x,y])=>bC(x,y,3.4,'#cfd6dd')).join('')+
  bR(-30,-96,90,62,'#111',' rx="1"')+`<g>${oledSVG(d,-27,-92,84,42,on)}</g>`+rng(4).map(i=>bTc(i*10,-16,['GND','VCC','SCL','SDA'][i],3.6,'#fff')).join('')+bR(-4,-12,38,5,'#1b1b1b')}}),
 rlymod:c=>({pins:[[0,0],[0,1],[0,2],[18,0],[18,1],[18,2]],sock:1,box:[-14,-10,196,30],art:c=>{const on=SIM()&&DEV(c).on;return bR(-12,-8,206,36,'#1f5fbf',' rx="2"')+hdrStrip(0,0,3,true)+[0,1,2].map(i=>bT(6,i*10+2,['VCC','GND','IN'][i],4,'#fff')).join('')+
  bR(40,-5,78,30,'#1a3fa0',bStk('#0f2b73',1)+' rx="2"')+bTc(79,7,'SRD-05VDC-SL-C',5,'#fff')+bTc(79,16,'10A 250VAC',4,'#cfe0ff')+bC(130,4,3,on?'#ff3030':'#5a1d1d',on?' style="filter:drop-shadow(0 0 3px #ff3030)"':'')+
  bR(168,-6,24,32,'#1e88e5',' rx="1"')+[0,1,2].map(i=>bC(180,i*10,3.6,'#c9ced3',bStk('#7a8088',.8))+bP(`M${177.5},${i*10}h5`,'none',bStk('#555',1))+bT(150,i*10+2,['NA','COM','NF'][i],4,'#fff')).join('')}}),
 l298n:c=>({pins:[[0,4],[0,6],[2,16],[4,16],[6,16],[16,4],[16,6],[9,16],[10,16],[11,16],[12,16],[13,16],[14,16]],sock:1,box:[-12,-10,172,172],art:c=>{const d=DEV(c),on=pbOnS()&&VD(c,2,3)>=4;let s=bR(-10,-8,180,178,'#c62828',' rx="3"')+bR(40,-6,80,70,'#1b1b1b',' rx="2"');for(let i=0;i<9;i++)s+=bR(44+i*8.6,-6,4,70,'#2d2d2d');
  s+=bR(56,66,48,22,'#2a2a2a',' rx="1"')+bTc(80,80,'L298N',6,'#ddd',' font-weight="700"')+bC(140,140,3,on?'#ff3030':'#5a1d1d',on?' style="filter:drop-shadow(0 0 3px #ff3030)"':'');
  const scr=(x,y)=>bR(x-5,y-5,10,10,'#1e88e5')+bC(x,y,3.4,'#c9ced3',bStk('#7a8088',.8))+bP(`M${x-2.5},${y}h5`,'none',bStk('#555',1));[[0,4],[0,6],[16,4],[16,6],[2,16],[4,16],[6,16]].forEach(([x,y])=>s+=scr(x*10,y*10));
  s+=hdrStrip(90,160,6)+[['OUT1',0,4],['OUT2',0,6],['OUT3',16,4],['OUT4',16,6]].map(([t,x,y])=>bTc(x*10+(x?-16:16),y*10+2,t,4.4,'#fff')).join('')+[['12V',2],['GND',4],['5V',6],['ENA',9],['IN1',10],['IN2',11],['IN3',12],['IN4',13],['ENB',14]].map(([t,x])=>`<text x="${x*10+1.5}" y="150" font-size="4" fill="#fff" transform="rotate(-90 ${x*10+1.5} 150)">${t}</text>`).join('');
  const arr=k=>k==='fwd'?'↻':k==='rev'?'↺':k==='brk'?'■':'';return s+bTc(20,110,SIM()?arr(d.a):'',14,'#fff')+bTc(140,110,SIM()?arr(d.b):'',14,'#fff')}}),
 step28:c=>({pins:[[0,1],[0,2],[0,3],[0,4],[0,7],[0,8]],sock:1,box:[-14,-10,200,100],art:c=>{const d=DEV(c),bits=SIM()?d.bits||'0000':'0000',a=stpAng(c)*Math.PI/180;let s=bR(-12,-8,96,100,'#1a7a3a',' rx="2"')+hdrStrip(0,10,4,true)+hdrStrip(0,70,2,true)+
  ['IN1','IN2','IN3','IN4'].map((t,i)=>bT(6,i*10+12,t,4,'#fff')).join('')+bT(6,72,'+',5,'#fff')+bT(6,82,'−',5,'#fff')+bR(30,6,26,44,'#1b1b1b',' rx="1"')+bTc(43,30,'ULN2003',4,'#ccc',` transform="rotate(-90 43 30)"`)+
  [0,1,2,3].map(i=>bC(66,10+i*12,3.4,bits[i]==='1'?'#ff3030':'#5a1d1d',bits[i]==='1'?' style="filter:drop-shadow(0 0 3px #ff3030)"':'')+bT(72,12+i*12,'ABCD'[i],4,'#fff')).join('')+bR(40,62,30,14,'#f5f5f5',' rx="1"');
  ['#2962ff','#ff4081','#ffd600','#ff9100','#d50000'].forEach((col,i)=>s+=bWire(`M${46+i*5},76C${46+i*5},96 120,${70+i*3} 132,${50+i*3}`,col,1.4));
  return s+bC(150,40,36,'#c9ced3',bStk('#8b939b',1.2))+bC(150,40,26,'#e8ebee')+bC(150,40,8,'#9aa2aa')+bP(`M150,40L${150+Math.sin(a)*22},${40-Math.cos(a)*22}`,'none',bStk('#c62828',3)+' stroke-linecap="round"')+bR(146,0,8,8,'#9aa2aa')+bTc(150,92,'28BYJ-48',5,'#333')}}),
 renc:c=>({pins:pbRow(5),box:[-8,-66,48,1],art:c=>{const d=DEV(c),a=(SIM()?d.pos||0:0)*18*Math.PI/180;return rng(5).map(i=>bLeg(i*10,-8,i*10,0)).join('')+bR(-6,-64,52,56,'#1d1d1d',' rx="2"')+bC(20,-38,18,'#9aa2aa',bStk('#5a6168',1))+bC(20,-38,13,d.sw&&SIM()?'#5e666e':'#3a3f45')+
  bP(`M20,-38L${20+Math.sin(a)*11},${-38-Math.cos(a)*11}`,'none',bStk('#f2f2f2',2.4)+' stroke-linecap="round"')+rng(5).map(i=>bTc(i*10,-12,['CLK','DT','SW','+','GND'][i],3.4,'#ddd')).join('')+
  `<rect class="pbhit" data-hx="-30" data-hy="0" x="-6" y="-64" width="14" height="50" fill="transparent"><title>girar para a esquerda</title></rect><rect class="pbhit" data-hx="30" data-hy="0" x="32" y="-64" width="14" height="50" fill="transparent"><title>girar para a direita</title></rect><circle class="pbhit" data-hx="0" data-hy="0" cx="20" cy="-38" r="12" fill="transparent"><title>apertar o botão</title></circle>`+
  bTc(1,-56,'↺',8,'#bbb',' pointer-events="none"')+bTc(39,-56,'↻',8,'#bbb',' pointer-events="none"')}})});
{const add=(g,ks)=>{const G=PBCAT.find(x=>x[0]===g);if(G)G[1].push(...ks)};add('Saídas, motores e telas',['oled','l298n','step28']);add('Sensores e entradas',['renc']);add('Transistores, reguladores e relés',['rlymod'])}
PKC.clear();

/* ---------- Serial Plotter ---------- */
function plotParse(txt){const lines=txt.split('\n').slice(-260),ser={},order=[];let n=0;
 for(const ln of lines){const tk=ln.trim().split(/[\s,;\t]+/).filter(Boolean);if(!tk.length)continue;let k=0,got=false;
  for(const t of tk){const m=/^([^:=]*[A-Za-z_][^:=]*)[:=](-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)$/i.exec(t);let lb,v;if(m){lb=m[1];v=+m[2]}else if(/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(t)){lb='valor '+(++k);v=+t}else continue;
   if(!ser[lb]){ser[lb]=[];order.push(lb)}ser[lb].push([n,v]);got=true}if(got)n++}return{ser,order,n}}
function plotSVG(txt){const{ser,order,n}=plotParse(txt);if(!order.length)return`<p class="muted small" style="margin:8px">${tr('Mande números pela serial (ex.: Serial.println(valor) ou print(a, b)) para ver o gráfico.')}</p>`;
 const W=400,H=120,n0=Math.max(0,n-200);let mx=-Infinity,mn=Infinity;for(const k of order)for(const[i,v]of ser[k])if(i>=n0){mx=Math.max(mx,v);mn=Math.min(mn,v)}if(mx===mn){mx+=1;mn-=1}const pad=(mx-mn)*.08;mx+=pad;mn-=pad;
 const X=i=>((i-n0)/Math.max(1,Math.min(200,n-1-n0)||1)*W).toFixed(1),Y=v=>(H-(v-mn)/(mx-mn)*H).toFixed(1);let s=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:${H}px;display:block;background:#0f1720">`;
 for(let j=1;j<4;j++)s+=`<line x1="0" x2="${W}" y1="${H*j/4}" y2="${H*j/4}" stroke="#1f2b38" stroke-width="1"/>`;
 order.forEach((k,i)=>{const col=SCOL[i%SCOL.length],pts=ser[k].filter(p=>p[0]>=n0).map(p=>X(p[0])+','+Y(p[1])).join(' ');s+=`<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`});
 s+='</svg>';const fm=v=>Math.abs(v)>=1000||Number.isInteger(v)?String(Math.round(v)):v.toFixed(2);
 return s+`<div style="display:flex;gap:10px;flex-wrap:wrap;padding:4px 8px;font:11px 'IBM Plex Mono',monospace"><span class="muted">${fm(mn+pad)} … ${fm(mx-pad)}</span>${order.map((k,i)=>`<span style="color:${SCOL[i%SCOL.length]}">■ ${esc(k)}: ${fm(ser[k][ser[k].length-1][1])}</span>`).join('')}</div>`}
{const r0=renderSerial;renderSerial=function(){r0();const el=document.getElementById('serial');if(!el||el.hidden)return;let b=el.querySelector('[data-sx="plot"]');
  if(!b){b=document.createElement('button');b.dataset.sx='plot';b.textContent=tr('Gráfico');b.title=tr('Serial Plotter: desenha os números que chegam pela serial');el.querySelector('.sh b').after(b);
   const pl=document.createElement('div');pl.className='splot';el.querySelector('pre').after(pl);b.addEventListener('click',()=>{el.classList.toggle('plot');b.classList.toggle('on',el.classList.contains('plot'));delete el.dataset.ph;renderSerial()})}
  if(!el.classList.contains('plot'))return;const s=rt&&rt.mcu&&rt.mcu[el.dataset.id];if(!s)return;const pl=el.querySelector('.splot');const h=s.ser.length+':'+s.ser.slice(-40);if(el.dataset.ph===h)return;el.dataset.ph=h;pl.innerHTML=plotSVG(s.ser)}}
{const st=document.createElement('style');st.textContent=`#serial .splot{display:none}#serial.plot .splot{display:block}#serial.plot pre{display:none}#serial button.on{border-color:var(--pick);color:var(--pick)}
.pbsmoke{animation:pbSmoke 2.4s ease-out infinite;transform-box:fill-box;transform-origin:center}.pbsmoke.s2{animation-delay:.8s}.pbsmoke.s3{animation-delay:1.6s}
@keyframes pbSmoke{0%{opacity:0;transform:translateY(0) scale(.6)}25%{opacity:.75}100%{opacity:0;transform:translateY(-34px) scale(1.7)}}
.pbblink{animation:pbBlink 1s steps(2,start) infinite}@keyframes pbBlink{50%{opacity:.12}}
.pbshort{animation:pbShort .7s ease-in-out infinite alternate}@keyframes pbShort{from{opacity:.25}to{opacity:.85}}
@media (prefers-reduced-motion:reduce){.pbsmoke,.pbblink,.pbshort{animation:none}}`;document.head.appendChild(st)}

/* ---------- osciloscópio: trigger e pontas de prova ---------- */
DEFS.scope.def=Object.assign({trig:'auto',tch:'1',tedge:'rise',tlev:0},DEFS.scope.def||{});
DEFS.scope.F=[...(DEFS.scope.F||[]),['trig','Trigger','sel',[['auto','Automático'],['normal','Normal (espera o disparo)'],['off','Desligado (corre livre)']]],['tch','Canal do trigger','sel',[['1','CH1'],['2','CH2']]],['tedge','Borda','sel',[['rise','Subida ↑'],['fall','Descida ↓']]],['tlev','Nível do trigger (V)','num',null,LV]];
/* devolve o início da janela, ou null quando o trigger normal ainda não disparou */
function scopeT0(c,h,t1,span){const free=Math.max(h&&h.length?h[0][0]:t1-span,t1-span);if(!c||(c.trig||'auto')==='off'||!h||h.length<3)return free;const lev=+c.tlev||0,up=(c.tedge||'rise')!=='fall',lim=t1-span*.5,d=DEV(c);
 for(let i=h.length-1;i>0;i--){const[t,v]=h[i],pv=h[i-1][1];if(t>lim)continue;if(up?pv<lev&&v>=lev:pv>lev&&v<=lev){d.st0=t;return t}}
 if(c.trig==='normal')return d.st0!=null&&d.st0>=h[0][0]?d.st0:null;return free}
waveTr=function(){const W=380,H=150,sc=S.comps.filter(c=>c.type==='scope');const chs=[];let n=0;
 sc.forEach(c=>[0,1].forEach(ch=>{const h=rt.wv&&rt.wv[c.id+':'+ch];if(h&&h.length>4&&scopeCh(c,ch))chs.push({h,c,ch,lbl:`${sc.length>1?c.tag+' ':''}CH${ch+1}`,col:SCOL[n%SCOL.length]});n++}));if(!chs.length)return null;
 const t1=rt.simT,span=Math.max(1e-9,Math.min(t1-chs[0].h[0][0],(+S.sp||1)*(simK()>1?4:20)));const sc0=chs[0].c,tc=(sc0.tch==='2'?1:0),th=(chs.find(o=>o.c===sc0&&o.ch===tc)||chs[0]).h;let t0=scopeT0(sc0,th,t1,span);const wait=t0==null;if(wait)t0=t1-span;const tE=t0+span;
 let mx=-Infinity,mn=Infinity;for(const o of chs)for(const[t,v]of o.h)if(t>=t0&&t<=tE){mx=Math.max(mx,v);mn=Math.min(mn,v)}if(!isFinite(mx))return null;
 const pk=Math.max(1e-3,Math.abs(mx),Math.abs(mn),Math.abs(+sc0.tlev||0)),div=niceStep(pk/4*1.05);let s=`<svg viewBox="0 0 ${W} ${H}" class="ssvg">${gridSvg(W,H,8,8)}`;const yv=v=>Math.max(-5,Math.min(H+5,H/2-v/div*(H/8))).toFixed(1);
 if(!wait)for(const o of chs){const d=o.h.filter(p=>p[0]>=t0&&p[0]<=tE).map((p,k)=>(k?'L':'M')+((p[0]-t0)/span*W).toFixed(1)+','+yv(p[1])).join('');s+=`<path d="${d}" style="stroke:${o.col}" class="tr"/>`}
 if((sc0.trig||'auto')!=='off')s+=`<line x1="0" x2="${W}" y1="${yv(+sc0.tlev||0)}" y2="${yv(+sc0.tlev||0)}" stroke="#ff9800" stroke-dasharray="4 4" stroke-width="1"/><text x="${W-4}" y="${+yv(+sc0.tlev||0)-3}" font-size="10" fill="#ff9800" text-anchor="end">T ${(sc0.tedge||'rise')==='fall'?'↓':'↑'}</text>`;
 s+='</svg>';const info=chs.map(o=>{const v=o.h.filter(p=>p[0]>=t0&&p[0]<=tE).map(p=>p[1]);if(!v.length)return'';const mxx=Math.max(...v),mnn=Math.min(...v);return`<span style="color:${o.col}">■</span> ${o.lbl}: ${fmtE(o.h[o.h.length-1][1],'V')} agora · mín. ${fmtE(mnn,'V')} · máx. ${fmtE(mxx,'V')}`}).join('<br>');
 const tg=(sc0.trig||'auto')==='off'?'trigger desligado':wait?'aguardando o trigger…':`trigger ${sc0.tch==='2'?'CH2':'CH1'} ${(sc0.tedge||'rise')==='fall'?'↓':'↑'} ${fmtE(+sc0.tlev||0,'V')}`;
 return s+`<div class="sinfo">${fmtE(div,'V')}/div · ${fmtT(span/8)}/div · ${tg}<br>${info}</div>`};
/* desenho do osciloscópio na protoboard, com trigger */
PKGS.scope=c=>({pins:[[0,0],[2,0],[5,0],[7,0]],sock:1,box:[-22,-124,94,9],art:c=>{const v1=pbOnS()?VD2(c,0):0,v2=pbOnS()?VD2(c,1):0;let s=bR(-20,-122,110,130,'#3b3f45',' rx="5"')+bR(-14,-116,98,70,'#0b1a12',' rx="2"');for(let i=1;i<6;i++)s+=bR(-14+i*16.3,-116,.5,70,'#1f3a2a');for(let j=1;j<4;j++)s+=bR(-14,-116+j*17.5,98,.5,'#1f3a2a');
  const hs=[0,1].map(ch=>SIM()&&rt.wv&&rt.wv[c.id+':'+ch]),t1=SIM()?rt.simT:0,span=(+S.sp||1)*(typeof simK==='function'&&simK()>1?4:20);const th=hs[c.tch==='2'?1:0]||hs[0];let t0=SIM()?scopeT0(c,th,t1,span):0;const wait=t0==null;if(wait)t0=t1-span;const tE=t0+span;
  let mx=-Infinity,mn=Infinity;hs.forEach(h=>h&&h.forEach(([t,v])=>{if(t>=t0&&t<=tE){mx=Math.max(mx,v);mn=Math.min(mn,v)}}));if(!(mx>mn)){mx=(isFinite(mx)?mx:0)+1;mn=(isFinite(mn)?mn:0)-1}const pad=(mx-mn)*.1;mx+=pad;mn-=pad;
  const Y=v=>(-48-66*(v-mn)/(mx-mn)).toFixed(1),tr2=(h,col)=>{if(!h||h.length<2||wait)return'';const q=h.filter(([t])=>t>=t0&&t<=tE);if(q.length<2)return'';return`<polyline fill="none" stroke="${col}" stroke-width="1.3" stroke-linejoin="round" points="${q.map(([t,v])=>`${(-14+98*(t-t0)/span).toFixed(1)},${Y(v)}`).join(' ')}"/>`};
  const tw=tr2(hs[0],'#f2d13a')+tr2(hs[1],'#46c3ff'),lev=+c.tlev||0,tl=SIM()&&(c.trig||'auto')!=='off'&&lev>=mn&&lev<=mx?bR(-14,+Y(lev)-.4,98,.8,'#ff9800',' opacity=".8"')+bT(76,+Y(lev)-2,'T',5,'#ff9800'):'';
  return s+tl+bT(-10,-106,`CH1 ${fmtE(v1,'V')}`,6,'#f2d13a')+bT(-10,-96,`CH2 ${fmtE(v2,'V')}`,6,'#46c3ff')+(wait?bTc(35,-80,tr('aguardando trigger'),6,'#ff9800'):'')+(tw||(wait?'':bR(-14,-81-Math.max(-30,Math.min(30,v1*3)),98,1.2,'#f2d13a')+bR(-14,-81-Math.max(-30,Math.min(30,v2*3)),98,1.2,'#46c3ff')))+
   [[0,'#f2d13a','1+'],[20,'#222','1−'],[50,'#46c3ff','2+'],[70,'#222','2−']].map(([x,k,t])=>bC(x,0,5,k,bStk('#999',1.2))+bTc(x,-10,t,5,'#ddd')).join('')}});
const VD2=(c,ch)=>{const x=scopeCh(c,ch);return x?x.dc:0};
/* pontas de prova do osciloscópio (CH1, CH2 e garra do terra) medem sem mudar o circuito */
{const sc0=scopeCh;scopeCh=function(c,ch){if(c&&c.type==='scope'&&pbOn()&&S.pb&&rt&&rt.A){const w=ch?'b':'a',kt=prKey(c,w);if(kt){const kg=prKey(c,'g');const a=rt.A.ph(kt),g=kg?rt.A.ph(kg):[0,0,0];const dc=a[0]-g[0],re=a[1]-g[1],im=a[2]-g[2];return{dc,re,im,rms:Math.hypot(re,im),eff:Math.hypot(dc,re,im)}}}return sc0(c,ch)}}

/* ---------- defeitos visíveis na protoboard: curto em vermelho e fio solto piscando ---------- */
function pbDefects(ph){if(!S.pb)return'';let s='';const vis=pbVisibleWires(ph),red=new Set();
 const SRC=new Set(['bat','usba','solar','psub','psu']);
 for(const c of S.comps){if(!SRC.has(c.type)||!pbVis(c)||!num(c.pbx)||!onSheet(c))continue;const r0=ph.uf.f(K(c.id,0)),r1=ph.uf.f(K(c.id,1));const o=SIM()&&rt.A&&rt.A.m[c.id];
  if(r0===r1||(o&&Math.max(o.i||0,o.isrc||0)>3)){red.add(r0);red.add(r1);const b=pbBox(c);s+=`<rect class="pbshort" x="${b[0]-4}" y="${b[1]-4}" width="${b[2]-b[0]+8}" height="${b[3]-b[1]+8}" rx="5" fill="none" stroke="#ff1f1f" stroke-width="2.6" pointer-events="none"/>`}}
 if(SIM()&&rt.lastShort&&rt.lastShort.wires&&rt.lastShort.wires.length){const nets=new Set(rt.lastShort.wires.map(id=>{const w=S.wires.find(x=>x.id===id);return w?netOf(K(w.a.c,w.a.t)):null}).filter(x=>x!=null));
  for(const c of S.comps){if(!pbVis(c)||!num(c.pbx)||!onSheet(c))continue;termsOf(c).forEach((_,i)=>{if(nets.has(netOf(K(c.id,i))))red.add(ph.uf.f(K(c.id,i)))})}}
 const rootOf=v=>v.k==='p'?ph.uf.f(ph.node(v.w.a)):ph.uf.f(K(v.w.a.c,v.w.a.t));
 if(red.size)for(const v of vis){if(!red.has(rootOf(v)))continue;s+=`<path class="pbshort" d="${wPath(v.pts,v.k==='s'&&v.pts.length===2)}" stroke="#ff1f1f" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`}
 return s}
Object.assign(I18N_EXACT,{'Display OLED 128×64 (I2C)':'OLED display 128×64 (I2C)','Módulo relé 5 V':'5 V relay module','Ponte H L298N':'L298N H-bridge','Motor de passo 28BYJ-48 (driver ULN2003)':'28BYJ-48 stepper motor (ULN2003 driver)','Motor de passo 28BYJ-48 + ULN2003':'28BYJ-48 stepper + ULN2003',
 'Encoder rotativo KY-040':'KY-040 rotary encoder','Gráfico':'Plot','Serial Plotter: desenha os números que chegam pela serial':'Serial Plotter: draws the numbers arriving on the serial port','Trigger':'Trigger','Canal do trigger':'Trigger channel','Borda':'Edge','Nível do trigger (V)':'Trigger level (V)',
 'Automático':'Auto','Normal (espera o disparo)':'Normal (waits for the trigger)','Desligado (corre livre)':'Off (free run)','Subida ↑':'Rising ↑','Descida ↓':'Falling ↓','aguardando trigger':'waiting for trigger','Fio solto: essa ponta não está ligada a nada':'Loose wire: this end is not connected to anything',
 'Aciona com':'Switches on','Sinal ALTO (HIGH)':'HIGH signal','Sinal BAIXO (LOW)':'LOW signal','Jumpers ENA/ENB':'ENA/ENB jumpers','Automático (com jumper se o pino EN estiver livre)':'Auto (jumper when the EN pin is free)','Com jumper (sempre ligado)':'With jumper (always on)','Sem jumper (EN pelo pino)':'No jumper (EN from the pin)',
 'Mande números pela serial (ex.: Serial.println(valor) ou print(a, b)) para ver o gráfico.':'Send numbers over serial (e.g. Serial.println(value) or print(a, b)) to see the plot.','Código do programa':'Program code','Código (C++ ou MicroPython)…':'Code (C++ or MicroPython)…'});

/* ---------- exemplos de código ---------- */
Object.assign(CEX,{
 'MicroPython: piscar o LED (Pico ou ESP32)':`# MicroPython: o programa roda de cima para baixo (sem setup/loop)
from machine import Pin
import time

led = Pin(15, Pin.OUT)      # GP15 no Pico, GPIO15 no ESP32
while True:
    led.toggle()
    print('LED:', led.value())
    time.sleep(0.5)
`,
 'MicroPython: potenciômetro, PWM e Serial Plotter':`# Gire o potenciômetro (ADC no GP26) e abra "Gráfico" no monitor serial
from machine import Pin, ADC, PWM
import time

pot = ADC(26)
led = PWM(Pin(15))
led.freq(1000)
while True:
    v = pot.read_u16()
    led.duty_u16(v)
    print('pot:', v * 3.3 / 65535)
    time.sleep(0.05)
`,
 'MicroPython: Wi-Fi + OLED (ESP32)':`# Wi-Fi simulado: conecta a qualquer rede depois de 1,5 s
import network, time
from machine import Pin, SoftI2C
import ssd1306

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect('MinhaRede', 'senha123')
while not wlan.isconnected():
    print('conectando...')
    time.sleep(0.5)
ip = wlan.ifconfig()[0]
print('conectado, IP', ip)

i2c = SoftI2C(scl=Pin(22), sda=Pin(21))
oled = ssd1306.SSD1306_I2C(128, 64, i2c)
n = 0
while True:
    oled.fill(0)
    oled.text('Wi-Fi OK', 0, 0)
    oled.text(ip, 0, 16)
    oled.text('contador: %d' % n, 0, 32)
    oled.show()
    n += 1
    time.sleep(1)
`,
 'ESP32: Wi-Fi e display OLED (C++)':`#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);   // OLED: SDA no D21, SCL no D22

void setup() {
  Serial.begin(115200);
  WiFi.begin("MinhaRede", "senha123");          // Wi-Fi simulado
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println();
  Serial.print("IP: "); Serial.println(WiFi.localIP());
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
}

void loop() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Faisca");
  display.setTextSize(1);
  display.print("Sinal: "); display.print(WiFi.RSSI()); display.println(" dBm");
  display.drawRect(0, 40, 128, 20, SSD1306_WHITE);
  display.fillRect(2, 42, (millis() / 50) % 124, 16, SSD1306_WHITE);
  display.display();
  delay(100);
}`,
 'Motor de passo 28BYJ-48 (Stepper)':`#include <Stepper.h>
// IN1..IN4 do ULN2003 nos pinos 8, 9, 10 e 11 (repare na ordem 8, 10, 9, 11)
Stepper motor(2048, 8, 10, 9, 11);

void setup() {
  motor.setSpeed(12);           // rpm
}

void loop() {
  motor.step(512);              // 1/4 de volta (90°)
  delay(500);
  motor.step(-512);             // volta
  delay(500);
}`,
 'Encoder rotativo KY-040':`// CLK no D2, DT no D3, SW no D4. Clique nas laterais do encoder para girar e no meio para apertar.
int posicao = 0;
int ultimo;

void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT);
  pinMode(3, INPUT);
  pinMode(4, INPUT_PULLUP);
  ultimo = digitalRead(2);
}

void loop() {
  int clk = digitalRead(2);
  if (clk != ultimo && clk == LOW) {
    if (digitalRead(3) != clk) posicao++; else posicao--;
    Serial.print("posição: ");
    Serial.println(posicao);
  }
  ultimo = clk;
  if (digitalRead(4) == LOW) { Serial.println("botão!"); delay(300); }
}`,
 'Ponte H L298N: frente, freio e ré':`// IN1 no D7, IN2 no D8, ENA no D9 (tire o jumper do ENA para controlar a velocidade)
void setup() {
  pinMode(7, OUTPUT); pinMode(8, OUTPUT); pinMode(9, OUTPUT);
}

void loop() {
  digitalWrite(7, HIGH); digitalWrite(8, LOW); analogWrite(9, 200);  // frente
  delay(2000);
  digitalWrite(7, LOW);  digitalWrite(8, LOW);                        // parado
  delay(1000);
  digitalWrite(7, LOW);  digitalWrite(8, HIGH); analogWrite(9, 120);  // ré, mais devagar
  delay(2000);
}`,
 'Serial Plotter: duas curvas':`// Abra o monitor serial e clique em "Gráfico"
void setup() { Serial.begin(9600); }

void loop() {
  float t = millis() / 1000.0;
  Serial.print("seno:");
  Serial.print(sin(t * 3) * 100);
  Serial.print(" pot:");
  Serial.println(analogRead(A0) / 10.23);
  delay(50);
}`});

/* ---------- ajuda ---------- */
HELP.push(
 ['MicroPython (ESP32 e Pico)','micropython python pico esp32 machine pin time sleep programa','esp32 pico','Selecione o ESP32 ou o Raspberry Pi Pico e clique em "Código (C++ ou MicroPython)…". Se o código começar com import (por exemplo, from machine import Pin), o Faísca roda como MicroPython: o programa vai de cima para baixo, com while True no lugar do loop(). Módulos: machine (Pin, ADC, PWM, I2C, Timer), time, network (Wi-Fi simulado), neopixel, ssd1306, i2c_lcd, random e math.','led = Pin(15, Pin.OUT); led.toggle(); time.sleep(0.5) faz o LED do GP15 piscar.'],
 ['Wi-Fi simulado','wifi wi-fi rede internet network wlan conectar ip esp32','esp32 pico','No ESP32 (WiFi.begin no C++ ou network.WLAN no MicroPython) a conexão é simulada: depois de 1,5 s o status vira conectado e aparece um IP (192.168.0.x). Não há internet de verdade: serve para treinar o código de conexão.','while (WiFi.status() != WL_CONNECTED) delay(500); depois Serial.println(WiFi.localIP());'],
 ['Serial Plotter (gráfico da serial)','serial plotter gráfico plotar curva monitor serial números','','No monitor serial, clique em "Gráfico": cada número enviado vira uma curva. Para várias curvas, mande os valores na mesma linha separados por espaço ou vírgula; com nome:valor a legenda usa o nome.','Serial.print("temp:"); Serial.println(t); ou print(a, b) no MicroPython.'],
 ['Display OLED 128×64','oled ssd1306 display tela i2c gráfico texto','oled','Ligue GND, VCC (3,3 V ou 5 V), SCL e SDA nos pinos I2C da placa. No C++ use Adafruit_SSD1306 (clearDisplay, setCursor, println, drawRect, display); no MicroPython, ssd1306.SSD1306_I2C (fill, text, rect, show). Nada aparece antes de display() ou show().','display.println("Olá"); display.display();'],
 ['Módulo relé 5 V','relé rele módulo relay carga lâmpada aciona','rlymod','Entrada: VCC, GND e IN (sinal do Arduino). Saída: COM, NA (normalmente aberto) e NF (normalmente fechado). Escolha nas propriedades se ele aciona com sinal ALTO ou BAIXO. O LED vermelho acende quando o relé está acionado.','COM no + da bateria, NA no LED com resistor: o LED acende quando o pino vai para HIGH.'],
 ['Ponte H L298N','l298n ponte h driver motor cc sentido velocidade ena in1 in2','l298n','Alimente o 12V e o GND (o GND também vai no Arduino). IN1/IN2 escolhem o sentido do motor A (OUT1/OUT2) e IN3/IN4 o do motor B (OUT3/OUT4). Com o jumper, ENA/ENB ficam sempre ligados; sem jumper, use analogWrite no ENA/ENB para a velocidade. Há uma queda de cerca de 1,4 V dentro do L298N.','IN1 = HIGH e IN2 = LOW: frente. Os dois iguais: motor freado.'],
 ['Motor de passo 28BYJ-48','motor de passo stepper 28byj uln2003 passos ângulo','step28','O driver ULN2003 recebe IN1 a IN4 do microcontrolador e + / − de 5 V. Com a biblioteca Stepper, use Stepper motor(2048, 8, 10, 9, 11): 2048 passos = 1 volta. Os LEDs A a D mostram as bobinas ligadas e o ponteiro mostra o ângulo do eixo.','motor.setSpeed(12); motor.step(512); gira 90°.'],
 ['Encoder rotativo KY-040','encoder rotativo ky-040 knob girar clk dt sw','renc','Durante a simulação, clique no lado direito do encoder para girar no sentido horário, no lado esquerdo para o anti-horário e no meio para apertar o botão (SW vai para o GND). CLK e DT mudam em sequência (quadratura) como no módulo real.','if (clk != ultimo && clk == LOW) { if (digitalRead(DT) != clk) pos++; else pos--; }'],
 ['Osciloscópio com pontas e trigger','osciloscópio pontas trigger disparo nível borda canal medir onda','scope','Na protoboard, o osciloscópio tem a ponta do CH1 (amarela), a do CH2 (azul) e a garra do terra (preta): arraste até furos ou terminais. Nas propriedades, o trigger (automático, normal ou desligado), o canal, a borda e o nível deixam a onda parada na tela.','Trigger no CH1, borda de subida, nível 2,5 V: a onda quadrada do 555 fica estável.'],
 ['Defeitos visíveis na protoboard','defeito curto-circuito curto queimado fumaça erro protoboard','','Na protoboard, um curto-circuito na fonte fica piscando em vermelho (fios e a fonte) e uma peça queimada solta fumaça. Clique na peça queimada durante a simulação para trocar por uma nova.','Ligue um fio direto do + ao − da bateria: o caminho do curto aparece em vermelho.']);

/* ---------- lâmpada incandescente pequena (de bancada) ---------- */
const bulbB=c=>{if(!SIM()||!rt.A||(rt.burnt&&rt.burnt[c.id]))return 0;const v=Math.abs(VD(c,0,1)),Vn=+c.Vn||9;return Math.max(0,Math.min(1.25,(v*v)/(Vn*Vn)))};
DEFS.bulb={n:'Lâmpada pequena',own:'H',def:{Vn:9,P:.9},F:[['Vn','Tensão nominal (V)','eng','V',LV],['P','Potência (W)','eng','W',LV]],T:V2,N:['1','2'],B:[-22,-40,44,80],
 draw:c=>{const b=bulbB(c),on=b>.03,g=Math.min(1,b),col=`rgb(255,${Math.round(170+70*g)},${Math.round(60+90*g)})`;return L(0,-40,0,-18)+L(0,18,0,40)+C(0,0,18,'',on?` style="fill:${col};fill-opacity:${(.25+.65*g).toFixed(2)};filter:drop-shadow(0 0 ${Math.round(4+10*g)}px ${col})"`:'')+L(-12.7,-12.7,12.7,12.7)+L(-12.7,12.7,12.7,-12.7)},
 an:(c,x)=>x.r(c,0,1,(+c.Vn||9)*(+c.Vn||9)/(+c.P||.9)),
 burn:(c,o)=>o.p>3*(+c.P||.9)?`${fmtE(o.p,'W')} numa lâmpada de ${fmtE(+c.P,'W')}: o filamento rompeu`:null,
 hot:(c,o)=>o.p>1.4*(+c.P||.9)?`${fmtE(o.p,'W')} numa lâmpada de ${fmtE(+c.P,'W')} (acima da tensão nominal)`:null,
 val:c=>`${fmtE(+c.Vn,'V')} ${fmtE(+c.P,'W')}`,say:c=>{const b=bulbB(c);return b>.03?['on',`${c.tag} acesa (${Math.round(Math.min(1,b)*100)}% do brilho)`]:null}};
PKGS.bulb=c=>({pins:[[0,0],[2,0]],box:[-12,-56,32,1],art:c=>{const b=bulbB(c),g=Math.min(1,b),on=b>.03,col=`rgb(255,${Math.round(170+70*g)},${Math.round(60+90*g)})`;
  return bLeg(0,0,4,-10)+bLeg(20,0,16,-10)+bR(2,-20,16,12,'#b8bec6',bStk('#7d848c',.8)+' rx="1.5"')+[0,1,2].map(i=>bR(2,-19+i*4,16,1.2,'#8d949c')).join('')+
   (on?bC(10,-36,22,col,` opacity="${(.15+.35*g).toFixed(2)}" filter="url(#pbBl)"`):'')+bP('M4,-20C4,-28 -2,-32 -2,-40A12,12 0 1 1 22,-40C22,-32 16,-28 16,-20Z',on?col:'rgba(235,240,245,.55)',bStk(on?'#ffdc7a':'#aeb5bd',.9)+(on?` fill-opacity="${(.45+.5*g).toFixed(2)}"`:''))+
   bP('M7,-20L8,-34M13,-20L12,-34','none',bStk('#6b7178',.8))+bP('M8,-34q1,-4 2,0t2,0','none',bStk(on?'#fff6c8':'#555',on?1.6:1))}});
{const C0=PAL.find(p=>p[0].startsWith('22.'));if(C0)C0[1].unshift(['Lâmpada pequena','bulb',{}]);const G=PBCAT.find(x=>x[0]==='Componentes básicos');if(G)G[1].splice(G[1].indexOf('led')+1,0,'bulb')}
PKC.clear();
Object.assign(I18N_EXACT,{'Lâmpada pequena':'Small lamp'});
HELP.push(['Lâmpada pequena','lâmpada lampada bulbo incandescente filamento acender brilho','bulb','Lâmpada incandescente de bancada (padrão 9 V e 0,9 W). O brilho segue a tensão: na tensão nominal acende 100%; com tensão bem acima ela esquenta e queima (o filamento rompe e o circuito abre). Ajuste a tensão e a potência no painel.','Bateria de 9 V direto na lâmpada: acende forte. Com 4,5 V: brilho fraco.']);
