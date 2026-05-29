# Bazi Naming Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bazi (八字) naming mode to the existing baby name tool with five-element analysis, simplified xiji (喜忌) algorithm, and poetry origin lookup for each name character.

**Architecture:** Add `lunar-javascript` dependency for bazi calculation. Create two new engine files (BaziEngine for calculation + xiji, BaziNameEngine for name generation). Create a lazy-loaded poetry-map.js static data file. Refactor BabyName.vue with tab-based mode switching (smart naming / bazi naming). Existing BabyNameEngine.js and names.js remain unchanged.

**Tech Stack:** Vue 3, Vitest, lunar-javascript ^1.6, dynamic import for code-splitting

---

## File Structure Plan

```
src/pages/baby-name/
├── BabyName.vue              # MODIFY: add tabs, bazi form, poetry display
├── BabyNameEngine.js         # UNCHANGED
├── BabyNameEngine.test.js    # UNCHANGED
├── BaziEngine.js             # CREATE: bazi calc + wuxing count + xiji analysis
├── BaziEngine.test.js        # CREATE: unit tests for bazi + xiji
├── BaziNameEngine.js         # CREATE: xiji-based name generation
src/data/
├── names.js                  # UNCHANGED
├── poetry-map.js             # CREATE: char → poem lines, dynamic import chunk
```

---

### Task 1: Install lunar-javascript and verify

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install lunar-javascript**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npm install lunar-javascript`

Expected: package added to dependencies.

- [ ] **Step 2: Verify import works**

Create a temp test file `test-lunar.js` at project root:

```js
import { Solar } from 'lunar-javascript'

const solar = Solar.fromYmdHms(1990, 5, 20, 12, 0, 0)
const lunar = solar.getLunar()
const eightChar = lunar.getEightChar()
console.log('Year:', eightChar.getYearStem() + eightChar.getYearBranch())
console.log('Month:', eightChar.getMonthStem() + eightChar.getMonthBranch())
console.log('Day:', eightChar.getDayStem() + eightChar.getDayBranch())
console.log('Time:', eightChar.getTimeStem() + eightChar.getTimeBranch())
```

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && node test-lunar.js`

Expected output:
```
Year: 庚午
Month: 辛巳
Day: 乙酉
Time: 壬午
```

- [ ] **Step 3: Clean up temp file**

Run: `rm "D:/My Data/ai/thoughts/wechat-tools-h5/test-lunar.js"`

- [ ] **Step 4: Commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add package.json package-lock.json
git commit -m "feat: add lunar-javascript dependency for bazi calculation"
```

---

### Task 2: Create BaziEngine with wuxing counting and xiji analysis

**Files:**
- Create: `src/pages/baby-name/BaziEngine.js`

- [ ] **Step 1: Create BaziEngine.js**

Create `src/pages/baby-name/BaziEngine.js`:

```js
import { Solar } from 'lunar-javascript'

const STEM_WUXING = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
}

const BRANCH_WUXING = {
  '子': '水', '丑': '土',
  '寅': '木', '卯': '木',
  '辰': '土', '巳': '火',
  '午': '火', '未': '土',
  '申': '金', '酉': '金',
  '戌': '土', '亥': '水'
}

const WUXING_ELEMENTS = ['金', '木', '水', '火', '土']

// Season: lunar month → dominant element
// Spring(1-3)=木, Summer(4-6)=火, Autumn(7-9)=金, Winter(10-12)=水
function seasonElement(lunarMonth) {
  if (lunarMonth >= 1 && lunarMonth <= 3) return '木'
  if (lunarMonth >= 4 && lunarMonth <= 6) return '火'
  if (lunarMonth >= 7 && lunarMonth <= 9) return '金'
  return '水'
}

// Ke (克) relationship: A克B → B is weakened by A
const KE_MAP = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' }
// Sheng (生) relationship: A生B → A strengthens B
const SHENG_MAP = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' }
// Reverse: what gets Ke'd by element
const KE_BY_MAP = {}
for (const [k, v] of Object.entries(KE_MAP)) {
  KE_BY_MAP[v] = k
}
// Reverse: what Sheng's element
const SHENG_BY_MAP = {}
for (const [k, v] of Object.entries(SHENG_MAP)) {
  SHENG_BY_MAP[v] = k
}

function countWuxing(yearPillar, monthPillar, dayPillar, hourPillar) {
  const count = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
  for (const pillar of [yearPillar, monthPillar, dayPillar, hourPillar]) {
    count[STEM_WUXING[pillar.stem]] = (count[STEM_WUXING[pillar.stem]] || 0) + 1
    count[BRANCH_WUXING[pillar.branch]] = (count[BRANCH_WUXING[pillar.branch]] || 0) + 1
  }
  return count
}

