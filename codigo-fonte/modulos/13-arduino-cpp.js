/* ================= Arduino, ATtiny e micro:bit programáveis em C++ (subconjunto do Arduino) ================= */
/* ---------- descrição de cada placa: número do pino → índice do terminal ---------- */
function mcuOf(c){if(!c)return null;{const bm=typeof brdMcu==='function'?brdMcu(c):null;if(bm)return bm}
 if(c.type==='plc'&&(PM[c.m]||{}).ard){const N=namesOf(c),pins={},an={};N.forEach((n,i)=>{const b=String(n).replace(/^.*\./,'');let m=/^D(\d+)$/.exec(b);if(m)pins[+m[1]]=i;m=/^A(\d)$/.exec(b);if(m){an[+m[1]]=i;pins[14+ +m[1]]=i}});
  return{c,kind:'uno',pins,an,vcc:0,gnd:1,vref:5,self:true,sda:18,scl:19,led:13}}
 if(c.type==='ic'&&c.k==='ATtiny85')return{c,kind:'tiny',pins:{0:4,1:5,2:6,3:1,4:2,5:0},an:{0:0,1:6,2:2,3:1},vcc:7,gnd:3,vref:5,self:false,sda:0,scl:2,led:1};
 if(c.type==='mbit')return{c,kind:'mbit',pins:{0:0,1:1,2:2},an:{0:0,1:1,2:2},vcc:3,gnd:4,vref:3.3,self:true,sda:20,scl:19,led:-1};return null}
