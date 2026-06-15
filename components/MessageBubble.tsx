"use client";
import { motion } from 'framer-motion';
interface Message { id: string; role: 'user' | 'coach'; text: string; }
interface Props { message: Message; index: number; }
export default function MessageBubble({ message, index }: Props) {
  const isUser = message.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {!isUser && <span className="text-xs mb-1 px-1" style={{ color: 'var(--text-muted)' }}>Coach</span>}
      <div className="max-w-[80%] px-4 py-3 text-sm leading-relaxed" style={{ background: isUser ? 'var(--bubble-user)' : 'var(--bubble-coach)', color: 'var(--text-primary)', borderRadius: isUser ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', border: isUser ? 'none' : '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.text}</div>
    </motion.div>
  );
}
export type { Message };
