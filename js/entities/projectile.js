import { DIRECTIONS, PROJECTILE_SPEED, PROJECTILE_SIZE, PROJECTILE_LIFETIME, ARENA } from '../core/config.js';
export class Projectile {
  constructor(player) {
    const [dx,dy] = DIRECTIONS[player.direction];
    Object.assign(this, { x:player.x + player.width/2 - PROJECTILE_SIZE/2 + dx*24, y:player.y + player.height/2 - PROJECTILE_SIZE/2 + dy*24, width:PROJECTILE_SIZE, height:PROJECTILE_SIZE, velocityX:dx*PROJECTILE_SPEED, velocityY:dy*PROJECTILE_SPEED, damage:1, lifetime:PROJECTILE_LIFETIME, owner:player.id, color:player.color, active:true });
  }
  update(dt) {
    this.x += this.velocityX * dt; this.y += this.velocityY * dt; this.lifetime -= dt;
    if (this.lifetime <= 0 || this.x+this.width < ARENA.left || this.x > ARENA.right || this.y+this.height < ARENA.top || this.y > ARENA.bottom) this.active = false;
  }
}
