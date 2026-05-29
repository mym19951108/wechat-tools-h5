import { describe, it, expect } from 'vitest'
import { generateNames } from './BabyNameEngine.js'

describe('generateNames', () => {
  it('generates at least 20 names for a given surname and gender', () => {
    const result = generateNames({ surname: '张', gender: 'boy' })
    expect(result.length).toBeGreaterThanOrEqual(20)
    result.forEach(name => {
      expect(name.fullName).toMatch(/^张/)
      expect(name.fullName.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('generates girl names', () => {
    const result = generateNames({ surname: '李', gender: 'girl' })
    expect(result.length).toBeGreaterThanOrEqual(20)
  })

  it('generates neutral names when gender is "any"', () => {
    const result = generateNames({ surname: '王', gender: 'any' })
    expect(result.length).toBeGreaterThanOrEqual(20)
  })

  it('each name has required fields', () => {
    const result = generateNames({ surname: '陈', gender: 'boy' })
    const name = result[0]
    expect(name).toHaveProperty('fullName')
    expect(name).toHaveProperty('char1')
    expect(name).toHaveProperty('char2')
    expect(name).toHaveProperty('meaning')
    expect(name).toHaveProperty('wuxing')
    expect(name).toHaveProperty('score')
  })

  it('scores are between 60 and 100', () => {
    const result = generateNames({ surname: '赵', gender: 'girl' })
    result.forEach(name => {
      expect(name.score).toBeGreaterThanOrEqual(60)
      expect(name.score).toBeLessThanOrEqual(100)
    })
  })

  it('returns empty array for empty surname', () => {
    const result = generateNames({ surname: '', gender: 'boy' })
    expect(result).toEqual([])
  })
})
