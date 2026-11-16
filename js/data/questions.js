// answer: ZERO-BASED choice index. explanation: feedback shown after answering.
// Reviewed against ../python-mini-game/src/questions.js; use distinct tasks/examples.
//
// v1.3.0: every question also has vary(r), which keeps the same lesson pattern but
// changes numbers, names and messages each time it is asked. The fixed fields below are
// the reference example (checked by Python). vary() must return
// { question, code, choices, answer, explanation } with choices[answer] correct;
// the quiz shuffles choice order afterwards. tests/check-game.cjs runs hundreds of
// generated variants through real Python, so keep the generated code runnable.
//
// r helpers: r.int(min,max) inclusive, r.pick(array).
const NONE = '아무것도 출력되지 않는다';
// Korean particle that matches the last sound: josa('코인','와/과') → '코인과', josa(5,'을/를') → '5를'.
const DIGIT_HAS_FINAL = [true,true,false,true,false,false,true,true,true,false]; // 영 일 이 삼 사 오 육 칠 팔 구
const DIGIT_FINAL_L = [false,true,false,false,false,false,false,true,true,false]; // ㄹ받침: 일 칠 팔
function josa(word,pair) {
  const text = String(word), last = text[text.length-1];
  const [withFinal,withoutFinal] = pair.split('/');
  let hasFinal, finalL = false;
  if (/[0-9]/.test(last)) { hasFinal = DIGIT_HAS_FINAL[last]; finalL = DIGIT_FINAL_L[last]; }
  else { const code = last.charCodeAt(0)-0xac00; hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0; finalL = hasFinal && code % 28 === 8; }
  // 으로/로: words ending in ㄹ take 로.
  if (pair === '으로/로' && finalL) return text+withoutFinal;
  return text+(hasFinal ? withFinal : withoutFinal);
}
const lines = (from,to) => Array.from({ length:to-from }, (_,i) => String(from+i)).join('\n');

