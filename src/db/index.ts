import { EasyIndexedDb } from "@iss-ai/easy-web-store";
import {
  AIProvider,
  ChatMessage,
  IDirectory,
  IFile,
  IFileHistory,
} from "./types";
export class EasyDirectoryDb extends EasyIndexedDb<IDirectory> {
  constructor() {
    super("directories", "id,createTime,updateTime,displayOrder,pid,name");
  }
  /**
   * 保存或更新单条数据
   * @param data 要保存的数据
   * @returns Promise 返回保存后的数据
   */
  async save(data: Record<string | number, any>): Promise<IDirectory> {
    data.displayOrder = data.displayOrder || 999;
    return super.save(data);
  }
}
export class EasyFileDb extends EasyIndexedDb<IFile> {
  constructor() {
    super(
      "files",
      "id,createTime,updateTime,displayOrder,pid,name,content,url,fileType,thumbnail,size,tags,description",
    );
  }
  /**
   * 保存或更新单条数据
   * @param data 要保存的数据
   * @returns Promise 返回保存后的数据
   */
  async save(data: Record<string | number, any>): Promise<IFile> {
    data.displayOrder = data.displayOrder || 999;
    return super.save(data);
  }
}
export class EasyFileHistoryDb extends EasyIndexedDb<IFileHistory> {
  constructor() {
    super("fileHistory", "id,createTime,updateTime,fileId");
  }
}
export class EasyProviderDb extends EasyIndexedDb<AIProvider> {
  constructor() {
    super(
      "aiProviders",
      "id,createTime,updateTime,name,type,model,apiUrl,apiKey",
    );
  }
}

export class EasyChatMessageStore extends EasyIndexedDb<ChatMessage> {
  constructor() {
    super("chatMessages", "id,createTime,updateTime,fileId,role,status");
  }

  /**
   * 获取指定文件的聊天记录
   * @param fileId 文件ID，null表示全局聊天
   * @returns Promise 返回聊天记录列表
   */
  async getMessagesByFileId(fileId: string | null): Promise<ChatMessage[]> {
    const allMessages = await this.getList({});
    return allMessages.filter((msg) => msg.fileId === fileId);
  }

  /**
   * 清除指定文件的聊天记录
   * @param fileId 文件ID，null表示全局聊天
   * @returns Promise
   */
  async clearMessagesByFileId(fileId: string | null): Promise<void> {
    const messages = await this.getMessagesByFileId(fileId);
    for (const message of messages) {
      if (message.id) {
        await this.delete({ id: message.id });
      }
    }
  }
}

// 创建数据库实例
export const providerDb = new EasyProviderDb();
//保存目录和文件的数据库实例
export const directories = new EasyDirectoryDb();
export const files = new EasyFileDb();
export const fileHistories = new EasyFileHistoryDb();
export const chatMessageStore = new EasyChatMessageStore();
