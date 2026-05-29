import { describe, it, expect } from 'vitest'
import { generateBaziNames } from './BaziNameEngine.js'

describe('generateBaziNames', () => {
  it('generates names with required fields and score 85-100', () => {
    const result = generateBaziNames({ surname: '王', gender: 'boy', xiShen: ['水', '木'], jiShen: ['金', '火'] })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(r => {
      expect(r).toHaveProperty('fullName')
      expect(r.score).toBeGreaterThanOrEqual(85)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(r).toHaveProperty('scoreBreakdown')
      expect(r).toHaveProperty('level')
    })
  })

  it('returns empty array for empty surname', () => {
    expect(generateBaziNames({ surname: '', gender: 'boy', xiShen: ['水'], jiShen: [] })).toEqual([])
  })

  it('score = 85 + bonus breakdown', () => {
    const result = generateBaziNames({ surname: '张', gender: 'girl', xiShen: ['木'], jiShen: ['土'] })
    result.forEach(r => {
      const b = r.scoreBreakdown
      expect(85 + b.xiji + b.poetry + b.sound + b.meaning).toBe(r.score)
    })
  })

  it('all scores 90+ with broad xiShen', () => {
    const result = generateBaziNames({ surname: '陈', gender: 'any', xiShen: ['水', '木', '金', '火', '土'], jiShen: [] })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(r => {
      expect(r.score).toBeGreaterThanOrEqual(90)
    })
  })
})
