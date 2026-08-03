"use client";

import { PALETTES, DEFAULT_PALETTE_ID } from "@/lib/palettes";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

const TYPE_LABEL: Record<string, string> = {
  cover: "封面",
  toc: "目录",
  section: "章节",
  content: "内容",
  summary: "总结",
};

export default function PalettePicker({ value, onChange }: Props) {
  const selected = PALETTES.find((p) => p.id === value) ?? PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!;

  return (
    <div>
      <div className="mono-label mb-2">PALETTE / 调色板</div>

      {/* Selected palette header */}
      <div className="mb-3 rounded-md border border-line bg-elev px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">{selected.name}</span>
        </div>
        <div className="mt-1.5 text-xs text-ink-dim">{selected.useCases}</div>
        <div className="mt-2.5 flex gap-1">
          {(["primary", "secondary", "accent", "light", "bg"] as const).map((k) => (
            <div key={k} className="flex-1">
              <div
                className="h-6 w-full rounded-sm border border-line"
                style={{ background: `#${selected.theme[k]}` }}
                title={`${k}: #${selected.theme[k]}`}
              />
              <div className="mono-label mt-1 text-center" style={{ fontSize: 9 }}>
                {k.slice(0, 3)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of swatches */}
      <div className="grid grid-cols-9 gap-1.5">
        {PALETTES.map((p) => {
          const isActive = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              title={`${p.name} — ${p.useCases}`}
              className={`group relative aspect-square overflow-hidden rounded-sm border transition ${
                isActive
                  ? "border-gold ring-1 ring-gold"
                  : "border-line hover:border-line-strong"
              }`}
            >
              <div className="flex h-full flex-col">
                <div className="flex-1" style={{ background: `#${p.theme.primary}` }} />
                <div className="flex-1" style={{ background: `#${p.theme.accent}` }} />
                <div className="flex-1" style={{ background: `#${p.theme.light}` }} />
                <div className="flex-1" style={{ background: `#${p.theme.bg}` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
