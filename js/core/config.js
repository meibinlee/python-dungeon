export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const ARENA = { left:32, top:180, right:1248, bottom:688 };
export const POWER_MULTIPLIER = 2;
export const ITEM_SIZE = 32;
export const BOSS_CHARGE_INTERVAL = 4;
export const BOSS_WINDUP_TIME = 0.8;
export const BOSS_CHARGE_TIME = 0.65;
export const BOSS_CHARGE_SPEED = 280;
export const PLAYER_SPEED = 260;
export const LEVEL_SPEED_BONUS = 8;
export const LEVEL_COOLDOWN_BONUS = 0.015;
export const NICKNAME_MAX_LENGTH = 8;
export const KILL_SCORE = 10;
export const BOSS_SCORE = 100;
export const QUIZ_SCORE = 100;
export const PLAYER_MAX_HP = 3;
export const DEFENSE_BONUS_HP = 1;
export const PLAYER_SIZE = 40;
export const ATTACK_COOLDOWN = 0.3;
export const INVINCIBLE_TIME = 1;
export const RESPAWN_TIME = 3;
export const MAX_PROJECTILES = 20;
export const MAX_MONSTERS = 7;
export const MAX_DELTA_TIME = 0.05;
export const HEALTH_CHANGE_TIME = 0.25;
export const HEALTH_TRAIL_DELAY = 0.18;
export const HEALTH_TRAIL_TIME = 0.7;
export const DAMAGE_NUMBER_TIME = 0.8;
export const MAX_DAMAGE_EFFECTS = 24;
export const PLAYER_1_KEYS = { up:'KeyW', down:'KeyS', left:'KeyA', right:'KeyD', attack:'KeyF' };
export const PLAYER_2_KEYS = { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight', attack:'KeyL' };
export const DIRECTIONS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };

export const CLASSES = {
  warrior: { name:'전사', damage:4, speed:0, lifetime:0.16, size:56, reach:32 },
  archer: { name:'궁수', damage:1, speed:800, lifetime:1.2, size:14, range:900, damageSteps:[250,500] },
  mage: { name:'마법사', damage:1, speed:500, lifetime:0.9, size:20, range:420, damageSteps:[140,280] }
};
export const BOSS_WEAKNESS_MULTIPLIER = 3;
