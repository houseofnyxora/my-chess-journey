const KEY='mcj_redesign_v1',CHESS_URL='https://cdn.jsdelivr.net/npm/chess.js@1.0.0/+esm';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const START='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const DEF={v:2,rating:1204,startRating:1204,lichess:'Estella_Sama',chesscom:'Estella-Sama005',tasks:[false,false,false,false],tasksDate:'',games:[],puzzles:[],reflections:[],boardPgn:'',boardFen:'',settings:{theme:'dark',sound:true,volume:.6,pack:'wood',board:'forest',pieces:'classic'}};
const TASKS=['Solve 20 puzzles','Play / review rated rapid games (if scheduled)','Analyse every rated game','Write one lesson from today'];

/* ---------- storage + migration ---------- */
let corrupt=false;
function norm(o){
 o=o&&typeof o==='object'?o:{};
 const d={...DEF,...o,settings:{...DEF.settings,...(o.settings||{})}};
 const r=Number(d.rating);d.rating=Number.isFinite(r)&&r>=0?Math.round(r):1204;
 const s=Number(d.startRating);d.startRating=Number.isFinite(s)&&s>=0?Math.round(s):1204;
 for(const k of['games','puzzles','reflections'])d[k]=(Array.isArray(d[k])?d[k]:[]).filter(x=>x&&typeof x==='object').map(x=>({id:x.id||uid(),...x}));
 d.tasks=Array.isArray(d.tasks)&&d.tasks.length===4?d.tasks.map(Boolean):[false,false,false,false];
 if(d.tasksDate!==new Date().toDateString()){d.tasks=[false,false,false,false];d.tasksDate=new Date().toDateString()}
 d.lichess=String(d.lichess||DEF.lichess);d.chesscom=String(d.chesscom||DEF.chesscom);
 d.boardPgn=String(d.boardPgn||'');d.boardFen=String(d.boardFen||'');d.v=2;return d}
function load(){
 const raw=localStorage.getItem(KEY);let o={};
 if(raw){try{o=JSON.parse(raw)}catch{corrupt=true;try{localStorage.setItem(KEY+'_corrupt',raw)}catch{}}}
 if(raw&&!corrupt&&!(o.v>=2)&&!localStorage.getItem(KEY+'_pre_v2'))try{localStorage.setItem(KEY+'_pre_v2',raw)}catch{}
 return norm(o)}
let data=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch{toast('Could not save — browser storage may be full or blocked.');return false}}

/* ---------- toast + dialog ---------- */
let tt;
function toast(m,a){const t=$('#toast');t.innerHTML=esc(m)+(a?` <button data-act="${a.act}">${esc(a.label)}</button>`:'');t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),a?15000:3500)}
function dlg(html){const d=$('#dlg');d.innerHTML=html+'<form method="dialog"><button class="btn sm full">Close</button></form>';d.showModal()}

/* ---------- settings ---------- */
function applySettings(){const s=data.settings,h=document.documentElement;h.dataset.theme=s.theme;h.dataset.board=s.board;h.dataset.pieces=s.pieces;
 $('meta[name=theme-color]').content=s.theme==='dark'?'#0e1814':'#f6f1e3'}

