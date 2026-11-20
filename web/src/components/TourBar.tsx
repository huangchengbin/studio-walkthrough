interface Props {
  index: number
  total: number
  title: string
  caption: string
  onPrev: () => void
  onNext: () => void
  onExit: () => void
}

export default function TourBar({ index, total, title, caption, onPrev, onNext, onExit }: Props) {
  return (
    <div className="panel tourbar" role="dialog" aria-label="导览">
      <div className="tourbar-head">
        <span className="tour-step">{index + 1} / {total}</span>
        <button className="icon-btn" style={{ width: 26, height: 26 }} aria-label="结束导览" onClick={onExit}>
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <strong className="tour-title">{title}</strong>
      <p className="tour-caption">{caption}</p>
      <div className="tour-actions">
        <button className="btn-outline" onClick={onPrev} disabled={index === 0}>上一处</button>
        <button className="btn-primary" onClick={onNext}>
          {index === total - 1 ? '完成导览' : '下一处'}
        </button>
      </div>
    </div>
  )
}
