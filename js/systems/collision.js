export function overlaps(a,b) {
  return a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
}
export function checkCollisions(players,monsters,projectiles,onHit) {
  for (const projectile of projectiles) {
    if (!projectile.active) continue;
    for (const monster of monsters) {
      if (monster.active && overlaps(projectile,monster)) {
        const damage = monster.takeDamage(projectile.damage);
        if (damage) onHit?.(monster,damage,false,projectile.owner);
        projectile.active = false; break;
      }
    }
  }
  for (const monster of monsters) {
    if (!monster.active) continue;
    for (const player of players) if (player.active && overlaps(monster,player)) {
      const damage = player.takeDamage(monster.damage);
      if (damage) onHit?.(player,damage,true);
    }
  }
}