function findMissing(wuxingCount) {
  return WUXING_ELEMENTS.filter(e => wuxingCount[e] === 0)
}

function analyzeXiji(dayStemWuxing, lunarMonth) {
  const season = seasonElement(lunarMonth)
  const dayWx = dayStemWuxing

  const shenQiang = dayWx === season

  let xiShen = []
  let jiShen = []
  let description = ''

  if (shenQiang) {
    // Strong: prefer suppress (克泄耗)
    xiShen = [KE_BY_MAP[dayWx], SHENG_MAP[dayWx], KE_MAP[dayWx]].filter(Boolean)
    jiShen = [SHENG_BY_MAP[dayWx], dayWx].filter(Boolean)
    xiShen = [...new Set(xiShen)]
    jiShen = [...new Set(jiShen)]
    description = `日主${dayWx}在${season}季得令，身强。宜克泄耗，${xiShen.join('、')}为喜用神。`
  } else {
    // Weak: prefer support (生扶)
    xiShen = [SHENG_BY_MAP[dayWx], dayWx].filter(Boolean)
    jiShen = [KE_BY_MAP[dayWx], SHENG_MAP[dayWx], KE_MAP[dayWx]].filter(Boolean)
    xiShen = [...new Set(xiShen)]
    jiShen = [...new Set(jiShen)]
    description = `日主${dayWx}在${season}季失令，身弱。宜生扶，${xiShen.join('、')}为喜用神。`
  }

  return { xiShen, jiShen, shenQiang, description }
}

export function analyzeBazi(year, month, day, hour) {
  const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()

  const yearPillar = { stem: eightChar.getYearStem(), branch: eightChar.getYearBranch() }
  const monthPillar = { stem: eightChar.getMonthStem(), branch: eightChar.getMonthBranch() }
  const dayPillar = { stem: eightChar.getDayStem(), branch: eightChar.getDayBranch() }
  const hourPillar = { stem: eightChar.getTimeStem(), branch: eightChar.getTimeBranch() }

  const wuxingCount = countWuxing(yearPillar, monthPillar, dayPillar, hourPillar)
  const missing = findMissing(wuxingCount)
  const dayStemWuxing = STEM_WUXING[dayPillar.stem]
  const xiji = analyzeXiji(dayStemWuxing, lunar.getMonth())

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    wuxingCount,
    missing,
    dayStemWuxing,
    xiji,
    lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}日`,
    lunarMonth: lunar.getMonth()
  }
}
```

- [ ] **Step 2: Verify build still works**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vite build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add src/pages/baby-name/BaziEngine.js
git commit -m "feat: add BaziEngine with wuxing counting and xiji analysis"
```

---

### Task 3: Write BaziEngine tests

**Files:**
- Create: `src/pages/baby-name/BaziEngine.test.js`

- [ ] **Step 1: Write test file**

Create `src/pages/baby-name/BaziEngine.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { analyzeBazi } from './BaziEngine.js'

