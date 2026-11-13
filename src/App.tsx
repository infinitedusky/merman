import { useEffect, useState } from 'react'
import { SAMPLES } from './samples'
import { isSeq, parseSeq, layoutSeq } from './seq'
import type { SeqLayout } from './seq'
import { parse } from './parser'
import { layout } from './layout'
import type { LayoutResult } from './model'
import { SceneView } from './SceneView'
import { setMode, focusOn, cam, type Mode } from './camera'
import { S } from './shapes'
import type { LabelMode } from './shapes'

const btn = (on: boolean): React.CSSProperties => ({ padding: '5px 12px', border: '1px solid #3a4560', background: on ? '#4b6bdc' : '#1a2030', color: '#fff', borderRadius: 5, cursor: 'pointer' })

export default function App() {
  const [src, setSrc] = useState(Object.values(SAMPLES)[0])
  const [sel, setSel] = useState(Object.keys(SAMPLES)[0])
  const [data, setData] = useState<LayoutResult | SeqLayout | null>(null)
  const [err, setErr] = useState('')
  const [mode, setM] = useState<Mode>('iso')
  const [labelMode, setLabelMode] = useState<LabelMode>('top')
  const [edit, setEdit] = useState(false)
  const [ms, setMs] = useState(0)

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const t0 = performance.now()
        const r = isSeq(src) ? layoutSeq(parseSeq(src)) : await layout(parse(src))
        setMs(Math.round(performance.now() - t0)); setErr(''); setData(r)
      } catch (e) { setErr(String(e)) }
    }, 250)
    return () => clearTimeout(t)
  }, [src])

  const pick = (m: Mode) => { setM(m); setMode(m) }
  const fit = () => data && focusOn(0, 0, data.width * S, data.height * S)
  void cam
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <SceneView data={data} labelMode={labelMode} mode={mode} />
      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, alignItems: 'center', color: '#9aa6c0' }}>
        {(['flat', 'iso', '3d'] as Mode[]).map(m => <button key={m} style={btn(mode === m)} onClick={() => pick(m)}>{m}</button>)}
        <span style={{ width: 8 }} />
        <button style={btn(false)} onClick={() => setLabelMode(l => l === 'top' ? 'billboard' : 'top')}>labels: {labelMode}</button>
        <button style={btn(false)} onClick={fit}>fit / relayout</button>
        <select value={sel} onChange={e => { setSel(e.target.value); setSrc(SAMPLES[e.target.value]) }} style={{ padding: 5, background: '#1a2030', color: '#fff', border: '1px solid #3a4560', borderRadius: 5 }}>{Object.keys(SAMPLES).map(k => <option key={k}>{k}</option>)}</select>
        <button style={btn(edit)} onClick={() => setEdit(e => !e)}>source</button>
        <span>ELK {ms}ms</span>
      </div>
      {edit && <textarea value={src} onChange={e => setSrc(e.target.value)} spellCheck={false}
        style={{ position: 'absolute', top: 48, left: 10, width: 360, height: '60%', background: '#10151f', color: '#cfd8ea', border: '1px solid #3a4560', font: '12px monospace' }} />}
      {err && <div style={{ position: 'absolute', bottom: 10, left: 10, color: '#ff8a8a' }}>{err}</div>}
      <div style={{ position: 'absolute', bottom: 10, left: 10, color: '#556', fontSize: 11 }}>drag node · drag bg pan (3d: orbit) · wheel zoom · click tray to fly in</div>
    </div>
  )
}
