/* ================= placas novas na protoboard + galeria de projetos com Arduino ================= */
/* ---------- desenho das placas na protoboard ---------- */
function brdPins(k,c){const b=BRD[k],N=brdLogic(k);const pos={};b.top.forEach((n,i)=>{if(!(n in pos))pos[n]=[i,0]});b.bot.forEach((n,i)=>{if(!(n in pos))pos[n]=[i,b.gap]});
 const pins=N.map(n=>pos[n]),used=new Set(pins.map(q=>q+''));const dum=[];b.top.forEach((n,i)=>{const q=[i,0];if(!used.has(q+''))dum.push(q)});b.bot.forEach((n,i)=>{const q=[i,b.gap];if(!used.has(q+''))dum.push(q)});return{pins,dum}}
function brdLbl(b,yTop,yBot,col){let s='';b.top.forEach((n,i)=>{s+=`<text x="${i*10+1.6}" y="${yTop}" font-size="3.6" fill="${col}" text-anchor="end" transform="rotate(-90 ${i*10+1.6} ${yTop})">${esc(n)}</text>`});
 b.bot.forEach((n,i)=>{s+=`<text x="${i*10+1.6}" y="${yBot}" font-size="3.6" fill="${col}" transform="rotate(-90 ${i*10+1.6} ${yBot})">${esc(n)}</text>`});return s}
const brdPad=(pins,col)=>pins.map(([x,y])=>bC(x*10,y*10,3.2,col,bStk('#7d6414',.6))+bC(x*10,y*10,1.3,'#1a1a1a')).join('');
const mcuOut=(c,n)=>{const st=SIM()&&rt.mcu&&rt.mcu[c.id];return!!(st&&st.out&&st.out[n]>0)};
PKGS.nano=c=>{const b=BRD.nano,{pins,dum}=brdPins('nano'),W=14*10;return{pins,dum,box:[-20,-6,W+6,b.gap*10+6],art:c=>{const run=SIM()&&!rt.burnt[c.id],N=brdLogic('nano'),d13=pbOnS()&&VD(c,N.indexOf('D13'),N.indexOf('GND'))>2.5;
  let s=bR(-6,-5,W+12,b.gap*10+10,'#1f5aa6',' rx="2"')+bR(-20,18,22,24,'#c9c9c9',bStk('#9e9e9e',.6)+' rx="1.5"')+bP(`M70,16L84,30L70,44L56,30Z`,'#1e1e1e')+bR(100,22,12,8,'#d9d9d9',' rx="1"')+bC(106,26,2.6,'#b4533a')+bR(28,24,10,12,'#c9c9c9',' rx="3"');
  s+=bR(118,40,5,3,run?'#3cff5a':'#3a4a4a')+bR(118,46,5,3,d13?'#ff9f1a':'#3a4a4a')+bT(126,43,'ON',3.6,'#fff')+bT(126,49,'L',3.6,'#fff')+bTc(70,54,'NANO',6,'#fff',' font-weight="700"');
  return s+brdPad([...b.top.map((_,i)=>[i,0]),...b.bot.map((_,i)=>[i,b.gap])],'#d4b45a')+brdLbl(b,13,b.gap*10-6,'#fff')}}};
PKGS.esp32=c=>{const b=BRD.esp32,{pins,dum}=brdPins('esp32'),W=14*10;return{pins,dum,box:[-22,-6,W+40,b.gap*10+6],art:c=>{const run=SIM()&&!rt.burnt[c.id],N=brdLogic('esp32'),i2=N.indexOf('D2'),blue=pbOnS()&&i2>=0&&VD(c,i2,N.indexOf('GND'))>1.6;
  let s=bR(-6,-5,W+44,b.gap*10+10,'#1e1e1e',' rx="2"')+bR(-22,32,22,22,'#c9c9c9',bStk('#9e9e9e',.6)+' rx="1.5"')+bR(60,10,90,70,'#c4cad0',bStk('#8b939b',.8)+' rx="1.5"')+bTc(105,40,'ESP-WROOM-32',6.5,'#4a4f55',' font-weight="700"')+bTc(105,50,'Wi-Fi + Bluetooth',4.5,'#6b7178');
  s+=bP('M152,18h10v8h-10v8h10v8h-10v8h10','none',bStk('#d4b45a',1.6))+bR(12,12,10,8,'#d9d9d9',' rx="1"')+bR(12,70,10,8,'#d9d9d9',' rx="1"')+bT(25,18,'EN',3.6,'#fff')+bT(25,76,'BOOT',3.6,'#fff');
  s+=bR(36,40,5,3,run?'#ff3b3b':'#3a2a2a')+bR(36,47,5,3,blue?'#3d8bff':'#2a2f3a',blue?' style="filter:drop-shadow(0 0 3px #3d8bff)"':'')+bTc(30,62,'ESP32',6,'#fff',' font-weight="700"');
  return s+brdPad([...b.top.map((_,i)=>[i,0]),...b.bot.map((_,i)=>[i,b.gap])],'#c9a227')+brdLbl(b,13,b.gap*10-6,'#ddd')}}};
