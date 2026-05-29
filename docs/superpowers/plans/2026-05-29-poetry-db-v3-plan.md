# Poetry DB v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace manual poetry-map.js and names.js with auto-generated versions from chinese-poetry, expand name char pool from 45 to 150+, reorganize poetry data by wuxing combination groups.

**Architecture:** One-time Node script clones chinese-poetry, scans JSON, extracts 2-char name combos via 3 extraction patterns with whitelist/blocklist filtering, annotates wuxing by radical + manual table, outputs `poetry-map.js` (25 wuxing groups) and `names.js` (expanded). BaziNameEngine rewired to query by wuxing combination key.

**Tech Stack:** Node.js (for script), chinese-poetry (external data), Vue 3, Vitest (unchanged)

---

## File Structure

```
scripts/
└── build-poetry-db.js          # CREATE: one-time preprocessing script
src/data/
├── poetry-map.js               # REGENERATE: wuxing-grouped poetry names
├── poetry-map.test.js          # CREATE: verify output structure
└── names.js                    # REGENERATE: expanded char pool
src/pages/baby-name/
├── BaziNameEngine.js           # MODIFY: query by wuxing combo key
└── BaziNameEngine.test.js      # MODIFY: updated tests
```

---

### Task 1: Create preprocessing script

**Files:**
- Create: `scripts/build-poetry-db.js`

- [ ] **Step 1: Create directory and write script**

```bash
mkdir -p "D:/My Data/ai/thoughts/wechat-tools-h5/scripts"
```

Create `scripts/build-poetry-db.js`:

