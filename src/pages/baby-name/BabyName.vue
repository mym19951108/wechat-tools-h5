<template>
  <div class="baby-name-page">
    <ToolHeader title="八字取名" />
    <FollowGuide />

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
      <div class="form-row">
        <label class="form-label">出生日期</label>
        <input ref="dateInput" v-model="baziDate" type="date" class="form-input" @focus="$refs.dateInput.showPicker?.()" @click="$refs.dateInput.showPicker?.()" />
      </div>
      <div class="form-row">
        <label class="form-label">出生时辰</label>
        <select v-model.number="baziHour" class="form-input">
          <option v-for="h in hours" :key="h.value" :value="h.value">{{ h.label }}</option>
        </select>
      </div>
      <button type="button" class="generate-btn" @click="doAnalyze" :disabled="!surname.trim() || !baziDate || loading">
        {{ loading ? steps[currentStep] : '分析八字取名' }}
      </button>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-card">
        <div class="loading-step">
          <span class="spinner"></span>
          <span class="step-text">{{ steps[currentStep] }}</span>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="result && !loading" class="results-area">
      <div class="bazi-card">
        <h3 class="section-title">八字排盘</h3>
        <div class="bazi-chart">
          <div class="bazi-column">
            <span class="bazi-label">年柱</span>
            <span class="bazi-stem">{{ result.yearPillar.stem }}</span>
            <span class="bazi-branch">{{ result.yearPillar.branch }}</span>
          </div>
          <div class="bazi-column">
            <span class="bazi-label">月柱</span>
            <span class="bazi-stem">{{ result.monthPillar.stem }}</span>
            <span class="bazi-branch">{{ result.monthPillar.branch }}</span>
          </div>
          <div class="bazi-column">
            <span class="bazi-label">日柱</span>
            <span class="bazi-stem">{{ result.dayPillar.stem }}</span>
            <span class="bazi-branch">{{ result.dayPillar.branch }}</span>
          </div>
          <div class="bazi-column">
            <span class="bazi-label">时柱</span>
            <span class="bazi-stem">{{ result.hourPillar.stem }}</span>
            <span class="bazi-branch">{{ result.hourPillar.branch }}</span>
          </div>
        </div>
        <div class="bazi-info">
          <div class="bazi-info-row"><span>农历: {{ result.lunarDate }}</span></div>
          <div class="bazi-info-row"><span>日主: {{ result.dayPillar.stem }}({{ result.dayStemWx }})</span></div>
          <div class="wuxing-bar">
            <span v-for="wx in wuxingDisplay" :key="wx.name" class="wuxing-chip" :class="{ missing: wx.count === 0 }">{{ wx.name }}{{ wx.count }}</span>
          </div>
          <div class="xiji-box">
            <p>{{ result.xiji.description }}</p>
            <p class="xiji-detail">
              <template v-for="item in [
                { label: '用神', val: result.xiji.yongShen },
                { label: '喜神', val: result.xiji.xiShen },
                { label: '闲神', val: result.xiji.xianShen },
                { label: '仇神', val: result.xiji.chouShen },
                { label: '忌神', val: result.xiji.jiShen }
              ].filter(i => i.val.length > 0)" :key="item.label">
                {{ item.label }}: <strong>{{ item.val.join('、') }}</strong> &ensp;
              </template>
            </p>
          </div>
        </div>
        <p class="disclaimer">* 以上分析仅供参考，不构成命理建议</p>
      </div>

      <h3 class="results-title">为你生成 10 个名字</h3>
      <div class="name-list">
        <div v-for="(name, idx) in names" :key="idx" class="name-card">
          <div class="name-header">
            <span class="name-text">{{ name.fullName }}</span>
            <span class="name-score">{{ name.score }}分</span>
          </div>
          <div class="name-meta">
            <span class="name-wuxing">五行: {{ name.wuxing }}</span>
            <span class="name-source">{{ name.sourceLabel }}</span>
          </div>
          <div class="score-bar">
            <span class="sb-item">喜忌: {{ name.scoreBreakdown.xiji }}</span>
            <span class="sb-item">音韵: {{ name.scoreBreakdown.sound }}</span>
            <span class="sb-item">寓意: {{ name.scoreBreakdown.meaning }}</span>
            <span class="sb-item">意境: {{ name.scoreBreakdown.mood }}</span>
          </div>
          <div v-if="name.poetry" class="poetry-box">
            <p class="poetry-text" v-html="highlightChars(name.poetry.text, name.char1, name.char2)"></p>
            <span class="poetry-source">—— {{ name.poetry.source }}</span>
            <p v-if="name.poetry.annotation" class="poetry-anno">💬 {{ name.poetry.annotation }}</p>
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
import { analyzeBazi } from './BaziEngine.js'
import { generateBaziNames } from './BaziNameEngine.js'

