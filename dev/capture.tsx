// Dev-only page for `pnpm capture` (scripts/capture-stills.mjs). Not a build input, never in dist/.
// Renders a bare SceneView for ?sample=flow|seq&mode=flat|iso|3d and sets body[data-ready] once settled.
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { addAfterEffect } from '@react-three/fiber'
import flowSrc from '../src/sample.mmd?raw'
import { SAMPLES } from '../src/samples'
import { isSeq, parseSeq, layoutSeq, type SeqLayout } from '../src/seq'
import { parse } from '../src/parser'
import { layout } from '../src/layout'
import type { LayoutResult } from '../src/model'
import { SceneView } from '../src/SceneView'
import { cam, setMode, type Mode } from '../src/camera'

// Keep WebGL frames readable by the screenshot without a SceneView prop.
const getContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, attrs?: unknown) {
  if (type === 'webgl' || type === 'webgl2') attrs = { ...(attrs as object), preserveDrawingBuffer: true }
  return getContext.call(this, type, attrs)
} as typeof getContext

const q = new URLSearchParams(location.search)
const src = q.get('sample') === 'seq' ? SAMPLES['seq: login flow'] : flowSrc
const m = q.get('mode')
const mode: Mode = m === 'flat' || m === '3d' ? m : 'iso'
const SETTLE_FRAMES = 60

function Capture() {
  const [data, setData] = useState<LayoutResult | SeqLayout | null>(null)
  useEffect(() => {
    setMode(mode)
    void (async () => setData(isSeq(src) ? layoutSeq(parseSeq(src)) : await layout(parse(src))))()
  }, [])
  useEffect(() => {
    if (!data) return
    let n = 0
    const unsub = addAfterEffect(() => {
      // First frame with data: Rig has set cam.aspect, so refit, then snap (no tween).
      if (n === 0) { setMode(mode); Object.assign(cam.cur, cam.goal) }
      if (++n > SETTLE_FRAMES) { document.body.dataset.ready = '1'; unsub() }
    })
    return unsub
  }, [data])
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <SceneView data={data} labelMode="top" mode={mode} showFps={false} />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Capture />)
