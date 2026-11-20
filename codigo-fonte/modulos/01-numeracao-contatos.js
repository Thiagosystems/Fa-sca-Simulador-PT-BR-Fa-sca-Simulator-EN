/* ================= numeração editável dos contatos (como no CADe_SIMU) ================= */
{const NUMT=['kno','knc','ktno','ktnc','ftnc','ftno','btn'];
 const parseNum=c=>{const m=typeof c.num==='string'&&c.num.trim().match(/^([A-Za-z0-9]{1,4})\s*[-–\/ ]\s*([A-Za-z0-9]{1,4})$/);return m?[m[1],m[2]]:null};
 for(const t of NUMT){const d=DEFS[t];if(!d||termsOf({...makeComp(t,{}),type:t}).length!==2)continue;
  const N0=d.N,D0=d.draw;
  d.N=c=>{const n=parseNum(c);return n||fv(N0,c)};
  d.draw=c=>{let s=D0(c);const n=parseNum(c);if(!n)return s;const o=fv(N0,c)||[];
   o.forEach((v,i)=>{s=s.replace(`>${esc(v)}</text>`,`>${esc(n[i])}</text>`)});return s};
  d.F=[...(d.F||[]),['num','Numeração (ex.: 53-54)','text']]}}

