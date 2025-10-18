import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isVercel = !!process.env.VERCEL
// nếu vẫn dùng GitHub Pages repo name khác, đổi bên dưới:
const GH_REPO = '/hkhachuy.graduation/'

export default defineConfig({
  plugins: [react()],
  base: isVercel ? '/' : GH_REPO,
  build: {
    sourcemap: false,
    target: 'es2019',
    modulePreload: { polyfill: false },
  },
})
