import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import * as path from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 1978, // Change this to your preferred port
    strictPort: true, // Optional: ensures Vite fails if the port is in use
  },
  json: {
    stringify: true
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
})