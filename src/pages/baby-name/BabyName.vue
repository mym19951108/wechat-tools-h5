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
        <button type="button" class="generate-btn" @click="doGenerate" :disabled="!surname.trim()">生成名字</button>
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
          {{ baziLoading ? baziSteps[baziCurrentStep] || '分析中...' : '分析八字取名' }}
        </button>
      </div>

      <!-- Staged Loading Overlay -->
      <div v-if="baziLoading" class="loading-overlay">
        <div class="loading-card">
          <div class="loading-steps">
            <div v-for="(step, idx) in baziSteps" :key="idx" class="step-row" :class="{ done: idx < baziCurrentStep, active: idx === baziCurrentStep }">
              <span class="step-icon">{{ idx < baziCurrentStep ? '✓' : idx === baziCurrentStep ? '→' : '○' }}</span>
              <span class="step-text">{{ step }}</span>
            </div>
          </div>
        </div>
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
            <div class="bazi-info-row"><span>农历: {{ baziResult.lunarDate }}</span></div>
            <div class="bazi-info-row"><span>日主: {{ baziResult.dayPillar.stem }}({{ baziResult.dayStemWx }})</span></div>
            <div class="wuxing-bar">
              <span v-for="wx in wuxingDisplay" :key="wx.name" class="wuxing-chip" :class="{ missing: wx.count === 0 }">{{ wx.name }}{{ wx.count }}</span>
            </div>
            <div class="xiji-box">
              <p>{{ baziResult.xiji.description }}</p>
              <p class="xiji-detail">喜用神: <strong>{{ baziResult.xiji.xiShen.join('、') }}</strong> &ensp;忌神: <strong>{{ baziResult.xiji.jiShen.join('、') }}</strong></p>
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
              <span :class="['level-tag', 'level-' + name.level]">{{ levelIcon(name.level) }} {{ name.levelLabel }}</span>
            </div>
            <div class="score-bar">
              <span class="sb-item">喜忌: {{ name.scoreBreakdown.xiji }}</span>
              <span class="sb-item">诗词: {{ name.scoreBreakdown.poetry }}</span>
              <span class="sb-item">音韵: {{ name.scoreBreakdown.sound }}</span>
              <span class="sb-item">寓意: {{ name.scoreBreakdown.meaning }}</span>
            </div>
            <div class="poetry-box">
              <div class="poetry-item" v-if="name.poetry1.text">
                <span class="poetry-char">{{ name.char1 }}</span>
                <div class="poetry-content">
                  <p class="poetry-text" v-html="highlightChar(name.poetry1.text, name.char1)"></p>
                  <span class="poetry-source" v-if="name.poetry1.source">—— {{ name.poetry1.source }}</span>
                </div>
              </div>
              <div class="poetry-item" v-if="name.poetry2.text">
                <span class="poetry-char">{{ name.char2 }}</span>
                <div class="poetry-content">
                  <p class="poetry-text" v-html="highlightChar(name.poetry2.text, name.char2)"></p>
                  <span class="poetry-source" v-if="name.poetry2.source">—— {{ name.poetry2.source }}</span>
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

const surname = ref('')
const gender = ref('boy')
const smartNames = ref([])

const baziSurname = ref('')
const baziGender = ref('boy')
const baziDate = ref('')
const baziHour = ref(12)
const baziLoading = ref(false)
const baziResult = ref(null)
const baziNames = ref([])

const baziSteps = ['推算八字排盘', '分析五行喜忌', '匹配诗词典籍', '生成名字并打分']
const baziCurrentStep = ref(0)

