import type { CatalogItem } from '../data/types'

interface Props {
  items: CatalogItem[]
  placed: Record<string, boolean>
  selectedId: string | null
  onPick: (item: CatalogItem) => void
  onPlace: (item: CatalogItem) => void
  onRemove: (item: CatalogItem) => void
  onClose: () => void
}

export default function LibraryPanel({ items, placed, selectedId, onPick, onPlace, onRemove, onClose }: Props) {
  const placedCount = items.filter((i) => placed[i.id]).length

  return (
    <aside className="panel library" aria-label="成果库">
      <div className="library-head">
        <div>
          <div className="eyebrow">成果库</div>
          <strong style={{ fontSize: 15 }}>共 {items.length} 项 · 已布展 {placedCount} 项</strong>
        </div>
        <button className="icon-btn" style={{ width: 30, height: 30 }} aria-label="关闭" onClick={onClose}>
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="library-list">
        {items.map((item) => {
          const on = placed[item.id]
          return (
            <div key={item.uid} className={`library-item${selectedId === item.id ? ' active' : ''}`}>
              <button className="library-main" onClick={() => onPick(item)}>
                <span className="library-thumb" style={item.photo ? { backgroundImage: `url(${item.photo})` } : undefined} />
                <span className="library-meta">
                  <strong>{item.name}</strong>
                  <small>{item.category} · {item.code}</small>
                </span>
              </button>
              <span className={`library-state${on ? '' : ' off'}`}>{on ? '已布展' : '未布展'}</span>
              <button
                className={`library-action${on ? '' : ' primary'}`}
                onClick={() => (on ? onRemove(item) : onPlace(item))}
              >
                {on ? '撤展' : '放入'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="library-tip">点选成果可在场景中直接拖动位置、用工具条旋转；「撤展」只收起模型，不删除数据</p>
    </aside>
  )
}
