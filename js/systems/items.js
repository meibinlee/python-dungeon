import { ITEM_SIZE, POWER_MULTIPLIER } from '../core/config.js';
import { overlaps } from './collision.js';

export function spawnItems() {
  return [350,900].map(x => ({ x, y:380, width:ITEM_SIZE, height:ITEM_SIZE, active:true }));
}
export function collectItems(players,items) {
  for (const item of items) {
    if (!item.active) continue;
    for (const player of players) {
      // A powered player cannot consume the teammate's second crystal.
      if (player.active && player.attackMultiplier < POWER_MULTIPLIER && overlaps(player,item)) {
        player.attackMultiplier = POWER_MULTIPLIER;
        item.active = false;
        break;
      }
    }
  }
}
