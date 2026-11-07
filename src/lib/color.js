export const today = () => new Date().toLocaleDateString('en-CA')
const K = 'dt_palette'
export const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {} } catch { return {} } }
export const save = o => { try { localStorage.setItem(K, JSON.stringify(o)) } catch {} }

export function rng(s) {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19 }
  let a = h
  return () => {
    a |= 0; a = a + 1831565813 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export const hsv = (h, s, v) => {
  s /= 100; v /= 100
  const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)) }
  return [f(5), f(3), f(1)].map(x => Math.round(x * 255))
}
export const rgb = c => `rgb(${c})`