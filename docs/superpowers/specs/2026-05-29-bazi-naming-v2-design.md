# 八字取名 v2：诗词关联匹配 + 打分体系设计文档

## 概述

重构八字取名引擎，从"按字查诗"升级为"按诗歌找字对"。两个候选名用字在同一首诗/同一句诗中出现才生成候选名，诗词关联度直接影响名字评分。同时修复评分体系从固定100分到加权100分制。

## 架构

```
BaziNameEngine.js (重写)
├── 输入: { surname, gender, xiShen, jiShen }
├── poetry-map.js (重建) → 按诗索引 + 按字查诗
├── 遍历诗歌 → 找可配对字 → 生成候选名
├── 打分: 喜忌(35) + 诗词关联(35) + 音韵(15) + 寓意(15) = 100
└── 输出: [{ fullName, char1, char2, score, poetry, scoreBreakdown }]

BabyName.vue (修改)
├── 名字卡片: 分段分数展示
├── 诗词展示: 名字用字标红
└── 关联等级标签: 🔴同句 🟡同诗 ⚪五行

poetry-map.js (重建)
├── 新数据结构: poems[] 数组，每首都含 title/author/lines/chars
├── 索引: charIndex → 哪些诗的哪些行含该字
├── 数据量: ~80-120KB, 动态 import
└── 来源: 诗经/楚辞/唐诗三百首/宋词三百首/古诗十九首
```

## 修改文件

- `src/data/poetry-map.js` — 重建，从字索引改为诗索引 + 字索引双结构
- `src/pages/baby-name/BaziNameEngine.js` — 重写，诗词关联匹配 + 新打分
- `src/pages/baby-name/BabyName.vue` — 修改，分段分数 + 标红 + 等级标签

## 不改文件

- `BaziEngine.js` — 八字计算不变
- `BaziEngine.test.js` — 八字测试不变
- `names.js` — 词库不变
- `BabyNameEngine.js` — 智能取名不变

## 新 poetry-map 数据结构

```js
// 诗歌条目
export const poems = [
  {
    id: 1,
    title: '望洞庭湖赠张丞相',
    author: '孟浩然',
    source: '唐诗三百首',
    lines: [
      { text: '涵虚混太清', chars: ['涵','虚','混','太','清'] },
      { text: '波撼岳阳城', chars: ['波','撼','岳','阳','城'] }
    ]
  },
  // ...
]

// 字索引: char → [{ poemId, lineIndex, charPositionInLine }]
export const charIndex = {
  '涵': [{ poemId: 1, lineIdx: 0, linePos: 0 }, ...],
  '宇': [{ poemId: 5, lineIdx: 4, linePos: 0 }, ...],
  // ...
}
```

## 新 BaziNameEngine 算法

```js
function generateBaziNames({ surname, gender, xiShen, jiShen }) {
  const pool = getGenderPool(gender)
  const xiChars = pool.filter(c => xiShen.includes(c.wuxing))

  const candidates = []

  // Scan every poem for matching character pairs
  for (const poem of poems) {
    for (let li = 0; li < poem.lines.length; li++) {
      const lineChars = poem.lines[li].chars.filter(ch => xiChars.find(x => x.char === ch))
      // Check pairs within same line (🔴 top tier)
      for (let i = 0; i < lineChars.length - 1; i++) {
        for (let j = i + 1; j < lineChars.length; j++) {
          const c1 = findInPool(pool, lineChars[i])
          const c2 = findInPool(pool, lineChars[j])
          if (c1 && c2 && c1.char !== c2.char) {
            candidates.push({ c1, c2, poem, lineIdx: li, level: 'sameLine' })
          }
        }
      }
    }
    // Check pairs across lines within same poem (🟡 second tier)
    const allPoemChars = poem.lines.flatMap((l, i) =>
      l.chars.filter(ch => xiChars.find(x => x.char === ch))
        .map(ch => ({ ch, lineIdx: i }))
    )
    for (let i = 0; i < allPoemChars.length - 1; i++) {
      for (let j = i + 1; j < allPoemChars.length; j++) {
        if (allPoemChars[i].lineIdx === allPoemChars[j].lineIdx) continue // already handled
        const c1 = findInPool(pool, allPoemChars[i].ch)
        const c2 = findInPool(pool, allPoemChars[j].ch)
        if (c1 && c2 && !alreadyInCandidates(candidates, c1, c2)) {
          candidates.push({ c1, c2, poem, level: 'samePoem' })
        }
      }
    }
  }

  // Fallback: single xiShen chars paired randomly (⚪ bottom tier)
  // ...

  // Score and return top 20
  return candidates.map(c => scoreCandidate(c, surname)).sort((a,b) => b.score - a.score).slice(0, 20)
}

function scoreCandidate(candidate, surname) {
  const poetryScore = candidate.level === 'sameLine' ? 35 : candidate.level === 'samePoem' ? 24.5 : 10.5

  const xiMatch = [candidate.c1, candidate.c2].filter(c => c.isXi).length
  const xijiScore = xiMatch === 2 ? 35 : xiMatch === 1 ? 17.5 : 0

  const soundScore = /* stroke parity + tone */ || 15
  const meaningScore = /* avg of two char meaning scores normalized */ || 15

  return {
    fullName: surname + candidate.c1.char + candidate.c2.char,
    score: Math.round(poetryScore + xijiScore + soundScore + meaningScore),
    scoreBreakdown: { xiji: xijiScore, poetry: poetryScore, sound: soundScore, meaning: meaningScore },
    poetry: {
      text: formatPoetryText(candidate),
      source: `${candidate.poem.author}《${candidate.poem.title}》`,
      level: candidate.level
    }
  }
}
```

