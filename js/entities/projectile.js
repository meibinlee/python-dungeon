import { DIRECTIONS, ARENA, CLASSES } from '../core/config.js';
export class Projectile {
  constructor(player) {
    const [dx,dy] = DIRECTIONS[player.direction];
    const role = CLASSES[player.classType];
    const melee = player.classType === 'warrior';
    const width = melee && dx ? 72 : role.size;
    const height = melee && dy ? 72 : role.size;
    Object.assign(this, { x:player.x+player.width/2-width/2+dx*(melee?50:24), y:player.y+player.height/2-height/2+dy*(melee?50:24), width,height, velocityX:dx*role.speed, velocityY:dy*role.speed, damage:role.damage*player.attackMultiplier, lifetime:role.lifetime, owner:player.id, color:player.color, active:true, classType:player.classType, direction:player.direction });
    this.player = melee ? player : null;
  }
  update(dt) {
    if (this.player) {
      const [dx,dy]=DIRECTIONS[this.direction];
      this.x=this.player.x+this.player.width/2-this.width/2+dx*50;
      this.y=this.player.y+this.player.height/2-this.height/2+dy*50;
      if (!this.player.active) this.active=false;
    } else { this.x += this.velocityX*dt; this.y += this.velocityY*dt; }
    this.lifetime -= dt;
    if (this.lifetime<=0 || this.x+this.width<ARENA.left || this.x>ARENA.right || this.y+this.height<ARENA.top || this.y>ARENA.bottom) this.active=false;
  }
}
