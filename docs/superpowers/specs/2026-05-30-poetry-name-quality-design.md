# Baby Name Tool — Quality Optimization

**Date**: 2026-05-30  
**Status**: draft  

## Problems

1. **Fake word combos**: Characters extracted as adjacent pairs may not form a coherent phrase. Example: from "叹年华一瞬", "华一" is extracted but "华" belongs to "年华" and "一" to "一瞬" — "华一" is meaningless.
2. **Truncated poetry display**: `text` shows only a punctuation-split segment, not the full poetry line.
3. **Flat xiShen priority**: Multiple favorable elements are treated as equal, but in Bazi theory 用神 (yongShen) takes priority over 喜神 (xiShen).
4. **Dead scoring dimensions**: Sound (音韵) and meaning (寓意) scores are non-functional because all characters have hardcoded `strokes: 8` and `score: 85`.

---

## Design

### 1. Poetry coherence flag

**File**: `scripts/build-poetry-db.js` — `extractCombos()`

Add `coherent` field to each entry:

| Extraction method | `coherent` |
|---|---|
| jieba 2-char word | `true` |
| Adjacent character pair | `false` |

```js
// Adjacent pairs
combos.push({ ..., text: line, coherent: false })

// Jieba words
combos.push({ ..., text: line, coherent: true })
```

### 2. Full poetry line display

**File**: `scripts/build-poetry-db.js` — `extractCombos()`

Change `text` from segment to full line:

- **Before**: `text: seg` → "叹年华一瞬"
- **After**: `text: line` → "叹年华一瞬，人今千里"

### 3. XiShen priority ranking

**File**: `src/pages/baby-name/BaziEngine.js` — `analyzeXiji()`

Split xiShen into two tiers:

| Tier | Name | Meaning | Priority |
|---|---|---|---|
| `yongShen` | 用神 | Primary favorable element — the key remedy | 1st |
| `xiShen` | 喜神 | Secondary favorable — supports yongShen | 2nd |

**Derivation rule** (standard Bazi theory):

| Day master status | yongShen (primary) | xiShen (secondary) |
|---|---|---|
| 身强 (strong) | 克日主 (restrain) | 日主生 + 日主克 (drain) |
| 身弱 (weak) | 生日主 (support) | 同类 (same element) |

**Scoring impact** (`BaziNameEngine.js`):

| Combo | xijiPts | Description |
|---|---|---|
| Both chars match yongShen (same element) | 40 | 用神同五行 |
| Both chars match yongShen (different) | 35 | 两个字都用神 |
| One yongShen + one xiShen | 30 | 用神+喜神 |
| Both chars match xiShen | 25 | 两个字都喜神 |
| Only one char in xiShen/yongShen | 20 | 只一个字命中 |
| Neither | 10 | 都不匹配 |

- Position in name does NOT matter: "水土" and "土水" score equally
- Return `{ yongShen, xiShen, jiShen, ... }` from `analyzeXiji()`

### 3b. Result diversity: combo quota

**Problem**: When yongShen dominates (e.g. 水=用神, 土=喜神, 金=喜神), the top 20 results are almost all 水水 combos. Users can't see names from other favorable combinations.

**Strategy**: Group-based quota — each wuxing combo gets at least top-2, remainder filled by overall score.

**File**: `src/pages/baby-name/BaziNameEngine.js`

Algorithm (replaces the final sort + slice):

```
1. Generate all candidates, score each (unchanged)
2. Group results by wuxing combo (e.g. "水水", "水土", "水金", ...)
3. Sort each group internally by total score desc
4. Interleave: take top-2 from each group, cycle through groups
5. When all groups exhausted at top-2, fill remaining slots by global score desc
6. Return top 20
```

**Example** (yongShen=水, xiShen=土,金; target 20 names):

| Round | Selection |
|---|---|
| Pass 1 — per-group top-2 | 水水×2, 水土×2, 水金×2, 土水×2, 土土×2, 土金×2, 金水×2, 金土×2, 金金×2 (18 names) |
| Pass 2 — fill by score | Global best 2 remaining (any combo) |

This guarantees every favorable combo appears at least twice while keeping overall quality high.

### 4. Real stroke counts

