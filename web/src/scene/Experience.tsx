import { Suspense, useMemo } from 'react'
import { Html, useGLTF } from '@react-three/drei'
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

function Scene() {
  const { scene } = useGLTF('/assets/scene.glb')
  useMemo(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = false
        m.receiveShadow = false
        const mat = m.material as THREE.MeshStandardMaterial
        if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 0.6
      }
    })
  }, [scene])
  return <primitive object={scene} />
}

export default function Experience({ items, fly, playing, onPick, onFlyDone }: Props) {
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
      <ambientLight intensity={1.05} color="#FFFFFF" />
      <hemisphereLight args={['#FFFFFF', '#FFFFFF', 0.35]} />
      <directionalLight position={[6, 9, 5]} intensity={1.0} color="#FFFFFF" />
      <directionalLight position={[-4, 6, -6]} intensity={0.35} color="#F2F6FF" />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      {items.map((item, i) => (
        <Hotspot key={item.uid} item={item} index={i} onPick={() => onPick(item)} />
      ))}
      <WalkControls fly={fly} obstacles={obstacles} onFlyDone={onFlyDone} />
    </>
  )
}
