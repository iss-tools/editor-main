<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import {
  ArrowLeftToLine,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  ImagePlus,
  Link,
  Loader2,
  MessageSquarePlus,
  MoveRight,
  RotateCcw,
  Send,
  User,
  X,
  ZoomIn,
} from "lucide-vue-next";
import Button from "@/components/ui/Button.vue";
import ThoughtBlock from "./ThoughtBlock.vue";
import CodeBlock from "./CodeBlock.vue";
import Dropdown from "@/components/ui/Dropdown.vue";
import { chatMessageStore, providerDb } from "../../db/index";
import { AIProvider, ChatMessage, IFile } from "../../db/types";
import { chatWithAI, parseSSEStream, type ChatChunk } from "../../api/ChatApi";
// 类型定义
interface Attachment {
  type: "image" | "document" | "url";
  dataUrl?: string;
  content?: string;
  fileName?: string;
  url?: string;
  title?: string;
}

interface MessageMetrics {
  startTime?: number;
  endTime?: number;
  planEndTime?: number;
}

interface Message extends Omit<ChatMessage, "fileId"> {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: string;
  code?: string;
  attachments?: Attachment[];
  status: "pending" | "streaming" | "complete" | "error";
  metrics?: MessageMetrics;
}

interface Props {
  onCollapse?: () => void;
  onApplyCode?: (code: string) => void;
  file?: IFile;
  prompt?: string;
}

const props = defineProps<Props>();

// 状态
const inputValue = ref("");
const attachments = ref<Attachment[]>([]);
const isProcessingFile = ref(false);
const showUrlInput = ref(false);
const urlInputValue = ref("");
const isParsingUrl = ref(false);
const messagesEndRef = ref<HTMLDivElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
// AI 供应商选择状态
const selectedProvider = ref<string>("");

// AI 供应商配置列表
const providerConfigs = ref<AIProvider[]>([]);

// 加载 AI 供应商配置和聊天记录
onMounted(async () => {
  providerConfigs.value = await providerDb.getList({});

  // 如果有文件 ID 则加载聊天记录
  if (props.file?.id) {
    const fileId = String(props.file.id);
    const savedMessages = await chatMessageStore.getMessagesByFileId(fileId);
    messages.value = savedMessages.reverse().map((msg) => ({
      ...msg,
      id: String(msg.id),
      attachments: msg.attachments || undefined,
    }));
    isEmpty.value = messages.value.length === 0;
  } else {
    // 没有文件 ID 时清空消息
    messages.value = [];
    isEmpty.value = true;
  }
});

// 处理 AI 供应商选择
const handleProviderSelect = (value: string) => {
  selectedProvider.value = value;
};

// 图片放大相关
const showImageModal = ref(false);
const currentImageUrl = ref("");
const currentImageAlt = ref("");

// 模拟消息数据（实际项目中应从 store 获取）
const messages = ref<Message[]>([]);
const isStreaming = ref(false);
const isEmpty = ref(true);

// 复制状态跟踪
const copiedMessages = ref<Set<string>>(new Set());

// 自动滚动到底部
watch(
  () => messages.value,
  () => {
    nextTick(() => {
      messagesEndRef.value?.scrollIntoView({ behavior: "smooth" });
    });
  },
  { deep: true },
);

// 自动调整 textarea 高度
watch(inputValue, () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = "auto";
      textareaRef.value.style.height =
        Math.min(textareaRef.value.scrollHeight, 200) + "px";
    }
  });
});

// 处理图片上传
const handleImageUpload = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        attachments.value.push({
          type: "image",
          dataUrl,
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("图片处理失败:", err);
    }
  };
  input.click();
};

// 处理文档上传
const handleDocumentUpload = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".doc,.docx,.txt,.md";
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        attachments.value.push({
          type: "document",
          content,
          fileName: file.name,
        });
      };
      reader.readAsText(file);
    } catch (err) {
      console.error("文档处理失败:", err);
    }
  };
  input.click();
};

// 移除附件
const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1);
};

// 打开 URL 链接
// const openUrl = (url: string) => {
//   window.open(url, "_blank", "noopener,noreferrer");
// };

