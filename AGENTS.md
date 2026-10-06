# AGENTS.md

# CODE QUEST — Codex Development Guide

## 1. Project Summary

This project is a lightweight browser game for middle school programming review.

Game title:

**CODE QUEST — 명빈T의 코딩 던전**

Two students play together on one keyboard.

- Player 1: WASD + F
- Player 2: Arrow Keys + L

Players defeat code-themed monsters.

After all monsters in a stage are defeated, `명빈T` appears and gives a programming quiz.

The correct answer unlocks the next stage.

The game contains four main stages and a final quiz.

---

# 2. Core Development Goal

The most important requirements are:

1. Simple implementation
2. Fast loading
3. Smooth gameplay
4. Minimal buffering
5. Easy GitHub Pages deployment
6. No backend
7. No database
8. No unnecessary dependencies
9. Easy quiz editing
10. Easy maintenance by a teacher

This is a small classroom game, not a large commercial game.

Do not over-engineer the project.

---

# 3. Technology Rules

Use only:

- HTML5
- CSS
- Vanilla JavaScript
- HTML Canvas

Do NOT introduce:

- React
- Vue
- Svelte
- Next.js
- TypeScript
- npm packages
- Node.js server
- Express
- Firebase
- Supabase
- Database
- WebSocket
- Authentication
- Build systems unless absolutely necessary

The project must work by opening the static site through GitHub Pages.

---

# 4. Performance Priority

Performance is especially important because the game will run on school devices.

Prioritize:

- fast initial loading
- stable 60 FPS where possible
- minimal asset requests
- minimal DOM updates during gameplay
- simple collision calculations
- small image sizes
- no unnecessary animations
- no network requests during gameplay

Do not sacrifice stability for visual effects.

---

# 5. Recommended Project Structure

Use the following structure.

```text
code-quest/
│
├── index.html
├── README.md
├── AGENTS.md
│
├── css/
│   ├── base.css
│   ├── game.css
│   └── ui.css
│
├── js/
│   ├── main.js
│   │
│   ├── core/
│   │   ├── config.js
│   │   ├── game.js
│   │   ├── input.js
│   │   ├── renderer.js
│   │   ├── assets.js
│   │   └── utils.js
│   │
│   ├── entities/
│   │   ├── player.js
│   │   ├── monster.js
│   │   └── projectile.js
│   │
│   ├── systems/
│   │   ├── collision.js
│   │   ├── stage.js
│   │   └── quiz.js
│   │
│   └── data/
│       ├── stages.js
│       └── questions.js
│
└── assets/
    ├── sprites/
    │   ├── players.png
    │   ├── monsters.png
    │   └── teacher.png
    │
    ├── backgrounds/
    │   ├── stage1.webp
    │   ├── stage2.webp
    │   ├── stage3.webp
    │   └── stage4.webp
    │
    └── audio/
        ├── attack.mp3
        ├── hit.mp3
        └── correct.mp3
```

---

# 6. Why Files Are Separated This Way

Do not put the entire project into one giant JavaScript file.

Each file must have one clear responsibility.

However, do not create tiny files unnecessarily.

The goal is a balance between:

- maintainability
- readability
- browser loading performance

The recommended structure contains only the modules that are useful for this game.

---

# 7. Main File Responsibilities

## `index.html`

Contains only the main application structure.

Include:

- game container
- canvas
- HUD
- start screen
- instructions screen
- quiz modal
- stage clear modal
- final clear screen

Do not put large JavaScript logic directly inside HTML.

---

# 8. CSS Structure

## `css/base.css`

Contains:

- reset
- body
- fonts
- variables
- base layout

Example CSS variables:

```css
:root {
    --bg-dark: #121424;
    --panel: #232642;
    --text: #ffffff;
    --accent: #ffd34e;
}
```

---

## `css/game.css`

Contains:

- canvas
- game viewport
- HUD
- gameplay layout
- responsive canvas rules

---

## `css/ui.css`

Contains:

- start screen
- buttons
- quiz window
- dialogs
- teacher speech bubble
- stage clear screen
- game clear screen

---

# 9. JavaScript Architecture

JavaScript must use native ES modules.

Use:

```html
<script type="module" src="./js/main.js"></script>
```

Avoid global variables whenever practical.

Do not use bundlers.

GitHub Pages can serve ES modules directly.

---

# 10. `js/main.js`

This is the entry point.

Responsibilities:

1. wait for DOM initialization
2. preload required assets
3. initialize the Game
4. connect UI events
5. start the game

Example conceptual flow:

