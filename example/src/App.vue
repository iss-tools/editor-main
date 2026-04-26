<template>
  <div class="editor-demo-container">
    <div class="toolbar">
      <div class="toolbar-item">
        <label>输入内容:</label>
        <input
          type="text"
          v-model="inputValue"
          @input="handleInputChange"
          placeholder="输入内容后发送 change 消息"
          class="input-field"
        />
      </div>
      <div class="toolbar-item">
        <label>主题:</label>
        <select
          v-model="theme"
          @change="handleThemeChange"
          class="select-field"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div class="toolbar-item">
        <label>语言:</label>
        <select
          v-model="language"
          @change="handleLanguageChange"
          class="select-field"
        >
          <option value="zh-CN">中文 (zh-CN)</option>
          <option value="en">English (en)</option>
          <option value="ja">日本語 (ja)</option>
        </select>
      </div>
      <div class="toolbar-item">
        <button @click="handleExport" class="btn">导出</button>
      </div>
    </div>
    <div class="content-area">
      <div class="display-panel">
        <h3>当前显示内容:</h3>
        <p>{{ displayContent }}</p>
      </div>
      <div class="display-panel">
        <h3>当前主题:</h3>
        <p :class="theme === 'dark' ? 'dark-text' : 'light-text'">
          {{ theme }}
        </p>
      </div>
      <div class="display-panel">
        <h3>当前语言:</h3>
        <p>{{ languageLabel }}</p>
      </div>
    </div>
    <div class="log-panel">
      <h3>消息日志:</h3>
      <ul class="log-list">
        <li v-for="(log, index) in logs" :key="index">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-type">[{{ log.type }}]</span>
          <span class="log-message">{{ log.message }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  EditorMessageBus,
  type EditorConfig,
} from "@iss-ai/window-message-bus";

// 创建 EditorMessageBus 实例用于与外部通信
const editorBus = new EditorMessageBus({
  sourceId: "editor-main-demo",
  debug: true,
});

// 响应式状态
const inputValue = ref("");
const displayContent = ref("");
const theme = ref<"light" | "dark">("light");
const language = ref("zh-CN");
const logs = ref<Array<{ time: string; type: string; message: string }>>([]);

// 语言标签映射
const languageLabels: Record<string, string> = {
  "zh-CN": "中文",
  en: "English",
  ja: "日本語",
  ru: "Русский",
  ko: "한국어",
};

// 计算当前语言标签
const languageLabel = computed(() => {
  return languageLabels[language.value] || language.value;
});

// 添加日志
const addLog = (type: string, message: string) => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  logs.value.unshift({ time, type, message });
  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value.pop();
  }
};

// 处理输入框变化 - 发送 change 消息
const handleInputChange = () => {
  displayContent.value = inputValue.value;
  editorBus.change({ data: inputValue.value });
  addLog("SEND", `change: ${inputValue.value}`);
};

// 处理主题变化 - 发送 setConfig 消息
const handleThemeChange = () => {
  editorBus.setConfig({
    theme: {
      mode: theme.value,
    },
  });
  addLog("SEND", `setConfig.theme: ${theme.value}`);
};

// 处理语言变化 - 发送 setConfig 消息
const handleLanguageChange = () => {
  editorBus.setConfig({
    langCode: language.value,
  });
  addLog("SEND", `setConfig.langCode: ${language.value}`);
};

// 处理导出
const handleExport = () => {
  editorBus.export({
    format: "html",
    name: `export-${Date.now()}`,
  });
  addLog("SEND", `export: html`);
};

// 监听设置数据消息
const handleSetData = (data: any) => {
  console.log("收到设置数据指令:", data);
  const content = data?.content || data || "";
  inputValue.value = content;
  displayContent.value = content;
  addLog(
    "RECV",
    `setData: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
  );
};

// 监听设置配置消息（主题和语言）
const handleSetConfig = (config: EditorConfig) => {
  console.log("收到设置配置指令:", config);
  if (config.theme?.mode) {
    theme.value = config.theme.mode as "light" | "dark";
    addLog("RECV", `setConfig.theme: ${config.theme.mode}`);
  }
  if (config.langCode) {
    language.value = config.langCode as string;
    addLog("RECV", `setConfig.langCode: ${config.langCode}`);
  }
};

// 监听导出消息
const handleExportMessage = (config: any) => {
  console.log("收到导出指令:", config);
  addLog("RECV", `export: ${config.format || "unknown"}`);
};

// 页面加载时发送 ready 消息
const sendReadyMessage = () => {
  editorBus.isReady({ version: "0.0.1" });
  addLog("SEND", "isReady: 0.0.1");
};

// 生命周期钩子
onMounted(() => {
  // 发送 ready 消息
  sendReadyMessage();

  // 设置事件监听器
  editorBus.onSetData(handleSetData);
  editorBus.onSetConfig(handleSetConfig);
  editorBus.onExport(handleExportMessage);

  addLog("SYSTEM", "编辑器 Demo 已初始化");
});

onUnmounted(() => {
  // 清理事件监听器
  editorBus.off("setData");
  editorBus.off("setConfig");
  editorBus.off("export");
});
</script>

<style lang="scss" scoped>
.editor-demo-container {
  padding: 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;

  .toolbar-item {
    display: flex;
    align-items: center;
    gap: 8px;

    label {
      font-weight: 500;
      color: #333;
    }

    .input-field {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      width: 250px;

      &:focus {
        outline: none;
        border-color: #007bff;
      }
    }

    .select-field {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    }

    .btn {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #0056b3;
      }
    }
  }
}

.content-area {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;

  .display-panel {
    padding: 15px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;

    h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
    }

    p {
      margin: 0;
      font-size: 16px;
      color: #333;
      word-break: break-all;
    }

    .dark-text {
      color: #333;
      background: #333;
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
    }

    .light-text {
      color: #666;
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
    }
  }
}

.log-panel {
  padding: 15px;
  background: #1e1e1e;
  border-radius: 8px;
  color: #fff;

  h3 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #aaa;
  }

  .log-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 300px;
    overflow-y: auto;

    li {
      display: flex;
      gap: 10px;
      padding: 6px 0;
      border-bottom: 1px solid #333;
      font-family: "Monaco", "Menlo", monospace;
      font-size: 12px;

      &:last-child {
        border-bottom: none;
      }

      .log-time {
        color: #888;
        min-width: 70px;
      }

      .log-type {
        min-width: 60px;
        font-weight: bold;

        &[class*="SEND"] {
          color: #4caf50;
        }

        &[class*="RECV"] {
          color: #2196f3;
        }

        &[class*="SYSTEM"] {
          color: #ff9800;
        }
      }

      .log-message {
        color: #e0e0e0;
        flex: 1;
        word-break: break-all;
      }
    }
  }
}
</style>
