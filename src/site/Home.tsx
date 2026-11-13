import { useState } from 'react'
import sample from '../sample.mmd?raw'
import { HeroScene } from './HeroScene'
import './site.css'

const FIRST_ISSUES = [
  'Edges that cross subgraphs on big diagrams',
  'Readable edge labels at every zoom',
  'True orthographic camera for flat / iso',
  'More Mermaid shapes, classDef / style',
  'Export to PNG / GLB',
]

const Ctas = () => (
  <div className="site-ctas">
    <a className="site-btn primary" href="./app/">Try it live →</a>
    <a className="site-btn" href="https://github.com/infinitedusky/merman">View on GitHub</a>
  </div>
)

const Shot = ({ children }: { children: React.ReactNode }) => <div className="site-shot">[ {children} ]</div>

// The marketing site's one page. `poster` shows the hero's fallback still instead of the live scene.
export function Home({ name = 'merman', stars = 0, poster = false }: { name?: string; stars?: number; poster?: boolean }) {
  const [showSrc, setShowSrc] = useState(false)
  return (
    <div className="site">
      <div className="site-wrap">
        <nav className="site-nav">
          <a className="site-logo" href="#"><i />{name}</a>
          <div className="site-links">
            <a href="#how">How it works</a>
            <a href="#views">Views</a>
            <a href="#status">Status</a>
            <a className="gh" href="https://github.com/infinitedusky/merman">GitHub ★ {stars}</a>
          </div>
        </nav>

        <header className="site-hero">
          <div className="site-eyebrow">Open source · MIT · early prototype</div>
          <h1>Your Mermaid diagrams,<br />as a scene you can fly through.</h1>
          <p className="site-sub">Paste the flowchart or sequence diagram you already have. {name} lays it out and shows it flat, isometric or in 3D, with nothing to redraw.</p>
          <Ctas />
          <div className="site-hint">Runs in your browser. Best on desktop.</div>
          <HeroScene source={sample} poster={poster} onSource={() => { setShowSrc(true); document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' }) }} />
        </header>

        <div className="site-proof">
          <span>flowcharts</span><span>·</span><span>sequence diagrams</span><span>·</span><span>Three.js + ELK</span><span>·</span><span>no account, no upload</span>
        </div>

        <section id="how">
          <h2>Keep the text. Get the scene.</h2>
          <p className="site-lead">Your diagrams already live in READMEs and docs as Mermaid. You don't have to move them into a drawing tool: the same text becomes a 3D scene.</p>
          <div className={'site-split' + (showSrc ? ' flash' : '')}>
            <pre>{sample.replace(/^%%.*\n/, '')}</pre>
            <Shot>the scene above, iso: still from the real scene</Shot>
          </div>
          <div className="site-note">Edit the source, and the scene re-lays itself out as you type.</div>
        </section>

        <section id="views">
          <h2>One scene, three ways to look at it</h2>
          <p className="site-lead">The camera animates between views, so you keep your place.</p>
          <div className="site-cards">
            <div className="site-card"><Shot>flat</Shot><h3>Flat</h3><p>It reads like the Mermaid you know, for docs and screenshots.</p></div>
            <div className="site-card"><Shot>iso</Shot><h3>Isometric</h3><p>Subgraphs become trays and nodes have depth, so you see the structure at a glance.</p></div>
            <div className="site-card"><Shot>3d</Shot><h3>3D</h3><p>Orbit, zoom and fly into a subgraph to walk through a big system.</p></div>
          </div>
        </section>

        <section>
          <h2>Big diagrams stop being a wall of boxes</h2>
          <p className="site-lead">Nest subgraphs as deep as you like. Click a tray to fly in, or drag a node and its edges re-route live.</p>
          <div className="site-cards">
            <div className="site-card"><Shot>clip: click a tray, fly in</Shot><h3>Fly into subgraphs</h3><p>Each nested group is a tray you can zoom straight into.</p></div>
            <div className="site-card"><Shot>clip: drag a node, edges re-route</Shot><h3>Drag to tidy</h3><p>Nodes stay inside their subgraph while edges follow.</p></div>
            <div className="site-card"><Shot>sequence diagram in 3d</Shot><h3>Sequence diagrams too</h3><p>Lifelines lie on the ground, and loop, alt, opt and par blocks become trays.</p></div>
          </div>
        </section>

        <section id="status">
          <div className="site-status">
            <div>
              <span className="site-tag">Status: prototype</span>
              <h2>Early, and honest about it</h2>
              <p>It works on the samples. There are rough edges on large diagrams and no tests yet. If you want to help, these are good first issues:</p>
            </div>
            <ul>
              {FIRST_ISSUES.map(t => <li key={t}>{t}</li>)}
              <li><a href="https://github.com/infinitedusky/merman/blob/main/CONTRIBUTING.md">See the full list in CONTRIBUTING →</a></li>
            </ul>
          </div>
        </section>

        <section className="site-final">
          <h2>Paste a diagram and see it in 3D.</h2>
          <p className="site-lead">Nothing to install. Or run it yourself:</p>
          <pre>{'git clone https://github.com/infinitedusky/merman\npnpm install && pnpm dev'}</pre>
          <Ctas />
        </section>

        <footer className="site-footer">
          <span>{name} · MIT</span><a href="https://github.com/infinitedusky/merman">GitHub</a><a href="https://github.com/infinitedusky/merman/blob/main/CONTRIBUTING.md">Contributing</a>
          <span className="r">Built with Mermaid syntax, ELK and Three.js. Not affiliated with Mermaid.</span>
        </footer>
      </div>
    </div>
  )
}