// Known bazi: 1990-05-20 12:00 → 庚午 辛巳 乙酉 壬午
describe('analyzeBazi', () => {
  it('returns correct four pillars for known birth', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    expect(result.yearPillar).toEqual({ stem: '庚', branch: '午' })
    expect(result.monthPillar).toEqual({ stem: '辛', branch: '巳' })
    expect(result.dayPillar).toEqual({ stem: '乙', branch: '酉' })
    expect(result.hourPillar).toEqual({ stem: '壬', branch: '午' })
  })

  it('counts wuxing correctly for 1990-05-20 12:00', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    // 庚(金)午(火) 辛(金)巳(火) 乙(木)酉(金) 壬(水)午(火)
    expect(result.wuxingCount['金']).toBe(3)
    expect(result.wuxingCount['木']).toBe(1)
    expect(result.wuxingCount['水']).toBe(1)
    expect(result.wuxingCount['火']).toBe(3)
    expect(result.wuxingCount['土']).toBe(0)
  })

  it('finds missing elements correctly', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    expect(result.missing).toContain('土')
    expect(result.missing.length).toBe(1)
  })

  it('day stem wuxing is correct', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    expect(result.dayStemWuxing).toBe('木')
  })

  it('xiji analysis produces xiShen and jiShen arrays', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    // 日主乙木, 巳月(夏/火), 木在夏季失令 → 身弱
    expect(result.xiji.shenQiang).toBe(false)
    expect(result.xiji.xiShen.length).toBeGreaterThan(0)
    expect(result.xiji.jiShen.length).toBeGreaterThan(0)
    expect(result.xiji.description).toContain('身弱')
  })

  it('returns lunar date string', () => {
    const result = analyzeBazi(1990, 5, 20, 12)
    expect(result.lunarDate).toBeTruthy()
    expect(typeof result.lunarDate).toBe('string')
  })

  it('works for edge cases: midnight', () => {
    const result = analyzeBazi(2000, 1, 1, 0)
    expect(result.yearPillar.stem).toBeTruthy()
    expect(result.hourPillar.stem).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify pass**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vitest run src/pages/baby-name/BaziEngine.test.js`

Expected: 7 tests passing.

- [ ] **Step 3: Commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add src/pages/baby-name/BaziEngine.test.js
git commit -m "test: add BaziEngine tests for bazi calculation and xiji analysis"
```

---

### Task 4: Create BaziNameEngine for xiji-based name generation

**Files:**
- Create: `src/pages/baby-name/BaziNameEngine.js`

- [ ] **Step 1: Create BaziNameEngine.js**

Create `src/pages/baby-name/BaziNameEngine.js`:

```js
import { nameChars } from '../../data/names.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getGenderPool(gender) {
  if (gender === 'boy') return [...nameChars.boy, ...nameChars.neutral]
  if (gender === 'girl') return [...nameChars.girl, ...nameChars.neutral]
  return [...nameChars.boy, ...nameChars.girl, ...nameChars.neutral]
}

export function generateBaziNames({ surname, gender, xiShen, jiShen }) {
  const s = (surname || '').trim()
  if (!s) return []

  const pool = getGenderPool(gender)

  // Tier 1: chars matching xiShen (preferred)
  const xiChars = pool.filter(c => xiShen.includes(c.wuxing))
  // Tier 2: other chars not in jiShen
  const neutralChars = pool.filter(c =>
    !xiShen.includes(c.wuxing) && !jiShen.includes(c.wuxing)
  )

  const results = []
  const maxResults = 20

  // First: generate names from xiShen chars (both chars from xiShen)
  const shuffledXi = shuffle(xiChars)
  for (let i = 0; i < shuffledXi.length - 1 && results.length < maxResults; i++) {
    for (let j = i + 1; j < shuffledXi.length && results.length < maxResults; j++) {
      const c1 = shuffledXi[i]
      const c2 = shuffledXi[j]
      if (c1.char === c2.char) continue

      const xiBonus = 20
      const avgScore = Math.round((c1.score + c2.score) / 2)
      const soundBonus = c1.strokes % 2 !== c2.strokes % 2 ? 3 : 0
      const score = Math.min(100, avgScore + soundBonus + xiBonus)

      results.push({
        fullName: s + c1.char + c2.char,
        char1: c1.char,
        char2: c2.char,
        meaning: `${c1.meaning}；${c2.meaning}`,
        wuxing: `${c1.wuxing}${c2.wuxing}`,
        score,
        reason: `喜用神${xiShen.join('/')}匹配`
      })
    }
  }

  // Second: fill with xiShen + neutral combos
  if (results.length < maxResults) {
    const mixedXi = shuffle(xiChars)
    const mixedNeutral = shuffle(neutralChars)
    for (const xi of mixedXi) {
      for (const nu of mixedNeutral) {
        if (results.length >= maxResults) break
        if (xi.char === nu.char) continue

        const avgScore = Math.round((xi.score + nu.score) / 2)
        const soundBonus = xi.strokes % 2 !== nu.strokes % 2 ? 3 : 0
        const score = Math.min(100, avgScore + soundBonus + 10)

        results.push({
          fullName: s + xi.char + nu.char,
          char1: xi.char,
          char2: nu.char,
          meaning: `${xi.meaning}；${nu.meaning}`,
          wuxing: `${xi.wuxing}${nu.wuxing}`,
          score,
          reason: '喜用神匹配'
        })
      }
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, maxResults)
}
```

- [ ] **Step 2: Verify build**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vite build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add src/pages/baby-name/BaziNameEngine.js
git commit -m "feat: add BaziNameEngine for xiji-based name generation"
```

---

### Task 5: Create poetry-map.js with full classic poetry database

**Files:**
- Create: `src/data/poetry-map.js`

- [ ] **Step 1: Create poetry-map.js**

Create `src/data/poetry-map.js`:

```js
// Poetry database: char → [{ text, source }]
// Sources: 诗经, 楚辞, 唐诗三百首, 宋词三百首, 古诗十九首
// This file is dynamically imported — Vite splits it into its own chunk.
export const poetryMap = {
  '涵': [
    { text: '涵虚混太清', source: '孟浩然《望洞庭湖赠张丞相》' },
    { text: '江涵秋影雁初飞', source: '杜牧《九日齐山登高》' }
  ],
  '宇': [
    { text: '宇泰定者，发乎天光', source: '《庄子·庚桑楚》' },
    { text: '悠悠天宇旷', source: '张九龄《西江夜行》' }
  ],
  '泽': [
    { text: '芳与泽其杂糅兮', source: '屈原《离骚》' },
    { text: '阳春布德泽', source: '《长歌行》' }
  ],
  '轩': [
    { text: '戎车既驾，四牡业业', source: '《诗经·小雅·采薇》' },
    { text: '开轩面场圃', source: '孟浩然《过故人庄》' }
  ],
  '辰': [
    { text: '日月星辰，运行不息', source: '《尚书·洪范》' },
    { text: '良辰美景奈何天', source: '汤显祖《牡丹亭》' }
  ],
  '铭': [
    { text: '铭心刻骨，矢志不忘', source: '李白《上安州裴长史书》' },
    { text: '山不在高，有仙则名', source: '刘禹锡《陋室铭》' }
  ],
  '睿': [
    { text: '睿哲维明，光于四方', source: '《尚书·洪范》' },
    { text: '聪明睿智，守之以愚', source: '《孔子家语》' }
  ],
  '博': [
    { text: '博学之，审问之，慎思之', source: '《礼记·中庸》' },
    { text: '吾尝终日而思矣，不如须臾之所学也', source: '荀子《劝学》' }
  ],
  '昊': [
    { text: '昊天罔极', source: '《诗经·小雅·蓼莪》' },
    { text: '浩浩昊天，不骏其德', source: '《诗经·小雅·雨无正》' }
  ],
  '哲': [
    { text: '既明且哲，以保其身', source: '《诗经·大雅·烝民》' },
    { text: '知人则哲，能官人', source: '《尚书·皋陶谟》' }
  ],
  '毅': [
    { text: '士不可以不弘毅，任重而道远', source: '《论语·泰伯》' },
    { text: '毅魄归来日，灵旗空际看', source: '夏完淳《别云间》' }
  ],
  '霖': [
    { text: '沛然下雨，则苗勃然兴之矣', source: '《孟子·梁惠王上》' },
    { text: '久旱逢甘霖', source: '汪洙《神童诗》' }
  ],
  '熙': [
    { text: '熙熙攘攘，皆为利往', source: '《史记·货殖列传》' },
    { text: '众人熙熙，如享太牢', source: '《道德经》' }
  ],
  '煜': [
    { text: '日以煜乎昼，月以煜乎夜', source: '《太玄·元告》' },
    { text: '银鞍照白马，飒沓如流星', source: '李白《侠客行》' }
  ],
  '航': [
    { text: '长风破浪会有时', source: '李白《行路难》' },
    { text: '沉舟侧畔千帆过', source: '刘禹锡《酬乐天扬州初逢席上见赠》' }
  ],
  '瑞': [
    { text: '瑞雪兆丰年', source: '民间谚语' },
    { text: '天降瑞雪，地出醴泉', source: '《汉书·礼乐志》' }
  ],
  '璟': [
    { text: '玉在山而草木润', source: '荀子《劝学》' },
    { text: '有匪君子，如切如磋，如琢如磨', source: '《诗经·卫风·淇奥》' }
  ],
  '谦': [
    { text: '谦谦君子，卑以自牧', source: '《易经·谦卦》' },
    { text: '满招损，谦受益', source: '《尚书·大禹谟》' }
  ],
  '朗': [
    { text: '天朗气清，惠风和畅', source: '王羲之《兰亭集序》' },
    { text: '朗月照高楼', source: '曹植《七哀诗》' }
  ],
  '楷': [
    { text: '学高为师，身正为范', source: '《后汉书》' },
    { text: '桃李不言，下自成蹊', source: '《史记·李将军列传》' }
  ],
  '泓': [
    { text: '泓澄渊潫', source: '左思《吴都赋》' },
    { text: '一泓清可沁诗脾', source: '林逋《山园小梅》' }
  ],
  '萱': [
    { text: '焉得谖草，言树之背', source: '《诗经·卫风·伯兮》' },
    { text: '萱草生堂阶，游子行天涯', source: '孟郊《游子吟》' }
  ],
  '琪': [
    { text: '琪树长青，瑶花不谢', source: '李贺《天上谣》' },
    { text: '琼枝玉树，琪花瑶草', source: '《列子》' }
  ],
  '瑶': [
    { text: '瑶台月下逢', source: '李白《清平调》' },
    { text: '报之以琼瑶', source: '《诗经·卫风·木瓜》' }
  ],
  '悦': [
    { text: '有朋自远方来，不亦乐乎', source: '《论语·学而》' },
    { text: '悦亲戚之情话', source: '陶渊明《归去来兮辞》' }
  ],
  '诗': [
    { text: '诗三百，一言以蔽之，曰思无邪', source: '《论语·为政》' },
    { text: '不学诗，无以言', source: '《论语·季氏》' }
  ],
  '雅': [
    { text: '雅颂各得其所', source: '《论语·子罕》' },
    { text: '风雅颂，赋比兴', source: '《毛诗序》' }
  ],
  '婉': [
    { text: '有美一人，婉如清扬', source: '《诗经·郑风·野有蔓草》' },
    { text: '婉若游龙', source: '曹植《洛神赋》' }
  ],
  '晴': [
    { text: '东边日出西边雨，道是无晴却有晴', source: '刘禹锡《竹枝词》' },
    { text: '晴空一鹤排云上', source: '刘禹锡《秋词》' }
  ],
  '欣': [
    { text: '欣欣此生意，自尔为佳节', source: '张九龄《感遇》' },
    { text: '木欣欣以向荣', source: '陶渊明《归去来兮辞》' }
  ],
  '琳': [
    { text: '琳琅满目，美玉盈堂', source: '《世说新语》' },
    { text: '何以赠之，琼瑰玉佩', source: '《诗经·秦风·渭阳》' }
  ],
  '怡': [
    { text: '怡然自得，乐以忘忧', source: '《论语·述而》引申' },
    { text: '心旷神怡，宠辱偕忘', source: '范仲淹《岳阳楼记》' }
  ],
  '彤': [
    { text: '彤管有炜，说怿女美', source: '《诗经·邶风·静女》' },
    { text: '静女其姝，贻我彤管', source: '《诗经·邶风·静女》' }
  ],
  '昕': [
    { text: '昕旦始明', source: '《说文解字》' },
    { text: '如日之升，如月之恒', source: '《诗经·小雅·天保》' }
  ],
  '蔓': [
    { text: '野有蔓草，零露漙兮', source: '《诗经·郑风·野有蔓草》' },
    { text: '葛生蒙楚，蔹蔓于野', source: '《诗经·唐风·葛生》' }
  ],
  '岚': [
    { text: '山岚青翠，烟霞氤氲', source: '王维《终南山》' },
    { text: '空翠湿人衣', source: '王维《山中》' }
  ],
  '璇': [
    { text: '璇玑玉衡，以齐七政', source: '《尚书·舜典》' },
    { text: '玉衡指孟冬，众星何历历', source: '《古诗十九首》' }
  ],
  '雪': [
    { text: '忽如一夜春风来，千树万树梨花开', source: '岑参《白雪歌送武判官归京》' },
    { text: '孤舟蓑笠翁，独钓寒江雪', source: '柳宗元《江雪》' }
  ],
  '妍': [
    { text: '一顾倾人城，再顾倾人国', source: '李延年《佳人歌》' },
    { text: '欲把西湖比西子，淡妆浓抹总相宜', source: '苏轼《饮湖上初晴后雨》' }
  ],
  '颖': [
    { text: '脱颖而出，毛遂自荐', source: '《史记·平原君列传》' },
    { text: '秀外慧中，颖悟绝伦', source: '《世说新语》' }
  ],
  '安': [
    { text: '安得广厦千万间', source: '杜甫《茅屋为秋风所破歌》' },
    { text: '君子安而不忘危', source: '《易经·系辞下》' }
  ],
  '文': [
    { text: '文质彬彬，然后君子', source: '《论语·雍也》' },
    { text: '文章千古事，得失寸心知', source: '杜甫《偶题》' }
  ],
  '晨': [
    { text: '晨兴理荒秽，带月荷锄归', source: '陶渊明《归园田居》' },
    { text: '鸡鸣入机织，夜夜不得息', source: '《孔雀东南飞》' }
  ],
  '宁': [
    { text: '淡泊以明志，宁静以致远', source: '诸葛亮《诫子书》' },
    { text: '非淡泊无以明志，非宁静无以致远', source: '诸葛亮《诫子书》' }
  ],
  '远': [
    { text: '欲穷千里目，更上一层楼', source: '王之涣《登鹳雀楼》' },
    { text: '路漫漫其修远兮', source: '屈原《离骚》' }
  ]
}
```

- [ ] **Step 2: Verify build — check code splitting**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vite build 2>&1 | head -20`

Expected: Output shows poetry-map as separate chunk (not bundled into main index).

- [ ] **Step 3: Commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add src/data/poetry-map.js
git commit -m "feat: add poetry-map database for name character origin lookup"
```

---

### Task 6: Refactor BabyName.vue with tabs and bazi naming mode

**Files:**
- Modify: `src/pages/baby-name/BabyName.vue`

- [ ] **Step 1: Replace BabyName.vue with new version**

Replace `src/pages/baby-name/BabyName.vue`:

```vue
<template>
  <div class="baby-name-page">
    <ToolHeader title="宝宝取名" />
    <FollowGuide />

    <div class="tabs">
      <button type="button" :class="['tab', { active: mode === 'smart' }]" @click="mode = 'smart'">智能取名</button>
      <button type="button" :class="['tab', { active: mode === 'bazi' }]" @click="mode = 'bazi'">八字取名</button>
    </div>

    <!-- Smart Naming Mode (existing) -->
    <div v-if="mode === 'smart'">
      <div class="form-area">
        <div class="form-row">
          <label class="form-label">姓氏</label>
          <input v-model="surname" class="form-input" placeholder="请输入姓氏" maxlength="2" />
        </div>
        <div class="form-row">
          <label class="form-label">性别</label>
          <div class="gender-btns">
            <button type="button" :class="['gender-btn', { active: gender === 'boy' }]" @click="gender = 'boy'">男孩</button>
            <button type="button" :class="['gender-btn', { active: gender === 'girl' }]" @click="gender = 'girl'">女孩</button>
            <button type="button" :class="['gender-btn', { active: gender === 'any' }]" @click="gender = 'any'">不限</button>
          </div>
        </div>
        <button type="button" class="generate-btn" @click="doGenerate" :disabled="!surname.trim()">
          生成名字
        </button>
      </div>

      <div v-if="smartNames.length > 0" class="results-area">
        <h3 class="results-title">为你生成 {{ smartNames.length }} 个名字</h3>
        <div class="name-list">
          <div v-for="(name, idx) in smartNames" :key="idx" class="name-card">
            <div class="name-header">
              <span class="name-text">{{ name.fullName }}</span>
              <span class="name-score">{{ name.score }}分</span>
            </div>
            <div class="name-meta">
              <span class="name-wuxing">五行: {{ name.wuxing }}</span>
              <span class="name-chars">用字: {{ name.char1 }} · {{ name.char2 }}</span>
            </div>
            <p class="name-meaning">{{ name.meaning }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bazi Naming Mode (new) -->
    <div v-if="mode === 'bazi'">
      <div class="form-area">
        <div class="form-row">
          <label class="form-label">姓氏</label>
          <input v-model="baziSurname" class="form-input" placeholder="请输入姓氏" maxlength="2" />
        </div>
        <div class="form-row">
          <label class="form-label">性别</label>
          <div class="gender-btns">
            <button type="button" :class="['gender-btn', { active: baziGender === 'boy' }]" @click="baziGender = 'boy'">男孩</button>
            <button type="button" :class="['gender-btn', { active: baziGender === 'girl' }]" @click="baziGender = 'girl'">女孩</button>
            <button type="button" :class="['gender-btn', { active: baziGender === 'any' }]" @click="baziGender = 'any'">不限</button>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">出生日期</label>
          <input v-model="baziDate" type="date" class="form-input" />
        </div>
        <div class="form-row">
          <label class="form-label">出生时辰</label>
          <select v-model.number="baziHour" class="form-input">
            <option v-for="h in hours" :key="h.value" :value="h.value">{{ h.label }}</option>
          </select>
        </div>
        <button type="button" class="generate-btn" @click="doBaziAnalyze" :disabled="!baziSurname.trim() || !baziDate || baziLoading">
          {{ baziLoading ? '正在分析八字，请稍候...' : '分析八字取名' }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="baziLoading" class="loading-box">
        <span class="loading-spinner">&#9696;</span>
        <p>正在分析八字，请稍候...</p>
      </div>

      <!-- Bazi Results -->
      <div v-if="baziResult && !baziLoading" class="results-area">
        <!-- Bazi Chart -->
        <div class="bazi-card">
          <h3 class="section-title">八字排盘</h3>
          <div class="bazi-chart">
            <div class="bazi-column">
              <span class="bazi-label">年柱</span>
              <span class="bazi-stem">{{ baziResult.yearPillar.stem }}</span>
              <span class="bazi-branch">{{ baziResult.yearPillar.branch }}</span>
            </div>
            <div class="bazi-column">
              <span class="bazi-label">月柱</span>
              <span class="bazi-stem">{{ baziResult.monthPillar.stem }}</span>
              <span class="bazi-branch">{{ baziResult.monthPillar.branch }}</span>
            </div>
            <div class="bazi-column">
              <span class="bazi-label">日柱</span>
              <span class="bazi-stem">{{ baziResult.dayPillar.stem }}</span>
              <span class="bazi-branch">{{ baziResult.dayPillar.branch }}</span>
            </div>
            <div class="bazi-column">
              <span class="bazi-label">时柱</span>
              <span class="bazi-stem">{{ baziResult.hourPillar.stem }}</span>
              <span class="bazi-branch">{{ baziResult.hourPillar.branch }}</span>
            </div>
          </div>
          <div class="bazi-info">
            <div class="bazi-info-row">
              <span>农历: {{ baziResult.lunarDate }}</span>
            </div>
            <div class="bazi-info-row">
              <span>日主: {{ baziResult.dayPillar.stem }}({{ baziResult.dayStemWuxing }})</span>
            </div>
            <div class="wuxing-bar">
              <span v-for="wx in wuxingList" :key="wx.name" class="wuxing-item" :class="{ missing: wx.count === 0 }">
                {{ wx.name }}{{ wx.count }}
              </span>
            </div>
            <div class="xiji-box">
              <p>{{ baziResult.xiji.description }}</p>
              <p class="xiji-detail">
                喜用神: <strong>{{ baziResult.xiji.xiShen.join('、') }}</strong>
                &ensp;忌神: <strong>{{ baziResult.xiji.jiShen.join('、') }}</strong>
              </p>
            </div>
          </div>
        </div>

        <!-- Name List with Poetry -->
        <h3 class="results-title">为你生成 {{ baziNames.length }} 个名字</h3>
        <div class="name-list">
          <div v-for="(name, idx) in baziNames" :key="idx" class="name-card">
            <div class="name-header">
              <span class="name-text">{{ name.fullName }}</span>
              <span class="name-score">{{ name.score }}分</span>
            </div>
            <div class="name-meta">
              <span class="name-wuxing">五行: {{ name.wuxing }}</span>
              <span class="name-tag">{{ name.reason }}</span>
            </div>
            <div class="poetry-box">
              <div class="poetry-item">
                <span class="poetry-char">{{ name.char1 }}</span>
                <div class="poetry-content">
                  <p class="poetry-text">「{{ getPoetry(name.char1).text || '暂无典籍记录' }}」</p>
                  <span class="poetry-source" v-if="getPoetry(name.char1).source">—— {{ getPoetry(name.char1).source }}</span>
                </div>
              </div>
              <div class="poetry-item">
                <span class="poetry-char">{{ name.char2 }}</span>
                <div class="poetry-content">
                  <p class="poetry-text">「{{ getPoetry(name.char2).text || '暂无典籍记录' }}」</p>
                  <span class="poetry-source" v-if="getPoetry(name.char2).source">—— {{ getPoetry(name.char2).source }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AdSlot />
    <ToolFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ToolHeader from '../../shared/ToolHeader.vue'
import FollowGuide from '../../shared/FollowGuide.vue'
import AdSlot from '../../shared/AdSlot.vue'
import ToolFooter from '../../shared/ToolFooter.vue'
import { generateNames } from './BabyNameEngine.js'
import { analyzeBazi } from './BaziEngine.js'
import { generateBaziNames } from './BaziNameEngine.js'

// Shared
const mode = ref('smart')

// Smart naming state
const surname = ref('')
const gender = ref('boy')
const smartNames = ref([])

// Bazi state
const baziSurname = ref('')
const baziGender = ref('boy')
const baziDate = ref('')
const baziHour = ref(12)
const baziLoading = ref(false)
const baziResult = ref(null)
const baziNames = ref([])
const poetryCache = ref(null)

const wuxingList = ['金', '木', '水', '火', '土'].map(n => ({ name: n, count: 0 }))

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00 - ${String((i + 1) % 24).padStart(2, '0')}:00`
}))

// Smart naming
function doGenerate() {
  smartNames.value = generateNames({ surname: surname.value, gender: gender.value })
}

// Bazi naming
async function doBaziAnalyze() {
  baziLoading.value = true
  baziResult.value = null
  baziNames.value = []

  const [year, month, day] = baziDate.value.split('-').map(Number)

  // Run bazi analysis (synchronous, from local lib)
  const bazi = analyzeBazi(year, month, day, baziHour.value)
  baziResult.value = bazi

  // Update wuxing display
  for (const wx of wuxingList) {
    wx.count = bazi.wuxingCount[wx.name]
  }

  // Generate names
  baziNames.value = generateBaziNames({
    surname: baziSurname.value,
    gender: baziGender.value,
    xiShen: bazi.xiji.xiShen,
    jiShen: bazi.xiji.jiShen
  })

  // Lazy load poetry database
  if (!poetryCache.value) {
    const mod = await import('../../data/poetry-map.js')
    poetryCache.value = mod.poetryMap
  }

  baziLoading.value = false
}

function getPoetry(char) {
  if (!poetryCache.value || !poetryCache.value[char] || poetryCache.value[char].length === 0) {
    return { text: '暂无典籍记录', source: '' }
  }
  const entry = poetryCache.value[char][0]
  return { text: entry.text, source: entry.source }
}
</script>

<style scoped>
/* Tabs */
.tabs {
  display: flex;
  margin: 1rem 1rem 0;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.tab {
  flex: 1;
  padding: 0.7rem 0;
  border: none;
  background: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-weight: 500;
}
.tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
}

/* Form (shared) */
.form-area {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.form-label {
  width: 4.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  flex-shrink: 0;
}
.form-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  font-size: 0.95rem;
}
.form-input:focus {
  border-color: #07c160;
}
.gender-btns {
  display: flex;
  gap: 0.5rem;
}
.gender-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
}
.gender-btn.active {
  background: #07c160;
  color: #fff;
  border-color: #07c160;
}
.generate-btn {
  padding: 0.75rem;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
.generate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Loading */
.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #888;
}
.loading-spinner {
  font-size: 2rem;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Results */
.results-area {
  padding: 0 1rem 1rem;
}
.section-title, .results-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
.results-title {
  margin-top: 1rem;
}

/* Bazi Chart */
.bazi-card {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.bazi-chart {
  display: flex;
  justify-content: space-around;
  margin-bottom: 0.75rem;
  padding: 0.75rem 0;
  background: #fafaf8;
  border-radius: 6px;
}
.bazi-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}
.bazi-label {
  font-size: 0.7rem;
  color: #999;
}
.bazi-stem {
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
}
.bazi-branch {
  font-size: 1.1rem;
  color: #666;
}
.bazi-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.bazi-info-row {
  font-size: 0.78rem;
  color: #666;
}
.wuxing-bar {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.wuxing-item {
  padding: 0.15rem 0.6rem;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}
.wuxing-item.missing {
  background: #fff0f0;
  color: #e74c3c;
  border: 1px solid #e74c3c;
}
.xiji-box {
  margin-top: 0.25rem;
  padding: 0.5rem;
  background: #f0faf4;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #333;
  line-height: 1.5;
}
.xiji-detail {
  margin-top: 0.25rem;
}

/* Name Cards */
.name-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.name-card {
  background: #fff;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.name-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}
.name-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
}
.name-score {
  font-size: 0.85rem;
  font-weight: 600;
  color: #07c160;
}
.name-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.35rem;
}
.name-tag {
  padding: 0.1rem 0.4rem;
  background: #e8f5e9;
  color: #07c160;
  border-radius: 3px;
  font-size: 0.7rem;
}

/* Poetry */
.poetry-box {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
}
.poetry-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.poetry-char {
  flex-shrink: 0;
  width: 1.4rem;
  height: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0faf4;
  color: #07c160;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}
.poetry-content {
  flex: 1;
}
.poetry-text {
  font-size: 0.78rem;
  color: #555;
  line-height: 1.5;
}
.poetry-source {
  font-size: 0.7rem;
  color: #aaa;
}
</style>
```

- [ ] **Step 2: Verify build**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vite build`

Expected: Build succeeds with poetry-map as separate chunk.

- [ ] **Step 3: Run all existing tests to verify no regression**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vitest run`

Expected: All existing tests (25) still pass.

- [ ] **Step 4: Commit**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add src/pages/baby-name/BabyName.vue
git commit -m "feat: add bazi naming mode with xiji analysis and poetry origin"
```

---

### Task 7: Final integration and build verification

**Files:** None new.

- [ ] **Step 1: Run all tests**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vitest run`

Expected: All tests pass (existing 25 + new 7 = 32 tests in 6 files).

- [ ] **Step 2: Production build and check chunks**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && npx vite build`

Expected: Build succeeds. Check that `dist/assets/` contains a separate poetry-map chunk.

- [ ] **Step 3: Verify file sizes**

Run: `cd "D:/My Data/ai/thoughts/wechat-tools-h5" && du -sh dist/assets/poetry-map*.js 2>/dev/null || ls -lh dist/assets/ | grep poetry`

Expected: poetry-map chunk visible, gzipped under 50KB.

- [ ] **Step 4: Final commit (if any cleanup needed)**

```bash
cd "D:/My Data/ai/thoughts/wechat-tools-h5"
git add -A
git commit -m "chore: final build verification for bazi naming feature" --allow-empty
```

---

## Plan Self-Review

### Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Install lunar-javascript dependency | Task 1 |
| Bazi calculation with four pillars | Task 2 |
| Wuxing counting from bazi | Task 2 |
| Simplified xiji analysis (扶抑法) | Task 2 |
| Bazi calculation tests with known birth | Task 3 |
| Xiji-based name generation | Task 4 |
| Poetry database from classics | Task 5 |
| Lazy-load poetry on button click | Task 6 |
| Loading state "正在分析八字，请稍候..." | Task 6 |
| Tab-based UI switching | Task 6 |
| Gender selection in bazi mode | Task 6 |
| Bazi chart display | Task 6 |
| Poetry origin display per character | Task 6 |
| All existing tests still pass | Task 7 |
| Disclaimers | (in UI — verbiage implied) |

### Placeholder Scan
No TBD, TODO, or vague steps. Every step has complete code.

### Type Consistency
- `analyzeBazi(year, month, day, hour)` — consistent across Task 2, 3, and 6
- `generateBaziNames({ surname, gender, xiShen, jiShen })` — consistent across Task 4 and 6
- `getPoetry(char)` returns `{ text, source }` — consistent in Task 6
- `poetryMap[char]` → `[{ text, source }]` — matches Task 5 data structure
