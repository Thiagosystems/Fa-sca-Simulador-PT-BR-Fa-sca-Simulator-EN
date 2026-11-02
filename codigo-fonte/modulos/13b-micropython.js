/* ================= MicroPython (ESP32 e Raspberry Pi Pico) =================
   Intérprete pequeno de Python 3 com os módulos do MicroPython que fazem sentido no simulador:
   machine (Pin, ADC, PWM, I2C, Timer), time/utime, network (Wi-Fi simulado), neopixel, ssd1306,
   i2c_lcd, random, math, sys. Roda passo a passo (geradores), como o C++, para sleep() funcionar. */
const PYKW=new Set(['False','None','True','and','as','assert','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield']);
const PYOPS=['**=','//=','>>=','<<=','**','//','==','!=','<=','>=','+=','-=','*=','/=','%=','&=','|=','^=','->','<<','>>',':=','+','-','*','/','%','<','>','=','(',')','[',']','{','}',',',':','.',';','@','&','|','^','~'];
function pyLex(src){src=String(src).replace(/\r\n?/g,'\n').replace(/\t/g,'    ');const T=[],ind=[0];let i=0,ln=1,depth=0,bol=true;
 const E=m=>{throw{ln,msg:m}},push=(t,v,x)=>T.push(Object.assign({t,v,ln},x||{}));
 while(i<src.length){
  if(bol&&depth===0){let n=0;while(src[i]===' '){n++;i++}
   if(i>=src.length)break;if(src[i]==='\n'||src[i]==='#'){while(i<src.length&&src[i]!=='\n')i++;if(src[i]==='\n'){i++;ln++}continue}
   if(n>ind[ind.length-1]){ind.push(n);push('ind')}else{while(n<ind[ind.length-1]){ind.pop();push('ded')}if(n!==ind[ind.length-1])E('indentação não bate com as linhas de cima')}bol=false}
  const ch=src[i];
  if(ch==='\n'){i++;if(depth===0){push('nl');bol=true}ln++;continue}
  if(ch===' '){i++;continue}if(ch==='#'){while(i<src.length&&src[i]!=='\n')i++;continue}
  if(ch==='\\'&&src[i+1]==='\n'){i+=2;ln++;continue}
  const rest=src.slice(i);let m;
  if((m=/^(0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(\d[\d_]*\.?[\d_]*|\.\d[\d_]*)([eE][+-]?\d+)?)/.exec(rest))&&m[0]){const s=m[0].replace(/_/g,'');push('num',/^0[oO]/.test(s)?parseInt(s.slice(2),8):Number(s),{fl:/[.eE]/.test(s)&&!/^0[xX]/.test(s)});i+=m[0].length;if(/^[jJ]/.test(src[i]||''))E('números complexos não são suportados');continue}
  if((m=/^([rRbBfFuU]{0,2})('''|"""|'|")/.exec(rest))){const pre=m[1].toLowerCase(),q=m[2];let j=i+m[0].length,out='';const raw=pre.includes('r');
   for(;;){if(j>=src.length)E('texto (string) sem fechar as aspas');if(src.startsWith(q,j)){j+=q.length;break}const c2=src[j];if(c2==='\n'){if(q.length===1)E('texto (string) sem fechar as aspas');ln++}
    if(c2==='\\'&&!raw){const e=src[j+1];const map={n:'\n',t:'\t',r:'\r','0':'\0','\\':'\\',"'":"'",'"':'"',a:'\x07',b:'\b'};if(e==='\n'){j+=2;ln++;continue}if(e==='x'){out+=String.fromCharCode(parseInt(src.substr(j+2,2),16));j+=4;continue}if(e==='u'){out+=String.fromCharCode(parseInt(src.substr(j+2,4),16));j+=6;continue}if(e in map){out+=map[e];j+=2;continue}out+='\\';j++;continue}
    out+=c2;j++}
   push('str',out,{f:pre.includes('f'),b:pre.includes('b')});i=j;continue}
  if((m=/^[A-Za-z_\u00C0-\u024F][\w\u00C0-\u024F]*/.exec(rest))){push(PYKW.has(m[0])?'kw':'id',m[0]);i+=m[0].length;continue}
  const op=PYOPS.find(o=>rest.startsWith(o));if(!op)E(`caractere inesperado "${ch}"`);
  if('([{'.includes(op))depth++;else if(')]}'.includes(op))depth=Math.max(0,depth-1);push('op',op);i+=op.length}
 if(T.length&&T[T.length-1].t!=='nl')push('nl');while(ind.length>1){ind.pop();push('ded')}push('eof');return T}
function pyParser(T){let p=0;
 const pk=(o=0)=>T[Math.min(p+o,T.length-1)],nx=()=>T[p++],is=(t,v)=>{const k=pk();return k.t===t&&(v==null||k.v===v)},isOp=v=>is('op',v),isKw=v=>is('kw',v);
 const E=m=>{throw{ln:pk().ln,msg:m}},eat=(t,v)=>{if(!is(t,v)){const k=pk();E(`esperava "${v||({nl:'fim da linha',id:'um nome',ind:'um bloco recuado'}[t]||t)}" mas veio "${k.t==='nl'?'fim da linha':k.t==='eof'?'fim do código':k.v??k.t}"`)}return nx()};
 const block=()=>{if(is('nl')){nx();if(!is('ind'))E('faltou recuar (indentar) o bloco depois de ":"');nx();const b=[];while(!is('ded')&&!is('eof'))b.push(...stmt());if(is('ded'))nx();return b}return simple()};
 const params=end=>{const ps=[];while(!isOp(end)){if(isOp('*')){nx();if(isOp(',')){nx();continue}ps.push({n:eat('id').v,star:1})}else if(isOp('**')){nx();ps.push({n:eat('id').v,kw:1})}else{const n=eat('id').v;if(isOp(':')&&end===')'){nx();expr()}let d=null;if(isOp('=')){nx();d=expr()}ps.push({n,d})}if(!isOp(end))eat('op',',')}return ps};
 const dotted=()=>{let n=eat('id').v;while(isOp('.')){nx();n+='.'+eat('id').v}return n};
 function stmt(){const t=pk(),ln=t.ln;
  if(isOp('@')){nx();expr();eat('nl');return stmt()}
  if(t.t==='kw')switch(t.v){
   case'if':{nx();const c=expr();eat('op',':');const a=block();let b=null;if(isKw('elif')){T[p]={...T[p],v:'if'};b=stmt()}else if(isKw('else')){nx();eat('op',':');b=block()}return[{k:'if',c,a,b,ln}]}
   case'while':{nx();const c=expr();eat('op',':');const b=block();let e=null;if(isKw('else')){nx();eat('op',':');e=block()}return[{k:'while',c,b,e,ln}]}
   case'for':{nx();const tg=targets();eat('kw','in');const it=exprList();eat('op',':');const b=block();let e=null;if(isKw('else')){nx();eat('op',':');e=block()}return[{k:'for',tg,it,b,e,ln}]}
   case'def':{nx();const n=eat('id').v;eat('op','(');const ps=params(')');eat('op',')');if(isOp('->')){nx();expr()}eat('op',':');return[{k:'def',n,ps,b:block(),ln}]}
   case'class':{nx();const n=eat('id').v;let base=null;if(isOp('(')){nx();if(!isOp(')'))base=expr();while(isOp(',')){nx();if(!isOp(')'))expr()}eat('op',')')}eat('op',':');return[{k:'class',n,base,b:block(),ln}]}
   case'try':{nx();eat('op',':');const b=block(),hs=[];let els=null,fin=null;while(isKw('except')){nx();let ty=null,as=null;if(!isOp(':')){ty=expr();if(isKw('as')){nx();as=eat('id').v}else if(isOp(',')){nx();as=eat('id').v}}eat('op',':');hs.push({ty,as,b:block()})}
    if(isKw('else')){nx();eat('op',':');els=block()}if(isKw('finally')){nx();eat('op',':');fin=block()}return[{k:'try',b,hs,els,fin,ln}]}
   case'with':{nx();const e=expr();let as=null;if(isKw('as')){nx();as=eat('id').v}eat('op',':');return[{k:'with',e,as,b:block(),ln}]}}
  return simple()}
 function simple(){const out=[];for(;;){out.push(small());if(isOp(';')){nx();if(is('nl')||is('eof'))break;continue}break}if(!is('eof')&&!is('ded'))eat('nl');return out}
 function small(){const t=pk(),ln=t.ln;
  if(t.t==='kw')switch(t.v){
   case'pass':nx();return{k:'pass',ln};case'break':nx();return{k:'brk',ln};case'continue':nx();return{k:'cont',ln};
   case'return':nx();return{k:'ret',e:is('nl')||isOp(';')||is('eof')?null:exprList(),ln};
   case'import':{nx();const ms=[];do{const n=dotted();let as=null;if(isKw('as')){nx();as=eat('id').v}ms.push({n,as})}while(isOp(',')&&nx());return{k:'imp',ms,ln}}
   case'from':{nx();const m=dotted();eat('kw','import');const ns=[];if(isOp('*')){nx();ns.push({n:'*'})}else{const par=isOp('(');if(par)nx();do{if(par&&isOp(')'))break;const n=eat('id').v;let as=null;if(isKw('as')){nx();as=eat('id').v}ns.push({n,as})}while(isOp(',')&&nx());if(par)eat('op',')')}return{k:'from',m,ns,ln}}
   case'global':case'nonlocal':{nx();const ns=[eat('id').v];while(isOp(',')){nx();ns.push(eat('id').v)}return{k:'glob',ns,ln}}
   case'del':{nx();return{k:'del',e:exprList(),ln}}
   case'raise':{nx();const e=is('nl')||is('eof')?null:expr();if(isKw('from')){nx();expr()}return{k:'raise',e,ln}}
   case'assert':{nx();const e=expr();let m=null;if(isOp(',')){nx();m=expr()}return{k:'assert',e,m,ln}}
   case'yield':E('yield (geradores) ainda não é suportado no simulador')}
  const e=exprList();
  if(isOp('=')){const tg=[e];let v;for(;;){nx();v=exprList();if(isOp('=')){tg.push(v);continue}break}return{k:'asg',tg,v,ln}}
  if(pk().t==='op'&&/^(\+|-|\*|\/|%|&|\||\^|@|\/\/|\*\*|<<|>>)=$/.test(pk().v)){const o=nx().v.slice(0,-1);return{k:'aug',t:e,o,v:exprList(),ln}}
  if(isOp(':')){nx();expr();if(isOp('=')){nx();return{k:'asg',tg:[e],v:exprList(),ln}}return{k:'pass',ln}}
  return{k:'ex',e,ln}}
 const endList=()=>{const k=pk();return k.t==='nl'||k.t==='eof'||(k.t==='op'&&([')',']','}',':',';','='].includes(k.v)||/^[^=!<>]+=$/.test(k.v)))||(k.t==='kw'&&k.v==='in')};
 function exprList(){const a=starOr(expr);if(!isOp(','))return a;const it=[a];while(isOp(',')){nx();if(endList())break;it.push(starOr(expr))}return{k:'tup',it}}
 function targets(){const a=starOr(bor);if(!isOp(','))return a;const it=[a];while(isOp(',')){nx();if(isKw('in'))break;it.push(starOr(bor))}return{k:'tup',it}}
 const starOr=f=>{if(isOp('*')){nx();return{k:'star',e:f()}}return f()};
 function expr(){if(isKw('lambda')){nx();const ps=params(':');eat('op',':');return{k:'lam',ps,b:expr(),ln:pk().ln}}const a=orx();if(isKw('if')){nx();const c=orx();eat('kw','else');return{k:'ter',c,a,b:expr()}}return a}
 function orx(){let a=andx();while(isKw('or')){nx();a={k:'or',a,b:andx()}}return a}
 function andx(){let a=notx();while(isKw('and')){nx();a={k:'and',a,b:notx()}}return a}
 function notx(){if(isKw('not')){nx();return{k:'not',a:notx()}}return cmp()}
 function cmp(){const a=bor(),ops=[],rs=[];for(;;){let o=null;const k=pk();if(k.t==='op'&&['<','>','==','!=','<=','>='].includes(k.v)){nx();o=k.v}else if(isKw('in')){nx();o='in'}else if(isKw('not')&&pk(1).t==='kw'&&pk(1).v==='in'){p+=2;o='not in'}else if(isKw('is')){nx();if(isKw('not')){nx();o='is not'}else o='is'}if(!o)break;ops.push(o);rs.push(bor())}return ops.length?{k:'cmp',a,ops,rs}:a}
 const lvl=(ops,nxt)=>()=>{let a=nxt();while(pk().t==='op'&&ops.includes(pk().v)){const o=nx().v;a={k:'bin',o,a,b:nxt(),ln:pk().ln}}return a};
 function unary(){if(pk().t==='op'&&['-','+','~'].includes(pk().v)){const o=nx().v;return{k:'un',o,a:unary()}}return power()}
 function power(){const a=post();if(isOp('**')){nx();return{k:'bin',o:'**',a,b:unary()}}return a}
 const term=lvl(['*','/','//','%','@'],unary),arith=lvl(['+','-'],term),shift=lvl(['<<','>>'],arith),band=lvl(['&'],shift),bxor=lvl(['^'],band);function bor(){return lvl(['|'],bxor)()}
 function post(){let e=atom();for(;;){if(isOp('(')){const ln=pk().ln;nx();const a=[],kw=[];while(!isOp(')')){if(isOp('*')){nx();a.push({k:'star',e:expr()})}else if(isOp('**')){nx();kw.push({n:null,e:expr()})}else if(pk().t==='id'&&pk(1).t==='op'&&pk(1).v==='='){const n=nx().v;nx();kw.push({n,e:expr()})}else{const x=expr();a.push(isKw('for')?comp(x,'list'):x)}if(!isOp(')'))eat('op',',')}nx();e={k:'call',f:e,a,kw,ln}}
   else if(isOp('.')){nx();e={k:'attr',o:e,n:eat('id').v}}else if(isOp('[')){nx();const s=subscr();eat('op',']');e={k:'idx',o:e,i:s}}else break}return e}
 function subscr(){let a=null,b=null,c=null;if(!isOp(':'))a=expr();if(!isOp(':')){if(isOp(',')){const it=[a];while(isOp(',')){nx();if(isOp(']'))break;it.push(expr())}return{k:'tup',it}}return a}nx();if(!isOp(']')&&!isOp(':'))b=expr();if(isOp(':')){nx();if(!isOp(']'))c=expr()}return{k:'slice',a,b,c}}
 function comp(e,kind,v){const cl=[];while(isKw('for')){nx();const tg=targets();eat('kw','in');const it=orx();const ifs=[];while(isKw('if')){nx();ifs.push(orx())}cl.push({tg,it,ifs})}return{k:'comp',kind,e,v,cl}}
 function fstr(s,ln){const parts=[];let i=0,lit='';while(i<s.length){const ch=s[i];if(ch==='{'&&s[i+1]==='{'){lit+='{';i+=2;continue}if(ch==='}'&&s[i+1]==='}'){lit+='}';i+=2;continue}
   if(ch==='{'){if(lit){parts.push(lit);lit=''}let d=0,j=i+1,src='',spec=null,conv=null;for(;j<s.length;j++){const c2=s[j];if('([{'.includes(c2))d++;else if(')]}'.includes(c2)){if(c2==='}'&&d===0)break;d--}else if(d===0&&c2==='!'&&s[j+1]!=='='){conv=s[j+1];j++;continue}else if(d===0&&c2===':'){spec='';j++;while(j<s.length&&s[j]!=='}'){spec+=s[j];j++}break}if(conv==null)src+=c2}
    if(j>=s.length)throw{ln,msg:'f-string sem fechar a chave }'};const P=pyParser(pyLex(src.replace(/=\s*$/,'')));parts.push({e:P.expr(),spec,conv,dbg:/=\s*$/.test(src)?src:null});i=j+1;continue}
   lit+=ch;i++}if(lit)parts.push(lit);return{k:'fstr',parts}}
 function atom(){const t=nx();
  if(t.t==='num')return{k:'n',v:t.v,fl:t.fl};
  if(t.t==='str'){let parts=[t.f?fstr(t.v,t.ln):t.v],bt=t.b;while(is('str')){const u=nx();parts.push(u.f?fstr(u.v,u.ln):u.v)}if(parts.every(x=>typeof x==='string'))return{k:'s',v:parts.join(''),b:bt};return{k:'fstr',parts:parts.flatMap(x=>typeof x==='string'?[x]:x.parts)}}
  if(t.t==='id')return{k:'v',n:t.v,ln:t.ln};
  if(t.t==='kw'){if(t.v==='True')return{k:'n',v:true};if(t.v==='False')return{k:'n',v:false};if(t.v==='None')return{k:'n',v:null}}
  if(t.t==='op'&&t.v==='('){if(isOp(')')){nx();return{k:'tup',it:[]}}const a=starOr(expr);if(isKw('for')){const g=comp(a,'list');eat('op',')');return g}if(isOp(',')){const it=[a];while(isOp(',')){nx();if(isOp(')'))break;it.push(starOr(expr))}eat('op',')');return{k:'tup',it}}eat('op',')');return a}
  if(t.t==='op'&&t.v==='['){if(isOp(']')){nx();return{k:'list',it:[]}}const a=starOr(expr);if(isKw('for')){const g=comp(a,'list');eat('op',']');return g}const it=[a];while(isOp(',')){nx();if(isOp(']'))break;it.push(starOr(expr))}eat('op',']');return{k:'list',it}}
  if(t.t==='op'&&t.v==='{'){if(isOp('}')){nx();return{k:'dict',ks:[],vs:[]}}const a=expr();if(isOp(':')){nx();const v=expr();if(isKw('for')){const g=comp(a,'dict',v);eat('op','}');return g}const ks=[a],vs=[v];while(isOp(',')){nx();if(isOp('}'))break;ks.push(expr());eat('op',':');vs.push(expr())}eat('op','}');return{k:'dict',ks,vs}}
   if(isKw('for')){const g=comp(a,'set');eat('op','}');return g}const it=[a];while(isOp(',')){nx();if(isOp('}'))break;it.push(expr())}eat('op','}');return{k:'set',it}}
  p--;E(`não entendi "${t.t==='nl'?'fim da linha':t.t==='eof'?'fim do código':t.t==='ind'?'recuo':t.v??t.t}" aqui`)}
 function program(){const b=[];while(!is('eof')){if(is('nl')){nx();continue}if(is('ind'))E('recuo (indentação) inesperado');b.push(...stmt())}return b}
 return{program,expr}}
function pyParse(src){return pyParser(pyLex(src)).program()}

/* ---------- valores ---------- */
class PyDict{constructor(){this.m=new Map()}static k(k){return Array.isArray(k)?'\u0001'+JSON.stringify(k):typeof k==='number'&&Number.isInteger(k)?k:typeof k==='boolean'?+k:k}
 get(k){const e=this.m.get(PyDict.k(k));return e}set(k,v){this.m.set(PyDict.k(k),[k,v])}has(k){return this.m.has(PyDict.k(k))}del(k){return this.m.delete(PyDict.k(k))}keys(){return[...this.m.values()].map(e=>e[0])}vals(){return[...this.m.values()].map(e=>e[1])}items(){return[...this.m.values()].map(e=>{const t=[e[0],e[1]];t.__t=1;return t})}get size(){return this.m.size}}
class PySet{constructor(a){this.d=new PyDict();for(const x of a||[])this.d.set(x,1)}add(x){this.d.set(x,1)}has(x){return this.d.has(x)}del(x){this.d.del(x)}list(){return this.d.keys()}get size(){return this.d.size}}
class PyFloat{constructor(v){this.v=v}valueOf(){return this.v}}
const pyTup=a=>{a.__t=1;return a};
const pyNum=v=>v instanceof PyFloat?v.v:v;
function pyRepr(v,top){if(v instanceof PyFloat){const x=v.v;return Number.isInteger(x)&&Math.abs(x)<1e16?x.toFixed(1):pyRepr(x)}if(v===null||v===undefined)return'None';if(v===true)return'True';if(v===false)return'False';
 if(typeof v==='number'){if(Number.isNaN(v))return'nan';if(!isFinite(v))return v>0?'inf':'-inf';return String(v)}
 if(typeof v==='string')return top?v:"'"+v.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n')+"'";
 if(Array.isArray(v)){if(v.__b)return"b'"+v.map(x=>x>=32&&x<127?String.fromCharCode(x):'\\x'+x.toString(16).padStart(2,'0')).join('')+"'";const s=v.map(x=>pyRepr(x)).join(', ');return v.__t?'('+s+(v.length===1?',':'')+')':'['+s+']'}
 if(v instanceof PyDict)return'{'+v.items().map(([k,x])=>pyRepr(k)+': '+pyRepr(x)).join(', ')+'}';
 if(v instanceof PySet)return v.size?'{'+v.list().map(x=>pyRepr(x)).join(', ')+'}':'set()';
 if(v.__range)return`range(${v.__range[0]}, ${v.__range[1]}${v.__range[2]!==1?', '+v.__range[2]:''})`;
 if(v.__exco)return top?v.msg:v.__exco+'('+pyRepr(v.msg)+')';if(v.__exc)return`<class '${v.__exc}'>`;
 if(v.__inst){const s=v.__inst.d.__str__||v.__inst.d.__repr__;return v.__strv!=null?v.__strv:`<${v.__inst.n} object>`}
 if(v.__pycls)return`<class '${v.n}'>`;if(v.__pyfn)return`<function ${v.n}>`;if(v.__repr)return v.__repr();if(typeof v==='function')return'<function>';return'<object>'}
const pyStr=v=>pyRepr(v,true);
function pyFmtNum(v,spec){const pf=v instanceof PyFloat;v=pyNum(v);const m=/^(?:(.)?([<>^=]))?([+\- ])?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/.exec(spec||'');if(!m)return String(v);
 let[,fill,al,sign,,zero,w,grp,prec,ty]=m;fill=fill||(zero?'0':' ');al=al||(zero?'=':typeof v==='string'?'<':'>');let s,neg=false;
 if(typeof v==='string'){s=prec!=null?v.slice(0,+prec):v}
 else{if(typeof v==='boolean')v=+v;neg=v<0||Object.is(v,-0);const a=Math.abs(v);
  switch(ty){case'd':case'n':s=String(Math.trunc(a));break;case'x':s=Math.trunc(a).toString(16);break;case'X':s=Math.trunc(a).toString(16).toUpperCase();break;case'b':s=Math.trunc(a).toString(2);break;case'o':s=Math.trunc(a).toString(8);break;case'c':s=String.fromCharCode(a);break;
   case'e':case'E':{s=a.toExponential(prec!=null?+prec:6).replace(/e([+-])(\d)$/,'e$10$2');if(ty==='E')s=s.toUpperCase();break}
   case'f':case'F':s=a.toFixed(prec!=null?+prec:6);break;case'%':s=(a*100).toFixed(prec!=null?+prec:6)+'%';break;
   case'g':case'G':s=String(+a.toPrecision(prec!=null?+prec||1:6));break;
   default:s=prec!=null?a.toFixed(+prec):pf&&Number.isInteger(a)?a.toFixed(1):String(a)}
  if(grp){const[ip,fp]=s.split('.');s=ip.replace(/\B(?=(\d{3})+(?!\d))/g,grp)+(fp!=null?'.'+fp:'')}}
 const sg=neg?'-':sign==='+'?'+':sign===' '?' ':'';const W=+w||0;let body=s;
 if(al==='='){const pad=Math.max(0,W-sg.length-body.length);return sg+fill.repeat(pad)+body}
 body=sg+body;const pad=Math.max(0,W-body.length);if(al==='<')return body+fill.repeat(pad);if(al==='^')return fill.repeat(Math.floor(pad/2))+body+fill.repeat(Math.ceil(pad/2));return fill.repeat(pad)+body}
function pyPercent(fmt,args){const a=Array.isArray(args)&&args.__t?args:[args];let i=0;return fmt.replace(/%([-+ 0#]*)(\d+|\*)?(?:\.(\d+))?([diouxXeEfFgGcrs%])/g,(m0,fl,w,pr,ty)=>{if(ty==='%')return'%';const v=a[i++];
 if(ty==='s')return pyFmtNum(pyStr(v),(fl.includes('-')?'<':'>')+(w||''));if(ty==='r')return pyRepr(v);const t=ty==='i'||ty==='u'?'d':ty;return pyFmtNum(v,(fl.includes('-')?'<':fl.includes('0')?'=':'>')+(fl.includes('+')?'+':'')+(fl.includes('0')&&!fl.includes('-')?'0':'')+(w||'')+(pr!=null?'.'+pr:'')+t)})}

/* ---------- execução ---------- */
function pyRun(prog,api){const{c,M,S0}=api;const BUD=1500;let ops=0,curLn=0;
 class PyErr{constructor(type,msg,obj){this.type=type;this.pmsg=String(msg);this.obj=obj;this.ln=curLn;this.msg=`Linha ${curLn}: ${type}: ${msg}`}}
 const err=(t,m)=>{throw new PyErr(t,m)};
 const BRK={},CONT={};class RET{constructor(v){this.v=v}}class STOP{}
 const vt=()=>S0.vt,wait=s=>({wait:Math.max(0,s)});
 const isGen=f=>f&&f.constructor&&f.constructor.name==='GeneratorFunction';
 const B=(f,n)=>{f.__b=1;if(n)f.__n=n;return f};
 const truthy=v=>{v=pyNum(v);if(v==null||v===false||v===0||v==='')return false;if(Array.isArray(v))return v.length>0;if(v instanceof PyDict||v instanceof PySet)return v.size>0;if(v.__range){const[a,b,s]=v.__range;return s>0?a<b:a>b}return true};
 const eq=(a,b)=>{a=pyNum(a);b=pyNum(b);if(a===b)return true;if(typeof a==='number'&&typeof b==='boolean')return a===+b;if(typeof b==='number'&&typeof a==='boolean')return+a===b;if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((x,i)=>eq(x,b[i]));
  if(a instanceof PyDict&&b instanceof PyDict)return a.size===b.size&&a.items().every(([k,v])=>b.has(k)&&eq(b.get(k)[1],v));if(a&&b&&a.__exc&&b.__exc)return a.__exc===b.__exc;return false};
 const cmpv=(a,b)=>{a=pyNum(a);b=pyNum(b);if(typeof a==='boolean')a=+a;if(typeof b==='boolean')b=+b;if(Array.isArray(a)&&Array.isArray(b)){for(let i=0;i<Math.min(a.length,b.length);i++){if(eq(a[i],b[i]))continue;return cmpv(a[i],b[i])}return a.length-b.length}
  if((typeof a==='number'&&typeof b==='number')||(typeof a==='string'&&typeof b==='string'))return a<b?-1:a>b?1:0;err('TypeError',`não dá para comparar ${tname(a)} com ${tname(b)}`)};
 const tname=v=>{v=v instanceof PyFloat?1.5:v;return v==null?'NoneType':typeof v==='boolean'?'bool':typeof v==='number'?(Number.isInteger(v)?'int':'float'):typeof v==='string'?'str':Array.isArray(v)?(v.__t?'tuple':v.__b?'bytes':'list'):v instanceof PyDict?'dict':v instanceof PySet?'set':v.__range?'range':v.__inst?v.__inst.n:v.__pyfn||typeof v==='function'?'function':v.__pycls?'type':'object'};
 function* iterOf(v){v=pyNum(v);if(Array.isArray(v)){for(let i=0;i<v.length;i++)yield v[i];return}if(typeof v==='string'){for(const ch of v)yield ch;return}
  if(v&&v.__range){const[a,b,s]=v.__range;if(s>0)for(let i=a;i<b;i+=s)yield i;else for(let i=a;i>b;i+=s)yield i;return}
  if(v instanceof PyDict){for(const k of v.keys())yield k;return}if(v instanceof PySet){for(const k of v.list())yield k;return}
  if(v&&v.__iter){yield* v.__iter();return}err('TypeError',`${tname(v)} não é iterável (não dá para usar em for)`)}
 const toArr=v=>[...iterOf(v)];
 const len=v=>{v=pyNum(v);if(typeof v==='string'||Array.isArray(v))return v.length;if(v instanceof PyDict||v instanceof PySet)return v.size;if(v&&v.__range){const[a,b,s]=v.__range;return Math.max(0,Math.ceil((b-a)/s))}if(v&&v.__len)return v.__len();err('TypeError',`${tname(v)} não tem len()`)};
 const num=(v,what)=>{v=pyNum(v);if(typeof v==='boolean')return+v;if(typeof v!=='number')err('TypeError',`esperava um número${what?' em '+what:''}, mas veio ${tname(v)}`);return v};
 const isF=v=>v instanceof PyFloat||(typeof v==='number'&&!Number.isInteger(v));
 const fl=v=>Number.isInteger(v)?new PyFloat(v):v;
 const arith=(o,a,b)=>{const A=pyNum(a),Bv=pyNum(b);
  if(o==='+'){if(typeof A==='string'&&typeof Bv==='string')return A+Bv;if(Array.isArray(A)&&Array.isArray(Bv)){const r=A.concat(Bv);if(A.__t)r.__t=1;if(A.__b)r.__b=1;return r}}
  if(o==='*'){if(typeof A==='string'&&typeof Bv==='number')return A.repeat(Math.max(0,Bv));if(typeof Bv==='string'&&typeof A==='number')return Bv.repeat(Math.max(0,A));if(Array.isArray(A)&&typeof Bv==='number'){let r=[];for(let i=0;i<Bv;i++)r=r.concat(A);if(A.__t)r.__t=1;return r}if(Array.isArray(Bv)&&typeof A==='number')return arith('*',b,a)}
  if(o==='%'&&typeof A==='string')return pyPercent(A,b);
  if(o==='|'&&A instanceof PyDict&&Bv instanceof PyDict){const r=new PyDict();for(const[k,v]of A.items())r.set(k,v);for(const[k,v]of Bv.items())r.set(k,v);return r}
  const x=num(A,'conta'),y=num(Bv,'conta'),F=isF(a)||isF(b);
  switch(o){case'+':return F?fl(x+y):x+y;case'-':return F?fl(x-y):x-y;case'*':return F?fl(x*y):x*y;
   case'/':if(y===0)err('ZeroDivisionError','divisão por zero');return fl(x/y);
   case'//':if(y===0)err('ZeroDivisionError','divisão por zero');return F?fl(Math.floor(x/y)):Math.floor(x/y);
   case'%':if(y===0)err('ZeroDivisionError','resto de divisão por zero');{const r=x-Math.floor(x/y)*y;return F?fl(r):r}
   case'**':{const r=Math.pow(x,y);return F||y<0?fl(r):r}
   case'<<':return x*Math.pow(2,y);case'>>':return Math.floor(x/Math.pow(2,y));
   case'&':return Number(BigInt(Math.trunc(x))&BigInt(Math.trunc(y)));case'|':return Number(BigInt(Math.trunc(x))|BigInt(Math.trunc(y)));case'^':return Number(BigInt(Math.trunc(x))^BigInt(Math.trunc(y)))}
  err('TypeError',`operação ${o} não suportada`)};
 const contains=(c2,x)=>{c2=pyNum(c2);if(typeof c2==='string')return c2.includes(pyStr(x));if(Array.isArray(c2))return c2.some(y=>eq(y,x));if(c2 instanceof PyDict)return c2.has(x);if(c2 instanceof PySet)return c2.has(x);if(c2&&c2.__range){const[a,b,s]=c2.__range;const v=pyNum(x);return Number.isInteger(v)&&(s>0?v>=a&&v<b:v<=a&&v>b)&&(v-a)%s===0}return toArr(c2).some(y=>eq(y,x))};

 /* escopos */
 class Sc{constructor(par,fn){this.v=Object.create(null);this.par=par;this.gl=fn?new Set():null}}
 const GL=new Sc(null,false);GL.v.__name__='__main__';
 const look=(n,sc)=>{for(let s=sc;s;s=s.par)if(n in s.v)return s.v[n];if(n in BI)return BI[n];err('NameError',`o nome "${n}" não foi definido`)};
 const setv=(n,v,sc)=>{if(sc.gl&&sc.gl.has(n))GL.v[n]=v;else sc.v[n]=v};

 /* exceções */
 const EXC={};for(const n of['BaseException','Exception','ValueError','TypeError','KeyError','IndexError','ZeroDivisionError','NameError','AttributeError','RuntimeError','OSError','ImportError','StopIteration','KeyboardInterrupt','AssertionError','NotImplementedError','OverflowError','MemoryError','LookupError','ArithmeticError'])EXC[n]={__exc:n};
 const SUB={ZeroDivisionError:'ArithmeticError',OverflowError:'ArithmeticError',KeyError:'LookupError',IndexError:'LookupError'};
 const excMatch=(ty,name)=>{if(!ty)return true;if(Array.isArray(ty))return ty.some(t=>excMatch(t,name));const n=ty.__exc||(ty.__pycls?ty.n:null);if(!n)return false;if(n==='BaseException')return true;if(n==='Exception')return name!=='KeyboardInterrupt';for(let x=name;x;x=SUB[x])if(x===n)return true;return false};

 /* chamada de funções */
 function* call(f,a,kw){kw=kw||{};
  if(f&&f.__bm){return yield* call(f.__bm,[f.self,...a],kw)}
  if(f&&f.__pyfn){const sc=new Sc(f.clo,true),ps=f.ps;let i=0;for(const p of ps){if(p.star){const r=a.slice(i);r.__t=1;sc.v[p.n]=r;i=a.length;continue}if(p.kw){const d=new PyDict();for(const k in kw)if(!ps.some(q=>q.n===k))d.set(k,kw[k]);sc.v[p.n]=d;continue}
    if(i<a.length)sc.v[p.n]=a[i++];else if(p.n in kw)sc.v[p.n]=kw[p.n];else if(p.dv!==undefined)sc.v[p.n]=p.dv;else err('TypeError',`${f.n}() precisa do argumento "${p.n}"`)}
   if(i<a.length)err('TypeError',`${f.n}() recebeu argumentos demais`);
   if(f.lam)return yield* ev(f.b,sc);
   try{yield* runB(f.b,sc)}catch(x){if(x instanceof RET)return x.v;throw x}return null}
  if(f&&f.__pycls){const o={__inst:f,d:Object.create(null)};const init=findAttr(f,'__init__');if(init)yield* call(init,[o,...a],kw);else if(f.__nat)Object.assign(o,f.__nat(...a));return o}
  if(f&&f.__pin!=null&&f.value)return f.value(a,kw);
  if(f&&f.__exc){return{__exco:f.__exc,msg:a.length?pyStr(a[0]):'',args:pyTup(a)}}
  if(typeof f==='function'){const r=f.__b?f(a,kw):f(...a);if(isGen(f)||(r&&typeof r.next==='function'&&r[Symbol.iterator]&&!Array.isArray(r)))return yield* r;return r===undefined?null:r}
  if(f&&f.__inst){const m=findAttr(f.__inst,'__call__');if(m)return yield* call(m,[f,...a],kw)}
  err('TypeError',`${tname(f)} não pode ser chamado como função`)}
 function* strG(v){if(v&&v.__inst){const m=findAttr(v.__inst,'__str__')||findAttr(v.__inst,'__repr__');if(m)return pyStr(yield* call(m,[v]))}return pyStr(v)}
 const findAttr=(cls,n)=>{for(let k=cls;k;k=k.base)if(n in k.d)return k.d[n];return undefined};

 /* atributos */
 const strM=(s,n)=>{const S=s;const F={upper:()=>S.toUpperCase(),lower:()=>S.toLowerCase(),strip:(ch)=>ch==null?S.trim():S.replace(new RegExp(`^[${esc2(ch)}]+|[${esc2(ch)}]+$`,'g'),''),lstrip:(ch)=>ch==null?S.replace(/^\s+/,''):S.replace(new RegExp(`^[${esc2(ch)}]+`),''),rstrip:(ch)=>ch==null?S.replace(/\s+$/,''):S.replace(new RegExp(`[${esc2(ch)}]+$`),''),
  split:(sep,mx)=>{let r;if(sep==null){r=S.trim().split(/\s+/).filter(x=>x!=='')}else r=S.split(sep);if(mx!=null&&mx>=0&&r.length>mx+1){const h=r.slice(0,mx);h.push(r.slice(mx).join(sep==null?' ':sep));r=h}return r},rsplit:(sep,mx)=>F.split(sep,mx),splitlines:()=>S.split(/\r?\n/),
  join:it=>toArr(it).map(x=>{if(typeof x!=='string')err('TypeError','join() só junta textos (str)');return x}).join(S),replace:(a,b,cnt)=>{if(cnt==null||cnt<0)return S.split(a).join(b);let r=S;for(let i=0;i<cnt;i++)r=r.replace(a,b);return r},
  startswith:(p,st=0)=>Array.isArray(p)?p.some(q=>S.startsWith(q,st)):S.startsWith(p,st),endswith:p=>Array.isArray(p)?p.some(q=>S.endsWith(q)):S.endsWith(p),find:(x,st=0)=>S.indexOf(x,st),rfind:x=>S.lastIndexOf(x),index:x=>{const i=S.indexOf(x);if(i<0)err('ValueError','substring não encontrada');return i},count:x=>x===''?S.length+1:S.split(x).length-1,
  isdigit:()=>/^\d+$/.test(S),isalpha:()=>/^[A-Za-zÀ-ÿ]+$/.test(S),isalnum:()=>/^[A-Za-z0-9À-ÿ]+$/.test(S),isspace:()=>/^\s+$/.test(S),isupper:()=>/[A-Z]/.test(S)&&S===S.toUpperCase(),islower:()=>/[a-z]/.test(S)&&S===S.toLowerCase(),
  center:(w,f=' ')=>pyFmtNum(S,f+'^'+w),ljust:(w,f=' ')=>pyFmtNum(S,f+'<'+w),rjust:(w,f=' ')=>pyFmtNum(S,f+'>'+w),zfill:w=>S.startsWith('-')?'-'+S.slice(1).padStart(w-1,'0'):S.padStart(w,'0'),
  capitalize:()=>S.charAt(0).toUpperCase()+S.slice(1).toLowerCase(),title:()=>S.replace(/\b\w/g,x=>x.toUpperCase()),swapcase:()=>[...S].map(x=>x===x.toUpperCase()?x.toLowerCase():x.toUpperCase()).join(''),
  encode:()=>{const r=[...S].map(x=>x.charCodeAt(0)&255);r.__b=1;return r},format:B((a,kw)=>strFormat(S,a,kw))};if(n in F)return F[n].__b?F[n]:B((a)=>{const r=F[n](...a);return r});return undefined};
 const esc2=s=>String(s).replace(/[\\\]^-]/g,'\\$&');
 const strFormat=(S,a,kw)=>{let auto=0;return S.replace(/\{\{|\}\}|\{([^{}:!]*)(?:!([rs]))?(?::([^{}]*))?\}/g,(m0,f,cv,spec)=>{if(m0==='{{')return'{';if(m0==='}}')return'}';let v;const path=(f||'').split('.');const h=path[0];
   if(h==='')v=a[auto++];else if(/^\d+$/.test(h))v=a[+h];else v=kw[h];for(const at of path.slice(1))v=getattr(v,at);if(cv==='r')return pyRepr(v);return spec?pyFmtNum(typeof v==='string'?v:v,spec):pyStr(v)})};
 const listM=(L,n)=>{const F={append:x=>{L.push(x)},extend:it=>{L.push(...toArr(it))},insert:(i,x)=>{i=i<0?Math.max(0,L.length+i):Math.min(i,L.length);L.splice(i,0,x)},pop:(i)=>{if(!L.length)err('IndexError','pop de lista vazia');if(i==null)return L.pop();i=i<0?L.length+i:i;if(i<0||i>=L.length)err('IndexError','índice fora da lista');return L.splice(i,1)[0]},
  remove:x=>{const i=L.findIndex(y=>eq(y,x));if(i<0)err('ValueError','o valor não está na lista');L.splice(i,1)},index:x=>{const i=L.findIndex(y=>eq(y,x));if(i<0)err('ValueError','o valor não está na lista');return i},count:x=>L.filter(y=>eq(y,x)).length,
  reverse:()=>{L.reverse()},clear:()=>{L.length=0},copy:()=>L.slice()};
  if(n==='sort')return B(function*(a,kw){const key=kw.key,rev=truthy(kw.reverse);const ks=[];for(const x of L)ks.push(key&&key!==null?yield* call(key,[x]):x);const idx=L.map((_,i)=>i).sort((i,j)=>cmpv(ks[i],ks[j])||i-j);if(rev)idx.reverse();const cp=idx.map(i=>L[i]);L.length=0;L.push(...cp)});
  if(L.__t&&!['index','count'].includes(n))return undefined;if(n in F)return B(a=>F[n](...a));return undefined};
 const dictM=(D,n)=>{const F={get:(k,d=null)=>D.has(k)?D.get(k)[1]:d,keys:()=>D.keys(),values:()=>D.vals(),items:()=>D.items(),pop:(k,d)=>{if(D.has(k)){const v=D.get(k)[1];D.del(k);return v}if(d!==undefined)return d;err('KeyError',pyRepr(k))},
  setdefault:(k,d=null)=>{if(!D.has(k))D.set(k,d);return D.get(k)[1]},update:o=>{if(o instanceof PyDict)for(const[k,v]of o.items())D.set(k,v);else for(const p of toArr(o)){const q=toArr(p);D.set(q[0],q[1])}},clear:()=>{D.m.clear()},copy:()=>{const r=new PyDict();for(const[k,v]of D.items())r.set(k,v);return r},popitem:()=>{const it=D.items();if(!it.length)err('KeyError','dicionário vazio');const l=it[it.length-1];D.del(l[0]);return l}};
  if(n in F)return B(a=>F[n](...a));return undefined};
 const setM=(St,n)=>{const F={add:x=>{St.add(x)},remove:x=>{if(!St.has(x))err('KeyError',pyRepr(x));St.del(x)},discard:x=>{St.del(x)},clear:()=>{St.d.m.clear()},pop:()=>{const l=St.list();if(!l.length)err('KeyError','conjunto vazio');St.del(l[0]);return l[0]},
  union:o=>new PySet([...St.list(),...toArr(o)]),intersection:o=>{const b=toArr(o);return new PySet(St.list().filter(x=>b.some(y=>eq(x,y))))},difference:o=>{const b=toArr(o);return new PySet(St.list().filter(x=>!b.some(y=>eq(x,y))))}};if(n in F)return B(a=>F[n](...a));return undefined};
 function getattr(o,n,dflt){const raw=o;o=o instanceof PyFloat?o.v:o;let v;
  if(o&&o.__inst){if(n in o.d)return o.d[n];if(n==='__class__')return o.__inst;const m=findAttr(o.__inst,n);if(m!==undefined)return m&&m.__pyfn&&!m.__static?{__bm:m,self:o}:m;if(n in o&&typeof o[n]!=='undefined'&&n!=='d')return o[n]}
  else if(o&&o.__pycls){const m=findAttr(o,n);if(m!==undefined)return m;if(n==='__name__')return o.n}
  else if(typeof o==='string')v=strM(o,n);else if(Array.isArray(o))v=listM(o,n);else if(o instanceof PyDict)v=dictM(o,n);else if(o instanceof PySet)v=setM(o,n);
  else if(typeof o==='number'){if(n==='to_bytes')return B(([L,ord])=>{const r=[];for(let i=0;i<L;i++)r.push((o>>(8*i))&255);if(ord!=='little')r.reverse();r.__b=1;return r});if(n==='real')return o;if(n==='imag')return 0}
  else if(o&&o.__exco){if(n==='args')return o.args;if(n==='value')return o.args&&o.args[0]}
  else if(o!=null&&(typeof o==='object'||typeof o==='function')&&n in o)return o[n];
  if(v!==undefined)return v;if(dflt!==undefined)return dflt;err('AttributeError',`${tname(raw)} não tem o atributo "${n}"`)}
 const setattr=(o,n,v)=>{if(o&&o.__inst){o.d[n]=v;return}if(o&&o.__pycls){o.d[n]=v;return}if(o&&typeof o==='object'&&!Array.isArray(o)){if(o.__set&&o.__set(n,v))return;o[n]=v;return}err('AttributeError',`não dá para mudar "${n}" em ${tname(o)}`)};
 const normIdx=(L,i)=>{i=num(i,'índice');if(!Number.isInteger(i))err('TypeError','o índice precisa ser inteiro');const j=i<0?L+i:i;if(j<0||j>=L)err('IndexError','índice fora do tamanho');return j};
 const sliceIdx=(L,s)=>{const st=s.c==null?1:num(s.c);if(st===0)err('ValueError','passo zero no fatiamento');const cl=(v,d)=>{if(v==null)return d;v=num(v);if(v<0)v+=L;return st>0?Math.max(0,Math.min(L,v)):Math.max(-1,Math.min(L-1,v))};const a=cl(s.a,st>0?0:L-1),b=cl(s.b,st>0?L:-1);const r=[];if(st>0)for(let i=a;i<b;i+=st)r.push(i);else for(let i=a;i>b;i+=st)r.push(i);return r};
 function* getidx(o,i){o=pyNum(o);
  if(i&&i.__slice){const L=len(o),ix=sliceIdx(L,i);if(typeof o==='string')return ix.map(k=>o[k]).join('');const r=ix.map(k=>o[k]);if(o.__t)r.__t=1;if(o.__b)r.__b=1;return r}
  if(typeof o==='string')return o[normIdx(o.length,i)];if(Array.isArray(o))return o[normIdx(o.length,i)];
  if(o instanceof PyDict){if(!o.has(i))err('KeyError',pyRepr(i));return o.get(i)[1]}
  if(o&&o.__range){const[a,b,s]=o.__range;return a+normIdx(len(o),i)*s}
  if(o&&o.__gi)return o.__gi(i);if(o&&o.__inst){const m=findAttr(o.__inst,'__getitem__');if(m)return yield* call(m,[o,i])}err('TypeError',`${tname(o)} não aceita [ ]`)}
 function* setidx(o,i,v){if(Array.isArray(o)){if(o.__t)err('TypeError','tupla não pode ser alterada');if(i&&i.__slice){const ix=sliceIdx(o.length,i),nv=toArr(v);if((i.c==null||num(i.c)===1)){o.splice(ix.length?ix[0]:Math.max(0,Math.min(o.length,i.a==null?0:num(i.a)<0?o.length+num(i.a):num(i.a))),ix.length,...nv);return}ix.forEach((k,j)=>o[k]=nv[j]);return}o[normIdx(o.length,i)]=v;return}
  if(o instanceof PyDict){o.set(i,v);return}if(o&&o.__si){o.__si(i,v);return}if(o&&o.__inst){const m=findAttr(o.__inst,'__setitem__');if(m){yield* call(m,[o,i,v]);return}}err('TypeError',`${tname(o)} não aceita atribuição com [ ]`)}

 /* avaliação */
 const tick=function*(){if(++ops>=BUD){ops=0;yield{budget:1}}if(IRQS.length||TIMERS.length)yield* service()};
 function* ev(e,sc){switch(e.k){
  case'n':return e.fl&&Number.isInteger(e.v)?new PyFloat(e.v):e.v;case's':if(e.b){const r=[...e.v].map(x=>x.charCodeAt(0)&255);r.__b=1;return r}return e.v;
  case'v':return look(e.n,sc);
  case'fstr':{let s='';for(const p of e.parts){if(typeof p==='string'){s+=p;continue}const v=yield* ev(p.e,sc);const t=p.conv==='r'?pyRepr(v):p.spec!=null&&p.spec!==''?pyFmtNum(v,p.spec):yield* strG(v);s+=(p.dbg||'')+t}return s}
  case'tup':{const r=[];for(const x of e.it){if(x.k==='star')r.push(...toArr(yield* ev(x.e,sc)));else r.push(yield* ev(x,sc))}r.__t=1;return r}
  case'list':{const r=[];for(const x of e.it){if(x.k==='star')r.push(...toArr(yield* ev(x.e,sc)));else r.push(yield* ev(x,sc))}return r}
  case'set':{const r=new PySet();for(const x of e.it)r.add(yield* ev(x,sc));return r}
  case'dict':{const d=new PyDict();for(let i=0;i<e.ks.length;i++)d.set(yield* ev(e.ks[i],sc),yield* ev(e.vs[i],sc));return d}
  case'comp':{const out=e.kind==='dict'?new PyDict():e.kind==='set'?new PySet():[];const inner=new Sc(sc,false);
   const rec=function*(k){if(k===e.cl.length){if(e.kind==='dict')out.set(yield* ev(e.e,inner),yield* ev(e.v,inner));else if(e.kind==='set')out.add(yield* ev(e.e,inner));else out.push(yield* ev(e.e,inner));return}const cl=e.cl[k];
    for(const x of iterOf(yield* ev(cl.it,k?inner:sc))){yield* tick();yield* assign(cl.tg,x,inner,true);let ok=true;for(const f of cl.ifs)if(!truthy(yield* ev(f,inner))){ok=false;break}if(ok)yield* rec(k+1)}};yield* rec(0);return out}
  case'attr':return getattr(yield* ev(e.o,sc),e.n);
  case'idx':{const o=yield* ev(e.o,sc);const i=e.i.k==='slice'?{__slice:1,a:e.i.a?yield* ev(e.i.a,sc):null,b:e.i.b?yield* ev(e.i.b,sc):null,c:e.i.c?yield* ev(e.i.c,sc):null}:yield* ev(e.i,sc);return yield* getidx(o,i)}
  case'call':{curLn=e.ln||curLn;const f=yield* ev(e.f,sc);const a=[],kw={};for(const x of e.a){if(x.k==='star')a.push(...toArr(yield* ev(x.e,sc)));else a.push(yield* ev(x,sc))}
   for(const k of e.kw){const v=yield* ev(k.e,sc);if(k.n==null){if(v instanceof PyDict)for(const[kk,vv]of v.items())kw[kk]=vv}else kw[k.n]=v}const r=yield* call(f,a,kw);curLn=e.ln||curLn;return r}
  case'un':{const v=yield* ev(e.a,sc);if(e.o==='-'){const n=num(v);return isF(v)?fl(-n):-n}if(e.o==='+')return v;return~num(v)}
  case'not':return!truthy(yield* ev(e.a,sc));
  case'and':{const a=yield* ev(e.a,sc);return truthy(a)?yield* ev(e.b,sc):a}
  case'or':{const a=yield* ev(e.a,sc);return truthy(a)?a:yield* ev(e.b,sc)}
  case'ter':return truthy(yield* ev(e.c,sc))?yield* ev(e.a,sc):yield* ev(e.b,sc);
  case'bin':{const a=yield* ev(e.a,sc),b=yield* ev(e.b,sc);if(a&&a.__inst){const m=findAttr(a.__inst,{'+':'__add__','-':'__sub__','*':'__mul__'}[e.o]);if(m)return yield* call(m,[a,b])}return arith(e.o,a,b)}
  case'cmp':{let a=yield* ev(e.a,sc);for(let i=0;i<e.ops.length;i++){const b=yield* ev(e.rs[i],sc),o=e.ops[i];let r;
    switch(o){case'==':r=eq(a,b);break;case'!=':r=!eq(a,b);break;case'<':r=cmpv(a,b)<0;break;case'>':r=cmpv(a,b)>0;break;case'<=':r=cmpv(a,b)<=0;break;case'>=':r=cmpv(a,b)>=0;break;
     case'in':r=contains(b,a);break;case'not in':r=!contains(b,a);break;case'is':r=a===b||(a==null&&b==null);break;case'is not':r=!(a===b||(a==null&&b==null))}if(!r)return false;a=b}return true}
  case'lam':{const ps=[];for(const p of e.ps)ps.push({...p,dv:p.d?yield* ev(p.d,sc):undefined});return{__pyfn:1,n:'<lambda>',ps,b:e.b,clo:sc,lam:1}}
  case'star':err('SyntaxError','* fora do lugar')}
  err('SyntaxError','expressão não suportada')}
 function* assign(t,v,sc){switch(t.k){
  case'v':setv(t.n,v,sc);return;
  case'tup':case'list':{const a=toArr(v),si=t.it.findIndex(x=>x.k==='star');if(si<0){if(a.length!==t.it.length)err('ValueError',`esperava ${t.it.length} valores para desempacotar, veio ${a.length}`);for(let i=0;i<a.length;i++)yield* assign(t.it[i],a[i],sc);return}
   const nA=t.it.length-1;if(a.length<nA)err('ValueError','valores de menos para desempacotar');for(let i=0;i<si;i++)yield* assign(t.it[i],a[i],sc);yield* assign(t.it[si].e,a.slice(si,a.length-(nA-si)),sc);for(let i=si+1;i<t.it.length;i++)yield* assign(t.it[i],a[a.length-(t.it.length-i)],sc);return}
  case'attr':setattr(yield* ev(t.o,sc),t.n,v);return;
  case'idx':{const o=yield* ev(t.o,sc);const i=t.i.k==='slice'?{__slice:1,a:t.i.a?yield* ev(t.i.a,sc):null,b:t.i.b?yield* ev(t.i.b,sc):null,c:t.i.c?yield* ev(t.i.c,sc):null}:yield* ev(t.i,sc);yield* setidx(o,i,v);return}}
  err('SyntaxError','não dá para atribuir valor a isso')}
 function* runB(b,sc){for(const s of b)yield* run(s,sc)}
 function* run(s,sc){curLn=s.ln||curLn;yield* tick();switch(s.k){
  case'ex':yield* ev(s.e,sc);return;case'pass':return;
  case'asg':{const v=yield* ev(s.v,sc);for(const t of s.tg)yield* assign(t,v,sc);return}
  case'aug':{const old=yield* ev(s.t,sc),v=yield* ev(s.v,sc);if(s.o==='+'&&Array.isArray(old)&&!old.__t){old.push(...toArr(v));return}yield* assign(s.t,arith(s.o,old,v),sc);return}
  case'if':if(truthy(yield* ev(s.c,sc)))yield* runB(s.a,sc);else if(s.b)yield* runB(s.b,sc);return;
  case'while':{let broke=false;while(truthy(yield* ev(s.c,sc))){try{yield* runB(s.b,sc)}catch(x){if(x===BRK){broke=true;break}if(x===CONT)continue;throw x}yield* tick()}if(!broke&&s.e)yield* runB(s.e,sc);return}
  case'for':{const it=yield* ev(s.it,sc);let broke=false;const L=Array.isArray(it)?it.slice():null;for(const x of L||iterOf(it)){yield* assign(s.tg,x,sc);try{yield* runB(s.b,sc)}catch(y){if(y===BRK){broke=true;break}if(y===CONT)continue;throw y}}if(!broke&&s.e)yield* runB(s.e,sc);return}
  case'brk':throw BRK;case'cont':throw CONT;case'ret':throw new RET(s.e?yield* ev(s.e,sc):null);
  case'def':{const ps=[];for(const p of s.ps)ps.push({...p,dv:p.d?yield* ev(p.d,sc):undefined});setv(s.n,{__pyfn:1,n:s.n,ps,b:s.b,clo:sc},sc);return}
  case'class':{const base=s.base?yield* ev(s.base,sc):null;const cs=new Sc(sc,false);yield* runB(s.b,cs);const cls={__pycls:1,n:s.n,base:base&&base.__pycls?base:null,d:cs.v};for(const k in cs.v){const f=cs.v[k];if(f&&f.__pyfn)f.clo=sc}setv(s.n,cls,sc);return}
  case'glob':for(const n of s.ns)if(sc.gl)sc.gl.add(n);return;
  case'imp':for(const m of s.ms){const top=m.n.split('.')[0];const mod=getMod(m.as?m.n:top);setv(m.as||top,mod,sc)}return;
  case'from':{const mod=getMod(s.m);for(const n of s.ns){if(n.n==='*'){for(const k in mod)if(!k.startsWith('_'))setv(k,mod[k],sc);continue}if(!(n.n in mod))err('ImportError',`não existe "${n.n}" em ${s.m}`);setv(n.as||n.n,mod[n.n],sc)}return}
  case'del':{const ts=s.e.k==='tup'?s.e.it:[s.e];for(const t of ts){if(t.k==='v'){for(let q=sc;q;q=q.par)if(t.n in q.v){delete q.v[t.n];break}}else if(t.k==='idx'){const o=yield* ev(t.o,sc),i=yield* ev(t.i,sc);if(Array.isArray(o))o.splice(normIdx(o.length,i),1);else if(o instanceof PyDict){if(!o.del(i))err('KeyError',pyRepr(i))}}else if(t.k==='attr'){const o=yield* ev(t.o,sc);if(o&&o.d)delete o.d[t.n]}}return}
  case'raise':{if(!s.e){if(sc.__exc)throw sc.__exc;err('RuntimeError','raise sem exceção ativa')}const v=yield* ev(s.e,sc);if(v&&v.__exc)throw new PyErr(v.__exc,'',{__exco:v.__exc,msg:'',args:pyTup([])});if(v&&v.__exco)throw new PyErr(v.__exco,v.msg,v);if(v&&v.__inst)throw new PyErr(v.__inst.n,'',v);err('TypeError','raise precisa de uma exceção')}
  case'assert':if(!truthy(yield* ev(s.e,sc)))err('AssertionError',s.m?pyStr(yield* ev(s.m,sc)):'');return;
  case'with':{const v=yield* ev(s.e,sc);if(s.as)setv(s.as,v,sc);yield* runB(s.b,sc);return}
  case'try':{let ok=true;try{yield* runB(s.b,sc)}catch(x){if(x===BRK||x===CONT||x instanceof RET||x instanceof STOP)throw x;let pe=x;if(!(x instanceof PyErr)){const m=x&&x.msg?x.msg:String(x);pe=new PyErr('RuntimeError',m)}ok=false;let h=null;for(const hh of s.hs){const ty=hh.ty?yield* ev(hh.ty,sc):null;if(excMatch(ty,pe.type)){h=hh;break}}
    if(!h){if(s.fin)yield* runB(s.fin,sc);throw pe}const eo=pe.obj||{__exco:pe.type,msg:pe.pmsg,args:pyTup([pe.pmsg])};if(h.as)setv(h.as,eo,sc);const prev=sc.__exc;sc.__exc=pe;try{yield* runB(h.b,sc)}finally{sc.__exc=prev;if(s.fin)yield* runB(s.fin,sc)}return}
   if(ok&&s.els)yield* runB(s.els,sc);if(s.fin)yield* runB(s.fin,sc);return}}
  err('SyntaxError','comando não suportado')}

 /* ---------- builtins ---------- */
 const out=s=>api.ser(s);
 const toInt=(v,base)=>{v=pyNum(v);if(typeof v==='string'){const s=v.trim().replace(/_/g,'');const b=base==null?10:base;const m=b===16?/^[+-]?(0x)?[0-9a-f]+$/i:b===2?/^[+-]?(0b)?[01]+$/i:b===8?/^[+-]?(0o)?[0-7]+$/i:/^[+-]?\d+$/;if(!m.test(s))err('ValueError',`texto inválido para int(): ${pyRepr(v)}`);return parseInt(s.replace(/^([+-]?)0[xbo]/i,'$1'),b)}if(typeof v==='boolean')return+v;if(typeof v==='number')return Math.trunc(v);if(v==null)err('TypeError','int() não aceita None');err('TypeError',`int() não aceita ${tname(v)}`)};
 const BI={
  print:B(function*(a,kw){const sep=kw.sep==null?' ':kw.sep,end=kw.end==null?'\n':kw.end;const p=[];for(const x of a)p.push(yield* strG(x));out(p.join(sep)+end);return null}),
  len:B(a=>len(a[0])),range:B(a=>{const n=a.map(x=>toInt(x));if(n.length===1)return{__range:[0,n[0],1]};if(n[2]===0)err('ValueError','range com passo zero');return{__range:[n[0],n[1],n[2]==null?1:n[2]]}}),
  int:B(a=>a.length?toInt(a[0],a[1]):0),float:B(a=>{if(!a.length)return new PyFloat(0);const v=pyNum(a[0]);if(typeof v==='string'){const s=v.trim().toLowerCase();if(s==='inf'||s==='+inf')return Infinity;if(s==='-inf')return-Infinity;if(s==='nan')return NaN;if(!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(s))err('ValueError',`texto inválido para float(): ${pyRepr(v)}`);return fl(parseFloat(s))}return fl(num(v))}),
  str:B(function*(a){return a.length?(Array.isArray(a[0])&&a[0].__b&&a[1]!=null?String.fromCharCode(...a[0]):yield* strG(a[0])):''}),bool:B(a=>a.length?truthy(a[0]):false),repr:B(a=>pyRepr(a[0])),
  abs:B(a=>{const v=a[0];return isF(v)?fl(Math.abs(num(v))):Math.abs(num(v))}),round:B(a=>{const v=num(a[0]);if(a[1]==null){const r=Math.round(v),f=v-Math.floor(v);return f===.5&&Math.floor(v)%2===0?Math.floor(v):r}const k=Math.pow(10,a[1]);return fl(Math.round(v*k)/k)}),
  min:B(function*(a,kw){const L=a.length===1?toArr(a[0]):a;if(!L.length){if('default'in kw)return kw.default;err('ValueError','min() de sequência vazia')}let best=L[0],bk=kw.key?yield* call(kw.key,[best]):best;for(const x of L.slice(1)){const k=kw.key?yield* call(kw.key,[x]):x;if(cmpv(k,bk)<0){best=x;bk=k}}return best}),
  max:B(function*(a,kw){const L=a.length===1?toArr(a[0]):a;if(!L.length){if('default'in kw)return kw.default;err('ValueError','max() de sequência vazia')}let best=L[0],bk=kw.key?yield* call(kw.key,[best]):best;for(const x of L.slice(1)){const k=kw.key?yield* call(kw.key,[x]):x;if(cmpv(k,bk)>0){best=x;bk=k}}return best}),
  sum:B(a=>{let s=a[1]||0;for(const x of iterOf(a[0]))s=arith('+',s,x);return s}),
  list:B(a=>a.length?toArr(a[0]):[]),tuple:B(a=>pyTup(a.length?toArr(a[0]):[])),set:B(a=>new PySet(a.length?toArr(a[0]):[])),
  dict:B((a,kw)=>{const d=new PyDict();if(a.length){if(a[0]instanceof PyDict)for(const[k,v]of a[0].items())d.set(k,v);else for(const p of iterOf(a[0])){const q=toArr(p);d.set(q[0],q[1])}}for(const k in kw)d.set(k,kw[k]);return d}),
  enumerate:B(a=>toArr(a[0]).map((x,i)=>pyTup([i+(a[1]||0),x]))),zip:B(a=>{const L=a.map(toArr),n=Math.min(...L.map(x=>x.length));const r=[];for(let i=0;i<n;i++)r.push(pyTup(L.map(x=>x[i])));return r}),
  sorted:B(function*(a,kw){const L=toArr(a[0]);yield* call(listM(L,'sort'),[],kw);return L}),reversed:B(a=>toArr(a[0]).reverse()),
  map:B(function*(a){const f=a[0],L=a.slice(1).map(toArr),n=Math.min(...L.map(x=>x.length)),r=[];for(let i=0;i<n;i++)r.push(yield* call(f,L.map(x=>x[i])));return r}),
  filter:B(function*(a){const f=a[0],r=[];for(const x of iterOf(a[1]))if(f==null?truthy(x):truthy(yield* call(f,[x])))r.push(x);return r}),
  any:B(a=>toArr(a[0]).some(truthy)),all:B(a=>toArr(a[0]).every(truthy)),chr:B(a=>String.fromCharCode(num(a[0]))),ord:B(a=>String(a[0]).charCodeAt(0)),
  hex:B(a=>{const v=toInt(a[0]);return(v<0?'-0x':'0x')+Math.abs(v).toString(16)}),bin:B(a=>{const v=toInt(a[0]);return(v<0?'-0b':'0b')+Math.abs(v).toString(2)}),oct:B(a=>{const v=toInt(a[0]);return(v<0?'-0o':'0o')+Math.abs(v).toString(8)}),
  divmod:B(a=>pyTup([arith('//',a[0],a[1]),arith('%',a[0],a[1])])),pow:B(a=>a[2]!=null?Number(BigInt(toInt(a[0]))**BigInt(toInt(a[1]))%BigInt(toInt(a[2]))):arith('**',a[0],a[1])),
  isinstance:B(a=>{const v=a[0],T=Array.isArray(a[1])?a[1]:[a[1]];return T.some(t=>t===BI.int?tname(v)==='int'||tname(v)==='bool':t===BI.float?tname(v)==='float':t===BI.str?typeof v==='string':t===BI.list?tname(v)==='list':t===BI.tuple?tname(v)==='tuple':t===BI.dict?v instanceof PyDict:t===BI.bool?typeof v==='boolean':t&&t.__pycls?!!(v&&v.__inst&&(()=>{for(let k=v.__inst;k;k=k.base)if(k===t)return true})()):t&&t.__exc?!!(v&&v.__exco&&excMatch(t,v.__exco)):false)}),
  type:B(a=>{const v=a[0];const n=tname(v);return v&&v.__inst?v.__inst:{__repr:()=>`<class '${n}'>`,__name__:n}}),callable:B(a=>!!(a[0]&&(a[0].__pyfn||a[0].__bm||typeof a[0]==='function'||a[0].__pycls))),
  hasattr:B(a=>{try{getattr(a[0],a[1]);return true}catch(e){return false}}),getattr:B(a=>getattr(a[0],a[1],a[2])),setattr:B(a=>{setattr(a[0],a[1],a[2]);return null}),
  id:B(a=>0),hash:B(a=>{const s=pyRepr(a[0]);let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))|0;return h}),format:B(a=>pyFmtNum(a[0],a[1]||'')),input:B(a=>{if(a[0]!=null)out(pyStr(a[0]));const i=S0.serIn.indexOf('\n');if(i<0)return'';const s=S0.serIn.slice(0,i);S0.serIn=S0.serIn.slice(i+1);return s}),
  bytes:B(a=>{const r=a.length?(typeof a[0]==='number'?new Array(a[0]).fill(0):typeof a[0]==='string'?[...a[0]].map(x=>x.charCodeAt(0)&255):toArr(a[0])):[];r.__b=1;return r}),bytearray:B(a=>BI.bytes(a,{})),
  iter:B(a=>{const L=toArr(a[0]);let i=0;return{__iter:function*(){while(i<L.length)yield L[i++]},__next:()=>{if(i>=L.length)err('StopIteration','');return L[i++]}}}),next:B(a=>{const o=a[0];if(o&&o.__next){try{return o.__next()}catch(e){if(a.length>1)return a[1];throw e}}err('TypeError','next() precisa de um iterador')}),
  staticmethod:B(a=>{if(a[0])a[0].__static=1;return a[0]}),classmethod:B(a=>a[0]),property:B(a=>a[0]),super:B(a=>{err('NotImplementedError','super() ainda não é suportado; chame Base.metodo(self)')}),
  globals:B(()=>{const d=new PyDict();for(const k in GL.v)d.set(k,GL.v[k]);return d}),exit:B(()=>{throw new STOP()}),object:{__pycls:1,n:'object',base:null,d:{}},
  ...EXC};

 /* ---------- hardware ---------- */
 const PICO=M.kind==='pico',ESP=M.kind==='esp32';
 const pinNum=p=>{if(p&&p.__pin!=null)return p.__pin;if(typeof p==='string'){if(p==='LED')return PICO?25:M.led;const m=/^(?:GP|GPIO|D)?(\d+)$/i.exec(p);if(m)return+m[1];err('ValueError',`pino "${p}" não existe nesta placa`)}return toInt(p)};
 const vPin=n=>{const i=M.pins[n];if(i==null||!rt.A)return 0;return rt.A.vdc(K(c.id,i))-rt.A.vdc(K(c.id,M.gnd))};
 const pins={};
 const PINK={IN:0,OUT:1,OPEN_DRAIN:1,PULL_UP:2,PULL_DOWN:3,IRQ_RISING:1,IRQ_FALLING:2,ALT:4};
 const mkPin=(id,mode,pull,value)=>{const n=pinNum(id);const o={__pin:n,__repr:()=>`Pin(${n})`};
  const init=(md,pl,val)=>{const was2=S0.mode[n]===2;if(md===1){S0.mode[n]=1;if(S0.out[n]==null)S0.out[n]=0}else if(md===0||md==null&&pl!=null){S0.mode[n]=pl===2?2:0}if(val!=null&&md===1)api.setOut(n,truthy(val)?1:0);if(was2!==(S0.mode[n]===2))S0.modeCh=1;S0.dirty=1};
  init(mode,pull,value);
  const get=()=>S0.mode[n]===1?(S0.out[n]>0?1:0):api.pinIn(n);
  Object.assign(o,{value:B(a=>{if(a.length){if(S0.mode[n]!==1){S0.mode[n]=1}api.setOut(n,truthy(a[0])?1:0);return null}return get()}),on:B(()=>{S0.mode[n]=1;api.setOut(n,1);return null}),off:B(()=>{S0.mode[n]=1;api.setOut(n,0);return null}),
   high:B(()=>{S0.mode[n]=1;api.setOut(n,1);return null}),low:B(()=>{S0.mode[n]=1;api.setOut(n,0);return null}),toggle:B(()=>{S0.mode[n]=1;api.setOut(n,S0.out[n]>0?0:1);return null}),
   init:B((a,kw)=>{init(a[0]??kw.mode,a[1]??kw.pull,kw.value);return null}),mode:B(a=>{if(a.length)init(a[0]);return S0.mode[n]===1?1:0}),pull:B(a=>{if(a.length)init(0,a[0]);return S0.mode[n]===2?2:null}),
   irq:B((a,kw)=>{const h=kw.handler??a[0],tr=kw.trigger??a[1]??3;IRQS.push({n,h,tr,last:get(),o});return null}),__call__:null});
  pins[n]=o;return o};
 const PinF=B(function*(a,kw){const o=mkPin(a[0],a[1]??kw.mode,a[2]??kw.pull,kw.value);if(S0.modeCh)yield{budget:1};return o});Object.assign(PinF,PINK);PinF.__repr=()=>"<class 'Pin'>";
 const IRQS=[],TIMERS=[];let inSvc=false;
 function* service(){if(inSvc)return;inSvc=true;try{const t=vt();for(const q of IRQS){const v=S0.mode[q.n]===1?(S0.out[q.n]>0?1:0):api.pinIn(q.n);if(v!==q.last){const rise=v>q.last;q.last=v;if((rise&&(q.tr&1))||(!rise&&(q.tr&2)))yield* call(q.h,[q.o])}}
   for(const tm of TIMERS){if(tm.on&&t>=tm.next){tm.next=tm.per?Math.max(tm.next+tm.per,t):Infinity;if(!tm.per)tm.on=false;yield* call(tm.cb,[tm.o])}}}finally{inSvc=false}}
 const adcVolt=a=>{if(PICO&&typeof a==='number'&&a>=0&&a<=4){if(a===4)return .706;return vPin(26+a)}return vPin(pinNum(a))};
 const ADCF=B(a=>{const src=a[0];const n=PICO&&typeof src==='number'&&src<=4?src:pinNum(src);const V=()=>Math.max(0,Math.min(M.vref,adcVolt(n)));
  return{__repr:()=>`ADC(${n})`,read_u16:B(()=>Math.round(V()/M.vref*65535)),read:B(()=>Math.round(V()/M.vref*4095)),read_uv:B(()=>Math.round(V()*1e6)),atten:B(()=>null),width:B(()=>null),init:B(()=>null)}});
 Object.assign(ADCF,{ATTN_0DB:0,ATTN_2_5DB:1,ATTN_6DB:2,ATTN_11DB:3,WIDTH_9BIT:0,WIDTH_10BIT:1,WIDTH_11BIT:2,WIDTH_12BIT:3,CORE_TEMP:4});
 const pwmApply=o=>{const n=o.n,d=o.duty;S0.mode[n]=1;api.setOut(n,d*255,true);for(const z of[...api.dev('piezo',0,n),...api.dev('piezo',1,n)]){const q=DEV(z);q.tone=d>0&&d<1?o.f:0;q.until=0}
  for(const sv of api.dev('servo',2,n)){if(o.f>=40&&o.f<=60&&d>0){const w=d/o.f;const ang=Math.max(0,Math.min(180,(w-5e-4)/2e-3*180));const z=DEV(sv);z.ang=ang;z.lib=rt.simT}}S0.dirty=1};
 const PWMF=B((a,kw)=>{const n=pinNum(a[0]);const o={n,f:kw.freq||a[1]||(ESP?5000:1000),duty:0,__repr:()=>`PWM(${n})`};if(kw.duty!=null)o.duty=Math.max(0,Math.min(1,kw.duty/1023));if(kw.duty_u16!=null)o.duty=kw.duty_u16/65535;pwmApply(o);
  Object.assign(o,{freq:B(x=>{if(x.length){o.f=num(x[0]);pwmApply(o);return null}return o.f}),duty_u16:B(x=>{if(x.length){o.duty=Math.max(0,Math.min(1,num(x[0])/65535));pwmApply(o);return null}return Math.round(o.duty*65535)}),
   duty:B(x=>{if(x.length){o.duty=Math.max(0,Math.min(1,num(x[0])/1023));pwmApply(o);return null}return Math.round(o.duty*1023)}),duty_ns:B(x=>{if(x.length){o.duty=Math.max(0,Math.min(1,num(x[0])*1e-9*o.f));pwmApply(o);return null}return Math.round(o.duty/o.f*1e9)}),
   deinit:B(()=>{o.duty=0;pwmApply(o);return null}),init:B((x,k)=>{if(k.freq)o.f=k.freq;if(k.duty_u16!=null)o.duty=k.duty_u16/65535;pwmApply(o);return null})});return o});
 const i2cAddrs=()=>{const r=[];for(const x of S.comps){if(x.type==='lcdi2c')r.push(parseInt(x.addr)||0x27);if(x.type==='oled')r.push(parseInt(x.addr)||0x3c);if(x.type==='ic'&&x.k==='PCF8574')r.push(0x20)}return[...new Set(r)].sort((a,b)=>a-b)};
 const I2CF=B((a,kw)=>({__i2c:1,__repr:()=>'I2C(0)',scan:B(()=>i2cAddrs()),writeto:B(x=>{const pc=S.comps.find(o=>o.type==='ic'&&o.k==='PCF8574');if(pc&&x[1]&&x[1].length){icSt(pc).port=x[1][x[1].length-1];S0.dirty=1}return x[1]?x[1].length:0}),readfrom:B(x=>{const r=new Array(x[1]||1).fill(0);r.__b=1;return r}),writeto_mem:B(()=>null),readfrom_mem:B(x=>{const r=new Array(x[2]||1).fill(0);r.__b=1;return r})}));
 const TimerF=B((a,kw)=>{const o={__repr:()=>'Timer'};const tm={o,on:false,per:0,next:0,cb:null};const init=(k)=>{const per=(k.period!=null?k.period:k.freq?1000/k.freq:1000)/1000;tm.per=(k.mode??1)===1?per:0;tm.next=vt()+per;tm.cb=k.callback;tm.on=!!tm.cb;if(!TIMERS.includes(tm))TIMERS.push(tm)};
  Object.assign(o,{init:B((x,k)=>{init(k);return null}),deinit:B(()=>{tm.on=false;return null})});if(kw.callback)init(kw);return o});Object.assign(TimerF,{ONE_SHOT:0,PERIODIC:1});
 const mod=(n,o)=>{o.__repr=()=>`<module '${n}'>`;return o};
 const sleepS=function*(s){const end=vt()+Math.max(0,num(s));if(!IRQS.length&&!TIMERS.length){yield wait(end-vt());return}while(vt()<end-1e-9){let nx=end;for(const tm of TIMERS)if(tm.on)nx=Math.min(nx,tm.next);if(IRQS.length)nx=Math.min(nx,vt()+.005);yield wait(Math.max(1e-4,nx-vt()));yield* service()}};
 const timeM=mod('time',{sleep:B(function*(a){yield* sleepS(a[0])}),sleep_ms:B(function*(a){yield* sleepS(num(a[0])/1000)}),sleep_us:B(function*(a){yield* sleepS(num(a[0])/1e6)}),
  ticks_ms:B(()=>Math.floor(vt()*1000)),ticks_us:B(()=>Math.floor(vt()*1e6)),ticks_cpu:B(()=>Math.floor(vt()*1e6)),ticks_diff:B(a=>num(a[0])-num(a[1])),ticks_add:B(a=>num(a[0])+num(a[1])),
  time:B(()=>Math.floor(vt())),time_ns:B(()=>Math.floor(vt()*1e9)),localtime:B(()=>{const s=Math.floor(vt());return pyTup([2026,1,1,Math.floor(s/3600)%24,Math.floor(s/60)%60,s%60,3,1])}),mktime:B(()=>0)});
 /* Wi-Fi simulado: conecta 1,5 s depois de connect() a qualquer rede; ESP32 e Pico W */
 const wifi=api.wifi||(api.wifi=mcuWifi(api));
 const WLANF=B(a=>{const ap=a[0]===1;const o={__repr:()=>`WLAN(${ap?'AP':'STA'})`,active:B(x=>{if(x.length)wifi.active=truthy(x[0]);return wifi.active}),connect:B((x,k)=>{wifi.connect(x[0]??k.ssid,x[1]??k.key);return null}),disconnect:B(()=>{wifi.disconnect();return null}),
  isconnected:B(()=>ap?wifi.active:wifi.connected()),status:B(x=>x.length&&x[0]==='rssi'?wifi.rssi():wifi.connected()?3:wifi.connecting()?1:0),ifconfig:B(()=>pyTup(ap?['192.168.4.1','255.255.255.0','192.168.4.1','0.0.0.0']:wifi.connected()?[wifi.ip,'255.255.255.0','192.168.0.1','8.8.8.8']:['0.0.0.0','0.0.0.0','0.0.0.0','0.0.0.0'])),
  scan:B(()=>wifi.nets().map(([s,r,ch])=>{const b=[...s].map(x=>x.charCodeAt(0));b.__b=1;const m=[0x24,0x0a,0xc4,0,0,ch];m.__b=1;return pyTup([b,m,ch,r,3,false])})),config:B((x,k)=>{if(x[0]==='mac'){const m=[0x24,0x0a,0xc4,0x12,0x34,0x56];m.__b=1;return m}if(k.essid||k.ssid)wifi.apName=k.essid||k.ssid;return x[0]==='essid'?wifi.apName||'Faisca-AP':null})};return o});
 const networkM=mod('network',{WLAN:WLANF,STA_IF:0,AP_IF:1,STAT_IDLE:0,STAT_CONNECTING:1,STAT_WRONG_PASSWORD:-3,STAT_NO_AP_FOUND:-2,STAT_GOT_IP:3,hostname:B(()=>'faisca')});
 const machineM=mod('machine',{Pin:PinF,ADC:ADCF,PWM:PWMF,I2C:I2CF,SoftI2C:I2CF,Timer:TimerF,freq:B(a=>a.length?null:(PICO?125000000:240000000)),reset:B(()=>{throw new STOP()}),soft_reset:B(()=>{throw new STOP()}),unique_id:B(()=>{const r=[0xe6,0x61,0x64,8,0x43,0x5a];r.__b=1;return r}),
  idle:B(function*(){yield wait(.001)}),lightsleep:B(function*(a){yield wait((a[0]||0)/1000)}),deepsleep:B(function*(a){yield wait((a[0]||0)/1000)}),disable_irq:B(()=>0),enable_irq:B(()=>null),time_pulse_us:B(function*(a){const hs=[...api.dev('hcsr04',2,pinNum(a[0])),...api.dev('ping',2,pinNum(a[0]))];if(!hs.length){yield wait(.03);return-1}const us=Math.round((+hs[0].dist||0)*58.3);yield wait(us/1e6);return us})});
 const NPF=B((a,kw)=>{const n=toInt(a[1]),pn=pinNum(a[0]);const lib=api.LIB.Adafruit_NeoPixel(n,pn);const buf=new Array(n).fill(null).map(()=>pyTup([0,0,0]));
  return{n,__len:()=>n,__repr:()=>`NeoPixel(${n})`,__gi:i=>buf[normIdx(n,i)],__si:(i,v)=>{const t=toArr(v);buf[normIdx(n,i)]=pyTup(t.map(x=>toInt(x)))},fill:B(x=>{const t=pyTup(toArr(x[0]).map(v=>toInt(v)));for(let i=0;i<n;i++)buf[i]=t;return null}),
   write:B(()=>{buf.forEach((t,i)=>lib.setPixelColor(i,t[0]&255,t[1]&255,t[2]&255));lib.show();return null}),__iter:function*(){yield* buf}}});
 const randM=mod('random',{randint:B(a=>Math.floor(num(a[0])+Math.random()*(num(a[1])-num(a[0])+1))),random:B(()=>fl(Math.random())),uniform:B(a=>fl(num(a[0])+Math.random()*(num(a[1])-num(a[0])))),choice:B(a=>{const L=toArr(a[0]);if(!L.length)err('IndexError','choice() de sequência vazia');return L[Math.floor(Math.random()*L.length)]}),
  randrange:B(a=>{const[s,e,st]=a.length===1?[0,num(a[0]),1]:[num(a[0]),num(a[1]),a[2]==null?1:num(a[2])];const n=Math.ceil((e-s)/st);return s+Math.floor(Math.random()*n)*st}),getrandbits:B(a=>Math.floor(Math.random()*Math.pow(2,num(a[0])))),seed:B(()=>null),shuffle:B(a=>{const L=a[0];for(let i=L.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[L[i],L[j]]=[L[j],L[i]]}return null})});
 const M1=f=>B(a=>fl(f(...a.map(x=>num(x)))));
 const mathM=mod('math',{pi:new PyFloat(Math.PI),e:new PyFloat(Math.E),tau:new PyFloat(2*Math.PI),inf:Infinity,nan:NaN,sqrt:B(a=>{const v=num(a[0]);if(v<0)err('ValueError','raiz de número negativo');return fl(Math.sqrt(v))}),sin:M1(Math.sin),cos:M1(Math.cos),tan:M1(Math.tan),asin:M1(Math.asin),acos:M1(Math.acos),atan:M1(Math.atan),atan2:M1(Math.atan2),
  floor:B(a=>Math.floor(num(a[0]))),ceil:B(a=>Math.ceil(num(a[0]))),trunc:B(a=>Math.trunc(num(a[0]))),fabs:M1(Math.abs),pow:M1(Math.pow),exp:M1(Math.exp),log:B(a=>fl(a[1]!=null?Math.log(num(a[0]))/Math.log(num(a[1])):Math.log(num(a[0])))),log10:M1(Math.log10),log2:M1(Math.log2),
  degrees:M1(x=>x*180/Math.PI),radians:M1(x=>x*Math.PI/180),isnan:B(a=>Number.isNaN(num(a[0]))),isinf:B(a=>!isFinite(num(a[0]))&&!Number.isNaN(num(a[0]))),hypot:M1(Math.hypot),copysign:M1((x,y)=>Math.sign(y)*Math.abs(x)),fmod:M1((x,y)=>x%y)});
 const sysM=mod('sys',{platform:PICO?'rp2':ESP?'esp32':'faisca',implementation:{name:'micropython',version:pyTup([1,23,0])},version:'3.4.0; MicroPython v1.23 (simulado no Faísca)',exit:B(()=>{throw new STOP()}),maxsize:2147483647,print_exception:B(a=>{out(pyStr(a[0])+'\n');return null}),stdout:{write:B(a=>{out(pyStr(a[0]));return null})}});
 const oledM=mod('ssd1306',{SSD1306_I2C:B((a,kw)=>pyOled(a[0],a[1],kw.addr??a[3]??0x3c)),SSD1306_SPI:B(a=>pyOled(a[0],a[1],0x3c))});
 function pyOled(w,h,addr){const d=api.LIB.Adafruit_SSD1306(w,h);d.begin(0,addr);d.setTextColor(1);const o={width:w,height:h,__repr:()=>'SSD1306'};
  Object.assign(o,{fill:B(x=>{d.fillScreen(num(x[0]));return null}),pixel:B(x=>{if(x.length>2){d.drawPixel(num(x[0]),num(x[1]),num(x[2]));return null}return d.getPixel(num(x[0]),num(x[1]))}),text:B(x=>{d.setTextSize(1);d.setTextColor(x[3]==null?1:num(x[3]));d.setCursor(num(x[1]),num(x[2]));d.print(pyStr(x[0]),null,true);return null}),
   show:B(()=>{d.display();return null}),hline:B(x=>{d.drawFastHLine(...x.map(num));return null}),vline:B(x=>{d.drawFastVLine(...x.map(num));return null}),line:B(x=>{d.drawLine(...x.map(num));return null}),
   rect:B(x=>{if(truthy(x[5]))d.fillRect(...x.slice(0,5).map(num));else d.drawRect(...x.slice(0,5).map(num));return null}),fill_rect:B(x=>{d.fillRect(...x.map(num));return null}),ellipse:B(x=>{if(truthy(x[5]))d.fillCircle(num(x[0]),num(x[1]),num(x[2]),num(x[4]));else d.drawCircle(num(x[0]),num(x[1]),num(x[2]),num(x[4]));return null}),
   scroll:B(x=>{d.scroll(num(x[0]),num(x[1]));return null}),invert:B(x=>{d.invertDisplay(num(x[0]));return null}),contrast:B(()=>null),poweroff:B(()=>{d.dim(true);d.on(false);return null}),poweron:B(()=>{d.on(true);return null})});return o}
 const lcdM=mod('i2c_lcd',{I2cLcd:B((a)=>{const lcd=api.LIB.LiquidCrystal_I2C(toInt(a[1]??0x27),toInt(a[3]??16),toInt(a[2]??2));lcd.init();const o={__repr:()=>'I2cLcd'};
   Object.assign(o,{putstr:B(x=>{const s=pyStr(x[0]);for(const ch of s){if(ch==='\n'){lcd.setCursor(0,(lcd.cur[1]+1)%2);continue}lcd.print(ch)}return null}),putchar:B(x=>{lcd.print(pyStr(x[0]));return null}),clear:B(()=>{lcd.clear();return null}),move_to:B(x=>{lcd.setCursor(num(x[0]),num(x[1]));return null}),
    backlight_on:B(()=>{lcd.backlight();return null}),backlight_off:B(()=>{lcd.noBacklight();return null}),display_on:B(()=>{lcd.display();return null}),display_off:B(()=>{lcd.noDisplay();return null}),show_cursor:B(()=>{lcd.cursor();return null}),hide_cursor:B(()=>{lcd.noCursor();return null}),blink_cursor_on:B(()=>null),blink_cursor_off:B(()=>null),custom_char:B(()=>null)});return o})});
 const mpM=mod('micropython',{const:B(a=>a[0]),mem_info:B(()=>{out('memória: 192 KB livres (simulado)\n');return null}),opt_level:B(()=>0),alloc_emergency_exception_buf:B(()=>null),schedule:B(function*(a){yield* call(a[0],[a[1]])})});
 const gcM=mod('gc',{collect:B(()=>null),mem_free:B(()=>196608),mem_alloc:B(()=>12288),enable:B(()=>null),disable:B(()=>null)});
 const dhtM=mod('dht',{DHT11:B(a=>pyDht(a[0])),DHT22:B(a=>pyDht(a[0]))});
 function pyDht(p){const n=pinNum(p);const find=()=>S.comps.find(x=>(x.type==='dht'||x.type==='dht11'||x.type==='dht22')&&netOf(K(x.id,1))===pinKey(M,n));const o={measure:B(()=>{if(!find())err('OSError','[Errno 110] ETIMEDOUT (sensor DHT não encontrado nesse pino)');return null}),temperature:B(()=>{const s=find();return s?fl(+s.temp||25):0}),humidity:B(()=>{const s=find();return s?fl(+s.hum||50):0})};return o}
 const MODS={machine:machineM,time:timeM,utime:timeM,network:networkM,neopixel:mod('neopixel',{NeoPixel:NPF}),random:randM,urandom:randM,math:mathM,sys:sysM,usys:sysM,ssd1306:oledM,i2c_lcd:lcdM,lcd_api:mod('lcd_api',{LcdApi:{__pycls:1,n:'LcdApi',base:null,d:{}}}),micropython:mpM,gc:gcM,dht:dhtM,
  esp32:mod('esp32',{raw_temperature:B(()=>113),hall_sensor:B(()=>0)}),rp2:mod('rp2',{}),esp:mod('esp',{osdebug:B(()=>null)}),uos:mod('os',{uname:B(()=>pyTup(['rp2','faisca','1.23','v1.23',PICO?'Raspberry Pi Pico':'ESP32'])),listdir:B(()=>['main.py'])}),os:null,ubinascii:null,
  struct:mod('struct',{pack:B(()=>{const r=[];r.__b=1;return r}),unpack:B(()=>pyTup([]))})};MODS.os=MODS.uos;
 const getMod=n=>{const m=MODS[n];if(!m)err('ImportError',`o módulo "${n}" não existe no simulador (disponíveis: machine, time, network, neopixel, ssd1306, i2c_lcd, dht, random, math, sys)`);return m};
 return(function*(){try{yield* runB(prog,GL)}catch(x){if(x instanceof STOP)return;if(x instanceof PyErr){out(`Traceback (most recent call last):\n  File "main.py", line ${x.ln}\n${x.type}: ${x.pmsg}\n`);throw{msg:`Linha ${x.ln}: ${x.type}: ${x.pmsg}`}}if(x===BRK||x===CONT)throw{msg:`Linha ${curLn}: break/continue fora de laço`};if(x instanceof RET)throw{msg:`Linha ${curLn}: return fora de função`};throw x}})()}

/* Wi-Fi simulado compartilhado (C++ e MicroPython) */
function mcuWifi(api){const S0=api.S0,vt=()=>S0.vt;const w={active:false,ssid:null,t0:null,ip:'192.168.0.'+(40+((api.c.id||'').length*7)%150),apName:null,
 connect(s,k){w.active=true;w.ssid=s==null?'':String(s);w.t0=vt();api.ser&&0},disconnect(){w.t0=null;w.ssid=null},connecting(){return w.t0!=null&&vt()-w.t0<1.5},connected(){return w.t0!=null&&vt()-w.t0>=1.5},
 rssi(){return w.connected()?-48-Math.round(Math.sin(vt())*4):0},nets(){return[['Faisca-WiFi',-42,6],['Laboratorio',-61,11],[w.ssid||'Visitantes',-70,1]].filter((x,i,a)=>a.findIndex(y=>y[0]===x[0])===i)}};return w}
