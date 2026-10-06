export const STAGES = [
  { id:1, name:'입력과 출력의 숲', background:'stage1', color:'#78cfe0', tileColor:'#75b96b', accent:'#d5f095', monsters:['print()','input()','int()','name'], count:5, speed:82, hp:2 },
  { id:2, name:'연산자의 동굴', background:'stage2', color:'#263b64', tileColor:'#617090', accent:'#92e9ef', monsters:['+','-','*','/','//','%','==','!=','and','or'], count:6, speed:104, hp:3 },
  { id:3, name:'조건문의 성', background:'stage3', color:'#f4bda0', tileColor:'#92aa81', accent:'#ffde92', monsters:['if','elif','else'], count:7, speed:128, hp:4 },
  { id:4, name:'반복문의 탑', background:'stage4', color:'#594a91', tileColor:'#8b83ae', accent:'#d7b7fc', monsters:['while','for'], count:7, speed:150, hp:5, boss:{ name:'LOOP GUARDIAN', hp:64, speed:118, chargeInterval:3, chargeSpeed:340 } }
];
