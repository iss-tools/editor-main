<script setup lang="ts">
import { ref, computed, watch } from "vue";

interface Props {
  modelValue: string;
  options: { label: string; value: string }[];
  name?: string;
  /** 是否启用过滤功能 */
  filterable?: boolean;
  /** 是否允许添加新选项 */
  allowCreate?: boolean;
  /** 自定义选项创建函数 */
  createOption?: (value: string) => { label: string; value: string };
  /** 占位文本 */
  placeholder?: string;
  /** 过滤时的提示文本 */
  noMatchText?: string;
  /** 添加新选项时的提示文本 */
  addPromptText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: "select",
  filterable: false,
  allowCreate: false,
  placeholder: "请选择...",
  noMatchText: "未找到匹配选项",
  addPromptText: "按 Enter 添加新选项",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
  (e: "create", option: { label: string; value: string }): void;
  (e: "filter", query: string): void;
}>();

const searchText = ref("");
const showDropdown = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

// 计算过滤后的选项
const filteredOptions = computed(() => {
  if (!props.filterable || !searchText.value.trim()) {
    return props.options;
  }
  const query = searchText.value.toLowerCase();
  return props.options.filter(
    (option) =>
      option.label.toLowerCase().includes(query) ||
      option.value.toLowerCase().includes(query),
  );
});

// 检查当前输入是否匹配现有选项
const currentMatchedOption = computed(() => {
  if (!searchText.value.trim()) return null;
  const query = searchText.value.toLowerCase();
  return props.options.find(
    (option) =>
      option.label.toLowerCase() === query ||
      option.value.toLowerCase() === query,
  );
});

// 当前选中值的标签
const displayLabel = computed(() => {
  const option = props.options.find((o) => o.value === props.modelValue);
  return option ? option.label : "";
});

// 是否有可添加的新选项
const canCreateOption = computed(() => {
  return (
    props.allowCreate && searchText.value.trim() && !currentMatchedOption.value
  );
});

// 处理选择
const handleSelect = (value: string) => {
  emit("update:modelValue", value);
  emit("change", value);
  searchText.value = "";
  showDropdown.value = false;
};

// 处理输入
const handleInput = () => {
  if (props.filterable) {
    emit("filter", searchText.value);
  }
};

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value && event.key !== "Enter") return;

  switch (event.key) {
    case "Enter":
      event.preventDefault();
      if (canCreateOption.value) {
        createNewOption();
      } else if (filteredOptions.value.length > 0) {
        handleSelect(filteredOptions.value[0].value);
      }
      break;
    case "Escape":
      showDropdown.value = false;
      searchText.value = "";
      break;
    case "ArrowDown":
      event.preventDefault();
      showDropdown.value = true;
      break;
    case "ArrowUp":
      event.preventDefault();
      showDropdown.value = true;
      break;
  }
};

// 创建新选项
const createNewOption = () => {
  const value = searchText.value.trim();
  if (!value) return;

  let newOption: { label: string; value: string };
  if (props.createOption) {
    newOption = props.createOption(value);
  } else {
    newOption = { label: value, value };
  }

  emit("create", newOption);
  handleSelect(newOption.value);
};

// 获取输入框值
const getInputValue = (e: Event): string => {
  return (e.target as HTMLInputElement).value;
};

// 获取 select 值
const getSelectValue = (e: Event): string => {
  return (e.target as HTMLSelectElement).value;
};

// 点击外部关闭下拉
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".select-dropdown")) {
    showDropdown.value = false;
  }
};

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (value) => {
    // 当模型值变化时，更新显示文本
    const option = props.options.find((o) => o.value === value);
    if (option && props.filterable) {
      searchText.value = option.label;
    }
  },
  { immediate: true },
);

// 绑定文档点击事件
if (typeof window !== "undefined") {
  watch(showDropdown, (visible) => {
    if (visible) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
  });
}
</script>

<template>
  <div class="select-dropdown" @click="showDropdown = !showDropdown">
    <!-- 输入框 -->
    <input
      v-if="filterable"
      ref="inputRef"
      type="text"
      :name="name"
      :placeholder="placeholder"
      :value="searchText"
      @input="
        (e) => {
          searchText = getInputValue(e);
          handleInput();
          showDropdown = true;
        }
      "
      @keydown="handleKeydown"
      @focus="showDropdown = true"
      autocomplete="off"
      class="select-input"
    />
    <!-- 非过滤模式使用自定义下拉，隐藏原生 select -->
    <div v-else class="select-display">
      <span>{{ displayLabel }}</span>
    </div>

    <!-- 下拉列表 -->
    <div v-show="showDropdown" class="select-options" @click.stop>
      <!-- 过滤后的选项 -->
      <div
        v-for="option in filteredOptions"
        :key="option.value"
        class="select-option"
        :class="{ selected: option.value === modelValue }"
        @click="handleSelect(option.value)"
      >
        {{ option.label }}
      </div>

      <!-- 无匹配项提示 -->
      <div v-if="filteredOptions.length === 0 && searchText" class="no-match">
        {{ noMatchText }}
      </div>

      <!-- 添加新选项提示 -->
      <div
        v-if="canCreateOption"
        class="create-option"
        @click="createNewOption"
      >
        + {{ addPromptText }} "{{ searchText }}"
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.select-dropdown {
  position: relative;
  display: inline-block;
  width: 100%;
}

.select-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--text);
  background: var(--bg);
  cursor: pointer;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--accent, #4a90d9);
  }
}

.select-display {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--text);
  background: var(--bg);
  cursor: pointer;
  box-sizing: border-box;
  line-height: 1.5;
  min-height: 36px;
  display: flex;
  align-items: center;
  position: relative;

  &:hover {
    border-color: var(--accent, #4a90d9);
  }

  &::after {
    content: "";
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #666;
  }
}

.select-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg);
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.select-option {
  padding: 8px 12px;
  line-height: 1.5;
  min-height: 36px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: rgba(var(--accent-rgb, 74, 154, 217), 0.1);
  }

  &.selected {
    background: rgba(var(--accent-rgb, 74, 154, 217), 0.2);
    color: var(--accent, #4a90d9);
  }
}

.no-match {
  padding: 8px 12px;
  line-height: 1.5;
  min-height: 36px;
  display: flex;
  align-items: center;
  color: #999;
  font-size: 0.85rem;
}

.create-option {
  padding: 8px 12px;
  line-height: 1.5;
  min-height: 36px;
  display: flex;
  align-items: center;
  color: var(--accent, #4a90d9);
  font-size: 0.85rem;
  cursor: pointer;
  border-top: 1px solid #eee;

  &:hover {
    background: rgba(var(--accent-rgb, 74, 154, 217), 0.1);
  }
}
</style>
