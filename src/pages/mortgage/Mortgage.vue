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
            <div class="compare-row"><span>月供</span><strong>{{ formatMoney(result.equalInstallment.monthly) }}</strong></div>
            <div class="compare-row"><span>总还款</span><strong>{{ formatWan(result.equalInstallment.totalPayment) }}</strong></div>
            <div class="compare-row"><span>总利息</span><strong class="interest">{{ formatWan(result.equalInstallment.totalInterest) }}</strong></div>
          </div>
          <div class="compare-card">
            <h4>等额本金</h4>
            <div class="compare-row"><span>首月</span><strong>{{ formatMoney(result.equalPrincipal.firstMonthly) }}</strong></div>
            <div class="compare-row"><span>末月</span><strong>{{ formatMoney(result.equalPrincipal.lastMonthly) }}</strong></div>
            <div class="compare-row"><span>总还款</span><strong>{{ formatWan(result.equalPrincipal.totalPayment) }}</strong></div>
            <div class="compare-row"><span>总利息</span><strong class="interest">{{ formatWan(result.equalPrincipal.totalInterest) }}</strong></div>
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
.form-area { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: flex; align-items: center; gap: 0.5rem; }
.form-label { width: 4.5rem; font-weight: 600; font-size: 0.95rem; flex-shrink: 0; }
.form-input { flex: 1; padding: 0.6rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; outline: none; }
.form-input:focus { border-color: #07c160; }
.unit { font-size: 0.85rem; color: #888; width: 2rem; }
.generate-btn { padding: 0.75rem; background: #07c160; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
.generate-btn:disabled { background: #ccc; }
.results-area { padding: 0 1rem 1rem; }
.section-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; }
.compare-cards { display: flex; gap: 0.75rem; }
.compare-card { flex: 1; background: #fff; border-radius: 8px; padding: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.compare-card h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; padding-bottom: 0.35rem; border-bottom: 1px solid #f0f0f0; }
.compare-row { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.8rem; }
.compare-row strong { font-size: 0.85rem; }
.interest { color: #e74c3c; }
</style>
