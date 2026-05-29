import { describe, it, expect } from 'vitest'
import { analyzeBazi } from './BaziEngine.js'

// Known bazi: 1990-05-20 12:00 → 庚午 辛巳 乙酉 壬午
describe('analyzeBazi', () => {
  it('returns correct four pillars for known birth', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    expect(result.yearPillar).toEqual({ stem: '庚', branch: '午' })
    expect(result.monthPillar).toEqual({ stem: '辛', branch: '巳' })
    expect(result.dayPillar).toEqual({ stem: '乙', branch: '酉' })
    expect(result.hourPillar).toEqual({ stem: '壬', branch: '午' })
  })

  it('counts wuxing correctly for 1990-05-20 12:00', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    expect(result.wuxingCount['金']).toBe(3)
    expect(result.wuxingCount['木']).toBe(1)
    expect(result.wuxingCount['水']).toBe(1)
    expect(result.wuxingCount['火']).toBe(3)
    expect(result.wuxingCount['土']).toBe(0)
  })

  it('finds missing elements correctly', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    expect(result.missing).toContain('土')
    expect(result.missing.length).toBe(1)
  })

  it('day stem wuxing is correct', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    expect(result.dayStemWx).toBe('木')
  })

  it('xiji analysis: dayStem木 in month4(summer/fire) → weak', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    expect(result.xiji.shenQiang).toBe(false)
    expect(result.xiji.xiShen.length).toBeGreaterThan(0)
    expect(result.xiji.jiShen.length).toBeGreaterThan(0)
    expect(result.xiji.description).toContain('身弱')
  })

  it('returns lunar date string', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    expect(result.lunarDate).toBeTruthy()
    expect(typeof result.lunarDate).toBe('string')
  })

  it('works for midnight edge case', () => {
    const result = analyzeBazi(2000, 1, 1, 0)
    expect(result.yearPillar.stem).toBeTruthy()
    expect(result.hourPillar.stem).toBeTruthy()
  })
})
