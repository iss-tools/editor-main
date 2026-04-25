<template>
  <div class="vtl">
    <!-- 节点容器：当节点名称不是 'root' 时渲染（隐藏根节点） -->
    <div
      v-if="model.name !== 'root'"
      :id="String(model.id)"
      class="vtl-node"
      :class="{ 'vtl-leaf-node': model.isLeaf, 'vtl-tree-node': !model.isLeaf }"
    >
      <!-- 节点上方拖放区域：用于将节点拖放到当前节点之前 -->
      <div
        class="vtl-border vtl-up"
        :class="{ 'vtl-active': isDragEnterUp }"
        @drop="dropBefore"
        @dragenter="dragEnterUp"
        @dragover="dragOverUp"
        @dragleave="dragLeaveUp"
      />

      <!-- 节点主体：包含图标、名称和操作按钮 -->
      <div
        :class="treeNodeClass"
        :draggable="!model.dragDisabled"
        @dragstart="dragStart"
        @dragover="dragOver"
        @dragenter="dragEnter"
        @dragleave="dragLeave"
        @drop="drop"
        @dragend="dragEnd"
        @mouseover="mouseOver"
        @mouseout="mouseOut"
        @click.stop="click"
        @dblclick.stop="dblClick"
      >
        <!-- 展开/折叠图标：仅当节点有子节点时显示 -->
        <span
          class="vtl-caret vtl-is-small"
          v-if="model.children && model.children.length > 0"
        >
          <i
            class="vtl-icon"
            :class="caretClass"
            @click.prevent.stop="toggle"
          ></i>
        </span>

        <!-- 叶子节点图标：使用插槽允许自定义 -->
        <span v-if="model.isLeaf">
          <slot
            name="leafNodeIcon"
            :expanded="expanded"
            :model="model"
            :root="rootNode"
          >
            <i class="vtl-icon vtl-menu-icon vtl-icon-file"></i>
          </slot>
        </span>
        <!-- 文件夹节点图标：使用插槽允许自定义 -->
        <span v-else>
          <slot
            name="treeNodeIcon"
            :expanded="expanded"
            :model="model"
            :root="rootNode"
          >
            <i class="vtl-icon vtl-menu-icon vtl-icon-folder"></i>
          </slot>
        </span>

        <!-- 节点名称显示：非编辑模式下显示文本 -->
        <div class="vtl-node-content" v-if="!editable">
          <slot
            name="leafNameDisplay"
            :expanded="expanded"
            :model="model"
            :root="rootNode"
          >
            {{ model.name }}
          </slot>
        </div>
        <!-- 节点名称编辑：编辑模式下显示输入框 -->
        <input
          v-else
          class="vtl-input"
          type="text"
          ref="nodeInput"
          :value="model.name"
          @input="updateName"
          @blur="setUnEditable"
          @keyup.enter="setUnEditable"
        />

        <!-- 操作按钮区域：鼠标悬停时显示 -->
        <div class="vtl-operation" v-show="isHover && !editable">
          <!-- 添加子文件夹按钮 -->
          <span
            :title="defaultAddTreeNodeTitle"
            @click.stop.prevent="addChild(false)"
            v-if="!model.isLeaf && !model.addTreeNodeDisabled"
          >
            <slot
              name="addTreeNodeIcon"
              :expanded="expanded"
              :model="model"
              :root="rootNode"
            >
              <i class="vtl-icon vtl-icon-folder-plus-e"></i>
            </slot>
          </span>
          <!-- 添加子文件按钮 -->
          <span
            :title="defaultAddLeafNodeTitle"
            @click.stop.prevent="addChild(true)"
            v-if="!model.isLeaf && !model.addLeafNodeDisabled"
          >
            <slot
              name="addLeafNodeIcon"
              :expanded="expanded"
              :model="model"
              :root="rootNode"
            >
              <i class="vtl-icon vtl-icon-plus"></i>
            </slot>
          </span>
          <!-- 编辑节点按钮 -->
          <span
            title="编辑"
            @click.stop.prevent="setEditable"
            v-if="!model.editNodeDisabled"
          >
            <slot
              name="editNodeIcon"
              :expanded="expanded"
              :model="model"
              :root="rootNode"
            >
              <i class="vtl-icon vtl-icon-edit"></i>
            </slot>
          </span>
          <!-- 删除节点按钮 -->
          <span
            title="删除"
            @click.stop.prevent="delNode"
            v-if="!model.delNodeDisabled"
          >
            <slot
              name="delNodeIcon"
              :expanded="expanded"
              :model="model"
              :root="rootNode"
            >
              <i class="vtl-icon vtl-icon-trash"></i>
            </slot>
          </span>
        </div>
      </div>

      <!-- 节点下方拖放区域：用于将节点拖放到当前节点之后 -->
      <div
        v-if="model.children && model.children.length > 0 && expanded"
        class="vtl-border vtl-bottom"
        :class="{ 'vtl-active': isDragEnterBottom }"
        @drop="dropAfter"
        @dragenter="dragEnterBottom"
        @dragover="dragOverBottom"
        @dragleave="dragLeaveBottom"
      ></div>
    </div>

    <!-- 子节点容器：当节点是文件夹且（是根节点或已展开）时渲染 -->
    <div
      :class="{ 'vtl-tree-margin': model.name !== 'root' }"
      v-show="model.name === 'root' || expanded"
      v-if="isFolder"
    >
      <!-- 递归渲染子节点 -->
      <VueTreeList
        v-for="(child, index) in model.children"
        :default-tree-node-name="defaultTreeNodeName"
        :default-leaf-node-name="defaultLeafNodeName"
        :default-expanded="defaultExpanded"
        :model="child"
        :key="child.id"
        :displayOrder="index"
      >
        <!-- 插槽透传：允许父组件自定义子节点的各个部分 -->
        <template v-slot:leafNameDisplay="{ expanded, model, root }">
          <slot
            name="leafNameDisplay"
            :expanded="expanded"
            :model="model"
            :root="root"
          />
        </template>
        <template v-slot:addTreeNodeIcon="{ expanded, model, root }">
          <slot
            name="addTreeNodeIcon"
            :expanded="expanded"
            :model="model"
            :root="root"
          />
        </template>
        <template v-slot:addLeafNodeIcon="{ expanded, model, root }">
          <slot
            name="addLeafNodeIcon"
            :expanded="expanded"
            :model="model"
            :root="root"
          />
        </template>
        <template v-slot:editNodeIcon="{ expanded, model, root }">
          <slot
            name="editNodeIcon"
            :expanded="expanded"
            :model="model"
            :root="root"
          />
        </template>
        <template v-slot:delNodeIcon="{ expanded, model, root }">
          <slot
            name="delNodeIcon"
            :expanded="expanded"
            :model="model"
            :root="root"
          />
        </template>
        <template v-slot:leafNodeIcon="{ expanded, model, root }">
          <slot
            name="leafNodeIcon"
            :expanded="expanded"
            :model="model"
            :root="root"
          />
        </template>
        <template v-slot:treeNodeIcon="{ expanded, model, root }">
          <slot
            name="treeNodeIcon"
            :expanded="expanded"
            :model="model"
            :root="root"
          />
        </template>
      </VueTreeList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, provide, inject, onBeforeUnmount } from "vue";
