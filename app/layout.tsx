import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Providers } from "./providers";
import { SITE_NAME, SITE_URL } from "./lib/seo";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "Online courses",
  manifest: "/manifest.json",
  openGraph: { siteName: SITE_NAME, type: "website" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#1abc9c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} h-full`} style={{ colorScheme: "light", background: "#ffffff" }}>
      <body className="min-h-full flex flex-col bg-white text-[#555555]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
