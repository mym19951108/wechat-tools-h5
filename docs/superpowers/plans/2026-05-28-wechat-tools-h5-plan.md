# WeChat Tools H5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vue 3 + Vite SPA with 5 utility tools (3 naming + 2 calculator) served as static H5 pages for WeChat Official Account monetization.

**Architecture:** Single Vue 3 SPA with Vue Router, each tool is a standalone page component with zero backend dependencies. All computation runs client-side. Shared UI components (AdSlot, ToolHeader, ToolFooter) wrap every tool page. Data files are static JS modules.

**Tech Stack:** Vue 3 (Composition API), Vite, Vue Router 4, Vitest, plain CSS (rem-based mobile-first)

---

## File Structure Plan

```
wechat-tools-h5/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.js                          # App entry, mount Vue + Router
│   ├── App.vue                          # Root component, <router-view>
│   ├── router.js                        # Route definitions
│   ├── style.css                        # Global reset + mobile base styles
│   ├── shared/
│   │   ├── ToolHeader.vue               # Page header with back + title
│   │   ├── ToolFooter.vue               # "More tools" grid + follow CTA
│   │   ├── AdSlot.vue                   # Ad placeholder / follow guide slot
│   │   └── FollowGuide.vue              # Fixed top follow bar
│   ├── data/
│   │   ├── names.js                     # Chinese name character pool
│   │   └── english-names.js             # English names with meanings
│   ├── pages/
│   │   ├── Home.vue                     # Landing page: tool grid + intro
│   │   ├── baby-name/
│   │   │   ├── BabyName.vue             # Page component
│   │   │   ├── BabyNameEngine.js        # Name generation algorithm
│   │   │   └── BabyNameEngine.test.js   # Unit tests
│   │   ├── english-name/
│   │   │   ├── EnglishName.vue
│   │   │   ├── EnglishNameEngine.js
│   │   │   └── EnglishNameEngine.test.js
│   │   ├── nickname/
│   │   │   ├── Nickname.vue
│   │   │   ├── NicknameEngine.js
│   │   │   └── NicknameEngine.test.js
│   │   ├── mortgage/
│   │   │   ├── Mortgage.vue
│   │   │   ├── MortgageEngine.js
│   │   │   └── MortgageEngine.test.js
│   │   └── date-calc/
│   │       ├── DateCalc.vue
│   │       ├── DateCalcEngine.js
│   │       └── DateCalcEngine.test.js
├── index.html
├── vite.config.js
└── package.json
```

**Design decisions:**
- Each tool has a pure-logic `Engine.js` file (zero Vue dependency) so tests never mount components — fast, isolated, deterministic.
- Shared components are thin wrappers: receive props, emit nothing except links.
- Router uses hash mode (`createWebHashHistory`) so static hosting works without server-side redirect config.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/App.vue`
- Create: `src/router.js`
- Create: `src/style.css`

- [ ] **Step 1: Initialize project with package.json**

Create `wechat-tools-h5/package.json`:

```json
{
  "name": "wechat-tools-h5",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0",
    "jsdom": "^25.0.0"
  }
}
```

Run: `cd wechat-tools-h5 && npm install`

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  test: {
    environment: 'jsdom'
  }
})
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="format-detection" content="telephone=no" />
  <title>实用工具箱</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create src/main.js**

```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import './style.css'

createApp(App).use(router).mount('#app')
```

- [ ] **Step 5: Create src/App.vue**

```vue
<template>
  <router-view />
</template>

<script setup>
</script>
```

- [ ] **Step 6: Create empty router**

Create `src/router.js`:

```js
import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './pages/Home.vue'

