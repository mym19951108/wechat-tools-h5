// Build poetry-map.js from local poetry JSON files
// Usage: node scripts/build-poetry-db.js
import fs from 'fs'
import path from 'path'
import { cut } from 'jieba-wasm'

const SCRIPTS_DIR = path.resolve('./scripts')
const OUTPUT_DIR = path.resolve('./src/data')

// Load external data
let STROKE_DATA = {}
let MEANING_DATA = {}
let GENDER_DATA = { male: {}, female: {} }  // char → count
try {
  STROKE_DATA = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, 'stroke-data.json'), 'utf8'))
  console.log(`Loaded stroke data: ${Object.keys(STROKE_DATA).length} chars`)
} catch (e) { console.log('Warning: no stroke-data.json, using defaults') }
try {
  MEANING_DATA = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, 'char-meaning.json'), 'utf8'))
  console.log(`Loaded meaning data: ${Object.keys(MEANING_DATA).length} chars`)
} catch (e) { console.log('Warning: no char-meaning.json, using defaults') }
try {
  // Load 120W name corpus for gender statistics
  const corpusPath = path.join(SCRIPTS_DIR, 'gender-corpus.txt')
  const genderRaw = fs.readFileSync(corpusPath, 'utf8')
  const genderLines = genderRaw.split('\n')
  for (const line of genderLines) {
    if (!line.trim()) continue
    const [name, genderRaw] = line.split(',')
    const gender = genderRaw ? genderRaw.trim() : ''
    if (!name || !gender || gender === '未知') continue
    for (const ch of name) {
      if (gender === '男') GENDER_DATA.male[ch] = (GENDER_DATA.male[ch] || 0) + 1
      else if (gender === '女') GENDER_DATA.female[ch] = (GENDER_DATA.female[ch] || 0) + 1
    }
  }
  const maleChars = Object.keys(GENDER_DATA.male).length
  const femaleChars = Object.keys(GENDER_DATA.female).length
  console.log(`Loaded gender corpus: ${maleChars} male chars, ${femaleChars} female chars`)
} catch (e) { console.log(`Warning: no gender corpus (${e.message}), using hardcoded fallback`) }

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

function getStroke(char) {
  const s = STROKE_DATA[char]
  if (s) return s
  // Fallback: use average for the char's wuxing group
  const wx = getWuxing(char)
  if (wx) {
    const wxCandidates = Object.entries(STROKE_DATA).filter(([ch, _]) => getWuxing(ch) === wx)
    if (wxCandidates.length > 0) {
      return Math.round(wxCandidates.reduce((a, [_, s]) => a + s, 0) / wxCandidates.length)
    }
  }
  return 8
}

function getMeaningScore(char) {
  return MEANING_DATA[char] || 80
}

// Name quality filter — reject non-poetic words even if jieba-valid
const NAME_BLOCKLIST = new Set([
  // Filter 1: Province/city names
  '山西','山东','河南','河北','湖南','湖北','广东','广西','江西','江苏',
  '浙江','四川','贵州','云南','福建','安徽','陕西','甘肃','宁夏','西藏',
  '新疆','海南','台湾','北京','上海','天津','重庆','江南','岭南','中原',
  '关东','关西',
  // Filter 3: Function word combos
  '而已','之于','然而','所以','可以','于是','至于','及其','以及','以此',
  '因此','何必','何不','无非','不论','不管',
  // Filter 4: Pronoun/interrogative combos
  '其中','何处','此人','此时','何年','何时','此日','其地',
  // Filter 5: Historical era/place names
  '永安','长安','建安','永和','太和','开元','天宝','贞观','洪武','永乐',
  '乾隆','康熙','昭和','平成',
  // Filter 6: Non-name common phrases
  // Number-prefix — pure numbers / generic descriptors
  '一国','万一','三万','三十','三百','九十','十一','十三','十千','千百',
  '一十','一夕','一日','一朝','一春','一月','一秋',
  '三十','三千','十万','百千',
  '三奇','四方','五洲','六合','七泽','八方','九重','十方',
  // Generic temporal/seasonal
  '开春','入秋','过冬','初夏','晚春',
  // Common noun phrases not suitable as names
  '出国','入门','出门','下山','出水','入山',
])

