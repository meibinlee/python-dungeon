import { Assets, ESSENTIAL_ASSETS, LATER_ASSETS } from './core/assets.js';
import { Input } from './core/input.js';
import { Renderer } from './core/renderer.js';
import { Game } from './core/game.js';
import { QuizSystem } from './systems/quiz.js';

async function initialize() {
  const ids = ['game','start-screen','start-button','loading-message','ready-screen','ready-start-button','ready-back-button','pause-screen','pause-button','resume-button','home-button','hud','p1-hp','p2-hp','stage-number','stage-name','result-screen','result-eyebrow','result-title','result-message','result-button'];
  ids.push('p1-power','p2-power','boss-hud','boss-name','boss-hp','boss-health');
  const ui = Object.fromEntries(ids.map(id => [id,document.getElementById(id)]));
  try {
    const assets = new Assets();
    await assets.preload(ESSENTIAL_ASSETS);
    const input = new Input();
    const renderer = new Renderer(ui.game,assets);
    let game;
    const quiz = new QuizSystem(final => game.finishQuiz(final));
    game = new Game(input,renderer, {
      onState(state) {
        ui['start-screen'].hidden = state !== 'START';
        ui['ready-screen'].hidden = state !== 'READY';
        ui['pause-screen'].hidden = state !== 'PAUSED';
        ui['pause-button'].hidden = state !== 'PLAYING';
        ui.hud.hidden = state === 'START' || state === 'READY';
        if (state === 'START' || state === 'READY') ui['boss-hud'].hidden = true;
        if (state !== 'QUIZ') quiz.hide();
        ui['result-screen'].hidden = state !== 'STAGE_CLEAR' && state !== 'GAME_CLEAR';
        const focus = { START:'start-button', READY:'ready-start-button', PAUSED:'resume-button', PLAYING:'game' }[state];
        if (focus) ui[focus].focus({ preventScroll:true });
      },
      onHud(players,stage,boss) {
        for (const player of players) ui[`p${player.id}-hp`].textContent = player.hp ? '♥'.repeat(player.hp) + '♡'.repeat(player.maxHp-player.hp) : 'DOWN';
        ui['stage-number'].textContent = `STAGE ${stage.id}`;
        ui['stage-name'].textContent = stage.name;
        for (const player of players) ui[`p${player.id}-power`].textContent = `ATK ×${player.attackMultiplier}`;
        ui['boss-hud'].hidden = !boss;
        if (boss) {
          ui['boss-name'].textContent = boss.label;
          ui['boss-hp'].max = boss.maxHp;
          ui['boss-hp'].value = boss.hp;
          ui['boss-health'].textContent = `${boss.hp} / ${boss.maxHp}`;
        }
      },
      onTeacherQuiz(stage) { quiz.startStage(stage); },
      onFinalQuiz() { quiz.startFinal(); },
      onResult(final,last) {
        ui['result-eyebrow'].textContent = final ? 'CODE QUEST' : 'CORRECT!';
        ui['result-title'].textContent = final ? 'CLEAR!' : 'STAGE CLEAR!';
        ui['result-message'].textContent = final ? '코딩 던전 탈출 성공! 두 사람의 협동과 코딩 실력이 빛났어요!' : last ? '네 개의 던전 정복 완료! 마지막 코딩 문제 3개에 도전하세요.' : '잘했어요! 다음 던전도 함께 도전해 볼까요?';
        ui['result-button'].textContent = final ? 'PLAY AGAIN' : last ? 'FINAL QUIZ START' : 'NEXT STAGE';
        ui['result-button'].focus({ preventScroll:true });
      }
    });
    ui['start-button'].disabled = false;
    ui['start-button'].textContent = '게임 시작';
    ui['start-button'].addEventListener('click', () => game.showInstructions());
    ui['ready-start-button'].addEventListener('click', () => {
      quiz.resetRun();
      game.startGame();
      // Empty in MVP; optional assets never block play and are cached once.
      void assets.preload(LATER_ASSETS);
    });
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
