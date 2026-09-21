export const ROWS = 8;
export const COLS = 8;

export function seededRandom(seed=Date.now()){
  let value=(Number(seed)||1)>>>0;
  return ()=>{
    value=(value+0x6D2B79F5)>>>0;
    let t=value;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

export function cloneBoard(board){
  return {
    rows:board.rows,
    cols:board.cols,
    types:[...board.types],
    tiles:board.tiles.map(row=>row.map(tile=>tile?{...tile}:null)),
    obstacles:board.obstacles.map(row=>row.map(o=>o?{...o}:null))
  };
}

const keyOf=({r,c})=>`${r}:${c}`;
const parseKey=key=>{ const [r,c]=key.split(':').map(Number); return {r,c}; };
const inside=(board,p)=>p.r>=0&&p.r<board.rows&&p.c>=0&&p.c<board.cols;
const adjacent=(a,b)=>Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1;

function randomType(types,rng){ return types[Math.floor(rng()*types.length)]; }

function createTileMatrix(rows,cols,types,rng){
  const tiles=Array.from({length:rows},()=>Array(cols).fill(null));
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      let choices=[...types];
      if(c>=2&&tiles[r][c-1]?.type===tiles[r][c-2]?.type) choices=choices.filter(t=>t!==tiles[r][c-1].type);
      if(r>=2&&tiles[r-1][c]?.type===tiles[r-2][c]?.type) choices=choices.filter(t=>t!==tiles[r-1][c].type);
      tiles[r][c]={type:randomType(choices.length?choices:types,rng),special:null};
    }
  }
  return tiles;
}

export function createBoard({rows=ROWS,cols=COLS,types,rng=Math.random,obstacleCount=0,obstacleKinds=['ice','postcard','chain']}={}){
  if(!Array.isArray(types)||types.length<4) throw new Error('At least four tile types are required');
  let board;
  for(let attempt=0;attempt<80;attempt++){
    board={rows,cols,types:[...types],tiles:createTileMatrix(rows,cols,types,rng),obstacles:Array.from({length:rows},()=>Array(cols).fill(null))};
    if(hasPossibleMove(board)) break;
  }
  const candidates=[];
  for(let r=1;r<rows-1;r++) for(let c=0;c<cols;c++) candidates.push({r,c});
  for(let i=candidates.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [candidates[i],candidates[j]]=[candidates[j],candidates[i]]; }
  for(let i=0;i<Math.min(obstacleCount,candidates.length);i++){
    const p=candidates[i];
    const kind=obstacleKinds[i%obstacleKinds.length]||'ice';
    board.obstacles[p.r][p.c]={kind,layers:kind==='ice'&&i%5===0?2:1};
  }
  return board;
}

export function findMatches(board){
  const runs=[];
  for(let r=0;r<board.rows;r++){
    let start=0;
    while(start<board.cols){
      const tile=board.tiles[r][start];
      if(!tile||tile.type==='__globe__'){ start++; continue; }
      let end=start+1;
      while(end<board.cols&&board.tiles[r][end]?.type===tile.type) end++;
      if(end-start>=3) runs.push({orientation:'h',type:tile.type,cells:Array.from({length:end-start},(_,i)=>({r,c:start+i}))});
      start=end;
    }
  }
  for(let c=0;c<board.cols;c++){
    let start=0;
    while(start<board.rows){
      const tile=board.tiles[start][c];
      if(!tile||tile.type==='__globe__'){ start++; continue; }
      let end=start+1;
      while(end<board.rows&&board.tiles[end][c]?.type===tile.type) end++;
      if(end-start>=3) runs.push({orientation:'v',type:tile.type,cells:Array.from({length:end-start},(_,i)=>({r:start+i,c}))});
      start=end;
    }
  }
  const groups=[];
  for(const run of runs){
    const runKeys=new Set(run.cells.map(keyOf));
    const touching=[];
    groups.forEach((g,index)=>{ if(g.type===run.type&&g.cells.some(p=>runKeys.has(keyOf(p)))) touching.push(index); });
    if(!touching.length){ groups.push({type:run.type,cells:[...run.cells],runs:[run]}); continue; }
    const base=groups[touching[0]];
    base.runs.push(run);
    const seen=new Set(base.cells.map(keyOf));
    for(const p of run.cells) if(!seen.has(keyOf(p))){base.cells.push(p);seen.add(keyOf(p));}
    for(let i=touching.length-1;i>=1;i--){
      const extra=groups[touching[i]];
      for(const extraRun of extra.runs) base.runs.push(extraRun);
      for(const p of extra.cells) if(!seen.has(keyOf(p))){base.cells.push(p);seen.add(keyOf(p));}
      groups.splice(touching[i],1);
    }
  }
  return groups;
}

