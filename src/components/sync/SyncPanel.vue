<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { directories, files } from "../../db";
import type { IDirectory, IFile } from "../../db/types";
import {
  uploadFile,
  downloadFileContent,
  validateRepoAndToken,
  type GitHubConfig,
} from "./github";
import { saveSyncConfig, loadSyncConfig, validateSyncConfig } from "./config";

// 配置相关
const repo = ref("");
const token = ref("");
const branch = ref("main");
const filePath = ref("sync-editors-data.json");

// 从完整 URL 提取 owner/repo
function extractRepoFromUrl(url: string): string | null {
  // 匹配 https://github.com/owner/repo 或 https://www.github.com/owner/repo
  const httpsPattern =
    /^https?:\/\/(www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/i;
  // 匹配 git@github.com:owner/repo.git
  const sshPattern = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i;

  let match = url.match(httpsPattern);
  if (match) {
    return `${match[2]}/${match[3]}`;
  }

  match = url.match(sshPattern);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }

  return null;
}

// 监听 repo 输入，自动提取 owner/repo
watch(repo, (newValue) => {
  if (newValue) {
    const extracted = extractRepoFromUrl(newValue);
    if (extracted && extracted !== newValue) {
      repo.value = extracted;
    }
  }
});

// 状态相关
const loading = ref(false);
const statusMessage = ref("");
const statusType = ref<"info" | "success" | "error">("info");

// 导出数据
const exportData = ref<any>(null);

// 加载保存的配置
onMounted(() => {
  const savedConfig = loadSyncConfig();
  if (savedConfig) {
    repo.value = savedConfig.repo;
    token.value = savedConfig.token;
    branch.value = savedConfig.branch || "main";
    filePath.value = savedConfig.filePath || "sync-editors-data.json";
  }
});

// 设置状态消息
function setStatus(message: string, type: "info" | "success" | "error") {
  statusMessage.value = message;
  statusType.value = type;
}

// 获取所有数据组成对象
async function getAllData(): Promise<{
  directories: IDirectory[];
  files: IFile[];
  timestamp: string;
}> {
  const allDirectories = await directories.getList({});
  const allFiles = await files.getList({});
  console.log(allDirectories, allFiles);
  return {
    directories: allDirectories,
    files: allFiles,
    timestamp: new Date().toISOString(),
  };
}

// 保存配置
async function handleSaveConfig() {
  const config: GitHubConfig = {
    repo: repo.value,
    token: token.value,
    branch: branch.value,
    filePath: filePath.value,
  };

  const errors = validateSyncConfig(config);
  if (errors.length > 0) {
    setStatus(errors.join("，"), "error");
    return;
  }

  saveSyncConfig(config);
  setStatus("配置已保存", "success");
}

// 上传数据到 GitHub
async function handleUpload() {
  loading.value = true;
  try {
    const config: GitHubConfig = {
      repo: repo.value,
      token: token.value,
      branch: branch.value,
      filePath: filePath.value,
    };

    // 先验证配置
    const errors = validateSyncConfig(config);
    if (errors.length > 0) {
      setStatus(errors.join("，"), "error");
      loading.value = false;
      return;
    }

    // 验证仓库和 token
    setStatus("正在验证仓库和 Token...", "info");
    const validation = await validateRepoAndToken(config);
    if (!validation.valid) {
      setStatus(validation.error || "验证失败", "error");
      loading.value = false;
      return;
    }

    setStatus("验证通过，正在上传...", "info");
    const data = await getAllData();
    const jsonContent = JSON.stringify(data, null, 2);
    const result = await uploadFile(config, jsonContent, "Sync data upload");
    setStatus(`上传成功！查看：${result.html_url}`, "success");
  } catch (error) {
    setStatus(
      `上传失败：${error instanceof Error ? error.message : "未知错误"}`,
      "error",
    );
  } finally {
    loading.value = false;
  }
}

