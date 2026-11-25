const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const windowEvents = new Map(), documentEvents = new Map();
let scheduled = [], hudWrites = 0;
class Element {
  constructor(id='') { this.id=id; this.children=[]; this.hidden=false; this.disabled=false; this.listeners={}; this.value=''; this.className=''; this.classes=new Set(); this.classList={add:name=>this.classes.add(name),toggle:(name,force)=>force?this.classes.add(name):this.classes.delete(name),contains:name=>this.classes.has(name)}; this.style={}; }
  set textContent(value) { this.value=value; if (/hp|stage-number|stage-name/.test(this.id)) hudWrites++; }
  get textContent() { return this.children.length ? this.children.map(child => child.textContent).join('') : this.value; }
  addEventListener(type,callback) { this.listeners[type]=callback; }
  append(...elements) { this.children.push(...elements); }
  replaceChildren(...elements) { this.children=[...elements]; }
  focus() { }
  setAttribute(name,value) { this[name]=value; }
  click() { if (!this.disabled) this.listeners.click?.(); }
  getContext() { return new Proxy({}, {get:(_,key)=>()=>{},set:()=>true}); }
}
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const elements = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(match=>[match[1],new Element(match[1])]));
const doc = { hidden:false, readyState:'complete', getElementById:id=>elements[id], createElement:()=>new Element(), addEventListener:(event,callback)=>documentEvents.set(event,callback) };
const context = vm.createContext({ console, Set, Map, Math, Promise, document:doc, window:{addEventListener:(event,callback)=>windowEvents.set(event,callback)}, requestAnimationFrame:callback=>scheduled.push(callback), Image: class { set src(value) { this.onerror(); } } });
async function moduleAt(file) {
  file=path.resolve(file);
  if(cache.has(file)) return cache.get(file);
  const module=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});
  cache.set(file,module);
  await module.link((specifier,ref)=>moduleAt(path.resolve(path.dirname(ref.identifier),specifier.split('?')[0])));
  return module;
}
async function load(relative) { const module=await moduleAt(path.join(root,relative)); if(module.status!=='evaluated') await module.evaluate(); return module.namespace; }
let checks=0;
function check(name, fn) { fn(); checks++; console.log('PASS '+name); }
async function checkAsync(name, fn) { await fn(); checks++; console.log('PASS '+name); }
function key(code,down=true,extra={}) { let prevented=false; windowEvents.get(down?'keydown':'keyup')({code,preventDefault:()=>prevented=true,...extra}); return prevented; }
(async()=>{
 const {Input}=await load('js/core/input.js');
 const {Player}=await load('js/entities/player.js');
 const {Monster}=await load('js/entities/monster.js');
 const {Projectile}=await load('js/entities/projectile.js');
 const {Game}=await load('js/core/game.js');
 const {Renderer}=await load('js/core/renderer.js');
 const {Assets}=await load('js/core/assets.js');
 const {QuizSystem,validateQuestions,presentQuestion}=await load('js/systems/quiz.js');
 const {QUESTIONS}=await load('js/data/questions.js');
 const config=await load('js/core/config.js');
 const {checkCollisions}=await load('js/systems/collision.js');
 const input=new Input();
 const renderer=new Renderer(elements.game,new Assets());
 let quiz, hudCount=0, results=[];
 const game=new Game(input,renderer,{onState:()=>{},onHud:()=>hudCount++,onTeacherQuiz:stage=>quiz.startStage(stage),onFinalQuiz:()=>quiz.startFinal(),onResult:(final,last)=>results.push([final,last])});
 quiz=new QuizSystem(final=>game.finishQuiz(final));
 check('all 12 questions valid, unique IDs, 3 per stage',()=>{
   assert.equal(QUESTIONS.length,12); assert.equal(new Set(QUESTIONS.map(q=>q.id)).size,12);
   for(const q of QUESTIONS) {assert.equal(q.choices.length,4);assert.ok(q.answer>=0&&q.answer<=3);}
   for(let stage=1;stage<=4;stage++)assert.equal(QUESTIONS.filter(q=>q.stage===stage).length,3);
 });
 game.startGame();
 game.monsters.forEach(m=>m.speed=0);
 check('simultaneous W + ArrowRight, A + ArrowUp',()=>{
   const [p1,p2]=game.players; let x2=p2.x,y1=p1.y;
   assert.ok(key('KeyW')); key('ArrowRight'); game.update(.05);
   assert.ok(p1.y<y1);assert.ok(p2.x>x2); input.clear();
   const x1=p1.x,y2=p2.y; key('KeyA');key('ArrowUp');game.update(.05);
   assert.ok(p1.x<x1);assert.ok(p2.y<y2);input.clear();
 });
 check('simultaneous F + L and 300ms cooldown',()=>{
   key('KeyF');key('KeyL');game.update(.05); assert.equal(game.projectiles.length,2);
   game.update(.05);assert.equal(game.projectiles.length,2);
   assert.equal(game.projectiles[0].owner,1);assert.equal(game.projectiles[1].owner,2);
   input.clear();
 });
 check('all four movement and projectile directions',()=>{
   const player=game.players[0];
   for(const direction of ['up','down','left','right']) {
     const before={x:player.x,y:player.y};key(player.keys[direction]);player.update(.05,input);input.clear();assert.equal(player.direction,direction);
     const [dx,dy]=config.DIRECTIONS[direction];assert.equal(Math.sign(player.x-before.x),dx);assert.equal(Math.sign(player.y-before.y),dy);
     player.attackCooldown=0;const shot=player.attack();assert.equal(shot.velocityX,dx*config.CLASSES[player.classType].speed);assert.equal(shot.velocityY,dy*config.CLASSES[player.classType].speed);
   }
 });
 check('nearest living player monster AI',()=>{
   const m=new Monster('test',480,200,60,2);const p1=game.players[0],p2=game.players[1];p1.x=480;p1.y=300;p2.x=1000;p2.y=500;
   m.update(.05,game.players);assert.ok(m.y>200);p1.active=false;const x=m.x;m.update(.05,game.players);assert.ok(m.x>x);p1.reset();p2.reset();
 });
 check('AABB projectile damage and dead monster cleanup',()=>{
   game.projectiles=[];const m=new Monster('test',500,300,0,1);game.monsters=[m];
   const p=new Projectile(game.players[0]);p.x=510;p.y=310;p.velocityX=0;p.velocityY=0;game.projectiles=[p];game.update(.01);
   assert.equal(m.hp,0);assert.equal(game.monsters.length,1);assert.equal(game.projectiles.length,0);assert.equal(game.battlePhase,'BOSS');game.monsters[0].takeDamage(1000);game.update(0);assert.equal(game.state,'QUIZ');
 });
 check('quiz freezes movement and damage; non-game shortcuts allowed',()=>{
   const p=game.players[0];const {x,y,hp}=p;assert.equal(key('KeyW'),false);game.update(1);assert.equal(p.x,x);assert.equal(p.y,y);assert.equal(p.hp,hp);
 });
 check('wrong stage answer chooses a different same-stage question',()=>{
   const old=quiz.question;quiz.checkAnswer((old.answer+1)%4);assert.match(elements['quiz-feedback'].textContent,/WRONG/);quiz.continueQuiz();assert.notEqual(quiz.question.id,old.id);assert.equal(quiz.question.stage,old.stage);
 });
 game.startGame();game.monsters.forEach(m=>m.speed=0);
 check('contact damage once per invincibility window',()=>{
   const p=game.players[0];p.invincibleTime=0;const m=new Monster('touch',p.x,p.y,0,100);game.monsters=[m];
   game.update(.01);assert.equal(p.hp,2);for(let i=0;i<10;i++)game.update(.05);assert.equal(p.hp,2);
 });
 check('DOWN, 3-second respawn, other player keeps playing',()=>{
   const p=game.players[0];p.invincibleTime=0;p.takeDamage(2);assert.equal(p.active,false);assert.equal(game.players[1].active,true);
   game.monsters=[new Monster('safe',100,120,0,100)];for(let i=0;i<59;i++)game.update(.05);assert.equal(p.active,false);
   for(let i=0;i<2;i++)game.update(.05);assert.equal(p.active,true);assert.equal(p.hp,3);assert.ok(p.invincibleTime>0);
 });
 check('both DOWN restarts only current stage',()=>{
   game.stages.index=2;game.startStage();for(const p of game.players){p.invincibleTime=0;p.takeDamage(3);}game.update(.01);
   assert.equal(game.stages.current.id,3);assert.ok(game.players.every(p=>p.active&&p.hp===3));assert.equal(game.monsters.length,7);
 });
 check('projectile lifetime/bounds cleanup and count cap over 20 seconds',()=>{
   game.startGame();game.monsters=[new Monster('safe',32,104,0,100)];for(const p of game.players){p.direction='down';p.invincibleTime=100;}
   key('KeyF');key('KeyL');for(let i=0;i<400;i++){game.update(.05);assert.ok(game.projectiles.length<=20);}input.clear();
   for(let i=0;i<40;i++)game.update(.05);assert.equal(game.projectiles.length,0);
 });
 check('blur clears input and browser shortcuts remain usable',()=>{
   key('KeyW');assert.ok(input.keys.size);windowEvents.get('blur')();assert.equal(input.keys.size,0);assert.equal(key('KeyL',true,{ctrlKey:true}),false);assert.equal(key('KeyR'),false);
 });
 check('HUD unchanged during stable frames',()=>{
   const before=hudCount;for(let i=0;i<30;i++)game.update(.01);assert.equal(hudCount,before);
 });
 check('four stages -> teacher quiz -> correct -> final -> CLEAR -> replay',()=>{
   game.startGame();
   for(let stage=1;stage<=4;stage++){
     assert.equal(game.stages.current.id,stage);assert.ok(game.monsters.length>=4&&game.monsters.length<=7);
     game.monsters=[];game.update(.01);
     if(game.stages.current.boss){assert.equal(game.state,'PLAYING');assert.equal(game.battlePhase,'BOSS');assert.equal(game.monsters.length,1);const boss=game.monsters[0];boss.hp=1;const shot=new Projectile(game.players[0]);shot.x=boss.x+20;shot.y=boss.y+20;shot.velocityX=0;shot.velocityY=0;game.projectiles=[shot];game.update(.01);}
     assert.equal(game.state,'QUIZ');assert.equal(quiz.question.stage,stage);
     quiz.checkAnswer(quiz.question.answer);quiz.continueQuiz();assert.equal(game.state,'STAGE_CLEAR');game.continueAfterStage();
   }
   assert.ok(quiz.final);assert.equal(game.state,'QUIZ');assert.equal(new Set(quiz.queue.map(q=>q.id)).size,3);
   const old=quiz.question.id;quiz.checkAnswer((quiz.question.answer+1)%4);quiz.continueQuiz();assert.notEqual(quiz.question.id,old);assert.equal(new Set(quiz.queue.map(q=>q.id)).size,3);
   const solved=[];
   for(let i=0;i<3;i++){solved.push(quiz.question.id);quiz.checkAnswer(quiz.question.answer);quiz.continueQuiz();}
   assert.equal(new Set(solved).size,3);assert.equal(game.state,'FINAL_READY');game.beginFinalBattle();assert.equal(game.state,'PLAYING');assert.equal(game.battlePhase,'DEMON');game.monsters[0].takeDamage(999);game.update(0);assert.equal(game.state,'GAME_CLEAR');assert.equal(quiz.solved.size,3);game.startGame();assert.equal(game.stages.current.id,1);assert.equal(game.state,'PLAYING');
 });
 check('render all stages, DOWN, teacher, game clear without runtime exceptions',()=>{
   for(let stage=0;stage<4;stage++){game.stages.index=stage;game.startStage();renderer.render(game);game.players[0].active=false;renderer.render(game);game.state='QUIZ';renderer.render(game);}
 });
 check('one animation chain and delta-time clamped after tab return',()=>{
   assert.equal(scheduled.length,1);game.startGame();const frame=scheduled.shift();frame(1000);assert.equal(scheduled.length,1);
   const p=game.players[0];key('KeyW');const y=p.y;scheduled.shift()(100000);assert.ok(y-p.y<=config.PLAYER_SPEED*config.MAX_DELTA_TIME+.001);assert.equal(scheduled.length,1);input.clear();
   doc.hidden=true;const before=p.y;key('KeyW');scheduled.shift()(100100);assert.equal(p.y,before);doc.hidden=false;
 });
 const assets=new Assets();const result=await assets.load('missing','missing.png');assert.equal(result,null);assert.equal(await assets.load('missing','missing.png'),null);
 check('missing decorative image resolves safely with cache',()=>assert.equal(result,null));

 check('title -> instructions -> battle; menus block combat',()=>{
   game.returnToStart();assert.equal(game.state,'START');assert.equal(key('Escape'),false);
   game.showInstructions();assert.equal(game.state,'READY');assert.equal(key('KeyF'),false);game.update(10);assert.equal(game.monsters.length,0);
   game.returnToStart();assert.equal(game.state,'START');game.showInstructions();game.startGame();assert.equal(game.state,'PLAYING');
 });
 check('Esc pause freezes entities, damage/cooldown, lifetime, DOWN and respawn',()=>{
   game.monsters.forEach(m=>m.speed=0);game.players[0].invincibleTime=0;game.players[0].takeDamage(3);
   key('KeyL');game.update(.05);assert.ok(game.projectiles.length);assert.ok(key('Escape'));assert.equal(game.state,'PAUSED');assert.equal(input.keys.size,0);
   const snapshot=JSON.stringify([game.players,game.monsters,game.projectiles,game.items]);for(let i=0;i<100;i++)game.update(.05);assert.equal(JSON.stringify([game.players,game.monsters,game.projectiles,game.items]),snapshot);
   key('Escape',true,{repeat:true});assert.equal(game.state,'PAUSED');assert.equal(key('KeyL'),false);
   key('Escape');assert.equal(game.state,'PLAYING');assert.equal(input.keys.size,0);const count=game.projectiles.length;game.update(.01);assert.equal(game.projectiles.length,count);
 });
 check('blur/hidden tab auto-pause, returning tab does not auto-resume',()=>{
   windowEvents.get('blur')();assert.equal(game.state,'PAUSED');game.resumeGame();doc.hidden=true;documentEvents.get('visibilitychange')();assert.equal(game.state,'PAUSED');doc.hidden=false;documentEvents.get('visibilitychange')();assert.equal(game.state,'PAUSED');game.resumeGame();
 });
 check('Esc cannot skip quiz or interfere with browser shortcuts',()=>{
   game.monsters=[];game.update(.01);game.monsters[0].takeDamage(1000);game.update(0);assert.equal(game.state,'QUIZ');assert.equal(key('Escape'),false);game.resumeGame();assert.equal(game.state,'QUIZ');game.startGame();assert.equal(key('Escape',true,{ctrlKey:true}),false);assert.equal(game.state,'PLAYING');
 });
 check('paused/menu frames do not redraw static Canvas; resume retains one loop',()=>{
   let renders=0;const render=renderer.render.bind(renderer);renderer.render=g=>{renders++;render(g);};
   game.pauseGame();scheduled.shift()(101000);const before=renders;scheduled.shift()(101016);scheduled.shift()(101032);assert.equal(renders,before);assert.equal(scheduled.length,1);
   game.resumeGame();scheduled.shift()(101048);assert.equal(renders,before+1);assert.equal(scheduled.length,1);
 });
 check('all choice callbacks grade correct indexes and show explanations',()=>{
   quiz.final=false;
   for(const q of QUESTIONS){quiz.stage=q.stage;quiz.showQuestion(q);const shown=quiz.question;assert.equal(shown.id,q.id);const buttons=elements['quiz-choices'].children;for(let i=0;i<4;i++){assert.equal(buttons[i].children[0].textContent,['①','②','③','④'][i]);assert.equal(buttons[i].children[1].textContent,shown.choices[i]);}buttons[shown.answer].click();assert.equal(quiz.correct,true);assert.match(elements['quiz-feedback'].textContent,/CORRECT/);assert.ok(elements['quiz-feedback'].textContent.includes(shown.explanation));}
 });
 check('reported score=3 then +2 grades value 5; ④ and value are separate spans',()=>{
   const q={id:'legacy-score',stage:1,question:'score?',code:'score = 3\nscore = score + 2\nprint(score)',choices:['3','2','32','5'],answer:3};
   quiz.showQuestion(q);const buttons=elements['quiz-choices'].children;const index=quiz.question.answer;const right=buttons[index];assert.equal(right.children[0].textContent,['①','②','③','④'][index]);assert.equal(right.children[1].textContent,'5');right.click();assert.equal(quiz.correct,true);assert.ok(!right.textContent.includes('4.5'));
 });
 check('invalid quiz data rejected: indexes, IDs, duplicates, missing stages',()=>{
   validateQuestions(QUESTIONS);
   for(const changes of [{answer:4},{answer:1.5},{choices:['x','x','y','z']},{stage:99},{id:QUESTIONS[1].id}]){const bad=QUESTIONS.map(q=>({...q}));Object.assign(bad[0],changes);assert.throws(()=>validateQuestions(bad));}
   assert.throws(()=>validateQuestions(QUESTIONS.filter(q=>q.stage!==4)));
 });

 check('one random sword boosts only its collector',()=>{
   game.startGame();game.monsters.forEach(m=>m.speed=0);const [p1,p2]=game.players;const sword=game.items.find(i=>i.type==='attack');p1.x=sword.x;p1.y=sword.y;game.update(0);assert.equal(p1.attackMultiplier,2);assert.equal(new Projectile(p1).damage,2);assert.equal(p2.attackMultiplier,1);assert.equal(game.items.filter(i=>i.type==='attack').length,0);
 });
 check('DOWN cannot pick up; respawn keeps power; new/restarted stages reset it',()=>{
   game.startGame();const p=game.players[0],crystal=game.items[0];p.x=crystal.x;p.y=crystal.y;p.invincibleTime=0;p.takeDamage(3);game.update(0);assert.equal(game.items.length,3);assert.equal(p.attackMultiplier,1);
   p.reset();p.x=crystal.x;p.y=crystal.y;game.update(0);assert.equal(p.attackMultiplier,2);p.invincibleTime=0;p.takeDamage(3);p.update(3.1,input);assert.equal(p.active,true);assert.equal(p.attackMultiplier,2);
   game.restartStage();assert.ok(game.players.every(player=>player.attackMultiplier===1));assert.equal(game.items.length,3);
 });
 check('stage 4 mobs -> one boss -> teacher; no early quiz or duplicate boss',()=>{
   game.stages.index=3;game.startStage();game.monsters=[];game.update(0);assert.equal(game.battlePhase,'BOSS');assert.equal(game.state,'PLAYING');const boss=game.monsters[0];assert.ok(boss.isBoss);assert.equal(boss.hp,80);game.update(0);assert.equal(game.monsters[0],boss);
   boss.takeDamage(boss.hp);game.update(0);assert.equal(game.state,'QUIZ');
 });
 check('boss windup telegraphs, charges, recovers; pause stops pattern timer',()=>{
   game.stages.index=3;game.startStage();game.monsters=[];game.update(0);const boss=game.monsters[0];boss.timer=.01;boss.update(.02,game.players);assert.equal(boss.phase,'WINDUP');const x=boss.x,y=boss.y;boss.update(.1,game.players);assert.equal(boss.x,x);assert.equal(boss.y,y);
   game.pauseGame();const timer=boss.timer;game.update(2);assert.equal(boss.timer,timer);game.resumeGame();boss.update(.8,game.players);assert.equal(boss.phase,'CHARGE');boss.update(.1,game.players);assert.ok(boss.x!==x||boss.y!==y);boss.update(.7,game.players);assert.equal(boss.phase,'CHASE');
 });
 check('boss needs 80 normal hits versus 40 powered hits; both modes winnable',()=>{
   const definition=game.stages.current.boss;const {Boss}=cache.get(path.join(root,'js/entities/boss.js')).namespace;
   for(const multiplier of [1,2]){const boss=new Boss(definition);let hits=0;while(boss.active){const p=game.players[0];p.attackMultiplier=multiplier;const shot=new Projectile(p);shot.x=boss.x+20;shot.y=boss.y+20;checkCollisions([], [boss], [shot]);hits++;assert.ok(hits<=definition.hp);}assert.equal(hits,definition.hp/multiplier);}
   game.returnToStart();assert.equal(game.items.length,0);assert.ok(game.players.every(p=>p.attackMultiplier===1));
 });
 check('quiz seen-history avoids repeats until exhausted and final prefers unseen',()=>{
   quiz.resetRun();quiz.startStage(1);const ids=[];for(let i=0;i<3;i++){ids.push(quiz.question.id);quiz.checkAnswer((quiz.question.answer+1)%4);quiz.continueQuiz();}assert.equal(new Set(ids).size,3);const prior=new Set(quiz.seen);quiz.startFinal();assert.equal(new Set(quiz.queue.map(q=>q.id)).size,3);assert.ok(quiz.queue.every(q=>!prior.has(q.id)));quiz.resetRun();assert.equal(quiz.seen.size,0);
 });
 check('questions change numbers/names and choice order each time; answers stay correct',()=>{
   for(const q of QUESTIONS){
     const codes=new Set(),answerSlots=new Set();
     for(let i=0;i<60;i++){const v=presentQuestion(q);assert.equal(v.id,q.id);assert.equal(v.stage,q.stage);assert.equal(v.choices.length,4);assert.equal(new Set(v.choices).size,4);assert.ok(v.answer>=0&&v.answer<=3);codes.add(v.code+'|'+v.question);answerSlots.add(v.answer);}
     assert.ok(codes.size>=3,`${q.id} should vary`);assert.ok(answerSlots.size>=3,`${q.id} answer position should move`);
   }
   const plain={...QUESTIONS[0]};delete plain.vary;const slots=new Set();for(let i=0;i<60;i++){const v=presentQuestion(plain);assert.equal(v.choices[v.answer],plain.choices[plain.answer]);slots.add(v.answer);}assert.ok(slots.size>=3);
   const broken={...QUESTIONS[1],vary:()=>({choices:['1','1','1','1'],answer:0})};const v=presentQuestion(broken);assert.equal(v.choices[v.answer],QUESTIONS[1].choices[QUESTIONS[1].answer]);
 });
 check('runtime rejects same question content under a new ID',()=>{
   const copy=QUESTIONS.map(q=>({...q}));copy.push({...copy[0],id:'new-id-same-question'});assert.throws(()=>validateQuestions(copy),/중복/);
 });

 check('enemy HP applies instantly, visible bar shrinks gradually with delayed trail',()=>{
   const m=new Monster('test',120,190,0,4);assert.equal(m.takeDamage(1),1);assert.equal(m.hp,3);assert.equal(m.displayHp,4);assert.equal(m.trailHp,4);
   m.update(.05,[]);assert.ok(m.displayHp>3&&m.displayHp<4);assert.equal(m.trailHp,4);
   for(let i=0;i<24;i++)m.update(.05,[]);assert.equal(m.displayHp,3);assert.equal(m.trailHp,3);
   assert.equal(m.takeDamage(10),3);assert.equal(m.hp,0);assert.equal(m.active,false);
 });
 check('boss small damage also animates during windup and charge',()=>{
   const {Boss}=cache.get(path.join(root,'js/entities/boss.js')).namespace;
   const boss=new Boss({name:'test',hp:40,speed:0});boss.phase='WINDUP';boss.timer=1;boss.takeDamage(1);boss.update(.05,game.players);assert.equal(boss.hp,39);assert.ok(boss.displayHp>39&&boss.displayHp<40);assert.equal(boss.trailHp,40);
   boss.phase='CHARGE';boss.update(.05,game.players);assert.ok(boss.displayHp>39&&boss.displayHp<40);
 });
 check('damage numbers show actual loss, ignore invincibility, expire and stay capped',()=>{
   game.startGame();const p=game.players[0];p.invincibleTime=0;const m=new Monster('touch',p.x,p.y,0,5);
   checkCollisions(game.players,[m],[],game.onHit);assert.equal(p.hp,2);assert.equal(game.damageEffects.length,1);assert.equal(game.damageEffects[0].damage,1);checkCollisions(game.players,[m],[],game.onHit);assert.equal(game.damageEffects.length,1);
   for(let i=0;i<70;i++)game.onHit(m,2,false);assert.equal(game.damageEffects.length,24);game.monsters.forEach(m=>m.speed=0);game.players.forEach(p=>p.invincibleTime=100);game.update(.9);assert.equal(game.damageEffects.length,0);
   game.onHit(m,2,false);game.pauseGame();const time=game.damageEffects[0].time;game.update(2);assert.equal(game.damageEffects[0].time,time);game.restartStage();assert.equal(game.damageEffects.length,0);
 });
 check('cute player rendering preserves collision size and all four direction indicators',()=>{
   const p=game.players[0];const before=[p.width,p.height];for(const direction of ['up','down','left','right']){p.direction=direction;p.moving=true;p.walkTime=.2;p.hurtTime=.3;renderer.drawPlayer(p);}assert.deepEqual([p.width,p.height],before);assert.deepEqual(before,[40,40]);renderer.render(game);
 });

 check('shield adds one heart, cannot stack, persists respawn and resets stage',()=>{
   game.startGame();const p=game.players[0];p.hp=2;const shield=game.items.find(i=>i.type==='defense');p.x=shield.x;p.y=shield.y;game.update(0);assert.equal(p.maxHp,4);assert.equal(p.hp,3);
   const second={...shield,active:true,x:900,y:560};game.items.push(second);p.x=second.x;p.y=second.y;game.update(0);assert.equal(p.maxHp,4);assert.ok(second.active);
   p.invincibleTime=0;p.takeDamage(4);p.update(3.1,input);assert.equal(p.hp,4);assert.equal(p.maxHp,4);game.restartStage();assert.equal(p.maxHp,3);
 });
 check('heal waits for injury and restores all hearts including shield heart',()=>{
   game.startGame();const p=game.players[0],heal=game.items.find(i=>i.type==='heal');p.x=heal.x;p.y=heal.y;game.update(0);assert.ok(heal.active);p.maxHp=4;p.hp=1;game.update(0);assert.equal(p.hp,4);assert.equal(heal.active,false);
   assert.equal(game.items.filter(i=>i.type==='heal').length,0);
 });
 check('enemies and player level grow across stages without stacking on retry',()=>{
   game.startGame();let hp=0,speed=0;
   for(let i=0;i<4;i++){game.stages.index=i;game.startStage();const stage=game.stages.current,p=game.players[0];assert.ok(stage.hp>hp&&stage.speed>speed);hp=stage.hp;speed=stage.speed;assert.equal(p.level,i+1);assert.equal(p.speed,config.PLAYER_SPEED+i*config.LEVEL_SPEED_BONUS);const interval=p.attackInterval;game.restartStage();assert.equal(p.attackInterval,interval);}
 });
 check('last-hit owner earns enemy/boss points once; retry rolls back current attempt',()=>{
   game.startGame();const [p1,p2]=game.players;const m=new Monster('score',500,300,0,1);game.monsters=[m];const shot=new Projectile(p2);shot.x=510;shot.y=310;shot.velocityX=shot.velocityY=0;game.projectiles=[shot];game.update(0);assert.equal(p1.kills,0);assert.equal(p2.kills,1);assert.equal(game.getScore(p2),10);game.update(0);assert.equal(p2.kills,1);
   game.recordCorrectAnswer(1);game.advanceStage();p2.kills++;game.restartStage();assert.equal(p2.kills,1);assert.equal(game.correctAnswers,1);
   const boss={x:0,y:0,width:50,height:50,active:false,isBoss:true};game.onHit(boss,2,false,1);assert.equal(game.getScore(p1),100);assert.equal(game.totalScore,210);game.startGame();assert.equal(game.totalScore,0);
 });
 check('quiz correct adds common points once and wrong answer gets none',()=>{
   game.startGame();const scored=new QuizSystem(()=>{},()=>game.recordCorrectAnswer());scored.startStage(1);scored.checkAnswer(scored.question.answer);scored.checkAnswer(scored.question.answer);assert.equal(game.correctAnswers,1);assert.equal(game.totalScore,100);assert.ok(game.players.every(p=>game.getScore(p)===0));scored.startStage(2);scored.checkAnswer((scored.question.answer+1)%4);assert.equal(game.totalScore,100);
 });
 check('three classes have distinct attacks and boss weaknesses multiply only matching damage',()=>{
   const {Boss}=cache.get(path.join(root,'js/entities/boss.js')).namespace;
   const p=game.players[0];
   for(const type of ['warrior','archer','mage']) {
     p.setClass(type);p.attackMultiplier=1;p.direction='right';p.attackCooldown=0;const attack=p.attack();assert.equal(attack.classType,type);assert.equal(attack.damage,config.CLASSES[type].damage);assert.equal(attack.velocityX,config.CLASSES[type].speed);
     for(const weakness of ['warrior','archer','mage',null]) {const boss=new Boss({name:'test',hp:100,speed:0,weakness});const shot=new Projectile(p);shot.x=boss.x;shot.y=boss.y;checkCollisions([], [boss],[shot]);assert.equal(100-boss.hp,config.CLASSES[type].damage*(type===weakness?3:1));}
   }
   p.setClass('mage');
 });
 check('warrior swings only nearby with strong damage, never travels as a ranged shot',()=>{
   const p=game.players[0];p.setClass('warrior');p.reset();p.x=300;p.y=400;p.direction='right';const shot=new Projectile(p);const near=new Monster('near',350,400,0,20),far=new Monster('far',420,400,0,20);checkCollisions([], [far,near],[shot]);assert.equal(near.hp,16);assert.equal(far.hp,20);
   const swing=new Projectile(p),x=swing.x;swing.update(.05);assert.equal(swing.x,x);swing.update(.2);assert.equal(swing.active,false);p.setClass('mage');
 });
 check('mage damage grows at middle range and projectile cannot exceed its range',()=>{
   const p=game.players[0];p.setClass('mage');p.reset();p.direction='right';
   for(const [distance,expected] of [[0,1],[139,1],[140,2],[279,2],[280,3],[420,3]]) {
     const shot=new Projectile(p);shot.update(distance/config.CLASSES.mage.speed);assert.equal(shot.getDamage(),expected);assert.equal(shot.traveled,distance);
     const m=new Monster('target',shot.x,shot.y,0,30);checkCollisions([], [m],[shot]);assert.equal(m.hp,30-expected);
   }
   p.attackMultiplier=2;const powered=new Projectile(p);powered.update(.6);assert.equal(powered.getDamage(),6);p.attackMultiplier=1;
   const shot=new Projectile(p);const origin=shot.x;for(let i=0;i<20;i++)shot.update(.05);assert.ok(shot.x-origin<=420);assert.equal(shot.active,false);
 });
 check('archer gains damage at long distance, respects range and stacks power/weakness',()=>{
   const p=game.players[0];p.reset();p.setClass('archer');p.direction='right';
   for(const [distance,expected] of [[0,1],[249,1],[250,2],[499,2],[500,3]]) {const shot=new Projectile(p);shot.update(distance/config.CLASSES.archer.speed);assert.equal(shot.getDamage(),expected);}
   const {Boss}=cache.get(path.join(root,'js/entities/boss.js')).namespace;
   p.attackMultiplier=2;const shot=new Projectile(p);shot.update(.625);const boss=new Boss({name:'weak',hp:100,speed:0,weakness:'archer'});shot.x=boss.x;shot.y=boss.y;checkCollisions([], [boss],[shot]);assert.equal(boss.hp,82);
   p.x=50;const long=new Projectile(p);const origin=long.x;for(let i=0;i<30;i++)long.update(.05);assert.equal(long.x-origin,900);assert.equal(long.active,false);p.setClass('mage');p.reset();
 });
 check('all nine class pairs put the unselected weakness at stage 3 and selected roles first',()=>{
   for(const first of Object.keys(config.CLASSES)) for(const second of Object.keys(config.CLASSES)) {
     game.players[0].setClass(first);game.players[1].setClass(second);
     for(let i=0;i<4;i++) {
       game.stages.index=i;game.startStage();game.monsters=[];game.update(0);const boss=game.monsters[0];assert.ok(boss.isBoss);
       if(i===0)assert.equal(boss.weakness,first);
       else if(i===1)assert.equal(boss.weakness,second);
       else if(i===2){assert.ok(config.CLASSES[boss.weakness]);assert.ok(![first,second].includes(boss.weakness));const prior=boss.weakness;game.restartStage();game.monsters=[];game.update(0);assert.equal(game.monsters[0].weakness,prior);}
       else assert.equal(boss.weakness,null);
     }
   }
   game.players.forEach(p=>p.setClass('mage'));game.startGame();
 });
 check('random items are one per type, inside arena and do not overlap',()=>{
   const positions=new Set();for(let i=0;i<12;i++){game.startGame();assert.equal(game.items.length,3);assert.equal(new Set(game.items.map(i=>i.type)).size,3);positions.add(JSON.stringify(game.items.map(i=>[i.x,i.y])));for(const item of game.items){assert.ok(item.x>=config.ARENA.left&&item.x+item.width<=config.ARENA.right);assert.ok(item.y>=config.ARENA.top&&item.y+item.height<=config.ARENA.bottom);}}
   assert.ok(positions.size>1);
 });
 check('final instructions block combat until explicit start and cannot start twice',()=>{
   game.startGame();game.finishQuiz(true);assert.equal(game.state,'FINAL_READY');const x=game.players[0].x,hp=game.monsters[0].hp;game.update(20);assert.equal(game.players[0].x,x);assert.equal(game.monsters[0].hp,hp);assert.equal(input.enabled,false);assert.equal(game.demonAttempts,0);game.beginFinalBattle();game.beginFinalBattle();assert.equal(game.demonAttempts,1);
 });
 check('demon retry keeps quiz score, counts attempts and resets encounter only',()=>{
   game.startGame();game.correctAnswers=7;game.finishQuiz(true);game.beginFinalBattle();assert.equal(game.demonAttempts,1);
   game.players.forEach(p=>{p.invincibleTime=0;const damage=p.takeDamage(99);game.onHit(p,damage,true);});
   game.update(0);assert.equal(game.demonAttempts,2);assert.equal(game.correctAnswers,7);assert.equal(game.deaths,2);assert.equal(game.monsters[0].hp,config.DEMON.hp);
   game.monsters[0].takeDamage(999);game.update(0);assert.equal(game.state,'GAME_CLEAR');assert.equal(game.demonBonus,400);
 });
 check('speed bonus is proportional to speed with no maximum; quiz answers earn speed points',()=>{
   const expected=(par,t)=>Math.round(config.SPEED_BONUS.base*par/Math.max(config.SPEED_BONUS.minSeconds,t));
   game.startGame();game.monsters=[];game.battlePhase='BOSS';game.battleTime=40;game.update(0);assert.equal(game.speedBonus,110);assert.equal(game.state,'QUIZ');
   game.setState('PLAYING');game.battleTime=20;game.monsters=[];game.battlePhase='BOSS';game.update(0);assert.equal(game.speedBonuses[1].bonus,220);
   game.setState('PLAYING');game.battleTime=4;game.monsters=[];game.battlePhase='BOSS';game.update(0);assert.equal(game.speedBonuses[2].bonus,1100);
   game.setState('PLAYING');game.battleTime=0.01;game.monsters=[];game.battlePhase='BOSS';game.update(0);assert.equal(game.speedBonuses[3].bonus,expected(40,0.01));
   game.setState('PLAYING');game.battleTime=999;game.monsters=[];game.battlePhase='BOSS';game.update(0);assert.equal(game.speedBonuses[4].bonus,expected(40,999));assert.ok(game.speedBonuses[4].bonus>0);
   for(const t of [5,10,30,60,120]) assert.ok(expected(40,t)>expected(40,t+1));
   game.stages.index=1;game.startStage();const kept=game.speedBonuses.length;game.speedBonuses.push({bonus:50});game.restartStage();assert.equal(game.speedBonuses.length,kept);
   game.setState('PAUSED');const t=game.battleTime;game.update(5);assert.equal(game.battleTime,t);
   // Quiz speed: timed from showing the question; first try only; wrong answers forfeit it for that quiz.
   game.startGame();assert.equal(game.speedBonus,0);
   let clock=0;const timed=new QuizSystem(()=>{},answer=>game.recordCorrectAnswer(answer),()=>game.recordWrongAnswer());timed.now=()=>clock;
   timed.startStage(1);clock+=5000;timed.checkAnswer(timed.question.answer);assert.equal(game.speedBonuses.at(-1).bonus,200);assert.equal(game.speedBonuses.at(-1).quiz,true);
   timed.startStage(2);clock+=1000;timed.checkAnswer(timed.question.answer);assert.equal(game.speedBonuses.at(-1).bonus,Math.round(50*20/3));
   timed.startStage(3);clock+=40000;timed.checkAnswer(timed.question.answer);assert.equal(game.speedBonuses.at(-1).bonus,25);
   const before=game.speedBonuses.length;timed.startStage(4);timed.checkAnswer((timed.question.answer+1)%4);timed.continueQuiz();clock+=2000;timed.checkAnswer(timed.question.answer);assert.equal(game.speedBonuses.length,before);assert.equal(game.correctAnswers,4);
   timed.startFinal();clock+=4000;timed.checkAnswer((timed.question.answer+1)%4);timed.continueQuiz();timed.checkAnswer(timed.question.answer);assert.equal(game.speedBonuses.length,before);
   timed.continueQuiz();clock+=10000;timed.checkAnswer(timed.question.answer);assert.equal(game.speedBonuses.at(-1).bonus,100);
   // No score ceiling: a very fast run exceeds the old 2500 maximum.
   const [p1]=game.players;p1.kills=30;p1.bossKills=5;game.correctAnswers=7;game.demonAttempts=1;game.wrongAnswers=0;game.deaths=0;
   game.speedBonuses=[...[40,45,50,60,60].map(par=>({bonus:expected(par,5)})),...Array.from({length:7},()=>({bonus:333}))];game.demonBonus=config.DEMON_BONUS.first;
   assert.ok(game.totalScore>2500,`fast run scored ${game.totalScore}`);
 });
 check('wrong/death penalties survive stage rollback, clamp total and reset new run',()=>{
   game.startGame();for(let i=0;i<5;i++)game.recordWrongAnswer();game.deaths=4;assert.equal(game.penalty,50);assert.equal(game.totalScore,0);game.restartStage();assert.equal(game.penalty,50);
   const scored=new QuizSystem(()=>{},()=>{},()=>game.recordWrongAnswer());scored.startStage(1);const wrong=(scored.question.answer+1)%4;scored.checkAnswer(wrong);scored.checkAnswer(wrong);assert.equal(game.wrongAnswers,6);
   game.startGame();assert.equal(game.penalty,0);assert.equal(game.deaths,0);
 });
 check('all abilities get simultaneous final-only ultimates, cooldown and bounded impacts',()=>{
   for(const type of Object.keys(config.CLASSES)) {
     game.startGame();game.players.forEach(p=>p.setClass(type));input.keys.add('KeyG');input.keys.add('KeyK');game.update(0);assert.equal(game.projectiles.length,0);
     game.finishQuiz(true);game.beginFinalBattle();input.keys.add('KeyG');input.keys.add('KeyK');game.update(0);assert.equal(game.projectiles.length,2);assert.ok(game.projectiles.every(p=>p.ultimate&&p.damage===36&&p.velocityY!==0));
     game.update(0);assert.equal(game.projectiles.length,2);game.pauseGame();const cooldown=game.players[0].ultimateCooldown;game.update(10);assert.equal(game.players[0].ultimateCooldown,cooldown);game.resumeGame();
     const shot=game.projectiles[0],boss=game.monsters[0];shot.x=boss.x;shot.y=boss.y;checkCollisions([], [boss],[shot],game.onHit);assert.equal(boss.hp,324);assert.equal(game.explosions.length,1);renderer.render(game);
     game.players[0].invincibleTime=0;game.players[0].takeDamage(99);game.players[0].update(3.1,input);assert.ok(game.players[0].ultimateCooldown>0);
     for(let i=0;i<20;i++)game.onHit(boss,36,false,1,shot);assert.equal(game.explosions.length,config.ULTIMATE.maxEffects);
   }
   game.players.forEach(p=>p.setClass('mage'));game.startGame();
 });
 check('demon stationary regen is capped, movement resets timer and pause freezes regen',()=>{
   game.finishQuiz(true);game.beginFinalBattle();const boss=game.monsters[0];boss.takeDamage(20);boss.phase='REST';boss.timer=3;
   boss.update(.5,game.players);assert.equal(boss.hp,340);boss.update(.1,game.players);assert.ok(boss.hp>340);boss.hp=boss.maxHp-0.1;boss.update(.1,game.players);assert.equal(boss.hp,boss.maxHp);
   game.pauseGame();const hp=boss.hp,timer=boss.timer;game.update(10);assert.equal(boss.hp,hp);assert.equal(boss.timer,timer);game.resumeGame();boss.phase='CHASE';boss.update(.05,game.players);assert.equal(boss.stationaryTime,0);
   game.startGame();
 });
 const {spawnSync}=require('child_process');
 const siblingPath=path.resolve(root,'../python-mini-game/src/questions.js');
 const reference=JSON.parse(fs.readFileSync(path.join(root,'tests/reference-questions.json'),'utf8'));
 let sibling=reference.questions;
 if(fs.existsSync(siblingPath)){
   const live=(await load('../python-mini-game/src/questions.js')).default;
   // Keep the fixed reference AND new live questions so older examples remain reserved.
   sibling=[...sibling,...live.filter(q=>!sibling.some(old=>old.question===q.question&&old.code===q.code))];
 }
 // Every pattern is generated many times with random numbers/names and shuffled choices.
const variants=[];for(const q of QUESTIONS)for(let i=0;i<150;i++){const v=presentQuestion(q);delete v.vary;variants.push(v);}
const pythonCheck=spawnSync('python3',[path.join(root,'tests/check-questions.py')],{input:JSON.stringify({questions:QUESTIONS,sibling,variants}),encoding:'utf8',timeout:10000});
 process.stdout.write(pythonCheck.stdout);if(pythonCheck.status!==0){throw new Error(pythonCheck.stderr||'Python question verification failed');}
 checks++;
 check('cross-project detector rejects renamed variables, numbers and messages',()=>{
   const changed=JSON.parse(JSON.stringify(QUESTIONS));const q=changed.find(q=>q.id==='s3-q2');q.code='rank = 62\nif rank >= 80:\n    print("Gold")\nelif rank >= 50:\n    print("Silver")\nelse:\n    print("Bronze")';q.choices=['Gold','Silver','Bronze','Gold\nSilver'];q.answer=1;
   const result=spawnSync('python3',[path.join(root,'tests/check-questions.py')],{input:JSON.stringify({questions:changed,sibling:reference.questions}),encoding:'utf8',timeout:10000});assert.notEqual(result.status,0);assert.match(result.stderr,/same code template/);
 });
 check('dungeon detector rejects equivalent code under another question/ID',()=>{
   const changed=JSON.parse(JSON.stringify(QUESTIONS));const source=changed.find(q=>q.id==='s4-q1'),target=changed.find(q=>q.id==='s4-q2');target.code=source.code;target.choices=['6','7','8','9'];target.answer=0;
   const result=spawnSync('python3',[path.join(root,'tests/check-questions.py')],{input:JSON.stringify({questions:changed,sibling:reference.questions}),encoding:'utf8',timeout:10000});assert.notEqual(result.status,0);assert.match(result.stderr,/duplicate dungeon code template/);
 });
 check('solo mode: one hero, scaled HP, solo weaknesses, DOWN restarts stage, full flow to CLEAR',()=>{
   game.returnToStart();game.players[0].setClass('archer');game.setPlayerCount(1);assert.equal(game.players.length,1);assert.ok(game.isSolo);assert.equal(game.allPlayers.length,2);
   game.startGame();assert.equal(game.state,'PLAYING');assert.equal(game.players[0].x,config.SOLO.spawnX);
   game.setPlayerCount(2);assert.equal(game.players.length,1);
   const s=game.stages.current;assert.ok(game.monsters.every(m=>m.maxHp===Math.ceil(s.hp*config.SOLO.hpMultiplier)));
   key('KeyL');game.update(.05);assert.equal(game.projectiles.length,0);input.clear();
   const expected=['archer','warrior','mage',null];
   for(let stage=1;stage<=4;stage++){
     assert.equal(game.stages.current.id,stage);game.monsters=[];game.update(.01);
     const boss=game.monsters[0];assert.equal(boss.weakness,expected[stage-1]);assert.equal(boss.maxHp,Math.ceil(game.stages.current.boss.hp*config.SOLO.hpMultiplier));
     if(stage===2){const p=game.players[0];p.invincibleTime=0;p.takeDamage(9);game.update(.01);assert.equal(game.stages.current.id,2);assert.equal(game.battlePhase,'MONSTERS');assert.ok(p.active);game.monsters=[];game.update(.01);}
     game.monsters[0].takeDamage(9999);game.update(0);assert.equal(game.state,'QUIZ');
     quiz.checkAnswer(quiz.question.answer);quiz.continueQuiz();game.continueAfterStage();
   }
   for(let i=0;i<3;i++){quiz.checkAnswer(quiz.question.answer);quiz.continueQuiz();}
   game.beginFinalBattle();assert.equal(game.monsters[0].maxHp,Math.ceil(config.DEMON.hp*config.SOLO.hpMultiplier));
   const p=game.players[0];p.invincibleTime=0;p.takeDamage(9);game.update(.01);assert.equal(game.demonAttempts,2);assert.equal(game.state,'PLAYING');
   game.monsters[0].takeDamage(9999);game.update(0);assert.equal(game.state,'GAME_CLEAR');assert.equal(game.demonBonus,400);
   game.setPlayerCount(2);assert.equal(game.players.length,2);assert.equal(game.allPlayers[0].spawnX,480);game.startGame();
   assert.ok(game.monsters.every(m=>m.maxHp===game.stages.current.hp));game.returnToStart();
 });
 // Separate context is unnecessary: UI startup should create exactly one additional chain for this independent integration instance.
 let appGame;const originalStart=Game.prototype.startGame;Game.prototype.startGame=function(){appGame=this;return originalStart.call(this);};
 elements['p1-class'].value='warrior';elements['p2-class'].value='archer';
 await load('js/main.js');await new Promise(resolve=>setImmediate(resolve));
 check('entry point ready, start button, HUD and replay UI wired',()=>{
   assert.equal(elements['start-button'].textContent,'게임 시작');assert.equal(elements['start-button'].disabled,false);elements['start-button'].click();assert.equal(elements['start-screen'].hidden,false);elements['p1-nickname'].value='루나';elements['p2-nickname'].value='코코';elements['start-button'].click();assert.equal(elements['start-screen'].hidden,true);assert.equal(elements['ready-screen'].hidden,false);assert.equal(elements.hud.hidden,true);elements['ready-start-button'].click();assert.equal(elements['ready-screen'].hidden,true);assert.equal(elements.hud.hidden,false);assert.equal(elements['stage-number'].textContent,'STAGE 1');elements['pause-button'].click();assert.equal(elements['pause-screen'].hidden,false);elements['resume-button'].click();assert.equal(elements['pause-screen'].hidden,true);elements['pause-button'].click();elements['home-button'].click();assert.equal(elements['start-screen'].hidden,false);assert.equal(elements['pause-screen'].hidden,true);
 });
 check('nickname HUD and final individual/team scoreboard; replay resets scores',()=>{
   elements['start-button'].click();elements['ready-start-button'].click();assert.equal(elements['p1-name'].textContent,'P1 루나');assert.equal(elements['p2-name'].textContent,'P2 코코');assert.equal(appGame.players[0].classType,'warrior');assert.equal(appGame.players[1].classType,'archer');
   appGame.finishQuiz(true);assert.equal(elements['final-ready-screen'].hidden,false);assert.equal(appGame.state,'FINAL_READY');elements['final-start-button'].click();assert.equal(elements['final-ready-screen'].hidden,true);assert.equal(appGame.battlePhase,'DEMON');
   appGame.players[0].kills=3;appGame.correctAnswers=3;appGame.players[1].kills=2;appGame.players[1].bossKills=1;appGame.battleTime=config.SPEED_BONUS.demonPar;appGame.monsters[0].takeDamage(999);appGame.update(0);
   assert.equal(elements['result-p1-score'].textContent,'30점');assert.equal(elements['result-p2-score'].textContent,'110점');assert.equal(elements['result-team-score'].textContent,'협력 총점 1050점');assert.equal(elements['result-scores'].hidden,false);
   elements['result-button'].click();elements['ready-start-button'].click();assert.equal(appGame.totalScore,0);assert.equal(appGame.players[0].nickname,'루나');
 });
 check('changed names/classes refresh HUD even when score and HP match previous game',()=>{
   appGame.returnToStart();elements['p1-nickname'].value='별빛';elements['p1-class'].value='mage';elements['start-button'].click();elements['ready-start-button'].click();assert.equal(elements['p1-name'].textContent,'P1 별빛');assert.ok(elements['p1-power'].textContent.includes('마법사'));
   assert.equal(elements['quiz-p1'],undefined);assert.equal(elements['quiz-p2'],undefined);
 });
 check('ability buttons update chosen role, pressed color state and cached detailed sprites',()=>{
   appGame.returnToStart();elements['p1-archer'].click();assert.equal(elements['p1-class'].value,'archer');assert.equal(elements['p1-archer']['aria-pressed'],'true');assert.equal(elements['p1-warrior']['aria-pressed'],'false');elements['start-button'].click();elements['ready-start-button'].click();assert.equal(appGame.players[0].classType,'archer');
   for(const type of Object.keys(config.CLASSES)) {const sprite=renderer.getHeroSprite(type,1);assert.equal(sprite.width,32);assert.equal(sprite.height,40);assert.equal(renderer.getHeroSprite(type,1),sprite);}
 });
 check('title 1P/2P selector: solo needs only P1 nickname, hides P2 UI, PLAY AGAIN keeps mode',()=>{
   appGame.returnToStart();elements['mode-1p'].click();assert.equal(elements['mode-1p']['aria-pressed'],'true');assert.equal(elements['mode-2p']['aria-pressed'],'false');
   assert.equal(elements['p2-card'].hidden,true);assert.ok(elements['game-shell'].classList.contains('solo'));
   elements['p1-nickname'].value='솔로';elements['p2-nickname'].value='';elements['start-button'].click();assert.equal(elements['ready-screen'].hidden,false);
   assert.equal(elements['ready-start-button'].textContent,'1 PLAYER START');assert.equal(elements['ready-p2-card'].hidden,true);assert.equal(elements['ready-solo-tip'].hidden,false);
   elements['ready-start-button'].click();assert.equal(appGame.players.length,1);assert.equal(appGame.state,'PLAYING');assert.match(elements['team-score'].textContent,/^총점/);
   appGame.finishQuiz(true);assert.equal(elements['final-p2-card'].hidden,true);elements['final-start-button'].click();appGame.monsters[0].takeDamage(9999);appGame.update(0);
   assert.equal(elements['result-p2-card'].hidden,true);assert.match(elements['result-team-score'].textContent,/^총점/);
   elements['result-button'].click();assert.equal(elements['ready-start-button'].textContent,'1 PLAYER START');elements['ready-start-button'].click();assert.equal(appGame.players.length,1);
   appGame.returnToStart();elements['mode-2p'].click();assert.equal(elements['p2-card'].hidden,false);assert.equal(elements['game-shell'].classList.contains('solo'),false);
   elements['start-button'].click();assert.match(elements['loading-message'].textContent,/PLAYER 2/);elements['p2-nickname'].value='코코';elements['start-button'].click();elements['ready-start-button'].click();assert.equal(appGame.players.length,2);
 });
 await checkAsync('leaderboard disabled in committed config (no Supabase key shipped); code still correct if re-enabled: hidden without config, submits nickname1/nickname2 once at CLEAR, highlights new record, survives failures',async()=>{
   const board=await load('js/systems/leaderboard.js');
   const saved={...config.LEADERBOARD};config.LEADERBOARD.url='';config.LEADERBOARD.key='';
   assert.equal(board.recordName([{nickname:'루나'},{nickname:'코코'}]),'루나/코코');assert.equal(board.recordName([{nickname:'솔로'}]),'솔로');
   const clear=()=>{appGame.returnToStart();elements['start-button'].click();elements['ready-start-button'].click();appGame.finishQuiz(true);elements['final-start-button'].click();appGame.battleTime=config.SPEED_BONUS.demonPar;appGame.monsters[0].takeDamage(9999);appGame.update(0);};
   const calls=[];context.setTimeout=(f,ms)=>0;context.clearTimeout=()=>{};context.AbortController=class{constructor(){this.signal={};}abort(){}};
   context.fetch=async(url,options)=>{calls.push([url,options]);return {ok:true,json:async()=>({id:7,top:[{id:3,name:'하늘/바다',score:9000,players:2},{id:7,name:'루나/코코',score:500,players:2}]})};};
   elements['p1-nickname'].value='루나';elements['p2-nickname'].value='코코';
   clear();await new Promise(r=>setImmediate(r));assert.equal(elements['leaderboard'].hidden,true);assert.equal(calls.length,0);
   config.LEADERBOARD.url='https://example.supabase.co';config.LEADERBOARD.key='public-key';
   clear();for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));
   assert.equal(elements['leaderboard'].hidden,false);assert.ok(calls.some(([url,options])=>url.endsWith('/rest/v1/code_quest_top5?select=id,name,score,players&order=score.desc,created_at.asc&limit=10')&&!options.method),'title screen reads TOP 10');assert.equal(elements['title-leaderboard'].hidden,false);calls.splice(0,calls.length,...calls.filter(([url])=>url.includes('/rpc/')));assert.equal(calls.length,1,elements['leaderboard-status'].textContent);
   assert.equal(calls[0][0],'https://example.supabase.co/rest/v1/rpc/code_quest_submit_score');assert.equal(calls[0][1].method,'POST');assert.equal(calls[0][1].headers.apikey,'public-key');
   const body=JSON.parse(calls[0][1].body);assert.equal(body.p_name,'루나/코코');assert.equal(body.p_players,2);assert.equal(body.p_score,appGame.totalScore);
   const rows=elements['leaderboard-list'].children;assert.equal(rows.length,2);assert.equal(rows[1].className,'new-record');assert.match(elements['leaderboard-status'].textContent,/TOP 10에 이름/);context.fetch=async(url,options)=>{calls.push([url,options]);return {ok:true,json:async()=>[{id:3,name:'하늘/바다',score:9000,players:2},{id:5,name:'솔로',score:800,players:1}]};};appGame.returnToStart();for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));assert.equal(elements['title-leaderboard-list'].children.length,2);assert.match(elements['title-leaderboard-list'].children[0].textContent,/1\. 하늘\/바다9000점/);assert.match(elements['title-leaderboard-status'].textContent,/클리어하고 기록에 도전/);context.fetch=async(url,options)=>{calls.push([url,options]);return {ok:true,json:async()=>[{id:9,name:'새기록',score:9999,players:1}]};};elements['title-leaderboard-refresh'].click();for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));assert.match(elements['title-leaderboard-list'].children[0].textContent,/새기록9999점/);assert.equal(elements['title-leaderboard-refresh'].disabled,false);
   context.fetch=async()=>{throw new Error('offline');};clear();for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));
   assert.match(elements['leaderboard-status'].textContent,/연결할 수 없어요/);assert.equal(appGame.state,'GAME_CLEAR');
   Object.assign(config.LEADERBOARD,saved);appGame.returnToStart();
   assert.ok(!saved.url&&!saved.key,'leaderboard stays disabled in the committed config — no Supabase key is shipped to the browser');
 });
 console.log(`\n${checks} checks passed. No runtime exceptions.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