import { TreeNode } from "./Tree";
import { removeHandler } from "./tools";

defineOptions({
  name: "VueTreeList",
});

// ==================== Slots 定义 ====================
// 插槽参数类型
interface LeafNameDisplaySlotProps {
  expanded: boolean;
  model: TreeNode;
  root: TreeNode | undefined;
}

interface AddTreeNodeIconSlotProps {
  expanded: boolean;
  model: TreeNode;
  root: TreeNode | undefined;
}

interface AddLeafNodeIconSlotProps {
  expanded: boolean;
  model: TreeNode;
  root: TreeNode | undefined;
}

interface EditNodeIconSlotProps {
  expanded: boolean;
  model: TreeNode;
  root: TreeNode | undefined;
}

interface DelNodeIconSlotProps {
  expanded: boolean;
  model: TreeNode;
  root: TreeNode | undefined;
}

interface LeafNodeIconSlotProps {
  expanded: boolean;
  model: TreeNode;
  root: TreeNode | undefined;
}

interface TreeNodeIconSlotProps {
  expanded: boolean;
  model: TreeNode;
  root: TreeNode | undefined;
}

type VueTreeListSlots = {
  leafNameDisplay?: (props: LeafNameDisplaySlotProps) => void;
  addTreeNodeIcon?: (props: AddTreeNodeIconSlotProps) => void;
  addLeafNodeIcon?: (props: AddLeafNodeIconSlotProps) => void;
  editNodeIcon?: (props: EditNodeIconSlotProps) => void;
  delNodeIcon?: (props: DelNodeIconSlotProps) => void;
  leafNodeIcon?: (props: LeafNodeIconSlotProps) => void;
  treeNodeIcon?: (props: TreeNodeIconSlotProps) => void;
};

