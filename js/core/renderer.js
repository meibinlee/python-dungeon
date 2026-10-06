import { GAME_WIDTH, GAME_HEIGHT, ARENA, DIRECTIONS } from './config.js';

const PIXEL_FONT = '"Galmuri11", monospace';

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
    const polygon = (color,points) => {
      ctx.fillStyle = color; ctx.beginPath();
      points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
      ctx.closePath(); ctx.fill();
    };
    // Original, static pixel scenery: no external assets or per-frame world decoration.
    if (stage.id !== 2) {
      ctx.fillStyle = stage.id === 4 ? '#f4dba0' : '#fff3c2';
      ctx.fillRect(1000,82,48,48); ctx.fillRect(992,90,64,32);
      for (let i=0;i<5;i++) {
        const x=80+i*260, y=90+(i%2)*28;
        ctx.fillStyle = stage.id === 4 ? '#aaa1ce' : '#ecf9ef';
        ctx.fillRect(x,y,96,16); ctx.fillRect(x+16,y-12,48,32);
      }
    }
    polygon(stage.id === 1 ? '#63aa92' : '#6f7197',[[0,180],[120,100],[260,155],[390,90],[550,170],[700,105],[900,150],[1100,90],[1280,180]]);
    ctx.fillStyle = stage.tileColor; ctx.fillRect(0,ARENA.top,GAME_WIDTH,GAME_HEIGHT-ARENA.top);
    ctx.fillStyle = stage.id === 1 ? '#a3d47d' : stage.id === 3 ? '#bfd29e' : '#a69dc1';
    ctx.fillRect(0,180,GAME_WIDTH,16);
    ctx.fillStyle = stage.id === 1 ? '#91c573' : stage.id === 3 ? '#b9c08e' : '#817d9e';
    ctx.fillRect(80,330,1120,240);
    // A warm path running through the meadow / dungeon courtyard.
    ctx.fillStyle = stage.id === 1 ? '#c4b88c' : '#c0b5ae';
    ctx.fillRect(580,180,120,508); ctx.fillRect(100,426,1080,60);
    for (let i=0;i<58;i++) {
      const x=100+(i*179)%1080, y=220+(i*97)%450;
      if (x>570 && x<710 || y>415 && y<500) continue;
      ctx.fillStyle = stage.id === 1 ? '#4f9258' : '#686788';
      ctx.fillRect(x,y,4,10); ctx.fillRect(x+6,y+4,4,6);
      if (i%4===0) { ctx.fillStyle=stage.accent;ctx.fillRect(x+2,y-2,6,6); }
    }
    for (const x of [12,1168]) {
      for (const y of [210,535]) {
        if (stage.id === 1) {
          ctx.fillStyle='#795537';ctx.fillRect(x+32,y+32,24,100);
          ctx.fillStyle='#347754';ctx.fillRect(x,y,96,72);ctx.fillRect(x+16,y-24,64,104);
          ctx.fillStyle='#52a16b';ctx.fillRect(x+16,y-12,56,36);
          ctx.fillStyle='#ece2b3';ctx.fillRect(x+64,y+115,16,20);
          ctx.fillStyle='#ed8d70';ctx.fillRect(x+52,y+104,40,16);ctx.fillRect(x+60,y+96,24,8);
        } else if (stage.id === 2) {
          polygon('#9ce1e7',[[x+30,y+20],[x+54,y-16],[x+78,y+20],[x+54,y+96]]);
          polygon('#65a8dc',[[x+6,y+54],[x+24,y+24],[x+42,y+54],[x+24,y+110]]);
          ctx.fillStyle='#b9fcf5';ctx.fillRect(x+48,y+10,8,42);
        } else {
          ctx.fillStyle=stage.id===3?'#e6d4bc':'#c3b4de';ctx.fillRect(x+16,y,64,132);
          ctx.fillStyle='#5b536d';ctx.fillRect(x+36,y+30,20,30);ctx.fillRect(x+36,y+86,20,28);
          polygon(stage.id===3?'#a35f72':'#695199',[[x+4,y],[x+48,y-44],[x+92,y]]);
          ctx.fillStyle=stage.accent;ctx.fillRect(x+36,y-55,8,16);
        }
      }
    }
    if (stage.id === 4) {
      for (let i=0;i<18;i++) {ctx.fillStyle='#ffe8b7';ctx.fillRect(25+i*73,76+(i%3)*25,4,4);}
    }
    // Perimeter stones make the actual movement boundary clear.
    ctx.fillStyle = stage.id===1 ? '#4b8052' : '#656283';
    for(let x=ARENA.left;x<ARENA.right;x+=32)ctx.fillRect(x,ARENA.bottom+8,28,12);
    this.background = background;
  }
  render(game) {
    const ctx = this.ctx;
    ctx.drawImage(this.background,0,0);
    const image = this.assets.get(game.stages.current.background);
    if (image) ctx.drawImage(image,0,0,GAME_WIDTH,GAME_HEIGHT);
    if (game.state === 'START' || game.state === 'READY') return;
    for (const item of game.items) this.drawItem(item);
    for (const monster of game.monsters) {
      if (monster.isBoss) this.drawBoss(monster);
      else this.drawMonster(monster,game.stages.current.accent);
    }
    for (const projectile of game.projectiles) {
      ctx.fillStyle = projectile.color; ctx.fillRect(Math.round(projectile.x),Math.round(projectile.y),projectile.width,projectile.height);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(projectile.x)+4,Math.round(projectile.y)+4,6,6);
    }
    for (const player of game.players) this.drawPlayer(player);
    if (game.state === 'QUIZ' || game.state === 'STAGE_CLEAR') this.drawTeacher();
    if (game.restartNotice > 0) {
      ctx.fillStyle = '#121424e8'; ctx.fillRect(400,320,480,70);
      ctx.fillStyle = '#ffd34e'; ctx.font = `22px ${PIXEL_FONT}`; ctx.textAlign = 'center';
      ctx.fillText('두 플레이어 DOWN! 현재 스테이지 재시작',640,362);
    }
  }
  drawPlayer(player) {
    const ctx = this.ctx, x = Math.round(player.x), y = Math.round(player.y);
    ctx.textAlign = 'center'; ctx.font = `16px ${PIXEL_FONT}`;
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
    ctx.fillStyle = player.attackMultiplier > 1 ? '#fff3a0' : player.color;
    ctx.fillText(`P${player.id}${player.attackMultiplier > 1 ? ' ×2' : ''}`,x+20,y-12);
    if (player.attackMultiplier > 1) { ctx.strokeStyle='#ffe586';ctx.lineWidth=3;ctx.strokeRect(x-5,y-5,50,50); }
  }
  drawMonster(monster,accent) {
    const ctx = this.ctx, x = Math.round(monster.x), y = Math.round(monster.y);
    ctx.fillStyle = '#0b132380'; ctx.fillRect(x+4,y+monster.height-4,monster.width,10);
    ctx.fillStyle = monster.hitTime > 0 ? '#fff1a3' : accent; ctx.fillRect(x,y,monster.width,monster.height);
    ctx.fillStyle = '#171c2c'; ctx.fillRect(x+4,y+4,monster.width-8,monster.height-8);
    ctx.fillStyle = '#ffffff'; ctx.font = `18px ${PIXEL_FONT}`; ctx.textAlign = 'center'; ctx.fillText(monster.label,x+monster.width/2,y+28);
    ctx.fillStyle = accent; ctx.fillRect(x+22,y+40,8,6); ctx.fillRect(x+66,y+40,8,6);
    ctx.fillStyle = '#596075'; ctx.fillRect(x,y-10,monster.width,4);
    ctx.fillStyle = '#ff93a5'; ctx.fillRect(x,y-10,monster.width*monster.hp/monster.maxHp,4);
  }
  drawItem(item) {
    const ctx=this.ctx, x=item.x, y=item.y;
    ctx.fillStyle='#6a4da0';ctx.fillRect(x-4,y+4,40,24);ctx.fillRect(x+4,y-4,24,40);
    ctx.fillStyle='#ffe68f';ctx.fillRect(x+8,y,16,32);ctx.fillRect(x,y+8,32,16);
    ctx.fillStyle='#fff9db';ctx.fillRect(x+12,y+4,8,16);
    ctx.textAlign='center';ctx.font=`16px ${PIXEL_FONT}`;ctx.fillStyle='#182b3b';ctx.fillText('ATK ×2',x+16,y+54);
  }
  drawBoss(boss) {
    const ctx=this.ctx, x=Math.round(boss.x), y=Math.round(boss.y);
    if(boss.phase==='WINDUP') {
      ctx.strokeStyle='#ffec8e';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(x+80,y+56);ctx.lineTo(x+80+boss.chargeX*220,y+56+boss.chargeY*220);ctx.stroke();
    }
    ctx.fillStyle='#333057';ctx.fillRect(x-8,y+100,176,20);
    ctx.fillStyle=boss.hitTime>0?'#fff5bb':boss.phase==='WINDUP'?'#ee927f':'#9e83ca';
    ctx.fillRect(x,y+16,160,96);ctx.fillRect(x+16,y,128,112);
    ctx.fillStyle='#efd6a4';ctx.fillRect(x+24,y-12,24,28);ctx.fillRect(x+112,y-12,24,28);ctx.fillRect(x+24,y+12,112,8);
    ctx.fillStyle='#302846';ctx.fillRect(x+20,y+32,120,64);
    ctx.fillStyle='#ffe79d';ctx.fillRect(x+40,y+44,20,12);ctx.fillRect(x+100,y+44,20,12);
    ctx.font=`26px ${PIXEL_FONT}`;ctx.textAlign='center';ctx.fillText('{ ∞ }',x+80,y+85);
    ctx.font=`18px ${PIXEL_FONT}`;ctx.fillStyle='#fff8d8';ctx.fillText(boss.phase==='WINDUP'?'돌진 준비! 옆으로 피하세요!':boss.label,x+80,y-28);
  }
  drawTeacher() {
    const ctx = this.ctx;
    ctx.fillStyle = '#e9c4a0'; ctx.fillRect(617,272,46,42);
    ctx.fillStyle = '#d8dbea'; ctx.fillRect(613,264,54,12);
    ctx.fillStyle = '#101725'; ctx.fillRect(621,284,16,8); ctx.fillRect(644,284,16,8);
    ctx.fillStyle = '#8e91eb'; ctx.fillRect(607,314,66,54);
    ctx.fillStyle = '#ffffff'; ctx.font = `20px ${PIXEL_FONT}`; ctx.textAlign = 'center'; ctx.fillText('명빈T',640,250);
  }
}
