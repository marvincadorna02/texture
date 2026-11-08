import { memo, useEffect, useState } from 'react'
import { load } from '../lib/color'

const readBoard = () => { try { return JSON.parse(localStorage.getItem('dt_board')) || [] } catch { return [] } }
const readTag = () => { try { return (localStorage.getItem('dt_tag') || '').trim() || 'YOU' } catch { return 'YOU' } }

const svg = { width: 18, height: 18, viewBox: '0 0 24 24' }
const GAMES = [
  {
    k: 'palette', bg: 'linear-gradient(135deg,#ff8a7a,#e0533f)', bar: '#ff4455',
    icon: <svg {...svg} fill="#1a1a1f"><path d="M4 5l7 2-2 12-5-3zM13 7l7-2-1 11-5 3z" /></svg>,
  },
  {
    k: 'sync', bg: '#0a0a0d', bar: '#3b82f6',
    icon: <svg {...svg} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="13" r="5" /><circle cx="12" cy="13" r="1" fill="#fff" /><path d="M12 4v.5" /></svg>,
  },
  {
    k: 'hue', bg: 'linear-gradient(135deg,#b9a4f5,#8f78e6)', bar: '#8b5cf6',
    icon: <svg {...svg} fill="#1a1a1f"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" opacity=".6" /><rect x="4" y="13" width="7" height="7" rx="2" opacity=".6" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg>,
  },
  {
    k: 'prism', bg: 'linear-gradient(135deg,#ffe27a,#f5b82e)', bar: '#f5c518',
    icon: <svg {...svg} fill="#1a1a1f"><path d="M12 4l9 15H3z" opacity=".9" /></svg>,
  },
]

// daan nga records mahimong wala'y mode/diff, busa safe nga basahon
const modeOf = r => (r.daily ?? r.mode === 'daily') ? 'daily' : (r.diff ?? r.mode) === 'hard' ? 'hard' : 'easy'

// bests = imong pinakataas (imong tag ra), top = pinakataas sa tanan
function bestOf(game, tab, me) {
  if (game !== 'palette') return null
  let rows = readBoard().map(r => ({ mode: modeOf(r), name: r.name, score: +r.score }))
  Object.values(load() || {}).forEach(v => rows.push({ mode: 'daily', name: '', score: +v.total }))
  rows = rows.filter(r => Number.isFinite(r.score))
  if (tab === 'bests') rows = rows.filter(r => !r.name || String(r.name).toLowerCase() === me.toLowerCase())
  return rows.sort((a, b) => b.score - a.score)[0] || null
}

function Bests() {
  const [tab, setTab] = useState('bests')
  const [, setTick] = useState(0)

  // i-refresh kung mubalik sa tab/window o naay nausab sa storage
  useEffect(() => {
    const bump = () => setTick(t => t + 1)
    window.addEventListener('focus', bump)
    window.addEventListener('storage', bump)
    return () => {
      window.removeEventListener('focus', bump)
      window.removeEventListener('storage', bump)
    }
  }, [])

  const me = readTag()

  return (
    <section className="bests">
      <div className="bhead">
        <div>
          <h3>{tab === 'bests' ? 'Personal bests' : 'Top scores'}</h3>
          <p>{tab === 'bests' ? 'Your best, across every game.' : 'The highest score for each game.'}</p>
        </div>
        <div className="seg" role="tablist">
          {['bests', 'top'].map(t => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="bgrid">
        {GAMES.map(g => {
          const b = bestOf(g.k, tab, me)
          const mode = b ? b.mode[0].toUpperCase() + b.mode.slice(1) : ''
          const sub = !b ? (tab === 'top' ? 'No top score yet' : 'Set your first best')
            : tab === 'top' ? `${b.name || 'YOU'} · ${mode}`
            : mode
          return (
            <div className="bi" key={g.k}>
              <span className="bico" style={{ background: g.bg }}>{g.icon}</span>
              <div className="bt"><b>{g.k}</b><small>{sub}</small></div>
              <div className="bs"><b>{b ? b.score.toFixed(2) : '—'}</b><span>/ 50</span></div>
              <div className="bl"><i style={{ width: b ? Math.min(100, (b.score / 50) * 100) + '%' : 0, background: g.bar }} /></div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default memo(Bests)