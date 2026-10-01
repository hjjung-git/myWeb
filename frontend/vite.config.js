import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 개발 중에는 /api 요청을 로컬 백엔드(8081)로 그대로 넘겨준다.
// 이렇게 하면 프론트/백엔드를 따로 띄워도 CORS 설정 없이 바로 연동 확인이 가능하다.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8081',
    },
  },
})
