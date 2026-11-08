import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { load, today } from '../lib/color'
import Bests from '../components/Bests'
import Footer from '../components/Footer'

const soon = [
  ['sync.', 'Pick a song. Tap along, one layer at a time.'],
  ['prism.', 'See where the light goes. Bring it back from memory.'],
  ['hue.', 'Put the shades back in order.'],
]

const MSG = 'The swatch is wearing a disguise. Take another careful look.'

const A = {
  score: 19.24,
  col: '#ee5a82',
  pts: [4.81, 0, 4.81, 4.81, 4.81],
  pairs: [['#4aa02f', '#9fd32f'], ['#1c1550', '#2a3a98'], ['#c78030', '#e0614a'], ['#d658b8', '#e088e0'], ['#1f7f66', '#2fb070']],
}
const B = {
  score: 40.3,
  pts: [8.06, 8.06, 8.06, 8.06, 8.06],
  pairs: [['#7cb82f', '#9fd32f'], ['#1b2570', '#273a9a'], ['#e0614a', '#e8856a'], ['#c45ad0', '#e087e8'], ['#2e9e66', '#3bbf7a']],
}
const cols = ['#2fd9a0', '#f2c230']

const order = ['res', 'rainbow', 'blue']

function useTween(goal, up) {
  const [v, setV] = useState(goal)
  const cur = useRef(goal)
  useEffect(() => {
    const from = up ? A.score : cur.current
    let raf, t0
    const step = t => {
      t0 ??= t
      const p = Math.min((t - t0) / 600, 1)
      const val = from + (goal - from) * (1 - Math.pow(1 - p, 3))
      cur.current = val
      setV(val)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [goal, up])
  return v
}

function Panel({ type, v, demo }) {
  if (type === 'res') return (
    <>
      <span className="x3">×</span>
      <div className="s3">{v.toFixed(2)}<span>/50</span></div>
      <p>{MSG}</p>
      <div className="rc3">
        <div className="cols">
          {demo.pairs.map(([a, b], j) => (
            <div key={j}>
              <small>{j + 1}</small>
              <div className="sw2"><i style={{ background: a }} /><i style={{ background: b }} /></div>
              <b>{demo.pts[j].toFixed(2)}</b>
            </div>
          ))}
        </div>
        <small className="cap">Your mix on top, original below</small>
      </div>
      <div className="foot3">
        <div><b>Solo Palette</b><small>5 rounds complete</small></div>
        <div>
          <small>Easy</small>
          <span className="sq">
            {demo.pts.map((p, j) => <i key={j} style={{ background: p > 0.05 ? demo.col : '#4a4a52' }} />)}
          </span>
        </div>
      </div>
    </>
  )
  if (type === 'blue') return (
    <>
      <small>2 / 5</small>
      <div className="sc"><b>8.06</b><em>A good mix. One more look<br />could make it a great one.</em></div>
      <div className="mix"><small>Your mix</small><small>#1B2A8A</small></div>
    </>
  )
  // rainbow: ang kolor ug knobs gi-animate sa CSS (.pal.hov .pn / .hue i)
  return (
    <>
      <div className="pn">
        <small>2 / 5</small>
        <span>Bring that color back.</span>
      </div>
      <div className="hue">
        <i /><i />
      </div>
    </>
  )
}

export default function Home() {
  const nav = useNavigate()
  const d = load()[today()]
  const [n, setN] = useState(0)
  const [hc, setHc] = useState(0)
  const [hov, setHov] = useState(false)
  const s = n % 3
  const shown = useTween(hov ? B.score : A.score, hov)
  const q = Math.min(Math.max((shown - A.score) / (B.score - A.score), 0), 1)
  const demo = {
    pairs: hov || q > 0.5 ? B.pairs : A.pairs,
    col: hov || q > 0.5 ? cols[hc % 2] : A.col,
    pts: A.pts.map((p, j) => p + (B.pts[j] - p) * q),
  }

  return (
    <>
      <p className="hello">Small games for big brains. <b>No sign-in needed.</b></p>
      <div className="grid">
        <div
          className={'card click pal' + (hov ? ' hov' : '')}
          onClick={() => setN(x => x + 1)}
          onMouseEnter={() => { setHc(x => x + 1); setHov(true) }}
          onMouseLeave={() => setHov(false)}
        >
          <span className="dot" />
          <div className="txt">
            <div className="head">
              <span className="ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#1a1a1f"><path d="M4 5l7 2-2 12-5-3zM13 7l7-2-1 11-5 3z" /></svg>
              </span>
              <h2>palette.</h2>
            </div>
            <p>See a color for a moment. Try to mix it from memory.</p>
          </div>
          <div className="txt">
            <button className="pbtn" onClick={e => { e.stopPropagation(); nav('/palette') }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1l9 5-9 5z" /></svg>
              {d ? 'play again' : 'play palette'}
            </button>
            <div className="tag">{d ? <>Today <b>{d.total}</b> / 50</> : '5 rounds · new colors daily'}</div>
          </div>

          {order.map((t, i) => (
            <div key={t} className={'pp ' + t + ' pos' + ((i - s + 3) % 3)}>
              <Panel type={t} v={shown} demo={demo} />
            </div>
          ))}
        </div>

        {soon.map(([t, p]) => (
          <div className="card soon" key={t}>
            <div><h2>{t}</h2><p>{p}</p></div>
            <div className="tag">coming soon</div>
          </div>
        ))}
      </div>

      <Bests />
      <Footer full />
    </>
  )
}