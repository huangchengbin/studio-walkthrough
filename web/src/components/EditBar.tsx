interface Props {
  selectedName: string | null
  dirty: boolean
  libraryOpen: boolean
  onRotate: (deg: number) => void
  onToggleLibrary: () => void
  onSave: () => void
  onExit: () => void
}

export default function EditBar({
  selectedName,
  dirty,
  libraryOpen,
  onRotate,
  onToggleLibrary,
  onSave,
  onExit,
}: Props) {
  return (
    <div className={`panel editbar${libraryOpen ? ' with-library' : ''}`}>
      <span className="editbar-tag">布放编辑模式</span>

      <button className={`editbar-btn${libraryOpen ? ' active' : ''}`} onClick={onToggleLibrary}>
        <svg viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h10" /></svg>
        成果库
      </button>

      <span className="editbar-sep" />

      <button className="editbar-btn" disabled={!selectedName} onClick={() => onRotate(-15)}>
        <svg viewBox="0 0 24 24"><path d="M9 4v5M15 4v5" /><path d="M4 9h16l-2 11H6z" /></svg>
        左转 15°
      </button>
      <button className="editbar-btn" disabled={!selectedName} onClick={() => onRotate(15)}>
        <svg viewBox="0 0 24 24"><path d="M9 4v5M15 4v5" /><path d="M4 9h16l-2 11H6z" /></svg>
        右转 15°
      </button>

      <span className="editbar-sep" />

      <span className="editbar-sel">{selectedName ? `已选：${selectedName}` : '点选场景中的成果'}</span>
      {dirty && <span className="editbar-dirty">未保存</span>}

      <button className="btn-primary" onClick={onSave}>
        <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
        保存
      </button>
      <button className="btn-outline" onClick={onExit}>
        退出编辑
      </button>
    </div>
  )
}