PKGS.pico=c=>{const b=BRD.pico,{pins,dum}=brdPins('pico'),W=19*10;return{pins,dum,box:[-20,-6,W+6,b.gap*10+6],art:c=>{const led=mcuOut(c,25);
  let s=bR(-6,-5,W+12,b.gap*10+10,'#1f7a3f',' rx="2"')+bR(-20,24,22,22,'#c9c9c9',bStk('#9e9e9e',.6)+' rx="1.5"')+bR(80,22,26,26,'#1e1e1e',' rx="1"')+bTc(93,37,'RP2040',4.5,'#9aa2aa')+bR(30,26,14,10,'#f4f4f4',' rx="1.5"')+bTc(37,44,'BOOTSEL',3.4,'#fff');
  s+=bR(14,30,6,4,led?'#3cff5a':'#2a4a2a',led?' style="filter:drop-shadow(0 0 3px #3cff5a)"':'')+bTc(150,38,'Raspberry Pi Pico',7,'#fff',' font-weight="700"')+bR(126,22,14,14,'#2b2b2b',' rx="1"');
  return s+[...b.top.map((_,i)=>[i,0]),...b.bot.map((_,i)=>[i,b.gap])].map(([x,y])=>bR(x*10-3.4,y*10-(y?6:1),6.8,7,'#d4b45a')+bC(x*10,y*10,1.6,'#1a1a1a')).join('')+brdLbl(b,13,b.gap*10-7,'#fff')}}};
