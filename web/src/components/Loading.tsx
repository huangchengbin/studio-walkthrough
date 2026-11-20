import { useEffect, useRef, useState } from 'react'

export default function Loading() {
  const [pct, setPct] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const tick = () => {
      const t = Math.min((performance.now() - start) / 2600, 1)
      setPct(Math.round(t * 92))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return (
    <div className="loader">
      <div className="loader-mark"><span /></div>
      <h2>正在进入劳模室</h2>
      <p>载入房间、基础设施与 6 项成果</p>
      <div className="track"><div className="bar" style={{ width: pct + '%' }} /></div>
      <div className="meta"><span>真实场景资产 · 首次约 3 秒</span><span>{pct}%</span></div>
    </div>
  )
}
