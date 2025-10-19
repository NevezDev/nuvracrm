import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/chatwoot-api': {
        target: 'https://nuvra-chatwoot.3kuf6w.easypanel.host/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/chatwoot-api/, ''),
      },
    },
    allowedHosts: ['nuvra-nuvracrm.3kuf6w.easypanel.host', '.easypanel.host'],
    host: true,
  },
  preview: {
    allowedHosts: ['nuvra-nuvracrm.3kuf6w.easypanel.host'],
    host: true,
  },
})