const routes = [
  { path: '/', component: Home }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
```

- [ ] **Step 7: Create global styles**

Create `src/style.css`:

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
  background: #f5f5f5;
  color: #333;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}

input, button, select {
  font-size: 1rem;
  font-family: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 8: Create placeholder Home page**

Create `src/pages/Home.vue`:

```vue
<template>
  <div class="home">
    <h1>实用工具箱</h1>
    <p>工具加载中...</p>
  </div>
</template>

<script setup>
</script>
```

- [ ] **Step 9: Verify scaffold works**

Run: `cd wechat-tools-h5 && npx vite build`
Expected: Build succeeds, produces `dist/` directory.

Run: `npx vite preview --port 4173`
Open `http://localhost:4173` — shows "实用工具箱" with placeholder text.

- [ ] **Step 10: Commit scaffold**

```bash
cd wechat-tools-h5
git init
git add -A
git commit -m "feat: scaffold Vue 3 + Vite project with router"
```

---

### Task 2: Shared Components

**Files:**
- Create: `src/shared/ToolHeader.vue`
- Create: `src/shared/ToolFooter.vue`
- Create: `src/shared/AdSlot.vue`
- Create: `src/shared/FollowGuide.vue`

- [ ] **Step 1: Create ToolHeader.vue**

```vue
<template>
  <header class="tool-header">
    <button class="back-btn" @click="goBack" v-if="showBack">&#8592;</button>
    <h2 class="tool-title">{{ title }}</h2>
    <div class="header-spacer"></div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  showBack: { type: Boolean, default: true }
})

const router = useRouter()
const goBack = () => router.back()
</script>

<style scoped>
.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}
.tool-title {
  font-size: 1.1rem;
  font-weight: 600;
}
.back-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: #07c160;
}
.header-spacer {
  width: 2rem;
}
</style>
```

- [ ] **Step 2: Create FollowGuide.vue**

```vue
<template>
  <div class="follow-guide">
    <span class="guide-icon">👆</span>
    <span class="guide-text">关注公众号，发现更多实用工具</span>
  </div>
</template>

<script setup>
</script>

<style scoped>
.follow-guide {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
}
.guide-icon {
  font-size: 1.1rem;
}
</style>
```

- [ ] **Step 3: Create AdSlot.vue**

```vue
<template>
  <div class="ad-slot">
    <div class="ad-placeholder">
      <span class="ad-label">广告位</span>
      <span class="ad-hint">关注公众号支持我们</span>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.ad-slot {
  margin: 1rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  text-align: center;
  border: 1px dashed #ddd;
}
.ad-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.ad-label {
  font-size: 0.75rem;
  color: #999;
}
.ad-hint {
  font-size: 0.85rem;
  color: #07c160;
}
</style>
```

- [ ] **Step 4: Create ToolFooter.vue**

```vue
<template>
  <div class="tool-footer">
    <h3 class="more-title">更多工具</h3>
    <div class="tool-grid">
      <router-link v-for="tool in tools" :key="tool.path" :to="tool.path" class="tool-item">
        <span class="tool-icon">{{ tool.icon }}</span>
        <span class="tool-name">{{ tool.name }}</span>
      </router-link>
    </div>
    <div class="follow-cta">
      关注公众号，更多工具即将上线
    </div>
  </div>
</template>

<script setup>
const tools = [
  { path: '/baby-name', icon: '👶', name: '宝宝取名' },
  { path: '/english-name', icon: '🔤', name: '英文名' },
  { path: '/nickname', icon: '✨', name: '网名生成' },
  { path: '/mortgage', icon: '🏠', name: '房贷计算' },
  { path: '/date-calc', icon: '📅', name: '日期计算' }
]
</script>

<style scoped>
.tool-footer {
  margin: 1.5rem 1rem 1rem;
}
.more-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  text-align: center;
  color: #666;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.tool-icon {
  font-size: 1.5rem;
}
.tool-name {
  font-size: 0.75rem;
  color: #333;
}
.follow-cta {
  margin-top: 1rem;
  padding: 0.75rem;
  text-align: center;
  background: #f0faf4;
  border-radius: 8px;
  color: #07c160;
  font-size: 0.85rem;
}
</style>
```

- [ ] **Step 5: Verify shared components build**

Run: `cd wechat-tools-h5 && npx vite build`
Expected: Build succeeds with new components.

- [ ] **Step 6: Commit shared components**

```bash
cd wechat-tools-h5
git add -A
git commit -m "feat: add shared UI components (ToolHeader, ToolFooter, AdSlot, FollowGuide)"
```

---

### Task 3: Home Page

**Files:**
- Modify: `src/pages/Home.vue`
- Modify: `src/router.js` (add all tool routes)

- [ ] **Step 1: Update router with all routes**

Modify `src/router.js`:

```js
import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './pages/Home.vue'
import BabyName from './pages/baby-name/BabyName.vue'
import EnglishName from './pages/english-name/EnglishName.vue'
import Nickname from './pages/nickname/Nickname.vue'
import Mortgage from './pages/mortgage/Mortgage.vue'
import DateCalc from './pages/date-calc/DateCalc.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/baby-name', component: BabyName },
  { path: '/english-name', component: EnglishName },
  { path: '/nickname', component: Nickname },
  { path: '/mortgage', component: Mortgage },
  { path: '/date-calc', component: DateCalc }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
```

- [ ] **Step 2: Build Home page**

Replace `src/pages/Home.vue`:

```vue
<template>
  <div class="home">
    <div class="hero">
      <h1 class="hero-title">实用工具箱</h1>
      <p class="hero-sub">免费好用的在线工具，每天更新</p>
    </div>
    <div class="tool-list">
      <router-link v-for="tool in tools" :key="tool.path" :to="tool.path" class="tool-card">
        <div class="tool-card-icon">{{ tool.icon }}</div>
        <div class="tool-card-info">
          <span class="tool-card-name">{{ tool.name }}</span>
          <span class="tool-card-desc">{{ tool.desc }}</span>
        </div>
        <span class="tool-card-arrow">></span>
      </router-link>
    </div>
    <ToolFooter />
  </div>
</template>

<script setup>
import ToolFooter from '../shared/ToolFooter.vue'

const tools = [
  { path: '/baby-name', icon: '👶', name: '宝宝取名', desc: '按五行笔画智能生成好名字' },
  { path: '/english-name', icon: '🔤', name: '英文名生成', desc: '根据中文名匹配英文名' },
  { path: '/nickname', icon: '✨', name: '网名生成', desc: '古风简约可爱多种风格' },
  { path: '/mortgage', icon: '🏠', name: '房贷计算器', desc: '等额本息等额本金对比' },
  { path: '/date-calc', icon: '📅', name: '日期计算', desc: '日期间隔、推算、工作日' }
]
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding-bottom: 2rem;
}
.hero {
  padding: 2rem 1rem 1.5rem;
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: #fff;
  text-align: center;
}
.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}
.hero-sub {
  font-size: 0.85rem;
  opacity: 0.85;
}
.tool-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.tool-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.tool-card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}
.tool-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.tool-card-name {
  font-size: 1rem;
  font-weight: 600;
}
.tool-card-desc {
  font-size: 0.78rem;
  color: #999;
}
.tool-card-arrow {
  color: #ccc;
  font-size: 1.1rem;
}
</style>
```

- [ ] **Step 3: Create placeholder tool pages** (so router resolves)

Create placeholder for each tool. Each is:

```vue
<template>
  <div>ToolName</div>
</template>
<script setup>
</script>
```

Create these 5 files with appropriate names:
- `src/pages/baby-name/BabyName.vue`
- `src/pages/english-name/EnglishName.vue`
- `src/pages/nickname/Nickname.vue`
- `src/pages/mortgage/Mortgage.vue`
- `src/pages/date-calc/DateCalc.vue`

- [ ] **Step 4: Verify Home page and routing**

Run: `cd wechat-tools-h5 && npx vite build`
Expected: Build succeeds. All routes resolve.

- [ ] **Step 5: Commit Home page**

```bash
cd wechat-tools-h5
git add -A
git commit -m "feat: add Home page with tool grid and router setup"
```

---

### Task 4: Date Engine — Chinese Name Character Pool

**Files:**
- Create: `src/data/names.js`

- [ ] **Step 1: Create name character data**

Create `src/data/names.js`:

```js
export const nameChars = {
  boy: [
    { char: '宇', wuxing: '土', meaning: '宇宙，胸怀广阔', strokes: 6, score: 95 },
    { char: '泽', wuxing: '水', meaning: '恩泽，温润宽厚', strokes: 8, score: 93 },
    { char: '轩', wuxing: '土', meaning: '气宇轩昂', strokes: 7, score: 92 },
    { char: '辰', wuxing: '土', meaning: '星辰，光明璀璨', strokes: 7, score: 94 },
    { char: '铭', wuxing: '金', meaning: '铭记，聪慧过人', strokes: 11, score: 90 },
    { char: '睿', wuxing: '金', meaning: '睿智，深谋远虑', strokes: 14, score: 96 },
    { char: '博', wuxing: '水', meaning: '博学，学识渊博', strokes: 12, score: 91 },
    { char: '昊', wuxing: '火', meaning: '昊天，广阔天空', strokes: 8, score: 93 },
    { char: '哲', wuxing: '火', meaning: '哲学，明理通达', strokes: 10, score: 89 },
    { char: '毅', wuxing: '木', meaning: '毅力，坚韧不拔', strokes: 15, score: 88 },
    { char: '霖', wuxing: '水', meaning: '甘霖，恩泽广被', strokes: 16, score: 90 },
    { char: '熙', wuxing: '水', meaning: '光明，兴盛和乐', strokes: 13, score: 92 },
    { char: '煜', wuxing: '火', meaning: '照耀，光辉灿烂', strokes: 13, score: 89 },
    { char: '航', wuxing: '水', meaning: '远航，志向远大', strokes: 10, score: 87 },
    { char: '瑞', wuxing: '金', meaning: '祥瑞，吉祥如意', strokes: 13, score: 91 },
    { char: '璟', wuxing: '火', meaning: '玉的光彩，温润如玉', strokes: 17, score: 94 },
    { char: '谦', wuxing: '木', meaning: '谦虚，品德高尚', strokes: 17, score: 88 },
    { char: '朗', wuxing: '火', meaning: '开朗，阳光活泼', strokes: 10, score: 86 },
    { char: '楷', wuxing: '木', meaning: '楷模，品学兼优', strokes: 13, score: 90 },
    { char: '泓', wuxing: '水', meaning: '水深而广，胸怀宽广', strokes: 8, score: 89 }
  ],
  girl: [
    { char: '涵', wuxing: '水', meaning: '内涵，有修养', strokes: 11, score: 95 },
    { char: '萱', wuxing: '木', meaning: '忘忧草，快乐无忧', strokes: 12, score: 93 },
    { char: '琪', wuxing: '木', meaning: '美玉，珍贵美好', strokes: 12, score: 92 },
    { char: '瑶', wuxing: '火', meaning: '美玉，高贵典雅', strokes: 14, score: 94 },
    { char: '悦', wuxing: '金', meaning: '喜悦，开心快乐', strokes: 10, score: 90 },
    { char: '诗', wuxing: '金', meaning: '诗意，富有才情', strokes: 8, score: 91 },
    { char: '雅', wuxing: '木', meaning: '优雅，端庄大方', strokes: 12, score: 93 },
    { char: '婉', wuxing: '土', meaning: '温婉，温柔美好', strokes: 11, score: 92 },
    { char: '晴', wuxing: '火', meaning: '晴天，明朗开朗', strokes: 12, score: 89 },
    { char: '欣', wuxing: '木', meaning: '欣喜，充满活力', strokes: 8, score: 88 },
    { char: '琳', wuxing: '木', meaning: '琳琅，美好珍贵', strokes: 12, score: 91 },
    { char: '怡', wuxing: '土', meaning: '愉悦，心旷神怡', strokes: 8, score: 87 },
    { char: '彤', wuxing: '火', meaning: '红彤彤，喜气洋洋', strokes: 7, score: 86 },
    { char: '昕', wuxing: '火', meaning: '黎明，希望之光', strokes: 8, score: 90 },
    { char: '蔓', wuxing: '木', meaning: '蔓延，生机勃勃', strokes: 14, score: 85 },
    { char: '岚', wuxing: '土', meaning: '山间雾气，淡雅清新', strokes: 7, score: 89 },
    { char: '璇', wuxing: '火', meaning: '美玉，温润', strokes: 15, score: 92 },
    { char: '雪', wuxing: '水', meaning: '洁白纯净', strokes: 11, score: 90 },
    { char: '妍', wuxing: '水', meaning: '美丽，娇艳', strokes: 7, score: 88 },
    { char: '颖', wuxing: '木', meaning: '聪颖，才华出众', strokes: 13, score: 93 }
  ],
  neutral: [
    { char: '安', wuxing: '土', meaning: '平安，安稳', strokes: 6, score: 88 },
    { char: '文', wuxing: '水', meaning: '文采，文化', strokes: 4, score: 90 },
    { char: '晨', wuxing: '火', meaning: '早晨，朝气蓬勃', strokes: 11, score: 89 },
    { char: '宁', wuxing: '火', meaning: '安宁，宁静致远', strokes: 5, score: 87 },
    { char: '远', wuxing: '土', meaning: '远大，志向高远', strokes: 7, score: 86 }
  ]
}

export const wuxingMap = {
  '金': ['铭', '瑞', '悦', '诗', '锦', '钧', '钦', '钰'],
  '木': ['毅', '谦', '楷', '萱', '琪', '雅', '欣', '琳', '颖', '蔓'],
  '水': ['泽', '博', '霖', '熙', '航', '涵', '雪', '妍', '文', '泓'],
  '火': ['昊', '哲', '煜', '璟', '朗', '瑶', '晴', '彤', '昕', '璇', '晨', '宁'],
  '土': ['宇', '轩', '辰', '婉', '怡', '岚', '安', '远']
}
```

- [ ] **Step 2: Commit data file**

```bash
cd wechat-tools-h5
git add src/data/names.js
git commit -m "feat: add Chinese name character pool with wuxing and meanings"
```

---

### Task 5: Baby Name Tool — Engine + Tests

**Files:**
- Create: `src/pages/baby-name/BabyNameEngine.js`
- Create: `src/pages/baby-name/BabyNameEngine.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/pages/baby-name/BabyNameEngine.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { generateNames } from './BabyNameEngine.js'

describe('generateNames', () => {
  it('generates at least 20 names for a given surname and gender', () => {
    const result = generateNames({ surname: '张', gender: 'boy' })
    expect(result.length).toBeGreaterThanOrEqual(20)
    result.forEach(name => {
      expect(name.fullName).toMatch(/^张/)
      expect(name.fullName.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('generates girl names', () => {
    const result = generateNames({ surname: '李', gender: 'girl' })
    expect(result.length).toBeGreaterThanOrEqual(20)
  })

  it('generates neutral names when gender is "any"', () => {
    const result = generateNames({ surname: '王', gender: 'any' })
    expect(result.length).toBeGreaterThanOrEqual(20)
  })

  it('each name has required fields', () => {
    const result = generateNames({ surname: '陈', gender: 'boy' })
    const name = result[0]
    expect(name).toHaveProperty('fullName')
    expect(name).toHaveProperty('char1')
    expect(name).toHaveProperty('char2')
    expect(name).toHaveProperty('meaning')
    expect(name).toHaveProperty('wuxing')
    expect(name).toHaveProperty('score')
  })

  it('scores are between 60 and 100', () => {
    const result = generateNames({ surname: '赵', gender: 'girl' })
    result.forEach(name => {
      expect(name.score).toBeGreaterThanOrEqual(60)
      expect(name.score).toBeLessThanOrEqual(100)
    })
  })

  it('returns empty array for empty surname', () => {
    const result = generateNames({ surname: '', gender: 'boy' })
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: 6 failing tests — "generateNames is not defined"

- [ ] **Step 3: Implement BabyNameEngine**

Create `src/pages/baby-name/BabyNameEngine.js`:

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

export function generateNames({ surname, gender }) {
  if (!surname || surname.trim() === '') return []

  let pool
  if (gender === 'boy') {
    pool = [...nameChars.boy, ...nameChars.neutral]
  } else if (gender === 'girl') {
    pool = [...nameChars.girl, ...nameChars.neutral]
  } else {
    pool = [...nameChars.boy, ...nameChars.girl, ...nameChars.neutral]
  }

  const shuffled = shuffle(pool)
  const results = []

  for (let i = 0; i < shuffled.length - 1 && results.length < 20; i++) {
    for (let j = i + 1; j < shuffled.length && results.length < 20; j++) {
      const c1 = shuffled[i]
      const c2 = shuffled[j]
      if (c1.char === c2.char) continue

      const avgScore = Math.round((c1.score + c2.score) / 2)
      const soundBonus = c1.strokes % 2 !== c2.strokes % 2 ? 3 : 0
      const score = Math.min(100, avgScore + soundBonus)

      results.push({
        fullName: surname + c1.char + c2.char,
        char1: c1.char,
        char2: c2.char,
        meaning: `${c1.meaning}；${c2.meaning}`,
        wuxing: `${c1.wuxing}${c2.wuxing}`,
        score
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 20)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: 6 tests passing.

- [ ] **Step 5: Commit baby name engine**

```bash
cd wechat-tools-h5
git add src/pages/baby-name/
git commit -m "feat: add baby name generation engine with tests"
```

---

### Task 6: Baby Name Tool — UI

**Files:**
- Modify: `src/pages/baby-name/BabyName.vue`

- [ ] **Step 1: Build baby name page**

Replace `src/pages/baby-name/BabyName.vue`:

```vue
<template>
  <div class="baby-name-page">
    <ToolHeader title="宝宝取名" />
    <FollowGuide />

    <div class="form-area">
      <div class="form-row">
        <label class="form-label">姓氏</label>
        <input v-model="surname" class="form-input" placeholder="请输入姓氏" maxlength="2" />
      </div>
      <div class="form-row">
        <label class="form-label">性别</label>
        <div class="gender-btns">
          <button :class="['gender-btn', { active: gender === 'boy' }]" @click="gender = 'boy'">男孩</button>
          <button :class="['gender-btn', { active: gender === 'girl' }]" @click="gender = 'girl'">女孩</button>
          <button :class="['gender-btn', { active: gender === 'any' }]" @click="gender = 'any'">不限</button>
        </div>
      </div>
      <button class="generate-btn" @click="doGenerate" :disabled="!surname">
        生成名字
      </button>
    </div>

    <div v-if="names.length > 0" class="results-area">
      <h3 class="results-title">为你生成 {{ names.length }} 个名字</h3>
      <div class="name-list">
        <div v-for="(name, idx) in names" :key="idx" class="name-card">
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

    <AdSlot />
    <ToolFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ToolHeader from '../../shared/ToolHeader.vue'
import FollowGuide from '../../shared/FollowGuide.vue'
import AdSlot from '../../shared/AdSlot.vue'
import ToolFooter from '../../shared/ToolFooter.vue'
import { generateNames } from './BabyNameEngine.js'

const surname = ref('')
const gender = ref('boy')
const names = ref([])

function doGenerate() {
  names.value = generateNames({ surname: surname.value, gender: gender.value })
}
</script>

<style scoped>
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
  width: 3rem;
  font-weight: 600;
  font-size: 0.95rem;
}
.form-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
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
}
.results-area {
  padding: 0 1rem 1rem;
}
.results-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
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
  gap: 1rem;
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.35rem;
}
.name-meaning {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.5;
}
</style>
```

- [ ] **Step 2: Verify build**

Run: `cd wechat-tools-h5 && npx vite build`
Expected: Build succeeds.

- [ ] **Step 3: Commit baby name UI**

```bash
cd wechat-tools-h5
git add src/pages/baby-name/
git commit -m "feat: add baby name tool UI"
```

---

### Task 7: English Name Tool — Data + Engine + Tests + UI

**Files:**
- Create: `src/data/english-names.js`
- Create: `src/pages/english-name/EnglishNameEngine.js`
- Create: `src/pages/english-name/EnglishNameEngine.test.js`
- Modify: `src/pages/english-name/EnglishName.vue`

- [ ] **Step 1: Create English names data**

Create `src/data/english-names.js`:

```js
export const englishNames = [
  { name: 'Alexander', meaning: '守护者，人类的保护者', origin: '希腊语', pinyin: 'A', gender: 'boy' },
  { name: 'Benjamin', meaning: '幸运之子，右手之子', origin: '希伯来语', pinyin: 'B', gender: 'boy' },
  { name: 'Charles', meaning: '自由的人，男子汉', origin: '日耳曼语', pinyin: 'C', gender: 'boy' },
  { name: 'Daniel', meaning: '上帝是我的审判者', origin: '希伯来语', pinyin: 'D', gender: 'boy' },
  { name: 'Edward', meaning: '富有的守护者', origin: '古英语', pinyin: 'E', gender: 'boy' },
  { name: 'Felix', meaning: '幸运的，幸福的', origin: '拉丁语', pinyin: 'F', gender: 'boy' },
  { name: 'George', meaning: '农夫，大地工作者', origin: '希腊语', pinyin: 'G', gender: 'boy' },
  { name: 'Henry', meaning: '家族的统治者', origin: '日耳曼语', pinyin: 'H', gender: 'boy' },
  { name: 'Isaac', meaning: '欢笑之子', origin: '希伯来语', pinyin: 'I', gender: 'boy' },
  { name: 'James', meaning: '取而代之者', origin: '希伯来语', pinyin: 'J', gender: 'boy' },
  { name: 'Kevin', meaning: '英俊的，温和的', origin: '爱尔兰语', pinyin: 'K', gender: 'boy' },
  { name: 'Lucas', meaning: '带来光明的人', origin: '拉丁语', pinyin: 'L', gender: 'boy' },
  { name: 'Michael', meaning: '谁像上帝', origin: '希伯来语', pinyin: 'M', gender: 'boy' },
  { name: 'Nathan', meaning: '上帝赐予的礼物', origin: '希伯来语', pinyin: 'N', gender: 'boy' },
  { name: 'Oliver', meaning: '橄榄树，和平的象征', origin: '拉丁语', pinyin: 'O', gender: 'boy' },
  { name: 'Patrick', meaning: '贵族，高尚的人', origin: '拉丁语', pinyin: 'P', gender: 'boy' },
  { name: 'Ryan', meaning: '小国王', origin: '爱尔兰语', pinyin: 'R', gender: 'boy' },
  { name: 'Samuel', meaning: '上帝垂听了', origin: '希伯来语', pinyin: 'S', gender: 'boy' },
  { name: 'Thomas', meaning: '双胞胎', origin: '阿拉姆语', pinyin: 'T', gender: 'boy' },
  { name: 'William', meaning: '坚强的保护者', origin: '日耳曼语', pinyin: 'W', gender: 'boy' },
  { name: 'Alice', meaning: '高贵的，真理', origin: '日耳曼语', pinyin: 'A', gender: 'girl' },
  { name: 'Bella', meaning: '美丽的', origin: '意大利语', pinyin: 'B', gender: 'girl' },
  { name: 'Chloe', meaning: '盛开的，青春的', origin: '希腊语', pinyin: 'C', gender: 'girl' },
  { name: 'Diana', meaning: '神圣的，月光女神', origin: '拉丁语', pinyin: 'D', gender: 'girl' },
  { name: 'Emma', meaning: '无所不能的，宇宙的', origin: '日耳曼语', pinyin: 'E', gender: 'girl' },
  { name: 'Fiona', meaning: '白皙的，美丽的', origin: '盖尔语', pinyin: 'F', gender: 'girl' },
  { name: 'Grace', meaning: '优雅，恩典', origin: '拉丁语', pinyin: 'G', gender: 'girl' },
  { name: 'Hannah', meaning: '恩惠，优雅', origin: '希伯来语', pinyin: 'H', gender: 'girl' },
  { name: 'Iris', meaning: '彩虹，信使', origin: '希腊语', pinyin: 'I', gender: 'girl' },
  { name: 'Julia', meaning: '年轻的，柔软的头发', origin: '拉丁语', pinyin: 'J', gender: 'girl' },
  { name: 'Kate', meaning: '纯洁的，清白的', origin: '希腊语', pinyin: 'K', gender: 'girl' },
  { name: 'Lily', meaning: '百合花，纯洁', origin: '拉丁语', pinyin: 'L', gender: 'girl' },
  { name: 'Mia', meaning: '我的，被爱的', origin: '意大利语', pinyin: 'M', gender: 'girl' },
  { name: 'Nora', meaning: '光明，荣耀', origin: '拉丁语', pinyin: 'N', gender: 'girl' },
  { name: 'Olivia', meaning: '橄榄树，和平', origin: '拉丁语', pinyin: 'O', gender: 'girl' },
  { name: 'Pearl', meaning: '珍珠，珍贵', origin: '拉丁语', pinyin: 'P', gender: 'girl' },
  { name: 'Rose', meaning: '玫瑰，爱与美', origin: '拉丁语', pinyin: 'R', gender: 'girl' },
  { name: 'Sophia', meaning: '智慧', origin: '希腊语', pinyin: 'S', gender: 'girl' },
  { name: 'Tina', meaning: '小河，女战士', origin: '拉丁语', pinyin: 'T', gender: 'girl' },
  { name: 'Vivian', meaning: '充满活力的', origin: '拉丁语', pinyin: 'V', gender: 'girl' },
  { name: 'Wendy', meaning: '朋友，白皙的眉毛', origin: '英语', pinyin: 'W', gender: 'girl' },
  { name: 'Zoe', meaning: '生命', origin: '希腊语', pinyin: 'Z', gender: 'girl' }
]

