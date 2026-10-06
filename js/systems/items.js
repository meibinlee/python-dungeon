import { ITEM_SIZE, POWER_MULTIPLIER, DEFENSE_BONUS_HP, ARENA } from '../core/config.js';
import { shuffled } from '../core/utils.js';
import { overlaps } from './collision.js';

// Separate shuffled grid cells guarantee bounded, distinct placements away from spawns.
export function spawnItems() {
  const cells=[];
  for (const x of [240,420,600,780,960]) for (const y of [260,370,550]) cells.push([x,y]);
  return shuffled(cells).slice(0,3).map(([x,y],index) => ({
    type:['attack','defense','heal'][index],
    x:Math.min(ARENA.right-ITEM_SIZE,x+Math.floor(Math.random()*33)-16),
    y:Math.min(ARENA.bottom-ITEM_SIZE-36,y+Math.floor(Math.random()*33)-16),
    width:ITEM_SIZE,height:ITEM_SIZE,active:true
  }));
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
