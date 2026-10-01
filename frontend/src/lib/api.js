// 백엔드 호출용 공통 fetch 래퍼.
// 개발 중에는 vite.config.js의 proxy 설정으로 /api가 로컬 백엔드(8081)로 전달된다.

export async function apiGet(path) {
  const res = await fetch(path, { credentials: 'same-origin' })
  if (!res.ok) {
    throw new Error(`요청 실패 (${res.status}): ${path}`)
  }
  return res.json()
}

// POST/PUT/DELETE 등 상태를 바꾸는 요청 — CSRF가 켜져 있어서 매번 토큰을 먼저 받아온 뒤 보낸다.
export async function apiMutate(path, method, body) {
  const csrf = await apiGet('/api/auth/csrf')

  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      [csrf.headerName]: csrf.token,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let message = `요청 실패 (${res.status})`
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {
      // 응답 본문이 없는 경우(204 No Content 등)는 무시
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}