const isMCU=c=>!!mcuOf(c);
/* ---------- léxico ---------- */
const CKW=new Set(['if','else','while','do','for','switch','case','default','break','continue','return','true','false','const','static','volatile','unsigned','signed','struct','sizeof','new']);
const CTY=new Set(['void','int','long','short','char','byte','bool','boolean','float','double','String','word','size_t','uint8_t','uint16_t','uint32_t','uint64_t','int8_t','int16_t','int32_t','int64_t','unsigned','signed','Servo','LiquidCrystal','LiquidCrystal_I2C','Adafruit_NeoPixel','Keypad','IRrecv','decode_results','TM1637Display','Adafruit_Microbit_Matrix','SoftwareSerial']);
function cLex(src){const out=[],defs={};let ln=1;const lines=src.replace(/\r/g,'').split('\n');let body='';
 for(const L0 of lines){const L=L0.trim();if(L.startsWith('#')){const m=/^#\s*define\s+([A-Za-z_]\w*)\s+(.+?)\s*(\/\/.*)?$/.exec(L);if(m)defs[m[1]]=m[2];body+='\n';continue}body+=L0+'\n'}
 const lex=(s,base)=>{const tk=[];let i=0,l=base;const n=s.length;
  while(i<n){const ch=s[i];if(ch==='\n'){l++;i++;continue}if(/\s/.test(ch)){i++;continue}
   if(s.startsWith('//',i)){while(i<n&&s[i]!=='\n')i++;continue}if(s.startsWith('/*',i)){const j=s.indexOf('*/',i+2),e=j<0?n:j+2;l+=(s.slice(i,e).match(/\n/g)||[]).length;i=e;continue}
   const r=s.slice(i,i+40);let m;
   if((m=/^0[xX][0-9a-fA-F]+[uUlL]*/.exec(r))){tk.push({t:'num',v:parseInt(m[0],16),ty:'int',ln:l});i+=m[0].length;continue}
   if((m=/^0[bB][01]+/.exec(r))){tk.push({t:'num',v:parseInt(m[0].slice(2),2),ty:'int',ln:l});i+=m[0].length;continue}
   if((m=/^B[01]{1,8}(?![\w])/.exec(r))){tk.push({t:'num',v:parseInt(m[0].slice(1),2),ty:'int',ln:l});i+=m[0].length;continue}
   if((m=/^(\d+\.\d*|\.\d+|\d+)([eE][-+]?\d+)?[fF]?[uUlL]*/.exec(r))){const f=/[.eEfF]/.test(m[0].replace(/[uUlL]/g,''));tk.push({t:'num',v:parseFloat(m[0]),ty:f?'float':'int',ln:l});i+=m[0].length;continue}
   if(ch==='"'){let j=i+1,v='';while(j<n&&s[j]!=='"'){if(s[j]==='\\'){const e=s[j+1];v+=e==='n'?'\n':e==='t'?'\t':e==='0'?'\0':e;j+=2}else v+=s[j++]}tk.push({t:'str',v,ln:l});i=j+1;continue}
   if(ch==="'"){let j=i+1,v;if(s[j]==='\\'){const e=s[j+1];v=e==='n'?10:e==='t'?9:e==='0'?0:e.charCodeAt(0);j+=2}else v=s.charCodeAt(j++);if(s[j]!=="'")throw{ln:l,msg:'caractere mal fechado (use aspas simples só para 1 letra)'};tk.push({t:'num',v,ty:'char',ln:l});i=j+1;continue}
   if((m=/^[A-Za-z_]\w*/.exec(r))){const w=m[0];if(defs[w]!=null&&base>=0){tk.push(...lex(defs[w],-1).map(t=>({...t,ln:l})))}else tk.push({t:CKW.has(w)?'kw':'id',v:w,ln:l});i+=w.length;continue}
   if((m=/^(<<=|>>=|::|->|\+\+|--|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|==|!=|<=|>=|&&|\|\||<<|>>|[-+*/%=<>!&|^~?:;,.(){}\[\]])/.exec(r))){tk.push({t:'op',v:m[1],ln:l});i+=m[1].length;continue}
   throw{ln:l,msg:`símbolo inesperado "${ch}"`}}return tk};
 out.push(...lex(body,1));out.push({t:'eof',v:'',ln:ln+lines.length});return out}
/* ---------- análise sintática ---------- */
const LIBC=new Set(['SoftwareSerial','Servo','LiquidCrystal','LiquidCrystal_I2C','Adafruit_NeoPixel','Keypad','IRrecv','decode_results','TM1637Display','Adafruit_Microbit_Matrix']);
const INTT=new Set(['int','long','short','char','byte','bool','boolean','word','size_t','uint8_t','uint16_t','uint32_t','uint64_t','int8_t','int16_t','int32_t','int64_t','unsigned','signed']);
function cParse(src){const tk=cLex(src);let p=0;const fnRet={};const UT=new Set(),ENT=new Set(),cls={},enums={};
 src.replace(/\b(?:struct|class)\s+([A-Za-z_]\w*)\s*[{:]/g,(_,n)=>{UT.add(n)});src.replace(/\btypedef\s+struct\s*(?:[A-Za-z_]\w*)?\s*\{[^}]*\}\s*([A-Za-z_]\w*)\s*;/g,(_,n)=>{UT.add(n)});src.replace(/\benum\s+(?:class\s+)?([A-Za-z_]\w*)/g,(_,n)=>{ENT.add(n)});
 const TYH=v=>CTY.has(v)||UT.has(v)||ENT.has(v);
 src.replace(/\b(void|int|long|float|double|bool|boolean|byte|char|String|word|unsigned\s+long|unsigned\s+int|unsigned|uint8_t|uint16_t|uint32_t|int16_t|int32_t)\s+([A-Za-z_]\w*)\s*\(/g,(_,t,n)=>{fnRet[n]=t.replace(/\s+/g,' ')});
 const pk=(o=0)=>tk[p+o],nx=()=>tk[p++],err=(m,t=pk())=>{throw{ln:t.ln,msg:m}},is=(v,o=0)=>{const t=tk[p+o];return t&&(t.t==='op'||t.t==='kw')&&t.v===v},eat=v=>{if(!is(v))err(`esperava "${v}" (achei "${pk().v||'fim do código'}")`);p++};
 const scopes=[{}],decl=(n,ty)=>{scopes[scopes.length-1][n]=ty},tyOf=n=>{for(let i=scopes.length-1;i>=0;i--)if(n in scopes[i])return scopes[i][n];return null};
 const isType=(o=0)=>{const t=tk[p+o];if(!t)return false;if(t.t==='kw'&&['const','static','volatile','unsigned','signed'].includes(t.v))return true;if(t.t==='kw'&&t.v==='struct'){const u=tk[p+o+1];return!!u&&u.t==='id'&&UT.has(u.v)}return t.t==='id'&&(TYH(t.v)||(['inline','virtual','explicit'].includes(t.v)&&isType(o+1)))};
 const readType=()=>{let base='',mods=[];while(isType()){if(base&&pk().t==='id'&&TYH(pk().v)&&!CTY.has(base+' '+pk().v)&&!(base==='long'&&pk().v==='long'))break;const v=nx().v;if(['const','static','volatile','struct','inline','virtual','explicit'].includes(v))continue;if(v==='unsigned'||v==='signed'){mods.push(v);continue}base=v}
  if(!base)base='int';if(ENT.has(base))base='int';const ty=(mods.includes('unsigned')?'unsigned ':'')+base;while(is('*')){p++}return ty};
 const numTy=ty=>UT.has(ty)?'obj':ty==='float'||ty==='double'?'float':ty==='String'?'str':ty==='char'?'char':ty==='bool'||ty==='boolean'?'bool':INTT.has(ty.replace('unsigned ',''))||ty.startsWith('unsigned')?'int':'obj';
 /* expressões */
 const P=k=>{const l=[];for(;;){const c=k();if(c)l.push(c);else break}return l};
 function prim(){const t=nx();
  if(t.t==='num')return{k:'n',v:t.v,ty:t.ty};if(t.t==='str'){let v=t.v;while(pk().t==='str')v+=nx().v;return{k:'s',v,ty:'str'}}
  if(t.t==='kw'&&(t.v==='true'||t.v==='false'))return{k:'n',v:t.v==='true'?1:0,ty:'bool'};
  if(t.t==='kw'&&t.v==='sizeof'){eat('(');const e=isType()?(readType(),{k:'n',v:2,ty:'int'}):expr();eat(')');return{k:'sizeof',e,ty:'int'}}
  if(t.t==='op'&&t.v==='('){if(isType()&&!(tk[p].t==='id'&&!TYH(tk[p].v))){const ty=readType();eat(')');const e=unary();return{k:'cast',ty:numTy(ty),cty:ty,e}}const e=expr();eat(')');return e}
  if(t.t==='op'&&t.v==='{'){const items=[];if(!is('}'))do{if(is('}'))break;items.push(assign())}while(is(',')&&++p);eat('}');return{k:'arr',items,ty:'obj'}}
  if(t.t==='id'){if(TYH(t.v)&&is('(')){p++;const a=args();return{k:'ctor',cls:t.v,a,ty:t.v==='String'?'str':numTy(t.v)}}if(ENT.has(t.v)&&is('::')){p++;const m=nx();return{k:'v',n:m.v,ty:'int'}}
   return{k:'v',n:t.v,ty:tyOf(t.v)?numTy(tyOf(t.v)):fnRet[t.v]?numTy(fnRet[t.v]):'int',u:U32T.has(tyOf(t.v)||'')}}
  err(t.t==='eof'?'o código terminou antes da hora (faltou fechar algo?)':`não esperava "${t.v}"`,t)}
 function args(){const a=[];if(!is(')'))do{a.push(assign())}while(is(',')&&++p);eat(')');return a}
 function post(){let e=prim();for(;;){if(is('(')){const ln=pk().ln;p++;const a=args();e={k:'call',ln,f:e,a,ty:e.k==='v'&&fnRet[e.n]?numTy(fnRet[e.n]):e.k==='m'?'any':'any',u:e.k==='v'&&(e.n==='millis'||e.n==='micros'||U32T.has(fnRet[e.n]||''))};continue}
   if(is('[')){p++;const i=expr();eat(']');e={k:'idx',o:e,i,ty:e.ty==='str'?'char':e.k==='v'&&tyOf(e.n)?numTy(tyOf(e.n)):'any'};continue}
   if(is('.')||is('->')||is('::')){p++;const m=nx();e={k:'m',o:e,n:m.v,ty:'any'};continue}
   if(is('++')||is('--')){const o=nx().v;e={k:'post',o,e,ty:e.ty};continue}return e}}
 function unary(){if(is('!')){p++;return{k:'u',o:'!',e:unary(),ty:'bool'}}if(is('-')){p++;const e=unary();return{k:'u',o:'-',e,ty:e.ty}}if(is('+')){p++;return unary()}
  if(is('~')){p++;return{k:'u',o:'~',e:unary(),ty:'int'}}if(is('++')||is('--')){const o=nx().v;const e=unary();return{k:'pre',o,e,ty:e.ty}}if(is('&')||is('*')){p++;return unary()}return post()}
 const BIN=[['||'],['&&'],['|'],['^'],['&'],['==','!='],['<','<=','>','>='],['<<','>>'],['+','-'],['*','/','%']];
 function bin(l){if(l>=BIN.length)return unary();let a=bin(l+1);while(pk().t==='op'&&BIN[l].includes(pk().v)){const o=nx().v,b=bin(l+1);
   const ty=['==','!=','<','<=','>','>=','&&','||'].includes(o)?'bool':o==='+'&&(a.ty==='str'||b.ty==='str')?'str':a.ty==='float'||b.ty==='float'?'float':'int';a={k:'b',o,a,b,ty,u:ty==='int'&&(o==='+'||o==='-'||o==='*')&&!!(a.u||b.u)}}return a}
 function tern(){const c=bin(0);if(is('?')){p++;const a=assign();eat(':');const b=assign();return{k:'?',c,a,b,ty:a.ty==='float'||b.ty==='float'?'float':a.ty}}return c}
 function assign(){const l=tern();if(pk().t==='op'&&['=','+=','-=','*=','/=','%=','&=','|=','^=','<<=','>>='].includes(pk().v)){const o=nx().v,r=assign();return{k:'as',o,l,r,ty:l.ty}}return l}
 function expr(){let e=assign();while(is(',')&&!0){p++;const b=assign();e={k:'seq',a:e,b,ty:b.ty}}return e}
 /* declarações */
 function declList(ty,isGlobal){const L=[];do{const nt=nx();if(nt.t!=='id')err('esperava o nome da variável',nt);const dims=[];while(is('[')){p++;dims.push(is(']')?null:expr());eat(']')}
   let init=null,cargs=null;if(is('=')){p++;init=assign()}else if(is('(')&&!dims.length){p++;cargs=args()}
   decl(nt.v,ty);L.push({n:nt.v,ty,dims,init,cargs,ln:nt.ln})}while(is(',')&&++p);eat(';');return{k:'decl',ty,L,g:isGlobal}}
 function stmt(){const t=pk();
  if(is('{')){p++;scopes.push({});const b=[];while(!is('}')){if(pk().t==='eof')err('faltou fechar "}"');b.push(stmt())}p++;scopes.pop();return{k:'blk',b}}
  if(is(';')){p++;return{k:'nop'}}
  if(is('if')){p++;eat('(');const c=expr();eat(')');const a=stmt();let b=null;if(is('else')){p++;b=stmt()}return{k:'if',c,a,b,ln:t.ln}}
  if(is('while')){p++;eat('(');const c=expr();eat(')');return{k:'while',c,b:stmt(),ln:t.ln}}
  if(is('do')){p++;const b=stmt();eat('while');eat('(');const c=expr();eat(')');eat(';');return{k:'do',c,b}}
  if(is('for')){p++;eat('(');scopes.push({});const i=is(';')?null:isType()?declList(readType()):({k:'ex',e:expr()});if(!i||i.k==='ex')eat(';');const c=is(';')?null:expr();eat(';');const s=is(')')?null:expr();eat(')');const b=stmt();scopes.pop();return{k:'for',i,c,s,b,ln:t.ln}}
  if(is('switch')){p++;eat('(');const e=expr();eat(')');eat('{');const cs=[];let cur=null;while(!is('}')){if(is('case')){p++;const v=tern();eat(':');cur={v,b:[]};cs.push(cur)}else if(is('default')){p++;eat(':');cur={v:null,b:[]};cs.push(cur)}else{if(!cur)err('esperava "case"');cur.b.push(stmt())}}p++;return{k:'sw',e,cs}}
  if(is('break')){p++;eat(';');return{k:'brk'}}if(is('continue')){p++;eat(';');return{k:'cont'}}
  if(is('return')){p++;const e=is(';')?null:expr();eat(';');return{k:'ret',e}}
  if(isType()&&!(pk(1).t==='op'&&['(','.','::','=','['].includes(pk(1).v)&&pk().t==='id'&&!TYH(pk().v))){const ty=readType();return declList(ty)}
  const e=expr();eat(';');return{k:'ex',e,ln:t.ln}}
 const prog={fns:{},glob:[],cls,enums};
 const params=()=>{const ps=[];eat('(');if(!is(')'))do{if(is('void')&&is(')',1)){p++;break}const pt=readType();let ref=false;if(is('&')){p++;ref=true}const pn=nx();let arr=false;while(is('[')){p++;if(!is(']'))expr();eat(']');arr=true}decl(pn.v,pt);ps.push({n:pn.v,ty:pt,arr,ref})}while(is(',')&&++p);eat(')');if(is('const'))p++;return ps};
 const fieldScope=C=>{const o={};let q=C;while(q){for(const f in q.ft)o[f]=q.ft[f];q=q.base?cls[q.base]:null}return o};
 const ctorDef=(C,name)=>{scopes.push(fieldScope(C));scopes.push({});const ps=params(),init=[];if(is(':')){p++;do{const f=nx().v;eat('(');const ex=is(')')?null:expr();eat(')');init.push([f,ex])}while(is(',')&&++p)}const b=is(';')?(p++,{k:'blk',b:[]}):stmt();scopes.pop();scopes.pop();C.ctors.push({ps,init,b})};
 const methDef=(C,ty,mn)=>{scopes.push(fieldScope(C));scopes.push({});const ps=params();if(is(';')){p++;scopes.pop();scopes.pop();return}const b=stmt();scopes.pop();scopes.pop();(C.methods[mn]=C.methods[mn]||[]).push({ps,b,ty})};
 function classBody(name,base){UT.add(name);const C=cls[name]=cls[name]||{name,fields:[],ft:{},order:[],methods:{},ctors:[],base};eat('{');
  while(!is('}')){if(pk().t==='eof')err('faltou fechar "}" da classe');if(is(';')){p++;continue}
   if(pk().t==='id'&&['public','private','protected'].includes(pk().v)&&is(':',1)){p+=2;continue}
   if(pk().t==='id'&&['friend','virtual','inline','explicit'].includes(pk().v)&&!(is('(',1))){p++;continue}
   if(pk().t==='id'&&pk().v===name&&is('(',1)){p++;ctorDef(C,name);continue}
   if(is('~')){p+=2;scopes.push({});params();if(is(';'))p++;else stmt();scopes.pop();continue}
   if(!isType())err(`dentro da classe "${name}" esperava um campo ou função e achei "${pk().v}"`);const ty=readType();
   if(pk().t==='id'&&is('(',1)){const mn=nx().v;methDef(C,ty,mn);continue}
   scopes.push({});const d=declList(ty);scopes.pop();for(const x of d.L){C.ft[x.n]=ty;C.order.push(x.n)}C.fields.push(d)}
  eat('}');return C}
 while(pk().t!=='eof'){if(is(';')){p++;continue}
  if(pk().t==='id'&&pk().v==='enum'){p++;if(pk().t==='id'&&pk().v==='class')p++;if(pk().t==='id')ENT.add(nx().v);eat('{');let v=0;while(!is('}')){const n=nx().v;if(is('=')){p++;const e=tern();v=e.k==='n'?e.v:e.k==='u'&&e.e.k==='n'?-e.e.v:v}enums[n]=v++;if(is(','))p++}eat('}');if(pk().t==='id'){prog.glob.push(declList('int',true));continue}eat(';');continue}
  if(pk().t==='id'&&pk().v==='typedef'&&tk[p+1]&&tk[p+1].v==='struct'){p+=2;if(pk().t==='id'&&!is('{'))p++;const tmp='__anon'+p;const C=classBody(tmp);const nm=nx().v;cls[nm]=C;C.name=nm;UT.add(nm);eat(';');continue}
  if((is('struct')||(pk().t==='id'&&pk().v==='class'))&&tk[p+1]&&tk[p+1].t==='id'&&(is('{',2)||is(':',2))){p++;const name=nx().v;let base=null;if(is(':')){p++;while(pk().t==='id'&&['public','private','protected','virtual'].includes(pk().v))p++;base=nx().v}classBody(name,base);
   if(pk().t==='id'){prog.glob.push(declList(name,true));continue}eat(';');continue}
  if(!isType())err(`esperava uma declaração (ex.: "void setup()") e achei "${pk().v}"`);const ty=readType();
  if(cls[ty]&&is('::')){p++;const mn=nx().v;if(mn===ty){ctorDef(cls[ty],ty);continue}err('esperava o construtor');}
  if(pk().t==='id'&&is('::',1)&&cls[pk().v]){const cn=nx().v;p++;if(is('~')){p+=2;scopes.push({});params();stmt();scopes.pop();continue}const mn=nx().v;methDef(cls[cn],ty,mn);continue}
  if(pk().t==='id'&&is('(',1)&&!LIBC.has(ty)&&!(cls[ty]&&!(isType(2)||is('void',2)||(is(')',2)&&is('{',3))))){const n=nx().v;p++;const ps=[];scopes.push({});if(!is(')'))do{if(is('void')&&is(')',1)){p++;break}const pt=readType();let ref=false;if(is('&')){p++;ref=true}const pn=nx();let arr=false;while(is('[')){p++;if(!is(']'))expr();eat(']');arr=true}decl(pn.v,pt);ps.push({n:pn.v,ty:pt,arr,ref})}while(is(',')&&++p);eat(')');
   if(is(';')){p++;scopes.pop();continue}const b=stmt();scopes.pop();prog.fns[n]={ps,b,ty};continue}
  prog.glob.push(declList(ty,true))}
 const KF=new Set(['F','pinMode','digitalWrite','digitalRead','analogRead','analogWrite','analogReference','analogReadResolution','delay','delayMicroseconds','millis','micros','map','constrain','min','max','abs','pow','sqrt','sq','sin','cos','tan','atan2','floor','ceil','round','log','exp','fabs','random','randomSeed','isDigit','isAlpha','bitRead','bitSet','bitClear','bitWrite','bit','highByte','lowByte','tone','noTone','pulseIn','makeKeymap','shiftOut','shiftIn','attachInterrupt','detachInterrupt','digitalPinToInterrupt','interrupts','noInterrupts','yield']);
 const MN=new Set();for(const c in cls)for(const m in cls[c].methods)MN.add(m);for(const c in cls)MN.add(c);
 const walk=n=>{if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(walk);return}if(n.k==='call'&&n.f&&n.f.k==='v'&&!KF.has(n.f.n)&&!prog.fns[n.f.n]&&!MN.has(n.f.n))throw{ln:n.ln||1,msg:`a função "${n.f.n}" não existe (confira o nome, maiúsculas e minúsculas)`};for(const k in n)if(k!=='ty')walk(n[k])};
 for(const f in prog.fns)walk(prog.fns[f].b);walk(prog.glob);for(const c in cls){const C=cls[c];for(const m in C.methods)C.methods[m].forEach(x=>walk(x.b));C.ctors.forEach(x=>{walk(x.b);walk(x.init)})}
 if(!prog.fns.setup)throw{ln:1,msg:'faltou a função "void setup()"'};if(!prog.fns.loop)throw{ln:1,msg:'faltou a função "void loop()"'};return prog}

/* ---------- execução ---------- */
const BRK={},CONT={};class RET{constructor(v){this.v=v}}
/* aritmética de unsigned long dá a volta em 32 bits, como no Arduino (millis() - inicio) */
const U32T=new Set(['unsigned long','uint32_t','unsigned','size_t','unsigned long int']);
const wrapT=(ty,v)=>{if(typeof v!=='number')return v;switch(ty){case'int':case'short':case'int16_t':return((Math.trunc(v)+32768)&65535)-32768;case'unsigned int':case'word':case'uint16_t':case'unsigned short':return Math.trunc(v)&65535;
 case'long':case'int32_t':return Math.trunc(v)|0;case'unsigned long':case'uint32_t':case'unsigned':case'size_t':return Math.trunc(v)>>>0;case'byte':case'uint8_t':case'unsigned char':return Math.trunc(v)&255;case'char':case'int8_t':return((Math.trunc(v)+128)&255)-128;
 case'bool':case'boolean':return v?1:0;case'float':case'double':return v;default:return v}};
/* extensões: MCUX = objetos globais (ex.: WiFi), MCULIB = classes de biblioteca, MCUH = avisos quando um pino de saída muda */
const MCUX={},MCULIB={},MCUH=[];
function isPy(s){s=String(s||'');if(!s.trim()||/\bvoid\s+(setup|loop)\s*\(/.test(s))return false;if(/^\s*(from\s+[\w.]+\s+import\b|import\s+[\w.]+\s*(,|as\b|$))/m.test(s))return true;return!/[{};]\s*(\/\/.*)?$/m.test(s)&&!/^\s*#\s*(include|define)\b/m.test(s)&&/^\s*(def\s+\w+\s*\(|while\s+.+:\s*$|for\s+\w+\s+in\b|print\s*\(|[A-Za-z_]\w*\s*=)/m.test(s)}
function progParse(s){return isPy(s)?{py:pyParse(s),glob:[],cls:{},fns:{}}:cParse(s)}
function mcuRuntime(c,prog,M){let API=null;const S0=rt.mcu[c.id],G={},cfg=M;let ops=0;const BUD=1500;const CL=prog.cls||{},thisSt=[];
 const dev=(type,idx,pin)=>{const k=pinKey(M,pin);if(!k)return[];return S.comps.filter(o=>o.type===type&&netOf(K(o.id,idx))===k)};
 const vt=()=>S0.vt,sp=s=>({wait:s});
 /* objetos de biblioteca */
 const LIB={
  Servo:()=>{const o={pin:-1,a:90,attach:p=>{o.pin=p},detach:()=>{o.pin=-1},attached:()=>o.pin>=0?1:0,read:()=>o.a,
   write:a=>{o.a=Math.max(0,Math.min(180,a<=180?a:(a-544)/(2400-544)*180));for(const s of dev('servo',2,o.pin)){const d=DEV(s);d.ang=o.a;d.lib=rt.simT}S0.dirty=1},writeMicroseconds:u=>o.write((u-544)/(2400-544)*180),readMicroseconds:()=>544+o.a/180*1856};return o},
  LiquidCrystal:(...a)=>{const rs=a[0];const o=lcdObj(()=>dev('lcd',3,rs));return o},
  LiquidCrystal_I2C:(addr,cols,rows)=>lcdObj(()=>S.comps.filter(x=>x.type==='lcdi2c'&&parseInt(x.addr)===addr&&(M.kind==='mbit'||netOf(K(x.id,2))===pinKey(M,M.sda)))),
  Adafruit_NeoPixel:(n,pin)=>{const o={n:n||1,pin,br:255,px:new Array(n||1).fill(0),begin:()=>{},show:()=>{npShow(o)},setPixelColor:(i,r,g,b)=>{if(i<0||i>=o.n)return;o.px[i]=g==null?r>>>0:((r&255)<<16)|((g&255)<<8)|(b&255)},
   getPixelColor:i=>o.px[i]||0,clear:()=>o.px.fill(0),fill:(cc=0,f=0,cnt=0)=>{const e=cnt?Math.min(o.n,f+cnt):o.n;for(let i=f;i<e;i++)o.px[i]=cc>>>0},setBrightness:b=>{o.br=b&255},getBrightness:()=>o.br,numPixels:()=>o.n,setPin:p=>{o.pin=p},updateLength:n=>{o.n=n;o.px=new Array(n).fill(0)},
   Color:(r,g,b)=>((r&255)<<16)|((g&255)<<8)|(b&255),ColorHSV:(h=0,s=255,v=255)=>hsv(h,s,v),gamma32:x=>x};return o},
  Keypad:(km,rp,cp)=>{const o={last:0,getKey:()=>{const k=S.comps.find(x=>x.type==='kp4'&&netOf(K(x.id,0))===pinKey(M,rp[0]));const kk=k&&rt.kp&&rt.kp[k.id];const ch=kk?kk.key.charCodeAt(0):0;if(ch&&ch!==o.last){o.last=ch;const r=kk.r,q=kk.c;return km&&km[r]&&km[r][q]!=null?km[r][q]:ch}if(!ch)o.last=0;return 0},getState:()=>0,setDebounceTime:()=>{},waitForKey:()=>0};return o},
  IRrecv:pin=>{const o={pin,seen:rt.ir?rt.ir.n:0,enableIRIn:()=>{},begin:p=>{if(p!=null)o.pin=p},resume:()=>{},blink13:()=>{},
   decode:res=>{const r=S.comps.find(x=>x.type==='irrx'&&netOf(K(x.id,0))===pinKey(M,o.pin)&&VD(x,2,1)>=2.5);if(!r||!rt.ir||rt.ir.n===o.seen)return 0;o.seen=rt.ir.n;const v=IRVAL(rt.ir.cmd);if(res&&typeof res==='object'){res.value=v;res.decode_type=1;res.bits=32}
    o.decodedIRData={command:rt.ir.cmd,address:0,decodedRawData:(((~rt.ir.cmd&255)<<24)|(rt.ir.cmd<<16)|0xFF00)>>>0,protocol:8};return 1},decodedIRData:{command:0,address:0,decodedRawData:0}};return o},
  decode_results:()=>({value:0,decode_type:0,bits:0}),
  TM1637Display:(ck,dio)=>{const o={br:7,on:true,setBrightness:(b,on=true)=>{o.br=b;o.on=!!on;o.put(null)},seg:[0,0,0,0],colon:false,
   put:(arr,len=4,pos=0)=>{if(arr)for(let i=0;i<len&&pos+i<4;i++)o.seg[pos+i]=arr[i]&255;for(const d of dev('tm1637',0,ck)){const z=DEV(d);z.seg=o.on?o.seg.map(x=>x&127):[0,0,0,0];z.colon=o.on&&!!(o.seg[1]&128)}S0.dirty=1},
   setSegments:(a,len=4,pos=0)=>o.put(Array.isArray(a)?a:[a],len,pos),clear:()=>{o.seg=[0,0,0,0];o.put(null)},encodeDigit:d=>DIG7[d&15],
   showNumberDec:(n,lz=0,len=4,pos=0)=>o.showNumberDecEx(n,0,lz,len,pos),showNumberDecEx:(n,dots=0,lz=0,len=4,pos=0)=>{const neg=n<0;let s=String(Math.abs(Math.trunc(n)));if(lz)s=s.padStart(len,'0');if(neg)s='-'+s;s=s.slice(-len).padStart(len,' ');
    const a=[...s].map((ch,i)=>(ch===' '?0:ch==='-'?64:DIG7[+ch])|((dots>>(7-i))&1?128:0));o.put(a,len,pos)},showNumberHexEx:(n,dots=0,lz=0,len=4,pos=0)=>{let s=(n>>>0).toString(16);if(lz)s=s.padStart(len,'0');s=s.slice(-len).padStart(len,' ');o.put([...s].map(ch=>ch===' '?0:DIG7[parseInt(ch,16)]),len,pos)}};return o},
  Adafruit_Microbit_Matrix:()=>{const o={begin:()=>{},clear:()=>{mx(new Array(25).fill(0))},fillScreen:v=>mx(new Array(25).fill(v?1:0)),drawPixel:(x,y,v)=>{const d=DEV(c);d.mx=d.mx||new Array(25).fill(0);if(x>=0&&x<5&&y>=0&&y<5)d.mx[y*5+x]=v?1:0;S0.dirty=1},
   print:function*(x){const s=String(fmtV(x));for(const ch of s){mx(FONT5(ch));yield sp(.4)}if(s.length>1)mx(new Array(25).fill(0))},show:b=>{if(Array.isArray(b)){const m=[];for(let y=0;y<5;y++)for(let x=0;x<5;x++)m.push((b[y]>>(4-x))&1);mx(m)}},scrollText:function*(s){yield*o.print(s)}};const mx=a=>{DEV(c).mx=a;S0.dirty=1};return o}};
 function lcdObj(find){const o={cols:16,rows:2,lines:['',''],cur:[0,0],on:true,curs:false,bl:true,
  sync:()=>{for(const d of find()){const z=DEV(d);z.lines=o.lines.map(l=>l.padEnd(16,' ').slice(0,16));z.cur=o.cur.slice();z.cursor=o.curs;z.on=o.on;z.bl=o.bl}S0.dirty=1},
  begin:(cc=16,r=2)=>{o.cols=cc;o.rows=r;o.clear()},init:()=>o.clear(),clear:()=>{o.lines=['                ','                '];o.cur=[0,0];o.sync()},home:()=>{o.cur=[0,0];o.sync()},
  setCursor:(x,y)=>{o.cur=[Math.max(0,Math.min(39,x)),Math.max(0,Math.min(1,y))];o.sync()},write:ch=>o.print(typeof ch==='number'?String.fromCharCode(ch):String(ch)),
  print:(x,f)=>{const s=fmtV(x,f);for(const ch of s){const[cx,cy]=o.cur;const L=(o.lines[cy]||'').padEnd(40,' ');o.lines[cy]=(L.slice(0,cx)+ch+L.slice(cx+1)).replace(/\s+$/,'');o.cur=[cx+1,cy]}o.sync();return s.length},
  cursor:()=>{o.curs=true;o.sync()},noCursor:()=>{o.curs=false;o.sync()},blink:()=>{o.curs=true;o.sync()},noBlink:()=>{},display:()=>{o.on=true;o.sync()},noDisplay:()=>{o.on=false;o.sync()},
  backlight:()=>{o.bl=true;o.sync()},noBacklight:()=>{o.bl=false;o.sync()},scrollDisplayLeft:()=>{o.lines=o.lines.map(l=>l.slice(1));o.sync()},scrollDisplayRight:()=>{o.lines=o.lines.map(l=>' '+l);o.sync()},
  createChar:()=>{},leftToRight:()=>{},rightToLeft:()=>{},autoscroll:()=>{},noAutoscroll:()=>{}};return o}
 function npShow(o){const comps=[];let k=pinKey(M,o.pin);const seen=new Set();while(k){const n=S.comps.find(x=>x.type==='neopx'&&!seen.has(x.id)&&netOf(K(x.id,2))===k);if(!n)break;seen.add(n.id);comps.push(n);k=netOf(K(n.id,3))}
  let i=0;const br=o.br||255;for(const n of comps){const cnt=n.shape==='px'?1:Math.max(1,+n.n||8),d=DEV(n);d.px=[];for(let q=0;q<cnt;q++,i++){const v=o.px[i]||0,sc=x=>Math.round((x&255)*br/255);d.px.push((sc(v>>16)<<16)|(sc(v>>8)<<8)|sc(v))}}S0.dirty=1}
 /* funções e constantes do Arduino */
 const pinIn=n=>{if(M.kind==='mbit'&&(n===5||n===11)){const d=DEV(c);return(n===5?d.ba:d.bb)?0:1}const i=M.pins[n];if(i==null||!rt.A)return 0;const v=rt.A.vdc(K(c.id,i))-rt.A.vdc(K(c.id,M.gnd));return v>M.vref*.5?1:0};
 const vccOk=()=>M.self||(rt.A&&rt.A.vdc(K(c.id,M.vcc))-rt.A.vdc(K(c.id,M.gnd))>=2.7);
 const setOut=(n,v,pwm)=>{if(M.pins[n]==null){S0.out[n]=pwm==null?(v?1:0):Math.max(0,Math.min(255,v))/255;S0.dirty=1;return}const o=S0.out;const nv=pwm==null?(v?1:0):Math.max(0,Math.min(255,v))/255;if(o[n]!==nv){o[n]=nv;S0.dirty=1;if(API)for(const h of MCUH)h(API,n)}};
 const ser=s=>{S0.ser=(S0.ser+s).slice(-6000);S0.serDirty=1};
 const BUILT={HIGH:1,LOW:0,INPUT:0,OUTPUT:1,INPUT_PULLUP:2,LED_BUILTIN:M.led,true:1,false:0,PI:Math.PI,HALF_PI:Math.PI/2,TWO_PI:2*Math.PI,DEG_TO_RAD:Math.PI/180,RAD_TO_DEG:180/Math.PI,DEC:10,HEX:16,BIN:2,OCT:8,
  A0:M.kind==='uno'?14:0,A1:M.kind==='uno'?15:1,A2:M.kind==='uno'?16:2,A3:M.kind==='uno'?17:3,A4:18,A5:19,NEO_GRB:82,NEO_RGB:6,NEO_RGBW:198,NEO_KHZ800:0,NEO_KHZ400:256,
  MSBFIRST:1,LSBFIRST:0,PIN_BUTTON_A:5,PIN_BUTTON_B:11,LED_ON:1,LED_OFF:0,NO_KEY:0,ENABLE_LED_FEEDBACK:1,DISABLE_LED_FEEDBACK:0,CHANGE:1,RISING:3,FALLING:2,SEG_A:1,SEG_B:2,SEG_C:4,SEG_D:8,SEG_E:16,SEG_F:32,SEG_G:64,SEG_DP:128};
 if(M.A)for(let i=0;i<16;i++)BUILT['A'+i]=M.A[i];Object.assign(BUILT,prog.enums||{});
 const FN={shiftOut:(dp,cp,ord,val)=>{const kd=pinKey(M,dp),kc=pinKey(M,cp);val&=255;for(const ic of S.comps){if(ic.type!=='ic'||ic.k!=='74HC595')continue;if(netOf(K(ic.id,13))!==kd||netOf(K(ic.id,10))!==kc)continue;const st=icSt(ic);st.sr=st.sr||0;for(let i=0;i<8;i++){const b=ord?(val>>(7-i))&1:(val>>i)&1;st.sr=((st.sr<<1)|b)&255}}
   S0.mode[dp]=1;S0.mode[cp]=1;setOut(dp,ord?val&1:(val>>7)&1);setOut(cp,0);S0.dirty=1},shiftIn:(dp,cp,ord)=>{let v=0;for(let i=0;i<8;i++){const b=pinIn(dp);v=ord?(v<<1)|b:v|(b<<i)}return v&255},pinMode:(n,m)=>{if((S0.mode[n]===2)!==(m===2))S0.modeCh=1;S0.mode[n]=m;if(m===1&&S0.out[n]==null)S0.out[n]=0;S0.dirty=1},digitalWrite:(n,v)=>{if(S0.mode[n]===1||S0.mode[n]==null){S0.mode[n]=1;setOut(n,v)}else if(S0.mode[n]===0&&v){S0.mode[n]=2;S0.dirty=1}},
  digitalRead:n=>pinIn(n),analogRead:n=>{if(M.anPin){const ii=M.anPin[n]!=null?M.anPin[n]:M.anPin[M.A&&M.A[n]];if(ii==null||!rt.A)return 0;const v=rt.A.vdc(K(c.id,ii))-rt.A.vdc(K(c.id,M.gnd));return Math.max(0,Math.min(M.adc,Math.round(v/M.vref*M.adc)))}const a=n>=14?n-14:n,ii=M.kind==='uno'?M.an[a]:M.an[n>=14?a:n];if(ii==null||!rt.A)return 0;const v=rt.A.vdc(K(c.id,ii))-rt.A.vdc(K(c.id,M.gnd));return Math.max(0,Math.min(1023,Math.round(v/M.vref*1023)))},
  analogWrite:(n,v)=>{S0.mode[n]=1;setOut(n,v,true)},analogReference:()=>{},analogReadResolution:()=>{},
  delay:function*(ms){yield sp(Math.max(0,ms)/1000)},delayMicroseconds:function*(us){yield sp(Math.max(0,us)/1e6)},millis:()=>Math.floor(vt()*1000)>>>0,micros:()=>Math.floor(vt()*1e6)>>>0,
  map:(x,a,b,c2,d)=>b===a?c2:Math.trunc((x-a)*(d-c2)/(b-a)+c2),constrain:(x,a,b)=>Math.min(Math.max(x,a),b),min:Math.min,max:Math.max,abs:Math.abs,pow:Math.pow,sqrt:Math.sqrt,sq:x=>x*x,sin:Math.sin,cos:Math.cos,tan:Math.tan,atan2:Math.atan2,floor:Math.floor,ceil:Math.ceil,round:Math.round,log:Math.log,exp:Math.exp,fabs:Math.abs,
  random:(a,b)=>b==null?Math.floor(Math.random()*a):Math.floor(a+Math.random()*(b-a)),randomSeed:()=>{},isDigit:ch=>ch>=48&&ch<=57?1:0,isAlpha:ch=>/[A-Za-z]/.test(String.fromCharCode(ch))?1:0,
  bitRead:(x,b)=>(x>>b)&1,bitSet:(x,b)=>x|(1<<b),bitClear:(x,b)=>x&~(1<<b),bitWrite:(x,b,v)=>v?x|(1<<b):x&~(1<<b),bit:b=>1<<b,highByte:x=>(x>>8)&255,lowByte:x=>x&255,
  tone:(n,f,d)=>{for(const z of [...dev('piezo',0,n),...dev('piezo',1,n)]){const q=DEV(z);q.tone=f;q.until=d?rt.simT+d/1000:0}S0.out[n]=1;S0.mode[n]=1;S0.dirty=1},noTone:n=>{for(const z of [...dev('piezo',0,n),...dev('piezo',1,n)])DEV(z).tone=0;S0.out[n]=0;S0.dirty=1},
  pulseIn:function*(n,lvl,to=1e6){const hs=[...dev('hcsr04',2,n),...dev('ping',2,n)].filter(h=>h.type==='ping'?VD(h,1,0)>=4:VD(h,0,3)>=4);if(!hs.length){yield sp(Math.min(to,1e6)/1e6);return 0}const us=Math.round((+hs[0].dist||0)*58.3);yield sp(us/1e6);return us>to?0:us},
  makeKeymap:k=>k,attachInterrupt:()=>{ser('[aviso] attachInterrupt ainda não é simulado; use leitura no loop()\n')},detachInterrupt:()=>{},digitalPinToInterrupt:n=>n,interrupts:()=>{},noInterrupts:()=>{},yield:function*(){yield sp(0)}};
 const Serial={begin:()=>{},end:()=>{},print:(x,f)=>{const s=fmtV(x,f);ser(s);return s.length},println:(x,f)=>{const s=x===undefined?'':fmtV(x,f);ser(s+'\n');return s.length+2},write:x=>{ser(typeof x==='number'?String.fromCharCode(x):String(x))},available:()=>S0.serIn.length,
  read:()=>{if(!S0.serIn.length)return -1;const ch=S0.serIn.charCodeAt(0);S0.serIn=S0.serIn.slice(1);return ch},peek:()=>S0.serIn.length?S0.serIn.charCodeAt(0):-1,readString:()=>{const s=S0.serIn;S0.serIn='';return s},
  readStringUntil:ch=>{const t=String.fromCharCode(ch),i=S0.serIn.indexOf(t);if(i<0){const s=S0.serIn;S0.serIn='';return s}const s=S0.serIn.slice(0,i);S0.serIn=S0.serIn.slice(i+1);return s},
  parseInt:()=>{const m=/-?\d+/.exec(S0.serIn);if(!m)return 0;S0.serIn=S0.serIn.slice(m.index+m[0].length);return+m[0]},parseFloat:()=>{const m=/-?\d+(\.\d+)?/.exec(S0.serIn);if(!m)return 0;S0.serIn=S0.serIn.slice(m.index+m[0].length);return+m[0]},flush:()=>{},setTimeout:()=>{}};
 const Wire={tx:null,rx:[],begin:()=>{},beginTransmission:a=>{Wire.tx={a,d:[]}},write:v=>{if(Wire.tx)Wire.tx.d.push(...(typeof v==='string'?[...v].map(x=>x.charCodeAt(0)):[v&255]))},
  endTransmission:()=>{const t=Wire.tx;Wire.tx=null;if(!t)return 4;const pc=pcfAt(t.a);if(!pc)return 2;if(t.d.length){icSt(pc).port=t.d[t.d.length-1];S0.dirty=1}return 0},
  requestFrom:(a,n)=>{const pc=pcfAt(a);if(!pc)return 0;const P=[3,4,5,6,8,9,10,11];let v=0;P.forEach((i,k)=>{if(rt.A&&rt.A.vdc(K(pc.id,i))-rt.A.vdc(K(pc.id,7))>2)v|=1<<k});Wire.rx=[v];return 1},read:()=>Wire.rx.length?Wire.rx.shift():-1,available:()=>Wire.rx.length,setClock:()=>{}};
 const pcfAt=a=>S.comps.find(x=>x.type==='ic'&&x.k==='PCF8574'&&(M.kind==='mbit'||netOf(K(x.id,14))===pinKey(M,M.sda))&&(0x20+[0,1,2].reduce((s,i)=>s+((rt.A&&rt.A.vdc(K(x.id,i))-rt.A.vdc(K(x.id,7))>2?1:0)<<i),0))===a);
 const IrReceiver=LIB.IRrecv(-1);LIB.SoftwareSerial=()=>Serial;
 const EE=EEMEM[c.id]||(EEMEM[c.id]=new Array(M.kind==='tiny'?512:1024).fill(255));EE.read=a=>EE[a]??255;EE.write=(a,v)=>{if(a>=0&&a<EE.length)EE[a]=v&255};EE.update=EE.write;EE.length_=EE.length;EE.put=(a,v)=>{EE.__o=EE.__o||{};EE.__o[a]=clone(v);return v};EE.get=(a,v)=>EE.__o&&a in EE.__o?clone(EE.__o[a]):v;EE.begin=()=>{};EE.commit=()=>{};
 const fmtV=(x,f)=>{if(Array.isArray(x))return x.__chars||x.__s?String.fromCharCode(...x.filter(v=>v)):x.join(',');if(typeof x==='string')return x;if(typeof x==='object'&&x&&x.__str!=null)return x.__str;if(f===16)return(x>>>0).toString(16).toUpperCase();if(f===2)return(x>>>0).toString(2);if(f===8)return(x>>>0).toString(8);
  if(typeof x==='number'&&f!=null&&f<10&&f>=0&&!Number.isInteger(f))return String(x);return String(x)};
 /* avaliação (geradores, para delay() funcionar dentro de funções) */
 const scopes=[G];const look=n=>{for(let i=scopes.length-1;i>=0;i--)if(n in scopes[i])return scopes[i];return null};
 const tick=function*(){if(++ops>=BUD){ops=0;yield{budget:1}}};
 const clone=o=>{if(Array.isArray(o)){const a=o.map(clone);if(o.__chars)a.__chars=1;if(o.__s)a.__s=1;return a}if(o&&o.__cls){const n={};for(const k in o)n[k]=clone(o[k]);return n}return o};
 const ftOf=cn=>{const o={};let q=CL[cn];while(q){for(const f in q.ft)if(!(f in o))o[f]=q.ft[f];q=q.base?CL[q.base]:null}return o};
 const orderOf=cn=>{const C=CL[cn];if(!C)return[];return[...orderOf(C.base),...C.order]};
 const defV=ty=>CL[ty]?instSync(ty):LIB[ty]?LIB[ty]():ty==='String'?'':0;
 function instSync(cn){const o={__cls:cn};let q=CL[cn];const chain=[];while(q){chain.unshift(q);q=q.base?CL[q.base]:null}for(const C of chain)for(const d of C.fields)for(const x of d.L){const n=x.init&&(x.init.k==='n'||x.init.k==='s')?x.init.v:null;o[x.n]=x.dims.length?new Array(x.dims[0]&&x.dims[0].k==='n'?x.dims[0].v:0).fill(0):n!=null?toTy(d.ty,n):defV(d.ty)}return o}
 const aggr=(cn,arr)=>{const o=instSync(cn),ft=ftOf(cn);orderOf(cn).forEach((f,i)=>{if(i<arr.length)o[f]=toTy(ft[f],arr[i])});return o};
 const toTy=(ty,v)=>{if(CL[ty]){if(Array.isArray(v))return aggr(ty,v);return v&&v.__cls?clone(v):v}if(ty==='String'||ty==='str')return typeof v==='string'?v:String(v);if(ty==='float'||ty==='double')return+v;if(ty==='char'&&typeof v==='string')return v.charCodeAt(0)||0;return wrapT(ty,typeof v==='string'?parseFloat(v)||0:+v||0)};
 function* ev(e){yield* tick();switch(e.k){
  case'n':return e.v;case's':return e.v;case'arr':{const a=[];for(const i of e.items)a.push(yield* ev(i));return a}
  case'v':{const s=look(e.n);if(s)return s[e.n].v;if(e.n==='this'&&thisSt.length)return thisSt[thisSt.length-1];if(e.n in BUILT)return BUILT[e.n];if(e.n==='Serial')return Serial;if(e.n==='EEPROM')return EE;if(e.n==='Wire')return Wire;if(e.n==='IrReceiver')return IrReceiver;if(e.n in XO)return XO[e.n];if(e.n in FN||prog.fns[e.n])return{__fn:e.n};
   if(e.n==='Adafruit_NeoPixel')return LIB.Adafruit_NeoPixel(1,0);throw{ln:e.ln||0,msg:`"${e.n}" não foi declarado`}}
  case'm':{if(e.o.k==='v'&&e.o.n==='Adafruit_NeoPixel')return LIB.Adafruit_NeoPixel(1,0)[e.n];const o=yield* ev(e.o);if(typeof o==='string'){return{__str:o,__m:e.n}}if(o==null)throw{msg:`acesso a "${e.n}" de algo vazio`};const v=o[e.n];if(typeof v==='function')return v.bind?{__bound:v}:v;return v}
  case'idx':{const o=yield* ev(e.o),i=yield* ev(e.i);if(typeof o==='string')return o.charCodeAt(i)||0;if(!Array.isArray(o))throw{msg:'índice [ ] em algo que não é vetor'};return o[i]==null?0:o[i]}
  case'call':return yield* call(e);
  case'ctor':{const a=[];for(const x of e.a)a.push(yield* ev(x));if(e.cls==='String'){const v=a[0];if(a[1]===16)return(v>>>0).toString(16);if(a[1]===2)return(v>>>0).toString(2);if(typeof a[1]==='number'&&e.a[0].ty==='float')return(+v).toFixed(a[1]);return v==null?'':typeof v==='number'&&e.a[0].ty==='float'?(+v).toFixed(2):typeof v==='number'&&e.a[0].ty==='char'?String.fromCharCode(v):String(v)}
   if(CL[e.cls])return yield* inst(e.cls,a);if(LIB[e.cls])return LIB[e.cls](...a);if(e.cls.match(/int|long|byte|char|float|double|word|bool/))return toTy(e.cls,a[0]);throw{msg:`tipo "${e.cls}" desconhecido`}}
  case'cast':{const v=yield* ev(e.e);return toTy(e.cty,v)}
  case'sizeof':{const v=e.e&&e.e.k?yield* ev(e.e):2;return Array.isArray(v)?v.length*(e.e.ty==='char'||e.e.ty==='int'&&false?1:2):typeof v==='string'?v.length+1:2}
  case'u':{const v=yield* ev(e.e);return e.o==='!'?(v?0:1):e.o==='-'?-v:~v}
  case'pre':case'post':{const old=yield* ev(e.e),nv=old+(e.o==='++'?1:-1);yield* store(e.e,nv);return e.k==='pre'?nv:old}
  case'?':return(yield* ev(e.c))?yield* ev(e.a):yield* ev(e.b);
  case'seq':yield* ev(e.a);return yield* ev(e.b);
  case'as':{let v=yield* ev(e.r);if(e.o!=='='){const o=yield* ev(e.l);v=binop(e.o.slice(0,-1),o,v,e.l.ty,e.r.ty)}yield* store(e.l,v);return v}
  case'b':{if(e.o==='&&'){const a=yield* ev(e.a);return a?((yield* ev(e.b))?1:0):0}if(e.o==='||'){const a=yield* ev(e.a);return a?1:((yield* ev(e.b))?1:0)}const a=yield* ev(e.a),b=yield* ev(e.b);const r=binop(e.o,a,b,e.a.ty,e.b.ty);return e.u&&typeof r==='number'?Math.trunc(r)>>>0:r}}
  throw{msg:'expressão não suportada'}}
 const binop=(o,a,b,ta,tb)=>{const sx=x=>typeof x==='string'?x:x&&x.__str!=null?x.__str:null;if(o==='+'&&(typeof a==='string'||typeof b==='string')){const f=(x,t)=>typeof x==='string'?x:t==='char'?String.fromCharCode(x):t==='float'?(+x).toFixed(2):String(x);return f(a,ta)+f(b,tb)}
  if((o==='=='||o==='!=')&&(typeof a==='string'||typeof b==='string')){const r=String(sx(a)??a)===String(sx(b)??b);return(o==='=='?r:!r)?1:0}
  switch(o){case'+':return a+b;case'-':return a-b;case'*':return a*b;case'/':if(b===0)return 0;return(ta==='float'||tb==='float')?a/b:Math.trunc(a/b);case'%':return b===0?0:(ta==='float'||tb==='float')?a%b:Math.trunc(a)%Math.trunc(b);
   case'<<':return a<<b;case'>>':return a>>b;case'&':return a&b;case'|':return a|b;case'^':return a^b;case'==':return a==b?1:0;case'!=':return a!=b?1:0;case'<':return a<b?1:0;case'<=':return a<=b?1:0;case'>':return a>b?1:0;case'>=':return a>=b?1:0}return 0};
 function* store(t,v){if(t.k==='v'){const s=look(t.n);if(!s)throw{msg:`"${t.n}" não foi declarado`};s[t.n].v=toTy(s[t.n].ty,v);return}
  if(t.k==='idx'){const o=yield* ev(t.o),i=yield* ev(t.i);if(Array.isArray(o)){o[i]=v;return}if(typeof o==='string'&&t.o.k==='v'){const s=look(t.o.n);const str=s[t.o.n].v;s[t.o.n].v=str.slice(0,i)+String.fromCharCode(v)+str.slice(i+1);return}}
  if(t.k==='m'){const o=yield* ev(t.o);if(o&&typeof o==='object'){const ft=o.__cls?ftOf(o.__cls):null;o[t.n]=ft&&ft[t.n]?toTy(ft[t.n],v):v;return}}throw{msg:'não dá para atribuir a isso'}}
 function findM(cn,n,na){let q=CL[cn];while(q){const L=q.methods[n];if(L){return L.find(m=>m.ps.length===na)||L[0]}q=q.base?CL[q.base]:null}return null}
 function* callM(obj,m,a){const ft=ftOf(obj.__cls),fs={this:{ty:obj.__cls,v:obj}};for(const f in ft){const ty=ft[f];fs[f]={ty,get v(){return obj[f]},set v(x){obj[f]=x}}}
  const ps={};m.ps.forEach((q,i)=>ps[q.n]={ty:q.ty,v:q.arr||q.ref?a[i]:toTy(q.ty,a[i])});if(scopes.length>200)throw{msg:'recursão demais (função chamando a si mesma sem parar)'};scopes.push(fs,ps);thisSt.push(obj);
  try{yield* run(m.b)}catch(r){if(r instanceof RET)return m.ty==='void'?undefined:toTy(m.ty,r.v);throw r}finally{thisSt.pop();scopes.pop();scopes.pop()}return undefined}
 function* inst(cn,a=[]){const C=CL[cn],o={__cls:cn};const chain=[];let q=C;while(q){chain.unshift(q);q=q.base?CL[q.base]:null}
  for(const K0 of chain){scopes.push({});try{for(const d of K0.fields)yield* declare(d);const top=scopes[scopes.length-1];for(const f in top)o[f]=top[f].v}finally{scopes.pop()}}
  const ct=C.ctors.find(x=>x.ps.length===a.length)||(a.length?null:C.ctors.find(x=>!x.ps.length));
  if(ct){const ft=ftOf(cn),fs={this:{ty:cn,v:o}};for(const f in ft){const ty=ft[f];fs[f]={ty,get v(){return o[f]},set v(x){o[f]=x}}}const ps={};ct.ps.forEach((q,i)=>ps[q.n]={ty:q.ty,v:q.arr||q.ref?a[i]:toTy(q.ty,a[i])});scopes.push(fs,ps);thisSt.push(o);
   try{for(const[f,ex]of ct.init){if(ft[f]){const v=ex?yield* ev(ex):defV(ft[f]);o[f]=toTy(ft[f],v)}}yield* run(ct.b)}catch(r){if(!(r instanceof RET))throw r}finally{thisSt.pop();scopes.pop();scopes.pop()}}
  else if(a.length){const ft=ftOf(cn);orderOf(cn).forEach((f,i)=>{if(i<a.length)o[f]=toTy(ft[f],a[i])})}return o}
 function* call(e){const a=[];for(const x of e.a)a.push(yield* ev(x));
  if(e.f.k==='v'&&thisSt.length){const T=thisSt[thisSt.length-1],m=findM(T.__cls,e.f.n,a.length);if(m)return yield* callM(T,m,a)}
  if(e.f.k==='v'&&prog.fns[e.f.n]){const f=prog.fns[e.f.n],sc={};f.ps.forEach((p,i)=>sc[p.n]={ty:p.ty,v:p.arr||(p.ref&&CL[p.ty])?a[i]:toTy(p.ty,a[i])});if(scopes.length>200)throw{msg:'recursão demais (função chamando a si mesma sem parar)'};scopes.push(sc);
   try{yield* run(f.b)}catch(r){if(r instanceof RET){scopes.pop();return f.ty==='void'?undefined:toTy(f.ty,r.v)}scopes.pop();throw r}scopes.pop();return undefined}
  if(e.f.k==='v'){const f=FN[e.f.n];if(!f)throw{msg:`a função "${e.f.n}" não existe (ou faltou declarar)`};const r=f(...a);if(r&&typeof r.next==='function')return yield* r;
   if(e.f.n==='digitalWrite'||e.f.n==='analogWrite')yield* tick();else if(e.f.n==='pinMode'&&S0.modeCh)yield{budget:1};return r}
  if(e.f.k==='m'){let o;if(e.f.o.k==='v'&&e.f.o.n==='Adafruit_NeoPixel')o=LIB.Adafruit_NeoPixel(1,0);else o=yield* ev(e.f.o);
   if(typeof o==='string'||(o&&o.__str!=null)){return strM(e.f.o,typeof o==='string'?o:o.__str,e.f.n,a,e)}
   if(o==null)throw{msg:`"${e.f.n}" chamado em algo vazio`};if(o===EE){if(e.f.n==='length')return EE.length;if(e.f.n==='get'){const r=EE.get(a[0],a[1]);if(e.a[1])yield* store(e.a[1],r);return r}}if(o.__cls){const m=findM(o.__cls,e.f.n,a.length);if(m)return yield* callM(o,m,a);throw{msg:`a classe "${o.__cls}" não tem a função "${e.f.n}"`}}const fn=o[e.f.n];if(typeof fn!=='function')throw{msg:`"${e.f.n}" não existe nesse objeto`};
   if(e.f.n==='print'||e.f.n==='println'){if(e.a[0]&&e.a[0].ty==='float'&&typeof a[0]==='number')a[0]=a[0].toFixed(a[1]!=null&&e.a[1]&&e.a[1].k==='n'?a[1]:2),a.length=1;else if(e.a[0]&&e.a[0].ty==='char'&&typeof a[0]==='number')a[0]=String.fromCharCode(a[0]);else if(e.a[0]&&e.a[0].ty==='bool')a[0]=a[0]?1:0;else if(typeof a[0]==='number'&&!Number.isInteger(a[0]))a[0]=a[0].toFixed(a[1]!=null&&e.a[1]&&e.a[1].k==='n'?a[1]:2),a.length=1}
   const r=fn(...a);if(r&&typeof r.next==='function')return yield* r;return r}
  throw{msg:'chamada não suportada'}}
 function* strM(oe,s,m,a){const set=v=>{if(oe.k==='v'){const sc=look(oe.n);if(sc)sc[oe.n].v=v}};switch(m){case'length':return s.length;case'charAt':return s.charCodeAt(a[0])||0;case'substring':return s.substring(a[0],a[1]);case'indexOf':return s.indexOf(typeof a[0]==='number'?String.fromCharCode(a[0]):a[0],a[1]||0);
  case'lastIndexOf':return s.lastIndexOf(typeof a[0]==='number'?String.fromCharCode(a[0]):a[0]);case'toInt':return parseInt(s)||0;case'toFloat':return parseFloat(s)||0;case'equals':return s===String(a[0])?1:0;case'equalsIgnoreCase':return s.toLowerCase()===String(a[0]).toLowerCase()?1:0;
  case'startsWith':return s.startsWith(a[0])?1:0;case'endsWith':return s.endsWith(a[0])?1:0;case'concat':set(s+String(a[0]));return 1;case'trim':set(s.trim());return;case'toUpperCase':set(s.toUpperCase());return;case'toLowerCase':set(s.toLowerCase());return;case'replace':set(s.split(String(a[0])).join(String(a[1])));return;
  case'remove':set(s.slice(0,a[0])+(a[1]!=null?s.slice(a[0]+a[1]):''));return;case'c_str':return s;case'isEmpty':return s.length?0:1}throw{msg:`String não tem "${m}"`}}
 function* declare(d){for(const x of d.L){let v;const dims=[];for(const q of x.dims)dims.push(q?yield* ev(q):null);
   if(x.init){v=yield* ev(x.init);if(dims.length&&typeof v==='string'&&d.ty==='char'){v=[...v].map(ch=>ch.charCodeAt(0));v.__s=1}}
   if(dims.length){const mk=(k)=>{const n=dims[k]==null?(Array.isArray(v)?v.length:0):dims[k];if(k===dims.length-1){const z=new Array(n).fill(0);return z}return Array.from({length:n},()=>mk(k+1))};
    if(!Array.isArray(v)){v=mk(0)}else{const base=mk(0);const fill=(dst,src)=>{for(let i=0;i<src.length&&i<dst.length;i++){if(Array.isArray(dst[i]))fill(dst[i],src[i]||[]);else dst[i]=src[i]}};if(dims[0]!=null||dims.length>1){fill(base,v);v=base}}
    if(d.ty==='char'&&dims.length===1)v.__chars=1}
   else if(x.cargs){const a=[];for(const q of x.cargs)a.push(yield* ev(q));v=CL[d.ty]?yield* inst(d.ty,a):LIB[d.ty]?LIB[d.ty](...a):d.ty==='String'?String(a[0]??''):toTy(d.ty,a[0])}
   else if(v===undefined)v=CL[d.ty]?yield* inst(d.ty,[]):LIB[d.ty]?LIB[d.ty]():d.ty==='String'?'':0;
   if(dims.length===1&&CL[d.ty]&&Array.isArray(v))for(let i=0;i<v.length;i++){const el=v[i];v[i]=Array.isArray(el)?aggr(d.ty,el):el&&el.__cls?clone(el):yield* inst(d.ty,[])}
   if(!dims.length&&!x.cargs&&x.init&&!LIB[d.ty])v=toTy(d.ty,v);
   scopes[scopes.length-1][x.n]={ty:d.ty,v}}}
 function* run(s){yield* tick();switch(s.k){
  case'blk':scopes.push({});try{for(const q of s.b)yield* run(q)}finally{scopes.pop()}return;
  case'nop':return;case'ex':yield* ev(s.e);return;case'decl':yield* declare(s);return;
  case'if':if(yield* ev(s.c))yield* run(s.a);else if(s.b)yield* run(s.b);return;
  case'while':while(yield* ev(s.c)){try{yield* run(s.b)}catch(x){if(x===BRK)break;if(x===CONT)continue;throw x}}return;
  case'do':do{try{yield* run(s.b)}catch(x){if(x===BRK)break;if(x===CONT)continue;throw x}}while(yield* ev(s.c));return;
  case'for':scopes.push({});try{if(s.i){if(s.i.k==='decl')yield* declare(s.i);else yield* ev(s.i.e)}while(!s.c||(yield* ev(s.c))){try{yield* run(s.b)}catch(x){if(x===BRK)break;if(x!==CONT)throw x}if(s.s)yield* ev(s.s)}}finally{scopes.pop()}return;
  case'sw':{const v=yield* ev(s.e);let on=false;try{for(const cs of s.cs){if(!on){if(cs.v==null)continue;if((yield* ev(cs.v))==v)on=true}if(on)for(const q of cs.b)yield* run(q)}if(!on){const d=s.cs.find(x=>x.v==null);if(d){on=true;let start=false;for(const cs of s.cs){if(cs===d)start=true;if(start)for(const q of cs.b)yield* run(q)}}}}catch(x){if(x!==BRK)throw x}return}
  case'brk':throw BRK;case'cont':throw CONT;case'ret':throw new RET(s.e?yield* ev(s.e):undefined)}}
 API={c,M,S0,LIB,FN,Serial,Wire,setOut,pinIn,dev,ser,sp,vt,fmtV,BUILT};const XO={};for(const k in MCUX)XO[k]=MCUX[k](API);for(const k in MCULIB)LIB[k]=(...a)=>MCULIB[k](API,...a);
 if(prog.py)return()=>pyRun(prog.py,API);
 return function*(){for(const d of prog.glob)yield* declare(d);yield* call({f:{k:'v',n:'setup'},a:[]});for(;;){yield* call({f:{k:'v',n:'loop'},a:[]});yield{budget:1,loop:1}}}}
const EEMEM={};
const DIG7=[0x3f,0x06,0x5b,0x4f,0x66,0x6d,0x7d,0x07,0x7f,0x6f,0x77,0x7c,0x39,0x5e,0x79,0x71];
function hsv(h,s,v){h=(h&65535)/65536*6;const i=Math.floor(h),f=h-i,p=v*(1-s/255),q=v*(1-s/255*f),t=v*(1-s/255*(1-f));const[r,g,b]=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];return(Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(b)}
const F5={'0':'01110100011001110101110001011100','1':'0010001100001000010000100011100'};
function FONT5(ch){const G={'0':[14,17,17,17,14],'1':[4,12,4,4,14],'2':[14,1,14,16,31],'3':[30,1,6,1,30],'4':[2,6,10,31,2],'5':[31,16,30,1,30],'6':[14,16,30,17,14],'7':[31,2,4,8,8],'8':[14,17,14,17,14],'9':[14,17,15,1,14],
 'A':[14,17,31,17,17],'B':[30,17,30,17,30],'C':[15,16,16,16,15],'D':[30,17,17,17,30],'E':[31,16,30,16,31],'F':[31,16,30,16,16],'H':[17,17,31,17,17],'I':[14,4,4,4,14],'L':[16,16,16,16,31],'O':[14,17,17,17,14],'S':[15,16,14,1,30],'?':[14,1,6,0,4],' ':[0,0,0,0,0],'!':[4,4,4,0,4],'+':[0,4,14,4,0],'-':[0,0,14,0,0]};
 const r=G[ch]||G[String(ch).toUpperCase()]||[31,17,17,17,31],m=[];for(let y=0;y<5;y++)for(let x=0;x<5;x++)m.push((r[y]>>(4-x))&1);return m}
void F5;
/* rede de ligações (fixa durante a simulação) */
function netOf(k){if(!rt)return null;if(!rt.nuf){const uf=makeUF();for(const w of allWires())uf.u(K(w.a.c,w.a.t),K(w.b.c,w.b.t));rt.nuf=uf}return rt.nuf.f(k)}
function pinKey(M,n){const i=M.pins[n];return i==null?null:netOf(K(M.c.id,i))}
/* compilar e rodar */
function mcuCode(c){return String(c.code||'').trim()?c.code:''}
function mcuStart(c){const M=mcuOf(c);if(!M||!mcuCode(c))return;rt.mcu=rt.mcu||{};const st=rt.mcu[c.id]={vt:0,mode:{},out:{},ser:'',serIn:'',dirty:1,err:null,run:true};
 try{const pr=progParse(c.code);st.gen=mcuRuntime(c,pr,M)()}catch(e){st.err=`Linha ${e.ln||'?'}: ${e.msg||e}`;st.ser=`[erro de compilação] ${st.err}\n`;st.run=false;logE(`${c.tag}: erro no código ${isPy(c.code)?'MicroPython':'C++'} (${st.err})`,'e')}}
function mcuStep(c,dt){const st=rt.mcu&&rt.mcu[c.id];if(!st||!st.run||!st.gen)return false;const M=mcuOf(c);const pw=M.self||(rt.A&&rt.A.vdc(K(c.id,M.vcc))-rt.A.vdc(K(c.id,M.gnd))>=2.7);if(!pw)return false;
 if(M.kind==='uno'&&rt.run[c.id]===false)return false;const target=(rt.simT||0)+dt,w0=performance.now();let guard=0;st.dirty=0;
 while(st.vt<=target&&guard++<200){if(performance.now()-w0>6){st.vt=target;break}let r;try{r=st.gen.next()}catch(e){st.run=false;const m=e&&e.msg?e.msg:String(e);st.err=m;st.ser+=`\n[erro ao rodar] ${m}\n`;st.serDirty=1;logE(`${c.tag}: erro no código (${m})`,'e');break}
  if(r.done){st.run=false;break}const v=r.value||{};if(v.wait!=null)st.vt+=v.wait;else if(v.budget)st.vt+=Math.max(2e-4,dt/50);if(st.modeCh){st.modeCh=0;st.dirty=1;break}}
 if(st.vt<target-1)st.vt=target;return!!st.dirty}
/* ---------- integração elétrica ---------- */
for(const t of ['plc','ic','mbit','nano','mega','esp32','pico']){const d=DEFS[t],tk0=d.tick,an0=d.an,der0=d.der;
 d.tick=(c,dt)=>{let ch=tk0?tk0(c,dt):false;if(isMCU(c)&&mcuCode(c)&&mcuStep(c,dt))ch=true;return ch};
 d.an=(c,x)=>{if(an0)an0(c,x);const M=mcuOf(c),st=M&&rt&&rt.mcu&&rt.mcu[c.id];if(!st)return;for(const n in st.mode)if(st.mode[n]===2&&M.pins[n]!=null)x.r(c,M.pins[n],M.vcc,20000)};
 d.der=(c,X,N,E)=>{if(der0)der0(c,X,N,E);const M=mcuOf(c),st=M&&rt&&rt.mcu&&rt.mcu[c.id];if(!st)return;const vg=X.vdc(M.gnd),vc=M.self?M.vref:Math.max(0,X.vdc(M.vcc)-vg);
  for(const n in st.out){if(st.mode[n]!==1||M.pins[n]==null)continue;const v=st.out[n];X.push(M.pins[n],`${c.tag}.p${n}${v>0?':+':':-'}`,vg+vc*v,40,M.gnd)}}}
{const _ss=startSim;startSim=function(){const r=_ss.apply(this,arguments);if(!rt)return r;rt.nuf=null;rt.mcu={};rt.dev=rt.dev||{};let any=false;for(const c of S.comps)if(isMCU(c)&&mcuCode(c)){mcuStart(c);any=true}if(any){solve();refresh(true)}return r}}
{const sy=DEFS.plc.say;DEFS.plc.say=c=>{if(isMCU(c)&&mcuCode(c)){const st=rt.mcu&&rt.mcu[c.id];return st&&st.err?['w',`${c.tag}: ${st.err}`]:rt.run[c.id]===false?['w',`${c.tag} parado (STOP)`]:['on',`${c.tag} rodando o programa C++`]}return sy(c)}}
/* micro:bit e ATtiny sem código: ficam parados */
for(const k of ['nano','mega','esp32','pico'])DEFS[k].say=c=>{const st=rt.mcu&&rt.mcu[c.id];return!mcuCode(c)?['w',`${c.tag} sem programa: selecione e clique em "${['esp32','pico'].includes(k)?'Código (C++ ou MicroPython)…':'Código C++…'}"`]:st&&st.err?['w',`${c.tag}: ${st.err}`]:['on',`${c.tag} rodando o programa ${isPy(c.code)?'MicroPython':'C++'}`]};
DEFS.mbit.say=c=>{const st=rt.mcu&&rt.mcu[c.id];return!mcuCode(c)?['w',`${c.tag} sem programa: selecione e clique em "Código C++…"`]:st&&st.err?['w',`${c.tag}: ${st.err}`]:['on',`${c.tag} rodando o programa`]};


/* LED em pino PWM: o brilho segue o ciclo de trabalho (como o olho vê o pisca rápido) */
{const lb0=ledB;ledB=c=>{const b=lb0(c);if(!SIM()||!rt.mcu||!rt.A)return b;const pw=[];for(const id in rt.mcu){const st=rt.mcu[id],m=mcuOf(byId(id));if(!m)continue;for(const n in st.out){const d=st.out[n];if(st.mode[n]===1&&d>0&&d<1)pw.push({k:pinKey(m,n),d,v:m.vref})}}if(!pw.length)return b;
 const ka=netOf(K(c.id,0));let hit=pw.find(x=>x.k===ka),R=40;if(!hit)for(const r of S.comps){if(r.type!=='res')continue;const a=netOf(K(r.id,0)),z=netOf(K(r.id,1));const h=pw.find(x=>(a===ka&&x.k===z)||(z===ka&&x.k===a));if(h){hit=h;R+=+r.R||0;break}}
 if(!hit)return b;const I=(hit.v-((+c.Vf||2)-.3))/(R+15);if(I<=0)return 0;return Math.max(.05,Math.min(1,I/(+c.Imax||.02))*hit.d)}}
/* ---------- monitor serial ---------- */
function renderSerial(){let el=document.getElementById('serial');const st=SIM()&&rt.mcu?Object.entries(rt.mcu).find(([id,s])=>s&&(s.ser||s.err)):null;
 if(!st){if(el)el.hidden=true;return}if(!el){el=document.createElement('div');el.id='serial';el.innerHTML=`<div class="sh"><b>${tr('Monitor serial')}</b><button data-sx="clr">${tr('Limpar')}</button><button data-sx="min">▾</button></div><pre></pre><div class="si"><input placeholder="${tr('Enviar para o Arduino…')}"><button data-sx="send">${tr('Enviar')}</button></div>`;
  document.querySelector('.stage').appendChild(el);el.addEventListener('click',e=>{const b=e.target.closest('[data-sx]');if(!b)return;const s=rt&&rt.mcu&&rt.mcu[el.dataset.id];if(!s)return;const k=b.dataset.sx;if(k==='clr'){s.ser='';renderSerial()}else if(k==='min')el.classList.toggle('mini');else if(k==='send'){const i=el.querySelector('input');s.serIn+=i.value+'\n';i.value=''}});
  el.querySelector('input').addEventListener('keydown',e=>{if(e.key==='Enter'){const s=rt&&rt.mcu&&rt.mcu[el.dataset.id];if(s){s.serIn+=e.target.value+'\n';e.target.value=''}}})}
 el.hidden=false;el.dataset.id=st[0];const pre=el.querySelector('pre');if(pre.textContent!==st[1].ser){pre.textContent=st[1].ser;pre.scrollTop=pre.scrollHeight}}
{const _r=renderScope;renderScope=function(){_r();renderSerial()}}

/* ---------- editor de código ---------- */
const CEX={
 'Classe Pisca (dois LEDs, tempos diferentes)':`// Cada objeto Pisca controla um LED sem usar delay()
class Pisca {
  public:
    Pisca(int pino, unsigned long intervalo) : pino(pino), intervalo(intervalo) {}
    void comeca() { pinMode(pino, OUTPUT); }
    void atualiza() {
      if (millis() - ultimo >= intervalo) {
        ultimo = millis();
        estado = !estado;
        digitalWrite(pino, estado);
      }
    }
  private:
    int pino;
    unsigned long intervalo;
    unsigned long ultimo = 0;
    bool estado = false;
};

Pisca rapido(13, 200);
Pisca lento(12, 700);

void setup() {
  rapido.comeca();
  lento.comeca();
}

void loop() {
  rapido.atualiza();
  lento.atualiza();
}`,
 'Piscar o LED (Blink)':`// Pisca o LED do pino 13 a cada meio segundo
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}`,
 'Botão acende LED':`// Botão no pino 2 (com resistor para o GND); LED no pino 13
void setup() {
  pinMode(2, INPUT);
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int b = digitalRead(2);
  digitalWrite(13, b);
  Serial.println(b);
  delay(100);
}`,
 'Potenciômetro e PWM':`// Potenciômetro no A0 controla o brilho do LED no pino 9
void setup() {
  pinMode(9, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int leitura = analogRead(A0);          // 0 a 1023
  int brilho = map(leitura, 0, 1023, 0, 255);
  analogWrite(9, brilho);
  Serial.print("A0 = ");
  Serial.println(leitura);
  delay(100);
}`,
 'Servo com potenciômetro':`#include <Servo.h>
Servo motor;

void setup() {
  motor.attach(9);
}

void loop() {
  int angulo = map(analogRead(A0), 0, 1023, 0, 180);
  motor.write(angulo);
  delay(20);
}`,
 'LCD 16×2 contador':`#include <LiquidCrystal.h>
// RS, E, D4, D5, D6, D7
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  lcd.begin(16, 2);
  lcd.print("Ola, Faisca!");
}

void loop() {
  lcd.setCursor(0, 1);
  lcd.print("Tempo: ");
  lcd.print(millis() / 1000);
  lcd.print(" s ");
  delay(200);
}`,
 'LCD I2C':`#include <Wire.h>
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.print("LCD I2C ok");
}

void loop() {
  lcd.setCursor(0, 1);
  lcd.print(analogRead(A0));
  lcd.print("    ");
  delay(200);
}`,
 'NeoPixel arco-íris':`#include <Adafruit_NeoPixel.h>
#define PINO 6
#define QTD 12
Adafruit_NeoPixel anel(QTD, PINO, NEO_GRB + NEO_KHZ800);

void setup() {
  anel.begin();
}

long h = 0;
void loop() {
  for (int i = 0; i < QTD; i++) {
    anel.setPixelColor(i, anel.ColorHSV(h + i * 65536L / QTD, 255, 120));
  }
  anel.show();
  h += 2048;
  delay(50);
}`,
 'Sensor ultrassônico':`// HC-SR04: TRIG no pino 7, ECHO no pino 6
const int trig = 7;
const int echo = 6;

void setup() {
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long tempo = pulseIn(echo, HIGH);
  int cm = tempo / 58;
  Serial.print("Distancia: ");
  Serial.print(cm);
  Serial.println(" cm");
  delay(300);
}`,
 'Teclado 4×4':`#include <Keypad.h>
const byte L = 4, C = 4;
char teclas[L][C] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
byte pinosL[L] = {9, 8, 7, 6};
byte pinosC[C] = {5, 4, 3, 2};
Keypad teclado = Keypad(makeKeymap(teclas), pinosL, pinosC, L, C);

void setup() {
  Serial.begin(9600);
}

void loop() {
  char t = teclado.getKey();
  if (t) {
    Serial.print("Tecla: ");
    Serial.println(t);
  }
}`,
 'Controle remoto IR':`#include <IRremote.h>
IRrecv receptor(11);
decode_results resultado;

void setup() {
  Serial.begin(9600);
  receptor.enableIRIn();
}

void loop() {
  if (receptor.decode(&resultado)) {
    Serial.println(resultado.value, HEX);
    receptor.resume();
  }
}`,
 'Display TM1637':`#include <TM1637Display.h>
TM1637Display tela(2, 3);   // CLK, DIO

void setup() {
  tela.setBrightness(7);
}

void loop() {
  tela.showNumberDec(millis() / 100 % 10000, true);
  delay(100);
}`,
 'micro:bit botões e tela':`#include <Adafruit_Microbit.h>
Adafruit_Microbit_Matrix microbit;

void setup() {
  microbit.begin();
  pinMode(PIN_BUTTON_A, INPUT);
  pinMode(PIN_BUTTON_B, INPUT);
}

void loop() {
  if (digitalRead(PIN_BUTTON_A) == LOW) microbit.print("A");
  else if (digitalRead(PIN_BUTTON_B) == LOW) microbit.print("B");
  else microbit.clear();
  delay(50);
}`};
function codeDialog(c){const ex=Object.keys(CEX);
 openModal(`${tr('Código do programa')} — ${esc(c.tag)}`,`<p class="muted small" style="margin-top:0">${tr('Como no Arduino: setup() roda uma vez e loop() roda sem parar. Aceita struct, class (com construtor, métodos e herança) e enum. Bibliotecas: Servo, LiquidCrystal, LiquidCrystal_I2C, Adafruit_NeoPixel, Keypad, IRremote, TM1637Display, Wire, Serial, SoftwareSerial, EEPROM, shiftOut (74HC595), WiFi (simulado), Adafruit_SSD1306 (OLED) e Stepper. No ESP32 e no Raspberry Pi Pico também aceita MicroPython: comece com import machine (ou from machine import Pin).')}</p>
  <div class="row" style="gap:6px;margin-bottom:6px"><select id="cEx" style="flex:1;height:32px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);color:var(--ink)"><option value="">${tr('Exemplos…')}</option>${ex.map(k=>`<option>${esc(k)}</option>`).join('')}</select></div>
  <textarea id="cSrc" spellcheck="false" style="width:100%;min-height:340px;font:13px/1.45 'IBM Plex Mono',monospace;border:1px solid var(--line);border-radius:8px;padding:8px;background:#0f1720;color:#dce7f3;tab-size:2">${esc(c.code||'')}</textarea>
  <p id="cMsg" class="small" style="min-height:1.4em;margin:6px 0 0"></p>`,
  `<button data-chk="1">${tr('Verificar')}</button><button data-mx="1">${tr('Cancelar')}</button><button class="pri" data-ok="1">${tr('Salvar')}</button>`,e=>{
   const ta=document.getElementById('cSrc'),msg=document.getElementById('cMsg');const chk=()=>{try{progParse(ta.value);msg.textContent=tr('Código sem erros.');msg.style.color='var(--ok)';return true}catch(er){msg.textContent=`${tr('Linha')} ${er.ln||'?'}: ${er.msg||er}`;msg.style.color='var(--err)';return false}};
   if(e.target.closest('[data-chk]'))chk();else if(e.target.closest('[data-ok]')){chk();pushHist();c.code=ta.value;closeModal();commit()}});
 const ta=document.getElementById('cSrc');ta.addEventListener('keydown',ev=>{if(ev.key==='Tab'){ev.preventDefault();const s=ta.selectionStart;ta.setRangeText('  ',s,ta.selectionEnd,'end')}});
 document.getElementById('cEx').addEventListener('change',ev=>{const k=ev.target.value;if(!k)return;if(!ta.value.trim()||confirm(tr('Trocar o código atual pelo exemplo?')))ta.value=CEX[k];ev.target.value=''})}
{const _rp=renderProps;renderProps=function(){_rp();if(mode!=='edit'||!sel||!sel.c||sel.c.size!==1)return;const c=byId([...sel.c][0]);if(!isMCU(c))return;const el=$('#props');if(!el)return;
 const d=document.createElement('div');d.className='row';d.innerHTML=`<button type="button" id="bCode">${tr(['esp32','pico'].includes(c.type)?'Código (C++ ou MicroPython)…':'Código C++…')}</button>`;el.appendChild(d);d.querySelector('#bCode').onclick=()=>codeDialog(c)}}
/* aviso de erro no diagnóstico */
{const _an=analyze;analyze=function(){const r=_an();if(!r||!r.issues)return r;for(const c of S.comps){if(!isMCU(c)||!mcuCode(c))continue;try{progParse(c.code)}catch(e){r.issues.push({lvl:'erro',msg:`${c.tag}: erro no código ${isPy(c.code)?'MicroPython':'C++'} (linha ${e.ln||'?'})`,why:e.msg||String(e),ids:[c.id]})}}return r}}
/* selo "C++" na placa */
for(const t of ['plc','ic','mbit','nano','mega','esp32','pico']){const d=DEFS[t],dr=d.draw;d.draw=c=>{let s=dr(c);if(isMCU(c)&&mcuCode(c)){const b=boxOf(c);s+=`<g>${R(b[0]+b[2]-44,b[1]+4,34,14,'',' rx="3" style="fill:'+(isPy(c.code)?'#3572a5':'#00979d')+';stroke:none"')}<text x="${b[0]+b[2]-27}" y="${b[1]+14}" class="tn6" style="fill:#fff">${isPy(c.code)?'Py':'C++'}</text></g>`}return s}}
/* o arquivo .fais guarda o código */
{const st=document.createElement('style');st.textContent=`#serial{position:absolute;left:12px;bottom:40px;width:min(420px,calc(100% - 24px));background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.2);z-index:6;font-size:12px}#serial[hidden]{display:none}
#serial .sh{display:flex;gap:6px;align-items:center;padding:6px 8px;border-bottom:1px solid var(--line)}#serial .sh b{flex:1}#serial button{border:1px solid var(--line);background:var(--panel2);border-radius:6px;padding:2px 8px;font:inherit;color:var(--ink)}
#serial pre{margin:0;height:110px;overflow:auto;padding:6px 8px;background:#0f1720;color:#b8f5c8;font:12px/1.4 'IBM Plex Mono',monospace;white-space:pre-wrap}#serial .si{display:flex;gap:6px;padding:6px 8px}#serial .si input{flex:1;height:28px;border:1px solid var(--line);border-radius:6px;padding:0 8px;background:var(--panel2);color:var(--ink)}
#serial.mini pre,#serial.mini .si{display:none}`;document.head.appendChild(st)}
Object.assign(I18N_EXACT,{'Monitor serial':'Serial monitor','Limpar':'Clear','Enviar para o Arduino…':'Send to the Arduino…','Enviar':'Send','Código C++':'C++ code','Código C++…':'C++ code…','Exemplos…':'Examples…','Código sem erros.':'No errors in the code.','Trocar o código atual pelo exemplo?':'Replace the current code with the example?',
 'Como no Arduino: setup() roda uma vez e loop() roda sem parar. Aceita struct, class (com construtor, métodos e herança) e enum. Bibliotecas: Servo, LiquidCrystal, LiquidCrystal_I2C, Adafruit_NeoPixel, Keypad, IRremote, TM1637Display, Wire, Serial, SoftwareSerial, EEPROM e shiftOut (74HC595).':'Like on an Arduino: setup() runs once and loop() runs forever. Supports struct, class (constructor, methods and inheritance) and enum. Libraries: Servo, LiquidCrystal, LiquidCrystal_I2C, Adafruit_NeoPixel, Keypad, IRremote, TM1637Display, Wire, Serial, SoftwareSerial, EEPROM and shiftOut (74HC595).'});
I18N_PHR.push([': erro no código C++ (linha ',': error in the C++ code (line '],[' sem programa: selecione e clique em "Código C++…"',' has no program: select it and click "C++ code…"'],[' rodando o programa',' running the program']);
I18N_RE=null;I18N_CACHE.clear();renderAll();

/* ---------- modelo pronto ---------- */
{const mk=window.mkTpl;const CODE=`// LED vermelho (pino 13) pisca sem usar delay();
// o potenciômetro (A0) controla o brilho do LED verde (pino 9, PWM).
unsigned long antes = 0;
bool aceso = false;

void setup() {
  pinMode(13, OUTPUT);
  pinMode(9, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int leitura = analogRead(A0);
  analogWrite(9, map(leitura, 0, 1023, 0, 255));
  if (millis() - antes >= 500) {
    antes = millis();
    aceso = !aceso;
    digitalWrite(13, aceso);
    Serial.print("A0 = ");
    Serial.println(leitura);
  }
}`;
 mk('ardcpp',(a,w,j,tx)=>{tx('T1',120,-20,'ARDUINO PROGRAMADO EM C++');tx('N1',120,5,'Selecione o Arduino e clique em "Código C++…" para ver o programa. Gire RP1 (clique nele) para mudar o brilho do LED verde.');
  a('ARD','plc',400,300,{m:'ard',tag:'ARD1',code:CODE});
  a('RP','pot',200,140,{R:10000,pos:50,tag:'RP1',r:180});w('RP',0,'ARD',0,'v',200);a('M0','src',200,60,{v:'-'});w('RP',1,'M0',0);w('RP',2,'ARD',14,'h',340);
  a('R1','res',440,440,{R:220,tag:'R1'});w('ARD',9,'R1',0);a('L1','led',440,560,{col:'verde',Vf:2.2,tag:'D1'});w('R1',1,'L1',0);a('G1','src',440,660,{v:'-',r:180});w('L1',1,'G1',0);
  a('R2','res',520,440,{R:220,tag:'R2'});w('ARD',13,'R2',0);a('L2','led',520,560,{col:'vermelha',tag:'D2'});w('R2',1,'L2',0);a('G2','src',520,660,{v:'-',r:180});w('L2',1,'G2',0)});
 const s=document.getElementById('bTpl');if(s&&s.querySelector){const o=s.querySelector('option[value="ard"]')||s.lastElementChild;const op=document.createElement('option');op.value='ardcpp';op.textContent='Arduino programado em C++';o.after(op)}}
Object.assign(I18N_EXACT,{'Arduino programado em C++':'Arduino programmed in C++','ARDUINO PROGRAMADO EM C++':'ARDUINO PROGRAMMED IN C++','Selecione o Arduino e clique em "Código C++…" para ver o programa. Gire RP1 (clique nele) para mudar o brilho do LED verde.':'Select the Arduino and click "C++ code…" to see the program. Turn RP1 (click it) to change the green LED brightness.'});
I18N_RE=null;I18N_CACHE.clear();renderAll();
