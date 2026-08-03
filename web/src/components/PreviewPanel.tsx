"use client";

import type { DeckPlan } from "@/lib/types";

interface Props {
  plan: DeckPlan | null;
  isLoading: boolean;
  error: string;
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  cover: { label: "封面", color: "text-gold" },
  toc: { label: "目录", color: "text-azure" },
  section: { label: "章节", color: "text-azure" },
  content: { label: "内容", color: "text-ink-dim" },
  summary: { label: "总结", color: "text-gold" },
};

export default function PreviewPanel({ plan, isLoading, error }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="mono-label">DECK PLAN / 大纲预览</span>
        {plan && (
          <span className="mono-label text-ink-dim">
            {plan.slides.length} slides
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-line bg-elev p-4">
        {isLoading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-mute">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-gold" />
            <span className="mono-label">GENERATING…</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {!isLoading && !error && !plan && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-ink-mute">
            <div className="mono-label">EMPTY</div>
            <p className="max-w-xs text-sm">
              填写左侧配置,点击生成。大纲与最终 .pptx 将在此预览。
            </p>
          </div>
        )}

        {!isLoading && !error && plan && (
          <ol className="flex flex-col gap-2">
            {plan.slides.map((s, i) => {
              const meta = TYPE_META[s.type] ?? TYPE_META.content;
              return (
                <li
                  key={i}
                  className="rounded-md border border-line bg-canvas/40 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="mono-label w-6">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`mono-label ${meta.color}`}>{meta.label}</span>
                    {s.layout && (
                      <span className="mono-label text-ink-mute">· {s.layout}</span>
                    )}
                    <span className="ml-auto truncate text-sm font-medium text-ink">
                      {s.title || "—"}
                    </span>
                  </div>
                  {s.bullets.length > 0 && (
                    <ul className="mt-1.5 ml-8 flex flex-col gap-0.5 text-xs text-ink-dim">
                      {s.bullets.slice(0, 4).map((b, j) => (
                        <li key={j} className="truncate">
                          · {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
