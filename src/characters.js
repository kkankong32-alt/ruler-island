// Names and biographies can be changed without editing UI or animation code.
export const characters=[
 {id:0,name:'여울',gender:'girl',bio:'작은 물결에서도 새로운 길을 찾는 지도 탐험가',color:'#77d4c2'},
 {id:1,name:'해온',gender:'boy',bio:'햇살 아래 지도를 펼치는 차분한 길잡이',color:'#7cb6eb'},
 {id:2,name:'시우',gender:'boy',bio:'바람과 비의 신호를 기록하는 호기심 많은 관측가',color:'#a6cc7d'},
 {id:3,name:'서하',gender:'girl',bio:'섬과 섬을 잇는 다리를 꿈꾸는 대담한 탐험가',color:'#efbd6e'}
].map(c=>({...c,master:`assets/cast-${c.id}-front.png`,motion:`assets/cast-${c.id}-motion.png`,left:`assets/cast-${c.id}-left.png`,right:`assets/cast-${c.id}-right.png`,expressions:`assets/cast-${c.id}-expressions.png`}));
export const animations={idle:[0],roll:[0,1],walk:[2,3],run:[4,5],jump:[6],land:[7],turn:[8],treasure:[9],victory:[10],defeat:[11]};
export const character=id=>characters.find(c=>c.id===id)||characters[0];