const slots = defineSlots<VueTreeListSlots>();

// ==================== Props 定义 ====================
const props = withDefaults(
  defineProps<{
    /** 当前节点的数据模型 */
    model: TreeNode;
    /** 默认叶子节点名称 */
    defaultLeafNodeName?: string;
    /** 默认树节点（文件夹）名称 */
    defaultTreeNodeName?: string;
    /** 默认添加树节点按钮的提示文本 */
    defaultAddTreeNodeTitle?: string;
    /** 默认添加叶子节点按钮的提示文本 */
    defaultAddLeafNodeTitle?: string;
    /** 默认是否展开 */
    defaultExpanded?: boolean;
    displayOrder?: number;
  }>(),
  {
    defaultLeafNodeName: "文件",
    defaultTreeNodeName: "文件夹",
    defaultAddTreeNodeTitle: "新建文件夹",
    defaultAddLeafNodeTitle: "新建文件",
    defaultExpanded: true,
  },
);

// ==================== Events 定义 ====================
const emit = defineEmits<{
  /** 点击节点时触发 */
  (e: "click", payload: Record<string, unknown>): void;
  (e: "dblclick", payload: Record<string, unknown>): void;
  /** 修改节点名称时触发 */
  (
    e: "change-name",
    payload: {
      id: number | string;
      oldName: string;
      newName: string;
      node?: TreeNode;
      eventType?: string;
    },
  ): void;
  /** 删除节点时触发 */
  (e: "delete-node", node: TreeNode): void;
  /** 添加节点时触发 */
  (e: "add-node", node: TreeNode): void;
  /** 拖放节点到目标节点内部时触发 */
  (
    e: "drop",
    payload: { target: TreeNode; node: TreeNode; src: TreeNode | null },
  ): void;
  /** 拖放节点到目标节点之前时触发 */
  (
    e: "drop-before",
    payload: { target: TreeNode; node: TreeNode; src: TreeNode | null },
  ): void;
  /** 拖放节点到目标节点之后时触发 */
  (
    e: "drop-after",
    payload: { target: TreeNode; node: TreeNode; src: TreeNode | null },
  ): void;
  /** 结束编辑时触发 */
  (
    e: "end-edit",
    payload: {
      id: number | string;
      oldName: string;
      newName: string;
      node: TreeNode;
      isLeaf: boolean;
    },
  ): void;
}>();

// ==================== 拖拽状态管理 ====================
// 使用 window 对象存储拖拽状态，避免 Vite HMR 导致状态丢失
// 所有 VueTreeList 实例通过 window 共享拖拽状态
declare global {
  interface Window {
    __vueTreeListDragOperation?: { model: TreeNode } | null;
  }
}

function getCompInOperation(): { model: TreeNode } | null {
  return window.__vueTreeListDragOperation ?? null;
}

