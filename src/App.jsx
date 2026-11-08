import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Palette from './pages/Palette'

const NAV = [
  { k: 'palette', to: '/palette', c: '#ff4455' },
  { k: 'sync', c: '#3b82f6' },
  { k: 'hue', c: '#8b5cf6' },
  { k: 'prism', c: '#f5c518' },
]

export default function App() {
  const { pathname } = useLocation()
  const [muted, setMuted] = useState(false)
  const [hover, setHover] = useState(null)
  const [x, setX] = useState(0)
  const els = useRef([])

  const active = pathname.startsWith('/palette') ? 0 : null
  const shown = hover ?? active

  useEffect(() => {
    try { const t = localStorage.getItem('dt_theme'); if (t) document.documentElement.dataset.theme = t } catch {}
  }, [])

  useLayoutEffect(() => {
    const place = () => {
      const el = els.current[shown]
      if (el) setX(el.offsetLeft + el.offsetWidth / 2)
    }
    place()
    window.addEventListener('resize', place)
    document.fonts?.ready.then(place)
    return () => window.removeEventListener('resize', place)
  }, [shown])

  const toggle = () => {
    const root = document.documentElement
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches
    root.dataset.theme = dark ? 'light' : 'dark'
    try { localStorage.setItem('dt_theme', root.dataset.theme) } catch {}
  }

  return (
    <>
      <header>
        <Link className="brand" to="/"><img src="/texture.png" alt="" />Texture</Link>
        <Link className="allgames" to="/">All games</Link>
        <nav className="nav" onMouseLeave={() => setHover(null)}>
          {NAV.map((n, i) =>
            n.to ? (
              <NavLink key={n.k} to={n.to} ref={el => (els.current[i] = el)} onMouseEnter={() => setHover(i)}>{n.k}</NavLink>
            ) : (
              <span key={n.k} className="off" ref={el => (els.current[i] = el)} onMouseEnter={() => setHover(i)} title="coming soon">{n.k}</span>
            )
          )}
          <i
            className="ndot"
            style={{
              left: x,
              background: shown === null ? 'transparent' : NAV[shown].c,
              opacity: shown === null ? 0 : 1,
              transform: shown === null ? 'scale(0)' : 'scale(1)',
            }}
          />
        </nav>
        <div className="tools">
          <button className="icon" onClick={() => setMuted(m => !m)} aria-label={muted ? 'Unmute' : 'Mute'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5z" />
              {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
            </svg>
          </button>
          <button className="icon" onClick={toggle} aria-label="Toggle theme">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </button>
          <button className="trophy" aria-label="Stats">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 4h12v6a6 6 0 0 1-12 0V4zM12 16v3M8 21h8" />
            </svg>
          </button>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/palette" element={<Palette />} />
        </Routes>
      </main>
      <footer className="foot">
        <nav className="flinks">
          <button>Privacy</button>
          <button>Support</button>
          <button>About</button>
        </nav>
      </footer>
    </>
  )
}