**Data source**: [James88/qiming](https://github.com/James88/qiming) — `wuxing_dict_jianti.json`

- Contains chars grouped by wuxing with simplified + traditional stroke counts
- Extract traditional (康熙) stroke count for each naming character

**File**: `scripts/build-poetry-db.js`

- Load stroke data before building the character list
- Replace hardcoded `strokes: 8` with real Kangxi stroke count
- When a char is not found in the stroke dictionary, default to a heuristic based on the wuxing group average

**Sound scoring** (`BaziNameEngine.js`) — now functional:

| Condition | soundPts |
|---|---|
| stroke alternation (odd↔even) + diff 3–12 | 15 |
| stroke alternation only | 12 |
| diff 3–12 only | 10 |
| neither | 7 |

### 5. Real meaning scores

**Data source**: [汉字资源数据库 (20,880 chars)](https://gitcode.com/Open-source-documentation-tutorial/8e036) — `吉凶寓意` field

- Extract the 吉凶 (auspiciousness) field for each naming character
- Map to numeric score:
  - 吉 (auspicious) → 90–100
  - 平 (neutral) → 78–88
  - 凶 (inauspicious) → 50–70
- Replace hardcoded `score: 85`

**Meaning scoring** (`BaziNameEngine.js`) — now functional:

| Avg score of two chars | meaningPts |
|---|---|
| ≥ 95 | 15 |
| ≥ 88 | 13 |
| ≥ 82 | 10 |
| < 82 | 7 |

### 6. Coherent poetry scoring

**File**: `src/pages/baby-name/BaziNameEngine.js`

```js
const poetryPts = entry.coherent !== false ? 30 : 20
```

- Coherent / old data: 30 pts
- Non-coherent adjacent pair: 20 pts

---

## Scoring Summary (after changes)

```
Total = xijiPts (10–40) + poetryPts (20–30) + soundPts (7–15) + meaningPts (7–15)
Max   = 100
```

| Dimension | Range | Based on |
|---|---|---|
| 喜忌 (xiji) | 10–40 | yongShen/xiShen priority matching |
| 诗词 (poetry) | 20–30 | jieba coherence verification |
| 音韵 (sound) | 7–15 | real Kangxi stroke count alternation |
| 寓意 (meaning) | 7–15 | real auspiciousness ratings |

---

## Affected Files

| File | Change |
|---|---|
| `scripts/build-poetry-db.js` | Load stroke/meaning data; add `coherent` flag; use full `line` for `text`; write real strokes/scores to `names.js` |
| `src/data/poetry-map.js` | Regenerated (`coherent` field, `text` = full line) |
| `src/data/names.js` | Regenerated (real `strokes` and `score` per character) |
| `src/pages/baby-name/BaziEngine.js` | `analyzeXiji()` returns `yongShen` + `xiShen` separately |
| `src/pages/baby-name/BaziNameEngine.js` | Tiered xiji scoring; coherent poetry scoring; real sound/meaning scoring; combo-quota diversity; remove redundant `level`/`levelLabel`/`reason` fields |
| `src/pages/baby-name/BabyName.vue` | Remove level tag display, `levelIcon()`, and `.level-*` CSS; loading: single-step display with spinning icon, 3s per step; remove smart naming mode + tab switching, rename to 八字取名 |
| `src/pages/Home.vue` | Update 宝宝取名 card: rename to 八字取名, new description |
| `src/pages/baby-name/BaziEngine.test.js` | Update for new xiShen return shape (yongShen/xiShen split) |
| `src/pages/baby-name/BaziNameEngine.test.js` | New tests for tiered xiji scoring, coherent poetry scoring, combo-quota diversity |

---

### 7. Loading UX: sequential single-step with spinner

**File**: `src/pages/baby-name/BabyName.vue`

**Current behavior**: All 4 step texts shown simultaneously in a vertical list, icons are text characters (✓, →, ○), delays are 600–800ms.

**New behavior**:

- **Display**: Only the current step text is shown (not all 4 at once)
- **Icon**: CSS spinning animation (rotating circle) replaces text icons
- **Timing**: Each step holds for **3 seconds** (`await delay(3000)`)

**Template change** — replace `v-for` list with single step display:

```
<!-- Before: all 4 steps listed -->
<div v-for="(step, idx) in baziSteps"> ... </div>

<!-- After: only current step -->
<div class="loading-step">
  <span class="spinner"></span>
  <span>{{ baziSteps[baziCurrentStep] }}</span>
</div>
```

**CSS addition**:

```css
.spinner {
  width: 18px; height: 18px;
  border: 2px solid #e0e0e0;
  border-top-color: #e74c3c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

**JS timing**: Replace `delay(600)` → `delay(3000)` for each step (total loading ~12s).

### 8. Rebrand: 宝宝取名 → 八字取名, remove smart mode

**Files**: `src/pages/baby-name/BabyName.vue`, `src/pages/Home.vue`

**Changes**:

- **Title**: `ToolHeader title="宝宝取名"` → `ToolHeader title="八字取名"`
- **Remove tabs**: Delete the `<div class="tabs">` block entirely — no mode switching
- **Remove smart mode**: Delete lines 11–44 (smart naming template), `mode` ref, `surname`/`gender`/`smartNames` refs, `doGenerate()`, `generateNames` import
- **Simplify**: Remove `v-if="mode === 'bazi'"` wrapper, make bazi mode the page default
- **Rename variables**: `baziSurname` → `surname`, `baziGender` → `gender`, `baziNames` → `names`, etc. (the "bazi" prefix is no longer needed to distinguish from smart mode)
- **Home.vue card**: `{ path: '/baby-name', icon: '👶', name: '宝宝取名', desc: '按五行笔画智能生成好名字' }` → `{ path: '/baby-name', icon: '👶', name: '八字取名', desc: '分析八字五行喜忌，从诗词典籍中溯源取名' }`

## Data Dependencies (new)

| Dependency | Source | Usage |
|---|---|---|
| `scripts/stroke-data.json` | Derived from James88/qiming | Kangxi stroke count per char |
| `scripts/char-meaning.json` | Derived from 汉字资源数据库 | Auspiciousness score per char |

These JSON files are generated once offline and checked into the repo as static data files. The build script reads them locally — no runtime API calls.

## Implementation Steps

1. Acquire stroke data from James88/qiming, save as `scripts/stroke-data.json`
2. Acquire meaning data from 汉字数据库, save as `scripts/char-meaning.json`
3. Edit `scripts/build-poetry-db.js` — load data sources, `coherent` flag, full `line` text, real strokes/scores
4. Run `node scripts/build-poetry-db.js` — regenerate `poetry-map.js` + `names.js`
5. Edit `src/pages/baby-name/BaziEngine.js` — yongShen/xiShen split
6. Edit `src/pages/baby-name/BaziNameEngine.js` — tiered xiji, coherent poetry, real sound/meaning scoring
7. Update tests
8. Run `npm test` — verify all pass
