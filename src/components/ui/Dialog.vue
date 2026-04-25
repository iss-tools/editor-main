<script setup lang="ts">
import { computed, watch } from "vue";

interface Props {
  modelValue: boolean;
  title?: string;
  width?: string | number;
  height?: string | number;
  closable?: boolean;
  showClose?: boolean;
  center?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  width: "80%",
  height: "70%",
  closable: true,
  showClose: true,
  center: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
  (e: "open"): void;
}>();

const classes = computed(() => ({
  "dialog-overlay": true,
  "dialog-center": props.center,
}));

const handleClose = () => {
  emit("update:modelValue", false);
  emit("close");
};

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget && props.closable) {
    handleClose();
  }
};

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      emit("open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  },
  { immediate: true },
);
</script>

<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="modelValue" :class="classes" @click="handleOverlayClick">
        <div
          class="dialog-box"
          :style="{ width: props.width, height: props.height }"
          @click.stop
        >
          <div v-if="$slots.header || title" class="dialog-header">
            <slot name="header">
              <div class="dialog-title">{{ title }}</div>
            </slot>
            <button
              v-if="showClose"
              type="button"
              class="dialog-close"
              @click="handleClose"
            >
              ×
            </button>
          </div>
          <div class="dialog-body">
            <slot></slot>
          </div>
          <div v-if="$slots.footer" class="dialog-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease-out;
}

.dialog-center {
  justify-content: center;
  align-items: center;
}

.dialog-box {
  background: var(--modal-bg);
  border-radius: 8px;
  box-shadow: var(--modal-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.4s ease-out;
  max-width: 95%;
  max-height: 95%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.dialog-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text);
  transition: transform 0.2s;
  padding: 4px 8px;
  line-height: 1;

  &:hover {
    transform: rotate(90deg);
    color: var(--accent);
  }
}

.dialog-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: auto;
}

.dialog-footer {
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-fade-enter-from {
  opacity: 0;
}

.dialog-fade-leave-to {
  opacity: 0;
}
</style>
