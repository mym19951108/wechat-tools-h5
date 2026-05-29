import { nameChars } from '../../data/names.js'
import { wuxingPoetryNames } from '../../data/poetry-map.js'

function getGenderPool(gender) {
  if (gender === 'boy') return [...nameChars.boy, ...nameChars.neutral]
  if (gender === 'girl') return [...nameChars.girl, ...nameChars.neutral]
  return [...nameChars.boy, ...nameChars.girl, ...nameChars.neutral]
}

// Build char→poetry index from all wuxingPoetryNames entries
function buildPoetryIndex() {
  const idx = {}
  for (const entries of Object.values(wuxingPoetryNames)) {
    for (const entry of entries) {
      if (!idx[entry.char1]) {
        idx[entry.char1] = { text: entry.text, source: entry.source }
      }
      if (!idx[entry.char2]) {
        idx[entry.char2] = { text: entry.text, source: entry.source }
      }
    }
  }
  return idx
}

const poetryIdx = buildPoetryIndex()

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
    // Find chars in pool matching the target wuxing combo
    const w1 = combo[0], w2 = combo[1]
    const chars1 = shuffle(pool.filter(c => c.wuxing === w1 && poolSet.has(c.char)))
    const chars2 = shuffle(pool.filter(c => c.wuxing === w2 && poolSet.has(c.char)))

    for (const c1 of chars1) {
      for (const c2 of chars2) {
        if (results.length >= 20) break
        if (c1.char === c2.char) continue
        const key = [c1.char, c2.char].sort().join('|')
        if (seen.has(key)) continue
        seen.add(key)

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

        // Get individual poetry for each char
        const p1 = poetryIdx[c1.char] || { text: '', source: '' }
        const p2 = poetryIdx[c2.char] || { text: '', source: '' }

        results.push({
          fullName: s + c1.char + c2.char,
          char1: c1.char, char2: c2.char,
          wuxing: combo,
          level: 'poetry', levelLabel: '诗词溯源',
          score: total,
          scoreBreakdown: { xiji: xijiPts, poetry: poetryPts, sound: soundPts, meaning: meaningPts },
          poetry1: p1,
          poetry2: p2,
          reason: '诗词溯源'
        })
      }
      if (results.length >= 20) break
    }
    if (results.length >= 20) break
  }

  results.sort((a, b) => b.score - a.score)
  const seenNames = new Set()
  return results.filter(r => { if (seenNames.has(r.fullName)) return false; seenNames.add(r.fullName); return true }).slice(0, 20)
}
