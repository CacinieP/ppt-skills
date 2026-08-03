"use client";

import type { FontPairId, StyleRecipe } from "@/lib/types";
import { FONT_PAIRS } from "@/lib/palettes";
import PalettePicker from "./PalettePicker";

interface Props {
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
  set: (patch: Partial<Props>) => void;
}

const STYLES: { id: StyleRecipe; label: string; desc: string }[] = [
  { id: "sharp", label: "Sharp", desc: "紧凑·数据密集" },
  { id: "soft", label: "Soft", desc: "均衡·通用商务" },
  { id: "rounded", label: "Rounded", desc: "宽松·产品营销" },
  { id: "pill", label: "Pill", desc: "通透·品牌发布" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mono-label mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-line bg-elev px-3 py-2 text-sm text-ink placeholder:text-ink-mute transition";

export default function ConfigPanel(props: Props) {
  const { set } = props;
  return (
    <div className="flex flex-col gap-5">
      <Field label="TOPIC / 主题">
        <textarea
          className={`${inputCls} min-h-24 resize-y`}
          value={props.topic}
          onChange={(e) => set({ topic: e.target.value })}
          placeholder="例如:AI 驱动的年度战略汇报"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="AUDIENCE / 受众">
          <input
            className={inputCls}
            value={props.audience}
            onChange={(e) => set({ audience: e.target.value })}
            placeholder="管理层 / 产品团队"
          />
        </Field>
        <Field label="TONE / 语气">
          <input
            className={inputCls}
            value={props.tone}
            onChange={(e) => set({ tone: e.target.value })}
            placeholder="专业、清晰、简洁"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="SLIDES / 页数">
          <input
            type="number"
            min={3}
            max={20}
            className={inputCls}
            value={props.slideCount}
            onChange={(e) => set({ slideCount: Number(e.target.value) })}
          />
        </Field>
        <Field label="LANGUAGE / 语言">
          <select
            className={inputCls}
            value={props.language}
            onChange={(e) => set({ language: e.target.value as "zh-CN" | "en-US" })}
          >
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
          </select>
        </Field>
        <Field label="FONTS / 字体">
          <select
            className={inputCls}
            value={props.fontPair}
            onChange={(e) => set({ fontPair: e.target.value as FontPairId })}
          >
            {FONT_PAIRS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.header} / {f.body}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <PalettePicker value={props.paletteId} onChange={(paletteId) => set({ paletteId })} />

      <Field label="STYLE RECIPE / 风格">
        <div className="grid grid-cols-4 gap-2">
          {STYLES.map((s) => {
            const active = props.styleRecipe === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => set({ styleRecipe: s.id })}
                className={`rounded-md border px-2 py-2 text-center transition ${
                  active
                    ? "border-gold bg-gold-soft text-gold"
                    : "border-line bg-elev text-ink-dim hover:border-line-strong hover:text-ink"
                }`}
              >
                <div className="text-sm font-medium">{s.label}</div>
                <div className="mt-0.5 text-[10px] text-ink-mute">{s.desc}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="PREFERENCES / 内容偏好">
        <div className="flex gap-2">
          {([
            ["includeCode", "代码片段"],
            ["includeChart", "图表建议"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => set({ [key]: !props[key] } as Partial<Props>)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                props[key]
                  ? "border-azure bg-blue-soft text-azure"
                  : "border-line bg-elev text-ink-dim hover:border-line-strong"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${props[key] ? "bg-azure" : "bg-ink-mute"}`}
              />
              {label}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}
