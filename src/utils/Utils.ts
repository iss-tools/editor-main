import { trimStart, trimEnd } from "lodash-es";

/**
 * 解析 XML 格式的响应内容
 * 支持处理被 markdown 代码块包裹的 XML 内容（如 ```xml ... ```）
 * @param xmlString - 包含 XML 内容的字符串
 * @returns 解析后的对象，包含 plan 和 content 字段，如果解析失败返回 null
 */
export function parseXmlResponse(
  xmlString: string,
): { plan?: string; content?: string } | null {
  try {
    // 检查是否包含 XML 标签
    if (!xmlString.includes("<data>") || !xmlString.includes("</data>")) {
      return null;
    }

    // 处理 markdown 代码块包裹的 XML 内容
    const trimmedContent = trimEnd(xmlString.trim(), "`");
    if (trimmedContent.startsWith("```xml")) {
      // 移除开头的 ```xml 标记
      let cleanedContent = trimStart(trimmedContent, "```xml");
      // 移除结尾的 ``` 标记
      cleanedContent = trimEnd(cleanedContent, "```");
      xmlString = cleanedContent.trim();
    } else if (trimmedContent.startsWith("```")) {
      // 处理没有语言标识的代码块
      let cleanedContent = trimStart(trimmedContent, "```");
      cleanedContent = trimEnd(cleanedContent, "```");
      xmlString = cleanedContent.trim();
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const dataElement = xmlDoc.getElementsByTagName("data")[0];

    if (!dataElement) {
      return null;
    }

    const planElement = dataElement.getElementsByTagName("plan")[0];
    const contentElement = dataElement.getElementsByTagName("content")[0];

    const result: { plan?: string; content?: string } = {};

    if (planElement && planElement.textContent) {
      result.plan = planElement.textContent.trim();
    }

    if (contentElement && contentElement.textContent) {
      // 移除 CDATA 包装器，获取实际内容
      let content = contentElement.textContent.trim();
      // 处理 CDATA 部分
      content = content.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
      result.content = content.trim();
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error("XML 解析失败:", error);
    return null;
  }
}

/**
 * 从 Markdown 内容中提取代码块
 * @param content - 包含 Markdown 格式的内容字符串
 * @returns 提取出的代码内容，如果没有找到代码块则返回空字符串
 */
export function extractCodeFromMarkdown(content: string): string {
  const codeBlocks: string[] = [];
  let inCodeBlock = false;
  let currentBlock = "";
  const lines = content.split("\n");

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // 代码块结束，保存内容
        if (currentBlock.trim()) {
          codeBlocks.push(currentBlock.trim());
        }
        currentBlock = "";
      }
      inCodeBlock = !inCodeBlock;
    } else if (inCodeBlock) {
      currentBlock += line + "\n";
    }
  }

  // 返回最后一个代码块或所有代码块的组合
  return codeBlocks.length > 0 ? codeBlocks[codeBlocks.length - 1] : "";
}
