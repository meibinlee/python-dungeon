import { GAME_WIDTH, GAME_HEIGHT, ARENA, DIRECTIONS, DAMAGE_NUMBER_TIME, CLASSES, ULTIMATE } from './config.js';

const PIXEL_FONT = '"Galmuri11", monospace';

export class Renderer {
  constructor(canvas, assets) {
    this.ctx = canvas.getContext('2d', { alpha:false });
    this.ctx.imageSmoothingEnabled = false;
    this.assets = assets;
    this.background = null;
    this.heroSprites = new Map();
    this.demonSprites = new Map();
  }
  prepareBackground(stage) {
    // Cache static floor artwork once per stage; active gameplay still uses one visible Canvas.
    const background = document.createElement('canvas');
    background.width = GAME_WIDTH/4; background.height = GAME_HEIGHT/4;
    const ctx = background.getContext('2d');
    ctx.scale(.25,.25);
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
    // Small raster tiles add texture without frame-time drawing or network assets.
    for (let i=0;i<500;i++) {
      const x=32+((i*71)%1180),y=196+((i*113)%476);
      ctx.fillStyle=i%3?'#ffffff12':'#192d3920';ctx.fillRect(Math.floor(x/4)*4,Math.floor(y/4)*4,8,4);
    }
    this.background = background;
  }
  render(game) {
    const ctx = this.ctx;
    ctx.drawImage(this.background,0,0,GAME_WIDTH,GAME_HEIGHT);
    const image = this.assets.get(game.stages.current.background);
    if (image) ctx.drawImage(image,0,0,GAME_WIDTH,GAME_HEIGHT);
    if (game.state === 'START' || game.state === 'READY') return;
    for (const item of game.items) this.drawItem(item);
    for (const monster of game.monsters) {
      if (monster.isBoss) this.drawBoss(monster);
      else this.drawMonster(monster,game.stages.current.accent);
    }
    for (const projectile of game.projectiles) this.drawAttack(projectile);
    for (const player of game.players) this.drawPlayer(player);
    for (const effect of game.explosions) {
      const size = ULTIMATE.radius*(1-effect.time/ULTIMATE.explosionTime);
      ctx.globalAlpha=effect.time/ULTIMATE.explosionTime;
      ctx.fillStyle='#ffb45c'; ctx.fillRect(effect.x-size,effect.y-size,size*2,size*2);
      ctx.fillStyle='#fff5bd'; ctx.fillRect(effect.x-size/2,effect.y-size/2,size,size);
      ctx.font=`28px ${PIXEL_FONT}`; ctx.textAlign='center'; ctx.fillText('펑!',effect.x,effect.y-20);
      ctx.globalAlpha=1;
    }
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
    const stride=player.moving ? (Math.floor(player.walkTime*8)%2 ? 2 : -2) : 0;
    ctx.fillStyle='#24382955';ctx.fillRect(x-4,y+36,48,8);
    ctx.globalAlpha=player.invincibleTime>0&&Math.floor(player.invincibleTime*12)%2===0?.65:1;
    ctx.drawImage(this.getHeroSprite(player.classType,player.id),x-12,y-32+stride,64,80);
    if(player.hurtTime>0) {ctx.fillStyle='#ff9a8c';ctx.fillRect(x-6,y-24,4,12);ctx.fillRect(x+42,y+10,4,12);}
    ctx.globalAlpha=1;
    const [dx,dy]=DIRECTIONS[player.direction];
    ctx.fillStyle='#fff7d5';ctx.fillRect(x+17+dx*24,y+12+dy*28,6,6);
    ctx.textAlign='center';ctx.font=`16px ${PIXEL_FONT}`;ctx.strokeStyle='#fff9e7';ctx.lineWidth=3;
    const label=`P${player.id} ${player.nickname}${player.attackMultiplier>1?' ×2':''}`;
    ctx.strokeText(label,x+20,y-38);ctx.fillStyle=player.id===1?'#215981':'#7d4c1c';ctx.fillText(label,x+20,y-38);
  }
  getHeroSprite(type,id) {
    const key=`${type}:${id}`;
    if(this.heroSprites.has(key)) return this.heroSprites.get(key);
    const sprite=document.createElement('canvas');sprite.width=32;sprite.height=40;
    const ctx=sprite.getContext('2d');
    const ink='#493b3d', white='#fffdf0', cream='#fff0b0', blue='#83bedb';
    const fur=type==='mage'?cream:white;
    const team=id===1?'#5ba9e0':'#e6b64c';
    const rect=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
    // Cached 32x40 pixel interpretation: Chiikawa / Hachiware / Usagi motifs.
    // Keep the face and ears visible; equipment identifies the gameplay ability.
    if(type==='mage') {
      rect(ink,9,0,5,16);rect(ink,19,0,5,16);
      rect(fur,10,1,3,15);rect(fur,20,1,3,15);
      rect('#eea9af',11,3,1,10);rect('#eea9af',21,3,1,10);
    } else if(type==='archer') {
      rect(ink,5,6,7,9);rect(ink,20,6,7,9);
      rect(blue,6,7,5,8);rect(blue,21,7,5,8);
      rect('#edb9bd',7,9,2,3);rect('#edb9bd',23,9,2,3);
    } else {
      rect(ink,6,7,6,7);rect(ink,20,7,6,7);
      rect(fur,7,8,4,6);rect(fur,21,8,4,6);
      rect('#f2c5c0',8,9,2,2);rect('#f2c5c0',22,9,2,2);
    }
    // Small body, stubby arms/feet, large soft stepped head.
    rect(ink,8,26,16,11);rect(fur,9,27,14,9);
    rect(ink,7,35,7,4);rect(ink,18,35,7,4);
    rect(fur,8,35,5,3);rect(fur,19,35,5,3);
    rect(ink,4,27,5,6);rect(fur,5,28,4,4);
    rect(ink,23,27,5,6);rect(fur,23,28,4,4);
    rect(ink,7,12,18,17);rect(ink,4,15,24,11);rect(ink,6,14,20,14);
    rect(fur,7,13,18,14);rect(fur,5,16,22,9);rect(fur,8,26,16,2);
    if(type==='archer') {
      rect(blue,7,13,18,4);rect(blue,5,16,7,3);rect(blue,20,16,7,3);
      rect(white,13,13,6,4);rect(white,11,17,10,3);
    }
    rect(ink,9,20,3,4);rect(ink,20,20,3,4);
    rect('#ffffff',9,20,1,1);rect('#ffffff',20,20,1,1);
    rect('#efb1bc',6,24,5,2);rect('#efb1bc',21,24,5,2);
    rect(ink,14,24,1,1);rect(ink,17,24,1,1);rect(ink,15,25,3,1);
    if(type==='mage') {
      rect(ink,15,26,3,2);rect('#e49b9e',16,26,1,1);
      rect(ink,9,17,4,1);rect(ink,19,17,4,1);
      // Short purple cape, stars, crystal staff; long ears stay uncovered.
      rect('#9b80bd',9,30,14,5);rect('#c8afe2',10,30,3,4);
      rect(team,14,30,4,2);rect('#ffe9a0',16,33,2,1);
      rect(ink,28,23,2,14);rect('#aa7b53',28,24,1,12);
      rect(ink,26,18,6,7);rect('#a78fe5',27,19,4,5);
      rect('#e6dcff',28,19,2,2);rect('#ffe9a0',27,25,4,1);
    } else if(type==='archer') {
      rect('#739a77',9,30,14,4);rect(team,14,30,4,2);
      rect('#ba8c51',9,34,14,1);
      rect('#8e6547',2,24,3,9);rect('#dfd4a7',2,22,1,5);rect('#dfd4a7',4,21,1,6);
      // Curved bow and bright string.
      rect(ink,29,24,2,10);rect('#c29151',29,25,1,8);
      rect('#c29151',28,23,1,2);rect('#c29151',28,33,1,2);
      rect('#c29151',27,22,1,2);rect('#c29151',27,34,1,2);
      rect('#fff1c0',27,24,1,10);
    } else {
      rect('#aabcc5',9,30,14,4);rect('#dce9ed',10,30,12,1);
      rect(team,14,31,4,2);rect('#d8b35e',9,34,14,1);
      // Silver sword and compact shield.
      rect(ink,28,19,3,17);rect('#d2e2e9',28,20,2,11);rect('#ffffff',28,20,1,8);
      rect('#dfb95a',26,31,6,2);rect('#8a644b',29,33,1,3);
      rect(ink,1,28,6,8);rect(team,2,29,4,5);rect('#ffec9d',3,30,2,3);
    }
    this.heroSprites.set(key,sprite);return sprite;
  }
  drawPreview(canvas,type,id) {
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,96,96);ctx.drawImage(this.getHeroSprite(type,id),16,4,64,80);
  }
  drawAttack(attack) {
    const ctx=this.ctx,x=Math.round(attack.x/4)*4,y=Math.round(attack.y/4)*4;
    const horizontal=attack.direction==='left'||attack.direction==='right';
    if (attack.ultimate) {
      const colors={warrior:'#ffe18d',archer:'#ff946d',mage:'#c7a2ff'};
      ctx.fillStyle=colors[attack.classType];ctx.fillRect(x,y,36,36);
      ctx.fillStyle='#fff5df';
      if(attack.classType==='warrior') {ctx.fillRect(x+14,y+2,8,30);ctx.fillRect(x+5,y+22,26,6);}
      else if(attack.classType==='archer') {ctx.fillRect(x+6,y+10,24,16);ctx.fillStyle='#67475a';ctx.fillRect(x+22,y+12,8,12);}
      else {ctx.fillRect(x+8,y+8,20,20);ctx.fillStyle='#8063cb';ctx.fillRect(x+14,y+14,8,8);}
      return;
    }
    if(attack.classType==='warrior') {
      ctx.fillStyle='#fff4bd';
      if(horizontal) {ctx.fillRect(x+20,y,12,attack.height);ctx.fillRect(x+36,y+8,8,attack.height-16);ctx.fillRect(x+48,y+20,8,attack.height-40);}
      else {ctx.fillRect(x,y+20,attack.width,12);ctx.fillRect(x+8,y+36,attack.width-16,8);ctx.fillRect(x+20,y+48,attack.width-40,8);}
      ctx.fillStyle='#d6e7ee';if(horizontal)ctx.fillRect(x+8,y+28,40,8);else ctx.fillRect(x+28,y+8,8,40);
    } else if(attack.classType==='archer') {
      ctx.fillStyle='#ad7e45';ctx.fillRect(x,y,horizontal?24:4,horizontal?4:24);
      ctx.fillStyle='#fff0c3';ctx.fillRect(x+(attack.direction==='right'?20:0),y+(attack.direction==='down'?20:0),8,8);
    } else {
      ctx.fillStyle='#6657b0';ctx.fillRect(x+4,y,12,20);ctx.fillRect(x,y+4,20,12);
      ctx.fillStyle='#b3d9ff';ctx.fillRect(x+4,y+4,12,12);ctx.fillStyle='#fff5df';ctx.fillRect(x+8,y+4,4,8);
    }
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
    ctx.strokeStyle='#623744';ctx.lineWidth=4;ctx.strokeText(`-${Number(effect.damage.toFixed(1))}`,effect.x,y);
    ctx.fillStyle=effect.isPlayer?'#ffb6b6':effect.damage>1?'#ffe18d':'#fff5cd';ctx.fillText(`-${Number(effect.damage.toFixed(1))}`,effect.x,y);
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
    if (boss.isDemon) {
      const pose=boss.hitTime>0?'HIT':boss.phase==='WINDUP'?'WINDUP':'IDLE';
      ctx.fillStyle='#33305755';ctx.fillRect(x-12,y+100,184,16);
      ctx.drawImage(this.getDemonSprite(pose),x-16,y-40,192,160);
      ctx.font=`14px ${PIXEL_FONT}`;ctx.textAlign='center';ctx.fillStyle='#6c5772';ctx.fillText('PYTHON',x+80,y+89);
    } else {
    ctx.fillStyle='#333057';ctx.fillRect(x-8,y+100,176,20);
    ctx.fillStyle=boss.hitTime>0?'#fff5bb':boss.phase==='WINDUP'?'#ee927f':boss.tint;
    ctx.fillRect(x,y+16,160,96);ctx.fillRect(x+16,y,128,112);
    ctx.fillStyle='#efd6a4';ctx.fillRect(x+24,y-12,24,28);ctx.fillRect(x+112,y-12,24,28);ctx.fillRect(x+24,y+12,112,8);
    ctx.fillStyle='#302846';ctx.fillRect(x+20,y+32,120,64);
    ctx.fillStyle='#ffe79d';ctx.fillRect(x+40,y+44,20,12);ctx.fillRect(x+100,y+44,20,12);
    ctx.font=`26px ${PIXEL_FONT}`;ctx.textAlign='center';ctx.fillText(boss.weakness==='warrior'?'[ ROOT ]':boss.weakness==='mage'?'[ + − ]':boss.weakness==='archer'?'[ IF ]':boss.isDemon?'PYTHON':'{ ∞ }',x+80,y+85);
    }
    this.drawHealthBar(boss,x-12,y-(boss.isDemon?52:24),184,12);
    ctx.font=`18px ${PIXEL_FONT}`;ctx.fillStyle='#fff8d8';ctx.fillText(boss.phase==='WINDUP'?'돌진 준비! 옆으로 피하세요!':boss.isDemon && boss.stationaryTime>0.5?'체력 회복 중! 궁극기로 공격!':boss.label,x+80,y-(boss.isDemon?68:40));
  }
  getDemonSprite(pose='IDLE') {
    if (this.demonSprites.has(pose)) return this.demonSprites.get(pose);
    const sprite=document.createElement('canvas');sprite.width=48;sprite.height=40;
    const ctx=sprite.getContext('2d');
    const rect=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
    const ink='#50372c',fur=pose==='HIT'?'#fff0ac':pose==='WINDUP'?'#ffe7dc':'#fffef2';
    const blush='#eea0b3',blushShade='#be6b82';
    // Match the supplied cross-stitch pixel references: single-pixel brown
    // contour, rounded stepped silhouette, diagonal eye glints, striped blush.
    // Green curled tail and one horn preserve the original monster motif.
    rect(ink,37,27,5,10);rect(ink,40,22,5,11);rect(ink,43,16,4,11);rect(ink,45,11,3,9);
    rect('#87a16e',38,28,3,8);rect('#87a16e',41,23,3,9);rect('#87a16e',44,17,2,8);rect('#87a16e',46,12,1,7);
    rect('#f6f3dd',39,29,2,5);rect('#f6f3dd',42,25,2,4);rect('#f6f3dd',45,19,1,3);
    // Rounded ears above a broad cheek silhouette.
    rect(ink,10,2,5,1);rect(ink,9,3,7,5);rect(fur,10,3,5,5);
    rect(ink,31,2,5,1);rect(ink,30,3,7,5);rect(fur,31,3,5,5);
    const headRows=[[7,15,31],[8,12,34],[9,10,36],[10,9,37],[11,8,38],
      [12,7,39],[13,6,40],[14,5,41],[15,5,41],[16,4,42],[17,4,42],
      [18,3,43],[19,4,42],[20,4,42],[21,3,43],[22,4,42],[23,4,42],
      [24,5,41],[25,5,41],[26,6,40],[27,7,39],[28,9,37],[29,12,34],[30,15,31]];
    for(const [y,left,right] of headRows) {
      rect(ink,left,y,right-left+1,1);
      if(y!==7&&y!==30)rect(fur,left+1,y,right-left-1,1);
    }
    // Soft orange tapered horn, not a square helmet.
    rect(ink,22,5,2,2);rect(ink,21,7,4,2);rect(ink,20,9,6,3);
    rect('#efc48a',22,7,2,2);rect('#efc48a',21,9,4,2);rect('#ffe1ae',22,9,1,2);
    // Small diagonal dark eyes and a two-pixel highlight, like the references.
    for(const eyeX of [12,29]) {
      rect(ink,eyeX+2,16,3,2);rect(ink,eyeX+1,18,5,2);
      rect(ink,eyeX,20,5,2);rect(ink,eyeX+1,22,2,1);
      rect('#ffffff',eyeX+3,18,2,2);rect('#ffffff',eyeX+1,20,1,1);
      rect(ink,eyeX+2,13,2,1);
    }
    rect(blush,7,22,7,3);rect(blush,33,22,7,3);
    for(const x of [8,11,34,37])rect(blushShade,x,22,1,3);
    rect(ink,21,23,1,1);rect(ink,25,23,1,1);rect(ink,22,24,3,1);
    rect(ink,22,25,3,3);rect('#e996a6',23,25,1,2);
    if(pose==='WINDUP') {rect(ink,12,14,5,1);rect(ink,29,14,5,1);}
    // Small round torso and tiny feet, with flat cream fill instead of shading.
    rect(ink,14,29,19,9);rect(fur,15,29,17,8);
    rect(ink,12,30,3,4);rect(fur,13,30,2,3);rect(ink,32,30,3,4);rect(fur,32,30,2,3);
    rect(ink,15,37,6,3);rect(ink,26,37,6,3);
    rect(fur,16,37,4,2);rect(fur,27,37,4,2);
    this.demonSprites.set(pose,sprite);return sprite;
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
