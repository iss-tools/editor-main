<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import {
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-vue-next";

interface Props {
  content: string;
  duration?: number;
  isStreaming?: boolean;
}

const props = defineProps<Props>();

const isCollapsed = ref(true);
const copied = ref(false);
const contentRef = ref<HTMLDivElement | null>(null);

// 解析 Markdown 内容
interface MarkdownPart {
  type: "bold" | "code" | "text";
  text: string;
  key: string;
}

interface MarkdownLine {
  type: "h1" | "h2" | "h3" | "list" | "numbered" | "quote" | "empty" | "text";
  content?: MarkdownPart[];
  number?: string;
  key: string;
}

const parseMarkdown = (content: string): MarkdownLine[] => {
  if (!content) return [];

  const lines = content.split("\n");

  const formatInline = (text: string): MarkdownPart[] => {
    const parts: MarkdownPart[] = [];
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    boldParts.forEach((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        parts.push({ type: "bold", text: part.slice(2, -2), key: `b-${i}` });
      } else {
        const codeParts = part.split(/(`.*?`)/g);
        codeParts.forEach((cp, j) => {
          if (cp.startsWith("`") && cp.endsWith("`")) {
            parts.push({
              type: "code",
              text: cp.slice(1, -1),
              key: `c-${i}-${j}`,
            });
          } else if (cp) {
            parts.push({ type: "text", text: cp, key: `t-${i}-${j}` });
          }
        });
      }
    });
    return parts;
  };

  return lines.map((line, lineIndex) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      return {
        type: "h3",
        content: formatInline(trimmed.substring(4)),
        key: `h3-${lineIndex}`,
      };
    }
    if (trimmed.startsWith("## ")) {
      return {
        type: "h2",
        content: formatInline(trimmed.substring(3)),
        key: `h2-${lineIndex}`,
      };
    }
    if (trimmed.startsWith("# ")) {
      return {
        type: "h1",
        content: formatInline(trimmed.substring(2)),
        key: `h1-${lineIndex}`,
      };
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return {
        type: "list",
        content: formatInline(trimmed.substring(2)),
        key: `l-${lineIndex}`,
      };
    }
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return {
        type: "numbered",
        number: numMatch[1],
        content: formatInline(numMatch[2]),
        key: `n-${lineIndex}`,
      };
    }
    if (trimmed.startsWith("> ")) {
      return {
        type: "quote",
        content: formatInline(trimmed.substring(2)),
        key: `q-${lineIndex}`,
      };
    }
    if (!trimmed) {
      return { type: "empty", key: `e-${lineIndex}` };
    }
    return { type: "text", content: formatInline(line), key: `r-${lineIndex}` };
  });
};

const markdownLines = computed(() => parseMarkdown(props.content));

// Auto-expand and scroll while streaming
watch(
  () => props.isStreaming,
  (val) => {
    if (val) {
      isCollapsed.value = false;
      nextTick(() => {
        if (contentRef.value) {
          contentRef.value.scrollTop = contentRef.value.scrollHeight;
        }
      });
    } else {
      isCollapsed.value = true;
    }
  },
);

// Auto-scroll when content updates and is expanded
watch([() => props.content, isCollapsed, () => props.isStreaming], () => {
  if (!isCollapsed.value && props.isStreaming && contentRef.value) {
    contentRef.value.scrollTop = contentRef.value.scrollHeight;
  }
});

