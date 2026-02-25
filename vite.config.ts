import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      insertTypesEntry: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        zhtml: path.resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['three'],
      output: {
        entryFileNames: '[name].js',
      },
    },
    sourcemap: true,
  },
});
