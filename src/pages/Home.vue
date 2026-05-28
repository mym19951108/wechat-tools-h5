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
