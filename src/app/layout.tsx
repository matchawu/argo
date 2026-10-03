import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/ui/Toaster";

/*
 * 中文字體很大，只預載 latin；中文字會依需要分段載入
 */
const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  preload: false,
});

/*
 * 品牌字：接近 logo「ARGO MUSIC STUDIO」的偏窄粗體
 */
const barlow = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Argo",
    template: "%s | Argo",
  },
  description: "亞果音樂工作室簽到、課表與月結管理系統",
};

export const viewport: Viewport = {
  // 讓底部分頁列可以用 safe-area 避開 iPhone 的 Home 條
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3f1" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${notoSansTC.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
