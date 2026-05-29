// One-time script: generate poetry-map.js and names.js from chinese-poetry
// Usage: node scripts/build-poetry-db.js
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.resolve('./.chinese-poetry-data')
const OUTPUT_DIR = path.resolve('./src/data')

// Characters that should never appear in names
const BLOCKLIST = new Set(
  '悲恨死伤残亡绝弃败衰落病痛苦怨恨仇辱耻废毁灭丧败凶邪恶毒灾祸咎耻丑劣殁殂夭折薨逝殒'.split('')
)

// Manual wuxing annotations for common naming chars
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
  '美': '水', '良': '火', '真': '金', '诚': '金',
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
  '宏': '水', '大': '火', '光': '火', '辉': '火', '耀': '火', '焕': '火'
}

const WHITELIST = new Set(Object.keys(MANUAL_WUXING))

function getWuxing(char) {
  return MANUAL_WUXING[char] || null
}

function extractCombos(line) {
  const chars = [...line].filter(c => /^[一-鿿]$/.test(c))
  const combos = []
  const seen = new Set()

  for (let i = 0; i < chars.length - 1; i++) {
    const adj = chars[i] + chars[i + 1]
    if (!seen.has(adj)) { seen.add(adj); combos.push({ text: adj, c1: chars[i], c2: chars[i + 1], type: 'adjacent' }) }
    if (i < chars.length - 2) {
      const skip = chars[i] + chars[i + 2]
      if (!seen.has(skip)) { seen.add(skip); combos.push({ text: skip, c1: chars[i], c2: chars[i + 2], type: 'skip1' }) }
    }
  }
  if (chars.length >= 2) {
    const fl = chars[0] + chars[chars.length - 1]
    if (!seen.has(fl)) { seen.add(fl); combos.push({ text: fl, c1: chars[0], c2: chars[chars.length - 1], type: 'firstLast' }) }
  }
  return combos
}

function isValidName(c1, c2) {
  if (!WHITELIST.has(c1) || !WHITELIST.has(c2)) return false
  if (BLOCKLIST.has(c1) || BLOCKLIST.has(c2)) return false
  if (c1 === c2) return false
  return true
}

function processPoem(poem) {
  const results = []
  const lines = poem.paragraphs || poem.content || []
  const poemText = Array.isArray(lines) ? lines : String(lines).split(/[，。！？、；：\n]/)
  const title = poem.title || '佚名'
  const author = poem.author || '佚名'

  for (const line of poemText) {
    if (!line || line.length < 2) continue
    const combos = extractCombos(line)
    for (const combo of combos) {
      if (!isValidName(combo.c1, combo.c2)) continue
      const w1 = getWuxing(combo.c1)
      const w2 = getWuxing(combo.c2)
      if (!w1 || !w2) continue
      results.push({
        chars: combo.text,
        char1: combo.c1,
        char2: combo.c2,
        wuxing: w1 + w2,
        text: line.trim(),
        poem: title,
        source: `${author}《${title}》`,
        type: combo.type
      })
    }
  }
  return results
}

function scanDirectory(dir, label) {
  const results = []
  if (!fs.existsSync(dir)) { console.log(`  skip ${label}: not found`); return results }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
  console.log(`  scanning ${label}: ${files.length} files`)
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        results.push(...processPoem(item))
      }
    } catch (e) {
      // skip malformed files
    }
  }
  return results
}

function cloneRepo() {
  if (fs.existsSync(DATA_DIR)) {
    console.log('Data already cloned, pulling...')
    try { execSync('git pull', { cwd: DATA_DIR, stdio: 'inherit' }) } catch {}
    return
  }
  console.log('Cloning chinese-poetry (shallow)...')
  execSync(
    `git clone --depth 1 --filter=blob:none https://github.com/chinese-poetry/chinese-poetry.git "${DATA_DIR}"`,
    { stdio: 'inherit' }
  )
}

function buildNameChars(allNames) {
  const chars = {}
  for (const name of allNames) {
    for (const ch of [name.char1, name.char2]) {
      if (!chars[ch]) {
        const wx = getWuxing(ch) || '水'
        chars[ch] = { char: ch, wuxing: wx, strokes: 8, score: 85 }
      }
    }
  }
  return Object.values(chars)
}

