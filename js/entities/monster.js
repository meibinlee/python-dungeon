import { ARENA } from '../core/config.js';
import { clamp } from '../core/utils.js';
export class Monster {
  constructor(label, x, y, speed, hp) {
    Object.assign(this, { label, x, y, speed, hp, maxHp:hp, width:96, height:64, damage:1, active:true, hitTime:0 });
  }
  update(dt, players) {
    this.hitTime = Math.max(0, this.hitTime - dt);
    let target = null, nearest = Infinity;
    for (const player of players) {
      if (!player.active) continue;
      const distance = (player.x + player.width/2 - this.x - this.width/2)**2 + (player.y + player.height/2 - this.y - this.height/2)**2;
      if (distance < nearest) { nearest = distance; target = player; }
    }
    if (!target) return;
    const dx = target.x + target.width/2 - this.x - this.width/2;
    const dy = target.y + target.height/2 - this.y - this.height/2;
    const length = Math.hypot(dx,dy);
    if (!length) return;
    this.x = clamp(this.x + dx/length*this.speed*dt, ARENA.left, ARENA.right-this.width);
    this.y = clamp(this.y + dy/length*this.speed*dt, ARENA.top, ARENA.bottom-this.height);
  }
  takeDamage(damage) { this.hp -= damage; this.hitTime = 0.12; if (this.hp <= 0) this.active = false; }
}
