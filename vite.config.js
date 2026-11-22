// Copy to frontend/vite.config.js. Collins commits it to the `frontend` branch before anyone starts, so you get it with `git pull`.
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Development only: transform the first screens ahead of time so the first page does not wait for hundreds of module requests.
  server: { warmup: { clientFiles: ['./src/main.jsx', './src/App.jsx', './src/shell/*.jsx', './src/pages/public/Login.jsx', './src/pages/public/Enter.jsx'] } },
  optimizeDeps: { include: ['react', 'react-dom/client', 'react-router-dom'] },
})