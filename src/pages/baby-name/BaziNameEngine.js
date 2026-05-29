import { nameChars } from '../../data/names.js'
import { wuxingPoetryNames } from '../../data/poetry-map.js'

function getGenderPool(gender) {
  if (gender === 'boy') return [...nameChars.boy, ...nameChars.neutral]
  if (gender === 'girl') return [...nameChars.girl, ...nameChars.neutral]
  return [...nameChars.boy, ...nameChars.girl, ...nameChars.neutral]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

export function generateBaziNames({ surname, gender, xiShen, jiShen }) {
  const s = (surname || '').trim()
  if (!s) return []

  const pool = getGenderPool(gender)
  const poolSet = new Set(pool.map(c => c.char))

  // Build priority wuxing combos
  const combos = []
  for (const w1 of xiShen) { for (const w2 of xiShen) { combos.push(w1 + w2) } }
  for (const w1 of xiShen) {
    for (const w2 of ['金', '木', '水', '火', '土']) {
      if (!jiShen.includes(w2) && !xiShen.includes(w2)) combos.push(w1 + w2)
    }
  }

  const results = []
  const seen = new Set()

  for (const combo of combos) {
    const entries = wuxingPoetryNames[combo] || []
    for (const entry of shuffle(entries)) {
      if (results.length >= 20) break
      if (!poolSet.has(entry.char1) || !poolSet.has(entry.char2)) continue
      if (entry.char1 === entry.char2) continue
      const key = [entry.char1, entry.char2].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)

      const c1 = pool.find(c => c.char === entry.char1)
      const c2 = pool.find(c => c.char === entry.char2)
      if (!c1 || !c2) continue

      const inXi = [c1, c2].filter(c => xiShen.includes(c.wuxing)).length
      const sameXi = c1.wuxing === c2.wuxing && xiShen.includes(c1.wuxing)

      let xijiPts = 0
      if (inXi === 2 && sameXi) xijiPts = 40
      else if (inXi === 2) xijiPts = 35
      else if (inXi === 1) xijiPts = 25
      else xijiPts = 15

      const poetryPts = 30

      const strokeAlt = c1.strokes % 2 !== c2.strokes % 2
      const strokeDiff = Math.abs(c1.strokes - c2.strokes)
      let soundPts = 7
      if (strokeAlt && strokeDiff >= 3 && strokeDiff <= 12) soundPts = 15
      else if (strokeAlt) soundPts = 12
      else if (strokeDiff >= 3 && strokeDiff <= 12) soundPts = 10

      const avgScore = (c1.score + c2.score) / 2
      let meaningPts = 7
      if (avgScore >= 95) meaningPts = 15
      else if (avgScore >= 88) meaningPts = 13
      else if (avgScore >= 82) meaningPts = 10
      else meaningPts = 9

      const total = Math.min(100, xijiPts + poetryPts + soundPts + meaningPts)

      results.push({
        fullName: s + entry.char1 + entry.char2,
        char1: entry.char1, char2: entry.char2,
        wuxing: combo,
        level: 'poetry', levelLabel: '诗词匹配',
        score: total,
        scoreBreakdown: { xiji: xijiPts, poetry: poetryPts, sound: soundPts, meaning: meaningPts },
        poetry: { text: entry.text, source: entry.source },
        reason: '诗词匹配'
      })
    }
    if (results.length >= 20) break
  }

  results.sort((a, b) => b.score - a.score)
  const seenNames = new Set()
  return results.filter(r => { if (seenNames.has(r.fullName)) return false; seenNames.add(r.fullName); return true }).slice(0, 20)
}
