import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/AuthContext.jsx'
import { useTheme } from '../lib/ThemeContext.jsx'

// 한 줄짜리 선택지 묶음 (라디오처럼 하나만 선택)
function Segmented({ label, value, options, onChange }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={value === opt.value ? 'is-on' : undefined}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

// 우측 상단 설정 아이콘 — 누르면 설정 패널이 열린다.
//  · 모드: 사용자 / 관리자 (관리자는 코드를 입력해 전환, 사용자로 돌아가면 로그아웃)
//  · 화면: 테마(시스템·라이트·다크), 글자 크기, 움직임 줄이기
function SettingsMenu() {
  const { isAdmin, login, logout } = useAuth()
  const { themePref, setThemePref, fontSize, setFontSize, reduceMotion, setReduceMotion } = useTheme()
  const [open, setOpen] = useState(false)
  const [askCode, setAskCode] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef(null)

  // 바깥을 누르거나 Esc를 누르면 닫는다.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // 관리자 모드가 되면(로그인 성공) 코드 입력칸은 접는다.
  useEffect(() => {
    if (isAdmin) setAskCode(false)
  }, [isAdmin])

  async function chooseMode(mode) {
    setError(null)
    if (mode === 'admin') {
      if (!isAdmin) setAskCode(true)
      return
    }
    setAskCode(false)
    if (isAdmin) {
      setBusy(true)
      try {
        await logout()
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(false)
      }
    }
  }

  async function submitCode(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(code)
      setCode('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="settings" ref={rootRef}>
      <button
        type="button"
        className={`settings-btn${isAdmin ? ' is-admin' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={isAdmin ? '설정 (관리자 모드)' : '설정'}
        title={isAdmin ? '설정 · 관리자 모드' : '설정'}
      >
        <GearIcon />
        {isAdmin && <span className="settings-dot" aria-hidden="true" />}
      </button>

      {open && (
        <div className="settings-panel" role="dialog" aria-label="설정">
          <section className="settings-group">
            <h2>모드</h2>
            <Segmented
              label="모드"
              value={isAdmin || askCode ? 'admin' : 'user'}
              options={[
                { value: 'user', label: '사용자' },
                { value: 'admin', label: '관리자' },
              ]}
              onChange={chooseMode}
            />
            {isAdmin && <p className="settings-note">관리자 모드 — 글과 프로젝트를 추가·수정할 수 있습니다.</p>}
            {!isAdmin && !askCode && <p className="settings-note">둘러보기 전용입니다.</p>}
            {!isAdmin && askCode && (
              <form className="settings-code" onSubmit={submitCode}>
                <label htmlFor="admin-code">관리자 코드</label>
                <div className="settings-code-row">
                  <input
                    id="admin-code"
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete="off"
                    autoFocus
                  />
                  <button type="submit" disabled={busy || !code}>입장</button>
                </div>
              </form>
            )}
            {error && <p className="form-error">{error}</p>}
          </section>

          <section className="settings-group">
            <h2>테마</h2>
            <Segmented
              label="테마"
              value={themePref}
              options={[
                { value: 'system', label: '시스템' },
                { value: 'light', label: '라이트' },
                { value: 'dark', label: '다크' },
              ]}
              onChange={setThemePref}
            />
          </section>

          <section className="settings-group">
            <h2>글자 크기</h2>
            <Segmented
              label="글자 크기"
              value={fontSize}
              options={[
                { value: 'sm', label: '작게' },
                { value: 'md', label: '보통' },
                { value: 'lg', label: '크게' },
              ]}
              onChange={setFontSize}
            />
          </section>

          <section className="settings-group settings-row">
            <div>
              <h2>움직임 줄이기</h2>
              <p className="settings-note">애니메이션과 부드러운 스크롤을 끕니다.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reduceMotion}
              aria-label="움직임 줄이기"
              className={`switch${reduceMotion ? ' is-on' : ''}`}
              onClick={() => setReduceMotion(!reduceMotion)}
            >
              <span />
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

export default SettingsMenu
