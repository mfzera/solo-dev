'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false })
const CustomCursor = dynamic(() => import('@/components/CustomCursor'), { ssr: false })

// ── Easing ───────────────────────────────────────────────────────────────────
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

// ── Magnetic button hook ─────────────────────────────────────────────────────
function useMagnetic(strength = 0.35) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18 })
  const sy = useSpring(y, { stiffness: 220, damping: 18 })
  const ref = useRef<HTMLDivElement>(null)

  const onMouseMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const onMouseLeave = () => { x.set(0); y.set(0) }

  return { ref, sx, sy, onMouseMove, onMouseLeave }
}

// ── Glitch word ──────────────────────────────────────────────────────────────
function GlitchWord({ children }: { children: string }) {
  const [active, setActive] = useState(false)

  return (
    <span
      className="relative inline-block"
      style={{ color: '#c0392b' }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {children}
      {active && (
        <>
          <span className="glitch-layer-1 absolute inset-0" aria-hidden>{children}</span>
          <span className="glitch-layer-2 absolute inset-0" aria-hidden>{children}</span>
        </>
      )}
    </span>
  )
}

// ── Masked line reveal ───────────────────────────────────────────────────────
function RevealLine({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: '105%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay }}
      >
        {children}
      </motion.div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const magnetic = useMagnetic(0.32)
  const bgRef = useRef<HTMLDivElement>(null)

  // Mouse-tracked radial light on the background layer — direct DOM for perf
  useEffect(() => {
    const base = '#F5F3F0'
    const el = bgRef.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      el.style.background = `radial-gradient(700px circle at ${e.clientX}px ${e.clientY}px, rgba(192,57,43,0.06) 0%, transparent 55%), ${base}`
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      {/* Dedicated background layer — receives the mouse light gradient */}
      <div ref={bgRef} className="fixed inset-0 z-0" style={{ background: '#F5F3F0' }} />

      {/* Particles at z-[1], above background */}
      <ParticleBackground />
      <CustomCursor />

      {/* Content at z-[10], transparent so particles show through */}
      <main
        className="min-h-screen flex flex-col items-center justify-center overflow-hidden select-none relative z-[10]"
        style={{ background: 'transparent' }}
      >
        {/* ── Scroll-fade wrapper ─────────────────────────────────────────── */}
        <motion.div
          className="flex flex-col items-center text-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >

          {/* Logo */}
          <motion.div
            className="mb-2"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/name.svg" alt="honja" style={{ height: 28, width: 'auto', display: 'block', filter: 'brightness(0)' }} />
          </motion.div>

          {/* Headline */}
          <h1
            className="font-black leading-none"
            style={{
              fontSize: 'clamp(52px, 8.5vw, 82px)',
              letterSpacing: '-3px',
              color: '#0B0B0B',
            }}
          >
            <RevealLine delay={0.15}>Ship without</RevealLine>
            <RevealLine delay={0.28}>
              <GlitchWord>the noise.</GlitchWord>
            </RevealLine>
          </h1>

          {/* Description */}
          <motion.p
            className="text-sm max-w-xs leading-relaxed"
            style={{ color: '#888' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.55, ease: EASE_OUT_EXPO }}
          >
            One workspace for your backlog, timeline, and focus.
            <br />
            Built for developers who work alone and ship fast.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.72, type: 'spring', bounce: 0.38 }}
          >
            {/* Magnetic wrapper */}
            <motion.div
              ref={magnetic.ref}
              style={{ x: magnetic.sx, y: magnetic.sy }}
              onMouseMove={magnetic.onMouseMove}
              onMouseLeave={magnetic.onMouseLeave}
            >
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <motion.div
                  className="relative px-9 py-3 rounded font-semibold text-sm overflow-hidden"
                  style={{ backgroundColor: '#c0392b', color: 'white' }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {/* Glow overlay on hover */}
                  <motion.span
                    className="absolute inset-0 rounded"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), transparent 70%)',
                      opacity: 0,
                    }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                  />
                  {/* Drop shadow pulse */}
                  <motion.span
                    className="absolute inset-0 rounded"
                    whileHover={{
                      boxShadow: '0 0 28px rgba(192,57,43,0.55), 0 4px 16px rgba(192,57,43,0.35)',
                    }}
                    transition={{ duration: 0.25 }}
                  />
                  <span className="relative z-10">Sign in</span>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

        </motion.div>
      </main>
    </>
  )
}
