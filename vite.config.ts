import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Reached through an SSH tunnel (ssh -L 5173:localhost:5173 ...), so bind to loopback only.
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