// 处理 URL 提交
const handleUrlSubmit = async () => {
  const url = urlInputValue.value.trim();
  if (!url) return;
  isParsingUrl.value = true;
  try {
    // 调用 API 获取网页内容
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      url: url,
      format: "markdown",
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow" as RequestRedirect,
    };

    const response = await fetch(
      "https://api-proxy.aminigedoufu.dpdns.org/readability",
      requestOptions,
    );
    const result = await response.json();

    if (result.code === 200 && result.data) {
      attachments.value.push({
        type: "url",
        url,
        title: result.data.title || url,
        content: result.data.content || url,
      });
      urlInputValue.value = "";
      showUrlInput.value = false;
    } else {
      console.error("接口返回错误:", result);
    }
  } catch (err) {
    console.error("链接解析失败:", err);
  } finally {
    isParsingUrl.value = false;
  }
};

// 复制用户消息
const handleCopyUserMessage = async (messageId: string, text: string) => {
  const toCopy = text?.trim();
  if (!toCopy) return;
  try {
    await navigator.clipboard.writeText(toCopy);
    copiedMessages.value.add(messageId);
    setTimeout(() => {
      copiedMessages.value.delete(messageId);
    }, 2000);
  } catch (err) {
    console.error("复制失败:", err);
  }
};

// 获取最后一条 assistant 消息的 ID
const lastAssistantMessageId = computed(() => {
  return [...messages.value].reverse().find((m) => m.role === "assistant")?.id;
});

// 发送消息
const handleSend = async () => {
  const message = inputValue.value.trim();
  if ((!message && attachments.value.length === 0) || isStreaming.value) return;

  const currentAttachments =
    attachments.value.length > 0 ? [...attachments.value] : undefined;

  // 添加用户消息
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: "user",
    content: message,
    attachments: JSON.parse(JSON.stringify(currentAttachments || [])),
    status: "complete",
  };
  messages.value.push(userMessage);

  // 如果有文件 ID 则保存用户消息到数据库
  if (props.file?.id) {
    const fileId = String(props.file.id);
    await chatMessageStore.save({
      ...userMessage,
      fileId,
    });
  }

  inputValue.value = "";
  attachments.value = [];
  isStreaming.value = true;

  // 构建系统提示词
  const systemMessage = {
    role: "system" as const,
    content: props.prompt || "你是一个专业的白板图生成助手。",
  };

  // 构建用户消息（包含附件内容）
  let userContentParts = [];
  if (message) {
    userContentParts.push({ type: "text", text: `User request: ${message}` });
  }
  // 处理附件内容
  if (currentAttachments) {
    for (const att of currentAttachments) {
      if (att.type === "image" && att.dataUrl) {
        userContentParts.push({
          type: "image_url",
          image_url: { url: att.dataUrl },
        });
      } else if (att.type === "document" && att.content) {
        userContentParts.push({
          type: "text",
          text: `文档内容：\n${att.content}`,
        });
      } else if (att.type === "url" && att.content) {
        userContentParts.push({
          type: "text",
          text: `URL 内容：\n${att.content}`,
        });
      }
    }
  }

  const userMsg = {
    role: "user" as const,
    content: userContentParts.length > 1 ? (userContentParts as any) : message,
  } as const;

  // 获取选中的 AI 供应商配置
  const providerConfig = selectedProvider.value
    ? providerConfigs.value.find((p) => p.id === selectedProvider.value)
    : providerConfigs.value[0];

  if (!providerConfig) {
    const errorMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: "请先选择 AI 供应商配置",
      status: "error",
    };
    messages.value.push(errorMsg);
    isStreaming.value = false;
    return;
  }

  // 创建助手消息占位符
  const assistantMessageId = `assistant-${Date.now()}`;
  const assistantMessage: Message = {
    id: assistantMessageId,
    role: "assistant",
    content: "",
    plan: "",
    code: "",
    status: "streaming",
    metrics: {
      startTime: Date.now(),
    },
  };
  messages.value.push(assistantMessage);

  // 调用 AI 聊天接口
  try {
    const response = await chatWithAI({
      apiKey: providerConfig.apiKey,
      baseUrl:
        providerConfig.apiUrl || "https://api-inference.modelscope.cn/v1",
      provider: providerConfig.type,
      modelId: providerConfig.model,
      messages: [systemMessage, userMsg],
      stream: true,
    });

    let fullContent = "";
    let reasoningContent = "";

    // 移除 markdown 代码块标记的工具函数
    const extractRawCode = (content: string): string => {
      // 如果没有匹配到代码块标记，移除开头的 ```xxx 和结尾的 ```
      let result = content.trim();
      result = result.replace(/^```\w*\s*/, "");
      result = result.replace(/```$/, "");
      return result.trim();
    };

    await parseSSEStream(
      response,
      (chunk: ChatChunk) => {
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) return;

        // 处理推理内容（思维链）
        if (delta.reasoning_content) {
          reasoningContent += delta.reasoning_content;
          assistantMessage.plan = reasoningContent;
        }

        // 处理主要内容 - 直接使用 AI 响应的原始内容
        if (delta.content) {
          fullContent += delta.content;
          assistantMessage.content = fullContent;
          // 移除 markdown 代码块标记后作为代码
          assistantMessage.code = extractRawCode(fullContent);
        }
      },
      () => {
        // 完成回调 - 移除 markdown 代码块标记后作为代码
        assistantMessage.code = extractRawCode(fullContent);
        assistantMessage.status = "complete";
        assistantMessage.metrics!.endTime = Date.now();
        isStreaming.value = false;
        handleApplyCode(assistantMessage.code);
        // 保存到数据库
        if (props.file?.id) {
          const fileId = String(props.file.id);
          chatMessageStore.save({
            ...assistantMessage,
            fileId,
          });
        }
      },
      (error) => {
        // 错误回调
        console.error("流式请求失败:", error);
        assistantMessage.status = "error";
        assistantMessage.content =
          assistantMessage.content + `\n\n错误：${error.message}`;
        isStreaming.value = false;

        if (props.file?.id) {
          const fileId = String(props.file.id);
          chatMessageStore.save({
            ...assistantMessage,
            fileId,
          });
        }
      },
    );
  } catch (error) {
    console.error("AI 请求失败:", error);
    assistantMessage.status = "error";
    assistantMessage.content =
      assistantMessage.content +
      `\n\n请求失败：${error instanceof Error ? error.message : "未知错误"}`;
    isStreaming.value = false;

    if (props.file?.id) {
      const fileId = String(props.file.id);
      chatMessageStore.save({
        ...assistantMessage,
        fileId,
      });
    }
  }
};

// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

// 处理粘贴
const handlePaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  const itemsArray = Array.from(items);
  for (const item of itemsArray) {
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file && file.type.startsWith("image/")) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          attachments.value.push({
            type: "image",
            dataUrl,
            fileName: `pasted-image-${Date.now()}.png`,
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }
};

// 获取状态显示
const getStatusDisplay = (status: string) => {
  switch (status) {
    case "pending":
      return { text: "等待中...", icon: "loader" };
    case "streaming":
      return { text: "AI 思考中...", icon: "loader" };
    case "complete":
      return { text: "绘制完成", icon: "check" };
    case "error":
      return { text: "出错了", icon: "error" };
    default:
      return { text: "处理中...", icon: "loader" };
  }
};

// 获取代码语言 - 直接返回空字符串，不区分格式
const getCodeLanguage = (): "xml" | "json" | "mermaid" | undefined => {
  return undefined;
};

// 清除消息
const clearMessages = async () => {
  if (props.file?.id) {
    const fileId = String(props.file.id);
    await chatMessageStore.clearMessagesByFileId(fileId);
  }
  messages.value = [];
  isEmpty.value = true;
};

// 更新输入值
const updateInputValue = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  inputValue.value = target.value;
};

// 更新 URL 输入值
const updateUrlInputValue = (e: Event) => {
  const target = e.target as HTMLInputElement;
  urlInputValue.value = target.value;
};

// 打开图片放大
const openImageModal = (imageUrl: string, imageAlt: string) => {
  currentImageUrl.value = imageUrl;
  currentImageAlt.value = imageAlt;
  showImageModal.value = true;
};

