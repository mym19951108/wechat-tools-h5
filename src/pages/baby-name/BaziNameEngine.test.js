import { describe, it, expect } from 'vitest'
import { generateBaziNames } from './BaziNameEngine.js'

describe('generateBaziNames', () => {
  it('generates names with poetry source for normal input', () => {
    const result = generateBaziNames({ surname: '王', gender: 'boy', xiShen: ['水', '木'], jiShen: ['金', '火'] })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(r => {
      expect(r).toHaveProperty('fullName')
      expect(r.score).toBeGreaterThanOrEqual(70)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(r.poetry).toBeTruthy()
      expect(r.poetry.text).toBeTruthy()
    })
  })

  it('returns empty array for empty surname', () => {
    expect(generateBaziNames({ surname: '', gender: 'boy', xiShen: ['水'], jiShen: [] })).toEqual([])
  })

  it('all names come from poetry', () => {
    const result = generateBaziNames({ surname: '陈', gender: 'any', xiShen: ['水', '木', '金', '火', '土'], jiShen: [] })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(r => {
      expect(r.poetry).toBeTruthy()
      expect(r.level).toBe('samePoem')
    })
  })

  it('score equals breakdown sum', () => {
    const result = generateBaziNames({ surname: '张', gender: 'girl', xiShen: ['木'], jiShen: ['土'] })
    if (result.length > 0) {
      result.forEach(r => {
        const b = r.scoreBreakdown
        expect(b.xiji + b.poetry + b.sound + b.meaning).toBe(r.score)
      })
    }
  })
})
