import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/logiclab/",
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
