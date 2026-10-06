import { MAX_MONSTERS } from '../core/config.js';
import { shuffled } from '../core/utils.js';
import { Monster } from '../entities/monster.js';
import { Boss } from '../entities/boss.js';
import { STAGES } from '../data/stages.js';
// Fixed perimeter spawns keep monsters away from both player respawn points.
const SPAWNS = [[120,190],[550,190],[1040,190],[1120,340],[1050,570],[120,570],[40,340]];
export class StageSystem {
  constructor() { this.index = 0; }
  get current() { return STAGES[this.index]; }
  get isLast() { return this.index === STAGES.length-1; }
  reset() { this.index = 0; }
  advance() { if (!this.isLast) this.index++; }
  spawnMonsters() {
    const stage = this.current;
    const labels = shuffled(stage.monsters);
    return shuffled(SPAWNS).slice(0, Math.min(stage.count, MAX_MONSTERS)).map(([x,y],i) => new Monster(labels[i%labels.length],x,y,stage.speed,stage.hp));
  }
  isComplete(monsters) { return monsters.length === 0; }
  spawnBoss() { return this.current.boss ? new Boss(this.current.boss) : null; }
}
