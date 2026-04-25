<template>
  <div class="vtl-wrapper">
    <div class="search">
      <Input v-model="keyword" @enter="filterNodes" placeholder="Search" />
      <Button @click="addNode">新建目录</Button>
    </div>
    <VueTreeList
      @click="onClick"
      @change-name="onChangeName"
      @end-edit="onEndEdit"
      @delete-node="onDel"
      @add-node="onAddNode"
      @drop="onDrop"
      @drop-before="dropBefore"
      @drop-after="dropAfter"
      :model="data"
      default-tree-node-name="新建文件夹"
      default-leaf-node-name="新建文件"
      :default-expanded="true"
    >
      <template v-slot:leafNameDisplay="{ model }">
        <span>
          {{ model.name }}
          <!-- <span class="muted">#{{ model.id }}</span> -->
        </span>
      </template>
      <template v-slot:addTreeNodeIcon>
        <span class="icon">📂</span>
      </template>
      <template v-slot:addLeafNodeIcon>
        <span class="icon">＋</span>
      </template>
      <template v-slot:editNodeIcon>
        <span class="icon">📃</span>
      </template>
      <template v-slot:delNodeIcon>
        <span class="icon">✂️</span>
      </template>
      <template #leafNodeIcon="{ model }">
        <span class="icon"><img :src="icons[model.fileType]" alt="" /></span>
      </template>
      <template v-slot:treeNodeIcon>
        <span class="icon">📂</span>
      </template>
    </VueTreeList>
    <!-- 新建文件对话框 -->
    <FileCreateDialog
      v-model="showFileDialog"
      :default-name="newFileData.name"
      @confirm="handleFileCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { VueTreeList, Tree, TreeNode } from "../ui/tree";
import { buildTreeWithSearch } from "../ui/tree/tools";
import { directories, files } from "../../db";
// import FileCreateDialog from "./FileCreateDialog.vue";
import { editors } from "../../editors";
const emit = defineEmits<{
  /** 点击节点时触发 */
  (e: "click", payload: Record<string, any>): void;
}>();
//保存目录和文件的数据库实例
// const newTree = ref<Record<string, unknown>>({});
const data = ref(new Tree([]).root);
const nodes = ref<TreeNode[]>([]);
const keyword = ref("");
// 新建文件对话框相关
const showFileDialog = ref(false);
const pendingNode = ref<TreeNode | null>(null);
const newFileData = ref<{
  name: string;
  fileType: string;
  pid: string | undefined;
}>({
  name: "",
  fileType: "excalidraw",
  pid: undefined,
});
const icons: Record<string, string> = {};
onMounted(async () => {
  data.value = new Tree(await getDirectoryAndFile()).root;
  editors.forEach((type) => {
    icons[type.value] = type.icon;
  });
});
const filterNodes = async () => {
  console.log("keyword", keyword.value);
  data.value = new Tree(await getDirectoryAndFile()).root;
};
async function getDirectoryAndFile() {
  const dirs = await directories.getList({ sort: { displayOrder: "asc" } });
  console.log("directories", dirs);
  nodes.value = [];
  nodes.value.push(
    ...dirs.map((dir) => new TreeNode({ ...dir, isLeaf: false })),
  );
  const fs = await files.getList({ sort: { displayOrder: "asc" } });
  console.log("files", fs);
  nodes.value.push(
    ...fs.map((file) => new TreeNode({ ...file, isLeaf: true })),
  );
  console.log("nodes", buildTreeWithSearch(nodes.value, keyword.value));
  return buildTreeWithSearch(nodes.value, keyword.value);
}

function onDel(node: TreeNode) {
  console.log("onDel", node);
  node.remove();
  switch (node.isLeaf) {
    case true:
      files.delete({ id: node.id });
      break;
    case false:
      directories.delete({ id: node.id });
      break;
  }
}