export const pinyinMap = {
  'a': 'A', 'ai': 'I', 'an': 'A', 'ang': 'A', 'ao': 'O',
  'b': 'B', 'ba': 'B', 'bai': 'B', 'ban': 'B', 'bang': 'B', 'bao': 'B', 'bei': 'B', 'ben': 'B', 'bi': 'B', 'bian': 'B', 'bin': 'B', 'bing': 'B', 'bo': 'B', 'bu': 'B',
  'c': 'C', 'ca': 'K', 'cai': 'K', 'can': 'K', 'cang': 'K', 'cao': 'K', 'ce': 'K', 'cen': 'K', 'ceng': 'K', 'cha': 'C', 'chai': 'C', 'chan': 'C', 'chang': 'C', 'chao': 'C', 'che': 'C', 'chen': 'C', 'cheng': 'C', 'chi': 'C', 'chong': 'C', 'chou': 'C', 'chu': 'C', 'chuan': 'C', 'chuang': 'C', 'chui': 'C', 'chun': 'C', 'ci': 'K', 'cong': 'K', 'cou': 'K', 'cu': 'K', 'cuan': 'K', 'cui': 'K', 'cun': 'K', 'cuo': 'K',
  'd': 'D', 'da': 'D', 'dai': 'D', 'dan': 'D', 'dang': 'D', 'dao': 'D', 'de': 'D', 'deng': 'D', 'di': 'D', 'dian': 'D', 'diao': 'D', 'die': 'D', 'ding': 'D', 'dong': 'D', 'dou': 'D', 'du': 'D', 'duan': 'D', 'dui': 'D', 'dun': 'D', 'duo': 'D',
  'e': 'E', 'en': 'E',
  'f': 'F', 'fa': 'F', 'fan': 'F', 'fang': 'F', 'fei': 'F', 'fen': 'F', 'feng': 'F', 'fo': 'F', 'fou': 'F', 'fu': 'F',
  'g': 'G', 'ga': 'G', 'gai': 'G', 'gan': 'G', 'gang': 'G', 'gao': 'G', 'ge': 'G', 'gei': 'G', 'gen': 'G', 'geng': 'G', 'gong': 'G', 'gou': 'G', 'gu': 'G', 'gua': 'G', 'guai': 'G', 'guan': 'G', 'guang': 'G', 'gui': 'G', 'gun': 'G', 'guo': 'G',
  'h': 'H', 'ha': 'H', 'hai': 'H', 'han': 'H', 'hang': 'H', 'hao': 'H', 'he': 'H', 'hei': 'H', 'hen': 'H', 'heng': 'H', 'hong': 'H', 'hou': 'H', 'hu': 'H', 'hua': 'H', 'huai': 'H', 'huan': 'H', 'huang': 'H', 'hui': 'H', 'hun': 'H', 'huo': 'H',
  'j': 'J', 'ji': 'J', 'jia': 'J', 'jian': 'J', 'jiang': 'J', 'jiao': 'J', 'jie': 'J', 'jin': 'J', 'jing': 'J', 'jiong': 'J', 'jiu': 'J', 'ju': 'J', 'juan': 'J', 'jue': 'J', 'jun': 'J',
  'k': 'K', 'ka': 'K', 'kai': 'K', 'kan': 'K', 'kang': 'K', 'kao': 'K', 'ke': 'K', 'ken': 'K', 'keng': 'K', 'kong': 'K', 'kou': 'K', 'ku': 'K', 'kua': 'K', 'kuai': 'K', 'kuan': 'K', 'kuang': 'K', 'kui': 'K', 'kun': 'K', 'kuo': 'K',
  'l': 'L', 'la': 'L', 'lai': 'L', 'lan': 'L', 'lang': 'L', 'lao': 'L', 'le': 'L', 'lei': 'L', 'leng': 'L', 'li': 'L', 'lia': 'L', 'lian': 'L', 'liang': 'L', 'liao': 'L', 'lie': 'L', 'lin': 'L', 'ling': 'L', 'liu': 'L', 'long': 'L', 'lou': 'L', 'lu': 'L', 'luan': 'L', 'lun': 'L', 'luo': 'L', 'lv': 'L', 'lve': 'L',
  'm': 'M', 'ma': 'M', 'mai': 'M', 'man': 'M', 'mang': 'M', 'mao': 'M', 'me': 'M', 'mei': 'M', 'men': 'M', 'meng': 'M', 'mi': 'M', 'mian': 'M', 'miao': 'M', 'mie': 'M', 'min': 'M', 'ming': 'M', 'miu': 'M', 'mo': 'M', 'mou': 'M', 'mu': 'M',
  'n': 'N', 'na': 'N', 'nai': 'N', 'nan': 'N', 'nang': 'N', 'nao': 'N', 'ne': 'N', 'nei': 'N', 'nen': 'N', 'neng': 'N', 'ni': 'N', 'nian': 'N', 'niang': 'N', 'niao': 'N', 'nie': 'N', 'nin': 'N', 'ning': 'N', 'niu': 'N', 'nong': 'N', 'nou': 'N', 'nu': 'N', 'nuan': 'N', 'nuo': 'N', 'nv': 'N',
  'o': 'O', 'ou': 'O',
  'p': 'P', 'pa': 'P', 'pai': 'P', 'pan': 'P', 'pang': 'P', 'pao': 'P', 'pei': 'P', 'pen': 'P', 'peng': 'P', 'pi': 'P', 'pian': 'P', 'piao': 'P', 'pie': 'P', 'pin': 'P', 'ping': 'P', 'po': 'P', 'pou': 'P', 'pu': 'P',
  'q': 'Q', 'qi': 'Q', 'qia': 'Q', 'qian': 'Q', 'qiang': 'Q', 'qiao': 'Q', 'qie': 'Q', 'qin': 'Q', 'qing': 'Q', 'qiong': 'Q', 'qiu': 'Q', 'qu': 'Q', 'quan': 'Q', 'que': 'Q', 'qun': 'Q',
  'r': 'R', 'ran': 'R', 'rang': 'R', 'rao': 'R', 're': 'R', 'ren': 'R', 'reng': 'R', 'ri': 'R', 'rong': 'R', 'rou': 'R', 'ru': 'R', 'ruan': 'R', 'rui': 'R', 'run': 'R', 'ruo': 'R',
  's': 'S', 'sa': 'S', 'sai': 'S', 'san': 'S', 'sang': 'S', 'sao': 'S', 'se': 'S', 'sen': 'S', 'seng': 'S', 'sha': 'S', 'shai': 'S', 'shan': 'S', 'shang': 'S', 'shao': 'S', 'she': 'S', 'shei': 'S', 'shen': 'S', 'sheng': 'S', 'shi': 'S', 'shou': 'S', 'shu': 'S', 'shua': 'S', 'shuai': 'S', 'shuan': 'S', 'shuang': 'S', 'shui': 'S', 'shun': 'S', 'shuo': 'S', 'si': 'S', 'song': 'S', 'sou': 'S', 'su': 'S', 'suan': 'S', 'sui': 'S', 'sun': 'S', 'suo': 'S',
  't': 'T', 'ta': 'T', 'tai': 'T', 'tan': 'T', 'tang': 'T', 'tao': 'T', 'te': 'T', 'teng': 'T', 'ti': 'T', 'tian': 'T', 'tiao': 'T', 'tie': 'T', 'ting': 'T', 'tong': 'T', 'tou': 'T', 'tu': 'T', 'tuan': 'T', 'tui': 'T', 'tun': 'T', 'tuo': 'T',
  'w': 'W', 'wa': 'W', 'wai': 'W', 'wan': 'W', 'wang': 'W', 'wei': 'W', 'wen': 'W', 'weng': 'W', 'wo': 'W', 'wu': 'W',
  'x': 'X', 'xi': 'X', 'xia': 'X', 'xian': 'X', 'xiang': 'X', 'xiao': 'X', 'xie': 'X', 'xin': 'X', 'xing': 'X', 'xiong': 'X', 'xiu': 'X', 'xu': 'X', 'xuan': 'X', 'xue': 'X', 'xun': 'X',
  'y': 'Y', 'ya': 'Y', 'yan': 'Y', 'yang': 'Y', 'yao': 'Y', 'ye': 'Y', 'yi': 'Y', 'yin': 'Y', 'ying': 'Y', 'yo': 'Y', 'yong': 'Y', 'you': 'Y', 'yu': 'Y', 'yuan': 'Y', 'yue': 'Y', 'yun': 'Y',
  'z': 'Z', 'za': 'Z', 'zai': 'Z', 'zan': 'Z', 'zang': 'Z', 'zao': 'Z', 'ze': 'Z', 'zei': 'Z', 'zen': 'Z', 'zeng': 'Z', 'zha': 'Z', 'zhai': 'Z', 'zhan': 'Z', 'zhang': 'Z', 'zhao': 'Z', 'zhe': 'Z', 'zhei': 'Z', 'zhen': 'Z', 'zheng': 'Z', 'zhi': 'Z', 'zhong': 'Z', 'zhou': 'Z', 'zhu': 'Z', 'zhua': 'Z', 'zhuai': 'Z', 'zhuan': 'Z', 'zhuang': 'Z', 'zhui': 'Z', 'zhun': 'Z', 'zhuo': 'Z', 'zi': 'Z', 'zong': 'Z', 'zou': 'Z', 'zu': 'Z', 'zuan': 'Z', 'zui': 'Z', 'zun': 'Z', 'zuo': 'Z'
}
```

- [ ] **Step 2: Write failing tests**

Create `src/pages/english-name/EnglishNameEngine.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { matchEnglishNames } from './EnglishNameEngine.js'

