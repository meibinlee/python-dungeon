import { QUESTIONS } from '../data/questions.js';
import { randomItem, shuffled } from '../core/utils.js';
import { STAGES } from '../data/stages.js';

export function validateQuestions(questions) {
  if (questions.length < 4) throw new Error('최종 퀴즈와 오답 교체를 위해 최소 4문제가 필요합니다.');
  const ids = new Set();
  const prompts = new Set();
  const codes = new Set();
  const stages = new Set(STAGES.map(stage => stage.id));
  for (const question of questions) {
    if (!question.id || ids.has(question.id) || !stages.has(question.stage) ||
        typeof question.question !== 'string' || !question.question.trim() ||
        typeof question.code !== 'string' || !Array.isArray(question.choices) || question.choices.length !== 4 ||
        question.choices.some(choice => typeof choice !== 'string' || !choice.trim()) ||
        new Set(question.choices.map(choice => choice.trim())).size !== 4 ||
        !Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3 ||
        (question.explanation !== undefined && typeof question.explanation !== 'string')) {
      throw new Error(`문제 데이터 형식 오류: ${question.id || '(ID 없음)'}`);
    }
    ids.add(question.id);
    const prompt = question.question.trim().replace(/\s+/g,' ').toLowerCase();
    const code = question.code.trim();
    if (prompts.has(prompt) || (code && codes.has(code))) throw new Error(`중복 문제 내용: ${question.id}`);
    prompts.add(prompt);
    if (code) codes.add(code);
  }
  for (const stage of stages) {
    if (!questions.some(question => question.stage === stage)) throw new Error(`Stage ${stage} 문제가 없습니다.`);
  }
}

export class QuizSystem {
  constructor(onComplete,onCorrect = () => {}) {
    validateQuestions(QUESTIONS);
    this.resetRun();
    this.onComplete = onComplete;
    this.onCorrect = onCorrect;
    this.playerNames = ['P1','P2'];
    this.ui = Object.fromEntries(['quiz-screen','quiz-title','quiz-code','quiz-choices','quiz-feedback','quiz-progress','quiz-continue','quiz-p1','quiz-p2'].map(id => [id, document.getElementById(id)]));
    this.ui['quiz-continue'].addEventListener('click', () => this.continueQuiz());
    this.ui['quiz-p1'].addEventListener('click', () => this.chooseAnswerer(1));
    this.ui['quiz-p2'].addEventListener('click', () => this.chooseAnswerer(2));
  }
  resetRun() { this.seen = new Set(); this.questionCount=0; }
  setPlayerNames(players) { this.playerNames = players.map(player => player.nickname); }
  chooseAnswerer(id) {
    if (this.locked) return;
    this.answerer = id;
    for (let playerId=1;playerId<=2;playerId++) this.ui[`quiz-p${playerId}`].setAttribute('aria-pressed',String(playerId===id));
  }
  pickQuestion(pool) {
    const unseen = pool.filter(question => !this.seen.has(question.id));
    return randomItem(unseen.length ? unseen : pool.filter(question => question.id !== this.question?.id)) || pool[0];
  }
  startStage(stage) {
    this.final = false;
    this.pool = QUESTIONS.filter(q => q.stage === stage);
    this.stage = stage;
    this.showQuestion(this.pickQuestion(this.pool));
  }
  startFinal() {
    this.final = true;
    this.pool = [...QUESTIONS];
    this.solved = new Set();
    const unseen = this.pool.filter(question => !this.seen.has(question.id));
    const seen = this.pool.filter(question => this.seen.has(question.id));
    this.queue = [...shuffled(unseen.filter(q => q.stage >= 3)),...shuffled(unseen.filter(q => q.stage < 3)),...shuffled(seen)].slice(0,3);
    this.showQuestion(this.queue[0]);
  }
  showQuestion(question) {
    this.question = question;
    this.seen.add(question.id);
    this.locked = false;
    this.questionCount++;
    for (let id=1;id<=2;id++) {this.ui[`quiz-p${id}`].disabled=false;this.ui[`quiz-p${id}`].textContent=`P${id} ${this.playerNames[id-1]}`;}
    this.chooseAnswerer(this.questionCount%2 ? 1 : 2);
    const ui = this.ui;
    ui['quiz-screen'].hidden = false;
    ui['quiz-progress'].textContent = this.final ? `FINAL QUIZ · ${this.solved.size + 1} / 3` : `STAGE ${this.stage} · 명빈T의 코딩 퀴즈`;
    ui['quiz-title'].textContent = question.question;
    ui['quiz-code'].hidden = !question.code;
    ui['quiz-code'].textContent = question.code;
    ui['quiz-feedback'].textContent = '';
    ui['quiz-feedback'].className = 'feedback';
    ui['quiz-continue'].hidden = true;
    ui['quiz-choices'].replaceChildren();
    question.choices.forEach((choice,index) => {
      const button = document.createElement('button');
      button.type = 'button';
      const number = document.createElement('span');
      number.className = 'choice-number';
      number.textContent = ['①','②','③','④'][index];
      const value = document.createElement('span');
      value.className = 'choice-value';
      value.textContent = choice;
      button.append(number, value);
      button.addEventListener('click', () => this.checkAnswer(index));
      ui['quiz-choices'].append(button);
    });
    ui['quiz-title'].focus({ preventScroll:true });
  }
  checkAnswer(index) {
    if (this.locked) return;
    this.locked = true;
    this.ui['quiz-p1'].disabled = true;
    this.ui['quiz-p2'].disabled = true;
    this.correct = index === this.question.answer;
    for (const button of this.ui['quiz-choices'].children) button.disabled = true;
    const feedback = this.ui['quiz-feedback'];
    if (this.correct) {
      this.onCorrect(this.answerer);
      if (this.final) this.solved.add(this.question.id);
      feedback.textContent = this.final ? `CORRECT!\n${this.solved.size} / 3 문제 해결!` : 'CORRECT!\nSTAGE CLEAR!';
    } else {
      feedback.classList.add('wrong');
      feedback.textContent = 'WRONG!\n다시 생각해 보세요!';
    }
    feedback.textContent += `\n정답: ${['①','②','③','④'][this.question.answer]} ${this.question.choices[this.question.answer]}`;
    if (this.question.explanation) feedback.textContent += `\n${this.question.explanation}`;
    const next = this.ui['quiz-continue'];
    next.textContent = this.correct ? (this.final && this.solved.size < 3 ? '다음 문제' : '계속하기') : '다른 문제 도전';
    next.hidden = false;
    next.focus({ preventScroll:true });
  }
  continueQuiz() {
    if (!this.locked) return;
    if (this.correct && (!this.final || this.solved.size === 3)) {
      this.hide(); this.onComplete(this.final); return;
    }
    if (!this.correct) {
      // Final retries replace only the current slot; solved/future questions stay unique.
      const excluded = new Set([this.question.id]);
      if (this.final) {
        for (const id of this.solved) excluded.add(id);
        for (const question of this.queue.slice(1)) excluded.add(question.id);
      }
      const candidates = this.pool.filter(q => !excluded.has(q.id));
      const next = this.pickQuestion(candidates) || this.question;
      if (this.final) this.queue[0] = next;
      this.showQuestion(next);
    } else {
      this.queue.shift();
      this.showQuestion(this.queue[0]);
    }
  }
  hide() { this.ui['quiz-screen'].hidden = true; }
}
