/* ================= CLP: várias CPUs (prefixo de endereço) e programa em texto estruturado (ST) ================= */
const pfxOf=c=>{const p=String(c&&c.pfx||'').trim();return/^[A-Za-z][A-Za-z0-9_]{0,9}$/.test(p)?p:''};
{const _io=plcIO;plcIO=function(c){const r=_io(c),p=pfxOf(c);if(!p)return r;const f=a=>/^(L\+|M|5V|GND)$/.test(a)?a:p+'.'+a;return{top:r.top.map(f),bot:r.bot.map(f)}}}
{const _an=anaIO;anaIO=function(c){const r=_an(c),p=pfxOf(c);if(!p)return r;return{ai:r.ai.map(a=>p+'.'+a),ao:r.ao.map(a=>p+'.'+a)}}}
/* módulo de E/S obedece à CPU com o mesmo prefixo */
function modOn(c,N){const p=pfxOf(c),cs=S.comps.filter(x=>isCPU(x)&&pfxOf(x)===p);return cs.length?cs.some(x=>N.cpu[x.id]):N.lad&&S.comps.some(isCPU)}
DEFS.plc.F.push(['pfx','Prefixo dos endereços (vazio = CLP principal; ex.: CLP2 → CLP2.I0.0)','text']);

/* ---------- interpretador de ST (IEC 61131-3, subconjunto) ---------- */
const ST_KW=new Set(['VAR','END_VAR','IF','THEN','ELSIF','ELSE','END_IF','AND','OR','XOR','NOT','MOD','TRUE','FALSE','BOOL','INT','DINT','REAL','TIME','TON','TOF','TP','CTU','CTD','R_TRIG','F_TRIG','WHILE','DO','END_WHILE','FOR','TO','BY','END_FOR','CASE','OF','END_CASE']);
const ST_FB={TON:1,TOF:1,TP:1,CTU:1,CTD:1,R_TRIG:1,F_TRIG:1};
function stLex(src){const tk=[];let i=0,ln=1;const n=src.length;
 while(i<n){const ch=src[i];if(ch==='\n'){ln++;i++;continue}if(/\s/.test(ch)){i++;continue}
  if(src.startsWith('(*',i)){const j=src.indexOf('*)',i+2);const e=j<0?n:j+2;ln+=(src.slice(i,e).match(/\n/g)||[]).length;i=e;continue}
  if(src.startsWith('//',i)){while(i<n&&src[i]!=='\n')i++;continue}
  let m;const rest=src.slice(i);
  if((m=/^(?:T|TIME)#((?:\d+(?:\.\d+)?(?:ms|h|m|s|d))+)/i.exec(rest))){let s=0;m[1].replace(/(\d+(?:\.\d+)?)(ms|h|m|s|d)/gi,(_,v,u)=>{s+=+v*{ms:.001,s:1,m:60,h:3600,d:86400}[u.toLowerCase()]});tk.push({t:'num',v:s,ln});i+=m[0].length;continue}
  if((m=/^\d+(?:\.\d+)?/.exec(rest))&&!/^\d+(?:\.\d+)?[A-Za-z_]/.test(rest)){tk.push({t:'num',v:+m[0],ln});i+=m[0].length;continue}
  if((m=/^%?[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)*/.exec(rest))){const w=m[0].replace(/^%/,''),u=w.toUpperCase();tk.push(ST_KW.has(u)?{t:'kw',v:u,ln}:{t:'id',v:w,ln});i+=m[0].length;continue}
  if((m=/^(:=|<=|>=|<>|[=<>+\-*/();,:&])/.exec(rest))){tk.push({t:'op',v:m[0],ln});i+=m[0].length;continue}
  throw{ln,msg:`símbolo inesperado "${ch}"`}}
 tk.push({t:'eof',v:'',ln});return tk}
function stCompile(src){const tk=stLex(String(src||''));let p=0;const decl={},assigned=new Set();
 const pk=()=>tk[p],nx=()=>tk[p++],err=(m,t=pk())=>{throw{ln:t.ln,msg:m}},isk=v=>pk().t==='kw'&&pk().v===v,iso=v=>pk().t==='op'&&pk().v===v;
 const ek=v=>{if(!isk(v))err(`esperava "${v}"`);p++},eo=v=>{if(!iso(v))err(`esperava "${v}"`);p++};
 /* expressões */
 const prim=()=>{const t=nx();if(t.t==='num')return()=>t.v;if(t.t==='kw'&&t.v==='TRUE')return()=>true;if(t.t==='kw'&&t.v==='FALSE')return()=>false;
  if(t.t==='op'&&t.v==='('){const e=or();eo(')');return e}if(t.t==='id'){const nm=t.v;return E=>E.get(nm)}err(t.t==='eof'?'a linha terminou antes da hora':`não esperava "${t.v}"`,t)};
 const un=()=>{if(isk('NOT')){p++;const e=un();return E=>!E.b(e(E))}if(iso('-')){p++;const e=un();return E=>-E.n(e(E))}return prim()};
 const mul=()=>{let a=un();for(;;){if(iso('*')||iso('/')||isk('MOD')){const o=nx().v,b=un(),A=a;a=o==='*'?E=>E.n(A(E))*E.n(b(E)):o==='/'?E=>{const d=E.n(b(E));return d?E.n(A(E))/d:0}:E=>{const d=E.n(b(E));return d?E.n(A(E))%d:0}}else return a}};
 const add=()=>{let a=mul();for(;;){if(iso('+')||iso('-')){const o=nx().v,b=mul(),A=a;a=o==='+'?E=>E.n(A(E))+E.n(b(E)):E=>E.n(A(E))-E.n(b(E))}else return a}};
 const cmp=()=>{const a=add();if(['=','<>','<','>','<=','>='].some(iso)){const o=nx().v,b=add();return E=>{const x=a(E),y=b(E),X=typeof x==='boolean'||typeof y==='boolean'?+E.b(x):E.n(x),Y=typeof x==='boolean'||typeof y==='boolean'?+E.b(y):E.n(y);
   return o==='='?Math.abs(X-Y)<1e-9:o==='<>'?Math.abs(X-Y)>=1e-9:o==='<'?X<Y:o==='>'?X>Y:o==='<='?X<=Y+1e-9:X>=Y-1e-9}}return a};
 const and=()=>{let a=cmp();while(isk('AND')||iso('&')){p++;const b=cmp(),A=a;a=E=>E.b(A(E))&&E.b(b(E))}return a};
 const xor=()=>{let a=and();while(isk('XOR')){p++;const b=and(),A=a;a=E=>E.b(A(E))!==E.b(b(E))}return a};
 function or(){let a=xor();while(isk('OR')){p++;const b=xor(),A=a;a=E=>E.b(A(E))||E.b(b(E))}return a}
 /* declarações */
 if(isk('VAR')){p++;while(!isk('END_VAR')){if(pk().t==='eof')err('faltou END_VAR');const names=[];do{const t=nx();if(t.t!=='id')err('esperava o nome da variável',t);names.push(t.v)}while(iso(',')&&++p);
   eo(':');const ty=nx();if(ty.t!=='kw'||!['BOOL','INT','DINT','REAL','TIME','TON','TOF','TP','CTU','CTD','R_TRIG','F_TRIG'].includes(ty.v))err('tipo desconhecido (use BOOL, INT, REAL, TIME, TON, TOF, TP, CTU, CTD, R_TRIG ou F_TRIG)',ty);
   let init=null;if(iso(':=')){p++;init=or()}eo(';');for(const n of names){if(decl[n.toUpperCase()])err(`"${n}" foi declarada duas vezes`);decl[n.toUpperCase()]={ty:ty.v,init}}}p++}
 /* comandos */
 const block=(...ends)=>{const L=[];while(!ends.some(e=>isk(e))){if(pk().t==='eof'){if(ends.includes('__EOF__'))break;err(`faltou ${ends[ends.length-1]}`)}const s=stmt();if(s)L.push(s)}return E=>{for(const s of L){if(E.brk)return;s(E)}}};
 function stmt(){const t=pk();if(iso(';')){p++;return null}
  if(isk('IF')){p++;const conds=[],bodies=[];conds.push(or());ek('THEN');bodies.push(block('ELSIF','ELSE','END_IF'));
   while(isk('ELSIF')){p++;conds.push(or());ek('THEN');bodies.push(block('ELSIF','ELSE','END_IF'))}let els=null;if(isk('ELSE')){p++;els=block('END_IF')}ek('END_IF');if(iso(';'))p++;
   return E=>{for(let i=0;i<conds.length;i++)if(E.b(conds[i](E))){bodies[i](E);return}if(els)els(E)}}
  if(isk('WHILE')){p++;const c=or();ek('DO');const b=block('END_WHILE');ek('END_WHILE');if(iso(';'))p++;return E=>{let k=0;while(E.b(c(E))){if(++k>10000){E.warn='laço WHILE parado depois de 10 000 voltas';break}b(E)}}}
  if(isk('FOR')){p++;const v=nx();if(v.t!=='id')err('esperava a variável do FOR',v);eo(':=');const a=or();ek('TO');const z=or();let st=()=>1;if(isk('BY')){p++;st=or()}ek('DO');const b=block('END_FOR');ek('END_FOR');if(iso(';'))p++;assigned.add(v.v);
   return E=>{const s=E.n(st(E))||1,end=E.n(z(E));let k=0;for(let i=E.n(a(E));s>0?i<=end:i>=end;i+=s){E.set(v.v,i);b(E);if(++k>10000)break}}}
  if(t.t==='id'){p++;const nm=t.v;
   if(iso(':=')){p++;const e=or();eo(';');assigned.add(nm);return E=>E.set(nm,e(E))}
   if(iso('(')){p++;const args={};if(!iso(')'))do{const a=nx();if(a.t!=='id'&&!(a.t==='kw'))err('esperava o nome do parâmetro (IN, PT, CU…)',a);eo(':=');args[a.v.toUpperCase()]=or()}while(iso(',')&&++p);eo(')');eo(';');
    const d=decl[nm.toUpperCase()];if(!d||!ST_FB[d.ty])err(`"${nm}" não foi declarado como temporizador ou contador (ex.: ${nm} : TON;) em VAR`,t);
    return E=>{const v={};for(const k in args)v[k]=args[k](E);E.call(nm,d.ty,v)}}
   err(`depois de "${nm}" esperava := ou (`)}
  err(`não esperava "${t.v||'fim do texto'}"`)}
 const body=block('__EOF__');if(pk().t!=='eof')err('texto sobrando no fim');
 return{run:body,decl,assigned}}

/* ambiente de execução ligado ao CLP */
const ADDR_B=/^(?:[IQM]\d+\.[0-7])$/i,ADDR_W=/^(?:[IQM]W\d+|A\d)$/i;
function stEnv(c,E){const p=pfxOf(c),st=(rt.sti=rt.sti||{})[c.id]||(rt.sti[c.id]={loc:{},fb:{}}),now=rt.simT||0,prog=stProg(c);let ch=false;
 const norm=n=>{let m=n.replace(/^%/,'');const parts=m.split('.');if(ADDR_B.test(m)||ADDR_W.test(m))m=m.toUpperCase();if(p&&(ADDR_B.test(m)||ADDR_W.test(m)))m=p+'.'+m;return m};
 const env={brk:false,warn:null,b:v=>typeof v==='boolean'?v:!!(+v),n:v=>typeof v==='boolean'?+v:(+v||0),
  get(nm){const U=nm.toUpperCase(),d=prog.decl[U];if((d&&!ST_FB[d.ty])||(!d&&U in st.loc))return st.loc[U];const dot=nm.indexOf('.');
   if(dot>0){const b=nm.slice(0,dot).toUpperCase(),f=nm.slice(dot+1).toUpperCase(),fd=prog.decl[b];if(fd&&ST_FB[fd.ty]){const s=st.fb[b]||{};return f==='Q'?!!s.q:f==='ET'?s.et||0:f==='CV'?s.cv||0:f==='QU'?!!s.q:false}}
   const k=norm(nm);if(ADDR_W.test(nm)||(rt.anum&&k in rt.anum))return+(rt.anum&&rt.anum[k])||0;if(k in E.vars)return!!E.vars[k];if(ADDR_B.test(nm))return false;
   if(/\.(CV|ET)$/i.test(nm))return numOf(nm);return!!getName(nm,E)},
  set(nm,v){const U=nm.toUpperCase(),d=prog.decl[U];if(d&&!ST_FB[d.ty]){const nv=d.ty==='BOOL'?env.b(v):d.ty==='INT'||d.ty==='DINT'?Math.trunc(env.n(v)):env.n(v);if(st.loc[U]!==nv){st.loc[U]=nv}return}
   if(!d&&typeof v==='number'&&!ADDR_B.test(nm)&&!ADDR_W.test(nm)&&!(rt.anum&&norm(nm) in rt.anum)){st.loc[U]=v;return}
   const k=norm(nm);if(ADDR_W.test(nm)||(rt.anum&&k in rt.anum&&!ADDR_B.test(nm))){rt.anum=rt.anum||{};const nv=Math.round(env.n(v));if(rt.anum[k]!==nv){rt.anum[k]=nv;ch=true}return}
   const nv=env.b(v);if(!!E.vars[k]!==nv||!(k in E.vars)){E.vars[k]=nv;rt.vars[k]=nv;ch=true}},
  call(nm,ty,a){const U=nm.toUpperCase(),s=st.fb[U]||(st.fb[U]={q:false,et:0,cv:0,prev:false,run:false,t0:0});const IN=!!a.IN,PT=+a.PT||0,o=JSON.stringify(s);
   if(ty==='TON'){if(IN){if(!s.run){s.run=true;s.t0=now}s.et=Math.min(now-s.t0,PT);s.q=s.et>=PT-1e-9}else{s.run=false;s.et=0;s.q=false}}
   else if(ty==='TOF'){if(IN){s.q=true;s.et=0;s.run=false}else if(s.q){if(!s.run){s.run=true;s.t0=now}s.et=Math.min(now-s.t0,PT);if(s.et>=PT-1e-9){s.q=false;s.run=false}}}
   else if(ty==='TP'){if(IN&&!s.prev&&!s.run){s.run=true;s.t0=now}if(s.run){s.et=Math.min(now-s.t0,PT);s.q=s.et<PT-1e-9;if(!s.q&&!IN)s.run=false}else s.et=0;s.prev=IN}
   else if(ty==='CTU'){const cu=!!a.CU;if(a.R)s.cv=0;else if(cu&&!s.prev)s.cv++;s.prev=cu;s.q=s.cv>=(+a.PV||0)}
   else if(ty==='CTD'){const cd=!!a.CD;if(a.LD)s.cv=+a.PV||0;else if(cd&&!s.prev)s.cv--;s.prev=cd;s.q=s.cv<=0}
   else if(ty==='R_TRIG'){const k=!!a.CLK;s.q=k&&!s.prev;s.prev=k}else if(ty==='F_TRIG'){const k=!!a.CLK;s.q=!k&&s.prev;s.prev=k}
   if(JSON.stringify(s)!==o&&ty!=='TON'&&ty!=='TOF'&&ty!=='TP')ch=true;if((ty==='TON'||ty==='TOF'||ty==='TP')&&JSON.parse(o).q!==s.q)ch=true}};
 /* valores iniciais das variáveis declaradas */
 if(!st.init){st.init=true;for(const U in prog.decl){const d=prog.decl[U];if(ST_FB[d.ty])continue;st.loc[U]=d.init?d.init(env):d.ty==='BOOL'?false:0}}
 return{env,changed:()=>ch}}
const STC=new Map(),stInfo=c=>STC.get(c.id)||{};
function stProg(c){if(!isCPU(c)||!String(c.prog||'').trim())return null;let o=STC.get(c.id);if(!o||o.src!==c.prog){o={src:c.prog};try{o.stc=stCompile(c.prog)}catch(e){o.ste=e&&e.msg?e:{ln:0,msg:String(e)}}STC.set(c.id,o)}return o.stc||null}
/* roda uma varredura do programa (chamado depois de cada solução da rede) */
{const d=DEFS.plc,e0=d.edge,t0=d.tick;
 d.edge=(c,X)=>{let ch=e0?e0(c,X):false;const pr=stProg(c);if(!pr||!rt.E||!rt.E.cpu[c.id])return ch;const{env,changed}=stEnv(c,rt.E);
  const inf=stInfo(c);try{pr.run(env)}catch(e){if(!inf.rterr){inf.rterr=1;logE(`${c.tag}: erro ao rodar o programa ST`,'e')}}if(env.warn&&!inf.wl){inf.wl=1;logE(`${c.tag}: ${env.warn}`,'e')}return changed()||ch};
 d.tick=(c,dt)=>{let ch=t0?t0(c,dt):false;const pr=stProg(c);if(pr&&rt.E&&rt.E.cpu[c.id]&&Object.values(pr.decl).some(x=>x.ty==='TON'||x.ty==='TOF'||x.ty==='TP'))ch=true;return ch}}
/* saídas escritas pelo ST também acionam as saídas do Arduino; módulos seguem a CPU do mesmo prefixo */
{const _ss=startSim;startSim=function(){const r=_ss.apply(this,arguments);if(!rt)return r;STC.clear();for(const c of S.comps){const pr=stProg(c);if(pr)pr.assigned.forEach(n=>{let m=n.toUpperCase();if(ADDR_B.test(m)){const p=pfxOf(c);rt.wr.add(p?p+'.'+m:m)}})}solve();refresh();return r}}

/* ---------- desenho: selo "ST" na CPU com programa ---------- */
{const d=DEFS.plc,dr=d.draw;d.draw=c=>{let s=dr(c);if(isCPU(c)&&String(c.prog||'').trim()){const b=boxOf(c);s+=`<g class="stbadge">${R(b[0]+b[2]-34,-44,26,14,(stProg(c),stInfo(c).ste)?'warnf':'',' rx="3"')}${T(b[0]+b[2]-21,-34,'ST',c.r,'tn6')}</g>`}if(pfxOf(c)){const b=boxOf(c);s+=T(b[0]+b[2]/2,-40,pfxOf(c),c.r,'tn6')}return s}}

/* ---------- diagnóstico ---------- */
{const _an=analyze;analyze=function(){const r=_an();if(!r||!r.issues)return r;const seen={};
 r.issues=r.issues.filter(i=>!/^Mais de uma CPU no esquema/.test(i.msg));for(const c of S.comps){if(c.type!=='plc')continue;if(isCPU(c)){const k=pfxOf(c);if(seen[k])r.issues.push({lvl:'aviso',msg:`${c.tag} e ${seen[k].tag} usam os mesmos endereços`,why:'Com mais de um CLP no projeto, dê um prefixo diferente a cada um (campo "Prefixo dos endereços"), por exemplo CLP2. Os endereços ficam CLP2.I0.0, CLP2.Q0.0…',ids:[c.id,seen[k].id]});else seen[k]=c}
  stProg(c);const se=stInfo(c).ste;if(se)r.issues.push({lvl:'erro',msg:`${c.tag}: erro no programa ST (linha ${se.ln})`,why:se.msg,ids:[c.id]})}
 return r}}

/* ---------- editor do programa ---------- */
const ST_EX=`(* Partida com selo, parada e temporizador *)
VAR
  T1 : TON;
END_VAR

(* I0.0 = liga (NA), I0.1 = desliga (NF) *)
Q0.0 := (I0.0 OR Q0.0) AND I0.1;

(* Q0.1 liga 3 segundos depois de Q0.0 *)
T1(IN := Q0.0, PT := T#3s);
Q0.1 := T1.Q;
`;
function stDialog(c){const ex=ST_EX;
 openModal(`${tr('Programa ST')} — ${esc(c.tag)}`,`<p class="muted small" style="margin-top:0">${tr('Texto estruturado (IEC 61131-3). Roda a cada varredura com o CLP em RUN, depois do ladder.')} ${pfxOf(c)?tr('Os endereços I/Q/M deste CLP ganham o prefixo')+' '+esc(pfxOf(c))+'.':''}</p>
  <textarea id="stP" spellcheck="false" style="width:100%;min-height:300px;font:13px/1.45 'IBM Plex Mono',monospace;border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--panel2);color:var(--ink);tab-size:2">${esc(c.prog||'')}</textarea>
  <p id="stMsg" class="small" style="min-height:1.4em;margin:6px 0 0"></p>
  <details class="small"><summary>${tr('O que dá para usar')}</summary><p class="muted">${tr('Variáveis: I0.0, Q0.0, M0.0 (liga/desliga), IW64, QW64, MW10 (números), e as declaradas em VAR (BOOL, INT, REAL, TIME). Operadores: := AND OR XOR NOT = <> < > <= >= + - * / MOD. Comandos: IF … THEN … ELSIF … ELSE … END_IF; FOR … TO … DO … END_FOR; WHILE … DO … END_WHILE. Blocos: TON, TOF, TP (IN, PT → Q, ET), CTU (CU, R, PV → Q, CV), CTD (CD, LD, PV → Q, CV), R_TRIG e F_TRIG (CLK → Q). Tempo: T#500ms, T#3s, T#1m30s. Comentários: (* … *) ou //.')}</p></details>`,
  `<button data-ex="1">${tr('Inserir exemplo')}</button><button data-chk="1">${tr('Verificar')}</button><button data-mx="1">${tr('Cancelar')}</button><button class="pri" data-ok="1">${tr('Salvar')}</button>`,e=>{
   const ta=document.getElementById('stP'),msg=document.getElementById('stMsg');const chk=()=>{try{stCompile(ta.value);msg.textContent=tr('Programa sem erros.');msg.style.color='var(--ok)';return true}catch(er){msg.textContent=`${tr('Linha')} ${er.ln||'?'}: ${er.msg||er}`;msg.style.color='var(--err)';return false}};
   if(e.target.closest('[data-ex]')){if(!ta.value.trim()||confirm(tr('Trocar o programa atual pelo exemplo?')))ta.value=ex;chk()}
   else if(e.target.closest('[data-chk]'))chk();
   else if(e.target.closest('[data-ok]')){chk();pushHist();c.prog=ta.value;closeModal();commit()}});
 const ta=document.getElementById('stP');if(ta)ta.addEventListener('keydown',ev=>{if(ev.key==='Tab'){ev.preventDefault();const s=ta.selectionStart;ta.setRangeText('  ',s,ta.selectionEnd,'end')}})}
{const _rp=renderProps;renderProps=function(){_rp();if(mode!=='edit'||!sel||!sel.c||sel.c.size!==1)return;const c=byId([...sel.c][0]);if(!c||!isCPU(c))return;const el=$('#props');if(!el)return;
 const d=document.createElement('div');d.className='row';d.innerHTML=`<button type="button" id="bST">${tr('Programa em texto (ST)…')}</button>`;el.appendChild(d);d.querySelector('#bST').onclick=()=>stDialog(c)}}

/* ---------- modelo pronto ---------- */
{const mk=window.mkTpl;
 mk('clpst',(a,w,j,tx)=>{tx('T1',120,40,'CLP PROGRAMADO EM TEXTO ESTRUTURADO (ST)');tx('N1',120,70,'Selecione o CLP1 e clique em "Programa em texto (ST)…" para ver e mudar o programa.');
  tx('N2',120,95,'S1 (I0.0) liga H1 (Q0.0) com selo; S0 (I0.1, NF) desliga. H2 (Q0.1) acende 3 s depois.');
  a('CPU','plc',500,400,{m:'cpu',tag:'CLP1',prog:ST_EX});
  a('PL','src',300,280,{v:'+'});w('CPU',0,'PL',0,'v',320);a('MM','src',360,260,{v:'-'});w('CPU',1,'MM',0,'v',300);
  a('S1','btn',560,260,{tag:'S1'});w('CPU',2,'S1',1,'v',300);a('P1','src',560,180,{v:'+'});w('P1',0,'S1',0);
  a('S0','btn',660,260,{tag:'S0',nc:true});w('CPU',3,'S0',1,'v',320);a('P0','src',660,180,{v:'+'});w('P0',0,'S0',0);
  a('H1','lamp',420,520,{tag:'H1',col:'verde',Vn:24,P:2});w('CPU',10,'H1',0);a('G1','src',420,600,{v:'-',r:180});w('H1',1,'G1',0);
  a('H2','lamp',520,540,{tag:'H2',col:'amarela',Vn:24,P:2});w('CPU',11,'H2',0,'v',480);a('G2','src',520,620,{v:'-',r:180});w('H2',1,'G2',0)});
 const s=document.getElementById('bTpl');if(s&&s.querySelector){const o=s.querySelector('option[value="clpa"]')||s.lastElementChild;const op=document.createElement('option');op.value='clpst';op.textContent='CLP programado em texto (ST)';o.after(op)}}

Object.assign(I18N_EXACT,{'Prefixo dos endereços (vazio = CLP principal; ex.: CLP2 → CLP2.I0.0)':'Address prefix (empty = main PLC; e.g. CLP2 → CLP2.I0.0)','Programa ST':'ST program','Programa em texto (ST)…':'Structured text (ST) program…',
 'Texto estruturado (IEC 61131-3). Roda a cada varredura com o CLP em RUN, depois do ladder.':'Structured text (IEC 61131-3). Runs every scan while the PLC is in RUN, after the ladder.','Os endereços I/Q/M deste CLP ganham o prefixo':'This PLC’s I/Q/M addresses get the prefix',
 'O que dá para usar':'What you can use','Inserir exemplo':'Insert example','Verificar':'Check','Programa sem erros.':'No errors in the program.','Linha':'Line','Trocar o programa atual pelo exemplo?':'Replace the current program with the example?',
 'CLP programado em texto (ST)':'PLC programmed in structured text (ST)','CLP PROGRAMADO EM TEXTO ESTRUTURADO (ST)':'PLC PROGRAMMED IN STRUCTURED TEXT (ST)',
 'Selecione o CLP1 e clique em "Programa em texto (ST)…" para ver e mudar o programa.':'Select CLP1 and click "Structured text (ST) program…" to see and change the program.',
 'S1 (I0.0) liga H1 (Q0.0) com selo; S0 (I0.1, NF) desliga. H2 (Q0.1) acende 3 s depois.':'S1 (I0.0) starts H1 (Q0.0) with hold-in; S0 (I0.1, NC) stops it. H2 (Q0.1) lights 3 s later.'});
I18N_PHR.push([': erro no programa ST (linha ',': error in the ST program (line '],[' usam os mesmos endereços',' use the same addresses'],[': erro ao rodar o programa ST',': error while running the ST program']);
I18N_RE=null;I18N_CACHE.clear();renderPalette();renderAll();
