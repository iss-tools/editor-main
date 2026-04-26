<script setup lang="ts">
import { watchEffect, ref } from "vue";

// 定义组件属性
const { activePanel } = defineProps({
  activePanel: {
    type: String,
    default: null,
  },
});
const active = ref(false);
const key = ref("manage");
// 定义事件
const emit = defineEmits(["panel-toggle"]);

// 菜单项配置
const menuItems = [
  { key: "manage", label: "文件管理" },
  { key: "chat", label: "AI 生成" },
  { key: "sync", label: "同步" },
  { key: "setting", label: "配置" },
  { key: "about", label: "关于" },
];
watchEffect(() => {
  active.value = activePanel ? true : false;
});
// 处理菜单项点击
const handleItemClick = (k: string) => {
  active.value = key.value == k ? !active.value : true;
  key.value = k;
  const text = menuItems.find((item) => item.key == k)?.label;
  emit("panel-toggle", active.value ? key.value : null, text);
};
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-menu">
      <button
        v-for="item in menuItems"
        :key="item.key"
        class="sidebar-item"
        :class="{ active: active && activePanel === item.key }"
        @click="handleItemClick(item.key)"
      >
        {{ item.label }}
      </button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  background: var(--bg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  // justify-content: center;
  align-items: center;
  padding: 6px;
  z-index: 1000;
  margin: 16px 0px 0px;
  border-radius: 4px;

  // 移除内联样式，使用 CSS 变量
  &.sidebar {
    // --sidebar-width: 80px;
    --sidebar-padding: 6px;
    --sidebar-gap: 8px;
  }
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-gap, 8px);
  padding: var(--sidebar-padding, 6px);
}

.sidebar-item {
  width: 100%;
  padding: 8px 12px;
  background: var(--btn-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text);
  text-align: center;
  transition: all 0.2s ease;

  // 使用 CSS 变量定义样式
  --item-hover-scale: 1.05;
  --item-active-scale: 0.95;
  --item-border-radius: 4px;
  --item-transition: all 0.2s ease;

  &:hover {
    background: var(--btn-hover);
    transform: scale(var(--item-hover-scale));
  }

  &:active {
    transform: scale(var(--item-active-scale));
  }

  &.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }
}
</style>
