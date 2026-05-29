import { nameChars } from '../../data/names.js'
import { poems, charIndex } from '../../data/poetry-map.js'

function getGenderPool(gender) {
  if (gender === 'boy') return [...nameChars.boy, ...nameChars.neutral]
  if (gender === 'girl') return [...nameChars.girl, ...nameChars.neutral]
  return [...nameChars.boy, ...nameChars.girl, ...nameChars.neutral]
}

function findCharInPool(pool, ch) {
  return pool.find(c => c.char === ch) || null
}

function findPairs(pool, xiSet) {
  const candidates = []
  const seen = new Set()

  for (const poem of poems) {
    for (let li = 0; li < poem.lines.length; li++) {
      const lineChars = poem.lines[li].chars
        .map(ch => findCharInPool(pool, ch))
        .filter(Boolean)

      for (let i = 0; i < lineChars.length; i++) {
        for (let j = i + 1; j < lineChars.length; j++) {
          const c1 = lineChars[i], c2 = lineChars[j]
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

  // Fallback: use xiShen chars, look up each char individually in charIndex for poetry
  if (candidates.length < 20) {
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

        // Look up individual poetry for each char
        const p1 = charIndex[c1.char]?.[0]
        const p2 = charIndex[c2.char]?.[0]
        let poetryText = ''
        let poetrySource = ''
        if (p1 && p2) {
          poetryText = p1.title + ': ' + c1.char + ' / ' + p2.title + ': ' + c2.char
          poetrySource = `${p1.author} / ${p2.author}`
        } else if (p1) {
          poetryText = p1.title + ': ' + c1.char
          poetrySource = p1.author
        } else if (p2) {
          poetryText = p2.title + ': ' + c2.char
          poetrySource = p2.author
        }

        candidates.push({ c1, c2, level: 'wuxing', levelLabel: '五行补缺', poetryText, poetrySource, inXi: 2 })
      }
    }
  }

  return candidates
}

// Scoring: base 85 + bonuses (capped at 100)
// Xiji bonus: 0-8, Poetry bonus: 0-5, Sound bonus: 0-2, Meaning bonus: 0-2
// Total: 85 + 0-15 = 85-100

function xijiBonus(c1, c2, xiSet) {
  const inXi = [c1, c2].filter(c => xiSet.has(c.wuxing)).length
  if (inXi === 2) {
    // Both xiShen — differentiate by same/different wuxing
    if (c1.wuxing === c2.wuxing && xiSet.size === 1 && xiSet.has(c1.wuxing)) return 8  // both match sole xiShen
    if (c1.wuxing === c2.wuxing) return 7  // same xiShen element
    return 6  // different xiShen elements
  }
  if (inXi === 1) return 4
  return 1  // at least not in jiShen
}

function poetryBonus(level) {
  if (level === 'sameLine') return 5
  if (level === 'samePoem') return 3
  return 1
}

function soundBonus(c1, c2) {
  const strokeAlternate = c1.strokes % 2 !== c2.strokes % 2
  const strokeDiff = Math.abs(c1.strokes - c2.strokes)
  if (strokeAlternate && strokeDiff >= 3 && strokeDiff <= 12) return 2
  if (strokeAlternate) return 1
  if (strokeDiff >= 3 && strokeDiff <= 12) return 1
  return 0
}

function meaningBonus(c1, c2) {
  const avg = (c1.score + c2.score) / 2
  if (avg >= 95) return 2
  if (avg >= 88) return 1
  return 0
}

export function generateBaziNames({ surname, gender, xiShen, jiShen }) {
  const s = (surname || '').trim()
  if (!s) return []

  const pool = getGenderPool(gender)
  const xiSet = new Set(xiShen)
  const jiSet = new Set(jiShen)
  const filteredPool = pool.filter(c => !jiSet.has(c.wuxing))

  const candidates = findPairs(filteredPool, xiSet)

  const results = candidates.map(({ c1, c2, level, levelLabel, poetryText, poetrySource }) => {
    const pXiji = xijiBonus(c1, c2, xiSet)
    const pPoetry = poetryBonus(level)
    const pSound = soundBonus(c1, c2)
    const pMeaning = meaningBonus(c1, c2)
    const total = Math.min(100, 85 + pXiji + pPoetry + pSound + pMeaning)

    return {
      fullName: s + c1.char + c2.char,
      char1: c1.char, char2: c2.char,
      wuxing: `${c1.wuxing}${c2.wuxing}`,
      level, levelLabel,
      score: total,
      scoreBreakdown: { xiji: pXiji, poetry: pPoetry, sound: pSound, meaning: pMeaning },
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
