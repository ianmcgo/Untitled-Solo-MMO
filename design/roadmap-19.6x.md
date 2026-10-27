# Roadmap 19.58 to 19.78

## Art direction (applies to every phase)
- Lots of detail. Nothing is flat or perfectly straight, nothing is a perfect circle or perfectly smooth, nothing is one solid colour.
- Shapes: break silhouettes with lumps, bends, tapers, chips and noise. Faceted low-poly is fine; clean primitives are not.
- Colour: every surface gets variation (vertex colour gradients, darker crevices and undersides, lighter tops and edges, patches, per-instance tint).
- Textures: hand-painted look, higher resolution and more detail than the current procedural textures.

One version per phase. Each phase updates Help, the Updates list, the title stamp (via build) and design.md.

| Version | Phase | Status |
|---|---|---|
| 19.58 | Fences keep off scenery (no clipping, grounded posts) | done |
| 19.59 | Hedges as lumpy leaf clumps | done |
| 19.60 | Logs: faceted, tapered, bark ridges, cut rings, stubs, moss | done |
| 19.61 | Trees: clumped faceted canopies, branches, root flare, variants | done |
| 19.62 | Waterfall: layered flow, foam, mist, plunge pool, rocks | done |
| 19.63 | Crafting and harvesting animations; remote players show work poses | done |
| 19.64 | Skeletons with real ribcage, spine, pelvis, limb bones (no tube) | done |
| 19.65 | Hay bales and wagon cargo detail | done |
| 19.66 | Two-handed weapons held by both hands (off hand floats) | done |
| 19.67 | Faces and clothes better painted and sculpted | done |
| 19.68 | Longnecks bigger and better sculpted | done |
| 19.69 | Fish monsters scarier and more detailed | done |
| 19.70 | Mandrake, rabbit, treant remodels; aprons | done |
| 19.71 | Monster KO poses, fishing rod prop, staff cast glow | done |
| 19.72 | Weapon-skill hit-stop, monster spawn and defeat fades | done |
| 19.73 | Build next zone during the walk (second scene root) | partial: field prebuilt during the walk; terrain/props still built in the fade |
| 19.74 | File size budget: audio as separate cached files | waiting on user (breaks single-file index.html) |
| 19.75 | Painted foliage style, banded sky gradient | done |
| next | Mercenary sell-off server work: SQL and client already written (sql/m5d-run.sql, 18.35); needs the user's OK to run on Supabase | waiting on user |
| - | Deferred spells (see design.md 17.2 list) | already in game (Thorns, Edges, Laments etc.); stale item closed |
| 19.76 | Higher-quality painted textures (bark, leaf, rock, ground, planks, cloth) | done (leaf in 19.75) |

Suggested model: Sonnet for scenery props (19.60, 19.62, 19.65, 19.74); Opus for rigs, animation, faces and systems (19.63, 19.64, 19.66, 19.67, 19.73, 19.76, 19.77).
