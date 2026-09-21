import {createBoard,performMove,activateBooster,seededRandom,findMatches,cloneBoard} from './engine.mjs';
import {MONUMENTS,DESTINATIONS,BOOSTERS,DAILY_REWARDS,getLevelConfig,getDestinationForLevel,monumentById} from './data.mjs';

const SAVE_KEY='monumania-save-v2';
const LIFE_MS=20*60*1000;
const app=document.querySelector('#app');
const modalLayer=document.querySelector('#modal-layer');
const toastLayer=document.querySelector('#toast-layer');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const today=()=>new Date().toISOString().slice(0,10);
const yesterday=()=>new Date(Date.now()-86400000).toISOString().slice(0,10);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const safeNumber=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;

function defaultState(){
  return {
    version:2,level:1,coins:320,lives:5,lifeClock:Date.now(),stars:{},
    boosters:{hammer:2,swap:1,rocket:1,globe:1},collection:{eiffel:1},
    lastDaily:null,streak:0,tutorialSeen:false,activeGame:null,
    settings:{sound:true,music:true,vibration:true,reducedMotion:false},
    stats:{levelsCompleted:0,totalStars:0,bestCombo:0,totalCleared:0,destinationsVisited:1,playSeconds:0,wins:0,losses:0},
    challenge:{date:today(),completedToday:0,clearedToday:0,claimed:[]},
    lastInterstitialWin:0
  };
}

function loadState(){
  const base=defaultState();
  try{
    const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if(!raw||typeof raw!=='object') return base;
    return {...base,...raw,settings:{...base.settings,...raw.settings},boosters:{...base.boosters,...raw.boosters},stats:{...base.stats,...raw.stats},challenge:{...base.challenge,...raw.challenge}};
  }catch{return base;}
}

let state=loadState();
let screen='home';
let session=null;
let selected=null;
let selectedBooster=null;
let visualClears=new Set();
let comboText='';
let shuffleVisible=false;
let pointerStart=null;
let adReward=null;
let locked=false;
const nativeRequests=new Map();

window.__monumaniaNativeCallbacks={
  resolve(requestId,payloadJson){
    const request=nativeRequests.get(requestId);if(!request)return;
    nativeRequests.delete(requestId);clearTimeout(request.timeout);
    try{request.resolve(JSON.parse(payloadJson||'{}'));}catch{request.resolve({});}
  },
  reject(requestId,reason){
    const request=nativeRequests.get(requestId);if(!request)return;
    nativeRequests.delete(requestId);clearTimeout(request.timeout);request.reject(new Error(reason||'native_request_failed'));
  }
};

function nativeBridgeReady(bridgeName){
  try{return Boolean(window[bridgeName]?.isReady?.());}catch{return false;}
}

