import type { Meta, StoryObj } from '@storybook/react-vite'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useState } from 'react'
import sample from './sample.mmd?raw'
import { parse } from './parser'
import { layout } from './layout'
import type { Box, LayoutResult } from './model'
import { NodeBody, Tray, S } from './shapes'
import { SceneView } from './SceneView'
import { setMode } from './camera'
import { SAMPLES } from './samples'
import { parseSeq, layoutSeq } from './seq'

const Stage = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: '100vw', height: '100vh', background: '#0f1218', position: 'relative' }}>
    <Canvas shadows camera={{ position: [6, 6, 6], fov: 35 }}>
      <color attach="background" args={['#0f1218']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 4]} intensity={1.6} castShadow />
      <OrbitControls makeDefault />
      {children}
    </Canvas>
  </div>
)
const box = (o: Partial<Box>): Box => ({ id: 'n', label: 'Node', kind: 'node', shape: 'rect', x: 0, y: 0, w: 140, h: 56, level: 0, ...o })

const meta: Meta = { title: 'Scene' }
export default meta

export const NodeShape: StoryObj<{ shape: Box['shape']; labelMode: 'top' | 'billboard' }> = {
  args: { shape: 'cylinder', labelMode: 'top' },
  argTypes: { shape: { control: 'select', options: ['rect', 'round', 'cylinder', 'diamond'] }, labelMode: { control: 'inline-radio', options: ['top', 'billboard'] } },
  render: ({ shape, labelMode }) => <Stage><NodeBody b={box({ shape, label: 'PostgreSQL' })} labelMode={labelMode} /></Stage>,
}

export const Subgraph: StoryObj = {
  render: () => (
    <Stage>
      <Tray b={box({ kind: 'group', label: 'API Server', w: 260, h: 180 })} labelMode="top" />
      <group position={[-1.2, 0.25, 0.4]}><NodeBody b={box({ label: 'REST API' })} labelMode="top" /></group>
      <group position={[1.2, 0.25, 0.4]}><NodeBody b={box({ label: 'GraphQL', shape: 'diamond' })} labelMode="top" /></group>
    </Stage>
  ),
}

export const FullSample: StoryObj = {
  render: () => {
    const [data, setData] = useState<LayoutResult | null>(null)
    useEffect(() => { layout(parse(sample)).then(setData); setMode('iso') }, [])
    return <div style={{ width: '100vw', height: '100vh', position: 'relative' }}><SceneView data={data} labelMode="top" mode="iso" /></div>
  },
}

export const SequenceLogin: StoryObj<{ mode: 'flat' | 'iso' | '3d' }> = {
  args: { mode: 'iso' },
  argTypes: { mode: { control: 'inline-radio', options: ['flat', 'iso', '3d'] } },
  render: ({ mode }) => {
    useEffect(() => { setMode(mode) }, [mode])
    const data = layoutSeq(parseSeq(SAMPLES['seq: login flow']))
    return <div style={{ width: '100vw', height: '100vh', position: 'relative' }}><SceneView data={data} labelMode="top" mode={mode} /></div>
  },
}
void S
