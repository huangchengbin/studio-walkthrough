import type { CatalogItem } from '../data/types'

interface Props {
  items: CatalogItem[]
  placed: Record<string, boolean>
  selectedId: string | null
  onPick: (item: CatalogItem) => void
  onPlace: (item: CatalogItem) => void
  onRemove: (item: CatalogItem) => void
  onReplaceModel: (item: CatalogItem, file: File) => void
  onReplacePhoto: (item: CatalogItem, file: File) => void
  onResetModel: (item: CatalogItem) => void
  onClose: () => void
}

export default function LibraryPanel({ items, placed, selectedId, onPick, onPlace, onRemove, onReplaceModel, onReplacePhoto, onResetModel, onClose }: Props) {
  const placedCount = items.filter((i) => placed[i.id]).length
  const selectedItem = items.find((i) => i.id === selectedId) ?? null

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

      {selectedItem && (
        <div className="library-tools">
          <div className="library-tools-title">替换「{selectedItem.name}」的资产</div>
          <div className="library-tools-row">
            <label className="library-action">
              替换模型
              <input
                type="file"
                accept=".glb,.gltf,model/gltf-binary"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onReplaceModel(selectedItem, f)
                  e.currentTarget.value = ''
                }}
              />
            </label>
            <label className="library-action">
              替换照片
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onReplacePhoto(selectedItem, f)
                  e.currentTarget.value = ''
                }}
              />
            </label>
            <button className="library-action" onClick={() => onResetModel(selectedItem)}>恢复原模型</button>
          </div>
        </div>
      )}

      <p className="library-tip">点选成果可拖动位置、用工具条旋转；替换的模型与照片存在本机浏览器，接后端后改为服务端存储</p>
    </aside>
  )
}
