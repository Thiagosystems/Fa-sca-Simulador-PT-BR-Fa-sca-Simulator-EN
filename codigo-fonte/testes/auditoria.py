from playwright.sync_api import sync_playwright
import random,sys,json
import os
F='file://'+os.path.abspath(sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','index.html'))
random.seed(7)
problems=[]
def note(tag,msg):
    problems.append((tag,msg));print('  !!',tag,msg[:300])

def page(b,lang='pt',vp=(1600,1000)):
    ctx=b.new_context(viewport={'width':vp[0],'height':vp[1]},accept_downloads=True)
    pg=ctx.new_page();pg.route('http*://**',lambda r:r.abort())
    pg.on('pageerror',lambda e:note('pageerror',str(e)))
    pg.on('console',lambda m:note('console.'+m.type,m.text) if m.type=='error' and 'net::' not in m.text and 'Failed to load resource' not in m.text else None)
    cfg='{"lang":"en"}' if lang=='en' else '{}'
    pg.add_init_script(f"localStorage.setItem('faisca-tour-v1','1');localStorage.setItem('faisca-cfg',{json.dumps(cfg)})")
    pg.goto(F);pg.wait_for_timeout(600);return pg

with sync_playwright() as p:
    b=p.chromium.launch()
    # 1) modelos prontos, simulando e clicando em tudo que é acionável, nos dois idiomas
    for lang in ['pt','en']:
        print('== modelos prontos',lang)
        pg=page(b,lang)
        tpls=pg.evaluate("[...document.querySelectorAll('#bTpl option')].map(o=>o.value).filter(Boolean)")
        for t in tpls:
            pg.select_option('#bTpl',t);pg.wait_for_timeout(150)
            for sh in pg.evaluate("S.sheets.map(s=>s.id)"):
                pg.evaluate(f"S.cur={sh};renderAll()");pg.wait_for_timeout(50)
            pg.evaluate("S.cur=S.sheets[0].id;renderAll()")
            pg.click('#bSim');pg.wait_for_timeout(250)
            r=pg.evaluate("""(()=>{let n=0;for(const c of S.comps){if(!actOf(c))continue;try{simPress(c.id);n++}catch(e){return 'ERRO simPress '+c.type+': '+e.message}try{release()}catch(e){return 'ERRO release '+c.type+': '+e.message}}return n})()""")
            if isinstance(r,str):note('modelo '+t,r)
            pg.wait_for_timeout(1200)
            for k in ['agora','prob','ev']:pg.click(f'.tabs [data-tab="{k}"]')
            pg.click('#bSim');pg.wait_for_timeout(100)
            print(' ',t,'ok, acionáveis:',r)
        pg.context.close()

    # 2) paleta inteira junta, simulando, desenhando todas as folhas
    print('== paleta inteira simulando')
    pg=page(b)
    r=pg.evaluate("""(()=>{S={comps:[],wires:[],seq:1};ensureDoc();let n=0;for(const[,it]of PAL)for(const x of it){const c=placeComp(makeComp(x[1],x[2]||{}),(n%14)*160,Math.floor(n/14)*180,0);S.comps.push(c);n++}commit();return n})()""")
    pg.click('#bSim');pg.wait_for_timeout(500)
    r2=pg.evaluate("""(()=>{let n=0;for(const c of S.comps){if(!actOf(c))continue;try{simPress(c.id);release();n++}catch(e){return 'ERRO '+c.type+': '+e.message}}return n})()""")
    pg.wait_for_timeout(1500);pg.click('#bSim');print('  itens:',r,'acionados:',r2)
    # cada tipo isolado ligado a uma fonte: propriedades e painel
    r3=pg.evaluate("""(()=>{const bad=[];for(const[,it]of PAL)for(const x of it){try{S={comps:[],wires:[],seq:1};ensureDoc();const c=placeComp(makeComp(x[1],x[2]||{}),200,200,0);S.comps.push(c);commit();select(mkSel([c.id]));renderProps();for(const r of [90,180,270]){c.r=r;renderAll()}c.sc=0.5;renderAll()}catch(e){bad.push(x[0]+': '+e.message)}}return bad})()""")
    if r3:note('paleta isolada',json.dumps(r3,ensure_ascii=False))
    pg.context.close()

    # 3) menus, janelas e painéis
    print('== menus e janelas')
    pg=page(b);pg.select_option('#bTpl','direta');pg.wait_for_timeout(300)
    def tryclick(sel,label):
        try:
            if pg.is_visible(sel):pg.click(sel,timeout=2000);pg.wait_for_timeout(150)
        except Exception as e:note('clique '+label,str(e)[:150])
    for m,items in [('#bFile',['#bNew','#bProj','#bTour']),('#bDoc',['#dWn','#dXr','#dFr','#dStamp','#dBom','#dColor','#dBornes','#dFit'])]:
        for it in items:
            tryclick(m,m);tryclick(it,it);pg.wait_for_timeout(150)
            for s in ['#modal .x','#dpX']:tryclick(s,'fechar')
            pg.keyboard.press('Escape');pg.wait_for_timeout(100)
            if it=='#bNew':pg.select_option('#bTpl','direta');pg.wait_for_timeout(200)
    tryclick('#bCfg','config');pg.keyboard.press('Escape')
    for s in ['#bTrain','#bTrain','#bDiag','#bDiag','#bSnd','#bSnd','#bSel','#bSel','#bZi','#bZo','#bFit','#bUndo','#bRedo']:tryclick(s,s)
    # osciloscópio e gráfico
    pg.evaluate("select(mkSel([S.comps.find(c=>c.type==='lamp'||c.type==='coil').id]))");pg.click('#bSim');pg.wait_for_timeout(300)
    pg.evaluate("(()=>{const b=[...document.querySelectorAll('#props button')].find(x=>/gráfico/i.test(x.textContent));if(b)b.click()})()");pg.wait_for_timeout(1500)
    pg.evaluate("[...document.querySelectorAll('#scope .stabs button')].forEach(b=>b.click())");pg.wait_for_timeout(300);pg.click('#bSim')
    # treino aluno com multímetro
    pg.evaluate("(()=>{S.train={on:true,mode:'aluno',pin:'',tries:0,found:[]};renderAll()})()");pg.wait_for_timeout(200)
    for f,name in [('#bPdf','pdf'),('#bSave','fais')]:
        try:
            pg.click('#bFile')
            with pg.expect_download(timeout=8000) as d: pg.click(f)
            d.value.save_as('/tmp/claude-0/-home-claude/286422ca-a665-538c-9db9-8bb5ab7002d5/scratchpad/audit.'+name)
        except Exception as e:note('download '+name,str(e)[:200])
        pg.keyboard.press('Escape')
    pg.context.close()

    # 4) uso aleatório: cliques, arrastos, atalhos, colocar peças, ligar fios, desfazer/refazer
    print('== 600 ações aleatórias')
    pg=page(b);pg.select_option('#bTpl','yd24');pg.wait_for_timeout(300)
    box=pg.locator('#cv').bounding_box()
    pal=pg.locator('.pitem');npal=pal.count()
    for i in range(600):
        a=random.random();x=box['x']+random.random()*box['width'];y=box['y']+random.random()*box['height']
        try:
            if a<.25:pg.mouse.click(x,y)
            elif a<.40:
                pg.mouse.move(x,y);pg.mouse.down();pg.mouse.move(x+random.uniform(-200,200),y+random.uniform(-200,200),steps=4);pg.mouse.up()
            elif a<.48:pg.mouse.click(x,y,button='right')
            elif a<.58:
                k=random.choice(['r','Delete','Control+z','Control+y','Control+a','Control+c','Control+v','Control+d','Escape','Control+x','Control+Shift+f'])
                pg.keyboard.press(k)
            elif a<.66:
                j=random.randrange(npal);it=pal.nth(j)
                if it.is_visible():it.click(timeout=1000);pg.mouse.click(x,y)
            elif a<.72:
                if pg.is_visible('#hL .rh'):
                    h=pg.locator('#hL .rh').first.bounding_box();pg.mouse.move(h['x']+3,h['y']+3);pg.mouse.down();pg.mouse.move(h['x']+random.uniform(-150,150),h['y']+random.uniform(-150,150),steps=5);pg.mouse.up()
            elif a<.78:
                t=pg.locator('#cL .term')
                n=t.count()
                if n>2:
                    t1=t.nth(random.randrange(n));t2=t.nth(random.randrange(n))
                    if t1.is_visible() and t2.is_visible():t1.click(timeout=800,force=True);t2.click(timeout=800,force=True)
            elif a<.84:
                pg.click('#bSim' if pg.is_visible('#bSim') else '#paneTabs .psim',timeout=1000);pg.wait_for_timeout(200)
            elif a<.88:pg.mouse.wheel(0,random.choice([-300,300]))
            elif a<.92:
                pg.evaluate("(()=>{const ins=[...document.querySelectorAll('#props input[data-p],#props select[data-p]')];if(!ins.length)return;const el=ins[Math.floor(Math.random()*ins.length)];if(el.tagName==='SELECT'){el.selectedIndex=Math.floor(Math.random()*el.options.length)}else if(el.type==='checkbox'){el.checked=!el.checked}else{el.value=['10','4k7','0','-5','abc','1e9',''][Math.floor(Math.random()*7)]}el.dispatchEvent(new Event('change',{bubbles:true}))})()")
            else:
                pg.keyboard.press('Escape')
        except Exception as e:
            pass
        if i%100==99:
            st=pg.evaluate("[S.comps.length,S.wires.length,mode]");print('  ação',i+1,'componentes/fios/modo:',st)
    # o estado salvo continua válido?
    ok=pg.evaluate("(()=>{try{cleanState(JSON.parse(JSON.stringify(S)));return 'válido'}catch(e){return 'INVÁLIDO: '+e.message}})()");print('  estado depois do caos:',ok)
    if ok!='válido':note('estado',ok)
    pg.context.close()

    # 5) celular
    print('== celular 390x844')
    pg=page(b,vp=(390,844));pg.select_option('#bTpl','yd24');pg.wait_for_timeout(300);pg.click('#bSim');pg.wait_for_timeout(300)
    pg.evaluate("simPress(S.comps.find(c=>c.tag==='S1').id);release()");pg.wait_for_timeout(500);pg.click('#bSim')
    w=pg.evaluate("document.documentElement.scrollWidth");print('  largura da página:',w)
    if w>392:note('celular','rolagem horizontal: '+str(w))
    pg.context.close()
    b.close()
print('\nTOTAL DE PROBLEMAS:',len(problems))
for t,m in problems[:60]:print('-',t,'|',m[:400])
sys.exit(1 if problems else 0)
