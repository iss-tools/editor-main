import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  presetWind,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetWind(), // Tailwind CSS 兼容层
    presetAttributify(),
    presetIcons(),
  ],
  theme: {
    colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
    },
  },
  shortcuts: {
    "btn-primary":
      "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors",
  },
});
