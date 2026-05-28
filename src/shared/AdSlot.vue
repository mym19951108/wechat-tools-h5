<template>
  <div class="ad-slot">
    <div class="ad-placeholder">
      <span class="ad-label">广告位</span>
      <span class="ad-hint">关注公众号支持我们</span>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.ad-slot {
  margin: 1rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  text-align: center;
  border: 1px dashed #ddd;
}
.ad-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.ad-label {
  font-size: 0.75rem;
  color: #999;
}
.ad-hint {
  font-size: 0.85rem;
  color: #07c160;
}
</style>
