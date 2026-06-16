"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import MessageBubble, { Message } from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import {
  getSessionId,
  getZipCode,
  getLastSessionDate,
  setLastSessionDate,
  getTodayISO,
  getUserStats,
  setUserStats,
  getMessageCount,
  bumpMessageCount,
  UserStats,
} from "@/lib/session";

interface Props {
  username: string;
  onStatsUpdated: (stats: UserStats) => void;
  onMessageSent: (count: number) => void;
}

const STARTERS = [
  "I've been feeling really anxious lately.",
  "I'm not sure where to start.",
  "I need help finding a therapist.",
  "I've been struggling with stress at work.",
];

export default function ChatInterface({ username, onStatsUpdated, onMessageSent }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isRecordingSession = useRef(false);
  const hasRecordedToday = useRef(false);

  useEffect(() => {
    if (getLastSessionDate() === getTodayISO()) {
      hasRecordedToday.current = true;
    }
    const cached = getUserStats();
    if (cached) onStatsUpdated(cached);
  }, [onStatsUpdated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function recordSession() {
    if (isRecordingSession.current || hasRecordedToday.current) return;
    isRecordingSession.current = true;
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, date: getTodayISO() }),
      });
      if (res.ok) {
        const stats: UserStats = await res.json();
        setLastSessionDate(getTodayISO());
        setUserStats(stats);
        onStatsUpdated(stats);
        hasRecordedToday.current = true;
      }
    } catch {
      // session recording is non-blocking
    } finally {
      isRecordingSession.current = false;
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError("");
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (!hasRecordedToday.current) {
      recordSession();
    }

    try {
      const sessionId = getSessionId();
      const zipCode = getZipCode();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId, zipCode }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Try again.");
      } else {
        const coachMsg: Message = { id: crypto.randomUUID(), role: "coach", text: data.output };
        setMessages((prev) => [...prev, coachMsg]);
        onMessageSent(bumpMessageCount());
      }
    } catch {
      setError("Couldn't connect to Coach. Make sure n8n is running.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex-shrink-0 text-center py-2 px-4 text-xs"
        style={{
          background: "var(--panel)",
          borderBottom: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        If you&apos;re in crisis, call or text{" "}
        <a href="tel:988" className="font-semibold" style={{ color: "var(--cyan)" }}>988</a>{" "}
        (Suicide &amp; Crisis Lifeline) &middot;{" "}
        <a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--text-muted)" }}>988lifeline.org</a>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        {isEmpty && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center py-12">
            <div>
              <p className="text-base font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Hey {username.charAt(0).toUpperCase() + username.slice(1)} 👋
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                What&apos;s on your mind today? Start talking — no judgment here.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm px-4 py-2.5 rounded-xl transition-colors duration-150"
                  style={{
                    background: "var(--panel)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--cyan)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={msg.id} message={msg} index={i} />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <div
            className="text-sm px-4 py-3 rounded-xl"
            style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div
        className="flex-shrink-0 px-4 py-3 flex gap-3 items-end"
        style={{ borderTop: "1px solid var(--border)", background: "var(--panel)" }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150"
          style={{
            background: "var(--navy)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            maxHeight: "120px",
            overflowY: "auto",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--cyan)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="flex-shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150"
          style={{
            background: input.trim() && !isLoading ? "var(--cyan)" : "var(--border)",
            color: input.trim() && !isLoading ? "var(--navy)" : "var(--text-muted)",
            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
