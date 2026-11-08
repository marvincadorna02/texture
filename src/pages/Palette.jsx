import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { rgb, today, load, save } from '../lib/color'
import Laurel from '../components/Laurel'

const hsl = (h, s, l) => {
  s /= 100; l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0), f(8), f(4)].map(x => Math.round(x * 255))
}
const ink = c => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] > 140 ? '#111' : '#fff')
const hex = c => '#' + c.map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
const quip = s => s >= 9 ? 'Basically a perfect match.'
  : s >= 7 ? 'Really close. Nice eye.'
  : s >= 4.5 ? 'Not bad. Almost there.'
  : s >= 2 ? 'Pretty far off that time.'
  : 'Even your score looks boring.'
const finalMsg = t => t >= 45 ? 'Spot on. Your eyes are dialed in.'
  : t >= 35 ? 'Close. Watch the lightness next time.'
  : t >= 20 ? 'Not bad. Keep training those eyes.'
  : t >= 8 ? "Let's pretend that was a warm-up mix."
  : 'Your eyes were open for that bit, yeah?'
const HUE = `linear-gradient(${[...Array(13)].map((_, k) => `hsl(${360 - k * 30},80%,55%)`).join(',')})`
const WORDS = [['ready', '#ff4455'], ['set', '#f5c518'], ['go', '#2fbf4f']]
const SAT = 65

const randomColors = () => {
  const base = Math.random() * 360
  const hues = [...Array(5)].map((_, k) => (base + k * 72 + (Math.random() - 0.5) * 40 + 360) % 360)
  for (let k = hues.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1))
    ;[hues[k], hues[j]] = [hues[j], hues[k]]
  }
  return hues.map(h => hsl(h, SAT, 30 + Math.random() * 45))
}

const BK = 'dt_board'
const readBoard = () => { try { return JSON.parse(localStorage.getItem(BK)) || [] } catch { return [] } }
const addScore = (mode, name, score) => {
  try { localStorage.setItem(BK, JSON.stringify([...readBoard(), { mode, name, score, t: Date.now() }].slice(-500))) } catch {}
}

function useCountUp(target, run) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run) { setV(0); return }
    let raf, t0
    const step = t => {
      t0 ??= t
      const p = Math.min((t - t0) / 1100, 1)
      setV(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, run])
  return v
}

function Bar({ p, onP, style }) {
  const move = e => {
    const r = e.currentTarget.getBoundingClientRect()
    onP(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)))
  }
  return (
    <div
      className="bar" style={style} tabIndex={0} role="slider" aria-valuenow={Math.round(p * 100)}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); move(e) }}
      onPointerMove={e => { if (e.buttons) move(e) }}
      onKeyDown={e => {
        if (e.key === 'ArrowUp') onP(Math.max(0, p - 0.02))
        if (e.key === 'ArrowDown') onP(Math.min(1, p + 0.02))
      }}
    >
      <i className="knob" style={{ top: p * 100 + '%' }} />
    </div>
  )
}