/* ---------- sound (Web Audio, created only after a user action) ---------- */
const SND={
wood:{move:[['n',1200,0,.05,.9],['s',170,0,.09,.6]],capture:[['n',900,0,.07,1],['s',130,0,.12,.8],['n',1500,.08,.04,.6]],check:[['n',1000,0,.05,.9],['s',170,0,.08,.6],['n',1400,.14,.05,.9],['s',210,.14,.09,.6]],castle:[['n',1200,0,.05,.9],['s',170,0,.09,.6],['n',1100,.13,.05,.9],['s',160,.13,.09,.6]],mate:[['n',900,0,.07,1],['s',120,0,.15,.9],['n',900,.2,.07,1],['s',110,.2,.2,.9]],start:[['n',1300,0,.04,.7],['n',1300,.12,.04,.7]],achieve:[['s',523,0,.15,.5],['s',659,.12,.15,.5],['s',784,.24,.3,.5]]},
digital:{move:[['t',620,0,.07,.5]],capture:[['t',420,0,.06,.6],['t',300,.05,.1,.6]],check:[['t',700,0,.07,.5],['t',880,.09,.1,.5]],castle:[['t',520,0,.06,.5],['t',620,.08,.06,.5]],mate:[['t',440,0,.12,.6],['t',330,.14,.12,.6],['t',220,.28,.3,.6]],start:[['t',520,0,.08,.4],['t',780,.1,.1,.4]],achieve:[['t',523,0,.12,.5],['t',659,.12,.12,.5],['t',784,.24,.12,.5],['t',1046,.36,.3,.5]]}};
let ctx;
function play(k){const s=data.settings;if(!s.sound)return;let c;
 try{c=ctx||(ctx=new(window.AudioContext||window.webkitAudioContext)());if(c.state==='suspended')c.resume()}catch{return}
 for(const[t,f,st,d,g]of SND[s.pack][k]){const T=c.currentTime+st,o=c.createGain();
  o.gain.setValueAtTime(Math.max(.0001,g*s.volume),T);o.gain.exponentialRampToValueAtTime(.0001,T+d);o.connect(c.destination);
  if(t==='n'){const b=c.createBuffer(1,Math.max(1,(c.sampleRate*d)|0),c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;
   const n=c.createBufferSource(),bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=1.2;n.buffer=b;n.connect(bp);bp.connect(o);n.start(T)}
  else{const os=c.createOscillator();os.type=t==='s'?'sine':'triangle';os.frequency.setValueAtTime(f,T);if(t==='s')os.frequency.exponentialRampToValueAtTime(f*.6,T+d);os.connect(o);os.start(T);os.stop(T+d+.02)}}}

/* ---------- install ---------- */
let dip=null;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;renderInstall()});
addEventListener('appinstalled',()=>{dip=null;renderInstall();toast('App installed ✓')});
function renderInstall(){const i=standalone();
 $$('[data-install]').forEach(b=>{b.textContent=i?'✓ Installed':'⬇ Install App';b.disabled=i});
 $('#instNote').textContent=i?'You\u2019re running the installed app.':dip?'Ready — tap Install App for one-tap install.':'One-tap install isn\u2019t available in this browser right now. Tap Install App for manual steps.'}
async function install(){
 if(standalone())return;
 if(dip){dip.prompt();const{outcome}=await dip.userChoice;dip=null;renderInstall();if(outcome==='dismissed')toast('Install dismissed — you can try again any time.');return}
 dlg(`<h3>Install My Chess Journey</h3><p class="mut">Your browser hasn\u2019t offered one-tap install. Do it from the menu:</p>
 <ul><li><b>Android Chrome:</b> tap ⋮ → <b>Install app</b> (or <b>Add to Home screen</b>).</li>
 <li><b>iPhone Safari:</b> tap Share → <b>Add to Home Screen</b>.</li>
 <li><b>Desktop Chrome/Edge:</b> click the install icon in the address bar.</li></ul>
 <p class="mut">Not in the menu? You may be in a private tab, or it may already be installed.</p>`)}

/* ---------- derived stats ---------- */
const dayStr=d=>new Date(d).toDateString();
function streak(){const days=new Set(data.puzzles.map(p=>dayStr(p.date)));let n=0,d=new Date();
 if(!days.has(d.toDateString()))d.setDate(d.getDate()-1);
 while(days.has(d.toDateString())){n++;d.setDate(d.getDate()-1)}return n}
const wdl=()=>['Win','Draw','Loss'].map(r=>data.games.filter(g=>g.result===r).length);
function setRating(n){const old=data.rating;data.rating=n;
 for(const t of[1300,1400,1500])if(old<t&&n>=t){play('achieve');toast(`Milestone: ${t} rapid! 🏆`);break}
 save();render()}

