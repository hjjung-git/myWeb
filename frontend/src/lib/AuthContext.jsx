import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { apiGet, apiMutate } from './api.js'

const AuthContext = createContext(null)

// 관리자 모드 여부를 앱 전체에서 공유하기 위한 Context.
// 로그인 개념이 아니라 "관리자 코드로 전환" 방식 — 백엔드 /api/auth/* 그대로 사용.
export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    return apiGet('/api/auth/status')
      .then((data) => setIsAdmin(Boolean(data.adminMode)))
      .catch(() => setIsAdmin(false))
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  async function login(code) {
    const data = await apiMutate('/api/auth/admin', 'POST', { code })
    setIsAdmin(Boolean(data.adminMode))
  }

  async function logout() {
    const data = await apiMutate('/api/auth/logout', 'POST')
    setIsAdmin(Boolean(data?.adminMode))
  }

  return (
    <AuthContext.Provider value={{ isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있다.')
  return ctx
}
