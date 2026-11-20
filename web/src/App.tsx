import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import Experience from './scene/Experience'
import Hud from './components/Hud'
import DetailDrawer from './components/DetailDrawer'
import Loading from './components/Loading'
import type { Catalog, CatalogItem } from './data/types'

const WEBGL_OK = (() => {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    const ok = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return ok
  } catch {
    return false
  }
})()

export interface FlyTarget {
  pos: [number, number, number]
  look: [number, number, number]
  key: number
}

const START: [number, number, number] = [3.6, 1.66, -3.7]

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const [fly, setFly] = useState<FlyTarget | null>(null)
  const [guide, setGuide] = useState(() => localStorage.getItem('lm-guide') !== '1')
  const [toast, setToast] = useState<string | null>(null)
  const { active, progress } = useProgress()

  useEffect(() => {
    fetch('/assets/catalog.json')
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => setToast('成果数据加载失败'))
  }, [])

  const loading = !catalog || (active && progress < 100)

  const goCenter = () => {
    setFly({ pos: [START[0], START[1], START[2]], look: [START[0], 1.4, START[2] + 2], key: Date.now() })
  }

  const focus = (item: CatalogItem) => {
    const [x, , z] = item.world
    const dx = x - 5.6
    const dz = z + 4.2
    const d = Math.hypot(dx, dz) || 1
    const pos: [number, number, number] = [x - (dx / d) * 1.7, 1.66, z - (dz / d) * 1.7]
    setFly({ pos, look: [x, item.top - 0.2, z], key: Date.now() })
    setSelected(item)
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

  if (!WEBGL_OK) {
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
      <Canvas flat shadows camera={{ fov: 78, position: START }} dpr={[1, 2]} gl={{ antialias: true }}>
        {catalog && (
          <Experience
            items={catalog.items}
            fly={fly}
            playing={playing}
            onPick={(item) => setSelected(item)}
            onFlyDone={() => setFly(null)}
          />
        )}
      </Canvas>

      {catalog && (
        <Hud
          items={catalog.items}
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
      )}

      {selected && <div className="scrim" />}

      {selected && (
        <DetailDrawer
          item={selected}
          playing={playing === selected.id}
          onTogglePlay={() => setPlaying((p) => (p === selected.id ? null : selected.id))}
          onClose={() => {
            setSelected(null)
            setPlaying(null)
          }}
        />
      )}

      {loading && <Loading />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