export default function Palette() {
  const [phase, setPhase] = useState('intro')
  const [hard, setHard] = useState(false)
  const [tip, setTip] = useState(false)
  const [tab, setTab] = useState('easy')
  const [lbLoad, setLbLoad] = useState(false)
  const [daily, setDaily] = useState(false)
  const [targets, setTargets] = useState([])
  const [i, setI] = useState(0)
  const [wi, setWi] = useState(0)
  const [tl, setTl] = useState(4)
  const [paused, setPaused] = useState(false)
  const remRef = useRef(4)
  const [m, setM] = useState([0.3, 0.5])
  const [scores, setScores] = useState([])
  const [mixes, setMixes] = useState([])
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState(false)
  const [tag, setTag] = useState(() => {
    try { return localStorage.getItem('dt_tag') || '' } catch { return '' }
  })
  const look = hard ? 2 : 4
  const me = tag.trim() || 'YOU'

  const onTag = e => {
    const v = e.target.value.slice(0, 12)
    setTag(v)
    try { localStorage.setItem('dt_tag', v) } catch {}
  }

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useLayoutEffect(() => {
    if (phase !== 'board') return
    setLbLoad(true)
    const t = setTimeout(() => setLbLoad(false), 900)
    return () => clearTimeout(t)
  }, [phase])

  const mid = new Date(now); mid.setHours(24, 0, 0, 0)
  const left = Math.max(0, mid - now)
  const hh = Math.floor(left / 3600000)
  const mm = Math.floor((left % 3600000) / 60000)
  const ss = Math.floor((left % 60000) / 1000)
  const dateStr = new Date(now).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const shortDate = new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const freshMix = () => setM([Math.random(), 0.5])

  const start = isDaily => {
    setTargets(randomColors())
    setDaily(isDaily); setI(0); setScores([]); setMixes([]); freshMix(); setWi(0); setPaused(false); setPhase('count')
  }

  // auto-pause kung mag-alt-tab o mag-switch og tab
  useEffect(() => {
    if (phase !== 'count' && phase !== 'show') return
    const pause = () => setPaused(true)
    const onVis = () => { if (document.hidden) setPaused(true) }
    window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('blur', pause)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'count' || paused) return
    setWi(0)
    const a = setTimeout(() => setWi(1), 800)
    const b = setTimeout(() => setWi(2), 1600)
    const c = setTimeout(() => { remRef.current = look; setTl(look); setPhase('show') }, 2300)
    return () => [a, b, c].forEach(clearTimeout)
  }, [phase, paused, look])

  useEffect(() => {
    if (phase !== 'show' || paused) return
    let raf, last
    const step = t => {
      last ??= t
      remRef.current = Math.max(0, remRef.current - (t - last) / 1000)
      last = t
      setTl(remRef.current)
      if (remRef.current <= 0) setPhase('mix')
      else raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [phase, paused])

  const hue = 360 * (1 - m[0])
  const y = hsl(hue, SAT, 92 - m[1] * 80)

  const lock = () => {
    const d = Math.hypot(...targets[i].map((x, k) => x - y[k]))
    setScores(s => [...s, Math.max(0, 10 - d / 15)])
    setMixes(s => [...s, y])
    setPhase('result')
  }

  const next = () => {
    if (i === 4) {
      const t = scores.reduce((a, b) => a + b, 0)
      addScore(daily ? 'daily' : hard ? 'hard' : 'easy', me, +t.toFixed(2))
      if (daily) { const db = load(); db[today()] = { total: t.toFixed(2) }; save(db) }
      setPhase('final')
    } else { setI(i + 1); freshMix(); setPhase('count') }
  }

  const total = scores.reduce((a, b) => a + b, 0)
  const shownTotal = useCountUp(total, phase === 'final')
  const frac = total ? shownTotal / total : 0

  const share = async () => {
    const text = `Palette ${shortDate}: ${total.toFixed(2)}/50`
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }
    } catch {}
  }

  const cal = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
    <g className="cal-dots" fill="currentColor" stroke="none">
      <circle cx="8" cy="14" r="1.1" /><circle cx="12" cy="14" r="1.1" /><circle cx="16" cy="14" r="1.1" />
      <circle cx="8" cy="17.5" r="1.1" /><circle cx="12" cy="17.5" r="1.1" />
    </g>
  </svg>
  )

  const closeX = (
    <button className="x" onClick={() => setPhase('intro')} aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>
    </button>
  )

  const pauseUI = paused && (
    <div className="paused">
      <h2>Ready when you are.</h2>
      <p>Your color is waiting.</p>
      <button onClick={() => setPaused(false)}>Continue</button>
    </div>
  )

  if (phase === 'intro') return (
    <div className="intro">
      <button className="laurel" onClick={() => setPhase('board')} aria-label="Leaderboard"><Laurel size={32} /></button>
      <h1>palette<span className={hard ? 'hd' : ''}>.</span></h1>
      <p className="lead">Good with colors? Let’s find out.</p>
      <p>See five shades, then mix each one from memory.</p>
      <div className="introbar">
        <div>
          <b>{tip ? `One color. ${hard ? 'Two' : 'Four'} seconds.` : "Still sure you'll remember that shade?"}</b>
          <div className="row">
            <button className="round" onClick={() => start(false)} onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)} aria-label="Play solo">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>
            </button>
            <button className="round" disabled aria-label="Versus, coming soon">
              <span className="soonb">Soon</span>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="3" /><circle cx="5" cy="10" r="2" /><circle cx="19" cy="10" r="2" /><path d="M6 20c0-3 3-5 6-5s6 2 6 5" /></svg>
            </button>
            <button className={'tog' + (hard ? ' on' : '')} role="switch" aria-checked={hard} onClick={() => setHard(h => !h)}><i /></button>
            <span>{hard ? 'Hard' : 'Easy'}</span>
          </div>
        </div>
        <div className="dl">
          <b>Daily</b>
          <button className="round daily" onClick={() => setPhase('daily')} aria-label="Open daily">{cal}</button>
        </div>
      </div>
    </div>
  )

  if (phase === 'board' && lbLoad) return (
    <div className="intro lb">
      {closeX}
      <div className="spin"><i /></div>
    </div>
  )

  if (phase === 'board') {
    const all = readBoard()
    const rows = all.filter(r => r.mode === tab).sort((a, b) => b.score - a.score).slice(0, 50)
    return (
      <div className="intro lb">
        {closeX}
        <h2>leaderboards</h2>
        <p className="lbsub"><b>{all.length}</b> scores recorded</p>
        <div className="tabs">
          {['easy', 'hard', 'daily'].map(t => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        <ol className="rows">
          {rows.length ? rows.map((r, k) => (
            <li key={k + '-' + r.t} className={r.name === me ? 'me' : ''}>
              <span>{k + 1}</span><b>{r.name}</b><em>{r.score.toFixed(2)}</em>
            </li>
          )) : <li className="empty">No scores yet. Play a round!</li>}
        </ol>
      </div>
    )
  }

  if (phase === 'daily') return (
    <div className="intro dly">
      <button className="x" onClick={() => setPhase('intro')} aria-label="Close">×</button>
      <div className="dmeta">
        <b>{dateStr}</b>
        <span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
          {hh}h {mm}m
        </span>
      </div>
      <h1>daily<span className="yl">.</span></h1>
      <p>One color. {hard ? 'Two' : 'Four'} seconds.<br />Remember the shade. Mix it back.</p>
      <button className="past" onClick={() => { setTab('daily'); setPhase('board') }}>Check past daily <span>→</span></button>
      <div className="dbtns">
        <input className="outl" value={tag} onChange={onTag} placeholder="Tag" maxLength={12} aria-label="Your tag" />
        <button className="pd" onClick={() => start(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
          Play the daily
        </button>
      </div>
    </div>
  )

  if (phase === 'count') return (
    <div className="rcard cnt">
      <h1 key={wi}>{WORDS[wi][0]}<span style={{ color: WORDS[wi][1] }}>.</span></h1>
      {pauseUI}
    </div>
  )

  if (phase === 'show') return (
    <div className="rcard" style={{ background: rgb(targets[i]), color: ink(targets[i]) }}>
      <div className="info"><small>{i + 1} / 5</small><p>Watch closely.</p></div>
      <div className="tl"><b>{tl.toFixed(2)}</b><small>Time left</small></div>
      {pauseUI}
    </div>
  )

  if (phase === 'mix') return (
    <div className="rcard mixc" style={{ color: ink(y) }}>
      <div className="area" style={{ background: rgb(y) }}>
        <div className="info"><small>{i + 1} / 5</small><p>Bring that color back.</p></div>
        <button className="chk" onClick={lock} aria-label="Lock it in">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
        </button>
      </div>
      <Bar p={m[0]} onP={p => setM(([, l]) => [p, l])} style={{ background: HUE }} />
      <Bar p={m[1]} onP={p => setM(([h]) => [h, p])} style={{ background: `linear-gradient(hsl(${hue},${SAT}%,92%),hsl(${hue},${SAT}%,12%))` }} />
    </div>
  )

  if (phase === 'result') {
    const sc = scores[scores.length - 1]
    const t = targets[i]
    return (
      <div className="rcard split">
        <div className="half" style={{ background: rgb(y), color: ink(y) }}>
          <small className="rn">{i + 1} / 5</small>
          <div className="sc2"><b>{sc.toFixed(2)}</b><p>{quip(sc)}</p></div>
          <div className="lab"><span>Your mix</span><b>{hex(y)}</b></div>
        </div>
        <div className="half" style={{ background: rgb(t), color: ink(t) }}>
          <div className="lab"><span>Original</span><b>{hex(t)}</b></div>
          <button className="nx" onClick={next} aria-label={i === 4 ? 'See total' : 'Next color'}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="intro fin">
      <button className="x" onClick={() => setPhase('intro')} aria-label="Close">×</button>
      <div className="fintop">
        <b>Placing...</b>
        <span>Next daily: {hh}h {mm}m {ss}s</span>
      </div>
      <div className="score">{shownTotal.toFixed(2)}<span>/50</span></div>
      <p className="msg">{finalMsg(total)}</p>
      <div className="rc">
        <div className="cols">
          {targets.map((t, k) => (
            <div key={k}>
              <small>{k + 1}</small>
              <div className="sw2"><i style={{ background: rgb(mixes[k]) }} /><i style={{ background: rgb(t) }} /></div>
              <b>{(scores[k] * frac).toFixed(2)}</b>
            </div>
          ))}
        </div>
        <small className="cap">Your mix on top, original below</small>
        <div className="foot">
          <div><b>{daily ? 'Daily Palette' : 'Solo Palette'}</b><small>5 rounds complete</small></div>
          <div className="mode">
            <small>{shortDate}</small>
            <span>{scores.map((s, k) => <i key={k} style={{ background: s > 0.05 ? '#ee5a82' : '#4a4a52' }} />)}</span>
          </div>
        </div>
      </div>
      <p className="finnote">Scores save automatically. Edit your tag.</p>
      <div className="dbtns">
        <input className="outl" value={tag} onChange={onTag} placeholder="Tag" maxLength={12} aria-label="Your tag" />
        <button className="pd" onClick={share}>{copied ? 'Copied!' : 'Share your score'}</button>
      </div>
    </div>
  )
}