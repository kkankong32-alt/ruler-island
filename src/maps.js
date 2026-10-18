export const tileNames={start:'출발',normal:'문제',treasure:'보물',wind:'순풍 +2',whirlpool:'소용돌이 −2',bridge:'비밀다리 +3',gate:'관문',finish:'결승'};
const route=anchors=>Array.from({length:25},(_,i)=>{const u=i/24*(anchors.length-1),k=Math.min(anchors.length-2,Math.floor(u)),t=u-k;return {x:anchors[k][0]+(anchors[k+1][0]-anchors[k][0])*t,y:anchors[k][1]+(anchors[k+1][1]-anchors[k][1])*t};});

// Fork squares are plain landing spaces; their reward lane has independent rules.
function keepForksClear(events){const result={...events};for(const n of [8,18]){if(!result[n])continue;const type=result[n];delete result[n];const target=Array.from({length:23},(_,i)=>i+1).filter(i=>![8,18].includes(i)&&!result[i]).sort((a,b)=>Math.abs(a-n)-Math.abs(b-n)||a-b)[0];result[target]=type;}return result;}
const definitions=[
 {id:'coast',name:'조개해안',subtitle:'소수 두 자리·세 자리',landmark:'진주 조개항',asset:'map-coast.png',lessons:[1,2],color:'#6cd8cf',sound:'coast',anchors:[[140,740],[650,770],[1320,690],[1280,480],[700,460],[240,340],[780,235],[1450,210]],events:{3:'treasure',6:'wind',10:'treasure',14:'whirlpool',17:'bridge',21:'gate'}},
 {id:'forest',name:'바람숲',subtitle:'크기 비교·소수의 관계',landmark:'바람의 풍차',asset:'map-forest.png',lessons:[3,4],color:'#b5dc86',sound:'forest',anchors:[[130,760],[620,660],[1270,760],[1440,530],[960,440],[350,490],[520,230],[1410,210]],events:{4:'treasure',7:'whirlpool',10:'wind',13:'gate',17:'treasure',20:'bridge'}},
 {id:'canyon',name:'급류협곡',subtitle:'한 자리 덧셈·뺄셈',landmark:'폭포 수문',asset:'map-canyon.png',lessons:[5,7],color:'#f4b17e',sound:'canyon',anchors:[[130,750],[530,740],[1080,640],[1430,530],[980,400],[390,410],[740,220],[1410,180]],events:{3:'bridge',6:'treasure',9:'whirlpool',12:'gate',16:'wind',20:'treasure'}},
 {id:'lighthouse',name:'별빛등대',subtitle:'두 자리 연산·종합',landmark:'별빛등대',asset:'gameplay-plate.png',lessons:[6,8],color:'#e6ce81',sound:'lighthouse',anchors:[[170,760],[520,760],[880,700],[1420,650],[1170,470],[700,420],[950,260],[1440,185]],events:{4:'treasure',8:'whirlpool',11:'bridge',15:'gate',18:'treasure',22:'wind'}}
];
for(const m of definitions)m.events=keepForksClear(m.events);
export const maps=definitions.map(m=>({...m,tiles:route(m.anchors).map((p,i)=>({...p,index:i,tick:(i/10).toFixed(2),type:i===0?'start':i===24?'finish':m.events[i]||'normal'}))}));
export const getMap=id=>maps.find(m=>m.id===id)||(String(id).startsWith('daily-')?dailyMap(String(id).slice(6)):maps[0]);
export const getTile=(id,n)=>getMap(id).tiles[Math.max(0,Math.min(24,n))];

const gold={...maps[3],id:'golden',name:'황금항로',subtitle:'네 지역의 마지막 도전',asset:'map-golden.png',lessons:[1,2,3,4,5,6,7,8],color:'#ffd76c',events:{3:'treasure',5:'whirlpool',8:'bridge',12:'gate',16:'wind',19:'treasure',22:'gate'}};
gold.events=keepForksClear(gold.events);
gold.tiles=maps[3].tiles.map(t=>({...t,type:t.index===0?'start':t.index===24?'finish':gold.events[t.index]||'normal'}));maps.push(gold);
export function dateKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function dailyMap(date=dateKey()){const id='daily-'+date,found=maps.find(m=>m.id===id);if(found)return found;let seed=[...date].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,0);const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const base=maps[Math.floor(next()*4)],events={},kinds=['treasure','wind','whirlpool','bridge','gate','treasure'];for(let i=0;i<6;i++)events[2+i*3+Math.floor(next()*2)]=kinds[i];const cleanEvents=keepForksClear(events);const m={...base,id,name:'오늘의 항로',date,events:cleanEvents,tiles:base.tiles.map(t=>({...t,type:t.index===0?'start':t.index===24?'finish':cleanEvents[t.index]||'normal'})),base:base.id};if(!validateBoard(m))throw Error('Invalid daily board');maps.push(m);return m;}
export function validateBoard(m){return m.tiles.length===25&&m.tiles[0].type==='start'&&m.tiles[24].type==='finish'&&m.tiles.filter(t=>t.type==='normal').length>=15&&m.tiles.filter(t=>t.type==='whirlpool').length===1;}
export function branchPoint(map,n){const a=map.tiles[n-1],t=map.tiles[n],b=map.tiles[n+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;const candidates=[-1,1].map(sign=>({...t,x:t.x-sign*dy/len*95,y:t.y+sign*dx/len*95}));const score=p=>Math.min(...map.tiles.filter(t=>t.index!==n).map(t=>Math.hypot(t.x-p.x,t.y-p.y)),p.x,1600-p.x,p.y,900-p.y);return candidates.sort((a,b)=>score(b)-score(a))[0];}
