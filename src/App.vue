<script setup lang="ts">
import { ref, onMounted, nextTick, watchEffect } from "vue";
import { IFile } from "./db/types";
import { EditorMessageBus } from "@iss-ai/window-message-bus";
import Sidebar from "./components/Sidebar.vue";
import { editors } from "./editors/index";
import { fileHistories, files } from "./db";
import { languages } from "./const/languages";
// 状态
const isDirty = ref(false);
const currentFileType = ref("excalidraw");
const currentTheme = ref<"light" | "dark">("light");
const currentLang = ref("zh");
const fileName = ref("Untitled.md");

// UI 状态
const showCodeModal = ref(false);
const showConfirmModal = ref(false);
const confirmTitle = ref("有未保存的内容，确定切换？内容将丢失");
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info">("info");
const toastVisible = ref(false);
const codeContent = ref("");
const drawUrl = ref(
  editors.find((ft) => ft.value === currentFileType.value)?.iframe || "",
);
const prompt = ref(
  editors.find((ft) => ft.value === currentFileType.value)?.prompt || "",
);
const info = ref<IFile>({
  id: "",
  name: "",
  fileType: "excalidraw",
  pid: null,
  displayOrder: 999,
  createTime: null,
  updateTime: null,
});
// 侧边栏状态
const activePanel = ref<string | null>(null);
const panelText = ref("");
const panelPosition = ref({ x: 0, y: 0, width: 0, height: 0 });

// 历史版本
const historyVersions = ref([]);

// 导出格式
const exportFormats = ref([
  { format: "png", label: "导出 PNG" },
  { format: "svg", label: "导出 SVG" },
  { format: "json", label: "导出原文件" },
]);

// 初始化
onMounted(() => {
  const savedTheme = localStorage.getItem("theme") as "light" | "dark";
  if (savedTheme) {
    currentTheme.value = savedTheme;
  }
  const savedLang = localStorage.getItem("lang");
  if (savedLang) {
    currentLang.value = savedLang;
  }
  document.documentElement.setAttribute("data-theme", currentTheme.value);
  (document.getElementById("editor-iframe") as any).onload = () => {
    console.log("onload");
    codeContent.value = info.value.content || codeContent.value;
    applyCode();
  };
  editorBus.onChange((data) => {
    codeContent.value =
      typeof data.data === "string"
        ? data.data
        : JSON.stringify(data.data || data || [], null, 2);
    isDirty.value = true;
    console.log("change", data);
  });

  editorBus.onThumnail((data) => {
    console.log("thumbnail", data);
  });
  notifyLanguageChange();
  editorBus.onReady(() => {
    console.log("编辑器就绪，版本:", codeContent.value);
    setTimeout(() => {
      codeContent.value = info.value.content || codeContent.value;
      applyCode();
    }, 200);
  });
});

watchEffect(() => {
  if (currentFileType.value) {
    let fmts = [];
    editors.forEach((ft) => {
      if (ft.value === currentFileType.value) {
        drawUrl.value = ft.iframe || "";
        ft.format?.forEach((fmt) => {
          fmts.push({ format: fmt, label: `导出 ${fmt.toUpperCase()}` });
        });
        prompt.value = ft.prompt || "";
      }
    });
    isDirty.value = false;
    exportFormats.value = fmts;
  }
});

const getHistory = async () => {
  console.log("getHistory", info.value);
  if (!info.value.id) {
    showToast("⚠️ 请先保存文件以查看历史版本", "warning");
    return;
  }
  historyVersions.value =
    (await fileHistories.getList({ where: { fileId: info.value.id } })) || [];
};

// 文件类型切换
const switchFileType = (type: string) => {
  currentFileType.value = type;
  showToast(`已切换至 ${getTypeLabel(type)} 类型`, "success");
  createNewFile({});
};

const getTypeLabel = (type: string) => {
  return editors.find((ft) => ft.value === type)?.text || type;
};

// 主题切换
const toggleTheme = () => {
  currentTheme.value = currentTheme.value === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme.value);
  localStorage.setItem("theme", currentTheme.value);
  editorBus.setConfig(
    { theme: { mode: currentTheme.value } },
    (document.getElementById("editor-iframe") as any).contentWindow,
  );
};

const getThemeButtonText = () => {
  return currentTheme.value === "light" ? "🌙 深色模式" : "☀️ 浅色模式";
};

