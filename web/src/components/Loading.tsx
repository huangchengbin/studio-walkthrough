import { useEffect, useRef, useState } from 'react'

export default function Loading({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [hide, setHide] = useState(false)
  const raf = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const tick = () => {
      const t = Math.min((performance.now() - start) / 1100, 1)
      setPct(Math.round(t * 100))
      if (t < 1) {
        raf.current = requestAnimationFrame(tick)
      } else {
        setHide(true)
        window.setTimeout(onDone, 420)
      }
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [onDone])

  return (
    <div className={'loader' + (hide ? ' hide' : '')}>
      <div className="loader-mark"><span /></div>
      <h2>正在进入劳模室</h2>
      <p>载入房间、基础设施与 6 项成果</p>
      <div className="track"><div className="bar" style={{ width: pct + '%' }} /></div>
      <div className="meta"><span>场景数据已压缩 · 约 3 秒</span><span>{pct}%</span></div>
    </div>
  )
}
