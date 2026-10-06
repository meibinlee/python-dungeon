import { DIRECTIONS, ARENA, CLASSES } from '../core/config.js';
export class Projectile {
  constructor(player) {
    const [dx,dy] = DIRECTIONS[player.direction];
    const role = CLASSES[player.classType];
    const melee = player.classType === 'warrior';
    const width = role.size;
    const height = role.size;
    Object.assign(this, { x:player.x+player.width/2-width/2+dx*(melee?role.reach:24), y:player.y+player.height/2-height/2+dy*(melee?role.reach:24), width,height, velocityX:dx*role.speed, velocityY:dy*role.speed, damage:role.damage*player.attackMultiplier, lifetime:role.lifetime, owner:player.id, color:player.color, active:true, classType:player.classType, direction:player.direction });
    this.player = melee ? player : null;
    this.traveled = 0;
    this.range = role.range ?? Infinity;
    this.reach = role.reach;
    this.damageSteps = role.damageSteps || [];
  }
  getDamage() {
    // Distance is measured from the launch point, unaffected by the shooter moving later.
    return this.damage * (1 + this.damageSteps.filter(distance => this.traveled >= distance).length);
  }
  update(dt) {
    if (this.traveled >= this.range) { this.active=false; return; }
    if (this.player) {
      const [dx,dy]=DIRECTIONS[this.direction];
      this.x=this.player.x+this.player.width/2-this.width/2+dx*this.reach;
      this.y=this.player.y+this.player.height/2-this.height/2+dy*this.reach;
      if (!this.player.active) this.active=false;
    } else {
      const speed=Math.hypot(this.velocityX,this.velocityY);
      const distance=Math.min(speed*dt,this.range-this.traveled);
      if (speed) {this.x+=this.velocityX/speed*distance;this.y+=this.velocityY/speed*distance;}
      this.traveled+=distance;
    }
    this.lifetime -= dt;
    if (this.lifetime<=0 || this.x+this.width<ARENA.left || this.x>ARENA.right || this.y+this.height<ARENA.top || this.y>ARENA.bottom) this.active=false;
  }
}
