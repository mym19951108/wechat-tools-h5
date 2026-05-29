import { describe, it, expect } from 'vitest'
import { generateBaziNames } from './BaziNameEngine.js'

describe('generateBaziNames', () => {
  it('generates names with required fields', () => {
    const result = generateBaziNames({ surname: '王', gender: 'boy', xiShen: ['水', '木'], jiShen: ['金', '火'] })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(r => {
      expect(r).toHaveProperty('fullName')
      expect(r).toHaveProperty('score')
      expect(r).toHaveProperty('scoreBreakdown')
      expect(r).toHaveProperty('level')
      expect(r.scoreBreakdown).toHaveProperty('xiji')
      expect(r.scoreBreakdown).toHaveProperty('poetry')
      expect(r.scoreBreakdown).toHaveProperty('sound')
      expect(r.scoreBreakdown).toHaveProperty('meaning')
    })
  })

  it('score is within 0-100 range', () => {
    const result = generateBaziNames({ surname: '李', gender: 'girl', xiShen: ['水'], jiShen: ['火'] })
    result.forEach(r => {
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
    })
  })

  it('returns empty array for empty surname', () => {
    expect(generateBaziNames({ surname: '', gender: 'boy', xiShen: ['水'], jiShen: [] })).toEqual([])
  })

  it('score breakdown sums to total', () => {
    const result = generateBaziNames({ surname: '张', gender: 'girl', xiShen: ['木'], jiShen: ['土'] })
    result.forEach(r => {
      const sum = r.scoreBreakdown.xiji + r.scoreBreakdown.poetry + r.scoreBreakdown.sound + r.scoreBreakdown.meaning
      expect(Math.abs(sum - r.score)).toBeLessThanOrEqual(1)
    })
  })

  it('sameLine names have poetry text', () => {
    const result = generateBaziNames({ surname: '陈', gender: 'any', xiShen: ['水', '木', '金', '火', '土'], jiShen: [] })
    const sameLine = result.filter(r => r.level === 'sameLine')
    sameLine.forEach(r => {
      expect(r.poetry).toBeTruthy()
      expect(r.poetry.text).toBeTruthy()
    })
  })
})