/* ---------- render ---------- */
function gameRow(g,del){return`<div class="item"><div><b>${esc(g.opponent||'Unknown opponent')}</b> · <span class="res ${esc(g.result)}">${esc(g.result)}</span><small>${g.rating?'Rating after: '+esc(g.rating)+' · ':''}${esc(g.lesson||'No lesson added')} · ${esc(g.date||'')}</small></div>${del?`<button class="del" data-act="delGame" data-id="${esc(g.id)}" aria-label="Delete game">✕</button>`:''}</div>`}
function render(){
 const r=data.rating,start=data.startRating,span=1500-start,
  pct=span>0?Math.max(0,Math.min(100,Math.round((r-start)/span*100))):(r>=1500?100:0);
 $('#rating').textContent=r;
 const diff=r-start;$('#gain').textContent=(diff>0?'+':diff<0?'−':'±')+Math.abs(diff)+' since '+start;
 $('#bar').style.width=pct+'%';$('#pct').textContent=pct+'% of the climb completed';
 $('#togo').textContent=r>=1500?'Target reached 🎉':(1500-r)+' to go';
 const left=Math.ceil((new Date(2026,11,31,23,59,59)-Date.now())/864e5);
 $('#days').textContent=left>0?left+' days left':'Deadline passed';
 const[w,d,l]=wdl(),pt=data.puzzles.filter(p=>dayStr(p.date)===new Date().toDateString()).reduce((a,p)=>a+(+p.count||0),0),st=streak();
 $('#sGames').textContent=data.games.length;$('#sWdl').textContent=`${w}·${d}·${l}`;$('#sStreak').textContent=st+(st===1?' day':' days');$('#sPuz').textContent=pt;
 $('#aW').textContent=w;$('#aD').textContent=d;$('#aL').textContent=l;
 $$('.mission').forEach(m=>m.innerHTML=TASKS.map((t,i)=>`<label class="task ${data.tasks[i]?'done':''}"><input type="checkbox" data-task="${i}" ${data.tasks[i]?'checked':''}><span>${t}</span></label>`).join(''));
 const rev=data.games.slice().reverse();
 $('#recent').innerHTML=rev.length?rev.slice(0,3).map(g=>gameRow(g)).join(''):'<div class="empty">No games logged yet.</div>';
 $('#games').innerHTML=rev.length?rev.map(g=>gameRow(g,1)).join(''):'<div class="empty">No games logged yet.</div>';
 $('#gLabel').textContent=data.games.length+' logged';
 $('#puzHist').innerHTML=data.puzzles.length?data.puzzles.slice().reverse().map(p=>`<div class="item"><div><b>${esc(p.count)} puzzles · ${esc(p.weakness)}</b><small>${esc(p.date)}</small></div></div>`).join(''):'<div class="empty">No sessions yet. Log your first one.</div>';
 $('#reflHist').innerHTML=data.reflections.slice().reverse().map(x=>`<div class="item"><div>${esc(x.text)}<small>${esc(x.date)}</small></div></div>`).join('');
 const A=[['First game logged',data.games.length>0],['First puzzle session',data.puzzles.length>0],['3-day streak',st>=3],['1300 rapid',r>=1300],['1400 rapid',r>=1400],['1500 target',r>=1500]];
 $('#ach').innerHTML=A.map(([n,g])=>`<span class="chip ${g?'got':''}">${g?'🏆 ':'🔒 '}${n}</span>`).join('');
 $$('[data-k]').forEach(b=>b.setAttribute('aria-pressed',String(data.settings[b.dataset.k]===b.dataset.v)));
 $('#sndOn').checked=data.settings.sound;$('#vol').value=data.settings.volume;
 if(document.activeElement!==$('#liIn'))$('#liIn').value=data.lichess;
 if(document.activeElement!==$('#ccIn'))$('#ccIn').value=data.chesscom;
 renderMini();renderInstall()}

/* ---------- board rendering ---------- */
function parseFen(f){return f.split(' ')[0].split('/').map(r=>{const o=[];for(const ch of r){if(/\d/.test(ch))for(let i=0;i<+ch;i++)o.push(null);else o.push({color:ch===ch.toUpperCase()?'w':'b',type:ch.toLowerCase()})}return o})}
function boardHTML(fen,o={}){const B=parseFen(fen),R=[0,1,2,3,4,5,6,7],rs=o.flip?[...R].reverse():R;let h='';
 rs.forEach((r,ri)=>rs.forEach((c,ci)=>{const sq='abcdefgh'[c]+(8-r),p=B[r][c],lm=o.legal?.find(m=>m.to===sq);
  const cl=['sq',(r+c)%2?'d':'l',o.sel===sq&&'sel',o.last&&(o.last.from===sq||o.last.to===sq)&&'lm',o.chk===sq&&'chk',lm&&((lm.captured||lm.flags.includes('e'))?'cap':'dot')].filter(Boolean).join(' ');
  h+=`<div class="${cl}" data-sq="${sq}" aria-label="${sq}${p?' '+p.color+p.type:''}">${p?`<svg class="pc ${p.color}" viewBox="0 0 45 45"><use href="#${p.type}"/></svg>`:''}${o.coords&&ci===0?`<i class="rk">${8-r}</i>`:''}${o.coords&&ri===7?`<i class="fl">${'abcdefgh'[c]}</i>`:''}</div>`}));
 return h}
function renderMini(){$('#mini').innerHTML=boardHTML(data.boardFen||START)}

