export function calculateMortgage({ principal, annualRate, years }) {
  const months = years * 12
  const monthlyRate = annualRate / 100 / 12

  const pow = Math.pow(1 + monthlyRate, months)
  const equalMonthly = principal * monthlyRate * pow / (pow - 1)

  const eiSchedule = []
  let eiRemaining = principal
  let eiTotalInterest = 0
  for (let i = 1; i <= months; i++) {
    const interest = eiRemaining * monthlyRate
    const principalPaid = equalMonthly - interest
    eiRemaining -= principalPaid
    eiTotalInterest += interest
    eiSchedule.push({
      month: i,
      payment: Math.round(equalMonthly * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remaining: Math.max(0, Math.round(eiRemaining * 100) / 100)
    })
  }

  const epMonthlyPrincipal = principal / months
  const epSchedule = []
  let epRemaining = principal
  let epTotalInterest = 0
  let epFirstMonthly = 0
  let epLastMonthly = 0
  for (let i = 1; i <= months; i++) {
    const interest = epRemaining * monthlyRate
    const payment = epMonthlyPrincipal + interest
    epRemaining -= epMonthlyPrincipal
    epTotalInterest += interest
    if (i === 1) epFirstMonthly = payment
    if (i === months) epLastMonthly = payment
    epSchedule.push({
      month: i,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(epMonthlyPrincipal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remaining: Math.max(0, Math.round(epRemaining * 100) / 100)
    })
  }

  return {
    equalInstallment: {
      monthly: Math.round(equalMonthly * 100) / 100,
      totalPayment: Math.round((equalMonthly * months) * 100) / 100,
      totalInterest: Math.round(eiTotalInterest * 100) / 100,
      schedule: eiSchedule
    },
    equalPrincipal: {
      firstMonthly: Math.round(epFirstMonthly * 100) / 100,
      lastMonthly: Math.round(epLastMonthly * 100) / 100,
      totalPayment: Math.round((principal + epTotalInterest) * 100) / 100,
      totalInterest: Math.round(epTotalInterest * 100) / 100,
      schedule: epSchedule
    }
  }
}
