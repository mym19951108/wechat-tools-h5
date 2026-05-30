import { nameChars } from '../../data/names.js'
import { wuxingPoetryNames } from '../../data/poetry-map.js'
import { chengyuNames } from '../../data/chengyu-names.js'
import { dianguNames } from '../../data/diangu-names.js'
import surnameRaw from '../../data/surname-data.json' with { type: 'json' }
const surnameData = surnameRaw

const KE_MAP = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' }
const SHENG_MAP = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' }

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

const NEG_RE = /[哀悲怨恨讥讽刺危亡乱祸丧葬殁薨逝离别苦愁盼凄惨忧忡郁孕无夫私通淫乱妖异鬼怪邪祟可怖狰狞阴间恐怖恶魔遭谗遭妒害被谗遭害贤愚不分贤愚相混玉石相混杀屠戮孤病痛苦疾]/

export function generateBaziNames({ surname, gender, yongShen, xiShen, xianShen, chouShen, jiShen }) {
  const s = (surname || '').trim()
  if (!s) return []

  const pool = getGenderPool(gender)
  const poolSet = new Set(pool.map(c => c.char))

  const primary = (yongShen && yongShen.length > 0) ? yongShen : (xiShen || [])
  const secondary = (yongShen && yongShen.length > 0) ? (xiShen || []) : []
  const neutral = xianShen || []
  const bad = chouShen || []
  const worst = jiShen || []
  const allFavored = [...new Set([...primary, ...secondary, ...neutral])]

  const combos = []
  for (const w1 of allFavored) { for (const w2 of allFavored) { combos.push(w1 + w2) } }
  for (const w1 of allFavored) {
    for (const w2 of ['金', '木', '水', '火', '土']) {
      if (!allFavored.includes(w2)) combos.push(w1 + w2)
    }
  }

  function generateCandidates(sourceEntries, sourceLabel) {
    const results = []
    const seen = new Set()
    for (const combo of combos) {
      const entries = sourceEntries[combo] || []
      for (const entry of shuffle(entries)) {
        if (!poolSet.has(entry.char1) || !poolSet.has(entry.char2)) continue
        if (entry.char1 === entry.char2) continue
        if (entry.char1 === s || entry.char2 === s) continue
        const key = [entry.char1, entry.char2].sort().join('|')
        if (seen.has(key)) continue
        seen.add(key)

        const c1 = pool.find(c => c.char === entry.char1)
        const c2 = pool.find(c => c.char === entry.char2)
        if (!c1 || !c2) continue

        if (worst.includes(c1.wuxing) || worst.includes(c2.wuxing)) continue
        if (bad.includes(c1.wuxing) || bad.includes(c2.wuxing)) continue
        if (entry.annotation && NEG_RE.test(entry.annotation)) continue

        const inPrimary = [c1, c2].filter(c => primary.includes(c.wuxing)).length
        const inSecondary = [c1, c2].filter(c => secondary.includes(c.wuxing)).length
        const inNeutral = [c1, c2].filter(c => neutral.includes(c.wuxing)).length
        const inBad = [c1, c2].filter(c => bad.includes(c.wuxing)).length
        const inWorst = [c1, c2].filter(c => worst.includes(c.wuxing)).length

        const surnameInfo = surnameData[s] || { strokes: 8, wuxing: '土', tone: 2 }
        const surnameGood = primary.includes(surnameInfo.wuxing) || secondary.includes(surnameInfo.wuxing)
        const allTriple = c1.wuxing === c2.wuxing && surnameInfo.wuxing === c1.wuxing && primary.includes(c1.wuxing)

        let xijiPts = 0
        if (inWorst > 0 || bad.includes(surnameInfo.wuxing)) { xijiPts = 0 }
        else if (inBad > 0) { xijiPts = 5 }
        else if (inNeutral === 2 && !surnameGood) { xijiPts = 10 }
        else if (inPrimary >= 1 || inSecondary >= 1 || surnameGood) {
          if (inPrimary === 2 && surnameGood && allTriple) { xijiPts = 40 }
          else if (inPrimary === 2 && surnameGood) { xijiPts = 38 }
          else if (inPrimary === 2) { xijiPts = 35 }
          else if (inPrimary === 1 && inSecondary === 1 && surnameGood) { xijiPts = 32 }
          else if (inPrimary === 1 && inSecondary === 1) { xijiPts = 28 }
          else if (inSecondary === 2 && surnameGood) { xijiPts = 25 }
          else if (inSecondary === 2) { xijiPts = 22 }
          else if (inPrimary === 1 && inNeutral === 1) { xijiPts = 18 }
          else if (inSecondary === 1 && inNeutral === 1) { xijiPts = 15 }
          else if (surnameGood) { xijiPts = 15 }
        }

        const strokeAlt = c1.strokes % 2 !== c2.strokes % 2
        const strokeDiff = Math.abs(c1.strokes - c2.strokes)
        let soundPts = 8
        if (strokeAlt && strokeDiff >= 3 && strokeDiff <= 12) soundPts = 20
        else if (strokeAlt) soundPts = 16
        else if (strokeDiff >= 3 && strokeDiff <= 12) soundPts = 12

        const avgScore = (c1.score + c2.score) / 2
        let meaningPts = 8
        if (avgScore >= 95) meaningPts = 20
        else if (avgScore >= 88) meaningPts = 16
        else if (avgScore >= 82) meaningPts = 12

        const moodPts = Math.round((entry.mood || 5) * 2)
        const jitter = Math.floor(Math.random() * 17) - 8
        const total = Math.min(100, Math.max(0, xijiPts + soundPts + meaningPts + moodPts + jitter))

        results.push({
          fullName: s + entry.char1 + entry.char2,
          char1: entry.char1, char2: entry.char2,
          wuxing: combo,
          score: total,
          scoreBreakdown: { xiji: xijiPts, sound: soundPts, meaning: meaningPts, mood: moodPts, jitter: jitter },
          poetry: { text: entry.text, source: entry.source, annotation: entry.annotation || '' },
          sourceLabel: sourceLabel
        })
      }
    }
    return results.sort((a, b) => b.score - a.score)
  }

  const poetryResults = generateCandidates(wuxingPoetryNames, '📜 诗词')
  const chengyuResults = generateCandidates(chengyuNames, '📚 成语')
  const dianguResults = generateCandidates(dianguNames, '📖 典故')

  function pickDiverse(results, quota) {
    const groups = {}
    for (const r of results) {
      if (!groups[r.wuxing]) groups[r.wuxing] = []
      groups[r.wuxing].push(r)
    }
    const keys = shuffle(Object.keys(groups))
    const picked = []
    const nameSet = new Set()
    let depth = 0
    while (picked.length < quota) {
      let added = false
      for (const key of keys) {
        if (picked.length >= quota) break
        const g = groups[key]
        if (depth < g.length) {
          const r = g[depth]
          if (!nameSet.has(r.fullName)) {
            nameSet.add(r.fullName)
            picked.push(r)
            added = true
          }
        }
      }
      if (!added) break
      depth++
    }
    return picked
  }

  const selected = [
    ...pickDiverse(poetryResults, 2),
    ...pickDiverse(chengyuResults, 4),
    ...pickDiverse(dianguResults, 6)
  ]

  if (selected.length < 10) {
    const ns = new Set(selected.map(r => r.fullName))
    const all = [...poetryResults, ...chengyuResults, ...dianguResults].sort((a, b) => b.score - a.score)
    for (const r of all) { if (selected.length >= 10) break; if (!ns.has(r.fullName)) { ns.add(r.fullName); selected.push(r) } }
  }

  return selected.slice(0, 10).sort((a, b) => b.score - a.score)
}
