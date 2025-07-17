import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/ts/ChessEngine.ts',
        'src/ts/BoardAdapter.ts',
        'src/ts/Utils/GameBus.ts',
        'src/ts/Utils/ApiTypes.ts'
      ]
    },
    globals: true,
    environment: 'node'
  },
  resolve: {
    alias: {
      '@': '/src/ts'
    }
  }
});