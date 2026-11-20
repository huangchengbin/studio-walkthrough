import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Experience from './scene/Experience'
import Hud from './components/Hud'
import DetailDrawer from './components/DetailDrawer'
import Loading from './components/Loading'
import { achievements, Achievement } from './data/mock'

export interface FlyTarget {
  pos: [number, number, number]
  look: [number, number, number]
  key: number
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Achievement | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const [fly, setFly] = useState<FlyTarget | null>(null)
  const [guide, setGuide] = useState(() => localStorage.getItem('lm-guide') !== '1')
  const [toast, setToast] = useState<string | null>(null)

  const webglOk = useMemo(() => {
    try {
      const c = document.createElement('canvas')
      return !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      return false
    }
  }, [])

  const goCenter = () => {
    setFly({ pos: [0, 1.66, 2.1], look: [0, 1.5, -2], key: Date.now() })
  }

  const focus = (a: Achievement) => {
    const d = Math.hypot(a.at.x, a.at.z) || 1
    const pos: [number, number, number] = [a.at.x - (a.at.x / d) * 2.4, 1.6, a.at.z - (a.at.z / d) * 2.4]
    setFly({ pos, look: [a.at.x, 1.5, a.at.z], key: Date.now() })
    setSelected(a)
    setPlaying(null)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelected(null)
        setPlaying(null)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  if (!webglOk) {
    return (
      <div className="errpage">
        <h2>当前浏览器未能启动三维显示</h2>
        <p>请使用新版 Chrome 或 Edge 打开，并确认硬件加速已开启。</p>
        <button className="btn-primary" onClick={() => location.reload()}>重新加载</button>
      </div>
    )
  }

  return (
    <div className="app">
      <Canvas flat camera={{ fov: 78, position: [0, 1.66, 3.2] }} dpr={[1, 2]} gl={{ antialias: true }}>
        <Experience fly={fly} playing={playing} onPick={(a) => setSelected(a)} onFlyDone={() => setFly(null)} />
      </Canvas>

      <Hud
        items={achievements}
        activeId={selected?.id}
        onPick={focus}
        guide={guide}
        onDismissGuide={() => {
          setGuide(false)
          localStorage.setItem('lm-guide', '1')
        }}
        onHelp={() => setGuide(true)}
        onAdmin={() => showToast('管理端开发中（spec-003）')}
        onCenter={goCenter}
        drawerOpen={!!selected}
      />

      {selected && <div className="scrim" />}

      {selected && (
        <DetailDrawer
          a={selected}
          playing={playing === selected.id}
          onPlay={() => setPlaying((p) => (p === selected.id ? null : selected.id))}
          onClose={() => {
            setSelected(null)
            setPlaying(null)
          }}
        />
      )}

      {loading && <Loading onDone={() => setLoading(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
