<script setup lang="ts">
import { defineEmits, defineProps, withDefaults, ref, watch } from "vue";
import { Dialog, Input, Button, Radio } from "../ui";
import { editors } from "../../editors";

defineOptions({
  name: "FileCreateDialog",
});

interface Props {
  modelValue: boolean;
  defaultName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultName: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm", data: { name: string; fileType: string }): void;
}>();

const showDialog = ref(props.modelValue);
const fileName = ref(props.defaultName);
const fileType = ref("excalidraw");

watch(
  () => props.modelValue,
  (value) => {
    showDialog.value = value;
    if (value) {
      fileName.value = props.defaultName;
      fileType.value = "excalidraw";
    }
  },
);

watch(showDialog, (value) => {
  emit("update:modelValue", value);
});

const handleConfirm = () => {
  if (!fileName.value) {
    alert("请输入文件名");
    return;
  }
  emit("confirm", {
    name: fileName.value,
    fileType: fileType.value,
  });
  showDialog.value = false;
};

const handleCancel = () => {
  showDialog.value = false;
};
</script>

<template>
  <Dialog v-model="showDialog" title="新建文件" width="400px" :closable="true">
    <div class="file-form">
      <div class="form-item">
        <label>文件名</label>
        <Input v-model="fileName" placeholder="请输入文件名" />
      </div>
      <div class="form-item">
        <label>文件类型</label>
        <Radio v-model="fileType" :options="editors" name="fileType" />
      </div>
    </div>
    <template #footer>
      <Button @click="handleCancel">取消</Button>
      <Button @click="handleConfirm">确定</Button>
    </template>
  </Dialog>
</template>

<style lang="scss" scoped>
.file-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text);
  }
}
</style>
