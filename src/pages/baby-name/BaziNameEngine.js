import { nameChars } from '../../data/names.js'
import { poems } from '../../data/poetry-map.js'

function getGenderPool(gender) {
  if (gender === 'boy') return [...nameChars.boy, ...nameChars.neutral]
  if (gender === 'girl') return [...nameChars.girl, ...nameChars.neutral]
  return [...nameChars.boy, ...nameChars.girl, ...nameChars.neutral]
}

function findCharInPool(pool, ch) {
  return pool.find(c => c.char === ch) || null
}

function strokeScore(c1, c2) {
  return c1.strokes % 2 !== c2.strokes % 2 ? 9 : 3
}

function meaningScore(c1, c2) {
  const avg = (c1.score + c2.score) / 2
  return Math.round((avg / 100) * 15)
}

function findPairs(pool, xiSet) {
  const candidates = []
  const seen = new Set()

  for (const poem of poems) {
    // Same-line pairs (top tier)
    for (let li = 0; li < poem.lines.length; li++) {
      const lineChars = poem.lines[li].chars
        .map(ch => findCharInPool(pool, ch))
        .filter(Boolean)

      for (let i = 0; i < lineChars.length; i++) {
        for (let j = i + 1; j < lineChars.length; j++) {
          const c1 = lineChars[i]
          const c2 = lineChars[j]
          if (c1.char === c2.char) continue
          const key = [c1.char, c2.char].sort().join('|')
          if (seen.has(key)) continue
          seen.add(key)

          const inXi = [c1, c2].filter(c => xiSet.has(c.wuxing)).length

          candidates.push({
            c1, c2, level: 'sameLine', levelLabel: '同句匹配',
            poetryText: poem.lines[li].text,
            poetrySource: `${poem.author}《${poem.title}》`,
            inXi
          })
        }
      }
    }

    // Same-poem cross-line pairs (second tier)
    const poemCharLines = []
    for (let li = 0; li < poem.lines.length; li++) {
      for (const ch of poem.lines[li].chars) {
        const c = findCharInPool(pool, ch)
        if (c) poemCharLines.push({ c, lineIdx: li })
      }
    }

    for (let i = 0; i < poemCharLines.length; i++) {
      for (let j = i + 1; j < poemCharLines.length; j++) {
        const { c: c1, lineIdx: li1 } = poemCharLines[i]
        const { c: c2, lineIdx: li2 } = poemCharLines[j]
        if (li1 === li2) continue
        if (c1.char === c2.char) continue
        const key = [c1.char, c2.char].sort().join('|')
        if (seen.has(key)) continue
        seen.add(key)

        const inXi = [c1, c2].filter(c => xiSet.has(c.wuxing)).length

        candidates.push({
          c1, c2, level: 'samePoem', levelLabel: '同诗匹配',
          poetryText: poem.lines[li1].text + ' / ' + poem.lines[li2].text,
          poetrySource: `${poem.author}《${poem.title}》`,
          inXi
        })
      }
    }
  }

  // Fallback: random xiShen pairs not yet covered
  if (candidates.length < 10) {
    const usedChars = new Set()
    for (const cand of candidates) { usedChars.add(cand.c1.char); usedChars.add(cand.c2.char) }
    const xiChars = pool.filter(c => xiSet.has(c.wuxing) && !usedChars.has(c.char))
    const shuffled = xiChars.sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffled.length - 1 && candidates.length < 20; i++) {
      for (let j = i + 1; j < shuffled.length && candidates.length < 20; j++) {
        const c1 = shuffled[i], c2 = shuffled[j]
        if (c1.char === c2.char) continue
        const key = [c1.char, c2.char].sort().join('|')
        if (seen.has(key)) continue
        seen.add(key)
        candidates.push({ c1, c2, level: 'wuxing', levelLabel: '五行补缺', poetryText: '', poetrySource: '', inXi: 2 })
      }
    }
  }

  return candidates
}

function poetryScore(level) {
  if (level === 'sameLine') return 35
  if (level === 'samePoem') return 24.5
  return 10.5
}

export function generateBaziNames({ surname, gender, xiShen, jiShen }) {
  const s = (surname || '').trim()
  if (!s) return []

  const pool = getGenderPool(gender)
  const xiSet = new Set(xiShen)
  const jiSet = new Set(jiShen)
  const filteredPool = pool.filter(c => !jiSet.has(c.wuxing))

  const candidates = findPairs(filteredPool, xiSet)

  const results = candidates.map(({ c1, c2, level, levelLabel, poetryText, poetrySource, inXi }) => {
    const ptsXiji = inXi === 2 ? 35 : inXi === 1 ? 17.5 : 0
    const ptsPoetry = poetryScore(level)
    const ptsSound = strokeScore(c1, c2)
    const ptsMeaning = meaningScore(c1, c2)
    const total = Math.round(ptsXiji + ptsPoetry + ptsSound + ptsMeaning)

    return {
      fullName: s + c1.char + c2.char,
      char1: c1.char, char2: c2.char,
      wuxing: `${c1.wuxing}${c2.wuxing}`,
      level, levelLabel,
      score: total,
      scoreBreakdown: { xiji: ptsXiji, poetry: ptsPoetry, sound: ptsSound, meaning: ptsMeaning },
      poetry: poetryText ? { text: poetryText, source: poetrySource } : null,
      reason: levelLabel
    }
  })

  results.sort((a, b) => b.score - a.score)

  const seenNames = new Set()
  return results.filter(r => {
    if (seenNames.has(r.fullName)) return false
    seenNames.add(r.fullName)
    return true
  }).slice(0, 20)
}
