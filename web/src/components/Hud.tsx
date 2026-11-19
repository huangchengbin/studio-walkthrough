import { useState } from 'react'
import type { Achievement } from '../data/mock'

interface Props {
  items: Achievement[]
  drawerOpen?: boolean
  activeId?: string
  onPick: (a: Achievement) => void
  guide: boolean
  onDismissGuide: () => void
  onHelp: () => void
  onAdmin: () => void
}

export default function Hud({ items, activeId, onPick, guide, onDismissGuide, onHelp, onAdmin, drawerOpen }: Props) {
  const [notice, setNotice] = useState<string | null>(null)
  return (
    <>
      <header className="topbar">
        <div className="identity">
          <span className="brandmark">
            <svg viewBox="0 0 24 24"><path d="M4 10l8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M9 14h6M9 17h6" /></svg>
          </span>
          <div>
            <h1>劳模创新工作室</h1>
            <p>3D 数字展厅<span>V1 · 导览版</span></p>
          </div>
        </div>
        <div className="top-actions">
          <button className="icon-btn" aria-label="操作帮助" title="操作帮助" onClick={onHelp}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.7.2-.7 1-.7 1.6M12 16h.01" /></svg>
          </button>
          <button className="btn-outline" onClick={onAdmin}>管理入口</button>
        </div>
      </header>

      <aside className="panel rail" aria-label="成果目录">
        <div className="rail-title eyebrow">成果目录 · {items.length} 项</div>
        {items.map((a, i) => (
          <button
            key={a.id}
            className={'rail-item' + (activeId === a.id ? ' active' : '')}
            onClick={() => onPick(a)}
          >
            <span className="thumb">{String(i + 1).padStart(2, '0')}</span>
            <span>
              <strong>{a.name}</strong>
              <small>{a.category} · 已布展</small>
            </span>
          </button>
        ))}
      </aside>

      {!drawerOpen && <div className="pos-badge"><span className="live" />正站在 · 劳模室入口</div>}

      {notice && <div className="toast">{notice}</div>}

      {guide && (
        <div className="gesture">
          拖动画面环视 <span>·</span> <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动 <span>·</span> 点击发光成果看详情
          <button className="close" aria-label="关闭引导" onClick={onDismissGuide}>×</button>
        </div>
      )}
    </>
  )
}
