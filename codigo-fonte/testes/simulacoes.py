"""Bateria de simulações do modo Protoboard.
Uso: python3 testes/simulacoes.py [arquivo.html] [rodadas]
Sai com código 1 se encontrar qualquer problema."""
import os, sys, json, random
from playwright.sync_api import sync_playwright

AQUI = os.path.dirname(os.path.abspath(__file__))
HTML = sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, '..', '..', 'index.html')
RODADAS = int(sys.argv[2]) if len(sys.argv) > 2 else 150
falhas = []
def ok(nome, cond, info=''):
    print(('  ok  ' if cond else '  FALHOU  ') + nome + ('' if cond else f'  -> {info}'))
    if not cond: falhas.append(nome)

JS_UTIL = r"""
window.T_inv=function(){const P=[];if(!S.pb)return P;const ph=pbPhys(),sch=pbUF();for(const w of S.wires)sch.u(K(w.a.c,w.a.t),K(w.b.c,w.b.t));
 for(const w of S.wires)if(w.pb&&ph.uf.f(K(w.a.c,w.a.t))!==ph.uf.f(K(w.b.c,w.b.t)))P.push('fio automático sem ligação física '+w.id);
 const g=new Map();for(const c of S.comps){if(!pbVis(c))continue;termsOf(c).forEach((_,i)=>{const k=K(c.id,i),r=ph.uf.f(k);if(!g.has(r))g.set(r,[]);g.get(r).push(k)})}
 for(const ks of g.values())for(const k of ks.slice(1))if(sch.f(k)!==sch.f(ks[0]))P.push('ligação física sem fio no esquema '+ks[0]+' '+k);
 try{cleanState(JSON.parse(JSON.stringify(S)))}catch(e){P.push('estado inválido: '+e.message)}
 const ids=new Set();for(const w of S.wires){if(ids.has(w.id))P.push('id de fio repetido '+w.id);ids.add(w.id)}for(const w of S.pb.w){if(ids.has(w.id))P.push('id de jumper repetido '+w.id);ids.add(w.id)}
 return P};
window.T_rng=function(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296}};
/* circuito aleatório montado só na protoboard */
window.T_build=function(seed){const R=T_rng(seed),pick=a=>a[Math.floor(R()*a.length)];S={comps:[],wires:[],seq:1};
 S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[]};let sx=0;const used=new Set(),A=(t,p)=>{const c=placeComp(makeComp(t,p),sx+=200,0,0);S.comps.push(c);return c};
 const B=A('bat',{V:pick([3,5,9,12])});B.pbx=-200;B.pby=300;B.pbr=0;
 const holeOk=(x,y)=>{const hx=x/10,hy=y/10;if(hx<2||hx>64)return false;if(hy>=4&&hy<=8||hy>=11&&hy<=15)return true;if([1,2,17,18].includes(hy)){const c=hx-2;return c>=1&&c<=61&&(c-1)%6!==5}return false};
 let chain=null;if(R()<.6){const rows=R()<.5?[4,5,6,7,8]:[11,12,13,14,15];let x=10*(3+Math.floor(R()*20));const x0=x,np=1+Math.floor(R()*3);
  for(let k=0;k<np;k++){const t=k===np-1?'led':pick(['res','res','diode']),p=t==='res'?{R:pick([100,220,470,1000])}:t==='led'?{col:pick(['vermelha','verde','azul'])}:{};const c=makeComp(t,p),tmp={...c,pbx:x,pby:0,pbr:0},sp=pkgOf(tmp).pins[1][0]*10;
   const y=10*rows.find(r=>!used.has(x+','+(10*r))&&!used.has((x+sp)+','+(10*r)));if(!y)break;const nc=placeComp(c,sx+=200,0,0);nc.pbx=x;nc.pby=y;nc.pbr=0;S.comps.push(nc);used.add(x+','+y);used.add((x+sp)+','+y);x+=sp}
  const fr=X=>{const y=rows.find(r=>!used.has(X+','+(10*r)));if(y==null)return null;used.add(X+','+(10*y));return{bd:'pb1',hx:X/10,hy:y}};chain=[fr(x0),fr(x)]}
 const n=S.comps.length+1+Math.floor(R()*5);let tries=0;
 while(S.comps.length<n+1&&tries++<400){const t=pick(['res','res','res','led','led','diode','res']),p=t==='res'?{R:pick([100,220,330,470,1000,2200,10000])}:t==='led'?{col:pick(['vermelha','verde','azul','amarela','branca'])}:{};
  const c=makeComp(t,p),r=pick([0,0,90,90,180,270]);const tmp={...c,pbx:0,pby:0,pbr:r};const pk=pkgOf(tmp);
  const x=10*(2+Math.floor(R()*63)),y=10*pick([4,5,6,7,8,11,12,13,14,15]);tmp.pbx=x;tmp.pby=y;const ps=pk.pins.map((_,i)=>pbPin(tmp,i));
  if(!ps.every(q=>holeOk(q.x,q.y)&&!used.has(q.x+','+q.y)))continue;ps.forEach(q=>used.add(q.x+','+q.y));const nc=placeComp(c,sx+=200,0,0);nc.pbx=x;nc.pby=y;nc.pbr=r;S.comps.push(nc)}
 const free=()=>{for(let k=0;k<200;k++){const x=10*(2+Math.floor(R()*63)),y=10*pick([1,2,4,5,6,7,8,11,12,13,14,15,17,18]);if(holeOk(x,y)&&!used.has(x+','+y)){used.add(x+','+y);return{bd:'pb1',hx:x/10,hy:y/10}}}return null};
 const parts=S.comps.slice(1),colOf=c=>{const q=pbPin(c,0);return{bd:'pb1',hx:q.x/10,hy:q.y/10<10?(q.y/10===8?7:q.y/10+1):(q.y/10===15?14:q.y/10+1)}};
 /* bateria: + num barramento ou coluna, − noutro */
 const e1=chain&&chain[0]||free(),e2=chain&&chain[1]||free();if(e1)S.pb.w.push({id:'pw'+(S.seq++),a:{c:B.id,t:0},b:e1});if(e2)S.pb.w.push({id:'pw'+(S.seq++),a:{c:B.id,t:1},b:e2});
 const nj=2+Math.floor(R()*6);for(let k=0;k<nj;k++){const a=free(),b=free();if(a&&b)S.pb.w.push({id:'pw'+(S.seq++),a,b})}
 if(R()<.5&&parts.length){const c=pick(parts),e=free();if(e)S.pb.w.push({id:'pw'+(S.seq++),a:{c:c.id,t:1},b:e})}
 commit();return S.comps.length};
/* nós esperados calculados de forma independente da protoboard (geometria pura) */
window.T_expect=function(){const uf=pbUF(),netAt=(x,y)=>{const hx=x/10,hy=y/10;if(hy>=4&&hy<=8)return'c'+hx+'t';if(hy>=11&&hy<=15)return'c'+hx+'b';if([1,2,17,18].includes(hy))return'r'+hy;return null};
 for(const c of S.comps){if(c.type==='bat')continue;termsOf(c).forEach((_,i)=>{const q=pbPin(c,i),n=netAt(q.x,q.y);if(n)uf.u(K(c.id,i),'N'+n)})}
 const nd=e=>e.c?K(e.c,e.t):'N'+netAt(e.hx*10,e.hy*10);for(const w of S.pb.w)uf.u(nd(w.a),nd(w.b));
 const g=new Map();for(const c of S.comps)termsOf(c).forEach((_,i)=>{const k=K(c.id,i),r=uf.f(k);if(!g.has(r))g.set(r,[]);g.get(r).push(k)});
 const wires=[];let n=1;for(const ks of g.values())for(const k of ks.slice(1)){const[a,b]=[ks[0],k].map(s=>s.split(':'));wires.push({id:'x'+(n++),a:{c:a[0],t:+a[1]},b:{c:b[0],t:+b[1]}})}
 return{comps:JSON.parse(JSON.stringify(S.comps)).map(c=>{delete c.pbx;delete c.pby;delete c.pbr;return c}),wires,seq:9999}};
window.T_meas=function(){startSim();const o={};for(const c of S.comps){const m=AM(c.id);o[c.tag||c.id]=m?[+(m.i||0).toPrecision(5),+(m.vdc!=null?m.vdc:m.v||0).toPrecision(5),!!rt.burnt[c.id]]:null}stopSim();return o};
window.T_same=function(a,b){const bad=[];for(const k in a){const x=a[k],y=b[k];if(!x&&!y)continue;if(!x||!y){bad.push(k);continue}for(let i=0;i<2;i++){const d=Math.abs(x[i]-y[i]);if(d>1e-6+1e-3*Math.max(Math.abs(x[i]),Math.abs(y[i])))bad.push(k+':'+i+' '+x[i]+'≠'+y[i])}if(x[2]!==y[2])bad.push(k+' queimado')}return bad};
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1500, 'height': 950})
    pg.route('http*://**', lambda r: r.abort())
    pg.add_init_script("localStorage.setItem('faisca-tour-v1','1')")
    erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.goto('file://' + os.path.abspath(HTML)); pg.wait_for_timeout(600)
    pg.evaluate(JS_UTIL)

    print(f'== {RODADAS} circuitos aleatórios montados na protoboard x esquema equivalente')
    ruins = []; tot_auto = 0; acesos = 0; curtos = 0
    for i in range(RODADAS):
        r = pg.evaluate(f"""()=>{{T_build({i*7919+13});const inv=T_inv(),a=T_meas(),ref=T_expect(),S0=S;tot=S.wires.filter(w=>w.pb).length;
          S=ref;const bm=T_meas();S=S0;commit();const lit=S.comps.filter(c=>c.type==='led'&&a[c.tag]&&a[c.tag][0]>.001).length,bat=a[S.comps[0].tag];return[inv,T_same(a,bm),tot,lit,bat&&Math.abs(bat[0])>2]}}""")
        tot_auto += r[2]; acesos += r[3]; curtos += 1 if r[4] else 0
        if r[0] or r[1]: ruins.append((i, r[0][:3], r[1][:3]))
    ok(f'{RODADAS} circuitos: simulação pela protoboard = esquema desenhado ({tot_auto} fios automáticos, {acesos} LEDs acesos, {curtos} baterias em curto)', not ruins and acesos>0 and curtos<RODADAS*.6, ruins[:5])

    print('== apagar no esquema fio criado pela protoboard')
    ruins = []; feitos = 0
    for i in range(RODADAS):
        r = pg.evaluate(f"""()=>{{T_build({i*104729+7});const R=T_rng({i+1});const out=[];for(let k=0;k<3;k++){{const au=S.wires.filter(w=>w.pb);if(!au.length)break;const w=au[Math.floor(R()*au.length)],a=K(w.a.c,w.a.t),b=K(w.b.c,w.b.t);
          select(mkSel([],[w.id]));delSel();const sch=pbUF();for(const x of S.wires)sch.u(K(x.a.c,x.a.t),K(x.b.c,x.b.t));
          if(pbConn(a,b)&&sch.f(a)!==sch.f(b))out.push('voltou a ligação '+a+'-'+b);out.push(...T_inv())}}
          const n=hist.length;undo();const inv2=T_inv();return[out,inv2,n]}}""")
        feitos += 1
        if r[0] or r[1]: ruins.append((i, r[0][:3], r[1][:3]))
    ok(f'{feitos} circuitos: fio apagado não volta e a protoboard acompanha (com desfazer)', not ruins, ruins[:5])

    print('== modelos prontos: mesma simulação com e sem protoboard')
    tpls = pg.evaluate("[...document.querySelectorAll('#bTpl option')].map(o=>o.value).filter(Boolean)")
    ruins = []
    for k in tpls:
        r = pg.evaluate(f"""()=>{{loadTpl('{k}',true);delete S.pb;commit();const a=T_meas();S.pb={{on:true,bds:[{{id:'pb1',k:'full',x:0,y:0}}],w:[]}};commit();pbRender();const t0=performance.now();pbRender();const dt=performance.now()-t0;const bm=T_meas();
          const inv=T_inv(),n=document.querySelectorAll('#pbv .pbpart').length,m=S.comps.filter(c=>pbVis(c)&&onSheet(c)).length;S.pb.on=false;commit();return[T_same(a,bm),inv,n===m,dt]}}""")
        if r[0] or r[1] or not r[2] or r[3] > 120: ruins.append((k, r[0][:2], r[1][:2], r[2], round(r[3])))
    ok(f'{len(tpls)} modelos prontos iguais nas duas vistas e desenhados em menos de 120 ms', not ruins, ruins[:5])

    print('== modelos prontos simulando ao vivo na protoboard')
    pg.evaluate("()=>{}")
    ruins = []
    for k in tpls:
        pg.evaluate(f"()=>{{loadTpl('{k}',true);S.pb={{on:true,bds:[{{id:'pb1',k:'full',x:0,y:0}}],w:[]}};commit()}}")
        pg.click('#bSim'); pg.wait_for_timeout(250)
        for _ in range(6):
            pg.evaluate("()=>{const g=[...document.querySelectorAll('#pbv .pbpart.act')];if(!g.length)return;const e=g[Math.floor(Math.random()*g.length)],r=e.getBoundingClientRect();const o={bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:0,pointerId:1};e.dispatchEvent(new PointerEvent('pointerdown',o));window.dispatchEvent(new PointerEvent('pointerup',o))}")
            pg.wait_for_timeout(60)
        st = pg.evaluate("()=>[mode,!!rt&&!!rt.res]")
        pg.click('#bSim'); pg.wait_for_timeout(50)
        if st != ['sim', True]: ruins.append((k, st))
    ok(f'{len(tpls)} modelos simulando e operados pela protoboard', not ruins and not erros, (ruins[:5], erros[:3]))

    print('== exemplos de Arduino C++ rodando na protoboard')
    exs = pg.evaluate("Object.keys(CEX)")
    ruins = []
    for nm in exs:
        pg.evaluate(f"()=>{{loadTpl('ardcpp',true);S.pb={{on:true,bds:[{{id:'pb1',k:'full',x:0,y:0}}],w:[]}};S.comps.find(c=>c.type==='plc').code=CEX[{json.dumps(nm)}];commit()}}")
        pg.click('#bSim'); pg.wait_for_timeout(700)
        r = pg.evaluate("()=>{const a=S.comps.find(c=>c.type==='plc'),st=rt.mcu&&rt.mcu[a.id];return[!!st,st&&st.err?String(st.err.msg||st.err):null,(st&&st.vt)||0]}")
        pg.click('#bSim')
        if not r[0] or r[1] or r[2] <= 0: ruins.append((nm, r))
    ok(f'{len(exs)} programas de exemplo compilam e rodam', not ruins, ruins[:5])

    print('== arrastar a protoboard leva as peças junto')
    pg.evaluate("()=>{T_build(4242);pbV={x:300,y:200,s:1.2};pbApplyView();pbRender()}")
    antes = pg.evaluate("()=>[S.comps.filter(c=>c.type!=='bat').map(c=>c.pbx+','+c.pby).join(' '),S.wires.filter(w=>w.pb).map(w=>K(w.a.c,w.a.t)+K(w.b.c,w.b.t)).sort().join()]")
    o = pg.evaluate("()=>{const b=document.getElementById('pbv').getBoundingClientRect();return[b.left+pbV.x+3*pbV.s,b.top+pbV.y+95*pbV.s]}")
    pg.mouse.move(*o); pg.mouse.down(); pg.mouse.move(o[0]+60, o[1]+36, steps=6); pg.mouse.up(); pg.wait_for_timeout(100)
    depois = pg.evaluate("()=>[S.pb.bds[0].x,S.pb.bds[0].y,S.comps.filter(c=>c.type!=='bat').map(c=>(c.pbx-S.pb.bds[0].x)+','+(c.pby-S.pb.bds[0].y)).join(' '),S.wires.filter(w=>w.pb).map(w=>K(w.a.c,w.a.t)+K(w.b.c,w.b.t)).sort().join()]")
    ok('protoboard movida com as peças e as ligações', depois[0] != 0 and depois[2] == antes[0] and depois[3] == antes[1], (antes, depois[:2]))

    print('== caos: ações aleatórias na protoboard')
    random.seed(11); ruins = []
    for k in tpls[:12] + ['ardcpp']:
        pg.evaluate(f"()=>{{loadTpl('{k}',true);S.pb={{on:true,bds:[{{id:'pb1',k:'full',x:0,y:0}}],w:[]}};commit();pbFit()}}")
        for i in range(110):
            x = random.randint(250, 1150); y = random.randint(110, 860); a = random.random()
            if a < .4: pg.mouse.click(x, y)
            elif a < .65:
                pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x+random.randint(-160, 160), y+random.randint(-160, 160), steps=3); pg.mouse.up()
            elif a < .74: pg.keyboard.press(random.choice(['r', 'Escape', 'Delete', 'Control+z', 'Control+y']))
            elif a < .79: pg.click('#bSim')
            elif a < .83: pg.mouse.dblclick(x, y)
            elif a < .86: pg.evaluate("()=>{const b=[...document.querySelectorAll('#pbbar .pbsw')];b[Math.floor(Math.random()*b.length)].click()}")
            elif a < .9: pg.evaluate("()=>{if(mode==='edit'){const w=S.wires.filter(w=>w.pb);if(w.length){select(mkSel([],[w[Math.floor(Math.random()*w.length)].id]));delSel()}}}")
            elif a < .93: pg.click('#bPb')
            else: pg.mouse.wheel(0, random.choice([-200, 200]))
            if i % 25 == 24:
                if pg.evaluate("mode") == 'sim': pg.click('#bSim')
                inv = pg.evaluate("()=>T_inv()")
                if inv: ruins.append((k, i, inv[:2]))
        if pg.evaluate("mode") == 'sim': pg.click('#bSim')
        if not pg.evaluate("pbOn()"): pg.click('#bPb')
    ok(f'{13*110} ações aleatórias sem quebrar a sincronização', not ruins, ruins[:4])

    print('== arquivo .fais pela interface')
    pg.evaluate("()=>{T_build(777);}")
    ref = pg.evaluate("()=>JSON.stringify({c:S.comps.map(c=>[c.id,c.pbx,c.pby,c.pbr]),w:S.wires.map(w=>[w.id,!!w.pb]),p:S.pb.w.map(w=>w.id)})")
    pg.click('#bFile')
    with pg.expect_download() as d: pg.click('#bSave')
    fp = os.path.join(AQUI, '_sim.fais'); d.value.save_as(fp)
    pg.keyboard.press('Escape'); pg.evaluate("()=>{S={comps:[],wires:[],seq:1};commit()}")
    pg.click('#bFile'); pg.set_input_files('#fIn', fp); pg.wait_for_timeout(500); os.remove(fp); pg.keyboard.press('Escape')
    got = pg.evaluate("()=>JSON.stringify({c:S.comps.map(c=>[c.id,c.pbx,c.pby,c.pbr]),w:S.wires.map(w=>[w.id,!!w.pb]),p:S.pb.w.map(w=>w.id)})")
    ok('salvar e abrir .fais mantém a montagem igual', ref == got, (ref[:120], got[:120]))
    b.close()

    print('== celular: tocar nas peças durante a simulação')
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    pg.route('http*://**', lambda r: r.abort()); pg.add_init_script("localStorage.setItem('faisca-tour-v1','1')")
    pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.goto('file://' + os.path.abspath(HTML)); pg.wait_for_timeout(500)
    pg.evaluate("()=>{S={comps:[],wires:[],seq:1};let sx=0;const A=(t,p,x,y)=>{const c=placeComp(makeComp(t,p),sx+=200,0,0);c.pbx=x;c.pby=y;c.pbr=0;S.comps.push(c);return c};const B=A('bat',{V:9},-80,200),T=A('tact',{},110,80),Rr=A('res',{R:470},150,40),L=A('led',{},190,60);"
                "S.pb={on:true,bds:[{id:'pb1',k:'full',x:0,y:0}],w:[{id:'pw1',a:{c:B.id,t:0},b:{bd:'pb1',hx:11,hy:4}},{id:'pw2',a:{c:B.id,t:1},b:{bd:'pb1',hx:20,hy:4}}]};"
                "S.pb.w.push({id:'pw3',a:{bd:'pb1',hx:13,hy:11},b:{bd:'pb1',hx:15,hy:5}});commit();pbV={x:-20,y:20,s:1.6};pbApplyView();document.getElementById('bSim').click()}")
    pg.wait_for_timeout(300)
    t = pg.evaluate("()=>{const e=document.querySelector('#pbv .pbpart[data-id=\"'+S.comps[1].id+'\"] .pbhitbox').getBoundingClientRect();return[e.left+e.width/2,e.top+e.height/2]}")
    pg.evaluate("()=>{const c=S.comps[1];const e=document.querySelector('#pbv .pbpart[data-id=\"'+c.id+'\"] .pbhitbox'),r=e.getBoundingClientRect(),o={bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:0,pointerId:3,pointerType:'touch'};e.dispatchEvent(new PointerEvent('pointerdown',o))}")
    pg.wait_for_timeout(200)
    on = pg.evaluate("()=>ledB(S.comps[3])")
    pg.evaluate("()=>window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:3}))"); pg.wait_for_timeout(200)
    off = pg.evaluate("()=>ledB(S.comps[3])")
    ok('apertar o botão na protoboard acende o LED e soltar apaga', on > .1 and off == 0, (on, off))
    b.close()

ok('nenhum erro de JavaScript', not erros, erros[:5])
print('\nFALHAS:', len(falhas)); sys.exit(1 if falhas else 0)
