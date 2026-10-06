export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const randomItem = items => items[Math.floor(Math.random() * items.length)];
export function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