// 语言切换
const selectLanguage = (lang: string) => {
  currentLang.value = lang;
  localStorage.setItem("lang", lang);
  window.$changeLang(lang);
  location.reload();
};
const notifyLanguageChange = () => {
  let lang = currentLang.value;
  let langs =
    editors.find((ft) => ft.value === currentFileType.value)?.languages || {};
  editorBus.setConfig(
    { langCode: langs[lang] || lang },
    (document.getElementById("editor-iframe") as any).contentWindow,
  );
};

const getLangButtonText = () => {
  const lang = languages.find((l) => l.code === currentLang.value);
  return `🌐 ${lang?.label || "中文"}`;
};

// 保存
const saveFile = async () => {
  isDirty.value = false;
  const data = {
    ...info.value,
    name: fileName.value,
    content: codeContent.value,
    displayOrder: info.value?.displayOrder || 999,
    fileType: currentFileType.value,
  };
  let result = await files.save(data);
  info.value = result;
  let history = { ...result };
  delete history.id;
  delete history.createTime;
  history.fileId = result.id;
  fileHistories.save(history);
  showToast("✅ 保存成功", "success");
};
const saveAsFile = async () => {
  if (info.value?.id) {
    const newName = `${info.value.name}-copy`;
    fileName.value = newName;
    info.value.name = newName;
    info.value.id = undefined;
    saveFile();
  }
};
// 导出
const exportFile = (format: string) => {
  showToast(`📦 正在导出 ${format.toUpperCase()}...`, "info");
  setTimeout(() => {
    showToast(`✅ ${format.toUpperCase()} 导出成功`, "success");
  }, 800);
};

// 查看源码
const viewSource = () => {
  showCodeModal.value = true;
};

const closeCodeModal = () => {
  showCodeModal.value = false;
};

const copyCode = () => {
  navigator.clipboard.writeText(codeContent.value).then(() => {
    showToast("📋 源码已复制到剪贴板", "success");
  });
};

const applyCode = () => {
  try {
    editorBus.setData(
      codeContent.value.startsWith("{") || codeContent.value.startsWith("[")
        ? JSON.parse(codeContent.value)
        : codeContent.value,
      (document.getElementById("editor-iframe") as any).contentWindow,
    );
  } catch (error) {
    console.error("Invalid JSON:", error);
    toastMessage.value = "❌ 无效的 JSON 格式";
    toastType.value = "error";
    toastVisible.value = true;
  }

  showCodeModal.value = false;
};

// 确认弹窗相关
const pendingAction = ref<(() => void) | null>(null);

const handleConfirmClose = () => {
  showConfirmModal.value = false;
  pendingAction.value = null;
};

const handleConfirmConfirm = () => {
  showConfirmModal.value = false;
  if (pendingAction.value) {
    pendingAction.value();
    pendingAction.value = null;
  }
};

// 通用确认处理
const handleConfirm = (action: () => void) => {
  if (isDirty.value) {
    confirmTitle.value = "您有未保存的内容，确定切换？内容将丢失";
    pendingAction.value = action;
    showConfirmModal.value = true;
  } else {
    action();
  }
};

// Toast 提示
const showToast = (
  message: string,
  type: "success" | "error" | "info" = "info",
) => {
  toastMessage.value = message;
  toastType.value = type;
  toastVisible.value = true;
  nextTick(() => {
    setTimeout(() => {
      toastVisible.value = false;
    }, 2500);
  });
};

// 语言下拉菜单选项点击
const handleLangSelect = (lang: string) => {
  selectLanguage(lang);
  showToast(
    `已切换至 ${languages.find((l) => l.code === lang)?.label || lang}`,
    "success",
  );
};
const editorBus = new EditorMessageBus();
// 导出菜单选项点击
const handleExportSelect = (format: string) => {
  const win = (document.getElementById("editor-iframe") as any).contentWindow;
  editorBus.export({ name: fileName.value, format }, win);
  exportFile(format);
};

const thumnail = () => {
  const win = (document.getElementById("editor-iframe") as any).contentWindow;
  editorBus.thumnail({}, win);
};

// 历史版本菜单选项点击
const handleHistorySelect = (content: string) => {
  codeContent.value = content;
  applyCode();

  // restoreVersion(version);
};

