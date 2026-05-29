// Build poetry-map.js from local poetry JSON files
// Usage: node scripts/build-poetry-db.js
import fs from 'fs'
import path from 'path'
import { cut } from 'jieba-wasm'

const SCRIPTS_DIR = path.resolve('./scripts')
const OUTPUT_DIR = path.resolve('./src/data')

// Split by Chinese punctuation to avoid cross-punctuation extractions
const PUNCT_REGEX = /[，。！？、；：\s\n\r]+/g

function splitSegments(line) {
  return line.split(PUNCT_REGEX).filter(s => s.length >= 2)
}

// Wuxing annotations for common naming chars
const MANUAL_WUXING = {
  '宇': '土', '泽': '水', '轩': '土', '辰': '土', '铭': '金', '睿': '金',
  '博': '水', '昊': '火', '哲': '火', '毅': '木', '霖': '水', '熙': '水',
  '煜': '火', '航': '水', '瑞': '金', '璟': '火', '谦': '木', '朗': '火',
  '楷': '木', '泓': '水', '涵': '水', '萱': '木', '琪': '木', '瑶': '火',
  '悦': '金', '诗': '金', '雅': '木', '婉': '土', '晴': '火', '欣': '木',
  '琳': '木', '怡': '土', '彤': '火', '昕': '火', '蔓': '木', '岚': '土',
  '璇': '火', '雪': '水', '妍': '水', '颖': '木', '安': '土', '文': '水',
  '晨': '火', '宁': '火', '远': '土',
  '清': '水', '明': '火', '华': '水', '志': '火', '思': '金', '德': '火',
  '仁': '金', '义': '木', '礼': '火', '信': '金', '智': '火', '勇': '土',
  '嘉': '木', '永': '土', '乐': '火', '平': '水', '康': '木', '健': '木',
  '杰': '木', '豪': '水', '英': '木', '伟': '土', '浩': '水', '然': '金',
  '达': '火', '通': '火', '畅': '火', '和': '水', '祥': '金', '善': '金',
  '美': '水', '良': '火', '真': '金', '诚': '金', '实': '金',
  '子': '水', '君': '木', '若': '木', '如': '金', '心': '金', '意': '土',
  '天': '火', '地': '土', '日': '火', '月': '木', '星': '火', '云': '水',
  '风': '水', '雨': '水', '露': '水', '霜': '水',
  '山': '土', '石': '土', '岳': '木', '峰': '土', '岩': '土', '岭': '土',
  '江': '水', '河': '水', '湖': '水', '海': '水', '溪': '水', '泉': '水',
  '林': '木', '树': '木', '松': '木', '柏': '木', '柳': '木', '梅': '木',
  '竹': '木', '兰': '木', '菊': '木', '莲': '木', '荷': '木', '桂': '木',
  '龙': '火', '凤': '水', '鹤': '水', '鹏': '水', '鸿': '水', '燕': '火',
  '玉': '金', '金': '金', '银': '金', '锦': '金', '钧': '金', '钦': '金',
  '钰': '金', '铎': '金', '锐': '金', '锋': '金', '镜': '金', '钟': '金',
  '春': '木', '夏': '火', '秋': '金', '冬': '水', '朝': '金', '夕': '金',
  '东': '木', '南': '火', '西': '金', '北': '水', '中': '土', '正': '金',
  '一': '水', '元': '木', '亨': '水', '利': '火', '贞': '火', '吉': '木',
  '世': '金', '代': '火', '承': '金', '继': '木', '启': '木', '开': '木',
  '宏': '水', '大': '火', '光': '火', '辉': '火', '耀': '火', '焕': '火',
  '国': '木', '庆': '木', '盛': '金', '昌': '火', '兴': '水', '隆': '火',
  '庆': '木', '丰': '火', '富': '水', '贵': '木', '福': '水', '寿': '金',
  '延': '土', '长': '火', '茂': '木', '荣': '木', '芳': '木', '秀': '金',
  '静': '金', '娴': '土', '淑': '金', '慧': '水', '敏': '水', '巧': '木',
  '妙': '水', '韵': '土', '幽': '土', '淡': '水', '素': '金', '纯': '金',
  '洁': '水', '白': '水', '丹': '火', '青': '金', '紫': '金', '翠': '金',
  '思': '金', '念': '火', '怀': '水', '忆': '土', '望': '水', '盼': '水',
  '雄': '水', '威': '土', '猛': '水', '刚': '金', '强': '木', '壮': '金',
  '奇': '木', '特': '火', '异': '土', '卓': '火', '超': '金', '越': '土',
  '万': '水', '千': '金', '百': '水', '九': '木', '三': '木', '十': '金',
  '少': '金', '伯': '水', '仲': '火', '叔': '金', '季': '木',
  '道': '火', '理': '火', '法': '水', '则': '金', '度': '木', '章': '火'
}

