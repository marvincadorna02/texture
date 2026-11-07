const cx = 20, cy = 19, r = 12.5
const rad = d => (d * Math.PI) / 180
const pt = (a, rr = r) => [cx + rr * Math.cos(rad(a)), cy + rr * Math.sin(rad(a))]

const A0 = 100, A1 = 255, N = 7
const [sx, sy] = pt(A0)
const [ex, ey] = pt(A1)

const leaves = []
for (let t = 0; t < N; t++) {
  const a = A0 + t * ((A1 - A0 - 12) / (N - 1))
  const dir = a + 90
  const tip = t === N - 1
  const [ox, oy] = pt(a, r + 2.4)
  leaves.push({ x: ox, y: oy, rot: dir - 42 })
  if (!tip) {
    const [ix, iy] = pt(a, r - 2.4)
    leaves.push({ x: ix, y: iy, rot: dir + 42 })
  }
}

function Branch() {
  return (
    <g>
      <path d={`M${sx} ${sy} A${r} ${r} 0 0 1 ${ex} ${ey}`} />
      <path d={`M${sx} ${sy} L${sx - 2.6} ${sy + 5.6}`} />
      {leaves.map((l, k) => (
        <ellipse key={k} cx={l.x} cy={l.y} rx="3" ry="1.45" transform={`rotate(${l.rot} ${l.x} ${l.y})`} />
      ))}
    </g>
  )
}

export default function Laurel({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <Branch />
      <g transform="translate(40 0) scale(-1 1)"><Branch /></g>
    </svg>
  )
}