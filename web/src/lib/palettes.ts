import type { Theme, FontPair, FontPairId, StyleRecipe, StyleMetrics, BadgeShape } from "./types";

/**
 * 18 named color palettes, ported verbatim from the pptx-generator skill's
 * design-system.md. Each maps to the 5-key Theme contract:
 *   { primary, secondary, accent, light, bg }
 * Colors are 6-char hex WITHOUT '#'.
 *
 * NOTE: the source palettes list colors as a 5-tuple. We map them positionally:
 *   (primary, secondary, accent, light, bg) — matching the skill's default
 *   (Luxury & Mysterious) ordering used in SKILL.md examples.
 */
export interface Palette {
  id: string;
  name: string;
  theme: Theme;
  /** Suggested use cases (from the skill). */
  useCases: string;
}

export const PALETTES: Palette[] = [
  {
    id: "modern-wellness",
    name: "Modern & Wellness",
    theme: { primary: "006d77", secondary: "83c5be", accent: "ffddd2", light: "e29578", bg: "edf6f9" },
    useCases: "医疗健康、心理咨询、护肤、瑜伽水疗",
  },
  {
    id: "business-authority",
    name: "Business & Authority",
    theme: { primary: "2b2d42", secondary: "8d99ae", accent: "ef233c", light: "d90429", bg: "edf2f4" },
    useCases: "年度报告、财务分析、企业、政府",
  },
  {
    id: "nature-outdoors",
    name: "Nature & Outdoors",
    theme: { primary: "283618", secondary: "606c38", accent: "dda15e", light: "bc6c25", bg: "fefae0" },
    useCases: "户外装备、环保、农业",
  },
  {
    id: "vintage-academic",
    name: "Vintage & Academic",
    theme: { primary: "003049", secondary: "669bbc", accent: "c1121f", light: "780000", bg: "fdf0d5" },
    useCases: "学术讲座、历史、博物馆",
  },
  {
    id: "soft-creative",
    name: "Soft & Creative",
    theme: { primary: "cdb4db", secondary: "ffc8dd", accent: "bde0fe", light: "a2d2ff", bg: "ffafcc" },
    useCases: "母婴、甜品、女性时尚、幼儿园",
  },
  {
    id: "bohemian",
    name: "Bohemian",
    theme: { primary: "414833", secondary: "656d4a", accent: "ccd5ae", light: "d4a373", bg: "fefae0" },
    useCases: "婚庆策划、家居装饰、有机食品",
  },
  {
    id: "vibrant-tech",
    name: "Vibrant & Tech",
    theme: { primary: "023047", secondary: "219ebc", accent: "ffb703", light: "fb8500", bg: "8ecae6" },
    useCases: "体育、健身房、创业路演、青少年教育",
  },
  {
    id: "craft-artisan",
    name: "Craft & Artisan",
    theme: { primary: "414833", secondary: "656d4a", accent: "a68a64", light: "7f5539", bg: "ede0d4" },
    useCases: "咖啡馆、手工艺、烘焙",
  },
  {
    id: "tech-night",
    name: "Tech & Night",
    theme: { primary: "000814", secondary: "001d3d", accent: "ffc300", light: "ffd60a", bg: "003566" },
    useCases: "科技发布、天文、夜间经济、豪华汽车",
  },
  {
    id: "education-charts",
    name: "Education & Charts",
    theme: { primary: "264653", secondary: "2a9d8f", accent: "f4a261", light: "e76f51", bg: "e9c46a" },
    useCases: "统计报告、教育、市场分析",
  },
  {
    id: "forest-eco",
    name: "Forest & Eco",
    theme: { primary: "344e41", secondary: "3a5a40", accent: "a3b18a", light: "588157", bg: "dad7cd" },
    useCases: "景观设计、ESG、环境",
  },
  {
    id: "elegant-fashion",
    name: "Elegant & Fashion",
    theme: { primary: "4a5759", secondary: "b0c4b1", accent: "edafb8", light: "dedbd2", bg: "f7e1d7" },
    useCases: "高级定制、画廊、美妆、杂志",
  },
  {
    id: "art-food",
    name: "Art & Food",
    theme: { primary: "335c67", secondary: "540b0e", accent: "e09f3e", light: "9e2a2b", bg: "fff3b0" },
    useCases: "美食纪录片、艺术展、复古餐厅",
  },
  {
    id: "luxury-mysterious",
    name: "Luxury & Mysterious",
    theme: { primary: "22223b", secondary: "4a4e69", accent: "9a8c98", light: "c9ada7", bg: "f2e9e4" },
    useCases: "珠宝、酒店管理、高端咨询、心理学",
  },
  {
    id: "pure-tech-blue",
    name: "Pure Tech Blue",
    theme: { primary: "03045e", secondary: "0077b6", accent: "90e0ef", light: "00b4d8", bg: "caf0f8" },
    useCases: "云/AI、水/海洋、医院、清洁能源",
  },
  {
    id: "coastal-coral",
    name: "Coastal Coral",
    theme: { primary: "0081a7", secondary: "00afb9", accent: "fed9b7", light: "f07167", bg: "fdfcdc" },
    useCases: "旅行、夏季活动、饮料品牌、海洋",
  },
  {
    id: "vibrant-orange-mint",
    name: "Vibrant Orange Mint",
    theme: { primary: "2ec4b6", secondary: "cbf3f0", accent: "ffbf69", light: "ff9f1c", bg: "ffffff" },
    useCases: "儿童活动、促销海报、快消",
  },
  {
    id: "platinum-white-gold",
    name: "Platinum White Gold",
    theme: { primary: "0a0a0a", secondary: "f5f5f5", accent: "0070F3", light: "D4AF37", bg: "ffffff" },
    useCases: "Agent 产品、企业官网、金融科技、奢侈品",
  },
];

