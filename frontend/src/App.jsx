import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState('checking...')

  // 백엔드 연결이 실제로 되는지 확인하는 용도의 임시 코드.
  // 이후 실제 화면(포트폴리오 목록 등)으로 교체될 예정이다.
  useEffect(() => {
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then(() => setStatus('백엔드 연결 성공'))
      .catch(() => setStatus('백엔드 연결 실패 - 로컬 서버가 켜져 있는지 확인'))
  }, [])

  return (
    <div className="app">
      <h1>myWeb</h1>
      <p>{status}</p>
    </div>
  )
}

export default App