// 从 GitHub 下载数据
async function handleDownload() {
  loading.value = true;
  try {
    const config: GitHubConfig = {
      repo: repo.value,
      token: token.value,
      branch: branch.value,
      filePath: filePath.value,
    };

    const errors = validateSyncConfig(config);
    if (errors.length > 0) {
      setStatus(errors.join("，"), "error");
      loading.value = false;
      return;
    }

    const content = await downloadFileContent(config);
    if (!content) {
      setStatus("GitHub 上没有找到同步数据文件", "error");
      loading.value = false;
      return;
    }

    const data = JSON.parse(content);

    // 清空现有数据
    const allDirs = await directories.getList({});
    for (const dir of allDirs) {
      if (dir.id) await directories.delete({ id: dir.id });
    }
    const allFiles = await files.getList({});
    for (const file of allFiles) {
      if (file.id) await files.delete({ id: file.id });
    }

    // 导入新数据
    for (const dir of data.directories || []) {
      await directories.save(dir);
    }
    for (const file of data.files || []) {
      await files.save(file);
    }

    setStatus(
      `下载成功！导入了 ${data.directories?.length || 0} 个目录，${data.files?.length || 0} 个文件`,
      "success",
    );
  } catch (error) {
    setStatus(
      `下载失败：${error instanceof Error ? error.message : "未知错误"}`,
      "error",
    );
  } finally {
    loading.value = false;
  }
}

// 导出 JSON 数据到本地
async function handleExport() {
  try {
    const data = await getAllData();
    const jsonContent = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sync-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatus("导出成功！文件已下载", "success");
  } catch (error) {
    setStatus(
      `导出失败：${error instanceof Error ? error.message : "未知错误"}`,
      "error",
    );
  }
}
</script>

<template>
  <div class="sync-panel">
    <h3 class="panel-title">GitHub 同步</h3>

    <div class="config-section">
      <div class="form-group">
        <label>仓库地址</label>
        <input
          v-model="repo"
          type="text"
          placeholder="owner/repo"
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label>Token</label>
        <input
          v-model="token"
          type="password"
          placeholder="GitHub Personal Access Token"
          class="form-input"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>分支</label>
          <input
            v-model="branch"
            type="text"
            placeholder="main"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>文件路径</label>
          <input
            v-model="filePath"
            type="text"
            placeholder="sync-data.json"
            class="form-input"
          />
        </div>
      </div>

      <button
        @click="handleSaveConfig"
        class="btn btn-primary"
        :disabled="loading"
      >
        保存配置
      </button>
    </div>

    <div class="action-section">
      <div class="action-buttons">
        <button
          @click="handleUpload"
          class="btn btn-success"
          :disabled="loading"
        >
          <span v-if="loading">上传中...</span>
          <span v-else>↑ 上传到 GitHub</span>
        </button>

        <button
          @click="handleDownload"
          class="btn btn-info"
          :disabled="loading"
        >
          <span v-if="loading">下载中...</span>
          <span v-else>↓ 从 GitHub 下载</span>
        </button>

        <button
          @click="handleExport"
          class="btn btn-secondary"
          :disabled="loading"
        >
          导出 JSON
        </button>
      </div>
    </div>

    <div v-if="statusMessage" class="status-message" :class="statusType">
      {{ statusMessage }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.sync-panel {
  padding: 16px;
  max-width: 400px;

  .panel-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text);
  }

  .config-section {
    margin-bottom: 20px;

    .form-group {
      margin-bottom: 12px;

      label {
        display: block;
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }

      .form-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--bg-secondary);
        color: var(--text);
        font-size: 0.9rem;

        &:focus {
          outline: none;
          border-color: var(--primary);
        }
      }
    }

    .form-row {
      display: flex;
      gap: 12px;

      .form-group {
        flex: 1;
      }
    }
  }

  .action-section {
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }

  .btn {
    width: 100%;
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &.btn-primary {
      background: var(--primary, #6c63ff);
      color: white;

      &:hover:not(:disabled) {
        background: var(--primary-hover, #5a52d5);
      }
    }

    &.btn-success {
      background: #22c55e;
      color: white;

      &:hover:not(:disabled) {
        background: #16a34a;
      }
    }

    &.btn-info {
      background: #3b82f6;
      color: white;

      &:hover:not(:disabled) {
        background: #2563eb;
      }
    }

    &.btn-secondary {
      background: var(--btn-secondary, #f3f4f6);
      color: var(--text, #1f2937);
      border: 1px solid var(--border, #e5e7eb);

      &:hover:not(:disabled) {
        background: var(--btn-hover, #e5e7eb);
      }
    }
  }

  .status-message {
    margin-top: 16px;
    padding: 12px;
    border-radius: 4px;
    font-size: 0.85rem;

    &.info {
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }

    &.success {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    &.error {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }
}
</style>