PKGS.mega=c=>{const N=brdLogic('mega'),pos={},put=(n,x,y)=>{pos[n]=[x,y]};put('5V',15,20);put('GND',16,20);
 ['D13','D12','D11','D10','D9','D8'].forEach((n,i)=>put(n,13+i,1));['D7','D6','D5','D4','D3','D2'].forEach((n,i)=>put(n,20+i,1));for(let i=14;i<=21;i++)put('D'+i,29+i-14,1);
 for(let r=0;r<16;r++){put('D'+(22+2*r),39,3+r);put('D'+(23+2*r),40,3+r)}for(let i=0;i<8;i++){put('A'+i,20+i,20);put('A'+(8+i),29+i,20)}
 const pins=N.map(n=>pos[n]),used=new Set(pins.map(q=>q+'')),dum=[];[[9,1],[10,1],[11,1],[12,1],[26,1],[27,1],[39,2],[40,2],[39,19],[40,19],[11,20],[12,20],[13,20],[14,20],[17,20],[18,20]].forEach(q=>{if(!used.has(q+''))dum.push(q)});
 return{pins,dum,sock:1,box:[-14,-2,432,212],art:c=>{const run=SIM()&&!rt.burnt[c.id],d13=pbOnS()&&VD(c,N.indexOf('D13'),1)>2.5,B='#2c6ea6',W='#fff';
  let s=bP('M4,0H416Q420,0 420,4V206Q420,210 416,210H4Q0,210 0,206V4Q0,0 4,0Z',B,bStk('#1e5585',1))+[[62,9],[300,9],[60,201],[300,201]].map(([x,y])=>bC(x,y,5.2,'#fff',bStk('#c9c9c9',.8))).join('');
  s+=bR(-12,46,52,42,'#c9c9c9',bStk('#9e9e9e',.8)+' rx="1"')+bR(-12,158,50,38,'#1e1e1e',' rx="2"')+bR(12,4,20,20,'#d9d9d9',' rx="2"')+bC(22,14,5.6,'#b4533a');
  s+=hdrStrip(90,10,10)+hdrStrip(200,10,8)+hdrStrip(290,10,8)+hdrStrip(390,20,18,true)+hdrStrip(400,20,18,true)+hdrStrip(110,200,8)+hdrStrip(200,200,8)+hdrStrip(290,200,8);
  s+=bP('M200,80L240,120L200,160L160,120Z','#1e1e1e')+bTc(200,123,'ATMEGA2560',5,'#9aa2aa')+bC(110,100,13,'none',bStk(W,2.4))+bT(110,105.5,'∞',17,W,' text-anchor="middle" font-weight="700"')+bTc(110,126,'ARDUINO',9.4,W,' font-weight="700"')+bR(290,88,62,24,'none',bStk(W,1.6)+' rx="12"')+bTc(321,106,'MEGA',15,W);
  s+=bR(56,62,10,4.6,d13?'#ff9f1a':'#e6e6e6')+bT(53.5,66,'L',5.2,W,' text-anchor="end"')+bR(56,80,10,4.6,run?'#3cff5a':'#e6e6e6')+bT(53.5,84,'ON',5.2,W,' text-anchor="end"');
  const tl={13:'13',14:'12',15:'11',16:'10',17:'9',18:'8',20:'7',21:'6',22:'5',23:'4',24:'3',25:'2',29:'14',30:'15',31:'16',32:'17',33:'18',34:'19',35:'20',36:'21'};for(const x in tl)s+=`<text x="${x*10+2}" y="17" font-size="5" fill="#fff" text-anchor="end" transform="rotate(-90 ${x*10+2} 17)">${tl[x]}</text>`;
  for(let i=0;i<16;i++){const x=i<8?20+i:29+i-8;s+=`<text x="${x*10+2}" y="193" font-size="5" fill="#fff" transform="rotate(-90 ${x*10+2} 193)">A${i}</text>`}s+=`<text x="132" y="193" font-size="5" fill="#fff" transform="rotate(-90 132 193)">5V</text><text x="152" y="193" font-size="5" fill="#fff" transform="rotate(-90 152 193)">GND</text>`;
  s+=bT(372,24,'22',4.6,W)+bT(372,186,'52',4.6,W)+bTc(395,14,'5V',4.6,W)+bTc(395,206,'GND',4.6,W);return s}}};
PBCAT.find(g=>g[0]==='Microcontroladores e conectores')[1].push('nano','mega','esp32','pico');
PKC.clear();

