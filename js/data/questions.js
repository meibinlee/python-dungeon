// answer is a ZERO-BASED choice index (0, 1, 2, or 3). Keep ids unique.
export const QUESTIONS = [
  { id:'s1-q1', stage:1, question:'화면에 문자를 출력하는 명령은?', code:'', choices:['input()','print()','int()','if'], answer:1 },
  { id:'s1-q2', stage:1, question:'Enter age: 에 14를 입력하면 출력되는 값은?', code:'age = int(input("Enter age: "))\nprint(age + 1)', choices:['14','141','15','Enter age:'], answer:2 },
  { id:'s1-q3', stage:1, question:'다음 코드의 출력 결과는?', code:'# Set the score\nscore = 3\nscore = score + 2\nprint(score)', choices:['3','2','32','5'], answer:3 },
  { id:'s2-q1', stage:2, question:'다음 코드의 출력 결과는?', code:'print(7 // 2, 7 % 2)', choices:['3 1','3.5 0','2 7','1 3'], answer:0 },
  { id:'s2-q2', stage:2, question:'다음 코드의 출력 결과는?', code:'print("Go" * 2 + "!")', choices:['Go2!','Go Go!','GoGo!','Go!Go!'], answer:2 },
  { id:'s2-q3', stage:2, question:'다음 코드의 출력 결과는?', code:'age = 14\nprint(age >= 13 and age < 16)', choices:['False','True','14','13'], answer:1 },
  { id:'s3-q1', stage:3, question:'다음 코드의 출력 결과는?', code:'score = 80\nif score >= 90:\n    print("A")\nelif score >= 70:\n    print("B")\nelse:\n    print("C")', choices:['A','C','B','A B'], answer:2 },
  { id:'s3-q2', stage:3, question:'모든 if / elif 조건이 거짓일 때 실행되는 부분은?', code:'', choices:['if','elif','while','else'], answer:3 },
  { id:'s3-q3', stage:3, question:'다음 코드의 출력 결과는?', code:'number = 6\nif number % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")', choices:['Even','Odd','6','True'], answer:0 },
  { id:'s4-q1', stage:4, question:'다음 코드에서 Go는 몇 번 출력될까요?', code:'for i in range(3):\n    print("Go")', choices:['2번','3번','4번','0번'], answer:1 },
  { id:'s4-q2', stage:4, question:'다음 코드의 출력 결과는? (공백은 줄바꿈을 뜻함)', code:'count = 1\nwhile count <= 3:\n    print(count)\n    count = count + 1', choices:['0 1 2','1 2','1 2 3','1 2 3 4'], answer:2 },
  { id:'s4-q3', stage:4, question:'조건이 참인 동안 반복하는 명령은?', code:'', choices:['while','if','else','print'], answer:0 }
];
