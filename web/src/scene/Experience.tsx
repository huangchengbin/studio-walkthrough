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
            <meshStandardMaterial color="#E9EEF5" roughness={0.6} />
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
            <meshStandardMaterial color="#E9EEF5" roughness={0.6} />
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
            <meshStandardMaterial color="#E2E8F0" roughness={0.75} />
          </mesh>
          <mesh position={[0, 2.2, 0.07]}>
            <boxGeometry args={[2.6, 0.6, 0.04]} />
            <meshStandardMaterial color={color} emissive="#3A2C14" emissiveIntensity={0.25} roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[0, 1.35, 0.07]}>
            <boxGeometry args={[2.6, 0.9, 0.04]} />
            <meshStandardMaterial color="#EDF1F5" roughness={0.6} />
          </mesh>
        </>
      )}
      {a.shape === 'screen' && (
        <>
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[1.7, 1.05, 0.08]} />
            <meshStandardMaterial color="#2C3A4E" roughness={0.35} metalness={0.2} />
          </mesh>
          <mesh position={[0, 1.6, 0.06]}>
            <planeGeometry args={[1.56, 0.92]} />
            <meshStandardMaterial color="#17407A" emissive="#1E4E96" emissiveIntensity={playing ? 1.1 : 0.5} />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.5, 0.5, 0.4]} />
            <meshStandardMaterial color="#E9EEF5" roughness={0.6} />
          </mesh>
        </>
      )}
      {a.shape === 'panel' && (
        <>
          <mesh position={[0, 1.75, 0]}>
            <boxGeometry args={[3.4, 1.6, 0.1]} />
            <meshStandardMaterial color="#E6EBF2" roughness={0.75} />
          </mesh>
          <mesh position={[-0.9, 1.95, 0.06]}>
            <boxGeometry args={[1.1, 0.5, 0.03]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <mesh position={[0.55, 1.75, 0.06]}>
            <boxGeometry args={[1.7, 0.8, 0.03]} />
            <meshStandardMaterial color="#DCE4EE" roughness={0.6} />
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
        <meshStandardMaterial color="#C9B393" roughness={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#F4F6F9" roughness={0.95} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2]}>
        <boxGeometry args={[w, h, 0.12]} />
        <meshStandardMaterial color="#EDF1F5" roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, d / 2]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[w, h, 0.12]} />
        <meshStandardMaterial color="#E8EDF3" roughness={0.9} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[d, h, 0.12]} />
        <meshStandardMaterial color="#E8EDF3" roughness={0.9} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[d, h, 0.12]} />
        <meshStandardMaterial color="#E8EDF3" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <ringGeometry args={[1.2, 1.24, 64]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.32} />
      </mesh>
      {/* 踢脚线 */}
      <mesh position={[0, 0.06, -d / 2 + 0.1]}>
        <boxGeometry args={[w - 0.2, 0.12, 0.04]} />
        <meshStandardMaterial color="#D6DDE7" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.06, d / 2 - 0.1]}>
        <boxGeometry args={[w - 0.2, 0.12, 0.04]} />
        <meshStandardMaterial color="#D6DDE7" roughness={0.7} />
      </mesh>
      <mesh position={[-w / 2 + 0.1, 0.06, 0]}>
        <boxGeometry args={[0.04, 0.12, d - 0.2]} />
        <meshStandardMaterial color="#D6DDE7" roughness={0.7} />
      </mesh>
      <mesh position={[w / 2 - 0.1, 0.06, 0]}>
        <boxGeometry args={[0.04, 0.12, d - 0.2]} />
        <meshStandardMaterial color="#D6DDE7" roughness={0.7} />
      </mesh>
      {/* 顶部灯带 */}
      <mesh position={[0, h - 0.06, -d / 2 + 0.08]}>
        <boxGeometry args={[w - 1.2, 0.035, 0.025]} />
        <meshStandardMaterial color="#C9D9F2" emissive="#8FB8F0" emissiveIntensity={0.8} />
      </mesh>
      <spotLight position={[0, h - 0.2, 0]} angle={0.9} penumbra={0.6} intensity={14} color="#FFF9F0" distance={12} decay={2} />
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
      <color attach="background" args={['#E9EEF4']} />
      <fog attach="fog" args={['#E9EEF4', 20, 46]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#FFFFFF", "#D8C6AC", 0.8]} />
      <directionalLight position={[6, 9, 5]} intensity={2.0} color="#FFF6E8" />
      <pointLight position={[-4, 3, 2]} intensity={1.2} color="#FFE9C9" />
      <pointLight position={[3, 2.9, -2]} intensity={0.8} color="#BFD8FF" />
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