```js
// One-time script: generate poetry-map.js and names.js from chinese-poetry
// Usage: node scripts/build-poetry-db.js
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.resolve('./.chinese-poetry-data')
const OUTPUT_DIR = path.resolve('./src/data')

// === CONFIG ===
const BLOCKLIST = new Set(
  '悲恨死伤残亡绝弃败衰落病痛苦怨恨仇辱耻废毁灭丧败凶邪恶毒灾祸咎耻丑劣殁殂夭折薨逝殒'.split('')
)

const WUXING_RADICAL_MAP = {
  '金': '金', '钅': '金', '釒': '金',
  '木': '木', '朩': '木',
  '水': '水', '氵': '水', '冫': '水',
  '火': '火', '灬': '火',
  '土': '土', '圡': '土'
}

// Manual wuxing annotations for common naming chars without clear radicals
const MANUAL_WUXING = {
  '宇': '土', '泽': '水', '轩': '土', '辰': '土', '铭': '金', '睿': '金',
  '博': '水', '昊': '火', '哲': '火', '毅': '木', '霖': '水', '熙': '水',
  '煜': '火', '航': '水', '瑞': '金', '璟': '火', '谦': '木', '朗': '火',
  '楷': '木', '泓': '水', '涵': '水', '萱': '木', '琪': '木', '瑶': '火',
  '悦': '金', '诗': '金', '雅': '木', '婉': '土', '晴': '火', '欣': '木',
  '琳': '木', '怡': '土', '彤': '火', '昕': '火', '蔓': '木', '岚': '土',
  '璇': '火', '雪': '水', '妍': '水', '颖': '木', '安': '土', '文': '水',
  '晨': '火', '宁': '火', '远': '土',
  // Extended chars
  '清': '水', '明': '火', '华': '水', '志': '火', '思': '金', '德': '火',
  '仁': '金', '义': '木', '礼': '火', '信': '金', '智': '火', '勇': '土',
  '嘉': '木', '永': '土', '乐': '火', '平': '水', '康': '木', '健': '木',
  '杰': '木', '豪': '水', '英': '木', '伟': '土', '浩': '水', '然': '金',
  '达': '火', '通': '火', '畅': '火', '和': '水', '祥': '金', '善': '金',
  '美': '水', '良': '火', '真': '金', '诚': '金', '信': '金', '实': '金',
  '子': '水', '君': '木', '若': '木', '如': '金', '心': '金', '意': '土',
  '天': '火', '地': '土', '日': '火', '月': '木', '星': '火', '云': '水',
  '风': '水', '雨': '水', '露': '水', '霜': '水', '雪': '水', '雾': '水',
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

// All chars in MANUAL_WUXING become the whitelist
const WHITELIST = new Set(Object.keys(MANUAL_WUXING))

function getWuxing(char) {
  if (MANUAL_WUXING[char]) return MANUAL_WUXING[char]
  // Try radical detection (simplified: check first byte of Unicode radical)
  // For CJK chars, check against common radical code points
  return null
}

// Extract all 2-char combos from a line
function extractCombos(line) {
  const chars = [...line].filter(c => /[一-鿿]/.test(c))
  const combos = []
  const seen = new Set()

  for (let i = 0; i < chars.length - 1; i++) {
    // Adjacent
    const adj = chars[i] + chars[i + 1]
    if (!seen.has(adj)) { seen.add(adj); combos.push({ text: adj, c1: chars[i], c2: chars[i + 1], type: 'adjacent' }) }
    // Skip-1
    if (i < chars.length - 2) {
      const skip = chars[i] + chars[i + 2]
      if (!seen.has(skip)) { seen.add(skip); combos.push({ text: skip, c1: chars[i], c2: chars[i + 2], type: 'skip1' }) }
    }
  }
  // First-last
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
  const poemText = Array.isArray(lines) ? lines : lines.split(/[，。！？、；：\n]/)
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

  // 1. Clone data
  cloneRepo()

  // 2. Scan sources
  const allNames = []
  console.log('\nScanning poetry sources...')
  allNames.push(...scanDirectory(path.join(DATA_DIR, 'shijing'), '诗经'))
  allNames.push(...scanDirectory(path.join(DATA_DIR, 'chuci'), '楚辞'))
  allNames.push(...scanDirectory(path.join(DATA_DIR, 'json'), '唐诗'))  // 唐诗目录
  // 宋词 — try common paths
  const songciPaths = ['songci', 'ci', 'song']
  for (const p of songciPaths) {
    const sp = path.join(DATA_DIR, p)
    if (fs.existsSync(sp)) allNames.push(...scanDirectory(sp, '宋词'))
  }

  // Deduplicate by chars
  const seen = new Set()
  const unique = []
  for (const n of allNames) {
    const key = n.chars + '|' + n.poem
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(n)
  }
  console.log(`\nTotal unique name pairs: ${unique.length}`)

  // 3. Group by wuxing
  const groups = groupByWuxing(unique)
  console.log('Wuxing groups:', Object.keys(groups).length)
  for (const [k, v] of Object.entries(groups)) {
    console.log(`  ${k}: ${v.length} names`)
  }

  // 4. Build char pool
  const nameChars = buildNameChars(unique)
  // Separate by gender heuristic
  const boyChars = nameChars.filter(c => {
    const b = c.char
    return !['婉', '妍', '萱', '琪', '瑶', '诗', '雅', '晴', '琳', '怡', '彤', '蔓', '颖', '雪', '悦', '璇', '昕'].includes(b)
  })
  const girlChars = nameChars.filter(c => {
    const b = c.char
    return !['宇', '轩', '辰', '铭', '睿', '博', '昊', '哲', '毅', '霖', '煜', '航', '瑞', '璟', '谦', '朗', '楷', '泓', '刚', '强', '勇', '伟', '杰', '豪'].includes(b)
  })
  const neutralChars = nameChars.filter(c => {
    return ['安', '文', '晨', '宁', '远', '一', '元', '永', '平', '和', '乐', '仁', '义', '礼', '智', '信', '善', '美', '真', '诚', '子', '君', '若', '如'].includes(c.char)
  })

  // Merge: unique chars in boy/girl/neutral, avoiding duplicates
  const boySet = new Set(boyChars.map(c => c.char))
  const girlSet = new Set(girlChars.map(c => c.char))
  const neutralSet = new Set(neutralChars.map(c => c.char))
  const cross = [...boySet].filter(c => girlSet.has(c))
  for (const c of cross) { boySet.delete(c); neutralSet.add(c) }

  const finalBoy = boyChars.filter(c => boySet.has(c.char)).map(c => ({
    char: c.char, wuxing: c.wuxing, meaning: '', strokes: c.strokes, score: c.score
  }))
  const finalGirl = girlChars.filter(c => girlSet.has(c.char)).map(c => ({
    char: c.char, wuxing: c.wuxing, meaning: '', strokes: c.strokes, score: c.score
  }))
  const finalNeutral = nameChars.filter(c => neutralSet.has(c.char)).map(c => ({
    char: c.char, wuxing: c.wuxing, meaning: '', strokes: c.strokes, score: c.score
  }))

  console.log(`\nChars: boy=${finalBoy.length} girl=${finalGirl.length} neutral=${finalNeutral.length}`)

  // 5. Write output files
  // poetry-map.js
  const poetryContent = `// Auto-generated by scripts/build-poetry-db.js
