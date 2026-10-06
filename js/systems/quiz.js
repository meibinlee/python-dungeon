import { QUESTIONS } from '../data/questions.js';
import { randomItem, shuffled } from '../core/utils.js';

export class QuizSystem {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.ui = Object.fromEntries(['quiz-screen','quiz-title','quiz-code','quiz-choices','quiz-feedback','quiz-progress','quiz-continue'].map(id => [id, document.getElementById(id)]));
    this.ui['quiz-continue'].addEventListener('click', () => this.continueQuiz());
  }
  startStage(stage) {
    this.final = false;
    this.pool = QUESTIONS.filter(q => q.stage === stage);
    this.stage = stage;
    this.showQuestion(randomItem(this.pool));
  }
  startFinal() {
    this.final = true;
    this.pool = [...QUESTIONS];
    this.solved = new Set();
    this.queue = shuffled(this.pool).slice(0,3);
    this.showQuestion(this.queue[0]);
  }
  showQuestion(question) {
    this.question = question;
    this.locked = false;
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
      button.textContent = `${index + 1}. ${choice}`;
      button.addEventListener('click', () => this.checkAnswer(index));
      ui['quiz-choices'].append(button);
    });
    ui['quiz-title'].focus({ preventScroll:true });
  }
  checkAnswer(index) {
    if (this.locked) return;
    this.locked = true;
    this.correct = index === this.question.answer;
    for (const button of this.ui['quiz-choices'].children) button.disabled = true;
    const feedback = this.ui['quiz-feedback'];
    if (this.correct) {
      if (this.final) this.solved.add(this.question.id);
      feedback.textContent = this.final ? `CORRECT!\n${this.solved.size} / 3 문제 해결!` : 'CORRECT!\nSTAGE CLEAR!';
    } else {
      feedback.classList.add('wrong');
      feedback.textContent = 'WRONG!\n다시 생각해 보세요!';
    }
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
      const next = randomItem(candidates) || this.question;
      if (this.final) this.queue[0] = next;
      this.showQuestion(next);
    } else {
      this.queue.shift();
      this.showQuestion(this.queue[0]);
    }
  }
  hide() { this.ui['quiz-screen'].hidden = true; }
}