const BLOCKLIST = new Set(
  '悲恨死伤残亡绝弃败衰落病痛苦怨恨仇辱耻废毁灭丧凶邪恶毒灾祸咎丑劣殁殂夭折薨逝殒鬼魅妖孽'.split('')
)
const WHITELIST = new Set(Object.keys(MANUAL_WUXING))

function getWuxing(char) { return MANUAL_WUXING[char] || null }

// Extract valid Chinese 2-char name pairs using jieba word segmentation
function extractCombos(line) {
  const combos = []
  const seen = new Set()
  const segments = splitSegments(line)

  for (const seg of segments) {
    // Also try extracting adjacent pairs from the raw segment (catches poetic patterns jieba misses)
    const chars = [...seg].filter(c => /^[一-鿿]$/.test(c))
    if (chars.length >= 2) {
      // Adjacent pairs (primary pattern)
      for (let i = 0; i < chars.length - 1; i++) {
        const pair = chars[i] + chars[i + 1]
        if (!seen.has(pair)) { seen.add(pair); combos.push({ chars: pair, c1: chars[i], c2: chars[i + 1], text: seg }) }
      }
    }

    // Jieba word-level extraction (validates against known vocabulary)
    const words = cut(seg)
    const word2Chars = words.filter(w => w.length === 2)
    for (const word of word2Chars) {
      const key = word
      if (!seen.has(key)) {
        seen.add(key)
        combos.push({ chars: word, c1: word[0], c2: word[1], text: seg })
      }
    }
  }

  return combos
}

function isValid(c1, c2) {
  if (!WHITELIST.has(c1) || !WHITELIST.has(c2)) return false
  if (BLOCKLIST.has(c1) || BLOCKLIST.has(c2)) return false
  if (c1 === c2) return false
  const w1 = getWuxing(c1), w2 = getWuxing(c2)
  if (!w1 || !w2) return false
  return true
}

function processPoems(entries, sourceName, getLines) {
  const all = []
  for (const entry of entries) {
    const lines = getLines(entry)
    const title = entry.title || '佚名'
    const author = entry.author || '佚名'
    for (const line of lines) {
      if (!line || line.length < 2) continue
      const combos = extractCombos(line)
      for (const c of combos) {
        if (!isValid(c.c1, c.c2)) continue
        all.push({
          chars: c.chars,
          char1: c.c1, char2: c.c2,
          wuxing: getWuxing(c.c1) + getWuxing(c.c2),
          text: c.text || seg,
          poem: title,
          source: `${author}《${title}》`
        })
      }
    }
  }
  console.log(`  ${sourceName}: ${entries.length} poems → ${all.length} name combos`)
  return all
}

