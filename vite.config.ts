import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BASE = '/merman/' // custom domain: change to '/'

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? BASE : '/',
  plugins: [react()],
  server: { host: true, allowedHosts: true },
  build: { rollupOptions: { input: { site: 'index.html', app: 'app/index.html' } } },
}))
