/**
 * Cookie 配置管理工具
 * 支持简单的加密存储
 */

export interface SyncConfig {
  repo: string; // 格式：owner/repo
  token: string;
  branch?: string;
  filePath?: string;
}

/**
 * 简单的加密/解密函数（基于 Base64 + 简单替换）
 * 注意：这不是强加密，仅用于防止明文存储
 */
const ENCRYPTION_KEY = "sync-editor-key-2024";

function simpleEncrypt(text: string): string {
  // 简单的 XOR 加密 + Base64
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode =
      text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(result)));
}

function simpleDecrypt(encrypted: string): string {
  try {
    const decoded = decodeURIComponent(escape(atob(encrypted)));
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode =
        decoded.charCodeAt(i) ^
        ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    return "";
  }
}

const COOKIE_NAME = "github_sync_config";
const COOKIE_EXPIRY_DAYS = 30;

/**
 * 设置 cookie
 */
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

/**
 * 获取 cookie
 */
function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length);
    }
  }
  return null;
}

/**
 * 删除 cookie
 */
function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * 保存配置到 cookie（加密 token）
 */
export function saveSyncConfig(config: SyncConfig): void {
  const configToSave = {
    repo: config.repo,
    token: simpleEncrypt(config.token), // 加密 token
    branch: config.branch || "main",
    filePath: config.filePath || "sync-data.json",
  };
  const encrypted = btoa(
    unescape(encodeURIComponent(JSON.stringify(configToSave))),
  );
  setCookie(COOKIE_NAME, encrypted, COOKIE_EXPIRY_DAYS);
}

/**
 * 从 cookie 加载配置（解密 token）
 */
export function loadSyncConfig(): SyncConfig | null {
  const cookieValue = getCookie(COOKIE_NAME);
  if (!cookieValue) {
    return null;
  }

  try {
    const decrypted = decodeURIComponent(escape(atob(cookieValue)));
    const config = JSON.parse(decrypted) as SyncConfig;
    // 解密 token
    config.token = simpleDecrypt(config.token);
    return config;
  } catch (e) {
    console.error("加载配置失败", e);
    return null;
  }
}

/**
 * 清除保存的配置
 */
export function clearSyncConfig(): void {
  deleteCookie(COOKIE_NAME);
}

/**
 * 验证配置是否有效
 */
export function validateSyncConfig(config: Partial<SyncConfig>): string[] {
  const errors: string[] = [];

  if (!config.repo || !config.repo.trim()) {
    errors.push("仓库地址不能为空");
  } else if (!config.repo.includes("/")) {
    errors.push("仓库地址格式应为：owner/repo");
  }

  if (!config.token || !config.token.trim()) {
    errors.push("Token 不能为空");
  } else if (config.token.length < 20) {
    errors.push(
      "Token 长度过短，请检查是否正确（GitHub Token 通常以 ghp_、github_pat_等开头）",
    );
  }

  return errors;
}