/* ---------- interactive board (chess.js loaded on demand) ---------- */
let chessP=null,ChessCls=null,game=null,sel=null,legal=[],last=null,flipped=false;
const ensureChess=()=>chessP||(chessP=import(CHESS_URL).then(m=>m.Chess).catch(e=>{chessP=null;throw e}));
async function initBoard(){
 if(game){drawMain();return}
 $('#bstate').textContent='Loading board…';
 try{ChessCls=await ensureChess()}catch{
  $('#bstate').innerHTML='Couldn\u2019t load the chess engine (needs a connection the first time). <button class="lnk" data-act="retryBoard">Retry</button>';return}
 $('#bstate').textContent='';
 game=new ChessCls();
 if(data.boardPgn){try{game.loadPgn(data.boardPgn)}catch{game=new ChessCls();data.boardPgn='';data.boardFen=''}}
 const h=game.history({verbose:true});last=h.length?h[h.length-1]:null;drawMain()}
function kingSq(){const B=parseFen(game.fen());for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=B[r][c];if(p&&p.type==='k'&&p.color===game.turn())return'abcdefgh'[c]+(8-r)}}
function statusText(){const t=game.turn()==='w'?'White':'Black';
 if(game.isCheckmate())return`Checkmate — ${t==='White'?'Black':'White'} wins`;
 if(game.isStalemate())return'Draw — stalemate';
 if(game.isInsufficientMaterial())return'Draw — insufficient material';
 if(game.isThreefoldRepetition())return'Draw — threefold repetition';
 if(game.isDraw())return'Draw — 50-move rule';
 return t+' to move'+(game.inCheck()?' · Check!':'')}
function drawMain(){
 $('#bd').innerHTML=boardHTML(game.fen(),{flip:flipped,sel,legal,last,chk:game.inCheck()?kingSq():null,coords:true});
 $('#bstatus').textContent=statusText();
 const h=game.history();let m='';for(let i=0;i<h.length;i+=2)m+=`${i/2+1}. ${h[i]} ${h[i+1]||''}  `;
 $('#moves').textContent=m||'No moves yet.';$('#pgnOut').value=game.pgn()}
function persistBoard(){data.boardPgn=game.pgn();data.boardFen=game.fen();save();renderMini()}
function clickSq(sq){
 if(!game||game.isGameOver())return;
 if(sel){const mv=legal.filter(m=>m.to===sq);
  if(mv.length){if(mv[0].promotion)return askPromo(mv);return doMove(mv[0])}}
 const p=game.get(sq);
 if(p&&p.color===game.turn()){sel=sq;legal=game.moves({square:sq,verbose:true})}else{sel=null;legal=[]}
 drawMain()}
function doMove(m){
 let r;try{r=game.move({from:m.from,to:m.to,promotion:m.promotion})}catch{sel=null;legal=[];drawMain();return}
 sel=null;legal=[];last=r;persistBoard();
 play(game.isCheckmate()?'mate':game.inCheck()?'check':/[kq]/.test(r.flags)?'castle':r.captured?'capture':'move');drawMain()}
function askPromo(mv){
 dlg(`<h3>Promote to…</h3><div class="pr">${['q','r','b','n'].map(t=>`<button class="pbtn" data-act="promo" data-v="${t}" aria-label="${t}"><svg class="pc ${game.turn()}" viewBox="0 0 45 45"><use href="#${t}"/></svg></button>`).join('')}</div>`);
 askPromo.mv=mv}

