# Image Generation Constraints

Use this reference before calling `generateSlideImage()`. The image model should create visual assets, not slide layout.

## Image Manifest

Declare each generated image before prompting:

```json
{
  "usage": "cover",
  "provider": "stepfun-cn",
  "logicalRatio": "16:9",
  "size": "1360x768",
  "safeZone": "left 45% title-safe",
  "cropPolicy": "none",
  "allowText": false,
  "styleId": "cjk-swiss-accent",
  "negativePrompt": "text, logo, watermark, QR code, slide title, UI chrome"
}
```

## Usage Mapping

| Usage | Need | StepFun | MiniMax | Notes |
| --- | --- | --- | --- | --- |
| `cover` | full slide cover | `1360x768` | `16:9` | must leave title-safe area |
| `coverOverlay` | cover under text | `1360x768` | `16:9` | always add 40-55% overlay |
| `hero` | top visual band | `1360x768` | `16:9` | crop to about 10 x 3 in |
| `bannerWide` | ultra-wide banner | `1360x768` + crop | `21:9` | StepFun requires safe-zone crop |
| `ultraWideHero` | wide title visual | `1360x768` + crop | `21:9` | keep title side clean |
| `sideStrip` | vertical side art | `768x1360` | `9:16` | no text or faces near crop edges |
| `card` | square card art | `1024x1024` | `1:1` | no embedded labels |
| `cardTall` | tall card art | `896x1184` | `3:4` | good for process/persona cards |
| `cardWide` | wide card art | `1184x896` | `4:3` | good for project preview |
| `showcase` | product/project panel | `1184x896` | `4:3` | avoid fake app chrome unless requested |
| `phoneMockup` | mobile mockup | `768x1360` | `9:16` | use real screenshots when available |
| `icon` | small illustrative icon | `512x512` | `1:1` | simple silhouette, no tiny details |

## Prompt Rules

- Include subject, style, composition, color family, safe-zone, and forbidden content.
- State "no text, no logo, no watermark, no QR code" unless the image intentionally needs one.
- For cover/hero: ask for negative space where PPTX text will sit.
- For IP themes: request inspired-by colors/motifs, not official character likeness, unless rights are provided.
- Keep image language consistent across the whole deck: same lighting, lens, material, and abstraction level.

## Negative Prompt Defaults

Use this baseline unless the user needs otherwise:

```text
text, typography, logo, watermark, QR code, signature, page number, slide title, chart labels, fake UI chrome, distorted hands, extra limbs, low resolution, blurry, noisy, cluttered background
```

## Provider Constraints

- StepFun is recommended when exact PPT-friendly pixel sizes are needed.
- StepFun `bannerWide` and `ultraWideHero` use `1360x768` and rely on PPT crop/layout; keep important content inside the safe zone.
- MiniMax is preferred for native `21:9` ultra-wide imagery.
- MiniMax custom `width/height` must be 512-2048 and divisible by 8; prefer `aspect_ratio` for deck work.
- Always download returned URLs immediately and embed local files into PPTX.
