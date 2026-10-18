import {correct,diagnose,parse} from './math.js';
import {getMap,getTile,tileNames} from './maps.js';
import {makeProblem} from './problems.js';
export const SAVE_KEY='ruler-island-v6';
export const defaults={players:1,mode:'race',map:'coast',characters:[0,1],aiLevel:'normal',music:15,sound:45,reduced:false,musicEnabled:true,soundEnabled:true};
export function createRace(cfg={}){return {version:6,id:Date.now()+'-'+Math.random(),cfg:{...defaults,...cfg},phase:'roll',turn:0,round:1,players:[0,1].map(()=>({pos:0,won:false,treasures:0,rerolls:0,shields:0,adjusts:0,boosts:0,anchors:0,ready24:false,correct:0,errors:0,hints:0,log:[]})),dice:[],recent:[],questionCount:0,history:[],winners:[],adjust:0,boost:0,itemUsed:null,rerolled:false,problem:null,transaction:null};}
export function roll(g,dice){if(!['roll','rolling'].includes(g.phase)||dice.length!==1||dice.some(n=>!Number.isInteger(n)||n<1||n>6))return false;g.dice=[...dice];g.phase='choose';g.adjust=0;g.rerolled=false;g.originalDice=null;return true;}
export function canReroll(g){return g.phase==='choose'&&!g.rerolled&&!g.itemUsed&&!g.adjust&&g.players[g.turn].rerolls>0;}
export function beginReroll(g){if(!canReroll(g))return false;g.players[g.turn].rerolls--;g.itemUsed='rerolls';g.originalDice=[...g.dice];g.phase='rerolling';g.rerolled=true;return true;}
export function finishReroll(g,n){if(g.phase!=='rerolling'||!Number.isInteger(n)||n<1||n>6)return false;g.dice[0]=n;g.phase='choose';return true;}
export function adjust(g,n){if(g.phase!=='choose'||g.itemUsed||![-1,0,1].includes(n)||(n===-1&&g.dice[0]===1)||!g.players[g.turn].adjusts)return false;g.adjust=n;return true;}
export function options(g){if(g.phase!=='choose')return [];const p=g.players[g.turn];return g.dice.map((n,id)=>{const steps=Math.max(1,n+g.adjust+(g.boost||0)),target=Math.min(24,p.pos+steps),tile=getTile(g.cfg.map,target);return {id,steps,target,tile,name:tileNames[tile.type],risk:tile.type==='whirlpool',path:Array.from({length:target-p.pos},(_,k)=>p.pos+k+1)};});}
export function choose(g,id){const c=options(g).find(o=>o.id===id);if(!c)return false;const p=g.players[g.turn];if(g.adjust){p.adjusts--;g.itemUsed='adjusts';}g.transaction={exit:p.pos===24&&p.ready24,from:p.pos,target:c.target,steps:c.steps,eventUsed:false,award:false,success:false};g.choice=c;g.phase='moving';g.problem=null;return true;}
function ask(g,rng){g.problem=makeProblem(g,rng);g.feedback=null;g.phase='calculate';}
export function arrived(g,rng=Math.random){if(!['moving','event','returning'].includes(g.phase))return false;const p=g.players[g.turn],t=g.transaction,phase=g.phase;p.pos=t.target;
 if(phase==='returning'){g.phase='reward';g.message=`${p.pos}번 칸으로 돌아왔어요.`;return true;}
 if(t.branch||t.risky){ask(g,rng);return true;}const tile=getTile(g.cfg.map,p.pos);
 if(t.exit){p.won=true;t.success=true;g.problem=null;g.phase='reward';g.event='finish';g.message='결승 진출! 같은 라운드까지 진행해요.';return true;}if(p.pos===24){ask(g,rng);return true;}
 if(phase==='event'){g.phase='reward';g.message=`${p.pos}번 칸에 도착! 추가 효과는 이어지지 않아요.`;return true;}
 if(tile.type==='whirlpool'&&!t.eventUsed){if(p.shields>0){g.phase='shield';g.message='방어권으로 소용돌이의 뒤로 2칸 효과를 막을까요?';return true;}t.eventUsed=true;const delta=tile.type==='wind'?2:-2;t.target=Math.max(0,Math.min(24,p.pos+delta));g.phase='event';g.event=tile.type;g.message=delta>0?'순풍! 앞으로 2칸':'소용돌이! 뒤로 2칸';return true;}
 ask(g,rng);return true;
}
export function submit(g,input){if(g.phase!=='calculate')return 'ignored';const p=g.players[g.turn],problem=g.problem;
 if(problem.kind==='compare'?!['<','=','>'].includes(String(input).trim()):parse(input)===null){g.feedback={code:'format',message:problem.kind==='compare'?'＜, ＝, ＞ 중 하나를 골라 주세요.':'숫자와 소수점 하나로 답을 입력해 주세요.'};return 'invalid';}
 const ok=correct(problem,input),feedback=ok?null:diagnose(problem,input);p.log.push({round:g.round,tile:p.pos,objective:problem.objective,expression:problem.expression,input:String(input),answer:problem.answer,d:problem.d,correct:ok,error:feedback?.code||null});
 if(!ok){g.transaction.success=false;p.errors++;g.feedback=feedback;g.phase='feedback';return 'wrong';}
 p.correct++;if(problem.followup){g.problem=problem.followup;g.feedback=null;g.message='첫 번째 잠금 해제! 이제 원리를 확인해요.';return 'stage';}const t=g.transaction,kind=(t.branch||t.risky)?'normal':getTile(g.cfg.map,p.pos).type;t.success=true;g.event='correct';g.message='정답! 이 칸에 머물러요.';
 if(p.pos===24){p.ready24=true;g.message='24번 정답! 다음 내 차례에 주사위로 결승에 진출해요. 닻 공격을 조심하세요!';g.phase='reward';return 'correct';}
 if((kind==='treasure'||t.risky)&&!t.award){t.award=true;p.treasures++;t.offers=rewardOptions(g);g.event='treasure';g.message='보물 획득! 원하는 쿠폰 하나를 골라 보관하세요.';}
 if(['bridge','wind'].includes(kind)&&!t.eventUsed){t.eventUsed=true;t.target=Math.min(24,p.pos+(kind==='wind'?2:3));g.phase='event';g.event=kind;g.message=kind==='wind'?'문제 성공! 순풍으로 앞으로 2칸':'비밀다리가 열렸어요! 앞으로 3칸';return 'correct';}
 g.phase='reward';return 'correct';
}
export function acknowledge(g){if(g.phase!=='feedback')return false;g.transaction.target=Math.max(0,g.transaction.from-(g.transaction.risky?1:0));g.phase='returning';g.event='return';return true;}
export function next(g){if(g.phase!=='reward')return false;g.history.push({player:g.turn,round:g.round,...g.transaction,to:g.players[g.turn].pos,event:g.event});
 if(g.cfg.mode==='practice'){if(g.players[0].won){g.winners=[0];g.phase='finished';return true;}g.turn=0;g.round++;}
 else{if(g.turn===1&&g.players.some(p=>p.won)){g.winners=g.players.flatMap((p,i)=>p.won?[i]:[]);g.phase='finished';return true;}g.turn=1-g.turn;if(g.turn===0)g.round++;}
 g.phase='roll';g.problem=null;g.choice=null;g.transaction=null;g.dice=[];g.feedback=null;g.adjust=0;g.boost=0;g.itemUsed=null;g.event=null;return true;
}
export function aiChoice(g){const score=o=>{const kind=o.tile.type,bonus={treasure:1.8,wind:2,whirlpool:-2.7,bridge:2.8,gate:0,finish:8};return o.target+(bonus[kind]||0);};return [...options(g)].sort((a,b)=>score(b)-score(a))[0]?.id||0;}
export function snapshot(g){return ['roll','finished'].includes(g.phase)?JSON.stringify(g):null;}
export function restore(raw){try{const g=JSON.parse(raw);if(g.version!==6||!['roll','finished'].includes(g.phase)||![0,1].includes(g.turn)||!Number.isInteger(g.round)||g.round<1||!['race','practice'].includes(g.cfg.mode)||![1,2].includes(g.cfg.players)||getMap(g.cfg.map).id!==g.cfg.map||!Array.isArray(g.cfg.characters)||g.cfg.characters.length!==2||new Set(g.cfg.characters).size!==2||g.cfg.characters.some(n=>!Number.isInteger(n)||n<0||n>3)||!Array.isArray(g.players)||g.players.length!==2)return null;for(const p of g.players){p.boosts??=0;p.anchors??=0;p.ready24??=false;if(!Number.isInteger(p.pos)||p.pos<0||p.pos>24||!Array.isArray(p.log))return null;for(const k of ['boosts','anchors','rerolls','shields','adjusts','treasures','correct','errors','hints'])if(!Number.isInteger(p[k])||p[k]<0||p[k]>100000)return null;}return g;}catch{return null;}}