function main() {
  console.log('=== Building poetry name database from local JSON ===\n')

  const allResults = []

  // 诗经
  const sj = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, '诗经.json'), 'utf8'))
  allResults.push(...processPoems(sj, '诗经', e => e.content || []))

  // 楚辞
  const cc = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, '楚辞.json'), 'utf8'))
  allResults.push(...processPoems(cc, '楚辞', e => e.content || []))

  // 唐诗三百首
  const ts = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, '唐诗三百首.json'), 'utf8'))
  allResults.push(...processPoems(ts, '唐诗', e => e.paragraphs || []))

  // 宋词三百首
  const sc = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, '宋词三百首.json'), 'utf8'))
  allResults.push(...processPoems(sc, '宋词', e => e.paragraphs || []))

  // Deduplicate by chars
  const seen = new Set()
  const unique = []
  for (const r of allResults) {
    const key = r.chars + '|' + r.poem
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(r)
  }
  console.log(`\nTotal unique name pairs: ${unique.length}`)

  // Group by wuxing
  const groups = {}
  for (const r of unique) {
    const key = r.wuxing
    if (!groups[key]) groups[key] = []
    groups[key].push({
      chars: r.chars, char1: r.char1, char2: r.char2,
      text: r.text, poem: r.poem, source: r.source
    })
  }

  console.log(`Wuxing groups: ${Object.keys(groups).length}`)
  for (const [k, v] of Object.entries(groups)) {
    console.log(`  ${k}: ${v.length} names`)
  }

  // Collect all unique chars
  const uniqueCharsMap = {}
  for (const r of unique) {
    for (const ch of [r.char1, r.char2]) {
      if (!uniqueCharsMap[ch]) {
        uniqueCharsMap[ch] = { char: ch, wuxing: getWuxing(ch), strokes: 8, score: 85 }
      }
    }
  }
  const allChars = Object.values(uniqueCharsMap)
  console.log(`Unique name chars: ${allChars.length}`)

  // Gender split (heuristic)
  const girlSet = new Set('婉妍萱琪瑶诗雅晴琳怡彤蔓颖雪悦璇昕娴淑慧妙韵翠丹凤燕莲荷梅兰桂菊柳露霜'.split(''))
  const boySet = new Set('宇轩辰铭睿博昊哲毅霖煜航瑞璟谦朗楷泓刚强勇伟杰豪龙鹏鸿钧钦锋锐'.split(''))
  const neutralSet = new Set('安文晨宁愿一永恒平和乐仁义礼智信善美真诚子君若如'.split(''))

  const boy = [], girl = [], neutral = []
  const used = new Set()
  for (const c of allChars) {
    if (used.has(c.char)) continue
    if (neutralSet.has(c.char)) { neutral.push(c); used.add(c.char) }
    else if (girlSet.has(c.char)) { girl.push(c); used.add(c.char) }
    else if (boySet.has(c.char)) { boy.push(c); used.add(c.char) }
  }
  for (const c of allChars) {
    if (!used.has(c.char)) { neutral.push(c); used.add(c.char) }
  }

  console.log(`Chars: boy=${boy.length} girl=${girl.length} neutral=${neutral.length}`)

  // Write outputs
  const poetryContent = `// Generated by scripts/build-poetry-db.js from local poetry JSON
// Sources: 诗经(305) 楚辞(65) 唐诗三百首(366) 宋词三百首(280)
// Total: ${unique.length} unique name pairs, ${allChars.length} unique chars
export const wuxingPoetryNames = ${JSON.stringify(groups, null, 2)}
`

  const pPath = path.join(OUTPUT_DIR, 'poetry-map.js')
  fs.writeFileSync(pPath, poetryContent)
  console.log(`\nWritten: src/data/poetry-map.js (${(poetryContent.length / 1024).toFixed(1)} KB)`)

  const namesContent = `// Generated by scripts/build-poetry-db.js from local poetry JSON
export const nameChars = {
  boy: ${JSON.stringify(boy, null, 2)},
  girl: ${JSON.stringify(girl, null, 2)},
  neutral: ${JSON.stringify(neutral, null, 2)}
}
`
  const nPath = path.join(OUTPUT_DIR, 'names.js')
  fs.writeFileSync(nPath, namesContent)
  console.log(`Written: src/data/names.js (${(namesContent.length / 1024).toFixed(1)} KB)`)
  console.log('\n=== Done ===')
}

main()
