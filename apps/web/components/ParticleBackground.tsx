'use client'

import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const isMobile = window.innerWidth < 768
    const COUNT = isMobile ? 35 : 85
    const CONNECT_DIST_SQ = (isMobile ? 110 : 140) ** 2
    const REPULSE_R = isMobile ? 100 : 170
    const REPULSE_F = 1.4

    const cleanup = { fn: () => {} }

    ;(async () => {
      const THREE = await import('three')
      if (!mount.isConnected) return

      let W = window.innerWidth
      let H = window.innerHeight

      // Scene
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, W / H, 1, 2000)
      camera.position.z = 500

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      mount.appendChild(renderer.domElement)

      // Particle buffers
      const pos = new Float32Array(COUNT * 3)
      const orig = new Float32Array(COUNT * 3)
      const vel = new Float32Array(COUNT * 3)

      const spread = Math.min(W, 1600)
      for (let i = 0; i < COUNT; i++) {
        const x = (Math.random() - 0.5) * spread
        const y = (Math.random() - 0.5) * H * 1.1
        const z = (Math.random() - 0.5) * 350
        pos[i*3] = orig[i*3] = x
        pos[i*3+1] = orig[i*3+1] = y
        pos[i*3+2] = orig[i*3+2] = z
      }

      const pGeo = new THREE.BufferGeometry()
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const pMat = new THREE.PointsMaterial({
        color: 0x1a1a1a,
        size: 2.8,
        transparent: true,
        opacity: 0.28,
        sizeAttenuation: true,
      })
      scene.add(new THREE.Points(pGeo, pMat))

      // Line buffers — max vertices = COUNT*(COUNT-1) (all possible pairs * 2 endpoints)
      const maxVerts = COUNT * (COUNT - 1)
      const lPos = new Float32Array(maxVerts * 3)
      const lGeo = new THREE.BufferGeometry()
      lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3))
      lGeo.setDrawRange(0, 0)
      const lMat = new THREE.LineBasicMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.07,
      })
      scene.add(new THREE.LineSegments(lGeo, lMat))

      // Mouse tracking
      const mouse = { x: 0, y: 0 }
      const tmouse = { x: 0, y: 0 }
      const onMove = (e: MouseEvent) => {
        tmouse.x = (e.clientX / W - 0.5) * W
        tmouse.y = -(e.clientY / H - 0.5) * H
      }
      window.addEventListener('mousemove', onMove)

      let t = 0
      let raf = 0

      const tick = () => {
        raf = requestAnimationFrame(tick)
        t += 0.004

        // Lerp mouse
        mouse.x += (tmouse.x - mouse.x) * 0.06
        mouse.y += (tmouse.y - mouse.y) * 0.06

        // Camera parallax
        camera.position.x += (mouse.x * 0.025 - camera.position.x) * 0.025
        camera.position.y += (mouse.y * 0.025 - camera.position.y) * 0.025

        // Update particles
        for (let i = 0; i < COUNT; i++) {
          const i3 = i * 3
          const dx = pos[i3] - mouse.x
          const dy = pos[i3+1] - mouse.y
          const distSq = dx*dx + dy*dy

          // Repulsion
          if (distSq < REPULSE_R * REPULSE_R && distSq > 0.0001) {
            const dist = Math.sqrt(distSq)
            const f = ((REPULSE_R - dist) / REPULSE_R) ** 2 * REPULSE_F
            vel[i3]   += (dx / dist) * f
            vel[i3+1] += (dy / dist) * f
          }

          // Spring return to origin
          vel[i3]   += (orig[i3]   - pos[i3])   * 0.022
          vel[i3+1] += (orig[i3+1] - pos[i3+1]) * 0.022
          vel[i3+2] += (orig[i3+2] - pos[i3+2]) * 0.012

          // Gentle float wave
          vel[i3+1] += Math.sin(t + orig[i3] * 0.007) * 0.07

          // Damping
          vel[i3]   *= 0.91
          vel[i3+1] *= 0.91
          vel[i3+2] *= 0.91

          pos[i3]   += vel[i3]
          pos[i3+1] += vel[i3+1]
          pos[i3+2] += vel[i3+2]
        }
        pGeo.attributes.position.needsUpdate = true

        // Build connections (avoid sqrt — compare squared distance)
        let vi = 0
        for (let i = 0; i < COUNT; i++) {
          for (let j = i + 1; j < COUNT; j++) {
            const dx = pos[i*3]   - pos[j*3]
            const dy = pos[i*3+1] - pos[j*3+1]
            const dz = pos[i*3+2] - pos[j*3+2]
            if (dx*dx + dy*dy + dz*dz < CONNECT_DIST_SQ) {
              // vertex i
              lPos[vi*3]   = pos[i*3]
              lPos[vi*3+1] = pos[i*3+1]
              lPos[vi*3+2] = pos[i*3+2]
              vi++
              // vertex j
              lPos[vi*3]   = pos[j*3]
              lPos[vi*3+1] = pos[j*3+1]
              lPos[vi*3+2] = pos[j*3+2]
              vi++
            }
          }
        }
        lGeo.setDrawRange(0, vi)
        lGeo.attributes.position.needsUpdate = true

        renderer.render(scene, camera)
      }
      tick()

      const onResize = () => {
        W = window.innerWidth
        H = window.innerHeight
        camera.aspect = W / H
        camera.updateProjectionMatrix()
        renderer.setSize(W, H)
      }
      window.addEventListener('resize', onResize)

      cleanup.fn = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('resize', onResize)
        pGeo.dispose()
        lGeo.dispose()
        pMat.dispose()
        lMat.dispose()
        renderer.dispose()
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
      }
    })()

    return () => cleanup.fn()
  }, [])

  return <div ref={mountRef} className="fixed inset-0 z-[1] pointer-events-none" />
}
