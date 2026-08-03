import type { GenerateOptions } from "./types";

/**
 * Build a strong system+user prompt that injects the skill's 5-page-type
 * discipline and forces a strict JSON deck plan. This is the key differentiator
 * vs. a "one-line system prompt" generator — we encode real slide knowledge.
 */
export function buildPrompt(opts: GenerateOptions): { system: string; user: string } {
  const count = clampSlideCount(opts.slideCount);

  const system = [
    "You are a senior presentation architect.",
    "You produce ONLY a JSON deck plan — no prose, no markdown fences, no explanation.",
    "",
    "OUTPUT SCHEMA (strict):",
    '{ "title": string, "slides": [ { "type": string, "title": string, "bullets": string[], "layout"?: string, "note"?: string } ] }',
    "",
    "RULES — every slide MUST be exactly ONE of these 5 page types:",
    "",
    "1. cover      — opening / tone-setting. Big title + subtitle/meta. NO page badge.",
    "   bullets[0] = subtitle, bullets[1..] = meta (presenter/date/occasion). 1 per deck (always first).",
    "2. toc        — table of contents / agenda. 3-5 section names. bullets = section titles (short).",
    "   layout: 'numbered' | 'two-column' | 'sidebar' | 'card'.",
    "3. section    — divider between major parts. Huge section number in title; 1-2 line intro in bullets.",
    "   layout: 'bold-center' | 'left-accent' | 'split'.",
    "4. content    — the body. title = page heading; bullets = key points (concise, <=5).",
    "   Exactly ONE subtype per content slide, set in layout:",
    "     'text' | 'mixed-media' | 'data-viz' | 'comparison' | 'timeline' | 'image'.",
    "   Vary layouts across content slides — never repeat the same layout twice in a row.",
    "5. summary    — closing. title = 'Thank You' / 'Summary' / next-step CTA. bullets = takeaways or action items.",
    "",
    "STRUCTURAL REQUIREMENTS:",
    `- Total slides: exactly ${count}.`,
    "- slides[0].type MUST be 'cover'.",
    "- slides[last].type MUST be 'summary'.",
    "- Use 'toc' exactly once (typically slide 2) when count >= 5.",
    "- Use 'section' dividers to break content into parts (1-3 section slides for larger decks).",
    "- The remaining slides are 'content', with DIVERSE layouts.",
    "- NEVER repeat the same layout string on consecutive slides.",
    "- bullets: 2-5 items each (except cover/section which may have 1-2).",
    "- All text in the requested language; titles short and punchy.",
    "",
    "CONTENT QUALITY:",
    "- Write actual, specific content for the topic — not placeholders.",
    "- Make bullets informative, parallel in structure, and concise.",
    "- Match the requested tone and audience.",
    "- If includeCode is true, include at least one 'content' slide with layout 'text' containing a code snippet as a bullet (use ``` fences inside the bullet string).",
    "- If includeChart is true, include at least one 'content' slide with layout 'data-viz', and note the chart type in 'note'.",
  ].join("\n");

  const user = [
    `主题 / Topic: ${opts.topic}`,
    `受众 / Audience: ${opts.audience || "通用 / general"}`,
    `语气 / Tone: ${opts.tone || "专业清晰 / professional and clear"}`,
    `语言 / Language: ${opts.language}`,
    `页数 / Slide count: ${count}`,
    `含代码片段 / Include code: ${opts.includeCode ? "yes" : "no"}`,
    `含图表建议 / Include charts: ${opts.includeChart ? "yes" : "no"}`,
    "",
    "Return the JSON deck plan now.",
  ].join("\n");

  return { system, user };
}

export function clampSlideCount(value: number): number {
  if (Number.isNaN(value)) return 8;
  return Math.min(20, Math.max(3, Math.floor(value)));
}

/**
 * Validate + normalize a raw parsed LLM JSON object into a DeckPlan.
 * Enforces the structural rules; repairs minor issues (trim, clamp count).
 */
export function validatePlan(raw: unknown, count: number): {
  plan: import("./types").DeckPlan | null;
  error?: string;
} {
  if (!raw || typeof raw !== "object") return { plan: null, error: "LLM did not return a JSON object." };
  const obj = raw as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title : "Untitled";
  const slidesRaw = Array.isArray(obj.slides) ? obj.slides : null;
  if (!slidesRaw) return { plan: null, error: "Missing 'slides' array." };

  const allowed = new Set(["cover", "toc", "section", "content", "summary"]);
  const slides = slidesRaw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => {
      const type = typeof s.type === "string" && allowed.has(s.type) ? (s.type as import("./types").SlideType) : "content";
      const t = typeof s.title === "string" ? s.title : "";
      const b = Array.isArray(s.bullets)
        ? s.bullets.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
        : [];
      const layout = typeof s.layout === "string" ? s.layout : undefined;
      const note = typeof s.note === "string" ? s.note : undefined;
      return { type, title: t, bullets: b, layout, note };
    })
    .filter((s) => s.title || s.bullets.length);

  if (slides.length === 0) return { plan: null, error: "No usable slides in plan." };

  // Force first = cover, last = summary.
  if (slides[0].type !== "cover") slides[0] = { ...slides[0], type: "cover" };
  if (slides[slides.length - 1].type !== "summary") {
    slides[slides.length - 1] = { ...slides[slides.length - 1], type: "summary" };
  }

  return { plan: { title, slides } };
}
