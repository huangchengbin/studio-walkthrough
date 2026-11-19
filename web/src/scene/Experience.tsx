import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import WalkControls from './WalkControls'
import { achievements, ROOM, Achievement } from '../data/mock'
import type { FlyTarget } from '../App'

interface Props {
  fly: FlyTarget | null
  playing: string | null
  onPick: (a: Achievement) => void
  onFlyDone: () => void
}

function Exhibit({ a, playing }: { a: Achievement; playing: boolean }) {
  const color = a.category === '荣誉表彰' ? '#B8925A' : a.category === '软件系统' ? '#4E7FC4' : a.category === '影像资料' ? '#5B7CA6' : '#8FA3BC'
  return (
    <group position={[a.at.x, 0, a.at.z]} rotation={[0, a.at.rotY, 0]}>
      {a.shape === 'gear' && (
        <>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[1.1, 0.5, 0.8]} />
            <meshStandardMaterial color="#243447" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.78, 0]} rotation={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.34, 0.4, 0.5, 20]} />
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.35} />
          </mesh>
          <mesh position={[0.38, 0.92, 0.1]} rotation={[0, 0.4, 0.5]}>
            <boxGeometry args={[0.5, 0.08, 0.26]} />
            <meshStandardMaterial color="#C7D2E0" roughness={0.4} metalness={0.5} />
          </mesh>
        </>
      )}
      {a.shape === 'robot' && (
        <>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[1.0, 0.24, 0.8]} />
            <meshStandardMaterial color="#222F42" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.3, 0.34, 0.72, 20]} />
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.06, 0]}>
            <sphereGeometry args={[0.22, 20, 16]} />
            <meshStandardMaterial color="#DCE6F2" roughness={0.25} metalness={0.4} />
          </mesh>
          <mesh position={[0, 1.06, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
            <meshStandardMaterial color="#2E64B8" emissive="#1B3E7A" emissiveIntensity={0.6} />
          </mesh>
        </>
      )}
      {a.shape === 'wall' && (
        <>
          <mesh position={[0, 1.7, 0]}>
            <boxGeometry args={[3.0, 1.7, 0.12]} />
            <meshStandardMaterial color="#1E2A3C" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2.2, 0.07]}>
            <boxGeometry args={[2.6, 0.6, 0.04]} />
            <meshStandardMaterial color={color} emissive="#3A2C14" emissiveIntensity={0.25} roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[0, 1.35, 0.07]}>
            <boxGeometry args={[2.6, 0.9, 0.04]} />
            <meshStandardMaterial color="#2A3A50" roughness={0.6} />
          </mesh>
        </>
      )}
      {a.shape === 'screen' && (
        <>
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[1.7, 1.05, 0.08]} />
            <meshStandardMaterial color="#0F1B31" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 1.6, 0.06]}>
            <planeGeometry args={[1.56, 0.92]} />
            <meshStandardMaterial color="#17407A" emissive="#1E4E96" emissiveIntensity={playing ? 1.1 : 0.5} />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.5, 0.5, 0.4]} />
            <meshStandardMaterial color="#1B2839" roughness={0.7} />
          </mesh>
        </>
      )}
      {a.shape === 'panel' && (
        <>
          <mesh position={[0, 1.75, 0]}>
            <boxGeometry args={[3.4, 1.6, 0.1]} />
            <meshStandardMaterial color="#1D2939" roughness={0.8} />
          </mesh>
          <mesh position={[-0.9, 1.95, 0.06]}>
            <boxGeometry args={[1.1, 0.5, 0.03]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <mesh position={[0.55, 1.75, 0.06]}>
            <boxGeometry args={[1.7, 0.8, 0.03]} />
            <meshStandardMaterial color="#2C3D55" roughness={0.6} />
          </mesh>
        </>
      )}
    </group>
  )
}

function Room() {
  const { w, d, h } = ROOM
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#233149" roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#1A2536" roughness={0.95} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2]}>
        <boxGeometry args={[w, h, 0.12]} />
        <meshStandardMaterial color="#2A3A52" roughness={0.85} />
      </mesh>
      <mesh position={[0, h / 2, d / 2]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[w, h, 0.12]} />
        <meshStandardMaterial color="#27364C" roughness={0.85} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[d, h, 0.12]} />
        <meshStandardMaterial color="#28374E" roughness={0.85} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[d, h, 0.12]} />
        <meshStandardMaterial color="#28374E" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <ringGeometry args={[1.2, 1.24, 64]} />
        <meshBasicMaterial color="#2E64B8" transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

function Hotspot({ a, index, onPick }: { a: Achievement; index: number; onPick: () => void }) {
  return (
    <Html position={[a.at.x, 2.35, a.at.z]} center distanceFactor={11} zIndexRange={[6, 0]} className="hotspot-wrap">
      <div className="hotspot" onClick={(e) => { e.stopPropagation(); onPick() }}>
        {String(index + 1).padStart(2, '0')}
        <div className="tip">
          <strong>{a.name}</strong>
          <span>{a.demo ? '点击查看详情 · 功能演示' : '点击查看详情'}</span>
        </div>
      </div>
    </Html>
  )
}

export default function Experience({ fly, playing, onPick, onFlyDone }: Props) {
  const obstacles = useMemo(
    () =>
      achievements.map((a) => ({
        x: a.at.x,
        z: a.at.z,
        r: a.shape === 'wall' || a.shape === 'panel' ? 1.5 : 0.9,
      })),
    [],
  )

  return (
    <>
      <color attach="background" args={['#0B1220']} />
      <fog attach="fog" args={['#0B1220', 16, 34]} />
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#8FB4E8", "#16202F", 0.55]} />
      <directionalLight position={[5, 8, 4]} intensity={1.5} color="#EAF1FF" />
      <pointLight position={[-4, 3, 2]} intensity={0.9} color="#3B82F6" />
      <pointLight position={[0, 2.9, -3.4]} intensity={0.7} color="#7CB8FF" />
      <pointLight position={[4, 3, -2]} intensity={0.35} color="#7CB8FF" />
      <Room />
      {achievements.map((a) => (
        <Exhibit key={a.id} a={a} playing={playing === a.id} />
      ))}
      {achievements.map((a, i) => (
        <Hotspot key={a.id} a={a} index={i} onPick={() => onPick(a)} />
      ))}
      <WalkControls fly={fly} obstacles={obstacles} onFlyDone={onFlyDone} />
    </>
  )
}