export function hasPossibleMove(board){
  const copy=cloneBoard(board);
  for(let r=0;r<copy.rows;r++) for(let c=0;c<copy.cols;c++){
    for(const p of [{r,c:c+1},{r:r+1,c}]){
      if(!inside(copy,p)) continue;
      const a=copy.tiles[r][c],b=copy.tiles[p.r][p.c];
      if(a?.special||b?.special) return true;
      [copy.tiles[r][c],copy.tiles[p.r][p.c]]=[b,a];
      const valid=findMatches(copy).length>0;
      [copy.tiles[r][c],copy.tiles[p.r][p.c]]=[a,b];
      if(valid) return true;
    }
  }
  return false;
}

export function reshuffleBoard(board,rng=Math.random){
  const next=cloneBoard(board);
  for(let attempt=0;attempt<100;attempt++){
    next.tiles=createTileMatrix(next.rows,next.cols,next.types,rng);
    if(!findMatches(next).length&&hasPossibleMove(next)) return next;
  }
  return next;
}

function preferredCell(group,preferred=[]){
  for(const p of preferred){ if(p&&group.cells.some(cell=>cell.r===p.r&&cell.c===p.c)) return {...p}; }
  const longest=[...group.runs].sort((a,b)=>b.cells.length-a.cells.length)[0];
  return {...longest.cells[Math.floor(longest.cells.length/2)]};
}

function chooseSpecial(group){
  const maxLen=Math.max(...group.runs.map(r=>r.cells.length));
  const orientations=new Set(group.runs.map(r=>r.orientation));
  if(maxLen>=5) return 'globe';
  if(orientations.size>1||group.cells.length>=5) return 'bomb';
  if(maxLen>=4) return group.runs.find(r=>r.cells.length===maxLen).orientation==='h'?'row':'col';
  return null;
}

function mostCommonType(board){
  const counts={};
  for(const row of board.tiles) for(const tile of row) if(tile&&tile.type!=='__globe__') counts[tile.type]=(counts[tile.type]||0)+1;
  return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||board.types[0];
}

function expandSpecials(board,clearSet){
  const queue=[...clearSet].map(parseKey);
  const activated=[];
  const seenSpecial=new Set();
  while(queue.length){
    const p=queue.shift(); const tile=board.tiles[p.r]?.[p.c];
    if(!tile?.special||seenSpecial.has(keyOf(p))) continue;
    seenSpecial.add(keyOf(p)); activated.push({pos:p,special:tile.special});
    const add=q=>{ if(inside(board,q)&&!clearSet.has(keyOf(q))){clearSet.add(keyOf(q));queue.push(q);} };
    if(tile.special==='row') for(let c=0;c<board.cols;c++) add({r:p.r,c});
    if(tile.special==='col') for(let r=0;r<board.rows;r++) add({r,c:p.c});
    if(tile.special==='bomb') for(let r=p.r-1;r<=p.r+1;r++) for(let c=p.c-1;c<=p.c+1;c++) add({r,c});
    if(tile.special==='globe'){
      const target=mostCommonType(board);
      for(let r=0;r<board.rows;r++) for(let c=0;c<board.cols;c++) if(board.tiles[r][c]?.type===target) add({r,c});
    }
  }
  return activated;
}

function collapseAndRefill(board,rng){
  for(let c=0;c<board.cols;c++){
    const kept=[];
    for(let r=board.rows-1;r>=0;r--) if(board.tiles[r][c]) kept.push(board.tiles[r][c]);
    for(let r=board.rows-1,i=0;r>=0;r--,i++) board.tiles[r][c]=i<kept.length?kept[i]:{type:randomType(board.types,rng),special:null};
  }
}