function setCompInOperation(value: { model: TreeNode } | null): void {
  window.__vueTreeListDragOperation = value;
}

// ==================== Provide/Inject 机制 ====================
// 根节点事件发射器类型
type RootEmitFn = (event: string, payload: unknown) => void;

// 判断当前节点是否为根节点
const isRoot = props.model.name === "root";

/**
 * 根节点事件发射器
 * - 如果是根节点，直接使用 emit 发送事件
 * - 如果不是根节点，从父级 inject 获取发射器
 */
const rootEmit: RootEmitFn = isRoot
  ? (event: string, payload: unknown) => {
      emit(event as any, payload as any);
    }
  : inject<RootEmitFn>("vtl-root-emit", () => {});

// 如果是根节点，provide 事件发射器给子节点使用
if (isRoot) {
  provide("vtl-root-emit", rootEmit);
}

/**
 * 根节点引用
 * 返回根节点模型，仅当当前节点是根节点时有值
 */
const rootNode = computed(() => {
  return props.model.name === "root" ? props.model : undefined;
});

// ==================== 响应式状态 ====================
const isHover = ref(false); // 鼠标是否悬停
const editable = ref(false); // 是否处于编辑模式
const isDragEnterUp = ref(false); // 拖拽是否进入上方区域
const isDragEnterBottom = ref(false); // 拖拽是否进入下方区域
const isDragEnterNode = ref(false); // 拖拽是否进入节点主体
const expanded = ref(props.defaultExpanded); // 是否展开

const nodeInput = ref<HTMLInputElement | null>(null); // 编辑输入框引用

// ==================== 计算属性 ====================
/**
 * 展开/折叠图标的 CSS 类
 * 展开时显示向下箭头，折叠时显示向右箭头
 */
const caretClass = computed(() => {
  return expanded.value ? "vtl-icon-caret-down" : "vtl-icon-caret-right";
});

/**
 * 判断是否是文件夹（有子节点）
 */
const isFolder = computed(() => {
  return props.model.children && props.model.children.length > 0;
});

/**
 * 节点主体的 CSS 类
 */
const treeNodeClass = computed(() => {
  return {
    "vtl-node-main": true,
    "vtl-active": isDragEnterNode.value, // 拖拽进入时高亮
    "vtl-drag-disabled": props.model.dragDisabled, // 拖拽禁用
    "vtl-disabled": props.model.disabled, // 节点禁用
  };
});

// ==================== 生命周期钩子 ====================
onBeforeUnmount(() => {
  // 组件卸载时移除全局事件监听器
  removeHandler(window, "keyup");
});

// ==================== 方法定义 ====================

/**
 * 更新节点名称（输入时触发）
 * @param e - 输入事件
 */
function updateName(e: Event) {
  const target = e.target as HTMLInputElement;
  const oldName = props.model.name;
  props.model.changeName(target.value);
  rootEmit("change-name", {
    id: props.model.id,
    oldName: oldName,
    newName: target.value,
    node: props.model,
  });
}

/**
 * 删除节点
 * 向根节点发送删除事件，由父组件处理实际删除逻辑
 */
function delNode() {
  rootEmit("delete-node", props.model);
}

/**
 * 进入编辑模式
 * 聚焦输入框并选中文本
 */
function setEditable() {
  editable.value = true;
  nextTick(() => {
    const input = nodeInput.value;
    if (input) {
      input.focus();
      input.setSelectionRange(0, input.value.length);
    }
  });
}

/**
 * 退出编辑模式
 * 保存修改后的名称并发送事件
 * @param e - 模糊事件或键盘事件
 */
function setUnEditable(e: Event) {
  if (editable.value === false) return;
  editable.value = false;
  const target = e.target as HTMLInputElement;
  const oldName = props.model.name;
  props.model.changeName(target.value);
  rootEmit("change-name", {
    id: props.model.id,
    oldName: oldName,
    newName: target.value,
    eventType: "blur",
  });
  rootEmit("end-edit", {
    id: props.model.id,
    oldName: oldName,
    isLeaf: props.model.isLeaf,
    node: props.model,
    newName: target.value,
  });
}