const DIRECTIONAL_SUFFIXES = '中上下里外前后东西南北'

function isNameworthy(chars) {
  if (NAME_BLOCKLIST.has(chars)) return false
  const c1 = chars[0], c2 = chars[1]
  // Filter 2: X + directional suffix → mundane
  if (DIRECTIONAL_SUFFIXES.includes(c2)) return false
  if (DIRECTIONAL_SUFFIXES.includes(c1)) return false
  return true
}

// Extract valid Chinese 2-char name pairs using jieba word segmentation
function extractCombos(line) {
  const combos = []
  const seen = new Set()
  const segments = splitSegments(line)

  for (const seg of segments) {
    // 1. Jieba word extraction FIRST — validated, coherent
    const words = cut(seg)
    const word2Chars = words.filter(w => w.length === 2)
    for (const word of word2Chars) {
      if (!seen.has(word)) {
        seen.add(word)
        combos.push({ chars: word, c1: word[0], c2: word[1], text: line, coherent: true })
      }
    }

    // 2. Adjacent pairs — only add if jieba didn't already find them
    const chars = [...seg].filter(c => /^[一-鿿]$/.test(c))
    if (chars.length >= 2) {
      for (let i = 0; i < chars.length - 1; i++) {
        const pair = chars[i] + chars[i + 1]
        if (!seen.has(pair)) {
          seen.add(pair)
          combos.push({ chars: pair, c1: chars[i], c2: chars[i + 1], text: line, coherent: false })
        }
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
        if (!isNameworthy(c.chars)) continue
        all.push({
          chars: c.chars,
          char1: c.c1, char2: c.c2,
          wuxing: getWuxing(c.c1) + getWuxing(c.c2),
          text: line,
          poem: title,
          source: `${author}《${title}》`,
          coherent: c.coherent
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

  // 纳兰性德诗集
  const nalan = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, '纳兰性德诗集.json'), 'utf8'))
  allResults.push(...processPoems(nalan, '纳兰词', e => e.para || []))

  // 水墨唐诗
  const sm = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, 'shuimotangshi.json'), 'utf8'))
  allResults.push(...processPoems(sm, '水墨唐诗', e => e.paragraphs || []))

  // Deduplicate by chars + poem
  const seen = new Set()
  const unique = []
  for (const r of allResults) {
    const key = r.chars + '|' + r.poem
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(r)
  }
  console.log(`\nTotal unique name pairs: ${unique.length}`)

  // Count coherent vs non-coherent
  const coherentCount = unique.filter(r => r.coherent === true).length
  const adjacentCount = unique.filter(r => r.coherent === false).length
  console.log(`Coherent (jieba): ${coherentCount}, Adjacent pairs: ${adjacentCount}`)

  // Group by wuxing
  const groups = {}
  for (const r of unique) {
    const key = r.wuxing
    if (!groups[key]) groups[key] = []
    groups[key].push({
      chars: r.chars, char1: r.char1, char2: r.char2,
      text: r.text, poem: r.poem, source: r.source,
      coherent: r.coherent
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
        uniqueCharsMap[ch] = {
          char: ch,
          wuxing: getWuxing(ch),
          strokes: getStroke(ch),
          score: getMeaningScore(ch)
        }
      }
    }
  }
  const allChars = Object.values(uniqueCharsMap)
  console.log(`Unique name chars: ${allChars.length}`)

  // Gender split (statistical from 120W name corpus, threshold 70%)
  const boy = [], girl = [], neutral = []

  function classifyGender(ch) {
    const m = GENDER_DATA.male[ch] || 0
    const f = GENDER_DATA.female[ch] || 0
    const total = m + f
    if (total < 50) return 'neutral'  // insufficient data
    const ratio = m / total * 100
    if (ratio >= 70) return 'boy'
    if (ratio <= 30) return 'girl'
    return 'neutral'
  }

  for (const c of allChars) {
    const cat = classifyGender(c.char)
    if (cat === 'boy') boy.push(c)
    else if (cat === 'girl') girl.push(c)
    else neutral.push(c)
  }

  console.log(`Chars: boy=${boy.length} girl=${girl.length} neutral=${neutral.length}`)

  // Merge mood scores if available
  let moodScores = {}
  try {
    moodScores = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, 'mood-scores.json'), 'utf8'))
    console.log(`Loaded mood scores: ${Object.keys(moodScores).length} texts`)
  } catch (e) { console.log('No mood-scores.json, skipping 意境 scoring') }

  if (Object.keys(moodScores).length > 0) {
    for (const arr of Object.values(groups)) {
      for (const entry of arr) {
        const s = moodScores[entry.text]
        if (s) entry.mood = s.total
      }
    }
    console.log('Merged mood scores into poetry entries')
  }

  // Merge name annotations first
  let annotations = {}
  try {
    annotations = JSON.parse(fs.readFileSync(path.join(SCRIPTS_DIR, 'name-annotations.json'), 'utf8'))
    console.log(`Loaded name annotations: ${Object.keys(annotations).length} words`)
  } catch (e) { console.log('No name-annotations.json') }

  if (Object.keys(annotations).length > 0) {
    for (const arr of Object.values(groups)) {
      for (const entry of arr) {
        if (annotations[entry.chars]) entry.annotation = annotations[entry.chars]
      }
    }
    console.log('Merged annotations into poetry entries')
  }

  // Remove entries with negative annotations (must run after annotation merge)
  const NEG_RE = /[哀悲怨恨讥讽刺危亡乱祸丧葬殁薨逝离别苦愁盼凄惨忧忡郁孤病痛苦疾]|无夫|孕|私通|淫乱|妖异|鬼怪|邪祟|可怖|狰狞|阴间|恐怖|恶魔|遭谗|遭妒害|被谗|遭害|贤愚不分|贤愚相混|不分|玉石相混|杀屠戮/
  let removed = 0
  for (const key of Object.keys(groups)) {
    const before = groups[key].length
    groups[key] = groups[key].filter(entry => {
      if (entry.annotation && NEG_RE.test(entry.annotation)) return false
      return true
    })
    removed += before - groups[key].length
  }
  console.log(`Removed ${removed} negative-context entries`)
  // Deduplicate entries within each group
  let dedupRemoved = 0
  for (const key of Object.keys(groups)) {
    const seen = new Set()
    const before = groups[key].length
    groups[key] = groups[key].filter(entry => {
      const k = entry.chars + '|' + entry.text.substring(0, 20)
      if (seen.has(k)) { dedupRemoved++; return false }
      seen.add(k)
      return true
    })
  }
  console.log(`Deduplicated ${dedupRemoved} duplicate entries`)

  // Remove entries without annotations and entries with 佚名 source
  let noAnnoRemoved = 0, yiMingRemoved = 0
  for (const key of Object.keys(groups)) {
    const before = groups[key].length
    groups[key] = groups[key].filter(entry => {
      if (!entry.annotation) { noAnnoRemoved++; return false }
      if (entry.source && entry.source.includes('佚名')) { yiMingRemoved++; return false }
      return true
    })
  }
  console.log(`Removed ${noAnnoRemoved} no-annotation entries`)
  console.log(`Removed ${yiMingRemoved} 佚名 entries`)

  // Write outputs
  const poetryContent = `// Generated by scripts/build-poetry-db.js from local poetry JSON
// Sources: 诗经 楚辞 唐诗三百首 宋词三百首 纳兰词 水墨唐诗
// Total: ${unique.length} unique name pairs, ${allChars.length} unique chars
// Coherent (jieba): ${coherentCount}, Adjacent: ${adjacentCount}
// Mood scoring: ${Object.keys(moodScores).length} texts scored
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
