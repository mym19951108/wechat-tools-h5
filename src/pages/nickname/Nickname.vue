<template>
  <div class="nickname-page">
    <ToolHeader title="网名生成" />
    <FollowGuide />

    <div class="form-area">
      <div class="style-grid">
        <button type="button"
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
          <button type="button" class="copy-btn" @click="copyName(name)">复制</button>
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
.form-area { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.style-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
.style-btn { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; padding: 0.75rem 0.5rem; border: 2px solid #eee; border-radius: 10px; background: #fff; cursor: pointer; }
.style-btn.active { border-color: #07c160; background: #f0faf4; }
.style-icon { font-size: 1.5rem; }
.style-name { font-size: 0.8rem; font-weight: 500; }
.generate-btn { padding: 0.75rem; background: #07c160; color: #fff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
.results-area { padding: 0 1rem 1rem; }
.name-list { display: flex; flex-direction: column; gap: 0.5rem; }
.name-card { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.name-text { font-size: 1.05rem; font-weight: 500; }
.copy-btn { padding: 0.3rem 0.8rem; background: #07c160; color: #fff; border: none; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }
</style>
