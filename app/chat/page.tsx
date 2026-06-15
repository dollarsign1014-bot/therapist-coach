"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUsername, getUserStats, getMessageCount, UserStats } from "@/lib/session";
import ChatInterface from "@/components/ChatInterface";
import GamificationSidebar from "@/components/GamificationSidebar";

export default function ChatPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const u = getUsername();
    if (!u) { router.replace("/"); return; }
    setUsername(u);
    setUserStats(getUserStats());
    setMessageCount(getMessageCount());
  }, [router]);

  const handleStatsUpdated = useCallback((stats: UserStats) => setUserStats(stats), []);
  const handleMessageSent = useCallback((count: number) => setMessageCount(count), []);

  if (!username) return (
    <div className="flex h-full items-center justify-center" style={{ background: "var(--navy)" }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--cyan)", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--navy)" }}>
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--panel)" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: "var(--cyan)", color: "var(--navy)" }}>TC</div>
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Therapist Coach</span>
        </div>
        <div className="flex items-center gap-3">
          {userStats && userStats.streak > 0 && <span className="text-sm font-medium" style={{ color: "var(--orange)" }}>🔥 {userStats.streak}-day streak</span>}
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{username.charAt(0).toUpperCase() + username.slice(1)}</span>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col" style={{ width: "70%" }}>
          <ChatInterface username={username} onStatsUpdated={handleStatsUpdated} onMessageSent={handleMessageSent} />
        </div>
        <div style={{ width: "30%" }}>
          <GamificationSidebar username={username} userStats={userStats} messageCount={messageCount} />
        </div>
      </div>
    </div>
  );
}
