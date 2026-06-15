"use client";
import { motion } from 'framer-motion';
export default function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-start">
      <span className="text-xs mb-1 px-1" style={{ color: 'var(--text-muted)' }}>Coach</span>
      <div className="px-4 py-3 flex gap-1.5 items-center" style={{ background: 'var(--bubble-coach)', borderRadius: '1rem 1rem 1rem 0.25rem', border: '1px solid var(--border)' }}>
        {[0, 1, 2].map((i) => (<motion.span key={i} className="block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)' }} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} />))}
      </div>
    </motion.div>
  );
}
