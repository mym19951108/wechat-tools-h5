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
