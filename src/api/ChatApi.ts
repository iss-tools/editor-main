// 查询可用模型列表
export async function queryModels(
  apiKey: string,
  baseUrl: string,
  provider: string,
): Promise<string[]> {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    apiKey,
    baseUrl,
    provider,
  });

  const requestOptions = {
    method: "POST" as const,
    headers: myHeaders,
    body: raw,
    redirect: "follow" as const,
  };

  const response = await fetch(
    "https://api-proxy.aminigedoufu.dpdns.org/api/ai/models",
    requestOptions,
  );
  const result = await response.text();
  const data = JSON.parse(result);

  if (data.code === 200 && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
}

// AI 聊天请求类型定义
export interface ChatRequest {
  apiKey: string;
  baseUrl: string;
  provider: string;
  modelId: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  stream?: boolean;
}

// AI 聊天响应 chunk 类型定义
export interface ChatChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: any[];
      function_calls?: any[];
      reasoning_content?: string;
    };
    finish_reason?: string;
    message: {
      role?: string;
      content?: string;
      tool_calls?: any[];
      function_calls?: any[];
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 流式聊天接口
 * @param request 聊天请求参数
 * @returns 返回可读的 Response 对象用于处理流式数据
 */
export async function chatWithAI(request: ChatRequest): Promise<Response> {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    apiKey: request.apiKey,
    baseUrl: request.baseUrl,
    provider: request.provider,
    modelId: request.modelId,
    messages: request.messages,
    stream: request.stream ?? true,
  });

  const requestOptions = {
    method: "POST" as const,
    headers: myHeaders,
    body: raw,
    redirect: "follow" as const,
  };

  const response = await fetch(
    "https://api-proxy.aminigedoufu.dpdns.org/api/ai/chat",
    requestOptions,
  );

  // 检查是否为非流式响应（JSON 格式）
  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (data.code !== 200) {
        throw new Error(data.message || data.msg || `请求失败：${data.code}`);
      }
    } else if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`请求失败：${response.status} - ${errorText}`);
    }
  }

  return response;
}

/**
 * 解析 SSE 流式响应
 * @param response Response 对象
 * @param onChunk 每个 chunk 的回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export async function parseSSEStream(
  response: Response,
  onChunk: (chunk: ChatChunk) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
): Promise<void> {
  if (!response.ok) {
    const errorText = await response.text();
    onError(new Error(`请求失败：${response.status} - ${errorText}`));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError(new Error("无法读取响应流"));
    return;
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // 按行分割 SSE 数据
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // 保留最后一行不完整的行

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("data: ")) {
          const dataStr = trimmedLine.slice(6).trim();
          if (dataStr === "[DONE]") {
            onComplete();
            continue;
          }
          try {
            const data: ChatChunk = JSON.parse(dataStr);
            onChunk(data);
          } catch (e) {
            console.error("解析 chunk 失败:", e, dataStr);
          }
        }
      }
    }
    onComplete();
  } catch (error) {
    onError(error as Error);
  } finally {
    reader.releaseLock();
  }
}
