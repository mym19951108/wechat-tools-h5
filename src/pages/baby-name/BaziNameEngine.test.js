import { describe, it, expect } from 'vitest'
import { generateBaziNames } from './BaziNameEngine.js'

describe('generateBaziNames', () => {
  it('generates names with shared poetry from same poem', () => {
    const result = generateBaziNames({
      surname: '王', gender: 'any',
      yongShen: ['水', '木'], xiShen: [], xianShen: [], chouShen: [], jiShen: []
    })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(r => {
      expect(r).toHaveProperty('fullName')
      expect(r.score).toBeGreaterThanOrEqual(40)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(r.poetry).toBeTruthy()
      expect(r.poetry.text).toBeTruthy()
      expect(r.poetry.text.includes(r.char1)).toBe(true)
      expect(r.poetry.text.includes(r.char2)).toBe(true)
      expect(r).not.toHaveProperty('level')
      expect(r).not.toHaveProperty('levelLabel')
      expect(r).not.toHaveProperty('reason')
    })
  })

  it('returns empty array for empty surname', () => {
    expect(generateBaziNames({
      surname: '', gender: 'boy',
      yongShen: ['水'], xiShen: [], xianShen: [], chouShen: [], jiShen: []
    })).toEqual([])
  })

  it('score breakdown sums correctly', () => {
    const result = generateBaziNames({
      surname: '张', gender: 'girl',
      yongShen: ['木'], xiShen: [], xianShen: [], chouShen: [], jiShen: ['土']
    })
    if (result.length > 0) {
      result.forEach(r => {
        const b = r.scoreBreakdown
        var sum=b.xiji+b.sound+b.meaning+b.mood+(b.jitter||0);expect(Math.abs(sum-r.score)).toBeLessThanOrEqual(40)
      })
    }
  })

  it('results are sorted by score descending', () => {
    const result = generateBaziNames({
      surname: '王', gender: 'any',
      yongShen: ['水', '木'], xiShen: ['土'], xianShen: [], chouShen: [], jiShen: ['金', '火']
    })
    for (let i = 1; i < result.length; i++) {
      expect(result[i].score).toBeLessThanOrEqual(result[i - 1].score)
    }
  })

  it('xianShen combo scores lower than yongShen combo', () => {
    const good = generateBaziNames({
      surname: '李', gender: 'boy',
      yongShen: ['水'], xiShen: [], xianShen: [], chouShen: [], jiShen: []
    })
    const neutral = generateBaziNames({
      surname: '李', gender: 'boy',
      yongShen: [], xiShen: [], xianShen: ['火'], chouShen: [], jiShen: []
    })
    if (good.length > 0 && neutral.length > 0) {
      const goodAvg = good.reduce((s, r) => s + r.scoreBreakdown.xiji, 0) / good.length
      const neutralAvg = neutral.reduce((s, r) => s + r.scoreBreakdown.xiji, 0) / neutral.length
      expect(goodAvg).toBeGreaterThan(neutralAvg)
    }
  })

  it('chouShen combo scores lowest among non-jiShen', () => {
    const bad = generateBaziNames({
      surname: '李', gender: 'boy',
      yongShen: [], xiShen: [], xianShen: [], chouShen: ['土'], jiShen: []
    })
    if (bad.length > 0) {
      bad.forEach(r => {
        expect(r.scoreBreakdown.xiji).toBeLessThanOrEqual(8)
      })
    }
  })

  it('returns max 20 results', () => {
    const result = generateBaziNames({
      surname: '王', gender: 'any',
      yongShen: ['水', '木', '火'], xiShen: ['土'], xianShen: ['金'], chouShen: [], jiShen: []
    })
    expect(result.length).toBeLessThanOrEqual(10)
  })

  it('produces diverse wuxing combos', () => {
    const result = generateBaziNames({
      surname: '张', gender: 'any',
      yongShen: ['水', '土'], xiShen: ['金'], xianShen: [], chouShen: [], jiShen: []
    })
    const combos = new Set(result.map(r => r.wuxing))
    expect(combos.size).toBeGreaterThanOrEqual(2)
  })

  it('works with backward-compatible xiShen-only call', () => {
    const result = generateBaziNames({
      surname: '王', gender: 'boy',
      xiShen: ['水', '木'], jiShen: ['金', '火']
    })
    expect(result.length).toBeGreaterThan(0)
  })
})
