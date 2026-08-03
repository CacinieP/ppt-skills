// Shared types for the PPTX web generator.

/** The five slide page types every slide must be exactly one of. */
export type SlideType = "cover" | "toc" | "section" | "content" | "summary";

/**
 * The theme object contract — MANDATORY shape.
 * NEVER use other key names (background/text/muted/...).
 * Colors are 6-char hex WITHOUT '#'.
 */
export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  bg: string;
}

/** A single slide in the LLM-produced plan. */
export interface SlidePlan {
  type: SlideType;
  title: string;
  /** Bullet points / key lines. For cover this may hold subtitle/meta. */
  bullets: string[];
  /** Optional layout hint within the type (e.g. "asymmetric", "center"). */
  layout?: string;
  /** Optional speaker note. */
  note?: string;
}

/** A structured deck plan returned by the LLM. */
export interface DeckPlan {
  title: string;
  slides: SlidePlan[];
}

/** Style recipe — controls corner radius + spacing. */
export type StyleRecipe = "sharp" | "soft" | "rounded" | "pill";

/** Page-number badge shape. */
export type BadgeShape = "circle" | "pill";

/** Font pairing id. */
export type FontPairId =
  | "georgia-calibri"
  | "arialblack-arial"
  | "calibri-calibrilight"
  | "cambria-calibri"
  | "trebuchet-calibri"
  | "impact-arial"
  | "palatino-garamond"
  | "consolas-calibri";

/** Font pairing resolved to header + body fontFace. */
export interface FontPair {
  id: FontPairId;
  header: string;
  body: string;
}

/** Form payload sent from the client to POST /api/generate. */
export interface GenerateOptions {
  topic: string;
  audience: string;
  tone: string;
  slideCount: number;
  language: "zh-CN" | "en-US";
  paletteId: string;
  fontPair: FontPairId;
  styleRecipe: StyleRecipe;
  includeCode: boolean;
  includeChart: boolean;
}

/** Numeric layout knobs derived from StyleRecipe (units: inches). */
export interface StyleMetrics {
  pageMargin: number;
  blockGap: number;
  elementPad: number;
  /** corner radius for small / medium / large elements. */
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  badge: BadgeShape;
}
