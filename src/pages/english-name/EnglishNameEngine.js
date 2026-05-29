import { englishNames, charMap } from '../../data/english-names.js'

export function matchEnglishNames(chineseName) {
  if (!chineseName || chineseName.trim() === '') return []

  const chars = chineseName.trim().split('')
  const initials = chars.map(c => charMap[c] || c.toUpperCase())
  const targetInitials = initials.filter(i => /[A-Z]/.test(i))
  if (targetInitials.length === 0) return []

  const results = []
  for (const name of englishNames) {
    let matchScore = 0
    let matchType = ''

    if (targetInitials.some(init => name.name.toUpperCase().startsWith(init))) {
      matchScore += 3
      matchType = '首字母匹配'
    }

    if (!matchType && targetInitials.some(init => name.name.toUpperCase().includes(init))) {
      matchScore += 1
      matchType = '发音相近'
    }

    if (matchScore >= 3) {
      results.push({ name: name.name, meaning: name.meaning, origin: name.origin, gender: name.gender, matchType })
    }
  }

  if (results.length < 5) {
    const extras = englishNames
      .filter(n => !results.find(r => r.name === n.name))
      .slice(0, 10 - results.length)
      .map(n => ({ name: n.name, meaning: n.meaning, origin: n.origin, gender: n.gender, matchType: '热门推荐' }))
    results.push(...extras)
  }

  return results.slice(0, 15)
}