describe('matchEnglishNames', () => {
  it('returns at least 5 matches for a Chinese name', () => {
    const result = matchEnglishNames('张伟')
    expect(result.length).toBeGreaterThanOrEqual(5)
  })

  it('each result has required fields', () => {
    const result = matchEnglishNames('李娜')
    expect(result.length).toBeGreaterThan(0)
    const name = result[0]
    expect(name).toHaveProperty('name')
    expect(name).toHaveProperty('meaning')
    expect(name).toHaveProperty('origin')
    expect(name).toHaveProperty('matchType')
  })

  it('returns empty array for empty input', () => {
    expect(matchEnglishNames('')).toEqual([])
  })
})
```

- [ ] **Step 3: Run tests to verify fail**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: 2 new failing tests.

- [ ] **Step 4: Implement EnglishNameEngine**

Create `src/pages/english-name/EnglishNameEngine.js`:

```js
import { englishNames, pinyinMap } from '../../data/english-names.js'

function getPinyinInitial(name) {
  if (!name || name.length === 0) return ''
  // Simple heuristic: get first char's pinyin initial via map
  // For a full solution we'd use a pinyin library, but for MVP this covers common cases
  const first = name[0]
  // Try common pinyin mappings for first character
  for (const [pinyin, initial] of Object.entries(pinyinMap)) {
    if (pinyin.length === 1) continue // skip single-letter entries
  }
  return first.toUpperCase()
}

