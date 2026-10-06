import { MAX_DELTA_TIME, MAX_PROJECTILES, PLAYER_1_KEYS, PLAYER_2_KEYS, DAMAGE_NUMBER_TIME, MAX_DAMAGE_EFFECTS, KILL_SCORE, BOSS_SCORE, QUIZ_SCORE } from './config.js';
import { Player } from '../entities/player.js';
import { StageSystem } from '../systems/stage.js';
import { checkCollisions } from '../systems/collision.js';
import { spawnItems, collectItems } from '../systems/items.js';

export class Game {
  constructor(input,renderer,events) {
    Object.assign(this, { input, renderer, events, state:'START', projectiles:[], monsters:[], items:[], battlePhase:'MONSTERS', restartNotice:0, lastTime:null });
    this.stages = new StageSystem();
    this.players = [new Player(1,PLAYER_1_KEYS,'#6fc6ff',480,460), new Player(2,PLAYER_2_KEYS,'#ffd34e',760,460)];
    this.renderer.prepareBackground(this.stages.current);
    this.hudCache = '';
    this.needsRender = true;
    this.damageEffects = [];
    this.correctAnswers = 0;
    this.onHit = (entity,damage,isPlayer,owner) => {
      if (this.damageEffects.length >= MAX_DAMAGE_EFFECTS) this.damageEffects.shift();
      this.damageEffects.push({ x:entity.x+entity.width/2, y:entity.y-20, damage, isPlayer, time:DAMAGE_NUMBER_TIME });
      if (!isPlayer && !entity.active) {
        const player = this.players.find(player => player.id === owner);
        if (player) { player.kills++; if (entity.isBoss) player.bossKills++; }
      }
    };
    this.input.onPause = () => this.togglePause();
    this.input.onInactive = () => this.pauseGame();
    this.loop = this.loop.bind(this);
    // Exactly one chain, created here; starting/replaying never creates another loop.
    requestAnimationFrame(this.loop);
  }
  setState(state) {
    this.state = state;
    this.lastTime = null;
    this.needsRender = true;
    this.input.setEnabled(state === 'PLAYING', state === 'PLAYING' || state === 'PAUSED');
    this.events.onState(state);
  }
  startGame() { this.correctAnswers = 0; this.players.forEach(player => player.resetStats()); this.stages.reset(); this.startStage(); }
  getScore(player) { return (player.kills-player.bossKills)*KILL_SCORE+player.bossKills*BOSS_SCORE; }
  get totalScore() { return this.players.reduce((total,player) => total+this.getScore(player),this.correctAnswers*QUIZ_SCORE); }
  recordCorrectAnswer() { this.correctAnswers++; this.updateHud(); }
  showInstructions() {
    if (this.state === 'START' || this.state === 'GAME_CLEAR') this.setState('READY');
  }
  returnToStart() {
    this.correctAnswers = 0;
    this.stages.reset();
    this.monsters = [];
    this.projectiles = [];
    this.items = [];
    this.damageEffects = [];
    this.battlePhase = 'MONSTERS';
    this.players.forEach(player => player.reset());
    this.players.forEach(player => { player.resetStats(); player.setLevel(1); });
    this.restartNotice = 0;
    this.renderer.prepareBackground(this.stages.current);
    this.setState('START');
  }
  pauseGame() { if (this.state === 'PLAYING') this.setState('PAUSED'); }
  resumeGame() { if (this.state === 'PAUSED') this.setState('PLAYING'); }
  togglePause() {
    if (this.state === 'PLAYING') this.pauseGame();
    else if (this.state === 'PAUSED') this.resumeGame();
  }
  startStage() {
    // A failed attempt does not inflate the final score by farming the same stage.
    this.stageQuizCount = this.correctAnswers;
    this.stageStats = this.players.map(player => ({ kills:player.kills, bossKills:player.bossKills }));
    this.players.forEach(player => player.reset());
    this.players.forEach(player => player.setLevel(this.stages.current.id));
    this.projectiles = [];
    this.monsters = this.stages.spawnMonsters();
    this.items = spawnItems();
    this.damageEffects = [];
    this.battlePhase = 'MONSTERS';
    this.restartNotice = 0;
    this.renderer.prepareBackground(this.stages.current);
    this.setState('PLAYING');
    this.updateHud();
  }
  restartStage() {
    this.correctAnswers = this.stageQuizCount;
    this.players.forEach((player,index) => Object.assign(player,this.stageStats[index]));
    this.startStage(); this.restartNotice = 2;
  }
  advanceStage() { this.stages.advance(); this.startStage(); }
  startTeacherQuiz() {
    this.projectiles = [];
    this.setState('QUIZ');
    this.events.onTeacherQuiz(this.stages.current.id);
  }
  startBossBattle() {
    const boss = this.stages.spawnBoss(this.players);
    if (!boss) return;
    this.monsters = [boss];
    this.projectiles = [];
    this.battlePhase = 'BOSS';
    this.updateHud();
  }
  finishQuiz(final) {
    this.setState(final ? 'GAME_CLEAR' : 'STAGE_CLEAR');
    this.events.onResult(final,this.stages.isLast);
  }
  continueAfterStage() {
    if (this.stages.isLast) { this.setState('QUIZ'); this.events.onFinalQuiz(); }
    else this.advanceStage();
  }
  update(dt) {
    if (this.state !== 'PLAYING') return;
    this.restartNotice = Math.max(0,this.restartNotice-dt);
    for (const effect of this.damageEffects) effect.time -= dt;
    this.damageEffects = this.damageEffects.filter(effect => effect.time > 0);
    for (const player of this.players) {
      player.update(dt,this.input);
    }
    collectItems(this.players,this.items);
    this.items = this.items.filter(item => item.active);
    for (const player of this.players) {
      if (this.input.isDown(player.keys.attack) && this.projectiles.length < MAX_PROJECTILES) {
        const projectile = player.attack();
        if (projectile) this.projectiles.push(projectile);
      }
    }
    for (const monster of this.monsters) monster.update(dt,this.players);
    for (const projectile of this.projectiles) projectile.update(dt);
    checkCollisions(this.players,this.monsters,this.projectiles,this.onHit);
    this.monsters = this.monsters.filter(monster => monster.active);
    this.projectiles = this.projectiles.filter(projectile => projectile.active);
    this.updateHud();
    if (this.players.every(player => !player.active)) { this.restartStage(); return; }
    if (this.stages.isComplete(this.monsters)) {
      if (this.battlePhase === 'MONSTERS' && this.stages.current.boss) this.startBossBattle();
      else this.startTeacherQuiz();
    }
  }
  updateHud() {
    const boss = this.monsters.find(monster => monster.isBoss);
    const values = `${this.correctAnswers}:${this.stages.current.id}:${this.battlePhase}:${boss?.hp ?? ''}:${this.players.map(player => `${player.hp}/${player.maxHp}/${player.attackMultiplier}/${player.kills}/${player.bossKills}/${player.classType}/${player.nickname}/${player.level}`).join(':')}`;
    if (values === this.hudCache) return;
    this.hudCache = values;
    this.events.onHud(this.players,this.stages.current,boss);
  }
  loop(timestamp) {
    const dt = this.lastTime === null ? 0 : Math.min((timestamp-this.lastTime)/1000,MAX_DELTA_TIME);
    this.lastTime = timestamp;
    // Hidden tabs pause simulation and clear keys; dt also limits the resume frame.
    if (!document.hidden) {
      this.update(dt);
      if (this.state === 'PLAYING' || this.needsRender) {
        this.renderer.render(this);
        this.needsRender = false;
      }
    }
    requestAnimationFrame(this.loop);
  }
}
