import { useState } from 'react'
import { ApiOffline, apiLogin } from '../data/api'

interface Props {
  onSuccess: () => void
  onClose: () => void
}

const ACCOUNT = 'admin'
const PASSWORD = 'laomo2026'

export default function AdminLogin({ onSuccess, onClose }: Props) {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [offline, setOffline] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    // 优先走后端校验；后端未启动时降级为本机演示口令
    try {
      await apiLogin(account.trim(), password)
      onSuccess()
      return
    } catch (err) {
      if (err instanceof ApiOffline) {
        setOffline(true)
        if (account.trim() === ACCOUNT && password === PASSWORD) {
          onSuccess()
          return
        }
        setError('服务未启动，且本机演示口令不正确')
        return
      }
      setError(err instanceof Error ? err.message : '登录失败')
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <form className="panel modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="eyebrow">管理入口</div>
        <h2 style={{ margin: '6px 0 4px', fontSize: 20 }}>登录布放编辑模式</h2>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 18 }}>
          观众端无需登录；此入口仅供布展管理员使用
        </p>

        <label className="field">
          <span>账号</span>
          <input
            className="input"
            value={account}
            onChange={(e) => { setAccount(e.target.value); setError('') }}
            placeholder="admin"
            autoFocus
          />
        </label>

        <label className="field">
          <span>口令</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            placeholder="请输入口令"
          />
        </label>

        {error && <div className="err-text">{error}</div>}
        {offline && !error && (
          <div className="err-text" style={{ color: 'var(--warn)' }}>
            后端服务未启动，当前为本机演示模式
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={onClose}>
            取消
          </button>
          <button type="submit" className="btn-primary" style={{ flex: 1 }}>
            进入编辑模式
          </button>
        </div>
      </form>
    </div>
  )
}