// 关闭图片放大
const closeImageModal = () => {
  showImageModal.value = false;
  currentImageUrl.value = "";
  currentImageAlt.value = "";
};

// 处理应用代码
const handleApplyCode = (code: string) => {
  if (props.onApplyCode) {
    props.onApplyCode(code);
  }
};
</script>

<template>
  <div class="flex h-full flex-col bg-surface">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-border px-4 py-1"
    >
      <div>
        <h2 class="font-medium text-primary">AI Assistant</h2>
        <p class="text-xs text-muted">
          <span v-if="file && file.id" class="flex items-center gap-1">
            <FileText class="h-3 w-3" />
            {{ file.name }}
          </span>
          <span v-else>{{ isEmpty ? "创建新图表" : "修改当前图表" }}</span>
        </p>
      </div>
      <div class="flex items-center gap-1">
        <Button
          v-if="onCollapse"
          variant="ghost"
          size="sm"
          title="收起面板"
          @click="onCollapse"
          :disabled="isStreaming"
        >
          <ArrowLeftToLine class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="新建对话"
          @click="clearMessages"
          :disabled="isStreaming || messages.length === 0"
        >
          <MessageSquarePlus class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4">
      <div
        v-if="messages.length === 0"
        class="flex h-full flex-col items-center justify-center text-center text-muted"
      >
        <Bot class="mb-4 h-12 w-12 opacity-50" />
        <p class="text-sm">告诉我你想要画什么...</p>
      </div>
      <div v-else>
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="[
            'flex gap-3 mb-4',
            msg.role === 'user' ? 'flex-row-reverse' : '',
          ]"
        >
          <!-- Avatar -->
          <div
            :class="[
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.5rem]',
              msg.role === 'user'
                ? 'bg-primary text-surface'
                : 'border border-border bg-surface text-primary',
            ]"
          >
            <User v-if="msg.role === 'user'" class="h-4 w-4" />
            <Bot v-else class="h-4 w-4" />
          </div>

          <!-- Content -->
          <div class="flex items-start gap-1 w-full max-w-[85%]">
            <Button
              v-if="msg.role === 'user'"
              variant="ghost"
              size="sm"
              title="复制"
              @click="handleCopyUserMessage(msg.id, msg.content)"
              :disabled="!msg.content?.trim()"
              class="h-7 w-7 flex-shrink-0"
            >
              <Check
                v-if="copiedMessages.has(msg.id)"
                class="h-4 w-4 text-green-500"
              />
              <Copy v-else class="h-4 w-4" />
            </Button>

            <div
              :class="[
                'w-full px-3 py-2 rounded-[0.5rem]',
                msg.role === 'user'
                  ? 'bg-primary text-surface'
                  : 'border border-border bg-background',
              ]"
            >
              <!-- 用户消息的附件 -->
              <div
                v-if="
                  msg.role === 'user' &&
                  msg.attachments &&
                  msg.attachments.length > 0
                "
                class="mb-2 flex flex-wrap gap-2"
              >
                <div
                  v-for="(att, idx) in msg.attachments"
                  :key="idx"
                  class="text-xs opacity-80"
                >
                  <div v-if="att.type === 'image'" class="relative group">
                    <img
                      :src="att.dataUrl"
                      :alt="att.fileName"
                      class="max-h-20 max-w-20 object-cover border border-surface/30 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      @click="
                        openImageModal(att.dataUrl || '', att.fileName || '')
                      "
                    />
                    <div
                      class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ZoomIn class="h-4 w-4 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <a
                    v-else-if="att.type === 'url'"
                    :href="att.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="color: #fff"
                    class="flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Link class="h-3 w-3" />
                    {{ att.title }}
                  </a>
                  <span v-else class="flex items-center gap-1">
                    <FileText class="h-3 w-3" />
                    {{ att.fileName }}
                  </span>
                </div>
              </div>

              <!-- AI 消息 -->
              <div
                v-if="msg.role === 'assistant'"
                class="flex flex-col gap-2 w-full"
              >
                <!-- Plan Section -->
                <ThoughtBlock
                  v-if="msg.plan"
                  :content="msg.plan"
                  :duration="
                    msg.metrics?.planEndTime && msg.metrics?.startTime
                      ? (msg.metrics.planEndTime - msg.metrics.startTime) / 1000
                      : undefined
                  "
                  :is-streaming="
                    msg.status === 'streaming' && !msg.metrics?.planEndTime
                  "
                />

                <!-- Code Section -->
                <CodeBlock
                  v-if="msg.code"
                  :code="msg.code"
                  :language="getCodeLanguage()"
                  :is-streaming="msg.status === 'streaming'"
                  :duration="
                    msg.metrics?.endTime &&
                    msg.metrics.planEndTime &&
                    msg.metrics.startTime
                      ? (msg.metrics.endTime -
                          (msg.metrics.planEndTime || msg.metrics.startTime)) /
                        1000
                      : undefined
                  "
                  @apply-code="handleApplyCode"
                />

                <!-- Fallback / Raw Content -->
                <div
                  v-if="!msg.plan && !msg.code"
                  class="text-sm whitespace-pre-wrap"
                >
                  {{ msg.content }}
                </div>

                <div class="flex items-center gap-2 justify-between mt-1">
                  <div class="flex items-center gap-2">
                    <Loader2
                      v-if="getStatusDisplay(msg.status).icon === 'loader'"
                      class="h-4 w-4 animate-spin"
                    />
                    <CheckCircle2
                      v-else-if="getStatusDisplay(msg.status).icon === 'check'"
                      class="h-4 w-4 text-green-500"
                    />
                    <X v-else class="h-4 w-4 text-red-500" />
                    <span class="text-sm">{{
                      getStatusDisplay(msg.status).text
                    }}</span>
                  </div>
                  <span
                    v-if="msg.metrics?.endTime && msg.metrics?.startTime"
                    class="text-xs text-muted-foreground"
                  >
                    总耗时：{{
                      (
                        (msg.metrics.endTime - msg.metrics.startTime) /
                        1000
                      ).toFixed(1)
                    }}s
                  </span>
                </div>
              </div>

              <!-- 用户消息内容 -->
              <p v-else class="text-sm whitespace-pre-wrap">
                {{ msg.content }}
              </p>
            </div>

            <!-- 重试按钮 -->
            <Button
              v-if="
                msg.role === 'assistant' && msg.id === lastAssistantMessageId
              "
              variant="ghost"
              size="sm"
              title="重新发送"
              :disabled="
                isStreaming ||
                msg.status === 'streaming' ||
                msg.status === 'pending'
              "
              class="h-7 w-7 flex-shrink-0"
            >
              <RotateCcw class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div ref="messagesEndRef" />
    </div>

    <!-- Attachment Preview -->
    <div v-if="attachments.length > 0" class="border-t border-border px-4 py-2">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(att, idx) in attachments"
          :key="idx"
          class="relative flex items-center gap-1 border border-border bg-background px-2 py-1 text-xs"
        >
          <div v-if="att.type === 'image'" class="relative">
            <img
              :src="att.dataUrl"
              :alt="att.fileName"
              class="h-8 w-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
              @click="openImageModal(att.dataUrl || '', att.fileName || '')"
            />
          </div>
          <template v-else>
            <a
              v-if="att.type === 'url'"
              :href="att.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 text-primary hover:underline cursor-pointer max-w-24 truncate"
            >
              <Link class="h-3 w-3 flex-shrink-0" />
              <span class="truncate">{{ att.title }}</span>
            </a>
            <template v-else>
              <FileText class="h-3 w-3" />
              <span class="max-w-24 truncate">{{ att.fileName }}</span>
            </template>
          </template>
          <button
            @click="removeAttachment(idx)"
            class="ml-1 text-muted hover:text-primary"
          >
            <X class="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="border-t border-border p-4">
      <div
        class="relative flex flex-col border border-border rounded-lg bg-background focus-within:border-primary transition-colors"
      >
        <!-- Textarea -->
        <textarea
          ref="textareaRef"
          placeholder="输入消息... (支持粘贴图片)"
          :value="inputValue"
          @input="updateInputValue"
          @keydown="handleKeyDown"
          @paste="handlePaste"
          :disabled="isStreaming"
          rows="1"
          class="w-full resize-none bg-transparent px-4 pt-3 pb-12 text-sm outline-none placeholder:text-muted disabled:opacity-50 rounded-[0.5rem]"
          :style="{ minHeight: '120px', maxHeight: '200px' }"
        />

        <!-- URL Input -->
        <div
          v-if="showUrlInput"
          class="absolute left-0 right-0 bottom-40 flex items-center gap-2 z-10 bg-background p-2 rounded border border-border shadow-md"
        >
          <input
            type="url"
            placeholder="输入网址链接..."
            :value="urlInputValue"
            @input="updateUrlInputValue"
            @keydown="
              (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUrlSubmit();
                } else if (e.key === 'Escape') {
                  showUrlInput = false;
                  urlInputValue = '';
                }
              }
            "
            :disabled="isParsingUrl"
            class="flex-1 border border-border rounded px-2 py-1 text-sm bg-surface outline-none focus:border-primary disabled:opacity-50"
            autofocus
          />
          <Button
            size="sm"
            @click="handleUrlSubmit"
            :disabled="!urlInputValue.trim() || isParsingUrl"
            class="h-7"
          >
            <MoveRight class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            @click="
              () => {
                showUrlInput = false;
                urlInputValue = '';
              }
            "
            :disabled="isParsingUrl"
            class="h-7"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>

        <!-- Bottom toolbar -->
        <div
          class="absolute bottom-2 left-2 right-2 flex items-center justify-between"
        >
          <div class="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              title="上传图片"
              @click="handleImageUpload"
              :disabled="isStreaming || isProcessingFile"
              class="h-8 w-8"
            >
              <ImagePlus class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="上传文档 (docx, txt, md)"
              @click="handleDocumentUpload"
              :disabled="isStreaming || isProcessingFile"
              class="h-8 w-8"
            >
              <FileText class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="添加网址链接"
              @click="() => (showUrlInput = !showUrlInput)"
              :disabled="isStreaming || isProcessingFile || isParsingUrl"
              class="h-8 w-8"
            >
              <Link class="h-4 w-4" />
            </Button>
            <Dropdown
              trigger="click"
              placement="bottom-start"
              @select="handleProviderSelect"
            >
              <template #trigger>
                <Button variant="secondary" size="sm" class="h-8 px-2">
                  {{
                    selectedProvider
                      ? providerConfigs.find((p) => p.id === selectedProvider)
                          ?.name
                      : "选择 AI 供应商"
                  }}
                </Button>
              </template>
              <template #menu>
                <div class="dropdown-menu-content">
                  <div
                    v-for="config in providerConfigs"
                    :key="config.id"
                    class="dropdown-item"
                    @click="handleProviderSelect(String(config.id))"
                  >
                    {{ config.name }}
                  </div>
                </div>
              </template>
            </Dropdown>
            <div class="h-3 w-[1px] bg-border mx-1" />
            <span
              v-if="isProcessingFile"
              class="flex items-center text-xs text-muted ml-2"
            >
              <Loader2 class="h-3 w-3 animate-spin mr-1" />
              处理中...
            </span>
            <span
              v-if="isParsingUrl"
              class="flex items-center text-xs text-muted ml-2"
            >
              <Loader2 class="h-3 w-3 animate-spin mr-1" />
              解析链接中...
            </span>
          </div>
          <Button
            @click="handleSend"
            :disabled="
              (!inputValue.trim() && attachments.length === 0) || isStreaming
            "
            size="sm"
            class="h-8"
          >
            <Send class="h-4 w-4 mr-1" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div
      v-if="showImageModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      @click="closeImageModal"
    >
      <div class="relative max-w-[90vw] max-h-[90vh]">
        <button
          class="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
          @click="closeImageModal"
        >
          <X class="h-8 w-8" />
        </button>
        <img
          :src="currentImageUrl"
          :alt="currentImageAlt"
          class="max-w-full max-h-[90vh] object-contain rounded"
          @click.stop
        />
      </div>
    </div>
  </div>
</template>
