# CODE QUEST — 명빈T의 코딩 던전

중학교 정보 수업용 2인 협동 픽셀 웹게임입니다. 한 키보드로 코드 몬스터를 물리치고 명빈T의 Python 복습 퀴즈를 풀어 던전을 탈출합니다.

HTML, CSS, Vanilla JavaScript ES modules, Canvas만 사용합니다. 패키지 설치, 빌드, 서버 프로그램, 데이터베이스 없이 GitHub Pages의 정적 파일로 실행됩니다. 현재 모든 그래픽은 Canvas 도형이며 이미지·폰트·사운드 다운로드가 없습니다.

## 조작법

| 플레이어 | 이동 | 공격 |
| --- | --- | --- |
| P1 (파랑) | W A S D | F |
| P2 (노랑) | 방향키 | L |

마지막으로 이동한 방향으로 공격합니다. 공격 키를 누르고 있으면 0.3초 간격으로 발사합니다. 두 플레이어의 동시 입력을 지원합니다. 일부 물리 키보드는 특정 키 조합을 제한하므로 수업용 키보드에서도 확인하세요.

**일시정지:** 전투 중 Esc 또는 오른쪽 위의 일시정지 버튼을 누릅니다. 계속하기 / Esc로 재개하면 위치·체력·몬스터·탄환을 유지합니다. 공격 대기·무적·탄환 수명·부활 시간도 정지합니다. 창이나 탭을 벗어나면 자동으로 일시정지하며 돌아왔을 때 직접 재개해야 합니다. 타이틀로 버튼은 현재 진행을 초기화합니다. 퀴즈 중 Esc는 전투를 재개하지 않습니다.

체력은 각각 3입니다. 피격 후 1초 무적, DOWN 후 3초 뒤 원래 자리에서 부활합니다. 둘이 동시에 DOWN이면 **현재 스테이지만** 초기화됩니다. 탭/창을 벗어나면 눌린 키 상태도 해제됩니다.

## 게임 흐름

타이틀(게임 시작) → 조작 안내(2 PLAYER START) → 입력과 출력의 숲 → 연산자의 동굴 → 조건문의 성 → 반복문의 탑 → Final Quiz → CLEAR → PLAY AGAIN(조작 안내)

각 단계의 몬스터 전멸 시 전투가 멈추고 명빈T와 4지선다 퀴즈가 등장합니다. 보기 번호는 ①~④이며 숫자 값과 구분해서 표시합니다. 예전의 `4. 5`는 소수 4.5가 아니라 4번 보기의 값 5를 뜻했습니다. 답을 선택하면 정답 보기와 해설을 함께 보여줍니다. 정답 피드백을 확인한 뒤 계속하기 / NEXT STAGE를 누릅니다. 오답이면 다른 문제 도전 버튼으로 같은 단계의 다른 문제를 풉니다.

Stage 4의 단계 퀴즈까지 해결한 뒤 전체 문제에서 중복 없는 최종 3문제를 풉니다. 최종 오답은 현재 문제를 다른 문제로 교체하며 이미 해결한 문제와 이후 예정된 문제를 제외합니다. 최종 3문제를 모두 맞히면 탈출합니다.

## 파일 구조

```text
index.html              화면, HUD, 시작/퀴즈/결과 overlay
css/base.css            공통 색상, 폰트, 기본 레이아웃
css/game.css            16:9 Canvas, HUD, 반응형 크기
css/ui.css              버튼, 조작법, 대화창, 퀴즈/결과
js/main.js              초기화, 에셋 로딩, UI 이벤트 연결
js/core/config.js       해상도, 속도, cooldown, 키 설정
js/core/game.js         게임 상태, 단일 animation loop, 전투/단계 흐름
js/core/input.js        중앙 키 입력, 스크롤 방지, 입력 초기화
js/core/renderer.js     Canvas 그래픽, 단계별 정적 배경 캐시
js/core/assets.js       이미지 캐시와 필수/선택 로딩 구조
js/core/utils.js        제한값, 랜덤 선택, 섞기
js/entities/            player.js, monster.js, projectile.js
js/systems/             collision.js, stage.js, quiz.js
js/data/stages.js       단계 이름, 몬스터, 난이도, 색상
js/data/questions.js    교사가 편집하는 문제 데이터
tests/check-game.cjs     패키지 없는 선택 개발 검증 (Node.js)
tests/check-questions.py Python 실행 정답/인접 프로젝트 중복 검증
assets/sprites/         향후 캐릭터/몬스터/명빈T sprite sheet
assets/backgrounds/     향후 stage1~4.webp
assets/audio/           향후 선택 효과음
AGENTS.md               프로젝트 개발 원칙 (기존 파일 보존)
```

