'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  const rawX = useMotionValue(-200)
  const rawY = useMotionValue(-200)

  // Dot: very tight spring — almost instant
  const dotX = useSpring(rawX, { stiffness: 800, damping: 50 })
  const dotY = useSpring(rawY, { stiffness: 800, damping: 50 })

  // Ring: looser spring — lags behind
  const ringX = useSpring(rawX, { stiffness: 180, damping: 22 })
  const ringY = useSpring(rawY, { stiffness: 180, damping: 22 })

  useEffect(() => {
    // Only activate on pointer-capable devices
    if (!window.matchMedia('(pointer: fine)').matches) return

    document.body.style.cursor = 'none'

    const move = (e: MouseEvent) => {
      rawX.set(e.clientX)
      rawY.set(e.clientY)
      if (!visible) setVisible(true)
    }

    const trackHover = () => {
      document.querySelectorAll('a, button, [data-magnetic]').forEach((el) => {
        el.addEventListener('mouseenter', () => setHovered(true))
        el.addEventListener('mouseleave', () => setHovered(false))
      })
    }

    window.addEventListener('mousemove', move)
    // Use a small delay so DOM is ready for hover listeners
    const t = setTimeout(trackHover, 500)

    return () => {
      window.removeEventListener('mousemove', move)
      clearTimeout(t)
      document.body.style.cursor = ''
    }
  }, [rawX, rawY, visible])

  if (!visible) return null

  return (
    <>
      {/* Dot */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
          backgroundColor: '#0B0B0B',
          width: hovered ? 6 : 4,
          height: hovered ? 6 : 4,
        }}
        transition={{ width: { duration: 0.2 }, height: { duration: 0.2 } }}
      />

      {/* Ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] border"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          borderColor: hovered ? 'rgba(255,90,31,0.6)' : 'rgba(11,11,11,0.25)',
          width: hovered ? 44 : 32,
          height: hovered ? 44 : 32,
        }}
        transition={{
          width: { duration: 0.25, ease: 'easeOut' },
          height: { duration: 0.25, ease: 'easeOut' },
          borderColor: { duration: 0.2 },
        }}
      />
    </>
  )
}
