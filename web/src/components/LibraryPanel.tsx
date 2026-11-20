import type { CatalogItem } from '../data/types'

interface Props {
  items: CatalogItem[]
  selectedId: string | null
  onPick: (item: CatalogItem) => void
  onClose: () => void
}

export default function LibraryPanel({ items, selectedId, onPick, onClose }: Props) {
  return (
    <aside className="panel library" aria-label="成果库">
      <div className="library-head">
        <div>
          <div className="eyebrow">成果库</div>
          <strong style={{ fontSize: 15 }}>共 {items.length} 项 · 全部已布展</strong>
        </div>
        <button className="icon-btn" style={{ width: 30, height: 30 }} aria-label="关闭" onClick={onClose}>
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="library-list">
        {items.map((item) => (
          <button
            key={item.uid}
            className={`library-item${selectedId === item.id ? ' active' : ''}`}
            onClick={() => onPick(item)}
          >
            <span className="library-thumb" style={item.photo ? { backgroundImage: `url(${item.photo})` } : undefined} />
            <span className="library-meta">
              <strong>{item.name}</strong>
              <small>{item.category} · {item.code}</small>
            </span>
            <span className="library-state">已布展</span>
          </button>
        ))}
      </div>

      <p className="library-tip">点选成果后，可在场景中直接拖动位置、用工具条旋转角度</p>
    </aside>
  )
}
