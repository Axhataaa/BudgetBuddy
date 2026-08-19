import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Vitest's esbuild-based transform (separate from the production build's
  // oxc pipeline) needs the JSX runtime spelled out explicitly, or test
  // files fail with "React is not defined". Scoped to `test` mode only so
  // it never touches the production build's own (oxc) JSX handling.
  ...(mode === 'test'
    ? { esbuild: { jsx: 'automatic', jsxImportSource: 'react' } }
    : {}),
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: true,
  },
}))
