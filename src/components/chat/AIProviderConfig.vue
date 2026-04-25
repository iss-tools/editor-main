<template>
  <div class="ai-provider-config">
    <h3>AI 聊天供应商配置</h3>
    <div class="config-list">
      <div
        v-for="(provider, index) in providers"
        :key="index"
        class="provider-item"
      >
        <div class="provider-header">
          <span>{{ provider.name }}</span>
          <div class="actions">
            <Button @click="editProvider(index)">编辑</Button>
            <Button @click="deleteProvider(index)">删除</Button>
          </div>
        </div>
        <div class="provider-details" v-if="editingIndex === index">
          <div class="form-group">
            <label>配置名:</label>
            <Input v-model="provider.name"></Input>
          </div>
          <div class="form-group">
            <label>供应商:</label>
            <Select
              v-model="provider.type"
              style="width: 10rem"
              :options="providerTypes"
              @change="changeType(provider)"
            />
          </div>

          <div class="form-group">
            <label>API 地址:</label>
            <Input type="text" v-model="provider.apiUrl" />
          </div>
          <div class="form-group">
            <label>API Key:</label>
            <Input type="password" v-model="provider.apiKey" />
          </div>
          <div class="form-group">
            <label>模型:</label>
            <div class="model-input-group">
              <Input type="text" v-model="provider.model" />
              <Button
                @click="queryModelsForProvider(index)"
                :loading="loadingModelIndex === index"
                :disabled="!provider.apiUrl || !provider.apiKey"
              >
                查询模型
              </Button>
            </div>
            <!-- 查询结果选择器 -->
            <div
              v-if="availableModels.length > 0 && activeModelIndex === index"
              class="model-selector"
            >
              <Select
                filterable
                v-model="provider.model"
                :options="modelOptions"
                style="width: 100%"
              />
            </div>
          </div>
          <div class="form-actions">
            <Button @click="saveProvider(index)">保存</Button>
            <Button @click="cancelEdit">取消</Button>
          </div>
        </div>
      </div>
    </div>
    <div class="add-provider">
      <Button @click="addProvider">+ 添加新供应商</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { providerDb } from "../../db/index";
import { AIProvider } from "../../db/types";
import Select from "@/components/ui/Select.vue";
import { queryModels } from "@/api/ChatApi";

// 定义供应商类型
const providerTypes = [
  { value: "openai", label: "OpenAI", apiUrl: "https://api.openai.com/v1" },
  {
    value: "deepseek",
    label: "DeepSeek",
    apiUrl: "https://api.deepseek.com/v1",
  },
  {
    value: "siliconflow",
    label: "硅基流动",
    apiUrl: "https://api.siliconflow.com/v1",
  },
  {
    value: "modelscope",
    label: "ModelScope魔塔",
    apiUrl: "https://api-inference.modelscope.cn/v1",
  },
  {
    value: "bigmodel",
    label: "智普",
    apiUrl: "https://open.bigmodel.cn/api/paas/v4",
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    apiUrl: "https://openrouter.ai/api/v1",
  },
  {
    value: "volcengine",
    label: "火山引擎",
    apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
  },
  { value: "ollama", label: "Ollama", apiUrl: "http://localhost:11434/v1" },
  {
    value: "moonshot",
    label: "月之暗面",
    apiUrl: "https://api.moonshot.cn/v1",
  },
  {
    value: "tencent",
    label: "腾讯混元",
    apiUrl: "https://api.hunyuan.cloud.tencent.com",
  },
  { value: "newapi", label: "New API", apiUrl: "http://localhost:3000/v1" },
];

// 状态管理
const providers = ref<AIProvider[]>([]);
const editingIndex = ref<number | null>(null);
const loadingModelIndex = ref<number | null>(null);
const availableModels = ref<string[]>([]);
const activeModelIndex = ref<number | null>(null);

// 计算模型选项
const modelOptions = computed(() =>
  availableModels.value.map((model) => ({ label: model, value: model })),
);

// 加载已保存的配置
onMounted(async () => {
  providers.value = await providerDb.getList({});
});
const changeType = (provider: AIProvider) => {
  provider.apiUrl =
    providerTypes.find((type) => type.value === provider.type)?.apiUrl || "";
};

// 编辑供应商
const editProvider = (index: number) => {
  editingIndex.value = index;
  // 切换编辑时清空之前的模型列表
  availableModels.value = [];
  activeModelIndex.value = null;
};

// 取消编辑
const cancelEdit = () => {
  editingIndex.value = null;
  availableModels.value = [];
  activeModelIndex.value = null;
};

// 保存供应商配置
const saveProvider = async (index: number) => {
  await providerDb.save(providers.value[index]);
  editingIndex.value = null;
  availableModels.value = [];
  activeModelIndex.value = null;
};

// 删除供应商
const deleteProvider = async (index: number) => {
  await providerDb.delete({ id: providers.value[index].id });
  providers.value.splice(index, 1);
};

// 添加新供应商
const addProvider = () => {
  const newProvider = {
    id: Date.now().toString(),
    name: `新供应商 ${providers.value.length + 1}`,
    type: "openai",
    model: "",
    apiUrl: "",
    apiKey: "",
  };
  providers.value.push(newProvider);
  editingIndex.value = providers.value.length - 1;
};

// 查询模型列表
const queryModelsForProvider = async (index: number) => {
  const provider = providers.value[index];
  if (!provider.apiUrl || !provider.apiKey) {
    alert("请先填写 API 地址和 API Key");
    return;
  }

  loadingModelIndex.value = index;
  activeModelIndex.value = index;

  try {
    const models = await queryModels(
      provider.apiKey,
      provider.apiUrl,
      provider.type,
    );
    availableModels.value = models;
  } catch (error) {
    console.error("查询模型失败:", error);
    alert("查询模型失败，请检查 API 配置");
  } finally {
    loadingModelIndex.value = null;
  }
};

// 清空模型列表
const clearModels = () => {
  availableModels.value = [];
  activeModelIndex.value = null;
};
</script>

<style scoped>
.ai-provider-config {
  padding: 6px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.config-list {
  margin-bottom: 20px;
}

.provider-item {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 10px;
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.provider-details {
  padding: 15px;
  background: var(--bg);
  border-radius: 6px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: var(--text);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.model-input-group {
  display: flex;
  gap: 8px;
}

.model-input-group input {
  flex: 1;
}

.model-selector {
  margin-top: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.model-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.model-selector-header span {
  font-weight: bold;
  color: var(--text);
}

.model-selector-content {
  max-height: 200px;
  overflow-y: auto;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}
</style>
