// All decimal quantities are integer thousandths. No floating-point answer comparison.
export const fmt=(n,d=2)=>`${n<0?'-':''}${Math.floor(Math.abs(n)/1000)}.${String(Math.abs(n)%1000).padStart(3,'0').slice(0,d)}`;
export function parse(s){s=String(s).trim();if(!/^\d{1,6}(\.\d{1,3})?$/.test(s))return null;const [a,b='']=s.split('.');return Number(a)*1000+Number(b.padEnd(3,'0'));}
export const rand=(rng,a,b)=>a+Math.floor(rng()*(b-a+1));
export function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export const lessons=['소수 두 자리','소수 세 자리','크기 비교','소수 사이의 관계','한 자리 덧셈','두 자리 덧셈','한 자리 뺄셈','두 자리 뺄셈'];
export function arithmetic(a,b,op,d=2,context='도착할 좌표를 구해 보자.'){
 const answer=op==='+'?a+b:a-b; if(answer<0)throw Error('Negative curriculum result');
 const unit=d===1?100:10;
 const carry=op==='+'?Math.floor((a%1000+b%1000)/1000)>0||(d===2&&(a%100+b%100>=100)):a%1000<b%1000||(d===2&&a%100<b%100);
 return {kind:'arithmetic',a,b,op,d,answer,prompt:context,expression:`${fmt(a,d)} ${op==='-'?'−':op} ${fmt(b,b%100===0&&d===2?1:d)}`,objective:`소수 ${d}자리 ${op==='+'?'덧셈':'뺄셈'}`,carry,unit};
}
export function concept(lesson,n,rng=Math.random){
 if((lesson===1||lesson===2)&&rng()<.25){const d=lesson===1?2:3,unit=d===2?10:1,start=Math.floor(n/(unit*10))*unit*10,index=rand(rng,1,9);return {kind:'line',start,unit,index,d,answer:start+index*unit,prompt:`작은 눈금 한 칸은 ${fmt(unit,d)}이야. 표시된 깃발의 좌표를 써 보자.`,expression:'수직선의 깃발은 어디일까?',objective:'수직선 좌표 읽기'};}
 if(lesson===1||lesson===2){const d=lesson===1?2:3,unit=d===2?10:1;const a=d===2?Math.floor(n/10)*10:n+rand(rng,0,9);return {kind:'units',a,unit,d,answer:a,prompt:`${fmt(unit,d)}이 ${a/unit}개인 수를 써서 길을 열자.`,expression:`${fmt(unit,d)} × ${a/unit}개`,objective:lessons[lesson-1]};}
 if(lesson===3){const a=n+rand(rng,0,9),same=rng()<.28,b=same?a:Math.max(0,a+rand(rng,-15,15));return {kind:'compare',a,b,d:3,answer:a===b?'=':a>b?'>':'<',prompt:'두 신호의 크기를 비교해서 다리를 열자.',expression:`${fmt(a,3)} □ ${fmt(b,same?3:3)}`,objective:'큰 자리부터 비교'};}
 const factor=[10,100,1000][rand(rng,0,2)],divide=rng()<.5,a=divide?n*factor:n;
 return {kind:'relation',a,factor,divide,d:3,answer:divide?n:n*factor,prompt:`${fmt(a,3)}의 ${divide?'1/'+factor:factor+'배'}인 수로 신호를 맞추자.`,expression:`${fmt(a,3)}의 ${divide?'1/'+factor:factor+'배'}`,objective:'소수 사이의 관계'};
}
export class Generator{
 constructor(rng=Math.random){this.rng=rng;this.recent=[];}
 next({lesson=6,difficulty='normal',op,mixed=true}={}){
  let p,key;for(let i=0;i<100;i++){
   const d=lesson===5||lesson===7?1:2,unit=d===1?100:10;
   if(lesson<=4)p=concept(lesson,rand(this.rng,1,999)*10,this.rng);
   else {let a=rand(this.rng,1,difficulty==='easy'?19:99)* (d===1?100:10),b=rand(this.rng,1,99)*unit;const o=op||(lesson>=7?'-':'+');if(o==='-'&&a<b)[a,b]=[b,a];p=arithmetic(a,b,o,d,'소수 신호를 계산해 보자.');if(difficulty==='easy'&&p.carry)continue;if(difficulty==='hard'&&!p.carry)continue;}
   key=p.expression;if(!this.recent.includes(key))break;
  }this.recent.push(key);if(this.recent.length>30)this.recent.shift();return p;
 }
}
export const correct=(p,input)=>p.kind==='compare'?String(input).trim()===p.answer:parse(input)===p.answer;
function digitsNoCarry(a,b,op){let out=0,k=1;while(a||b){const x=a%10,y=b%10;out+=(op==='+'?(x+y)%10:Math.abs(x-y))*k;a=Math.floor(a/10);b=Math.floor(b/10);k*=10;}return out;}
export function diagnose(p,input){
 if(correct(p,input))return {code:'correct',message:'정확해! 네가 계산한 길로 출발하자.'};
 const n=parse(input);if(p.kind==='compare')return {code:p.a===p.b?'equivalent':'comparison',message:p.a===p.b?'소수 오른쪽 끝의 0은 크기를 바꾸지 않아.':'자연수 부분부터, 같은 자리끼리 차례대로 비교해 보자.'};
 if(n===null)return {code:'format',message:'숫자와 소수점 하나로 입력해 줘. 예: 0.45'};
 if(p.answer!==0&&[10,100,1000].some(k=>n===p.answer*k||n*k===p.answer))return {code:'decimal',message:'소수점 위치가 달라진 것 같아. 각 숫자가 나타내는 크기를 확인해 볼까?'};
 if(p.kind==='arithmetic'){
  if(n===(p.op==='+'?Math.abs(p.a-p.b):p.a+p.b))return {code:'operation',message:`이번에는 ${p.op==='+'?'더하는':'빼는'} 상황이야. 식의 기호를 다시 확인해 보자.`};
  if(n===digitsNoCarry(p.a,p.b,p.op))return {code:p.op==='+'?'carry':'borrow',message:p.op==='+'?'받아올림이 빠졌을 수 있어. 10개를 윗자리 1개로 바꾸어 보자.':'받아내림을 확인해 보자. 윗자리 1개는 아랫자리 10개야.'};
  if(p.b%100===0&&n===(p.op==='+'?p.a+p.b/10:p.a-p.b/10))return {code:'alignment',message:'서로 다른 자리 수가 섞였을 수 있어. 0.5는 0.50과 같아. 소수점끼리 맞춰 보자.'};
 }
 return {code:'check',message:'어느 부분에서 달라졌는지 함께 확인해 보자. 큰 자리와 작은 자리를 구분해 다시 살펴봐.'};
}
export function hints(p){
 if(p.kind==='line')return ['시작 좌표와 작은 눈금 한 칸의 크기를 살펴보자.',`${fmt(p.start,p.d)}에서 오른쪽으로 작은 눈금 ${p.index}칸이야.`,`${fmt(p.start,p.d)}에서 ${fmt(p.unit,p.d)}씩 ${p.index}칸 가면 ${fmt(p.answer,p.d)}야.`];
 if(p.kind==='arithmetic'){const unit=p.d===1?100:10;return ['소수점을 맞추고 같은 자리끼리 계산해 보자.',`${fmt(p.a,p.d)}는 ${fmt(unit,p.d)}이 ${p.a/unit}개, ${fmt(p.b,p.d)}는 ${p.b/unit}개야.`,`${p.a/unit} ${p.op==='-'?'−':'+'} ${p.b/unit} = ${p.answer/unit}. ${fmt(unit,p.d)}이 ${p.answer/unit}개이므로 ${fmt(p.answer,p.d)}야. 답을 다시 입력해 보자.`];}
 if(p.kind==='compare')return ['자연수 부분부터 비교하고, 같으면 소수 첫째 자리부터 보자.',`${fmt(p.a,3)}와 ${fmt(p.b,3)}처럼 자리 수를 맞춰 보자.`,`${fmt(p.a,3)} ${p.answer} ${fmt(p.b,3)}. 같은 자리에서 처음 달라지는 숫자가 크기를 정해.`];
 if(p.kind==='units')return ['한 개의 크기와 전체 개수를 살펴보자.',`1은 ${fmt(p.unit,p.d)}이 ${1000/p.unit}개야.`,`${p.a/p.unit}개를 자리값에 맞게 쓰면 ${fmt(p.answer,p.d)}야.`];
 return ['10배가 될 때마다 각 숫자의 자리값은 한 자리씩 커져.',`${p.divide?'1/'+p.factor:p.factor+'배'}를 하면 숫자는 소수점을 기준으로 ${p.divide?'오른쪽':'왼쪽'}으로 ${Math.log10(p.factor)}자리 이동해.`,`${p.expression}는 ${fmt(p.answer,3)}야.`];
}