const surname = ref('')
const gender = ref('boy')
const baziDate = ref('')
const baziHour = ref(12)
const loading = ref(false)
const result = ref(null)
const names = ref([])

const steps = ['推算八字排盘', '分析五行喜忌', '匹配诗词典籍', '生成名字并打分']
const currentStep = ref(0)

const wuxingDisplay = reactive([
  { name: '金', count: 0 }, { name: '木', count: 0 }, { name: '水', count: 0 }, { name: '火', count: 0 }, { name: '土', count: 0 }
])

const SHI_CHEN_NAMES = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时']
// Bazi 时辰: 子=0(早子时), 丑=1, 寅=3, ... 亥=21
// Note: lunar-javascript handles 子时 more accurately at hour=0
const SHI_CHEN_HOURS = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]
const hours = Array.from({ length: 12 }, (_, i) => {
  const start = SHI_CHEN_HOURS[i]
  const end = (start + 2) % 24
  return {
    value: start,
    label: `${SHI_CHEN_NAMES[i]} (${String(start).padStart(2, '0')}:00-${String(end).padStart(2, '0')}:00)`
  }
})

function rand(minSec, maxSec) {
  return Math.floor(Math.random() * (maxSec - minSec) * 1000) + minSec * 1000
}

async function doAnalyze() {
  loading.value = true
  currentStep.value = 0
  result.value = null
  names.value = []
  await nextTick()

  const [year, month, day] = baziDate.value.split('-').map(Number)
  const bazi = await analyzeBazi(year, month, day, baziHour.value)
  await new Promise(r => setTimeout(r, rand(0.8, 1.5)))
  currentStep.value = 1

  for (const wx of wuxingDisplay) wx.count = bazi.wuxingCount[wx.name]
  await new Promise(r => setTimeout(r, rand(1.5, 2.5)))
  currentStep.value = 2

  names.value = generateBaziNames({
    surname: surname.value,
    gender: gender.value,
    yongShen: bazi.xiji.yongShen,
    xiShen: bazi.xiji.xiShen,
    xianShen: bazi.xiji.xianShen,
    chouShen: bazi.xiji.chouShen,
    jiShen: bazi.xiji.jiShen
  })
  await new Promise(r => setTimeout(r, rand(2.5, 4)))
  currentStep.value = 3

  result.value = bazi
  await new Promise(r => setTimeout(r, rand(1.5, 2)))
  currentStep.value = 4

  loading.value = false
}

function highlightChars(text, char1, char2) {
  if (!text) return ''
  let html = text
  html = html.replace(new RegExp(char1, 'g'), `<span class="hl">${char1}</span>`)
  html = html.replace(new RegExp(char2, 'g'), `<span class="hl">${char2}</span>`)
  return html
}
</script>

<style scoped>
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
.loading-card { background: #fff; border-radius: 12px; padding: 2rem 2.5rem; min-width: 240px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.loading-step { display: flex; align-items: center; gap: 1rem; }
.spinner { width: 20px; height: 20px; border: 2.5px solid #e0e0e0; border-top-color: #e74c3c; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.step-text { font-size: 1rem; color: #333; font-weight: 500; }

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
.name-source { font-size: 0.7rem; color: #07c160; background: #f0faf4; padding: 0.1rem 0.4rem; border-radius: 3px; }

.score-bar { display: flex; gap: 0.75rem; margin-bottom: 0.35rem; font-size: 0.7rem; color: #888; }
.sb-item { display: flex; align-items: center; gap: 0.15rem; }

.poetry-box { margin-top: 0.35rem; padding-top: 0.35rem; border-top: 1px solid #f0f0f0; }
.poetry-text { font-size: 0.8rem; color: #555; line-height: 1.6; }
.poetry-text :deep(.hl) { color: #e74c3c; font-weight: 700; }
.poetry-source { font-size: 0.7rem; color: #aaa; }
.poetry-anno { margin-top: 0.3rem; font-size: 0.75rem; color: #8b7355; line-height: 1.5; }
</style>
