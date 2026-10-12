export const teams = [{name:'Lavenzo Legends',short:'LAV',color:'#30ddba',dark:'#123a40'},{name:'World Icons',short:'ICO',color:'#ffae58',dark:'#673b32'}];
export const roster = [
 {name:'Erling Haaland',number:9,team:0,look:'haaland',skin:'#f2c6a1',height:1.15,width:1.05,stats:{speed:88,acceleration:85,shooting:97,passing:76,dribbling:81,strength:96}},
 {name:'Lionel Messi',number:10,team:0,look:'messi',skin:'#d7a27e',height:.86,width:.9,stats:{speed:85,acceleration:96,shooting:94,passing:96,dribbling:99,strength:65}},
 {name:'Zinedine Zidane',number:5,team:0,look:'zidane',skin:'#dca77e',height:1.08,width:1,stats:{speed:76,acceleration:78,shooting:87,passing:99,dribbling:96,strength:86}},
 {name:'Cristiano Ronaldo',number:7,team:1,look:'cristiano',skin:'#d9a17a',height:1.09,width:.96,stats:{speed:91,acceleration:90,shooting:98,passing:83,dribbling:90,strength:88}},
 {name:'Ronaldinho',number:80,team:1,look:'ronaldinho',skin:'#a66a43',height:1,width:1,stats:{speed:86,acceleration:89,shooting:88,passing:97,dribbling:98,strength:78}},
 {name:'Kylian Mbappé',number:10,team:1,look:'mbappe',skin:'#8c563b',height:1.02,width:.96,stats:{speed:96,acceleration:99,shooting:96,passing:80,dribbling:94,strength:92}},
];
export const FIELD={w:1100,h:650,left:60,right:1040,top:60,bottom:590,goalTop:259,goalBottom:391};
export function makePlayers(){return [...roster.map((p,i)=>({...p,stats:{...p.stats},id:i,keeper:false})),...teams.map((t,i)=>({id:6+i,name:i?'Marco Vale':'Theo Sterling',number:1,team:i,look:'keeper',skin:'#e1af87',height:1.06,width:1.03,keeper:true,stats:{speed:72,acceleration:82,shooting:50,passing:82,dribbling:65,strength:88}}))].map(p=>({...p,x:0,y:0,vx:0,vy:0,face:p.team?-1:1,anim:0,kick:0,cooldown:0}));}
