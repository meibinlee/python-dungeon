import { HEALTH_CHANGE_TIME, HEALTH_TRAIL_TIME } from './config.js';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const randomItem = items => items[Math.floor(Math.random() * items.length)];
// Visual values only; collision and DOWN always use the actual hp immediately.
export function updateHealthVisual(entity,dt) {
  const move = (value,target,speed) => value < target ? Math.min(target,value+speed*dt) : Math.max(target,value-speed*dt);
  const change = entity.healthStep || 1;
  entity.displayHp = move(entity.displayHp,entity.hp,change/HEALTH_CHANGE_TIME);
  entity.healthDelay = Math.max(0,entity.healthDelay-dt);
  if (entity.healthDelay === 0) entity.trailHp = move(entity.trailHp,entity.hp,change/HEALTH_TRAIL_TIME);
}
export function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
