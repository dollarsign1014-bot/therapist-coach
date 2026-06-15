"use client";
import { useEffect, useState } from 'react';
import { UserStats, BADGE_META, ALL_BADGES } from '@/lib/session';
interface LeaderboardEntry { username: string; points: number; streak: number; sessions: number; badges: string[]; }
interface Props { username: string; userStats: UserStats | null; messageCount: number; }
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (<div className="flex flex-col gap-0.5"><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span><span className="text-xl font-bold" style={{ color: 'var(--cyan)' }}>{value}</span>{sub && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</span>}</div>);
}
function getMessageProgress(total: number) {
  const milestones = [10, 25, 50, 100, 200, 500];
  for (const m of milestones) { if (total < m) { const prev = milestones[milestones.indexOf(m) - 1] ?? 0; return { label: `${total} / ${m} messages`, current: total - prev, target: m - prev }; } }
  const tier = Math.floor(total / 100) * 100;
  return { label: `${total} messages`, current: total - tier, target: 100 };
}
export default function GamificationSidebar({ username, userStats, messageCount }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  async function fetchLeaderboard() {
    try { const res = await fetch('/api/leaderboard'); if (res.ok) { const data = await res.json(); setLeaderboard(data.leaderboard || []); } }
    catch {} finally { setLoadingBoard(false); }
  }
  useEffect(() => { fetchLeaderboard(); const interval = setInterval(fetchLeaderboard, 30000); return () => clearInterval(interval); }, []);
  useEffect(() => { if (userStats) fetchLeaderboard(); }, [userStats?.sessions]); // eslint-disable-line react-hooks/exhaustive-deps
  const rank = leaderboard.findIndex((e) => e.username === username.toLowerCase()) + 1;
  const earnedBadges = userStats?.badges ?? [];
  const msgProgress = getMessageProgress(messageCount);
  const msgPct = Math.min((msgProgress.current / msgProgress.target) * 100, 100);
  return (
    <div className="h-full overflow-y-auto flex flex-col gap-4 p-4" style={{ borderLeft: '1px solid var(--border)' }}>
      <div className="rounded-2xl p-4" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Your Stats</p>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Points" value={userStats?.points ?? 0} />
          <StatCard label="Streak" value={`${userStats?.streak ?? 0} ${(userStats?.streak ?? 0) === 1 ? 'day' : 'days'}`} sub={(userStats?.streak ?? 0) > 0 ? '🔥 keep it going' : 'Start today'} />
          <StatCard label="Sessions" value={userStats?.sessions ?? 0} />
          <StatCard label="Rank" value={rank > 0 ? `#${rank}` : '—'} sub="global leaderboard" />
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Chat progress</span>
            <span className="text-xs font-medium" style={{ color: 'var(--cyan)' }}>{msgProgress.label}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${msgPct}%`, background: 'var(--cyan)' }} />
          </div>
        </div>
      </div>
      <div className="rounded-2xl p-4" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Badges</p>
        <div className="flex flex-col gap-2">
          {ALL_BADGES.map((key) => { const earned = earnedBadges.includes(key); const meta = BADGE_META[key]; return (<div key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: earned ? 'rgba(34,211,238,0.08)' : 'transparent', border: `1px solid ${earned ? 'rgba(34,211,238,0.25)' : 'var(--border)'}`, opacity: earned ? 1 : 0.4 }}><span>{meta.emoji}</span><span style={{ color: earned ? 'var(--text-primary)' : 'var(--text-muted)' }}>{meta.label}</span></div>); })}
        </div>
      </div>
      <div className="rounded-2xl p-4 flex-1" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Leaderboard</p>
        {loadingBoard ? (<div className="flex flex-col gap-2">{[...Array(5)].map((_, i) => (<div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />))}</div>)
        : leaderboard.length === 0 ? (<p className="text-sm" style={{ color: 'var(--text-muted)' }}>No one here yet. Be the first!</p>)
        : (<div className="flex flex-col gap-1.5">{leaderboard.map((entry, i) => { const isMe = entry.username === username.toLowerCase(); const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null; return (<div key={entry.username} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: isMe ? 'rgba(34,211,238,0.08)' : 'transparent', border: `1px solid ${isMe ? 'rgba(34,211,238,0.25)' : 'transparent'}` }}><span className="w-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{medal ?? `${i + 1}`}</span><span className="flex-1 font-medium truncate" style={{ color: isMe ? 'var(--cyan)' : 'var(--text-primary)' }}>{entry.username}{isMe && <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>(you)</span>}</span><span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{entry.points} pts</span></div>); })}</div>)}
      </div>
      <p className="text-xs text-center pb-2" style={{ color: 'var(--text-muted)' }}>+30 pts per session · +50 streak bonus</p>
    </div>
  );
}
