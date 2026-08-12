import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'calltouch-assets',
  server: {
    port: Number(process.env.VITE_DEV_PORT || 5173),
    strictPort: true,
    watch: { ignored: ['**/tmp/**', '**/materials/**'] },
    proxy: {
      '/api': `http://localhost:${process.env.PDF_SERVER_PORT || 4174}`,
    },
  },
});
