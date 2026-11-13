# merman

> Mermaid diagrams, as a 3D scene (flat, iso, 3D).

Mermaid → ELK → one Three.js scene you can view **flat, isometric or 3D**, with animated camera transitions.

- Flowcharts: nested subgraphs become trays, nodes are extruded shapes (rect, round, cylinder, diamond), edges follow ELK's orthogonal routes.
- Sequence diagrams: participants, lifelines on the ground, messages, activations as raised bars, `loop`/`alt`/`opt`/`par` blocks as translucent trays.
- Drag nodes (kept inside their subgraph; edges reroute live), click a subgraph to fly in, edit the source live, pick from built-in samples.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm storybook    # stories: node shape, subgraph, full sample, sequence
```

Stack: Vite, React, react-three-fiber, drei (troika text), elkjs. Parser, ELK layout (`src/layout.ts`, swappable behind `layout(graph)`) and sequence layout (`src/seq.ts`) are our own.

**Status: prototype.** Known gaps: ELK routes cross-subgraph edges badly on big diagrams; flat/iso use a 1° perspective camera rather than a true orthographic one; no tests.

## The screen map

Storybook (`pnpm storybook`) draws a map of the screens from `src/flows/*.flow.json`: open the Map page under Docs and zoom out. Add a screen by adding its page story to a node there, whole screens only.
