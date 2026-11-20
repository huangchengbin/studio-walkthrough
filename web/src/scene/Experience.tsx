import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Html, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import WalkControls from './WalkControls'
import type { CatalogItem } from '../data/types'
import type { FlyTarget } from '../App'

interface Props {
  items: CatalogItem[]
  fly: FlyTarget | null
  playing: string | null
  onPick: (item: CatalogItem) => void
  onFlyDone: () => void
}

function Hotspot({ item, index, onPick }: { item: CatalogItem; index: number; onPick: () => void }) {
  return (
    <Html position={[item.world[0], item.top + 0.16, item.world[2]]} center distanceFactor={10} zIndexRange={[6, 0]} className="hotspot-wrap">
      <div className="hotspot" onClick={(e) => { e.stopPropagation(); onPick() }}>
        {String(index + 1).padStart(2, '0')}
        <div className="tip">
          <strong>{item.name}</strong>
          <span>点击查看详情</span>
        </div>
      </div>
    </Html>
  )
}

interface AnimState {
  group: THREE.Object3D
  baseY: number
  baseRotY: number
  kids: { obj: THREE.Object3D; baseX: number }[]
  t: number
}

function Scene({ playing }: { playing: string | null }) {
  const { scene } = useGLTF('/assets/scene.glb')
  useMemo(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
        const mat = m.material as THREE.MeshStandardMaterial
        if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 0.6
      }
    })
  }, [scene])

  const anim = useRef<AnimState | null>(null)

  // 播放/停止：找出对应的摆放节点（place-<id>），记录基准位姿
  useEffect(() => {
    const prev = anim.current
    if (prev) {
      prev.group.rotation.y = prev.baseRotY
      prev.group.position.y = prev.baseY
      prev.kids.forEach((k) => { k.obj.position.x = k.baseX })
      anim.current = null
    }
    if (!playing) return
    const g = scene.getObjectByName(`place-${playing}`)
    if (!g) return
    anim.current = {
      group: g,
      baseY: g.position.y,
      baseRotY: g.rotation.y,
      kids: g.children.map((o) => ({ obj: o, baseX: o.position.x })),
      t: 0,
    }
  }, [playing, scene])

  // 演示动画：缓慢自转 + 轻微上浮 + 部件微分离（示意"运转/拆解"）
  useFrame((_, dt) => {
    const a = anim.current
    if (!a) return
    a.t += dt
    a.group.rotation.y = a.baseRotY + a.t * 0.85
    a.group.position.y = a.baseY + Math.sin(a.t * 1.8) * 0.03
    a.kids.forEach((k, i) => {
      k.obj.position.x = k.baseX + Math.sin(a.t * 2 + i) * 0.022
    })
  })

  return <primitive object={scene} />
}

export default function Experience({ items, fly, playing, onPick, onFlyDone }: Props) {
  const dir = useRef<THREE.DirectionalLight>(null)
  useEffect(() => {
    const l = dir.current
    if (!l) return
    l.target.position.set(3.75, 0, -4.2)
    l.target.updateMatrixWorld()
    const c = l.shadow.camera
    c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 1; c.far = 30
    c.updateProjectionMatrix()
  }, [])
  const obstacles = useMemo(
    () => [
      { x: 0.87, z: -0.45, r: 0.85 },
      { x: 2.38, z: -0.45, r: 0.85 },
      { x: 3.89, z: -0.45, r: 0.85 },
      { x: 5.4, z: -0.45, r: 0.85 },
      { x: 3.3, z: -3.5, r: 1.45 },
      { x: 6.1, z: -5.65, r: 1.15 },
      { x: 8.7, z: -4.25, r: 1.3 },
      { x: 9.65, z: -2.4, r: 1.35 },
    ],
    [],
  )

  return (
    <>
      <color attach="background" args={['#F2F5F9']} />
      <fog attach="fog" args={['#F5F8FB', 30, 60]} />
      <ambientLight intensity={2.85} color="#FFFFFF" />
      <hemisphereLight args={['#FFFFFF', '#D8DDE3', 0.55]} />
      <directionalLight
        ref={dir}
        position={[7.5, 16, -1.5]}
        intensity={0.7}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 7, -7]} intensity={0.25} color="#F6F9FF" />
      <Suspense fallback={null}>
        <Scene playing={playing} />
      </Suspense>
      {items.map((item, i) => (
        <Hotspot key={item.uid} item={item} index={i} onPick={() => onPick(item)} />
      ))}
      <WalkControls fly={fly} obstacles={obstacles} onFlyDone={onFlyDone} />
    </>
  )
}