// 侧边栏面板显示函数
const showPanel = (panelName: string, text: string) => {
  activePanel.value = panelName;
  panelText.value = text;
  // 获取侧边栏按钮位置，用于定位弹出面板
  nextTick(() => {
    // const button = document.querySelector(
    //   `.sidebar-item:nth-child(${getPanelIndex(panelName)})`,
    // );
    const button = document.querySelector(".sidebar");
    if (button) {
      const rect = button.getBoundingClientRect();
      panelPosition.value = {
        x: rect.right + 10,
        y: rect.top,
        height: rect.height,
        width: 380,
      };
    }
  });
};

// 获取面板索引
const getPanelIndex = (panelName: string): number => {
  const panels = ["manage", "template", "chat", "setting", "fixed", "backup"];
  return panels.indexOf(panelName) + 1;
};

// 关闭面板
const closePanel = () => {
  activePanel.value = null;
};
const setInfo = async (tmp: any) => {
  codeContent.value = tmp.content || "[]";
  info.value = (await files.getInfo({ id: tmp.id })) || tmp;
  fileName.value = info.value.name;
  codeContent.value = info.value.content || "[]";
  currentFileType.value = info.value.fileType || "excalidraw";
  drawUrl.value =
    editors.find((ft) => ft.value === currentFileType.value)?.iframe || "";
  applyCode();
};
const createNewFile = (data?: Record<string, any>) => {
  fileName.value = data.name || `Untitled`;
  codeContent.value = data.content || "[]";
  currentFileType.value =
    data.fileType || currentFileType.value || "excalidraw";
  isDirty.value = false;
  info.value = {
    id: "",
    name: fileName.value,
    fileType: currentFileType.value,
    pid: data.pid || null,
    createTime: null,
    updateTime: null,
    displayOrder: 999,
  };
  applyCode();
};
const applyChatCode = (code: any) => {
  codeContent.value = code;
  console.log("applyChatCode", code);
  applyCode();
};
</script>

