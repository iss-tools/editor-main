<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Loader2,
  Play,
} from "lucide-vue-next";

interface Props {
  code: string;
  language?: "xml" | "json" | "mermaid";
  isStreaming?: boolean;
  duration?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  applyCode: [code: string];
}>();

const isCollapsed = ref(false);
const copied = ref(false);

// Auto-expand while streaming
watch(
  () => props.isStreaming,
  (val) => {
    if (val) {
      isCollapsed.value = false;
    } else {
      isCollapsed.value = true;
    }
  },
);

const handleCopy = async (e: MouseEvent) => {
  e.stopPropagation();
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

const handleApply = (e: MouseEvent) => {
  e.stopPropagation();
  emit("applyCode", props.code);
};
</script>

<template>
  <div
    class="mb-2 rounded-lg border border-border bg-surface overflow-hidden shadow-sm group w-full"
  >
    <button
      @click="isCollapsed = !isCollapsed"
      class="flex w-full items-center justify-between px-3 py-1.5 text-xs bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div class="flex items-center gap-2 text-foreground">
        <Code2 class="h-3.5 w-3.5" />
        <span class="font-medium">
          {{ isStreaming ? "生成代码中..." : "代码生成" }}
          <span
            v-if="duration && !isStreaming"
            class="text-xs text-muted-foreground ml-1 font-normal"
          >
            ({{ duration.toFixed(1) }}s)
          </span>
        </span>
      </div>
      <div class="flex items-center gap-2">
        <!-- Copy Button -->
        <button
          v-if="!isStreaming"
          @click="handleCopy"
          class="p-1 hover:bg-background rounded cursor-pointer text-muted-foreground hover:text-foreground transition-colors z-10"
          title="复制代码"
          type="button"
        >
          <Check v-if="copied" class="h-3.5 w-3.5 text-green-500" />
          <Copy v-else class="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <!-- Apply Button -->
        <button
          v-if="!isStreaming"
          @click="handleApply"
          class="p-1 hover:bg-background rounded cursor-pointer text-muted-foreground hover:text-primary transition-colors z-10"
          title="应用代码"
          type="button"
        >
          <Play class="h-3.5 w-3.5" />
        </button>

        <Loader2
          v-if="isStreaming"
          class="animate-spin text-primary h-3 w w-3"
        />
        <ChevronRight
          v-if="isCollapsed"
          class="h-3.5 w-3.5 text-muted-foreground"
        />
        <ChevronDown v-else class="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </button>

    <div v-if="!isCollapsed" class="relative w-full">
      <pre
        class="w-full max-h-[300px] overflow-y-auto p-3 text-xs font-mono bg-muted/20 text-foreground whitespace-pre-wrap break-all"
      ><code>{{ code }}</code></pre>
      <!-- Language badge -->
      <div
        class="absolute top-2 right-2 text-[10px] text-muted-foreground bg-surface/80 px-1.5 py-0.5 rounded border border-border z-10 pointer-events-none"
      >
        {{ language?.toUpperCase() }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
pre::-webkit-scrollbar {
  width: 6px;
}

pre::-webkit-scrollbar-track {
  background: transparent;
}

pre::-webkit-scrollbar-thumb {
  background: rgba(121, 121, 121, 0.4);
  border-radius: 3px;
}

pre::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 100, 100, 0.7);
}
</style>
