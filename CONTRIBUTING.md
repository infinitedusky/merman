# Contributing

Small, early project: PRs and issues welcome. `pnpm install && pnpm dev`, then open the viewer at http://localhost:5173/app/ (the bare http://localhost:5173/ is the marketing site). Pick something from the list below, or from the open issues.

After any change that alters what the scene looks like, re-run `pnpm capture` and commit the regenerated `public/*.png`. It needs a local Chrome; set `CHROME_PATH` to use a different binary.

Map of the code:
- `src/parser.ts`, `src/seq.ts`: Mermaid flowchart and sequence parsing (+ sequence layout)
- `src/layout.ts`: ELK behind `layout(graph)`; `reroute()` is the cheap drag-time router
- `src/SceneView.tsx`, `src/SeqScene.tsx`, `src/shapes.tsx`, `src/camera.ts`: the r3f scene and camera rig
- `src/samples.ts`: built-in diagrams (add one when you fix a bug it exposes)
- `src/main.tsx` (mounted by `app/index.html`): the viewer, served at `/app/`
- `src/site/` (mounted by `index.html`): the marketing page. The hero loads the scene lazily, so keep `SceneView`, `camera` and three out of `Home` and `src/site/main.tsx`; static imports of them put the whole scene chunk on first paint and on phones. Asset URLs and links in its JSX go through `import.meta.env.BASE_URL`.
- `dev/capture.*` + `scripts/capture-stills.mjs`: the asset capture behind `pnpm capture`. It is dev-only and not a build input. It renders a bare `SceneView` and writes `public/poster.png`, `og.png` and `still-*.png`.

## Good starting points
1. **Subgraph-crossing edges** on the large sample loop around the outer tray. Try ELK ports on subgraph borders, or bundled summary edges that expand on drill.
2. **Edge labels** unreadable at fit zoom: scale/fade with camera height, billboard them.
3. **Port spreading**: arrowheads pile up where many edges hit one node.
4. **True orthographic camera** for flat/iso (currently a 1° perspective camera so the ortho→perspective morph is a dolly-zoom).
5. **Drag performance**: move drag state out of React state (refs/store), measure on the large sample.
6. **Drag collision**: keep nodes from overlapping siblings; reroute around them.
7. **Sequence diagrams**: block extents per participants involved, note collision, `rect`/`critical`, autonumber.
8. **Mermaid coverage**: more shapes (`>`, `[[ ]]`, `[/ /]`), `classDef`/`style`, `direction` inside subgraphs.
9. **Tests** for the parsers.
10. **Export**: PNG/GLB of the current view.
