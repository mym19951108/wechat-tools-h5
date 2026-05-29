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
          <button type="button" :class="['gender-btn', { active: gender === 'boy' }]" @click="gender = 'boy'">男孩</button>
          <button type="button" :class="['gender-btn', { active: gender === 'girl' }]" @click="gender = 'girl'">女孩</button>
          <button type="button" :class="['gender-btn', { active: gender === 'any' }]" @click="gender = 'any'">不限</button>
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