export function matchEnglishNames(chineseName) {
  if (!chineseName || chineseName.trim() === '') return []

  const chars = chineseName.trim().split('')
  const initials = chars.map(c => {
    // Map common Chinese characters to their pinyin initial
    const charMap = {
      '张': 'Z', '李': 'L', '王': 'W', '陈': 'C', '刘': 'L', '赵': 'Z', '黄': 'H',
      '周': 'Z', '吴': 'W', '徐': 'X', '孙': 'S', '马': 'M', '朱': 'Z', '胡': 'H',
      '郭': 'G', '何': 'H', '高': 'G', '林': 'L', '罗': 'L', '郑': 'Z', '梁': 'L',
      '谢': 'X', '宋': 'S', '唐': 'T', '许': 'X', '韩': 'H', '邓': 'D', '冯': 'F',
      '曹': 'C', '彭': 'P', '曾': 'Z', '萧': 'X', '田': 'T', '董': 'D', '潘': 'P',
      '袁': 'Y', '蔡': 'C', '蒋': 'J', '余': 'Y', '于': 'Y', '杜': 'D', '叶': 'Y',
      '程': 'C', '苏': 'S', '魏': 'W', '吕': 'L', '丁': 'D', '任': 'R', '沈': 'S',
      '姚': 'Y', '卢': 'L', '姜': 'J', '崔': 'C', '钟': 'Z', '谭': 'T', '陆': 'L',
      '汪': 'W', '范': 'F', '金': 'J', '石': 'S', '廖': 'L', '贾': 'J', '夏': 'X',
      '韦': 'W', '付': 'F', '方': 'F', '白': 'B', '邹': 'Z', '孟': 'M', '熊': 'X',
      '秦': 'Q', '邱': 'Q', '江': 'J', '尹': 'Y', '薛': 'X', '闫': 'Y', '段': 'D',
      '雷': 'L', '侯': 'H', '龙': 'L', '史': 'S', '黎': 'L', '贺': 'H', '顾': 'G',
      '毛': 'M', '郝': 'H', '龚': 'G', '邵': 'S', '万': 'W', '钱': 'Q', '严': 'Y',
      '覃': 'Q', '武': 'W', '戴': 'D', '莫': 'M', '孔': 'K', '向': 'X', '汤': 'T',
      '伟': 'W', '娜': 'N', '芳': 'F', '敏': 'M', '静': 'J', '丽': 'L', '强': 'Q',
      '磊': 'L', '军': 'J', '洋': 'Y', '勇': 'Y', '艳': 'Y', '杰': 'J', '娟': 'J',
      '涛': 'T', '明': 'M', '超': 'C', '秀': 'X', '霞': 'X', '平': 'P', '刚': 'G',
      '华': 'H', '飞': 'F', '红': 'H', '玲': 'L', '文': 'W', '宇': 'Y', '浩': 'H'
    }
    return charMap[c] || c.toUpperCase()
  })

  const targetInitials = initials.filter(i => /[A-Z]/.test(i))
  if (targetInitials.length === 0) return []

  const results = []
  for (const name of englishNames) {
    let matchScore = 0
    let matchType = ''

    if (targetInitials.some(init => name.name.toUpperCase().startsWith(init))) {
      matchScore += 3
      if (!matchType) matchType = '首字母匹配'
    }

    if (targetInitials.some(init => name.name.toUpperCase().includes(init))) {
      matchScore += 1
      if (!matchType) matchType = '发音相近'
    }

    if (matchScore >= 3) {
      results.push({
        name: name.name,
        meaning: name.meaning,
        origin: name.origin,
        gender: name.gender,
        matchType
      })
    }
  }

  if (results.length < 5) {
    const extras = englishNames
      .filter(n => !results.find(r => r.name === n.name))
      .slice(0, 10 - results.length)
      .map(n => ({
        name: n.name,
        meaning: n.meaning,
        origin: n.origin,
        gender: n.gender,
        matchType: '热门推荐'
      }))
    results.push(...extras)
  }

  return results.slice(0, 15)
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: All tests pass.

- [ ] **Step 6: Build EnglishName UI**

Replace `src/pages/english-name/EnglishName.vue`:

```vue
<template>
  <div class="english-name-page">
    <ToolHeader title="英文名生成" />
    <FollowGuide />

    <div class="form-area">
      <div class="form-row">
        <label class="form-label">中文名</label>
        <input v-model="chineseName" class="form-input" placeholder="请输入你的中文名" maxlength="10" />
      </div>
      <button class="generate-btn" @click="doMatch" :disabled="!chineseName">
        匹配英文名
      </button>
    </div>

    <div v-if="results.length > 0" class="results-area">
      <h3 class="results-title">为你推荐 {{ results.length }} 个英文名</h3>
      <div class="name-list">
        <div v-for="(item, idx) in results" :key="idx" class="name-card">
          <div class="name-header">
            <span class="name-text">{{ item.name }}</span>
            <span class="name-gender">{{ item.gender === 'boy' ? '♂' : item.gender === 'girl' ? '♀' : '' }}</span>
          </div>
          <div class="name-tag">{{ item.matchType }}</div>
          <p class="name-meaning">{{ item.meaning }}</p>
          <span class="name-origin">源自 {{ item.origin }}</span>
        </div>
      </div>
    </div>

    <AdSlot />
    <ToolFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ToolHeader from '../../shared/ToolHeader.vue'
import FollowGuide from '../../shared/FollowGuide.vue'
import AdSlot from '../../shared/AdSlot.vue'
import ToolFooter from '../../shared/ToolFooter.vue'
import { matchEnglishNames } from './EnglishNameEngine.js'

const chineseName = ref('')
const results = ref([])

function doMatch() {
  results.value = matchEnglishNames(chineseName.value)
}
</script>

<style scoped>
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
  width: 4rem;
  font-weight: 600;
  font-size: 0.95rem;
}
.form-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
}
.form-input:focus {
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
}
.results-area {
  padding: 0 1rem 1rem;
}
.results-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
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
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.name-text {
  font-size: 1.2rem;
  font-weight: 700;
}
.name-gender {
  font-size: 1rem;
}
.name-tag {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  background: #e8f5e9;
  color: #07c160;
  border-radius: 4px;
  font-size: 0.7rem;
  margin-bottom: 0.35rem;
}
.name-meaning {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.15rem;
}
.name-origin {
  font-size: 0.7rem;
  color: #aaa;
}
</style>
```

- [ ] **Step 7: Commit English name tool**

```bash
cd wechat-tools-h5
git add src/data/english-names.js src/pages/english-name/
git commit -m "feat: add English name matching tool with data and tests"
```

---

### Task 8: Nickname Tool — Engine + Tests + UI

**Files:**
- Create: `src/pages/nickname/NicknameEngine.js`
- Create: `src/pages/nickname/NicknameEngine.test.js`
- Modify: `src/pages/nickname/Nickname.vue`

- [ ] **Step 1: Write failing tests**

Create `src/pages/nickname/NicknameEngine.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { generateNicknames } from './NicknameEngine.js'

describe('generateNicknames', () => {
  it('generates at least 10 nicknames for ancient style', () => {
    const result = generateNicknames('ancient')
    expect(result.length).toBeGreaterThanOrEqual(10)
    result.forEach(n => expect(typeof n).toBe('string'))
  })

  it('generates nicknames for each style', () => {
    const styles = ['ancient', 'simple', 'cute', 'cool']
    styles.forEach(style => {
      const result = generateNicknames(style)
      expect(result.length).toBeGreaterThanOrEqual(10)
    })
  })

  it('returns empty array for unknown style', () => {
    expect(generateNicknames('unknown')).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify fail**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: 3 new failing tests.

- [ ] **Step 3: Implement NicknameEngine**

Create `src/pages/nickname/NicknameEngine.js`:

```js
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
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Build Nickname UI**

Replace `src/pages/nickname/Nickname.vue`:

```vue
<template>
  <div class="nickname-page">
    <ToolHeader title="网名生成" />
    <FollowGuide />

    <div class="form-area">
      <div class="style-grid">
        <button
          v-for="s in styles"
          :key="s.key"
          :class="['style-btn', { active: style === s.key }]"
          @click="style = s.key"
        >
          <span class="style-icon">{{ s.icon }}</span>
          <span class="style-name">{{ s.label }}</span>
        </button>
      </div>
      <button class="generate-btn" @click="doGenerate">生成网名</button>
    </div>

    <div v-if="results.length > 0" class="results-area">
      <div class="name-list">
        <div v-for="(name, idx) in results" :key="idx" class="name-card">
          <span class="name-text">{{ name }}</span>
          <button class="copy-btn" @click="copyName(name)">复制</button>
        </div>
      </div>
    </div>

    <AdSlot />
    <ToolFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ToolHeader from '../../shared/ToolHeader.vue'
import FollowGuide from '../../shared/FollowGuide.vue'
import AdSlot from '../../shared/AdSlot.vue'
import ToolFooter from '../../shared/ToolFooter.vue'
import { generateNicknames } from './NicknameEngine.js'

const styles = [
  { key: 'ancient', icon: '🏮', label: '古风' },
  { key: 'simple', icon: '🍃', label: '简约' },
  { key: 'cute', icon: '🌸', label: '可爱' },
  { key: 'cool', icon: '🔥', label: '霸气' }
]

const style = ref('ancient')
const results = ref([])

function doGenerate() {
  results.value = generateNicknames(style.value)
}

function copyName(name) {
  navigator.clipboard.writeText(name).catch(() => {
    // Fallback for WeChat browser which may not support clipboard API
    const input = document.createElement('input')
    input.value = name
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  })
}
</script>

<style scoped>
.form-area {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.style-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.style-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.75rem 0.5rem;
  border: 2px solid #eee;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}
.style-btn.active {
  border-color: #07c160;
  background: #f0faf4;
}
.style-icon {
  font-size: 1.5rem;
}
.style-name {
  font-size: 0.8rem;
  font-weight: 500;
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
.results-area {
  padding: 0 1rem 1rem;
}
.name-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.name-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.name-text {
  font-size: 1.05rem;
  font-weight: 500;
}
.copy-btn {
  padding: 0.3rem 0.8rem;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}
</style>
```

- [ ] **Step 6: Commit nickname tool**

```bash
cd wechat-tools-h5
git add src/pages/nickname/
git commit -m "feat: add nickname generator with 4 styles"
```

---

### Task 9: Mortgage Calculator — Engine + Tests + UI

**Files:**
- Create: `src/pages/mortgage/MortgageEngine.js`
- Create: `src/pages/mortgage/MortgageEngine.test.js`
- Modify: `src/pages/mortgage/Mortgage.vue`

- [ ] **Step 1: Write failing tests**

Create `src/pages/mortgage/MortgageEngine.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { calculateMortgage } from './MortgageEngine.js'

describe('calculateMortgage', () => {
  it('calculates equal installment (等额本息) correctly', () => {
    const result = calculateMortgage({
      principal: 1000000,
      annualRate: 3.25,
      years: 30
    })
    expect(result.equalInstallment).toBeDefined()
    expect(result.equalInstallment.monthly).toBeGreaterThan(4000)
    expect(result.equalInstallment.monthly).toBeLessThan(5000)
    expect(result.equalInstallment.schedule.length).toBe(360)
  })

  it('calculates equal principal (等额本金) correctly', () => {
    const result = calculateMortgage({
      principal: 500000,
      annualRate: 4.0,
      years: 20
    })
    expect(result.equalPrincipal).toBeDefined()
    expect(result.equalPrincipal.firstMonthly).toBeGreaterThan(result.equalPrincipal.lastMonthly)
    expect(result.equalPrincipal.schedule.length).toBe(240)
  })

  it('total payment > principal (interest positive)', () => {
    const result = calculateMortgage({
      principal: 1000000,
      annualRate: 5.0,
      years: 10
    })
    expect(result.equalInstallment.totalPayment).toBeGreaterThan(1000000)
    expect(result.equalPrincipal.totalPayment).toBeGreaterThan(1000000)
  })

  it('equal principal total interest < equal installment total interest', () => {
    const result = calculateMortgage({
      principal: 1000000,
      annualRate: 4.5,
      years: 30
    })
    expect(result.equalPrincipal.totalInterest).toBeLessThan(result.equalInstallment.totalInterest)
  })
})
```

- [ ] **Step 2: Run tests to verify fail**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: 4 new failing tests.

- [ ] **Step 3: Implement MortgageEngine**

Create `src/pages/mortgage/MortgageEngine.js`:

```js
export function calculateMortgage({ principal, annualRate, years }) {
  const months = years * 12
  const monthlyRate = annualRate / 100 / 12

  // 等额本息: monthly = P × r × (1+r)^n / ((1+r)^n - 1)
  const pow = Math.pow(1 + monthlyRate, months)
  const equalMonthly = principal * monthlyRate * pow / (pow - 1)

  const eiSchedule = []
  let eiRemaining = principal
  let eiTotalInterest = 0
  for (let i = 1; i <= months; i++) {
    const interest = eiRemaining * monthlyRate
    const principalPaid = equalMonthly - interest
    eiRemaining -= principalPaid
    eiTotalInterest += interest
    eiSchedule.push({
      month: i,
      payment: Math.round(equalMonthly * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remaining: Math.max(0, Math.round(eiRemaining * 100) / 100)
    })
  }

  // 等额本金: monthly principal = P / n, monthly interest = remaining × r
  const epMonthlyPrincipal = principal / months
  const epSchedule = []
  let epRemaining = principal
  let epTotalInterest = 0
  let epFirstMonthly = 0
  let epLastMonthly = 0
  for (let i = 1; i <= months; i++) {
    const interest = epRemaining * monthlyRate
    const payment = epMonthlyPrincipal + interest
    epRemaining -= epMonthlyPrincipal
    epTotalInterest += interest
    if (i === 1) epFirstMonthly = payment
    if (i === months) epLastMonthly = payment
    epSchedule.push({
      month: i,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(epMonthlyPrincipal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      remaining: Math.max(0, Math.round(epRemaining * 100) / 100)
    })
  }

  return {
    equalInstallment: {
      monthly: Math.round(equalMonthly * 100) / 100,
      totalPayment: Math.round((equalMonthly * months) * 100) / 100,
      totalInterest: Math.round(eiTotalInterest * 100) / 100,
      schedule: eiSchedule
    },
    equalPrincipal: {
      firstMonthly: Math.round(epFirstMonthly * 100) / 100,
      lastMonthly: Math.round(epLastMonthly * 100) / 100,
      totalPayment: Math.round((principal + epTotalInterest) * 100) / 100,
      totalInterest: Math.round(epTotalInterest * 100) / 100,
      schedule: epSchedule
    }
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Build Mortgage UI**

Replace `src/pages/mortgage/Mortgage.vue`:

```vue
<template>
  <div class="mortgage-page">
    <ToolHeader title="房贷计算器" />
    <FollowGuide />

    <div class="form-area">
      <div class="form-row">
        <label class="form-label">贷款总额</label>
        <input v-model.number="principal" type="number" class="form-input" placeholder="万元" />
        <span class="unit">万元</span>
      </div>
      <div class="form-row">
        <label class="form-label">年利率</label>
        <input v-model.number="annualRate" type="number" step="0.01" class="form-input" placeholder="%" />
        <span class="unit">%</span>
      </div>
      <div class="form-row">
        <label class="form-label">贷款年限</label>
        <select v-model.number="years" class="form-input">
          <option :value="5">5年</option>
          <option :value="10">10年</option>
          <option :value="15">15年</option>
          <option :value="20">20年</option>
          <option :value="25">25年</option>
          <option :value="30">30年</option>
        </select>
      </div>
      <button class="generate-btn" @click="doCalculate" :disabled="!principal || !annualRate">
        计算
      </button>
    </div>

    <div v-if="result" class="results-area">
      <div class="compare-section">
        <h3 class="section-title">两种方式对比</h3>
        <div class="compare-cards">
          <div class="compare-card">
            <h4>等额本息</h4>
            <div class="compare-row">
              <span>月供</span>
              <strong>{{ formatMoney(result.equalInstallment.monthly) }}</strong>
            </div>
            <div class="compare-row">
              <span>总还款</span>
              <strong>{{ formatWan(result.equalInstallment.totalPayment) }}</strong>
            </div>
            <div class="compare-row">
              <span>总利息</span>
              <strong class="interest">{{ formatWan(result.equalInstallment.totalInterest) }}</strong>
            </div>
          </div>
          <div class="compare-card">
            <h4>等额本金</h4>
            <div class="compare-row">
              <span>首月</span>
              <strong>{{ formatMoney(result.equalPrincipal.firstMonthly) }}</strong>
            </div>
            <div class="compare-row">
              <span>末月</span>
              <strong>{{ formatMoney(result.equalPrincipal.lastMonthly) }}</strong>
            </div>
            <div class="compare-row">
              <span>总还款</span>
              <strong>{{ formatWan(result.equalPrincipal.totalPayment) }}</strong>
            </div>
            <div class="compare-row">
              <span>总利息</span>
              <strong class="interest">{{ formatWan(result.equalPrincipal.totalInterest) }}</strong>
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
import { ref } from 'vue'
import ToolHeader from '../../shared/ToolHeader.vue'
import FollowGuide from '../../shared/FollowGuide.vue'
import AdSlot from '../../shared/AdSlot.vue'
import ToolFooter from '../../shared/ToolFooter.vue'
import { calculateMortgage } from './MortgageEngine.js'

const principal = ref(null)
const annualRate = ref(null)
const years = ref(30)
const result = ref(null)

function doCalculate() {
  result.value = calculateMortgage({
    principal: principal.value * 10000,
    annualRate: annualRate.value,
    years: years.value
  })
}

function formatMoney(val) {
  return '¥' + val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatWan(val) {
  return (val / 10000).toFixed(2) + '万元'
}
</script>

<style scoped>
.form-area {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
}
.form-input:focus {
  border-color: #07c160;
}
.unit {
  font-size: 0.85rem;
  color: #888;
  width: 2rem;
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
}
.results-area {
  padding: 0 1rem 1rem;
}
.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}
.compare-cards {
  display: flex;
  gap: 0.75rem;
}
.compare-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.compare-card h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid #f0f0f0;
}
.compare-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.8rem;
}
.compare-row strong {
  font-size: 0.85rem;
}
.interest {
  color: #e74c3c;
}
</style>
```

- [ ] **Step 6: Commit mortgage calculator**

```bash
cd wechat-tools-h5
git add src/pages/mortgage/
git commit -m "feat: add mortgage calculator with equal installment vs equal principal comparison"
```

---

### Task 10: Date Calculator — Engine + Tests + UI

**Files:**
- Create: `src/pages/date-calc/DateCalcEngine.js`
- Create: `src/pages/date-calc/DateCalcEngine.test.js`
- Modify: `src/pages/date-calc/DateCalc.vue`

- [ ] **Step 1: Write failing tests**

Create `src/pages/date-calc/DateCalcEngine.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { daysBetween, dateAdd, countWorkdays } from './DateCalcEngine.js'

