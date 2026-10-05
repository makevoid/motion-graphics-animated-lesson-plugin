# Rebuilding ending reference images

The plugin ships editable SVGs and `layouts.json`, without PNG previews or archived film frames. Create references only in the initialized lesson project. Do not retrieve omitted binaries during installation.

## Layout previews

For `end-card.png`, `credits-title.png`, `credits-cast.png`, `credits-production.png` and `final-joke-card.png`, open the matching SVG in a local SVG-capable image editor and export a real PNG at 1920×1080. Use installed fonts and inspect line wrapping after any substitution. Keep the SVG as the editable source. These are layout guides, not finished lesson content; replace placeholders and render final text in p5. No image-model call is needed for these previews.

## Optional reference frames

The following are reconstruction briefs for the removed study frames. They are optional; the SVG guides and ending motion recipes are sufficient to build a new ending. Render these from the current project's accepted assets, using the existing p5/FFmpeg workflow, rather than asking a model to invent typography or copy archived credits:

| Output target | Reconstruction brief |
|---|---|
| `reference-credits-production.png` | Render the `credits-production.svg` two-column layout with the current lesson's actual tools, models, typefaces and production roles. Amber role headings over warm chalk text on #1B1A22. Keep both columns inside the text-safe region. |
| `reference-curtain-folding.png` | Capture a frame of the project's regenerated closing curtain while red velvet panels are visibly folding inward; gold valance fixed at the top, black behind the closing stage. |
| `reference-curtain-closed.png` | Capture the fully closed hold of the same curtain: continuous red folds meeting at center, consistent gold fringe, no lettering or characters. |
| `reference-curtain-reveal.png` | Capture the matching opening curtain revealing the new lesson's end card behind it; preserve the continuous card clock, safe title area and cast-parade strip. |

Generate the matching curtain stills and clips from [the curtain prompts](../../lesson/prompts/curtain.md) first. If a model needs a visual guide, attach the reviewed locally exported PNG and the project's approved character/curtain references. Record new images as new production outputs, not recovered originals; archived hashes and timestamps are provenance only.
