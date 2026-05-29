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
.form-area { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: flex; align-items: center; gap: 0.75rem; }
.form-label { width: 4rem; font-weight: 600; font-size: 0.95rem; }
.form-input { flex: 1; padding: 0.6rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; outline: none; }
.form-input:focus { border-color: #07c160; }
.generate-btn { padding: 0.75rem; background: #07c160; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
.generate-btn:disabled { background: #ccc; }
.results-area { padding: 0 1rem 1rem; }
.results-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; }
.name-list { display: flex; flex-direction: column; gap: 0.5rem; }
.name-card { background: #fff; border-radius: 8px; padding: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.name-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
.name-text { font-size: 1.2rem; font-weight: 700; }
.name-gender { font-size: 1rem; }
.name-tag { display: inline-block; padding: 0.1rem 0.5rem; background: #e8f5e9; color: #07c160; border-radius: 4px; font-size: 0.7rem; margin-bottom: 0.35rem; }
.name-meaning { font-size: 0.8rem; color: #666; margin-bottom: 0.15rem; }
.name-origin { font-size: 0.7rem; color: #aaa; }
</style>
