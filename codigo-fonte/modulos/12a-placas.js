/* ================= placas novas: Arduino Nano, Arduino Mega, ESP32 e Raspberry Pi Pico ================= */
/* Cada placa: lista física dos pinos (para a protoboard) e os pinos que a simulação usa (terminais). */
const BRD={
 nano:{n:'Arduino Nano',own:'ARD',vref:5,adc:1023,led:13,sda:18,scl:19,pwr:'5V',
  top:['D13','3V3','REF','A0','A1','A2','A3','A4','A5','A6','A7','5V','RST','GND','VIN'],bot:['D12','D11','D10','D9','D8','D7','D6','D5','D4','D3','D2','GND','RST','RX0','TX1'],gap:6,
  num:n=>{let m=/^D(\d+)$/.exec(n);if(m)return+m[1];m=/^A(\d)$/.exec(n);if(m)return 14+ +m[1];return null},A:i=>14+i},
 mega:{n:'Arduino Mega 2560',own:'ARD',vref:5,adc:1023,led:13,sda:20,scl:21,pwr:'5V',num:n=>{let m=/^D(\d+)$/.exec(n);if(m)return+m[1];m=/^A(\d+)$/.exec(n);if(m)return 54+ +m[1];return null},A:i=>54+i},
 esp32:{n:'ESP32 DevKit',own:'U',vref:3.3,adc:4095,led:2,sda:21,scl:22,pwr:'3V3',
  top:['3V3','GND','D15','D2','D4','RX2','TX2','D5','D18','D19','D21','RX0','TX0','D22','D23'],bot:['VIN','GND','D13','D12','D14','D27','D26','D25','D33','D32','D35','D34','VN','VP','EN'],gap:9,
  num:n=>{const al={RX2:16,TX2:17,VP:36,VN:39};if(al[n]!=null)return al[n];const m=/^D(\d+)$/.exec(n);return m?+m[1]:null},A:i=>[36,39,34,35,32,33][i]??36,
  adcPins:[32,33,34,35,36,39,25,26,27,12,13,14,15,2,4]},
 pico:{n:'Raspberry Pi Pico',own:'U',vref:3.3,adc:1023,led:25,sda:4,scl:5,pwr:'3V3',
  top:['GP0','GP1','GND','GP2','GP3','GP4','GP5','GND','GP6','GP7','GP8','GP9','GND','GP10','GP11','GP12','GP13','GND','GP14','GP15'],
  bot:['VBUS','VSYS','GND','3V3_EN','3V3','ADC_VREF','GP28','AGND','GP27','GP26','RUN','GP22','GND','GP21','GP20','GP19','GP18','GND','GP17','GP16'],gap:7,
  num:n=>{const m=/^GP(\d+)$/.exec(n);return m?+m[1]:null},A:i=>26+i,adcPins:[26,27,28]}};
/* o Mega tem pinos demais para duas fileiras: monta a lista dele aqui */
{const d=[];for(let i=2;i<=53;i++)d.push('D'+i);const a=[];for(let i=0;i<16;i++)a.push('A'+i);BRD.mega.logic=['5V','GND',...d,...a]}
/* terminais da simulação: alimentação, GND e todos os pinos de E/S, na ordem */
function brdLogic(k){const b=BRD[k];if(b.logic)return b.logic;const all=[...b.top,...b.bot],seen=new Set(),out=[b.pwr,'GND'];seen.add(b.pwr);seen.add('GND');
 const io=all.filter(n=>b.num(n)!=null&&!(k==='esp32'&&(n==='RX0'||n==='TX0'))).sort((x,y)=>b.num(x)-b.num(y));for(const n of io)if(!seen.has(n)){seen.add(n);out.push(n)}return b.logic=out}
function brdT(k){const L=brdLogic(k),n=L.length,h=Math.ceil(n/2),x0=-Math.floor((h-1)/2)*20;return L.map((_,i)=>i<h?[x0+i*20,-60]:[x0+(i-h)*20,60])}
for(const k in BRD){const b=BRD[k];
 DEFS[k]={n:b.n,own:b.own,act:1,T:()=>brdT(k),N:()=>brdLogic(k),B:()=>{const T=brdT(k),xs=T.map(t=>t[0]);return[Math.min(...xs)-24,-60,Math.max(...xs)-Math.min(...xs)+48,120]},
  draw:c=>{const P0=brdT(k),N=brdLogic(k),xs=P0.map(t=>t[0]),x0=Math.min(...xs)-20,x1=Math.max(...xs)+20,on=SIM()&&!rt.burnt[c.id];let s=R(x0,-40,x1-x0,80,on?'en':'box',' rx="6"');
   s+=T(0,-6,b.n,c.r,'lv')+T(0,12,b.vref===5?'5 V':'3,3 V',c.r,'tn6');P0.forEach(([x,y],i)=>{s+=L(x,y,x,y<0?-40:40)+`<text x="${x}" y="${y<0?-30:34}" class="tn6" transform="rotate(${y<0?90:-90} ${x} ${y<0?-30:34}) rotate(${-(c.r||0)} ${x} ${y<0?-30:34})" style="text-anchor:${y<0?'start':'start'}">${esc(N[i])}</text>`});return s},
  click:()=>{},an:()=>{},src:c=>{const N=brdLogic(k);return[[N.indexOf(b.pwr),c.tag+':+',b.vref,.5],[N.indexOf('GND'),c.tag+':-',0,.01]]}}}
function brdMcu(c){const b=BRD[c&&c.type];if(!b)return null;const N=brdLogic(c.type),pins={},anPin={},Am={};N.forEach((n,i)=>{const p=b.num(n);if(p!=null)pins[p]=i});
 const adcs=b.adcPins||Object.keys(pins).map(Number).filter(p=>p>=(c.type==='mega'?54:14));adcs.forEach(p=>{if(pins[p]!=null)anPin[p]=pins[p]});for(let i=0;i<16;i++)Am[i]=b.A(i);
 return{c,kind:c.type,pins,an:{},anPin,A:Am,adc:b.adc,vcc:N.indexOf(b.pwr),gnd:N.indexOf('GND'),vref:b.vref,self:true,sda:b.sda,scl:b.scl,led:b.led}}
/* paleta */
{const C=PAL.find(p=>p[0].startsWith('23.'));if(C){const i=C[1].findIndex(x=>x[1]==='mbit');C[1].splice(i<0?C[1].length:i+1,0,['Arduino Nano','nano',{}],['Arduino Mega 2560','mega',{}],['ESP32 DevKit','esp32',{}],['Raspberry Pi Pico','pico',{}])}}
Object.assign(I18N_EXACT,{'Arduino Nano':'Arduino Nano','Arduino Mega 2560':'Arduino Mega 2560','ESP32 DevKit':'ESP32 DevKit','Raspberry Pi Pico':'Raspberry Pi Pico'});