```text
DOM READY
↓
LOAD ESSENTIAL ASSETS
↓
CREATE GAME
↓
SHOW START SCREEN
↓
PLAYER STARTS
↓
GAME LOOP
```

Do not place entity logic in `main.js`.

---

# 11. `core/config.js`

Store global constants.

Examples:

```javascript
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const PLAYER_SPEED = 250;
export const PLAYER_MAX_HP = 3;

export const PLAYER_1_KEYS = {
    up: "KeyW",
    down: "KeyS",
    left: "KeyA",
    right: "KeyD",
    attack: "KeyF"
};

export const PLAYER_2_KEYS = {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    attack: "KeyL"
};
```

Magic numbers should not be scattered through the project.

---

# 12. `core/game.js`

The main game controller.

Responsibilities:

- current game state
- players
- monsters
- projectiles
- current stage
- update loop
- render loop
- pause during quizzes
- stage transitions

Recommended game states:

```text
START
PLAYING
QUIZ
STAGE_CLEAR
GAME_CLEAR
```

Do not mix quiz DOM code directly into the gameplay loop.

---

# 13. `core/input.js`

Manage keyboard input centrally.

Use:

```javascript
const keys = new Set();
```

Handle:

```text
keydown
keyup
```

Prevent browser scrolling for game control keys.

Especially:

```text
ArrowUp
ArrowDown
ArrowLeft
ArrowRight
Space
```

Only one keyboard listener should manage gameplay keys.

Do not attach separate key listeners to every player.

---

# 14. `core/renderer.js`

All Canvas drawing helpers belong here.

Examples:

- draw player
- draw monster
- draw projectile
- draw background
- draw simple particles
- draw debug rectangles if needed

During the first MVP, use Canvas shapes instead of waiting for final art assets.

Example:

```javascript
ctx.fillRect(x, y, width, height);
```

Functionality comes before graphic polish.

---

# 15. `core/assets.js`

Responsible for loading and caching game assets.

All required images must be loaded once and reused.

Do not repeatedly create:

```javascript
new Image()
```

inside the game loop.

Maintain a cached asset object.

Concept:

```javascript
const images = new Map();
```

Use a preload function.

---

# 16. Asset Loading Strategy

Initial loading must be lightweight.

At game startup, preload only essential assets:

- player sprites
- teacher sprite
- first stage background
- monster sprite sheet

Do not block game startup while every optional sound or every later-stage asset loads.

After Stage 1 begins, later-stage backgrounds may be preloaded.

Concept:

```text
START
↓
load essential assets
↓
game available
↓
preload remaining stage assets in background
```

However, the game must still work if optional assets have not finished loading.

Always provide a fallback Canvas drawing.

---

# 17. Sprite Sheet Strategy

Do not create many tiny image files such as:

```text
print.png
input.png
int.png
if.png
else.png
while.png
for.png
```

Prefer one sprite sheet:

```text
monsters.png
```

and draw sections using Canvas:

```javascript
ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    dx,
    dy,
    dw,
    dh
);
```

This reduces HTTP file requests.

The monster's programming command should usually be drawn as Canvas text above or inside the monster.

Example:

```text
┌─────────┐
│ print() │
└─────────┘
```

Therefore one general monster sprite can represent multiple code monsters.

---

# 18. Player Sprite Strategy

Prefer:

```text
players.png
```

instead of many individual animation images.

A small sprite sheet may contain:

```text
Player 1 idle
Player 1 walk

Player 2 idle
Player 2 walk
```

The MVP does not require complex animation.

Two animation frames per character are enough.

---

# 19. Background Assets

Use compressed WebP backgrounds where possible.

Recommended maximum source size:

```text
1280 × 720
```

Do not use unnecessarily large 4K images.

Recommended:

```text
stage1.webp
stage2.webp
stage3.webp
stage4.webp
```

Keep each file reasonably small.

Visual quality should be appropriate for a school tablet, not print media.

---

# 20. Gameplay Rendering

Use a single Canvas for active gameplay.

Do not create individual DOM elements for:

- monsters
- bullets
- players
- particles

Render them on Canvas.

DOM should only be used for:

- start menu
- HUD
- quiz modal
- teacher dialog
- stage result
- game clear

This prevents excessive browser layout calculations.

---

# 21. Game Loop

Use:

```javascript
requestAnimationFrame()
```

Do NOT use:

```javascript
setInterval()
```

for the main game loop.

Use delta time.

Example concept:

```javascript
function loop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;

    update(deltaTime);
    render();

    lastTime = timestamp;

    requestAnimationFrame(loop);
}
```

