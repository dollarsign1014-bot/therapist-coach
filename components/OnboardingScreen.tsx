"use client";
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { setUsername, setZipCode, getSessionId } from '@/lib/session';

export default function OnboardingScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [zip, setZip] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) { setError('Please enter at least 2 characters.'); return; }
    const zipTrimmed = zip.trim();
    if (zipTrimmed && !/^\d{5}$/.test(zipTrimmed)) { setError('Zip code must be 5 digits.'); return; }
    setUsername(trimmed);
    if (zipTrimmed) setZipCode(zipTrimmed);
    getSessionId();
    router.push('/chat');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--navy)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>TC</div>
            <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Therapist Coach</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>You don&apos;t have to figure it out alone.</h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>Talk it through. Find support. Take one step forward.</p>
        </div>
        <div className="rounded-2xl p-8" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>What should Coach call you?</label>
              <input id="username" type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} placeholder="Enter your name" autoFocus autoComplete="off" maxLength={30} className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all duration-150" style={{ background: 'var(--navy)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} onFocus={(e) => (e.target.style.borderColor = 'var(--cyan)')} onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
              {error && <p className="mt-2 text-sm" style={{ color: '#F87171' }}>{error}</p>}
            </div>
            <div>
              <label htmlFor="zipcode" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Your zip code <span className="text-xs font-normal" style={{ opacity: 0.6 }}>(optional — helps find therapists near you)</span></label>
              <input id="zipcode" type="text" inputMode="numeric" value={zip} onChange={(e) => { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)); setError(''); }} placeholder="e.g. 90210" autoComplete="postal-code" maxLength={5} className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all duration-150" style={{ background: 'var(--navy)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} onFocus={(e) => (e.target.style.borderColor = 'var(--cyan)')} onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <button type="submit" className="w-full rounded-xl py-3 text-base font-semibold transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>Start Talking to Coach →</button>
          </form>
          <p className="mt-6 text-xs text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>No account. No login. Just you and Coach.<br />If you&apos;re in crisis, call or text <span style={{ color: 'var(--cyan)' }} className="font-medium">988</span> anytime.</p>
        </div>
        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Join others already building their streak 🔥</p>
      </motion.div>
    </div>
  );
}
