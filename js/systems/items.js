import { ITEM_SIZE, POWER_MULTIPLIER, DEFENSE_BONUS_HP } from '../core/config.js';
import { overlaps } from './collision.js';

export function spawnItems() {
  return [
    ['attack',350,380],['attack',900,380],
    ['defense',380,560],['defense',840,560],
    ['heal',500,280],['heal',740,280]
  ].map(([type,x,y]) => ({ type, x, y, width:ITEM_SIZE, height:ITEM_SIZE, active:true }));
}
export function collectItems(players,items) {
  for (const item of items) {
    if (!item.active) continue;
    for (const player of players) {
      if (!player.active || !overlaps(player,item)) continue;
      // Leave unneeded loot on the ground for the teammate or a later injury.
      if (item.type === 'attack' && player.attackMultiplier < POWER_MULTIPLIER) player.attackMultiplier = POWER_MULTIPLIER;
      else if (item.type === 'defense' && !player.defenseUp) {
        player.defenseUp = true;
        player.maxHp += DEFENSE_BONUS_HP;
        player.hp += DEFENSE_BONUS_HP;
      } else if (item.type === 'heal' && player.hp < player.maxHp) player.hp = player.maxHp;
      else continue;
      item.active = false;
      break;
    }
  }
}
