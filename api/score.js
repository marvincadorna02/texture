import { Redis } from '@upstash/redis'

const env = process.env
const redis = new Redis({
  url: env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || env.STORAGE_KV_REST_API_URL || env.STORAGE_URL,
  token: env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || env.STORAGE_KV_REST_API_TOKEN || env.STORAGE_TOKEN,
})

const MODES = ['easy', 'hard', 'daily']
const keyOf = (mode, date) => (mode === 'daily' ? `lb:daily:${date}` : `lb:${mode}`)
const okDate = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d))
const cleanName = s => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 12)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    // ---------- save score ----------
    if (req.method === 'POST') {
      const { name, score, mode, date } = req.body || {}
      const n = cleanName(name)
      const s = Math.round(Number(score) * 100) / 100
      if (!n || !MODES.includes(mode) || !Number.isFinite(s) || s < 0 || s > 50 || (mode === 'daily' && !okDate(date))) {
        return res.status(400).json({ error: 'bad request' })
      }
      const key = keyOf(mode, date)
      const member = n.toLowerCase()

      const prev = await redis.zscore(key, member)
      // gt: i-update lang kung mas taas ang bag-ong score
      await redis.zadd(key, { gt: true }, { score: s, member })
      await redis.hset('lb:names', { [member]: n })
      if (mode === 'daily') await redis.expire(key, 60 * 60 * 24 * 45)

      const [rank, of, cur] = await Promise.all([
        redis.zrevrank(key, member),
        redis.zcard(key),
        redis.zscore(key, member),
      ])
      return res.status(200).json({
        rank: (rank ?? 0) + 1,
        of,
        score: Number(cur),
        best: prev == null || s > Number(prev),
      })
    }

    // ---------- read leaderboard ----------
    if (req.method === 'GET') {
      const { mode, date } = req.query
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50))
      if (!MODES.includes(mode) || (mode === 'daily' && !okDate(date))) {
        return res.status(400).json({ error: 'bad request' })
      }
      const flat = await redis.zrange(keyOf(mode, date), 0, limit - 1, { rev: true, withScores: true })
      const members = []
      const scores = []
      for (let i = 0; i < flat.length; i += 2) {
        members.push(String(flat[i]))
        scores.push(Number(flat[i + 1]))
      }
      const names = members.length ? await redis.hmget('lb:names', ...members) : null
      const rows = members.map((m, i) => ({ name: (names && names[m]) || m, score: scores[i] }))
      return res.status(200).json({ rows })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'method not allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'server error' })
  }
}