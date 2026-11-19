import { useState } from 'react'
import type { Achievement } from '../data/mock'

interface Props {
  a: Achievement
  playing: boolean
  onPlay: () => void
  onClose: () => void
}

export default function DetailDrawer({ a, playing, onPlay, onClose }: Props) {
  const [tab, setTab] = useState<'text' | 'media'>('text')
  return (
    <aside className="panel drawer" aria-label={a.name}>
      <div className="drawer-head">
        <div>
          <div className="eyebrow">成果档案 · {a.code}</div>
          <h2>{a.name}</h2>
        </div>
        <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="关闭" onClick={onClose}>
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="drawer-body">
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="tag">{a.category}</span>
          <span className="tag">{a.year} 年布展</span>
        </div>

        <div className="segment">
          <button className={tab === 'text' ? 'selected' : ''} onClick={() => setTab('text')}>图文介绍</button>
          <button className={tab === 'media' ? 'selected' : ''} onClick={() => setTab('media')} disabled={a.media === 0}>
            影像资料 · {a.media}
          </button>
        </div>

        {tab === 'text' && <p className="body">{a.intro}</p>}

        {tab === 'media' && (
          <div className="media-grid">
            {Array.from({ length: Math.max(a.media, 0) }).map((_, i) => (
              <div className="media-cell" key={i}>
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M10 9l5 3-5 3z" /></svg>
              </div>
            ))}
            {a.media === 0 && <div className="media-cell dim">暂无影像</div>}
          </div>
        )}
      </div>

      <div className="drawer-foot">
        {a.demo ? (
          <button className="btn-primary" onClick={onPlay}>
            {playing ? '停止演示' : '播放功能演示'}
          </button>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>该成果暂无功能演示</p>
        )}
      </div>
    </aside>
  )
}
