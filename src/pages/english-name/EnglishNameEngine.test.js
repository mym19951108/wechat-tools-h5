import { describe, it, expect } from 'vitest'
import { matchEnglishNames } from './EnglishNameEngine.js'

describe('matchEnglishNames', () => {
  it('returns at least 5 matches for a Chinese name', () => {
    const result = matchEnglishNames('张伟')
    expect(result.length).toBeGreaterThanOrEqual(5)
  })

  it('each result has required fields', () => {
    const result = matchEnglishNames('李娜')
    expect(result.length).toBeGreaterThan(0)
    const name = result[0]
    expect(name).toHaveProperty('name')
    expect(name).toHaveProperty('meaning')
    expect(name).toHaveProperty('origin')
    expect(name).toHaveProperty('matchType')
  })

  it('returns empty array for empty input', () => {
    expect(matchEnglishNames('')).toEqual([])
  })
})
