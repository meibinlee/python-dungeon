import { ARENA, PLAYER_SPEED, PLAYER_MAX_HP, PLAYER_SIZE, ATTACK_COOLDOWN, INVINCIBLE_TIME, RESPAWN_TIME, LEVEL_SPEED_BONUS, LEVEL_COOLDOWN_BONUS, CLASSES } from '../core/config.js';
import { clamp } from '../core/utils.js';
import { Projectile } from './projectile.js';

export class Player {
  constructor(id, keys, color, x, y) {
    Object.assign(this, { id, keys, color, spawnX:x, spawnY:y, width:PLAYER_SIZE, height:PLAYER_SIZE, speed:PLAYER_SPEED, maxHp:PLAYER_MAX_HP });
    this.classType = 'mage';
    this.reset();
    this.nickname = `Player ${id}`;
    this.setLevel(1);
    this.resetStats();
  }
  setClass(type) { if (CLASSES[type]) this.classType = type; }
  resetStats() { this.kills=0; this.bossKills=0; }
  setLevel(level) {
    this.level = level;
    this.speed = PLAYER_SPEED + (level-1)*LEVEL_SPEED_BONUS;
    this.attackInterval = ATTACK_COOLDOWN - (level-1)*LEVEL_COOLDOWN_BONUS;
  }
  reset(keepPower = false) {
    const attackMultiplier = keepPower ? this.attackMultiplier : 1;
    if (!keepPower) { this.maxHp = PLAYER_MAX_HP; this.defenseUp = false; }
    Object.assign(this, { x:this.spawnX, y:this.spawnY, hp:this.maxHp, active:true, direction:'up', attackCooldown:0, invincibleTime:INVINCIBLE_TIME, respawnTime:0 });
    this.attackMultiplier = attackMultiplier;
    Object.assign(this,{ hurtTime:0, walkTime:0, moving:false });
  }
  update(dt, input) {
    this.hurtTime = Math.max(0,this.hurtTime-dt);
    if (!this.active) {
      this.respawnTime -= dt;
      if (this.respawnTime <= 0) this.reset(true);
      return;
    }
    this.invincibleTime = Math.max(0, this.invincibleTime - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const dx = Number(input.isDown(this.keys.right)) - Number(input.isDown(this.keys.left));
    const dy = Number(input.isDown(this.keys.down)) - Number(input.isDown(this.keys.up));
    this.moving = Boolean(dx || dy);
    if (this.moving) this.walkTime += dt;
    if (dx || dy) {
      this.direction = dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      const length = Math.hypot(dx, dy);
      this.x = clamp(this.x + dx / length * this.speed * dt, ARENA.left, ARENA.right - this.width);
      this.y = clamp(this.y + dy / length * this.speed * dt, ARENA.top, ARENA.bottom - this.height);
    }
  }
  attack() {
    if (!this.active || this.attackCooldown > 0) return null;
    this.attackCooldown = this.attackInterval;
    return new Projectile(this);
  }
  takeDamage(damage = 1) {
    if (!this.active || this.invincibleTime > 0) return 0;
    const previous = this.hp;
    this.hp = Math.max(0, this.hp - damage);
    this.hurtTime = 0.3;
    this.invincibleTime = INVINCIBLE_TIME;
    if (this.hp === 0) { this.active = false; this.respawnTime = RESPAWN_TIME; }
    return previous-this.hp;
  }
}