/* ---------- galeria de projetos prontos com Arduino ---------- */
const GAL={
 ard_semaforo:{n:'Semáforo com botão de pedestre',code:`// Semáforo: verde → amarelo → vermelho. O botão de pedestre adianta o vermelho.
const int VERMELHO = 11, AMARELO = 10, VERDE = 9, BOTAO = 2;
unsigned long inicio;
int fase = 0;            // 0 verde, 1 amarelo, 2 vermelho
const unsigned long TEMPO[3] = {4000, 1200, 3000};

void acende(int f) {
  digitalWrite(VERDE, f == 0);
  digitalWrite(AMARELO, f == 1);
  digitalWrite(VERMELHO, f == 2);
}

void setup() {
  pinMode(VERMELHO, OUTPUT); pinMode(AMARELO, OUTPUT); pinMode(VERDE, OUTPUT);
  pinMode(BOTAO, INPUT_PULLUP);
  Serial.begin(9600);
  acende(fase);
  inicio = millis();
}

void loop() {
  if (fase == 0 && digitalRead(BOTAO) == LOW && millis() - inicio > 1000) {
    Serial.println("Pedestre pediu passagem");
    inicio = millis() - TEMPO[0];
  }
  if (millis() - inicio >= TEMPO[fase]) {
    fase = (fase + 1) % 3;
    acende(fase);
    inicio = millis();
  }
}`,build:(a,w)=>{a('ARD','plc',360,320,{m:'ard',tag:'ARD1'});
  [['R1',11,'vermelha',300],['R2',10,'amarela',380],['R3',9,'verde',460]].forEach(([r,pin,col,x],i)=>{a(r,'res',x,500,{R:220,tag:r});w('ARD',pin,r,0);a('L'+i,'led',x,620,{col,tag:'D'+(i+1)});w(r,1,'L'+i,0);w('L'+i,1,'ARD',1)});
  a('S1','tact',620,500,{tag:'S1'});w('ARD',2,'S1',0);w('S1',2,'ARD',1)}},
 ard_alarme:{n:'Alarme com sensor de presença',code:`// Alarme: o PIR vê movimento → sirene no piezo e LED vermelho piscando.
const int PIR = 2, BUZZER = 8, LED = 13;

void setup() {
  pinMode(PIR, INPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (digitalRead(PIR) == HIGH) {
    Serial.println("Movimento detectado!");
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED, HIGH); tone(BUZZER, 1500); delay(150);
      digitalWrite(LED, LOW);  tone(BUZZER, 900);  delay(150);
    }
  } else {
    noTone(BUZZER);
    digitalWrite(LED, LOW);
  }
}`,build:(a,w)=>{a('ARD','plc',360,320,{m:'ard',tag:'ARD1'});a('PIR','pir',260,520,{tag:'U1'});w('PIR',0,'ARD',2);w('PIR',1,'ARD',0);w('PIR',2,'ARD',1);
  a('BZ','piezo',420,520,{tag:'H1'});w('ARD',8,'BZ',0);w('BZ',1,'ARD',1);a('R1','res',540,500,{R:220,tag:'R1'});w('ARD',13,'R1',0);a('L1','led',540,620,{col:'vermelha',tag:'D1'});w('R1',1,'L1',0);w('L1',1,'ARD',1)}},
 ard_termo:{n:'Termômetro com LCD',code:`// Termômetro: TMP36 no A0, temperatura no LCD I2C (endereço 0x27).
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.print("Termometro");
}

void loop() {
  int leitura = analogRead(A0);
  float volts = leitura * 5.0 / 1023.0;
  float celsius = (volts - 0.5) * 100.0;
  lcd.setCursor(0, 1);
  lcd.print(celsius, 1);
  lcd.print(" C     ");
  delay(500);
}`,build:(a,w)=>{a('ARD','plc',360,320,{m:'ard',tag:'ARD1'});a('T','tmp36',260,520,{temp:24,tag:'U1'});w('T',0,'ARD',0);w('T',1,'ARD',14);w('T',2,'ARD',1);
  a('LCD','lcdi2c',640,520,{tag:'LCD1'});w('LCD',0,'ARD',1);w('LCD',1,'ARD',0);w('LCD',2,'ARD',18);w('LCD',3,'ARD',19)}},
 ard_servo:{n:'Servo controlado por potenciômetro',code:`// Gire o potenciômetro: o servo acompanha (0 a 180°).
#include <Servo.h>
Servo motor;

void setup() {
  motor.attach(9);
  Serial.begin(9600);
}

void loop() {
  int angulo = map(analogRead(A0), 0, 1023, 0, 180);
  motor.write(angulo);
  Serial.println(angulo);
  delay(50);
}`,build:(a,w)=>{a('ARD','plc',360,320,{m:'ard',tag:'ARD1'});a('P','pot',240,520,{R:10000,pos:50,tag:'RP1'});w('P',0,'ARD',0);w('P',1,'ARD',1);w('P',2,'ARD',14);
  a('SV','servo',520,540,{tag:'M1'});w('SV',0,'ARD',1);w('SV',1,'ARD',0);w('SV',2,'ARD',9)}},
 ard_distancia:{n:'Sensor de distância com bipe',code:`// Quanto mais perto o objeto, mais rápido o bipe (HC-SR04).
const int TRIG = 7, ECHO = 6, BUZZER = 8;

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(BUZZER, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH);
  int cm = us / 58;
  Serial.print(cm); Serial.println(" cm");
  if (cm > 0 && cm < 100) {
    tone(BUZZER, 2000, 60);
    delay(cm * 6);
  } else {
    delay(200);
  }
}`,build:(a,w)=>{a('ARD','plc',360,320,{m:'ard',tag:'ARD1'});a('US','hcsr04',300,540,{dist:40,tag:'U1'});w('US',0,'ARD',0);w('US',1,'ARD',7);w('US',2,'ARD',6);w('US',3,'ARD',1);
  a('BZ','piezo',540,540,{tag:'H1'});w('ARD',8,'BZ',0);w('BZ',1,'ARD',1)}},
 ard_contador:{n:'Contador com display de 4 dígitos',code:`// Cada toque no botão soma 1 no display TM1637.
#include <TM1637Display.h>
TM1637Display tela(2, 3);
const int BOTAO = 4;
int conta = 0;
bool antes = HIGH;

void setup() {
  pinMode(BOTAO, INPUT_PULLUP);
  tela.setBrightness(7);
  tela.showNumberDec(conta);
  delay(50);
  antes = digitalRead(BOTAO);
}

void loop() {
  bool agora = digitalRead(BOTAO);
  if (antes == HIGH && agora == LOW) {
    conta++;
    tela.showNumberDec(conta);
  }
  antes = agora;
  delay(20);
}`,build:(a,w)=>{a('ARD','plc',360,320,{m:'ard',tag:'ARD1'});a('TM','tm1637',300,540,{tag:'DS1'});w('TM',0,'ARD',2);w('TM',1,'ARD',3);w('TM',2,'ARD',0);w('TM',3,'ARD',1);
  a('S1','tact',560,520,{tag:'S1'});w('ARD',4,'S1',0);w('S1',2,'ARD',1)}},
 ard_arcoiris:{n:'Anel NeoPixel arco-íris',code:`// Arco-íris girando num anel de 12 LEDs NeoPixel (pino 6).
#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel anel(12, 6, NEO_GRB + NEO_KHZ800);
long matiz = 0;

void setup() {
  anel.begin();
  anel.setBrightness(80);
}

void loop() {
  for (int i = 0; i < 12; i++) {
    anel.setPixelColor(i, anel.ColorHSV(matiz + i * 65536L / 12));
  }
  anel.show();
  matiz += 2048;
  delay(40);
}`,build:(a,w)=>{a('ARD','plc',360,320,{m:'ard',tag:'ARD1'});a('NP','neopx',400,560,{shape:'ring',n:12,tag:'NP1'});w('NP',0,'ARD',0);w('NP',1,'ARD',1);w('NP',2,'ARD',6)}}};
for(const k in GAL){const g=GAL[k];window.mkTpl(k,(a,w,j,tx)=>{tx('T1',120,-20,g.n.toUpperCase());tx('N1',120,5,'Projeto pronto: veja a montagem no botão Protoboard e o programa em "Código C++…" (selecione o Arduino).');g.build(a,w);const ard=S.comps.find(c=>c.type==='plc');if(ard)ard.code=g.code;S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0,sh:1}],w:[],vis:[1]}})}
/* modelos prontos começam sem vínculo com a protoboard; os projetos com Arduino já vêm montados (vinculados) */
{const _lt=loadTpl;loadTpl=function(k,noHist){const r=_lt(k,noHist);if(GAL[k]&&S.pb){delete S.nopb;try{pbAutoMount(true)}catch(e){console.error(e)}commit()}else{S.nopb=true;if(S.pb)S.pb.on=false;commit()}return r}}
{const sEl=document.getElementById('bTpl');if(sEl){const og=document.createElement('optgroup');og.label='Projetos com Arduino';for(const k in GAL){const o=document.createElement('option');o.value=k;o.textContent=GAL[k].n;og.appendChild(o)}sEl.appendChild(og)}}
Object.assign(I18N_EXACT,{'Projetos com Arduino':'Arduino projects','Semáforo com botão de pedestre':'Traffic light with pedestrian button','Alarme com sensor de presença':'Motion sensor alarm','Termômetro com LCD':'LCD thermometer','Servo controlado por potenciômetro':'Servo controlled by a potentiometer',
 'Sensor de distância com bipe':'Distance sensor with beeper','Contador com display de 4 dígitos':'Counter with 4-digit display','Anel NeoPixel arco-íris':'NeoPixel rainbow ring',
 'Projeto pronto: veja a montagem no botão Protoboard e o programa em "Código C++…" (selecione o Arduino).':'Ready project: see the assembly with the Breadboard button and the program in "C++ code…" (select the Arduino).',
 'Ponta preta (COM): arraste até um furo ou terminal':'Black probe (COM): drag it to a hole or terminal','Ponta vermelha (VΩ): arraste até um furo ou terminal':'Red probe (VΩ): drag it to a hole or terminal'});
for(const k in GAL)I18N_EXACT[GAL[k].n.toUpperCase()]=(I18N_EXACT[GAL[k].n]||GAL[k].n).toUpperCase();
renderPalette();
