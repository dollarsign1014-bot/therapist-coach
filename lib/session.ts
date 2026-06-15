export interface UserStats { points: number; streak: number; sessions: number; badges: string[]; }
const KEYS = { username: 'tc_username', sessionId: 'tc_session_id', lastSessionDate: 'tc_last_session_date', userStats: 'tc_user_stats', zipCode: 'tc_zip_code', messageCount: 'tc_message_count' } as const;
function isBrowser() { return typeof window !== 'undefined'; }
export function getUsername() { if (!isBrowser()) return null; return localStorage.getItem(KEYS.username); }
export function setUsername(name: string) { if (!isBrowser()) return; localStorage.setItem(KEYS.username, name.trim().toLowerCase()); }
export function getSessionId() { if (!isBrowser()) return ''; let id = localStorage.getItem(KEYS.sessionId); if (!id) { id = crypto.randomUUID(); localStorage.setItem(KEYS.sessionId, id); } return id; }
export function getLastSessionDate() { if (!isBrowser()) return null; return localStorage.getItem(KEYS.lastSessionDate); }
export function setLastSessionDate(date: string) { if (!isBrowser()) return; localStorage.setItem(KEYS.lastSessionDate, date); }
export function getTodayISO() { return new Date().toISOString().split('T')[0]; }
export function getUserStats(): UserStats | null { if (!isBrowser()) return null; const raw = localStorage.getItem(KEYS.userStats); if (!raw) return null; try { return JSON.parse(raw) as UserStats; } catch { return null; } }
export function setUserStats(stats: UserStats) { if (!isBrowser()) return; localStorage.setItem(KEYS.userStats, JSON.stringify(stats)); }
export function getMessageCount() { if (!isBrowser()) return 0; return parseInt(localStorage.getItem(KEYS.messageCount) ?? '0', 10); }
export function bumpMessageCount() { if (!isBrowser()) return 0; const next = getMessageCount() + 1; localStorage.setItem(KEYS.messageCount, String(next)); return next; }
export function getZipCode() { if (!isBrowser()) return null; return localStorage.getItem(KEYS.zipCode); }
export function setZipCode(zip: string) { if (!isBrowser()) return; localStorage.setItem(KEYS.zipCode, zip.trim()); }
export function clearAll() { if (!isBrowser()) return; Object.values(KEYS).forEach((k) => localStorage.removeItem(k)); }
export const BADGE_META: Record<string, { label: string; emoji: string }> = { first_session: { label: 'First Session', emoji: '🌱' }, '5_day_streak': { label: '5-Day Streak', emoji: '🔥' }, '10_day_streak': { label: '10-Day Streak', emoji: '⚡' }, '25_sessions': { label: '25 Sessions', emoji: '🏆' } };
export const ALL_BADGES = Object.keys(BADGE_META);
