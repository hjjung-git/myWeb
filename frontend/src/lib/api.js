// 백엔드 호출용 공통 fetch 래퍼.
// 개발 중에는 vite.config.js의 proxy 설정으로 /api가 로컬 백엔드(8081)로 전달되고,
// 이때는 브라우저 기준으로 프론트/백엔드가 같은 origin이라 BASE_URL이 비어 있어도 그대로 동작한다.
// 배포 시에는 프론트(Cloudflare Pages)와 백엔드(Cloudflare Tunnel)가 서로 다른 origin이 되므로,
// Cloudflare Pages 환경변수로 VITE_API_BASE_URL(예: https://api.<내 서브도메인>)을 지정해야 한다.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function resolveUrl(path) {
  return `${API_BASE_URL}${path}`
}

// <object>/<a href> 등 fetch를 거치지 않고 브라우저가 직접 요청하는 리소스(PDF 뷰어 등)에
// 배포 후 cross-origin(Pages -> Tunnel) 상황에서도 올바른 절대 URL을 쓰기 위한 헬퍼.
export function apiResourceUrl(path) {
  return resolveUrl(path)
}

// apiMutate/apiUpload가 공유하는 응답 처리 — 실패 시 서버가 내려준 message를 최대한 꺼내 쓴다.
async function handleResponse(res, path) {
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

export async function apiGet(path) {
  // credentials: 'include' — same-origin(로컬 개발)에서는 'same-origin'과 동일하게 동작하고,
  // cross-origin(배포 후 Pages ↔ Tunnel)에서도 세션 쿠키를 실어 보내려면 이 값이어야 한다.
  const res = await fetch(resolveUrl(path), { credentials: 'include' })
  if (!res.ok) {
    throw new Error(`요청 실패 (${res.status}): ${path}`)
  }
  return res.json()
}

// POST/PUT/DELETE 등 상태를 바꾸는 요청 — CSRF가 켜져 있어서 매번 토큰을 먼저 받아온 뒤 보낸다.
export async function apiMutate(path, method, body) {
  const csrf = await apiGet('/api/auth/csrf')

  const res = await fetch(resolveUrl(path), {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      [csrf.headerName]: csrf.token,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  return handleResponse(res, path)
}

// 파일 업로드(multipart/form-data) 전용 — 자격증 합격확인증 PDF 업로드 등에 쓴다.
// apiMutate와 달리 Content-Type 헤더를 직접 지정하지 않는다 — FormData를 쓰면 브라우저가
// multipart 경계(boundary)를 포함한 Content-Type을 자동으로 채워주는데, 여기서 수동으로
// 'multipart/form-data'만 지정하면 boundary가 빠져서 서버가 파일을 파싱하지 못한다.
export async function apiUpload(path, method, formData) {
  const csrf = await apiGet('/api/auth/csrf')

  const res = await fetch(resolveUrl(path), {
    method,
    credentials: 'include',
    headers: {
      [csrf.headerName]: csrf.token,
    },
    body: formData,
  })

  return handleResponse(res, path)
}
