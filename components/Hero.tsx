'use client'

import { useEffect, useRef } from 'react'

import { imgSrc } from '@/lib/img'
import type { Img, Settings } from '@/lib/types'

import { CalendarIcon, DocIcon, LinkedInIcon } from './icons'

type Props = {
  portrait: Img
  marqueeText: string
  roles: string[]
  settings: Settings
  /** Columns in the distortion grid — bigger number, smaller blocks. */
  gridSize?: number
  /** How far blocks slide when the cursor moves. */
  strength?: number
}

const HERO_BG = '#DBDBDB'

/**
 * Black & white portrait with a grid-distortion hover: the image is split into square cells;
 * moving the cursor pushes the cells under it in the direction of travel, then they ease back.
 */
export function Hero({ portrait, marqueeText, roles, settings, gridSize = 22, strength = 1 }: Props) {
  const heroRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const hero = heroRef.current
    if (!canvas || !hero || !portrait?.url) return
    // WebGL can only read images it is allowed to, so load the portrait through this site's own
    // image endpoint (same origin) instead of directly from the Sanity/Framer CDN.
    const src = portrait.url.startsWith('/')
      ? portrait.url
      : `/_next/image?url=${encodeURIComponent(portrait.url)}&w=2048&q=85`

    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false })
    if (!gl) return // the <img> fallback below stays visible
    canvas.dataset.ready = 'true'

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const base = document.createElement('canvas')
    let img: HTMLImageElement | null = null
    let gx = gridSize
    let gy = 1
    let off = new Float32Array(0)
    let bytes = new Uint8Array(0)
    const mouse = { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, on: false, fresh: true }

    // --- GL setup
    const vs = 'attribute vec2 p;varying vec2 v;void main(){v=(p+1.0)*0.5;gl_Position=vec4(p,0.0,1.0);}'
    const fs = `precision mediump float;
      varying vec2 v; uniform sampler2D uImg; uniform sampler2D uGrid;
      void main(){
        vec2 off=(texture2D(uGrid,v).rg-0.5)*2.0;
        vec2 uv=clamp(v-off*0.08,0.0,1.0);
        gl_FragColor=vec4(texture2D(uImg,uv).rgb,1.0);
      }`
    const compile = (type: number, source: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, source)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const texture = (unit: number, filter: number) => {
      const t = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0 + unit)
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return t
    }
    const texImg = texture(0, gl.LINEAR)
    const texGrid = texture(1, gl.NEAREST)
    gl.uniform1i(gl.getUniformLocation(prog, 'uImg'), 0)
    gl.uniform1i(gl.getUniformLocation(prog, 'uGrid'), 1)

    // --- Base image: portrait anchored bottom-centre on the hero grey
    const drawBase = () => {
      const ctx = base.getContext('2d')!
      const w = base.width
      const h = base.height
      ctx.fillStyle = HERO_BG
      ctx.fillRect(0, 0, w, h)
      if (img) {
        const ratio = img.naturalWidth / img.naturalHeight
        let dh = h * 1.08
        let dw = dh * ratio
        if (dw > w) {
          dw = w
          dh = dw / ratio
        }
        ctx.drawImage(img, (w - dw) / 2, h - dh, dw, dh)
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texImg)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, base)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      canvas.width = base.width = w
      canvas.height = base.height = h
      gl.viewport(0, 0, w, h)
      gx = Math.max(4, gridSize)
      gy = Math.max(2, Math.round((gx * canvas.clientHeight) / Math.max(1, canvas.clientWidth)))
      off = new Float32Array(gx * gy * 2)
      bytes = new Uint8Array(gx * gy * 4)
      drawBase()
    }

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      img = image
      drawBase()
    }
    image.src = src

    // --- Pointer
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = 1 - (e.clientY - r.top) / r.height
      if (mouse.fresh) {
        mouse.px = x
        mouse.py = y
        mouse.fresh = false
      }
      mouse.vx = x - mouse.px
      mouse.vy = y - mouse.py
      mouse.px = mouse.x = x
      mouse.py = mouse.y = y
      mouse.on = true
    }
    const onLeave = () => {
      mouse.on = false
      mouse.fresh = true
    }
    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)

    // --- Frame loop
    let raf = 0
    let visible = true
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(hero)

    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      for (let i = 0; i < off.length; i++) off[i] *= 0.9
      if (mouse.on && !reduced) {
        const mx = mouse.x * gx
        const my = mouse.y * gy
        const rad = gx * 0.12
        for (let j = 0; j < gy; j++) {
          for (let i = 0; i < gx; i++) {
            const dx = i + 0.5 - mx
            const dy = j + 0.5 - my
            const d2 = dx * dx + dy * dy
            if (d2 < rad * rad) {
              const power = Math.min(3, rad / Math.sqrt(Math.max(d2, 0.25)))
              const n = (j * gx + i) * 2
              off[n] += mouse.vx * 12 * power * strength
              off[n + 1] += mouse.vy * 12 * power * strength
            }
          }
        }
        mouse.vx *= 0.9
        mouse.vy *= 0.9
      }
      for (let n = 0, q = 0; n < off.length; n += 2, q += 4) {
        const ox = (off[n] = Math.max(-1, Math.min(1, off[n])))
        const oy = (off[n + 1] = Math.max(-1, Math.min(1, off[n + 1])))
        bytes[q] = Math.round((ox * 0.5 + 0.5) * 255)
        bytes[q + 1] = Math.round((oy * 0.5 + 0.5) * 255)
        bytes[q + 3] = 255
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, texGrid)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gx, gy, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', resize)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
    }
  }, [portrait, gridSize, strength])

  const repeated = Array.from({ length: 4 }, (_, i) => <span key={i}>{marqueeText}</span>)
  const linkedIn = settings.socials.find((s) => /linkedin/i.test(s.label))

  return (
    <section ref={heroRef} className="hero">
      {portrait?.url && (
        // Shown until WebGL takes over (and if WebGL is unavailable)
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hero__fallback" src={imgSrc(portrait, 2400)} alt="" aria-hidden="true" />
      )}
      <canvas ref={canvasRef} aria-hidden="true" />

      <header className="hero__head">
        <a href="/">© {settings.name}</a>
        <a className="nav-mid" href="/work">Projects</a>
        <a className="nav-mid" href="/about">About</a>
        <a href={settings.calendlyUrl ?? '/about#contact'}>Contact</a>
      </header>

      <div className="hero__marquee" aria-hidden="true">
        <div className="marquee-track">{repeated}</div>
      </div>
      <h1 className="sr-only">
        {settings.name}, {roles.join(', ')}
      </h1>

      <div className="hero__foot">
        <nav className="hero__social" aria-label="Social">
          {linkedIn && (
            <a href={linkedIn.url}>
              <LinkedInIcon /> LinkedIn
            </a>
          )}
          {settings.calendlyUrl && (
            <a href={settings.calendlyUrl}>
              <CalendarIcon /> Calendly
            </a>
          )}
          {settings.resumeUrl && (
            <a href={settings.resumeUrl}>
              <DocIcon /> Resume
            </a>
          )}
        </nav>
        <div className="hero__roles">
          {roles.map((r) => (
            <div key={r}>{r}</div>
          ))}
        </div>
      </div>
    </section>
  )
}
