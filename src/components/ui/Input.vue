<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from "vue";

interface Props {
  modelValue?: string;
  type?: "text" | "number" | "email" | "password" | "search" | "tel" | "url";
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  width?: string;
  clearable?: boolean;
  changeDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  type: "text",
  placeholder: "",
  disabled: false,
  readonly: false,
  size: "md",
  width: "auto",
  clearable: false,
  changeDelay: 200,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "clear"): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
  (e: "change", value: string): void;
  (e: "enter", value: string): void;
}>();

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value),
});

const handleClear = () => {
  emit("update:modelValue", "");
  emit("clear");
};

const handleFocus = (event: FocusEvent) => emit("focus", event);

let changeTimer: ReturnType<typeof setTimeout> | null = null;

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit("update:modelValue", target.value);

  // 清除之前的定时器
  if (changeTimer) {
    clearTimeout(changeTimer);
  }

  // 设置新的定时器，延迟触发 change 事件
  changeTimer = setTimeout(() => {
    emit("change", target.value);
  }, props.changeDelay);
};
const handleEnter = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit("enter", target.value);
};

const handleBlur = (event: FocusEvent) => {
  // 失去焦点时立即触发 change 事件
  if (changeTimer) {
    clearTimeout(changeTimer);
    changeTimer = null;
  }
  const target = event.target as HTMLInputElement;
  emit("change", target.value);
  emit("blur", event);
};

const classes = computed(() => ({
  input: true,
  [`input-${props.size}`]: true,
  "input-disabled": props.disabled,
  "input-readonly": props.readonly,
}));

onBeforeUnmount(() => {
  if (changeTimer) {
    clearTimeout(changeTimer);
  }
});
</script>

<template>
  <div class="input-wrapper" :style="{ width: props.width }">
    <input
      :type="type"
      :value="inputValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :class="classes"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.enter="handleEnter"
    />
    <button
      v-if="clearable && inputValue && !disabled && !readonly"
      type="button"
      class="input-clear-btn"
      @click="handleClear"
    >
      ×
    </button>
  </div>
</template>

<style lang="scss" scoped>
.input-wrapper {
  position: relative;
  display: inline-block;
}

.input {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 0.85rem;
  transition: all 0.3s ease;
  width: 100%;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
    outline: none;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &.input-sm {
    padding: 6px 12px;
    font-size: 0.75rem;
  }

  &.input-md {
    padding: 8px 16px;
    font-size: 0.85rem;
  }

  &.input-lg {
    padding: 12px 20px;
    font-size: 1rem;
  }

  &.input-disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--btn-bg);
  }

  &.input-readonly {
    background: var(--bg-secondary);
  }
}

.input-clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text);
  opacity: 0.5;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px 8px;
  line-height: 1;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}
</style>