function resolveMatches(board,groups,preferred,rng,cascade){
  const specialPlacements=[];
  const clearSet=new Set();
  for(const group of groups){
    const special=chooseSpecial(group);
    let keep=null;
    if(special){
      keep=preferredCell(group,preferred);
      const type=special==='globe'?'__globe__':group.type;
      board.tiles[keep.r][keep.c]={type,special};
      specialPlacements.push({pos:keep,special,type:group.type});
    }
    for(const p of group.cells) if(!keep||p.r!==keep.r||p.c!==keep.c) clearSet.add(keyOf(p));
  }
  const activated=expandSpecials(board,clearSet);
  const beforeClear=cloneBoard(board);
  const clearKeys=[...clearSet];
  const collected={}; const obstaclesCleared={}; let cleared=0;
  for(const key of clearSet){
    const {r,c}=parseKey(key); const tile=board.tiles[r][c];
    if(tile){
      if(tile.type!=='__globe__') collected[tile.type]=(collected[tile.type]||0)+1;
      board.tiles[r][c]=null; cleared++;
    }
    const obstacle=board.obstacles[r][c];
    if(obstacle){
      obstacle.layers--;
      if(obstacle.layers<=0){ obstaclesCleared[obstacle.kind]=(obstaclesCleared[obstacle.kind]||0)+1; board.obstacles[r][c]=null; }
    }
    for(const n of [{r:r-1,c},{r:r+1,c},{r,c:c-1},{r,c:c+1}]){
      if(!inside(board,n)) continue;
      const obstacle=board.obstacles[n.r][n.c];
      if(obstacle&&(obstacle.kind==='crate'||obstacle.kind==='postcard')){
        obstacle.layers--;
        if(obstacle.layers<=0){ obstaclesCleared[obstacle.kind]=(obstaclesCleared[obstacle.kind]||0)+1; board.obstacles[n.r][n.c]=null; }
      }
    }
  }
  const beforeFall=cloneBoard(board);
  collapseAndRefill(board,rng);
  return {beforeClear,clearKeys,beforeFall,afterFall:cloneBoard(board),cleared,collected,obstaclesCleared,specialPlacements,activated,score:cleared*70*cascade+specialPlacements.length*220*cascade};
}

function activateSwapSpecials(board,a,b){
  const tileA=board.tiles[a.r][a.c],tileB=board.tiles[b.r][b.c];
  const clearSet=new Set();
  const forced=[];
  if(tileA?.special==='globe'||tileB?.special==='globe'){
    const globePos=tileA?.special==='globe'?a:b;
    const otherPos=globePos===a?b:a;
    const other=board.tiles[otherPos.r][otherPos.c];
    clearSet.add(keyOf(globePos)); clearSet.add(keyOf(otherPos));
    if(tileA?.special==='globe'&&tileB?.special==='globe'){
      for(let r=0;r<board.rows;r++) for(let c=0;c<board.cols;c++) clearSet.add(keyOf({r,c}));
    }else{
      const target=other?.type==='__globe__'?mostCommonType(board):other?.type;
      for(let r=0;r<board.rows;r++) for(let c=0;c<board.cols;c++) if(board.tiles[r][c]?.type===target){
        if(other?.special&&other.special!=='globe') board.tiles[r][c]={type:target,special:other.special};
        clearSet.add(keyOf({r,c}));
      }
    }
    forced.push(...expandSpecials(board,clearSet));
    return {clearSet,forced};
  }
  if(tileA?.special&&tileB?.special){
    clearSet.add(keyOf(a));clearSet.add(keyOf(b));
    forced.push(...expandSpecials(board,clearSet));
    return {clearSet,forced};
  }
  if(tileA?.special||tileB?.special){
    const p=tileA?.special?a:b; clearSet.add(keyOf(p));
    forced.push(...expandSpecials(board,clearSet));
    return {clearSet,forced};
  }
  return null;
}

function resolveForced(board,clearSet,rng){
  const collected={};const obstaclesCleared={};let cleared=0;
  expandSpecials(board,clearSet);
  const beforeClear=cloneBoard(board);const clearKeys=[...clearSet];
  for(const key of clearSet){
    const {r,c}=parseKey(key),tile=board.tiles[r][c];
    if(tile){if(tile.type!=='__globe__') collected[tile.type]=(collected[tile.type]||0)+1;board.tiles[r][c]=null;cleared++;}
    const obstacle=board.obstacles[r][c];
    if(obstacle){obstaclesCleared[obstacle.kind]=(obstaclesCleared[obstacle.kind]||0)+1;board.obstacles[r][c]=null;}
  }
  const beforeFall=cloneBoard(board);collapseAndRefill(board,rng);
  return {beforeClear,clearKeys,beforeFall,afterFall:cloneBoard(board),cleared,collected,obstaclesCleared,specialPlacements:[],activated:[],score:cleared*95};
}

