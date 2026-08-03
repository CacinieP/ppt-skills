import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pptx-web — AI .pptx generator",
  description:
    "Turn a topic into a real .pptx. Server-side PptxGenJS rendering with a 5-page-type design system.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