Clamp excessive delta time after tab switching.

Example:

```javascript
const dt = Math.min(deltaTime, 0.05);
```

---

# 22. Movement

Player speed must be frame-rate independent.

Correct:

```javascript
player.x += speed * deltaTime;
```

Avoid:

```javascript
player.x += 4;
```

as the only movement method.

---

# 23. Entity Model

Entities should remain simple JavaScript objects or small classes.

Do not build a complicated Entity Component System.

Recommended classes:

```text
Player
Monster
Projectile
```

Nothing more complicated is required.

---

# 24. `entities/player.js`

Player properties:

```text
x
y
width
height
speed
hp
maxHp
direction
attackCooldown
invincibleTime
```

Functions may include:

```text
update()
attack()
takeDamage()
reset()
draw()
```

---

# 25. `entities/monster.js`

Monster properties:

```text
x
y
width
height
speed
hp
label
damage
```

All monsters may initially share the same AI.

Monster behavior:

1. find the nearest active player
2. move toward that player
3. damage the player on collision

Do not add pathfinding.

No A* algorithm is needed.

---

# 26. `entities/projectile.js`

Projectile properties:

```text
x
y
velocityX
velocityY
size
damage
lifetime
owner
```

Remove projectiles when:

- they hit a monster
- they leave the screen
- their lifetime ends

Never keep dead projectiles in memory.

---

# 27. Entity Cleanup

Do not repeatedly use expensive array operations inside nested loops if avoidable.

Mark entities:

```javascript
entity.active = false;
```

Then clean them after update.

Example:

```javascript
projectiles = projectiles.filter(p => p.active);
```

The number of entities is intentionally small, so a simple strategy is acceptable.

---

# 28. Maximum Entity Counts

Keep entity counts intentionally small.

Recommended maximum:

```text
Players: 2
Monsters at once: 8
Projectiles at once: approximately 20
Particles: optional, maximum approximately 30
```

There is no reason to spawn dozens or hundreds of enemies.

---

# 29. Collision System

`systems/collision.js`

Use simple AABB rectangle collision.

Example:

```javascript
function overlaps(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}
```

Do not use a physics engine.

---

# 30. Collision Optimization

Because entity counts are small, simple loops are sufficient.

Do not add:

- quadtree
- spatial hash
- physics library

unless performance measurements demonstrate an actual need.

Premature optimization should be avoided.

---

# 31. Damage Cooldown

Players should not lose all HP immediately while touching a monster.

After damage, give temporary invincibility.

Recommended:

```text
0.8–1.0 seconds
```

During invincibility, briefly blink the player.

---

# 32. Player Death

When HP reaches zero:

```text
PLAYER DOWN
```

The player temporarily disappears or becomes inactive.

After approximately:

```text
3 seconds
```

respawn with full HP.

If both players are down simultaneously:

```text
restart current stage
```

Do not restart the whole game.

---

# 33. `systems/stage.js`

Responsible for:

- stage definitions
- monster spawning
- stage completion
- transitioning to quiz mode
- loading the next stage

Stage data itself belongs in:

```text
js/data/stages.js
```

---

# 34. `data/stages.js`

Do not hard-code each stage across multiple files.

Example structure:

```javascript
export const STAGES = [
    {
        id: 1,
        name: "입력과 출력의 숲",
        background: "stage1",
        monsters: [
            "print()",
            "input()",
            "int()"
        ]
    },

    {
        id: 2,
        name: "연산자의 동굴",
        background: "stage2",
        monsters: [
            "+",
            "-",
            "*",
            "//",
            "%",
            "==",
            "and",
            "or"
        ]
    }
];
```

This allows easy stage editing without touching engine code.

---

# 35. Stage Themes

Use:

## Stage 1

`입력과 출력의 숲`

Concepts:

- variables
- print
- input
- int

---

## Stage 2

`연산자의 동굴`

Concepts:

- arithmetic operators
- string operations
- comparison operators
- logical operators

---

## Stage 3

`조건문의 성`

Concepts:

- if
- elif
- else

---

## Stage 4

`반복문의 탑`

Concepts:

- while
- for

---

# 36. Teacher Event

When all monsters in a stage are defeated:

1. stop normal player movement
2. stop monster updates
3. change game state to `QUIZ`
4. display `명빈T`
5. show teacher dialog
6. open the quiz

Do not keep the gameplay simulation running behind the quiz.

---

# 37. Teacher Name

The teacher NPC must always be displayed as:

```text
명빈T
```

