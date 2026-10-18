import {Generator,rand,fmt,arithmetic} from './math.js';
import {getMap} from './maps.js';
export function makeProblem(g,rng=Math.random){
 const map=getMap(g.cfg.map),n=g.players[g.turn].pos,type=map.tiles[n].type,gen=new Generator(rng);gen.recent=[...g.recent];
 const lesson=map.lessons[n%map.lessons.length];let p;
 for(let attempt=0;attempt<50;attempt++){
  p=gen.next({lesson,difficulty:(type==='gate'||type==='finish')&&lesson>4?'hard':'normal'});
  if((map.base||map.id)==='coast'||map.id==='golden'&&lesson<=2){
   const d=lesson===1?2:3,unit=d===2?10:1,a=rand(rng,1,99)*unit,variant=g.questionCount%6;
   if(variant===0)p={kind:'fraction',a,d,answer:a,expression:`${a/unit} / ${d===2?100:1000}`,prompt:'분수를 소수로 나타내세요.',objective:'분수와 소수'};
   if(variant===1){const digit=rand(rng,1,9);p={kind:'place',d,answer:digit*unit,expression:`${d===2?'소수 둘째':'소수 셋째'} 자리의 ${digit}`,prompt:'이 숫자가 나타내는 크기를 소수로 쓰세요.',objective:'자리값'};}
   if(variant===5){const words=['영','일','이','삼','사','오','육','칠','팔','구'];p={kind:'read',d,answer:a,expression:'영 점 '+fmt(a,d).split('.')[1].split('').map(c=>words[+c]).join(' '),prompt:'읽은 수를 숫자로 써 주세요.',objective:'소수 읽기'};}
   if(variant===2){const cells=rand(rng,1,99);p={kind:'grid',d:2,answer:cells*10,cells,expression:`100칸 중 색칠한 ${cells}칸`,prompt:'전체 모눈은 1입니다. 소수로 쓰세요.',objective:'모눈과 소수'};}
  }
  if((map.base||map.id)==='forest'&&p.kind==='compare'&&p.a===p.b){p.a=p.b=Math.floor(p.a/10)*10;p.expression=`${fmt(p.a,2)} □ ${fmt(p.b,3)}`;}
  if((map.base||map.id)==='forest'&&lesson===4){const factor=rng()<.5?10:100,divide=rng()<.5,base=rand(rng,1,99)*10;p={kind:'relation',a:divide?base*factor:base,factor,divide,d:3,answer:divide?base:base*factor,expression:`${fmt(divide?base*factor:base,3)}의 ${divide?'1/'+factor:factor+'배'}`,prompt:'각 숫자의 자리값이 어떻게 달라지는지 생각해요.',objective:'소수 사이의 관계'};}
  if(map.id==='lighthouse'&&g.questionCount%5===3)p=gen.next({lesson:3});
  if(p.kind==='arithmetic'&&g.questionCount%5===2){p={...p,word:true,prompt:`밧줄 ${fmt(p.a,p.d)} m에 ${fmt(p.b,p.d)} m를 ${p.op==='+'?'이어 붙였습니다.':'잘라 냈습니다.'} ${p.op==='+'?'전체':'남은'} 길이는 몇 m일까요?`};}
  if(p.kind==='arithmetic'&&g.questionCount%7===5){p={...p,errorTask:true,claimed:p.answer+p.unit,objective:'잘못된 계산 고치기',prompt:'아래 계산은 틀렸습니다. 바른 답을 써 주세요.'};}
  if(!g.recent.includes(p.expression))break;
 }
 if(type==='gate'){p.gateStage=1;p.followup=gateReason(p);p.prompt='[관문 1/2] '+p.prompt;}
 g.recent.push(p.expression);g.recent=g.recent.slice(-30);g.questionCount++;return p;
}
export function tutorHints(p){
 if(p.kind==='gateReason')return ['자리의 단위와 그 단위가 몇 개인지 구별해요.','비교 문제는 큰 자리부터 처음 달라지는 자리를 찾아요. 개수 문제는 전체를 한 개의 크기로 나누어요.',`답은 ${fmt(p.answer,p.d)}이에요.`];
 if(['fraction','place','grid','read'].includes(p.kind))return ['한 칸 또는 한 자리의 크기를 먼저 확인해요.',p.d===3?'1을 1000등분한 하나는 0.001이에요.':'1을 100등분한 하나는 0.01이에요.',`자리값에 맞추어 쓰면 ${fmt(p.answer,p.d)}이에요.`];
 return null;
}

function gateReason(p){
 let prompt,answer,expression,d=3;
 if(p.kind==='compare'){
  const place=[1000,100,10,1].find(u=>Math.floor(p.a/u)%10!==Math.floor(p.b/u)%10);
  answer=place||0; expression=`${fmt(p.a,3)} 와 ${fmt(p.b,3)}`;
  prompt='처음 다른 자리의 단위는? (예: 일의 자리 → 1, 같은 수 → 0)';
 }else{
  let unit=p.d===1?100:p.d===2?10:1; if(p.answer/unit>999999)unit=1000;
  answer=p.answer/unit*1000;expression=`${fmt(p.answer,p.d||3)} = ${fmt(unit,p.d||3)} × □`;
  prompt=`${fmt(unit,p.d||3)}이 몇 개 모인 수인가요?`;
 }
 return {kind:'gateReason',answer,d,expression,prompt:'[관문 2/2] '+prompt,objective:'관문 · 자리값과 계산 원리',gateStage:2};
}
