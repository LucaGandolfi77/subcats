import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts']
  },
  resolve: {
    alias: {
      '@courseweaver/domain': resolve(__dirname, 'packages/domain/src/index.ts'),
      '@courseweaver/engine': resolve(__dirname, 'packages/engine/src/index.ts'),
      '@courseweaver/persistence': resolve(__dirname, 'packages/persistence/src/index.ts'),
      '@courseweaver/runtime': resolve(__dirname, 'packages/runtime/src/index.ts'),
      '@courseweaver/exporter': resolve(__dirname, 'packages/exporter/src/index.ts'),
      '@courseweaver/assets': resolve(__dirname, 'packages/asset-pipeline/src/index.ts'),
      '@courseweaver/ai': resolve(__dirname, 'packages/ai/src/index.ts')
    }
  }
});