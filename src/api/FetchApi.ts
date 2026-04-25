// API 基础配置
const BASE_URL = "http://localhost:8787";

/**
 * URL 解析响应数据
 */
export interface ReadabilityResponse {
  code: number;
  data: {
    url: string;
    title: string;
    description: string;
    content: string;
  };
  message: string;
}

/**
 * URL 解析请求参数
 */
export interface ReadabilityRequest {
  url: string;
  format?: "markdown" | "html" | "text";
}

/**
 * 调用 readability 接口获取网页正文内容
 * @param params 请求参数
 * @returns 解析后的网页内容
 */
export async function fetchReadability(
  params: ReadabilityRequest,
): Promise<ReadabilityResponse> {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    url: params.url,
    format: params.format || "markdown",
  });

  const requestOptions: RequestInit = {
    method: "POST",
    headers: headers,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(`${BASE_URL}/readability`, requestOptions);
  return await response.json();
}