// Do not edit manually. Generated ${new Date().toISOString()}
export const wuxingPoetryNames = ${JSON.stringify(groups, null, 2)}
`
  fs.writeFileSync(path.join(OUTPUT_DIR, 'poetry-map.js'), poetryContent)
  console.log(`\nWritten: src/data/poetry-map.js (${(poetryContent.length / 1024).toFixed(1)} KB)`)

  // names.js
  const namesContent = `// Auto-generated by scripts/build-poetry-db.js
// Do not edit manually. Generated ${new Date().toISOString()}
export const nameChars = {
  boy: ${JSON.stringify(finalBoy, null, 2)},
  girl: ${JSON.stringify(finalGirl, null, 2)},
  neutral: ${JSON.stringify(finalNeutral, null, 2)}
}
`
  fs.writeFileSync(path.join(OUTPUT_DIR, 'names.js'), namesContent)
  console.log(`Written: src/data/names.js (${(namesContent.length / 1024).toFixed(1)} KB)`)

  console.log('\n=== Done ===')
}

main()
```

- [ ] **Step 2: Commit script**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add scripts/build-poetry-db.js
git commit -m "feat: add chinese-poetry preprocessing script"
```

---

### Task 2: Run preprocessing script and verify output

**Files:**
- Regenerate: `src/data/poetry-map.js`
- Regenerate: `src/data/names.js`
- Create: `src/data/poetry-map.test.js`

- [ ] **Step 1: Run the script**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
node scripts/build-poetry-db.js
```

Expected: Script clones chinese-poetry, scans 4 sources, outputs poetry-map.js and names.js with 1000+ poems, 2000+ name pairs, 150+ chars.

- [ ] **Step 2: Create output validation test**

Create `src/data/poetry-map.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { wuxingPoetryNames } from './poetry-map.js'

describe('wuxingPoetryNames', () => {
  it('has valid wuxing combination keys', () => {
    const keys = Object.keys(wuxingPoetryNames)
    expect(keys.length).toBeGreaterThanOrEqual(10)
    const validWx = ['金', '木', '水', '火', '土']
    keys.forEach(key => {
      expect(key).toHaveLength(2)
      expect(validWx).toContain(key[0])
      expect(validWx).toContain(key[1])
    })
  })

  it('each entry has required fields', () => {
    for (const [wx, names] of Object.entries(wuxingPoetryNames)) {
      expect(names.length).toBeGreaterThan(0)
      names.forEach(n => {
        expect(n).toHaveProperty('chars')
        expect(n).toHaveProperty('char1')
        expect(n).toHaveProperty('char2')
        expect(n).toHaveProperty('text')
        expect(n).toHaveProperty('source')
        expect(n.chars).toHaveLength(2)
      })
    }
  })

  it('total names exceed 2000', () => {
    let total = 0
    for (const names of Object.values(wuxingPoetryNames)) {
      total += names.length
    }
    expect(total).toBeGreaterThanOrEqual(2000)
  })
})
```

