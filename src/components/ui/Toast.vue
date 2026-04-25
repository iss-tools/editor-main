<script setup lang="ts">
import { computed, watch } from "vue";

interface Props {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: "info",
  duration: 2500,
  position: "bottom-right",
  show: false,
});

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "close"): void;
}>();

// 监听 show 变化，自动关闭
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      setTimeout(() => {
        emit("update:show", false);
      }, props.duration);
    }
  },
);

const classes = computed(() => ({
  toast: true,
  [`toast-${props.type}`]: true,
  [`toast-${props.position}`]: true,
}));

const handleClose = () => {
  emit("update:show", false);
  emit("close");
};
</script>

<template>
  <transition name="toast">
    <div v-show="show" :class="classes" @click="handleClose">
      <span class="toast-icon">{{
        type === "success"
          ? "✓"
          : type === "error"
            ? "✕"
            : type === "warning"
              ? "⚠"
              : "ℹ"
      }}</span>
      <span class="toast-message">{{ message }}</span>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.toast {
  position: fixed;
  padding: 14px 24px;
  background: var(--toast-bg);
  color: var(--toast-text);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 3000;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  min-width: 200px;
  max-width: 400px;

  &.toast-success {
    border-left: 4px solid #10b981;
  }

  &.toast-error {
    border-left: 4px solid #ef4444;
  }

  &.toast-warning {
    border-left: 4px solid #f59e0b;
  }

  &.toast-info {
    border-left: 4px solid var(--primary);
  }

  &.toast-top-left {
    top: 20px;
    left: 20px;
  }

  &.toast-top-center {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.toast-top-right {
    top: 20px;
    right: 20px;
  }

  &.toast-bottom-left {
    bottom: 20px;
    left: 20px;
  }

  &.toast-bottom-center {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.toast-bottom-right {
    bottom: 20px;
    right: 20px;
  }
}

.toast-icon {
  font-size: 1rem;
  line-height: 1;
}

.toast-message {
  flex: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
