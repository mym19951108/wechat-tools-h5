const WUXING_ELEMENTS = ['金', '木', '水', '火', '土']

const KE_MAP = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' }
const SHENG_MAP = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' }
const KE_BY_MAP = {}; for (const [k, v] of Object.entries(KE_MAP)) KE_BY_MAP[v] = k
const SHENG_BY_MAP = {}; for (const [k, v] of Object.entries(SHENG_MAP)) SHENG_BY_MAP[v] = k

const STEM_WX = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
}

// Hidden stems in each earthly branch (地支藏干)
const HIDDEN_STEMS = {
  '子': '癸', '丑': '己癸辛', '寅': '甲丙戊', '卯': '乙',
  '辰': '戊乙癸', '巳': '丙庚戊', '午': '丁己', '未': '己丁乙',
  '申': '庚壬戊', '酉': '辛', '戌': '戊辛丁', '亥': '壬甲'
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

function getHiddenCount(eightChar) {
  const count = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
  for (const branch of [eightChar.getYearZhi(), eightChar.getMonthZhi(), eightChar.getDayZhi(), eightChar.getTimeZhi()]) {
    const stems = HIDDEN_STEMS[branch] || ''
    for (const c of stems) { const wx = STEM_WX[c]; if (wx) count[wx] = (count[wx] || 0) + 1 }
  }
  return count
}

// 穷通宝鉴 调候用神表: 10天干 × 12月 → [用神, 喜神]
// Key: stem + month (1=寅,2=卯...12=丑)
const QIONG_TONG = {
  '甲1':[['丙','癸'],[]], '甲2':[['丙','丁','庚'],[]], '甲3':[['庚','丁','壬'],[]], '甲4':[['癸','丁','庚'],[]],
  '甲5':[['癸','丁','庚'],[]], '甲6':[['癸','丁','庚'],[]], '甲7':[['庚','丁','壬'],[]], '甲8':[['丁','壬','庚'],[]],
  '甲9':[['庚','甲','丁'],[]], '甲10':[['庚','丁','戊'],[]], '甲11':[['庚','丁','戊'],[]], '甲12':[['庚','丙'],[]],
  '乙1':[['丙','癸'],[]], '乙2':[['丙','癸'],[]], '乙3':[['癸','戊'],[]], '乙4':[['癸'],[]],
  '乙5':[['癸','丙'],[]], '乙6':[['癸','丙'],[]], '乙7':[['丙','癸','己'],[]], '乙8':[['癸','丙'],[]],
  '乙9':[['癸','辛'],[]], '乙10':[['丙','戊'],[]], '乙11':[['丙','戊'],[]], '乙12':[['丙'],[]],
  '丙1':[['壬','庚'],[]], '丙2':[['壬','己'],[]], '丙3':[['壬','甲'],[]], '丙4':[['壬','庚'],[]],
  '丙5':[['壬','庚'],[]], '丙6':[['壬','庚'],[]], '丙7':[['壬','戊'],[]], '丙8':[['壬','癸'],[]],
  '丙9':[['甲','壬'],[]], '丙10':[['甲','戊','壬'],[]], '丙11':[['壬','戊','甲'],[]], '丙12':[['甲','戊'],[]],
  '丁1':[['甲','庚'],[]], '丁2':[['庚','甲'],[]], '丁3':[['甲','庚'],[]], '丁4':[['甲','庚'],[]],
  '丁5':[['壬','庚','癸'],[]], '丁6':[['甲','壬','庚'],[]], '丁7':[['甲','庚','戊'],[]], '丁8':[['甲','庚','丙'],[]],
  '丁9':[['甲','庚','戊'],[]], '丁10':[['甲','庚'],[]], '丁11':[['甲','庚'],[]], '丁12':[['甲','庚'],[]],
  '戊1':[['丙','甲','癸'],[]], '戊2':[['丙','甲','癸'],[]], '戊3':[['甲','丙','癸'],[]], '戊4':[['甲','丙','癸'],[]],
  '戊5':[['壬','甲','丙'],[]], '戊6':[['癸','丙','甲'],[]], '戊7':[['丙','癸','甲'],[]], '戊8':[['丙','癸'],[]],
  '戊9':[['甲','丙','癸'],[]], '戊10':[['甲','戊'],[]], '戊11':[['丙','甲'],[]], '戊12':[['丙','甲'],[]],
  '己1':[['丙','庚','甲'],[]], '己2':[['甲','癸','丙'],[]], '己3':[['丙','癸','甲'],[]], '己4':[['癸','丙'],[]],
  '己5':[['癸','丙'],[]], '己6':[['癸','丙'],[]], '己7':[['丙','癸'],[]], '己8':[['丙','癸'],[]],
  '己9':[['甲','丙','癸'],[]], '己10':[['丙','甲','戊'],[]], '己11':[['丙','甲','戊'],[]], '己12':[['丙','甲'],[]],
  '庚1':[['戊','甲','丙'],[]], '庚2':[['丁','甲','丙'],[]], '庚3':[['甲','丁','壬'],[]], '庚4':[['壬','戊','丙'],[]],
  '庚5':[['壬','戊','癸'],[]], '庚6':[['丁','甲','庚'],[]], '庚7':[['丁','甲'],[]], '庚8':[['丁','甲','丙'],[]],
  '庚9':[['甲','壬'],[]], '庚10':[['丁','丙'],[]], '庚11':[['丁','甲','丙'],[]], '庚12':[['丁','甲','丙'],[]],
  '辛1':[['己','壬','庚'],[]], '辛2':[['壬','甲'],[]], '辛3':[['壬','甲'],[]], '辛4':[['壬','甲','癸'],[]],
  '辛5':[['壬','己','癸'],[]], '辛6':[['壬','庚','甲'],[]], '辛7':[['壬','甲','戊'],[]], '辛8':[['壬','甲'],[]],
  '辛9':[['壬','甲'],[]], '辛10':[['壬','丙'],[]], '辛11':[['丙','戊','壬'],[]], '辛12':[['丙','壬','戊','己'],[]],
  '壬1':[['庚','戊','丙'],[]], '壬2':[['戊','辛','庚'],[]], '壬3':[['戊','庚'],[]], '壬4':[['壬','辛','庚'],[]],
  '壬5':[['庚','癸'],[]], '壬6':[['辛','甲'],[]], '壬7':[['戊','丁'],[]], '壬8':[['辛','甲'],[]],
  '壬9':[['甲','丙'],[]], '壬10':[['戊','丙','庚'],[]], '壬11':[['戊','丙','庚'],[]], '壬12':[['丙','丁'],[]],
  '癸1':[['辛','丙'],[]], '癸2':[['丙','辛'],[]], '癸3':[['丙','辛','甲'],[]], '癸4':[['辛'],[]],
  '癸5':[['辛','庚','癸'],[]], '癸6':[['辛','庚'],[]], '癸7':[['丁','庚'],[]], '癸8':[['辛','丙'],[]],
  '癸9':[['辛','甲','壬'],[]], '癸10':[['庚','辛','戊'],[]], '癸11':[['庚','辛','丙','戊'],[]], '癸12':[['丙','辛'],[]],
}

const STEM_NAMES = { '甲': 1, '乙': 2, '丙': 3, '丁': 4, '戊': 5, '己': 6, '庚': 7, '辛': 8, '壬': 9, '癸': 10 }

function analyzeXiji(dayStemWx, dayGan, surfaceCount, hiddenCount, lunarMonth) {
  const season = seasonElement(lunarMonth)
  const dayStem = dayStemWx

  // Get 穷通宝鉴 recommendation
  const baziMonth = lunarMonth  // 1=寅月...12=丑月
  const key = dayGan + String(baziMonth)
  const qtRule = QIONG_TONG[key]

  // Total strength calculation
  const totalSupport = (surfaceCount[dayStem] || 0) + (hiddenCount[dayStem] || 0)
  const shengCount = (surfaceCount[SHENG_BY_MAP[dayStem]] || 0) + (hiddenCount[SHENG_BY_MAP[dayStem]] || 0)
  const keCount = (surfaceCount[KE_BY_MAP[dayStem]] || 0) + (hiddenCount[KE_BY_MAP[dayStem]] || 0)
  const drainCount = (surfaceCount[SHENG_MAP[dayStem]] || 0) + (hiddenCount[SHENG_MAP[dayStem]] || 0)
  let seasonBonus = 0
  if (dayStem === season) seasonBonus = 2
  else if (SHENG_BY_MAP[dayStem] === season) seasonBonus = 1

  const strength = totalSupport + shengCount * 0.7 + seasonBonus
  const weakness = keCount + drainCount * 0.7
  const shenQiang = strength >= weakness * 1.2  // 20% margin

  let yongShen, xiShen, jiShen, description

  if (qtRule && qtRule[0].length > 0) {
    // 穷通宝鉴 rules → convert stems to wuxing elements
    yongShen = [...new Set(qtRule[0].map(s => STEM_WX[s]).filter(Boolean))]
    xiShen = [...new Set((qtRule[1] || []).map(s => STEM_WX[s]).filter(Boolean))]
    const allFav = new Set([...yongShen, ...xiShen, dayStem])
    jiShen = WUXING_ELEMENTS.filter(w => !allFav.has(w))
    description = `日主${dayGan}(${dayStem})生${['','寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'][baziMonth]}月，穷通宝鉴：用${yongShen.join('、')}。`
  } else {
    if (shenQiang) {
      yongShen = [KE_BY_MAP[dayStem], SHENG_MAP[dayStem], KE_MAP[dayStem]].filter(Boolean)
      jiShen = [SHENG_BY_MAP[dayStem], dayStem].filter(Boolean)
      description = `日主${dayGan}(${dayStem})身强。克泄耗为用。`
    } else {
      yongShen = [SHENG_BY_MAP[dayStem], dayStem].filter(Boolean)
      jiShen = [KE_BY_MAP[dayStem], SHENG_MAP[dayStem], KE_MAP[dayStem]].filter(Boolean)
      description = `日主${dayGan}(${dayStem})身弱。生扶为用。`
    }
  }

  yongShen = [...new Set(yongShen)]
  xiShen = [...new Set(xiShen.filter(e => !yongShen.includes(e)))]
  jiShen = [...new Set(jiShen)]

  const chouShen = [...new Set(yongShen.map(w => KE_BY_MAP[w]).filter(Boolean))]
    .filter(w => !yongShen.includes(w) && !jiShen.includes(w))
  const used = new Set([...yongShen, ...xiShen, ...jiShen, ...chouShen])
  const xianShen = WUXING_ELEMENTS.filter(w => !used.has(w))

  return { yongShen, xiShen, xianShen, chouShen, jiShen, shenQiang, description }
}

export function analyzeBazi(year, month, day, hour) {
  return import('lunar-javascript').then(({ Solar }) => {
    const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0)
    const lunar = solar.getLunar()
    const eightChar = lunar.getEightChar()

    const yearPillar = { stem: eightChar.getYearGan(), branch: eightChar.getYearZhi() }
    const monthPillar = { stem: eightChar.getMonthGan(), branch: eightChar.getMonthZhi() }
    const dayPillar = { stem: eightChar.getDayGan(), branch: eightChar.getDayZhi() }
    const hourPillar = { stem: eightChar.getTimeGan(), branch: eightChar.getTimeZhi() }

    const surfaceCount = countWuxing(eightChar)
    const hiddenCount = getHiddenCount(eightChar)
    const dayStemWx = STEM_WX[dayPillar.stem]
    const xiji = analyzeXiji(dayStemWx, eightChar.getDayGan(), surfaceCount, hiddenCount, lunar.getMonth())

    return {
      yearPillar, monthPillar, dayPillar, hourPillar,
      wuxingCount: surfaceCount, dayStemWx, xiji,
      lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}日`,
      lunarMonth: lunar.getMonth()
    }
  })
}
