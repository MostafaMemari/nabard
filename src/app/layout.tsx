import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { ScrollbarOverlay } from "@/components/layout/scrollbar-overlay";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME, APP_SUBTITLE } from "@/lib/app";
import "./globals.css";

// Runs before first paint so the native page scrollbar never flashes and
// never takes layout space on fine-pointer devices (see ScrollbarOverlay).
const scrollbarScript = `try{if(matchMedia("(hover: hover) and (pointer: fine)").matches&&(CSS.supports("scrollbar-width","none")||CSS.supports("selector(::-webkit-scrollbar)")))document.documentElement.setAttribute("data-oscroll","")}catch(e){}`;

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_SUBTITLE,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static constant, never user input */}
        <script dangerouslySetInnerHTML={{ __html: scrollbarScript }} />
        {children}
        <ScrollbarOverlay />
        <Toaster />
      </body>
    </html>
  );
}
