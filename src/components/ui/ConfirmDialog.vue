<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmType?: "primary" | "danger" | "success";
}

const props = withDefaults(defineProps<Props>(), {
  title: "确认操作",
  message: "",
  confirmText: "确定",
  cancelText: "取消",
  confirmType: "primary",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
  (e: "cancel"): void;
  (e: "close"): void;
}>();

const handleClose = () => {
  emit("update:modelValue", false);
  emit("close");
};

const handleConfirm = () => {
  emit("confirm");
  handleClose();
};

const handleCancel = () => {
  emit("cancel");
  handleClose();
};
</script>

<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="modelValue" class="confirm-overlay" @click="handleCancel">
        <div class="confirm-box" @click.stop>
          <div class="confirm-content">
            <div v-if="title || $slots.title" class="confirm-title">
              <slot name="title">{{ title }}</slot>
            </div>
            <div v-if="message || $slots.message" class="confirm-message">
              <slot name="message">{{ message }}</slot>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button
              class="confirm-btn confirm"
              :class="`confirm-${confirmType}`"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style lang="scss" scoped>
@use "sass:color";

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2500;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease-out;
}

.confirm-box {
  background: var(--modal-bg);
  border-radius: 8px;
  box-shadow: var(--modal-shadow);
  padding: 24px;
  width: 400px;
  max-width: 90%;
  text-align: center;
  animation: scaleIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.confirm-content {
  margin-bottom: 24px;
}

.confirm-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text);
}

.confirm-message {
  font-size: 0.95rem;
  color: var(--text);
  opacity: 0.8;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.confirm-btn {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  min-width: 80px;

  &.cancel {
    background: var(--btn-bg);
    color: var(--text);
    border: 1px solid var(--border);

    &:hover {
      background: var(--btn-hover);
    }
  }

  &.confirm {
    color: white;

    &.confirm-primary {
      background: var(--primary);

      &:hover {
        background: #5a52d5;
      }
    }

    &.confirm-danger {
      background: var(--accent);

      &:hover {
        background: #e55a5a;
      }
    }

    &.confirm-success {
      background: #10b981;

      &:hover {
        background: #0da271;
      }
    }
  }
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
