import { Monster } from './monster.js';
import { ARENA, BOSS_CHARGE_INTERVAL, BOSS_WINDUP_TIME, BOSS_CHARGE_TIME, BOSS_CHARGE_SPEED } from '../core/config.js';
import { clamp, updateHealthVisual } from '../core/utils.js';

export class Boss extends Monster {
  constructor(definition) {
    super(definition.name, 560, 205, definition.speed, definition.hp);
    Object.assign(this, { isBoss:true, width:160, height:112, phase:'CHASE', timer:BOSS_CHARGE_INTERVAL, chargeX:0, chargeY:1 });
    this.chargeInterval = definition.chargeInterval || BOSS_CHARGE_INTERVAL;
    this.chargeSpeed = definition.chargeSpeed || BOSS_CHARGE_SPEED;
    this.timer = this.chargeInterval;
  }
  update(dt, players) {
    if (this.phase === 'CHASE') {
      super.update(dt,players);
      this.timer -= dt;
      if (this.timer > 0) return;
      let target = null, nearest = Infinity;
      for (const player of players) {
        if (!player.active) continue;
        const dx = player.x+player.width/2-this.x-this.width/2;
        const dy = player.y+player.height/2-this.y-this.height/2;
        const distance = Math.hypot(dx,dy);
        if (distance < nearest) { target = [dx,dy]; nearest = distance; }
      }
      if (!target) return;
      this.chargeX = nearest ? target[0]/nearest : 0;
      this.chargeY = nearest ? target[1]/nearest : 1;
      this.phase = 'WINDUP'; this.timer = BOSS_WINDUP_TIME;
      return;
    }
    updateHealthVisual(this,dt);
    this.hitTime = Math.max(0,this.hitTime-dt);
    this.timer -= dt;
    if (this.phase === 'CHARGE') {
      this.x = clamp(this.x+this.chargeX*this.chargeSpeed*dt,ARENA.left,ARENA.right-this.width);
      this.y = clamp(this.y+this.chargeY*this.chargeSpeed*dt,ARENA.top,ARENA.bottom-this.height);
    }
    if (this.timer <= 0) {
      this.phase = this.phase === 'WINDUP' ? 'CHARGE' : 'CHASE';
      this.timer = this.phase === 'CHARGE' ? BOSS_CHARGE_TIME : this.chargeInterval;
    }
  }
}