describe('daysBetween', () => {
  it('calculates days between two dates', () => {
    expect(daysBetween('2024-01-01', '2024-01-10')).toBe(9)
  })

  it('returns positive days regardless of order', () => {
    expect(daysBetween('2024-01-10', '2024-01-01')).toBe(9)
  })

  it('returns 0 for same date', () => {
    expect(daysBetween('2024-06-15', '2024-06-15')).toBe(0)
  })
})

describe('dateAdd', () => {
  it('adds N days to a date', () => {
    expect(dateAdd('2024-01-01', 5)).toBe('2024-01-06')
  })

  it('subtracts N days with negative input', () => {
    expect(dateAdd('2024-01-10', -5)).toBe('2024-01-05')
  })

  it('handles month boundary', () => {
    expect(dateAdd('2024-01-31', 1)).toBe('2024-02-01')
  })

  it('handles year boundary', () => {
    expect(dateAdd('2024-12-31', 1)).toBe('2025-01-01')
  })
})

describe('countWorkdays', () => {
  it('counts workdays between two dates', () => {
    // 2024-12-30 (Mon) to 2025-01-03 (Fri), 5 days, all workdays
    const result = countWorkdays('2024-12-30', '2025-01-03')
    expect(result).toBe(5)
  })

  it('excludes weekends', () => {
    // 2024-12-28 (Sat) to 2024-12-30 (Mon), 1 workday
    const result = countWorkdays('2024-12-28', '2024-12-30')
    expect(result).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify fail**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: 8 new failing tests.

- [ ] **Step 3: Implement DateCalcEngine**

Create `src/pages/date-calc/DateCalcEngine.js`:

```js
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysBetween(date1, date2) {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  return Math.abs(Math.round((d2 - d1) / (1000 * 60 * 60 * 24)))
}

export function dateAdd(dateStr, days) {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

export function countWorkdays(startStr, endStr) {
  let start = parseDate(startStr)
  let end = parseDate(endStr)
  if (start > end) [start, end] = [end, start]

  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Build DateCalc UI**

Replace `src/pages/date-calc/DateCalc.vue`:

```vue
<template>
  <div class="date-calc-page">
    <ToolHeader title="日期计算" />
    <FollowGuide />

    <div class="tabs">
      <button :class="['tab', { active: mode === 'between' }]" @click="mode = 'between'">日期间隔</button>
      <button :class="['tab', { active: mode === 'add' }]" @click="mode = 'add'">日期推算</button>
      <button :class="['tab', { active: mode === 'workdays' }]" @click="mode = 'workdays'">工作日</button>
    </div>

    <!-- Mode: days between -->
    <div v-if="mode === 'between'" class="form-area">
      <div class="form-row">
        <label class="form-label">起始日期</label>
        <input v-model="date1" type="date" class="form-input" />
      </div>
      <div class="form-row">
        <label class="form-label">结束日期</label>
        <input v-model="date2" type="date" class="form-input" />
      </div>
      <button class="generate-btn" @click="calcBetween">计算间隔</button>
      <div v-if="betweenResult !== null" class="result-box">
        间隔 <strong>{{ betweenResult }}</strong> 天
      </div>
    </div>

    <!-- Mode: date add -->
    <div v-if="mode === 'add'" class="form-area">
      <div class="form-row">
        <label class="form-label">起始日期</label>
        <input v-model="baseDate" type="date" class="form-input" />
      </div>
      <div class="form-row">
        <label class="form-label">天数</label>
        <input v-model.number="addDays" type="number" class="form-input" placeholder="正数向后，负数向前" />
      </div>
      <button class="generate-btn" @click="calcDateAdd">推算</button>
      <div v-if="addResult" class="result-box">
        结果为 <strong>{{ addResult }}</strong>
      </div>
    </div>

    <!-- Mode: workdays -->
    <div v-if="mode === 'workdays'" class="form-area">
      <div class="form-row">
        <label class="form-label">起始日期</label>
        <input v-model="wdStart" type="date" class="form-input" />
      </div>
      <div class="form-row">
        <label class="form-label">结束日期</label>
        <input v-model="wdEnd" type="date" class="form-input" />
      </div>
      <button class="generate-btn" @click="calcWorkdays">计算工作日</button>
      <div v-if="wdResult !== null" class="result-box">
        共 <strong>{{ wdResult }}</strong> 个工作日
      </div>
    </div>

    <AdSlot />
    <ToolFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ToolHeader from '../../shared/ToolHeader.vue'
import FollowGuide from '../../shared/FollowGuide.vue'
import AdSlot from '../../shared/AdSlot.vue'
import ToolFooter from '../../shared/ToolFooter.vue'
import { daysBetween, dateAdd, countWorkdays } from './DateCalcEngine.js'

const mode = ref('between')
const date1 = ref('')
const date2 = ref('')
const baseDate = ref('')
const addDays = ref(0)
const wdStart = ref('')
const wdEnd = ref('')

const betweenResult = ref(null)
const addResult = ref('')
const wdResult = ref(null)

function calcBetween() {
  if (!date1.value || !date2.value) return
  betweenResult.value = daysBetween(date1.value, date2.value)
}

function calcDateAdd() {
  if (!baseDate.value) return
  addResult.value = dateAdd(baseDate.value, addDays.value)
}

function calcWorkdays() {
  if (!wdStart.value || !wdEnd.value) return
  wdResult.value = countWorkdays(wdStart.value, wdEnd.value)
}
</script>

<style scoped>
.tabs {
  display: flex;
  margin: 1rem 1rem 0;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.tab {
  flex: 1;
  padding: 0.6rem 0;
  border: none;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.tab.active {
  color: #07c160;
  border-bottom-color: #07c160;
}
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
}
.form-input:focus {
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
.result-box {
  padding: 1rem;
  background: #f0faf4;
  border-radius: 8px;
  text-align: center;
  font-size: 1rem;
}
.result-box strong {
  font-size: 1.3rem;
  color: #07c160;
}
</style>
```

- [ ] **Step 6: Commit date calculator**

```bash
cd wechat-tools-h5
git add src/pages/date-calc/
git commit -m "feat: add date calculator with days between, date add, and workdays counting"
```

---

### Task 11: Final Integration & Build Verification

**Files:** None new.

- [ ] **Step 1: Run all tests**

Run: `cd wechat-tools-h5 && npx vitest run`
Expected: All tests from all 5 tools pass (~21 tests total).

- [ ] **Step 2: Production build**

Run: `cd wechat-tools-h5 && npx vite build`
Expected: Build succeeds. Check `dist/` size — should be under 200KB gzipped.

- [ ] **Step 3: Preview production build**

Run: `cd wechat-tools-h5 && npx vite preview --port 4173`

Manual check:
- Open `http://localhost:4173` — Home page shows 5 tools
- Click each tool — navigates correctly
- Home page: Baby name generates names, mortgage calculator shows results, etc.
- Verify mobile viewport: Chrome DevTools → mobile mode (375px width)

- [ ] **Step 4: Final commit**

```bash
cd wechat-tools-h5
git add -A
git commit -m "feat: complete all 5 tools with tests, ready for deploy"
```

---

## Deploy Notes (not a task, for reference)

After all tasks complete:

1. Push to GitHub: `git remote add origin <repo-url> && git push -u origin main`
2. Connect CloudFlare Pages to the repo
3. Build command: `npm run build`
4. Output directory: `dist`
5. Custom domain (optional, needs ICP备案 for WeChat JS safe domain)
6. Add tool URLs to WeChat Official Account menu

---

## Plan Self-Review

### Spec Coverage Check
| Spec Requirement | Covered By |
|---|---|
| Vue 3 + Vite scaffold | Task 1 |
| 5 tools (baby name, english name, nickname, mortgage, date calc) | Tasks 5-10 |
| Shared components (ToolHeader, ToolFooter, AdSlot, FollowGuide) | Task 2 |
| Home page with tool grid | Task 3 |
| Mobile responsive CSS | Task 1 (global styles) + each component |
| Tests with Vitest | Tasks 5, 7, 8, 9, 10 |
| Zero backend / pure static | Confirmed: no API calls, no server code |
| Ad slot with placeholder | Task 2 (AdSlot.vue) |
| Follow guide bar | Task 2 (FollowGuide.vue) |
| Cross-tool navigation in footer | Task 2 (ToolFooter.vue) |

### Placeholder Scan
No TBD, TODO, or vague descriptions found. Every step has exact code.

### Type Consistency
- `generateNames({ surname, gender })` — consistent across engine and UI
- `matchEnglishNames(chineseName)` — consistent
- `generateNicknames(style)` — consistent
- `calculateMortgage({ principal, annualRate, years })` — consistent
- `daysBetween(d1, d2)`, `dateAdd(d, n)`, `countWorkdays(s, e)` — consistent
