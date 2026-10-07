import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Remote Jobs — verified remote jobs you can actually apply for",
  description: "Fully remote jobs from verified sources, checked for country eligibility and whether they are still open.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#12A594" };

const themeScript = `(function(){try{var t=localStorage.getItem('rj-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-[1400px] px-4 pb-28 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
