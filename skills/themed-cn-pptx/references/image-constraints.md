# Image Generation Constraints

Use this reference before calling `generateSlideImage()`. The image model should create visual assets, not slide layout.

## Image Manifest

Declare each generated image before prompting:

```json
{
  "usage": "cover",
  "provider": "openai",
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

| Usage | Need | GPT Image 2 | Nano Banana Pro | Notes |
| --- | --- | --- | --- | --- |
| `cover` | full slide cover | `1360x768` | `16:9 + 2K` | must leave title-safe area |
| `coverOverlay` | cover under text | `1360x768` | `16:9 + 2K` | always add 40-55% overlay |
| `hero` | top visual band | `1360x768` | `16:9 + 2K` | crop to about 10 x 3 in |
| `bannerWide` | ultra-wide banner | `1344x576` (native 21:9) | `21:9 + 2K` | no crop needed on either provider |
| `ultraWideHero` | wide title visual | `1344x576` (native 21:9) | `21:9 + 2K` | keep title side clean |
| `sideStrip` | vertical side art | `768x1360` | `9:16 + 2K` | no text or faces near crop edges |
| `card` | square card art | `1024x1024` | `1:1 + 1K` | no embedded labels |
| `cardTall` | tall card art | `896x1184` | `3:4 + 1K` | good for process/persona cards |
| `cardWide` | wide card art | `1184x896` | `4:3 + 1K` | good for project preview |
| `showcase` | product/project panel | `1184x896` | `4:3 + 2K` | avoid fake app chrome unless requested |
| `phoneMockup` | mobile mockup | `768x1360` | `9:16 + 1K` | use real screenshots when available |
| `icon` | small illustrative icon | `1024x1024` (adapted from 512x512) | `1:1 + 1K` | simple silhouette, no tiny details |

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

- OpenAI `gpt-image-2` is the recommended default: exact PPT-friendly pixel sizes pass through directly (both edges multiples of 16, max edge 3840, long:short <= 3:1, total pixels 655,360-8,294,400); out-of-range sizes are adapted by `adaptSizeForGptImage()` with a warning.
- `icon` 512x512 is below the gpt-image-2 minimum pixel count, so it is generated at 1024x1024 (1:1 unchanged); Nano Banana Pro has no sub-1K output either.
- `bannerWide` and `ultraWideHero` generate natively at 21:9 (`1344x576` on OpenAI, `21:9` on Google) — no crop needed; keep important content inside the safe zone anyway.
- Google `gemini-3-pro-image` (Nano Banana Pro) uses `aspect_ratio` + `image_size` (`1K/2K/4K`, uppercase K); unsupported ratios snap to the numerically nearest supported ratio.
- Both providers return base64 data; the helper always writes local files under `assets/<provider>/` and embeds those into PPTX.