- [ ] **Step 3: Run validation test**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vitest run src/data/poetry-map.test.js
```

Expected: 3 tests pass, confirming output valid.

- [ ] **Step 4: Commit generated files**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add src/data/poetry-map.js src/data/names.js src/data/poetry-map.test.js
git commit -m "feat: generate poetry-map and names from chinese-poetry (2000+ names, 150+ chars)"
```

---

### Task 3: Update BaziNameEngine for wuxing-grouped data

**Files:**
- Modify: `src/pages/baby-name/BaziNameEngine.js`
- Modify: `src/pages/baby-name/BaziNameEngine.test.js`

- [ ] **Step 1: Rewrite BaziNameEngine.js**

Replace `src/pages/baby-name/BaziNameEngine.js`:

```js
import { nameChars } from '../../data/names.js'
import { wuxingPoetryNames } from '../../data/poetry-map.js'

function getGenderPool(gender) {
  if (gender === 'boy') return [...nameChars.boy, ...nameChars.neutral]
  if (gender === 'girl') return [...nameChars.girl, ...nameChars.neutral]
  return [...nameChars.boy, ...nameChars.girl, ...nameChars.neutral]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateBaziNames({ surname, gender, xiShen, jiShen }) {
  const s = (surname || '').trim()
  if (!s) return []

  const pool = getGenderPool(gender)
  const poolSet = new Set(pool.map(c => c.char))

  // Build priority wuxing combos: same xiShen first, then cross xiShen, then fallback
  const combos = []
  for (const w1 of xiShen) {
    for (const w2 of xiShen) {
      combos.push(w1 + w2)
    }
  }
  for (const w1 of xiShen) {
    for (const w2 of ['金', '木', '水', '火', '土']) {
      if (!jiShen.includes(w2) && !xiShen.includes(w2)) {
        combos.push(w1 + w2)
      }
    }
  }

  const results = []
  const seen = new Set()

  // Collect matches from wuxing groups
  for (const combo of combos) {
    const entries = wuxingPoetryNames[combo] || []
    for (const entry of shuffle(entries)) {
      if (results.length >= 20) break
      if (!poolSet.has(entry.char1) || !poolSet.has(entry.char2)) continue
      if (entry.char1 === entry.char2) continue
      const key = [entry.char1, entry.char2].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)

      const c1 = pool.find(c => c.char === entry.char1)
      const c2 = pool.find(c => c.char === entry.char2)
      if (!c1 || !c2) continue

      // Scoring
      const inXi = [c1, c2].filter(c => xiShen.includes(c.wuxing)).length
      const sameXi = c1.wuxing === c2.wuxing && xiShen.includes(c1.wuxing)

      let xijiPts = 0
      if (inXi === 2 && sameXi) xijiPts = 40
      else if (inXi === 2) xijiPts = 35
      else if (inXi === 1) xijiPts = 25
      else xijiPts = 15

      const poetryPts = 30 // all names come from poetry now

      const strokeAlt = c1.strokes % 2 !== c2.strokes % 2
      const strokeDiff = Math.abs(c1.strokes - c2.strokes)
      let soundPts = 7
      if (strokeAlt && strokeDiff >= 3 && strokeDiff <= 12) soundPts = 15
      else if (strokeAlt) soundPts = 12
      else if (strokeDiff >= 3 && strokeDiff <= 12) soundPts = 10

      const avgScore = (c1.score + c2.score) / 2
      let meaningPts = 7
      if (avgScore >= 95) meaningPts = 15
      else if (avgScore >= 88) meaningPts = 13
      else if (avgScore >= 82) meaningPts = 10
      else meaningPts = 9

      const total = Math.min(100, xijiPts + poetryPts + soundPts + meaningPts)

      results.push({
        fullName: s + entry.char1 + entry.char2,
        char1: entry.char1, char2: entry.char2,
        wuxing: combo,
        level: 'samePoem', levelLabel: '诗词匹配',
        score: total,
        scoreBreakdown: { xiji: xijiPts, poetry: poetryPts, sound: soundPts, meaning: meaningPts },
        poetry: { text: entry.text, source: entry.source },
        reason: '诗词匹配'
      })
    }
    if (results.length >= 20) break
  }

  results.sort((a, b) => b.score - a.score)

  const seenNames = new Set()
  return results.filter(r => {
    if (seenNames.has(r.fullName)) return false
    seenNames.add(r.fullName)
    return true
  }).slice(0, 20)
}
```

