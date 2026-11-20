import { useState } from 'react'
import type { CatalogItem } from '../data/types'

interface Props {
  item: CatalogItem
  playing: boolean
  onTogglePlay: () => void
  onClose: () => void
}

export default function DetailDrawer({ item, playing, onTogglePlay, onClose }: Props) {
  const [tab, setTab] = useState<'text' | 'photo'>('text')
  return (
    <aside className="panel drawer" aria-label={item.name}>
      <div className="drawer-head">
        <div>
          <div className="eyebrow">成果档案 · {item.code}</div>
          <h2>{item.name}</h2>
        </div>
        <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="关闭" onClick={onClose}>
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="drawer-body">
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="tag">{item.category}</span>
          <span className="tag">{item.code}</span>
        </div>

        <div className="segment">
          <button className={tab === 'text' ? 'selected' : ''} onClick={() => setTab('text')}>图文介绍</button>
          <button className={tab === 'photo' ? 'selected' : ''} onClick={() => setTab('photo')} disabled={!item.photo}>
            实景照片
          </button>
        </div>

        {tab === 'text' && <p className="body">{item.summary || '内容整理中'}</p>}

        {tab === 'photo' && item.photo && (
          <img src={item.photo} alt={item.name} style={{ width: '100%', borderRadius: 8, display: 'block' }} />
        )}
      </div>

      <div className="drawer-foot">
        <button className="btn-primary" style={{ width: '100%' }} onClick={onTogglePlay}>
          {playing ? (
            <>
              <svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5" /></svg>
              停止演示
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5z" /></svg>
              播放功能演示
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