const handleCopy = async (e: MouseEvent) => {
  e.stopPropagation();
  try {
    await navigator.clipboard.writeText(props.content);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};

// 渲染单个 Markdown 部分的组件
const renderParts = (parts: MarkdownPart[] | undefined) => parts;

const renderLineContent = (line: MarkdownLine) => {
  if (!line.content) return null;
  return line.content.map((part) => ({ part, line }));
};
</script>

<template>
  <div
    class="mb-2 rounded-lg border border-border bg-surface/50 overflow-hidden w-full group"
  >
    <button
      @click="isCollapsed = !isCollapsed"
      class="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-surface transition-colors"
    >
      <div class="flex items-center gap-2 text-muted-foreground">
        <Loader2 v-if="isStreaming" class="h-3.5 w-3.5 animate-spin" />
        <Brain v-else class="h-3.5 w-3.5" />
        <span class="font-medium">
          {{ duration ? `思考过程 (${duration.toFixed(1)}s)` : "思考中..." }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="!isStreaming"
          @click="handleCopy"
          class="p-1 hover:bg-background rounded cursor-pointer mr-2 text-muted-foreground hover:text-foreground transition-colors z-10"
          title="复制"
          type="button"
        >
          <Check v-if="copied" class="h-3.5 w-3.5 text-green-500" />
          <Copy v-else class="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <ChevronRight
          v-if="isCollapsed"
          class="h-3.5 w-3.5 text-muted-foreground"
        />
        <ChevronDown v-else class="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </button>

    <div v-if="!isCollapsed" class="border-t border-border px-3 py-2 w-full">
      <div
        ref="contentRef"
        class="prose prose-xs max-w-none text-muted-foreground font-mono text-xs max-h-60 overflow-y-auto custom-scrollbar w-full"
      >
        <div class="space-y-1 text-xs leading-relaxed">
          <!-- h3 -->
          <h3
            v-for="line in markdownLines.filter((l) => l.type === 'h3')"
            :key="line.key"
            class="font-bold text-foreground mt-2 mb-1"
          >
            <span v-for="item in renderLineContent(line)" :key="item.part.key">
              <strong
                v-if="item.part.type === 'bold'"
                class="font-semibold text-foreground"
                >{{ item.part.text }}</strong
              >
              <code
                v-else-if="item.part.type === 'code'"
                class="bg-muted px-1 py-0.5 rounded text-[10px] font-mono text-primary"
                >{{ item.part.text }}</code
              >
              <span v-else>{{ item.part.text }}</span>
            </span>
          </h3>
          <!-- h2 -->
          <h2
            v-for="line in markdownLines.filter((l) => l.type === 'h2')"
            :key="line.key"
            class="font-bold text-foreground mt-3 mb-1"
          >
            <span v-for="item in renderLineContent(line)" :key="item.part.key">
              <strong
                v-if="item.part.type === 'bold'"
                class="font-semibold text-foreground"
                >{{ item.part.text }}</strong
              >
              <code
                v-else-if="item.part.type === 'code'"
                class="bg-muted px-1 py-0.5 rounded text-[10px] font-mono text-primary"
                >{{ item.part.text }}</code
              >
              <span v-else>{{ item.part.text }}</span>
            </span>
          </h2>
          <!-- h1 -->
          <h1
            v-for="line in markdownLines.filter((l) => l.type === 'h1')"
            :key="line.key"
            class="font-bold text-base text-foreground mt-4 mb-2"
          >
            <span v-for="item in renderLineContent(line)" :key="item.part.key">
              <strong
                v-if="item.part.type === 'bold'"
                class="font-semibold text-foreground"
                >{{ item.part.text }}</strong
              >
              <code
                v-else-if="item.part.type === 'code'"
                class="bg-muted px-1 py-0.5 rounded text-[10px] font-mono text-primary"
                >{{ item.part.text }}</code
              >
              <span v-else>{{ item.part.text }}</span>
            </span>
          </h1>
          <!-- list -->
          <div
            v-for="line in markdownLines.filter((l) => l.type === 'list')"
            :key="line.key"
            class="flex gap-2 ml-1"
          >
            <span class="text-muted-foreground flex-shrink-0">•</span>
            <span>
              <span
                v-for="item in renderLineContent(line)"
                :key="item.part.key"
              >
                <strong
                  v-if="item.part.type === 'bold'"
                  class="font-semibold text-foreground"
                  >{{ item.part.text }}</strong
                >
                <code
                  v-else-if="item.part.type === 'code'"
                  class="bg-muted px-1 py-0.5 rounded text-[10px] font-mono text-primary"
                  >{{ item.part.text }}</code
                >
                <span v-else>{{ item.part.text }}</span>
              </span>
            </span>
          </div>
          <!-- numbered -->
          <div
            v-for="line in markdownLines.filter((l) => l.type === 'numbered')"
            :key="line.key"
            class="flex gap-2 ml-1"
          >
            <span class="text-muted-foreground flex-shrink-0"
              >{{ line.number }}.</span
            >
            <span>
              <span
                v-for="item in renderLineContent(line)"
                :key="item.part.key"
              >
                <strong
                  v-if="item.part.type === 'bold'"
                  class="font-semibold text-foreground"
                  >{{ item.part.text }}</strong
                >
                <code
                  v-else-if="item.part.type === 'code'"
                  class="bg-muted px-1 py-0.5 rounded text-[10px] font-mono text-primary"
                  >{{ item.part.text }}</code
                >
                <span v-else>{{ item.part.text }}</span>
              </span>
            </span>
          </div>
          <!-- quote -->
          <div
            v-for="line in markdownLines.filter((l) => l.type === 'quote')"
            :key="line.key"
            class="border-l-2 border-primary/50 pl-2 italic text-muted-foreground my-1"
          >
            <span v-for="item in renderLineContent(line)" :key="item.part.key">
              <strong
                v-if="item.part.type === 'bold'"
                class="font-semibold text-foreground"
                >{{ item.part.text }}</strong
              >
              <code
                v-else-if="item.part.type === 'code'"
                class="bg-muted px-1 py-0.5 rounded text-[10px] font-mono text-primary"
                >{{ item.part.text }}</code
              >
              <span v-else>{{ item.part.text }}</span>
            </span>
          </div>
          <!-- empty -->
          <div
            v-for="line in markdownLines.filter((l) => l.type === 'empty')"
            :key="line.key"
            class="h-1"
          />
          <!-- text -->
          <div
            v-for="line in markdownLines.filter((l) => l.type === 'text')"
            :key="line.key"
          >
            <span v-for="item in renderLineContent(line)" :key="item.part.key">
              <strong
                v-if="item.part.type === 'bold'"
                class="font-semibold text-foreground"
                >{{ item.part.text }}</strong
              >
              <code
                v-else-if="item.part.type === 'code'"
                class="bg-muted px-1 py-0.5 rounded text-[10px] font-mono text-primary"
                >{{ item.part.text }}</code
              >
              <span v-else>{{ item.part.text }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
