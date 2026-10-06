import { PLAYER_1_KEYS, PLAYER_2_KEYS } from './config.js';

export class Input {
  constructor() {
    this.keys = new Set();
    this.enabled = false;
    this.pauseEnabled = false;
    const controls = new Set([...Object.values(PLAYER_1_KEYS), ...Object.values(PLAYER_2_KEYS), 'Space']);
    window.addEventListener('keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.code === 'Escape' && this.pauseEnabled) {
        event.preventDefault();
        if (!event.repeat) this.onPause?.();
        return;
      }
      if (!this.enabled || !controls.has(event.code)) return;
      event.preventDefault();
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', event => {
      if (this.enabled && controls.has(event.code) && !event.ctrlKey && !event.metaKey && !event.altKey) event.preventDefault();
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => { this.clear(); this.onInactive?.(); });
    document.addEventListener('visibilitychange', () => {
      this.clear();
      if (document.hidden) this.onInactive?.();
    });
  }
  isDown(code) { return this.keys.has(code); }
  clear() { this.keys.clear(); }
  setEnabled(enabled, pauseEnabled = false) { this.enabled = enabled; this.pauseEnabled = pauseEnabled; this.clear(); }
}
