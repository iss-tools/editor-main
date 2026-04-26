/**
 * GitHub API 工具函数
 */

export interface GitHubConfig {
  repo: string; // 格式：owner/repo
  token: string;
  branch?: string; // 默认 main
  filePath?: string; // 默认 sync-data.json
}

export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content?: string; // base64 编码的内容
  encoding?: string;
}

export interface GitHubError {
  message: string;
  status?: number;
}

/**
 * 解析 repo 字符串为 owner 和 repo
 */
export function parseRepo(
  repo: string,
): { owner: string; repo: string } | null {
  const parts = repo.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return { owner: parts[0], repo: parts[1] };
}

/**
 * 获取 GitHub 文件内容
 */
export async function getFileContent(
  config: GitHubConfig,
): Promise<GitHubFileContent | null> {
  const repoInfo = parseRepo(config.repo);
  if (!repoInfo) {
    throw new Error("无效的仓库地址，格式应为：owner/repo");
  }

  const branch = config.branch || "main";
  const filePath = config.filePath || "sync-data.json";

  const url = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${filePath}?ref=${branch}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${config.token}`,
      },
    });

    if (response.status === 404) {
      return null; // 文件不存在
    }

    if (!response.ok) {
      const error: GitHubError = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data: GitHubFileContent = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("网络请求失败");
  }
}

/**
 * 验证仓库和 token 是否有效
 */
export async function validateRepoAndToken(
  config: GitHubConfig,
): Promise<{ valid: boolean; error?: string }> {
  const repoInfo = parseRepo(config.repo);
  if (!repoInfo) {
    return { valid: false, error: "无效的仓库地址，格式应为：owner/repo" };
  }

  // 先尝试访问仓库 API
  const repoUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`;
  try {
    const response = await fetch(repoUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${config.token}`,
      },
    });

    if (response.status === 404) {
      return {
        valid: false,
        error: `仓库不存在：${config.repo}，请检查仓库地址是否正确`,
      };
    }

    if (response.status === 401) {
      return {
        valid: false,
        error: "Token 无效或已过期，请检查 Token 是否正确",
      };
    }

    if (!response.ok) {
      const error: GitHubError = await response.json();
      return {
        valid: false,
        error: error.message || `HTTP ${response.status}`,
      };
    }

    // 检查分支是否存在
    const branch = config.branch || "main";
    const branchUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/branches/${branch}`;
    const branchResponse = await fetch(branchUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${config.token}`,
      },
    });

    if (branchResponse.status === 404) {
      return {
        valid: false,
        error: `分支 "${branch}" 不存在，请检查分支名称（可能是 master 而不是 main）`,
      };
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: "网络请求失败" };
  }
}

/**
 * 上传文件到 GitHub
 */
export async function uploadFile(
  config: GitHubConfig,
  content: string,
  message: string = "Sync data update",
): Promise<{ sha: string; html_url: string }> {
  const repoInfo = parseRepo(config.repo);
  if (!repoInfo) {
    throw new Error("无效的仓库地址，格式应为：owner/repo");
  }

  const branch = config.branch || "main";
  const filePath = config.filePath || "sync-data.json";

  const url = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${filePath}`;
  console.log("Uploading to URL:", url);
  // 先获取现有文件以获取 sha
  let existingSha: string | undefined;
  try {
    const existing = await getFileContent(config);
    existingSha = existing?.sha;
  } catch (e) {
    // 文件不存在，忽略错误
  }

  const base64Content = btoa(unescape(encodeURIComponent(content)));

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: base64Content,
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    });

    if (!response.ok) {
      const error: GitHubError = await response.json();
      // 提供更详细的 404 错误信息
      if (response.status === 404) {
        throw new Error(
          `404 错误：仓库 "${config.repo}" 不存在或 Token 没有访问权限。请检查：\n1. 仓库地址是否正确（格式：owner/repo）\n2. Token 是否有效且具有 repo 权限\n3. 分支名称是否正确（main 或 master）`,
        );
      }
      if (response.status === 401) {
        throw new Error("401 错误：Token 无效或已过期，请重新生成 Token");
      }
      if (response.status === 403) {
        throw new Error(
          "403 错误：Token 没有足够的权限，请确保 Token 具有 repo 权限",
        );
      }
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return {
      sha: result.content.sha,
      html_url: result.content.html_url,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("上传失败");
  }
}

/**
 * 下载文件内容并解码
 */
export async function downloadFileContent(
  config: GitHubConfig,
): Promise<string | null> {
  const fileContent = await getFileContent(config);
  if (!fileContent || !fileContent.content) {
    return null;
  }

  // base64 解码
  try {
    const decoded = decodeURIComponent(escape(atob(fileContent.content)));
    return decoded;
  } catch (error) {
    throw new Error("文件内容解码失败");
  }
}
