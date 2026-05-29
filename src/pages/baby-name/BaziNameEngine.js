import { nameChars } from '../../data/names.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getGenderPool(gender) {
  if (gender === 'boy') return [...nameChars.boy, ...nameChars.neutral]
  if (gender === 'girl') return [...nameChars.girl, ...nameChars.neutral]
  return [...nameChars.boy, ...nameChars.girl, ...nameChars.neutral]
}

export function generateBaziNames({ surname, gender, xiShen, jiShen }) {
  const s = (surname || '').trim()
  if (!s) return []

  const pool = getGenderPool(gender)

  const xiChars = pool.filter(c => xiShen.includes(c.wuxing))
  const neutralChars = pool.filter(c =>
    !xiShen.includes(c.wuxing) && !jiShen.includes(c.wuxing)
  )

  const results = []
  const maxResults = 20

  // Generate from xiShen chars (both chars from xiShen pool)
  const shuffledXi = shuffle(xiChars)
  for (let i = 0; i < shuffledXi.length - 1 && results.length < maxResults; i++) {
    for (let j = i + 1; j < shuffledXi.length && results.length < maxResults; j++) {
      const c1 = shuffledXi[i]
      const c2 = shuffledXi[j]
      if (c1.char === c2.char) continue

      const avgScore = Math.round((c1.score + c2.score) / 2)
      const soundBonus = c1.strokes % 2 !== c2.strokes % 2 ? 3 : 0
      const score = Math.min(100, avgScore + soundBonus + 20)

      results.push({
        fullName: s + c1.char + c2.char,
        char1: c1.char,
        char2: c2.char,
        meaning: `${c1.meaning}；${c2.meaning}`,
        wuxing: `${c1.wuxing}${c2.wuxing}`,
        score,
        reason: `喜用神${xiShen.join('/')}匹配`
      })
    }
  }

  // Fill remaining with xiShen + neutral combos
  if (results.length < maxResults) {
    const mixedXi = shuffle(xiChars)
    const mixedNeutral = shuffle(neutralChars)
    for (const xi of mixedXi) {
      for (const nu of mixedNeutral) {
        if (results.length >= maxResults) break
        if (xi.char === nu.char) continue

        const avgScore = Math.round((xi.score + nu.score) / 2)
        const soundBonus = xi.strokes % 2 !== nu.strokes % 2 ? 3 : 0
        const score = Math.min(100, avgScore + soundBonus + 10)

        results.push({
          fullName: s + xi.char + nu.char,
          char1: xi.char,
          char2: nu.char,
          meaning: `${xi.meaning}；${nu.meaning}`,
          wuxing: `${xi.wuxing}${nu.wuxing}`,
          score,
          reason: '喜用神匹配'
        })
      }
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, maxResults)
}