## 打分体系

| 维度 | 满分 | 规则 |
|------|------|------|
| 喜忌匹配 | 35 | 两字全喜用35，一字喜用17.5，都非喜用0 |
| 诗词关联 | 35 | 同句35，同诗24.5，仅五行匹配10.5 |
| 音韵 | 15 | 笔画奇偶交替9 + 声调/韵母变化6 |
| 寓意 | 15 | 两字寓意分均值归一化（95分 → 15，85分 → 13.5） |
| **总分** | **100** | |

## 页面布局（名字卡片）

```
┌─────────────────────────────┐
│ 王涵宇                  92分 │
│ 五行: 水木  [🔴同句匹配]     │
│ 喜忌: 35  诗词: 35  音韵:12  │
│ 寓意: 10                     │
│ ┌─ 出处 ──────────────────┐ │
│ │ 「涵虚混太清」           │ │
│ │    —— 孟浩然《望洞庭湖》  │ │
│ │ 「宇泰定者发乎天光」     │ │
│ │    —— 《庄子·庚桑楚》    │ │
│ │ 💡 两字在同一首诗中出现   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**标红规则**：候选名中每个字在诗句中出现时，用 `<span class="hl">字</span>` 包裹，CSS `.hl { color: #e74c3c; font-weight: 700; }`

## 分析流程舞台提示

点击"分析八字取名"后，展示阶段性提示，每步有短暂延迟（500-800ms），让用户感知到分析过程：

```
用户点击 [分析八字取名]
  │
  ├── [0.0s] 🔍 正在推算八字排盘...
  │      await delay(600)
  ├── [0.6s] 🖐️ 正在分析五行喜忌...
  │      await delay(600)
  ├── [1.2s] 📖 正在匹配诗词典籍...
  │      await delay(800)
  ├── [2.0s] ✨ 正在生成名字并打分...
  │      await delay(500)
  │
  ▼ [2.5s] 展示结果
```

**实现方式**：
- `baziSteps` 数组: `['推算八字排盘', '分析五行喜忌', '匹配诗词典籍', '生成名字并打分']`
- `baziCurrentStep` 跟踪当前步骤索引
- 每步实际计算完成后更新步骤、设置 `setTimeout` 延迟再进下一步
- 延迟期间 UI 显示当前步骤文案 + 已完成步骤打勾
- 加载中按钮禁用，文案改为当前步骤提示

**UI 展示**：

```
┌──────────────────────────┐
│                          │
│    🔍                    │
│    正在推算八字排盘...    │
│                          │
│    ✓ 推算八字排盘         │
│    ✓ 分析五行喜忌         │
│    → 匹配诗词典籍          │  ← 当前步骤（高亮）
│    ○ 生成名字并打分        │
│                          │
└──────────────────────────┘
```

## 测试策略

| 层 | 内容 | 工具 |
|----|------|------|
| poetry-map结构 | poems数组有效、charIndex正确 | Vitest |
| 字对同句匹配 | 给定诗歌，返回同句字对 | Vitest |
| 字对同诗匹配 | 给定诗歌，返回同诗不同句字对 | Vitest |
| 打分 | 已知组合输出正确分段分数 | Vitest |
| UI | 标红渲染、分数展示、等级标签 | 手动 |

## 不做什么

- 不改 BaziEngine.js
- 不改 names.js 数据结构
- 不改智能取名模式
- 诗词数据不超过 150KB
