import { describe, it, expect } from 'vitest'
import { analyzeBazi } from './BaziEngine.js'

describe('analyzeBazi', () => {
  it('returns correct four pillars', async () => {
    const result = await analyzeBazi(1990, 5, 20, 12)
    expect(result.yearPillar).toEqual({ stem: '庚', branch: '午' })
    expect(result.monthPillar).toEqual({ stem: '辛', branch: '巳' })
    expect(result.dayPillar).toEqual({ stem: '乙', branch: '酉' })
    expect(result.hourPillar).toEqual({ stem: '壬', branch: '午' })
  })

  it('counts wuxing correctly', async () => {
    const result = await analyzeBazi(1990, 5, 20, 12)
    expect(result.wuxingCount['金']).toBe(3)
    expect(result.wuxingCount['木']).toBe(1)
    expect(result.wuxingCount['水']).toBe(1)
    expect(result.wuxingCount['火']).toBe(3)
    expect(result.wuxingCount['土']).toBe(0)
  })

  it('returns all five god categories', async () => {
    const result = await analyzeBazi(1990, 5, 20, 12)
    expect(result.xiji).toHaveProperty('yongShen')
    expect(result.xiji).toHaveProperty('xiShen')
    expect(result.xiji).toHaveProperty('xianShen')
    expect(result.xiji).toHaveProperty('chouShen')
    expect(result.xiji).toHaveProperty('jiShen')
    expect(result.xiji).toHaveProperty('description')
    const all = [...result.xiji.yongShen, ...result.xiji.xiShen, ...result.xiji.xianShen, ...result.xiji.chouShen, ...result.xiji.jiShen]
    expect(all.length).toBeGreaterThanOrEqual(5)
  })

  it('returns lunar date', async () => {
    const result = await analyzeBazi(1990, 5, 20, 12)
    expect(result.lunarDate).toBeTruthy()
  })

  it('works for edge cases', async () => {
    const r1 = await analyzeBazi(2000, 1, 1, 0)
    expect(r1.yearPillar.stem).toBeTruthy()
  })
})
