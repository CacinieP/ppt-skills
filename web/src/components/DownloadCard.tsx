"use client";

interface Props {
  fileName: string;
  blobUrl: string;
  sizeKb: number;
  onReset: () => void;
}

export default function DownloadCard({ fileName, blobUrl, sizeKb, onReset }: Props) {
  return (
    <div className="rounded-lg border border-gold/40 bg-gold-soft px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gold/40 bg-canvas">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gold">
            <path
              d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">{fileName}</div>
          <div className="mono-label mt-0.5">
            .pptx · {sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`}
          </div>
        </div>
        <a
          href={blobUrl}
          download={fileName}
          className="shrink-0 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-canvas transition hover:brightness-110"
        >
          下载
        </a>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mono-label mt-2.5 hover:text-gold"
      >
        ← 重新生成
      </button>
    </div>
  );
}