export const DEFAULT_PALETTE_ID = "luxury-mysterious";

/** Resolve a palette id to its Theme; falls back to the default. */
export function resolveTheme(paletteId: string): Theme {
  const found = PALETTES.find((p) => p.id === paletteId);
  const palette = found ?? PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!;
  return { ...palette.theme };
}

/** Font pairings — ported from design-system.md Font Pairings table. */
export const FONT_PAIRS: FontPair[] = [
  { id: "georgia-calibri", header: "Georgia", body: "Calibri" },
  { id: "arialblack-arial", header: "Arial Black", body: "Arial" },
  { id: "calibri-calibrilight", header: "Calibri", body: "Calibri Light" },
  { id: "cambria-calibri", header: "Cambria", body: "Calibri" },
  { id: "trebuchet-calibri", header: "Trebuchet MS", body: "Calibri" },
  { id: "impact-arial", header: "Impact", body: "Arial" },
  { id: "palatino-garamond", header: "Palatino", body: "Garamond" },
  { id: "consolas-calibri", header: "Consolas", body: "Calibri" },
];

export function resolveFontPair(id: FontPairId): FontPair {
  return FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0];
}

/**
 * Style recipes → concrete layout metrics (inches). Ported from the skill's
 * Style Recipes table. rectRadius only applies to ROUNDED_RECTANGLE.
 */
export function resolveStyleMetrics(recipe: StyleRecipe): StyleMetrics {
  switch (recipe) {
    case "sharp":
      return { pageMargin: 0.3, blockGap: 0.3, elementPad: 0.12, radiusSm: 0, radiusMd: 0.03, radiusLg: 0.05, badge: "circle" };
    case "soft":
      return { pageMargin: 0.4, blockGap: 0.42, elementPad: 0.18, radiusSm: 0.05, radiusMd: 0.08, radiusLg: 0.12, badge: "circle" };
    case "rounded":
      return { pageMargin: 0.5, blockGap: 0.6, elementPad: 0.25, radiusSm: 0.1, radiusMd: 0.15, radiusLg: 0.25, badge: "pill" };
    case "pill":
      return { pageMargin: 0.6, blockGap: 0.75, elementPad: 0.32, radiusSm: 0.2, radiusMd: 0.3, radiusLg: 0.5, badge: "pill" };
  }
}

/** The badge shape for a given recipe (drives whether circle or pill). */
export function badgeShapeFor(recipe: StyleRecipe): BadgeShape {
  return resolveStyleMetrics(recipe).badge;
}
