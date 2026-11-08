"""Testes de funcionamento do Faísca (cada um confere um resultado esperado).
Uso: python3 funcoes.py [caminho/do/index.html]   -> sai com código 1 se algo falhar."""
from playwright.sync_api import sync_playwright
import os, sys, json
F='file://'+os.path.abspath(sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','index.html'))
falhas=[]
def ok(nome,cond,info=''):
    print(('  ok  ' if cond else '  FALHOU ')+nome+(f'  ({info})' if info and not cond else ''));
    if not cond: falhas.append(nome)
H="""S={comps:[],wires:[],seq:1};ensureDoc();const N=(t,p,x,y)=>{const c=placeComp(makeComp(t,p||{}),x,y,0);S.comps.push(c);return c},W=(a,i,b,j)=>S.wires.push({id:'w'+S.seq++,a:{c:a.id,t:i},b:{c:b.id,t:j}});"""
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1600,'height':1000},accept_downloads=True);pg=ctx.new_page();pg.route('http*://**',lambda r:r.abort())
    erros=[];pg.on('pageerror',lambda e:erros.append(str(e)))
    pg.add_init_script("localStorage.setItem('faisca-tour-v1','1')");pg.goto(F);pg.wait_for_timeout(700)
    ev=lambda js:pg.evaluate("(()=>{"+H+js+"})()")
    print('== componentes na grade')
    off=pg.evaluate("""(()=>{const o=[];for(const[cat,items]of PAL)for(const it of items){if(['gstep','blkicon'].includes(it[1]))continue;const c={...makeComp(it[1],it[2]||{}),x:0,y:0,r:0};if(termsOf(c).some(q=>q[0]%20||q[1]%20))o.push(it[0])}return o})()""")
    ok('todos os terminais na grade de 20',not [x for x in off if 'Etapa' not in x and 'Macro' not in x],off)
    print('== modelos prontos sem problemas')
    for t in ['direta','yd24','555','595','onda','555k','aop','clpa','clpst']:
        pg.select_option('#bTpl',t);pg.wait_for_timeout(250);iss=pg.evaluate("analyze().issues.filter(i=>i.lvl!=='info').map(i=>i.msg)")
        ok(f'modelo {t}',not iss,iss)
    print('== simulação')
    r=ev("""const u=N('ic',{k:'74HC08'},600,400);const pp=N('src',{v:'+',V:5},300,100),mm=N('src',{v:'-'},300,700);W(pp,0,u,13);W(mm,0,u,6);W(pp,0,u,0);W(pp,0,u,1);W(pp,0,u,3);W(mm,0,u,4);commit();startSim();const r=[rt.A.vdc(K(u.id,2)),rt.A.vdc(K(u.id,5))];stopSim();return r""")
    ok('74HC08: 1 AND 1 = 1, 1 AND 0 = 0',r[0]>4.5 and r[1]<.5,r)
    r=ev("""const u=N('opamp',{m:'ideal'},500,300);const vin=N('bat',{V:1,ri:.01},150,300),m=N('src',{v:'-'},150,500),r1=N('res',{R:10000},300,300),rf=N('res',{R:47000},400,200);W(vin,1,m,0);W(m,0,u,1);W(vin,0,r1,0);W(r1,1,u,0);W(u,0,rf,0);W(rf,1,u,2);commit();startSim();const v=rt.A.vdc(K(u.id,2));stopSim();return v""")
    ok('amp. op. inversor: −4,7 V',abs(r+4.7)<.01,r)
    r=ev("""const b=N('bat',{V:12,ri:.01},100,300),s=N('btn',{latch:true},300,200),l=N('ind',{L:1,Rs:10},500,300);W(b,0,s,0);W(s,1,l,0);W(l,1,b,1);commit();startSim();clearInterval(timer);simPress(s.id);tick();const i=rt.A.m[l.id].i;stopSim();return i""")
    ok('indutor RL: 63% de 1,2 A em 0,1 s',abs(r-.76)<.05,r)
    pg.select_option('#bTpl','555k');pg.wait_for_timeout(300);pg.click('#bSim');pg.wait_for_timeout(2500)
    r=pg.evaluate("(()=>{const h=rt.wv[S.comps.find(c=>c.type==='scope').id+':0'];let e=0;for(let i=1;i<h.length;i++)if(h[i][1]>4&&h[i-1][1]<=4)e++;return e/(h[h.length-1][0]-h[0][0])})()");pg.click('#bSim')
    ok('NE555 a ~1,4 kHz (velocidade 1/1000)',1100<r<1700,r)
    pg.select_option('#bTpl','onda');pg.wait_for_timeout(300);pg.click('#bSim');pg.wait_for_timeout(200);pg.evaluate("clearInterval(timer)")
    seq=[pg.evaluate("(()=>{for(let i=0;i<12;i++)tick();return [1,2,3,4,5,6,7,8].map(i=>ledB(S.comps.find(c=>c.tag==='D'+i))>0?1:0).join('')})()") for _ in range(12)];pg.click('#bSim')
    ok('onda de LEDs (contador Johnson)',seq[0]!=seq[1] and '11111111' in seq,seq)
    pg.select_option('#bTpl','clpst');pg.wait_for_timeout(300);pg.click('#bSim');pg.wait_for_timeout(200);pg.evaluate("clearInterval(timer)")
    r=pg.evaluate("(()=>{const g=t=>S.comps.find(c=>c.tag===t);simPress(g('S1').id);release();const a=[!!rt.res.en[g('H1').id],!!rt.res.en[g('H2').id]];for(let i=0;i<35;i++)tick();a.push(!!rt.res.en[g('H2').id]);return a})()");pg.click('#bSim')
    ok('CLP com programa ST: selo e temporizador',r==[True,False,True],r)
    pg.select_option('#bTpl','direta');pg.wait_for_timeout(300);pg.click('#bSim');pg.wait_for_timeout(200);pg.evaluate("clearInterval(timer)")
    r=pg.evaluate("(()=>{simPress(S.comps.find(c=>c.tag==='S1').id);release();const m=S.comps.find(c=>D(c).mot);const a=rt.A.m[m.id].i;for(let i=0;i<20;i++)tick();return [a,rt.A.m[m.id].i,JSON.stringify(rt.trip)]})()");pg.click('#bSim')
    ok('motor: corrente de partida ~6× e nada desarma',r[0]>5*r[1] and r[2]=='{}',r)
    print('== Arduino em C++ e componentes novos')
    pg.select_option('#bTpl','ardcpp');pg.wait_for_timeout(300)
    ok('modelo ardcpp sem problemas',not pg.evaluate("analyze().issues.filter(i=>i.lvl!=='info').map(i=>i.msg)"))
    pg.click('#bSim');pg.wait_for_timeout(200);pg.evaluate("clearInterval(timer)")
    r=pg.evaluate("(()=>{const g=t=>S.comps.find(c=>c.tag===t);const o=[];for(let i=0;i<12;i++){tick();o.push(ledB(g('D2'))>0?1:0)}return [o.join(''),ledB(g('D1')),rt.mcu[g('ARD1').id].ser.includes('A0 = ')]})()");pg.click('#bSim')
    ok('Arduino: pisca sem delay, PWM e Serial',('0' in r[0] and '1' in r[0]) and 0.1<r[1]<0.6 and r[2],r)
    r=ev("""const ard=N('plc',{m:'ard'},500,400),M=mcuOf(ard),g=N('src',{v:'-'},300,700),p5=N('src',{v:'+',V:5},300,100),L=N('lcd',{},900,300),sv=N('servo',{},800,600);const map={3:12,5:11,10:5,11:4,12:3,13:2};for(const k in map)W(L,+k,ard,M.pins[map[k]]);W(L,1,p5,0);W(L,0,g,0);W(sv,2,ard,M.pins[9]);W(sv,1,p5,0);W(sv,0,g,0);
      ard.code='LiquidCrystal lcd(12,11,5,4,3,2);Servo s; void setup(){lcd.begin(16,2);lcd.print("Faisca");s.attach(9);s.write(45);} void loop(){lcd.setCursor(0,1);lcd.print(3.14159);delay(100);}';commit();startSim();clearInterval(timer);for(let i=0;i<3;i++)tick();const r=[DEV(L).lines,DEV(sv).ang];stopSim();return r""")
    ok('LCD e servo pela biblioteca',r[0][0].startswith('Faisca') and r[0][1].startswith('3.14') and r[1]==45,r)
    r=pg.evaluate("(()=>{try{cParse('void setup(){ pinMode(13, OUTPUT) } void loop(){}');return 'ok'}catch(e){return e.ln+':'+e.msg}})()")
    ok('erro de C++ com número da linha',r.startswith('1:'),r)
    r=ev("""const g=N('src',{v:'-'},100,700),p12=N('src',{v:'+',V:12},200,100),r=N('res',{R:1000},300,200),z=N('zener',{},300,400);W(p12,0,r,0);W(r,1,z,1);W(z,0,g,0);commit();startSim();const v=rt.A.vdc(K(z.id,1));stopSim();return v""")
    ok('Zener de 5,1 V',abs(r-5.1)<.1,r)
    r=ev("""const g=N('src',{v:'-'},100,700),ps=N('psub',{V:12,Ilim:.1},300,200),r=N('res',{R:10,Pw:5},600,200);W(ps,0,r,0);W(r,1,ps,1);W(ps,1,g,0);commit();startSim();const i=rt.A.m[r.id].i;stopSim();return i""")
    ok('fonte de bancada limita a corrente',abs(r-.1)<.005,r)
    print('== edição')
    pg.evaluate("""(()=>{S={comps:[],wires:[],seq:1};ensureDoc();const r=placeComp(makeComp('res',{}),400,200,0);S.comps.push(r);const l=placeComp(makeComp('led',{}),540,440,0);S.comps.push(l);commit();view={x:0,y:0,s:1};renderAll()})()""")
    o=pg.evaluate("(()=>{const r=document.getElementById('cv').getBoundingClientRect();return [r.left,r.top]})()")
    for x,y in [(400,240),(522,251),(540,400)]:pg.mouse.click(o[0]+x,o[1]+y)
    g=pg.evaluate("S.wires.map(w=>wireGeo(w).length)")
    ok('fio com curva sai reto até o terminal',g==[2,2],g)
    pg.select_option('#bTpl','555k');pg.wait_for_timeout(300)
    pg.evaluate("select(mkSel([S.comps.find(c=>c.type==='netl'&&c.net==='CAP').id]))");pg.wait_for_timeout(100)
    ok('rótulo de rede destaca a rede',pg.evaluate("document.querySelectorAll('#wL .nethl').length")>=3)
    pg.evaluate("S.comps.find(c=>c.tag==='R1').lo=[30,-20];commit()")
    pg.click('#bFile')
    with pg.expect_download() as d: pg.click('#bSave')
    fp=os.path.join(os.path.dirname(os.path.abspath(__file__)),'_teste.fais');d.value.save_as(fp)
    pg.keyboard.press('Escape');pg.click('#bFile');pg.set_input_files('#fIn',fp);pg.wait_for_timeout(500);os.remove(fp);pg.keyboard.press('Escape');pg.mouse.click(700,600)
    r=pg.evaluate("[JSON.stringify(S.comps.find(c=>c.tag==='R1').lo),S.sp,S.doc&&S.doc.titulo]")
    ok('arquivo .fais guarda nome arrastado, velocidade e carimbo',r[:2]==['[30,-20]',0.001],r)
    pg.keyboard.press('Escape');pg.evaluate("document.querySelectorAll('.mlist').forEach(m=>m.hidden=true)");pg.click('#bFile')
    with pg.expect_download() as d: pg.click('#bPng')
    ok('exportar PNG',d.value.suggested_filename.endswith('.png'))
    pg.evaluate("select(mkSel(S.comps.filter(c=>['R1','R2'].includes(c.tag)).map(c=>c.id)))");pg.click('#bBlk');pg.fill('#blkN','Teste');pg.click('#modal [data-ok]');pg.wait_for_timeout(100)
    n0=pg.evaluate("S.comps.length");pg.evaluate("blkPlace(blkLoad().length-1)");ok('bloco salvo e colocado',pg.evaluate("S.comps.length")-n0==2)
    pg.click('#bCfg');pg.click('[data-ct="d"]');pg.fill('#hQ','contator');pg.wait_for_timeout(100)
    ok('aba Dúvidas encontra "contator"',pg.evaluate("document.querySelector('#hRes summary').textContent")=='Contator')
    print('== protoboard')
    pg.keyboard.press('Escape');pg.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
    r=pg.evaluate("""(()=>{S={comps:[],wires:[],seq:1};const A=(t,p,x)=>{const c=placeComp(makeComp(t,p),x,100,0);S.comps.push(c);return c};const B=A('bat',{V:9},100),R=A('res',{R:470},200),L=A('led',{},300);
     S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};R.pbx=110;R.pby=40;R.pbr=0;L.pbx=150;L.pby=60;L.pbr=0;B.pbx=-100;B.pby=250;
     S.pb.w.push({id:'pw90',a:{c:B.id,t:0},b:{bd:'pb1',hx:11,hy:8}},{id:'pw91',a:{c:B.id,t:1},b:{bd:'pb1',hx:16,hy:8}});commit();
     const n=S.wires.filter(w=>w.pb).length;startSim();const i=rt.A.m[L.id].i;stopSim();return[n,i,document.querySelectorAll('#pbv .pbpart').length,document.body.classList.contains('pbmode')]})()""")
    ok('protoboard: encaixes viram fios do esquema e o LED acende',r[0]==3 and r[1]>.01 and r[2]==3 and r[3],r)
    r=pg.evaluate("""(()=>{const L=S.comps[2];pushHist();L.pby+=300;commit();const a=S.wires.filter(w=>w.pb).length;undo();return[a,S.wires.filter(w=>w.pb).length]})()""")
    ok('protoboard: tirar a peça desfaz a ligação (e desfazer volta)',r==[1,3],r)
    r=pg.evaluate("""(()=>{const st=parseFais(JSON.stringify({formato:'faisca',versao:FAIS_V,esquema:{comps:S.comps,wires:S.wires,seq:S.seq,pb:S.pb}}));return[st.pb.bds.length,st.pb.w.length,st.comps[1].pbx,st.wires.filter(w=>w.pb).length]})()""")
    ok('protoboard: arquivo .fais guarda a montagem',r==[1,2,110,3],r)
    r=pg.evaluate("""(()=>{S={comps:[],wires:[],seq:1};loadTpl('ardcpp',true);delete S.nopb;S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};commit();return[S.comps.filter(c=>pbVis(c)&&c.pbx!=null).length,document.querySelectorAll('#pbv .pbw').length]})()""")
    ok('protoboard: esquema pronto aparece montado com os fios',r[0]>=5 and r[1]>=5,r)
    r=pg.evaluate("""(()=>{S={comps:[],wires:[],seq:1};const A=(t,p,x)=>{const c=placeComp(makeComp(t,p),x,100,0);S.comps.push(c);return c};const R=A('res',{R:470},200),L=A('led',{},300);S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};R.pbx=110;R.pby=40;R.pbr=0;L.pbx=150;L.pby=60;L.pbr=0;commit();
     const w=S.wires.find(w=>w.pb);select(mkSel([],[w.id]));delSel();return[S.wires.length,pbConn(K(R.id,1),K(L.id,0))]})()""")
    ok('protoboard: apagar no esquema o fio da protoboard desliga a peça da placa',r==[0,False],r)
    r=pg.evaluate("(()=>{const it=[...document.querySelectorAll('#palette .pitem[data-p]')].filter(b=>!b.dataset.pbk).map(b=>{const[ci,ii]=b.dataset.p.split('.').map(Number);return PAL[ci][1][ii][1]});return[document.querySelectorAll('#palette svg.pbico').length>50,it.every(t=>!['coil','motor','lno','air','src','kno','gstep'].includes(t)),document.querySelectorAll('#palette .pbbdi').length]})()")
    ok('protoboard: paleta só com peças de bancada e desenho da protoboard',r==[True,True,3],r)
    pg.evaluate("(()=>{S={comps:[],wires:[],seq:1};let x=0;const A=(t,p,X,Y)=>{const c=placeComp(makeComp(t,p),x+=200,0,0);c.pbx=X;c.pby=Y;c.pbr=0;S.comps.push(c);return c};A('plc',{m:'ard'},400,-260);A('res',{},300,40);A('led',{},500,80);S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};commit();pbV={x:700-450*1.5,y:450+65*1.5,s:1.5};pbApplyView();pbRender()})()")
    W=lambda x,y: pg.evaluate(f"(()=>{{const b=document.getElementById('pbv').getBoundingClientRect();return[b.left+pbV.x+{x}*pbV.s,b.top+pbV.y+{y}*pbV.s]}})()")
    a=W(530,-250);z=W(300,40);pg.mouse.click(a[0]+4,a[1]-4);pg.mouse.click(z[0]-4,z[1]+4)
    l=W(510,80);h=W(450,120);pg.mouse.move(l[0]+4,l[1]);pg.mouse.down();pg.mouse.move(h[0]+3,h[1]-3,steps=8);pg.mouse.up()
    r=pg.evaluate("[S.wires.filter(w=>!w.pb).map(w=>w.a.c+':'+w.a.t+'-'+w.b.c+':'+w.b.t).join(),S.pb.w.map(w=>JSON.stringify([w.a,w.b])).join()]")
    ok('protoboard: ligar fio clicando ou arrastando (com folga) do terminal ao furo',r==['c1:13-c2:0','[{"c":"c3","t":1},{"bd":"pb1","hx":45,"hy":12}]'],r)
    pg.evaluate("(()=>{S={comps:[],wires:[],seq:1};const c=placeComp(makeComp('res',{}),200,100,0);c.pbx=150;c.pby=40;c.pbr=90;S.comps.push(c);S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};commit();pbV={x:400,y:300,s:1};pbApplyView();pbRender()})()")
    a=W(150,60);pg.mouse.move(*a);pg.mouse.down();pg.mouse.move(a[0],a[1]+30,steps=6);pg.mouse.up()
    r=pg.evaluate("[S.comps[0].pby,!!pbTool]")
    ok('protoboard: clicar no corpo da peça arrasta a peça (não puxa fio)',r==[70,False],r)
    setup="(()=>{S={comps:[],wires:[],seq:1};let x=0;const A=(t,p,X,Y,r=0)=>{const c=placeComp(makeComp(t,p),x+=200,0,0);c.pbx=X;c.pby=Y;c.pbr=r;S.comps.push(c);return c};A('res',{},110,40);A('led',{},150,60);A('res',{R:1000},300,250);S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};commit();pbV={x:100,y:150,s:1.5};pbApplyView();pbRender()})()"
    pg.evaluate(setup)
    r=pg.evaluate("(()=>{pbPtrIn=false;ptrIn=false;select(mkSel([S.comps[0].id]));copySel();pasteClip();const c=S.comps[3];select(mkSel([S.comps[1].id]));dupSel();const d=S.comps[4];return[c.pby>200,d.pby>200,S.wires.filter(w=>w.pb).length]})()")
    ok('protoboard: copiar/colar e duplicar não caem em cima da original',r==[True,True,1],r)
    r=pg.evaluate("(()=>{pbPtrIn=true;pbPtr={x:520,y:330};select(mkSel([S.comps[0].id]));copySel();pasteClip();const c=S.comps[S.comps.length-1];pbPtrIn=false;return[c.pbx,c.pby]})()")
    ok('colar (Ctrl+V) vai para onde está o mouse',r==[520,330],r)
    pg.evaluate(setup);a=W(300,250);z=W(150,60);pg.mouse.click(*a);pg.mouse.click(z[0]+1,z[1]+1)
    wid=pg.evaluate("S.wires.filter(w=>!w.pb)[0].id");pg.evaluate(f"(()=>{{pbSelW={{id:'{wid}',k:'s'}};pbRender()}})()")
    e=W(150,60);t=W(160,60);pg.mouse.move(*e);pg.mouse.down();pg.mouse.move(t[0],t[1],steps=6);pg.mouse.up()
    r1=pg.evaluate("JSON.stringify(S.wires.filter(w=>!w.pb).map(w=>[w.a,w.b]))")
    pg.evaluate(f"(()=>{{pbSelW={{id:'{wid}',k:'s'}};pbRender()}})()");e=W(160,60);t=W(400,130);pg.mouse.move(*e);pg.mouse.down();pg.mouse.move(t[0],t[1],steps=6);pg.mouse.up()
    r2=pg.evaluate("[S.wires.filter(w=>!w.pb).length,S.pb.w.length&&JSON.stringify(S.pb.w[0].b)]")
    ok('protoboard: arrastar a ponta do fio troca o terminal e vai para um furo',r1=='[[{"c":"c3","t":0},{"c":"c2","t":1}]]' and r2==[0,'{"bd":"pb1","hx":40,"hy":13}'],(r1,r2))
    a=W(260,215);z=W(345,275);pg.mouse.move(*a);pg.mouse.down();pg.mouse.move(z[0],z[1],steps=6);pg.mouse.up()
    ok('protoboard: seleção por retângulo',pg.evaluate("sel?[...sel.c].length:0")==1)
    pg.evaluate("(()=>{select(null);pbSelW=null;pbV={x:100,y:150,s:.7};pbApplyView();pbRender()})()");a=W(300,250);pg.mouse.click(*a)
    ok('protoboard: zoom afastado aproxima antes de ligar',pg.evaluate("[pbV.s.toFixed(2),!!pbTool]")==['1.80',False])
    pg.click('#bFile')
    with pg.expect_download() as d: pg.click('#bPng')
    n1=d.value.suggested_filename;pg.click('#bFile')
    with pg.expect_download() as d: pg.click('#bPdf')
    fp=os.path.join(os.path.dirname(os.path.abspath(__file__)),'_pb.pdf');d.value.save_as(fp);ini=open(fp,'rb').read(5);os.remove(fp)
    ok('protoboard: exportar PNG e PDF da montagem',n1.endswith('-protoboard.png') and d.value.suggested_filename.endswith('-protoboard.pdf') and ini==b'%PDF-',(n1,ini))
    r=pg.evaluate("""(()=>{S.sheets=[{id:1,name:'Folha 1'},{id:2,name:'Folha 2'}];S.cur=2;commit();const c=placeComp(makeComp('res',{}),200,100,0);c.pbx=110;c.pby=40;c.pbr=0;S.comps.push(c);commit();pbRender();
      const n2=document.querySelectorAll('#pbv .pbpart').length,b2=S.pb.bds.filter(b=>b.sh===2).length;S.cur=1;commit();pbRender();return[n2,b2,document.querySelectorAll('#pbv .pbpart').length]})()""")
    ok('protoboard: cada folha tem a sua bancada',r==[1,1,3],r)
    r=pg.evaluate("""(()=>{const sv=document.getElementById('pbv'),s0=pbV.s,ev=(t,id,x,y)=>sv.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:id,pointerType:'touch',clientX:x,clientY:y,button:0}));
      ev('pointerdown',11,600,400);ev('pointerdown',12,700,400);ev('pointermove',12,800,400);ev('pointermove',11,500,400);window.dispatchEvent(new PointerEvent('pointerup',{pointerId:11,pointerType:'touch'}));window.dispatchEvent(new PointerEvent('pointerup',{pointerId:12,pointerType:'touch'}));return pbV.s/s0})()""")
    ok('protoboard: pinça dá zoom',r>2.5,r)
    r=pg.evaluate("""(async()=>{let got=null;window.claude={use:async n=>n==='downloads'?{save:async o=>{got=o.filename;return{status:'saved'}}}:null};DLC=null;download(new Blob(['x']),'teste.fais');await new Promise(r=>setTimeout(r,50));delete window.claude;DLC=null;return got})()""")
    ok('baixar arquivos dentro do Claude (capacidade downloads)',r=='teste.fais.json',r)
    pg.keyboard.press('Escape');pg.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")
    pg.evaluate("(()=>{S={comps:[],wires:[],seq:1};const A=(t,x)=>{const c=placeComp(makeComp(t,{}),x,100,0);S.comps.push(c);return c};const R=A('res',200),L=A('led',300);R.pbx=110;R.pby=40;R.pbr=0;L.pbx=150;L.pby=60;L.pbr=0;S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};commit()})()")
    pg.click('#bLink');pg.wait_for_timeout(150);pg.click('#modal [data-ok]');pg.wait_for_timeout(150)
    r=pg.evaluate("[pbOn(),!!S.nopb,S.wires.filter(w=>w.pb).length,S.wires.length,getComputedStyle(document.getElementById('bPb')).display!=='none',S.alt.comps.length]")
    pg.click('#bLink');pg.wait_for_timeout(150);pg.click('#modal [data-ok]');pg.wait_for_timeout(150);r2=pg.evaluate("[!!S.nopb,pbOn(),!!S.alt]")
    ok('botão Vincular: desvincular (desenho fica com fios normais, protoboard continua) e vincular de novo',r==[False,True,0,1,True,2] and r2==[False,True,False],(r,r2))
    pg.evaluate("(()=>{S.pb.on=true;commit()})()")
    r=pg.evaluate("""(()=>{const out=[];for(const t of ['ardcpp','555','eletr','onda']){loadTpl(t,true);delete S.nopb;S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};commit();const M=()=>{startSim();const o={};for(const c of S.comps){const m=AM(c.id);o[c.id]=m?+(m.i||0).toPrecision(4):null}stopSim();return JSON.stringify(o)};
      const a=M(),nw=S.wires.length;pbAutoMount();const H=pbHoles(),fora=S.comps.filter(c=>pbVis(c)&&onSheet(c)&&!pkgOf(c).sock&&pkgOf(c).pins.length&&!termsOf(c).some((_,i)=>pbIns(c,i,H))).length;
      out.push([t,M()===a,S.wires.length===nw,fora,S.pb.w.length>0,document.querySelectorAll('#pbv .pbw').length===S.pb.w.length])}return out})()""")
    ok('protoboard: montar sozinho encaixa tudo, liga com jumpers e não muda a simulação',all(x[1] and x[2] and x[3]==0 and x[4] and x[5] for x in r),r)
    r=pg.evaluate("""(()=>{loadTpl('ardcpp',true);delete S.nopb;S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};commit();pbAutoMount();if(!pbOn()){S.pb.on=true;commit()}pbRender();const led=S.comps.find(c=>c.type==='led'),q=pbPin(led,1),sv=document.getElementById('pbv'),bb=sv.getBoundingClientRect();
      tool={key:'x',proto:makeComp('res',{R:330},'Resistor')};const hy=q.y<100?q.y-10:q.y+10,ev={bubbles:true,clientX:bb.left+pbV.x+q.x*pbV.s,clientY:bb.top+pbV.y+hy*pbV.s,button:0,pointerId:1};sv.dispatchEvent(new PointerEvent('pointerdown',ev));window.dispatchEvent(new PointerEvent('pointerup',ev));
      const c=S.comps[S.comps.length-1],w=S.wires.find(w=>w.pb&&(w.a.c===c.id||w.b.c===c.id)),L=wbox(led,true),C=wbox(c,true);return[c.type,!!w,Math.hypot((L[0]+L[2])/2-(C[0]+C[2])/2,(L[1]+L[3])/2-(C[1]+C[3])/2)<400,w?routeHits(wireGeo(w),obstaclesFor(byId(w.a.c),byId(w.b.c))):true]})()""")
    ok('protoboard: peça nova vai para perto da ligada no esquema e o fio desvia',r==['res',True,True,False],r)
    CPP={'struct':("struct P{int x;int y;};P a={3,4};P v[2]={{1,2},{5,6}};void setup(){Serial.begin(9600);P b=a;b.x=10;Serial.println(a.x);Serial.println(b.x);Serial.println(v[1].y);}void loop(){}","3\n10\n6\n"),
     'classe':("class C{public:C(int i):v(i){}void soma(int n){v+=n;}int pega(){return v;}float m(int k){return v/(float)k;}private:int v;};C c(5);void setup(){Serial.begin(9600);c.soma(3);Serial.println(c.pega());Serial.println(c.m(3));}void loop(){}","8\n2.67\n"),
     'fora':("class L{int p;bool on;public:L(int q);void liga();void troca(){if(on)desl();else liga();}void desl();};L::L(int q){p=q;on=false;}void L::liga(){on=true;Serial.println(1);}void L::desl(){this->on=false;Serial.println(0);}L l(13);void setup(){Serial.begin(9600);l.troca();l.troca();}void loop(){}","1\n0\n"),
     'heranca':("enum E{A,B=5,C};struct An{int n;int conta(){return n;}};struct Cao:public An{void late(){Serial.println(\"au\");}};void setup(){Serial.begin(9600);Cao d;d.n=4;d.late();Serial.println(d.conta());Serial.println(C);}void loop(){}","au\n4\n6\n"),
     'ref':("struct P{int v;};void dobra(P &p){p.v*=2;}void copia(P p){p.v=99;}P q={21};void setup(){Serial.begin(9600);dobra(q);copia(q);Serial.println(q.v);}void loop(){}","42\n"),
     'eeprom':("#include <EEPROM.h>\nvoid setup(){Serial.begin(9600);EEPROM.write(3,77);Serial.println(EEPROM.read(3));Serial.println(EEPROM.length());}void loop(){}","77\n1024\n")}
    ruins=[]
    for k,(src,esp) in CPP.items():
        r=pg.evaluate("""(async(src)=>{loadTpl('ardcpp',true);delete S.pb;const a=S.comps.find(c=>c.type==='plc');a.code=src;commit();startSim();await new Promise(r=>setTimeout(r,500));const st=rt.mcu[a.id];const o=[st.err,st.ser];stopSim();return o})""",src)
        if r[0] or r[1]!=esp: ruins.append((k,r))
    ok('Arduino C++: struct, class, métodos fora da classe, herança, enum, referência e EEPROM',not ruins,ruins)
    r=pg.evaluate("""(async()=>{S={comps:[],wires:[],seq:1};const A=(t,p,x,y)=>{const c=placeComp(makeComp(t,p),x,y,0);S.comps.push(c);return c};const a=A('plc',{m:'ard'},200,200),ic=A('ic',{k:'74HC595'},600,200);const W=(x,i,y,j)=>S.wires.push({id:'w'+S.seq++,a:{c:x.id,t:i},b:{c:y.id,t:j}});const N=namesOf(a),pi=n=>N.indexOf(n);
      W(a,pi('D11'),ic,13);W(a,pi('D12'),ic,10);W(a,pi('D8'),ic,11);W(a,pi('5V'),ic,15);W(a,pi('GND'),ic,7);W(a,pi('5V'),ic,9);W(a,pi('GND'),ic,12);
      a.code='void setup(){pinMode(8,OUTPUT);pinMode(11,OUTPUT);pinMode(12,OUTPUT);digitalWrite(8,LOW);delay(50);shiftOut(11,12,MSBFIRST,0xA5);delay(50);digitalWrite(8,HIGH);}void loop(){}';commit();startSim();await new Promise(r=>setTimeout(r,900));const q=[14,0,1,2,3,4,5,6].map(i=>rt.A.vdc(K(ic.id,i))>2?1:0).join('');stopSim();return q})()""")
    ok('Arduino C++: shiftOut acende as saídas do 74HC595',r=='10100101',r)
    r=pg.evaluate("(()=>{const q=pbOrtho([{x:0,y:0},{x:50,y:80}]),q2=pbOrtho([{x:0,y:0},{x:40,y:30},{x:90,y:100}]);const ax=L=>L.every((p,i)=>!i||Math.abs(p.x-L[i-1].x)<.5||Math.abs(p.y-L[i-1].y)<.5);return[ax(q),ax(q2),q.length]})()")
    ok('protoboard: fios em ângulo reto',r==[True,True,4],r)
    r=pg.evaluate("""(async()=>{S={comps:[],wires:[],seq:1};let x=0;const A=(t,p,X,Y)=>{const c=placeComp(makeComp(t,p),x+=200,0,0);c.pbx=X;c.pby=Y;c.pbr=0;S.comps.push(c);return c};const B=A('bat',{V:9},-100,300),R1=A('res',{R:1000},110,40),R2=A('res',{R:2000},150,40),M=A('mmeter',{},380,240);
      S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[{id:'pw1',a:{c:B.id,t:0},b:{bd:'pb1',hx:11,hy:5}},{id:'pw2',a:{c:B.id,t:1},b:{bd:'pb1',hx:19,hy:5}}]};M.pra='h:pb1:19:7';M.prb='h:pb1:15:7';const nw=S.wires.length;commit();startSim();await new Promise(r=>setTimeout(r,300));const v=mmRead(M);stopSim();return[v,document.querySelectorAll('.pbprobe').length,S.wires.filter(w=>w.a.c===M.id||w.b.c===M.id).length]})()""")
    ok('protoboard: pontas do multímetro medem sem ligar fios (divisor dá 6 V)',r==['6 V',2,0],r)
    ruins=[]
    for k,pin in [('nano','D9'),('mega','D40'),('esp32','D25'),('pico','GP15')]:
        r=pg.evaluate("""(async([k,pin])=>{S={comps:[],wires:[],seq:1};const A=(t,p,x,y)=>{const c=placeComp(makeComp(t,p),x,y,0);S.comps.push(c);return c};const m=A(k,{},400,200),R=A('res',{R:220},400,500),L=A('led',{},400,700);
          const N=namesOf(m),W=(a,i,b,j)=>S.wires.push({id:'w'+S.seq++,a:{c:a.id,t:i},b:{c:b.id,t:j}});W(m,N.indexOf(pin),R,0);W(R,1,L,0);W(L,1,m,N.indexOf('GND'));m.code=CEX['Piscar o LED (Blink)'].replace(/13/g,String(BRD[k].num(pin)));
          S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};commit();pbAutoMount(true);startSim();let on=0,off=0;for(let i=0;i<10;i++){await new Promise(r=>setTimeout(r,110));if(ledB(L)>.1)on++;else off++}const st=rt.mcu[m.id];stopSim();return[st.err,on>0&&off>0]})""",[k,pin])
        if r!=[None,True]:ruins.append((k,r))
    ok('placas Nano, Mega, ESP32 e Pico rodam C++ e piscam o LED',not ruins,ruins)
    r=ev("""const o=[];for(const t of ['tmp36','lm35']){const s=N(t,{temp:25},400,400),bb=N('bat',{V:5,ri:1},100,300),r=N('res',{R:1e6},600,550);W(bb,0,s,0);W(bb,1,s,2);W(s,1,r,0);W(r,1,bb,1);commit();startSim();clearInterval(timer);for(let i=0;i<4;i++)tick();o.push(+(rt.A.vdc(K(s.id,1))-rt.A.vdc(K(s.id,2))).toFixed(3));stopSim();S.comps=[];S.wires=[]}return o""")
    ok('TMP36/LM35 com bateria isolada e carga de 1 MΩ mantêm a saída',r==[0.75,0.25],r)
    ruins=[]
    for k in ['ard_semaforo','ard_alarme','ard_termo','ard_servo','ard_distancia','ard_contador','ard_arcoiris']:
        r=pg.evaluate(f"""(async()=>{{loadTpl('{k}',true);const H=pbHoles(),fora=S.comps.filter(c=>pbVis(c)&&!pkgOf(c).sock&&pkgOf(c).pins.length&&!termsOf(c).some((_,i)=>pbIns(c,i,H))).length;startSim();await new Promise(r=>setTimeout(r,700));const a=S.comps.find(c=>c.type==='plc'),st=rt.mcu[a.id];const o=[fora,st.err,analyze().issues.filter(i=>i.lvl==='erro').length];stopSim();return o}})()""")
        if r!=[0,None,0]:ruins.append((k,r))
    ok('galeria: 7 projetos com Arduino montados na protoboard e rodando',not ruins,ruins)
    r=pg.evaluate("(async()=>{loadTpl('ard_arcoiris',true);S.pb.on=true;commit();startSim();await new Promise(r=>setTimeout(r,900));refresh(true);const n=[...document.querySelectorAll('#pbv .pbpart circle')].filter(c=>/rgb\\(/.test(c.getAttribute('fill')||'')).length;stopSim();return n})()")
    ok('protoboard: anel NeoPixel acende na simulação',r==12,r)
    r=pg.evaluate("(async()=>{loadTpl('ard_termo',true);startSim();await new Promise(r=>setTimeout(r,800));const l=DEV(S.comps.find(c=>c.type==='lcdi2c')).lines||[];stopSim();return l[1]||''})()")
    ok('galeria: termômetro mostra a temperatura certa no LCD (24 °C)',23.4<float(r.split()[0] or 0)<24.6,r)
    pg.evaluate("(()=>{S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};delete S.nopb;commit()})()")
    pg.click('#bPb');ok('protoboard: botão volta ao esquema',pg.evaluate("!document.body.classList.contains('pbmode')&&!document.getElementById('bTrain')"))
    pg.evaluate("(()=>{S={comps:[],wires:[],seq:1};ensureDoc();S.pb={on:false,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};commit();pbToggle()})()");pg.wait_for_timeout(150)
    pg.fill('#psearch','led');pg.wait_for_timeout(150)
    r=pg.evaluate("[document.querySelectorAll('#palette .pitem').length,document.querySelectorAll('#palette .pitem svg:not(.pbico)').length]")
    pg.fill('#psearch','');pg.evaluate("pbToggle()")
    ok('protoboard: busca na paleta mostra só peças da protoboard',r[0]>0 and r[1]==0,r)
    r=pg.evaluate("""(async()=>{const o=[];for(const V of [9,4.5,24]){S={comps:[],wires:[],seq:1};ensureDoc();const b=placeComp(makeComp('bat',{V,ri:.1}),100,200,0),l=placeComp(makeComp('bulb',{}),300,200,0);S.comps.push(b,l);S.wires.push({id:'w1',a:{c:b.id,t:0},b:{c:l.id,t:0}},{id:'w2',a:{c:l.id,t:1},b:{c:b.id,t:1}});commit();startSim();await new Promise(r=>setTimeout(r,V>20?3600:300));o.push(V>20?!!rt.burnt[l.id]:Math.round(bulbB(l)*100));stopSim()}return o})()""")
    ok('lâmpada pequena: 9 V acende 100%, 4,5 V fraca, 24 V queima',r[0]>=97 and 20<=r[1]<=30 and r[2] is True,r)
    r=pg.evaluate("""(()=>{const o=[];const T=()=>S.comps.map(c=>c.type).sort().join(',');document.getElementById('bNew').click();const r=placeComp(makeComp('res',{}),300,300,0);S.comps.push(r);commit();o.push(T(),pbOn());pbToggle();o.push(T(),pbOn());const l=placeComp(makeComp('led',{}),500,300,0);l.pbx=100;l.pby=60;S.comps.push(l);commit();pbToggle();o.push(T());
const e=cleanState(JSON.parse(JSON.stringify({comps:S.comps,wires:S.wires,seq:S.seq,pb:S.pb,nopb:S.nopb,alt:S.alt})));o.push(e.alt.comps.length);pbSetUse(true);o.push(T(),pbOn());pbSetUse(false);S.comps=S.comps.filter(c=>c.type!=='res');commit();pbToggle();o.push(T());pbToggle();return o})()""")
    ok('projeto novo sem vínculo: desenho e protoboard separados; vincular junta; desvincular separa',r==['res',False,'',True,'res',1,'led,res',True,'led,res'],r)
    print('== valores de datasheet (como no Tinkercad)')
    r=pg.evaluate("""(async()=>{const o={};const run=async(build,ms)=>{S={comps:[],wires:[],seq:1};ensureDoc();const A=(t,p,x,y)=>{const c=placeComp(makeComp(t,p||{}),x,y,0);S.comps.push(c);return c};const W=(a,i,b,j)=>S.wires.push({id:'w'+S.seq++,a:{c:a.id,t:i},b:{c:b.id,t:j}});const r=build(A,W);commit();startSim();await new Promise(z=>setTimeout(z,ms||300));const v=r();stopSim();return v};
o.def=[makeComp('res',{}).R,makeComp('pot',{}).R];
o.led220=await run((A,W)=>{const b=A('bat',{V:5,ri:.01},100,200),R=A('res',{R:220},300,100),L=A('led',{col:'vermelha',Vf:2},500,200);W(b,0,R,0);W(R,1,L,0);W(L,1,b,1);return()=>[+(AM(L.id).i*1000).toFixed(1),+VD(L,0,1).toFixed(2)]});
o.led9v=await run((A,W)=>{const b=A('bat',{V:9,ri:1.5},100,200),L=A('led',{col:'vermelha',Vf:2},500,200);W(b,0,L,0);W(L,1,b,1);return()=>!!rt.burnt[L.id]});
o.ledpin=await run((A,W)=>{const m=A('plc',{m:'ard'},300,200),L=A('led',{col:'vermelha',Vf:2},600,200);const N=namesOf(m),ix=n=>N.findIndex(x=>String(x).replace(/^.*\\./,'')===n);W(m,ix('D13'),L,0);W(L,1,m,ix('GND'));m.code='void setup(){pinMode(13,OUTPUT);digitalWrite(13,HIGH);}void loop(){}';return()=>[!!rt.burnt[L.id],+(AM(L.id).i*1000).toFixed(0)]},3600);
o.blue=await run((A,W)=>{const b=A('bat',{V:5,ri:.01},100,200),R=A('res',{R:100},300,100),L=A('led',{col:'azul',Vf:3.2},500,200);W(b,0,R,0);W(R,1,L,0);W(L,1,b,1);return()=>+VD(L,0,1).toFixed(2)});
o.diode=await run((A,W)=>{const b=A('bat',{V:12,ri:.01},100,200),R=A('res',{R:11,Pw:50},300,100),d=A('diode',{},500,200);W(b,0,R,0);W(R,1,d,0);W(d,1,b,1);return()=>+VD(d,0,1).toFixed(2)});
o.vreg=await run((A,W)=>{const b=A('bat',{V:40,ri:.01},100,200),u=A('vreg',{V:5},300,200);W(b,0,u,0);W(b,1,u,1);return()=>!!rt.burnt[u.id]});
const c=makeComp('led',{col:'vermelha',Vf:2});c.col='azul';DEFS.led.onSet(c,'col');o.cor=c.Vf;return o})()""")
    ok('padrões: resistor 1 kΩ e potenciômetro 250 kΩ (Tinkercad)',r['def']==[1000,250000],r['def'])
    ok('LED vermelho com 220 Ω em 5 V: ~14 mA e ~1,9 V',13<r['led220'][0]<15.5 and 1.85<r['led220'][1]<2.0,r['led220'])
    ok('LED direto na bateria de 9 V queima; direto no pino do Arduino só esquenta',r['led9v'] is True and r['ledpin'][0] is False and 40<r['ledpin'][1]<70,[r['led9v'],r['ledpin']])
    ok('LED azul ~3 V, diodo 1N4007 ~0,95 V a 1 A, 7805 queima com 40 V, cor azul ajusta Vf para 3,2 V',2.9<r['blue']<3.2 and .9<r['diode']<1.0 and r['vreg'] is True and r['cor']==3.2,r)
    r=pg.evaluate("""(async()=>{S={comps:[],wires:[],seq:1};ensureDoc();const A=(t,p,x,y)=>{const c=placeComp(makeComp(t,p||{}),x,y,0);S.comps.push(c);return c};const W=(a,i,b,j)=>S.wires.push({id:'w'+S.seq++,a:{c:a.id,t:i},b:{c:b.id,t:j}});
const g=A('psub',{V:5},100,200),u=A('ic',{k:'74HC08'},500,200),R=A('res',{R:220},800,100),L=A('led',{col:'branca',Vf:3.2},900,300);W(g,0,u,13);W(g,1,u,6);W(g,0,u,0);W(g,0,u,1);W(u,2,R,0);W(R,1,L,0);W(L,1,g,1);commit();startSim();await new Promise(z=>setTimeout(z,400));const v=[+VD(u,2,6).toFixed(1),+(AM(L.id).i*1000).toFixed(1),Math.round(ledB(L)*100)];stopSim();return v})()""")
    ok('CI com fonte de bancada isolada: saída em ~4,7 V e LED branco com 220 Ω acende bem (~8 mA)',r[0]>=4.5 and 7<r[1]<9 and r[2]>55,r)
    print('== MicroPython, Wi-Fi, módulos novos, osciloscópio e defeitos')
    PRE=r"""S={comps:[],wires:[],seq:1};ensureDoc();const A=(t,p,x,y)=>{const c=placeComp(makeComp(t,p||{}),x,y,0);S.comps.push(c);return c};const W=(a,i,b,j)=>S.wires.push({id:'w'+S.seq++,a:{c:a.id,t:i},b:{c:b.id,t:j}});
const ix=(c,n)=>{const N=namesOf(c);let i=N.indexOf(n);if(i<0)i=N.findIndex(x=>String(x).replace(/^.*\./,'')===n);return i};const sleep=ms=>new Promise(r=>setTimeout(r,ms));"""
    A=lambda js:pg.evaluate("(async()=>{"+PRE+js+"})()")
    r=A(r"""const m=A('pico',{},400,200),R=A('res',{R:220},400,500),L=A('led',{},400,700);W(m,ix(m,'GP15'),R,0);W(R,1,L,0);W(L,1,m,ix(m,'GND'));
m.code='from machine import Pin\nimport time\nled = Pin(15, Pin.OUT)\nwhile True:\n    led.toggle()\n    time.sleep(0.2)\n';commit();startSim();let on=0,off=0;for(let i=0;i<12;i++){await sleep(100);if(ledB(L)>.1)on++;else off++}const st=rt.mcu[m.id];stopSim();return[st.err,on>1&&off>1]""")
    ok('MicroPython: Pico pisca o LED do GP15',r==[None,True],r)
    r=A(r"""const m=A('esp32',{},400,200);m.code=`import math
class P:
    def __init__(self, n=0):
        self.n = n
    def mais(self, k=1):
        self.n += k
        return self
    def __str__(self):
        return 'P(%d)' % self.n
p = P(2).mais().mais(3)
d = {k: v for k, v in zip('abc', range(3))}
try:
    1 / 0
except ZeroDivisionError as e:
    erro = str(e)
a, *b = [1, 2, 3]
print(p, 7 / 2, 4 / 2, 7 // 2, -7 % 3, 2 ** 8, f"{math.pi:.3f}", sorted(d, key=lambda k: -d[k]), b, [x * x for x in range(4) if x % 2], erro != '', "{:>4}|{:<3}|".format('ab', 1), int('ff', 16), 'x' in d, len('olá'))
`;commit();startSim();await sleep(300);const st=rt.mcu[m.id];stopSim();return[st.err,st.ser.trim()]""")
    ok('MicroPython: classes, f-strings, divisão, fatiamento e exceções',r==[None,"P(6) 3.5 2.0 3 2 256 3.142 ['c', 'b', 'a'] [2, 3] [1, 9] True   ab|1  | 255 False 3"],r)
    r=A(r"""const m=A('esp32',{},400,200);m.code='x = 1\nprint(y)\n';commit();startSim();await sleep(200);const st=rt.mcu[m.id];stopSim();let pe='';try{progParse('if True\n  x=1\n')}catch(e){pe=e.ln+':'+e.msg}return[st.err,pe]""")
    ok('MicroPython: erro mostra a linha (execução e sintaxe)',r[0]=='Linha 2: NameError: o nome "y" não foi definido' and r[1].startswith('1:'),r)
    r=A(r"""const m=A('pico',{},400,200);m.code='from machine import Timer\nimport time\nn = 0\ndef t(x):\n    global n\n    n += 1\nTimer(period=100, mode=Timer.PERIODIC, callback=t)\ntime.sleep(1.05)\nprint(n)\n';commit();startSim();await sleep(1800);const st=rt.mcu[m.id];stopSim();return[st.err,st.ser.trim()]""")
    ok('MicroPython: Timer periódico roda durante o sleep (10 vezes em 1 s)',r==[None,'10'],r)
    r=A(r"""const m=A('esp32',{},300,200),o=A('oled',{},700,200);W(o,0,m,ix(m,'GND'));W(o,1,m,ix(m,'3V3'));W(o,2,m,ix(m,'D22'));W(o,3,m,ix(m,'D21'));m.code=CEX['ESP32: Wi-Fi e display OLED (C++)'];commit();startSim();await sleep(2600);const st=rt.mcu[m.id],d=DEV(o);const r=[st.err,/IP: 192\.168\.0\.\d+/.test(st.ser),(d.txt||[]).map(t=>t.s).join('|').slice(0,6),(d.buf||[]).reduce((a,b)=>a+b,0)>300];stopSim();return r""")
    ok('ESP32 C++: Wi-Fi simulado conecta e o OLED mostra texto e desenho',r==[None,True,'Faisca',True],r)
    r=A(r"""const m=A('esp32',{},300,200),o=A('oled',{},700,200);W(o,0,m,ix(m,'GND'));W(o,1,m,ix(m,'3V3'));W(o,2,m,ix(m,'D22'));W(o,3,m,ix(m,'D21'));m.code=CEX['MicroPython: Wi-Fi + OLED (ESP32)'];commit();startSim();await sleep(2600);const st=rt.mcu[m.id],d=DEV(o);const r=[st.err,/conectado, IP 192\.168\.0\.\d+/.test(st.ser),(d.txt||[]).map(t=>t.s)[0]];stopSim();return r""")
    ok('MicroPython: network.WLAN conecta e o ssd1306 escreve no OLED',r==[None,True,'Wi-Fi OK'],r)
    r=A(r"""const m=A('plc',{m:'ard'},300,200),s=A('step28',{},700,300);[8,9,10,11].forEach((p,i)=>W(s,i,m,ix(m,'D'+p)));W(s,4,m,ix(m,'5V'));W(s,5,m,ix(m,'GND'));
m.code='#include <Stepper.h>\nStepper motor(2048, 8, 10, 9, 11);\nvoid setup(){motor.setSpeed(15);motor.step(512);Serial.println("fim");}\nvoid loop(){}';commit();startSim();await sleep(3500);const st=rt.mcu[m.id];const r=[st.err,st.ser.trim(),Math.round(stpAng(s))];stopSim();return r""")
    ok('motor de passo: Stepper.step(512) gira 90° (28BYJ-48)',r[0] is None and r[1]=='fim' and 88<=r[2]<=91,r)
    r=A(r"""const m=A('plc',{m:'ard'},300,200),h=A('l298n',{},700,300),b=A('bat',{V:12,ri:.1},1000,100),mo=A('motdc',{Vn:9,P:6},1000,500);W(b,0,h,2);W(b,1,h,3);W(h,3,m,ix(m,'GND'));W(h,8,m,ix(m,'D5'));W(h,9,m,ix(m,'D6'));W(h,0,mo,0);W(h,1,mo,1);
m.code='bool r=false;void setup(){pinMode(5,OUTPUT);pinMode(6,OUTPUT);}void loop(){digitalWrite(5,r?LOW:HIGH);digitalWrite(6,r?HIGH:LOW);delay(1000);r=!r;}';commit();startSim();await sleep(700);const a=[VD(h,0,1)>8,DEV(h).a];await sleep(1000);a.push(VD(h,0,1)<-8,DEV(h).a);stopSim();return a""")
    ok('ponte H L298N: IN1/IN2 invertem o sentido do motor',r==[True,'fwd',True,'rev'],r)
    r=A(r"""const m=A('plc',{m:'ard'},300,200),k=A('rlymod',{},700,300),b=A('bat',{V:9,ri:.1},1000,100),R=A('res',{R:470},1000,400),L=A('led',{},1000,600);W(k,0,m,ix(m,'5V'));W(k,1,m,ix(m,'GND'));W(k,2,m,ix(m,'D7'));W(b,0,k,4);W(k,3,R,0);W(R,1,L,0);W(L,1,b,1);
m.code='void setup(){pinMode(7,OUTPUT);}void loop(){digitalWrite(7,HIGH);delay(300);digitalWrite(7,LOW);delay(300);}';commit();startSim();let on=0,off=0;for(let i=0;i<12;i++){await sleep(100);if(ledB(L)>.1)on++;else off++}k.lvl='L';const r=[rt.mcu[m.id].err,on>2&&off>2];stopSim();return r""")
    ok('módulo relé: o pino do Arduino liga a carga pelo contato NA',r==[None,True],r)
    r=A(r"""const m=A('plc',{m:'ard'},300,200),e=A('renc',{},700,300);W(e,0,m,ix(m,'D2'));W(e,1,m,ix(m,'D3'));W(e,2,m,ix(m,'D4'));W(e,3,m,ix(m,'5V'));W(e,4,m,ix(m,'GND'));m.code=CEX['Encoder rotativo KY-040'];
commit();startSim();await sleep(300);for(let i=0;i<3;i++){D(e).hitClick(e,30,0);await sleep(500)}D(e).hitClick(e,-30,0);await sleep(700);D(e).hitClick(e,0,0);solve();await sleep(250);D(e).release(e);solve();await sleep(100);const r=[rt.mcu[m.id].err,rt.mcu[m.id].ser.replace(/posição: /g,'').trim().split('\n').join(',')];stopSim();return r""")
    ok('encoder KY-040: girar e apertar chegam ao Arduino (1,2,3,2,botão)',r==[None,'1,2,3,2,botão!'],r)
    r=A(r"""const g=A('fgen',{},300,600),R=A('res',{R:1000},700,200),sc=A('scope',{},700,600);W(g,0,R,0);W(R,1,g,1);S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};commit();pbAutoMount(true);sc.pra='p:'+R.id+':0';sc.prg='p:'+R.id+':1';sc.trig='auto';sc.tlev=1;commit();
startSim();await sleep(1500);const x=scopeCh(sc,0),w=waveTr()||'';const r=[Math.abs(x.dc-VD(R,0,1))<1e-6,S.wires.some(q=>q.a.c===sc.id||q.b.c===sc.id),document.querySelectorAll('.pbprobe').length,/trigger CH1/.test(w)];stopSim();return r""")
    ok('osciloscópio: pontas medem sem fios e o trigger aparece',r==[True,False,3,True],r)
    r=A(r"""const bt=A('bat',{V:9,ri:.5},200,200),L=A('led',{},500,200);W(bt,0,L,0);W(L,1,bt,1);S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[{id:'pw1',a:{bd:'pb1',hx:55,hy:8},b:{bd:'pb1',hx:58,hy:12}}]};commit();pbAutoMount(true);commit();const loose=document.querySelectorAll('#pbX .pbblink').length;
startSim();await sleep(2600);const smoke=document.querySelectorAll('#pbC .pbsmoke').length,burnt=!!rt.burnt[L.id];stopSim();S.pb.w.push({id:'pw9',a:{c:bt.id,t:0},b:{c:bt.id,t:1}});commit();startSim();await sleep(300);const sh=document.querySelectorAll('#pbX .pbshort').length;stopSim();return[loose,burnt,smoke>0,sh>1]""")
    ok('protoboard: fio solto não pisca, LED queimado solta fumaça e o curto fica vermelho',r==[0,True,True,True],r)
    r=pg.evaluate(r"""(()=>{const p=plotParse('1 2\n3 4\ntemp:20 umid:50\nlixo\n5,6\n');return[p.order.join('|'),p.n,p.ser['valor 1'].length]})()""")
    ok('Serial Plotter: lê colunas e nome:valor',r==['valor 1|valor 2|temp|umid',4,3],r)
    r=pg.evaluate(r"""(async()=>{const sl=ms=>new Promise(q=>setTimeout(q,ms));loadTpl('ard_semaforo',true);commit();startSim();await sl(1800);const s=S.comps.find(c=>c.type==='tact'),L=S.comps.filter(c=>c.type==='led');const on=()=>L.map(c=>rt.A.m[c.id]&&rt.A.m[c.id].i>.005?1:0).join('');const a=on();simPress(s.id);await sl(500);rt.pressed.delete(s.id);const b=on();stopSim();return[a,b]})()""")
    ok('semáforo: botão de pedestre adianta o amarelo (millis() - inicio sem sinal)',r==['001','010'],r)
    ok('nenhum erro de JavaScript',not erros,erros)
    b.close()
print('\nFALHAS:',len(falhas));sys.exit(1 if falhas else 0)
