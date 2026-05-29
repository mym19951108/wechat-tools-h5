import { describe, it, expect } from 'vitest'
import { generateNicknames } from './NicknameEngine.js'

describe('generateNicknames', () => {
  it('generates at least 10 nicknames for ancient style', () => {
    const result = generateNicknames('ancient')
    expect(result.length).toBeGreaterThanOrEqual(10)
    result.forEach(n => expect(typeof n).toBe('string'))
  })

  it('generates nicknames for each style', () => {
    const styles = ['ancient', 'simple', 'cute', 'cool']
    styles.forEach(style => {
      const result = generateNicknames(style)
      expect(result.length).toBeGreaterThanOrEqual(10)
    })
  })

  it('returns empty array for unknown style', () => {
    expect(generateNicknames('unknown')).toEqual([])
  })
})
