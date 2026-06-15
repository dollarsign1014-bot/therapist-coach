import fs from 'fs';
import path from 'path';
import os from 'os';
import { UserStats } from './session';

interface UserRecord extends UserStats { username: string; lastSessionDate: string | null; }
export interface LeaderboardEntry { username: string; points: number; streak: number; sessions: number; badges: string[]; }

const STORE_KEY = 'tc:store';
const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

declare global { var __tcStore: Record<string, UserRecord> | undefined; }

function getFilePath() {
  try { const dir = path.join(process.cwd(), 'data'); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); return path.join(dir, 'leaderboard.json'); }
  catch { return path.join(os.tmpdir(), 'tc-leaderboard.json'); }
}

function readLocalStore(): Record<string, UserRecord> {
  if (globalThis.__tcStore) return globalThis.__tcStore;
  try { const raw = fs.readFileSync(getFilePath(), 'utf-8').trim(); globalThis.__tcStore = JSON.parse(raw); return globalThis.__tcStore!; }
  catch { globalThis.__tcStore = {}; return {}; }
}

function writeLocalStore(store: Record<string, UserRecord>) {
  globalThis.__tcStore = store;
  try { fs.writeFileSync(getFilePath(), JSON.stringify(store, null, 2), 'utf-8'); } catch {}
}

async function readStore(): Promise<Record<string, UserRecord>> {
  if (hasRedis) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
    return (await redis.get<Record<string, UserRecord>>(STORE_KEY)) ?? {};
  }
  return readLocalStore();
}

async function writeStore(store: Record<string, UserRecord>) {
  if (hasRedis) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
    await redis.set(STORE_KEY, store); return;
  }
  writeLocalStore(store);
}

export async function recordSession(username: string, date: string): Promise<UserStats> {
  const store = await readStore();
  const key = username.toLowerCase();
  const existing: UserRecord = store[key] ?? { username: key, points: 0, streak: 0, sessions: 0, badges: [], lastSessionDate: null };
  if (existing.lastSessionDate === date) return { points: existing.points, streak: existing.streak, sessions: existing.sessions, badges: existing.badges };
  let isConsecutive = false;
  if (existing.lastSessionDate) { const yesterday = new Date(date); yesterday.setDate(yesterday.getDate() - 1); isConsecutive = existing.lastSessionDate === yesterday.toISOString().split('T')[0]; }
  const newStreak = isConsecutive ? existing.streak + 1 : 1;
  const newPoints = existing.points + 30 + (isConsecutive ? 50 : 0);
  const newSessions = existing.sessions + 1;
  const badges = new Set(existing.badges);
  if (newSessions >= 1) badges.add('first_session');
  if (newStreak >= 5) badges.add('5_day_streak');
  if (newStreak >= 10) badges.add('10_day_streak');
  if (newSessions >= 25) badges.add('25_sessions');
  const updated: UserRecord = { username: key, points: newPoints, streak: newStreak, sessions: newSessions, badges: Array.from(badges), lastSessionDate: date };
  store[key] = updated;
  await writeStore(store);
  return { points: newPoints, streak: newStreak, sessions: newSessions, badges: Array.from(badges) };
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const store = await readStore();
  return Object.values(store).sort((a, b) => b.points - a.points).slice(0, 20).map(({ username, points, streak, sessions, badges }) => ({ username, points, streak, sessions, badges }));
}
