<template>
  <div class="date-calc-page">
    <ToolHeader title="日期计算" />
    <FollowGuide />

    <div class="tabs">
      <button type="button" :class="['tab', { active: mode === 'between' }]" @click="mode = 'between'">日期间隔</button>
      <button type="button" :class="['tab', { active: mode === 'add' }]" @click="mode = 'add'">日期推算</button>
      <button type="button" :class="['tab', { active: mode === 'workdays' }]" @click="mode = 'workdays'">工作日</button>
    </div>

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
      <div v-if="betweenResult !== null" class="result-box">间隔 <strong>{{ betweenResult }}</strong> 天</div>
    </div>

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
      <div v-if="addResult" class="result-box">结果为 <strong>{{ addResult }}</strong></div>
    </div>

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
      <div v-if="wdResult !== null" class="result-box">共 <strong>{{ wdResult }}</strong> 个工作日</div>
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

function calcBetween() { if (date1.value && date2.value) betweenResult.value = daysBetween(date1.value, date2.value) }
function calcDateAdd() { if (baseDate.value) addResult.value = dateAdd(baseDate.value, addDays.value) }
function calcWorkdays() { if (wdStart.value && wdEnd.value) wdResult.value = countWorkdays(wdStart.value, wdEnd.value) }
</script>

<style scoped>
.tabs { display: flex; margin: 1rem 1rem 0; background: #fff; border-radius: 8px; overflow: hidden; }
.tab { flex: 1; padding: 0.6rem 0; border: none; background: #fff; font-size: 0.85rem; cursor: pointer; border-bottom: 2px solid transparent; }
.tab.active { color: #07c160; border-bottom-color: #07c160; }
.form-area { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: flex; align-items: center; gap: 0.75rem; }
.form-label { width: 4.5rem; font-weight: 600; font-size: 0.95rem; flex-shrink: 0; }
.form-input { flex: 1; padding: 0.6rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; outline: none; }
.form-input:focus { border-color: #07c160; }
.generate-btn { padding: 0.75rem; background: #07c160; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
.result-box { padding: 1rem; background: #f0faf4; border-radius: 8px; text-align: center; font-size: 1rem; }
.result-box strong { font-size: 1.3rem; color: #07c160; }
</style>
