// Shared TOP 10 leaderboard (v1.7.0; was TOP 5 in v1.5.0) stored in Supabase.
// The database keeps at most 10 rows: the code_quest_submit_score() SQL function inserts a record and
// immediately deletes everything outside the top 10 (see supabase/code-quest-top5.sql).
// Players can only call that function and read the table; they cannot edit or delete rows.
// Network is used only on the final CLEAR screen, never during gameplay.
import { LEADERBOARD } from '../core/config.js?v=20261125-noboard';

const TIMEOUT_MS = 6000;

export function leaderboardEnabled() { return Boolean(LEADERBOARD.url && LEADERBOARD.key); }

// 2P → "닉네임1/닉네임2", 1P → "닉네임".
export function recordName(players) { return players.map(player => player.nickname).join('/'); }

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${LEADERBOARD.url}/rest/v1/${path}`, {
      ...options,
      signal:controller.signal,
      headers:{ apikey:LEADERBOARD.key, 'Content-Type':'application/json', ...options.headers }
    });
    if (!response.ok) throw new Error(`leaderboard ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

// Returns { id, top:[{ id, name, score, players }] } — id is the new row (null if it did not make the top 10).
export async function submitScore(name, score, players) {
  return request('rpc/code_quest_submit_score', { method:'POST', body:JSON.stringify({ p_name:name, p_score:Math.round(score), p_players:players }) });
}

export async function fetchTop() {
  return request('code_quest_top5?select=id,name,score,players&order=score.desc,created_at.asc&limit=10');
}
