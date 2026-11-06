# Character concepts v1 (hip hop)

Approved by Daniel on 2026-11-04 as the visual direction for the six hip hop characters. Concept references only, not production sprites. Originally PNG (~1.5 MB each); stored here as WebP (quality 88) to keep the repo light.

**Status on `feat/editorial-themes`:** the game uses the Rive characters (`src/visuals/rive/`) with the SVG renderer as fallback. These concepts are the reference for customizing those avatars. A first vector adaptation (`StreetwearArt.tsx`) was made on PC1 but lives only in the local backup branch `respaldo/portada-neutra-pc1`; it was superseded by the Rive work.

## Prompt set

Shared direction: one original full-body human beatbox performer per image; frontal idle pose, expressive unobstructed face, thick dark outlines, flat cel shading, urban streetwear, charcoal neutrals with a role-specific accent, no text or logos. Outputs needed clean cutouts (some had dark backdrops or colored halos). For animation, split head, mouth, eyes and body into layers or frames (see `docs/DESIGN_BRIEF.md`).

- `kick.webp`: stocky performer, orange backward cap and oversized bomber jacket, charcoal cargo pants, orange high-tops.
- `snare.webp`: lean performer, short angular hair, magenta utility vest, dark long sleeves and pants with magenta piping.
- `hihat.webp`: slim performer, yellow bucket hat, yellow/charcoal windbreaker, crossbody bag and tapered track pants.
- `bass.webp`: broad performer, violet beanie and hoodie, charcoal puffer vest and baggy jeans.
- `voice.webp`: performer with two curly hair puffs, green varsity jacket with cream sleeves and loose dark pants.
- `fx.webp`: performer with asymmetrical cyan-streaked hair, cyan technical anorak, utility joggers and headphones around the neck.

Each character was generated independently from the shared direction plus its outfit. Check proportional consistency and small-screen legibility as a group before using them for production art.