Do not rename it.

---

# 38. `systems/quiz.js`

Responsible for:

- finding valid questions
- choosing a random question
- showing choices
- checking answers
- handling correct answer
- handling incorrect answer
- final quiz sequence

Quiz data belongs only in:

```text
js/data/questions.js
```

Do not hard-code questions into UI or gameplay code.

---

# 39. `data/questions.js`

Question format:

```javascript
export const QUESTIONS = [
    {
        id: "s1-q1",
        stage: 1,
        question: "Which command displays text?",
        code: "",
        choices: [
            "input()",
            "print()",
            "int()",
            "if"
        ],
        answer: 1
    }
];
```

`answer` is the zero-based correct answer index.

---

# 40. Question Rules

Questions should only use concepts students have learned.

Allowed concepts include:

- comments
- variables
- print
- input
- int
- arithmetic operators
- string operations
- comparison operators
- logical operators
- if
- elif
- else
- while
- for

Do not include:

- functions
- advanced lists
- classes
- dictionaries
- exception handling

unless explicitly requested later.

---

# 41. English Coding Style

Programming examples and input/output strings should preferably use English because the programming lessons use English-based inputs and outputs.

Examples:

```python
name = input("Enter name: ")
print("Hello", name)
```

Korean may be used for game instructions and explanations.

---

# 42. Wrong Answer Behavior

When the student chooses a wrong answer:

```text
WRONG!
다시 생각해 보세요!
```

Then choose another question from the same stage.

Avoid immediately repeating the same question where possible.

---

# 43. Correct Answer Behavior

When the student chooses the correct answer:

```text
CORRECT!
STAGE CLEAR!
```

Then move to the next stage.

---

# 44. Final Quiz

After Stage 4:

- start final quiz
- ask 3 questions
- questions may be selected from all stages
- avoid duplicate questions
- game clears after all required final questions are answered correctly

Keep the implementation simple.

---

# 45. HUD Updates

HUD elements should be cached once.

Example:

```javascript
const p1HpElement = document.querySelector("#p1-hp");
```

Do not repeatedly run:

```javascript
document.querySelector()
```

inside every animation frame.

Only update HUD DOM when the value actually changes.

Example:

```text
HP changed
→ update heart display

HP unchanged
→ do nothing
```

---

# 46. DOM Performance

Never update DOM every frame unless necessary.

Gameplay entities are Canvas objects.

DOM updates should primarily occur when:

- HP changes
- stage changes
- quiz begins
- quiz ends
- game state changes

---

# 47. Canvas Size

Use a fixed logical coordinate system:

```text
1280 × 720
```

CSS may scale the Canvas visually.

Set the internal Canvas width and height separately from CSS size.

This makes gameplay calculations consistent across devices.

---

# 48. Responsive Scaling

Game wrapper should fit inside the browser viewport.

Recommended:

```css
.game-wrapper {
    width: min(100%, 1280px);
    aspect-ratio: 16 / 9;
}
```

Avoid resizing the internal game world whenever the browser changes size.

Scale the Canvas using CSS.

---

# 49. Device Target

Primary environment:

- school D-bot/tablet-class device
- Chrome browser
- physical keyboard
- two students sharing one keyboard

Optimize desktop/tablet keyboard gameplay first.

Mobile touch controls are not required.

---

# 50. Browser Behavior

Disable unwanted scrolling while playing.

For gameplay keys:

```javascript
event.preventDefault();
```

Do not disable all browser shortcuts globally.

Only block keys needed for game control.

---

# 51. Audio Strategy

Audio is optional.

The MVP must not depend on sound.

If sounds are added:

- preload only small effects
- do not autoplay music before user interaction
- keep files compressed
- reuse Audio objects
- provide mute control if necessary

Never create a new audio object for every attack.

---

# 52. Visual Effects

Optional effects:

- tiny hit flash
- very short screen shake
- small particles
- stage clear sparkle

Keep them lightweight.

Do not introduce:

- shaders
- large particle systems
- WebGL frameworks

---

# 53. Pixel Art Direction

Style:

```text
cute retro pixel RPG
16-bit inspired
clean code-themed monsters
dark dungeon UI
bright player characters
```

Avoid copying a specific commercial game's assets.

Original or generic pixel-art styling should be used.

---

# 54. Development Order

Follow this development order.

## Phase 1 — Skeleton

Create:

```text
index.html
css/
js/
assets/
```

Ensure the static project runs.

---

## Phase 2 — Core Canvas

Implement:

- Canvas
- game loop
- Player 1
- Player 2
- movement

