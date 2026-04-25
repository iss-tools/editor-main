import { IBase } from "@iss-ai/easy-web-store";

export interface IDirectory extends IBase {
  name: string;
  pid: string;
  displayOrder?: number;
}
export interface IFile extends IBase {
  name: string;
  thumbnail?: string;
  fileType: string; //excalidraw, markdown, html,drawio,drawnix,mermaid等
  pid: string | null;
  content?: string;
  size?: string;
  url?: string;
  tags?: string[];
  description?: string;
  displayOrder?: number;
}

export interface IFileHistory extends IFile {
  fileId: string | number;
  version?: number | string;
}

// 定义AI供应商配置接口
export interface AIProvider extends IBase {
  name: string;
  type: string; // openai, deepseek, siliconflow, volcengine, ollama, moonshot, tencent, newapi
  model: string;
  apiUrl: string;
  apiKey: string;
}

// 定义聊天消息接口
export interface ChatMessage extends IBase {
  fileId: string | null; // 关联的文件ID，null表示全局聊天
  role: "user" | "assistant";
  content: string;
  plan?: string;
  code?: string;
  attachments?: {
    type: "image" | "document" | "url";
    dataUrl?: string;
    content?: string;
    fileName?: string;
    url?: string;
    title?: string;
  }[];
  status: "pending" | "streaming" | "complete" | "error";
  metrics?: {
    startTime?: number;
    endTime?: number;
    planEndTime?: number;
  };
}