export function shield(g,use){if(g.phase!=='shield')return false;const p=g.players[g.turn];g.transaction.eventUsed=true;if(use&&p.shields){p.shields--;ask(g,Math.random);}else{g.transaction.target=Math.max(0,p.pos-2);g.phase='event';g.event='whirlpool';g.message='소용돌이! 뒤로 2칸';}return true;}

export const itemNames={rerolls:'재굴림권',adjusts:'방향타',shields:'방어막',boosts:'순풍 돛',anchors:'닻 던지기'};
export function rewardOptions(g){const p=g.players[g.turn],behind=g.cfg.mode!=='practice'&&p.pos<g.players[1-g.turn].pos;return behind?['boosts','anchors','rerolls']:['shields','adjusts','rerolls'];}
export function claimReward(g,item){const t=g.transaction,p=g.players[g.turn];if(g.phase!=='reward'||!t?.offers?.includes(item)||t.item||p[item]>=3)return false;p[item]++;t.item=item;t.itemAdded=true;return true;}
export function boost(g){const p=g.players[g.turn];if(g.phase!=='choose'||g.itemUsed||g.adjust||!p.boosts)return false;p.boosts--;g.boost=2;g.itemUsed='boosts';return true;}
export function canAttack(g){const p=g.players[g.turn],q=g.players[1-g.turn];return g.phase==='roll'&&!g.itemUsed&&g.cfg.mode!=='practice'&&p.anchors>0&&!q.won&&q.pos>p.pos;}
export function attack(g,defend=false){if(!canAttack(g))return false;const p=g.players[g.turn],q=g.players[1-g.turn];p.anchors--;g.itemUsed='anchors';const blocked=defend&&q.shields>0;if(blocked)q.shields--;else{q.pos=Math.max(0,q.pos-2);q.ready24=false;}return {blocked,target:1-g.turn,to:q.pos};}