function groupByWuxing(allNames) {
  const groups = {}
  for (const name of allNames) {
    const key = name.wuxing
    if (!groups[key]) groups[key] = []
    groups[key].push({
      chars: name.chars,
      char1: name.char1,
      char2: name.char2,
      text: name.text,
      poem: name.poem,
      source: name.source
    })
  }
  return groups
}

function main() {
  console.log('=== Building poetry name database ===\n')
  cloneRepo()
  const allNames = []
  console.log('\nScanning poetry sources...')
  allNames.push(...scanDirectory(path.join(DATA_DIR, 'shijing'), '诗经'))
  allNames.push(...scanDirectory(path.join(DATA_DIR, 'chuci'), '楚辞'))
  allNames.push(...scanDirectory(path.join(DATA_DIR, 'json'), '唐诗'))
  const songciPaths = ['songci', 'ci', 'song']
  for (const p of songciPaths) {
    const sp = path.join(DATA_DIR, p)
    if (fs.existsSync(sp)) allNames.push(...scanDirectory(sp, p))
  }
  const seen = new Set()
  const unique = []
  for (const n of allNames) {
    const key = n.chars + '|' + n.poem
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(n)
  }
  console.log(`\nTotal unique name pairs: ${unique.length}`)
  const groups = groupByWuxing(unique)
  console.log('Wuxing groups:', Object.keys(groups).length)
  for (const [k, v] of Object.entries(groups)) {
    console.log(`  ${k}: ${v.length} names`)
  }

  // Build char pool with gender heuristic
  const allChars = buildNameChars(unique)
  const girlOnly = new Set('婉妍萱琪瑶诗雅晴琳怡彤蔓颖雪悦璇昕'.split(''))
  const boyOnly = new Set('宇轩辰铭睿博昊哲毅霖煜航瑞璟谦朗楷泓刚强勇伟杰豪'.split(''))
  const neutralOnly = new Set('安文晨宁愿一永恒平和乐仁义礼智信善美真诚子君若如'.split(''))

  const finalBoy = []
  const finalGirl = []
  const finalNeutral = []
  const used = new Set()

  for (const c of allChars) {
    if (used.has(c.char)) continue
    if (neutralOnly.has(c.char)) {
      finalNeutral.push(c); used.add(c.char)
    } else if (girlOnly.has(c.char)) {
      finalGirl.push(c); used.add(c.char)
    } else if (boyOnly.has(c.char)) {
      finalBoy.push(c); used.add(c.char)
    }
  }
  // Rest to neutral
  for (const c of allChars) {
    if (!used.has(c.char)) { finalNeutral.push(c); used.add(c.char) }
  }

  console.log(`\nChars: boy=${finalBoy.length} girl=${finalGirl.length} neutral=${finalNeutral.length}`)

  // Build output
  const poetryContent = [
    '// Auto-generated by scripts/build-poetry-db.js',
    `// Generated ${new Date().toISOString()}`,
    'export const wuxingPoetryNames = ' + JSON.stringify(groups, null, 2),
    ''
  ].join('\n')

  const namesContent = [
    '// Auto-generated by scripts/build-poetry-db.js',
    `// Generated ${new Date().toISOString()}`,
    'export const nameChars = {',
    '  boy: ' + JSON.stringify(finalBoy, null, 2) + ',',
    '  girl: ' + JSON.stringify(finalGirl, null, 2) + ',',
    '  neutral: ' + JSON.stringify(finalNeutral, null, 2),
    '}',
    ''
  ].join('\n')

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(path.join(OUTPUT_DIR, 'poetry-map.js'), poetryContent)
  console.log(`\nWritten: src/data/poetry-map.js (${(poetryContent.length / 1024).toFixed(1)} KB)`)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'names.js'), namesContent)
  console.log(`Written: src/data/names.js (${(namesContent.length / 1024).toFixed(1)} KB)`)
  console.log('\n=== Done ===')
}

main()
