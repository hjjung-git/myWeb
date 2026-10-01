import { useState } from 'react'
import { useAuth } from '../lib/AuthContext.jsx'

// 상단의 "설정" 버튼 — 누르면 관리자 코드 입력창(or 사용자 모드 전환 버튼)이 펼쳐진다.
function AdminToggle() {
  const { isAdmin, login, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(code)
      setCode('')
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    await logout()
    setOpen(false)
  }

  return (
    <div className="admin-toggle">
      <button type="button" className="settings-btn" onClick={() => setOpen((v) => !v)}>
        {isAdmin ? '관리자 모드' : '설정'}
      </button>

      {open && (
        <div className="admin-panel">
          {isAdmin ? (
            <button type="button" className="btn-secondary" onClick={handleLogout}>
              사용자 모드로 전환
            </button>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="admin-code">관리자 코드</label>
              <input
                id="admin-code"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
              />
              {error && <p className="form-error">{error}</p>}
              <button type="submit" disabled={submitting}>
                입장
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminToggle
