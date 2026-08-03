import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("recharts")) return "recharts";
          if (normalizedId.includes("maplibre-gl")) return "maplibre";
          if (normalizedId.includes("@refinedev")) return "refinedev";
          if (normalizedId.includes("antd") || normalizedId.includes("@ant-design")) return "antd";

          if (
            normalizedId.includes("/node_modules/react/") ||
            normalizedId.includes("/node_modules/react-dom/") ||
            normalizedId.includes("/node_modules/react-router/") ||
            normalizedId.includes("/node_modules/react-router-dom/")
          ) {
            return "react-vendor";
          }
        },
      },
    },
  },
  }
});