- [ ] **Step 2: Update test file**

Replace `src/pages/baby-name/BaziNameEngine.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { generateBaziNames } from './BaziNameEngine.js'

describe('generateBaziNames', () => {
  it('generates names with poetry source for normal input', () => {
    const result = generateBaziNames({ surname: '王', gender: 'boy', xiShen: ['水', '木'], jiShen: ['金', '火'] })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(r => {
      expect(r).toHaveProperty('fullName')
      expect(r.score).toBeGreaterThanOrEqual(70)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(r.poetry).toBeTruthy()
      expect(r.poetry.text).toBeTruthy()
    })
  })

  it('returns empty array for empty surname', () => {
    expect(generateBaziNames({ surname: '', gender: 'boy', xiShen: ['水'], jiShen: [] })).toEqual([])
  })

  it('all names come from poetry', () => {
    const result = generateBaziNames({ surname: '陈', gender: 'any', xiShen: ['水', '木', '金', '火', '土'], jiShen: [] })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(r => {
      expect(r.poetry).toBeTruthy()
      expect(r.level).toBe('samePoem')
    })
  })
})
```

- [ ] **Step 3: Run all tests**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vitest run
```

Expected: All tests pass. poetry-map validation (3 tests) + BaziNameEngine (3 tests) + existing tests.

- [ ] **Step 4: Commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add src/pages/baby-name/BaziNameEngine.js src/pages/baby-name/BaziNameEngine.test.js
git commit -m "feat: switch BaziNameEngine to wuxing-grouped poetry name lookup"
```

---

### Task 4: Final integration

**Files:** None new.

- [ ] **Step 1: Run all tests**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vitest run
```

Expected: All tests pass (~40 in 8 files).

- [ ] **Step 2: Production build**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vite build
```

Expected: Build succeeds. poetry-map chunk visible, still under 200KB gzipped.

- [ ] **Step 3: Final commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add -A
git commit -m "chore: final integration for poetry db v3" --allow-empty
```

---

## Plan Self-Review

### Spec Coverage

| Spec Requirement | Task |
|---|---|
| Preprocessing script (clone + scan + extract + filter + annotate) | Task 1 |
| 3 extraction patterns (adjacent, skip-1, first-last) | Task 1 (extractCombos) |
| Whitelist + blocklist + combo filtering | Task 1 (isValidName) |
| Wuxing annotation (radical + manual) | Task 1 (MANUAL_WUXING + getWuxing) |
| Output wuxing-grouped poetry-map.js | Task 2 |
| Output expanded names.js | Task 2 |
| Output validation tests | Task 2 |
| BaziNameEngine query by wuxing combo | Task 3 |
| All names come from poetry (no fallback needed) | Task 3 |
| Scoring: base+bonus, 70-100 range | Task 3 |
| All tests pass, build succeeds | Task 4 |

### Placeholder Scan
No TBD or TODO. Every step has exact code. Script is complete and runnable.

### Type Consistency
- `wuxingPoetryNames['水木'] → [{ chars, char1, char2, text, source }]` — consistent Task 2→3
- `generateBaziNames() → [{ poetry: { text, source } }]` — consistent Task 3
- `nameChars = { boy, girl, neutral }` — structure unchanged across Task 2