function callNativeBridge(bridgeName,method,payload={}){
  return new Promise((resolve,reject)=>{
    const bridge=window[bridgeName];
    if(!bridge||typeof bridge[method]!=='function')return reject(new Error('native_bridge_unavailable'));
    const requestId=`monumania-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timeout=setTimeout(()=>{nativeRequests.delete(requestId);reject(new Error('native_request_timeout'));},90000);
    nativeRequests.set(requestId,{resolve,reject,timeout});
    try{bridge[method](requestId,JSON.stringify(payload));}
    catch(error){clearTimeout(timeout);nativeRequests.delete(requestId);reject(error);}
  });
}

function nativeAdsReady(){return nativeBridgeReady('AndroidAdsBridge');}

async function requestNativeConsent(){
  if(!nativeBridgeReady('AndroidConsentBridge'))return {status:'not_configured'};
  return callNativeBridge('AndroidConsentBridge','requestIfRequired',{});
}

function save(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{}
}

function resetDailyChallengeIfNeeded(){
  if(state.challenge?.date!==today()) state.challenge={date:today(),completedToday:0,clearedToday:0,claimed:[]};
}

function restoreLives(){
  if(state.lives>=5){state.lives=5;state.lifeClock=Date.now();return;}
  const elapsed=Date.now()-safeNumber(state.lifeClock,Date.now());
  const gained=Math.floor(elapsed/LIFE_MS);
  if(gained>0){state.lives=Math.min(5,state.lives+gained);state.lifeClock+=gained*LIFE_MS;if(state.lives===5)state.lifeClock=Date.now();save();}
}

function lifeLabel(){
  restoreLives();
  if(state.lives>=5)return 'MAX';
  const left=Math.max(0,LIFE_MS-(Date.now()-state.lifeClock));
  const min=Math.floor(left/60000),sec=Math.floor((left%60000)/1000);
  return `${min}:${String(sec).padStart(2,'0')}`;
}

function totalStars(){return Object.values(state.stars).reduce((sum,n)=>sum+safeNumber(n),0);}
function unlockedMonuments(){return Object.keys(state.collection).filter(id=>state.collection[id]>0).length;}
function starsInDestination(destination){let sum=0;for(let i=destination.levels[0];i<=destination.levels[1];i++)sum+=safeNumber(state.stars[i]);return sum;}
function destinationProgress(destination){const done=clamp(state.level-destination.levels[0],0,30);return Math.round((done/30)*100);}
function isDailyReady(){return state.lastDaily!==today();}

function htmlEscape(value){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}

const audio={
  ctx:null,music:[],
  ensure(){if(!this.ctx)try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch{};if(this.ctx?.state==='suspended')this.ctx.resume();},
  tone(freq=440,duration=.08,volume=.035,type='sine',delay=0){if(!state.settings.sound)return;this.ensure();if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(this.ctx.destination);o.start(t);o.stop(t+duration+.03);},
  click(){this.tone(360,.05,.025,'triangle')},
  match(cascade=1){this.tone(440+cascade*65,.09,.035,'sine');if(cascade>2)this.tone(660+cascade*55,.12,.025,'triangle',.05)},
  win(){[523,659,784,1047].forEach((f,i)=>this.tone(f,.28,.045,'triangle',i*.09))},
  fail(){[260,220,180].forEach((f,i)=>this.tone(f,.22,.03,'sine',i*.1))},
  stopMusic(){for(const n of this.music){try{n.stop()}catch{}}this.music=[];},
  startMusic(index=0){this.stopMusic();if(!state.settings.music)return;this.ensure();if(!this.ctx)return;const root=[110,123.47,98,130.81,103.83][index%5];for(const [ratio,gain] of [[1,.006],[1.5,.004]]){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=root*ratio;g.gain.value=gain;o.connect(g).connect(this.ctx.destination);o.start();this.music.push(o);}}
};

function vibrate(pattern=18){if(state.settings.vibration&&navigator.vibrate)navigator.vibrate(pattern)}

function toast(message){
  const el=document.createElement('div');el.className='toast';el.textContent=message;toastLayer.append(el);setTimeout(()=>el.remove(),2550);
}

function closeModal(){modalLayer.innerHTML='';adReward=null;}

function showModal(html,{dismissible=true}={}){
  modalLayer.innerHTML=`<section class="modal" role="dialog" aria-modal="true">${dismissible?'<button class="close-x" data-action="close-modal" aria-label="Fermer">×</button>':''}${html}</section>`;
  modalLayer.querySelector('button')?.focus();
}

function statusPills(){return `<div class="status-pill" title="Vies"><span class="status-icon">❤️</span><strong>${state.lives}</strong><span class="life-timer">${lifeLabel()}</span></div><div class="status-pill" title="Pièces"><span class="status-icon">🪙</span><strong>${state.coins}</strong></div>`;}

function renderHome(){
  screen='home';document.body.classList.remove('game-active');session=null;selected=null;selectedBooster=null;locked=false;audio.stopMusic();
  const destination=getDestinationForLevel(state.level);
  const within=((state.level-1)%30)+1;
  const dailyDot=isDailyReady()?' •':'';
  app.innerHTML=`
    <main class="screen home-screen">
      <header class="home-top">
        <button class="icon-button" data-action="daily" aria-label="Récompense quotidienne">🎁</button>
        <div style="display:flex;gap:7px">${statusPills()}</div>
        <button class="icon-button" data-action="settings" aria-label="Paramètres">⚙️</button>
      </header>
      <section class="home-brand" aria-labelledby="game-title">
        <p class="eyebrow">Un voyage. Mille matchs.</p>
        <h1 class="logo" id="game-title">MONU<span>MANIA</span></h1>
        <p class="tagline">Le monde à portée de match !</p>
      </section>
      <section class="journey-card" aria-label="Progression actuelle">
        <span class="destination-kicker">${destination.flag} Prochaine escale</span>
        <div class="journey-row"><h2 class="journey-city">${destination.name}</h2><span class="journey-level">Niveau ${state.level}</span></div>
        <div class="progress-track" aria-label="Progression de la destination"><div class="progress-fill" style="width:${destinationProgress(destination)}%"></div></div>
        <div class="stars-line"><span>Étape ${within}/30</span><strong>★ ${starsInDestination(destination)}/90</strong></div>
      </section>
      <button class="primary-button" data-action="play">${state.activeGame?'REPRENDRE':'JOUER'} · NIVEAU ${state.activeGame?.level||state.level}</button>
      <nav class="quick-nav" aria-label="Menu principal">
        <button class="nav-card" data-action="map"><span>✈️</span><small>VOYAGE</small></button>
        <button class="nav-card" data-action="collection"><span>🗺️</span><small>COLLECTION</small></button>
        <button class="nav-card" data-action="challenges"><span>🏆</span><small>DÉFIS${dailyDot}</small></button>
        <button class="nav-card" data-action="shop"><span>🛍️</span><small>BOUTIQUE</small></button>
        <button class="nav-card" data-action="stats"><span>📊</span><small>STATS</small></button>
      </nav>
    </main>`;
}

function pageHeader(title,subtitle='',right=''){
  return `<header class="page-header"><button class="icon-button" data-action="home" aria-label="Retour à l’accueil">←</button><div><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div>${right||'<span></span>'}</header>`;
}

function renderMap(){
  screen='map';audio.stopMusic();
  const cards=DESTINATIONS.map((d,index)=>{
    const lockedDest=state.level<d.levels[0];const current=state.level>=d.levels[0]&&state.level<=d.levels[1];
    const level=current?state.level:d.levels[0];
    return `<button class="destination-card ${lockedDest?'locked':''}" style="--dest:${d.color}" ${lockedDest?'disabled':''} data-action="start-level" data-level="${level}">
      <span class="destination-badge">${lockedDest?'🔒':d.flag}</span><span><h3>${d.name}</h3><p>${lockedDest?`Débloquée au niveau ${d.levels[0]}`:`Niveaux ${d.levels[0]}–${d.levels[1]} · ${Math.min(30,Math.max(0,state.level-d.levels[0]))}/30 terminés`}</p></span><span class="destination-stars">★ ${starsInDestination(d)}<br>${current?'ICI':''}</span>
    </button>`;
  }).join('');
  app.innerHTML=`<main class="screen page-screen">${pageHeader('Voyage','300 niveaux · 10 destinations')}<section class="content-panel"><div class="map-route">${cards}</div></section></main>`;
}

function monumentArt(monument,large=false){
  if(Number.isInteger(monument?.sprite)){
    const sx=monument.sprite%4,sy=Math.floor(monument.sprite/4);
    return `<span class="tile-art" style="--sx:${sx};--sy:${sy}" aria-hidden="true"></span>`;
  }
  return `<span class="${large?'card-emoji':'tile-emoji'}" aria-hidden="true">${monument?.emoji||'🏛️'}</span>`;
}

function renderCollection(){
  screen='collection';audio.stopMusic();
  const cards=MONUMENTS.map(m=>{
    const count=safeNumber(state.collection[m.id]);const lockedCard=count<=0;
    return `<button class="monument-card ${lockedCard?'locked':''}" data-action="monument" data-id="${m.id}" style="--hue:${m.hue}"><span class="rarity">${lockedCard?'À découvrir':m.rarity}${count>1?` · ×${count}`:''}</span><span class="card-art">${monumentArt(m,true)}</span><h3>${lockedCard?'Monument mystère':m.name}</h3><p>${lockedCard?'Continue le voyage':`${m.city} · ${m.country}`}</p></button>`;
  }).join('');
  app.innerHTML=`<main class="screen page-screen">${pageHeader('Ma collection','Les monuments sont les stars')}<section class="content-panel"><div class="collection-summary"><span>Cartes découvertes</span><strong>${unlockedMonuments()} / ${MONUMENTS.length}</strong></div><div class="collection-grid">${cards}</div></section></main>`;
}

function renderShop(){
  screen='shop';audio.stopMusic();
  const prices={hammer:120,swap:160,rocket:200,globe:280};
  const items=Object.values(BOOSTERS).map(b=>`<article class="shop-item"><span class="shop-icon">${b.icon}</span><div><h3>${b.name} · ${state.boosters[b.id]}</h3><p>${b.description}</p></div><button class="buy-button" data-action="buy" data-kind="${b.id}" data-price="${prices[b.id]}" ${state.coins<prices[b.id]?'disabled':''}>🪙 ${prices[b.id]}</button></article>`).join('');
  app.innerHTML=`<main class="screen page-screen">${pageHeader('Boutique','Des raccourcis utiles, jamais obligatoires',`<div class="status-pill"><span>🪙</span><strong>${state.coins}</strong></div>`)}<section class="content-panel"><div class="shop-grid">${items}<article class="shop-item"><span class="shop-icon">🎬</span><div><h3>Coup de pouce</h3><p>Une publicité ${nativeAdsReady()?'':'simulée '}récompensée, uniquement si tu le souhaites.</p></div><button class="buy-button" data-action="ad-coins">+60 🪙</button></article></div></section></main>`;
}

function renderStats(){
  screen='stats';audio.stopMusic();
  const hours=Math.floor(state.stats.playSeconds/3600),minutes=Math.floor((state.stats.playSeconds%3600)/60);
  const entries=[['🏁',state.stats.levelsCompleted,'Niveaux terminés'],['⭐',totalStars(),'Étoiles obtenues'],['🗺️',unlockedMonuments(),'Monuments découverts'],['⚡',`×${state.stats.bestCombo}`,'Meilleur combo'],['✨',state.stats.totalCleared.toLocaleString('fr-FR'),'Pièces associées'],['✈️',state.stats.destinationsVisited,'Destinations visitées'],['⏱️',`${hours}h ${minutes}m`,'Temps de jeu'],['🔥',state.streak,'Série de connexions']];
  app.innerHTML=`<main class="screen page-screen">${pageHeader('Mes stats','Ton carnet de voyage en chiffres')}<section class="content-panel"><div class="stats-grid">${entries.map(([icon,value,label])=>`<article class="stat-card"><span>${icon}</span><strong>${value}</strong><small>${label}</small></article>`).join('')}</div></section></main>`;
}

function renderSettings(){
  screen='settings';audio.stopMusic();
  const rows=[['sound','Sons','Effets courts pendant les matchs','🔊'],['music','Musique','Ambiance légère selon la destination','🎵'],['vibration','Vibrations','Retour tactile discret','📳'],['reducedMotion','Animations réduites','Réduit les mouvements visuels','🫧']];
  app.innerHTML=`<main class="screen page-screen">${pageHeader('Paramètres','À ton rythme')}<section class="content-panel"><div class="settings-list">${rows.map(([key,title,desc,icon])=>`<div class="setting-row"><div><strong>${icon} ${title}</strong><small>${desc}</small></div><button class="switch ${state.settings[key]?'on':''}" role="switch" aria-checked="${state.settings[key]}" aria-label="${title}" data-action="toggle-setting" data-key="${key}"></button></div>`).join('')}</div></section></main>`;
}

function challengeDefinitions(){
  resetDailyChallengeIfNeeded();
  return [
    {id:'levels',icon:'🏁',label:'Terminer 3 niveaux',value:state.challenge.completedToday,target:3,reward:80},
    {id:'cleared',icon:'✨',label:'Associer 150 monuments',value:state.challenge.clearedToday,target:150,reward:60},
    {id:'combo',icon:'⚡',label:'Atteindre un combo ×4',value:Math.min(4,state.stats.bestCombo),target:4,reward:90}
  ];
}

function renderChallenges(){
  screen='challenges';audio.stopMusic();
  const list=challengeDefinitions().map(c=>{
    const done=c.value>=c.target,claimed=state.challenge.claimed.includes(c.id);const pct=clamp((c.value/c.target)*100,0,100);
    return `<article class="shop-item"><span class="shop-icon">${c.icon}</span><div><h3>${c.label}</h3><div class="progress-track" style="margin:7px 0 3px"><div class="progress-fill" style="width:${pct}%"></div></div><p>${Math.min(c.value,c.target)} / ${c.target}</p></div><button class="buy-button" data-action="claim-challenge" data-id="${c.id}" ${!done||claimed?'disabled':''}>${claimed?'✓':`+${c.reward} 🪙`}</button></article>`;
  }).join('');
  app.innerHTML=`<main class="screen page-screen">${pageHeader('Défis du jour','Trois objectifs, aucune obligation')}<section class="content-panel"><div class="shop-grid">${list}</div><button class="primary-button gold" style="margin-top:14px" data-action="daily">🎁 RÉCOMPENSE QUOTIDIENNE</button></section></main>`;
}

function renderDaily(){
  screen='daily';audio.stopMusic();
  const projected=state.lastDaily===today()?Math.max(1,state.streak):state.lastDaily===yesterday()?state.streak+1:1;
  const currentIndex=(projected-1)%7;
  const days=DAILY_REWARDS.map((r,i)=>`<article class="daily-day ${i===currentIndex?'current':''} ${state.lastDaily===today()&&i===currentIndex?'claimed':''}"><small>JOUR ${i+1}</small><span>${r.icon}</span><strong>${r.label}</strong></article>`).join('');
  app.innerHTML=`<main class="screen page-screen">${pageHeader('Carnet quotidien','Reviens chaque jour pour compléter la série')}<section class="content-panel"><div class="daily-row">${days}</div><button class="primary-button gold" data-action="claim-daily" ${!isDailyReady()?'disabled':''}>${isDailyReady()?'RÉCUPÉRER':'DÉJÀ RÉCUPÉRÉE'}</button></section></main>`;
}

function goalProgress(goal){
  if(!session)return 0;
  if(goal.type==='collect')return safeNumber(session.progress.collect[goal.id]);
  if(goal.type==='score')return session.score;
  return safeNumber(session.progress.obstacles[goal.type]);
}

function goalIcon(goal){
  if(goal.type==='collect'){const m=monumentById(goal.id);return m?.emoji||'🏛️';}
  return {ice:'🧊',postcard:'💌',score:'⭐',crate:'📦',chain:'⛓️'}[goal.type]||'🎯';
}

function goalLabel(goal){
  if(goal.type==='collect')return monumentById(goal.id)?.name||'Monument';
  return {ice:'Glace',postcard:'Cartes postales',score:'Score',crate:'Caisses',chain:'Chaînes'}[goal.type]||'Objectif';
}

function goalsHtml(){
  return session.config.goals.map(goal=>{const value=goalProgress(goal),done=value>=goal.target;return `<div class="goal ${done?'done':''}" title="${htmlEscape(goalLabel(goal))}"><span class="goal-art">${goalIcon(goal)}</span><span class="goal-count">${Math.min(value,goal.target)} / ${goal.target}</span></div>`;}).join('');
}

function tileHtml(tile,obstacle,r,c){
  if(!tile)return `<span class="tile" aria-hidden="true" style="opacity:.08"></span>`;
  const globe=tile.special==='globe'||tile.type==='__globe__';const m=globe?null:monumentById(tile.type);const selectedNow=selected?.r===r&&selected?.c===c;const clearing=visualClears.has(`${r}:${c}`);
  const label=globe?'Globe Mania':m?.name||'Monument';
  return `<button class="tile ${selectedNow?'selected':''} ${clearing?'clearing':''}" data-cell data-r="${r}" data-c="${c}" data-special="${tile.special||''}" aria-label="${htmlEscape(label)}${obstacle?`, obstacle ${obstacle.kind}`:''}" style="--hue:${m?.hue??205}">
    ${globe?'<span class="tile-emoji">🌍</span>':monumentArt(m)}
    ${!globe?`<span class="tile-code">${htmlEscape((m?.name||'??').split(' ').map(s=>s[0]).join('').slice(0,2))}</span>`:''}
    ${tile.special?'<span class="special-mark"></span>':''}
    ${obstacle?`<span class="obstacle ${obstacle.kind}">${obstacle.layers>1?`<span class="layers">${obstacle.layers}</span>`:''}</span>`:''}
  </button>`;
}

function sideRouteHtml(){
  const currentIndex=DESTINATIONS.findIndex(d=>d.id===session.config.destination.id);
  return DESTINATIONS.slice(Math.max(0,currentIndex-1),currentIndex+3).map(d=>`<div class="mini-stop ${state.level>d.levels[1]?'done':d.id===session.config.destination.id?'current':''}">${d.flag} ${d.name}</div>`).join('');
}

function gameBoardHtml(){
  return session.board.tiles.map((row,r)=>row.map((tile,c)=>tileHtml(tile,session.board.obstacles[r][c],r,c)).join('')).join('');
}

function gameBoostersHtml(){
  return Object.values(BOOSTERS).map(b=>`<button class="booster ${selectedBooster===b.id?'selected':''}" data-action="booster" data-kind="${b.id}" ${state.boosters[b.id]<=0||locked?'disabled':''} aria-label="${b.name}, ${state.boosters[b.id]} disponible(s)"><span class="booster-icon">${b.icon}</span><span class="booster-name">${b.name}</span><span class="booster-count">${state.boosters[b.id]}</span></button>`).join('');
}

function updateGameView(){
  const boardEl=app.querySelector('.board');
  if(!boardEl)return false;
  boardEl.innerHTML=gameBoardHtml();
  boardEl.setAttribute('aria-busy',locked?'true':'false');
  const goalList=app.querySelector('.goal-list');if(goalList)goalList.innerHTML=goalsHtml();
  const movesCard=app.querySelector('.moves-card');if(movesCard){movesCard.classList.toggle('low',session.moves<=5);const value=movesCard.querySelector('strong');if(value)value.textContent=String(session.moves);}
  const scoreValue=app.querySelector('.score-value');if(scoreValue)scoreValue.textContent=session.score.toLocaleString('fr-FR');
  const comboValue=app.querySelector('.best-combo-value');if(comboValue)comboValue.textContent=session.bestCombo>1?`×${session.bestCombo}`:'—';
  const sideCombo=app.querySelector('.side-best-combo');if(sideCombo)sideCombo.textContent=`×${state.stats.bestCombo}`;
  const coins=app.querySelector('.game-coins');if(coins)coins.textContent=String(state.coins);
  const lives=app.querySelector('.game-lives');if(lives)lives.textContent=String(state.lives);
  const boosters=app.querySelector('.boosters');if(boosters)boosters.innerHTML=gameBoostersHtml();
  const comboSlot=app.querySelector('.combo-slot');if(comboSlot)comboSlot.innerHTML=comboText?`<div class="combo-banner">${comboText}</div>`:'';
  const shuffleSlot=app.querySelector('.shuffle-slot');if(shuffleSlot)shuffleSlot.innerHTML=shuffleVisible?'<div class="shuffle-note">✦ Aucun coup : mélange !</div>':'';
  const tutorialSlot=app.querySelector('.tutorial-slot');if(tutorialSlot)tutorialSlot.innerHTML=!state.tutorialSeen?'<div class="tutorial"><div class="tutorial-tip">Fais glisser un monument pour en aligner 3.<span class="tutorial-hand">👆</span></div></div>':'';
  return true;
}

function renderGame(){
  if(!session)return renderHome();
  const config=session.config;
  const currentGame=app.querySelector('.game-screen');
  const canPatch=screen==='game'&&!!currentGame&&Number(currentGame.dataset.gameLevel)===config.level;
  screen='game';document.body.classList.add('game-active');
  if(canPatch&&updateGameView())return;
  const destination=config.destination;
  const board=gameBoardHtml();
  const boosters=gameBoostersHtml();
  app.innerHTML=`<main class="screen game-screen" data-game-level="${config.level}">
    <aside class="side-panel left"><h2>Itinéraire</h2><div class="mini-route">${sideRouteHtml()}</div></aside>
    <section class="game-main">
      <header class="game-top"><button class="icon-button" data-action="exit-game" aria-label="Quitter le niveau">←</button><div class="level-title"><strong>${destination.flag} ${destination.name} · ${config.level}</strong><small>Étape ${config.local}/30</small></div><div class="status-pill"><span>🪙</span><strong class="game-coins">${state.coins}</strong></div><div class="status-pill"><span>❤️</span><strong class="game-lives">${state.lives}</strong></div></header>
      <div class="mission-bar"><section class="goals-card"><div class="goals-label">Objectifs</div><div class="goal-list">${goalsHtml()}</div></section><div class="moves-card ${session.moves<=5?'low':''}"><strong>${session.moves}</strong><span>coups</span></div></div>
      <div class="score-strip"><span>Score <strong class="score-value">${session.score.toLocaleString('fr-FR')}</strong></span><span class="difficulty ${config.difficulty.toLowerCase()}">${config.difficulty==='NORMAL'?'VOYAGE':config.difficulty}</span><span>Record <strong class="best-combo-value">${session.bestCombo>1?`×${session.bestCombo}`:'—'}</strong></span></div>
      <div class="board-wrap"><div class="board" role="grid" aria-label="Grille Match-3 8 par 8" aria-busy="${locked?'true':'false'}">${board}</div><div class="combo-slot">${comboText?`<div class="combo-banner">${comboText}</div>`:''}</div><div class="shuffle-slot">${shuffleVisible?'<div class="shuffle-note">✦ Aucun coup : mélange !</div>':''}</div><div class="tutorial-slot">${!state.tutorialSeen?'<div class="tutorial"><div class="tutorial-tip">Fais glisser un monument pour en aligner 3.<span class="tutorial-hand">👆</span></div></div>':''}</div></div>
      <div class="boosters" aria-label="Boosters">${boosters}</div>
    </section>
    <aside class="side-panel right"><h2>Carnet de bord</h2><div class="side-stat"><span>Niveau</span><strong>${config.level}</strong></div><div class="side-stat"><span>Étoiles</span><strong>${totalStars()}</strong></div><div class="side-stat"><span>Collection</span><strong>${unlockedMonuments()}/${MONUMENTS.length}</strong></div><div class="side-stat"><span>Meilleur combo</span><strong class="side-best-combo">×${state.stats.bestCombo}</strong></div></aside>
  </main>`;
}

function buildLevel(level){
  const config=getLevelConfig(level);const rng=seededRandom(level*4099+state.stats.losses*31+Date.now()%997);
  const obstacleGoals=config.goals.filter(g=>['ice','postcard','crate','chain'].includes(g.type));
  let obstacleKinds=obstacleGoals.map(g=>g.type);
  if(!obstacleKinds.length&&config.local>10)obstacleKinds=config.local%2?['chain']:['crate'];
  const required=obstacleGoals.reduce((sum,g)=>sum+g.target,0);
  const obstacleCount=Math.max(config.obstacleCount,required);
  const board=createBoard({types:config.destination.monumentIds,rng,obstacleCount:obstacleKinds.length?obstacleCount:0,obstacleKinds});
  return {level,config,board,moves:config.moves,score:0,bestCombo:1,progress:{collect:{},obstacles:{}},startedAt:Date.now(),failed:false};
}

function serializeSession(){
  if(!session)return null;
  return {level:session.level,board:session.board,moves:session.moves,score:session.score,bestCombo:session.bestCombo,progress:session.progress,startedAt:session.startedAt};
}

function persistActiveGame(){state.activeGame=serializeSession();save();}

function restoreSession(saved){
  const config=getLevelConfig(saved.level);return {...saved,config,failed:false,startedAt:saved.startedAt||Date.now(),bestCombo:saved.bestCombo||1,progress:saved.progress||{collect:{},obstacles:{}}};
}

function startLevel(level,{resume=false}={}){
  restoreLives();
  if(state.lives<=0){showNoLives();return;}
  const target=clamp(Number(level)||1,1,state.level);
  session=resume&&state.activeGame?.level===target?restoreSession(state.activeGame):buildLevel(target);
  selected=null;selectedBooster=null;visualClears=new Set();comboText='';locked=false;
  const destIndex=DESTINATIONS.findIndex(d=>d.id===session.config.destination.id);audio.startMusic(destIndex);renderGame();persistActiveGame();
}

function allGoalsDone(){return session.config.goals.every(goal=>goalProgress(goal)>=goal.target);}

function addStepProgress(step){
  for(const [id,count] of Object.entries(step.collected))session.progress.collect[id]=(session.progress.collect[id]||0)+count;
  for(const [kind,count] of Object.entries(step.obstaclesCleared))session.progress.obstacles[kind]=(session.progress.obstacles[kind]||0)+count;
  session.score+=step.score;session.bestCombo=Math.max(session.bestCombo,step.cascade);
  state.stats.totalCleared+=step.cleared;state.challenge.clearedToday+=step.cleared;
}

function comboLabel(cascade){return cascade>=5?'MONUMANIA !':cascade===4?'INCROYABLE !':cascade===3?'SUPER !':cascade===2?'COMBO !':'';}

async function animateResult(result,{spendMove=true}={}){
  locked=true;if(spendMove)session.moves=Math.max(0,session.moves-1);
  for(const step of result.steps){
    session.board=step.beforeClear;visualClears=new Set(step.clearKeys||[]);addStepProgress(step);comboText=comboLabel(step.cascade);renderGame();audio.match(step.cascade);if(step.cascade>1)vibrate([14,25,18]);await sleep(state.settings.reducedMotion?20:190);
    session.board=step.afterFall;visualClears=new Set();comboText='';renderGame();await sleep(state.settings.reducedMotion?15:125);
  }
  session.board=result.board;visualClears=new Set();
  if(result.shuffled){shuffleVisible=true;renderGame();await sleep(state.settings.reducedMotion?50:650);shuffleVisible=false;}
  state.stats.bestCombo=Math.max(state.stats.bestCombo,session.bestCombo);persistActiveGame();locked=false;renderGame();
  if(allGoalsDone())showVictory();else if(session.moves<=0)showFailure();
}

async function attemptSwap(a,b,{force=false,spendMove=true}={}){
  if(locked||!session)return;
  const result=performMove(session.board,a,b,{rng:seededRandom(Date.now()+session.score),force});
  if(!result.valid){audio.tone(160,.08,.025,'square');vibrate(25);selected=null;renderGame();return;}
  state.tutorialSeen=true;selected=null;save();await animateResult(result,{spendMove});
}

function handleCell(pos){
  if(locked||!session)return;
  if(!state.tutorialSeen){state.tutorialSeen=true;save();renderGame();}
  if(selectedBooster&&selectedBooster!=='swap')return useDirectBooster(selectedBooster,pos);
  if(!selected){selected=pos;audio.click();renderGame();return;}
  if(selected.r===pos.r&&selected.c===pos.c){selected=null;renderGame();return;}
  if(Math.abs(selected.r-pos.r)+Math.abs(selected.c-pos.c)!==1){selected=pos;audio.click();renderGame();return;}
  const from=selected;selected=null;
  if(selectedBooster==='swap')return useSwapBooster(from,pos);
  attemptSwap(from,pos);
}

async function useDirectBooster(kind,pos){
  if(state.boosters[kind]<=0)return;
  const result=activateBooster(session.board,kind,pos,{rng:seededRandom(Date.now())});
  if(!result.valid)return;
  state.boosters[kind]--;selectedBooster=null;save();vibrate([18,30,25]);await animateResult(result,{spendMove:false});
}

async function useSwapBooster(a,b){
  if(state.boosters.swap<=0)return;
  state.boosters.swap--;selectedBooster=null;save();const result=performMove(session.board,a,b,{rng:seededRandom(Date.now()),force:true});await animateResult(result,{spendMove:false});
}

function calculateStars(){
  const ratio=session.moves/session.config.moves;
  if(ratio>=.45||session.bestCombo>=5)return 3;
  if(ratio>=.2||session.bestCombo>=3)return 2;
  return 1;
}

function showVictory(){
  locked=true;audio.win();vibrate([30,50,30,50,70]);
  const stars=calculateStars(),level=session.level,previous=safeNumber(state.stars[level]);
  state.stars[level]=Math.max(previous,stars);
  const reward=session.config.rewards.coins+session.moves*2;state.coins+=reward;
  if(previous===0){state.stats.levelsCompleted++;state.stats.wins++;state.challenge.completedToday++;}
  state.stats.totalStars=totalStars();state.level=Math.max(state.level,Math.min(300,level+1));
  state.stats.destinationsVisited=Math.max(state.stats.destinationsVisited,DESTINATIONS.findIndex(d=>d.id===getDestinationForLevel(state.level).id)+1);
  const earnedId=session.config.destination.monumentIds[(session.config.local-1)%session.config.destination.monumentIds.length];state.collection[earnedId]=(state.collection[earnedId]||0)+1;
  state.activeGame=null;save();
  const card=monumentById(earnedId);
  showModal(`<div class="modal-icon">🎉</div><h2>Niveau terminé !</h2><div class="modal-stars">${[1,2,3].map(i=>`<span class="${i<=stars?'earned':''}">★</span>`).join('')}</div><div class="result-list"><div class="result-row"><span>Score</span><strong>${session.score.toLocaleString('fr-FR')}</strong></div><div class="result-row"><span>Pièces gagnées</span><strong>+${reward} 🪙</strong></div><div class="result-row"><span>Carte de voyage</span><strong>${htmlEscape(card.name)}</strong></div></div><div class="modal-actions"><button class="primary-button" data-action="victory-continue">CONTINUER</button><button class="text-button" data-action="victory-replay">Rejouer le niveau</button></div>`,{dismissible:false});
}

function showFailure(){
  locked=true;audio.fail();if(!session.failed){session.failed=true;state.lives=Math.max(0,state.lives-1);state.lifeClock=Date.now();state.stats.losses++;save();}
  const missing=session.config.goals.filter(g=>goalProgress(g)<g.target).map(g=>`${goalIcon(g)} ${goal.target-goalProgress(g)} ${goalLabel(g)}`).join(' · ');
  showModal(`<div class="modal-icon">🧭</div><h2>Presque arrivé !</h2><p>Il manque encore : ${htmlEscape(missing)}</p><div class="modal-actions"><button class="primary-button gold" data-action="continue-coins" ${state.coins<150?'disabled':''}>+5 COUPS · 150 🪙</button><button class="primary-button secondary" data-action="continue-ad">🎬 ${nativeAdsReady()?'PUB':'PUB SIMULÉE'} · +5 COUPS</button><button class="text-button" data-action="restart">Recommencer</button><button class="text-button" data-action="give-up">Retour à l’accueil</button></div>`,{dismissible:false});
}

function showNoLives(){
  showModal(`<div class="modal-icon">❤️</div><h2>Les vies se rechargent</h2><p>Prochaine vie dans ${lifeLabel()}. Tu peux attendre ou utiliser une publicité ${nativeAdsReady()?'':'simulée '}récompensée.</p><div class="modal-actions"><button class="primary-button secondary" data-action="ad-life">🎬 RÉCUPÉRER UNE VIE</button><button class="text-button" data-action="close-modal">Plus tard</button></div>`,{dismissible:false});
}

function showSimulatedAd({label='Récompense',seconds=3,onReward,interstitial=false}){
  adReward=onReward;let remaining=seconds;
  modalLayer.innerHTML=`<section class="modal ad-card" role="dialog" aria-modal="true"><span class="ad-badge">PUBLICITÉ SIMULÉE</span><div class="modal-icon">✈️</div><h2>${interstitial?'Escale express':'Bonus voyage'}</h2><p>${htmlEscape(label)}</p><div class="ad-timer" id="ad-timer">${remaining}</div><div class="ad-progress"><div id="ad-progress" style="width:0%"></div></div><button class="primary-button" id="ad-claim" disabled>${interstitial?'CONTINUER':'RÉCUPÉRER'}</button></section>`;
  const timer=setInterval(()=>{remaining--;const timerEl=document.querySelector('#ad-timer'),bar=document.querySelector('#ad-progress');if(timerEl)timerEl.textContent=remaining>0?remaining:'✓';if(bar)bar.style.width=`${((seconds-remaining)/seconds)*100}%`;if(remaining<=0){clearInterval(timer);const btn=document.querySelector('#ad-claim');if(btn){btn.disabled=false;btn.addEventListener('click',()=>{const reward=adReward;closeModal();reward?.();},{once:true});}}},1000);
}

async function showMonetizedAd(options){
  if(!nativeAdsReady())return showSimulatedAd(options);
  closeModal();
  try{
    await requestNativeConsent();
    const method=options.interstitial?'showInterstitial':'showRewarded';
    const result=await callNativeBridge('AndroidAdsBridge',method,{placement:options.placement||'unknown'});
    if(options.interstitial||result?.rewarded)options.onReward?.();
    else showSimulatedAd(options);
  }catch{
    toast('Publicité indisponible · simulation locale');
    showSimulatedAd(options);
  }
}

function claimDaily(){
  if(!isDailyReady())return;
  state.streak=state.lastDaily===yesterday()?state.streak+1:1;state.lastDaily=today();
  const reward=DAILY_REWARDS[(state.streak-1)%7];if(reward.coins)state.coins+=reward.coins;if(reward.booster)state.boosters[reward.booster]++;
  save();audio.win();showModal(`<div class="modal-icon">${reward.icon}</div><h2>Jour ${((state.streak-1)%7)+1} récupéré !</h2><p>${reward.label} rejoint ton carnet de voyage.</p><button class="primary-button" data-action="close-daily">CONTINUER</button>`,{dismissible:false});
}

function showMonument(id){
  const m=monumentById(id),unlocked=safeNumber(state.collection[id])>0;if(!m)return;
  showModal(`<div class="modal-icon">${unlocked?m.emoji:'🔒'}</div><h2>${unlocked?htmlEscape(m.name):'Monument mystère'}</h2><p>${unlocked?`${htmlEscape(m.city)} · ${htmlEscape(m.country)}<br><br>${htmlEscape(m.fact)}`:'Continue ta progression pour découvrir cette carte.'}</p><button class="primary-button secondary" data-action="close-modal">FERMER</button>`);
}

function claimChallenge(id){
  const challenge=challengeDefinitions().find(c=>c.id===id);if(!challenge||challenge.value<challenge.target||state.challenge.claimed.includes(id))return;
  state.challenge.claimed.push(id);state.coins+=challenge.reward;save();toast(`Défi réussi : +${challenge.reward} pièces`);renderChallenges();
}

function navigate(action){
  closeModal();
  ({home:renderHome,map:renderMap,collection:renderCollection,shop:renderShop,stats:renderStats,settings:renderSettings,challenges:renderChallenges,daily:renderDaily}[action]||renderHome)();
}

app.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
  const action=button.dataset.action;audio.click();
  if(['home','map','collection','shop','stats','settings','challenges','daily'].includes(action))return navigate(action);
  if(action==='play')return startLevel(state.activeGame?.level||state.level,{resume:!!state.activeGame});
  if(action==='start-level')return startLevel(Number(button.dataset.level));
  if(action==='exit-game'){persistActiveGame();return renderHome();}
  if(action==='booster'){selectedBooster=selectedBooster===button.dataset.kind?null:button.dataset.kind;selected=null;toast(selectedBooster?`${BOOSTERS[selectedBooster].name} sélectionné`:'Booster rangé');return renderGame();}
  if(action==='buy'){const price=Number(button.dataset.price),kind=button.dataset.kind;if(state.coins>=price){state.coins-=price;state.boosters[kind]++;save();toast(`${BOOSTERS[kind].name} ajouté`);renderShop();}return;}
  if(action==='ad-coins')return showMonetizedAd({placement:'shop_coins',label:'+60 pièces',onReward:()=>{state.coins+=60;save();toast('+60 pièces');renderShop();}});
  if(action==='toggle-setting'){const key=button.dataset.key;state.settings[key]=!state.settings[key];save();return renderSettings();}
  if(action==='claim-daily')return claimDaily();
  if(action==='monument')return showMonument(button.dataset.id);
  if(action==='claim-challenge')return claimChallenge(button.dataset.id);
});

app.addEventListener('pointerdown',event=>{
  const tile=event.target.closest('[data-cell]');if(!tile||locked)return;event.preventDefault();pointerStart={x:event.clientX,y:event.clientY,r:Number(tile.dataset.r),c:Number(tile.dataset.c)};tile.setPointerCapture?.(event.pointerId);
},{passive:false});

app.addEventListener('pointermove',event=>{if(pointerStart)event.preventDefault();},{passive:false});
app.addEventListener('pointercancel',()=>{pointerStart=null;});

app.addEventListener('pointerup',event=>{
  if(!pointerStart||locked)return;event.preventDefault();const start=pointerStart;pointerStart=null;const dx=event.clientX-start.x,dy=event.clientY-start.y;const threshold=18;
  if(Math.max(Math.abs(dx),Math.abs(dy))<threshold)return handleCell({r:start.r,c:start.c});
  const target=Math.abs(dx)>Math.abs(dy)?{r:start.r,c:start.c+(dx>0?1:-1)}:{r:start.r+(dy>0?1:-1),c:start.c};
  if(target.r<0||target.r>=8||target.c<0||target.c>=8)return;state.tutorialSeen=true;save();attemptSwap({r:start.r,c:start.c},target);
});

modalLayer.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button||button.disabled)return;const action=button.dataset.action;audio.click();
  if(action==='close-modal')return closeModal();
  if(action==='close-daily'){closeModal();return renderHome();}
  if(action==='continue-coins'){if(state.coins<150)return;state.coins-=150;session.moves+=5;session.failed=false;locked=false;save();closeModal();persistActiveGame();return renderGame();}
  if(action==='continue-ad')return showMonetizedAd({placement:'continue_moves',label:'+5 mouvements',onReward:()=>{session.moves+=5;session.failed=false;locked=false;persistActiveGame();renderGame();}});
  if(action==='restart'){closeModal();state.activeGame=null;save();return startLevel(session.level);}
  if(action==='give-up'){closeModal();state.activeGame=null;save();return renderHome();}
  if(action==='ad-life')return showMonetizedAd({placement:'restore_life',label:'+1 vie',onReward:()=>{state.lives=Math.min(5,state.lives+1);save();renderHome();}});
  if(action==='victory-replay'){const level=session.level;closeModal();return startLevel(level);}
  if(action==='victory-continue'){
    const next=state.level,shouldInterstitial=state.stats.wins>0&&state.stats.wins%4===0&&state.lastInterstitialWin!==state.stats.wins;
    closeModal();if(shouldInterstitial){state.lastInterstitialWin=state.stats.wins;save();return showMonetizedAd({placement:'post_victory',label:'Une courte escale avant la prochaine destination',seconds:2,interstitial:true,onReward:()=>startLevel(next)});}return startLevel(next);
  }
});

window.addEventListener('keydown',event=>{
  if(screen!=='game'||locked||!selected)return;const directions={ArrowUp:{r:-1,c:0},ArrowDown:{r:1,c:0},ArrowLeft:{r:0,c:-1},ArrowRight:{r:0,c:1}};const d=directions[event.key];if(!d)return;event.preventDefault();const target={r:selected.r+d.r,c:selected.c+d.c};if(target.r>=0&&target.r<8&&target.c>=0&&target.c<8)attemptSwap(selected,target);
});

function registerWebMCP(){
  const context=document.modelContext;if(!context?.registerTool)return;
  const register=tool=>{try{void Promise.resolve(context.registerTool(tool)).catch(()=>{});}catch{}};
  register({name:'get_game_status',title:'Voir la progression MONUMANIA',description:'Retourne la progression, les vies, les pièces, les étoiles et la destination actuelle sans modifier le jeu.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({level:state.level,lives:state.lives,coins:state.coins,stars:totalStars(),monuments:unlockedMonuments(),destination:getDestinationForLevel(state.level).name})});
  register({name:'start_level',title:'Lancer un niveau MONUMANIA',description:'Ouvre et lance un niveau déjà débloqué du jeu.',inputSchema:{type:'object',properties:{level:{type:'integer',minimum:1,maximum:300}},required:['level'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{const level=Number(input?.level);if(!Number.isInteger(level)||level<1||level>state.level)throw new Error('Niveau non débloqué');startLevel(level);return {started:true,level,destination:getDestinationForLevel(level).name};}});
}

window.MONUMANIA={
  saveNow(){if(session)persistActiveGame();else save();return true;},
  onAppForeground(){restoreLives();if(screen==='game'&&session)renderGame();else if(screen==='home')renderHome();save();return true;},
  handleAndroidBack(){
    if(modalLayer.childElementCount){
      const dismissible=modalLayer.querySelector('.close-x,[data-action="close-modal"]');
      if(dismissible)closeModal();
      return true;
    }
    if(screen==='game'&&session){persistActiveGame();renderHome();return true;}
    if(screen!=='home'){renderHome();return true;}
    return false;
  }
};

setInterval(()=>{restoreLives();if(screen==='game'){state.stats.playSeconds++;if(state.stats.playSeconds%15===0)save();}document.querySelector('.life-timer')?.replaceChildren(document.createTextNode(lifeLabel()));},1000);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(session)persistActiveGame();save();}});
window.addEventListener('beforeunload',()=>{if(session)persistActiveGame();save();});
if('serviceWorker' in navigator&&!window.AndroidAdsBridge)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
resetDailyChallengeIfNeeded();restoreLives();save();registerWebMCP();renderHome();