/* ---------- actions ---------- */
const acts={
 go(b){go(b.dataset.p)},
 theme(){data.settings.theme=data.settings.theme==='dark'?'light':'dark';applySettings();save();render()},
 set(b){data.settings[b.dataset.k]=b.dataset.v;applySettings();save();render();if(b.dataset.k==='pack')play('move')},
 install,
 editRating(){const f=$('#ratingForm');f.hidden=!f.hidden;if(!f.hidden){$('#ratingIn').value=data.rating;$('#ratingIn').focus()}},
 resetTasks(){data.tasks=[false,false,false,false];save();render()},
 delGame(b){if(confirm('Delete this game from your archive?')){data.games=data.games.filter(g=>g.id!==b.dataset.id);save();render()}},
 undo(){if(!game)return;game.undo();const h=game.history({verbose:true});last=h.length?h[h.length-1]:null;sel=null;legal=[];persistBoard();drawMain()},
 flip(){if(!game)return;flipped=!flipped;drawMain()},
 restart(){if(!game)return;if(game.history().length&&!confirm('Restart and clear this board?'))return;game=new ChessCls();sel=null;legal=[];last=null;persistBoard();drawMain();play('start')},
 retryBoard(){initBoard()},
 promo(b){const m=askPromo.mv?.find(x=>x.promotion===b.dataset.v);$('#dlg').close();if(m)doMove(m)},
 async copyPgn(){const t=$('#pgnOut');try{await navigator.clipboard.writeText(t.value);toast('PGN copied')}catch{t.select();toast('Press and hold to copy the selected text')}},
 dlPgn(){dl('my-chess-journey.pgn',$('#pgnOut').value||'','application/x-chess-pgn')},
 loadPgn(){if(!game)return toast('Board is still loading.');const t=$('#pgnIn').value.trim();if(!t)return toast('Paste a PGN first.');
  const g=new ChessCls();try{g.loadPgn(t)}catch{return toast('That PGN could not be read.')}
  game=g;sel=null;legal=[];const h=g.history({verbose:true});last=h.length?h[h.length-1]:null;persistBoard();drawMain();$('#pgnIn').value='';toast('PGN loaded')},
 preview(){play('move');setTimeout(()=>play('capture'),500);setTimeout(()=>play('check'),1100)},
 openLi(b){const u=encodeURIComponent(data.lichess.trim()||'Estella_Sama');open(`https://lichess.org/@/${u}${b.dataset.w==='g'?'/all':''}`,'_blank','noopener')},
 openCc(){open(`https://www.chess.com/member/${encodeURIComponent(data.chesscom.trim())}`,'_blank','noopener')},
 exportBackup(){dl('my-chess-journey-backup.json',JSON.stringify(data,null,2),'application/json')},
 resetAll(){if(!confirm('Erase ALL data on this device? Export a backup first.'))return;
  try{localStorage.setItem(KEY+'_pre_reset',JSON.stringify(data))}catch{}
  data=norm({});game=null;sel=null;legal=[];last=null;applySettings();save();render();toast('All data erased.')},
 refresh(){location.reload()}
};
function go(id){$$('.page').forEach(p=>p.classList.toggle('on',p.id===id));
 $$('.nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.p===id?'page':'false'));scrollTo({top:0});if(id==='board')initBoard()}
function dl(name,txt,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)acts[b.dataset.act]?.(b,e)});
$('#bd').addEventListener('click',e=>{const s=e.target.closest('.sq');if(s)clickSq(s.dataset.sq)});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.task!=null){data.tasks[+t.dataset.task]=t.checked;save();render()}});
$('#sndOn').onchange=e=>{data.settings.sound=e.target.checked;save();if(e.target.checked)play('move')};
$('#vol').oninput=e=>{data.settings.volume=+e.target.value;save()};
$('#vol').onchange=()=>play('move');
$('#liIn').onchange=e=>{data.lichess=e.target.value.trim()||'Estella_Sama';save();render()};
$('#ccIn').onchange=e=>{data.chesscom=e.target.value.trim();save();render()};
$('#ratingForm').onsubmit=e=>{e.preventDefault();const n=parseInt($('#ratingIn').value,10);
 if(!Number.isFinite(n)||n<0||n>3500)return toast('Enter a rating between 0 and 3500.');
 e.target.hidden=true;setRating(n);toast('Rating updated to '+n)};
$('#gameForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),ra=parseInt(f.get('ra'),10);
 data.games.push({id:uid(),opponent:(f.get('opp')||'').trim(),result:f.get('res'),rating:Number.isFinite(ra)?String(ra):'',lesson:(f.get('lesson')||'').trim(),date:new Date().toLocaleDateString(),ts:Date.now(),source:'manual'});
 if(Number.isFinite(ra)&&ra>=0&&ra<=3500&&f.get('sync'))setRating(ra);else{save();render()}
 e.target.reset();toast('Game saved')};
$('#puzzleForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),n=Math.max(0,parseInt(f.get('n'),10)||0);
 data.puzzles.push({id:uid(),count:n,weakness:f.get('w'),date:new Date().toDateString(),ts:Date.now()});save();render();toast('Session saved')};
$('#reflForm').onsubmit=e=>{e.preventDefault();const t=new FormData(e.target).get('t').trim();if(!t)return;
 data.reflections.push({id:uid(),text:t,date:new Date().toLocaleDateString(),ts:Date.now()});save();e.target.reset();render()};
$('#restoreFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{let o;try{o=JSON.parse(r.result);if(!o||typeof o!=='object'||Array.isArray(o))throw 0}catch{return toast('That backup file could not be read.')}
  try{localStorage.setItem(KEY+'_pre_restore',JSON.stringify(data))}catch{}
  data=norm(o);game=null;applySettings();save();render();toast('Backup restored ✓')};
 r.readAsText(f);e.target.value=''};

/* ---------- boot ---------- */
applySettings();render();
if(corrupt)toast('Saved data was unreadable. A copy was kept on this device.');
if('serviceWorker' in navigator){
 addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').then(reg=>{
  reg.update();
  reg.addEventListener('updatefound',()=>{const w=reg.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('Update ready',{act:'refresh',label:'Refresh'})})})
 }).catch(()=>{}))}