function onEndEdit(params: Record<string, unknown>) {
  console.log("onEndEdit", params);
  switch (params.isLeaf) {
    case true:
      files.update({ name: params.newName }, { id: params.id as string });
      break;
    case false:
      directories.update({ name: params.newName }, { id: params.id as string });
      break;
  }
}

function onChangeName(params: Record<string, unknown>) {
  console.log("onChangeName", params);
}

async function onAddNode(params: TreeNode) {
  console.log("onAddNode", params.toString(), { ...params });
  switch (params.isLeaf) {
    case true:
      // 弹出编辑窗口让用户输入文件名和选择文件类型
      pendingNode.value = params;
      newFileData.value = {
        name: params.name || "",
        fileType: "excalidraw",
        pid: params.pid as string | undefined,
      };
      showFileDialog.value = true;
      break;
    case false:
      await directories.save({
        id: params.id,
        name: params.name,
        pid: params.pid,
        displayOrder: nodes.value.length + 1,
      });
      break;
    default:
      break;
  }
  console.log("onAddNode", params);
}

async function handleFileCreate(data: { name: string; fileType: string }) {
  if (pendingNode.value) {
    await files.save({
      id: pendingNode.value.id,
      name: data.name,
      fileType: data.fileType,
      pid: pendingNode.value.pid,
      content: "",
      displayOrder: nodes.value.length + 1,
    });
    // 刷新数据
    await filterNodes();
  }
  pendingNode.value = null;
  filterNodes();
}

function onClick(params: Record<string, unknown>) {
  console.log("onClick", params);
  if (!params.isLeaf) {
    return;
  }
  let info = {};
  nodes.value.forEach((item) => {
    if (item.id === params.id) {
      info = item;
    }
  });
  emit("click", info);
}

function onDrop({
  node,
  src,
  target,
}: {
  node: TreeNode;
  src: TreeNode | null;
  target: TreeNode;
}) {
  console.log("onDrop", node, src, target);
  updateDisplayOrder(node, src, target);
  console.log("drop", node, src, target);
}
function updateDisplayOrder(
  node: TreeNode,
  src: TreeNode | null,
  _target: TreeNode,
) {
  switch (node.isLeaf) {
    case true:
      files.update(
        {
          pid: node.pid,
        },
        { id: node.id as string },
      );
      break;
    case false:
      directories.update(
        {
          pid: node.pid,
        },
        { id: node.id as string },
      );
      break;
    default:
      break;
  }
  src?.children?.forEach((item: any, index: any) => {
    switch (item.isLeaf) {
      case true:
        files.update({ displayOrder: index }, { id: item.id as string });
        break;
      case false:
        directories.update({ displayOrder: index }, { id: item.id as string });
        break;

      default:
        break;
    }
  });
}

function dropBefore({
  node,
  src,
  target,
}: {
  node: TreeNode;
  src: TreeNode | null;
  target: TreeNode;
}) {
  updateDisplayOrder(node, src, target);
  console.log("drop-before", node, src, target);
}

function dropAfter({
  node,
  src,
  target,
}: {
  node: TreeNode;
  src: TreeNode | null;
  target: TreeNode;
}) {
  console.log("drop-after", node, src, target);
}

async function addNode() {
  let dir = await directories.save({
    name: "新建文件夹",
    displayOrder: nodes.value.length + 1,
  });
  const node = new TreeNode({
    ...dir,
    isLeaf: false,
  });
  if (!data.value.children) data.value.children = [];
  data.value.addChildren(node);
}
</script>

<style lang="scss" rel="stylesheet/scss">
.vtl {
  .vtl-drag-disabled {
    background-color: #d0cfcf;
    &:hover {
      background-color: #d0cfcf;
    }
  }
  .vtl-disabled {
    background-color: #d0cfcf;
  }
}
</style>

<style lang="scss" rel="stylesheet/scss" scoped>
.icon {
  &:hover {
    cursor: pointer;
  }
  img {
    height: 20px;
    width: 20px;
  }
}

.muted {
  color: gray;
  font-size: 80%;
}
</style>
