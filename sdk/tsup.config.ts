import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
