<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "warning"
    | "ghost";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "secondary",
  size: "md",
  type: "button",
  disabled: false,
  loading: false,
  block: false,
});

const classes = computed(() => ({
  btn: true,
  [`btn-${props.variant}`]: true,
  [`btn-${props.size}`]: true,
  "btn-block": props.block,
  "btn-disabled": props.disabled || props.loading,
  "btn-loading": props.loading,
}));
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading">
    <span v-if="loading" class="btn-spinner"></span>
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped>
.btn {
  // padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--border);
  background: var(--btn-bg);
  color: var(--text);
  white-space: nowrap;

  &:hover:not(.btn-disabled) {
    transform: scale(1.02);
  }

  &.btn-primary:hover:not(.btn-disabled) {
    background: var(--primary);
    color: white;
  }

  &.btn-secondary:hover:not(.btn-disabled) {
    background: var(--secondary);
    color: white;
  }

  &.btn-danger:hover:not(.btn-disabled) {
    background: var(--accent);
    color: white;
  }

  &.btn-success:hover:not(.btn-disabled) {
    background: #10b981;
    color: white;
  }

  &.btn-warning:hover:not(.btn-disabled) {
    background: #f59e0b;
    color: white;
  }

  &.btn-ghost {
    background: transparent;
    border-color: transparent;

    &:hover:not(.btn-disabled) {
      background: var(--btn-hover);
    }
  }

  &.btn-sm {
    padding: 6px 12px;
    font-size: 0.75rem;
  }

  &.btn-md {
    padding: 8px 16px;
    font-size: 0.85rem;
  }

  &.btn-lg {
    padding: 12px 24px;
    font-size: 1rem;
  }

  &.btn-block {
    width: 100%;
  }
  &.p0 {
    padding: 0;
  }
  &.btn-disabled,
  &.btn-loading {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