export const QUESTIONS = [
  { id:'s1-q1', stage:1, question:'플레이어 번호를 저장할 변수 이름으로 사용할 수 있는 것은?', code:'', choices:['2player','player-name','player_2','for'], answer:2, explanation:'변수 이름은 숫자로 시작할 수 없고 하이픈(-)을 쓸 수 없습니다. for는 예약어입니다. player_2는 사용할 수 있습니다.',
    vary(r) {
      const [word,label] = r.pick([['player','플레이어'],['score','점수'],['coin','코인'],['level','레벨'],['hero','영웅'],['item','아이템'],['gem','보석']]);
      const n = r.int(1,9);
      const reserved = r.pick(['for','if','while','else','and','or','True']);
      return { question:`${label} ${n}의 값을 저장할 변수 이름으로 사용할 수 있는 것은?`, code:'',
        choices:[`${n}${word}`,`${word}-${n}`,`${word}_${n}`,reserved], answer:2,
        explanation:`변수 이름은 숫자로 시작할 수 없고(${n}${word}) 하이픈(-)을 쓸 수 없습니다(${word}-${n}). 예약어(${reserved})도 쓸 수 없습니다. ${josa(`${word}_${n}`,'은/는')} 사용할 수 있습니다.` };
    } },
  { id:'s1-q2', stage:1, question:'Enter boxes: 에 4를 입력했습니다. 마지막 출력 줄은?', code:'boxes = int(input("Enter boxes: "))\nprint(boxes * 6)', choices:['46','24','10','444444'], answer:1, explanation:'입력한 "4"를 int로 정수 4로 바꿉니다. 4 × 6은 24입니다. 입력 안내 문구는 마지막 출력 줄에 포함하지 않습니다.',
    vary(r) {
      const name = r.pick(['boxes','cards','gems','apples','arrows','keys']);
      const n = r.int(2,9), m = r.int(3,7);
      return { question:`Enter ${name}: 에 ${josa(n,'을/를')} 입력했습니다. 마지막 출력 줄은?`, input:String(n),
        code:`${name} = int(input("Enter ${name}: "))\nprint(${name} * ${m})`,
        choices:[`${n}${m}`,String(n*m),String(n+m),String(n).repeat(m)], answer:1,
        explanation:`입력값은 문자열 "${n}"입니다. int()로 정수 ${josa(n,'으로/로')} 바꿉니다. ${n} × ${josa(m,'은/는')} ${n*m}입니다. 입력 안내 문구는 마지막 출력 줄에 포함하지 않습니다.` };
    } },
  { id:'s1-q3', stage:1, question:'따옴표 안의 #도 주석일까요? 이 코드가 출력하는 내용은?', code:'print("# checkpoint")', choices:['checkpoint',NONE,'# checkpoint','오류가 발생한다'], answer:2, explanation:'따옴표 안의 #은 문자열의 일부입니다. # checkpoint 전체가 출력됩니다.',
    vary(r) {
      const word = r.pick(['checkpoint','save point','boss room','treasure','exit','level up']);
      return { question:'따옴표 안의 #도 주석일까요? 이 코드가 출력하는 내용은?', code:`print("# ${word}")`,
        choices:[word,NONE,`# ${word}`,'오류가 발생한다'], answer:2,
        explanation:`따옴표 안의 #은 문자열의 일부입니다. # ${word} 전체가 출력됩니다.` };
    } },
  { id:'s2-q1', stage:2, question:'던전 표지판에 출력될 문자열은?', code:'print("HP:" + "3" * 2)', choices:['HP:6','HP:3 3','HP:32','HP:33'], answer:3, explanation:'"3" * 2는 "33"입니다. 앞의 "HP:"와 이어 붙여 HP:33을 출력합니다.',
    vary(r) {
      const label = r.pick(['HP','MP','ATK','LV','EXP']);
      const digit = String(r.int(2,9)), times = r.int(2,4);
      const repeated = digit.repeat(times);
      return { question:'던전 표지판에 출력될 문자열은?', code:`print("${label}:" + "${digit}" * ${times})`,
        choices:[`${label}:${Number(digit)*times}`,`${label}:${Array(times).fill(digit).join(' ')}`,`${label}:${digit}${times}`,`${label}:${repeated}`], answer:3,
        explanation:`"${digit}" * ${josa(times,'은/는')} 문자열 "${repeated}"입니다. 앞의 "${label}:"와 이어 붙여 ${josa(`${label}:${repeated}`,'을/를')} 출력합니다.` };
    } },
  { id:'s2-q2', stage:2, question:'상점에서 3코인짜리 물약 4개를 사면 남은 코인은?', code:'coins = 20\nprice = 3\ncount = 4\nprint(coins - price * count)', choices:['8','17','68','32'], answer:0, explanation:'물약 가격은 3 × 4 = 12코인입니다. 곱셈을 먼저 계산하고 20에서 빼므로 8코인이 남습니다.',
    vary(r) {
      const item = r.pick(['물약','화살','열쇠','빵','폭탄']);
      const price = r.int(2,5), count = r.int(2,5), coins = price*count + r.int(2,12);
      const left = coins - price*count;
      return { question:`상점에서 ${price}코인짜리 ${item} ${count}개를 사면 남은 코인은?`,
        code:`coins = ${coins}\nprice = ${price}\ncount = ${count}\nprint(coins - price * count)`,
        choices:[String(left),String(coins-price),String((coins-price)*count),String(coins+price*count)], answer:0,
        explanation:`${item} 가격은 ${price} × ${count} = ${price*count}코인입니다. 곱셈을 먼저 계산하고 ${coins}에서 빼므로 ${left}코인이 남습니다.` };
    } },
  { id:'s2-q3', stage:2, logic:'and', question:'열쇠와 에너지가 모두 있어야 True가 되도록 빈칸에 넣을 연산자는?', code:'keys = 1\nenergy = 0\nprint(keys > 0 ___ energy > 0)', choices:['or','and','+','=='], answer:1, explanation:'두 조건이 모두 참이어야 할 때는 and를 씁니다. 현재는 에너지가 0이므로 and로 연결한 결과는 False입니다.',
    vary(r) {
      const [a,b,aLabel,bLabel] = r.pick([['keys','energy','열쇠','에너지'],['coins','hp','코인','체력'],['gems','power','보석','마력'],['maps','food','지도','식량']]);
      const x = r.int(0,3), y = r.int(0,3);
      const logic = r.pick(['and','or']);
      const result = logic === 'and' ? x > 0 && y > 0 : x > 0 || y > 0;
      const rule = logic === 'and' ? `${josa(aLabel,'과/와')} ${josa(bLabel,'이/가')} 모두 있어야` : `${josa(aLabel,'과/와')} ${bLabel} 중 하나만 있어도`;
      return { question:`${rule} True가 되도록 빈칸에 넣을 연산자는?`, logic,
        code:`${a} = ${x}\n${b} = ${y}\nprint(${a} > 0 ___ ${b} > 0)`,
        choices:['or','and','+','=='], answer:logic === 'and' ? 1 : 0,
        explanation:`${logic === 'and' ? '두 조건이 모두 참이어야 할 때는 and' : '둘 중 하나만 참이어도 될 때는 or'}를 씁니다. 지금 값으로 실행하면 ${result ? 'True' : 'False'}가 출력됩니다.` };
    } },
  { id:'s3-q1', stage:3, question:'서로 독립된 두 if문입니다. 문을 열면 출력되는 두 줄은?', code:'keys = 2\nif keys >= 1:\n    print("Open")\nif keys >= 2:\n    print("Bonus")', choices:['Open','Bonus','Open\nBonus',NONE], answer:2, explanation:'elif가 아닌 독립된 if문이므로 두 조건을 각각 검사합니다. 둘 다 참이라 Open 다음 줄에 Bonus를 출력합니다.',
    vary(r) {
      const name = r.pick(['keys','stars','coins','score']);
      const [first,second] = r.pick([['Open','Bonus'],['Pass','Star'],['Win','Extra'],['Go','Fast']]);
      const low = r.int(1,4), high = low + r.int(1,4);
      const value = r.pick([low-1,low,high-1,high,high+1].filter(v => v >= 0));
      const output = [value >= low && first, value >= high && second].filter(Boolean);
      const answer = output.length === 2 ? 2 : output.length === 1 ? 0 : 3;
      return { question:'서로 독립된 두 if문입니다. 실행 결과로 출력되는 것은?',
        code:`${name} = ${value}\nif ${name} >= ${low}:\n    print("${first}")\nif ${name} >= ${high}:\n    print("${second}")`,
        choices:[first,second,`${first}\n${second}`,NONE], answer,
        explanation:`elif가 아닌 독립된 if문이므로 두 조건을 각각 검사합니다. ${value} >= ${josa(low,'은/는')} ${value >= low ? '참' : '거짓'}, ${value} >= ${josa(high,'은/는')} ${value >= high ? '참' : '거짓'}입니다.` };
    } },
  { id:'s3-q2', stage:3, question:'경계값 level = 5는 어느 길로 안내될까요?', code:'level = 5\nif level > 5:\n    print("Upper")\nelif level == 5:\n    print("Gate")\nelse:\n    print("Lower")', choices:['Gate','Upper','Lower','Upper\nGate'], answer:0, explanation:'5 > 5는 거짓이고 5 == 5는 참입니다. 따라서 elif의 Gate만 출력합니다.',
    vary(r) {
      const name = r.pick(['level','floor','power','rank']);
      const [up,mid,down] = r.pick([['Upper','Gate','Lower'],['North','Bridge','South'],['Fire','Spark','Ice'],['Sky','Cloud','Ground']]);
      const limit = r.int(3,9);
      // The boundary value is the lesson, so it appears most often.
      const value = r.pick([limit,limit,limit+1,limit-1]);
      const result = value > limit ? up : value === limit ? mid : down;
      return { question:`${name} = ${value}일 때 어느 길로 안내될까요?`,
        code:`${name} = ${value}\nif ${name} > ${limit}:\n    print("${up}")\nelif ${name} == ${limit}:\n    print("${mid}")\nelse:\n    print("${down}")`,
        choices:[mid,up,down,`${up}\n${mid}`], answer:[mid,up,down].indexOf(result),
        explanation:`${value} > ${josa(limit,'은/는')} ${value > limit ? '참' : '거짓'}${value > limit ? '이므로 if의' : `, ${value} == ${josa(limit,'은/는')} ${value === limit ? '참이므로 elif의' : '거짓이므로 else의'}`} ${result}만 출력합니다.` };
    } },
  { id:'s3-q3', stage:3, question:'들여쓰기가 없는 마지막 print는 언제 실행될까요? 실제 출력은?', code:'password = "open"\nif password != "open":\n    print("Retry")\nprint("Done")', choices:['Retry','Retry\nDone',NONE,'Done'], answer:3, explanation:'조건이 거짓이라 Retry는 출력되지 않습니다. 마지막 print는 if 밖에 있으므로 Done을 출력합니다.',
    vary(r) {
      const secret = r.pick(['open','sesame','python','dragon','magic']);
      const typed = r.pick([secret, r.pick(['close','hello','snake','apple'])]);
      const op = r.pick(['!=','==']);
      const [inside,outside] = r.pick([['Retry','Done'],['Warning','End'],['Locked','Bye']]);
      const condition = op === '!=' ? typed !== secret : typed === secret;
      return { question:'들여쓰기가 없는 마지막 print는 언제 실행될까요? 실제 출력은?',
        code:`password = "${typed}"\nif password ${op} "${secret}":\n    print("${inside}")\nprint("${outside}")`,
        choices:[inside,`${inside}\n${outside}`,NONE,outside], answer:condition ? 1 : 3,
        explanation:`조건 password ${op} "${secret}"의 결과가 ${condition ? `참이라 들여쓴 print("${inside}")가 실행됩니다` : `거짓이라 들여쓴 print("${inside}")는 실행되지 않습니다`}. 마지막 print("${outside}")는 if 밖에 있으므로 항상 실행됩니다.` };
    } },
  { id:'s4-q1', stage:4, question:'반복하면서 모은 코인의 최종 합계는?', code:'total = 0\nfor coin in range(1, 4):\n    total = total + coin\nprint(total)', choices:['3','10','6','4'], answer:2, explanation:'range(1, 4)는 1, 2, 3입니다. total에 더하면 0 + 1 + 2 + 3 = 6입니다.',
    vary(r) {
      const start = r.int(1,4), end = start + r.int(3,4);
      const values = Array.from({ length:end-start }, (_,i) => start+i);
      const sum = values.reduce((a,b) => a+b,0);
      return { question:'반복하면서 모은 코인의 최종 합계는?',
        code:`total = 0\nfor coin in range(${start}, ${end}):\n    total = total + coin\nprint(total)`,
        choices:[String(end-1),String(sum+end),String(sum),String(sum-start)], answer:2,
        explanation:`range(${start}, ${end})는 ${values.join(', ')}입니다. 끝값 ${josa(end,'은/는')} 포함하지 않습니다. total에 더하면 ${values.join(' + ')} = ${sum}입니다.` };
    } },
  { id:'s4-q2', stage:4, question:'에너지가 2씩 줄어듭니다. 반복 종료 후 남은 에너지는?', code:'energy = 5\nwhile energy > 1:\n    energy = energy - 2\nprint(energy)', choices:['0','1','-1','3'], answer:1, explanation:'에너지는 5 → 3 → 1로 변합니다. 1 > 1은 거짓이므로 종료 후 1을 출력합니다.',
    vary(r) {
      const step = r.int(2,3), limit = r.int(0,2), start = limit + step*r.int(2,3) + r.int(0,step-1);
      const path = [start];
      while (path[path.length-1] > limit) path.push(path[path.length-1]-step);
      const last = path[path.length-1];
      return { question:`에너지가 ${step}씩 줄어듭니다. 반복 종료 후 남은 에너지는?`,
        code:`energy = ${start}\nwhile energy > ${limit}:\n    energy = energy - ${step}\nprint(energy)`,
        choices:[String(last+step),String(last),String(last-step),String(last === limit ? limit+1 : limit)], answer:1,
        explanation:`에너지는 ${josa(path.join(' → '),'으로/로')} 변합니다. ${last} > ${josa(limit,'은/는')} 거짓이므로 반복을 끝내고 ${josa(last,'을/를')} 출력합니다.` };
    } },
  { id:'s4-q3', stage:4, question:'range(2, 5)로 숫자를 반복하면 출력되는 세 줄은?', code:'for number in range(2, 5):\n    print(number)', choices:['2\n3\n4','2\n3\n4\n5','0\n1\n2','3\n4\n5'], answer:0, explanation:'range(2, 5)는 시작값 2부터 끝값 5 직전까지의 숫자입니다. 2, 3, 4를 한 줄씩 출력합니다.',
    vary(r) {
      const start = r.int(1,6), end = start + r.int(2,4);
      const name = r.pick(['number','step','floor','n']);
      return { question:`range(${start}, ${end})로 숫자를 반복하면 출력되는 결과는?`,
        code:`for ${name} in range(${start}, ${end}):\n    print(${name})`,
        choices:[lines(start,end),lines(start,end+1),lines(0,end-start),lines(start+1,end+1)], answer:0,
        explanation:`range(${start}, ${end})는 시작값 ${start}부터 끝값 ${end} 직전까지의 숫자입니다. ${josa(lines(start,end).split('\n').join(', '),'을/를')} 한 줄씩 출력합니다.` };
    } }
];
