import type { TreeNode } from "./Tree";

let handlerCache: EventListener | null = null;
/**
 * 生成唯一 ID（UUID v4 格式）
 * @returns UUID 字符串
 */
export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const addHandler = function (
  element: EventTarget,
  type: string,
  handler: EventListener,
): void {
  handlerCache = handler;
  element.addEventListener(type, handler, false);
};

export const removeHandler = function (
  element: EventTarget,
  type: string,
): void {
  if (handlerCache) {
    element.removeEventListener(type, handlerCache, false);
    handlerCache = null;
  }
};

export interface TraversedNode {
  [key: string]: unknown;
  children?: TraversedNode[];
}

// depth first search
export const traverseTree = (root: TreeNode): TraversedNode => {
  const newRoot: TraversedNode = {};

  for (const k in root) {
    if (k !== "children" && k !== "parent") {
      newRoot[k] = (root as Record<string, unknown>)[k];
    }
  }

  if (root.children && root.children.length > 0) {
    newRoot.children = [];
    for (let i = 0, len = root.children.length; i < len; i++) {
      newRoot.children.push(traverseTree(root.children[i]));
    }
  }
  return newRoot;
};

/**
 * 构建树形结构（支持搜索，保留匹配节点及其祖先）
 * @param nodes 扁平数据数组
 * @param searchText 搜索关键词（模糊匹配 name 字段）
 * @returns 符合条件的树形结构
 */
export function buildTreeWithSearch(
  nodes: TreeNode[],
  searchText: string,
): TreeNode[] {
  if (!searchText || searchText.trim() === "") {
    return buildTree(nodes); // 无搜索时返回完整树
  }
  const nodeMap = new Map<number | string, TreeNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] });
  });
  // 标记哪些节点需要被保留（匹配或其祖先）
  const shouldKeep = new Set<number | string>();
  // 第一步：找出所有匹配节点
  const matchedNodes = nodes.filter(
    (node) =>
      node.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (node.content || "").toLowerCase().includes(searchText.toLowerCase()),
  );
  // 第二步：标记匹配节点及其所有祖先
  matchedNodes.forEach((node) => {
    let currentId = node.id;
    while (currentId !== 0) {
      shouldKeep.add(currentId);
      const currentNode = nodeMap.get(currentId);
      if (!currentNode) break;
      currentId = currentNode.pid || "";
    }
  });
  // 第三步：构建树，只包含 shouldKeep 中的节点
  const rootNodes: TreeNode[] = [];
  nodes.forEach((node) => {
    if (!shouldKeep.has(node.id)) return; // 跳过不需要的节点
    const currentNode = nodeMap.get(node.id)!;
    if (!node.pid) {
      rootNodes.push(currentNode);
    } else {
      const parentNode = nodeMap.get(node.pid || "");
      if (parentNode && shouldKeep.has(node.pid || "")) {
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.push(currentNode);
      }
    }
  });
  // 第四步：设置 isLeaf 属性（递归）
  // 默认文件夹为非叶子节点，文件为叶子节点
  // function setLeafFlag(node: TreeNode) {
  //   if (!node.children || node.children.length === 0) {
  //     node.isLeaf = true;
  //   } else {
  //     node.isLeaf = false;
  //     node.children.forEach(setLeafFlag);
  //   }
  // }
  // rootNodes.forEach(setLeafFlag);
  return rootNodes;
}
/**
 * 辅助函数：构建完整树（无搜索时用）
 */
export function buildTree(nodes: TreeNode[]): TreeNode[] {
  const nodeMap = new Map<number | string, TreeNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] });
  });
  const rootNodes: TreeNode[] = [];
  nodes.forEach((node) => {
    const currentNode = nodeMap.get(node.id)!;
    if (!node.pid) {
      rootNodes.push(currentNode);
    } else {
      const parentNode = nodeMap.get(node.pid || "");
      if (parentNode) {
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.push(currentNode);
      }
    }
  });
  // 默认文件夹为非叶子节点，文件为叶子节点
  // function setLeafFlag(node: TreeNode) {
  //   if (!node.children || node.children.length === 0) {
  //     node.isLeaf = true;
  //   } else {
  //     node.isLeaf = false;
  //     node.children.forEach(setLeafFlag);
  //   }
  // }
  // rootNodes.forEach(setLeafFlag);
  return rootNodes;
}
