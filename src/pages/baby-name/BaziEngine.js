import { Solar } from 'lunar-javascript'

const WUXING_ELEMENTS = ['金', '木', '水', '火', '土']

const KE_MAP = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' }
const SHENG_MAP = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' }

const KE_BY_MAP = {}
for (const [k, v] of Object.entries(KE_MAP)) KE_BY_MAP[v] = k
const SHENG_BY_MAP = {}
for (const [k, v] of Object.entries(SHENG_MAP)) SHENG_BY_MAP[v] = k

const STEM_WX = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
}

function seasonElement(lunarMonth) {
  if (lunarMonth >= 1 && lunarMonth <= 3) return '木'
  if (lunarMonth >= 4 && lunarMonth <= 6) return '火'
  if (lunarMonth >= 7 && lunarMonth <= 9) return '金'
  return '水'
}

function countWuxing(eightChar) {
  const count = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
  const add = (str) => { for (const c of str) { count[c] = (count[c] || 0) + 1 } }
  add(eightChar.getYearWuXing())
  add(eightChar.getMonthWuXing())
  add(eightChar.getDayWuXing())
  add(eightChar.getTimeWuXing())
  return count
}

function findMissing(wuxingCount) {
  return WUXING_ELEMENTS.filter(e => wuxingCount[e] === 0)
}

function analyzeXiji(dayStemWx, lunarMonth) {
  const season = seasonElement(lunarMonth)
  const shenQiang = dayStemWx === season

  let xiShen = []
  let jiShen = []
  let description = ''

  if (shenQiang) {
    xiShen = [KE_BY_MAP[dayStemWx], SHENG_MAP[dayStemWx], KE_MAP[dayStemWx]].filter(Boolean)
    jiShen = [SHENG_BY_MAP[dayStemWx], dayStemWx].filter(Boolean)
    xiShen = [...new Set(xiShen)]
    jiShen = [...new Set(jiShen)]
    description = `日主${dayStemWx}在${season}季得令，身强。宜克泄耗，${xiShen.join('、')}为喜用神。`
  } else {
    xiShen = [SHENG_BY_MAP[dayStemWx], dayStemWx].filter(Boolean)
    jiShen = [KE_BY_MAP[dayStemWx], SHENG_MAP[dayStemWx], KE_MAP[dayStemWx]].filter(Boolean)
    xiShen = [...new Set(xiShen)]
    jiShen = [...new Set(jiShen)]
    description = `日主${dayStemWx}在${season}季失令，身弱。宜生扶，${xiShen.join('、')}为喜用神。`
  }

  return { xiShen, jiShen, shenQiang, description }
}

export function analyzeBazi(year, month, day, hour) {
  const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()

  const yearPillar = { stem: eightChar.getYearGan(), branch: eightChar.getYearZhi() }
  const monthPillar = { stem: eightChar.getMonthGan(), branch: eightChar.getMonthZhi() }
  const dayPillar = { stem: eightChar.getDayGan(), branch: eightChar.getDayZhi() }
  const hourPillar = { stem: eightChar.getTimeGan(), branch: eightChar.getTimeZhi() }

  const wuxingCount = countWuxing(eightChar)
  const missing = findMissing(wuxingCount)
  const dayStemWx = STEM_WX[dayPillar.stem]
  const xiji = analyzeXiji(dayStemWx, lunar.getMonth())

  return {
    yearPillar, monthPillar, dayPillar, hourPillar,
    wuxingCount, missing, dayStemWx, xiji,
    lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}日`,
    lunarMonth: lunar.getMonth()
  }
}