export function performMove(source,a,b,{rng=Math.random,force=false}={}){
  if(!inside(source,a)||!inside(source,b)||!adjacent(a,b)) return {valid:false,reason:'adjacency',board:cloneBoard(source),steps:[]};
  if(source.obstacles[a.r][a.c]?.kind==='chain'||source.obstacles[b.r][b.c]?.kind==='chain') return {valid:false,reason:'locked',board:cloneBoard(source),steps:[]};
  const board=cloneBoard(source);
  [board.tiles[a.r][a.c],board.tiles[b.r][b.c]]=[board.tiles[b.r][b.c],board.tiles[a.r][a.c]];
  let groups=findMatches(board);
  const specialAction=activateSwapSpecials(board,a,b);
  if(!force&&!groups.length&&!specialAction) return {valid:false,reason:'no-match',board:cloneBoard(source),steps:[]};
  const steps=[];const total={score:0,collected:{},obstaclesCleared:{},maxCascade:0};
  if(specialAction){
    const step=resolveForced(board,specialAction.clearSet,rng);step.cascade=1;steps.push(step);
  }else if(force&&!groups.length){
    const step={beforeFall:cloneBoard(board),afterFall:cloneBoard(board),cleared:0,collected:{},obstaclesCleared:{},specialPlacements:[],activated:[],score:0,cascade:1};steps.push(step);
  }
  let cascade=steps.length?2:1;
  groups=findMatches(board);
  while(groups.length&&cascade<=12){
    const step=resolveMatches(board,groups,[b,a],rng,cascade);step.cascade=cascade;steps.push(step);
    groups=findMatches(board);cascade++;
  }
  for(const step of steps){
    total.score+=step.score;total.maxCascade=Math.max(total.maxCascade,step.cascade);
    for(const [k,v] of Object.entries(step.collected)) total.collected[k]=(total.collected[k]||0)+v;
    for(const [k,v] of Object.entries(step.obstaclesCleared)) total.obstaclesCleared[k]=(total.obstaclesCleared[k]||0)+v;
  }
  let shuffled=false;
  if(!hasPossibleMove(board)){ const mixed=reshuffleBoard(board,rng);board.tiles=mixed.tiles;shuffled=true; }
  return {valid:true,board,steps,total,shuffled};
}

export function activateBooster(source,kind,pos,{rng=Math.random}={}){
  const board=cloneBoard(source);
  if(!inside(board,pos)) return {valid:false,board:cloneBoard(source),steps:[]};
  if(kind==='hammer'){
    const clearSet=new Set([keyOf(pos)]);const step=resolveForced(board,clearSet,rng);step.cascade=1;
    return {valid:true,board,steps:[step],total:{score:step.score,collected:step.collected,obstaclesCleared:step.obstaclesCleared,maxCascade:1},shuffled:false};
  }
  if(kind==='rocket'){
    board.tiles[pos.r][pos.c].special='bomb';const clearSet=new Set([keyOf(pos)]);const step=resolveForced(board,clearSet,rng);step.cascade=1;
    return {valid:true,board,steps:[step],total:{score:step.score,collected:step.collected,obstaclesCleared:step.obstaclesCleared,maxCascade:1},shuffled:false};
  }
  if(kind==='globe'){
    const type=board.tiles[pos.r][pos.c]?.type;const clearSet=new Set();
    for(let r=0;r<board.rows;r++) for(let c=0;c<board.cols;c++) if(board.tiles[r][c]?.type===type) clearSet.add(keyOf({r,c}));
    const step=resolveForced(board,clearSet,rng);step.cascade=1;
    return {valid:true,board,steps:[step],total:{score:step.score,collected:step.collected,obstaclesCleared:step.obstaclesCleared,maxCascade:1},shuffled:false};
  }
  return {valid:false,board:cloneBoard(source),steps:[]};
}

export function countBoardObstacles(board){
  const counts={};for(const row of board.obstacles) for(const o of row) if(o) counts[o.kind]=(counts[o.kind]||0)+1;return counts;
}
