import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "@unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import vitePluginsAutoI18n, {
  GoogleTranslator,
  Translator,
} from "vite-auto-i18n-plugin";
async function translate(text: string[], to: string) {
  try {
    let body = [[text, `zh`, `${to}`], "te_lib"];
    let googleApiKey = "";
    let apiUrl = "https://translate-pa.googleapis.com/v1/translateHtml";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "x-goog-api-key": `${googleApiKey}`,
        "Content-Type": "application/json+protobuf",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      // throw new Error(`HTTP Error! Status: ${response.status}`)
    }
    const result = await response.json();
    const data = result[0];
    return data || [];
  } catch (error) {
    console.error("Translate error:", error);
    return [];
  }
}
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: ["vue", "vue-router", "@vueuse/core"],
      dts: "src/auto-imports.d.ts",
      eslintrc: {
        enabled: true,
      },
    }),
    vitePluginsAutoI18n({
      translator: new Translator({
        name: "我的翻译器",
        // 翻译的方法
        fetchMethod: (str, fromKey, toKey, _separator) => {
          // 实际的接口调用可能比示例更复杂，具体可参考源码中YoudaoTranslator的实现，路径：packages\autoI18nPluginCore\src\translators\youdao.ts
          return new Promise((resolve, reject) => {
            translate(str.split(_separator), toKey).then((res) => {
              resolve(res.join(_separator));
            });
          });
        },
        // 接口触发间隔，有些接口频繁触发会被拉黑，请根据实际情况设置一个合理的接口触发间隔
        interval: 1000,
      }),
      excludedPath: [
        "node_modules",
        "dist",
        "public",
        "lang/index.json",
        "languages.ts",
        "src/editors",
        "src/api",
        "src/db",
      ],
      targetLangList: [
        "zh-CN",
        "zh-TW",
        "en",
        "ko",
        "ja",
        "fr",
        "ru",
        "de",
        "id",
        "tl",
        "sq",
        "tr",
        "my",
        "th",
        "vi",
        "pl",
        "pt",
      ],
    }),
    Components({
      dts: "src/components.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;`,
      },
    },
  },
});
