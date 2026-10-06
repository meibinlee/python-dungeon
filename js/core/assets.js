// MVP has no image requests. Populate these manifests only when actual assets exist.
export const ESSENTIAL_ASSETS = {};
export const LATER_ASSETS = {};
export class Assets {
  constructor() { this.images = new Map(); this.pending = new Map(); }
  get(name) { return this.images.get(name); }
  load(name, path) {
    if (this.images.has(name)) return Promise.resolve(this.images.get(name));
    if (this.pending.has(name)) return this.pending.get(name);
    const promise = new Promise(resolve => {
      const image = new Image();
      image.onload = () => { this.images.set(name, image); resolve(image); };
      image.onerror = () => { console.warn(`Asset unavailable: ${path}; using Canvas fallback.`); resolve(null); };
      image.src = path;
    });
    this.pending.set(name, promise);
    return promise;
  }
  preload(manifest) { return Promise.all(Object.entries(manifest).map(([name,path]) => this.load(name,path))); }
}
