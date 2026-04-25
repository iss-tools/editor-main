<script setup lang="ts">
interface Props {
  modelValue: string;
  options: { label: string; value: string }[];
  name?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: "radio",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const handleChange = (value: string) => {
  emit("update:modelValue", value);
};
</script>

<template>
  <div class="radio-group">
    <label v-for="option in options" :key="option.value" class="radio-item">
      <img class="radio-icon" :src="option.icon" v-if="option.icon" alt="" />
      <input
        type="radio"
        :name="name"
        :value="option.value"
        :checked="modelValue === option.value"
        @change="handleChange(option.value)"
      />
      <span class="radio-label">{{ option.label || option.text }}</span>
    </label>
  </div>
</template>

<style lang="scss" scoped>
.radio-group {
  display: flex;
  flex-direction: row;
  gap: 10px;
  flex-wrap: wrap;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="radio"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--accent, #4a90d9);
  }

  .radio-label {
    font-size: 0.9rem;
    color: var(--text);
    user-select: none;
  }
  .radio-icon {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    .radio-label {
      color: var(--accent, #4a90d9);
    }
  }
}
</style>
