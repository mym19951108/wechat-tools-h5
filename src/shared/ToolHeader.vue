<template>
  <header class="tool-header">
    <button class="back-btn" @click="goBack" v-if="showBack">&#8592;</button>
    <h2 class="tool-title">{{ title }}</h2>
    <div class="header-spacer"></div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  showBack: { type: Boolean, default: true }
})

const router = useRouter()
const goBack = () => router.back()
</script>

<style scoped>
.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}
.tool-title {
  font-size: 1.1rem;
  font-weight: 600;
}
.back-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: #07c160;
}
.header-spacer {
  width: 2rem;
}
</style>
