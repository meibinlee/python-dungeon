import { PLAYER_1_KEYS, PLAYER_2_KEYS } from './config.js';

export class Input {
  constructor() {
    this.keys = new Set();
    this.enabled = false;
    const controls = new Set([...Object.values(PLAYER_1_KEYS), ...Object.values(PLAYER_2_KEYS), 'Space']);
    window.addEventListener('keydown', event => {
      if (!this.enabled || event.ctrlKey || event.metaKey || event.altKey || !controls.has(event.code)) return;
      event.preventDefault();
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', event => {
      if (this.enabled && controls.has(event.code) && !event.ctrlKey && !event.metaKey && !event.altKey) event.preventDefault();
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => this.clear());
    document.addEventListener('visibilitychange', () => this.clear());
  }
  isDown(code) { return this.keys.has(code); }
  clear() { this.keys.clear(); }
  setEnabled(enabled) { this.enabled = enabled; this.clear(); }
}
