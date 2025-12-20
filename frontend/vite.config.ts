import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// We intentionally disable Vite's special `public/` handling so existing
// `./public/...` URLs in the legacy HTML keep working during dev.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});