<template>
  <div class="app-container">
    <!-- 顶部工具栏 -->
    <header class="header">
      <div class="logo">✨ SmartEditor</div>
      <div class="file-type-group">
        <Button
          v-for="ft in editors"
          :key="ft.value"
          variant="secondary"
          size="md"
          :class="{ active: currentFileType === ft.value }"
          @click="handleConfirm(() => switchFileType(ft.value))"
        >
          <img style="width: 20px; height: 20px" :src="ft.icon" alt="" />
          {{ ft.text }}
        </Button>
      </div>
      <div class="user-controls">
        <!-- 语言下拉菜单 -->
        <Dropdown placement="bottom-end" @select="handleLangSelect">
          <template #trigger>
            <Button variant="secondary">
              {{ getLangButtonText() }}
            </Button>
          </template>
          <template #menu="{ close }">
            <div class="dropdown-menu-list">
              <button
                v-for="lang in languages"
                :key="lang.code"
                class="dropdown-item"
                @click="
                  () => {
                    handleLangSelect(lang.code);
                    close();
                  }
                "
              >
                {{ lang.flag }}{{ lang.label }}
              </button>
            </div>
          </template>
        </Dropdown>
        <Button variant="ghost" @click="toggleTheme">
          {{ getThemeButtonText() }}
        </Button>
      </div>
    </header>

    <!-- 中间工具栏 -->
    <toolbar class="toolbar">
      <div class="project-controls">
        <Input
          v-model="fileName"
          placeholder="文件名"
          size="sm"
          width="160px"
        />
        <Button variant="secondary" @click="createNewFile"> + 新建文件 </Button>
      </div>
      <div class="action-controls">
        <Button variant="primary" @click="saveFile"> 💾 保存 </Button>
        <Button variant="primary" @click="saveAsFile"> 💾 另存为 </Button>
        <!-- 导出下拉菜单 -->
        <Dropdown placement="bottom-end" @select="handleExportSelect">
          <template #trigger>
            <Button variant="secondary"> 📤 导出 </Button>
          </template>
          <template #menu="{ close }">
            <div class="dropdown-menu-list">
              <button
                v-for="fmt in exportFormats"
                :key="fmt.format"
                class="dropdown-item"
                @click="
                  () => {
                    handleExportSelect(fmt.format);
                    close();
                  }
                "
              >
                {{ fmt.label }}
              </button>
            </div>
          </template>
        </Dropdown>
        <Button variant="secondary" @click="viewSource"> ⚡ 查看源码 </Button>
        <!-- 历史版本下拉菜单 -->
        <Dropdown placement="bottom-end" @select="handleHistorySelect">
          <template #trigger>
            <Button variant="secondary" @click="getHistory">
              🕒 历史版本
            </Button>
          </template>
          <template #menu="{ close }">
            <div class="dropdown-menu-list history">
              <button
                v-for="(ver, index) in historyVersions"
                :key="index"
                class="dropdown-item"
                @click="
                  () => {
                    handleHistorySelect(ver.content);
                    close();
                  }
                "
              >
                {{ new Date(ver.createTime).toLocaleString() }}
              </button>
            </div>
          </template>
        </Dropdown>
      </div>
    </toolbar>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="workspace">
        <div class="editor-layout">
          <!-- 使用侧边栏组件 -->
          <Sidebar :active-panel="activePanel" @panel-toggle="showPanel" />

          <!-- iframe容器 -->
          <div class="iframe-container">
            <iframe
              id="editor-iframe"
              class="editor-iframe"
              :src="drawUrl"
            ></iframe>
          </div>
        </div>
      </div>
    </main>

    <!-- 源码弹窗 - 使用 Dialog 组件 -->
    <Dialog v-model="showCodeModal" title="查看源码" width="80%" height="70%">
      <textarea
        class="code-editor"
        v-model="codeContent"
        spellcheck="false"
      ></textarea>
      <template #footer>
        <Button variant="secondary" @click="copyCode">复制</Button>
        <Button variant="primary" class="apply" @click="applyCode"
          >应用修改</Button
        >
      </template>
    </Dialog>

    <!-- 侧边栏面板 -->
    <div
      v-if="activePanel"
      class="panel-container"
      :style="{
        left: panelPosition.x + 'px',
        top: panelPosition.y + 'px',
        width: panelPosition.width + 'px',
        height: panelPosition.height + 'px',
      }"
      @mousedown.stop
    >
      <div class="panel-header">
        <span>{{ panelText }}</span>
        <button class="close-btn" @click="closePanel">×</button>
      </div>
      <div class="panel-content">
        <FileManager v-if="activePanel == 'manage'" @click="setInfo" />
        <ChatPanel
          :file="info"
          :prompt="prompt"
          @applyCode="applyChatCode"
          v-if="activePanel == 'chat'"
        />
        <AIProviderConfig v-if="activePanel == 'setting'" />
      </div>
    </div>

    <!-- 确认弹窗 - 使用 ConfirmDialog 组件 -->
    <ConfirmDialog
      v-model="showConfirmModal"
      :title="confirmTitle"
      confirm-text="确定"
      cancel-text="取消"
      @confirm="handleConfirmConfirm"
      @close="handleConfirmClose"
    />

    <!-- Toast 提示 - 使用 Toast 组件 -->
    <Toast
      :show="toastVisible"
      :message="toastMessage"
      :type="toastType"
      @update:show="toastVisible = $event"
    />
  </div>
</template>

<style lang="scss">
@use "./styles/smart-editor.scss" as *;

// 编辑器布局
.editor-layout {
  height: 100%;
  display: flex;
  //gap: 20px;
  align-items: stretch;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.sidebar-item {
  width: 100%;
  padding: 8px 12px;
  background: var(--btn-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text);
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--btn-hover);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

// 面板容器样式
.panel-container {
  position: absolute;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
  min-width: 200px;
  z-index: 1001;
  max-width: 500px;
  overflow-y: scroll;

  // 添加拖拽功能的样式
  &.draggable {
    cursor: move;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);

  span {
    font-weight: bold;
    color: var(--text);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--text);

    &:hover {
      color: var(--primary);
    }
  }
}

.panel-content {
  p {
    margin: 8px 0;
    color: var(--text);
    line-height: 1.5;
  }
}

// 下拉菜单内部样式
.dropdown-menu-list {
  padding: 8px 0;
  &.history {
    width: 180px;
  }
}

.dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text);
  transition: background 0.2s;

  &:hover {
    background: var(--btn-hover);
  }
}

// 按钮激活状态
.btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

// 代码编辑器在 Dialog 中的样式
.dialog-body .code-editor {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  font-family: monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  overflow: auto;
  resize: none;
  color: var(--text);
  width: 100%;
  min-height: 300px;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
    outline: none;
  }
}
</style>
