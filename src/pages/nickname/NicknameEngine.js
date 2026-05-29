const wordPools = {
  ancient: {
    prefixes: ['墨', '清', '云', '暮', '寒', '夜', '月', '花', '雨', '雪', '风', '烟', '梦', '醉', '忆'],
    suffixes: ['公子', '书生', '墨客', '逍遥', '倾城', '如画', '未央', '流年', '浮生', '长安', '陌上', '江南', '白衣', '青衫', '归人'],
    standalone: ['清风明月', '一蓑烟雨', '落花无言', '人淡如菊', '空谷幽兰', '暗香疏影', '闲云野鹤', '高山流水', '曲水流觞', '大漠孤烟']
  },
  simple: {
    prefixes: ['小', '阿', '大', '老', '微', '浅', '素', '白', '轻', '暖'],
    suffixes: ['丸子', '团子', '饼干', '豆子', '七', '九', '十一', '同学', '先生', '薄荷', '柠檬', '柚子', '芒果', '布丁', '棉花糖']
  },
  cute: {
    prefixes: ['奶', '糖', '甜', '萌', '软', '糯', '泡', '圆', '胖', '肉'],
    suffixes: ['可爱多', '小仙女', '小可爱', '小甜甜', '小团子', '小朋友', '小太阳', '小月亮', '小星星', '小饼干', '小蛋糕', '小草莓', '小樱桃', '小布偶', '小奶猫']
  },
  cool: {
    prefixes: ['暗', '影', '极', '绝', '狂', '冷', '孤', '独', '霸', '狠'],
    suffixes: ['冷酷到底', '傲视群雄', '唯我独尊', '不可一世', '无敌是多么寂寞', '黑夜传说', '幽灵刺客', '末日审判', '王者归来', '逆天改命', '深渊凝视', '风暴之眼', '雷霆万钧', '烈焰战神', '冰封王座']
  }
}

function randomPick(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function generateNicknames(style) {
  const pool = wordPools[style]
  if (!pool) return []

  const results = new Set()
  const comboCount = Math.min(6, pool.prefixes.length)
  const prefixes = randomPick(pool.prefixes, comboCount)
  const suffixes = randomPick(pool.suffixes, comboCount)

  for (const pre of prefixes) {
    for (const suf of suffixes) {
      if (results.size >= 10) break
      results.add(pre + suf)
    }
  }

  if (pool.standalone) {
    const extras = randomPick(pool.standalone, 10 - results.size)
    extras.forEach(e => results.add(e))
  }

  while (results.size < 10) {
    const pre = pool.prefixes[Math.floor(Math.random() * pool.prefixes.length)]
    const suf = pool.suffixes[Math.floor(Math.random() * pool.suffixes.length)]
    results.add(pre + suf)
  }

  return Array.from(results).slice(0, 12)
}