## 실행 방법

GitHub Pages 주소를 Chrome에서 열고 **게임 시작 → 2 PLAYER START**를 누르세요. 물리 키보드가 필요하며 터치 이동은 지원하지 않습니다. 퀴즈는 마우스/터치와 Tab / Enter로 선택 가능합니다.

ES modules를 사용하므로 파일을 더블클릭해 `file://`로 실행하면 브라우저 보안 정책으로 실행되지 않을 수 있습니다. GitHub Pages 또는 기존 정적 미리보기에서 실행하세요. 개발 확인에만 필요하다면 Python 내장 정적 미리보기를 사용할 수 있습니다 (게임에 서버 코드를 추가하는 방식은 아닙니다):

```sh
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 열고 종료 시 터미널에서 Ctrl+C를 누릅니다. 배포된 게임에는 이 과정이 필요 없습니다.

## GitHub Pages 배포 방법

GitHub CLI 로그인이 완료된 컴퓨터에서는 프로젝트 폴더에서 아래 명령 하나로 공개 저장소 `python-dungeon` 생성, 파일 업로드, `main` 루트의 Pages 설정까지 진행할 수 있습니다:

```sh
bash ./deploy-github.sh
```

스크립트는 기존 저장소/다른 origin을 확인하며 force push를 하지 않습니다. 실행 후 출력되는 Pages 주소를 사용하고, 저장소 Actions에서 배포 완료를 확인하세요. Pages 설정이 권한 문제로 실패하면 업로드된 저장소의 Settings → Pages에서 아래와 같이 수동 설정할 수 있습니다. 이 스크립트는 배포 작업용이며 게임 실행에 필요하지 않습니다.

수동 업로드를 사용하는 경우:

1. `code-quest` 등 저장소를 만들고 이 폴더의 파일들을 저장소 루트에 업로드합니다. `AGENTS.md`도 보존합니다.
2. GitHub 저장소의 **Settings → Pages**에서 **Deploy from a branch**를 선택합니다.
3. 브랜치 `main`, 폴더 `/ (root)`를 선택하고 저장합니다.
4. 표시되는 사이트 주소를 Chrome에서 열어 시작부터 CLEAR까지 확인합니다.

별도 빌드나 npm 설치가 없습니다. HTML/CSS/JS 경로는 모두 상대 경로이므로 저장소 하위 경로에서 실행 가능합니다. 최초 배포는 사용자 컴퓨터에서 완료했습니다. 수정 내용을 반영할 때도 같은 배포 명령을 다시 실행하면 됩니다. 이 작업 환경에서는 GitHub API 접속이 차단되어 수정본을 직접 업로드하지 못합니다.

## 퀴즈 수정 방법

**`js/data/questions.js`만 수정하면 됩니다.** 각 단계는 현재 3문제씩 총 12문제입니다.

```javascript
{
  id: 's1-q4',                 // 전체에서 유일한 ID
  stage: 1,                   // 1~4
  question: '출력 결과는?',
  code: 'name = "Alex"\nprint(name)', // 줄바꿈은 \n, 코드 없으면 ''
  choices: ['Alex', 'name', 'Hello', '0'], // 항상 네 개
  answer: 0,                  // 0=①, 1=②, 2=③, 3=④
  explanation: 'name에 저장된 Alex를 출력합니다.' // 선택 사항
}
```

항목 사이에 쉼표를 넣고, 따옴표와 괄호를 유지하세요. 각 단계에 최소 1문제를 유지하고, 최종 퀴즈와 오답 교체를 위해 전체 문제는 최소 4개를 유지하세요. 단계마다 2개 이상이면 오답 시 같은 문제의 즉시 반복을 피할 수 있습니다. 프로그래밍 입력/출력은 영어를 권장합니다. 주석·변수·입출력·연산·조건·반복만 사용하고 함수/고급 리스트는 제외하세요. 문제 내용은 `textContent`로 표시되어 HTML로 실행되지 않습니다.

## 스테이지 수정 방법

`js/data/stages.js`에서 이름(`name`), 코드 라벨(`monsters`), 동시 몬스터 수(`count`), 속도(`speed`), 체력(`hp`), 배경 색상 등을 수정합니다. `monsters`는 빈 배열로 만들지 마세요. `count`는 4~7을 권장하며 최대 7로 제한합니다. 라벨 종류가 등장 개체보다 많으면 무작위 일부만 등장합니다.

플레이어 속도, 체력, 무적 시간, 부활 시간, 공격 cooldown은 `js/core/config.js`에서 변경합니다. projectile은 최대 20개이며 충돌/경계/수명 종료 시 제거됩니다. 배경은 단계 변경 때만 그려 캐시하고 HUD는 값이 달라질 때만 DOM을 갱신합니다.

## 향후 이미지 교체 위치

- `assets/sprites/players.png`, `monsters.png`, `teacher.png`: sprite sheet 권장
- `assets/backgrounds/stage1.webp` ~ `stage4.webp`: 최대 1280×720 권장
- `assets/audio/`: 작은 선택 효과음만 추가; 사용자 시작 전 자동 재생 금지

실제 이미지가 준비되면 `js/core/assets.js`의 `ESSENTIAL_ASSETS`에 players / teacher / monsters / stage1을, `LATER_ASSETS`에 stage2~4를 등록하세요. 경로는 `./assets/...`로 작성합니다. `renderer.js`의 캐릭터 그리기를 sprite sheet의 `drawImage()`로 교체하세요. 배경 키(`stage1` 등)는 캐시에 있으면 자동 사용합니다. 이미지 누락 시 Canvas 도형 fallback을 유지합니다. render loop 안에서 이미지를 새로 생성하지 마세요.

## 문제 및 기능 검증

문제는 인접 프로젝트 `../python-mini-game/src/questions.js`의 20문제와 대조해 교체했습니다. 학습 개념은 공유하지만 변수 이름 규칙, 문자열 속 #, /의 실수 결과, 독립된 if, 조건 경계값, if 밖의 실행, 반복 누적 등 다른 질문과 예제로 구성했습니다. 12문제의 정답을 Python 실행 또는 규칙 검증으로 확인했습니다.

개발 확인을 다시 실행하려면 Node.js와 Python 3가 설치된 컴퓨터에서 아래 명령을 사용하세요. npm 설치 없이 실행하며 게임 사이트에는 Node/Python이 필요하지 않습니다.

```sh
node --experimental-vm-modules tests/check-game.cjs
```

DOM/Canvas 대체 객체를 이용한 검증이므로 실제 Chrome의 화면 배치와 물리 키보드 제한은 별도로 확인해야 합니다. 인접 프로젝트가 없으면 중복 비교만 생략합니다. 변수 이름 문제(s1-q1)와 논리 빈칸 문제(s2-q3)의 유형이나 입력값(현재 s1-q2의 4)을 바꾸면 `tests/check-questions.py`의 해당 검증 조건도 수정하세요. 시작할 때 문제 데이터의 ID·4개 보기·정답 인덱스·단계별 문제 존재 여부를 자동 검사합니다.

## 수업 전 확인

- W + →, A + ↑, F + L 등 동시 입력과 네 방향 공격
- 피격 무적, 한 명 DOWN/부활, 두 명 DOWN 시 현재 단계 재시작
- 네 단계 퀴즈의 정답/오답, 최종 3문제, PLAY AGAIN
- Chrome 개발자 도구의 오류와 수업용 디벗에서의 실제 부드러움
- 실제 GitHub Pages 주소의 경로와 화면 크기

ES 모듈을 실행하는 자동 검증 28개 항목을 통과했습니다. 시작/조작 안내, 일시정지/재개, 자동 일시정지, 보기 번호 구분과 정답 해설도 포함합니다. DOM/Canvas 대체 객체로 동시 입력, 네 방향 공격, cooldown, 몬스터 추적/충돌, 무적/DOWN/부활, 현재 단계 재시작, projectile 정리, 퀴즈 중 전투 정지, 정답/오답, 최종 문제 중복 방지, CLEAR/재시작, HUD 변경 제한과 단일 loop를 확인했습니다. 모든 HTML 참조 및 모듈 상대 경로도 검사했습니다. 이는 Chrome에서 직접 플레이한 결과나 실제 화면 렌더링/성능 측정은 아닙니다. 실행 환경에서 미리보기 포트가 차단되고 연결된 브라우저가 없어 브라우저 검증은 수행하지 못했습니다.

현재 MVP에는 최종 이미지, 음향, 고급 애니메이션이 없습니다. 실물 디벗 성능과 실제 GitHub Pages 배포는 별도 확인이 필요합니다.
