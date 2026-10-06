import { GAME_WIDTH, GAME_HEIGHT, ARENA, DIRECTIONS } from './config.js';

export class Renderer {
  constructor(canvas, assets) {
    this.ctx = canvas.getContext('2d', { alpha:false });
    this.ctx.imageSmoothingEnabled = false;
    this.assets = assets;
    this.background = null;
  }
  prepareBackground(stage) {
    // Cache static floor artwork once per stage; active gameplay still uses one visible Canvas.
    const background = document.createElement('canvas');
    background.width = GAME_WIDTH; background.height = GAME_HEIGHT;
    const ctx = background.getContext('2d');
    ctx.fillStyle = stage.color; ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    for (let y = ARENA.top; y < ARENA.bottom; y += 48) {
      for (let x = ARENA.left; x < ARENA.right; x += 48) {
        ctx.fillStyle = ((x+y)/48 % 3 < 1) ? stage.tileColor : stage.color;
        ctx.fillRect(x+2,y+2,44,44);
      }
    }
    ctx.strokeStyle = stage.accent; ctx.lineWidth = 4;
    ctx.strokeRect(ARENA.left-8,ARENA.top-8,ARENA.right-ARENA.left+16,ARENA.bottom-ARENA.top+16);
    ctx.fillStyle = stage.accent;
    for (const x of [40,1208]) for (const y of [112,632]) {
      ctx.fillRect(x,y,24,32); ctx.fillRect(x+8,y-8,8,48);
    }
    this.background = background;
  }
  render(game) {
    const ctx = this.ctx;
    ctx.drawImage(this.background,0,0);
    const image = this.assets.get(game.stages.current.background);
    if (image) ctx.drawImage(image,0,0,GAME_WIDTH,GAME_HEIGHT);
    if (game.state === 'START' || game.state === 'READY') return;
    for (const monster of game.monsters) this.drawMonster(monster,game.stages.current.accent);
    for (const projectile of game.projectiles) {
      ctx.fillStyle = projectile.color; ctx.fillRect(Math.round(projectile.x),Math.round(projectile.y),projectile.width,projectile.height);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(projectile.x)+4,Math.round(projectile.y)+4,6,6);
    }
    for (const player of game.players) this.drawPlayer(player);
    if (game.state === 'QUIZ' || game.state === 'STAGE_CLEAR') this.drawTeacher();
    if (game.restartNotice > 0) {
      ctx.fillStyle = '#121424e8'; ctx.fillRect(400,320,480,70);
      ctx.fillStyle = '#ffd34e'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
      ctx.fillText('두 플레이어 DOWN! 현재 스테이지 재시작',640,362);
    }
  }
  drawPlayer(player) {
    const ctx = this.ctx, x = Math.round(player.x), y = Math.round(player.y);
    ctx.textAlign = 'center'; ctx.font = 'bold 16px monospace';
    if (!player.active) {
      ctx.fillStyle = '#ff93a5'; ctx.fillText(`P${player.id} DOWN`,x+20,y);
      ctx.fillStyle = '#f2f1ff'; ctx.fillText(`${Math.ceil(player.respawnTime)}s`,x+20,y+24); return;
    }
    if (player.invincibleTime > 0 && Math.floor(player.invincibleTime*12)%2 === 0) return;
    ctx.fillStyle = '#0b132380'; ctx.fillRect(x-4,y+34,48,12);
    ctx.fillStyle = player.color; ctx.fillRect(x+6,y,28,10); ctx.fillRect(x+2,y+18,36,16);
    ctx.fillStyle = '#f4d5ae'; ctx.fillRect(x+8,y+8,24,14);
    ctx.fillStyle = '#131b30'; ctx.fillRect(x+12,y+12,4,4); ctx.fillRect(x+24,y+12,4,4);
    ctx.fillStyle = '#dce6ff'; ctx.fillRect(x+6,y+34,10,6); ctx.fillRect(x+24,y+34,10,6);
    const [dx,dy] = DIRECTIONS[player.direction];
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x+17+dx*22,y+18+dy*22,6,6);
    ctx.fillStyle = player.color; ctx.fillText(`P${player.id}`,x+20,y-12);
  }
  drawMonster(monster,accent) {
    const ctx = this.ctx, x = Math.round(monster.x), y = Math.round(monster.y);
    ctx.fillStyle = '#0b132380'; ctx.fillRect(x+4,y+monster.height-4,monster.width,10);
    ctx.fillStyle = monster.hitTime > 0 ? '#fff1a3' : accent; ctx.fillRect(x,y,monster.width,monster.height);
    ctx.fillStyle = '#171c2c'; ctx.fillRect(x+4,y+4,monster.width-8,monster.height-8);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.fillText(monster.label,x+monster.width/2,y+28);
    ctx.fillStyle = accent; ctx.fillRect(x+22,y+40,8,6); ctx.fillRect(x+66,y+40,8,6);
    ctx.fillStyle = '#596075'; ctx.fillRect(x,y-10,monster.width,4);
    ctx.fillStyle = '#ff93a5'; ctx.fillRect(x,y-10,monster.width*monster.hp/monster.maxHp,4);
  }
  drawTeacher() {
    const ctx = this.ctx;
    ctx.fillStyle = '#e9c4a0'; ctx.fillRect(617,272,46,42);
    ctx.fillStyle = '#d8dbea'; ctx.fillRect(613,264,54,12);
    ctx.fillStyle = '#101725'; ctx.fillRect(621,284,16,8); ctx.fillRect(644,284,16,8);
    ctx.fillStyle = '#8e91eb'; ctx.fillRect(607,314,66,54);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center'; ctx.fillText('명빈T',640,250);
  }
}
