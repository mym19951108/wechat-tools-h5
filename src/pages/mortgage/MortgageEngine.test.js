import { describe, it, expect } from 'vitest'
import { calculateMortgage } from './MortgageEngine.js'

describe('calculateMortgage', () => {
  it('calculates equal installment correctly', () => {
    const result = calculateMortgage({ principal: 1000000, annualRate: 3.25, years: 30 })
    expect(result.equalInstallment.monthly).toBeGreaterThan(4000)
    expect(result.equalInstallment.monthly).toBeLessThan(5000)
    expect(result.equalInstallment.schedule.length).toBe(360)
  })

  it('calculates equal principal correctly', () => {
    const result = calculateMortgage({ principal: 500000, annualRate: 4.0, years: 20 })
    expect(result.equalPrincipal.firstMonthly).toBeGreaterThan(result.equalPrincipal.lastMonthly)
    expect(result.equalPrincipal.schedule.length).toBe(240)
  })

  it('total payment > principal', () => {
    const result = calculateMortgage({ principal: 1000000, annualRate: 5.0, years: 10 })
    expect(result.equalInstallment.totalPayment).toBeGreaterThan(1000000)
    expect(result.equalPrincipal.totalPayment).toBeGreaterThan(1000000)
  })

  it('equal principal total interest < equal installment total interest', () => {
    const result = calculateMortgage({ principal: 1000000, annualRate: 4.5, years: 30 })
    expect(result.equalPrincipal.totalInterest).toBeLessThan(result.equalInstallment.totalInterest)
  })
})
