import { NextResponse } from "next/server";
import { buildPrompt, clampSlideCount, validatePlan } from "@/lib/prompt";
import { resolveTheme, resolveFontPair, resolveStyleMetrics } from "@/lib/palettes";
import { renderPptx } from "@/lib/render";
import type { GenerateOptions } from "@/lib/types";

// Vercel serverless: allow up to 60s for LLM + render.
export const maxDuration = 60;
// Always run dynamically (never statically cached).
export const dynamic = "force-dynamic";

const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "glm-4-plus";

function normalize(payload: Partial<GenerateOptions>): GenerateOptions {
  return {
    topic: String(payload.topic || "").trim(),
    audience: String(payload.audience || ""),
    tone: String(payload.tone || ""),
    slideCount: Number(payload.slideCount || 8),
    language: payload.language === "en-US" ? "en-US" : "zh-CN",
    paletteId: String(payload.paletteId || "luxury-mysterious"),
    fontPair: (String(payload.fontPair || "georgia-calibri") as GenerateOptions["fontPair"]),
    styleRecipe: (["sharp", "soft", "rounded", "pill"].includes(payload.styleRecipe as string)
      ? (payload.styleRecipe as GenerateOptions["styleRecipe"])
      : "soft"),
    includeCode: Boolean(payload.includeCode),
    includeChart: Boolean(payload.includeChart),
  };
}

export async function POST(request: Request) {
  let payload: Partial<GenerateOptions>;
  try {
    payload = (await request.json()) as Partial<GenerateOptions>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const opts = normalize(payload);

  if (!opts.topic) {
    return NextResponse.json({ error: "请输入主题或需求描述。" }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "服务器未配置 OPENAI_API_KEY。请在环境变量中设置后重试。" },
      { status: 500 },
    );
  }

  const count = clampSlideCount(opts.slideCount);
  const { system, user } = buildPrompt(opts);

  // 1) Ask the LLM for a structured deck plan (JSON mode).
  let planJson: unknown;
  try {
    const resp = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: `模型调用失败 (${resp.status}): ${text.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const data = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "模型返回为空，请重试。" }, { status: 502 });
    }
    planJson = JSON.parse(content);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "模型调用或解析失败。" },
      { status: 500 },
    );
  }

  // 2) Validate the plan.
  const { plan, error } = validatePlan(planJson, count);
  if (!plan) {
    return NextResponse.json({ error: error || "生成的大纲无效。" }, { status: 500 });
  }

  // 3) Render to .pptx in memory.
  const theme = resolveTheme(opts.paletteId);
  const fonts = resolveFontPair(opts.fontPair);
  const style = resolveStyleMetrics(opts.styleRecipe);

  let buffer: Buffer;
  try {
    buffer = await renderPptx(plan, { theme, fonts, style, language: opts.language });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? `渲染失败: ${err.message}` : "渲染失败。" },
      { status: 500 },
    );
  }

  // 4) Return the binary .pptx, with the deck plan in a header so the client
  //    can render the real preview without a second LLM call. The plan JSON is
  //    small (2-6KB for typical decks) and URI-encoded for header safety.
  const safeName = (plan.title || "presentation")
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "_")
    .slice(0, 40) || "presentation";
  const planHeader = encodeURIComponent(JSON.stringify(plan));
  // Wrap the Buffer in a Uint8Array view so it satisfies BodyInit across TS lib defs.
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${safeName}.pptx"`,
      "Content-Length": String(buffer.byteLength),
      "X-Deck-Plan": planHeader,
    },
  });
}