/**
 * 切换展开/折叠状态
 * 仅当节点是文件夹时有效
 */
function toggle() {
  if (isFolder.value) {
    expanded.value = !expanded.value;
  }
}

/**
 * 鼠标移入
 * 禁用状态下不显示悬停效果
 */
function mouseOver() {
  if (props.model.disabled) return;
  isHover.value = true;
}

/**
 * 鼠标移出
 */
function mouseOut() {
  isHover.value = false;
}

/**
 * 点击节点
 * 发送点击事件，包含 toggle 方法和节点数据
 */
function click() {
  toggle();
  rootEmit("click", {
    toggle,
    ...props.model,
  });
}
function dblClick() {
  setEditable();
  rootEmit("dblclick", {
    ...props.model,
  });
}

/**
 * 添加子节点
 * @param isLeaf - 是否添加叶子节点（false 为文件夹）
 */
function addChild(isLeaf: boolean) {
  const name = isLeaf ? props.defaultLeafNodeName : props.defaultTreeNodeName;
  expanded.value = true;
  const node = new TreeNode({
    name,
    isLeaf,
    displayOrder: props.displayOrder || 0 + 1,
  });
  props.model.addChildren(node);
  rootEmit("add-node", node);
}

// ==================== 拖拽相关方法 ====================

/**
 * 拖拽开始
 * 记录当前拖拽的组件，设置拖拽效果
 * @param e - 拖拽事件
 */
function dragStart(e: DragEvent) {
  if (!(props.model.dragDisabled || props.model.disabled)) {
    setCompInOperation({ model: props.model });
    // Firefox 需要设置数据才能开始拖拽
    e.dataTransfer?.setData("text/plain", String(props.model.id));
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
    return true;
  }
  return false;
}

/**
 * 拖拽结束
 * 清空拖拽状态
 */
function dragEnd() {
  setCompInOperation(null);
}

/**
 * 拖拽经过节点主体
 * 阻止默认行为以允许放置
 * @param e - 拖拽事件
 */
function dragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "move";
  }
  return false;
}

/**
 * 拖拽进入节点主体
 * 验证：不能是同一个节点，不能拖拽到叶子节点
 */
function dragEnter(e: DragEvent) {
  e.preventDefault();
  const op = getCompInOperation();
  if (!op) return;
  if (op.model.id === props.model.id || props.model.isLeaf) return;
  isDragEnterNode.value = true;
}

/**
 * 拖拽离开节点主体
 */
function dragLeave() {
  isDragEnterNode.value = false;
}

/**
 * 拖拽放置到节点内部（成为子节点）
 * 将拖拽的节点移动为目标节点的子节点
 */
function drop(e: DragEvent) {
  e.preventDefault();
  const op = getCompInOperation();
  if (!op) return;
  const oldParent = op.model.parent;
  op.model.moveInto(props.model);
  isDragEnterNode.value = false;
  rootEmit("drop", {
    target: props.model,
    node: op.model,
    src: oldParent,
  });
}

/**
 * 拖拽进入节点上方区域
 */
function dragEnterUp(e: DragEvent) {
  e.preventDefault();
  const op = getCompInOperation();
  if (!op) return;
  isDragEnterUp.value = true;
}

/**
 * 拖拽经过节点上方区域
 * @param e - 拖拽事件
 */
function dragOverUp(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "move";
  }
  return false;
}

/**
 * 拖拽离开节点上方区域
 */
function dragLeaveUp() {
  isDragEnterUp.value = false;
}

/**
 * 拖拽放置到节点之前（同级插入）
 * 将拖拽的节点插入到目标节点之前
 */
