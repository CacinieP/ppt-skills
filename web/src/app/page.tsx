"use client";

import { useState } from "react";
import ConfigPanel from "@/components/ConfigPanel";
import PreviewPanel from "@/components/PreviewPanel";
import DownloadCard from "@/components/DownloadCard";
import type { DeckPlan, FontPairId, GenerateOptions, StyleRecipe } from "@/lib/types";

interface Result {
  blobUrl: string;
  fileName: string;
  sizeKb: number;
  plan: DeckPlan;
}

const EXAMPLES = [
  "AI 驱动的年度战略汇报",
  "向高中生解释什么是量子计算",
  "公司季度复盘:关键指标与下一步",
  "Rust 在跨平台 AI 推理中的实践",
];

export default function Home() {
  const [topic, setTopic] = useState(EXAMPLES[0]);
  const [audience, setAudience] = useState("产品团队与管理层");
  const [tone, setTone] = useState("专业、清晰、简洁");
  const [slideCount, setSlideCount] = useState(8);
  const [language, setLanguage] = useState<"zh-CN" | "en-US">("zh-CN");
  const [paletteId, setPaletteId] = useState("luxury-mysterious");
  const [fontPair, setFontPair] = useState<FontPairId>("georgia-calibri");
  const [styleRecipe, setStyleRecipe] = useState<StyleRecipe>("soft");
  const [includeCode, setIncludeCode] = useState(false);
  const [includeChart, setIncludeChart] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<DeckPlan | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  // A typed patch setter so ConfigPanel can update any field by key.
  type ConfigState = {
    topic: string; audience: string; tone: string; slideCount: number;
    language: "zh-CN" | "en-US"; paletteId: string; fontPair: FontPairId;
    styleRecipe: StyleRecipe; includeCode: boolean; includeChart: boolean;
  };
  const set = (patch: Partial<ConfigState>) => {
    if (patch.topic !== undefined) setTopic(patch.topic);
    if (patch.audience !== undefined) setAudience(patch.audience);
    if (patch.tone !== undefined) setTone(patch.tone);
    if (patch.slideCount !== undefined) setSlideCount(patch.slideCount);
    if (patch.language !== undefined) setLanguage(patch.language);
    if (patch.paletteId !== undefined) setPaletteId(patch.paletteId);
    if (patch.fontPair !== undefined) setFontPair(patch.fontPair);
    if (patch.styleRecipe !== undefined) setStyleRecipe(patch.styleRecipe);
    if (patch.includeCode !== undefined) setIncludeCode(patch.includeCode);
    if (patch.includeChart !== undefined) setIncludeChart(patch.includeChart);
  };

  const buildPayload = (): GenerateOptions => ({
    topic, audience, tone, slideCount, language, paletteId, fontPair, styleRecipe, includeCode, includeChart,
  });

  async function handleGenerate() {
    setError("");
    setIsLoading(true);
    setPlan(null);
    setResult(null);
    try {
      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      // Errors come back as JSON; success as a binary .pptx.
      const contentType = resp.headers.get("content-type") || "";
      if (!resp.ok || contentType.includes("application/json")) {
        const errBody = await resp.json().catch(() => ({ error: "生成失败,请重试。" }));
        throw new Error(errBody.error || `生成失败 (${resp.status})`);
      }

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const fileName =
        resp.headers.get("content-disposition")?.match(/filename="?([^"]+)"?/)?.[1] ||
        "presentation.pptx";

      // The server returns the real deck plan in the X-Deck-Plan header so we
      // can show the actual generated slides (not a synthetic placeholder).
      const planHeader = resp.headers.get("x-deck-plan");
      let deckPlan: DeckPlan;
      try {
        deckPlan = planHeader ? JSON.parse(decodeURIComponent(planHeader)) : {
          title: fileName.replace(/\.pptx$/, ""),
          slides: [],
        };
      } catch {
        deckPlan = { title: fileName.replace(/\.pptx$/, ""), slides: [] };
      }
      setPlan(deckPlan);
      setResult({
        blobUrl,
        fileName,
        sizeKb: Math.round(blob.size / 1024),
        plan: deckPlan,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败,请重试。");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setPlan(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-gold/50 bg-gold-soft">
              <span className="font-mono text-sm font-bold text-gold">P</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-ink">
                pptx-web
              </h1>
              <p className="mono-label">AI · PPTX · DESIGN SYSTEM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTopic(EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)])}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-dim transition hover:border-line-strong hover:text-ink"
            >
              随机示例
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              className="rounded-md bg-gold px-4 py-1.5 text-xs font-semibold text-canvas transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-mute"
            >
              {isLoading ? "生成中…" : "生成 .pptx"}
            </button>
          </div>
        </div>
      </header>

      {/* Body: two-column */}
      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Left: config */}
        <section className="rounded-xl border border-line bg-canvas p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <h2 className="mono-label text-ink-dim">CONFIGURATION / 配置</h2>
          </div>
          <ConfigPanel
            topic={topic}
            audience={audience}
            tone={tone}
            slideCount={slideCount}
            language={language}
            paletteId={paletteId}
            fontPair={fontPair}
            styleRecipe={styleRecipe}
            includeCode={includeCode}
            includeChart={includeChart}
            set={set}
          />
        </section>

        {/* Right: preview + download */}
        <section className="flex min-h-[60vh] flex-col gap-4">
          {result && (
            <DownloadCard
              fileName={result.fileName}
              blobUrl={result.blobUrl}
              sizeKb={result.sizeKb}
              onReset={handleReset}
            />
          )}
          <div className="flex-1">
            <PreviewPanel plan={plan} isLoading={isLoading} error={error} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="mono-label">5 PAGE TYPES · 18 PALETTES · 4 STYLE RECIPES</span>
          <span className="mono-label">SERVER-SIDE · PptxGenJS</span>
        </div>
      </footer>
    </div>
  );
}
