import { GAME_WIDTH, GAME_HEIGHT, ARENA, DIRECTIONS, DAMAGE_NUMBER_TIME } from './config.js';

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
    for (const effect of game.damageEffects) this.drawDamageNumber(effect);
    if (game.state === 'QUIZ' || game.state === 'STAGE_CLEAR') this.drawTeacher();
    if (game.restartNotice > 0) {
      ctx.fillStyle = '#121424e8'; ctx.fillRect(400,320,480,70);
      ctx.fillStyle = '#ffd34e'; ctx.font = `22px ${PIXEL_FONT}`; ctx.textAlign = 'center';
      ctx.fillText('두 플레이어 DOWN! 현재 스테이지 재시작',640,362);
    }
  }
  drawPlayer(player) {
    const ctx=this.ctx, x=Math.round(player.x), y=Math.round(player.y);
    ctx.textAlign='center';ctx.font=`16px ${PIXEL_FONT}`;
    if (!player.active) {
      ctx.strokeStyle='#fff9e5';ctx.lineWidth=3;ctx.strokeText(`P${player.id} DOWN`,x+20,y);
      ctx.fillStyle='#9c3844';ctx.fillText(`P${player.id} DOWN`,x+20,y);
      ctx.fillText(`${Math.ceil(player.respawnTime)}s`,x+20,y+24);return;
    }
    const blue=player.id===1, outline='#514139', hair=blue?'#735039':'#a96735';
    const outfit=blue?'#479dcc':'#efaa48', shade=blue?'#326b9b':'#bd7837';
    const stride=player.moving?(Math.floor(player.walkTime*8)%2?2:-2):0;
    const rect=(color,dx,dy,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x+dx,y+dy,w,h);};
    rect('#38452d55',-4,35,48,10);
    ctx.globalAlpha=player.invincibleTime>0&&Math.floor(player.invincibleTime*12)%2===0?.65:1;
    // Big head, tiny body; original two adventurers drawn on a 2px pixel grid.
    rect(shade,0,17,40,18);rect(outline,7,30,12,10);rect(outline,23,30,12,10);
    rect('#725441',9,32+stride,8,8);rect('#725441',25,32-stride,8,8);
    rect('#fff3d9',9,32+stride,8,3);rect('#fff3d9',25,32-stride,8,3);
    rect(outline,5,13,30,20);rect(outfit,7,14,26,16);
    rect('#fff2cd',16,17,8,6);rect('#f4ccad',0,18,7,9);rect('#f4ccad',33,18,7,9);
    rect(outline,-2,-14,44,31);rect(outline,2,-18,36,37);
    rect(hair,0,-14,40,29);rect('#ffe0ba',4,-7,32,24);rect('#f5c69f',2,1,4,11);rect('#f5c69f',34,1,4,11);
    // Fringe and rounded cheek silhouette.
    rect(hair,2,-12,36,8);rect(hair,4,-5,7,6);rect(hair,29,-5,7,6);
    rect('#fff7e3',10,-1,7,10);rect('#fff7e3',24,-1,7,10);
    const eyeShift=player.direction==='left'?-1:player.direction==='right'?1:0;
    rect('#413733',11+eyeShift,0,5,9);rect('#413733',25+eyeShift,0,5,9);
    rect('#ffffff',12+eyeShift,0,2,3);rect('#ffffff',26+eyeShift,0,2,3);
    rect('#efa197',6,9,6,3);rect('#efa197',29,9,6,3);
    rect('#ad715f',18,11,4,2);rect('#fff1d9',4,15,32,3);
    if(blue) {
      rect(outline,-2,-20,42,9);rect('#3b83b5',0,-22,38,10);rect('#77c5e4',6,-24,25,8);
      rect('#f7dc88',29,-20,6,6);rect('#ffedb8',31,-22,2,10);
      rect('#ddebfa',10,16,20,4);rect('#85c9e6',24,18,6,9);
    } else {
      rect(outline,0,-22,10,10);rect(outline,30,-22,10,10);
      rect('#eaaa4e',2,-22,6,8);rect('#eaaa4e',32,-22,6,8);
      rect('#f7c86f',2,-15,36,6);rect('#ffdf93',8,-18,24,6);
      rect('#fff4d7',12,18,16,5);rect('#c57c3d',18,24,4,3);
    }
    if(player.hurtTime>0) {ctx.strokeStyle='#e96b6f';ctx.lineWidth=3;ctx.strokeRect(x-5,y-26,50,68);}
    ctx.globalAlpha=1;
    const [dx,dy]=DIRECTIONS[player.direction];
    rect('#fff7d5',17+dx*24,12+dy*28,6,6);
    ctx.strokeStyle='#fff9e7';ctx.lineWidth=3;
    const label=`P${player.id} ${player.nickname}${player.attackMultiplier>1?' ×2':''}`;
    ctx.strokeText(label,x+20,y-33);ctx.fillStyle=blue?'#215981':'#7d4c1c';ctx.fillText(label,x+20,y-33);
    if(player.attackMultiplier>1) {ctx.strokeStyle='#ffe586';ctx.lineWidth=2;ctx.strokeRect(x-6,y-27,52,70);}
  }
  drawHealthBar(entity,x,y,width,height=10) {
    const ctx=this.ctx;
    ctx.fillStyle='#423541';ctx.fillRect(x-2,y-2,width+4,height+4);
    ctx.fillStyle='#746471';ctx.fillRect(x,y,width,height);
    ctx.fillStyle='#ffd679';ctx.fillRect(x,y,width*Math.max(0,entity.trailHp)/entity.maxHp,height);
    ctx.fillStyle=entity.isBoss?'#e57081':'#dd6578';ctx.fillRect(x,y,width*Math.max(0,entity.displayHp)/entity.maxHp,height);
    ctx.fillStyle='#ffffff66';ctx.fillRect(x,y,width*Math.max(0,entity.displayHp)/entity.maxHp,2);
    if(!entity.isBoss) {
      ctx.fillStyle='#423541';
      for(let i=1;i<entity.maxHp;i++)ctx.fillRect(x+width*i/entity.maxHp,y,1,height);
    }
  }
  drawDamageNumber(effect) {
    const ctx=this.ctx, progress=1-effect.time/DAMAGE_NUMBER_TIME;
    const y=Math.round(effect.y-progress*35);
    ctx.globalAlpha=Math.min(1,effect.time/.2);
    ctx.textAlign='center';ctx.font=`${effect.damage>1?26:22}px ${PIXEL_FONT}`;
    ctx.strokeStyle='#623744';ctx.lineWidth=4;ctx.strokeText(`-${effect.damage}`,effect.x,y);
    ctx.fillStyle=effect.isPlayer?'#ffb6b6':effect.damage>1?'#ffe18d':'#fff5cd';ctx.fillText(`-${effect.damage}`,effect.x,y);
    ctx.globalAlpha=1;
  }
  drawMonster(monster,accent) {
    const ctx = this.ctx, x = Math.round(monster.x), y = Math.round(monster.y);
    ctx.fillStyle = '#0b132380'; ctx.fillRect(x+4,y+monster.height-4,monster.width,10);
    ctx.fillStyle = monster.hitTime > 0 ? '#fff1a3' : accent; ctx.fillRect(x,y,monster.width,monster.height);
    ctx.fillStyle = '#171c2c'; ctx.fillRect(x+4,y+4,monster.width-8,monster.height-8);
    ctx.fillStyle = '#ffffff'; ctx.font = `18px ${PIXEL_FONT}`; ctx.textAlign = 'center'; ctx.fillText(monster.label,x+monster.width/2,y+28);
    ctx.fillStyle = accent; ctx.fillRect(x+22,y+40,8,6); ctx.fillRect(x+66,y+40,8,6);
    this.drawHealthBar(monster,x,y-16,monster.width,10);
  }
  drawItem(item) {
    const ctx=this.ctx, x=item.x, y=item.y;
    const rect=(color,dx,dy,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x+dx,y+dy,w,h);};
    rect('#463b3544',-2,30,36,8);
    let label;
    if(item.type==='attack') {
      // Upright sword: silver blade, gold crossguard, blue handle.
      rect('#59493e',12,-6,10,38);rect('#59493e',6,20,24,6);
      rect('#d5eced',14,-4,6,25);rect('#ffffff',14,-2,2,20);
      rect('#e4b453',6,20,24,4);rect('#fff0a0',8,20,20,2);
      rect('#3d7497',14,24,6,9);rect('#e4b453',12,32,10,4);
      label='공격 ×2';
    } else if(item.type==='defense') {
      // Blue shield: stepped pointed base and a white cross.
      rect('#475976',0,-2,32,25);rect('#475976',4,23,24,6);rect('#475976',10,29,12,5);
      rect('#78b9dc',3,1,26,21);rect('#78b9dc',7,22,18,5);rect('#78b9dc',12,27,8,3);
      rect('#c9edfa',4,2,4,17);rect('#fff2b4',13,5,6,19);rect('#fff2b4',7,11,18,6);
      label='하트 +1';
    } else {
      // Red potion bottle with a stopper, glass shine and healing cross.
      rect('#77563c',9,-5,14,5);rect('#514755',9,0,14,9);rect('#514755',3,8,26,25);
      rect('#e4ece8',11,0,10,9);rect('#e4ece8',5,10,22,21);
      rect('#eb6b78',7,16,18,13);rect('#faadb1',7,13,18,5);rect('#ffffff',7,11,3,8);
      rect('#fff6e4',13,17,5,11);rect('#fff6e4',10,20,11,5);
      label='체력 회복';
    }
    ctx.textAlign='center';ctx.font=`15px ${PIXEL_FONT}`;
    ctx.lineWidth=3;ctx.strokeStyle='#fff6de';ctx.strokeText(label,x+16,y+54);
    ctx.fillStyle='#334c49';ctx.fillText(label,x+16,y+54);
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
    this.drawHealthBar(boss,x-12,y-24,184,12);
    ctx.font=`18px ${PIXEL_FONT}`;ctx.fillStyle='#fff8d8';ctx.fillText(boss.phase==='WINDUP'?'돌진 준비! 옆으로 피하세요!':boss.label,x+80,y-40);
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
