import { describe, it, expect } from 'vitest'
import { daysBetween, dateAdd, countWorkdays } from './DateCalcEngine.js'

describe('daysBetween', () => {
  it('calculates days between two dates', () => {
    expect(daysBetween('2024-01-01', '2024-01-10')).toBe(9)
  })
  it('returns positive days regardless of order', () => {
    expect(daysBetween('2024-01-10', '2024-01-01')).toBe(9)
  })
  it('returns 0 for same date', () => {
    expect(daysBetween('2024-06-15', '2024-06-15')).toBe(0)
  })
})

describe('dateAdd', () => {
  it('adds N days to a date', () => {
    expect(dateAdd('2024-01-01', 5)).toBe('2024-01-06')
  })
  it('subtracts N days with negative input', () => {
    expect(dateAdd('2024-01-10', -5)).toBe('2024-01-05')
  })
  it('handles month boundary', () => {
    expect(dateAdd('2024-01-31', 1)).toBe('2024-02-01')
  })
  it('handles year boundary', () => {
    expect(dateAdd('2024-12-31', 1)).toBe('2025-01-01')
  })
})

describe('countWorkdays', () => {
  it('counts workdays between two dates', () => {
    const result = countWorkdays('2024-12-30', '2025-01-03')
    expect(result).toBe(5)
  })
  it('excludes weekends', () => {
    const result = countWorkdays('2024-12-28', '2024-12-30')
    expect(result).toBe(1)
  })
})
