import { nameChars } from '../../data/names.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateNames({ surname, gender }) {
  if (!surname || surname.trim() === '') return []

  let pool
  if (gender === 'boy') {
    pool = [...nameChars.boy, ...nameChars.neutral]
  } else if (gender === 'girl') {
    pool = [...nameChars.girl, ...nameChars.neutral]
  } else {
    pool = [...nameChars.boy, ...nameChars.girl, ...nameChars.neutral]
  }

  const shuffled = shuffle(pool)
  const results = []

  for (let i = 0; i < shuffled.length - 1 && results.length < 20; i++) {
    for (let j = i + 1; j < shuffled.length && results.length < 20; j++) {
      const c1 = shuffled[i]
      const c2 = shuffled[j]
      if (c1.char === c2.char) continue

      const avgScore = Math.round((c1.score + c2.score) / 2)
      const soundBonus = c1.strokes % 2 !== c2.strokes % 2 ? 3 : 0
      const score = Math.min(100, avgScore + soundBonus)

      results.push({
        fullName: surname + c1.char + c2.char,
        char1: c1.char,
        char2: c2.char,
        meaning: `${c1.meaning}；${c2.meaning}`,
        wuxing: `${c1.wuxing}${c2.wuxing}`,
        score
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 20)
}
