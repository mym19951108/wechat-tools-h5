# Bazi Name Engine — Five-God Classification & Gender Refinement

**Date**: 2026-05-30  
**Status**: draft  

## Problems

1. **Incomplete Bazi analysis**: Only yongShen/xiShen/jiShen are classified. Neutral (闲神) and enemy-of-yongShen (仇神) elements are silently ignored.
2. **Flat gender classification**: Only 17 boy + 27 girl chars out of 201, causing 90%+ overlap between gender pools and de facto no gender-aware filtering.
3. **No result sorting**: Final name list is not sorted by score.

---

## Design

### 1. Five-God Classification

**File**: `src/pages/baby-name/BaziEngine.js` — `analyzeXiji()`

Add two new return values:

| Role | Name | Logic | Example (甲木 weak, yongShen=水) |
|---|---|---|---|
| 用神 | yongShen | Primary remedy | 水 |
| 喜神 | xiShen | Secondary support | 木 |
| 闲神 | xianShen | Neutral, neither helps nor harms | 火 |
| 仇神 | chouShen | Restrains yongShen — indirect harm | 土 (土克水) |
| 忌神 | jiShen | Directly opposes day master | 金 |

**Computation**:

```js
const allWuxing = ['金', '木', '水', '火', '土']
// chouShen = elements that restrain yongShen (KE_BY_MAP)
const chouShen = [...new Set(
  yongShen.map(w => KE_BY_MAP[w]).filter(Boolean)
)].filter(w => !yongShen.includes(w) && !jiShen.includes(w))
// xianShen = what's left
const xianShen = allWuxing.filter(w =>
  !yongShen.includes(w) && !xiShen.includes(w) && !jiShen.includes(w) && !chouShen.includes(w)
)
```

Return shape: `{ yongShen, xiShen, xianShen, chouShen, jiShen, description }`

### 2. Seven-Tier Xiji Scoring

**File**: `src/pages/baby-name/BaziNameEngine.js`

| Tier | Combo | xijiPts |
|---|---|---|
| 1 | 用神+用神 (same element) | 40 |
| 2 | 用神+用神 (different) | 35 |
| 3 | 用神+喜神 | 30 |
| 4 | 喜神+喜神 | 25 |
| 5 | 用神+闲神 or 喜神+闲神 | 18 |
| 6 | 闲神+闲神 | 12 |
| 7 | Contains 仇神 | 8 |
| 8 | Contains 忌神 | 5 |

Combo generation expands to include xianShen combinations for better coverage.

### 3. Result Sorting

**File**: `src/pages/baby-name/BaziNameEngine.js`

After combo-quota diversity selection, sort final results by score desc:

```js
return selected.slice(0, 20).sort((a, b) => b.score - a.score)
```

### 4. Frontend Display

**File**: `src/pages/baby-name/BabyName.vue`

xiji-box updated to show all five:

```
用神: 水    喜神: 木    闲神: 火    仇神: 土    忌神: 金
```

### 5. Data-Driven Gender Classification

**Data source**: James88/qiming — `Chinese_Names_Corpus_Gender（120W）.txt` (1.14M names, ~675K male / ~375K female)

**File**: `scripts/build-poetry-db.js`

Replace hardcoded `girlSet`/`boySet` with statistical analysis:

- Parse corpus: count male/female occurrences per character
- Threshold: ≥50 total occurrences AND ≥70% male → boy; ≥70% female → girl; otherwise → neutral
- Runs during `node scripts/build-poetry-db.js`, regenerates `names.js` with accurate gender splits

**Expected result** (based on current 201 chars):

| Category | Before | After |
|---|---|---|
| Boy | 17 | ~141 |
| Girl | 27 | ~62 |
| Neutral | 157 | ~28 |

Pool overlap drops from ~90% to ~30%, making gender selection meaningful.

---

## Affected Files

| File | Change |
|---|---|
| `src/pages/baby-name/BaziEngine.js` | Add xianShen + chouShen computation in `analyzeXiji()` |
| `src/pages/baby-name/BaziNameEngine.js` | 8-tier xiji scoring (with 仇/闲); combo expansion; result sorting; pass xianShen/chouShen |
| `src/pages/baby-name/BabyName.vue` | Five-god display row; update `generateBaziNames()` call signature |
| `scripts/build-poetry-db.js` | Load corpus, compute gender stats, replace hardcoded boy/girl sets |
| `src/data/names.js` | Regenerated with data-driven gender classification |
| `src/pages/baby-name/BaziEngine.test.js` | Update for new return shape (xianShen/chouShen) |
| `src/pages/baby-name/BaziNameEngine.test.js` | Update for new API and scoring tiers |

### 6. Loading Time Randomization

**File**: `src/pages/baby-name/BabyName.vue`

Replace fixed `delay(3000)` with per-step randomized intervals based on actual complexity, so the loading feels like real analysis:

| Step | Duration |
|---|---|
| 推算八字排盘 | 0.8–1.5s |
| 分析五行喜忌 | 1.5–2.5s |
| 匹配诗词典籍 | 2.5–4s |
| 生成名字并打分 | 1.5–2s |

- **Total**: 6.3–9s (under 10s limit)
- **Implementation**: helper `rand(minSec, maxSec)` returning random ms in range

---

## Affected Files

| File | Change |
|---|---|
| `src/pages/baby-name/BaziEngine.js` | Add xianShen + chouShen computation in `analyzeXiji()` |
| `src/pages/baby-name/BaziNameEngine.js` | 8-tier xiji scoring; combo expansion; result sorting |
| `src/pages/baby-name/BabyName.vue` | Five-god display; randomized loading times |
| `scripts/build-poetry-db.js` | Load corpus, compute gender stats, replace hardcoded boy/girl sets |
| `src/data/names.js` | Regenerated with data-driven gender classification |
| `src/pages/baby-name/BaziEngine.test.js` | Update for new return shape (xianShen/chouShen) |
| `src/pages/baby-name/BaziNameEngine.test.js` | Update for new API and scoring tiers |

## Implementation Steps

1. Edit `scripts/build-poetry-db.js` — corpus-based gender classification
2. Run `node scripts/build-poetry-db.js` — regenerate `names.js`
3. Edit `src/pages/baby-name/BaziEngine.js` — five-god classification
4. Edit `src/pages/baby-name/BaziNameEngine.js` — 8-tier scoring + sorting
5. Edit `src/pages/baby-name/BabyName.vue` — five gods display + randomized loading
6. Update tests
7. Run `npm test` — verify all pass
