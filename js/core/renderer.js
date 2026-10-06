import { GAME_WIDTH, GAME_HEIGHT, ARENA, DIRECTIONS, DAMAGE_NUMBER_TIME, CLASSES } from './config.js';

const PIXEL_FONT = '"Galmuri11", monospace';

export class Renderer {
  constructor(canvas, assets) {
    this.ctx = canvas.getContext('2d', { alpha:false });
    this.ctx.imageSmoothingEnabled = false;
    this.assets = assets;
    this.background = null;
    this.heroSprites = new Map();
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
    const ink='#433541',hair=id===1?'#76503d':'#975b36',hairLight=id===1?'#ad7950':'#cf975b';
    const cloth=id===1?'#5ba6c4':'#eab85f',shade=id===1?'#3b6489':'#ae7040';
    const skin='#ffdbb6',skinShade='#eeb18d';
    const rect=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
    // Original 32x40 sprite: layered hair, 1px contours, tiny equipment highlights.
    rect(shade,7,23,17,11);rect(ink,10,32,5,7);rect(ink,18,32,5,7);
    rect('#796050',11,34,3,4);rect('#796050',19,34,3,4);rect('#ead8b7',11,34,3,1);rect('#ead8b7',19,34,3,1);
    rect(ink,9,23,14,11);rect(cloth,10,24,12,8);rect(shade,10,30,12,3);
    rect('#fff0d2',12,24,8,2);rect('#d4aa64',15,29,3,2);
    rect(ink,5,25,5,7);rect(skin,6,26,3,5);rect(skinShade,6,30,3,1);
    rect(ink,23,25,5,7);rect(skin,24,26,3,5);rect(skinShade,24,30,3,1);
    rect(ink,7,6,18,18);rect(ink,5,9,22,12);rect(ink,9,4,14,22);
    rect(hair,8,6,16,18);rect(hair,6,10,20,10);rect(hairLight,9,5,13,3);
    rect(skinShade,9,12,14,12);rect(skin,8,11,16,10);rect(skin,10,20,12,4);
    rect('#ffeaca',9,12,14,5);rect(skinShade,7,16,2,4);rect(skinShade,24,16,2,4);
    // Swept fringe rather than a straight rectangular fringe.
    rect(hair,7,8,17,3);rect(hair,7,10,4,6);rect(hair,10,10,4,3);rect(hair,14,10,3,2);rect(hair,21,10,4,6);
    rect(hairLight,8,8,4,1);rect(hairLight,16,8,6,1);rect('#c59365',9,7,4,1);
    rect('#fff9e9',11,15,3,5);rect('#fff9e9',19,15,3,5);
    rect('#514343',12,15,2,4);rect('#514343',19,15,2,4);
    rect('#8d6a4b',12,18,2,1);rect('#8d6a4b',19,18,2,1);
    rect('#ffffff',12,15,1,1);rect('#ffffff',19,15,1,1);
    rect('#e79c8d',9,20,3,1);rect('#e79c8d',21,20,3,1);rect('#ac7160',16,22,2,1);
    if(type==='warrior') {
      // Open helmet, blue/gold armour, broad sword and buckler.
      rect(ink,7,5,18,4);rect('#8091a1',8,5,16,3);rect('#cbdce0',9,5,14,1);rect('#eaf4ea',10,6,5,1);
      rect('#667986',7,8,3,4);rect('#667986',22,8,3,4);rect('#dbe4db',8,8,1,3);
      rect(ink,15,2,3,3);rect(cloth,16,1,2,4);rect('#f5d989',17,1,1,2);
      rect('#8ba3b5',10,25,12,5);rect('#d4e3df',11,25,10,1);rect(cloth,14,27,5,3);
      rect('#d6ad62',10,31,12,1);rect('#fff0a6',15,31,2,1);
      rect(ink,28,17,3,18);rect('#baceda',28,17,2,12);rect('#f4fff7',28,18,1,10);
      rect('#d4a258',26,29,6,2);rect('#f7db83',27,29,4,1);rect('#79553f',29,31,1,4);
      rect(ink,2,26,5,9);rect('#688fae',3,27,3,6);rect('#e7c77c',4,28,1,4);
    } else if(type==='archer') {
      // Feather cap, forest tunic, quiver and a clearly curved bow.
      rect(ink,6,7,20,2);rect('#50765e',7,6,18,2);rect('#7ba078',9,5,14,2);rect('#a9bd8b',11,5,8,1);
      rect('#dcc18a',23,2,1,5);rect('#eee2aa',24,1,1,4);
      rect('#567c58',10,25,12,6);rect('#a2b984',11,25,3,4);rect(cloth,15,25,4,2);
      rect('#8b6547',10,30,12,2);rect('#eac977',16,30,2,1);
      rect('#74533e',4,21,3,8);rect('#e4d5a7',4,20,1,3);rect('#e4d5a7',6,19,1,4);
      rect(ink,28,24,2,9);rect('#cb9658',29,25,1,7);rect('#d7b379',28,23,1,2);rect('#d7b379',28,32,1,2);
      rect('#d7b379',27,22,1,2);rect('#d7b379',27,33,1,2);rect('#f5e1b3',27,24,1,9);
    } else {
      // Asymmetric pointed hat, layered robe and crystal-tipped staff.
      rect(ink,5,8,22,2);rect('#7e649d',6,8,20,1);rect('#6c538b',8,5,16,3);
      rect('#9c7bbb',10,3,12,3);rect('#a989c4',13,1,8,3);rect('#c5a5dc',18,0,4,2);
      rect('#b69ace',11,4,4,1);rect('#f0cd77',9,7,15,1);rect('#fff0a5',19,7,2,1);
      rect('#765b98',10,25,12,7);rect('#a68bc4',11,25,3,5);rect(cloth,15,26,3,4);
      rect('#765b98',9,31,14,3);rect('#bc9fce',10,33,12,1);rect('#e0c392',14,32,4,1);
      rect(ink,28,21,2,15);rect('#9a6b54',28,22,1,13);
      rect(ink,26,17,6,6);rect('#779cc3',27,17,4,6);rect('#bedef2',27,18,3,3);rect('#ffffff',28,18,1,2);rect('#ddbe72',27,23,4,1);
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
    ctx.fillStyle=boss.hitTime>0?'#fff5bb':boss.phase==='WINDUP'?'#ee927f':boss.tint;
    ctx.fillRect(x,y+16,160,96);ctx.fillRect(x+16,y,128,112);
    ctx.fillStyle='#efd6a4';ctx.fillRect(x+24,y-12,24,28);ctx.fillRect(x+112,y-12,24,28);ctx.fillRect(x+24,y+12,112,8);
    ctx.fillStyle='#302846';ctx.fillRect(x+20,y+32,120,64);
    ctx.fillStyle='#ffe79d';ctx.fillRect(x+40,y+44,20,12);ctx.fillRect(x+100,y+44,20,12);
    ctx.font=`26px ${PIXEL_FONT}`;ctx.textAlign='center';ctx.fillText(boss.weakness==='warrior'?'[ ROOT ]':boss.weakness==='mage'?'[ + − ]':boss.weakness==='archer'?'[ IF ]':'{ ∞ }',x+80,y+85);
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