function dropBefore(e: DragEvent) {
  e.preventDefault();
  const op = getCompInOperation();
  if (!op) return;
  const oldParent = op.model.parent;
  op.model.insertBefore(props.model);
  isDragEnterUp.value = false;
  rootEmit("drop-before", {
    target: props.model,
    node: op.model,
    src: oldParent,
  });
}

/**
 * 拖拽进入节点下方区域
 */
function dragEnterBottom(e: DragEvent) {
  e.preventDefault();
  const op = getCompInOperation();
  if (!op) return;
  isDragEnterBottom.value = true;
}

/**
 * 拖拽经过节点下方区域
 * @param e - 拖拽事件
 */
function dragOverBottom(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "move";
  }
  return false;
}

/**
 * 拖拽离开节点下方区域
 */
function dragLeaveBottom() {
  isDragEnterBottom.value = false;
}

/**
 * 拖拽放置到节点之后（同级插入）
 * 将拖拽的节点插入到目标节点之后
 */
function dropAfter(e: DragEvent) {
  e.preventDefault();
  const op = getCompInOperation();
  if (!op) return;
  const oldParent = op.model.parent;
  op.model.insertAfter(props.model);
  isDragEnterBottom.value = false;
  rootEmit("drop-after", {
    target: props.model,
    node: op.model,
    src: oldParent,
  });
}
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
.vtl {
  z-index: 9999;
}
// ==================== 图标字体定义 ====================
@font-face {
  font-family: "icomoon";
  src: url("./fonts/icomoon.eot?ui1hbx");
  src:
    url("./fonts/icomoon.eot?ui1hbx#iefix") format("embedded-opentype"),
    url("./fonts/icomoon.ttf?ui1hbx") format("truetype"),
    url("./fonts/icomoon.woff?ui1hbx") format("woff"),
    url("./fonts/icomoon.svg?ui1hbx#icomoon") format("svg");
  font-weight: normal;
  font-style: normal;
}

// 图标基础样式
.vtl-icon {
  /* use !important to prevent issues with browser extensions that change fonts */
  font-family: "icomoon" !important;
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;

  /* Better Font Rendering =========== */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  // 菜单图标样式
  &.vtl-menu-icon {
    margin-right: 4px;
    &:hover {
      color: inherit;
    }
  }
  // 悬停效果
  &:hover {
    color: var(--secondary);
  }
}

// 图标字符映射
.vtl-icon-file:before {
  content: "\e906";
}
.vtl-icon-folder:before {
  content: "\e907";
}
.vtl-icon-caret-down:before {
  content: "\e901";
}
.vtl-icon-caret-right:before {
  content: "\e900";
}
.vtl-icon-edit:before {
  content: "\e902";
}
.vtl-icon-folder-plus-e:before {
  content: "\e903";
}
.vtl-icon-plus:before {
  content: "\e904";
}
.vtl-icon-trash:before {
  content: "\e905";
}

// 拖放区域样式
.vtl-border {
  height: 5px;
  &.vtl-up {
    margin-top: -5px;
    background-color: transparent;
  }
  &.vtl-bottom {
    background-color: transparent;
  }
  &.vtl-active {
    border-bottom: 3px dashed var(--secondary);
    /*background-color: blue;*/
  }
}

// 节点主体样式
.vtl-node-main {
  display: flex;
  align-items: center;
  padding: 5px 0 5px 1rem;

  // 输入框样式
  .vtl-input {
    border: none;
    max-width: 150px;
    border-bottom: 1px solid var(--secondary);
  }

  // 悬停背景
  &:hover {
    background-color: var(--secondary);
  }

  // 拖拽激活状态
  &.vtl-active {
    outline: 2px dashed var(--secondary);
  }

  // 展开图标容器
  .vtl-caret {
    margin-left: -1rem;
  }

  // 操作按钮区域
  .vtl-operation {
    margin-left: 2rem;
    letter-spacing: 1px;
  }
}

// 可点击项
.vtl-item {
  cursor: pointer;
}

// 树缩进
.vtl-tree-margin {
  margin-left: 2em;
}
</style>