Do not add visual polish yet.

---

## Phase 3 — Combat

Implement:

- direction
- attack
- projectile
- monsters
- collision
- damage
- respawn

---

## Phase 4 — Stage Logic

Implement:

- stage configuration
- spawn rules
- stage completion
- stage transition

---

## Phase 5 — Quiz

Implement:

- teacher event
- quiz modal
- random question
- answer checking
- next stage

---

## Phase 6 — Final Quiz

Implement final 3-question sequence.

---

## Phase 7 — Visual Polish

Only after functionality is stable:

- pixel UI
- sprite images
- backgrounds
- lightweight effects

---

## Phase 8 — GitHub Pages

Verify:

- relative paths work
- no localhost references
- no server required
- GitHub Pages deployment works

---

# 55. MVP First Rule

Do not spend time creating images before the game is playable.

Use Canvas placeholders first.

For example:

Player 1:

```text
blue square
```

Player 2:

```text
yellow square
```

Monster:

```text
dark box + programming label
```

Teacher:

```text
simple pixel-style placeholder
```

Replace them later.

---

# 56. Loading Screen

If asset loading is noticeable, display:

```text
LOADING...
```

Do not leave a blank screen.

However, avoid building an elaborate loading system.

---

# 57. Asset Error Handling

If an image fails to load:

- log a warning
- use fallback Canvas shapes
- continue the game

The game must not crash because one decorative asset is missing.

---

# 58. Error Handling

The user should never see raw JavaScript stack traces.

Use console errors for development.

Keep runtime behavior resilient.

---

# 59. GitHub Pages Path Rules

Use relative paths.

Correct:

```text
./assets/sprites/players.png
```

Avoid:

```text
/assets/sprites/players.png
```

because repository sub-path deployment can break absolute root paths.

---

# 60. Repository Naming

Recommended repository names:

```text
code-quest
coding-dungeon
pixel-code-quest
```

Do not include:

```text
chatgpt
gpt
openai
```

in the repository or visible game branding.

---

# 61. Performance Checklist

Before considering the MVP complete, verify:

- only one animation loop exists
- requestAnimationFrame is used
- images are cached
- no images are created inside render loops
- no network requests occur during gameplay
- no unnecessary querySelector calls occur inside animation loops
- monster count stays small
- projectile count is cleaned regularly
- DOM is not used for game entities
- backgrounds are compressed
- relative paths work
- no console errors occur
- Chrome runs the game smoothly

---

# 62. Code Quality

Prefer readable code over advanced architecture.

Function names should clearly describe behavior.

Examples:

```javascript
startStage()
spawnMonsters()
updatePlayers()
updateProjectiles()
checkCollisions()
startTeacherQuiz()
advanceStage()
```

Avoid unnecessarily abstract names.

---

# 63. Comments

Add comments where they help future maintenance.

Do not comment every trivial line.

Useful comments include:

- game state transition
- collision behavior
- asset preload logic
- quiz flow
- stage progression

---

# 64. Development Safety

Before making large changes:

1. inspect the current project structure
2. understand existing behavior
3. modify only necessary files
4. preserve working functionality
5. test again

Do not rewrite the whole project merely to implement a small feature.

---

# 65. Testing Checklist

Test both players simultaneously.

## Player 1

```text
W
A
S
D
F
```

## Player 2

```text
ArrowUp
ArrowDown
ArrowLeft
ArrowRight
L
```

Verify that simultaneous input works.

Examples:

```text
W + ArrowRight
A + ArrowUp
F + L
```

must work correctly.

---

# 66. Stage Testing

Verify:

```text
Stage 1
→ monsters
→ teacher
→ quiz
→ Stage 2

Stage 2
→ quiz
→ Stage 3

Stage 3
→ quiz
→ Stage 4

Stage 4
→ final quiz
→ clear
```

---

# 67. MVP Completion Definition

The MVP is complete when:

- the site loads from GitHub Pages
- two players can move simultaneously
- both players can attack
- monsters move toward players
- projectiles damage monsters
- monsters can damage players
- players respawn
- a stage restarts if both players are down
- clearing monsters triggers 명빈T
- a coding quiz appears
- a correct answer advances the stage
- all four stages work
- final quiz works
- game clear screen works
- no database is used
- no server is required
- gameplay remains smooth on the target device

---

# 68. Primary Rule for Codex

When choosing between:

```text
more features
```

and

```text
simpler, faster, more stable implementation
```

always choose:

```text
simpler, faster, more stable implementation
```

unless the user explicitly requests otherwise.