import { MAX_DELTA_TIME, MAX_PROJECTILES, PLAYER_1_KEYS, PLAYER_2_KEYS } from './config.js';
import { Player } from '../entities/player.js';
import { StageSystem } from '../systems/stage.js';
import { checkCollisions } from '../systems/collision.js';

export class Game {
  constructor(input,renderer,events) {
    Object.assign(this, { input, renderer, events, state:'START', projectiles:[], monsters:[], restartNotice:0, lastTime:null });
    this.stages = new StageSystem();
    this.players = [new Player(1,PLAYER_1_KEYS,'#6fc6ff',480,460), new Player(2,PLAYER_2_KEYS,'#ffd34e',760,460)];
    this.renderer.prepareBackground(this.stages.current);
    this.hudCache = '';
    this.loop = this.loop.bind(this);
    // Exactly one chain, created here; starting/replaying never creates another loop.
    requestAnimationFrame(this.loop);
  }
  setState(state) {
    this.state = state;
    this.input.setEnabled(state === 'PLAYING');
    this.events.onState(state);
  }
  startGame() { this.stages.reset(); this.startStage(); }
  startStage() {
    this.players.forEach(player => player.reset());
    this.projectiles = [];
    this.monsters = this.stages.spawnMonsters();
    this.restartNotice = 0;
    this.renderer.prepareBackground(this.stages.current);
    this.setState('PLAYING');
    this.updateHud();
  }
  restartStage() { this.startStage(); this.restartNotice = 2; }
  advanceStage() { this.stages.advance(); this.startStage(); }
  startTeacherQuiz() {
    this.projectiles = [];
    this.setState('QUIZ');
    this.events.onTeacherQuiz(this.stages.current.id);
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
    for (const player of this.players) {
      player.update(dt,this.input);
      if (this.input.isDown(player.keys.attack) && this.projectiles.length < MAX_PROJECTILES) {
        const projectile = player.attack();
        if (projectile) this.projectiles.push(projectile);
      }
    }
    for (const monster of this.monsters) monster.update(dt,this.players);
    for (const projectile of this.projectiles) projectile.update(dt);
    checkCollisions(this.players,this.monsters,this.projectiles);
    this.monsters = this.monsters.filter(monster => monster.active);
    this.projectiles = this.projectiles.filter(projectile => projectile.active);
    this.updateHud();
    if (this.players.every(player => !player.active)) { this.restartStage(); return; }
    if (this.stages.isComplete(this.monsters)) this.startTeacherQuiz();
  }
  updateHud() {
    const values = `${this.stages.current.id}:${this.players.map(player => player.hp).join(':')}`;
    if (values === this.hudCache) return;
    this.hudCache = values;
    this.events.onHud(this.players,this.stages.current);
  }
  loop(timestamp) {
    const dt = this.lastTime === null ? 0 : Math.min((timestamp-this.lastTime)/1000,MAX_DELTA_TIME);
    this.lastTime = timestamp;
    // Hidden tabs pause simulation and clear keys; dt also limits the resume frame.
    if (!document.hidden) {
      this.update(dt);
      this.renderer.render(this);
    }
    requestAnimationFrame(this.loop);
  }
}
