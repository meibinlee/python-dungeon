import { Assets, ESSENTIAL_ASSETS, LATER_ASSETS } from './core/assets.js';
import { Input } from './core/input.js';
import { Renderer } from './core/renderer.js?v=20261116-heroes';
import { Game } from './core/game.js?v=20261116-speed3';
import { QuizSystem } from './systems/quiz.js?v=20261116-speed3';
import { NICKNAME_MAX_LENGTH, CLASSES, QUIZ_SCORE } from './core/config.js';
import { leaderboardEnabled, recordName, submitScore, fetchTop } from './systems/leaderboard.js?v=20261116-top5';

async function initialize() {
  const ids = ['game','start-screen','start-button','loading-message','ready-screen','ready-start-button','ready-back-button','pause-screen','pause-button','resume-button','home-button','hud','p1-hp','p2-hp','stage-number','stage-name','result-screen','result-eyebrow','result-title','result-message','result-button'];
  ids.push('p1-power','p2-power','boss-hud','boss-name','boss-hp','boss-health','boss-health-trail','boss-health-fill');
  ids.push('p1-nickname','p2-nickname','ready-p1-name','ready-p2-name','p1-name','p2-name','p1-score','p2-score','team-score','result-scores','result-p1-name','result-p2-name','result-p1-details','result-p2-details','result-p1-score','result-p2-score','result-team-score');
  ids.push('final-ready-screen','final-start-button');
  ids.push('p1-class','p2-class','p1-preview','p2-preview','result-quiz-score');
  ids.push('mode-1p','mode-2p','p2-card','p2-hud','ready-title','ready-p2-card','ready-item-tip','ready-solo-tip','ready-ultimate-keys','final-p2-card','final-retry-rule','result-p2-card','game-shell');
  ids.push('leaderboard','leaderboard-list','leaderboard-status');
  ids.push('title-leaderboard','title-leaderboard-list','title-leaderboard-status','title-leaderboard-refresh');
  for (const id of [1,2]) for (const type of Object.keys(CLASSES)) ids.push(`p${id}-${type}`);
  const ui = Object.fromEntries(ids.map(id => [id,document.getElementById(id)]));
  // Shared TOP 5: a read on the title screen and one submit on the final CLEAR screen (never during gameplay).
  // 2P records "닉네임1/닉네임2", 1P records "닉네임". Failures never affect the game.
  let leaderboardRun = 0;
  const leaderboardRows = (top,newId) => top.map((row,index) => {
      const item = document.createElement('li');
      if (row.id === newId) item.className = 'new-record';
      const name = document.createElement('span'); name.textContent = `${index+1}. ${row.name}`;
      const score = document.createElement('strong'); score.textContent = `${row.score}점`;
      item.append(name,score); return item;
    });
  const renderLeaderboard = (top,newId) => ui['leaderboard-list'].replaceChildren(...leaderboardRows(top,newId));
  // Title-screen TOP 5 (right side): one read request whenever the title screen opens.
  let titleBoardLoading = false;
  async function showTitleLeaderboard() {
    ui['title-leaderboard'].hidden = !leaderboardEnabled();
    if (!leaderboardEnabled() || titleBoardLoading) return;
    titleBoardLoading = true;
    ui['title-leaderboard-refresh'].disabled = true;
    ui['title-leaderboard-status'].textContent = '기록을 불러오는 중...';
    try {
      const top = await fetchTop();
      const rows = Array.isArray(top) ? top : [];
      ui['title-leaderboard-list'].replaceChildren(...leaderboardRows(rows));
      ui['title-leaderboard-status'].textContent = rows.length ? '게임을 클리어하고 기록에 도전!' : '아직 기록이 없어요. 첫 주인공이 되어 보세요!';
    } catch (error) {
      console.warn('Leaderboard unavailable',error);
      ui['title-leaderboard-status'].textContent = '지금은 기록판에 연결할 수 없어요.';
    } finally { titleBoardLoading = false; ui['title-leaderboard-refresh'].disabled = false; }
  }
  async function showLeaderboard(game) {
    ui['leaderboard'].hidden = !leaderboardEnabled();
    if (!leaderboardEnabled()) return;
    const run = ++leaderboardRun;
    ui['leaderboard-list'].replaceChildren();
    ui['leaderboard-status'].textContent = '기록을 저장하는 중...';
    try {
      const result = await submitScore(recordName(game.players),game.totalScore,game.players.length);
      if (run !== leaderboardRun) return;
      renderLeaderboard(result.top || [],result.id);
      ui['leaderboard-status'].textContent = result.id ? '🎉 TOP 5에 이름을 올렸어요!' : 'TOP 5에 들려면 조금 더 빨리 도전해 보세요!';
    } catch (error) {
      if (run !== leaderboardRun) return;
      console.warn('Leaderboard unavailable',error);
      ui['leaderboard-status'].textContent = '지금은 기록판에 연결할 수 없어요. (게임 점수는 그대로예요)';
    }
  }
  try {
    const assets = new Assets();
    await assets.preload(ESSENTIAL_ASSETS);
    const input = new Input();
    const renderer = new Renderer(ui.game,assets);
    let game;
    const quiz = new QuizSystem(final => game.finishQuiz(final),answer => game.recordCorrectAnswer(answer),() => game.recordWrongAnswer());
    game = new Game(input,renderer, {
      onState(state) {
        ui['start-screen'].hidden = state !== 'START';
        if (state === 'START') showTitleLeaderboard();
        ui['ready-screen'].hidden = state !== 'READY';
        ui['final-ready-screen'].hidden = state !== 'FINAL_READY';
        ui['pause-screen'].hidden = state !== 'PAUSED';
        ui['pause-button'].hidden = state !== 'PLAYING';
        ui.hud.hidden = state === 'START' || state === 'READY';
        if (state === 'START' || state === 'READY') ui['boss-hud'].hidden = true;
        if (state !== 'QUIZ') quiz.hide();
        ui['result-screen'].hidden = state !== 'STAGE_CLEAR' && state !== 'GAME_CLEAR';
        const focus = { START:'start-button', READY:'ready-start-button', FINAL_READY:'final-start-button', PAUSED:'resume-button', PLAYING:'game' }[state];
        if (focus) ui[focus].focus({ preventScroll:true });
      },
      onHud(players,stage,boss) {
        for (const player of players) ui[`p${player.id}-hp`].textContent = player.hp ? '♥'.repeat(player.hp) + '♡'.repeat(player.maxHp-player.hp) : 'DOWN';
        ui['stage-number'].textContent = game.battlePhase === 'DEMON' ? `FINAL · ${game.demonAttempts}차 도전` : `STAGE ${stage.id}`;
        ui['stage-name'].textContent = game.battlePhase === 'DEMON' ? 'PYTHON 마왕 · 정지 중 체력 회복' : stage.name;
        for (const player of players) {
          ui[`p${player.id}-name`].textContent = `P${player.id} ${player.nickname}`;
          ui[`p${player.id}-power`].textContent = `${CLASSES[player.classType].name} LV ${player.level} · ATK ×${player.attackMultiplier}${player.defenseUp ? ' · 방패 +1' : ''}${game.battlePhase === 'DEMON' ? ` · ${player.id===1?'G':'K'} 궁극기 ${Math.ceil(player.ultimateCooldown)||'준비'}` : ''}`;
          ui[`p${player.id}-score`].textContent = `${game.getScore(player)}점`;
        }
        ui['team-score'].textContent = `${game.isSolo ? '총점' : '협력 총점'} ${game.totalScore}${game.state === 'PLAYING' ? ` · ⏱ ${Math.floor(game.battleTime)}초 스피드 +${game.currentSpeedBonus}` : ''}`;
        ui['boss-hud'].hidden = !boss;
        if (boss) {
          ui['boss-name'].textContent = `${boss.label} · ${boss.weakness ? CLASSES[boss.weakness].name+' 약점 ×3' : '약점 없음'}`;
          ui['boss-hp'].max = boss.maxHp;
          ui['boss-hp'].value = boss.hp;
          ui['boss-health'].textContent = `${Math.ceil(boss.hp)} / ${boss.maxHp}`;
          ui['boss-health-fill'].style.transform = `scaleX(${boss.hp/boss.maxHp})`;
          ui['boss-health-trail'].style.transform = `scaleX(${boss.hp/boss.maxHp})`;
        } else {
          ui['boss-health-fill'].style.transform = 'scaleX(1)';
          ui['boss-health-trail'].style.transform = 'scaleX(1)';
        }
      },
      onTeacherQuiz(stage) { quiz.startStage(stage); },
      onFinalQuiz() { quiz.startFinal(); },
      onResult(final,last) {
        ui['result-scores'].hidden = !final;
        if (final) {
          for (const player of game.players) {
            ui[`result-p${player.id}-name`].textContent = `P${player.id} ${player.nickname}`;
            ui[`result-p${player.id}-details`].textContent = `일반 적 ${player.kills-player.bossKills}마리 · 보스 ${player.bossKills}마리`;
            ui[`result-p${player.id}-score`].textContent = `${game.getScore(player)}점`;
          }
          ui['result-quiz-score'].textContent = `공통 퀴즈 정답 ${game.correctAnswers}개 · ${game.correctAnswers*QUIZ_SCORE}점 · 마왕 ${game.demonAttempts}차 승리 +${game.demonBonus}점 · 스피드 보너스 +${game.speedBonus}점 (${game.speedBonuses.map(record => `${record.label} ${record.seconds}초 +${record.bonus}`).join(', ')}) · 오답 ${game.wrongAnswers}회 / DOWN ${game.deaths}회 감점 −${game.penalty}점`;
          ui['result-team-score'].textContent = `${game.isSolo ? '총점' : '협력 총점'} ${game.totalScore}점`;
          showLeaderboard(game);
        }
        ui['result-eyebrow'].textContent = final ? 'CODE QUEST' : 'CORRECT!';
        ui['result-title'].textContent = final ? 'CLEAR!' : 'STAGE CLEAR!';
        ui['result-message'].textContent = final ? (game.isSolo ? '코딩 던전 탈출 성공! 혼자서도 해냈어요. 코딩 실력이 빛났어요!' : '코딩 던전 탈출 성공! 두 사람의 협동과 코딩 실력이 빛났어요!') : last ? '네 개의 던전 정복 완료! 마지막 코딩 문제 3개에 도전하세요.' : game.isSolo ? '잘했어요! 다음 던전에도 도전해 볼까요?' : '잘했어요! 다음 던전도 함께 도전해 볼까요?';
        ui['result-button'].textContent = final ? 'PLAY AGAIN' : last ? 'FINAL QUIZ START' : 'NEXT STAGE';
        ui['result-button'].focus({ preventScroll:true });
      }
    });
    for (const player of game.allPlayers) {
      const selector=ui[`p${player.id}-class`];
      const preview=ui[`p${player.id}-preview`];
      const refresh=()=>renderer.drawPreview(preview,selector.value,player.id);
      for (const type of Object.keys(CLASSES)) {
        ui[`p${player.id}-${type}`].addEventListener('click',()=>{
          selector.value=type;
          for (const role of Object.keys(CLASSES)) ui[`p${player.id}-${role}`].setAttribute('aria-pressed',String(role===type));
          refresh();
        });
      }
      refresh();
    }
    // Player count is chosen on the title screen and kept for PLAY AGAIN.
    const applyPlayerCount = count => {
      game.setPlayerCount(count);
      const solo = game.isSolo;
      ui['game-shell'].classList.toggle('solo',solo);
      ui['mode-1p'].setAttribute('aria-pressed',String(solo));
      ui['mode-2p'].setAttribute('aria-pressed',String(!solo));
      for (const id of ['p2-card','ready-p2-card','final-p2-card','result-p2-card','ready-item-tip']) ui[id].hidden = solo;
      ui['ready-solo-tip'].hidden = !solo;
      ui['p2-nickname'].required = !solo;
      ui['ready-title'].textContent = solo ? '준비됐나요?' : '두 플레이어, 준비됐나요?';
      ui['ready-start-button'].textContent = solo ? '1 PLAYER START' : '2 PLAYER START';
      ui['ready-ultimate-keys'].textContent = solo ? '마왕 전투 궁극기: G' : '마왕 전투 궁극기: P1 G · P2 K';
      ui['final-retry-rule'].textContent = solo ? 'DOWN되면 마왕 전투 재도전!' : '한 명 DOWN이면 부활, 둘 다 DOWN이면 마왕 전투 재도전!';
      ui['loading-message'].textContent = '';
    };
    ui['mode-1p'].addEventListener('click',() => applyPlayerCount(1));
    ui['mode-2p'].addEventListener('click',() => applyPlayerCount(2));
    ui['start-button'].disabled = false;
    ui['start-button'].textContent = '게임 시작';
    showTitleLeaderboard();
    ui['title-leaderboard-refresh'].addEventListener('click',() => showTitleLeaderboard());
    ui['start-button'].addEventListener('click', () => {
      for (const player of game.players) {
        const field = ui[`p${player.id}-nickname`];
        const name = field.value.trim().slice(0,NICKNAME_MAX_LENGTH);
        if (!name) {ui['loading-message'].textContent=`PLAYER ${player.id} 닉네임을 입력해 주세요.`;field.focus();return;}
        player.nickname = name;
        player.setClass(ui[`p${player.id}-class`].value);
      }
      ui['loading-message'].textContent='';
      for (const player of game.players) ui[`ready-p${player.id}-name`].textContent=`P${player.id} ${player.nickname}`;

      game.showInstructions();
    });
    ui['ready-start-button'].addEventListener('click', () => {
      quiz.resetRun();
      game.startGame();
      // Empty in MVP; optional assets never block play and are cached once.
      void assets.preload(LATER_ASSETS);
    });
    ui['final-start-button'].addEventListener('click', () => game.beginFinalBattle());
    ui['ready-back-button'].addEventListener('click', () => game.returnToStart());
    ui['pause-button'].addEventListener('click', () => game.pauseGame());
    ui['resume-button'].addEventListener('click', () => game.resumeGame());
    ui['home-button'].addEventListener('click', () => game.returnToStart());
    ui['result-button'].addEventListener('click', () => {
      if (game.state === 'GAME_CLEAR') game.showInstructions();
      else if (game.state === 'STAGE_CLEAR') game.continueAfterStage();
    });
    game.returnToStart();
    // Font loading never blocks start; refresh a paused frame when it becomes available.
    document.fonts?.ready.then(() => { game.needsRender = true; });
  } catch (error) {
    console.error('Game initialization failed:',error);
    ui['loading-message'].textContent = '게임을 불러오지 못했습니다. 페이지를 새로고침해 주세요.';
    ui['start-button'].textContent = 'LOAD FAILED';
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',initialize,{ once:true });
else void initialize();
