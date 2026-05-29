<template>
  <div class="baby-name-page">
    <ToolHeader title="宝宝取名" />
    <FollowGuide />

    <div class="tabs">
      <button type="button" :class="['tab', { active: mode === 'smart' }]" @click="mode = 'smart'">智能取名</button>
      <button type="button" :class="['tab', { active: mode === 'bazi' }]" @click="mode = 'bazi'">八字取名</button>
    </div>

    <!-- Smart Naming Mode -->
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

    <!-- Bazi Naming Mode -->
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
              <span>日主: {{ baziResult.dayPillar.stem }}({{ baziResult.dayStemWx }})</span>
            </div>
            <div class="wuxing-bar">
              <span v-for="wx in wuxingDisplay" :key="wx.name" class="wuxing-chip" :class="{ missing: wx.count === 0 }">
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
          <p class="disclaimer">* 以上分析仅供参考，不构成命理建议</p>
        </div>

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
import { ref, reactive, nextTick } from 'vue'
import ToolHeader from '../../shared/ToolHeader.vue'
import FollowGuide from '../../shared/FollowGuide.vue'
import AdSlot from '../../shared/AdSlot.vue'
import ToolFooter from '../../shared/ToolFooter.vue'
import { generateNames } from './BabyNameEngine.js'
import { analyzeBazi } from './BaziEngine.js'
import { generateBaziNames } from './BaziNameEngine.js'

const mode = ref('bazi')

// Smart naming
const surname = ref('')
const gender = ref('boy')
const smartNames = ref([])

// Bazi naming
const baziSurname = ref('')
const baziGender = ref('boy')
const baziDate = ref('')
const baziHour = ref(12)
const baziLoading = ref(false)
const baziResult = ref(null)
const baziNames = ref([])
const poetryCache = ref(null)

const wuxingDisplay = reactive([
  { name: '金', count: 0 },
  { name: '木', count: 0 },
  { name: '水', count: 0 },
  { name: '火', count: 0 },
  { name: '土', count: 0 }
])

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00 - ${String((i + 1) % 24).padStart(2, '0')}:00`
}))

function doGenerate() {
  smartNames.value = generateNames({ surname: surname.value, gender: gender.value })
}

async function doBaziAnalyze() {
  baziLoading.value = true
  await nextTick()
  baziResult.value = null
  baziNames.value = []

  const [year, month, day] = baziDate.value.split('-').map(Number)

  const bazi = analyzeBazi(year, month, day, baziHour.value)
  baziResult.value = bazi

  for (const wx of wuxingDisplay) {
    wx.count = bazi.wuxingCount[wx.name]
  }

  baziNames.value = generateBaziNames({
    surname: baziSurname.value,
    gender: baziGender.value,
    xiShen: bazi.xiji.xiShen,
    jiShen: bazi.xiji.jiShen
  })

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

/* Form */
.form-area { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: flex; align-items: center; gap: 0.75rem; }
.form-label { width: 4.5rem; font-weight: 600; font-size: 0.95rem; flex-shrink: 0; }
.form-input { flex: 1; padding: 0.6rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; outline: none; font-size: 0.95rem; }
.form-input:focus { border-color: #07c160; }
.gender-btns { display: flex; gap: 0.5rem; }
.gender-btn { padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 0.85rem; cursor: pointer; }
.gender-btn.active { background: #07c160; color: #fff; border-color: #07c160; }
.generate-btn { padding: 0.75rem; background: #07c160; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
.generate-btn:disabled { background: #ccc; cursor: not-allowed; }

/* Loading */
.loading-box { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem; color: #888; }
.loading-spinner { font-size: 2rem; animation: spin 1s linear infinite; display: inline-block; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Results */
.results-area { padding: 0 1rem 1rem; }
.section-title, .results-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; }
.results-title { margin-top: 1rem; }

/* Bazi chart */
.bazi-card { background: #fff; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.bazi-chart { display: flex; justify-content: space-around; margin-bottom: 0.75rem; padding: 0.75rem 0; background: #fafaf8; border-radius: 6px; }
.bazi-column { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
.bazi-label { font-size: 0.7rem; color: #999; }
.bazi-stem { font-size: 1.3rem; font-weight: 700; color: #333; }
.bazi-branch { font-size: 1.1rem; color: #666; }
.bazi-info { display: flex; flex-direction: column; gap: 0.4rem; }
.bazi-info-row { font-size: 0.78rem; color: #666; }
.wuxing-bar { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
.wuxing-chip { padding: 0.15rem 0.6rem; background: #f0f0f0; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
.wuxing-chip.missing { background: #fff0f0; color: #e74c3c; border: 1px solid #e74c3c; }
.xiji-box { margin-top: 0.25rem; padding: 0.5rem; background: #f0faf4; border-radius: 6px; font-size: 0.8rem; color: #333; line-height: 1.5; }
.xiji-detail { margin-top: 0.25rem; }
.disclaimer { margin-top: 0.5rem; font-size: 0.65rem; color: #bbb; text-align: right; }

/* Name cards */
.name-list { display: flex; flex-direction: column; gap: 0.5rem; }
.name-card { background: #fff; border-radius: 8px; padding: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.name-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; }
.name-text { font-size: 1.2rem; font-weight: 700; color: #333; }
.name-score { font-size: 0.85rem; font-weight: 600; color: #07c160; }
.name-meta { display: flex; gap: 0.75rem; font-size: 0.75rem; color: #888; margin-bottom: 0.35rem; align-items: center; }
.name-wuxing { color: #888; }
.name-chars { color: #888; }
.name-meaning { font-size: 0.8rem; color: #666; line-height: 1.5; }
.name-tag { padding: 0.1rem 0.4rem; background: #e8f5e9; color: #07c160; border-radius: 3px; font-size: 0.7rem; }

/* Poetry */
.poetry-box { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #f0f0f0; }
.poetry-item { display: flex; gap: 0.5rem; margin-bottom: 0.35rem; }
.poetry-char { flex-shrink: 0; width: 1.4rem; height: 1.4rem; display: flex; align-items: center; justify-content: center; background: #f0faf4; color: #07c160; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
.poetry-content { flex: 1; }
.poetry-text { font-size: 0.78rem; color: #555; line-height: 1.5; }
.poetry-source { font-size: 0.7rem; color: #aaa; }
</style>
