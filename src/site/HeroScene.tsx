import { useEffect, useRef, useState } from 'react'
import { parse } from '../parser'
import { layout } from '../layout'
import { isSeq, parseSeq, layoutSeq, type SeqLayout } from '../seq'
import type { LayoutResult } from '../model'
import { SceneView } from '../SceneView'
import { setMode, type Mode } from '../camera'

const ORDER: Mode[] = ['flat', 'iso', '3d']

// The landing page's hero: the real scene, cycling flat -> iso -> 3d until the visitor picks a mode.
// `poster` stands in for the still shown before the scene loads, on phones and without WebGL.
export function HeroScene({ source, start = 'iso', autoplay = true, every = 3500, poster = false, onSource }: {
  source: string; start?: Mode; autoplay?: boolean; every?: number; poster?: boolean; onSource?: () => void
}) {
  const [data, setData] = useState<LayoutResult | SeqLayout | null>(null)
  const [mode, setM] = useState<Mode>(start)
  const [playing, setPlaying] = useState(autoplay)
  const i = useRef(ORDER.indexOf(start))

  useEffect(() => {
    if (poster) return
    let live = true
    ;(async () => {
      const r = isSeq(source) ? layoutSeq(parseSeq(source)) : await layout(parse(source))
      if (live) setData(r)
    })()
    return () => { live = false }
  }, [source, poster])

  useEffect(() => { setMode(mode) }, [mode, data])

  useEffect(() => {
    if (!playing || poster) return
    const t = setInterval(() => { i.current = (i.current + 1) % ORDER.length; setM(ORDER[i.current]) }, every)
    return () => clearInterval(t)
  }, [playing, poster, every])

  const pick = (m: Mode) => { setPlaying(false); i.current = ORDER.indexOf(m); setM(m) }

  return (
    <div className="site-stage">
      {poster
        ? <div className="site-poster"><span>still of the scene (iso) · shown before the scene loads, on phones and without WebGL</span></div>
        : <SceneView data={data} labelMode="top" mode={mode} />}
      {!poster && (
        <div className="site-modes" role="group" aria-label="View">
          {ORDER.map(m => <button key={m} className={m === mode ? 'on' : ''} onClick={() => pick(m)}>{m}</button>)}
        </div>
      )}
      <div className="site-stage-caption">{poster ? 'Try it live to explore' : playing ? 'auto-playing · pick a view to take over' : 'drag a node · click a tray to fly in'}</div>
      <button className="site-stage-src" onClick={onSource}>see the source ↗</button>
    </div>
  )
}