const wuxingDisplay = reactive([
  { name: '金', count: 0 }, { name: '木', count: 0 }, { name: '水', count: 0 }, { name: '火', count: 0 }, { name: '土', count: 0 }
])

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00 - ${String((i + 1) % 24).padStart(2, '0')}:00`
}))

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

function doGenerate() {
  smartNames.value = generateNames({ surname: surname.value, gender: gender.value })
}

async function doBaziAnalyze() {
  baziLoading.value = true
  baziCurrentStep.value = 0
  baziResult.value = null
  baziNames.value = []
  await nextTick()

  const [year, month, day] = baziDate.value.split('-').map(Number)
  const bazi = analyzeBazi(year, month, day, baziHour.value)
  await delay(600)
  baziCurrentStep.value = 1

  for (const wx of wuxingDisplay) wx.count = bazi.wuxingCount[wx.name]
  await delay(600)
  baziCurrentStep.value = 2

  baziNames.value = generateBaziNames({
    surname: baziSurname.value,
    gender: baziGender.value,
    xiShen: bazi.xiji.xiShen,
    jiShen: bazi.xiji.jiShen
  })
  await delay(800)
  baziCurrentStep.value = 3

  baziResult.value = bazi
  await delay(500)
  baziCurrentStep.value = 4

  baziLoading.value = false
}

function levelIcon(level) {
  if (level === 'sameLine') return '🔴'
  if (level === 'samePoem') return '🟡'
  return '⚪'
}

function highlightChar(text, ch) {
  if (!text || !ch) return ''
  return text.replace(new RegExp(ch, 'g'), `<span class="hl">${ch}</span>`)
}
</script>

<style scoped>
.tabs { display: flex; margin: 1rem 1rem 0; background: #fff; border-radius: 8px; overflow: hidden; }
.tab { flex: 1; padding: 0.7rem 0; border: none; background: #fff; font-size: 0.95rem; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 500; }
.tab.active { color: #07c160; border-bottom-color: #07c160; }

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

.loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; }
.loading-card { background: #fff; border-radius: 12px; padding: 2rem 2.5rem; min-width: 260px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.loading-steps { display: flex; flex-direction: column; gap: 1rem; }
.step-row { display: flex; align-items: center; gap: 0.75rem; font-size: 0.95rem; color: #ccc; transition: color 0.3s; }
.step-row.active { color: #333; font-weight: 600; }
.step-row.done { color: #07c160; font-weight: 500; }
.step-icon { width: 1.5rem; text-align: center; font-weight: 700; }

.results-area { padding: 0 1rem 1rem; }
.section-title, .results-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; }
.results-title { margin-top: 1rem; }

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

.name-list { display: flex; flex-direction: column; gap: 0.5rem; }
.name-card { background: #fff; border-radius: 8px; padding: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.name-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; }
.name-text { font-size: 1.2rem; font-weight: 700; color: #333; }
.name-score { font-size: 0.85rem; font-weight: 600; color: #07c160; }
.name-meta { display: flex; gap: 0.75rem; font-size: 0.75rem; color: #888; margin-bottom: 0.25rem; align-items: center; }
.name-wuxing { color: #888; }
.name-chars { color: #888; }
.name-meaning { font-size: 0.8rem; color: #666; line-height: 1.5; }

.level-tag { padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
.level-sameLine { background: #ffeaea; color: #e74c3c; }
.level-samePoem { background: #fff8e1; color: #f39c12; }
.level-wuxing { background: #f0f0f0; color: #999; }

.score-bar { display: flex; gap: 0.75rem; margin-bottom: 0.35rem; font-size: 0.7rem; color: #888; }
.sb-item { display: flex; align-items: center; gap: 0.15rem; }

.poetry-box { margin-top: 0.35rem; padding-top: 0.35rem; border-top: 1px solid #f0f0f0; }
.poetry-text { font-size: 0.8rem; color: #555; line-height: 1.6; }
.poetry-text :deep(.hl) { color: #e74c3c; font-weight: 700; }
.poetry-source { font-size: 0.7rem; color: #aaa; }
.poetry-item { display: flex; gap: 0.5rem; margin-bottom: 0.35rem; }
.poetry-char { flex-shrink: 0; width: 1.4rem; height: 1.4rem; display: flex; align-items: center; justify-content: center; background: #f0faf4; color: #07c160; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
.poetry-content { flex: 1; }
</style>
